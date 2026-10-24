"""
Analogy: The PartnerPreference schema is like an intake form for a custom matchmaker.
It defines acceptable age bands, communities, education tiers, and location boundaries for life partner evaluation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.models.preference import ManglikPreferenceEnum


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


class PartnerPreferenceCreate(PartnerPreferenceBase):
    pass


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
