from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.models import (
    OutcomeRecord, VerificationStatus, Proposal, ProjectTeam, Challenge,
    University, ChallengeStatus, IndustryEngagement
)

router = APIRouter(prefix="/registry", tags=["Public Innovation Registry"])

DISTRICT_NAME_COORDS = {
    "ranchi": {"lat": 23.3441, "lng": 85.3096},
    "dhanbad": {"lat": 23.7957, "lng": 86.4304},
    "east singhbhum": {"lat": 22.8046, "lng": 86.2029},
    "jamshedpur": {"lat": 22.8046, "lng": 86.2029},
    "bokaro": {"lat": 23.6693, "lng": 86.1511},
    "hazaribagh": {"lat": 23.9925, "lng": 85.3637},
    "deoghar": {"lat": 24.4826, "lng": 86.7000},
    "dumka": {"lat": 24.2677, "lng": 87.2546},
    "giridih": {"lat": 24.1856, "lng": 86.3060},
    "palamu": {"lat": 24.0416, "lng": 84.0722},
    "ramgarh": {"lat": 23.6322, "lng": 85.5135},
    "west singhbhum": {"lat": 22.5519, "lng": 85.8083},
    "saraikela": {"lat": 22.7006, "lng": 85.9328},
    "khunti": {"lat": 23.0726, "lng": 85.2789},
    "gumla": {"lat": 23.0439, "lng": 84.5414},
    "simdega": {"lat": 22.6145, "lng": 84.5090},
    "lohardaga": {"lat": 23.4357, "lng": 84.6811},
    "latehar": {"lat": 23.7431, "lng": 84.5033},
    "chatra": {"lat": 24.2096, "lng": 84.8711},
    "koderma": {"lat": 24.4674, "lng": 85.5939},
    "godda": {"lat": 24.8267, "lng": 87.2144},
    "sahibganj": {"lat": 25.2425, "lng": 87.6444},
    "pakur": {"lat": 24.6340, "lng": 87.8488},
    "jamtara": {"lat": 23.9620, "lng": 86.8010},
    "garhwa": {"lat": 24.1610, "lng": 83.8055},
}

def resolve_coords(ch, d_name: str):
    if ch and ch.latitude and ch.longitude:
        return float(ch.latitude), float(ch.longitude)
    d_clean = (d_name or "").lower()
    for k, v in DISTRICT_NAME_COORDS.items():
        if k in d_clean:
            return v["lat"], v["lng"]
    return 23.3441, 85.3096

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

        d_name = ch.district.name if ch and ch.district else "Jharkhand"
        lat, lng = resolve_coords(ch, d_name)

        ind_partner = None
        if p and p.engagements and len(p.engagements) > 0 and p.engagements[0].industry_partner:
            ind_partner = p.engagements[0].industry_partner.name

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
            "district_name": d_name,
            "latitude": lat,
            "longitude": lng,
            "university_id": uni.id if uni else None,
            "university_name": uni.name if uni else "Jharkhand State HEI",
            "industry_partner": ind_partner,
            "tracking_id": ch.tracking_id if ch else f"BP-{o.id + 1000}",
            "original_reporter_credit": ch.original_reporter_credit if ch and ch.original_reporter_credit else "Anonymous Citizen Reporter"
        })

    return results

@router.get("/map-projects")
def get_map_projects(
    district_id: Optional[int] = Query(None),
    university_id: Optional[int] = Query(None),
    university_name: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns working projects across Jharkhand with geolocation for GIS Maps.
    Includes verified outcome deployments and active university-industry execution projects.
    """
    projects = []
    seen_keys = set()

    # 1. Verified Working Outcomes
    outcomes = db.query(OutcomeRecord).filter(
        OutcomeRecord.verification_status == VerificationStatus.VERIFIED
    ).all()

    for o in outcomes:
        p = o.proposal
        team = p.project_team if p else None
        ch = team.challenge if team else None
        uni = team.university if team else None

        d_name = ch.district.name if ch and ch.district else "Jharkhand"
        d_id = ch.district_id if ch else None
        u_name = uni.name if uni else "Jharkhand State University"
        u_id = uni.id if uni else None
        lat, lng = resolve_coords(ch, d_name)

        ind_partner = None
        if p and p.engagements and len(p.engagements) > 0 and p.engagements[0].industry_partner:
            ind_partner = p.engagements[0].industry_partner.name

        cat = ch.category.value if ch else "general"

        item = {
            "id": f"outcome_{o.id}",
            "title": p.title if p else (ch.title if ch else "Verified Societal Project"),
            "challenge_title": ch.title if ch else "Grassroots Problem",
            "category": cat,
            "status": "verified_working",
            "status_label": "Verified Working Solution",
            "outcome_type": o.outcome_type.value,
            "district_id": d_id,
            "district_name": d_name,
            "latitude": lat,
            "longitude": lng,
            "university_id": u_id,
            "university_name": u_name,
            "industry_partner": ind_partner,
            "tracking_id": ch.tracking_id if ch else f"BP-{o.id + 1000}",
            "verified_at": o.verified_at.isoformat() if o.verified_at else None,
            "description": o.claim_description or (ch.description if ch else "")
        }
        key = (item["title"], item["district_name"])
        if key not in seen_keys:
            seen_keys.add(key)
            projects.append(item)

    # 2. Active Research & Execution Challenges
    active_challenges = db.query(Challenge).filter(
        Challenge.status.in_([
            ChallengeStatus.IN_RESEARCH, ChallengeStatus.PROPOSAL_SUBMITTED,
            ChallengeStatus.IN_EXECUTION, ChallengeStatus.DEPLOYED, ChallengeStatus.VALIDATED,
            ChallengeStatus.ROUTED
        ])
    ).all()

    for ch in active_challenges:
        d_name = ch.district.name if ch.district else "Jharkhand"
        lat, lng = resolve_coords(ch, d_name)

        # Find linked university if any
        linked_uni_name = "Assigned State University"
        linked_uni_id = None
        linked_partner = None

        if ch.matches:
            for m in ch.matches:
                if m.university:
                    linked_uni_name = m.university.name
                    linked_uni_id = m.university.id
                    if m.proposal and m.proposal.engagements and len(m.proposal.engagements) > 0:
                        linked_partner = m.proposal.engagements[0].industry_partner.name if m.proposal.engagements[0].industry_partner else None
                    break

        status_label_map = {
            ChallengeStatus.DEPLOYED: "Field Deployed",
            ChallengeStatus.IN_EXECUTION: "In Execution & Prototyping",
            ChallengeStatus.PROPOSAL_SUBMITTED: "Solution Proposal Submitted",
            ChallengeStatus.IN_RESEARCH: "Active University R&D",
            ChallengeStatus.ROUTED: "Routed to Academic Faculty",
            ChallengeStatus.VALIDATED: "District Validated"
        }

        item = {
            "id": f"challenge_{ch.id}",
            "title": ch.title,
            "challenge_title": ch.title,
            "category": ch.category.value if ch.category else "general",
            "status": ch.status.value,
            "status_label": status_label_map.get(ch.status, "Active Project"),
            "outcome_type": "active_project",
            "district_id": ch.district_id,
            "district_name": d_name,
            "latitude": lat,
            "longitude": lng,
            "university_id": linked_uni_id,
            "university_name": linked_uni_name,
            "industry_partner": linked_partner,
            "tracking_id": ch.tracking_id,
            "verified_at": ch.validated_at.isoformat() if ch.validated_at else ch.created_at.isoformat(),
            "description": ch.description
        }
        key = (item["title"], item["district_name"])
        if key not in seen_keys:
            seen_keys.add(key)
            projects.append(item)

    # Filter according to parameters
    filtered = []
    for p in projects:
        if district_id and p["district_id"] != district_id:
            continue
        if university_id and p["university_id"] != university_id:
            continue
        if university_name and (not p["university_name"] or university_name.lower() not in p["university_name"].lower()):
            continue
        if sector and p["category"] != sector:
            continue
        filtered.append(p)

    return filtered
