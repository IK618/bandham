"""
Analogy: The Profile schemas are like the standardized formatting sheets of a biographical portfolio.
They validate that height, birth dates, education, and narratives meet clean standards,
and control what fields can be publicly viewed versus redacted for strangers.
"""

from datetime import date
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
import re
from backend.app.models.profile import (
    CreatedByEnum,
    GenderEnum,
    MaritalStatusEnum,
    ManglikEnum,
    EmploymentSectorEnum,
    FamilyTypeEnum,
    FamilyValuesEnum,
    DietEnum,
    SmokingDrinkingEnum,
)
from backend.app.models.preference import ManglikPreferenceEnum


class ProfileBase(BaseModel):
    created_by: CreatedByEnum = CreatedByEnum.SELF
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    gender: GenderEnum
    date_of_birth: date
    height_cm: int = Field(..., ge=130, le=220)
    marital_status: MaritalStatusEnum = MaritalStatusEnum.NEVER_MARRIED

    religion: str = Field(default="Hindu", max_length=64)
    mother_tongue: str = Field(default="Hindi", max_length=64)
    community: Optional[str] = Field(default=None, max_length=64)
    sub_community: Optional[str] = None
    gotra: Optional[str] = None
    manglik: Optional[ManglikEnum] = ManglikEnum.DONT_KNOW

    highest_education: str = Field(default="Bachelors", max_length=128)
    education_field: str = Field(default="General", max_length=128)
    college_name: Optional[str] = None
    employment_sector: EmploymentSectorEnum = EmploymentSectorEnum.PRIVATE
    occupation: str = Field(default="Professional", max_length=128)
    annual_income_bracket: str = "INR 10-15 LPA"

    residence_city: str = Field(default="Bangalore", max_length=128)
    residence_state: str = Field(default="Karnataka", max_length=128)
    residence_country: str = Field(default="India", max_length=64)
    citizenship: str = Field(default="Indian", max_length=64)

    family_type: FamilyTypeEnum = FamilyTypeEnum.NUCLEAR
    family_values: FamilyValuesEnum = FamilyValuesEnum.MODERATE

    diet: DietEnum = DietEnum.VEGETARIAN
    smoking: SmokingDrinkingEnum = SmokingDrinkingEnum.NO
    drinking: SmokingDrinkingEnum = SmokingDrinkingEnum.NO

    bio_narrative: str = Field(..., max_length=3000)

    @field_validator("community", mode="before")
    @classmethod
    def sanitize_community(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip()

    @field_validator("gotra", mode="before")
    @classmethod
    def sanitize_gotra(cls, v: Optional[str]) -> Optional[str]:
        if not v or not str(v).strip():
            return None
        return str(v).strip()

    @field_validator("manglik", mode="before")
    @classmethod
    def sanitize_manglik(cls, v: object) -> ManglikEnum:
        if not v:
            return ManglikEnum.DONT_KNOW
        return v

    @field_validator("religion", "mother_tongue", "highest_education", "education_field", "occupation", "residence_city", "residence_state", mode="before")
    @classmethod
    def sanitize_required_strings(cls, v: Optional[str]) -> str:
        if not v or not str(v).strip() or len(str(v).strip()) < 2:
            return "General"
        return str(v).strip()

    @field_validator("bio_narrative", mode="before")
    @classmethod
    def sanitize_bio_narrative(cls, v: str) -> str:
        """Strips phone numbers and external links from bio narrative to protect privacy."""
        if not v or not str(v).strip():
            v = "Looking for a compatible, caring life partner with shared family values and mutual understanding."
        v = str(v).strip()
        # Strip phone numbers (7 to 14 digits)
        v = re.sub(r"\b\d{7,14}\b", "[REDACTED PHONE]", v)
        # Strip URLs and email addresses
        v = re.sub(r"https?://\S+|www\.\S+", "[REDACTED LINK]", v)
        v = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[REDACTED EMAIL]", v)
        if len(v) < 50:
            v = v + " Looking forward to connecting with an understanding life partner."
        return v


# ProfileCreate is an alias of ProfileBase to avoid redundant duplicate schemas
ProfileCreate = ProfileBase


class ProfileUpdate(BaseModel):
    created_by: Optional[CreatedByEnum] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[GenderEnum] = None
    date_of_birth: Optional[date] = None
    height_cm: Optional[int] = Field(None, ge=130, le=220)
    marital_status: Optional[MaritalStatusEnum] = None
    religion: Optional[str] = None
    mother_tongue: Optional[str] = None
    community: Optional[str] = None
    sub_community: Optional[str] = None
    gotra: Optional[str] = None
    manglik: Optional[ManglikEnum] = None
    highest_education: Optional[str] = None
    education_field: Optional[str] = None
    college_name: Optional[str] = None
    employment_sector: Optional[EmploymentSectorEnum] = None
    occupation: Optional[str] = None
    annual_income_bracket: Optional[str] = None
    residence_city: Optional[str] = None
    residence_state: Optional[str] = None
    residence_country: Optional[str] = None
    citizenship: Optional[str] = None
    family_type: Optional[FamilyTypeEnum] = None
    family_values: Optional[FamilyValuesEnum] = None
    diet: Optional[DietEnum] = None
    smoking: Optional[SmokingDrinkingEnum] = None
    drinking: Optional[SmokingDrinkingEnum] = None
    bio_narrative: Optional[str] = None
    is_searchable: Optional[bool] = None


class ProfilePublicCard(BaseModel):
    """Redacted profile card rendered in public search grids."""
    id: str
    user_id: str
    profile_id_display: str
    first_name: str
    last_initial: str
    gender: GenderEnum
    age: int
    height_cm: int
    marital_status: MaritalStatusEnum
    religion: str
    community: Optional[str] = None
    mother_tongue: str
    highest_education: str
    occupation: str
    annual_income_bracket: str
    residence_city: str
    residence_state: str
    diet: DietEnum
    manglik: Optional[ManglikEnum] = ManglikEnum.DONT_KNOW
    bio_narrative: str
    thumbnail_url: Optional[str] = None
    is_photo_blurred: bool = False
    compatibility_score: Optional[float] = None
    id_verified: bool = False
    selfie_verified: bool = False
    employment_verified: bool = False
    family_reference_verified: bool = False
    trust_shield_score: int = 0


class ProfileDetailResponse(ProfileBase):
    """Full detail view for authenticated members."""
    id: str
    user_id: str
    profile_id_display: str
    age: int
    last_initial: Optional[str] = None
    profile_completeness_pct: int
    is_searchable: bool
    photo_urls: List[str] = []
    is_photo_blurred: bool = False
    has_contact_revealed: bool = False
    compatibility_score: Optional[float] = None
    id_verified: bool = False
    selfie_verified: bool = False
    employment_verified: bool = False
    family_reference_verified: bool = False
    trust_shield_score: int = 0
    family_references: Optional[List[Dict[str, Any]]] = None


# Partner Preference schemas consolidated into profile domain
class PartnerPreferenceBase(BaseModel):
    min_age: int = Field(default=21, ge=18, le=80)
    max_age: int = Field(default=35, ge=18, le=80)
    min_height_cm: int = Field(default=140, ge=130, le=220)
    max_height_cm: int = Field(default=200, ge=130, le=220)
    acceptable_marital_statuses: List[str] = ["NEVER_MARRIED"]
    acceptable_religions: List[str] = []
    acceptable_communities: List[str] = []
    acceptable_mother_tongues: List[str] = []
    acceptable_countries: List[str] = ["India"]
    acceptable_cities: List[str] = []
    min_education_level: Optional[str] = None
    acceptable_employment_sectors: List[str] = []
    min_income_bracket: Optional[str] = None
    acceptable_diets: List[str] = []
    manglik_preference: ManglikPreferenceEnum = ManglikPreferenceEnum.DOES_NOT_MATTER


PartnerPreferenceCreate = PartnerPreferenceBase


class PartnerPreferenceUpdate(BaseModel):
    min_age: Optional[int] = Field(None, ge=18, le=80)
    max_age: Optional[int] = Field(None, ge=18, le=80)
    min_height_cm: Optional[int] = Field(None, ge=130, le=220)
    max_height_cm: Optional[int] = Field(None, ge=130, le=220)
    acceptable_marital_statuses: Optional[List[str]] = None
    acceptable_religions: Optional[List[str]] = None
    acceptable_communities: Optional[List[str]] = None
    acceptable_mother_tongues: Optional[List[str]] = None
    acceptable_countries: Optional[List[str]] = None
    acceptable_cities: Optional[List[str]] = None
    min_education_level: Optional[str] = None
    acceptable_employment_sectors: Optional[List[str]] = None
    min_income_bracket: Optional[str] = None
    acceptable_diets: Optional[List[str]] = None
    manglik_preference: Optional[ManglikPreferenceEnum] = None


class PartnerPreferenceResponse(PartnerPreferenceBase):
    id: str
    user_id: str
    model_config = ConfigDict(from_attributes=True)

