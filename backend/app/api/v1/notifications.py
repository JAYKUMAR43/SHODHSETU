from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.models import User, Notification, UserRole
from backend.app.schemas.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def _seed_role_notifications(user: User, db: Session) -> List[Notification]:
    """Helper to populate realistic, high-value institutional notifications if user has none."""
    now = datetime.now(timezone.utc)
    role_str = str(user.role).lower()
    items = []

    if "validation" in role_str:
        # District STI Nodal Officer
        items = [
            Notification(
                recipient_user_id=user.id,
                event_type="NEW_CITIZEN_REPORT",
                message="New Grassroots Report: 'High Fluoride Contamination in Deep Borewells across Ratu Block' submitted in your district.",
                read=False,
                created_at=now - timedelta(minutes=24)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="CITIZEN_CLARIFICATION",
                message="Citizen Clarification Received: Complainant submitted clear well-head photographs and GPS landmark for Challenge #BP-RNC-004.",
                read=False,
                created_at=now - timedelta(hours=2)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="SLA_WARNING",
                message="48-Hour SLA Warning: 2 community reports are within 8 hours of the mandatory district verification deadline.",
                read=False,
                created_at=now - timedelta(hours=4)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="DISTRICT_ROUTING",
                message="Academic Routing Acknowledged: BIT Mesra R&D team confirmed receipt of routed drinking water challenge.",
                read=True,
                created_at=now - timedelta(days=1)
            )
        ]
    elif "university" in role_str:
        # University / HEI R&D
        items = [
            Notification(
                recipient_user_id=user.id,
                event_type="DISTRICT_ROUTING",
                message="New Challenge Routed: District STI Nodal Officer assigned 'High Fluoride Contamination in Deep Borewells' (94.5% Shodhganga Match).",
                read=False,
                created_at=now - timedelta(minutes=45)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="CSR_REVIEW",
                message="Industry CSR Alignment: Tata Steel CSR evaluated your research proposal on 'Decentralized Biochar Filtration' with approval.",
                read=False,
                created_at=now - timedelta(hours=3)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="MILESTONE_APPROVED",
                message="Milestone 1 Verified: Lab Prototype Testing deliverable approved by Industry Sponsor. Tranche funding released.",
                read=False,
                created_at=now - timedelta(hours=6)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="TEAM_ASSIGNMENT",
                message="Faculty Mentor Assigned: Prof. S. P. Verma registered 4 postgraduate student researchers to Project #PRP-2026-003.",
                read=True,
                created_at=now - timedelta(days=1)
            )
        ]
    elif "industry" in role_str:
        # Industry & CSR Sponsor
        items = [
            Notification(
                recipient_user_id=user.id,
                event_type="NEW_PROPOSAL",
                message="New Academic Proposal: BIT Mesra submitted proposal for 'Decentralized Biochar Filtration Testbed' matching your Water CSR mandate.",
                read=False,
                created_at=now - timedelta(minutes=30)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="MILESTONE_SUBMITTED",
                message="Milestone Deliverable Submitted: IIT ISM Dhanbad uploaded Phase 2 Field Test & Water Quality Assay for sponsor review.",
                read=False,
                created_at=now - timedelta(hours=2)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="PROJECT_COMPLETED",
                message="Field Deployment Verified: Ratu Gram Panchayat confirmed successful installation of community solar water filter.",
                read=False,
                created_at=now - timedelta(hours=8)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="IP_AGREEMENT_READY",
                message="Bilateral IP Agreement: Schedule VII CSR Intellectual Property Framework executed with Government of Jharkhand attestation.",
                read=True,
                created_at=now - timedelta(days=2)
            )
        ]
    elif "government" in role_str:
        # State Government Admin
        items = [
            Notification(
                recipient_user_id=user.id,
                event_type="REPORT_SUBMITTED",
                message="Institutional Report Submitted: District STI Office (East Singhbhum) submitted Weekly Field Validation Report.",
                read=False,
                created_at=now - timedelta(minutes=15)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="CSR_REPORT_SUBMITTED",
                message="CSR Progress Statement: Tata Steel Corporate Sustainability Office filed Monthly CSR Co-Funding Statement (Rs. 45 Lakhs).",
                read=False,
                created_at=now - timedelta(hours=1)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="OUTCOME_CLAIM",
                message="Outcome Attestation Required: Verified community deployment in Ratu Block ready for Directorate State Verification.",
                read=False,
                created_at=now - timedelta(hours=3)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="SLA_ESCALATION",
                message="Statewide SLA Escalation: 2 unvalidated community challenges in Dhanbad district have crossed the 72-hour threshold.",
                read=False,
                created_at=now - timedelta(hours=5)
            ),
            Notification(
                recipient_user_id=user.id,
                event_type="SYSTEMIC_ALERT",
                message="AI Telemetry Alert: Cross-district arsenic contamination cluster detected across Ranchi and Ramgarh districts.",
                read=True,
                created_at=now - timedelta(days=1)
            )
        ]

    if items:
        db.add_all(items)
        db.commit()
        for it in items:
            db.refresh(it)
    return items

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(25).all()

    if not notifs:
        notifs = _seed_role_notifications(current_user, db)

    return notifs

@router.patch("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.recipient_user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read."}

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.recipient_user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.read = True
    db.commit()
    return {"message": "Notification marked as read."}
