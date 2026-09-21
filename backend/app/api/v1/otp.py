from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.schemas import OTPRequestPayload, OTPVerifyPayload, OTPVerifyResponse
from backend.app.services.otp_service import request_otp, verify_otp

router = APIRouter(prefix="/otp", tags=["OTP & Phone Verification"])

@router.post("/request")
def request_phone_otp(payload: OTPRequestPayload):
    """
    Generates and dispatches a 6-digit OTP to the specified phone number.
    Rate limited to 1 request per 60 seconds, max 5 requests per hour.
    """
    success, message, debug_otp = request_otp(payload.phone)
    if not success:
        if "wait" in message.lower() or "rate limit" in message.lower():
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=message)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    resp = {
        "message": message,
        "phone": payload.phone
    }
    if debug_otp:
        resp["debug_otp"] = debug_otp

    return resp

@router.post("/verify", response_model=OTPVerifyResponse)
def verify_phone_otp(payload: OTPVerifyPayload):
    """
    Verifies a 6-digit OTP and returns a short-lived verification token (15-min expiry)
    bound to the verified phone number.
    """
    success, message, token = verify_otp(payload.phone, payload.otp)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return OTPVerifyResponse(
        verified=True,
        phone=payload.phone,
        verification_token=token,
        message=message,
        expires_in_seconds=900
    )
