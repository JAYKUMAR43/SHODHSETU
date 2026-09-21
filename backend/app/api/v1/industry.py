from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.models import (
    User, UserRole, IndustryPartner, Proposal, ProposalStatus,
    IndustryEngagement, EngagementType, IPAgreement, IPTemplate,
    TrustScore, TrustOwnerType, ChallengeStatus, ProjectMilestone,
    MilestoneStatus, IndustryReviewStatus
)
from backend.app.schemas.schemas import (
    ProposalResponse, IndustryEngagementCreate, IndustryEngagementResponse,
    IPAgreementCreate, IPAgreementResponse, TrustScoreResponse,
    MilestoneReviewRequest
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.pdf_service import generate_ip_agreement_pdf
from backend.app.services.trust_score_service import compute_trust_score
from backend.app.services.notification_service import create_notification

router = APIRouter(prefix="/industry", tags=["Industry & CSR Portal"])

@router.get("/csr-matches")
def get_csr_matches(
    current_user: User = Depends(require_roles(UserRole.INDUSTRY, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    partner = db.query(IndustryPartner).filter(IndustryPartner.id == current_user.organisation_id).first()
    if not partner:
        raise HTTPException(status_code=404, detail="Industry partner profile not linked.")

    focus_areas = partner.csr_focus_areas or []

    # Get all active proposals
    proposals = db.query(Proposal).filter(
        Proposal.status.in_([ProposalStatus.SUBMITTED, ProposalStatus.UNDER_INDUSTRY_REVIEW, ProposalStatus.ACCEPTED])
    ).all()

    proposal_dicts = []
    for p in proposals:
        team = p.project_team
        ch = team.challenge if team else None
        category = ch.category.value if ch else "general"
        faculty = team.faculty_mentor.name if team and team.faculty_mentor else "Not Assigned"
        students = team.student_members if team and team.student_members else []
        milestones = [
            {
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "status": m.status.value,
                "due_date": m.due_date.isoformat() if m.due_date else None,
                "completed_at": m.completed_at.isoformat() if m.completed_at else None,
                "evidence_url": m.evidence_url,
                "industry_review_status": m.industry_review_status.value if m.industry_review_status else "not_submitted",
                "industry_feedback": m.industry_feedback,
                "reviewed_by_id": m.reviewed_by_id,
                "reviewed_by_name": m.reviewed_by.name if m.reviewed_by else None,
                "reviewed_at": m.reviewed_at.isoformat() if m.reviewed_at else None
            }
            for m in p.milestones
        ]
        engagements = [
            {"id": e.id, "partner_id": e.industry_partner_id, "partner_name": e.industry_partner.name if e.industry_partner else "CSR Partner", "type": e.engagement_type.value, "amount": e.funding_amount}
            for e in p.engagements
        ]
        ip_docs = [
            {"id": ip.id, "template": ip.template.value, "url": ip.generated_document_url}
            for ip in p.ip_agreements
        ]

        proposal_dicts.append({
            "id": p.id,
            "title": p.title,
            "summary": p.summary,
            "category": category,
            "university_name": team.university.name if team and team.university else "Jharkhand University",
            "district_name": ch.district.name if ch and ch.district else "Jharkhand",
            "submitted_at": p.submitted_at.isoformat(),
            "status": p.status.value,
            "engagements_count": len(p.engagements),
            "faculty_mentor": faculty,
            "student_members": students,
            "milestones": milestones,
            "engagements": engagements,
            "ip_agreements": ip_docs,
            "challenge": {
                "id": ch.id if ch else None,
                "title": ch.title if ch else "",
                "description": ch.description if ch else "",
                "category": category,
                "priority_score": ch.priority_score if ch else 0.0,
                "tracking_id": ch.tracking_id if ch else "",
                "ai_generated_brief": ch.ai_generated_brief if ch else "",
                "photo_urls": ch.photo_urls if ch else [],
                "created_at": ch.created_at.isoformat() if ch else None,
                "submitter_credit": ch.original_reporter_credit if ch else "Citizen Reporter"
            } if ch else None
        })

    matches = gemini_service.match_csr_intent(focus_areas, proposal_dicts)

    results = []
    for m in matches:
        p_obj = next((item for item in proposal_dicts if item["id"] == m["proposal_id"]), None)
        if p_obj:
            results.append({
                **p_obj,
                "csr_alignment_score": m["score"],
                "alignment_reasons": m["reasons"]
            })

    # Also include proposals not scored if any
    for p_obj in proposal_dicts:
        if not any(r["id"] == p_obj["id"] for r in results):
            results.append({
                **p_obj,
                "csr_alignment_score": 75.0,
                "alignment_reasons": ["Relevant societal problem statement matching Jharkhand priority domains."]
            })

    return results

@router.post("/proposals/{proposal_id}/engage", response_model=IndustryEngagementResponse)
def engage_proposal(
    proposal_id: int,
    payload: IndustryEngagementCreate,
    current_user: User = Depends(require_roles(UserRole.INDUSTRY)),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found.")

    engagement = IndustryEngagement(
        proposal_id=proposal_id,
        industry_partner_id=current_user.organisation_id,
        engagement_type=payload.engagement_type,
        funding_amount=payload.funding_amount,
        notes=payload.notes
    )
    db.add(engagement)
    
    proposal.status = ProposalStatus.UNDER_INDUSTRY_REVIEW
    if proposal.project_team and proposal.project_team.challenge:
        proposal.project_team.challenge.status = ChallengeStatus.IN_EXECUTION

    db.commit()
    db.refresh(engagement)

    # Notification Trigger (Fix 1 - Phase 6 Engagement): Notify university coordinator
    if proposal.project_team:
        uni_users = db.query(User).filter(
            User.organisation_id == proposal.project_team.university_id,
            User.role == UserRole.UNIVERSITY
        ).all()
        partner = db.query(IndustryPartner).filter(IndustryPartner.id == current_user.organisation_id).first()
        partner_name = partner.name if partner else current_user.name
        for u in uni_users:
            create_notification(
                recipient=u,
                event_type="INDUSTRY_ENGAGEMENT",
                message=f"Industry partner '{partner_name}' has committed {payload.engagement_type.value} engagement on proposal '{proposal.title}'.",
                db=db
            )

    return engagement

@router.post("/proposals/{proposal_id}/ip-agreement", response_model=IPAgreementResponse)
def create_ip_agreement(
    proposal_id: int,
    payload: IPAgreementCreate,
    current_user: User = Depends(require_roles(UserRole.INDUSTRY)),
    db: Session = Depends(get_db)
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found.")

    uni_name = "Jharkhand State University"
    if proposal.project_team and proposal.project_team.university:
        uni_name = proposal.project_team.university.name

    partner = db.query(IndustryPartner).filter(IndustryPartner.id == current_user.organisation_id).first()
    partner_name = partner.name if partner else "Industry Partner"

    agreement = IPAgreement(
        proposal_id=proposal_id,
        template=payload.template,
        custom_override=payload.custom_override,
        custom_terms_document_url=payload.custom_terms_document_url
    )
    db.add(agreement)
    db.commit()
    db.refresh(agreement)

    # Generate official PDF document if not custom override
    pdf_url = None
    if not payload.custom_override:
        pdf_url = generate_ip_agreement_pdf(
            proposal_title=proposal.title,
            university_name=uni_name,
            industry_name=partner_name,
            template_type=payload.template.value,
            agreement_id=agreement.id
        )
        agreement.generated_document_url = pdf_url
        db.commit()
        db.refresh(agreement)

    # Notification Trigger (Fix 1 - Phase 6 IP Agreement): Notify university and industry partner
    doc_link = agreement.generated_document_url or payload.custom_terms_document_url or "/uploads/ip_agreements/"
    if proposal.project_team:
        uni_users = db.query(User).filter(
            User.organisation_id == proposal.project_team.university_id,
            User.role == UserRole.UNIVERSITY
        ).all()
        for u in uni_users:
            create_notification(
                recipient=u,
                event_type="IP_AGREEMENT_GENERATED",
                message=f"Official IP Agreement ({payload.template.value}) executed for proposal '{proposal.title}'. View: {doc_link}",
                db=db
            )
    create_notification(
        recipient=current_user,
        event_type="IP_AGREEMENT_GENERATED",
        message=f"Official IP Agreement ({payload.template.value}) executed for proposal '{proposal.title}'. View: {doc_link}",
        db=db
    )

    return agreement

@router.get("/trust-score", response_model=TrustScoreResponse)
def get_industry_trust_score(
    current_user: User = Depends(require_roles(UserRole.INDUSTRY)),
    db: Session = Depends(get_db)
):
    score = compute_trust_score(TrustOwnerType.INDUSTRY_PARTNER, current_user.organisation_id, db)
    return score

@router.patch("/milestones/{milestone_id}/review")
def review_milestone(
    milestone_id: int,
    payload: MilestoneReviewRequest,
    current_user: User = Depends(require_roles(UserRole.INDUSTRY, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    milestone = db.query(ProjectMilestone).filter(ProjectMilestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found.")

    proposal = milestone.proposal
    if not proposal:
        raise HTTPException(status_code=400, detail="Milestone is not associated with any proposal.")

    partner = db.query(IndustryPartner).filter(IndustryPartner.id == current_user.organisation_id).first()
    partner_name = partner.name if partner else current_user.name

    action = payload.action.lower().strip()
    if action == "approve":
        milestone.industry_review_status = IndustryReviewStatus.APPROVED
        milestone.status = MilestoneStatus.COMPLETED
        milestone.reviewed_by_id = current_user.id
        milestone.reviewed_at = datetime.now(timezone.utc)
        if payload.feedback:
            milestone.industry_feedback = payload.feedback.strip()

        # Notify university coordinator & faculty mentor
        if proposal.project_team:
            uni_users = db.query(User).filter(
                User.organisation_id == proposal.project_team.university_id,
                User.role == UserRole.UNIVERSITY
            ).all()
            for u in uni_users:
                create_notification(
                    recipient=u,
                    event_type="MILESTONE_APPROVED",
                    message=f"Milestone approved by {partner_name}",
                    db=db
                )
            if proposal.project_team.faculty_mentor:
                create_notification(
                    recipient=f"faculty_{proposal.project_team.faculty_mentor.name}",
                    event_type="MILESTONE_APPROVED",
                    message=f"Milestone approved by {partner_name}",
                    db=db
                )
    elif action == "request_revision":
        if not payload.feedback or not payload.feedback.strip():
            raise HTTPException(
                status_code=400,
                detail="Feedback is required when requesting milestone revision."
            )
        feedback_text = payload.feedback.strip()
        milestone.industry_review_status = IndustryReviewStatus.REVISION_REQUESTED
        milestone.status = MilestoneStatus.IN_PROGRESS
        milestone.industry_feedback = feedback_text
        milestone.reviewed_by_id = current_user.id
        milestone.reviewed_at = datetime.now(timezone.utc)

        # Notify university coordinator & faculty mentor with feedback text
        if proposal.project_team:
            uni_users = db.query(User).filter(
                User.organisation_id == proposal.project_team.university_id,
                User.role == UserRole.UNIVERSITY
            ).all()
            for u in uni_users:
                create_notification(
                    recipient=u,
                    event_type="MILESTONE_REVISION_REQUESTED",
                    message=f"Revision requested for milestone '{milestone.title}' by {partner_name}: {feedback_text}",
                    db=db
                )
            if proposal.project_team.faculty_mentor:
                create_notification(
                    recipient=f"faculty_{proposal.project_team.faculty_mentor.name}",
                    event_type="MILESTONE_REVISION_REQUESTED",
                    message=f"Revision requested for milestone '{milestone.title}' by {partner_name}: {feedback_text}",
                    db=db
                )
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid action. Allowed values are 'approve' or 'request_revision'."
        )

    db.commit()
    db.refresh(milestone)

    return {
        "id": milestone.id,
        "proposal_id": milestone.proposal_id,
        "title": milestone.title,
        "description": milestone.description,
        "status": milestone.status.value,
        "industry_review_status": milestone.industry_review_status.value,
        "industry_feedback": milestone.industry_feedback,
        "reviewed_by_id": milestone.reviewed_by_id,
        "reviewed_by_name": partner_name,
        "reviewed_at": milestone.reviewed_at.isoformat() if milestone.reviewed_at else None,
        "evidence_url": milestone.evidence_url
    }
