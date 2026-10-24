"""
Analogy: The Photo model is like an art gallery's digital vault equipped with frosted glass privacy shutters.
It stores the S3 keys of original, thumbnail, and watermarked image assets, while tracking whether the picture is
publicly visible, blurred for strangers, or locked until private admission is requested and approved.
"""

import enum
import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class PhotoVisibilityEnum(str, enum.Enum):
    PUBLIC = "PUBLIC"
    MEMBERS_ONLY = "MEMBERS_ONLY"
    ACCEPTED_ONLY = "ACCEPTED_ONLY"
    ON_REQUEST = "ON_REQUEST"


class Photo(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Media assets with privacy and watermarking support."""
    __tablename__ = "photos"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    s3_key_original: Mapped[str] = mapped_column(String(512), nullable=False)
    s3_key_thumbnail: Mapped[str] = mapped_column(String(512), nullable=False)
    s3_key_watermarked: Mapped[str] = mapped_column(String(512), nullable=False)
    
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    visibility_mode: Mapped[PhotoVisibilityEnum] = mapped_column(
        Enum(PhotoVisibilityEnum, name="photo_visibility_enum"),
        default=PhotoVisibilityEnum.MEMBERS_ONLY,
        nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="photos")
