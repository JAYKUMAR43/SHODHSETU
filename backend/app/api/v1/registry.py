from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.models import OutcomeRecord, VerificationStatus, Proposal, ProjectTeam, Challenge, University
from backend.app.schemas.schemas import OutcomeRecordResponse

router = APIRouter(prefix="/registry", tags=["Public Innovation Registry"])

@router.get("/outcomes")
def get_public_outcomes(
    district_id: Optional[int] = Query(None),
    sector: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Only verified, public records with valid verified_at timestamp
    query = db.query(OutcomeRecord).filter(
        OutcomeRecord.verification_status == VerificationStatus.VERIFIED,
        OutcomeRecord.is_public == True,
        OutcomeRecord.verified_at != None
    )

    outcomes = query.order_by(OutcomeRecord.verified_at.desc()).all()

    results = []
    for o in outcomes:
        p = o.proposal
        team = p.project_team if p else None
        ch = team.challenge if team else None
        uni = team.university if team else None

        # Filter checks
        if district_id and (not ch or ch.district_id != district_id):
            continue
        if sector and (not ch or ch.category.value != sector):
            continue

        results.append({
            "id": o.id,
            "outcome_type": o.outcome_type.value,
            "claim_description": o.claim_description,
            "supporting_document_url": o.supporting_document_url,
            "verification_status": o.verification_status.value,
            "citizen_confirmation_status": o.citizen_confirmation_status.value if hasattr(o.citizen_confirmation_status, "value") else str(o.citizen_confirmation_status),
            "verified_at": o.verified_at.isoformat() if o.verified_at else None,
            "proposal_title": p.title if p else "Community Research Solution",
            "challenge_title": ch.title if ch else "Grassroots Problem",
            "category": ch.category.value if ch else "general",
            "district_id": ch.district_id if ch else None,
            "district_name": ch.district.name if ch and ch.district else "Jharkhand",
            "university_name": uni.name if uni else "Jharkhand State HEI",
            "original_reporter_credit": ch.original_reporter_credit if ch and ch.original_reporter_credit else "Anonymous Citizen Reporter"
        })

    return results
