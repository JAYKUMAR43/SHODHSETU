from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models.models import (
    TrustScore, TrustOwnerType, Proposal, ProposalStatus,
    ProjectMilestone, MilestoneStatus, OutcomeRecord, VerificationStatus,
    ProjectTeam
)

def compute_trust_score(
    owner_type: TrustOwnerType,
    owner_id: int,
    db: Session
) -> TrustScore:
    trust = db.query(TrustScore).filter(
        TrustScore.owner_type == owner_type,
        TrustScore.owner_id == owner_id
    ).first()
    
    if not trust:
        trust = TrustScore(
            owner_type=owner_type,
            owner_id=owner_id,
            completion_rate=100.0,
            avg_delivery_delay_days=0.0,
            avg_outcome_rating=4.5,
            computed_score=85.0
        )
        db.add(trust)
        db.commit()
        db.refresh(trust)

    # Query proposals associated with owner
    if owner_type == TrustOwnerType.UNIVERSITY:
        proposals = db.query(Proposal).join(ProjectTeam, Proposal.project_team_id == ProjectTeam.id).filter(
            ProjectTeam.university_id == owner_id
        ).all()
    else:
        proposals = db.query(Proposal).join(Proposal.engagements).filter(
            Proposal.engagements.any(industry_partner_id=owner_id)
        ).all()

    if not proposals:
        # Default baseline if no history yet
        trust.last_computed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(trust)
        return trust

    # Completion rate
    total_milestones = 0
    completed_milestones = 0
    delay_days_total = 0.0

    for p in proposals:
        for m in p.milestones:
            total_milestones += 1
            if m.status == MilestoneStatus.COMPLETED:
                completed_milestones += 1
                if m.due_date and m.completed_at and m.completed_at > m.due_date:
                    delta = (m.completed_at - m.due_date).days
                    delay_days_total += max(delta, 0)
            elif m.status == MilestoneStatus.DELAYED:
                delay_days_total += 7.0

    comp_rate = (completed_milestones / total_milestones * 100.0) if total_milestones > 0 else 90.0
    avg_delay = (delay_days_total / total_milestones) if total_milestones > 0 else 0.0

    # Verified outcome bonus
    verified_outcomes = 0
    for p in proposals:
        for o in p.outcomes:
            if o.verification_status == VerificationStatus.VERIFIED:
                verified_outcomes += 1

    outcome_rating = min(4.0 + (verified_outcomes * 0.3), 5.0)

    # Compute aggregate score (0 - 100)
    # Formula: 45% completion rate + 30% outcome rating (scaled to 100) - 2.5 pts per delay day (capped) + 10 baseline
    score = (0.45 * comp_rate) + (0.30 * (outcome_rating / 5.0 * 100.0)) - min(avg_delay * 2.5, 20.0) + 10.0
    score = min(max(round(score, 1), 25.0), 99.0)

    trust.completion_rate = round(comp_rate, 1)
    trust.avg_delivery_delay_days = round(avg_delay, 1)
    trust.avg_outcome_rating = round(outcome_rating, 2)
    trust.computed_score = score
    trust.last_computed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(trust)
    return trust
