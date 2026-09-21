import hashlib
import secrets
import string
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
from backend.app.core.config import settings
from backend.app.services.sms_service import send_sms

logger = logging.getLogger("shodhsetu.otp")

OTP_SALT = "shodhsetu-sih-otp-salt-2026"
OTP_EXPIRY_MINUTES = 5
TOKEN_EXPIRY_MINUTES = 15

# Thread-safe in-memory stores
_request_history: Dict[str, List[datetime]] = {}
_active_otps: Dict[str, Dict] = {}
_verified_tokens: Dict[str, Dict] = {}

def normalize_phone(phone: str) -> str:
    """Normalizes phone number to strip whitespace, dashes, and standardizes format."""
    p = "".join(c for c in phone if c.isdigit() or c == "+").strip()
    return p

def _hash_otp(phone: str, otp: str) -> str:
    data = f"{phone}:{otp}:{OTP_SALT}".encode("utf-8")
    return hashlib.sha256(data).hexdigest()

def request_otp(phone: str) -> Tuple[bool, str, Optional[str]]:
    """
    Generates a 6-digit OTP, enforces rate limits, hashes and stores it,
    and dispatches it via sms_service.send_sms.
    Returns (success, message_or_error, debug_otp_if_mock).
    """
    clean_phone = normalize_phone(phone)
    if len(clean_phone) < 10:
        return False, "Please provide a valid 10-digit mobile number.", None

    now = datetime.now(timezone.utc)

    # 1. Rate limiting checks
    history = _request_history.get(clean_phone, [])
    # Keep only requests within the last 1 hour (3600s)
    one_hour_ago = now - timedelta(hours=1)
    history = [t for t in history if t > one_hour_ago]
    _request_history[clean_phone] = history

    # Check 1 request per 60 seconds limit
    if history:
        last_request = history[-1]
        elapsed_seconds = (now - last_request).total_seconds()
        if elapsed_seconds < 60:
            retry_after = int(60 - elapsed_seconds)
            return False, f"Please wait {retry_after} seconds before requesting a new OTP.", None

    # Check max 5 requests per hour limit
    if len(history) >= 5:
        return False, "Rate limit exceeded: Maximum 5 OTP requests per hour for this phone number.", None

    # 2. Generate 6-digit numeric OTP
    otp = "".join(secrets.choice(string.digits) for _ in range(6))
    hashed = _hash_otp(clean_phone, otp)
    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)

    _active_otps[clean_phone] = {
        "hash": hashed,
        "expires_at": expires_at,
        "attempts": 0
    }
    history.append(now)
    _request_history[clean_phone] = history

    # 3. Dispatch SMS
    sms_text = f"Your ShodhSetu verification code is {otp}. Valid for 5 minutes. Do not share this with anyone."
    send_sms(clean_phone, sms_text)

    debug_otp = otp if not settings.SMS_API_KEY else None
    return True, f"OTP sent successfully to {clean_phone}.", debug_otp

def verify_otp(phone: str, otp: str) -> Tuple[bool, str, Optional[str]]:
    """
    Validates the provided OTP against the stored hash and expiry.
    On success, creates and returns a short-lived verification token (15 min).
    Returns (success, message_or_error, verification_token).
    """
    clean_phone = normalize_phone(phone)
    clean_otp = otp.strip()

    now = datetime.now(timezone.utc)
    stored = _active_otps.get(clean_phone)

    if not stored:
        return False, "No active OTP request found for this phone number. Please request a new OTP.", None

    if now > stored["expires_at"]:
        _active_otps.pop(clean_phone, None)
        return False, "OTP has expired. Please request a new OTP.", None

    stored["attempts"] += 1
    if stored["attempts"] > 3:
        _active_otps.pop(clean_phone, None)
        return False, "Too many failed attempts. Please request a new OTP.", None

    expected_hash = stored["hash"]
    given_hash = _hash_otp(clean_phone, clean_otp)

    if not secrets.compare_digest(expected_hash, given_hash):
        return False, "Invalid OTP code. Please enter the correct 6-digit code.", None

    # OTP is valid! Issue 15-minute verification token
    _active_otps.pop(clean_phone, None)
    token = secrets.token_urlsafe(32)
    _verified_tokens[token] = {
        "phone": clean_phone,
        "expires_at": now + timedelta(minutes=TOKEN_EXPIRY_MINUTES)
    }

    return True, "Phone number successfully verified.", token

def verify_phone_token(phone: str, token: str) -> bool:
    """
    Checks if the verification token is valid, unexpired, and belongs to the given phone number.
    """
    if not token or not phone:
        return False

    clean_phone = normalize_phone(phone)
    record = _verified_tokens.get(token)
    if not record:
        return False

    now = datetime.now(timezone.utc)
    if now > record["expires_at"]:
        _verified_tokens.pop(token, None)
        return False

    return record["phone"] == clean_phone

def reset_otp_state():
    """Helper for testing: clears in-memory stores."""
    _request_history.clear()
    _active_otps.clear()
    _verified_tokens.clear()
