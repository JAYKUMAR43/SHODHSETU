from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
import enum
from backend.app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

# ----------------- ENUMS -----------------

class UserRole(str, enum.Enum):
    UNIVERSITY = "university"
    INDUSTRY = "industry"
    VALIDATION_OFFICER = "validation_officer"
    GOVERNMENT = "government"

class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"

class DepartmentSource(str, enum.Enum):
    SHODHGANGA_IMPORT = "shodhganga_import"
    SCHOLAR_IMPORT = "scholar_import"
    AISHE_IMPORT = "aishe_import"
    MANUAL_REVIEW = "manual_review"
    AUTO_LEARNED = "auto_learned"

class IndustryPartnerType(str, enum.Enum):
    STARTUP = "startup"
    MSME = "msme"
    LARGE_INDUSTRY = "large_industry"
    CSR_UNIT = "csr_unit"
    RESEARCH_LAB = "research_lab"

class TrustOwnerType(str, enum.Enum):
    UNIVERSITY = "university"
    INDUSTRY_PARTNER = "industry_partner"

class ChallengeCategory(str, enum.Enum):
    EDUCATION = "education"
    AGRICULTURE = "agriculture"
    HEALTHCARE = "healthcare"
    WATER_RESOURCES = "water_resources"
    ENVIRONMENT = "environment"
    ENERGY = "energy"
    URBAN_DEVELOPMENT = "urban_development"
    ACCESSIBILITY = "accessibility"
    PUBLIC_ADMINISTRATION = "public_administration"
    RURAL_LIVELIHOODS = "rural_livelihoods"

class SubmitterType(str, enum.Enum):
    CITIZEN = "citizen"
    PRI = "pri"
    ULB = "ulb"
    GOVT_DEPT = "govt_dept"

class ChallengeStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    AI_PRESCREENED = "ai_prescreened"
    PENDING_VALIDATION = "pending_validation"
    INFO_REQUESTED = "info_requested"
    VALIDATED = "validated"
    AWAITING_ROUTING = "awaiting_routing"
    REJECTED = "rejected"
    ROUTED = "routed"
    IN_RESEARCH = "in_research"
    PROPOSAL_SUBMITTED = "proposal_submitted"
    IN_EXECUTION = "in_execution"
    DEPLOYED = "deployed"
    CLOSED = "closed"

class MatchStatus(str, enum.Enum):
    SUGGESTED = "suggested"
    ACCEPTED = "accepted"
    DECLINED = "declined"

class ProposalStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_INDUSTRY_REVIEW = "under_industry_review"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class EngagementType(str, enum.Enum):
    MENTORSHIP = "mentorship"
    FUNDING = "funding"
    PROTOTYPING = "prototyping"
    TESTING = "testing"
    DEPLOYMENT = "deployment"
    TECH_TRANSFER = "tech_transfer"

class IPTemplate(str, enum.Enum):
    PUBLIC_GOOD = "public_good"
    JOINT_OWNERSHIP = "joint_ownership"
    INDUSTRY_LED = "industry_led"

class MilestoneStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class IndustryReviewStatus(str, enum.Enum):
    NOT_SUBMITTED = "not_submitted"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REVISION_REQUESTED = "revision_requested"

class OutcomeType(str, enum.Enum):
    PROTOTYPE = "prototype"
    PILOT_DEPLOYMENT = "pilot_deployment"
    FULL_DEPLOYMENT = "full_deployment"
    PATENT_FILED = "patent_filed"
    PATENT_GRANTED = "patent_granted"
    STARTUP_CREATED = "startup_created"

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"

class CitizenConfirmationStatus(str, enum.Enum):
    NOT_REQUESTED = "not_requested"
    PENDING = "pending"
    CONFIRMED_WORKING = "confirmed_working"
    DISPUTED = "disputed"

class SystemicPatternStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    DISMISSED = "dismissed"

# ----------------- MODELS -----------------

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    state = Column(String(100), default="Jharkhand")

    users = relationship("User", back_populates="district")
    universities = relationship("University", back_populates="district")
    industry_partners = relationship("IndustryPartner", back_populates="district")
    challenges = relationship("Challenge", back_populates="district")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    organisation_id = Column(Integer, nullable=True) # University ID or IndustryPartner ID
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    district = relationship("District", back_populates="users")
    validated_challenges = relationship("Challenge", back_populates="validated_by", foreign_keys="Challenge.validated_by_id")
    verified_outcomes = relationship("OutcomeRecord", back_populates="verified_by", foreign_keys="OutcomeRecord.verified_by_id")
    notifications = relationship("Notification", back_populates="recipient_user")


class University(Base):
    __tablename__ = "universities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    registration_status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.VERIFIED)
    profile_completeness_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utcnow)

    district = relationship("District", back_populates="universities")
    departments = relationship("Department", back_populates="university", cascade="all, delete-orphan")
    matches = relationship("ChallengeUniversityMatch", back_populates="university")
    teams = relationship("ProjectTeam", back_populates="university")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    name = Column(String(150), nullable=False)
    discipline_tags = Column(JSON, default=list) # e.g. ["Hydrology", "Soil Remediation"]
    source = Column(SQLEnum(DepartmentSource), default=DepartmentSource.SHODHGANGA_IMPORT)
    last_updated = Column(DateTime, default=utcnow, onupdate=utcnow)

    university = relationship("University", back_populates="departments")
    faculty_profiles = relationship("FacultyProfile", back_populates="department", cascade="all, delete-orphan")


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String(150), nullable=False)
    expertise_tags = Column(JSON, default=list)
    public_profile_url = Column(String(300), nullable=True)
    verified = Column(Boolean, default=False)

    department = relationship("Department", back_populates="faculty_profiles")
    mentored_teams = relationship("ProjectTeam", back_populates="faculty_mentor")


class IndustryPartner(Base):
    __tablename__ = "industry_partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, unique=True)
    partner_type = Column(SQLEnum(IndustryPartnerType), default=IndustryPartnerType.LARGE_INDUSTRY)
    csr_focus_areas = Column(JSON, default=list) # e.g. ["rural_livelihoods", "water_resources"]
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    registration_status = Column(SQLEnum(RegistrationStatus), default=RegistrationStatus.VERIFIED)
    created_at = Column(DateTime, default=utcnow)

    district = relationship("District", back_populates="industry_partners")
    engagements = relationship("IndustryEngagement", back_populates="industry_partner")


class TrustScore(Base):
    __tablename__ = "trust_scores"

    id = Column(Integer, primary_key=True, index=True)
    owner_type = Column(SQLEnum(TrustOwnerType), nullable=False)
    owner_id = Column(Integer, nullable=False) # Polymorphic reference
    completion_rate = Column(Float, default=100.0) # 0-100%
    avg_delivery_delay_days = Column(Float, default=0.0)
    avg_outcome_rating = Column(Float, default=4.5) # 1.0 - 5.0
    computed_score = Column(Float, default=85.0) # 0-100
    last_computed_at = Column(DateTime, default=utcnow)


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(SQLEnum(ChallengeCategory), nullable=False)
    ai_confidence_score = Column(Float, default=0.0)
    submitter_type = Column(SQLEnum(SubmitterType), default=SubmitterType.CITIZEN)
    submitter_contact = Column(String(100), nullable=True) # Phone or email
    tracking_id = Column(String(50), unique=True, index=True, nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    photo_urls = Column(JSON, default=list)
    video_url = Column(String(300), nullable=True)
    voice_note_url = Column(String(300), nullable=True)
    ai_generated_brief = Column(Text, nullable=True)
    duplicate_of_id = Column(Integer, ForeignKey("challenges.id"), nullable=True)
    duplicate_count = Column(Integer, default=0)
    priority_score = Column(Float, default=50.0) # 0-100
    original_reporter_credit = Column(String(150), default="Anonymous Citizen Reporter", nullable=True)
    status = Column(SQLEnum(ChallengeStatus, values_callable=lambda obj: [e.value for e in obj]), default=ChallengeStatus.SUBMITTED)
    created_at = Column(DateTime, default=utcnow)
    validated_at = Column(DateTime, nullable=True)
    validated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    info_requested_at = Column(DateTime, nullable=True)
    info_request_message = Column(Text, nullable=True)
    citizen_response_text = Column(Text, nullable=True)
    citizen_response_photo_url = Column(String(300), nullable=True)
    citizen_responded_at = Column(DateTime, nullable=True)
    related_outcome_id = Column(Integer, ForeignKey("outcome_records.id"), nullable=True)

    district = relationship("District", back_populates="challenges")
    validated_by = relationship("User", foreign_keys=[validated_by_id], back_populates="validated_challenges")
    duplicates = relationship("Challenge", remote_side=[duplicate_of_id])
    matches = relationship("ChallengeUniversityMatch", back_populates="challenge")
    teams = relationship("ProjectTeam", back_populates="challenge")
    related_outcome = relationship("OutcomeRecord", foreign_keys=[related_outcome_id], back_populates="reported_issues")


class ChallengeUniversityMatch(Base):
    __tablename__ = "challenge_university_matches"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    match_score = Column(Float, default=0.0) # 0-100
    match_reasons = Column(JSON, default=dict)
    status = Column(SQLEnum(MatchStatus), default=MatchStatus.SUGGESTED)
    created_at = Column(DateTime, default=utcnow)

    challenge = relationship("Challenge", back_populates="matches")
    university = relationship("University", back_populates="matches")


class ProjectTeam(Base):
    __tablename__ = "project_teams"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    faculty_mentor_id = Column(Integer, ForeignKey("faculty_profiles.id"), nullable=True)
    student_members = Column(JSON, default=list) # list of {"name": str, "role": str, "email": str}
    formed_at = Column(DateTime, default=utcnow)

    challenge = relationship("Challenge", back_populates="teams")
    university = relationship("University", back_populates="teams")
    faculty_mentor = relationship("FacultyProfile", back_populates="mentored_teams")
    proposals = relationship("Proposal", back_populates="project_team")


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(Integer, primary_key=True, index=True)
    project_team_id = Column(Integer, ForeignKey("project_teams.id"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    submitted_at = Column(DateTime, default=utcnow)
    status = Column(SQLEnum(ProposalStatus), default=ProposalStatus.SUBMITTED)

    project_team = relationship("ProjectTeam", back_populates="proposals")
    engagements = relationship("IndustryEngagement", back_populates="proposal")
    ip_agreements = relationship("IPAgreement", back_populates="proposal")
    milestones = relationship("ProjectMilestone", back_populates="proposal")
    outcomes = relationship("OutcomeRecord", back_populates="proposal")


class IndustryEngagement(Base):
    __tablename__ = "industry_engagements"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    industry_partner_id = Column(Integer, ForeignKey("industry_partners.id"), nullable=False)
    engagement_type = Column(SQLEnum(EngagementType), default=EngagementType.MENTORSHIP)
    funding_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    proposal = relationship("Proposal", back_populates="engagements")
    industry_partner = relationship("IndustryPartner", back_populates="engagements")


class IPAgreement(Base):
    __tablename__ = "ip_agreements"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    template = Column(SQLEnum(IPTemplate), default=IPTemplate.PUBLIC_GOOD)
    custom_override = Column(Boolean, default=False)
    custom_terms_document_url = Column(String(300), nullable=True)
    generated_document_url = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    proposal = relationship("Proposal", back_populates="ip_agreements")


class ProjectMilestone(Base):
    __tablename__ = "project_milestones"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(MilestoneStatus), default=MilestoneStatus.PENDING)
    completed_at = Column(DateTime, nullable=True)
    evidence_url = Column(String(300), nullable=True)
    industry_review_status = Column(
        SQLEnum(IndustryReviewStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=IndustryReviewStatus.NOT_SUBMITTED,
        nullable=False
    )
    industry_feedback = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    proposal = relationship("Proposal", back_populates="milestones")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class OutcomeRecord(Base):
    __tablename__ = "outcome_records"

    id = Column(Integer, primary_key=True, index=True)
    proposal_id = Column(Integer, ForeignKey("proposals.id"), nullable=False)
    outcome_type = Column(SQLEnum(OutcomeType), default=OutcomeType.PROTOTYPE)
    claim_description = Column(Text, nullable=False)
    supporting_document_url = Column(String(300), nullable=True)
    verification_status = Column(SQLEnum(VerificationStatus), default=VerificationStatus.PENDING)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    is_public = Column(Boolean, default=False)
    citizen_confirmation_status = Column(
        SQLEnum(CitizenConfirmationStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=CitizenConfirmationStatus.NOT_REQUESTED
    )
    citizen_confirmation_comment = Column(Text, nullable=True)
    citizen_confirmed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    proposal = relationship("Proposal", back_populates="outcomes")
    verified_by = relationship("User", foreign_keys=[verified_by_id], back_populates="verified_outcomes")
    reported_issues = relationship("Challenge", foreign_keys="Challenge.related_outcome_id", back_populates="related_outcome")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    recipient_contact = Column(String(100), nullable=True)
    event_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    recipient_user = relationship("User", back_populates="notifications")


class DistrictBriefing(Base):
    __tablename__ = "district_briefings"

    id = Column(Integer, primary_key=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True) # Null for state-wide
    summary_text = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=utcnow)

    district = relationship("District")


class SystemicPattern(Base):
    __tablename__ = "systemic_patterns"

    id = Column(Integer, primary_key=True, index=True)
    pattern_theme = Column(String(255), nullable=False)
    category = Column(SQLEnum(ChallengeCategory, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    district_count = Column(Integer, nullable=False)
    linked_challenge_ids = Column(JSON, default=list) # List of Challenge IDs
    severity = Column(String(50), default="high") # "critical", "high", "medium"
    detected_at = Column(DateTime, default=utcnow)
    status = Column(
        SQLEnum(SystemicPatternStatus, values_callable=lambda obj: [e.value for e in obj]),
        default=SystemicPatternStatus.ACTIVE
    )


class PeriodType(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class SubmittedReport(Base):
    __tablename__ = "submitted_reports"

    id = Column(Integer, primary_key=True, index=True)
    generated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_by_name = Column(String(255), nullable=False)
    generated_by_role = Column(
        SQLEnum(UserRole, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    period_type = Column(
        SQLEnum(PeriodType, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    file_url = Column(String(1000), nullable=False)
    generated_at = Column(DateTime, default=utcnow)

    generated_by_user = relationship("User")


