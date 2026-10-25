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


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    duration_months: Optional[int] = None
    price_cents: Optional[int] = None
    currency: Optional[str] = "INR"
    contact_credits_quota: Optional[int] = None
    can_initiate_chat: Optional[bool] = None
    can_view_hidden_photos: Optional[bool] = None
    priority_boost: Optional[int] = None
    is_active: Optional[bool] = None


class PlanCreate(BaseModel):
    name: str
    duration_months: int = 3
    price_cents: int
    currency: str = "INR"
    contact_credits_quota: int = 50
    can_initiate_chat: bool = True
    can_view_hidden_photos: bool = False
    priority_boost: int = 2
    is_active: bool = True


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
