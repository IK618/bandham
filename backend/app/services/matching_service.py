"""
Analogy: The matching engine service is like an experienced, mathematically rigorous matrimonial matchmaker.
Instead of relying on gut feelings, it takes a member's partner preferences and candidate attributes,
evaluates each dimension (age, culture, career, lifestyle, location), and calculates an objective compatibility percentage.
"""

from datetime import date
from typing import Any, Dict, List, Tuple
from backend.app.models.profile import Profile
from backend.app.models.preference import PartnerPreference, ManglikPreferenceEnum


class MatchingService:
    """Computes multidimensional weighted compatibility scores between candidate profiles and preferences."""

    # Weights sum to 100
    WEIGHT_AGE = 18.0
    WEIGHT_RELIGION_COMMUNITY = 22.0
    WEIGHT_EDUCATION = 15.0
    WEIGHT_PROFESSION_INCOME = 15.0
    WEIGHT_LOCATION = 15.0
    WEIGHT_DIET_LIFESTYLE = 10.0
    WEIGHT_MANGLIK = 5.0

    EDUCATION_RANK_MAP = {
        "High School": 1,
        "Diploma": 2,
        "Bachelors": 3,
        "B.Tech / B.E. in Computer Science": 3,
        "B.Sc / M.Sc in Biotechnology": 3,
        "B.Arch / Master of Design": 3,
        "Masters": 4,
        "M.Tech / M.S. in Software Engineering": 4,
        "MBA in Finance / Marketing": 4,
        "Chartered Accountant (CA)": 4,
        "MBBS / MD in Internal Medicine": 4,
        "LL.B. / LL.M. in Corporate Law": 4,
        "Doctorate / Ph.D.": 5,
    }

    INCOME_RANK_MAP = {
        "INR 3-5 LPA": 1,
        "INR 5-7 LPA": 2,
        "INR 7-10 LPA": 3,
        "INR 10-15 LPA": 4,
        "INR 15-25 LPA": 5,
        "INR 25-40 LPA": 6,
        "INR 40-75 LPA": 7,
        "INR 75+ LPA": 8,
    }

    @classmethod
    def calculate_compatibility(
        cls, preference: PartnerPreference, candidate: Profile
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Calculates the compatibility percentage (0.0 to 100.0) of a candidate against a partner preference vector.
        Returns total score and granular component breakdown.
        """
        breakdown: Dict[str, Any] = {}

        # 1. Age Score (Weight: 18)
        today = date.today()
        candidate_age = today.year - candidate.date_of_birth.year - (
            (today.month, today.day) < (candidate.date_of_birth.month, candidate.date_of_birth.day)
        )
        if preference.min_age <= candidate_age <= preference.max_age:
            s_age = 1.0
        elif abs(candidate_age - preference.min_age) <= 2 or abs(candidate_age - preference.max_age) <= 2:
            s_age = 0.5
        else:
            s_age = 0.0
        score_age = s_age * cls.WEIGHT_AGE
        breakdown["age"] = {"score": score_age, "max": cls.WEIGHT_AGE, "matched": s_age >= 0.5, "candidate_age": candidate_age}

        # 2. Religion & Community Score (Weight: 22)
        rel_match = candidate.religion in preference.acceptable_religions if preference.acceptable_religions else True
        comm_match = candidate.community in preference.acceptable_communities if preference.acceptable_communities else True

        if rel_match and comm_match:
            s_rel = 1.0
        elif rel_match:
            s_rel = 0.70  # Same religion, different community
        else:
            s_rel = 0.0
        score_rel = s_rel * cls.WEIGHT_RELIGION_COMMUNITY
        breakdown["religion_community"] = {"score": score_rel, "max": cls.WEIGHT_RELIGION_COMMUNITY, "matched": s_rel >= 0.7}

        # 3. Education Score (Weight: 15)
        pref_rank = cls.EDUCATION_RANK_MAP.get(preference.min_education_level or "", 3)
        cand_rank = cls.EDUCATION_RANK_MAP.get(candidate.highest_education, 3)

        if cand_rank >= pref_rank:
            s_edu = 1.0
        elif cand_rank == pref_rank - 1:
            s_edu = 0.60
        else:
            s_edu = 0.20
        score_edu = s_edu * cls.WEIGHT_EDUCATION
        breakdown["education"] = {"score": score_edu, "max": cls.WEIGHT_EDUCATION, "matched": s_edu >= 0.6}

        # 4. Profession & Income Score (Weight: 15)
        sector_ok = (
            candidate.employment_sector.value in preference.acceptable_employment_sectors
            if preference.acceptable_employment_sectors
            else True
        )
        cand_inc_rank = cls.INCOME_RANK_MAP.get(candidate.annual_income_bracket, 3)
        pref_inc_rank = cls.INCOME_RANK_MAP.get(preference.min_income_bracket or "", 3)
        inc_ok = cand_inc_rank >= pref_inc_rank

        s_prof = (0.5 if sector_ok else 0.0) + (0.5 if inc_ok else 0.0)
        score_prof = s_prof * cls.WEIGHT_PROFESSION_INCOME
        breakdown["profession_income"] = {"score": score_prof, "max": cls.WEIGHT_PROFESSION_INCOME, "matched": s_prof >= 0.5}

        # 5. Location Score (Weight: 15)
        city_match = candidate.residence_city in preference.acceptable_cities if preference.acceptable_cities else False
        country_match = candidate.residence_country in preference.acceptable_countries if preference.acceptable_countries else True

        if city_match:
            s_loc = 1.0
        elif country_match:
            s_loc = 0.50
        else:
            s_loc = 0.10
        score_loc = s_loc * cls.WEIGHT_LOCATION
        breakdown["location"] = {"score": score_loc, "max": cls.WEIGHT_LOCATION, "matched": s_loc >= 0.5}

        # 6. Diet & Lifestyle Score (Weight: 10)
        diet_match = (
            candidate.diet.value in preference.acceptable_diets
            if preference.acceptable_diets
            else True
        )
        habits_ok = (candidate.smoking.value == "NO") and (candidate.drinking.value in ["NO", "OCCASIONALLY"])
        s_diet = (0.6 if diet_match else 0.0) + (0.4 if habits_ok else 0.0)
        score_diet = s_diet * cls.WEIGHT_DIET_LIFESTYLE
        breakdown["diet_lifestyle"] = {"score": score_diet, "max": cls.WEIGHT_DIET_LIFESTYLE, "matched": s_diet >= 0.5}

        # 7. Astrological / Manglik Score (Weight: 5)
        if preference.manglik_preference == ManglikPreferenceEnum.DOES_NOT_MATTER:
            s_astro = 1.0
        else:
            s_astro = 1.0 if candidate.manglik.value in ["NO", "DONT_KNOW"] else 0.2
        score_astro = s_astro * cls.WEIGHT_MANGLIK
        breakdown["astrology"] = {"score": score_astro, "max": cls.WEIGHT_MANGLIK, "matched": s_astro >= 0.5}

        # Final aggregate sum
        total_score = round(score_age + score_rel + score_edu + score_prof + score_loc + score_diet + score_astro, 1)
        total_score = min(100.0, max(0.0, total_score))

        return total_score, breakdown
