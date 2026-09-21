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
    University, District, ProjectTeam, ChallengeUniversityMatch,
    Notification, User, UserRole, MatchStatus
)

class TestHybridRouting(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_hybrid_routing_full_lifecycle(self):
        """Test full Hybrid Routing workflow:
        1. Submit citizen challenge (status: submitted)
        2. Officer approves -> status becomes awaiting_routing, ZERO matches created in DB
        3. Officer requests preview shortlist -> returns ranked list with active workload, DB remains untouched
        4. Challenge appears in GET /awaiting-routing
        5. Officer calls POST /challenges/{id}/route for a chosen university
        6. Exactly 1 ChallengeUniversityMatch created with status=accepted, challenge becomes routed
        7. Only chosen university receives notification
        8. Challenge no longer in awaiting-routing queue
        """
        db = SessionLocal()
        try:
            officer_login = self.client.post("/api/v1/auth/login", json={
                "email": "dvo.ranchi@jh.gov.in",
                "password": "Pass@1234"
            })
            self.assertEqual(officer_login.status_code, 200)
            officer_token = officer_login.json()["access_token"]
            officer_headers = {"Authorization": f"Bearer {officer_token}"}

            ranchi = db.query(District).filter(District.name == "Ranchi").first()
            ts = int(datetime.now(timezone.utc).timestamp() * 1000)
            ch = Challenge(
                title=f"Arsenic and Heavy Metal Contamination in Angara Borewells {ts}",
                description="High concentrations of arsenic detected in community drinking water supply across 4 villages.",
                category=ChallengeCategory.WATER_RESOURCES,
                submitter_type=SubmitterType.CITIZEN,
                tracking_id=f"SS-TEST-{ts}",
                district_id=ranchi.id if ranchi else 1,
                priority_score=60.0,
                status=ChallengeStatus.SUBMITTED
            )
            db.add(ch)
            db.commit()
            db.refresh(ch)
            ch_id = ch.id

            initial_matches = db.query(ChallengeUniversityMatch).filter(
                ChallengeUniversityMatch.challenge_id == ch_id
            ).all()
            self.assertEqual(len(initial_matches), 0)

            val_resp = self.client.patch(
                f"/api/v1/validation/challenges/{ch_id}",
                headers=officer_headers,
                json={
                    "status": "validated",
                    "priority_score": 85.0
                }
            )
            self.assertEqual(val_resp.status_code, 200, f"Failed validation: {val_resp.text}")

            db.refresh(ch)
            self.assertEqual(ch.status, ChallengeStatus.AWAITING_ROUTING)

            matches_after_approve = db.query(ChallengeUniversityMatch).filter(
                ChallengeUniversityMatch.challenge_id == ch_id
            ).all()
            self.assertEqual(len(matches_after_approve), 0, "No matches should be written immediately on approve!")

            shortlist_resp = self.client.get(
                f"/api/v1/validation/challenges/{ch_id}/routing-shortlist",
                headers=officer_headers
            )
            self.assertEqual(shortlist_resp.status_code, 200, f"Failed shortlist: {shortlist_resp.text}")
            shortlist = shortlist_resp.json()
            self.assertIsInstance(shortlist, list)
            self.assertGreater(len(shortlist), 0, "Shortlist must return recommendations")
            self.assertLessEqual(len(shortlist), 5, "Shortlist capped at 5")

            top_rec = shortlist[0]
            self.assertIn("university_id", top_rec)
            self.assertIn("university_name", top_rec)
            self.assertIn("match_score", top_rec)
            self.assertIn("match_reasons", top_rec)
            self.assertIn("active_project_count", top_rec)
            self.assertIn("is_verified_expertise", top_rec)
            self.assertIsInstance(top_rec["is_verified_expertise"], bool)
            self.assertTrue(top_rec["is_recommended"], "Top match must be flagged as is_recommended")

            matches_after_preview = db.query(ChallengeUniversityMatch).filter(
                ChallengeUniversityMatch.challenge_id == ch_id
            ).all()
            self.assertEqual(len(matches_after_preview), 0, "Preview must NOT write to database!")

            queue_resp = self.client.get(
                "/api/v1/validation/awaiting-routing",
                headers=officer_headers
            )
            self.assertEqual(queue_resp.status_code, 200)
            awaiting_items = queue_resp.json()
            awaiting_ids = [item["id"] for item in awaiting_items]
            self.assertIn(ch_id, awaiting_ids, "Challenge must be in awaiting-routing queue")

            workload_resp = self.client.get(
                "/api/v1/validation/university-workload",
                headers=officer_headers
            )
            self.assertEqual(workload_resp.status_code, 200)
            workload_data = workload_resp.json()
            self.assertIsInstance(workload_data, dict)

            chosen_uni_id = top_rec["university_id"]
            route_resp = self.client.post(
                f"/api/v1/validation/challenges/{ch_id}/route",
                headers=officer_headers,
                json={"university_id": chosen_uni_id}
            )
            self.assertEqual(route_resp.status_code, 200, f"Failed route: {route_resp.text}")
            route_result = route_resp.json()
            self.assertEqual(route_result["university_id"], chosen_uni_id)
            self.assertEqual(route_result["status"], "routed")

            db.refresh(ch)
            self.assertEqual(ch.status, ChallengeStatus.ROUTED)

            final_matches = db.query(ChallengeUniversityMatch).filter(
                ChallengeUniversityMatch.challenge_id == ch_id
            ).all()
            self.assertEqual(len(final_matches), 1, "Exactly ONE ChallengeUniversityMatch must be created!")
            self.assertEqual(final_matches[0].university_id, chosen_uni_id)
            self.assertEqual(final_matches[0].status, MatchStatus.ACCEPTED)

            chosen_coord = db.query(User).filter(
                User.role == UserRole.UNIVERSITY,
                User.organisation_id == chosen_uni_id
            ).first()
            if chosen_coord:
                notif = db.query(Notification).filter(
                    Notification.recipient_user_id == chosen_coord.id,
                    Notification.event_type == "NEW_MATCH"
                ).order_by(Notification.id.desc()).first()
                self.assertIsNotNone(notif, "Notification must be sent to chosen university coordinator")
                self.assertIn(ch.title, notif.message)

            queue_resp2 = self.client.get(
                "/api/v1/validation/awaiting-routing",
                headers=officer_headers
            )
            self.assertEqual(queue_resp2.status_code, 200)
            awaiting_ids2 = [item["id"] for item in queue_resp2.json()]
            self.assertNotIn(ch_id, awaiting_ids2, "Routed challenge must be removed from awaiting queue")

        finally:
            db.close()

    def test_verified_expertise_weighting(self):
        """Test that verified department/faculty expertise receives +8.0 boost
        and sets is_verified_expertise=True, while unreviewed auto-imported tags
        receive a small calibration (-3.0) and is_verified_expertise=False WITHOUT hard-blocking.
        """
        from backend.app.services.gemini_service import gemini_service

        # Mock challenge dict
        mock_challenge = {
            "title": "Groundwater Arsenic Testing and Remediation",
            "description": "Borewells contaminated with arsenic in Ranchi district.",
            "category": ChallengeCategory.WATER_RESOURCES.value,
            "district_id": 1,
            "district_name": "Ranchi"
        }

        # University A: Has verified department & faculty
        verified_uni = {
            "id": 101,
            "name": "Verified State University",
            "type": "Central University",
            "trust_score": 80.0,
            "district_name": "Ranchi",
            "departments": [
                {
                    "name": "Department of Environmental Science & Water Engineering",
                    "domain": "Water Resources & Hydrogeology",
                    "specializations": ["water purification", "arsenic removal", "water quality testing"],
                    "verified": True,
                    "source": "manual_review"
                }
            ],
            "faculty": [
                {
                    "name": "Dr. Ramesh Verma",
                    "designation": "Professor",
                    "department_name": "Department of Environmental Science & Water Engineering",
                    "expertise_tags": ["arsenic contamination", "groundwater filtration", "water resources"],
                    "verified": True
                }
            ]
        }

        # University B: Has auto-imported, unverified department & faculty with identical tags
        unverified_uni = {
            "id": 102,
            "name": "Auto-Imported College",
            "type": "State University",
            "trust_score": 80.0,
            "district_name": "Ranchi",
            "departments": [
                {
                    "name": "Department of Environmental Science & Water Engineering",
                    "domain": "Water Resources & Hydrogeology",
                    "specializations": ["water purification", "arsenic removal", "water quality testing"],
                    "verified": False,
                    "source": "shodhganga_import"
                }
            ],
            "faculty": [
                {
                    "name": "Dr. Ramesh Verma",
                    "designation": "Professor",
                    "department_name": "Department of Environmental Science & Water Engineering",
                    "expertise_tags": ["arsenic contamination", "groundwater filtration", "water resources"],
                    "verified": False
                }
            ]
        }

        res_verified = gemini_service.score_university_match(mock_challenge, [verified_uni])
        res_unverified = gemini_service.score_university_match(mock_challenge, [unverified_uni])

        self.assertEqual(len(res_verified), 1)
        self.assertEqual(len(res_unverified), 1)

        v_match = res_verified[0]
        u_match = res_unverified[0]

        # 1. Verification flag
        self.assertTrue(v_match["is_verified_expertise"])
        self.assertFalse(u_match["is_verified_expertise"])

        # 2. Score boost difference: verified profile must score strictly higher (+8.0 boost vs -3.0 adjustment)
        self.assertGreater(v_match["match_score"], u_match["match_score"])
        self.assertGreaterEqual(v_match["match_score"] - u_match["match_score"], 10.0)

        # 3. Non-exclusion guarantee: unverified profile is NOT excluded or zeroed out
        self.assertGreater(u_match["match_score"], 60.0, "Unverified matching still viable (cold-start preserved)")
        factors_str = " ".join(v_match["match_reasons"]["factors"]).lower()
        self.assertIn("verified", factors_str)


if __name__ == "__main__":
    unittest.main()
