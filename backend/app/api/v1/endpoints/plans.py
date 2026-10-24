"""
Analogy: The Plans endpoint is like the membership admissions desk and cashier counter of an upscale club.
It showcases tier packages (Gold, Platinum, Diamond), checks active passes, and provides sandbox checkout simulation.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.plan import (
    Payment,
    PaymentStatusEnum,
    Plan,
    Subscription,
    SubscriptionStatusEnum,
)
from backend.app.schemas.plan import (
    MockCheckoutRequest,
    MockCheckoutResponse,
    PlanResponse,
    SubscriptionResponse,
)

router = APIRouter(prefix="", tags=["Plans & Subscriptions"])


@router.get("/plans", response_model=List[PlanResponse])
async def list_plans(db: AsyncSession = Depends(get_db)):
    """Retrieves the public membership tier pricing catalog."""
    query = select(Plan).where(Plan.is_active == True).order_by(Plan.price_cents.asc())
    plans = (await db.execute(query)).scalars().all()
    return [
        PlanResponse(
            id=str(p.id),
            name=p.name,
            duration_months=p.duration_months,
            price_cents=p.price_cents,
            currency=p.currency,
            contact_credits_quota=p.contact_credits_quota,
            can_initiate_chat=p.can_initiate_chat,
            can_view_hidden_photos=p.can_view_hidden_photos,
            priority_boost=p.priority_boost,
            is_active=p.is_active
        )
        for p in plans
    ]


@router.get("/subscriptions/me", response_model=SubscriptionResponse)
async def get_my_active_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves the authenticated user's active membership pass and remaining credits."""
    query = (
        select(Subscription)
        .where(
            and_(
                Subscription.user_id == current_user.id,
                Subscription.status == SubscriptionStatusEnum.ACTIVE,
                Subscription.expires_at > datetime.now(timezone.utc)
            )
        )
        .order_by(Subscription.expires_at.desc())
    )
    sub = (await db.execute(query)).scalar_one_or_none()

    if not sub:
        # Default Free tier representation
        return SubscriptionResponse(
            id="free-tier",
            plan_id="free-plan",
            plan_name="FREE",
            status=SubscriptionStatusEnum.ACTIVE,
            starts_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=365),
            contact_credits_remaining=0
        )

    plan = (await db.execute(select(Plan).where(Plan.id == sub.plan_id))).scalar_one()

    return SubscriptionResponse(
        id=str(sub.id),
        plan_id=str(sub.plan_id),
        plan_name=plan.name,
        status=sub.status,
        starts_at=sub.starts_at,
        expires_at=sub.expires_at,
        contact_credits_remaining=sub.contact_credits_remaining
    )


@router.post("/subscriptions/checkout-mock", response_model=MockCheckoutResponse)
async def mock_checkout(
    payload: MockCheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Simulates payment gateway checkout (Stripe/Razorpay stub) and activates subscription pass."""
    plan_uuid = uuid.UUID(payload.plan_id)
    plan = (await db.execute(select(Plan).where(Plan.id == plan_uuid))).scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Selected plan does not exist.")

    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=plan.duration_months * 30)

    # Create Subscription
    sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        status=SubscriptionStatusEnum.ACTIVE,
        starts_at=now,
        expires_at=expires_at,
        contact_credits_remaining=plan.contact_credits_quota
    )
    db.add(sub)
    await db.flush()

    # Record Payment Transaction
    tx_ref = f"TXN-{uuid.uuid4().hex[:12].upper()}"
    payment = Payment(
        subscription_id=sub.id,
        user_id=current_user.id,
        amount_cents=plan.price_cents,
        currency=plan.currency,
        payment_gateway=f"MOCK_{payload.payment_method.upper()}",
        transaction_ref=tx_ref,
        status=PaymentStatusEnum.COMPLETED
    )
    db.add(payment)
    await db.commit()

    return MockCheckoutResponse(
        subscription_id=str(sub.id),
        transaction_ref=tx_ref,
        status=PaymentStatusEnum.COMPLETED,
        message=f"Successfully upgraded to {plan.name} plan! {plan.contact_credits_quota} contact credits allocated."
    )
