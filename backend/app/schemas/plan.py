"""
Analogy: The Plan schemas are like the tier membership menu and cashier checkout receipt formats.
They define the durations, prices, and contact unlock allowances for each plan, and validate upgrade requests.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.models.plan import SubscriptionStatusEnum, PaymentStatusEnum


class PlanResponse(BaseModel):
    id: str
    name: str
    duration_months: int
    price_cents: int
    currency: str
    contact_credits_quota: int
    can_initiate_chat: bool
    can_view_hidden_photos: bool
    priority_boost: int
    is_active: bool


class SubscriptionResponse(BaseModel):
    id: str
    plan_id: str
    plan_name: str
    status: SubscriptionStatusEnum
    starts_at: datetime
    expires_at: datetime
    contact_credits_remaining: int


class MockCheckoutRequest(BaseModel):
    plan_id: str
    payment_method: str = "UPI"


class MockCheckoutResponse(BaseModel):
    subscription_id: str
    transaction_ref: str
    status: PaymentStatusEnum
    message: str
