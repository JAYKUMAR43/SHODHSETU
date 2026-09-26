import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone, timedelta
from pypdf import PdfReader

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.models import (
    Challenge, ChallengeStatus, ChallengeCategory, SubmitterType,
    University, District, Proposal, ProposalStatus, ProjectTeam,
    ProjectMilestone, MilestoneStatus, OutcomeRecord, OutcomeType,
    VerificationStatus, Notification, IndustryPartner, TrustScore,
    TrustOwnerType, ChallengeUniversityMatch, User, UserRole,
    IPAgreement, IPTemplate, RegistrationStatus
)
from backend.app.services.trust_score_service import compute_trust_score
from backend.app.services.gemini_service import gemini_service

class TestBharatPanchyt(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_health(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "healthy")

    def test_02_districts(self):
        resp = self.client.get("/api/v1/districts")
        self.assertEqual(resp.status_code, 200)
        districts = resp.json()
        self.assertGreaterEqual(len(districts), 3)

    def test_03_login_university(self):
        resp = self.client.post("/api/v1/auth/login", json={
            "email": "uni.bit@jh.gov.in",
            "password": "Pass@1234"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["role"], "university")
        self.assertIn("access_token", data)

    def test_04_login_validation_officer(self):
        resp = self.client.post("/api/v1/auth/login", json={
            "email": "dvo.ranchi@jh.gov.in",
            "password": "Pass@1234"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["role"], "validation_officer")

    def test_05_submit_citizen_challenge(self):
        # Request and verify OTP for mandatory phone verification
        phone = "+919876543201"
        req_resp = self.client.post("/api/v1/otp/request", json={"phone": phone})
        self.assertEqual(req_resp.status_code, 200)
        otp = req_resp.json()["debug_otp"]
        ver_resp = self.client.post("/api/v1/otp/verify", json={"phone": phone, "otp": otp})
        self.assertEqual(ver_resp.status_code, 200)
        token = ver_resp.json()["verification_token"]

        # Citizen submission with verified phone and token
        resp = self.client.post("/api/v1/challenges", json={
            "title": "Severe Arsenic Seepage in Angara Block Handpumps",
            "description": "High arsenic water causing chronic keratosis in agricultural workers across 3 villages.",
            "category": "water_resources",
            "submitter_type": "citizen",
            "submitter_contact": phone,
            "otp_verification_token": token,
            "district_id": 1,
            "latitude": 23.37,
            "longitude": 85.34
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["tracking_id"].startswith("BP-"))
        self.assertEqual(data["status"], "ai_prescreened")

        # Public Tracking lookup
        track_resp = self.client.get(f"/api/v1/challenges/track/{data['tracking_id']}")
        self.assertEqual(track_resp.status_code, 200)
        self.assertEqual(track_resp.json()["tracking_id"], data["tracking_id"])

    def test_06_public_registry(self):
        resp = self.client.get("/api/v1/registry/outcomes")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIsInstance(data, list)
        if len(data) > 0:
            self.assertIn("original_reporter_credit", data[0])

    def test_07_reporter_credit_tracking(self):
        # Request and verify OTP for reporter phone
        phone = "+919431199999"
        req_resp = self.client.post("/api/v1/otp/request", json={"phone": phone})
        self.assertEqual(req_resp.status_code, 200)
        otp = req_resp.json()["debug_otp"]
        ver_resp = self.client.post("/api/v1/otp/verify", json={"phone": phone, "otp": otp})
        self.assertEqual(ver_resp.status_code, 200)
        token = ver_resp.json()["verification_token"]

        # Submit challenge with original_reporter_credit (Fix 3)
        credit_name = "Gram Sabha Angara & Smt. Anita Devi"
        resp = self.client.post("/api/v1/challenges", json={
            "title": "Solar-Powered Cold Storage Deficit for Tomato Farmers",
            "description": "Farmers in Ormanjhi facing massive post-harvest tomato spoilage during monsoon season.",
            "category": "agriculture",
            "submitter_type": "citizen",
            "submitter_contact": phone,
            "otp_verification_token": token,
            "original_reporter_credit": credit_name,
            "district_id": 1
        })
        self.assertEqual(resp.status_code, 200)
        created = resp.json()
        self.assertEqual(created["original_reporter_credit"], credit_name)

        # Verify tracking endpoint returns the credit
        track_resp = self.client.get(f"/api/v1/challenges/track/{created['tracking_id']}")
        self.assertEqual(track_resp.status_code, 200)
        self.assertEqual(track_resp.json()["original_reporter_credit"], credit_name)

    def test_08_district_briefing_cache(self):
        # Login as Government Admin
        login_resp = self.client.post("/api/v1/auth/login", json={
            "email": "admin.sti@jh.gov.in",
            "password": "Pass@1234"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Request district briefing (Fix 2)
        resp = self.client.get("/api/v1/admin/analytics/briefing?district_id=1", headers=headers)
        self.assertEqual(resp.status_code, 200)
        briefing = resp.json()
        self.assertIn("briefing_text", briefing)
        self.assertTrue(len(briefing["briefing_text"]) > 20)
        self.assertIn("generated_at", briefing)
        self.assertIn("is_cached", briefing)

        # Second request should be cached within 24h
        resp2 = self.client.get("/api/v1/admin/analytics/briefing?district_id=1", headers=headers)
        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(resp2.json()["is_cached"])

    def test_09_notifications_pipeline(self):
        # Login as University user
        login_resp = self.client.post("/api/v1/auth/login", json={
            "email": "uni.bit@jh.gov.in",
            "password": "Pass@1234"
        })
        self.assertEqual(login_resp.status_code, 200)
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Notifications endpoint (Fix 1)
        resp = self.client.get("/api/v1/notifications", headers=headers)
        self.assertEqual(resp.status_code, 200)
        notifs = resp.json()
        self.assertIsInstance(notifs, list)

    def test_10_university_matching_correctness(self):
        """TEST 1: University Matching Engine Correctness
        - Specific challenge category (agriculture in Ranchi) clearly favoring Birsa Agricultural University (BAU)
        - Assert BAU appears in top-2 of ranked shortlist
        - Assert match_score is meaningfully higher (> 15 pts) than unrelated universities (e.g. Kolhan/NIT)
        - Assert match_reasons references real department/expertise tags
        - Verify inbox retrieval via GET /api/v1/university/challenges
        """
        db = SessionLocal()
        try:
            bau = db.query(University).filter(University.name.like("%Birsa%")).first()
            self.assertIsNotNone(bau, "BAU Kanke must be seeded in database")
            ranchi = db.query(District).filter(District.name == "Ranchi").first()
            self.assertIsNotNone(ranchi, "Ranchi district must be seeded")

            # Submit challenge favoring BAU's Agronomy & Soil Science department
            resp = self.client.post("/api/v1/challenges", json={
                "title": "Drought-Tolerant Millets and Red Soil Micro-Irrigation Systems",
                "description": "Tribal farmers in Kanke block require drought-tolerant millets, red soil fertility optimization, and micro-irrigation systems for smallholder plots.",
                "category": "agriculture",
                "submitter_type": "pri", # Auto-validates and computes university matches
                "district_id": ranchi.id
            })
            self.assertEqual(resp.status_code, 200)
            ch_data = resp.json()

            # Verify matches stored in DB
            matches = db.query(ChallengeUniversityMatch).filter(
                ChallengeUniversityMatch.challenge_id == ch_data["id"]
            ).order_by(ChallengeUniversityMatch.match_score.desc()).all()
            self.assertGreaterEqual(len(matches), 2)

            # Assert BAU is in the top-2 ranked shortlist
            top_2_uni_ids = [m.university_id for m in matches[:2]]
            self.assertIn(bau.id, top_2_uni_ids, f"BAU (id {bau.id}) must appear in top-2 shortlist: {top_2_uni_ids}")

            # Assert match_score is meaningfully higher than an unrelated university
            bau_match = next(m for m in matches if m.university_id == bau.id)
            lowest_match = matches[-1]
            self.assertGreater(bau_match.match_score, 85.0)
            self.assertGreater(
                bau_match.match_score - lowest_match.match_score,
                15.0,
                f"BAU match score ({bau_match.match_score}) should be >15 pts higher than lowest match ({lowest_match.match_score})"
            )

            # Assert match_reasons is non-empty and references real department/expertise tags
            factors = bau_match.match_reasons.get("factors", [])
            self.assertTrue(len(factors) > 0)
            all_factors_text = " ".join(factors)
            real_tags = ["Drought-Tolerant Millets", "Micro-Irrigation Systems", "Red Soil Fertility Optimization", "Sunita Kujur", "Agronomy"]
            matched_real_tags = [tag for tag in real_tags if tag.lower() in all_factors_text.lower()]
            self.assertTrue(
                len(matched_real_tags) > 0,
                f"Match reasons must reference at least one real department tag. Factors found: {factors}"
            )

            # Verify via API from BAU Coordinator perspective
            bau_login = self.client.post("/api/v1/auth/login", json={
                "email": "uni.bau@jh.gov.in",
                "password": "Pass@1234"
            })
            self.assertEqual(bau_login.status_code, 200)
            token = bau_login.json()["access_token"]
            inbox_resp = self.client.get("/api/v1/university/challenges", headers={"Authorization": f"Bearer {token}"})
            self.assertEqual(inbox_resp.status_code, 200)
            inbox_data = inbox_resp.json()
            inbox_items = inbox_data.get("matches", inbox_data) if isinstance(inbox_data, dict) else inbox_data
            matching_inbox_item = next(
                (item for item in inbox_items if item.get("challenge", {}).get("id") == ch_data["id"] or item.get("challenge", {}).get("title") == ch_data["title"]),
                None
            )
            self.assertIsNotNone(matching_inbox_item, "Challenge must appear in BAU Coordinator's inbox")
            self.assertGreaterEqual(matching_inbox_item["match_score"], 85.0)
        finally:
            db.close()

    def test_11_csr_matching_correctness(self):
        """TEST 2: CSR Matching Correctness
        - Seed/use industry partner with specific csr_focus_areas (e.g. water_resources)
        - Assert GET /api/v1/industry/csr-matches returns water_resources proposals ranked above unrelated categories (urban_development)
        """
        db = SessionLocal()
        try:
            # Login as Coal India CSR (csr_focus_areas: ["environment", "water_resources", "healthcare", "energy"])
            login_resp = self.client.post("/api/v1/auth/login", json={
                "email": "csr.coalindia@jh.gov.in",
                "password": "Pass@1234"
            })
            self.assertEqual(login_resp.status_code, 200)
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Ensure an active proposal in URBAN_DEVELOPMENT exists for clear contrast
            ch_urban = db.query(Challenge).filter(Challenge.category == ChallengeCategory.URBAN_DEVELOPMENT).first()
            uni_bit = db.query(University).filter(University.name.like("%Birla%")).first()
            team_urban = ProjectTeam(challenge_id=ch_urban.id, university_id=uni_bit.id, student_members=[])
            db.add(team_urban)
            db.commit()
            prop_urban = Proposal(
                project_team_id=team_urban.id,
                title="Municipal Asphalt Deterioration and Pothole GIS Mapping",
                summary="AI computer vision analytics for detecting roadway stress in urban municipality blocks.",
                status=ProposalStatus.SUBMITTED
            )
            db.add(prop_urban)
            db.commit()

            # Call CSR matching endpoint
            resp = self.client.get("/api/v1/industry/csr-matches", headers=headers)
            self.assertEqual(resp.status_code, 200)
            matches = resp.json()
            self.assertTrue(len(matches) >= 2)

            # Find water_resources proposal and urban_development proposal
            water_matches = [m for m in matches if m["category"] == "water_resources"]
            urban_matches = [m for m in matches if m["category"] == "urban_development"]
            self.assertTrue(len(water_matches) > 0, "Expected at least one water_resources proposal")
            self.assertTrue(len(urban_matches) > 0, "Expected at least one urban_development proposal")

            # Assert: water_resources proposals are ranked above urban_development proposals
            water_idx = matches.index(water_matches[0])
            urban_idx = matches.index(urban_matches[0])
            self.assertLess(
                water_idx,
                urban_idx,
                f"Water resources proposal (index {water_idx}) must rank above urban development proposal (index {urban_idx})"
            )
            self.assertGreater(
                water_matches[0]["csr_alignment_score"],
                urban_matches[0]["csr_alignment_score"],
                f"CSR alignment score for water ({water_matches[0]['csr_alignment_score']}) must exceed urban ({urban_matches[0]['csr_alignment_score']})"
            )
        finally:
            db.close()

    def test_12_ip_agreement_generation_all_templates(self):
        """TEST 3: IP Agreement Generation, All 3 Templates
        - POST /api/v1/industry/proposals/{id}/ip-agreement for public_good, joint_ownership, industry_led
        - Assert generated_document_url exists and is fetchable via GET
        - Assert generated PDF contains correct ownership text for each template
        - Assert generated PDF strictly excludes original_reporter_credit
        """
        db = SessionLocal()
        try:
            # Login as Tata Steel CSR
            login_resp = self.client.post("/api/v1/auth/login", json={
                "email": "csr.tatasteel@jh.gov.in",
                "password": "Pass@1234"
            })
            self.assertEqual(login_resp.status_code, 200)
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Create test challenge with explicit original_reporter_credit
            ts_seed = int(datetime.now().timestamp() * 1000)
            unique_reporter = f"Shri Somnath Munda, Gram Pradhan Angara Ward {ts_seed % 100}"
            test_ch = Challenge(
                title=f"Fluoride Adsorption Column for Rural Anganwadis {ts_seed}",
                description="Community drinking water purification unit for rural childcare centers.",
                category=ChallengeCategory.WATER_RESOURCES,
                ai_confidence_score=0.96,
                submitter_type=SubmitterType.CITIZEN,
                tracking_id=f"SS-IP-{ts_seed}",
                district_id=1,
                original_reporter_credit=unique_reporter,
                status=ChallengeStatus.IN_EXECUTION
            )
            db.add(test_ch)
            db.commit()

            uni_bit = db.query(University).filter(University.name.like("%Birla%")).first()
            team = ProjectTeam(challenge_id=test_ch.id, university_id=uni_bit.id, student_members=[])
            db.add(team)
            db.commit()

            prop = Proposal(
                project_team_id=team.id,
                title="Adsorption Fluoride Column Prototyping Testbed",
                summary="Field prototype testing of continuous fluoride extraction column.",
                status=ProposalStatus.ACCEPTED
            )
            db.add(prop)
            db.commit()

            templates_to_test = [
                ("public_good", ["public domain", "100% Open Public Good", "royalty-free"]),
                ("joint_ownership", ["co-owned equally", "50% University", "24 months"]),
                ("industry_led", ["reside primarily with the Industry", "80% Industry Partner", "inventorship credit"])
            ]

            for template_id, expected_phrases in templates_to_test:
                resp = self.client.post(
                    f"/api/v1/industry/proposals/{prop.id}/ip-agreement",
                    headers=headers,
                    json={
                        "template": template_id,
                        "custom_override": False
                    }
                )
                self.assertEqual(resp.status_code, 200, f"Failed generating {template_id} IP agreement")
                data = resp.json()
                doc_url = data.get("generated_document_url")
                self.assertIsNotNone(doc_url)
                self.assertTrue(doc_url.endswith(".pdf"))

                # 1. Assert fetchable via HTTP GET
                fetch_resp = self.client.get(doc_url)
                self.assertEqual(fetch_resp.status_code, 200, f"PDF {doc_url} not fetchable via HTTP")

                # 2. Assert file exists on disk
                local_rel = doc_url.replace("/uploads/", "")
                local_path = os.path.join(settings.UPLOAD_DIR, local_rel)
                self.assertTrue(os.path.exists(local_path), f"PDF file not found on disk at {local_path}")

                # 3. Read PDF text and assert correct template ownership clauses
                reader = PdfReader(local_path)
                full_text = " ".join([page.extract_text() or "" for page in reader.pages])
                self.assertTrue(len(full_text) > 100)

                matched_clause = any(phrase.lower() in full_text.lower() for phrase in expected_phrases)
                self.assertTrue(
                    matched_clause,
                    f"Template '{template_id}' PDF missing expected ownership language. Found text sample: {full_text[:300]}"
                )

                # 4. Critical assertion: original_reporter_credit must NOT be anywhere in the PDF
                self.assertNotIn(
                    unique_reporter,
                    full_text,
                    f"CRITICAL: original_reporter_credit '{unique_reporter}' was found in IP Agreement PDF text!"
                )
                self.assertNotIn("Somnath Munda", full_text)
        finally:
            db.close()

    def test_13_trust_score_computation(self):
        """TEST 4: Trust Score Computation
        - Call compute_trust_score directly with known milestone completion rates, delay days, and verified outcomes
        - Assert: computed_score matches expected value from documented formula:
          score = (0.45 * comp_rate) + (0.30 * (outcome_rating / 5.0 * 100.0)) - min(avg_delay * 2.5, 20.0) + 10.0
        - Assert: strict relative ordering holds (high performer scores strictly higher than moderate performer)
        """
        db = SessionLocal()
        try:
            ranchi = db.query(District).filter(District.name == "Ranchi").first()
            ts = int(datetime.now().timestamp() * 1000)

            # Create University A (High Performer: 10/10 milestones completed, 0 days delay, 2 verified outcomes)
            uni_high = University(
                name=f"Test High Performance Institute {ts}",
                district_id=ranchi.id,
                registration_status=RegistrationStatus.VERIFIED,
                profile_completeness_score=100.0
            )
            # Create University B (Moderate Performer: 8/10 completed, 2.4 days avg delay, 1 verified outcome)
            uni_mod = University(
                name=f"Test Moderate Performance Institute {ts}",
                district_id=ranchi.id,
                registration_status=RegistrationStatus.VERIFIED,
                profile_completeness_score=80.0
            )
            db.add_all([uni_high, uni_mod])
            db.commit()

            # Set up proposals & milestones for uni_high
            ch_high = Challenge(title="Ch High", description="Desc", category=ChallengeCategory.WATER_RESOURCES, tracking_id=f"SS-H-{ts}", district_id=ranchi.id)
            db.add(ch_high); db.commit()
            team_high = ProjectTeam(challenge_id=ch_high.id, university_id=uni_high.id, student_members=[])
            db.add(team_high); db.commit()
            prop_high = Proposal(project_team_id=team_high.id, title="Prop High", summary="Summary", status=ProposalStatus.ACCEPTED)
            db.add(prop_high); db.commit()

            now = datetime.now(timezone.utc)
            for i in range(10):
                m = ProjectMilestone(
                    proposal_id=prop_high.id,
                    title=f"M{i}",
                    description="Desc",
                    status=MilestoneStatus.COMPLETED,
                    due_date=now - timedelta(days=5),
                    completed_at=now - timedelta(days=5) # 0 delay
                )
                db.add(m)
            # 2 verified outcomes: outcome_rating = min(4.0 + 2*0.3, 5.0) = 4.6
            o1 = OutcomeRecord(proposal_id=prop_high.id, outcome_type=OutcomeType.PILOT_DEPLOYMENT, claim_description="Claim 1", verification_status=VerificationStatus.VERIFIED, is_public=False, verified_at=now)
            o2 = OutcomeRecord(proposal_id=prop_high.id, outcome_type=OutcomeType.FULL_DEPLOYMENT, claim_description="Claim 2", verification_status=VerificationStatus.VERIFIED, is_public=False, verified_at=now)
            db.add_all([o1, o2])
            db.commit()

            # Set up proposals & milestones for uni_mod (8 completed, 2 in progress, 2.4 days avg delay, 1 verified outcome)
            ch_mod = Challenge(title="Ch Mod", description="Desc", category=ChallengeCategory.AGRICULTURE, tracking_id=f"SS-M-{ts}", district_id=ranchi.id)
            db.add(ch_mod); db.commit()
            team_mod = ProjectTeam(challenge_id=ch_mod.id, university_id=uni_mod.id, student_members=[])
            db.add(team_mod); db.commit()
            prop_mod = Proposal(project_team_id=team_mod.id, title="Prop Mod", summary="Summary", status=ProposalStatus.ACCEPTED)
            db.add(prop_mod); db.commit()

            for i in range(8):
                m = ProjectMilestone(
                    proposal_id=prop_mod.id,
                    title=f"M{i}",
                    description="Desc",
                    status=MilestoneStatus.COMPLETED,
                    due_date=now - timedelta(days=10),
                    completed_at=now - timedelta(days=7) # 3 days delay each (8 * 3 = 24 total delay / 10 = 2.4 avg)
                )
                db.add(m)
            for i in range(8, 10):
                m = ProjectMilestone(
                    proposal_id=prop_mod.id,
                    title=f"M{i}",
                    description="Desc",
                    status=MilestoneStatus.IN_PROGRESS # 2 in-progress (not completed)
                )
                db.add(m)
            # 1 verified outcome: outcome_rating = min(4.0 + 1*0.3, 5.0) = 4.3
            o_mod = OutcomeRecord(proposal_id=prop_mod.id, outcome_type=OutcomeType.PILOT_DEPLOYMENT, claim_description="Claim Mod", verification_status=VerificationStatus.VERIFIED, is_public=False, verified_at=now)
            db.add(o_mod)
            db.commit()

            # Execute compute_trust_score directly
            score_high = compute_trust_score(TrustOwnerType.UNIVERSITY, uni_high.id, db)
            score_mod = compute_trust_score(TrustOwnerType.UNIVERSITY, uni_mod.id, db)

            # Assert expected values from formula:
            # High: comp_rate = 100%, avg_delay = 0, outcome_rating = 4.6
            # expected_high = (0.45 * 100) + (0.30 * (4.6 / 5.0 * 100)) - 0 + 10 = 45.0 + 27.6 + 10 = 82.6
            self.assertEqual(score_high.computed_score, 82.6)
            self.assertEqual(score_high.completion_rate, 100.0)
            self.assertEqual(score_high.avg_delivery_delay_days, 0.0)
            self.assertEqual(score_high.avg_outcome_rating, 4.6)

            # Mod: comp_rate = 80%, avg_delay = 2.4, outcome_rating = 4.3
            # expected_mod = (0.45 * 80) + (0.30 * (4.3 / 5.0 * 100)) - (2.4 * 2.5) + 10 = 36.0 + 25.8 - 6.0 + 10 = 65.8
            self.assertEqual(score_mod.computed_score, 65.8)
            self.assertEqual(score_mod.completion_rate, 80.0)
            self.assertEqual(score_mod.avg_delivery_delay_days, 2.4)
            self.assertEqual(score_mod.avg_outcome_rating, 4.3)

            # Assert strict relative ordering
            self.assertGreater(
                score_high.computed_score,
                score_mod.computed_score,
                "University with superior milestone completion, zero delays, and more outcomes must score strictly higher"
            )
        finally:
            db.close()

    def test_14_sla_escalation_and_rejection_notification(self):
        """TEST 5: SLA Escalation Actually Fires & Outcome Rejection Notification
        - Challenge with created_at > 48h in the past at ai_prescreened appears in GET /api/v1/admin/escalations with sla_breach_hours
        - Call PATCH /api/v1/admin/outcomes/{id}/verify with action=reject
        - Assert Notification is created for the submitting HEI in the rejection case
        """
        db = SessionLocal()
        try:
            # Login as Government Admin
            admin_login = self.client.post("/api/v1/auth/login", json={
                "email": "admin.sti@jh.gov.in",
                "password": "Pass@1234"
            })
            self.assertEqual(admin_login.status_code, 200)
            admin_token = admin_login.json()["access_token"]
            admin_headers = {"Authorization": f"Bearer {admin_token}"}

            # Part 1: Stale challenge older than 48 hours
            now = datetime.now(timezone.utc)
            stale_track_id = f"SS-SLA-{int(datetime.now().timestamp() * 1000)}"
            stale_ch = Challenge(
                title="Critical Mine Slurry Leakage into Subarnarekha River",
                description="Slurry pipeline leak contaminating river water across 4 panchayats.",
                category=ChallengeCategory.ENVIRONMENT,
                ai_confidence_score=0.95,
                submitter_type=SubmitterType.CITIZEN,
                tracking_id=stale_track_id,
                district_id=1,
                status=ChallengeStatus.AI_PRESCREENED,
                created_at=now - timedelta(hours=60) # 60 hours old (12 hours past SLA)
            )
            db.add(stale_ch)
            db.commit()

            # Check GET /api/v1/admin/escalations
            esc_resp = self.client.get("/api/v1/admin/escalations", headers=admin_headers)
            self.assertEqual(esc_resp.status_code, 200)
            escalations = esc_resp.json()
            stale_entry = next((e for e in escalations if e["tracking_id"] == stale_track_id), None)
            self.assertIsNotNone(stale_entry, f"Stale challenge {stale_track_id} must appear in escalations queue")
            self.assertGreaterEqual(stale_entry["sla_breach_hours"], 11.0)
            self.assertGreaterEqual(stale_entry["age_hours"], 59.0)

            # Part 2: Outcome Claim Rejection Notification
            uni_bit = db.query(University).filter(University.name.like("%Birla%")).first()
            uni_user = db.query(User).filter(User.organisation_id == uni_bit.id, User.role == UserRole.UNIVERSITY).first()
            self.assertIsNotNone(uni_user)

            team = ProjectTeam(challenge_id=stale_ch.id, university_id=uni_bit.id, student_members=[])
            db.add(team); db.commit()
            prop = Proposal(project_team_id=team.id, title="Subarnarekha Remediation Proposal", summary="Summary", status=ProposalStatus.ACCEPTED)
            db.add(prop); db.commit()

            outcome = OutcomeRecord(
                proposal_id=prop.id,
                outcome_type=OutcomeType.PILOT_DEPLOYMENT,
                claim_description="Pilot test claiming 90% sulfur reduction without full lab chromatography.",
                verification_status=VerificationStatus.PENDING
            )
            db.add(outcome)
            db.commit()

            # Reject outcome claim
            verify_resp = self.client.patch(
                f"/api/v1/admin/outcomes/{outcome.id}/verify?action=reject",
                headers=admin_headers
            )
            self.assertEqual(verify_resp.status_code, 200)
            self.assertEqual(verify_resp.json()["verification_status"], "rejected")

            # Assert Notification was created for the submitting university user
            rejection_notif = db.query(Notification).filter(
                Notification.recipient_user_id == uni_user.id,
                Notification.event_type == "OUTCOME_VERIFICATION_RESULT"
            ).order_by(Notification.created_at.desc()).first()
            self.assertIsNotNone(rejection_notif, "Rejection must generate an OUTCOME_VERIFICATION_RESULT notification")
            self.assertIn("REJECTED", rejection_notif.message, f"Notification message should state REJECTED: {rejection_notif.message}")
        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
