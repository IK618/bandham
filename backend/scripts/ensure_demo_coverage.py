"""
Script to ensure guaranteed demographic coverage across all filter combinations.
Guarantees that ANY combination of (Gender, Religion, City, Diet) across major Indian cities
has at least 2 verified member profiles in the database.
"""

import asyncio
import random
import uuid
from datetime import date
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import AsyncSessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.user import User, UserRole, UserStatus
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
from backend.app.models.photo import Photo, PhotoVisibilityEnum

# Demographics Matrix
RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain"]

COMMUNITIES = {
    "Hindu": ["Brahmin", "Agarwal", "Kayastha", "Rajput", "Maratha", "Reddy", "Nair", "Khatri"],
    "Muslim": ["Sunni", "Shia", "Ansari", "Sayed", "Khan", "Pathan"],
    "Christian": ["Catholic", "Protestant", "Syrian Christian", "Orthodox"],
    "Sikh": ["Jat Sikh", "Khatri Sikh", "Arora Sikh", "Ramgharia"],
    "Jain": ["Shwetambar", "Digambar"],
}

NAMES_BY_RELIGION = {
    "Muslim": {
        GenderEnum.FEMALE: [
            ("Ayesha", "Siddiqui"), ("Fatima", "Khan"), ("Zara", "Ahmed"), ("Sana", "Sayed"),
            ("Zoya", "Mirza"), ("Maryam", "Ansari"), ("Samira", "Qureshi"), ("Nasreen", "Begum")
        ],
        GenderEnum.MALE: [
            ("Tariq", "Mansoor"), ("Farhan", "Akhtar"), ("Bilal", "Khan"), ("Zayd", "Ali"),
            ("Danish", "Ansari"), ("Rehan", "Pathan"), ("Sameer", "Sayed"), ("Imran", "Hussain")
        ]
    },
    "Hindu": {
        GenderEnum.FEMALE: [
            ("Priya", "Sharma"), ("Kavya", "Iyer"), ("Meera", "Nair"), ("Deepa", "Reddy"),
            ("Swati", "Kulkarni"), ("Shreya", "Deshmukh"), ("Lakshmi", "Venkatesh"), ("Pooja", "Gupta")
        ],
        GenderEnum.MALE: [
            ("Rohan", "Shukla"), ("Aditya", "Verma"), ("Karthik", "Ramanathan"), ("Arjun", "Menon"),
            ("Vikram", "Reddy"), ("Siddharth", "Joshi"), ("Rajesh", "Nambiar"), ("Suresh", "Bhat")
        ]
    },
    "Christian": {
        GenderEnum.FEMALE: [
            ("Grace", "Fernandes"), ("Maria", "D'Souza"), ("Sarah", "Mathew"), ("Rebecca", "Thomas"),
            ("Hannah", "Joseph"), ("Rachel", "Kurian"), ("Angela", "Pinto"), ("Teresa", "Pereira")
        ],
        GenderEnum.MALE: [
            ("David", "D'Silva"), ("John", "Fernandes"), ("Matthew", "Thomas"), ("Michael", "Joseph"),
            ("Kevin", "Lobato"), ("Daniel", "Varghese"), ("Andrew", "Gonsalves"), ("Philip", "Rodrigues")
        ]
    },
    "Sikh": {
        GenderEnum.FEMALE: [
            ("Simran", "Kaur"), ("Harpreet", "Dhillon"), ("Jaspreet", "Sandhu"), ("Amanpreet", "Gill"),
            ("Gurleen", "Chawla"), ("Navneet", "Grewal"), ("Kirandeep", "Ahluwalia"), ("Ravneet", "Bedi")
        ],
        GenderEnum.MALE: [
            ("Gurpreet", "Singh"), ("Harpreet", "Dhillon"), ("Manpreet", "Sandhu"), ("Daljit", "Gill"),
            ("Jasbir", "Chawla"), ("Balwinder", "Grewal"), ("Amardeep", "Ahluwalia"), ("Navjot", "Bedi")
        ]
    },
    "Jain": {
        GenderEnum.FEMALE: [
            ("Riya", "Shah"), ("Pooja", "Jain"), ("Sneha", "Kothari"), ("Disha", "Mehta"),
            ("Nidhi", "Dosani"), ("Tanvi", "Chordia"), ("Prachi", "Bafna"), ("Saloni", "Lodha")
        ],
        GenderEnum.MALE: [
            ("Paras", "Shah"), ("Siddharth", "Jain"), ("Bhavik", "Kothari"), ("Jinendra", "Mehta"),
            ("Rishabh", "Dosani"), ("Harsh", "Chordia"), ("Prakhar", "Bafna"), ("Aniket", "Lodha")
        ]
    }
}

CITIES = [
    ("Chennai", "Tamil Nadu", ["Tamil", "English"]),
    ("Bangalore", "Karnataka", ["Kannada", "English", "Tamil"]),
    ("Mumbai", "Maharashtra", ["Marathi", "Hindi", "English"]),
    ("Delhi", "Delhi", ["Hindi", "Punjabi", "English"]),
    ("Hyderabad", "Telangana", ["Telugu", "Urdu", "English"]),
    ("Kolkata", "West Bengal", ["Bengali", "Hindi", "English"]),
    ("Pune", "Maharashtra", ["Marathi", "Hindi", "English"]),
]

OCCUPATIONS = [
    "Software Engineer", "Data Scientist", "Chartered Accountant", "Doctor",
    "Product Manager", "Architect", "Civil Judge", "Management Consultant",
    "Financial Analyst", "UX/UI Designer", "HR Business Partner", "Civil Engineer"
]

EDUCATION = [
    "B.Tech / B.E. in Computer Science", "M.Tech / M.S. in Software Engineering",
    "MBA in Finance / Marketing", "MBBS / MD in Internal Medicine",
    "Chartered Accountant (CA)", "B.Arch / Master of Design"
]

INCOME_BRACKETS = ["INR 10-15 LPA", "INR 15-25 LPA", "INR 25-40 LPA", "INR 40-75 LPA"]


async def ensure_coverage():
    print("Connecting to database to verify demo coverage...")
    async with AsyncSessionLocal() as session:
        # Determine current maximum display ID
        max_id_query = select(Profile.profile_id_display).order_by(Profile.profile_id_display.desc()).limit(1)
        max_display = (await session.execute(max_id_query)).scalars().first()
        current_seq = 10550
        if max_display and max_display.startswith("BDN-"):
            try:
                current_seq = max(current_seq, int(max_display.split("-")[1]) + 1)
            except Exception:
                pass

        added_count = 0

        for gender in [GenderEnum.FEMALE, GenderEnum.MALE]:
            for religion in RELIGIONS:
                for city_name, state_name, tongues in CITIES:
                    # Diets to test: for Jain, ensure JAIN; for others, VEG & NON_VEG
                    if religion == "Jain":
                        target_diets = [DietEnum.JAIN, DietEnum.VEGETARIAN]
                    else:
                        target_diets = [DietEnum.VEGETARIAN, DietEnum.NON_VEGETARIAN]

                    for diet in target_diets:
                        # Check existing count in DB
                        q = select(func.count(Profile.id)).where(
                            Profile.gender == gender,
                            Profile.religion == religion,
                            Profile.residence_city == city_name,
                            Profile.diet == diet
                        )
                        existing = await session.scalar(q) or 0

                        needed = 2 - existing
                        if needed <= 0:
                            continue

                        name_pool = NAMES_BY_RELIGION[religion][gender]

                        for k in range(needed):
                            first_name, last_name = random.choice(name_pool)
                            comm = random.choice(COMMUNITIES[religion])
                            mother_tongue = random.choice(tongues)
                            occ = random.choice(OCCUPATIONS)
                            edu = random.choice(EDUCATION)
                            income = random.choice(INCOME_BRACKETS)
                            birth_year = random.randint(1992, 2000)

                            email = f"{first_name.lower()}.{last_name.lower()}.{city_name.lower()}.{uuid.uuid4().hex[:4]}@bandham.local"
                            phone = f"+9198{random.randint(10000000, 99999999)}"

                            user = User(
                                email=email,
                                phone_number=phone,
                                password_hash=get_password_hash("Password@123"),
                                role=UserRole.MEMBER,
                                status=UserStatus.ACTIVE,
                                email_verified=True,
                                phone_verified=True
                            )
                            session.add(user)
                            await session.flush()

                            profile = Profile(
                                user_id=user.id,
                                profile_id_display=f"BDN-{current_seq}",
                                created_by=CreatedByEnum.SELF,
                                first_name=first_name,
                                last_name=last_name,
                                gender=gender,
                                date_of_birth=date(birth_year, random.randint(1, 12), random.randint(1, 28)),
                                height_cm=random.randint(158, 172) if gender == GenderEnum.FEMALE else random.randint(172, 185),
                                marital_status=MaritalStatusEnum.NEVER_MARRIED,
                                religion=religion,
                                mother_tongue=mother_tongue,
                                community=comm,
                                sub_community=f"{comm} Heritage",
                                manglik=ManglikEnum.NO,
                                highest_education=edu,
                                education_field="Professional",
                                college_name="Reputed University",
                                occupation=occ,
                                employment_sector=EmploymentSectorEnum.PRIVATE,
                                annual_income_bracket=income,
                                residence_city=city_name,
                                residence_state=state_name,
                                residence_country="India",
                                family_type=FamilyTypeEnum.NUCLEAR,
                                family_values=FamilyValuesEnum.MODERATE,
                                diet=diet,
                                smoking=SmokingDrinkingEnum.NO,
                                drinking=SmokingDrinkingEnum.NO,
                                bio_narrative=f"I work as a {occ} based in {city_name}. Raised in a progressive and culturally grounded family. I value integrity, open communication, and shared life goals.",
                                profile_completeness_pct=92,
                                is_searchable=True
                            )
                            session.add(profile)

                            # Photo placeholder
                            session.add(Photo(
                                user_id=user.id,
                                s3_key_original=f"photos/{user.id}_orig.webp",
                                s3_key_thumbnail=f"photos/{user.id}_thumb.webp",
                                s3_key_watermarked=f"photos/{user.id}_wm.webp",
                                is_primary=True,
                                is_approved=True,
                                visibility_mode=PhotoVisibilityEnum.MEMBERS_ONLY,
                                sort_order=1
                            ))

                            # Default Partner Preference
                            session.add(PartnerPreference(
                                user_id=user.id,
                                min_age=24 if gender == GenderEnum.FEMALE else 21,
                                max_age=36 if gender == GenderEnum.FEMALE else 32,
                                min_height_cm=160 if gender == GenderEnum.FEMALE else 150,
                                max_height_cm=190 if gender == GenderEnum.FEMALE else 175,
                                acceptable_marital_statuses=["NEVER_MARRIED"],
                                acceptable_religions=[religion],
                                acceptable_communities=[comm],
                                acceptable_mother_tongues=[mother_tongue, "English"],
                                acceptable_countries=["India"],
                                acceptable_cities=[city_name],
                                min_education_level=edu,
                                acceptable_employment_sectors=["PRIVATE", "GOVERNMENT"],
                                min_income_bracket="INR 10-15 LPA",
                                acceptable_diets=[diet.value],
                                manglik_preference=ManglikPreferenceEnum.DOES_NOT_MATTER
                            ))

                            current_seq += 1
                            added_count += 1

        await session.commit()
        print(f"Successfully guaranteed demo coverage! Added {added_count} candidates across missing demographics.")


if __name__ == "__main__":
    asyncio.run(ensure_coverage())
