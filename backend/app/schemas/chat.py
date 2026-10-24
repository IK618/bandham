"""
Analogy: The Chat schemas are like standardized letter envelopes and dispatch receipts for instant private telegrams.
They dictate message text formatting, conversation thread membership, and delivery/read indicator stamps.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.models.chat import MessageStatusEnum
from backend.app.schemas.profile import ProfilePublicCard


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    content: str
    status: MessageStatusEnum
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    partner_profile: Optional[ProfilePublicCard] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    updated_at: datetime
