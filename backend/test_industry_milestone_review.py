import sys
import os
import unittest
from datetime import datetime, timezone, timedelta

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models.models import (
    Challenge, ChallengeStatus, ChallengeCategory, SubmitterType,
    University, District, Proposal, ProposalStatus, ProjectTeam,
    ProjectMilestone, MilestoneStatus, IndustryReviewStatus, OutcomeRecord, OutcomeType,
    VerificationStatus, Notification, IndustryPartner, User, UserRole,
    IndustryEngagement, EngagementType
)

class TestIndustryMilestoneReview(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

        # Login tokens
        # 1. University BIT Mesra
        resp = cls.client.post("/api/v1/auth/login", json={
            "email": "uni.bit@jh.gov.in",
            "password": "Pass@1234"
        })
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        cls.uni_token = resp.json()["access_token"]
        cls.uni_headers = {"Authorization": f"Bearer {cls.uni_token}"}

        # 2. Industry Tata Steel
        resp = cls.client.post("/api/v1/auth/login", json={
            "email": "csr.tatasteel@jh.gov.in",
            "password": "Pass@1234"
        })
        assert resp.status_code == 200
        cls.tata_token = resp.json()["access_token"]
        cls.tata_headers = {"Authorization": f"Bearer {cls.tata_token}"}

        # 3. Industry Coal India
        resp = cls.client.post("/api/v1/auth/login", json={
            "email": "csr.coalindia@jh.gov.in",
            "password": "Pass@1234"
        })
        assert resp.status_code == 200
        cls.coal_token = resp.json()["access_token"]
        cls.coal_headers = {"Authorization": f"Bearer {cls.coal_token}"}

        # 4. Government Admin
        resp = cls.client.post("/api/v1/auth/login", json={
            "email": "admin.sti@jh.gov.in",
            "password": "Pass@1234"
        })
        assert resp.status_code == 200
        cls.admin_token = resp.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def setUp(self):
        self.db = SessionLocal()
        ts = int(datetime.now().timestamp() * 1000)

        ranchi = self.db.query(District).filter(District.name == "Ranchi").first()
        uni_bit = self.db.query(University).filter(University.name.like("%Birla%")).first()
        ind_tata = self.db.query(IndustryPartner).filter(IndustryPartner.name.like("%Tata%")).first()
        ind_coal = self.db.query(IndustryPartner).filter(IndustryPartner.name.like("%Coal%")).first()

        self.ch = Challenge(
            title=f"Solar Fluoride Water Remediation Unit {ts}",
            description="Field deployment and filter testing across tribal schools in Ranchi district.",
            category=ChallengeCategory.WATER_RESOURCES,
            ai_confidence_score=0.95,
            submitter_type=SubmitterType.CITIZEN,
            submitter_contact="+919431100001",
            tracking_id=f"SS-TEST-{ts}",
            district_id=ranchi.id,
            status=ChallengeStatus.IN_EXECUTION
        )
        self.db.add(self.ch)
        self.db.commit()

        # Faculty profile
        faculty = uni_bit.departments[0].faculty_profiles[0] if uni_bit.departments and uni_bit.departments[0].faculty_profiles else None

        self.team = ProjectTeam(
            challenge_id=self.ch.id,
            university_id=uni_bit.id,
            faculty_mentor_id=faculty.id if faculty else None,
            student_members=[{"name": "Anita Verma", "role": "Researcher", "email": "anita@bitmesra.ac.in"}]
        )
        self.db.add(self.team)
        self.db.commit()

        self.prop = Proposal(
            project_team_id=self.team.id,
            title=f"Continuous Fluoride Gravity Extraction System {ts}",
            summary="Technical summary of zero-electricity biochar column.",
            status=ProposalStatus.ACCEPTED
        )
        self.db.add(self.prop)
        self.db.commit()

        # Add multiple industry engagements (funding partners)
        self.eng1 = IndustryEngagement(
            proposal_id=self.prop.id,
            industry_partner_id=ind_tata.id,
            engagement_type=EngagementType.FUNDING,
            funding_amount=500000.0,
            notes="Tata Steel CSR Grant"
        )
        self.eng2 = IndustryEngagement(
            proposal_id=self.prop.id,
            industry_partner_id=ind_coal.id,
            engagement_type=EngagementType.DEPLOYMENT,
            funding_amount=250000.0,
            notes="Coal India CSR Deployment Grant"
        )
        self.db.add_all([self.eng1, self.eng2])
        self.db.commit()

        # Add test milestone
        self.milestone = ProjectMilestone(
            proposal_id=self.prop.id,
            title="Lab Column Fluoride Isotherm Validation",
            description="Run continuous column tests and measure effluent fluoride concentration below 1.0 mg/L.",
            due_date=datetime.now(timezone.utc) + timedelta(days=15),
            status=MilestoneStatus.IN_PROGRESS,
            industry_review_status=IndustryReviewStatus.NOT_SUBMITTED
        )
        self.db.add(self.milestone)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_complete_review_and_feedback_cycle(self):
        """
        Tests the entire industry milestone review and feedback loop:
        1. University marks milestone completed with evidence_url -> industry_review_status = pending_review
        2. All linked industry partners receive notification
        3. Industry partner requests revision with feedback -> milestone status reverts to in_progress, industry_review_status = revision_requested
        4. University coordinator and faculty mentor receive revision notification containing feedback text
        5. Government outcome verification is BLOCKED because milestone is in revision_requested
        6. University re-submits milestone post-revision -> industry_review_status = pending_review again (loop)
        7. Industry partner approves milestone -> status stays completed, industry_review_status = approved
        8. University coordinator and faculty mentor receive approval notification
        9. Government outcome verification SUCCEEDS now that all milestones are approved
        """

        # -------------------------------------------------------------
        # Step 1: University marks milestone completed with evidence URL
        # -------------------------------------------------------------
        evidence_url = "https://bharatpanchyt.jh.gov.in/evidence/fl_isotherm_test_v1.pdf"
        resp = self.client.patch(
            f"/api/v1/university/milestones/{self.milestone.id}/complete",
            headers=self.uni_headers,
            json={"evidence_url": evidence_url}
        )
        self.assertEqual(resp.status_code, 200, f"Milestone complete failed: {resp.text}")
        data = resp.json()
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["industry_review_status"], "pending_review")
        self.assertEqual(data["evidence_url"], evidence_url)

        # -------------------------------------------------------------
        # Step 2: Verify ALL linked industry partners received notification
        # -------------------------------------------------------------
        tata_user = self.db.query(User).filter(User.email == "csr.tatasteel@jh.gov.in").first()
        coal_user = self.db.query(User).filter(User.email == "csr.coalindia@jh.gov.in").first()

        tata_notif = self.db.query(Notification).filter(
            Notification.recipient_user_id == tata_user.id,
            Notification.event_type == "MILESTONE_SUBMITTED_FOR_REVIEW"
        ).order_by(Notification.created_at.desc()).first()
        self.assertIsNotNone(tata_notif, "Tata Steel CSR user should receive submission notification")
        self.assertIn(evidence_url, tata_notif.message)

        coal_notif = self.db.query(Notification).filter(
            Notification.recipient_user_id == coal_user.id,
            Notification.event_type == "MILESTONE_SUBMITTED_FOR_REVIEW"
        ).order_by(Notification.created_at.desc()).first()
        self.assertIsNotNone(coal_notif, "Coal India CSR user should receive submission notification (multiple partners)")
        self.assertIn(evidence_url, coal_notif.message)

        # -------------------------------------------------------------
        # Step 3: Industry Partner requests revision
        # Empty feedback must be rejected with 400
        # -------------------------------------------------------------
        bad_rev = self.client.patch(
            f"/api/v1/industry/milestones/{self.milestone.id}/review",
            headers=self.tata_headers,
            json={"action": "request_revision", "feedback": "   "}
        )
        self.assertEqual(bad_rev.status_code, 400, "Empty feedback on revision request must return 400")

        # Valid revision request
        feedback_text = "Effluent readings fluctuated in hours 6-12. Please provide continuous 24-hour telemetry log."
        rev_resp = self.client.patch(
            f"/api/v1/industry/milestones/{self.milestone.id}/review",
            headers=self.tata_headers,
            json={"action": "request_revision", "feedback": feedback_text}
        )
        self.assertEqual(rev_resp.status_code, 200, f"Revision request failed: {rev_resp.text}")
        rev_data = rev_resp.json()
        self.assertEqual(rev_data["industry_review_status"], "revision_requested")
        self.assertEqual(rev_data["status"], "in_progress", "Status must revert to in_progress upon revision request")
        self.assertEqual(rev_data["industry_feedback"], feedback_text)

        # -------------------------------------------------------------
        # Step 4: Verify University coordinator & faculty mentor received feedback
        # -------------------------------------------------------------
        uni_user = self.db.query(User).filter(User.email == "uni.bit@jh.gov.in").first()
        uni_notif = self.db.query(Notification).filter(
            Notification.recipient_user_id == uni_user.id,
            Notification.event_type == "MILESTONE_REVISION_REQUESTED"
        ).order_by(Notification.created_at.desc()).first()
        self.assertIsNotNone(uni_notif, "University coordinator should receive revision request notification")
        self.assertIn(feedback_text, uni_notif.message, "Notification body must include the specific feedback text")

        # -------------------------------------------------------------
        # Step 5: Government Outcome Verification is BLOCKED by milestone gate
        # -------------------------------------------------------------
        outcome = OutcomeRecord(
            proposal_id=self.prop.id,
            outcome_type=OutcomeType.PILOT_DEPLOYMENT,
            claim_description="Pilot test of gravity column at Ratu school.",
            verification_status=VerificationStatus.PENDING
        )
        self.db.add(outcome)
        self.db.commit()

        gov_gate_resp = self.client.patch(
            f"/api/v1/admin/outcomes/{outcome.id}/verify?action=approve",
            headers=self.admin_headers
        )
        self.assertEqual(gov_gate_resp.status_code, 400, "Outcome verification must be blocked when milestone is not approved")
        self.assertIn("must have industry_review_status=approved", gov_gate_resp.json()["detail"])

        # -------------------------------------------------------------
        # Step 6: University Re-Submits post-revision (Loop verification)
        # -------------------------------------------------------------
        revised_evidence_url = "https://bharatpanchyt.jh.gov.in/evidence/fl_isotherm_24h_telemetry_v2.pdf"
        resubmit_resp = self.client.patch(
            f"/api/v1/university/milestones/{self.milestone.id}/complete",
            headers=self.uni_headers,
            json={"evidence_url": revised_evidence_url}
        )
        self.assertEqual(resubmit_resp.status_code, 200)
        resubmit_data = resubmit_resp.json()
        self.assertEqual(resubmit_data["status"], "completed")
        self.assertEqual(resubmit_data["industry_review_status"], "pending_review", "Post-revision submission must re-enter pending_review")
        self.assertEqual(resubmit_data["evidence_url"], revised_evidence_url)

        # -------------------------------------------------------------
        # Step 7: Industry Partner Approves Milestone
        # -------------------------------------------------------------
        appr_resp = self.client.patch(
            f"/api/v1/industry/milestones/{self.milestone.id}/review",
            headers=self.tata_headers,
            json={"action": "approve", "feedback": "24-hour log verified. Fluoride discharge steady at 0.65 mg/L."}
        )
        self.assertEqual(appr_resp.status_code, 200, f"Approval failed: {appr_resp.text}")
        appr_data = appr_resp.json()
        self.assertEqual(appr_data["industry_review_status"], "approved")
        self.assertEqual(appr_data["status"], "completed", "Approved milestone must stay completed")
        self.assertIsNotNone(appr_data["reviewed_by_name"])

        # Verify Approval Notification to University
        appr_notif = self.db.query(Notification).filter(
            Notification.recipient_user_id == uni_user.id,
            Notification.event_type == "MILESTONE_APPROVED"
        ).order_by(Notification.created_at.desc()).first()
        self.assertIsNotNone(appr_notif, "University coordinator must receive approval notification")
        self.assertIn("approved", appr_notif.message.lower())

        # -------------------------------------------------------------
        # Step 8: Government Outcome Verification SUCCEEDS now
        # -------------------------------------------------------------
        gov_ok_resp = self.client.patch(
            f"/api/v1/admin/outcomes/{outcome.id}/verify?action=approve",
            headers=self.admin_headers
        )
        self.assertEqual(gov_ok_resp.status_code, 200, f"Outcome verification should succeed: {gov_ok_resp.text}")
        gov_ok_data = gov_ok_resp.json()
        self.assertEqual(gov_ok_data["verification_status"], "verified")

if __name__ == "__main__":
    unittest.main()
