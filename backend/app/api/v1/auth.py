from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from backend.app.models.models import User, UserRole, University, IndustryPartner, RegistrationStatus, District
from backend.app.schemas.schemas import (
    UserLogin, UserRegisterUniversity, UserRegisterIndustry, Token, UserResponse
)
from backend.app.services.gemini_service import gemini_service
from backend.app.models.models import Department, FacultyProfile, DepartmentSource, TrustScore, TrustOwnerType

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register/university", response_model=Token)
def register_university(payload: UserRegisterUniversity, db: Session = Depends(get_db)):
    # Check if user email exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    # Check or create district
    district = db.query(District).filter(District.id == payload.district_id).first()
    if not district:
        raise HTTPException(status_code=400, detail="Invalid district ID.")

    # Create University record
    uni = db.query(University).filter(University.name == payload.university_name).first()
    if not uni:
        uni = University(
            name=payload.university_name,
            district_id=payload.district_id,
            registration_status=RegistrationStatus.VERIFIED,
            profile_completeness_score=60.0
        )
        db.add(uni)
        db.commit()
        db.refresh(uni)

        # Auto-bootstrap expertise graph on registration
        draft_depts = gemini_service.bootstrap_expertise_graph(payload.university_name)
        for d in draft_depts:
            dept = Department(
                university_id=uni.id,
                name=d["department_name"],
                discipline_tags=d.get("discipline_tags", []),
                source=DepartmentSource(d.get("source", "shodhganga_import"))
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            
            for f in d.get("faculty_profiles", []):
                fac = FacultyProfile(
                    department_id=dept.id,
                    name=f["name"],
                    expertise_tags=f.get("expertise_tags", []),
                    public_profile_url=f.get("public_profile_url"),
                    verified=f.get("verified", False)
                )
                db.add(fac)
        db.commit()

        # Initialize Trust Score
        trust = TrustScore(
            owner_type=TrustOwnerType.UNIVERSITY,
            owner_id=uni.id,
            completion_rate=100.0,
            avg_delivery_delay_days=0.0,
            avg_outcome_rating=4.8,
            computed_score=88.0
        )
        db.add(trust)
        db.commit()

    # Create User
    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=UserRole.UNIVERSITY,
        district_id=payload.district_id,
        organisation_id=uni.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role.value})
    return Token(
        access_token=token,
        role=new_user.role.value,
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        organisation_id=new_user.organisation_id,
        district_id=new_user.district_id
    )

@router.post("/register/industry", response_model=Token)
def register_industry(payload: UserRegisterIndustry, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")

    partner = db.query(IndustryPartner).filter(IndustryPartner.name == payload.company_name).first()
    if not partner:
        partner = IndustryPartner(
            name=payload.company_name,
            partner_type=payload.partner_type,
            csr_focus_areas=payload.csr_focus_areas,
            district_id=payload.district_id,
            registration_status=RegistrationStatus.VERIFIED
        )
        db.add(partner)
        db.commit()
        db.refresh(partner)

        trust = TrustScore(
            owner_type=TrustOwnerType.INDUSTRY_PARTNER,
            owner_id=partner.id,
            completion_rate=100.0,
            avg_delivery_delay_days=0.0,
            avg_outcome_rating=4.7,
            computed_score=89.0
        )
        db.add(trust)
        db.commit()

    new_user = User(
        name=payload.name,
        email=payload.email,
        password_hash=get_password_hash(payload.password),
        role=UserRole.INDUSTRY,
        district_id=payload.district_id,
        organisation_id=partner.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "role": new_user.role.value})
    return Token(
        access_token=token,
        role=new_user.role.value,
        user_id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        organisation_id=new_user.organisation_id,
        district_id=new_user.district_id
    )

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return Token(
        access_token=token,
        role=user.role.value,
        user_id=user.id,
        name=user.name,
        email=user.email,
        organisation_id=user.organisation_id,
        district_id=user.district_id
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
