from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles, get_password_hash
from backend.app.models.models import (
    User, UserRole, Challenge, ChallengeStatus, University, IndustryPartner,
    IndustryEngagement, OutcomeRecord, VerificationStatus, District, TrustScore, TrustOwnerType, Proposal, DistrictBriefing,
    Department, DepartmentSource, FacultyProfile, RegistrationStatus,
    CitizenConfirmationStatus, SystemicPattern, SystemicPatternStatus, OutcomeType,
    ProjectMilestone, IndustryReviewStatus, SubmittedReport, PeriodType
)
from backend.app.schemas.schemas import (
    AnalyticsOverviewResponse, DistrictBriefingResponse,
    OnboardUniversityRequest, OnboardIndustryRequest, OnboardValidationOfficerRequest,
    SubmittedReportResponse
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.trust_score_service import compute_trust_score
from backend.app.services.notification_service import create_notification

router = APIRouter(prefix="/admin", tags=["Government & State Admin"])

@router.get("/analytics/overview")
def get_analytics_overview(
    district_id: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT, UserRole.VALIDATION_OFFICER)),
    db: Session = Depends(get_db)
):
    q_ch = db.query(Challenge)
    if district_id:
        q_ch = q_ch.filter(Challenge.district_id == district_id)
    if category:
        q_ch = q_ch.filter(Challenge.category == category)

    challenges = q_ch.all()
    total_submissions = len(challenges)

    validated_count = sum(1 for c in challenges if c.status in [
        ChallengeStatus.VALIDATED, ChallengeStatus.ROUTED, ChallengeStatus.IN_RESEARCH,
        ChallengeStatus.PROPOSAL_SUBMITTED, ChallengeStatus.IN_EXECUTION, ChallengeStatus.DEPLOYED, ChallengeStatus.CLOSED
    ])
    in_research_count = sum(1 for c in challenges if c.status in [ChallengeStatus.IN_RESEARCH, ChallengeStatus.PROPOSAL_SUBMITTED])
    in_execution_count = sum(1 for c in challenges if c.status == ChallengeStatus.IN_EXECUTION)
    deployed_count = sum(1 for c in challenges if c.status in [ChallengeStatus.DEPLOYED, ChallengeStatus.CLOSED])

    # Domain distribution
    domain_dist: Dict[str, int] = {}
    for c in challenges:
        cat_str = c.category.value
        domain_dist[cat_str] = domain_dist.get(cat_str, 0) + 1

    # District distribution
    dist_dist: Dict[str, int] = {}
    for c in challenges:
        d_name = c.district.name if c.district else "Jharkhand"
        dist_dist[d_name] = dist_dist.get(d_name, 0) + 1

    # Institutional participation
    unis = db.query(University).all()
    partners = db.query(IndustryPartner).all()
    engagements = db.query(IndustryEngagement).all()

    # Outcomes summary
    outcomes = db.query(OutcomeRecord).all()
    outcomes_summary = {
        "prototypes": sum(1 for o in outcomes if o.outcome_type.value == "prototype" and o.verification_status == VerificationStatus.VERIFIED),
        "pilot_deployments": sum(1 for o in outcomes if o.outcome_type.value == "pilot_deployment" and o.verification_status == VerificationStatus.VERIFIED),
        "full_deployments": sum(1 for o in outcomes if o.outcome_type.value == "full_deployment" and o.verification_status == VerificationStatus.VERIFIED),
        "patents": sum(1 for o in outcomes if o.outcome_type.value in ["patent_filed", "patent_granted"] and o.verification_status == VerificationStatus.VERIFIED),
        "startups": sum(1 for o in outcomes if o.outcome_type.value == "startup_created" and o.verification_status == VerificationStatus.VERIFIED),
        "pending_verification": sum(1 for o in outcomes if o.verification_status == VerificationStatus.PENDING)
    }

    return {
        "total_submissions": total_submissions,
        "validated_count": validated_count,
        "in_research_count": in_research_count,
        "in_execution_count": in_execution_count,
        "deployed_count": deployed_count,
        "domain_distribution": domain_dist,
        "district_distribution": dist_dist,
        "institutional_participation": {
            "total_registered_universities": len(unis),
            "total_industry_partners": len(partners),
            "active_project_teams": in_research_count + in_execution_count
        },
        "industry_engagement_count": len(engagements),
        "outcomes_summary": outcomes_summary
    }

@router.get("/universities")
def get_admin_universities(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    universities = db.query(University).all()
    results = []
    for u in universities:
        trust = db.query(TrustScore).filter(
            TrustScore.owner_type == TrustOwnerType.UNIVERSITY,
            TrustScore.owner_id == u.id
        ).first()
        results.append({
            "id": u.id,
            "name": u.name,
            "district_name": u.district.name if u.district else "Jharkhand",
            "registration_status": u.registration_status.value,
            "profile_completeness_score": u.profile_completeness_score,
            "department_count": len(u.departments),
            "trust_score": trust.computed_score if trust else 85.0
        })
    return results

@router.get("/industry-partners")
def get_admin_industry_partners(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    partners = db.query(IndustryPartner).all()
    results = []
    for p in partners:
        trust = db.query(TrustScore).filter(
            TrustScore.owner_type == TrustOwnerType.INDUSTRY_PARTNER,
            TrustScore.owner_id == p.id
        ).first()
        results.append({
            "id": p.id,
            "name": p.name,
            "partner_type": p.partner_type.value,
            "csr_focus_areas": p.csr_focus_areas,
            "district_name": p.district.name if p.district else "Jharkhand",
            "engagement_count": len(p.engagements),
            "trust_score": trust.computed_score if trust else 88.0
        })
    return results

@router.get("/outcomes/pending-verification")
def get_pending_outcomes(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    pending = db.query(OutcomeRecord).filter(
        OutcomeRecord.verification_status == VerificationStatus.PENDING
    ).order_by(OutcomeRecord.created_at.asc()).all()

    results = []
    for o in pending:
        p = o.proposal
        team = p.project_team if p else None
        ch = team.challenge if team else None
        uni = team.university if team else None

        results.append({
            "id": o.id,
            "proposal_id": o.proposal_id,
            "outcome_type": o.outcome_type.value,
            "claim_description": o.claim_description,
            "supporting_document_url": o.supporting_document_url,
            "proposal_title": p.title if p else "Solution Proposal",
            "challenge_title": ch.title if ch else "Challenge",
            "university_name": uni.name if uni else "University",
            "created_at": o.created_at.isoformat()
        })
    return results

@router.patch("/outcomes/{outcome_id}/verify")
def verify_outcome(
    outcome_id: int,
    action: str = Query(..., pattern="^(approve|reject)$"),
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    record = db.query(OutcomeRecord).filter(OutcomeRecord.id == outcome_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Outcome record not found.")

    if action == "approve":
        # Verification requires all proposal milestones to have industry_review_status == approved
        if record.proposal:
            milestones = record.proposal.milestones or []
            if not milestones:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot verify outcome: Proposal has no milestones defined and approved by industry partner."
                )
            unapproved = [m for m in milestones if m.industry_review_status != IndustryReviewStatus.APPROVED]
            if unapproved:
                unapproved_desc = [f"'{m.title}' ({m.industry_review_status.value if hasattr(m.industry_review_status, 'value') else m.industry_review_status})" for m in unapproved]
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot verify outcome: All proposal milestones must have industry_review_status=approved by the industry partner. Unapproved milestones: {', '.join(unapproved_desc)}"
                )

        record.verification_status = VerificationStatus.VERIFIED
        record.verified_by_id = current_user.id
        record.verified_at = datetime.now(timezone.utc)
        record.is_public = True

        # Citizen Confirmation Loop (Enhancement 1)
        if record.outcome_type in [OutcomeType.PILOT_DEPLOYMENT, OutcomeType.FULL_DEPLOYMENT]:
            record.citizen_confirmation_status = CitizenConfirmationStatus.PENDING
            orig_challenge = None
            if record.proposal and record.proposal.project_team:
                orig_challenge = record.proposal.project_team.challenge
            if orig_challenge:
                recipient = orig_challenge.submitter_contact if orig_challenge.submitter_contact else "citizen"
                create_notification(
                    recipient=recipient,
                    event_type="OUTCOME_CONFIRMATION_REQUESTED",
                    message=f"Deployment Confirmation Requested: A solution for your reported challenge '{orig_challenge.title}' (ID: {orig_challenge.tracking_id}) has been deployed and verified. Is the solution working in your community? Please verify at /track/{orig_challenge.tracking_id}.",
                    db=db
                )

        # Re-compute trust score for the associated university
        if record.proposal and record.proposal.project_team:
            compute_trust_score(TrustOwnerType.UNIVERSITY, record.proposal.project_team.university_id, db)
    else:
        record.verification_status = VerificationStatus.REJECTED

    db.commit()
    db.refresh(record)

    # Notification Trigger (Fix 1 - Phase 7 Outcome Verification): Notify submitting university either way!
    if record.proposal and record.proposal.project_team:
        uni_users = db.query(User).filter(
            User.organisation_id == record.proposal.project_team.university_id,
            User.role == UserRole.UNIVERSITY
        ).all()
        status_label = "VERIFIED and published to the Public Innovation Registry" if action == "approve" else "REJECTED by State STI Administration"
        for u in uni_users:
            create_notification(
                recipient=u,
                event_type="OUTCOME_VERIFICATION_RESULT",
                message=f"Independent Outcome Verification: Claim '{record.outcome_type.value}' for proposal '{record.proposal.title}' was {status_label}.",
                db=db
            )

    return {
        "id": record.id,
        "verification_status": record.verification_status.value,
        "verified_at": record.verified_at.isoformat() if record.verified_at else None,
        "citizen_confirmation_status": record.citizen_confirmation_status.value if hasattr(record.citizen_confirmation_status, "value") else str(record.citizen_confirmation_status)
    }

# ----------------- CROSS-DISTRICT PATTERN DETECTION (Enhancement 2) -----------------

def scan_and_save_systemic_patterns(db: Session) -> List[SystemicPattern]:
    active_challenges = db.query(Challenge).filter(
        Challenge.status != ChallengeStatus.REJECTED
    ).all()

    ch_data = []
    for c in active_challenges:
        ch_data.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "district_id": c.district_id,
            "district_name": c.district.name if c.district else f"District {c.district_id}"
        })

    detected = gemini_service.detect_systemic_patterns(ch_data)
    saved_patterns = []

    for item in detected:
        ch_ids_set = set(item["challenge_ids"])
        existing = db.query(SystemicPattern).filter(
            SystemicPattern.category == item["category"]
        ).all()

        found = None
        for p in existing:
            if set(p.linked_challenge_ids or []) == ch_ids_set:
                found = p
                break

        if found:
            found.district_count = item["district_count"]
            found.severity = item["severity"]
            saved_patterns.append(found)
        else:
            new_pattern = SystemicPattern(
                pattern_theme=item["pattern_theme"],
                category=item["category"],
                district_count=item["district_count"],
                linked_challenge_ids=item["challenge_ids"],
                severity=item["severity"],
                status=SystemicPatternStatus.ACTIVE
            )
            db.add(new_pattern)
            saved_patterns.append(new_pattern)

    db.commit()
    for p in saved_patterns:
        db.refresh(p)
    return saved_patterns

@router.get("/patterns")
def get_systemic_patterns(
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    patterns = db.query(SystemicPattern).order_by(SystemicPattern.detected_at.desc()).all()
    if not patterns:
        patterns = scan_and_save_systemic_patterns(db)

    if status:
        patterns = [p for p in patterns if p.status.value == status]

    results = []
    for p in patterns:
        linked_chs = []
        if p.linked_challenge_ids:
            chs = db.query(Challenge).filter(Challenge.id.in_(p.linked_challenge_ids)).all()
            for ch in chs:
                linked_chs.append({
                    "id": ch.id,
                    "title": ch.title,
                    "tracking_id": ch.tracking_id,
                    "district_id": ch.district_id,
                    "district_name": ch.district.name if ch.district else "Jharkhand"
                })

        results.append({
            "id": p.id,
            "pattern_theme": p.pattern_theme,
            "category": p.category.value if hasattr(p.category, "value") else str(p.category),
            "district_count": p.district_count,
            "linked_challenge_ids": p.linked_challenge_ids or [],
            "linked_challenges": linked_chs,
            "severity": p.severity,
            "detected_at": p.detected_at.isoformat(),
            "status": p.status.value if hasattr(p.status, "value") else str(p.status)
        })
    return results

@router.patch("/patterns/{pattern_id}/acknowledge")
def acknowledge_pattern(
    pattern_id: int,
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    p = db.query(SystemicPattern).filter(SystemicPattern.id == pattern_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Systemic pattern not found.")
    p.status = SystemicPatternStatus.ACKNOWLEDGED
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "status": p.status.value,
        "message": f"Pattern '{p.pattern_theme}' marked as acknowledged."
    }

@router.post("/patterns/scan")
def trigger_pattern_scan(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    patterns = scan_and_save_systemic_patterns(db)
    return {
        "message": f"Cross-district pattern scan complete. Found {len(patterns)} patterns.",
        "pattern_count": len(patterns)
    }

@router.get("/escalations")
def get_escalations(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # Challenges sitting in ai_prescreened
    challenges = db.query(Challenge).filter(
        Challenge.status.in_([ChallengeStatus.AI_PRESCREENED, ChallengeStatus.PENDING_VALIDATION])
    ).all()

    escalated = []
    for c in challenges:
        created = c.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        age_hours = round((now - created).total_seconds() / 3600.0, 1)

        # Flagged if older than 48 hours
        if age_hours > 48.0:
            escalated.append({
                "id": c.id,
                "title": c.title,
                "tracking_id": c.tracking_id,
                "district_id": c.district_id,
                "district_name": c.district.name if c.district else "Jharkhand",
                "category": c.category.value,
                "priority_score": c.priority_score,
                "created_at": c.created_at.isoformat(),
                "age_hours": age_hours,
                "sla_breach_hours": round(age_hours - 48.0, 1)
            })

            # Notification Trigger (Fix 1 - Phase 3 Escalation): Notify state admin queue
            create_notification(
                recipient=current_user.id,
                event_type="SLA_BREACH_ESCALATION",
                message=f"SLA Breach Escalation: Challenge '{c.title}' (ID: {c.tracking_id}) has exceeded the 48-hour validation threshold by {round(age_hours - 48.0, 1)}h.",
                db=db
            )

    escalated.sort(key=lambda x: x["age_hours"], reverse=True)
    return escalated

@router.get("/analytics/briefing", response_model=DistrictBriefingResponse)
@router.get("/briefing", response_model=DistrictBriefingResponse)
def get_state_briefing(
    district_id: Optional[int] = Query(None),
    force_refresh: bool = Query(False),
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT, UserRole.VALIDATION_OFFICER)),
    db: Session = Depends(get_db)
):
    """
    Fix 2: Wired generate_district_briefing into government dashboard with 24-hour database caching.
    """
    from datetime import timedelta
    district_name = "Jharkhand State (All Districts)"
    if district_id:
        d = db.query(District).filter(District.id == district_id).first()
        if d:
            district_name = d.name

    now = datetime.now(timezone.utc)
    twenty_four_hours_ago = now - timedelta(hours=24)

    # Check 24-hour cache in DistrictBriefing table
    cached = db.query(DistrictBriefing).filter(
        DistrictBriefing.district_id == district_id,
        DistrictBriefing.generated_at >= twenty_four_hours_ago
    ).order_by(DistrictBriefing.generated_at.desc()).first()

    if cached and not force_refresh:
        return DistrictBriefingResponse(
            district_id=district_id,
            district_name=district_name,
            summary_text=cached.summary_text,
            briefing_text=cached.summary_text,
            generated_at=cached.generated_at,
            is_cached=True
        )

    # Cache miss or stale: generate fresh synthesis
    q = db.query(Challenge)
    if district_id:
        q = q.filter(Challenge.district_id == district_id)
    challenges = q.all()

    stats = {
        "district_name": district_name,
        "total_submissions": len(challenges),
        "top_category": "Water Resources & Rural Livelihoods",
        "pending_validation": sum(1 for c in challenges if c.status == ChallengeStatus.AI_PRESCREENED),
        "in_execution": sum(1 for c in challenges if c.status == ChallengeStatus.IN_EXECUTION)
    }

    briefing_text = gemini_service.generate_district_briefing(stats)
    new_briefing = DistrictBriefing(
        district_id=district_id,
        summary_text=briefing_text,
        generated_at=now
    )
    db.add(new_briefing)
    db.commit()
    db.refresh(new_briefing)

    return DistrictBriefingResponse(
        district_id=district_id,
        district_name=district_name,
        summary_text=briefing_text,
        briefing_text=briefing_text,
        generated_at=now,
        is_cached=False
    )

@router.get("/directory")
def get_institutional_directory(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Returns full directory of registered Universities, Industry Partners, and Validation Officers.
    """
    universities = db.query(University).all()
    uni_list = []
    for u in universities:
        coord = db.query(User).filter(
            User.organisation_id == u.id,
            User.role == UserRole.UNIVERSITY
        ).first()
        trust = db.query(TrustScore).filter(
            TrustScore.owner_type == TrustOwnerType.UNIVERSITY,
            TrustScore.owner_id == u.id
        ).first()
        uni_list.append({
            "id": u.id,
            "name": u.name,
            "district_id": u.district_id,
            "district_name": u.district.name if u.district else "Jharkhand",
            "coordinator_name": coord.name if coord else "Coordinator",
            "coordinator_email": coord.email if coord else "Unassigned",
            "department_count": len(u.departments),
            "trust_score": trust.computed_score if trust else 85.0,
            "registration_status": u.registration_status.value
        })

    industry_partners = db.query(IndustryPartner).all()
    ind_list = []
    for ip in industry_partners:
        contact = db.query(User).filter(
            User.organisation_id == ip.id,
            User.role == UserRole.INDUSTRY
        ).first()
        trust = db.query(TrustScore).filter(
            TrustScore.owner_type == TrustOwnerType.INDUSTRY_PARTNER,
            TrustScore.owner_id == ip.id
        ).first()
        ind_list.append({
            "id": ip.id,
            "name": ip.name,
            "partner_type": ip.partner_type.value,
            "csr_focus_areas": ip.csr_focus_areas or [],
            "district_name": ip.district.name if ip.district else "Jharkhand",
            "contact_name": contact.name if contact else "Contact Person",
            "contact_email": contact.email if contact else "Unassigned",
            "engagement_count": len(ip.engagements),
            "trust_score": trust.computed_score if trust else 88.0
        })

    officers = db.query(User).filter(User.role == UserRole.VALIDATION_OFFICER).all()
    officer_list = []
    for off in officers:
        d = db.query(District).filter(District.id == off.district_id).first() if off.district_id else None
        officer_list.append({
            "id": off.id,
            "name": off.name,
            "email": off.email,
            "district_id": off.district_id,
            "district_name": d.name if d else "Statewide / Unassigned",
            "created_at": off.created_at.isoformat() if off.created_at else None
        })

    districts = db.query(District).all()
    district_list = [{"id": d.id, "name": d.name, "state": d.state} for d in districts]

    return {
        "universities": uni_list,
        "industry_partners": ind_list,
        "validation_officers": officer_list,
        "districts": district_list
    }

@router.post("/onboard/university")
def onboard_university(
    payload: OnboardUniversityRequest,
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Onboard a new University, bootstrap expertise graph via Shodhganga mock import, and create coordinator account.
    """
    existing_user = db.query(User).filter(User.email == payload.coordinator_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    # 1. Create University record
    uni = University(
        name=payload.university_name,
        district_id=payload.district_id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=85.0
    )
    db.add(uni)
    db.commit()
    db.refresh(uni)

    # 2. Bootstrap departments from Shodhganga mock
    default_depts = [
        {
            "name": "Environmental Sciences & Water Resource Engineering",
            "tags": ["Hydrology", "Effluent Treatment", "Heavy Metal Bioremediation", "Groundwater Quality"],
            "faculty": [("Dr. A. K. Verma", ["Water Purification", "Soil Bioremediation"])]
        },
        {
            "name": "Computer Science & Artificial Intelligence",
            "tags": ["Machine Learning", "IoT Sensors", "Data Analytics", "Mobile Applications"],
            "faculty": [("Dr. S. K. Gupta", ["Deep Learning", "IoT Embedded Systems"])]
        },
        {
            "name": "Rural Technology & Agricultural Engineering",
            "tags": ["Precision Agriculture", "Crop Processing", "Solar Food Dehydration", "Lac Culture"],
            "faculty": [("Dr. P. Kumari", ["Agri-Tech", "Food Processing", "Rural Mechanization"])]
        }
    ]

    for d_data in default_depts:
        dept = Department(
            university_id=uni.id,
            name=d_data["name"],
            discipline_tags=d_data["tags"],
            source=DepartmentSource.SHODHGANGA_IMPORT
        )
        db.add(dept)
        db.commit()
        db.refresh(dept)

        for fac_name, tags in d_data["faculty"]:
            fac = FacultyProfile(
                department_id=dept.id,
                name=fac_name,
                expertise_tags=tags,
                verified=True
            )
            db.add(fac)

    # 3. Create Coordinator User
    temp_password = "Pass@1234"
    user = User(
        email=payload.coordinator_email,
        name=payload.coordinator_name,
        hashed_password=get_password_hash(temp_password),
        role=UserRole.UNIVERSITY,
        organisation_id=uni.id,
        district_id=payload.district_id
    )
    db.add(user)

    # 4. Create Initial Trust Score
    trust = TrustScore(
        owner_type=TrustOwnerType.UNIVERSITY,
        owner_id=uni.id,
        computed_score=85.0,
        factor_breakdown={"peer_review": 85.0, "track_record": 85.0, "accreditation": 85.0}
    )
    db.add(trust)

    db.commit()
    db.refresh(user)

    return {
        "message": f"University '{uni.name}' successfully onboarded with Shodhganga expertise graph bootstrap.",
        "university_id": uni.id,
        "university_name": uni.name,
        "coordinator_email": user.email,
        "coordinator_name": user.name,
        "temporary_password": temp_password
    }

@router.post("/onboard/industry")
def onboard_industry(
    payload: OnboardIndustryRequest,
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Onboard a new Industry / CSR Partner with primary contact account.
    """
    existing_user = db.query(User).filter(User.email == payload.contact_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    partner = IndustryPartner(
        name=payload.partner_name,
        partner_type=payload.partner_type,
        csr_focus_areas=payload.csr_focus_areas,
        district_id=payload.district_id
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)

    temp_password = "Pass@1234"
    user = User(
        email=payload.contact_email,
        name=payload.contact_name,
        hashed_password=get_password_hash(temp_password),
        role=UserRole.INDUSTRY,
        organisation_id=partner.id,
        district_id=payload.district_id
    )
    db.add(user)

    trust = TrustScore(
        owner_type=TrustOwnerType.INDUSTRY_PARTNER,
        owner_id=partner.id,
        computed_score=88.0,
        factor_breakdown={"csr_compliance": 90.0, "fund_disbursement": 88.0, "governance": 86.0}
    )
    db.add(trust)

    db.commit()
    db.refresh(user)

    return {
        "message": f"Industry Partner '{partner.name}' successfully onboarded.",
        "partner_id": partner.id,
        "partner_name": partner.name,
        "contact_email": user.email,
        "contact_name": user.name,
        "temporary_password": temp_password
    }

@router.post("/onboard/validation-officer")
def onboard_validation_officer(
    payload: OnboardValidationOfficerRequest,
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Onboard a new District STI Validation Officer.
    """
    existing_user = db.query(User).filter(User.email == payload.officer_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="A user with this email address already exists.")

    temp_password = "Pass@1234"
    user = User(
        email=payload.officer_email,
        name=payload.officer_name,
        hashed_password=get_password_hash(temp_password),
        role=UserRole.VALIDATION_OFFICER,
        district_id=payload.district_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    district = db.query(District).filter(District.id == payload.district_id).first()
    district_name = district.name if district else "Jharkhand"

    return {
        "message": f"District Validation Officer '{user.name}' successfully onboarded for {district_name}.",
        "officer_id": user.id,
        "officer_name": user.name,
        "officer_email": user.email,
        "district_id": user.district_id,
        "district_name": district_name,
        "temporary_password": temp_password
    }

@router.get("/reports", response_model=List[SubmittedReportResponse])
def get_submitted_reports(
    role: Optional[str] = Query(None),
    period_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    entity_name: Optional[str] = Query(None),
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Step 5: Centralized submitted reports view for State Government Directorate.
    Sorted newest-first, filterable by role, period_type, entity_name, and search keyword.
    """
    query = db.query(SubmittedReport)

    if role:
        clean_role = role.lower().strip()
        try:
            role_enum = UserRole(clean_role)
            query = query.filter(SubmittedReport.generated_by_role == role_enum)
        except Exception:
            pass

    if period_type:
        clean_period = period_type.lower().strip()
        try:
            period_enum = PeriodType(clean_period)
            query = query.filter(SubmittedReport.period_type == period_enum)
        except Exception:
            pass

    if entity_name:
        clean_entity = f"%{entity_name.strip()}%"
        query = query.filter(SubmittedReport.generated_by_name.ilike(clean_entity))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(SubmittedReport.generated_by_name.ilike(search_term))

    reports = query.order_by(SubmittedReport.generated_at.desc()).all()
    return reports


