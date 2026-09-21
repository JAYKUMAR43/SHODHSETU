from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.models import (
    User, UserRole, University, Department, FacultyProfile, DepartmentSource,
    Challenge, ChallengeStatus, ChallengeUniversityMatch, MatchStatus,
    ProjectTeam, Proposal, ProposalStatus, TrustScore, TrustOwnerType,
    ProjectMilestone, MilestoneStatus, IndustryReviewStatus, IndustryEngagement
)
from backend.app.schemas.schemas import (
    UniversityResponse, DepartmentResponse, DepartmentUpdate, MatchResponse,
    ProjectTeamCreate, ProjectTeamResponse, ProposalCreate, ProposalResponse,
    TrustScoreResponse, MilestoneCompleteRequest
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.trust_score_service import compute_trust_score
from backend.app.services.notification_service import create_notification

router = APIRouter(prefix="/university", tags=["University Portal"])

@router.get("/profile", response_model=UniversityResponse)
def get_university_profile(
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    uni = db.query(University).filter(University.id == current_user.organisation_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University profile not linked to this user.")
    return uni

@router.post("/profile/import")
def bootstrap_university_profile(
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    uni = db.query(University).filter(University.id == current_user.organisation_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found.")

    draft_departments = gemini_service.bootstrap_expertise_graph(uni.name)
    imported_count = 0
    
    for d in draft_departments:
        dept = db.query(Department).filter(
            Department.university_id == uni.id,
            Department.name == d["department_name"]
        ).first()

        if not dept:
            dept = Department(
                university_id=uni.id,
                name=d["department_name"],
                discipline_tags=d.get("discipline_tags", []),
                source=DepartmentSource(d.get("source", "shodhganga_import"))
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            imported_count += 1

        for f in d.get("faculty_profiles", []):
            existing_fac = db.query(FacultyProfile).filter(
                FacultyProfile.department_id == dept.id,
                FacultyProfile.name == f["name"]
            ).first()
            if not existing_fac:
                fac = FacultyProfile(
                    department_id=dept.id,
                    name=f["name"],
                    expertise_tags=f.get("expertise_tags", []),
                    public_profile_url=f.get("public_profile_url"),
                    verified=f.get("verified", False)
                )
                db.add(fac)
    
    uni.profile_completeness_score = min(uni.profile_completeness_score + 25.0, 95.0)
    db.commit()
    db.refresh(uni)

    return {
        "message": f"Successfully ingested research graph data from Shodhganga, Google Scholar, and AISHE.",
        "departments_processed": len(draft_departments),
        "profile_completeness_score": uni.profile_completeness_score
    }

@router.patch("/departments/{department_id}", response_model=DepartmentResponse)
def update_department_expertise(
    department_id: int,
    payload: DepartmentUpdate,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(
        Department.id == department_id,
        Department.university_id == current_user.organisation_id
    ).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found or unauthorized.")

    if payload.discipline_tags is not None:
        dept.discipline_tags = payload.discipline_tags
        dept.source = DepartmentSource.MANUAL_REVIEW

    if payload.faculty_profiles is not None:
        for fac_data in payload.faculty_profiles:
            fac = db.query(FacultyProfile).filter(
                FacultyProfile.department_id == dept.id,
                FacultyProfile.name == fac_data.name
            ).first()
            if fac:
                fac.expertise_tags = fac_data.expertise_tags
                fac.verified = True # University coordinator verified it!
            else:
                new_fac = FacultyProfile(
                    department_id=dept.id,
                    name=fac_data.name,
                    expertise_tags=fac_data.expertise_tags,
                    public_profile_url=fac_data.public_profile_url,
                    verified=True
                )
                db.add(new_fac)

    # Re-evaluate profile completeness
    uni = dept.university
    uni.profile_completeness_score = 100.0
    dept.last_updated = datetime.now(timezone.utc)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/challenges")
def get_matched_challenges(
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    matches = db.query(ChallengeUniversityMatch).filter(
        ChallengeUniversityMatch.university_id == current_user.organisation_id
    ).order_by(ChallengeUniversityMatch.match_score.desc()).all()

    # Also fetch all faculty members for this university
    uni = db.query(University).filter(University.id == current_user.organisation_id).first()
    faculty_list = []
    if uni:
        for dept in uni.departments:
            for fac in dept.faculty_profiles:
                faculty_list.append({
                    "id": fac.id,
                    "name": fac.name,
                    "department_name": dept.name,
                    "expertise_tags": fac.expertise_tags
                })

    results = []
    for m in matches:
        c = m.challenge
        # Check if a team exists
        team = db.query(ProjectTeam).filter(
            ProjectTeam.challenge_id == c.id,
            ProjectTeam.university_id == current_user.organisation_id
        ).first()

        proposal = None
        if team:
            proposal = db.query(Proposal).filter(Proposal.project_team_id == team.id).first()

        results.append({
            "match_id": m.id,
            "match_score": m.match_score,
            "match_reasons": m.match_reasons,
            "status": m.status.value,
            "team": {
                "id": team.id,
                "faculty_mentor_id": team.faculty_mentor_id,
                "faculty_mentor_name": team.faculty_mentor.name if team.faculty_mentor else None,
                "student_members": team.student_members or [],
                "formed_at": team.formed_at.isoformat() if team.formed_at else None
            } if team else None,
            "proposal": {
                "id": proposal.id,
                "title": proposal.title,
                "summary": proposal.summary,
                "status": proposal.status.value,
                "submitted_at": proposal.submitted_at.isoformat() if proposal.submitted_at else None,
                "milestones": [
                    {
                        "id": ms.id,
                        "title": ms.title,
                        "description": ms.description,
                        "status": ms.status.value,
                        "due_date": ms.due_date.isoformat() if ms.due_date else None,
                        "completed_at": ms.completed_at.isoformat() if ms.completed_at else None,
                        "evidence_url": ms.evidence_url,
                        "industry_review_status": ms.industry_review_status.value if ms.industry_review_status else "not_submitted",
                        "industry_feedback": ms.industry_feedback,
                        "reviewed_by_id": ms.reviewed_by_id,
                        "reviewed_by_name": ms.reviewed_by.name if ms.reviewed_by else None,
                        "reviewed_at": ms.reviewed_at.isoformat() if ms.reviewed_at else None
                    }
                    for ms in proposal.milestones
                ] if proposal.milestones else []
            } if proposal else None,
            "challenge": {
                "id": c.id,
                "title": c.title,
                "description": c.description,
                "category": c.category.value,
                "priority_score": c.priority_score,
                "tracking_id": c.tracking_id,
                "status": c.status.value,
                "district_name": c.district.name if c.district else "Jharkhand",
                "ai_generated_brief": c.ai_generated_brief,
                "photo_urls": c.photo_urls or [],
                "created_at": c.created_at.isoformat()
            }
        })
    return {"matches": results, "faculty_members": faculty_list}

@router.post("/matches/{match_id}/accept")
def accept_match(
    match_id: int,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    match = db.query(ChallengeUniversityMatch).filter(
        ChallengeUniversityMatch.id == match_id,
        ChallengeUniversityMatch.university_id == current_user.organisation_id
    ).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    match.status = MatchStatus.ACCEPTED
    if match.challenge and match.challenge.status in [ChallengeStatus.AI_PRESCREENED, ChallengeStatus.PENDING_VALIDATION, ChallengeStatus.VALIDATED, ChallengeStatus.ROUTED]:
        match.challenge.status = ChallengeStatus.IN_RESEARCH
    db.commit()
    db.refresh(match)
    return {"message": "Match accepted successfully.", "match_id": match.id, "status": match.status.value}

@router.post("/matches/{match_id}/decline")
def decline_match(
    match_id: int,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    match = db.query(ChallengeUniversityMatch).filter(
        ChallengeUniversityMatch.id == match_id,
        ChallengeUniversityMatch.university_id == current_user.organisation_id
    ).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found.")

    match.status = MatchStatus.DECLINED
    db.commit()
    db.refresh(match)
    return {"message": "Match declined.", "match_id": match.id, "status": match.status.value}

@router.post("/challenges/{challenge_id}/team", response_model=ProjectTeamResponse)
def form_challenge_team(
    challenge_id: int,
    payload: ProjectTeamCreate,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    existing_team = db.query(ProjectTeam).filter(
        ProjectTeam.challenge_id == challenge_id,
        ProjectTeam.university_id == current_user.organisation_id
    ).first()
    if existing_team:
        raise HTTPException(status_code=400, detail="A project team already exists for this challenge.")

    team = ProjectTeam(
        challenge_id=challenge_id,
        university_id=current_user.organisation_id,
        faculty_mentor_id=payload.faculty_mentor_id,
        student_members=payload.student_members
    )
    db.add(team)
    challenge.status = ChallengeStatus.IN_RESEARCH
    db.commit()
    db.refresh(team)

    if team.faculty_mentor:
        create_notification(
            recipient=f"faculty_{team.faculty_mentor.name}",
            event_type="TEAM_ASSIGNMENT",
            message=f"You have been assigned as Faculty Mentor for research team on challenge '{challenge.title}'.",
            db=db
        )
    if challenge and challenge.submitter_contact:
        create_notification(
            recipient=challenge.submitter_contact,
            event_type="TEAM_FORMED",
            message=f"An academic project team has begun research on your challenge '{challenge.title}'.",
            db=db
        )

    return team

@router.post("/challenges/{challenge_id}/accept", response_model=ProjectTeamResponse)
def accept_challenge_match(
    challenge_id: int,
    payload: ProjectTeamCreate,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    match = db.query(ChallengeUniversityMatch).filter(
        ChallengeUniversityMatch.challenge_id == challenge_id,
        ChallengeUniversityMatch.university_id == current_user.organisation_id
    ).first()

    if match:
        match.status = MatchStatus.ACCEPTED

    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if challenge:
        challenge.status = ChallengeStatus.IN_RESEARCH

    # Create Project Team
    team = ProjectTeam(
        challenge_id=challenge_id,
        university_id=current_user.organisation_id,
        faculty_mentor_id=payload.faculty_mentor_id,
        student_members=payload.student_members
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Notification Trigger (Fix 1 - Phase 5 Team/Proposal): Notify mentor and submitter
    if team.faculty_mentor:
        create_notification(
            recipient=f"faculty_{team.faculty_mentor.name}",
            event_type="TEAM_ASSIGNMENT",
            message=f"You have been assigned as Faculty Mentor for research team on challenge '{challenge.title}'.",
            db=db
        )
    if challenge and challenge.submitter_contact:
        create_notification(
            recipient=challenge.submitter_contact,
            event_type="TEAM_FORMED",
            message=f"An academic project team from {current_user.name} has begun research on your challenge '{challenge.title}'.",
            db=db
        )

    return team

@router.post("/teams/{team_id}/proposals", response_model=ProposalResponse)
def submit_proposal(
    team_id: int,
    payload: ProposalCreate,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    team = db.query(ProjectTeam).filter(
        ProjectTeam.id == team_id,
        ProjectTeam.university_id == current_user.organisation_id
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Project team not found or unauthorized.")

    proposal = Proposal(
        project_team_id=team.id,
        title=payload.title,
        summary=payload.summary,
        status=ProposalStatus.SUBMITTED
    )
    db.add(proposal)
    
    # Update Challenge Status
    if team.challenge:
        team.challenge.status = ChallengeStatus.PROPOSAL_SUBMITTED
        
    # Auto-initialize 2 standard milestones for this proposal
    m1 = ProjectMilestone(
        proposal_id=proposal.id,
        title="Phase 1: Research Methodology & Prototype Design",
        description="Detailed technical architecture design, bench testing, and simulation validation.",
        due_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=MilestoneStatus.IN_PROGRESS,
        industry_review_status=IndustryReviewStatus.NOT_SUBMITTED
    )
    m2 = ProjectMilestone(
        proposal_id=proposal.id,
        title="Phase 2: Field Prototyping & Pilot Testing",
        description="Community pilot deployment, field trials, and efficacy audit.",
        due_date=datetime.now(timezone.utc) + timedelta(days=60),
        status=MilestoneStatus.PENDING,
        industry_review_status=IndustryReviewStatus.NOT_SUBMITTED
    )
    db.add_all([m1, m2])
    db.commit()
    db.refresh(proposal)

    # Notification Trigger (Fix 1 - Phase 5 Proposal): Notify mentor and institutional submitter
    if team.faculty_mentor:
        create_notification(
            recipient=f"faculty_{team.faculty_mentor.name}",
            event_type="PROPOSAL_SUBMITTED",
            message=f"Proposal '{proposal.title}' has been submitted for CSR review.",
            db=db
        )
    if team.challenge and team.challenge.submitter_contact:
        create_notification(
            recipient=team.challenge.submitter_contact,
            event_type="PROPOSAL_SUBMITTED",
            message=f"Research proposal '{proposal.title}' has been submitted for your reported challenge '{team.challenge.title}'.",
            db=db
        )

    return proposal

@router.patch("/milestones/{milestone_id}/complete")
def complete_milestone(
    milestone_id: int,
    payload: MilestoneCompleteRequest,
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    milestone = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Project milestone not found.")

    proposal = milestone.proposal
    if not proposal or not proposal.project_team:
        raise HTTPException(status_code=400, detail="Milestone is not associated with a project team.")

    if proposal.project_team.university_id != current_user.organisation_id:
        raise HTTPException(status_code=403, detail="You do not have permission to complete milestones for this proposal.")

    if not payload.evidence_url or not payload.evidence_url.strip():
        raise HTTPException(status_code=400, detail="Evidence URL is required to complete milestone and submit for review.")

    milestone.status = MilestoneStatus.COMPLETED
    milestone.evidence_url = payload.evidence_url.strip()
    milestone.completed_at = datetime.now(timezone.utc)
    milestone.industry_review_status = IndustryReviewStatus.PENDING_REVIEW
    milestone.reviewed_by_id = None
    milestone.reviewed_at = None

    db.commit()
    db.refresh(milestone)

    # Notify all IndustryEngagements linked to this proposal
    for eng in proposal.engagements:
        ind_users = db.query(User).filter(
            User.organisation_id == eng.industry_partner_id,
            User.role == UserRole.INDUSTRY
        ).all()
        if ind_users:
            for u in ind_users:
                create_notification(
                    recipient=u,
                    event_type="MILESTONE_SUBMITTED_FOR_REVIEW",
                    message=f"Milestone '{milestone.title}' for proposal '{proposal.title}' has been submitted for review with evidence: {milestone.evidence_url}",
                    db=db
                )
        else:
            create_notification(
                recipient=f"industry_{eng.industry_partner_id}",
                event_type="MILESTONE_SUBMITTED_FOR_REVIEW",
                message=f"Milestone '{milestone.title}' for proposal '{proposal.title}' has been submitted for review with evidence: {milestone.evidence_url}",
                db=db
            )

    return {
        "id": milestone.id,
        "proposal_id": milestone.proposal_id,
        "title": milestone.title,
        "description": milestone.description,
        "status": milestone.status.value,
        "evidence_url": milestone.evidence_url,
        "industry_review_status": milestone.industry_review_status.value,
        "industry_feedback": milestone.industry_feedback,
        "completed_at": milestone.completed_at.isoformat() if milestone.completed_at else None
    }

@router.get("/trust-score", response_model=TrustScoreResponse)
def get_university_trust_score(
    current_user: User = Depends(require_roles(UserRole.UNIVERSITY)),
    db: Session = Depends(get_db)
):
    score = compute_trust_score(TrustOwnerType.UNIVERSITY, current_user.organisation_id, db)
    return score
