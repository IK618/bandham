"""
Analogy: The Auth endpoint is like the identity verification and visa issuance counter at an international terminal.
It registers new applicants, verifies phone credentials via OTP, and hands over secure entry passes (JWT cookies).
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.core.config import settings
from backend.app.core.security import create_access_token, create_refresh_token, get_password_hash, verify_password
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.profile import Profile, GenderEnum, MaritalStatusEnum
from backend.app.models.preference import PartnerPreference
from backend.app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    VerifyOTPRequest,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Registers a new account and initiates phone OTP verification."""
    # Check duplicate email or phone
    query = select(User).where(or_(User.email == payload.email, User.phone_number == payload.phone_number))
    existing = (await db.execute(query)).scalars().first()
    if existing:
        if existing.email == payload.email:
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")
        raise HTTPException(status_code=400, detail="An account with this mobile phone number already exists.")

    new_user = User(
        email=payload.email,
        phone_number=payload.phone_number,
        password_hash=get_password_hash(payload.password),
        role=UserRole.MEMBER,
        status=UserStatus.PENDING_APPROVAL,
        email_verified=False,
        phone_verified=False
    )
    db.add(new_user)
    await db.flush()

    # Pre-generate Profile ID
    profile_id_display = f"BDN-{str(uuid.uuid4().int)[:5]}"
    draft_profile = Profile(
        user_id=new_user.id,
        profile_id_display=profile_id_display,
        created_by=payload.profile_for,
        first_name=payload.first_name,
        last_name=payload.last_name,
        gender=payload.gender,
        date_of_birth=datetime(1998, 1, 1).date(),  # temporary draft date
        height_cm=165 if payload.gender == GenderEnum.FEMALE else 175,
        religion="Hindu",
        mother_tongue="Hindi",
        community="General",
        highest_education="Bachelors",
        education_field="General",
        occupation="Professional",
        annual_income_bracket="INR 10-15 LPA",
        residence_city="Mumbai",
        residence_state="Maharashtra",
        bio_narrative="Membership proposal submitted to Bandham. Looking for an understanding and caring life partner.",
        profile_completeness_pct=30,
        is_searchable=False
    )
    db.add(draft_profile)

    # Initialize default partner preferences so matching never fails with 400
    target_min_age = 21 if payload.gender == GenderEnum.MALE else 24
    target_max_age = 32 if payload.gender == GenderEnum.MALE else 38
    default_pref = PartnerPreference(
        user_id=new_user.id,
        min_age=target_min_age,
        max_age=target_max_age,
        min_height_cm=145 if payload.gender == GenderEnum.MALE else 160,
        max_height_cm=180 if payload.gender == GenderEnum.MALE else 200,
        acceptable_marital_statuses=[MaritalStatusEnum.NEVER_MARRIED],
        acceptable_religions=["Hindu", "Jain", "Sikh", "Universal"],
        acceptable_communities=[],
        acceptable_mother_tongues=["Hindi"],
        acceptable_countries=["India"],
        acceptable_cities=[],
        min_education_level="Bachelors",
        acceptable_employment_sectors=[],
        min_income_bracket=None,
        acceptable_diets=[],
        manglik_preference=None
    )
    db.add(default_pref)
    await db.commit()
    await db.refresh(new_user)

    # In dev/test: OTP stub is logged. In prod: Dispatched via Twilio/SMS provider.
    print(f"[OTP STUB] Sent OTP 123456 to phone {payload.phone_number}")

    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        phone_number=new_user.phone_number,
        role=new_user.role,
        status=new_user.status,
        email_verified=new_user.email_verified,
        phone_verified=new_user.phone_verified
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    payload: VerifyOTPRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Verifies phone OTP, activates account, and sets session cookies."""
    query = select(User).where(User.phone_number == payload.phone_number)
    user = (await db.execute(query)).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Phone number not registered.")

    # Stub verification code check: Accepts '123456' in dev/test environment
    if payload.otp_code != "123456":
        raise HTTPException(status_code=400, detail="Invalid verification code. Please try again.")

    user.phone_verified = True
    if user.status not in [UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.BANNED, UserStatus.REJECTED]:
        user.status = UserStatus.PENDING_APPROVAL
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    prof = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalars().first()

    # If user is awaiting administrator approval, do not issue session cookies
    if user.status in [UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION]:
        return TokenResponse(
            access_token="",
            refresh_token="",
            user_id=str(user.id),
            role=user.role,
            status=user.status,
            email=user.email,
            profile_id_display=prof.profile_id_display if prof else None
        )

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token = create_refresh_token(subject=str(user.id))

    # Set HttpOnly cookies for active users
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.IS_COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.IS_COOKIE_SECURE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        role=user.role,
        status=user.status,
        email=user.email,
        profile_id_display=prof.profile_id_display if prof else None
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Authenticates using email or phone number and issues JWT cookies."""
    query = select(User).where(or_(User.email == payload.email_or_phone, User.phone_number == payload.email_or_phone))
    user = (await db.execute(query)).scalars().first()
    
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid login credentials.")

    if user.status in [UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION]:
        raise HTTPException(
            status_code=403,
            detail="Your account registration is under review by our Trust & Governance committee. Login access will be granted once an Administrator approves your proposal."
        )

    if user.status in [UserStatus.SUSPENDED, UserStatus.BANNED]:
        raise HTTPException(status_code=403, detail=f"Account is {user.status.value}. Contact support.")

    if user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=403,
            detail="Your membership proposal was not approved by the Trust & Governance committee. Please contact support@bandham.com for assistance."
        )

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    refresh_token = create_refresh_token(subject=str(user.id))

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.IS_COOKIE_SECURE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
        secure=settings.IS_COOKIE_SECURE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    )

    prof = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalars().first()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=str(user.id),
        role=user.role,
        status=user.status,
        email=user.email,
        profile_id_display=prof.profile_id_display if prof else None
    )


@router.post("/logout")
async def logout(response: Response):
    """Clears authentication cookies."""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully."}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the current user account profile."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        phone_number=current_user.phone_number,
        role=current_user.role,
        status=current_user.status,
        email_verified=current_user.email_verified,
        phone_verified=current_user.phone_verified
    )
