"""
Analogy: The Interaction models are like formal wedding calling cards, personal bookmarks, and an access audit ledger.
An Interest is a formal greeting sent between parties; a Shortlist is a private bookmark for family discussion;
and a ContactView is an auditable register entry logging every time a member reveals verified phone details.
"""

import enum
import uuid
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class InterestStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class Interest(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Asymmetric Express Interest handshake between two profiles."""
    __tablename__ = "interests"

    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    recipient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status: Mapped[InterestStatusEnum] = mapped_column(
        Enum(InterestStatusEnum, name="interest_status_enum"),
        default=InterestStatusEnum.PENDING,
        nullable=False,
        index=True
    )
    greeting_message: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint("sender_id", "recipient_id", name="uq_interests_sender_recipient"),
    )


class Shortlist(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Private bookmark saved by a member."""
    __tablename__ = "shortlists"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    shortlisted_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "shortlisted_user_id", name="uq_shortlists_user_target"),
    )


class ContactView(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Audit log record for contact reveals."""
    __tablename__ = "contact_views"

    viewer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    target_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
