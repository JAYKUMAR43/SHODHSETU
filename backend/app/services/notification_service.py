import logging
from typing import Union, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import Notification, User

logger = logging.getLogger("notification_service")

def create_notification(
    recipient: Union[User, int, str, None],
    event_type: str,
    message: str,
    db: Session
) -> Optional[Notification]:
    """
    Centralized helper for recording notifications across ShodhSetu workflows.
    - If recipient is a User or int: assigns recipient_user_id
    - If recipient is a contact string (email/phone): assigns recipient_contact
    """
    recipient_user_id = None
    recipient_contact = None

    if isinstance(recipient, User):
        recipient_user_id = recipient.id
    elif isinstance(recipient, int):
        recipient_user_id = recipient
    elif isinstance(recipient, str):
        if "@" in recipient or any(c.isdigit() for c in recipient):
            recipient_contact = recipient
        else:
            try:
                recipient_user_id = int(recipient)
            except ValueError:
                recipient_contact = recipient

    notif = Notification(
        recipient_user_id=recipient_user_id,
        recipient_contact=recipient_contact,
        event_type=event_type,
        message=message
    )
    try:
        db.add(notif)
        db.commit()
        db.refresh(notif)
        logger.info(f"Notification [{event_type}] created for user={recipient_user_id} / contact={recipient_contact}")
        return notif
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        db.rollback()
        return None
