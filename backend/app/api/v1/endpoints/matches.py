"""
Analogy: The Matches endpoint is like the daily morning delivery of curated proposal portfolios to a family's residence.
It filters candidate profiles through the mathematical matching engine, ranks them by compatibility percentage,
and presents top recommendations with clear explanations for why they align with the family's criteria.
"""

import uuid
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User, UserStatus
from backend.app.models.profile import Profile, GenderEnum, MaritalStatusEnum
from backend.app.models.preference import PartnerPreference
from backend.app.schemas.profile import ProfilePublicCard
from backend.app.services.matching_service import MatchingService
from backend.app.api.v1.endpoints.profiles import calculate_age

router = APIRouter(prefix="/matches", tags=["Matching & Recommendations"])


@router.get("/daily", response_model=List[ProfilePublicCard])
async def get_daily_matches(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves top curated recommendations scored against the user's partner preferences."""
    if current_user.status in [UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION, UserStatus.REJECTED]:
        return []

    # Fetch user's own profile and preferences
    my_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    if not my_prof:
        return []

    my_pref = (await db.execute(select(PartnerPreference).where(PartnerPreference.user_id == current_user.id))).scalars().first()
    if not my_pref:
        # Auto-create default preferences so user never hits 400
        target_gender_for_pref = GenderEnum.MALE if my_prof.gender == GenderEnum.FEMALE else GenderEnum.FEMALE
        my_pref = PartnerPreference(
            user_id=current_user.id,
            min_age=21 if target_gender_for_pref == GenderEnum.FEMALE else 24,
            max_age=32 if target_gender_for_pref == GenderEnum.FEMALE else 38,
            min_height_cm=145 if target_gender_for_pref == GenderEnum.FEMALE else 160,
            max_height_cm=180 if target_gender_for_pref == GenderEnum.FEMALE else 200,
            acceptable_marital_statuses=[MaritalStatusEnum.NEVER_MARRIED],
            acceptable_religions=[my_prof.religion or "Hindu", "Universal"],
            acceptable_communities=[],
            acceptable_mother_tongues=[my_prof.mother_tongue or "Hindi"],
            acceptable_countries=["India"],
            acceptable_cities=[],
            min_education_level="Bachelors",
            acceptable_employment_sectors=[],
            min_income_bracket=None,
            acceptable_diets=[],
            manglik_preference=None
        )
        db.add(my_pref)
        await db.commit()
        await db.refresh(my_pref)

    # Target gender (opposite gender by default)
    target_gender = GenderEnum.MALE if my_prof.gender == GenderEnum.FEMALE else GenderEnum.FEMALE

    # Candidate query
    query = select(Profile).where(
        and_(
            Profile.user_id != current_user.id,
            Profile.gender == target_gender,
            Profile.is_searchable == True
        )
    ).limit(100)
    
    candidates = (await db.execute(query)).scalars().all()

    # Score each candidate
    scored_candidates = []
    for c in candidates:
        score, _ = MatchingService.calculate_compatibility(my_pref, c)
        scored_candidates.append((score, c))

    # Sort descending by compatibility score
    scored_candidates.sort(key=lambda x: x[0], reverse=True)

    results: List[ProfilePublicCard] = []
    for score, p in scored_candidates[:limit]:
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
                weight_kg=p.weight_kg,
                weight_category=p.weight_category,
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


@router.get("/compatibility/{target_id}")
async def get_compatibility_breakdown(
    target_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Provides a detailed numerical breakdown of compatibility across all 7 evaluation pillars."""
    try:
        t_uuid = uuid.UUID(target_id)
        q = select(Profile).where(or_(Profile.id == t_uuid, Profile.user_id == t_uuid))
    except ValueError:
        q = select(Profile).where(Profile.profile_id_display == target_id)

    candidate = (await db.execute(q)).scalars().first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    my_pref = (await db.execute(select(PartnerPreference).where(PartnerPreference.user_id == current_user.id))).scalars().first()
    if not my_pref:
        raise HTTPException(status_code=400, detail="Partner preferences not configured.")

    total_score, breakdown = MatchingService.calculate_compatibility(my_pref, candidate)

    return {
        "candidate_id": str(candidate.id),
        "candidate_name": f"{candidate.first_name} {candidate.last_name[0]}.",
        "total_compatibility_score": total_score,
        "category_breakdown": breakdown
    }
