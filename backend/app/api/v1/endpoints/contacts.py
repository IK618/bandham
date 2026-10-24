"""
Analogy: The Contacts endpoint is like a secure notary desk where verified telephone numbers are unlocked.
It verifies that the requesting member holds paid contact credits, deducts one token from their subscription pass,
reveals the verified phone and email, logs a tamper-evident audit record, and alerts the target candidate.
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.plan import Subscription, SubscriptionStatusEnum
from backend.app.models.interaction import ContactView
from backend.app.models.safety import Notification, NotificationTypeEnum
from backend.app.schemas.interaction import ContactRevealResponse

router = APIRouter(prefix="/contacts", tags=["Contact Details Reveal"])


@router.post("/{target_user_id}/reveal", response_model=ContactRevealResponse)
async def reveal_contact_details(
    target_user_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlocks verified phone and email details by deducting 1 credit from an active subscription."""
    target_uuid = uuid.UUID(target_user_id)
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

    # 2. Check for active subscription with remaining credits
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
            status_code=403,
            detail="Zero contact credits remaining. Please upgrade to a Gold or Platinum plan to unlock verified phone numbers."
        )

    # 3. Deduct 1 credit atomically
    active_sub.contact_credits_remaining -= 1

    # 4. Log ContactView Audit Record
    client_ip = request.client.host if request.client else "127.0.0.1"
    contact_view = ContactView(
        viewer_id=current_user.id,
        target_user_id=target_uuid,
        ip_address=client_ip
    )
    db.add(contact_view)

    # 5. Alert Target User
    viewer_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    viewer_name = viewer_prof.first_name if viewer_prof else "A member"
    db.add(Notification(
        user_id=target_uuid,
        title="Contact Number Viewed",
        message=f"{viewer_name} ({viewer_prof.profile_id_display if viewer_prof else ''}) unlocked and viewed your verified phone number.",
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
