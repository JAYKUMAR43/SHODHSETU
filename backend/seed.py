"""
═══════════════════════════════════════════════════════════════════════════════
DISCLAIMER ON INSTITUTIONAL & CORPORATE NAMES (SIH 2026 Hackathon Demo):
The academic institutions (BIT Mesra, IIT ISM Dhanbad, NIT Jamshedpur, BAU Kanke,
etc.) and corporate organisations (Tata Steel CSR, Coal India CSR, SAIL Bokaro,
etc.) referenced in this seed script are illustrative names chosen strictly for
regional realism in this Smart India Hackathon (SIH 2026) demonstration for the
Government of Jharkhand. No formal endorsement, affiliation, or confirmed legal
partnership with these entities is implied.
═══════════════════════════════════════════════════════════════════════════════
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.core.database import SessionLocal, Base, engine
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    User, UserRole, District, University, RegistrationStatus, Department,
    DepartmentSource, FacultyProfile, IndustryPartner, IndustryPartnerType,
    TrustScore, TrustOwnerType, Challenge, ChallengeCategory, SubmitterType,
    ChallengeStatus, ChallengeUniversityMatch, MatchStatus, ProjectTeam,
    Proposal, ProposalStatus, IndustryEngagement, EngagementType,
    IPAgreement, IPTemplate, ProjectMilestone, MilestoneStatus, IndustryReviewStatus,
    OutcomeRecord, OutcomeType, VerificationStatus, Notification,
    SubmittedReport, PeriodType
)
from backend.app.services.pdf_service import generate_activity_report_pdf

def seed_database():
    print("Initializing clean database schema...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    now = datetime.now(timezone.utc)

    print("Seeding 3 Districts...")
    ranchi = District(name="Ranchi", state="Jharkhand")
    dhanbad = District(name="Dhanbad", state="Jharkhand")
    jamshedpur = District(name="East Singhbhum (Jamshedpur)", state="Jharkhand")
    db.add_all([ranchi, dhanbad, jamshedpur])
    db.commit()

    print("Seeding 6 Universities with Shodhganga/AISHE pre-bootstrapped expertise graphs...")
    # 1. BIT Mesra
    uni_bit = University(
        name="Birla Institute of Technology (BIT) Mesra",
        district_id=ranchi.id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=92.0
    )
    # 2. IIT (ISM) Dhanbad
    uni_ism = University(
        name="Indian Institute of Technology (ISM) Dhanbad",
        district_id=dhanbad.id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=95.0
    )
    # 3. NIT Jamshedpur
    uni_nit = University(
        name="National Institute of Technology (NIT) Jamshedpur",
        district_id=jamshedpur.id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=88.0
    )
    # 4. Ranchi University
    uni_ru = University(
        name="Ranchi University",
        district_id=ranchi.id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=75.0
    )
    # 5. Kolhan University
    uni_kolhan = University(
        name="Kolhan University (Chaibasa/Jamshedpur)",
        district_id=jamshedpur.id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=70.0
    )
    # 6. Birsa Agricultural University
    uni_bau = University(
        name="Birsa Agricultural University (BAU) Kanke",
        district_id=ranchi.id,
        registration_status=RegistrationStatus.VERIFIED,
        profile_completeness_score=90.0
    )
    db.add_all([uni_bit, uni_ism, uni_nit, uni_ru, uni_kolhan, uni_bau])
    db.commit()

    # Departments & Faculty for BIT Mesra
    d_bit_env = Department(
        university_id=uni_bit.id,
        name="Environmental Science & Engineering",
        discipline_tags=["Industrial Effluent Treatment", "Heavy Metal Soil Bioremediation", "GIS Watershed Hydrology", "Acid Mine Drainage"],
        source=DepartmentSource.SHODHGANGA_IMPORT
    )
    d_bit_ee = Department(
        university_id=uni_bit.id,
        name="Electrical & Electronics Engineering",
        discipline_tags=["Rural Solar Microgrids", "Smart Metering IoT", "Biomass Hybrid Generators"],
        source=DepartmentSource.SCHOLAR_IMPORT
    )
    d_bit_bio = Department(
        university_id=uni_bit.id,
        name="Bio-Engineering & Biotechnology",
        discipline_tags=["Plant Tissue Culture", "Lac & Tussar Quality Enhancement", "Indigenous Fermentation"],
        source=DepartmentSource.AISHE_IMPORT
    )
    db.add_all([d_bit_env, d_bit_ee, d_bit_bio])
    db.commit()

    f_bit_1 = FacultyProfile(
        department_id=d_bit_env.id,
        name="Dr. R. K. Sinha",
        expertise_tags=["Heavy Metal Adsorption", "Arsenic Removal", "Biochar Filters"],
        public_profile_url="https://scholar.google.com/citations?user=bit_rksinha",
        verified=True
    )
    f_bit_2 = FacultyProfile(
        department_id=d_bit_ee.id,
        name="Prof. S. P. Verma",
        expertise_tags=["Solar Inverters", "Microgrid Islanding Protection"],
        public_profile_url="https://scholar.google.com/citations?user=bit_spverma",
        verified=True
    )
    f_bit_3 = FacultyProfile(
        department_id=d_bit_bio.id,
        name="Dr. Alok Murmu",
        expertise_tags=["Tribal Agri-Produce Processing", "Silk Sericulture Genetics"],
        public_profile_url="https://scholar.google.com/citations?user=bit_amurmu",
        verified=True
    )
    db.add_all([f_bit_1, f_bit_2, f_bit_3])

    # Departments & Faculty for IIT ISM Dhanbad
    d_ism_mine = Department(
        university_id=uni_ism.id,
        name="Mining Machinery & Mineral Engineering",
        discipline_tags=["Coal Mine Dust Suppression", "Acid Mine Drainage Neutralization", "Overburden Stabilization"],
        source=DepartmentSource.SHODHGANGA_IMPORT
    )
    d_ism_env = Department(
        university_id=uni_ism.id,
        name="Environmental Engineering & Science",
        discipline_tags=["Fly Ash Utilization", "Groundwater Fluoride Remediation", "Air Quality Telemetry"],
        source=DepartmentSource.SCHOLAR_IMPORT
    )
    db.add_all([d_ism_mine, d_ism_env])
    db.commit()

    f_ism_1 = FacultyProfile(
        department_id=d_ism_mine.id,
        name="Prof. A. K. Patra",
        expertise_tags=["Respirable Dust Monitoring", "Mine Ventilation Optimization"],
        public_profile_url="https://scholar.google.com/citations?user=iit_akpatra",
        verified=True
    )
    f_ism_2 = FacultyProfile(
        department_id=d_ism_env.id,
        name="Dr. Sneha Bannerjee",
        expertise_tags=["Acid Drainage Geochemistry", "Fluoride Mitigation", "Constructed Wetlands"],
        public_profile_url="https://scholar.google.com/citations?user=iit_sbannerjee",
        verified=True
    )
    db.add_all([f_ism_1, f_ism_2])

    # Departments for BAU Kanke
    d_bau_agri = Department(
        university_id=uni_bau.id,
        name="Agronomy & Soil Science",
        discipline_tags=["Drought-Tolerant Millets", "Red Soil Fertility Optimization", "Micro-Irrigation Systems"],
        source=DepartmentSource.SHODHGANGA_IMPORT
    )
    db.add(d_bau_agri)
    db.commit()
    f_bau_1 = FacultyProfile(
        department_id=d_bau_agri.id,
        name="Dr. Sunita Kujur",
        expertise_tags=["Finger Millet Germplasm", "Organic Nitrogen Fixation"],
        public_profile_url="https://scholar.google.com/citations?user=bau_skujur",
        verified=True
    )
    db.add(f_bau_1)

    print("Seeding 5 Industry/CSR Partners...")
    ind_tata = IndustryPartner(
        name="Tata Steel Foundation & CSR",
        partner_type=IndustryPartnerType.LARGE_INDUSTRY,
        csr_focus_areas=["rural_livelihoods", "water_resources", "healthcare", "education", "environment"],
        district_id=jamshedpur.id,
        registration_status=RegistrationStatus.VERIFIED
    )
    ind_coal = IndustryPartner(
        name="Coal India Limited (BCCL / CCL) CSR",
        partner_type=IndustryPartnerType.LARGE_INDUSTRY,
        csr_focus_areas=["environment", "water_resources", "healthcare", "energy"],
        district_id=dhanbad.id,
        registration_status=RegistrationStatus.VERIFIED
    )
    ind_ucil = IndustryPartner(
        name="Uranium Corporation of India Limited (UCIL) CSR",
        partner_type=IndustryPartnerType.LARGE_INDUSTRY,
        csr_focus_areas=["healthcare", "water_resources", "environment"],
        district_id=jamshedpur.id,
        registration_status=RegistrationStatus.VERIFIED
    )
    ind_sail = IndustryPartner(
        name="Bokaro Steel Plant (SAIL) CSR",
        partner_type=IndustryPartnerType.LARGE_INDUSTRY,
        csr_focus_areas=["education", "urban_development", "energy"],
        district_id=ranchi.id,
        registration_status=RegistrationStatus.VERIFIED
    )
    ind_startup = IndustryPartner(
        name="Jharkhand Agrotech & Rural Innovation Labs",
        partner_type=IndustryPartnerType.STARTUP,
        csr_focus_areas=["agriculture", "rural_livelihoods", "accessibility"],
        district_id=ranchi.id,
        registration_status=RegistrationStatus.VERIFIED
    )
    db.add_all([ind_tata, ind_coal, ind_ucil, ind_sail, ind_startup])
    db.commit()

    print("Seeding Institutional Trust Scores...")
    for u in [uni_bit, uni_ism, uni_nit, uni_ru, uni_kolhan, uni_bau]:
        db.add(TrustScore(
            owner_type=TrustOwnerType.UNIVERSITY,
            owner_id=u.id,
            completion_rate=94.0,
            avg_delivery_delay_days=1.2,
            avg_outcome_rating=4.7,
            computed_score=89.5,
            last_computed_at=now
        ))
    for p in [ind_tata, ind_coal, ind_ucil, ind_sail, ind_startup]:
        db.add(TrustScore(
            owner_type=TrustOwnerType.INDUSTRY_PARTNER,
            owner_id=p.id,
            completion_rate=96.0,
            avg_delivery_delay_days=0.5,
            avg_outcome_rating=4.9,
            computed_score=93.0,
            last_computed_at=now
        ))
    db.commit()

    print("Seeding Platform Users across all 4 institutional roles...")
    pass_hash = get_password_hash("Pass@1234")

    user_uni_bit = User(
        name="Dr. Alok Murmu (BIT Coordinator)",
        email="uni.bit@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.UNIVERSITY,
        district_id=ranchi.id,
        organisation_id=uni_bit.id
    )
    user_uni_ism = User(
        name="Prof. A. K. Patra (IIT ISM Coordinator)",
        email="uni.ism@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.UNIVERSITY,
        district_id=dhanbad.id,
        organisation_id=uni_ism.id
    )
    user_uni_bau = User(
        name="Dr. Sunita Kujur (BAU Coordinator)",
        email="uni.bau@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.UNIVERSITY,
        district_id=ranchi.id,
        organisation_id=uni_bau.id
    )
    user_csr_tata = User(
        name="Vikram Sen (Tata Steel CSR Lead)",
        email="csr.tatasteel@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.INDUSTRY,
        district_id=jamshedpur.id,
        organisation_id=ind_tata.id
    )
    user_csr_coal = User(
        name="Rameshwar Singh (Coal India CSR Lead)",
        email="csr.coalindia@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.INDUSTRY,
        district_id=dhanbad.id,
        organisation_id=ind_coal.id
    )
    user_dvo_ranchi = User(
        name="P. K. Minz (District STI Nodal Officer, Ranchi)",
        email="dvo.ranchi@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.VALIDATION_OFFICER,
        district_id=ranchi.id
    )
    user_dvo_dhanbad = User(
        name="Sunil Marandi (District STI Nodal Officer, Dhanbad)",
        email="dvo.dhanbad@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.VALIDATION_OFFICER,
        district_id=dhanbad.id
    )
    user_dvo_jsr = User(
        name="Anita Soren (District STI Nodal Officer, East Singhbhum)",
        email="dvo.jamshedpur@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.VALIDATION_OFFICER,
        district_id=jamshedpur.id
    )
    user_admin = User(
        name="Dr. Amitabh Keshri (State STI Director & Admin)",
        email="admin.sti@jh.gov.in",
        password_hash=pass_hash,
        role=UserRole.GOVERNMENT
    )
    db.add_all([
        user_uni_bit, user_uni_ism, user_uni_bau, user_csr_tata, user_csr_coal,
        user_dvo_ranchi, user_dvo_dhanbad, user_dvo_jsr, user_admin
    ])
    db.commit()

    print("Seeding 28 realistic Challenges across all 10 categories and diverse statuses...")
    
    # 1. Arsenic/Fluoride challenge in Ranchi (validated -> in_research -> proposal_submitted -> in_execution)
    ch1 = Challenge(
        title="High Fluoride Contamination in Deep Borewells across Ratu Block",
        description="Community drinking water borewells in Ratu block (Ranchi) show alarming fluoride levels of 3.8 mg/L, leading to severe dental fluorosis and skeletal ailments in school children. Existing alum-based domestic filters clog within days due to high suspended iron content.",
        category=ChallengeCategory.WATER_RESOURCES,
        ai_confidence_score=0.96,
        submitter_type=SubmitterType.PRI,
        submitter_contact="mukhiya.ratu@jharkhand.gov.in",
        tracking_id="SS-1001",
        district_id=ranchi.id,
        latitude=23.385,
        longitude=85.221,
        photo_urls=["https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8"],
        ai_generated_brief="Structured Problem Brief: Endemic skeletal and dental fluorosis across Ratu block panchayats due to hard-rock basaltic aquifer leaching. Requires continuous low-cost adsorption filtration matrix compatible with intermittent rural power.",
        priority_score=92.0,
        original_reporter_credit="Gram Panchayat Ratu (Mukhiya Office)",
        status=ChallengeStatus.IN_EXECUTION,
        created_at=now - timedelta(days=25),
        validated_at=now - timedelta(days=24),
        validated_by_id=user_dvo_ranchi.id
    )
    db.add(ch1)
    db.commit()

    # Match and team for ch1
    m1 = ChallengeUniversityMatch(
        challenge_id=ch1.id,
        university_id=uni_bit.id,
        match_score=94.5,
        match_reasons={"factors": ["Direct Faculty match (Dr. R. K. Sinha - Biochar Filters)", "Local District Proximity", "Trust Score 89.5/100"]},
        status=MatchStatus.ACCEPTED
    )
    db.add(m1)
    db.commit()

    team1 = ProjectTeam(
        challenge_id=ch1.id,
        university_id=uni_bit.id,
        faculty_mentor_id=f_bit_1.id,
        student_members=[
            {"name": "Pooja Roy", "role": "Lead Researcher (M.Tech Env)", "email": "pooja.env@bitmesra.ac.in"},
            {"name": "Aman Toppo", "role": "Hardware Prototyping (B.Tech)", "email": "aman.t@bitmesra.ac.in"}
        ],
        formed_at=now - timedelta(days=20)
    )
    db.add(team1)
    db.commit()

    prop1 = Proposal(
        project_team_id=team1.id,
        title="Decentralized Modified Biochar-Alumina Continuous Gravity Fluoride Filter",
        summary="Engineering a low-cost, zero-electricity gravity column utilizing thermally treated local Sal (Shorea robusta) seed cake biochar doped with activated alumina. Targets flow rates of 500 L/hour with safe fluoride discharge below 1.0 mg/L.",
        status=ProposalStatus.ACCEPTED,
        submitted_at=now - timedelta(days=18)
    )
    db.add(prop1)
    db.commit()

    eng1 = IndustryEngagement(
        proposal_id=prop1.id,
        industry_partner_id=ind_tata.id,
        engagement_type=EngagementType.FUNDING,
        funding_amount=750000.0,
        notes="Tata Steel CSR Sanction for field testing across 12 anganwadi centers in Ratu block.",
        created_at=now - timedelta(days=15)
    )
    db.add(eng1)

    ip1 = IPAgreement(
        proposal_id=prop1.id,
        template=IPTemplate.PUBLIC_GOOD,
        custom_override=False,
        generated_document_url="/uploads/ip_agreements/IP_Agreement_1_public_good.pdf",
        created_at=now - timedelta(days=15)
    )
    db.add(ip1)

    mile1 = ProjectMilestone(
        proposal_id=prop1.id,
        title="Batch Adsorption Isotherm Validation",
        description="Verify fluoride uptake kinetics in laboratory water samples collected from 15 Ratu borewells.",
        due_date=now - timedelta(days=10),
        status=MilestoneStatus.COMPLETED,
        completed_at=now - timedelta(days=9),
        evidence_url="/uploads/evidence/ratu_batch_test.pdf",
        industry_review_status=IndustryReviewStatus.APPROVED,
        industry_feedback="Fluoride uptake kinetics rigorously verified in line with BIS 10500 potable water standards.",
        reviewed_by_id=user_csr_tata.id,
        reviewed_at=now - timedelta(days=8)
    )
    mile2 = ProjectMilestone(
        proposal_id=prop1.id,
        title="Anganwadi Community Pilot Fabrication",
        description="Deploy 5 pilot stainless gravity units in primary schools.",
        due_date=now - timedelta(days=3),
        status=MilestoneStatus.COMPLETED,
        completed_at=now - timedelta(days=3),
        evidence_url="/uploads/evidence/ratu_school_pilot_report.pdf",
        industry_review_status=IndustryReviewStatus.APPROVED,
        industry_feedback="Stainless steel gravity units inspected on site. Approved for public registry verification.",
        reviewed_by_id=user_csr_tata.id,
        reviewed_at=now - timedelta(days=2)
    )
    db.add_all([mile1, mile2])

    out1 = OutcomeRecord(
        proposal_id=prop1.id,
        outcome_type=OutcomeType.PILOT_DEPLOYMENT,
        claim_description="Functional 500 L/day community filtration unit operating continuously at Ratu Govt High School, bringing treated fluoride down from 3.8 mg/L to 0.72 mg/L.",
        supporting_document_url="/uploads/evidence/ratu_school_pilot_report.pdf",
        verification_status=VerificationStatus.VERIFIED,
        verified_by_id=user_admin.id,
        verified_at=now - timedelta(days=2),
        is_public=True
    )
    db.add(out1)
    db.commit()

    # 2. Acid Mine Drainage & Dust in Jharia, Dhanbad (Deployed / Full Outcome)
    ch2 = Challenge(
        title="Acid Mine Drainage and Coal Dust Deposition in Katras Aquifers",
        description="Open-cast coal seams and abandoned mine pits in Katras area discharge highly acidic effluent (pH 3.2) rich in dissolved iron and sulfates directly into local streams, contaminating paddy fields and livestock watering points.",
        category=ChallengeCategory.ENVIRONMENT,
        ai_confidence_score=0.94,
        submitter_type=SubmitterType.CITIZEN,
        submitter_contact="+91 94311 88201",
        tracking_id="SS-1002",
        district_id=dhanbad.id,
        latitude=23.801,
        longitude=86.304,
        photo_urls=["https://images.unsplash.com/photo-1611273426858-450d8e3c9fce"],
        ai_generated_brief="Structured Problem Brief: Severe acid mine drainage (AMD) with heavy metal toxicity degrading agrarian topsoil and surface water. Requires passive bioremediation alkaline wetland filter beds.",
        priority_score=89.0,
        original_reporter_credit="Mahato Community Water Committee, Katras",
        status=ChallengeStatus.DEPLOYED,
        created_at=now - timedelta(days=60),
        validated_at=now - timedelta(days=58),
        validated_by_id=user_dvo_dhanbad.id
    )
    db.add(ch2)
    db.commit()

    team2 = ProjectTeam(
        challenge_id=ch2.id,
        university_id=uni_ism.id,
        faculty_mentor_id=f_ism_2.id,
        student_members=[
            {"name": "Siddharth Verma", "role": "Geo-chemist", "email": "siddharth@iitism.ac.in"},
            {"name": "Nidhi Kumari", "role": "Environmental Engineer", "email": "nidhi@iitism.ac.in"}
        ],
        formed_at=now - timedelta(days=50)
    )
    db.add(team2)
    db.commit()

    prop2 = Proposal(
        project_team_id=team2.id,
        title="Passive Limestone-Biochar Constructed Wetland for Acid Mine Drainage",
        summary="Engineered anaerobic limestone drain (ALD) coupled with subsurface wetland vegetated with Typha latifolia to raise water pH from 3.2 to 7.1 and precipitate dissolved heavy metals.",
        status=ProposalStatus.ACCEPTED,
        submitted_at=now - timedelta(days=45)
    )
    db.add(prop2)
    db.commit()

    eng2 = IndustryEngagement(
        proposal_id=prop2.id,
        industry_partner_id=ind_coal.id,
        engagement_type=EngagementType.DEPLOYMENT,
        funding_amount=1200000.0,
        notes="Coal India CSR sponsorship under Green Mining Ecosystem Initiative.",
        created_at=now - timedelta(days=40)
    )
    db.add(eng2)

    mile2_1 = ProjectMilestone(
        proposal_id=prop2.id,
        title="Anaerobic Limestone Drain Pilot Sizing",
        description="Hydraulic retention time calibration and sulfate-reducing bacteria bed testing.",
        due_date=now - timedelta(days=25),
        status=MilestoneStatus.COMPLETED,
        completed_at=now - timedelta(days=24),
        evidence_url="/uploads/evidence/katras_ald_pilot.pdf",
        industry_review_status=IndustryReviewStatus.APPROVED,
        industry_feedback="Bed geometry and limestone purity specifications verified by CIL technical team.",
        reviewed_by_id=user_csr_coal.id,
        reviewed_at=now - timedelta(days=22)
    )
    mile2_2 = ProjectMilestone(
        proposal_id=prop2.id,
        title="Full Wetland Inflow & Bio-Monitoring Commissioning",
        description="2-acre constructed wetland commissioning and downstream irrigation bioassay.",
        due_date=now - timedelta(days=12),
        status=MilestoneStatus.COMPLETED,
        completed_at=now - timedelta(days=11),
        evidence_url="/uploads/evidence/katras_amd_full_deployment.pdf",
        industry_review_status=IndustryReviewStatus.APPROVED,
        industry_feedback="Effluent water quality meets CPCB General Discharge Standards. Fully approved.",
        reviewed_by_id=user_csr_coal.id,
        reviewed_at=now - timedelta(days=10)
    )
    db.add_all([mile2_1, mile2_2])

    out2 = OutcomeRecord(
        proposal_id=prop2.id,
        outcome_type=OutcomeType.FULL_DEPLOYMENT,
        claim_description="Full-scale 2-acre constructed wetland commissioned at Katras pithead, neutralizing 40,000 liters of AMD daily with safe water discharge for agricultural irrigation.",
        supporting_document_url="/uploads/evidence/katras_amd_full_deployment.pdf",
        verification_status=VerificationStatus.VERIFIED,
        verified_by_id=user_admin.id,
        verified_at=now - timedelta(days=10),
        is_public=True
    )
    db.add(out2)
    db.commit()

    # 3. Tussar Silk Cocoon Stifling & Preservation in Saraikela / Jamshedpur (Patent filed / Pending Outcome)
    ch3 = Challenge(
        title="Post-Harvest Spoilage and Energy-Intensive Boiling of Tussar Silk Cocoons",
        description="Tribal sericulture rearers in Kharsawan-Saraikela face up to 35% loss of wild Tussar cocoons during monsoon due to fungal mold. Traditional wood-fired boiling takes 4 hours per batch and damages silk tensile strength.",
        category=ChallengeCategory.RURAL_LIVELIHOODS,
        ai_confidence_score=0.91,
        submitter_type=SubmitterType.PRI,
        submitter_contact="sericulture.shg@jharkhand.in",
        tracking_id="SS-1003",
        district_id=jamshedpur.id,
        latitude=22.798,
        longitude=85.981,
        photo_urls=["https://images.unsplash.com/photo-1579783900882-c0d3dad7b119"],
        ai_generated_brief="Structured Problem Brief: Inefficient wood-fuel cocoon stifling degrading tensile properties of Jharkhand Antheraea mylitta silk. Requires solar thermal enzymatic vacuum processing chamber.",
        priority_score=86.0,
        original_reporter_credit="Saraikela Tussar Weavers Cooperative",
        status=ChallengeStatus.IN_RESEARCH,
        created_at=now - timedelta(days=35),
        validated_at=now - timedelta(days=34),
        validated_by_id=user_dvo_jsr.id
    )
    db.add(ch3)
    db.commit()

    team3 = ProjectTeam(
        challenge_id=ch3.id,
        university_id=uni_bit.id,
        faculty_mentor_id=f_bit_3.id,
        student_members=[
            {"name": "Anil Hansda", "role": "Biomaterials Tech", "email": "anil.h@bitmesra.ac.in"}
        ],
        formed_at=now - timedelta(days=30)
    )
    db.add(team3)
    db.commit()

    prop3 = Proposal(
        project_team_id=team3.id,
        title="Solar Parabolic Enzymatic Cocoon Softening Machine for Tribal Weavers",
        summary="A compact, solar-parabolic powered enzymatic softener reducing processing time from 4 hours to 45 minutes while improving unbroken filament length by 28%.",
        status=ProposalStatus.UNDER_INDUSTRY_REVIEW,
        submitted_at=now - timedelta(days=20)
    )
    db.add(prop3)
    db.commit()

    eng3 = IndustryEngagement(
        proposal_id=prop3.id,
        industry_partner_id=ind_tata.id,
        engagement_type=EngagementType.PROTOTYPING,
        funding_amount=350000.0,
        notes="Tata Steel CSR livelihood development grant for tribal silk sericulture clusters.",
        created_at=now - timedelta(days=18)
    )
    db.add(eng3)

    mile3_1 = ProjectMilestone(
        proposal_id=prop3.id,
        title="Solar Parabolic Thermal Concentrator Prototype Fabrication",
        description="Fabrication of dual-axis solar concentrator with food-grade stainless vessel.",
        due_date=now - timedelta(days=5),
        status=MilestoneStatus.COMPLETED,
        completed_at=now - timedelta(days=2),
        evidence_url="/uploads/evidence/solar_concentrator_cad_photos.pdf",
        industry_review_status=IndustryReviewStatus.PENDING_REVIEW
    )
    mile3_2 = ProjectMilestone(
        proposal_id=prop3.id,
        title="Enzymatic Softening Kinetics & Filament Tensile Testing",
        description="Sericin dissolution rate and unbroken filament tensile yield testing across 5 batches.",
        due_date=now - timedelta(days=1),
        status=MilestoneStatus.IN_PROGRESS,
        evidence_url="/uploads/evidence/silk_tensile_preliminary.pdf",
        industry_review_status=IndustryReviewStatus.REVISION_REQUESTED,
        industry_feedback="Please provide thermal stability measurements at 65°C across 3 batch runs before pilot signoff.",
        reviewed_by_id=user_csr_tata.id,
        reviewed_at=now - timedelta(days=1)
    )
    db.add_all([mile3_1, mile3_2])

    out3 = OutcomeRecord(
        proposal_id=prop3.id,
        outcome_type=OutcomeType.PATENT_FILED,
        claim_description="Indian Patent Application No. 20261109842 filed for 'Enzymatic Solar Softening Apparatus for Wild Silkworm Cocoons'.",
        supporting_document_url="/uploads/evidence/patent_application_silk.pdf",
        verification_status=VerificationStatus.PENDING,
        is_public=False
    )
    m3 = ChallengeUniversityMatch(
        challenge_id=ch3.id,
        university_id=uni_bit.id,
        match_score=91.0,
        match_reasons={"factors": ["Sericulture Biomaterials Faculty", "Jharkhand Silk Mission"]},
        status=MatchStatus.ACCEPTED
    )
    db.add_all([out3, m3])
    db.commit()

    # Step 1 Demo: Fresh Pending Match for BIT Mesra (Status: PENDING/SUGGESTED, No team, No proposal)
    ch_pending = Challenge(
        title="Microbial Contamination & Low pH in Acid Mine Drainage Runoff near Damodar Tributary",
        description="High sulfate and heavy metal runoff from abandoned opencast coal pits is leaching into drinking wells of four panchayats, turning water red and causing chronic gastrointestinal distress.",
        category=ChallengeCategory.ENVIRONMENT,
        ai_confidence_score=0.95,
        submitter_type=SubmitterType.PRI,
        submitter_contact="mukhiya.karkatta@jh.gov.in",
        tracking_id="SS-2099",
        district_id=ranchi.id,
        latitude=23.68,
        longitude=85.12,
        photo_urls=["https://images.unsplash.com/photo-1584467735815-f778f274e296"],
        ai_generated_brief="Structured Problem Brief: Severe acid mine drainage effluent (pH 3.4) requiring continuous sulfate-reducing bioreactor or constructed wetland mitigation.",
        priority_score=93.0,
        original_reporter_credit="Karkatta Gram Panchayat",
        status=ChallengeStatus.VALIDATED,
        created_at=now - timedelta(days=5),
        validated_at=now - timedelta(days=4),
        validated_by_id=user_dvo_ranchi.id
    )
    db.add(ch_pending)
    db.commit()

    m_pending = ChallengeUniversityMatch(
        challenge_id=ch_pending.id,
        university_id=uni_bit.id,
        match_score=96.2,
        match_reasons={"factors": ["Direct Faculty match (Dr. R. K. Sinha - Heavy Metal Bioremediation)", "Department Expertise: Environmental Sciences", "High Priority Score (93/100)"]},
        status=MatchStatus.SUGGESTED
    )
    db.add(m_pending)

    # Step 2 Demo: Accepted Match with NO team yet (Status: ACCEPTED, No team, No proposal)
    ch_accepted_no_team = Challenge(
        title="High Failure Rate of Rural Solar Microgrids due to Inverter Overheating in Bundu",
        description="Decentralized off-grid solar micro-grids in tribal villages trip persistently due to lack of smart temperature-throttling micro-controllers and battery equalization.",
        category=ChallengeCategory.ENERGY,
        ai_confidence_score=0.91,
        submitter_type=SubmitterType.CITIZEN,
        submitter_contact="bundu.energy@jh.gov.in",
        tracking_id="SS-2100",
        district_id=ranchi.id,
        latitude=23.18,
        longitude=85.58,
        photo_urls=["https://images.unsplash.com/photo-1509391365360-2e959784a276"],
        ai_generated_brief="Structured Problem Brief: Solar microgrid thermal shutdown in off-grid tribal hamlets; requires resilient IoT battery charge controller prototype.",
        priority_score=87.0,
        original_reporter_credit="Bundu Forest Village Energy Committee",
        status=ChallengeStatus.IN_RESEARCH,
        created_at=now - timedelta(days=8),
        validated_at=now - timedelta(days=7),
        validated_by_id=user_dvo_ranchi.id
    )
    db.add(ch_accepted_no_team)
    db.commit()

    m_accepted_no_team = ChallengeUniversityMatch(
        challenge_id=ch_accepted_no_team.id,
        university_id=uni_bit.id,
        match_score=89.4,
        match_reasons={"factors": ["Department Expertise: Electrical & Electronics", "Rural Microgrids Focus", "Local District Proximity"]},
        status=MatchStatus.ACCEPTED
    )
    db.add(m_accepted_no_team)

    # Fix 4 Demo: Challenge with INFO_REQUESTED (Clarification Pending, SLA Paused)
    ch_info = Challenge(
        title="Excess Iron Sludge and Turbidity in Angara Block Community Piped Supply",
        description="Newly commissioned rural tap water scheme dispenses reddish ferruginous water with visible particulate flakes. Villagers suspect pipeline corrosion or uncleaned intake filters.",
        category=ChallengeCategory.WATER_RESOURCES,
        ai_confidence_score=0.89,
        submitter_type=SubmitterType.CITIZEN,
        submitter_contact="9835012345",
        tracking_id="SS-3001",
        district_id=ranchi.id,
        latitude=23.41,
        longitude=85.52,
        photo_urls=["https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8"],
        voice_note_url="/uploads/audio/sample_citizen_voice.wav",
        ai_generated_brief="Structured Problem Brief: Pipeline iron sedimentation affecting piped drinking water network in Angara block.",
        priority_score=84.0,
        original_reporter_credit="Ramesh Munda (Angara Resident)",
        status=ChallengeStatus.INFO_REQUESTED,
        created_at=now - timedelta(hours=36),
        info_requested_at=now - timedelta(hours=14),
        info_request_message="Please specify if the reddish discoloration happens immediately upon opening taps or after sitting stagnant overnight, and whether households in tola 3 are also affected.",
        validated_by_id=user_dvo_ranchi.id
    )
    db.add(ch_info)
    db.commit()

    # 4. Intentionally Escalated Past-SLA Challenges (>48 hours in ai_prescreened) to populate escalations view
    ch_esc1 = Challenge(
        title="Unregulated Sand Mining Causing Bank Erosion along Subarnarekha River",
        description="Heavy mechanized sand lifting near Namkum ghats has diverted the river flow, eroding fertile arable land of 40 smallholder tribal families. Local village council complaints remain unresolved.",
        category=ChallengeCategory.ENVIRONMENT,
        ai_confidence_score=0.88,
        submitter_type=SubmitterType.CITIZEN,
        submitter_contact="9835123490",
        tracking_id="SS-4821",
        district_id=ranchi.id,
        latitude=23.324,
        longitude=85.390,
        photo_urls=["https://images.unsplash.com/photo-1509391365360-2e959784a276", "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce"],
        voice_note_url="/uploads/audio/sample_citizen_voice.wav",
        ai_generated_brief="Structured Problem Brief: Subarnarekha river bank erosion endangering riverine tribal farming clusters due to unmonitored aggregate extraction.",
        priority_score=82.0,
        original_reporter_credit="Subarnarekha Riparian Farmers Union",
        status=ChallengeStatus.AI_PRESCREENED,
        created_at=now - timedelta(hours=76) # >48 hours past SLA!
    )
    ch_esc2 = Challenge(
        title="Chronic Transformer Overload and Frequent Outages in Sindri Fertilizer Colony",
        description="Distribution transformers trip daily for 8-10 hours, disrupting municipal water supply and domestic electricity for over 2,000 residents during extreme summer.",
        category=ChallengeCategory.ENERGY,
        ai_confidence_score=0.92,
        submitter_type=SubmitterType.CITIZEN,
        submitter_contact="citizen.sindri@gmail.com",
        tracking_id="SS-4822",
        district_id=dhanbad.id,
        latitude=23.652,
        longitude=86.512,
        photo_urls=[],
        ai_generated_brief="Structured Problem Brief: Grid overload and thermal transformer breakdown in suburban industrial township.",
        priority_score=78.0,
        original_reporter_credit="Sindri Township Resident Welfare Association",
        status=ChallengeStatus.AI_PRESCREENED,
        created_at=now - timedelta(hours=54) # >48 hours past SLA!
    )
    db.add_all([ch_esc1, ch_esc2])

    # 5. Additional challenges across all categories to bring total to 28
    more_challenges = [
        # Agriculture
        ("Severe Fall Armyworm Infestation in Maize Crops across Bero Block",
         "Fall armyworm has attacked 150 hectares of hybrid maize in Bero. Chemical insecticides are proving ineffective and costly for marginal farmers.",
         ChallengeCategory.AGRICULTURE, ranchi.id, SubmitterType.PRI, ChallengeStatus.VALIDATED, 85.0),
        
        ("Lack of Cold Storage for Tomato Surplus Leading to Distress Selling in Ormanjhi",
         "Farmers in Ormanjhi are forced to sell tomatoes at Rs 2/kg due to absence of solar-powered localized cold rooms, dumping metric tons on the highway.",
         ChallengeCategory.AGRICULTURE, ranchi.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 80.0),

        # Healthcare
        ("High Incidence of Sickle Cell Anemia and Lack of Point-of-Care Diagnostics in Potka",
         "Primary health centers lack rapid electrophoretic testing kits for sickle cell trait detection in tribal adolescents, causing delayed pediatric care.",
         ChallengeCategory.HEALTHCARE, jamshedpur.id, SubmitterType.GOVT_DEPT, ChallengeStatus.VALIDATED, 94.0),

        ("Malnutrition among Under-5 Children in Remote Tundi Anganwadi Centers",
         "Over 42% children in Tundi block suffer from severe acute malnutrition. Supplementary nutrition supply chains face storage spoilage in humid months.",
         ChallengeCategory.HEALTHCARE, dhanbad.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 88.0),

        # Education
        ("Absence of Vernacular Santhali and Mundari Digital Learning Content in Primary Schools",
         "Tribal students in rural East Singhbhum face language barriers in foundational numeracy and literacy as state textbooks are solely in Hindi.",
         ChallengeCategory.EDUCATION, jamshedpur.id, SubmitterType.PRI, ChallengeStatus.IN_RESEARCH, 81.0),

        ("Lack of Hands-on Science Kits and Labs in 28 Kasturba Gandhi Balika Vidyalayas",
         "Secondary school girls have no access to basic physics and chemistry apparatus, limiting STEM participation and college enrollment.",
         ChallengeCategory.EDUCATION, ranchi.id, SubmitterType.GOVT_DEPT, ChallengeStatus.VALIDATED, 79.0),

        # Water Resources
        ("Seasonal Drying of Chotanagpur Hill Streams Disrupting Rabi Cropping",
         "Traditional water channels dry out by January, forcing 90% agricultural workforce into seasonal distress migration to brick kilns.",
         ChallengeCategory.WATER_RESOURCES, ranchi.id, SubmitterType.PRI, ChallengeStatus.IN_RESEARCH, 91.0),

        ("Bacterial Contamination in Hand Pumps near Open Drain Basins in Govindpur",
         "High coliform counts detected in drinking water hand pumps within 20 meters of untreated township sewage drains.",
         ChallengeCategory.WATER_RESOURCES, dhanbad.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 87.0),

        # Energy
        ("Solar Mini-Grid Inverter Breakdowns in Off-Grid Forest Villages of Bundu",
         "Decentralized solar micro-grids installed 3 years ago are defunct due to unserviceable electronic boards and lead-acid battery degradation.",
         ChallengeCategory.ENERGY, ranchi.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 77.0),

        ("High Biogas Digester Failure in Dairy Cooperatives due to Winter Temperature Drops",
         "Biogas slurry fermentation halts during December-January cold nights when temperatures in Kanke drop below 8 degrees Celsius.",
         ChallengeCategory.ENERGY, ranchi.id, SubmitterType.CITIZEN, ChallengeStatus.VALIDATED, 75.0),

        # Urban Development
        ("Unregulated Plastic Waste Dumps Clogging Subarnarekha Tributaries in Mango Area",
         "Single-use plastics and packaging foam from commercial markets block natural stormwater channels, causing urban inundation.",
         ChallengeCategory.URBAN_DEVELOPMENT, jamshedpur.id, SubmitterType.ULB, ChallengeStatus.VALIDATED, 73.0),

        ("Defective Traffic Signal Optimization at Major Dhanbad Railway Junction Crossings",
         "Severe bottleneck delays ambulances and coal trucks at Bank More intersection due to non-adaptive fixed timer signals.",
         ChallengeCategory.URBAN_DEVELOPMENT, dhanbad.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 68.0),

        # Accessibility
        ("Lack of Wheelchair-Accessible Ramps and Tactile Paving in Government Collectorate Offices",
         "Divyangjan and elderly pension applicants face steep staircases without handrails or auditory signage across district administrative blocks.",
         ChallengeCategory.ACCESSIBILITY, ranchi.id, SubmitterType.CITIZEN, ChallengeStatus.VALIDATED, 80.0),

        ("High Cost of Braille Textbooks and Audio Learning Devices for Visually Impaired Students",
         "Special educators in Jamshedpur lack low-cost refreshable electronic Braille readers, restricting visually impaired students to obsolete paper prints.",
         ChallengeCategory.ACCESSIBILITY, jamshedpur.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 76.0),

        # Public Administration
        ("Delayed DBT Pension and Ration Authentication Failures due to Biometric Mismatch for Senior Citizens",
         "Elderly manual laborers with worn fingerprints face repeated biometric rejection at Fair Price Shops in Nirsa block.",
         ChallengeCategory.PUBLIC_ADMINISTRATION, dhanbad.id, SubmitterType.PRI, ChallengeStatus.VALIDATED, 84.0),

        ("Inefficient Manual Land Record Mutation and Delayed Boundary Demarcations in Circle Offices",
         "Tribal ancestral tenancy land mutations remain pending for over 180 days due to lack of digital GIS cadastral map verification.",
         ChallengeCategory.PUBLIC_ADMINISTRATION, ranchi.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 75.0),

        # Rural Livelihoods
        ("Insect Borer Damage and Lac Parasitoid Attacks on Kusum Trees in Khunti Border",
         "Lac cultivators suffer 40% loss of Broodlac from predatory moths and climatic shifts, drastically lowering seasonal household income.",
         ChallengeCategory.RURAL_LIVELIHOODS, ranchi.id, SubmitterType.PRI, ChallengeStatus.VALIDATED, 87.0),

        ("Absence of Mechanized Processing for Mahua Flower Spirit and Value-Added Confectionery",
         "Forest dwellers sell raw dried Mahua flowers to middlemen for Rs 25/kg instead of processing food-grade syrup or pectin.",
         ChallengeCategory.RURAL_LIVELIHOODS, jamshedpur.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 81.0),

        # Additional variety
        ("High Fly Ash Dispersion from Thermal Captive Power Units Coating Mango Orchards",
         "Airborne particulate matter settling on fruit trees reduces yield by 60% in adjoining villages within 3km of the chimney stack.",
         ChallengeCategory.ENVIRONMENT, dhanbad.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 83.0),

        ("Non-Functional Solar Water Treatment Units in 14 Scheduled Caste Tolas",
         "UV water purifiers powered by photovoltaic panels have burnt inverter fuses, forcing women to drink from unprotected open wells.",
         ChallengeCategory.WATER_RESOURCES, jamshedpur.id, SubmitterType.PRI, ChallengeStatus.PENDING_VALIDATION, 84.0),

        ("Low Germination Rate of Hybrid Rice in Acidic Soils of Dalma Foothills",
         "High soil acidity (pH 4.8) locks phosphorus availability, stunting root development in high-yielding paddy varieties.",
         ChallengeCategory.AGRICULTURE, jamshedpur.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 78.0),

        ("Disposal of Electronic Waste from Coal Mining Telemetry and Sub-stations",
         "Old batteries, PCBs, and sensing transmitters are dumped in abandoned open trenches without specialized metallurgical recovery.",
         ChallengeCategory.ENVIRONMENT, dhanbad.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 72.0),

        ("Severe Pothole Damage and Heavy Truck Congestion on Ranchi Ring Road Phase 2",
         "Major craters on the arterial bypass road have caused multiple accidents involving two-wheelers and local vegetable vendors.",
         ChallengeCategory.URBAN_DEVELOPMENT, ranchi.id, SubmitterType.CITIZEN, ChallengeStatus.AI_PRESCREENED, 69.0)
    ]

    base_track_num = 2001
    for title, desc, cat, dist_id, sub_type, status, priority in more_challenges:
        reporter_credit = "Gram Panchayat Representative" if sub_type in [SubmitterType.PRI, SubmitterType.ULB] else "Citizen Field Reporter"
        ch = Challenge(
            title=title,
            description=desc,
            category=cat,
            ai_confidence_score=0.90,
            submitter_type=sub_type,
            tracking_id=f"SS-{base_track_num}",
            district_id=dist_id,
            priority_score=priority,
            original_reporter_credit=reporter_credit,
            status=status,
            ai_generated_brief=f"Structured Problem Brief: Societal priority challenge in {cat.value} requiring applied research intervention.",
            created_at=now - timedelta(days=random_int(1, 18), hours=random_int(1, 23))
        )
        if status in [ChallengeStatus.VALIDATED, ChallengeStatus.IN_RESEARCH]:
            ch.validated_at = ch.created_at + timedelta(hours=6)
            ch.validated_by_id = user_dvo_ranchi.id if dist_id == ranchi.id else (user_dvo_dhanbad.id if dist_id == dhanbad.id else user_dvo_jsr.id)

        db.add(ch)
        base_track_num += 1

    db.commit()

    # Seed Notifications for users
    notif1 = Notification(
        recipient_user_id=user_uni_bit.id,
        event_type="NEW_MATCH",
        message="New challenge matched: 'High Fluoride Contamination in Deep Borewells across Ratu Block' (Match score: 94.5%).",
        read=False,
        created_at=now - timedelta(hours=3)
    )
    notif2 = Notification(
        recipient_user_id=user_csr_tata.id,
        event_type="CSR_ALIGNMENT",
        message="New project proposal in Water Resources aligns 92% with your CSR focus area.",
        read=False,
        created_at=now - timedelta(hours=5)
    )
    notif3 = Notification(
        recipient_user_id=user_dvo_ranchi.id,
        event_type="SLA_WARNING",
        message="2 challenges in Ranchi district have exceeded 48-hour validation SLA threshold.",
        read=False,
        created_at=now - timedelta(hours=1)
    )
    db.add_all([notif1, notif2, notif3])
    db.commit()

    print("Seeding initial submitted reports with full attribution across 4 panels...")
    url_uni = generate_activity_report_pdf(
        role="university",
        user_name=user_uni_bit.name,
        org_name=uni_bit.name,
        period="weekly",
        metrics={
            "ai_curated_matches_received": 5,
            "active_interdisciplinary_teams": 3,
            "research_proposals_submitted": 2,
            "institutional_trust_score": "92.0% Completeness"
        }
    )
    rep_uni = SubmittedReport(
        generated_by_user_id=user_uni_bit.id,
        generated_by_name=f"{user_uni_bit.name} ({uni_bit.name})",
        generated_by_role=UserRole.UNIVERSITY,
        period_type=PeriodType.WEEKLY,
        period_start=now - timedelta(days=7),
        period_end=now,
        file_url=url_uni,
        generated_at=now - timedelta(days=1)
    )

    url_ind = generate_activity_report_pdf(
        role="industry",
        user_name=user_csr_tata.name,
        org_name=ind_tata.name,
        period="monthly",
        metrics={
            "csr_proposals_evaluated": 6,
            "active_co_funding_engagements": 2,
            "total_csr_capital_committed_inr": "Rs. 4,500,000.00",
            "ip_compliance_rating": "State Approved (Schedule VII CSR)"
        }
    )
    rep_ind = SubmittedReport(
        generated_by_user_id=user_csr_tata.id,
        generated_by_name=f"{user_csr_tata.name} ({ind_tata.name})",
        generated_by_role=UserRole.INDUSTRY,
        period_type=PeriodType.MONTHLY,
        period_start=now - timedelta(days=30),
        period_end=now,
        file_url=url_ind,
        generated_at=now - timedelta(days=2)
    )

    url_dvo = generate_activity_report_pdf(
        role="validation_officer",
        user_name=user_dvo_jsr.name,
        org_name="District STI Nodal Office (East Singhbhum)",
        period="weekly",
        metrics={
            "district_submissions_logged": 12,
            "completed_field_validations": 9,
            "active_in_validation_queue": 2,
            "district_sla_adherence_rate": "96.4%"
        }
    )
    rep_dvo = SubmittedReport(
        generated_by_user_id=user_dvo_jsr.id,
        generated_by_name=f"{user_dvo_jsr.name} (District STI Nodal Office, East Singhbhum)",
        generated_by_role=UserRole.VALIDATION_OFFICER,
        period_type=PeriodType.WEEKLY,
        period_start=now - timedelta(days=7),
        period_end=now,
        file_url=url_dvo,
        generated_at=now - timedelta(hours=14)
    )

    url_gov = generate_activity_report_pdf(
        role="government",
        user_name=user_admin.name,
        org_name="Department of Higher and Technical Education",
        period="monthly",
        metrics={
            "total_citizen_submissions": 28,
            "district_validated_challenges": 18,
            "participating_universities": 6,
            "corporate_industry_partners": 5,
            "verified_field_outcomes": 2,
            "state_sti_audit_status": "Compliant (Grade A)"
        }
    )
    rep_gov = SubmittedReport(
        generated_by_user_id=user_admin.id,
        generated_by_name=f"{user_admin.name} (Department of Higher & Technical Education)",
        generated_by_role=UserRole.GOVERNMENT,
        period_type=PeriodType.MONTHLY,
        period_start=now - timedelta(days=30),
        period_end=now,
        file_url=url_gov,
        generated_at=now - timedelta(hours=4)
    )
    db.add_all([rep_uni, rep_ind, rep_dvo, rep_gov])
    db.commit()

    print("==================================================================")
    print("Database seeding completed successfully!")
    print(f"Districts: 3 (Ranchi, Dhanbad, East Singhbhum/Jamshedpur)")
    print(f"Universities: 6 (with BIT Mesra, IIT ISM Dhanbad, BAU Kanke pre-bootstrapped)")
    print(f"Industry Partners: 5 (Tata Steel, Coal India, UCIL, SAIL, Agrotech)")
    print(f"Users seeded with password: 'Pass@1234'")
    print(f"  - University:        uni.bit@jh.gov.in / uni.ism@jh.gov.in")
    print(f"  - Industry / CSR:    csr.tatasteel@jh.gov.in / csr.coalindia@jh.gov.in")
    print(f"  - Validation Officer: dvo.ranchi@jh.gov.in / dvo.dhanbad@jh.gov.in")
    print(f"  - Government Admin:  admin.sti@jh.gov.in")
    print(f"Challenges seeded: 28 total (covering all 10 categories, various statuses, 2 past-SLA escalations)")
    print(f"Outcome Records: Verified community pilots & full deployments with IP agreements")
    print("==================================================================")

def random_int(a, b):
    import random
    return random.randint(a, b)

if __name__ == "__main__":
    seed_database()
