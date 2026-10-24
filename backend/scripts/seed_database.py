"""
Analogy: The seed script is like an automated staging crew setting the scene for a grand open-world production.
Instead of launching an empty ghost town, it populates our digital platform with 500+ authentic, culturally diverse
citizens with careers, family backgrounds, and partner preferences, transforming a blank database into a vibrant matrimonial ecosystem.
"""

import asyncio
import random
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List

from faker import Faker
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import AsyncSessionLocal, engine
from backend.app.core.security import get_password_hash
from backend.app.models.base import Base
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
from backend.app.models.plan import Plan, Subscription, SubscriptionStatusEnum
from backend.app.models.interaction import Interest, InterestStatusEnum, Shortlist
from backend.app.models.chat import Conversation, ConversationParticipant, Message, MessageStatusEnum

fake = Faker(["en_IN"])
TOTAL_PROFILES = 520

# Cultural Demographic Pools
RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"]
COMMUNITIES_MAP = {
    "Hindu": ["Brahmin", "Agarwal", "Kayastha", "Rajput", "Maratha", "Reddy", "Nair", "Yadav", "Khatri", "Gupta", "Baniya"],
    "Muslim": ["Sunni", "Shia", "Ansari", "Sayed", "Khan", "Pathan"],
    "Christian": ["Catholic", "Protestant", "Syrian Christian", "Orthodox"],
    "Sikh": ["Jat Sikh", "Khatri Sikh", "Ramgharia", "Arora Sikh"],
    "Jain": ["Shwetambar", "Digambar"],
    "Buddhist": ["Navayana", "Mahayana"]
}
MOTHER_TONGUES = ["Hindi", "Telugu", "Bengali", "Marathi", "Tamil", "Urdu", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "English"]
INDIAN_CITIES = [
    ("Bangalore", "Karnataka"),
    ("Mumbai", "Maharashtra"),
    ("Delhi", "Delhi"),
    ("Hyderabad", "Telangana"),
    ("Pune", "Maharashtra"),
    ("Chennai", "Tamil Nadu"),
    ("Kolkata", "West Bengal"),
    ("Ahmedabad", "Gujarat"),
    ("Chandigarh", "Punjab"),
    ("Jaipur", "Rajasthan"),
    ("Kochi", "Kerala"),
    ("Lucknow", "Uttar Pradesh"),
    ("London", "United Kingdom"),
    ("San Jose", "California, USA"),
    ("Singapore", "Singapore"),
    ("Dubai", "United Arab Emirates"),
]
EDUCATION_LEVELS = [
    ("B.Tech / B.E. in Computer Science", "Engineering/Tech", "IIT Bombay / NIT Surathkal"),
    ("M.Tech / M.S. in Software Engineering", "Engineering/Tech", "IIIT Hyderabad / BITS Pilani"),
    ("MBA in Finance / Marketing", "Management", "IIM Ahmedabad / XLRI Jamshedpur"),
    ("MBBS / MD in Internal Medicine", "Medicine", "AIIMS New Delhi / CMC Vellore"),
    ("Chartered Accountant (CA)", "Commerce/Finance", "ICAI"),
    ("B.Arch / Master of Design", "Architecture/Design", "NID Ahmedabad"),
    ("LL.B. / LL.M. in Corporate Law", "Law", "NLSIU Bengaluru"),
    ("B.Sc / M.Sc in Biotechnology", "Science", "Delhi University"),
]
OCCUPATIONS = [
    "Software Architect", "Data Scientist", "Product Manager", "Cardiologist",
    "Civil Judge", "Investment Banker", "Chartered Accountant", "Professor",
    "Civil Engineer", "UX/UI Design Director", "Management Consultant", "Entrepreneur / Founder",
    "Defense Officer", "Aerospace Engineer"
]
INCOME_BRACKETS = [
    "INR 7-10 LPA",
    "INR 10-15 LPA",
    "INR 15-25 LPA",
    "INR 25-40 LPA",
    "INR 40-75 LPA",
    "INR 75+ LPA"
]


async def seed_plans(session: AsyncSession) -> List[Plan]:
    """Ensures monetization plan catalog exists."""
    plans_data = [
        {"name": "FREE", "duration_months": 12, "price_cents": 0, "contact_credits_quota": 0, "can_initiate_chat": False, "priority_boost": 1},
        {"name": "GOLD", "duration_months": 3, "price_cents": 399900, "contact_credits_quota": 50, "can_initiate_chat": True, "priority_boost": 2},
        {"name": "PLATINUM", "duration_months": 6, "price_cents": 699900, "contact_credits_quota": 150, "can_initiate_chat": True, "priority_boost": 3},
        {"name": "DIAMOND", "duration_months": 12, "price_cents": 999900, "contact_credits_quota": 300, "can_initiate_chat": True, "priority_boost": 5},
    ]
    created_plans = []
    for p in plans_data:
        existing = await session.scalar(select(Plan).where(Plan.name == p["name"]))
        if not existing:
            plan = Plan(**p, is_active=True)
            session.add(plan)
            created_plans.append(plan)
        else:
            created_plans.append(existing)
    await session.flush()
    return created_plans


async def seed_staff(session: AsyncSession) -> None:
    """Creates default Admin and Moderator accounts."""
    admin_email = "admin@bandhan.local"
    if not await session.scalar(select(User).where(User.email == admin_email)):
        admin = User(
            email=admin_email,
            phone_number="+919876500001",
            password_hash=get_password_hash("Admin@12345"),
            role=UserRole.ADMIN,
            status=UserStatus.ACTIVE,
            email_verified=True,
            phone_verified=True
        )
        session.add(admin)

    mod_email = "moderator@bandhan.local"
    if not await session.scalar(select(User).where(User.email == mod_email)):
        mod = User(
            email=mod_email,
            phone_number="+919876500002",
            password_hash=get_password_hash("Moderator@12345"),
            role=UserRole.MODERATOR,
            status=UserStatus.ACTIVE,
            email_verified=True,
            phone_verified=True
        )
        session.add(mod)
    await session.flush()


async def seed_profiles(session: AsyncSession, gold_plan: Plan) -> None:
    """Generates 500+ realistic fake profiles with partner preferences and photos."""
    existing_count = len((await session.scalars(select(User.id))).all())
    if existing_count >= TOTAL_PROFILES:
        print(f"Database already contains {existing_count} users. Skipping generation.")
        return

    print(f"Seeding {TOTAL_PROFILES} profiles...")
    users: List[User] = []

    # 1. Primary Seed Persona: Ananya (Female, Software Architect)
    ananya_user = User(
        email="ananya@bandhan.local",
        phone_number="+919876543210",
        password_hash=get_password_hash("Ananya@12345"),
        role=UserRole.MEMBER,
        status=UserStatus.ACTIVE,
        email_verified=True,
        phone_verified=True
    )
    session.add(ananya_user)
    await session.flush()
    users.append(ananya_user)

    ananya_profile = Profile(
        user_id=ananya_user.id,
        profile_id_display="BDN-10001",
        created_by=CreatedByEnum.SELF,
        first_name="Ananya",
        last_name="Sharma",
        gender=GenderEnum.FEMALE,
        date_of_birth=date(1996, 5, 14),
        height_cm=165,
        marital_status=MaritalStatusEnum.NEVER_MARRIED,
        religion="Hindu",
        mother_tongue="Hindi",
        community="Brahmin",
        sub_community="Saraswat",
        gotra="Kashyap",
        manglik=ManglikEnum.NO,
        highest_education="M.Tech in Computer Science",
        education_field="Engineering/Tech",
        college_name="IIIT Hyderabad",
        employment_sector=EmploymentSectorEnum.PRIVATE,
        occupation="Software Architect",
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
        bio_narrative="I am a software architect based in Bengaluru. Born and raised in an educated, close-knit family. I love classical Hindustani music, weekend trekking, and reading contemporary literature. Looking for a compassionate, progressive partner with shared cultural values and mutual respect.",
        profile_completeness_pct=95,
        is_searchable=True
    )
    session.add(ananya_profile)

    ananya_pref = PartnerPreference(
        user_id=ananya_user.id,
        min_age=27,
        max_age=34,
        min_height_cm=172,
        max_height_cm=190,
        acceptable_marital_statuses=["NEVER_MARRIED"],
        acceptable_religions=["Hindu"],
        acceptable_communities=["Brahmin", "Agarwal", "Kayastha", "Khatri"],
        acceptable_mother_tongues=["Hindi", "Punjabi", "Marathi", "English"],
        acceptable_countries=["India", "United States", "United Kingdom"],
        acceptable_cities=["Bangalore", "Mumbai", "Pune", "Delhi", "Hyderabad"],
        min_education_level="B.Tech / B.E. in Computer Science",
        acceptable_employment_sectors=["PRIVATE", "GOVERNMENT", "BUSINESS"],
        min_income_bracket="INR 15-25 LPA",
        acceptable_diets=["VEGETARIAN", "EGGETARIAN"],
        manglik_preference=ManglikPreferenceEnum.DOES_NOT_MATTER
    )
    session.add(ananya_pref)

    # Ananya's Gold Subscription
    session.add(Subscription(
        user_id=ananya_user.id,
        plan_id=gold_plan.id,
        status=SubscriptionStatusEnum.ACTIVE,
        starts_at=datetime.now(timezone.utc),
        expires_at=datetime.now(timezone.utc) + timedelta(days=90),
        contact_credits_remaining=50
    ))

    # Ananya's Photos
    session.add(Photo(
        user_id=ananya_user.id,
        s3_key_original="photos/ananya_orig.webp",
        s3_key_thumbnail="photos/ananya_thumb.webp",
        s3_key_watermarked="photos/ananya_wm.webp",
        is_primary=True,
        is_approved=True,
        visibility_mode=PhotoVisibilityEnum.MEMBERS_ONLY,
        sort_order=1
    ))

    # 2. Generate remaining ~520 diverse profiles
    for i in range(2, TOTAL_PROFILES + 1):
        gender = GenderEnum.MALE if (i % 2 == 0) else GenderEnum.FEMALE
        first_name = fake.first_name_male() if gender == GenderEnum.MALE else fake.first_name_female()
        last_name = fake.last_name()
        religion = random.choice(RELIGIONS)
        community = random.choice(COMMUNITIES_MAP[religion])
        city, state = random.choice(INDIAN_CITIES)
        degree, ed_field, college = random.choice(EDUCATION_LEVELS)
        occupation = random.choice(OCCUPATIONS)
        income = random.choice(INCOME_BRACKETS)
        diet = random.choice([DietEnum.VEGETARIAN, DietEnum.NON_VEGETARIAN, DietEnum.EGGETARIAN, DietEnum.JAIN])
        
        # Age between 23 and 38
        birth_year = random.randint(1986, 2001)
        birth_month = random.randint(1, 12)
        birth_day = random.randint(1, 28)
        dob = date(birth_year, birth_month, birth_day)
        height = random.randint(168, 188) if gender == GenderEnum.MALE else random.randint(152, 172)
        
        user = User(
            email=f"user_{i}_{first_name.lower()}_{uuid.uuid4().hex[:4]}@example.com",
            phone_number=f"+91{random.randint(6000000000, 9999999999)}",
            password_hash=get_password_hash("Password@123"),
            role=UserRole.MEMBER,
            status=UserStatus.ACTIVE,
            email_verified=True,
            phone_verified=True
        )
        session.add(user)
        await session.flush()
        users.append(user)

        profile = Profile(
            user_id=user.id,
            profile_id_display=f"BDN-{10000 + i}",
            created_by=random.choice(list(CreatedByEnum)),
            first_name=first_name,
            last_name=last_name,
            gender=gender,
            date_of_birth=dob,
            height_cm=height,
            marital_status=random.choices(
                [MaritalStatusEnum.NEVER_MARRIED, MaritalStatusEnum.DIVORCED, MaritalStatusEnum.WIDOWED],
                weights=[85, 12, 3]
            )[0],
            religion=religion,
            mother_tongue=random.choice(MOTHER_TONGUES),
            community=community,
            sub_community=f"{community} Subcaste",
            gotra=random.choice(["Kashyap", "Bharadwaj", "Vashistha", "Garg", "Sandilya", "Atri"]),
            manglik=random.choice(list(ManglikEnum)),
            highest_education=degree,
            education_field=ed_field,
            college_name=college,
            employment_sector=random.choice(list(EmploymentSectorEnum)),
            occupation=occupation,
            annual_income_bracket=income,
            residence_city=city,
            residence_state=state,
            residence_country="India" if city not in ["London", "San Jose", "Singapore", "Dubai"] else "International",
            citizenship="Indian",
            family_type=random.choice(list(FamilyTypeEnum)),
            family_values=random.choice(list(FamilyValuesEnum)),
            diet=diet,
            smoking=random.choice(list(SmokingDrinkingEnum)),
            drinking=random.choice(list(SmokingDrinkingEnum)),
            bio_narrative=f"Hello! I work as a {occupation} in {city}. I have an optimistic outlook on life, appreciate honest conversations, and enjoy spending time with family and close friends. I value mutual understanding, personal growth, and work-life balance.",
            profile_completeness_pct=random.randint(75, 100),
            is_searchable=True
        )
        session.add(profile)

        # Partner Preferences
        pref = PartnerPreference(
            user_id=user.id,
            min_age=max(21, (2024 - birth_year) - 5),
            max_age=(2024 - birth_year) + 5,
            min_height_cm=height - 15 if gender == GenderEnum.MALE else height,
            max_height_cm=height if gender == GenderEnum.MALE else height + 20,
            acceptable_marital_statuses=["NEVER_MARRIED"],
            acceptable_religions=[religion],
            acceptable_communities=[community],
            acceptable_mother_tongues=[profile.mother_tongue],
            acceptable_countries=["India"],
            acceptable_cities=[city],
            min_education_level=degree,
            acceptable_employment_sectors=["PRIVATE", "GOVERNMENT"],
            min_income_bracket="INR 10-15 LPA",
            acceptable_diets=[diet.value],
            manglik_preference=ManglikPreferenceEnum.DOES_NOT_MATTER
        )
        session.add(pref)

        # Add Avatar Photo
        session.add(Photo(
            user_id=user.id,
            s3_key_original=f"photos/user_{i}_orig.webp",
            s3_key_thumbnail=f"photos/user_{i}_thumb.webp",
            s3_key_watermarked=f"photos/user_{i}_wm.webp",
            is_primary=True,
            is_approved=True,
            visibility_mode=PhotoVisibilityEnum.MEMBERS_ONLY,
            sort_order=1
        ))

        # Periodic commit every 100 profiles to prevent memory strain
        if i % 100 == 0:
            await session.commit()
            print(f"-> Seeded {i}/{TOTAL_PROFILES} profiles...")

    await session.commit()
    print("Seeding sample connections, interests, and chats...")

    # Seed sample interests & shortlists for Ananya
    male_users = [u for u in users if u.id != ananya_user.id][:20]
    for idx, male in enumerate(male_users[:8]):
        status = InterestStatusEnum.ACCEPTED if idx < 3 else (InterestStatusEnum.PENDING if idx < 6 else InterestStatusEnum.DECLINED)
        interest = Interest(
            sender_id=male.id,
            recipient_id=ananya_user.id,
            status=status,
            greeting_message="Namaste Ananya, I found your profile very inspiring and would love to connect."
        )
        session.add(interest)

        # If accepted, create conversation
        if status == InterestStatusEnum.ACCEPTED:
            conv = Conversation()
            session.add(conv)
            await session.flush()
            session.add(ConversationParticipant(conversation_id=conv.id, user_id=ananya_user.id))
            session.add(ConversationParticipant(conversation_id=conv.id, user_id=male.id))
            session.add(Message(
                conversation_id=conv.id,
                sender_id=male.id,
                content="Hello Ananya, thank you for accepting my interest! How has your week been?",
                status=MessageStatusEnum.READ
            ))
            session.add(Message(
                conversation_id=conv.id,
                sender_id=ananya_user.id,
                content="Hi! It's been great, thank you. I saw you work in tech as well.",
                status=MessageStatusEnum.SENT
            ))

    # Add shortlists for Ananya
    for male in male_users[8:12]:
        session.add(Shortlist(
            user_id=ananya_user.id,
            shortlisted_user_id=male.id,
            notes="Discuss with parents this Sunday."
        ))

    await session.commit()
    print("Database seeding successfully completed!")


async def main() -> None:
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        plans = await seed_plans(session)
        await seed_staff(session)
        gold_plan = [p for p in plans if p.name == "GOLD"][0]
        await seed_profiles(session, gold_plan)


if __name__ == "__main__":
    asyncio.run(main())
