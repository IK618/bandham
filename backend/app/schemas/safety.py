"""
Analogy: The Safety schemas are like the formal complaint affidavit and incident report forms filed with a trust office.
They validate report categories, incident descriptions, block orders, and moderator resolution notes.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.models.safety import ReportCategoryEnum, ReportStatusEnum, NotificationTypeEnum
from backend.app.models.user import UserRole, UserStatus


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
    reported_name: Optional[str] = None
    reporter_name: Optional[str] = None
    has_transcript: bool = False


class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: NotificationTypeEnum
    reference_link: Optional[str] = None
    is_read: bool
    created_at: datetime


# Admin & Governance schemas consolidated under trust & safety
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
    id_verified: bool = False
    selfie_verified: bool = False
    employment_verified: bool = False
    family_reference_verified: bool = False
    trust_shield_score: int = 0
    family_references: Optional[List[Dict[str, Any]]] = None


class UpdateUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserStatusRequest(BaseModel):
    status: UserStatus
    reason: Optional[str] = None


class UpdateTrustBadgeRequest(BaseModel):
    id_verified: Optional[bool] = None
    selfie_verified: Optional[bool] = None
    employment_verified: Optional[bool] = None
    family_reference_verified: Optional[bool] = None


# 4-Pillar Trust Shield Submission Schemas
class TrustShieldFamilyReferenceItem(BaseModel):
    name: str
    relation: str
    phone: str
    city: str
    verified: bool = False


class TrustShieldSubmitIdRequest(BaseModel):
    id_type: str = "Aadhaar / Voter ID"
    id_number_masked: str
    document_url: Optional[str] = None


class TrustShieldSubmitSelfieRequest(BaseModel):
    selfie_image_url: str = "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
    liveness_confirmed: bool = True


class TrustShieldSubmitEmploymentRequest(BaseModel):
    company_name: str
    designation: str
    official_email: Optional[str] = None
    work_id_proof_url: Optional[str] = None


class TrustShieldSubmitFamilyReferencesRequest(BaseModel):
    references: List[TrustShieldFamilyReferenceItem]


class TrustShieldStatusResponse(BaseModel):
    trust_shield_score: int
    id_verified: bool
    selfie_verified: bool
    employment_verified: bool
    family_reference_verified: bool
    family_references: List[Dict[str, Any]] = []
