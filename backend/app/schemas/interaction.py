"""
Analogy: The Interaction schemas are like digital envelopes for formal wedding calling cards (Interests),
bookmark tabs (Shortlists), and verified contact unlock vouchers (ContactView).
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from backend.app.models.interaction import InterestStatusEnum
from backend.app.schemas.profile import ProfilePublicCard


class InterestCreate(BaseModel):
    recipient_id: str
    greeting_message: Optional[str] = Field(None, max_length=255)


class InterestResponse(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    status: InterestStatusEnum
    greeting_message: Optional[str] = None
    created_at: datetime
    sender_profile: Optional[ProfilePublicCard] = None
    recipient_profile: Optional[ProfilePublicCard] = None


class ShortlistCreate(BaseModel):
    shortlisted_user_id: str
    notes: Optional[str] = Field(None, max_length=255)


class ShortlistResponse(BaseModel):
    id: str
    user_id: str
    shortlisted_user_id: str
    notes: Optional[str] = None
    created_at: datetime
    shortlisted_profile: Optional[ProfilePublicCard] = None


class ContactRevealResponse(BaseModel):
    target_user_id: str
    phone_number: str
    email: str
    contact_credits_remaining: int
    revealed_at: datetime


class ContactStatusResponse(BaseModel):
    """Reflects mutual consent and contact reveal status between two profiles."""
    target_user_id: str
    consent_status: str  # "NOT_REQUESTED", "PENDING", "ACCEPTED", "DECLINED"
    is_revealed: bool
    phone_number: Optional[str] = None
    email: Optional[str] = None
    can_reveal: bool
    direction: Optional[str] = None  # "SENT" or "RECEIVED"
    interest_id: Optional[str] = None
    contact_credits_remaining: int = 0

