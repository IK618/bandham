"""
Analogy: The Plan and Subscription models are like season tickets and digital access passes for an exclusive club.
The Plan defines the tier privileges (Free, Gold, Platinum) and contact unlock allowances, while the Subscription
tracks the member's active period, remaining contact credits, and historical payment receipts.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class SubscriptionStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class PaymentStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class Plan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Product catalog definition for monetization tiers."""
    __tablename__ = "plans"

    name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    duration_months: Mapped[int] = mapped_column(Integer, nullable=False)
    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    
    contact_credits_quota: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    can_initiate_chat: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_view_hidden_photos: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    priority_boost: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="plan")


class Subscription(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Active or historical entitlement pass held by a user."""
    __tablename__ = "subscriptions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id"),
        nullable=False
    )
    status: Mapped[SubscriptionStatusEnum] = mapped_column(
        Enum(SubscriptionStatusEnum, name="subscription_status_enum"),
        default=SubscriptionStatusEnum.ACTIVE,
        nullable=False,
        index=True
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    contact_credits_remaining: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="subscriptions")
    plan: Mapped["Plan"] = relationship("Plan", back_populates="subscriptions")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="subscription")


class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Financial transaction ledger record."""
    __tablename__ = "payments"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("subscriptions.id"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    payment_gateway: Mapped[str] = mapped_column(String(32), default="STUB", nullable=False)
    transaction_ref: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    status: Mapped[PaymentStatusEnum] = mapped_column(
        Enum(PaymentStatusEnum, name="payment_status_enum"),
        default=PaymentStatusEnum.PENDING,
        nullable=False,
        index=True
    )

    subscription: Mapped["Subscription"] = relationship("Subscription", back_populates="payments")
