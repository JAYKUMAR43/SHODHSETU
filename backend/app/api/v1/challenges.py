import random
import string
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.models import (
    Challenge, ChallengeStatus, SubmitterType, ChallengeCategory,
    District, University, ChallengeUniversityMatch, MatchStatus, User, UserRole,
    TrustScore, TrustOwnerType, OutcomeRecord, VerificationStatus, CitizenConfirmationStatus
)
from backend.app.schemas.schemas import (
    ChallengeCreate, ChallengeResponse, ChallengeTrackResponse, DistrictResponse, CitizenInfoResponsePayload,
    ConfirmOutcomePayload, PostDeploymentIssueCreate
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.notification_service import create_notification
from backend.app.services.sms_service import send_sms
from backend.app.services.otp_service import verify_phone_token

router = APIRouter(tags=["Challenges & Public"])

def generate_tracking_id() -> str:
    num = random.randint(1000, 9999)
    return f"BP-{num}"

@router.get("/districts", response_model=List[DistrictResponse])
def get_districts(db: Session = Depends(get_db)):
    return db.query(District).all()

@router.post("/challenges", response_model=ChallengeResponse)
def submit_challenge(
    payload: ChallengeCreate,
    db: Session = Depends(get_db)
):
    # Basic Spam & Completeness Validation
    desc = payload.description.strip()
    if len(desc) < 15:
        raise HTTPException(
            status_code=400,
            detail="Submission rejected: Description is too brief. Please provide actionable details about the local community challenge."
        )

    # 0. Mandatory Phone Verification (OTP) for Individual Citizens
    contact_phone = (payload.submitter_contact or "").strip()
    if payload.submitter_type == SubmitterType.CITIZEN:
        if not contact_phone:
            raise HTTPException(
                status_code=400,
                detail="Mobile phone number is mandatory for citizen submissions."
            )
        if not payload.otp_verification_token:
            raise HTTPException(
                status_code=400,
                detail="Mobile phone number must be OTP-verified before submitting. Please verify your phone."
            )
        if not verify_phone_token(contact_phone, payload.otp_verification_token):
            raise HTTPException(
                status_code=400,
                detail="Invalid or expired OTP verification token for this phone number."
            )

    # 1. AI Classification if category omitted or confidence check
    cat = payload.category
    ai_conf = 0.85
    if not cat:
        classification = gemini_service.classify_challenge(desc)
        cat = ChallengeCategory(classification["category"])
        ai_conf = classification["confidence"]

    # 2. Check for Duplicates in same district / nearby
    existing_nearby = db.query(Challenge).filter(
        Challenge.district_id == payload.district_id,
        Challenge.category == cat
    ).all()
    
    nearby_data = [{"id": c.id, "description": c.description} for c in existing_nearby[:10]]
    dup_result = gemini_service.detect_duplicate(desc, nearby_data)

    duplicate_of_id = None
    duplicate_count = 0
    if dup_result.get("is_duplicate") and dup_result.get("matched_id"):
        duplicate_of_id = dup_result["matched_id"]
        # Increment parent challenge duplicate count
        parent = db.query(Challenge).filter(Challenge.id == duplicate_of_id).first()
        if parent:
            parent.duplicate_count += 1
            duplicate_count = parent.duplicate_count

    # 3. Generate structured problem brief
    brief = gemini_service.generate_problem_brief(desc, voice_note=payload.voice_note_url)

    # 4. Priority Score
    priority = gemini_service.score_priority({
        "category": cat.value,
        "submitter_type": payload.submitter_type.value,
        "duplicate_count": duplicate_count
    })

    # Generate unique tracking ID
    tracking_id = generate_tracking_id()
    while db.query(Challenge).filter(Challenge.tracking_id == tracking_id).first():
        tracking_id = generate_tracking_id()

    # 5. Determine initial status
    # Institutional accounts skip human validation -> validated immediately
    if payload.submitter_type in [SubmitterType.PRI, SubmitterType.ULB, SubmitterType.GOVT_DEPT]:
        initial_status = ChallengeStatus.VALIDATED
        validated_at = datetime.now(timezone.utc)
    else:
        initial_status = ChallengeStatus.AI_PRESCREENED
        validated_at = None

    challenge = Challenge(
        title=payload.title,
        description=desc,
        category=cat,
        ai_confidence_score=ai_conf,
        submitter_type=payload.submitter_type,
        submitter_contact=payload.submitter_contact,
        tracking_id=tracking_id,
        district_id=payload.district_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        photo_urls=payload.photo_urls,
        video_url=payload.video_url,
        voice_note_url=payload.voice_note_url,
        ai_generated_brief=brief,
        duplicate_of_id=duplicate_of_id,
        duplicate_count=duplicate_count,
        priority_score=priority,
        original_reporter_credit=payload.original_reporter_credit or "Anonymous Citizen Reporter",
        status=initial_status,
        validated_at=validated_at
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    # Trigger SMS Lifecycle Moment 1: Challenge Submission Confirmation
    if challenge.submitter_contact:
        try:
            track_url = f"https://bharatpanchyt.vercel.app/track/{challenge.tracking_id}"
            send_sms(
                challenge.submitter_contact,
                f"Your Bharat Panchyt report has been submitted. Tracking ID: {challenge.tracking_id}. Check status anytime at {track_url}"
            )
        except Exception:
            pass

    # If institutional validated immediately, trigger matching engine
    if challenge.status == ChallengeStatus.VALIDATED:
        _trigger_university_matching(challenge, db)

    return challenge

def _trigger_university_matching(challenge: Challenge, db: Session):
    universities = db.query(University).all()
    uni_data = []
    for u in universities:
        depts_data = []
        for d in u.departments:
            depts_data.append({
                "discipline_tags": d.discipline_tags,
                "source": d.source.value if hasattr(d.source, "value") else str(d.source),
                "faculty_profiles": [
                    {"name": f.name, "expertise_tags": f.expertise_tags, "verified": f.verified}
                    for f in d.faculty_profiles
                ]
            })
        trust_rec = db.query(TrustScore).filter(
            TrustScore.owner_type == TrustOwnerType.UNIVERSITY,
            TrustScore.owner_id == u.id
        ).first()
        uni_data.append({
            "id": u.id,
            "district_id": u.district_id,
            "departments": depts_data,
            "trust_score": trust_rec.computed_score if trust_rec else 85.0
        })

    matches = gemini_service.score_university_match({
        "title": challenge.title,
        "description": challenge.description,
        "category": challenge.category.value,
        "district_id": challenge.district_id
    }, uni_data)

    for m in matches:
        existing = db.query(ChallengeUniversityMatch).filter(
            ChallengeUniversityMatch.challenge_id == challenge.id,
            ChallengeUniversityMatch.university_id == m["university_id"]
        ).first()
        if not existing:
            match_rec = ChallengeUniversityMatch(
                challenge_id=challenge.id,
                university_id=m["university_id"],
                match_score=m["match_score"],
                match_reasons=m["match_reasons"],
                status=MatchStatus.SUGGESTED
            )
            db.add(match_rec)

            # Notification Trigger (Fix 1 - Phase 5 Matching): Notify university coordinator
            uni_users = db.query(User).filter(
                User.organisation_id == m["university_id"],
                User.role == UserRole.UNIVERSITY
            ).all()
            for u in uni_users:
                create_notification(
                    recipient=u,
                    event_type="NEW_MATCH",
                    message=f"New matched challenge in your inbox: '{challenge.title}' ({m['match_score']}% match score).",
                    db=db
                )
    db.commit()

@router.get("/challenges/track/{tracking_id}", response_model=ChallengeTrackResponse)
def track_challenge(tracking_id: str, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.tracking_id == tracking_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge tracking ID not found.")

    # Construct tracking timeline milestones
    timeline = [
        {"step": "Citizen Submission Received", "completed": True, "time": challenge.created_at.strftime("%Y-%m-%d %H:%M")},
        {"step": "AI Multimodal Pre-screening & Domain Indexing", "completed": challenge.status != ChallengeStatus.SUBMITTED, "time": "Completed"},
        {"step": "District Administration Field Validation", "completed": challenge.status not in [ChallengeStatus.SUBMITTED, ChallengeStatus.AI_PRESCREENED, ChallengeStatus.PENDING_VALIDATION, ChallengeStatus.REJECTED], "time": challenge.validated_at.strftime("%Y-%m-%d %H:%M") if challenge.validated_at else "Pending Officer Review"},
        {"step": "HEI Research Matching & Team Formation", "completed": challenge.status in [ChallengeStatus.ROUTED, ChallengeStatus.IN_RESEARCH, ChallengeStatus.PROPOSAL_SUBMITTED, ChallengeStatus.IN_EXECUTION, ChallengeStatus.DEPLOYED, ChallengeStatus.CLOSED], "time": "Active" if challenge.status == ChallengeStatus.IN_RESEARCH else "Pending"},
        {"step": "Industry / CSR Co-Funding & Field Deployment", "completed": challenge.status in [ChallengeStatus.IN_EXECUTION, ChallengeStatus.DEPLOYED, ChallengeStatus.CLOSED], "time": "Active" if challenge.status == ChallengeStatus.IN_EXECUTION else "Pending"}
    ]

    # Look for linked verified outcome (Enhancement 1)
    linked_outcome = None
    for team in challenge.teams:
        for prop in team.proposals:
            for out in prop.outcomes:
                if out.verification_status == VerificationStatus.VERIFIED:
                    linked_outcome = {
                        "id": out.id,
                        "outcome_type": out.outcome_type.value,
                        "claim_description": out.claim_description,
                        "verification_status": out.verification_status.value,
                        "citizen_confirmation_status": out.citizen_confirmation_status.value if hasattr(out.citizen_confirmation_status, "value") else str(out.citizen_confirmation_status),
                        "citizen_confirmation_comment": out.citizen_confirmation_comment,
                        "verified_at": out.verified_at.isoformat() if out.verified_at else None
                    }
                    break
            if linked_outcome:
                break
        if linked_outcome:
            break

    # Look for related prior outcome (Enhancement 4 backward link)
    related_outcome = None
    if challenge.related_outcome:
        rel = challenge.related_outcome
        p_title = rel.proposal.title if rel.proposal else "Deployed Innovation Solution"
        related_outcome = {
            "id": rel.id,
            "proposal_title": p_title,
            "outcome_type": rel.outcome_type.value,
            "claim_description": rel.claim_description,
            "verified_at": rel.verified_at.isoformat() if rel.verified_at else None
        }

    return ChallengeTrackResponse(
        tracking_id=challenge.tracking_id,
        title=challenge.title,
        description=challenge.description,
        category=challenge.category,
        status=challenge.status,
        created_at=challenge.created_at,
        original_reporter_credit=challenge.original_reporter_credit or "Anonymous Citizen Reporter",
        ai_generated_brief=challenge.ai_generated_brief,
        duplicate_count=challenge.duplicate_count,
        timeline=timeline,
        info_request_message=challenge.info_request_message,
        info_requested_at=challenge.info_requested_at,
        citizen_response_text=challenge.citizen_response_text,
        citizen_responded_at=challenge.citizen_responded_at,
        related_outcome_id=challenge.related_outcome_id,
        related_outcome=related_outcome,
        linked_outcome=linked_outcome
    )

@router.post("/challenges/track/{tracking_id}/respond-info")
def respond_challenge_info(
    tracking_id: str,
    payload: CitizenInfoResponsePayload,
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.tracking_id == tracking_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge tracking ID not found.")

    if challenge.status != ChallengeStatus.INFO_REQUESTED:
        raise HTTPException(status_code=400, detail="Challenge is not awaiting clarification.")

    challenge.citizen_response_text = payload.response_text
    if payload.photo_url:
        challenge.citizen_response_photo_url = payload.photo_url
        if payload.photo_url not in (challenge.photo_urls or []):
            challenge.photo_urls = (challenge.photo_urls or []) + [payload.photo_url]

    challenge.citizen_responded_at = datetime.now(timezone.utc)
    challenge.status = ChallengeStatus.PENDING_VALIDATION
    db.commit()
    db.refresh(challenge)

    # Notify officer
    recipient = challenge.validated_by_id if challenge.validated_by_id else f"dvo_district_{challenge.district_id}"
    create_notification(
        recipient=recipient,
        event_type="CITIZEN_CLARIFICATION_SUBMITTED",
        message=f"Citizen clarification received for Challenge '{challenge.title}' (ID: {challenge.tracking_id}). Re-entered queue for validation.",
        db=db
    )

    return {
        "message": "Clarification submitted successfully. Challenge re-entered district validation queue.",
        "tracking_id": challenge.tracking_id,
        "status": challenge.status.value
    }

# ----------------- CITIZEN OUTCOME CONFIRMATION LOOP (Enhancement 1) -----------------

@router.post("/challenges/track/{tracking_id}/confirm-outcome")
def confirm_challenge_outcome(
    tracking_id: str,
    payload: ConfirmOutcomePayload,
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.tracking_id == tracking_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge tracking ID not found.")

    target_outcome = None
    for team in challenge.teams:
        for prop in team.proposals:
            for out in prop.outcomes:
                if out.verification_status == VerificationStatus.VERIFIED:
                    target_outcome = out
                    break
            if target_outcome:
                break
        if target_outcome:
            break

    if not target_outcome:
        raise HTTPException(status_code=400, detail="No verified deployment outcome found linked to this challenge.")

    new_status = CitizenConfirmationStatus.CONFIRMED_WORKING if payload.confirmed else CitizenConfirmationStatus.DISPUTED
    target_outcome.citizen_confirmation_status = new_status
    target_outcome.citizen_confirmation_comment = payload.comment
    target_outcome.citizen_confirmed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(target_outcome)

    if not payload.confirmed:
        create_notification(
            recipient="government",
            event_type="OUTCOME_DISPUTED",
            message=f"Citizen Disputed Deployment: For Challenge '{challenge.title}' (ID: {challenge.tracking_id}), citizen marked solution as not working in community. Feedback: \"{payload.comment or 'No comment provided'}\". Flagged for re-review in Government queue.",
            db=db
        )

    return {
        "message": "Citizen confirmation recorded successfully.",
        "tracking_id": challenge.tracking_id,
        "outcome_id": target_outcome.id,
        "citizen_confirmation_status": target_outcome.citizen_confirmation_status.value
    }

# ----------------- POST-DEPLOYMENT ISSUE REPORTING (Enhancement 4) -----------------

@router.post("/outcomes/{outcome_id}/report-issue", response_model=ChallengeResponse)
def report_post_deployment_issue(
    outcome_id: int,
    payload: PostDeploymentIssueCreate,
    db: Session = Depends(get_db)
):
    outcome = db.query(OutcomeRecord).filter(OutcomeRecord.id == outcome_id).first()
    if not outcome:
        raise HTTPException(status_code=404, detail="Outcome record not found.")

    desc = payload.description.strip()
    if len(desc) < 15:
        raise HTTPException(
            status_code=400,
            detail="Submission rejected: Description is too brief. Please provide actionable details about the deployed solution failure."
        )

    orig_ch = None
    if outcome.proposal and outcome.proposal.project_team:
        orig_ch = outcome.proposal.project_team.challenge

    district_id = payload.district_id or (orig_ch.district_id if orig_ch else 1)
    category = orig_ch.category if orig_ch else ChallengeCategory.WATER_RESOURCES

    brief = gemini_service.generate_problem_brief(desc, voice_note=payload.voice_note_url)
    priority = gemini_service.score_priority({
        "category": category.value,
        "submitter_type": payload.submitter_type.value,
        "duplicate_count": 0
    })
    priority = min(100.0, priority + 10.0) # Elevated urgency for failure of deployed solution

    tracking_id = generate_tracking_id()
    while db.query(Challenge).filter(Challenge.tracking_id == tracking_id).first():
        tracking_id = generate_tracking_id()

    challenge = Challenge(
        title=payload.title,
        description=desc,
        category=category,
        ai_confidence_score=0.92,
        submitter_type=payload.submitter_type,
        submitter_contact=payload.submitter_contact,
        tracking_id=tracking_id,
        district_id=district_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        photo_urls=payload.photo_urls,
        video_url=payload.video_url,
        voice_note_url=payload.voice_note_url,
        ai_generated_brief=brief,
        duplicate_of_id=None,
        duplicate_count=0,
        priority_score=priority,
        original_reporter_credit=payload.original_reporter_credit or "Anonymous Citizen Reporter",
        status=ChallengeStatus.AI_PRESCREENED,
        related_outcome_id=outcome.id
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    create_notification(
        recipient=f"dvo_district_{district_id}",
        event_type="POST_DEPLOYMENT_ISSUE_REPORTED",
        message=f"Post-Deployment Issue Reported: Challenge '{challenge.title}' (Tracking ID: {challenge.tracking_id}) reported against deployed outcome #{outcome.id}. Routed to district validation queue.",
        db=db
    )

    return challenge

