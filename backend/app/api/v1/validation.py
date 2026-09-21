from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import require_roles
from backend.app.models.models import (
    Challenge, ChallengeStatus, User, UserRole, University, ChallengeUniversityMatch, MatchStatus,
    TrustScore, TrustOwnerType, ProjectTeam, Proposal, ProposalStatus
)
from backend.app.schemas.schemas import (
    ChallengeResponse, ChallengeValidationUpdate, RequestInfoPayload,
    RouteChallengePayload, UniversityRoutingShortlistItem
)
from backend.app.services.gemini_service import gemini_service
from backend.app.services.notification_service import create_notification
from backend.app.services.sms_service import send_sms

router = APIRouter(prefix="/validation", tags=["District Validation"])

@router.get("/queue")
@router.get("/challenges")
def get_validation_queue(
    district_id: Optional[int] = Query(None),
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    target_district_id = district_id or current_user.district_id
    query = db.query(Challenge).filter(
        Challenge.status.in_([
            ChallengeStatus.AI_PRESCREENED, 
            ChallengeStatus.PENDING_VALIDATION,
            ChallengeStatus.INFO_REQUESTED
        ])
    )
    if target_district_id:
        query = query.filter(Challenge.district_id == target_district_id)

    # Oldest-first
    challenges = query.order_by(Challenge.created_at.asc()).all()

    # Enrich with SLA metadata
    now = datetime.now(timezone.utc)
    results = []
    for c in challenges:
        created = c.created_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        total_age_hours = round((now - created).total_seconds() / 3600.0, 1)

        # Calculate time paused waiting for citizen info
        paused_hours = 0.0
        if c.info_requested_at:
            req_time = c.info_requested_at
            if req_time.tzinfo is None:
                req_time = req_time.replace(tzinfo=timezone.utc)
            if c.citizen_responded_at:
                resp_time = c.citizen_responded_at
                if resp_time.tzinfo is None:
                    resp_time = resp_time.replace(tzinfo=timezone.utc)
                paused_hours = max(0.0, (resp_time - req_time).total_seconds() / 3600.0)
            elif c.status == ChallengeStatus.INFO_REQUESTED:
                paused_hours = max(0.0, (now - req_time).total_seconds() / 3600.0)

        effective_age_hours = max(0.0, round(total_age_hours - paused_hours, 1))

        if c.status == ChallengeStatus.INFO_REQUESTED:
            sla_state = "paused"
        elif effective_age_hours > 48:
            sla_state = "escalated"
        elif effective_age_hours > 24:
            sla_state = "warning"
        else:
            sla_state = "on_track"

        c_dict = {
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category.value,
            "ai_confidence_score": c.ai_confidence_score,
            "submitter_type": c.submitter_type.value,
            "submitter_contact": c.submitter_contact,
            "tracking_id": c.tracking_id,
            "district_id": c.district_id,
            "district_name": c.district.name if c.district else "Jharkhand",
            "latitude": c.latitude,
            "longitude": c.longitude,
            "photo_urls": c.photo_urls,
            "video_url": c.video_url,
            "voice_note_url": c.voice_note_url,
            "ai_generated_brief": c.ai_generated_brief,
            "duplicate_count": c.duplicate_count,
            "priority_score": c.priority_score,
            "status": c.status.value,
            "created_at": c.created_at.isoformat(),
            "age_hours": effective_age_hours,
            "total_age_hours": total_age_hours,
            "sla_state": sla_state, # on_track, warning, escalated (>48h), paused
            "info_requested_at": c.info_requested_at.isoformat() if c.info_requested_at else None,
            "info_request_message": c.info_request_message,
            "citizen_response_text": c.citizen_response_text,
            "citizen_response_photo_url": c.citizen_response_photo_url,
            "citizen_responded_at": c.citizen_responded_at.isoformat() if c.citizen_responded_at else None
        }
        results.append(c_dict)

    return results

@router.post("/challenges/{challenge_id}/request-info")
def request_challenge_info(
    challenge_id: int,
    payload: RequestInfoPayload,
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    challenge.status = ChallengeStatus.INFO_REQUESTED
    challenge.info_requested_at = datetime.now(timezone.utc)
    challenge.info_request_message = payload.message
    challenge.validated_by_id = current_user.id
    db.commit()
    db.refresh(challenge)

    # Notify submitter
    recipient = challenge.submitter_contact if challenge.submitter_contact else "citizen"
    create_notification(
        recipient=recipient,
        event_type="INFO_REQUESTED",
        message=f"Clarification Requested by District STI Officer for Challenge '{challenge.title}' (ID: {challenge.tracking_id}): \"{payload.message}\". Please visit the status tracking page to respond.",
        db=db
    )

    return {
        "message": "Clarification request submitted to citizen. 48h SLA clock paused.",
        "challenge_id": challenge.id,
        "status": challenge.status.value,
        "info_request_message": challenge.info_request_message,
        "info_requested_at": challenge.info_requested_at.isoformat()
    }

@router.patch("/challenges/{challenge_id}", response_model=ChallengeResponse)
def update_challenge_validation(
    challenge_id: int,
    payload: ChallengeValidationUpdate,
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    if payload.status in [ChallengeStatus.VALIDATED, ChallengeStatus.AWAITING_ROUTING]:
        challenge.status = ChallengeStatus.AWAITING_ROUTING
        challenge.validated_at = datetime.now(timezone.utc)
        challenge.validated_by_id = current_user.id
        db.commit()
        db.refresh(challenge)

        # Notify submitter on approval
        if challenge.submitter_contact:
            create_notification(
                recipient=challenge.submitter_contact,
                event_type="CHALLENGE_VALIDATED",
                message=f"Your challenge '{challenge.title}' (ID: {challenge.tracking_id}) has been approved by District STI Administration and queued for academic research routing.",
                db=db
            )
            # Trigger SMS Lifecycle Moment 2: District Validation Officer Approval
            try:
                send_sms(
                    challenge.submitter_contact,
                    f"Your ShodhSetu report {challenge.tracking_id} has been approved and is being processed."
                )
            except Exception:
                pass

        # Trigger Cross-District Pattern Detection (Enhancement 2)
        try:
            from backend.app.api.v1.admin import scan_and_save_systemic_patterns
            scan_and_save_systemic_patterns(db)
        except Exception:
            pass

    elif payload.status == ChallengeStatus.REJECTED:
        challenge.status = ChallengeStatus.REJECTED
        db.commit()
        db.refresh(challenge)

        # Notify submitter on rejection with reason
        if challenge.submitter_contact:
            reason_str = f" Reason: {payload.rejection_reason}" if payload.rejection_reason else ""
            create_notification(
                recipient=challenge.submitter_contact,
                event_type="CHALLENGE_REJECTED",
                message=f"Your challenge '{challenge.title}' (ID: {challenge.tracking_id}) was reviewed by District STI Administration and not approved.{reason_str}",
                db=db
            )
            # Trigger SMS Lifecycle Moment 3: District Validation Officer Rejection
            try:
                track_url = f"https://shodhsetu.jharkhand.gov.in/track/{challenge.tracking_id}"
                reason = payload.rejection_reason or "Does not meet validation criteria"
                send_sms(
                    challenge.submitter_contact,
                    f"Your ShodhSetu report {challenge.tracking_id} was not approved. Reason: {reason}. See details: {track_url}"
                )
            except Exception:
                pass

    elif payload.status == ChallengeStatus.PENDING_VALIDATION:
        challenge.status = ChallengeStatus.PENDING_VALIDATION
        db.commit()
        db.refresh(challenge)

    return challenge

# ----------------- HYBRID ROUTING HELPERS & ENDPOINTS -----------------

def _get_active_project_count(uni_id: int, db: Session) -> int:
    """
    Counts live/active ProjectTeam records for a university where the linked proposal
    is not yet completed or closed.
    """
    teams = db.query(ProjectTeam).filter(ProjectTeam.university_id == uni_id).all()
    count = 0
    for t in teams:
        if t.challenge and t.challenge.status in [
            ChallengeStatus.IN_RESEARCH, ChallengeStatus.PROPOSAL_SUBMITTED, ChallengeStatus.IN_EXECUTION
        ]:
            count += 1
        elif t.proposals and any(
            p.status in [ProposalStatus.SUBMITTED, ProposalStatus.UNDER_INDUSTRY_REVIEW, ProposalStatus.ACCEPTED]
            for p in t.proposals
        ):
            count += 1
    return count

@router.get("/challenges/{challenge_id}/routing-shortlist", response_model=List[UniversityRoutingShortlistItem])
def get_routing_shortlist(
    challenge_id: int,
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Preview AI-ranked shortlist with each university's match score, matching rationale,
    and current active project workload. Pure query/preview — does NOT persist matches.
    """
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    universities = db.query(University).all()
    uni_data = []
    uni_map = {}
    for u in universities:
        uni_map[u.id] = u
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

    shortlist = []
    for idx, m in enumerate(matches[:5]): # Top 5 candidates
        u = uni_map.get(m["university_id"])
        if not u:
            continue
        workload = _get_active_project_count(u.id, db)
        dept_names = [d.name for d in u.departments]
        trust_rec = db.query(TrustScore).filter(
            TrustScore.owner_type == TrustOwnerType.UNIVERSITY,
            TrustScore.owner_id == u.id
        ).first()

        shortlist.append(UniversityRoutingShortlistItem(
            university_id=u.id,
            university_name=u.name,
            district_id=u.district_id,
            district_name=u.district.name if u.district else "Jharkhand",
            match_score=m["match_score"],
            match_reasons=m["match_reasons"],
            active_project_count=workload,
            trust_score=trust_rec.computed_score if trust_rec else 85.0,
            departments=dept_names,
            is_recommended=(idx == 0),
            is_verified_expertise=m.get("is_verified_expertise", False)
        ))

    return shortlist

@router.post("/challenges/{challenge_id}/route")
def route_challenge_to_university(
    challenge_id: int,
    payload: RouteChallengePayload,
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Officer-confirmed single routing decision.
    Creates a single ChallengeUniversityMatch record (status=accepted) for the chosen university
    and dispatches a notification to that university only.
    """
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    uni = db.query(University).filter(University.id == payload.university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="Selected University not found.")

    # Compute match score and reasons specifically for this university
    depts_data = []
    for d in uni.departments:
        depts_data.append({
            "discipline_tags": d.discipline_tags,
            "faculty_profiles": [
                {"name": f.name, "expertise_tags": f.expertise_tags, "verified": f.verified}
                for f in d.faculty_profiles
            ]
        })
    trust_rec = db.query(TrustScore).filter(
        TrustScore.owner_type == TrustOwnerType.UNIVERSITY,
        TrustScore.owner_id == uni.id
    ).first()
    uni_data = [{
        "id": uni.id,
        "district_id": uni.district_id,
        "departments": depts_data,
        "trust_score": trust_rec.computed_score if trust_rec else 85.0
    }]
    matches = gemini_service.score_university_match({
        "title": challenge.title,
        "description": challenge.description,
        "category": challenge.category.value,
        "district_id": challenge.district_id
    }, uni_data)

    match_score = matches[0]["match_score"] if matches else 85.0
    match_reasons = matches[0]["match_reasons"] if matches else {
        "primary_match": "District Officer Confirmed Routing Assignment",
        "factors": ["Officer manual confirmation"]
    }

    # Create or update single ChallengeUniversityMatch record
    existing = db.query(ChallengeUniversityMatch).filter(
        ChallengeUniversityMatch.challenge_id == challenge.id,
        ChallengeUniversityMatch.university_id == uni.id
    ).first()

    if existing:
        existing.status = MatchStatus.ACCEPTED
        existing.match_score = match_score
        existing.match_reasons = match_reasons
        match_rec = existing
    else:
        match_rec = ChallengeUniversityMatch(
            challenge_id=challenge.id,
            university_id=uni.id,
            match_score=match_score,
            match_reasons=match_reasons,
            status=MatchStatus.ACCEPTED
        )
        db.add(match_rec)

    # Remove any other draft/suggested matches for this challenge so only the confirmed university is routed
    other_matches = db.query(ChallengeUniversityMatch).filter(
        ChallengeUniversityMatch.challenge_id == challenge.id,
        ChallengeUniversityMatch.university_id != uni.id
    ).all()
    for om in other_matches:
        db.delete(om)

    challenge.status = ChallengeStatus.ROUTED
    db.commit()
    db.refresh(challenge)

    # Notify this university coordinator only
    uni_users = db.query(User).filter(
        User.organisation_id == uni.id,
        User.role == UserRole.UNIVERSITY
    ).all()
    for u in uni_users:
        create_notification(
            recipient=u,
            event_type="NEW_MATCH",
            message=f"New matched challenge routed to your institution: '{challenge.title}' ({match_score}% match score).",
            db=db
        )
        # Trigger SMS Lifecycle Moment 4: Routed to University Coordinator
        if u.phone:
            try:
                send_sms(
                    u.phone,
                    f"New matched challenge routed to your institution: {challenge.title} ({challenge.tracking_id}). Review in your ShodhSetu portal."
                )
            except Exception:
                pass

    return {
        "message": f"Challenge successfully routed to {uni.name}.",
        "challenge_id": challenge.id,
        "university_id": uni.id,
        "university_name": uni.name,
        "match_score": match_score,
        "status": challenge.status.value
    }

@router.get("/university-workload")
def get_university_workloads(
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Returns active live project counts for each university.
    """
    universities = db.query(University).all()
    return {
        u.id: _get_active_project_count(u.id, db)
        for u in universities
    }

@router.get("/awaiting-routing")
def get_awaiting_routing_challenges(
    district_id: Optional[int] = Query(None),
    current_user: User = Depends(require_roles(UserRole.VALIDATION_OFFICER, UserRole.GOVERNMENT)),
    db: Session = Depends(get_db)
):
    """
    Returns challenges that have been approved/validated but not yet routed to a university.
    """
    target_district_id = district_id or current_user.district_id
    query = db.query(Challenge).filter(
        Challenge.status.in_([ChallengeStatus.AWAITING_ROUTING, ChallengeStatus.VALIDATED])
    )
    if target_district_id:
        query = query.filter(Challenge.district_id == target_district_id)

    challenges = query.order_by(Challenge.validated_at.desc().nullslast()).all()
    results = []
    for c in challenges:
        # Check if already routed with an accepted match
        has_accepted = any(m.status == MatchStatus.ACCEPTED for m in c.matches)
        if has_accepted and c.status == ChallengeStatus.ROUTED:
            continue

        results.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category.value,
            "tracking_id": c.tracking_id,
            "district_id": c.district_id,
            "district_name": c.district.name if c.district else "Jharkhand",
            "priority_score": c.priority_score,
            "status": c.status.value,
            "validated_at": c.validated_at.isoformat() if c.validated_at else None,
            "validated_by_name": c.validated_by.name if c.validated_by else "District Nodal Officer",
            "ai_generated_brief": c.ai_generated_brief
        })
    return results
