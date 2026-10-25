"""
Analogy: The Profiles endpoint is like the central archive and reading room of a matrimonial society.
It enables members to edit their own biographical dossiers, search candidate portfolios using multi-dimensional filters,
and inspect detailed cards with automatic privacy protections and name masking applied.
"""

import uuid
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_optional_current_user, get_db
from backend.app.models.user import User, UserRole
from backend.app.models.profile import (
    Profile,
    CreatedByEnum,
    GenderEnum,
    MaritalStatusEnum,
    DietEnum,
    ManglikEnum,
    EmploymentSectorEnum,
    FamilyTypeEnum,
    FamilyValuesEnum,
    SmokingDrinkingEnum,
)
from backend.app.models.photo import Photo
from backend.app.models.interaction import ContactView
from backend.app.models.preference import PartnerPreference
from backend.app.models.safety import Block
from backend.app.schemas.profile import (
    ProfileCreate,
    ProfileDetailResponse,
    ProfilePublicCard,
    ProfileUpdate,
)
from backend.app.services.matching_service import MatchingService

router = APIRouter(prefix="/profiles", tags=["Profiles & Search"])


def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


@router.get("/me", response_model=ProfileDetailResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the authenticated user's own profile."""
    query = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(query)).scalars().first()
    if not profile:
        # If user is an administrative or moderator staff member, provide staff profile representation
        if current_user.role in [UserRole.ADMIN, UserRole.MODERATOR]:
            is_admin = current_user.role == UserRole.ADMIN
            return ProfileDetailResponse(
                id=str(current_user.id),
                user_id=str(current_user.id),
                profile_id_display=f"BDN-{current_user.role.value[:5]}01",
                created_by=CreatedByEnum.SELF,
                first_name="System" if is_admin else "Community",
                last_name="Administrator" if is_admin else "Moderator",
                gender=GenderEnum.OTHER,
                date_of_birth=date(1985, 1, 1),
                age=40,
                height_cm=175,
                marital_status=MaritalStatusEnum.NEVER_MARRIED,
                religion="Universal",
                mother_tongue="English",
                community="Staff",
                highest_education="Doctorate" if is_admin else "Masters",
                education_field="Trust & Safety",
                college_name="Platform Operations Center",
                employment_sector=EmploymentSectorEnum.GOVERNMENT if is_admin else EmploymentSectorEnum.PRIVATE,
                occupation="Platform Director" if is_admin else "Trust & Safety Moderator",
                annual_income_bracket="INR 50-75 LPA",
                residence_city="Bangalore",
                residence_state="Karnataka",
                residence_country="India",
                citizenship="Indian",
                family_type=FamilyTypeEnum.NUCLEAR,
                family_values=FamilyValuesEnum.LIBERAL,
                diet=DietEnum.VEGETARIAN,
                smoking=SmokingDrinkingEnum.NO,
                drinking=SmokingDrinkingEnum.NO,
                bio_narrative="Official Bandham Matrimony Trust & Safety Administration Officer.",
                profile_completeness_pct=100,
                is_searchable=False,
                photo_urls=[],
                is_photo_blurred=False,
                has_contact_revealed=False
            )
        raise HTTPException(status_code=404, detail="Profile not found. Please complete onboarding.")

    # Fetch user photos
    photo_query = select(Photo).where(Photo.user_id == current_user.id).order_by(Photo.sort_order)
    photos = (await db.execute(photo_query)).scalars().all()
    photo_urls = [p.s3_key_original for p in photos]

    age = calculate_age(profile.date_of_birth)
    
    return ProfileDetailResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        profile_id_display=profile.profile_id_display,
        created_by=profile.created_by,
        first_name=profile.first_name,
        last_name=profile.last_name,
        last_initial=f"{profile.last_name[0]}." if profile.last_name else "",
        gender=profile.gender,
        date_of_birth=profile.date_of_birth,
        age=age,
        height_cm=profile.height_cm,
        marital_status=profile.marital_status,
        religion=profile.religion,
        mother_tongue=profile.mother_tongue,
        community=profile.community,
        sub_community=profile.sub_community,
        gotra=profile.gotra,
        manglik=profile.manglik,
        highest_education=profile.highest_education,
        education_field=profile.education_field,
        college_name=profile.college_name,
        employment_sector=profile.employment_sector,
        occupation=profile.occupation,
        annual_income_bracket=profile.annual_income_bracket,
        residence_city=profile.residence_city,
        residence_state=profile.residence_state,
        residence_country=profile.residence_country,
        citizenship=profile.citizenship,
        family_type=profile.family_type,
        family_values=profile.family_values,
        diet=profile.diet,
        smoking=profile.smoking,
        drinking=profile.drinking,
        bio_narrative=profile.bio_narrative,
        profile_completeness_pct=profile.profile_completeness_pct,
        is_searchable=profile.is_searchable,
        photo_urls=photo_urls,
        is_photo_blurred=False,
        has_contact_revealed=True
    )


@router.post("", response_model=ProfileDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new full profile for the authenticated member."""
    existing = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have an active profile. Use PUT /profiles/me to update your details.")

    profile_id_display = f"BDN-{str(uuid.uuid4().int)[:5]}"
    prof = Profile(
        user_id=current_user.id,
        profile_id_display=profile_id_display,
        created_by=payload.created_by,
        first_name=payload.first_name,
        last_name=payload.last_name,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        height_cm=payload.height_cm,
        marital_status=payload.marital_status,
        religion=payload.religion,
        mother_tongue=payload.mother_tongue,
        community=payload.community,
        sub_community=payload.sub_community,
        gotra=payload.gotra,
        manglik=payload.manglik,
        highest_education=payload.highest_education,
        education_field=payload.education_field,
        college_name=payload.college_name,
        employment_sector=payload.employment_sector,
        occupation=payload.occupation,
        annual_income_bracket=payload.annual_income_bracket,
        residence_city=payload.residence_city,
        residence_state=payload.residence_state,
        residence_country=payload.residence_country,
        citizenship=payload.citizenship,
        family_type=payload.family_type,
        family_values=payload.family_values,
        diet=payload.diet,
        smoking=payload.smoking,
        drinking=payload.drinking,
        bio_narrative=payload.bio_narrative,
        profile_completeness_pct=75,
        is_searchable=True
    )
    db.add(prof)
    await db.commit()
    await db.refresh(prof)
    return await get_my_profile(current_user=current_user, db=db)


@router.put("/me", response_model=ProfileDetailResponse)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates fields on the authenticated user's profile and recalculates completeness score."""
    query = select(Profile).where(Profile.user_id == current_user.id)
    profile = (await db.execute(query)).scalars().first()
    if not profile:
        # Create profile on the fly if user doesn't have one yet
        profile_id_display = f"BDN-{str(uuid.uuid4().int)[:5]}"
        profile = Profile(
            user_id=current_user.id,
            profile_id_display=profile_id_display,
            created_by=payload.created_by or CreatedByEnum.SELF,
            first_name="Member",
            last_name="",
            gender=GenderEnum.FEMALE,
            date_of_birth=date(1998, 1, 1),
            height_cm=payload.height_cm or 165,
            marital_status=payload.marital_status or MaritalStatusEnum.NEVER_MARRIED,
            religion=payload.religion or "Hindu",
            mother_tongue=payload.mother_tongue or "Hindi",
            community=payload.community or "General",
            highest_education=payload.highest_education or "Bachelors",
            education_field=payload.education_field or "General",
            occupation=payload.occupation or "Professional",
            annual_income_bracket=payload.annual_income_bracket or "INR 10-15 LPA",
            residence_city=payload.residence_city or "Mumbai",
            residence_state=payload.residence_state or "Maharashtra",
            bio_narrative=payload.bio_narrative or "Profile under construction. Looking for an understanding and caring life partner.",
            profile_completeness_pct=40,
            is_searchable=True
        )
        db.add(profile)
        await db.flush()

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if isinstance(val, str) and not val.strip():
            if field in ["community", "religion", "mother_tongue", "highest_education", "education_field", "occupation", "residence_city", "residence_state"]:
                default_val = "General" if field in ["community", "education_field"] else (getattr(profile, field) or "General")
                setattr(profile, field, default_val)
            elif field == "bio_narrative":
                setattr(profile, field, getattr(profile, field) or "Looking for an understanding, caring, and compatible life partner.")
            else:
                setattr(profile, field, None)
        elif val is not None:
            setattr(profile, field, val)

    # Calculate profile completeness score
    fields_to_check = [
        profile.first_name, profile.last_name, profile.date_of_birth, profile.height_cm,
        profile.marital_status, profile.religion, profile.mother_tongue, profile.community,
        profile.highest_education, profile.occupation, profile.annual_income_bracket,
        profile.residence_city, profile.bio_narrative, profile.family_type
    ]
    completed = sum(1 for f in fields_to_check if f is not None and str(f).strip() != "")
    profile.profile_completeness_pct = min(100, int((completed / len(fields_to_check)) * 100))

    await db.commit()
    await db.refresh(profile)
    return await get_my_profile(current_user=current_user, db=db)


@router.get("/{profile_id}", response_model=ProfileDetailResponse)
async def get_profile_by_id(
    profile_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves another candidate's full profile with privacy controls and compatibility score."""
    # Check if profile_id is UUID or BDN display ID
    try:
        prof_uuid = uuid.UUID(profile_id)
        query = select(Profile).where(Profile.id == prof_uuid)
    except ValueError:
        query = select(Profile).where(Profile.profile_id_display == profile_id)

    profile = (await db.execute(query)).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    # Check Block Status
    block_check = await db.execute(
        select(Block).where(
            or_(
                and_(Block.blocker_id == current_user.id, Block.blocked_user_id == profile.user_id),
                and_(Block.blocker_id == profile.user_id, Block.blocked_user_id == current_user.id)
            )
        )
    )
    if block_check.scalars().first():
        raise HTTPException(status_code=404, detail="Profile unavailable.")

    # Fetch Photos
    photo_query = select(Photo).where(Photo.user_id == profile.user_id).order_by(Photo.sort_order)
    photos = (await db.execute(photo_query)).scalars().all()
    photo_urls = [p.s3_key_watermarked for p in photos]

    # Contact reveal check
    cv_check = await db.execute(
        select(ContactView).where(
            ContactView.viewer_id == current_user.id,
            ContactView.target_user_id == profile.user_id
        )
    )
    has_contact_revealed = cv_check.scalars().first() is not None

    # Calculate Compatibility Score
    pref_query = select(PartnerPreference).where(PartnerPreference.user_id == current_user.id)
    my_pref = (await db.execute(pref_query)).scalars().first()
    comp_score = None
    if my_pref:
        comp_score, _ = MatchingService.calculate_compatibility(my_pref, profile)

    age = calculate_age(profile.date_of_birth)

    return ProfileDetailResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        profile_id_display=profile.profile_id_display,
        created_by=profile.created_by,
        first_name=profile.first_name,
        last_name=profile.last_name,
        last_initial=f"{profile.last_name[0]}." if profile.last_name else "",
        gender=profile.gender,
        date_of_birth=profile.date_of_birth,
        age=age,
        height_cm=profile.height_cm,
        marital_status=profile.marital_status,
        religion=profile.religion,
        mother_tongue=profile.mother_tongue,
        community=profile.community,
        sub_community=profile.sub_community,
        gotra=profile.gotra,
        manglik=profile.manglik,
        highest_education=profile.highest_education,
        education_field=profile.education_field,
        college_name=profile.college_name,
        employment_sector=profile.employment_sector,
        occupation=profile.occupation,
        annual_income_bracket=profile.annual_income_bracket,
        residence_city=profile.residence_city,
        residence_state=profile.residence_state,
        residence_country=profile.residence_country,
        citizenship=profile.citizenship,
        family_type=profile.family_type,
        family_values=profile.family_values,
        diet=profile.diet,
        smoking=profile.smoking,
        drinking=profile.drinking,
        bio_narrative=profile.bio_narrative,
        profile_completeness_pct=profile.profile_completeness_pct,
        is_searchable=profile.is_searchable,
        photo_urls=photo_urls,
        is_photo_blurred=False,
        has_contact_revealed=has_contact_revealed,
        compatibility_score=comp_score
    )


@router.get("", response_model=List[ProfilePublicCard])
async def search_profiles(
    gender: Optional[GenderEnum] = None,
    religion: Optional[str] = None,
    community: Optional[str] = None,
    mother_tongue: Optional[str] = None,
    city: Optional[str] = None,
    diet: Optional[DietEnum] = None,
    keyword: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Faceted search across candidate profiles with pagination and keyword fuzzy matching."""
    # Build conditions
    conditions = [Profile.is_searchable == True]
    if current_user:
        conditions.append(Profile.user_id != current_user.id)

    if gender:
        conditions.append(Profile.gender == gender)
    if religion:
        conditions.append(Profile.religion.ilike(f"%{religion}%"))
    if community:
        conditions.append(Profile.community.ilike(f"%{community}%"))
    if mother_tongue:
        conditions.append(Profile.mother_tongue.ilike(f"%{mother_tongue}%"))
    if city:
        conditions.append(Profile.residence_city.ilike(f"%{city}%"))
    if diet:
        conditions.append(Profile.diet == diet)
    if keyword:
        conditions.append(
            or_(
                Profile.bio_narrative.ilike(f"%{keyword}%"),
                Profile.occupation.ilike(f"%{keyword}%"),
                Profile.highest_education.ilike(f"%{keyword}%")
            )
        )

    # Offset pagination
    offset = (page - 1) * limit
    query = select(Profile).where(and_(*conditions)).order_by(Profile.created_at.desc()).offset(offset).limit(limit)
    profiles = (await db.execute(query)).scalars().all()

    # User's preferences for calculating match scores if logged in
    my_pref = None
    if current_user:
        pref_query = select(PartnerPreference).where(PartnerPreference.user_id == current_user.id)
        my_pref = (await db.execute(pref_query)).scalars().first()

    results: List[ProfilePublicCard] = []
    for p in profiles:
        score = None
        if my_pref:
            score, _ = MatchingService.calculate_compatibility(my_pref, p)

        results.append(
            ProfilePublicCard(
                id=str(p.id),
                user_id=str(p.user_id),
                profile_id_display=p.profile_id_display,
                first_name=p.first_name,
                last_initial=f"{p.last_name[0]}." if p.last_name else "",
                gender=p.gender,
                age=calculate_age(p.date_of_birth),
                height_cm=p.height_cm,
                marital_status=p.marital_status,
                religion=p.religion,
                community=p.community,
                mother_tongue=p.mother_tongue,
                highest_education=p.highest_education,
                occupation=p.occupation,
                annual_income_bracket=p.annual_income_bracket,
                residence_city=p.residence_city,
                residence_state=p.residence_state,
                diet=p.diet,
                manglik=p.manglik,
                bio_narrative=((p.bio_narrative or "")[:160] + "...") if len(p.bio_narrative or "") > 160 else (p.bio_narrative or ""),
                thumbnail_url=f"photos/user_{str(p.user_id)[:8]}_thumb.webp",
                is_photo_blurred=False,
                compatibility_score=score
            )
        )

    return results
