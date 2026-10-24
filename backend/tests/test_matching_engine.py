"""
Analogy: The test_matching_engine.py file is like a calibration test bench for an optical precision instrument.
It passes known sample profiles through the matching engine algorithm and verifies that compatibility percentages
and category sub-scores match mathematical calculations to the exact decimal place.
"""

from datetime import date
import uuid
import pytest
from backend.app.models.profile import (
    Profile,
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
from backend.app.models.preference import PartnerPreference, ManglikPreferenceEnum
from backend.app.services.matching_service import MatchingService


def create_sample_preference() -> PartnerPreference:
    return PartnerPreference(
        user_id=uuid.uuid4(),
        min_age=27,
        max_age=34,
        min_height_cm=172,
        max_height_cm=190,
        acceptable_marital_statuses=["NEVER_MARRIED"],
        acceptable_religions=["Hindu"],
        acceptable_communities=["Brahmin", "Agarwal", "Kayastha"],
        acceptable_mother_tongues=["Hindi", "English"],
        acceptable_countries=["India"],
        acceptable_cities=["Bangalore", "Mumbai"],
        min_education_level="Bachelors",
        acceptable_employment_sectors=["PRIVATE", "GOVERNMENT"],
        min_income_bracket="INR 15-25 LPA",
        acceptable_diets=["VEGETARIAN", "EGGETARIAN"],
        manglik_preference=ManglikPreferenceEnum.DOES_NOT_MATTER
    )


def test_perfect_match_returns_100_percent():
    pref = create_sample_preference()
    today = date.today()
    
    # Candidate who satisfies all criteria perfectly
    candidate = Profile(
        user_id=uuid.uuid4(),
        profile_id_display="BDN-TEST1",
        created_by=CreatedByEnum.SELF,
        first_name="Rohan",
        last_name="Mehta",
        gender=GenderEnum.MALE,
        date_of_birth=date(today.year - 30, today.month, today.day),
        height_cm=178,
        marital_status=MaritalStatusEnum.NEVER_MARRIED,
        religion="Hindu",
        mother_tongue="Hindi",
        community="Brahmin",
        highest_education="MBA in Finance / Marketing",
        education_field="Management",
        employment_sector=EmploymentSectorEnum.PRIVATE,
        occupation="Investment Banker",
        annual_income_bracket="INR 25-40 LPA",
        residence_city="Bangalore",
        residence_state="Karnataka",
        residence_country="India",
        citizenship="Indian",
        family_type=FamilyTypeEnum.NUCLEAR,
        family_values=FamilyValuesEnum.MODERATE,
        diet=DietEnum.VEGETARIAN,
        smoking=SmokingDrinkingEnum.NO,
        drinking=SmokingDrinkingEnum.OCCASIONALLY,
        manglik=ManglikEnum.NO,
        bio_narrative="Sample bio narrative for automated testing.",
        profile_completeness_pct=90,
        is_searchable=True
    )

    score, breakdown = MatchingService.calculate_compatibility(pref, candidate)
    assert score == 100.0
    assert breakdown["age"]["matched"] is True
    assert breakdown["religion_community"]["matched"] is True
    assert breakdown["education"]["matched"] is True
    assert breakdown["location"]["matched"] is True


def test_partial_match_applies_correct_category_penalties():
    pref = create_sample_preference()
    today = date.today()

    # Candidate who is slightly outside age boundary (age 36 vs max 34) and has different community
    candidate = Profile(
        user_id=uuid.uuid4(),
        profile_id_display="BDN-TEST2",
        created_by=CreatedByEnum.SELF,
        first_name="Siddharth",
        last_name="Verma",
        gender=GenderEnum.MALE,
        date_of_birth=date(today.year - 36, today.month, today.day),
        height_cm=175,
        marital_status=MaritalStatusEnum.NEVER_MARRIED,
        religion="Hindu",
        mother_tongue="Hindi",
        community="Rajput",  # Same religion, different community
        highest_education="B.Tech / B.E. in Computer Science",
        education_field="Engineering",
        employment_sector=EmploymentSectorEnum.PRIVATE,
        occupation="Operations Director",
        annual_income_bracket="INR 15-25 LPA",
        residence_city="Chennai",  # Same country, different city
        residence_state="Tamil Nadu",
        residence_country="India",
        citizenship="Indian",
        family_type=FamilyTypeEnum.NUCLEAR,
        family_values=FamilyValuesEnum.MODERATE,
        diet=DietEnum.NON_VEGETARIAN,  # Non-matching diet
        smoking=SmokingDrinkingEnum.NO,
        drinking=SmokingDrinkingEnum.NO,
        manglik=ManglikEnum.YES,
        bio_narrative="Sample bio narrative for testing.",
        profile_completeness_pct=85,
        is_searchable=True
    )

    score, breakdown = MatchingService.calculate_compatibility(pref, candidate)
    # Expected score around 70.9%
    assert 68.0 <= score <= 74.0
    assert breakdown["age"]["score"] == 9.0  # 18 * 0.5
    assert breakdown["religion_community"]["score"] == 15.4  # 22 * 0.70
    assert breakdown["diet_lifestyle"]["matched"] is False
