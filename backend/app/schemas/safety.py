"""
Analogy: The Safety schemas are like the formal complaint affidavit and incident report forms filed with a trust office.
They validate report categories, incident descriptions, block orders, and moderator resolution notes.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from backend.app.models.safety import ReportCategoryEnum, ReportStatusEnum, NotificationTypeEnum


class BlockCreate(BaseModel):
    blocked_user_id: str


class BlockResponse(BaseModel):
    id: str
    blocker_id: str
    blocked_user_id: str
    created_at: datetime


class ReportCreate(BaseModel):
    reported_user_id: str
    category: ReportCategoryEnum
    description: str = Field(..., min_length=10, max_length=1000)
    include_chat_context: bool = False


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reported_user_id: str
    category: ReportCategoryEnum
    description: str
    status: ReportStatusEnum
    created_at: datetime


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: NotificationTypeEnum
    reference_link: Optional[str] = None
    is_read: bool
    created_at: datetime
