"""
Analogy: The User model is like the master identity ledger and biometric passport issued by a government authority.
It stores login credentials, verifies communication channels, and tracks security status, acting as the root anchor
to which all matrimonial profiles, subscriptions, and private interactions are securely attached.
"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.profile import Profile
    from backend.app.models.preference import PartnerPreference
    from backend.app.models.photo import Photo
    from backend.app.models.plan import Subscription
    from backend.app.models.safety import Verification, Notification, AuditLog


class UserRole(str, enum.Enum):
    MEMBER = "MEMBER"
    MODERATOR = "MODERATOR"
    ADMIN = "ADMIN"


class UserStatus(str, enum.Enum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"
    BANNED = "BANNED"


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Core account and security principal."""
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum"),
        default=UserRole.MEMBER,
        nullable=False,
        index=True
    )
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status_enum"),
        default=UserStatus.PENDING_VERIFICATION,
        nullable=False,
        index=True
    )
    
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile: Mapped[Optional["Profile"]] = relationship("Profile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    partner_preference: Mapped[Optional["PartnerPreference"]] = relationship("PartnerPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    photos: Mapped[List["Photo"]] = relationship("Photo", back_populates="user", cascade="all, delete-orphan")
    subscriptions: Mapped[List["Subscription"]] = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    verifications: Mapped[List["Verification"]] = relationship("Verification", foreign_keys="Verification.user_id", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="actor", cascade="all, delete-orphan")
