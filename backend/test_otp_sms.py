import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.models import (
    Challenge, ChallengeStatus, ChallengeCategory, SubmitterType,
    University, District, User, UserRole, MatchStatus
)
from backend.app.services.otp_service import reset_otp_state
from backend.app.services.sms_service import get_sms_logs, clear_sms_logs, send_sms

class TestOTPSMSWorkflow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def setUp(self):
        reset_otp_state()
        clear_sms_logs()

    def test_01_otp_request_and_rate_limiting(self):
        """Test OTP generation, mock delivery, and strict rate limits (60s cooldown)."""
        test_phone = "+919876543211"

        # 1. Invalid phone (<10 digits)
        bad_resp = self.client.post("/api/v1/otp/request", json={"phone": "12345"})
        self.assertEqual(bad_resp.status_code, 400)

        # 2. Valid phone OTP request
        resp1 = self.client.post("/api/v1/otp/request", json={"phone": test_phone})
        self.assertEqual(resp1.status_code, 200)
        data1 = resp1.json()
        self.assertIn("message", data1)
        self.assertIn("debug_otp", data1)
        self.assertEqual(len(data1["debug_otp"]), 6)

        # Check mock SMS was logged
        sms_logs = get_sms_logs()
        self.assertEqual(len(sms_logs), 1)
        self.assertEqual(sms_logs[0]["phone"], test_phone)
        self.assertIn(data1["debug_otp"], sms_logs[0]["message"])

        # 3. Immediate second request within 60s -> Must be rate-limited (HTTP 429)
        resp2 = self.client.post("/api/v1/otp/request", json={"phone": test_phone})
        self.assertEqual(resp2.status_code, 429)
        self.assertIn("wait", resp2.json()["detail"].lower())

    def test_02_otp_verification(self):
        """Test OTP verification code checks and token issuance."""
        test_phone = "+919876543212"

        # Request OTP
        req_resp = self.client.post("/api/v1/otp/request", json={"phone": test_phone})
        self.assertEqual(req_resp.status_code, 200)
        otp = req_resp.json()["debug_otp"]

        # Attempt with wrong OTP
        wrong_resp = self.client.post("/api/v1/otp/verify", json={
            "phone": test_phone,
            "otp": "000000"
        })
        self.assertEqual(wrong_resp.status_code, 400)
        self.assertIn("Invalid OTP", wrong_resp.json()["detail"])

        # Attempt with valid OTP
        valid_resp = self.client.post("/api/v1/otp/verify", json={
            "phone": test_phone,
            "otp": otp
        })
        self.assertEqual(valid_resp.status_code, 200)
        v_data = valid_resp.json()
        self.assertTrue(v_data["verified"])
        self.assertTrue(len(v_data["verification_token"]) > 20)
        self.assertEqual(v_data["expires_in_seconds"], 900)

    def test_03_citizen_submission_enforces_verified_phone(self):
        """Individual citizen submissions must provide verified phone & token."""
        ts = int(datetime.now(timezone.utc).timestamp() * 1000)

        # 1. Reject without phone number
        resp_no_phone = self.client.post("/api/v1/challenges", json={
            "title": f"Arsenic Filter Deficit {ts}",
            "description": "High arsenic levels detected in 5 village drinking wells.",
            "category": "water_resources",
            "submitter_type": "citizen",
            "district_id": 1
        })
        self.assertEqual(resp_no_phone.status_code, 400)
        self.assertIn("mandatory", resp_no_phone.json()["detail"].lower())

        # 2. Reject without verification token
        test_phone = "+919876543213"
        resp_no_token = self.client.post("/api/v1/challenges", json={
            "title": f"Arsenic Filter Deficit {ts}",
            "description": "High arsenic levels detected in 5 village drinking wells.",
            "category": "water_resources",
            "submitter_type": "citizen",
            "submitter_contact": test_phone,
            "district_id": 1
        })
        self.assertEqual(resp_no_token.status_code, 400)
        self.assertIn("verified", resp_no_token.json()["detail"].lower())

        # 3. Reject with bogus token
        resp_bad_token = self.client.post("/api/v1/challenges", json={
            "title": f"Arsenic Filter Deficit {ts}",
            "description": "High arsenic levels detected in 5 village drinking wells.",
            "category": "water_resources",
            "submitter_type": "citizen",
            "submitter_contact": test_phone,
            "otp_verification_token": "fake_token_123456",
            "district_id": 1
        })
        self.assertEqual(resp_bad_token.status_code, 400)
        self.assertIn("invalid or expired", resp_bad_token.json()["detail"].lower())

        # 4. Success with real verified token
        req_resp = self.client.post("/api/v1/otp/request", json={"phone": test_phone})
        otp = req_resp.json()["debug_otp"]
        v_resp = self.client.post("/api/v1/otp/verify", json={"phone": test_phone, "otp": otp})
        valid_token = v_resp.json()["verification_token"]

        clear_sms_logs()
        submit_resp = self.client.post("/api/v1/challenges", json={
            "title": f"Arsenic Filter Deficit {ts}",
            "description": "High arsenic levels detected in 5 village drinking wells across Angara block.",
            "category": "water_resources",
            "submitter_type": "citizen",
            "submitter_contact": test_phone,
            "email": "citizen.angara@example.org",
            "otp_verification_token": valid_token,
            "original_reporter_credit": "Angara Village Committee",
            "district_id": 1
        })
        self.assertEqual(submit_resp.status_code, 200, f"Submit failed: {submit_resp.text}")
        created_ch = submit_resp.json()
        self.assertTrue(created_ch["tracking_id"].startswith("SS-"))

        # Check Lifecycle Moment 1: Submission Confirmation SMS dispatched
        sms_logs = get_sms_logs()
        self.assertTrue(len(sms_logs) >= 1)
        sub_sms = next((s for s in sms_logs if s["phone"] == test_phone), None)
        self.assertIsNotNone(sub_sms)
        self.assertIn(created_ch["tracking_id"], sub_sms["message"])
        self.assertIn("submitted", sub_sms["message"].lower())

    def test_04_institutional_submitters_skip_otp(self):
        """Institutional submitters (PRI, ULB, GOVT_DEPT) bypass OTP verification."""
        ts = int(datetime.now(timezone.utc).timestamp() * 1000)

        # PRI submission without token
        pri_resp = self.client.post("/api/v1/challenges", json={
            "title": f"PRI Cold Storage Need {ts}",
            "description": "Panchayat cold storage request for monsoon vegetable perishables.",
            "category": "agriculture",
            "submitter_type": "pri",
            "submitter_contact": "+919431100001",
            "district_id": 1
        })
        self.assertEqual(pri_resp.status_code, 200, f"PRI submit failed: {pri_resp.text}")
        self.assertEqual(pri_resp.json()["status"], "validated")

    def test_05_sms_lifecycle_moments_2_3_4(self):
        """Test SMS triggers for Validation Officer Approval, Rejection, and University Routing."""
        db = SessionLocal()
        try:
            # Login as District Validation Officer
            login_resp = self.client.post("/api/v1/auth/login", json={
                "email": "dvo.ranchi@jh.gov.in",
                "password": "Pass@1234"
            })
            self.assertEqual(login_resp.status_code, 200)
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # --- MOMENT 2: OFFICER APPROVAL SMS ---
            ts = int(datetime.now(timezone.utc).timestamp() * 1000)
            phone_appr = "+919876543214"
            ch_appr = Challenge(
                title=f"Fluoride Testing Kit Need {ts}",
                description="Rapid fluoride test strips needed for 8 schools in Ranchi district.",
                category=ChallengeCategory.WATER_RESOURCES,
                submitter_type=SubmitterType.CITIZEN,
                submitter_contact=phone_appr,
                tracking_id=f"SS-APPR-{ts}",
                district_id=1,
                priority_score=70.0,
                status=ChallengeStatus.SUBMITTED
            )
            db.add(ch_appr)
            db.commit()
            db.refresh(ch_appr)

            clear_sms_logs()
            val_resp = self.client.patch(
                f"/api/v1/validation/challenges/{ch_appr.id}",
                headers=headers,
                json={"status": "validated", "priority_score": 85.0}
            )
            self.assertEqual(val_resp.status_code, 200)

            # Check Moment 2 SMS
            sms_logs2 = get_sms_logs()
            appr_sms = next((s for s in sms_logs2 if s["phone"] == phone_appr), None)
            self.assertIsNotNone(appr_sms, "Approval SMS must be dispatched to citizen")
            self.assertIn("approved", appr_sms["message"].lower())
            self.assertIn(ch_appr.tracking_id, appr_sms["message"])

            # --- MOMENT 3: OFFICER REJECTION SMS ---
            phone_rej = "+919876543215"
            ch_rej = Challenge(
                title=f"Vague Grievance {ts}",
                description="Community issue that lacks actionable engineering or scientific scope.",
                category=ChallengeCategory.PUBLIC_ADMINISTRATION,
                submitter_type=SubmitterType.CITIZEN,
                submitter_contact=phone_rej,
                tracking_id=f"SS-REJ-{ts}",
                district_id=1,
                priority_score=30.0,
                status=ChallengeStatus.SUBMITTED
            )
            db.add(ch_rej)
            db.commit()
            db.refresh(ch_rej)

            clear_sms_logs()
            rej_reason = "Out of academic scope; referred to district civic portal."
            rej_resp = self.client.patch(
                f"/api/v1/validation/challenges/{ch_rej.id}",
                headers=headers,
                json={"status": "rejected", "rejection_reason": rej_reason}
            )
            self.assertEqual(rej_resp.status_code, 200)

            # Check Moment 3 SMS
            sms_logs3 = get_sms_logs()
            rej_sms = next((s for s in sms_logs3 if s["phone"] == phone_rej), None)
            self.assertIsNotNone(rej_sms, "Rejection SMS must be dispatched to citizen")
            self.assertIn("not approved", rej_sms["message"].lower())
            self.assertIn(ch_rej.tracking_id, rej_sms["message"])
            self.assertIn(rej_reason, rej_sms["message"])

            # --- MOMENT 4: ROUTE TO UNIVERSITY COORDINATOR SMS ---
            uni_bit = db.query(University).filter(University.name.like("%Birla%")).first()
            self.assertIsNotNone(uni_bit)

            # Ensure coordinator user has a phone number
            coord = db.query(User).filter(
                User.role == UserRole.UNIVERSITY,
                User.organisation_id == uni_bit.id
            ).first()
            self.assertIsNotNone(coord)
            coord.phone = "+919876599999"
            db.commit()

            clear_sms_logs()
            route_resp = self.client.post(
                f"/api/v1/validation/challenges/{ch_appr.id}/route",
                headers=headers,
                json={"university_id": uni_bit.id}
            )
            self.assertEqual(route_resp.status_code, 200)

            # Check Moment 4 SMS
            sms_logs4 = get_sms_logs()
            uni_sms = next((s for s in sms_logs4 if s["phone"] == coord.phone), None)
            self.assertIsNotNone(uni_sms, "Routing SMS must be dispatched to university coordinator")
            self.assertIn("routed to your institution", uni_sms["message"].lower())
            self.assertIn(ch_appr.title, uni_sms["message"])

        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
