"""
Analogy: The Interests endpoint is like the formal dispatch and courier desk for matrimonial proposal calling cards.
It allows members to send polite expressions of interest (enforcing anti-spam daily quotas on free accounts),
manages incoming/outgoing invitation queues, and handles mutual acceptance handshakes that unlock messaging channels.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_active_user, get_current_user, get_db
from backend.app.core.redis import RateLimiter
from backend.app.models.user import User, UserRole
from backend.app.models.profile import Profile
from backend.app.models.interaction import Interest, InterestStatusEnum
from backend.app.models.chat import Conversation, ConversationParticipant, Message, MessageStatusEnum
from backend.app.models.safety import Block, Notification, NotificationTypeEnum
from backend.app.schemas.interaction import InterestCreate, InterestResponse
from backend.app.api.v1.endpoints.profiles import calculate_age
from backend.app.schemas.profile import ProfilePublicCard

router = APIRouter(prefix="/interests", tags=["Express Interests"])


def profile_to_card(p: Profile) -> ProfilePublicCard:
    return ProfilePublicCard(
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
        bio_narrative=((p.bio_narrative or "")[:120] + "...") if len(p.bio_narrative or "") > 120 else (p.bio_narrative or ""),
        thumbnail_url=f"photos/user_{str(p.user_id)[:8]}_thumb.webp"
    )


@router.post("", response_model=InterestResponse, status_code=status.HTTP_201_CREATED)
async def send_interest(
    payload: InterestCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Sends an Express Interest to a candidate (subject to daily rate limits)."""
    if current_user.role in [UserRole.ADMIN, UserRole.MODERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff accounts (Administrators and Moderators) are restricted from sending courtship interests."
        )

    recipient_uuid = uuid.UUID(payload.recipient_id)
    if recipient_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot send an interest to your own profile.")

    # Check Block Status (bidirectional safety barrier)
    is_blocked = (await db.execute(
        select(Block).where(
            or_(
                and_(Block.blocker_id == current_user.id, Block.blocked_user_id == recipient_uuid),
                and_(Block.blocker_id == recipient_uuid, Block.blocked_user_id == current_user.id)
            )
        )
    )).scalars().first()
    if is_blocked:
        raise HTTPException(
            status_code=400,
            detail="Interaction with this profile is restricted."
        )

    # Rate Limiting Check (5 per 24 hours on Free Tier)
    rate_limit_key = f"rate:interest:{str(current_user.id)}:daily"
    is_allowed = await RateLimiter.check_daily_limit(rate_limit_key, max_requests=5)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily interest limit reached (5/day for Free Tier). Please upgrade to Gold for unlimited connects."
        )

    # Check if duplicate interest already exists
    existing = await db.execute(
        select(Interest).where(
            Interest.sender_id == current_user.id,
            Interest.recipient_id == recipient_uuid
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="You have already expressed interest in this profile.")

    interest = Interest(
        sender_id=current_user.id,
        recipient_id=recipient_uuid,
        status=InterestStatusEnum.PENDING,
        greeting_message=payload.greeting_message
    )
    db.add(interest)

    # Send Notification to Recipient
    sender_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    sender_name = sender_prof.first_name if sender_prof else "A member"
    db.add(Notification(
        user_id=recipient_uuid,
        title="New Express Interest!",
        message=f"{sender_name} ({sender_prof.profile_id_display if sender_prof else ''}) expressed interest in your profile.",
        notification_type=NotificationTypeEnum.INTEREST_RECEIVED,
        reference_link="/inbox"
    ))

    await db.commit()
    await db.refresh(interest)

    return InterestResponse(
        id=str(interest.id),
        sender_id=str(interest.sender_id),
        recipient_id=str(interest.recipient_id),
        status=interest.status,
        greeting_message=interest.greeting_message,
        created_at=interest.created_at
    )


@router.get("/inbox", response_model=List[InterestResponse])
async def get_received_interests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all incoming interests received from prospective candidates."""
    query = select(Interest).where(Interest.recipient_id == current_user.id).order_by(Interest.created_at.desc())
    interests = (await db.execute(query)).scalars().all()

    sender_ids = list({it.sender_id for it in interests})
    prof_map = {}
    if sender_ids:
        profs = (await db.execute(select(Profile).where(Profile.user_id.in_(sender_ids)))).scalars().all()
        prof_map = {p.user_id: p for p in profs}

    responses: List[InterestResponse] = [
        InterestResponse(
            id=str(it.id),
            sender_id=str(it.sender_id),
            recipient_id=str(it.recipient_id),
            status=it.status,
            greeting_message=it.greeting_message,
            created_at=it.created_at,
            sender_profile=profile_to_card(prof_map[it.sender_id]) if it.sender_id in prof_map else None
        )
        for it in interests
    ]
    return responses


@router.get("/connected", response_model=List[InterestResponse])
async def get_connected_interests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all mutually connected matches (ACCEPTED) where current_user is either sender or recipient."""
    query = (
        select(Interest)
        .where(
            and_(
                Interest.status == InterestStatusEnum.ACCEPTED,
                or_(Interest.sender_id == current_user.id, Interest.recipient_id == current_user.id)
            )
        )
        .order_by(Interest.updated_at.desc())
    )
    interests = (await db.execute(query)).scalars().all()

    partner_ids = list({(it.recipient_id if it.sender_id == current_user.id else it.sender_id) for it in interests})
    prof_map = {}
    if partner_ids:
        profs = (await db.execute(select(Profile).where(Profile.user_id.in_(partner_ids)))).scalars().all()
        prof_map = {p.user_id: p for p in profs}

    responses: List[InterestResponse] = []
    for it in interests:
        other_user_id = it.recipient_id if it.sender_id == current_user.id else it.sender_id
        other_prof = prof_map.get(other_user_id)
        card = profile_to_card(other_prof) if other_prof else None
        responses.append(
            InterestResponse(
                id=str(it.id),
                sender_id=str(it.sender_id),
                recipient_id=str(it.recipient_id),
                status=it.status,
                greeting_message=it.greeting_message,
                created_at=it.created_at,
                sender_profile=card,
                recipient_profile=card
            )
        )
    return responses


@router.get("/sent", response_model=List[InterestResponse])
async def get_sent_interests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all outgoing interests sent by the authenticated user."""
    query = select(Interest).where(Interest.sender_id == current_user.id).order_by(Interest.created_at.desc())
    interests = (await db.execute(query)).scalars().all()

    recip_ids = list({it.recipient_id for it in interests})
    prof_map = {}
    if recip_ids:
        profs = (await db.execute(select(Profile).where(Profile.user_id.in_(recip_ids)))).scalars().all()
        prof_map = {p.user_id: p for p in profs}

    responses: List[InterestResponse] = [
        InterestResponse(
            id=str(it.id),
            sender_id=str(it.sender_id),
            recipient_id=str(it.recipient_id),
            status=it.status,
            greeting_message=it.greeting_message,
            created_at=it.created_at,
            recipient_profile=profile_to_card(prof_map[it.recipient_id]) if it.recipient_id in prof_map else None
        )
        for it in interests
    ]
    return responses


@router.patch("/{interest_id}/accept", response_model=InterestResponse)
async def accept_interest(
    interest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accepts an incoming interest and unlocks 1-on-1 private messaging."""
    interest_uuid = uuid.UUID(interest_id)
    interest = (await db.execute(select(Interest).where(Interest.id == interest_uuid))).scalars().first()

    if not interest or interest.recipient_id != current_user.id:
        raise HTTPException(status_code=404, detail="Interest invitation not found.")

    # Check Block Status (bidirectional safety barrier)
    is_blocked = (await db.execute(
        select(Block).where(
            or_(
                and_(Block.blocker_id == current_user.id, Block.blocked_user_id == interest.sender_id),
                and_(Block.blocker_id == interest.sender_id, Block.blocked_user_id == current_user.id)
            )
        )
    )).scalars().first()
    if is_blocked:
        raise HTTPException(status_code=400, detail="Cannot accept interest; user communication is restricted.")

    interest.status = InterestStatusEnum.ACCEPTED

    # Create Conversation Thread if not exists
    conv_check = await db.execute(
        select(Conversation)
        .join(ConversationParticipant)
        .where(ConversationParticipant.user_id.in_([interest.sender_id, interest.recipient_id]))
        .group_by(Conversation.id)
        .having(func.count(ConversationParticipant.user_id) == 2)
    )
    conv = conv_check.scalars().first()
    if not conv:
        conv = Conversation()
        db.add(conv)
        await db.flush()
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=interest.sender_id))
        db.add(ConversationParticipant(conversation_id=conv.id, user_id=interest.recipient_id))
        # Initial greeting system message
        db.add(Message(
            conversation_id=conv.id,
            sender_id=current_user.id,
            content="Interest accepted! You can now exchange messages respectfully.",
            status=MessageStatusEnum.DELIVERED
        ))

    # Notify Sender
    recip_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    recip_name = recip_prof.first_name if recip_prof else "Your match"
    db.add(Notification(
        user_id=interest.sender_id,
        title="Interest & Contact Consent Accepted!",
        message=f"{recip_name} accepted your interest. Mutual consent is established! You can now chat and unlock verified contact details.",
        notification_type=NotificationTypeEnum.INTEREST_ACCEPTED,
        reference_link=f"/chat"
    ))

    await db.commit()
    await db.refresh(interest)

    return InterestResponse(
        id=str(interest.id),
        sender_id=str(interest.sender_id),
        recipient_id=str(interest.recipient_id),
        status=interest.status,
        greeting_message=interest.greeting_message,
        created_at=interest.created_at
    )


@router.patch("/{interest_id}/decline", response_model=InterestResponse)
async def decline_interest(
    interest_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Declines an incoming interest quietly."""
    interest_uuid = uuid.UUID(interest_id)
    interest = (await db.execute(select(Interest).where(Interest.id == interest_uuid))).scalars().first()

    if not interest or interest.recipient_id != current_user.id:
        raise HTTPException(status_code=404, detail="Interest invitation not found.")

    interest.status = InterestStatusEnum.DECLINED
    await db.commit()
    await db.refresh(interest)

    return InterestResponse(
        id=str(interest.id),
        sender_id=str(interest.sender_id),
        recipient_id=str(interest.recipient_id),
        status=interest.status,
        greeting_message=interest.greeting_message,
        created_at=interest.created_at
    )
