"""
Analogy: The Preferences endpoint is like a private consultation room with a matchmaker where a member deposits
their exact checklist of requirements—acceptable age corridors, communities, education tiers, and dietary lifestyles.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.preference import PartnerPreference
from backend.app.schemas.preference import (
    PartnerPreferenceCreate,
    PartnerPreferenceResponse,
    PartnerPreferenceUpdate,
)

router = APIRouter(prefix="/preferences", tags=["Partner Preferences"])


@router.get("/me", response_model=PartnerPreferenceResponse)
async def get_my_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the authenticated user's partner preferences."""
    query = select(PartnerPreference).where(PartnerPreference.user_id == current_user.id)
    pref = (await db.execute(query)).scalars().first()
    
    if not pref:
        # Create default empty preference
        pref = PartnerPreference(
            user_id=current_user.id,
            min_age=21,
            max_age=35,
            min_height_cm=140,
            max_height_cm=200,
            acceptable_marital_statuses=["NEVER_MARRIED"],
            acceptable_religions=[],
            acceptable_communities=[],
            acceptable_mother_tongues=[],
            acceptable_countries=["India"],
            acceptable_cities=[],
            acceptable_employment_sectors=[],
            acceptable_diets=[]
        )
        db.add(pref)
        await db.commit()
        await db.refresh(pref)

    return PartnerPreferenceResponse(
        id=str(pref.id),
        user_id=str(pref.user_id),
        min_age=pref.min_age,
        max_age=pref.max_age,
        min_height_cm=pref.min_height_cm,
        max_height_cm=pref.max_height_cm,
        acceptable_marital_statuses=pref.acceptable_marital_statuses,
        acceptable_religions=pref.acceptable_religions,
        acceptable_communities=pref.acceptable_communities,
        acceptable_mother_tongues=pref.acceptable_mother_tongues,
        acceptable_countries=pref.acceptable_countries,
        acceptable_cities=pref.acceptable_cities,
        min_education_level=pref.min_education_level,
        acceptable_employment_sectors=pref.acceptable_employment_sectors,
        min_income_bracket=pref.min_income_bracket,
        acceptable_diets=pref.acceptable_diets,
        manglik_preference=pref.manglik_preference
    )


@router.put("/me", response_model=PartnerPreferenceResponse)
async def update_my_preferences(
    payload: PartnerPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates the authenticated user's partner expectation criteria."""
    query = select(PartnerPreference).where(PartnerPreference.user_id == current_user.id)
    pref = (await db.execute(query)).scalars().first()
    
    if not pref:
        pref = PartnerPreference(user_id=current_user.id)
        db.add(pref)

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(pref, field, val)

    await db.commit()
    await db.refresh(pref)
    return await get_my_preferences(current_user=current_user, db=db)
