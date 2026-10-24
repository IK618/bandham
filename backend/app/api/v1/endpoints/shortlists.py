"""
Analogy: The Shortlists endpoint is like a private bookmark folder and personal diary.
It allows a member or family to save candidate profiles for offline weekend discussions, attach private notes,
and easily manage their curated shortlist without notifying the prospective candidates.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.interaction import Shortlist
from backend.app.schemas.interaction import ShortlistCreate, ShortlistResponse
from backend.app.api.v1.endpoints.interests import profile_to_card

router = APIRouter(prefix="/shortlists", tags=["Shortlists"])


@router.get("", response_model=List[ShortlistResponse])
async def get_my_shortlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all bookmarked candidate profiles saved by the user."""
    query = select(Shortlist).where(Shortlist.user_id == current_user.id).order_by(Shortlist.created_at.desc())
    items = (await db.execute(query)).scalars().all()

    responses: List[ShortlistResponse] = []
    for it in items:
        prof = (await db.execute(select(Profile).where(Profile.user_id == it.shortlisted_user_id))).scalars().first()
        responses.append(
            ShortlistResponse(
                id=str(it.id),
                user_id=str(it.user_id),
                shortlisted_user_id=str(it.shortlisted_user_id),
                notes=it.notes,
                created_at=it.created_at,
                shortlisted_profile=profile_to_card(prof) if prof else None
            )
        )
    return responses


@router.post("", response_model=ShortlistResponse, status_code=status.HTTP_201_CREATED)
async def add_to_shortlist(
    payload: ShortlistCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Bookmarks a candidate profile with an optional private note."""
    target_uuid = uuid.UUID(payload.shortlisted_user_id)
    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot shortlist your own profile.")

    existing = await db.execute(
        select(Shortlist).where(
            Shortlist.user_id == current_user.id,
            Shortlist.shortlisted_user_id == target_uuid
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Profile already bookmarked in your shortlist.")

    item = Shortlist(
        user_id=current_user.id,
        shortlisted_user_id=target_uuid,
        notes=payload.notes
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)

    prof = (await db.execute(select(Profile).where(Profile.user_id == target_uuid))).scalars().first()
    return ShortlistResponse(
        id=str(item.id),
        user_id=str(item.user_id),
        shortlisted_user_id=str(item.shortlisted_user_id),
        notes=item.notes,
        created_at=item.created_at,
        shortlisted_profile=profile_to_card(prof) if prof else None
    )


@router.delete("/{target_user_id}", status_code=status.HTTP_200_OK)
async def remove_from_shortlist(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Removes a candidate profile from the user's shortlist."""
    target_uuid = uuid.UUID(target_user_id)
    query = select(Shortlist).where(
        Shortlist.user_id == current_user.id,
        Shortlist.shortlisted_user_id == target_uuid
    )
    item = (await db.execute(query)).scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Shortlist bookmark not found.")

    await db.delete(item)
    await db.commit()
    return {"message": "Profile removed from shortlist."}
