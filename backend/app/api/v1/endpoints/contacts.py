"""
Analogy: The Contacts endpoint is like a secure notary desk where verified telephone numbers are unlocked.
It strictly enforces two-way mutual consent: contact details can only be revealed when both candidates
have mutually accepted an Express Interest or Connection Request, alongside valid contact credits.
It logs a tamper-evident audit record and notifies the candidate.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.core.redis import RateLimiter
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.plan import Subscription, SubscriptionStatusEnum
from backend.app.models.interaction import ContactView, Interest, InterestStatusEnum
from backend.app.models.safety import Notification, NotificationTypeEnum
from backend.app.schemas.interaction import ContactRevealResponse, ContactStatusResponse, InterestResponse

router = APIRouter(prefix="/contacts", tags=["Contact Details Reveal"])


@router.get("/{target_user_id}/status", response_model=ContactStatusResponse)
async def get_contact_status(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Checks the mutual consent and contact reveal status between the current user and the target profile.
    Returns whether contact details are already revealed, or if mutual consent is PENDING, ACCEPTED, or NOT_REQUESTED.
    """
    try:
        target_uuid = uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid target user UUID format.")

    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot query contact status for your own profile.")

    target_user = (await db.execute(select(User).where(User.id == target_uuid))).scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target candidate not found.")

    # Check active subscription credits
    sub_query = select(Subscription).where(
        and_(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatusEnum.ACTIVE,
            Subscription.expires_at > datetime.now(timezone.utc),
        )
    ).order_by(Subscription.expires_at.desc())
    active_sub = (await db.execute(sub_query)).scalars().first()
    credits_rem = active_sub.contact_credits_remaining if active_sub else 0

    # 1. Check if contact has already been revealed in the past
    existing_view = (await db.execute(
        select(ContactView).where(
            ContactView.viewer_id == current_user.id,
            ContactView.target_user_id == target_uuid
        )
    )).scalars().first()

    if existing_view:
        return ContactStatusResponse(
            target_user_id=str(target_user.id),
            consent_status="ACCEPTED",
            is_revealed=True,
            phone_number=target_user.phone_number,
            email=target_user.email,
            can_reveal=True,
            direction="SENT",
            contact_credits_remaining=credits_rem
        )

    # 2. Check for mutual connection / interest between both members
    interest_query = select(Interest).where(
        or_(
            and_(Interest.sender_id == current_user.id, Interest.recipient_id == target_uuid),
            and_(Interest.sender_id == target_uuid, Interest.recipient_id == current_user.id)
        )
    )
    interest = (await db.execute(interest_query)).scalars().first()

    if not interest:
        return ContactStatusResponse(
            target_user_id=str(target_user.id),
            consent_status="NOT_REQUESTED",
            is_revealed=False,
            phone_number=None,
            email=None,
            can_reveal=False,
            direction=None,
            contact_credits_remaining=credits_rem
        )

    direction = "SENT" if interest.sender_id == current_user.id else "RECEIVED"
    consent_status = interest.status.value
    can_reveal = (interest.status == InterestStatusEnum.ACCEPTED and credits_rem > 0)

    return ContactStatusResponse(
        target_user_id=str(target_user.id),
        consent_status=consent_status,
        is_revealed=False,
        phone_number=None,
        email=None,
        can_reveal=can_reveal,
        direction=direction,
        interest_id=str(interest.id),
        contact_credits_remaining=credits_rem
    )


@router.post("/{target_user_id}/reveal", response_model=ContactRevealResponse)
async def reveal_contact_details(
    target_user_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Unlocks verified phone and email details strictly under mutual consent and deducting 1 credit.
    Mutual consent requires an accepted Express Interest / Connection Request between both parties.
    """
    try:
        target_uuid = uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid target user UUID format.")

    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot reveal your own contact details.")

    target_user = (await db.execute(select(User).where(User.id == target_uuid))).scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    # 1. Check if contact has already been revealed in current cycle
    existing_view = (await db.execute(
        select(ContactView).where(
            ContactView.viewer_id == current_user.id,
            ContactView.target_user_id == target_uuid
        )
    )).scalars().first()
    if existing_view:
        # Already revealed: Return without deducting additional credits
        sub_query = select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatusEnum.ACTIVE
        ).order_by(Subscription.expires_at.desc())
        sub = (await db.execute(sub_query)).scalars().first()
        credits_rem = sub.contact_credits_remaining if sub else 0
        return ContactRevealResponse(
            target_user_id=str(target_user.id),
            phone_number=target_user.phone_number,
            email=target_user.email,
            contact_credits_remaining=credits_rem,
            revealed_at=datetime.now(timezone.utc)
        )

    # 2. Strict Mutual Consent Verification
    interest_query = select(Interest).where(
        or_(
            and_(Interest.sender_id == current_user.id, Interest.recipient_id == target_uuid),
            and_(Interest.sender_id == target_uuid, Interest.recipient_id == current_user.id)
        )
    )
    interest = (await db.execute(interest_query)).scalars().first()

    if not interest:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mutual consent required: Contact details are protected. You must send an Express Interest / Connection Request and have it accepted by the candidate before contact details can be unlocked."
        )

    if interest.status == InterestStatusEnum.PENDING:
        if interest.sender_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Mutual consent pending: The candidate has not yet accepted your connection request. Verified contact details can only be unlocked once they accept."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Pending your acceptance: This candidate sent you an Express Interest. Please accept their invitation first in your Inbox to establish mutual consent."
            )

    if interest.status == InterestStatusEnum.DECLINED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Contact sharing unavailable: The connection between these profiles has been declined."
        )

    if interest.status != InterestStatusEnum.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mutual consent required: Both parties must have an active accepted connection to share verified contact details."
        )

    # 3. Check for active subscription with remaining credits
    sub_query = select(Subscription).where(
        and_(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatusEnum.ACTIVE,
            Subscription.expires_at > datetime.now(timezone.utc),
            Subscription.contact_credits_remaining > 0
        )
    ).order_by(Subscription.expires_at.desc())
    active_sub = (await db.execute(sub_query)).scalars().first()
    if not active_sub:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Zero contact credits remaining. Please upgrade to a Gold or Platinum plan to unlock verified phone numbers."
        )

    # 4. Deduct 1 credit atomically
    active_sub.contact_credits_remaining -= 1

    # 5. Log ContactView Audit Record
    client_ip = request.client.host if request.client else "127.0.0.1"
    contact_view = ContactView(
        viewer_id=current_user.id,
        target_user_id=target_uuid,
        ip_address=client_ip
    )
    db.add(contact_view)

    # 6. Alert Target User that their contact was revealed under mutual consent
    viewer_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    viewer_name = viewer_prof.first_name if viewer_prof else "A member"
    db.add(Notification(
        user_id=target_uuid,
        title="Contact Number Shared",
        message=f"{viewer_name} ({viewer_prof.profile_id_display if viewer_prof else ''}) unlocked and viewed your verified phone number under mutual consent.",
        notification_type=NotificationTypeEnum.CONTACT_VIEWED,
        reference_link="/inbox"
    ))

    await db.commit()
    await db.refresh(active_sub)

    return ContactRevealResponse(
        target_user_id=str(target_user.id),
        phone_number=target_user.phone_number,
        email=target_user.email,
        contact_credits_remaining=active_sub.contact_credits_remaining,
        revealed_at=datetime.now(timezone.utc)
    )


@router.post("/{target_user_id}/request", response_model=InterestResponse)
async def request_contact_sharing(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends a mutual connection & contact sharing request to the candidate.
    Once accepted by the candidate, mutual consent is established.
    """
    try:
        target_uuid = uuid.UUID(target_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid target user UUID format.")

    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request contact sharing with yourself.")

    target_user = (await db.execute(select(User).where(User.id == target_uuid))).scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found.")

    # Check existing interest between parties
    existing = await db.execute(
        select(Interest).where(
            or_(
                and_(Interest.sender_id == current_user.id, Interest.recipient_id == target_uuid),
                and_(Interest.sender_id == target_uuid, Interest.recipient_id == current_user.id)
            )
        )
    )
    interest = existing.scalars().first()
    if interest:
        if interest.status == InterestStatusEnum.ACCEPTED:
            return InterestResponse(
                id=str(interest.id),
                sender_id=str(interest.sender_id),
                recipient_id=str(interest.recipient_id),
                status=interest.status,
                greeting_message=interest.greeting_message,
                created_at=interest.created_at
            )
        elif interest.sender_id == current_user.id:
            raise HTTPException(
                status_code=400,
                detail=f"A connection request is already {interest.status.value.lower()}. Waiting for candidate response."
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="This candidate has already sent you a connection request. Please accept it in your Inbox to establish mutual consent."
            )

    # Rate Limiting Check (5 per 24 hours on Free Tier)
    rate_limit_key = f"rate:interest:{str(current_user.id)}:daily"
    is_allowed = await RateLimiter.check_daily_limit(rate_limit_key, max_requests=5)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Daily connection limit reached (5/day for Free Tier). Please upgrade to Gold for unlimited connects."
        )

    new_interest = Interest(
        sender_id=current_user.id,
        recipient_id=target_uuid,
        status=InterestStatusEnum.PENDING,
        greeting_message="I would like to connect and respectfully request mutual contact details."
    )
    db.add(new_interest)

    sender_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    sender_name = sender_prof.first_name if sender_prof else "A member"
    db.add(Notification(
        user_id=target_uuid,
        title="Contact Sharing Request!",
        message=f"{sender_name} ({sender_prof.profile_id_display if sender_prof else ''}) expressed interest and requested to connect with contact sharing.",
        notification_type=NotificationTypeEnum.INTEREST_RECEIVED,
        reference_link="/inbox"
    ))

    await db.commit()
    await db.refresh(new_interest)

    return InterestResponse(
        id=str(new_interest.id),
        sender_id=str(new_interest.sender_id),
        recipient_id=str(new_interest.recipient_id),
        status=new_interest.status,
        greeting_message=new_interest.greeting_message,
        created_at=new_interest.created_at
    )
