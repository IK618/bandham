"""
Schemas for Admin & Moderator census, role governance, and disciplinary moderation.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from backend.app.models.user import UserRole, UserStatus


class AdminUserItem(BaseModel):
    id: str
    email: str
    phone_number: str
    role: UserRole
    status: UserStatus
    created_at: datetime
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_id_display: Optional[str] = None
    gender: Optional[str] = None
    city: Optional[str] = None


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserStatusRequest(BaseModel):
    status: UserStatus
    reason: Optional[str] = None
