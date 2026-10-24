"""
Analogy: The Profile model is like a comprehensive biographical resume and family portfolio presented during traditional
matrimonial introductions. It records education, career achievements, lineage, personal lifestyle habits, and astrological
background so prospective life partners and families can evaluate mutual life compatibility.
"""

import enum
import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional
from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from backend.app.models.user import User


class CreatedByEnum(str, enum.Enum):
    SELF = "SELF"
    PARENT = "PARENT"
    SIBLING = "SIBLING"
    RELATIVE = "RELATIVE"
    FRIEND = "FRIEND"


class GenderEnum(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"


class MaritalStatusEnum(str, enum.Enum):
    NEVER_MARRIED = "NEVER_MARRIED"
    DIVORCED = "DIVORCED"
    WIDOWED = "WIDOWED"
    AWAITING_DIVORCE = "AWAITING_DIVORCE"


class ManglikEnum(str, enum.Enum):
    YES = "YES"
    NO = "NO"
    DONT_KNOW = "DONT_KNOW"
    ANGSHIK = "ANGSHIK"


class EmploymentSectorEnum(str, enum.Enum):
    PRIVATE = "PRIVATE"
    GOVERNMENT = "GOVERNMENT"
    DEFENSE = "DEFENSE"
    BUSINESS = "BUSINESS"
    SELF_EMPLOYED = "SELF_EMPLOYED"
    NOT_WORKING = "NOT_WORKING"


class FamilyTypeEnum(str, enum.Enum):
    NUCLEAR = "NUCLEAR"
    JOINT = "JOINT"


class FamilyValuesEnum(str, enum.Enum):
    TRADITIONAL = "TRADITIONAL"
    MODERATE = "MODERATE"
    LIBERAL = "LIBERAL"


class DietEnum(str, enum.Enum):
    VEGETARIAN = "VEGETARIAN"
    NON_VEGETARIAN = "NON_VEGETARIAN"
    EGGETARIAN = "EGGETARIAN"
    VEGAN = "VEGAN"
    JAIN = "JAIN"


class SmokingDrinkingEnum(str, enum.Enum):
    NO = "NO"
    OCCASIONALLY = "OCCASIONALLY"
    YES = "YES"


class Profile(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Detailed matrimonial identity attached to a User."""
    __tablename__ = "profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    profile_id_display: Mapped[str] = mapped_column(
        String(16),
        unique=True,
        index=True,
        nullable=False
    )
    created_by: Mapped[CreatedByEnum] = mapped_column(
        Enum(CreatedByEnum, name="created_by_enum"),
        default=CreatedByEnum.SELF,
        nullable=False
    )
    
    # Personal & Identity
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    gender: Mapped[GenderEnum] = mapped_column(
        Enum(GenderEnum, name="gender_enum"),
        nullable=False,
        index=True
    )
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    height_cm: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    marital_status: Mapped[MaritalStatusEnum] = mapped_column(
        Enum(MaritalStatusEnum, name="marital_status_enum"),
        default=MaritalStatusEnum.NEVER_MARRIED,
        nullable=False,
        index=True
    )
    
    # Religion & Community
    religion: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    mother_tongue: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    community: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    sub_community: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    gotra: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    manglik: Mapped[ManglikEnum] = mapped_column(
        Enum(ManglikEnum, name="manglik_enum"),
        default=ManglikEnum.DONT_KNOW,
        nullable=False,
        index=True
    )
    
    # Education & Career
    highest_education: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    education_field: Mapped[str] = mapped_column(String(128), nullable=False)
    college_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    employment_sector: Mapped[EmploymentSectorEnum] = mapped_column(
        Enum(EmploymentSectorEnum, name="employment_sector_enum"),
        default=EmploymentSectorEnum.PRIVATE,
        nullable=False
    )
    occupation: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    annual_income_bracket: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    
    # Location
    residence_city: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    residence_state: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    residence_country: Mapped[str] = mapped_column(String(64), default="India", nullable=False, index=True)
    citizenship: Mapped[str] = mapped_column(String(64), default="Indian", nullable=False)
    
    # Family Background
    family_type: Mapped[FamilyTypeEnum] = mapped_column(
        Enum(FamilyTypeEnum, name="family_type_enum"),
        default=FamilyTypeEnum.NUCLEAR,
        nullable=False
    )
    family_values: Mapped[FamilyValuesEnum] = mapped_column(
        Enum(FamilyValuesEnum, name="family_values_enum"),
        default=FamilyValuesEnum.MODERATE,
        nullable=False
    )
    
    # Lifestyle Habits
    diet: Mapped[DietEnum] = mapped_column(
        Enum(DietEnum, name="diet_enum"),
        default=DietEnum.VEGETARIAN,
        nullable=False,
        index=True
    )
    smoking: Mapped[SmokingDrinkingEnum] = mapped_column(
        Enum(SmokingDrinkingEnum, name="smoking_enum"),
        default=SmokingDrinkingEnum.NO,
        nullable=False
    )
    drinking: Mapped[SmokingDrinkingEnum] = mapped_column(
        Enum(SmokingDrinkingEnum, name="drinking_enum"),
        default=SmokingDrinkingEnum.NO,
        nullable=False
    )
    
    # Bio & Meta
    bio_narrative: Mapped[str] = mapped_column(Text, nullable=False)
    profile_completeness_pct: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    is_searchable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="profile")
