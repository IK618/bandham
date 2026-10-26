"""
Analogy: The Safety models are like an estate's private security service, identity notary office, and grievance bureau.
They verify official government credentials, enforce protective restraining orders (Blocks), investigate incident claims (Reports),
and log every security-relevant action in an unalterable audit register.
"""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class VerificationTypeEnum(str, enum.Enum):
    GOVERNMENT_ID = "GOVERNMENT_ID"
    SELFIE_LIVENESS = "SELFIE_LIVENESS"
    SALARY_SLIP = "SALARY_SLIP"


class VerificationStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReportCategoryEnum(str, enum.Enum):
    FAKE_PROFILE = "FAKE_PROFILE"
    HARASSMENT = "HARASSMENT"
    FINANCIAL_SCAM = "FINANCIAL_SCAM"
    MARRIED_FRAUD = "MARRIED_FRAUD"
    INAPPROPRIATE_MEDIA = "INAPPROPRIATE_MEDIA"


class ReportStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class NotificationTypeEnum(str, enum.Enum):
    INTEREST_RECEIVED = "INTEREST_RECEIVED"
    INTEREST_ACCEPTED = "INTEREST_ACCEPTED"
    CONTACT_VIEWED = "CONTACT_VIEWED"
    MESSAGE_RECEIVED = "MESSAGE_RECEIVED"
    SYSTEM = "SYSTEM"


class Verification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Trust credentials submitted by users for verified badge status."""
    __tablename__ = "verifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    verification_type: Mapped[VerificationTypeEnum] = mapped_column(
        Enum(VerificationTypeEnum, name="verification_type_enum"),
        nullable=False
    )
    document_s3_key: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[VerificationStatusEnum] = mapped_column(
        Enum(VerificationStatusEnum, name="verification_status_enum"),
        default=VerificationStatusEnum.PENDING,
        nullable=False,
        index=True
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="verifications")


class Report(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Member incident reports submitted to platform moderators."""
    __tablename__ = "reports"

    reporter_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    reported_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category: Mapped[ReportCategoryEnum] = mapped_column(
        Enum(ReportCategoryEnum, name="report_category_enum"),
        nullable=False,
        index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    attached_chat_context: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    chat_transcript_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[ReportStatusEnum] = mapped_column(
        Enum(ReportStatusEnum, name="report_status_enum"),
        default=ReportStatusEnum.PENDING,
        nullable=False,
        index=True
    )
    resolved_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class Block(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Bidirectional block record severing all visibility and messaging."""
    __tablename__ = "blocks"

    blocker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    blocked_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    __table_args__ = (
        UniqueConstraint("blocker_id", "blocked_user_id", name="uq_blocks_blocker_blocked"),
    )


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """In-app alert delivered to user notifications bell."""
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    notification_type: Mapped[NotificationTypeEnum] = mapped_column(
        Enum(NotificationTypeEnum, name="notification_type_enum"),
        nullable=False
    )
    reference_link: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    user: Mapped["User"] = relationship("User", back_populates="notifications")


class AuditLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Append-only security and compliance audit trail."""
    __tablename__ = "audit_logs"

    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    actor: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
