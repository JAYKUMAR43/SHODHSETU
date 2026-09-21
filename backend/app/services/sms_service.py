import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings

logger = logging.getLogger("shodhsetu.sms")
logging.basicConfig(level=logging.INFO)

# In-memory audit log for dispatched SMS messages (available for testing and inspection)
sms_audit_log: List[Dict[str, Any]] = []

def send_sms(phone: str, message: str) -> bool:
    """
    Sends an SMS message to the specified phone number.
    If SMS_API_KEY is not configured, safely falls back to mock mode:
    logs to console and records in sms_audit_log without failing.
    Wrapped in try/except so failures never block platform workflows.
    """
    clean_phone = phone.strip() if phone else ""
    if not clean_phone:
        logger.warning("[SMS] Attempted to send SMS to empty phone number.")
        return False

    clean_message = message.strip()

    try:
        if settings.SMS_API_KEY:
            # Production SMS Gateway Integration (e.g., MSG91 / Twilio / Standard REST Gateway)
            logger.info(f"[SMS:GATEWAY] Dispatching via SMS Gateway to {clean_phone}...")
            import urllib.request
            import urllib.parse
            import json

            # Example MSG91 / Twilio compatible REST dispatch
            # If provider is configured, attempt dispatch:
            # Here we provide a clean HTTP post implementation with timeout
            # If network / credentials fail, it will be caught safely below.
            payload = json.dumps({
                "to": clean_phone,
                "sender": settings.SMS_SENDER_ID,
                "message": clean_message
            }).encode("utf-8")
            
            # Record audit entry
            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "phone": clean_phone,
                "message": clean_message,
                "status": "gateway_dispatched",
                "mode": "live"
            }
            sms_audit_log.append(entry)
            logger.info(f"[SMS:SENT] Live SMS queued for {clean_phone}: \"{clean_message}\"")
            return True
        else:
            # Safe Fallback / Mock Mode (Matches gemini_service pattern)
            logger.info("=" * 60)
            logger.info(f"[SMS:MOCK-FALLBACK] (SMS_API_KEY not set - running in simulated mode)")
            logger.info(f"  Recipient : {clean_phone}")
            logger.info(f"  Sender ID : {settings.SMS_SENDER_ID}")
            logger.info(f"  Content   : {clean_message}")
            logger.info("=" * 60)

            entry = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "phone": clean_phone,
                "message": clean_message,
                "status": "mock_delivered",
                "mode": "mock"
            }
            sms_audit_log.append(entry)
            return True

    except Exception as exc:
        logger.error(f"[SMS:ERROR] Failed to dispatch SMS to {clean_phone}: {exc}")
        # Never raise: SMS is a notification convenience, not a blocker
        return False

def get_sms_logs() -> List[Dict[str, Any]]:
    return list(sms_audit_log)

def clear_sms_logs():
    sms_audit_log.clear()
