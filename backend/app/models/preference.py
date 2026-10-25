"""
Analogy: The PartnerPreference model is like a customized search filter preset saved by a homebuyer in a real estate portal.
Instead of square footage and property zones, it stores acceptable age corridors, education thresholds, religious boundaries,
and dietary lifestyles that a candidate desires in their prospective life partner.
"""

import enum
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User

from backend.app.models.profile import MaritalStatusEnum


class ManglikPreferenceEnum(str, enum.Enum):
    STRICT_MATCH = "STRICT_MATCH"
    DOES_NOT_MATTER = "DOES_NOT_MATTER"


class PartnerPreference(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Expectation criteria vector used for bilateral compatibility scoring."""
    __tablename__ = "partner_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    
    min_age: Mapped[int] = mapped_column(Integer, default=21, nullable=False)
    max_age: Mapped[int] = mapped_column(Integer, default=35, nullable=False)
    min_height_cm: Mapped[int] = mapped_column(Integer, default=140, nullable=False)
    max_height_cm: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    
    # Multivalued array preferences stored in JSONB for GIN indexing
    acceptable_marital_statuses: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    acceptable_religions: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    acceptable_communities: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    acceptable_mother_tongues: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    acceptable_countries: Mapped[List[str]] = mapped_column(JSONB, default=lambda: ["India"], nullable=False)
    acceptable_cities: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    
    min_education_level: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    acceptable_employment_sectors: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    min_income_bracket: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    acceptable_diets: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    
    manglik_preference: Mapped[ManglikPreferenceEnum] = mapped_column(
        Enum(ManglikPreferenceEnum, name="manglik_preference_enum"),
        default=ManglikPreferenceEnum.DOES_NOT_MATTER,
        nullable=False
    )

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="partner_preference")
