from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.app.models.models import (
    UserRole, RegistrationStatus, DepartmentSource, IndustryPartnerType,
    TrustOwnerType, ChallengeCategory, SubmitterType, ChallengeStatus,
    MatchStatus, ProposalStatus, EngagementType, IPTemplate,
    MilestoneStatus, IndustryReviewStatus, OutcomeType, VerificationStatus,
    CitizenConfirmationStatus, SystemicPatternStatus
)

# ----------------- AUTH SCHEMAS -----------------

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str
    email: str
    organisation_id: Optional[int] = None
    district_id: Optional[int] = None

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegisterUniversity(BaseModel):
    name: str
    email: EmailStr
    password: str
    university_name: str
    district_id: int
    phone: Optional[str] = None

class UserRegisterIndustry(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str
    partner_type: IndustryPartnerType = IndustryPartnerType.LARGE_INDUSTRY
    csr_focus_areas: List[str] = []
    district_id: Optional[int] = None
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    district_id: Optional[int] = None
    organisation_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- DISTRICT SCHEMAS -----------------

class DistrictResponse(BaseModel):
    id: int
    name: str
    state: str

    class Config:
        from_attributes = True

# ----------------- UNIVERSITY & DEPARTMENT SCHEMAS -----------------

class FacultyProfileResponse(BaseModel):
    id: int
    department_id: int
    name: str
    expertise_tags: List[str] = []
    public_profile_url: Optional[str] = None
    verified: bool

    class Config:
        from_attributes = True

class FacultyProfileCreate(BaseModel):
    name: str
    expertise_tags: List[str] = []
    public_profile_url: Optional[str] = None
    verified: bool = False

class DepartmentResponse(BaseModel):
    id: int
    university_id: int
    name: str
    discipline_tags: List[str] = []
    source: DepartmentSource
    last_updated: datetime
    faculty_profiles: List[FacultyProfileResponse] = []

    class Config:
        from_attributes = True

class DepartmentUpdate(BaseModel):
    discipline_tags: Optional[List[str]] = None
    faculty_profiles: Optional[List[FacultyProfileCreate]] = None

class UniversityResponse(BaseModel):
    id: int
    name: str
    district_id: int
    registration_status: RegistrationStatus
    profile_completeness_score: float
    created_at: datetime
    departments: List[DepartmentResponse] = []
    district: Optional[DistrictResponse] = None

    class Config:
        from_attributes = True

# ----------------- INDUSTRY PARTNER SCHEMAS -----------------

class IndustryPartnerResponse(BaseModel):
    id: int
    name: str
    partner_type: IndustryPartnerType
    csr_focus_areas: List[str] = []
    district_id: Optional[int] = None
    registration_status: RegistrationStatus
    created_at: datetime
    district: Optional[DistrictResponse] = None

    class Config:
        from_attributes = True

# ----------------- TRUST SCORE SCHEMAS -----------------

class TrustScoreResponse(BaseModel):
    id: int
    owner_type: TrustOwnerType
    owner_id: int
    completion_rate: float
    avg_delivery_delay_days: float
    avg_outcome_rating: float
    computed_score: float
    last_computed_at: datetime

    class Config:
        from_attributes = True

# ----------------- OTP & VERIFICATION SCHEMAS -----------------

class OTPRequestPayload(BaseModel):
    phone: str

class OTPVerifyPayload(BaseModel):
    phone: str
    otp: str

class OTPVerifyResponse(BaseModel):
    verified: bool
    phone: str
    verification_token: str
    message: str
    expires_in_seconds: int = 900

# ----------------- CHALLENGE SCHEMAS -----------------

class ChallengeCreate(BaseModel):
    title: str
    description: str
    category: Optional[ChallengeCategory] = None
    submitter_type: SubmitterType = SubmitterType.CITIZEN
    submitter_contact: Optional[str] = None # Mandatory verified phone for citizen submissions
    email: Optional[str] = None # Optional secondary email contact
    otp_verification_token: Optional[str] = None # Required for citizen submissions
    original_reporter_credit: Optional[str] = "Anonymous Citizen Reporter"
    district_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_urls: List[str] = []
    video_url: Optional[str] = None
    voice_note_url: Optional[str] = None
    related_outcome_id: Optional[int] = None

class ChallengeValidationUpdate(BaseModel):
    status: ChallengeStatus # validated, rejected, pending_validation
    rejection_reason: Optional[str] = None

class ChallengeResponse(BaseModel):
    id: int
    title: str
    description: str
    category: ChallengeCategory
    ai_confidence_score: float
    submitter_type: SubmitterType
    submitter_contact: Optional[str] = None
    original_reporter_credit: Optional[str] = "Anonymous Citizen Reporter"
    tracking_id: str
    district_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_urls: List[str] = []
    video_url: Optional[str] = None
    voice_note_url: Optional[str] = None
    ai_generated_brief: Optional[str] = None
    duplicate_of_id: Optional[int] = None
    duplicate_count: int
    priority_score: float
    status: ChallengeStatus
    created_at: datetime
    validated_at: Optional[datetime] = None
    validated_by_id: Optional[int] = None
    related_outcome_id: Optional[int] = None
    district: Optional[DistrictResponse] = None

    class Config:
        from_attributes = True

class ChallengeTrackResponse(BaseModel):
    tracking_id: str
    title: str
    description: str
    category: ChallengeCategory
    status: ChallengeStatus
    created_at: datetime
    original_reporter_credit: Optional[str] = "Anonymous Citizen Reporter"
    ai_generated_brief: Optional[str] = None
    duplicate_count: int
    timeline: List[Dict[str, Any]] = []
    info_request_message: Optional[str] = None
    info_requested_at: Optional[datetime] = None
    citizen_response_text: Optional[str] = None
    citizen_responded_at: Optional[datetime] = None
    related_outcome_id: Optional[int] = None
    related_outcome: Optional[Dict[str, Any]] = None
    linked_outcome: Optional[Dict[str, Any]] = None

# ----------------- MATCH & TEAM SCHEMAS -----------------

class RouteChallengePayload(BaseModel):
    university_id: int

class UniversityRoutingShortlistItem(BaseModel):
    university_id: int
    university_name: str
    district_id: Optional[int] = None
    district_name: Optional[str] = None
    match_score: float
    match_reasons: Dict[str, Any] = {}
    active_project_count: int = 0
    trust_score: float = 85.0
    departments: List[str] = []
    is_recommended: bool = False
    is_verified_expertise: bool = False

class MatchResponse(BaseModel):
    id: int
    challenge_id: int
    university_id: int
    match_score: float
    match_reasons: Dict[str, Any]
    status: MatchStatus
    created_at: datetime
    challenge: Optional[ChallengeResponse] = None
    university: Optional[UniversityResponse] = None

    class Config:
        from_attributes = True

class ProjectTeamCreate(BaseModel):
    faculty_mentor_id: Optional[int] = None
    student_members: List[Dict[str, Any]] = [] # [{"name": "Pooja Roy", "role": "Lead Researcher", "email": "..."}]

class ProjectTeamResponse(BaseModel):
    id: int
    challenge_id: int
    university_id: int
    faculty_mentor_id: Optional[int] = None
    student_members: List[Dict[str, Any]] = []
    formed_at: datetime
    challenge: Optional[ChallengeResponse] = None

    class Config:
        from_attributes = True

# ----------------- PROPOSAL SCHEMAS -----------------

class ProposalCreate(BaseModel):
    title: str
    summary: str

class MilestoneCreate(BaseModel):
    title: str
    description: str
    due_date: Optional[datetime] = None

class MilestoneResponse(BaseModel):
    id: int
    proposal_id: int
    title: str
    description: str
    due_date: Optional[datetime] = None
    status: MilestoneStatus
    completed_at: Optional[datetime] = None
    evidence_url: Optional[str] = None
    industry_review_status: IndustryReviewStatus = IndustryReviewStatus.NOT_SUBMITTED
    industry_feedback: Optional[str] = None
    reviewed_by_id: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MilestoneReviewRequest(BaseModel):
    action: str # "approve" | "request_revision"
    feedback: Optional[str] = None

class MilestoneCompleteRequest(BaseModel):
    evidence_url: str

class IPAgreementCreate(BaseModel):
    template: IPTemplate
    custom_override: bool = False
    custom_terms_document_url: Optional[str] = None

class IPAgreementResponse(BaseModel):
    id: int
    proposal_id: int
    template: IPTemplate
    custom_override: bool
    custom_terms_document_url: Optional[str] = None
    generated_document_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class IndustryEngagementCreate(BaseModel):
    engagement_type: EngagementType
    funding_amount: Optional[float] = None
    notes: Optional[str] = None

class IndustryEngagementResponse(BaseModel):
    id: int
    proposal_id: int
    industry_partner_id: int
    engagement_type: EngagementType
    funding_amount: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    industry_partner: Optional[IndustryPartnerResponse] = None

    class Config:
        from_attributes = True

class OutcomeRecordCreate(BaseModel):
    outcome_type: OutcomeType
    claim_description: str
    supporting_document_url: Optional[str] = None

class OutcomeRecordResponse(BaseModel):
    id: int
    proposal_id: int
    outcome_type: OutcomeType
    claim_description: str
    supporting_document_url: Optional[str] = None
    verification_status: VerificationStatus
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    is_public: bool
    citizen_confirmation_status: CitizenConfirmationStatus = CitizenConfirmationStatus.NOT_REQUESTED
    citizen_confirmation_comment: Optional[str] = None
    citizen_confirmed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConfirmOutcomePayload(BaseModel):
    confirmed: bool
    comment: Optional[str] = None

class PostDeploymentIssueCreate(BaseModel):
    title: str
    description: str
    submitter_type: SubmitterType = SubmitterType.CITIZEN
    submitter_contact: Optional[str] = None
    original_reporter_credit: Optional[str] = "Anonymous Citizen Reporter"
    district_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    photo_urls: List[str] = []
    video_url: Optional[str] = None
    voice_note_url: Optional[str] = None

class SystemicPatternResponse(BaseModel):
    id: int
    pattern_theme: str
    category: ChallengeCategory
    district_count: int
    linked_challenge_ids: List[int] = []
    linked_challenges: List[Dict[str, Any]] = []
    severity: str
    detected_at: datetime
    status: SystemicPatternStatus

    class Config:
        from_attributes = True

class ProposalResponse(BaseModel):
    id: int
    project_team_id: int
    title: str
    summary: str
    submitted_at: datetime
    status: ProposalStatus
    project_team: Optional[ProjectTeamResponse] = None
    engagements: List[IndustryEngagementResponse] = []
    ip_agreements: List[IPAgreementResponse] = []
    milestones: List[MilestoneResponse] = []
    outcomes: List[OutcomeRecordResponse] = []

    class Config:
        from_attributes = True

# ----------------- NOTIFICATION SCHEMAS -----------------

class NotificationResponse(BaseModel):
    id: int
    recipient_user_id: Optional[int] = None
    recipient_contact: Optional[str] = None
    event_type: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- ANALYTICS & ESCALATION SCHEMAS -----------------

class AnalyticsOverviewResponse(BaseModel):
    total_submissions: int
    validated_count: int
    in_research_count: int
    in_execution_count: int
    deployed_count: int
    domain_distribution: Dict[str, int]
    district_distribution: Dict[str, int]
    institutional_participation: Dict[str, Any]
    industry_engagement_count: int
    outcomes_summary: Dict[str, int]

class DistrictBriefingResponse(BaseModel):
    district_id: Optional[int] = None
    district_name: str
    summary_text: str
    briefing_text: Optional[str] = None
    generated_at: datetime
    is_cached: bool = True

    def __init__(self, **data):
        if "briefing_text" not in data and "summary_text" in data:
            data["briefing_text"] = data["summary_text"]
        elif "summary_text" not in data and "briefing_text" in data:
            data["summary_text"] = data["briefing_text"]
        super().__init__(**data)

# ----------------- ONBOARDING & CLARIFICATION SCHEMAS -----------------

class OnboardUniversityRequest(BaseModel):
    university_name: str
    district_id: int
    coordinator_name: str
    coordinator_email: EmailStr

class OnboardIndustryRequest(BaseModel):
    partner_name: str
    partner_type: IndustryPartnerType = IndustryPartnerType.LARGE_INDUSTRY
    csr_focus_areas: List[str] = []
    district_id: Optional[int] = None
    contact_name: str
    contact_email: EmailStr

class OnboardValidationOfficerRequest(BaseModel):
    officer_name: str
    officer_email: EmailStr
    district_id: int

class RequestInfoPayload(BaseModel):
    message: str

class CitizenInfoResponsePayload(BaseModel):
    response_text: str
    photo_url: Optional[str] = None

