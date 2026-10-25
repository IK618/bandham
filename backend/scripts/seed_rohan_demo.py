"""
Seed Rohan Kapoor as the second demo persona with pre-established mutual conversation with Ananya Sharma.
"""

import asyncio
from datetime import date, datetime, timedelta, timezone
from sqlalchemy import select, or_, and_
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
from backend.app.models.plan import Plan, Subscription, SubscriptionStatusEnum
from backend.app.models.interaction import Interest, InterestStatusEnum
from backend.app.models.chat import Conversation, ConversationParticipant, Message, MessageStatusEnum


async def seed_rohan():
    async with AsyncSessionLocal() as session:
        # 1. Fetch Ananya
        ananya_user = (await session.execute(select(User).where(User.email == "ananya@bandham.local"))).scalars().first()
        if not ananya_user:
            print("Ananya user not found. Run seed_database.py first.")
            return

        # 2. Check if Rohan exists
        rohan_email = "rohan@bandham.local"
        rohan_user = (await session.execute(select(User).where(User.email == rohan_email))).scalars().first()
        if not rohan_user:
            rohan_user = User(
                email=rohan_email,
                phone_number="+919876543211",
                password_hash=get_password_hash("Rohan@12345"),
                role=UserRole.MEMBER,
                status=UserStatus.ACTIVE,
                email_verified=True,
                phone_verified=True
            )
            session.add(rohan_user)
            await session.flush()
            print(f"Created Rohan user: {rohan_user.id}")

            # Profile
            rohan_profile = Profile(
                user_id=rohan_user.id,
                profile_id_display="BDN-ROHAN01",
                created_by=CreatedByEnum.SELF,
                first_name="Rohan",
                last_name="Kapoor",
                gender=GenderEnum.MALE,
                date_of_birth=date(1994, 8, 22),
                height_cm=180,
                marital_status=MaritalStatusEnum.NEVER_MARRIED,
                religion="Hindu",
                mother_tongue="Hindi",
                community="Khatri",
                gotra="Kaushal",
                manglik=ManglikEnum.NO,
                highest_education="M.Tech in Artificial Intelligence",
                education_field="Computer Science & AI",
                college_name="Indian Institute of Science (IISc), Bangalore",
                employment_sector=EmploymentSectorEnum.PRIVATE,
                occupation="Lead AI Product Architect",
                annual_income_bracket="INR 35-50 LPA",
                residence_city="Bangalore",
                residence_state="Karnataka",
                residence_country="India",
                citizenship="Indian",
                family_type=FamilyTypeEnum.NUCLEAR,
                family_values=FamilyValuesEnum.MODERATE,
                diet=DietEnum.VEGETARIAN,
                smoking=SmokingDrinkingEnum.NO,
                drinking=SmokingDrinkingEnum.NO,
                bio_narrative="Hi, I am Rohan! Lead Product & AI engineer based in Bangalore. Passionate about technology, weekend trekking, and reading. Looking for an understanding, smart, and kind-hearted life partner.",
                profile_completeness_pct=100,
                is_searchable=True
            )
            session.add(rohan_profile)

            # Preference
            session.add(PartnerPreference(
                user_id=rohan_user.id,
                min_age=24,
                max_age=30,
                min_height_cm=155,
                max_height_cm=175,
                acceptable_marital_statuses=["NEVER_MARRIED"],
                acceptable_religions=["Hindu"],
                acceptable_communities=[],
                acceptable_mother_tongues=["Hindi", "English"],
                acceptable_countries=["India"],
                acceptable_cities=["Bangalore", "Mumbai", "Pune"],
                min_education_level="Bachelors",
                acceptable_employment_sectors=["PRIVATE", "GOVERNMENT"],
                min_income_bracket="INR 10-15 LPA",
                acceptable_diets=["VEGETARIAN", "EGGETARIAN"],
                manglik_preference=ManglikPreferenceEnum.DOES_NOT_MATTER
            ))

            # Subscription
            gold_plan = (await session.execute(select(Plan).where(Plan.name.ilike("%Gold%")))).scalars().first()
            if not gold_plan:
                gold_plan = (await session.execute(select(Plan))).scalars().first()
            if gold_plan:
                session.add(Subscription(
                    user_id=rohan_user.id,
                    plan_id=gold_plan.id,
                    status=SubscriptionStatusEnum.ACTIVE,
                    starts_at=datetime.now(timezone.utc),
                    expires_at=datetime.now(timezone.utc) + timedelta(days=90),
                    contact_credits_remaining=50
                ))
            await session.commit()
            print("Rohan profile and subscription created.")

        # 3. Create or ensure mutual interest
        interest = (await session.execute(
            select(Interest).where(
                or_(
                    and_(Interest.sender_id == rohan_user.id, Interest.recipient_id == ananya_user.id),
                    and_(Interest.sender_id == ananya_user.id, Interest.recipient_id == rohan_user.id)
                )
            )
        )).scalars().first()

        if not interest:
            interest = Interest(
                sender_id=rohan_user.id,
                recipient_id=ananya_user.id,
                status=InterestStatusEnum.ACCEPTED,
                greeting_message="Namaste Ananya! I found your profile inspiring and would love to connect."
            )
            session.add(interest)
            await session.commit()
            print("Mutual interest created between Rohan and Ananya.")
        else:
            interest.status = InterestStatusEnum.ACCEPTED
            await session.commit()

        # 4. Check if conversation already exists
        ananya_convs = (await session.execute(
            select(ConversationParticipant.conversation_id).where(ConversationParticipant.user_id == ananya_user.id)
        )).scalars().all()

        existing_conv_id = None
        if ananya_convs:
            rohan_in_same = (await session.execute(
                select(ConversationParticipant.conversation_id).where(
                    and_(
                        ConversationParticipant.conversation_id.in_(ananya_convs),
                        ConversationParticipant.user_id == rohan_user.id
                    )
                )
            )).scalars().first()
            existing_conv_id = rohan_in_same

        if not existing_conv_id:
            conv = Conversation()
            session.add(conv)
            await session.flush()
            session.add(ConversationParticipant(conversation_id=conv.id, user_id=ananya_user.id))
            session.add(ConversationParticipant(conversation_id=conv.id, user_id=rohan_user.id))
            
            # Seed 3 starter messages
            session.add(Message(
                conversation_id=conv.id,
                sender_id=rohan_user.id,
                content="Namaste Ananya! I came across your profile and really appreciated your background in tech and software architecture. Would love to connect!",
                status=MessageStatusEnum.READ
            ))
            session.add(Message(
                conversation_id=conv.id,
                sender_id=ananya_user.id,
                content="Hello Rohan! Thank you for expressing interest. I noticed you're also in Bangalore working on AI products. How is your week going?",
                status=MessageStatusEnum.READ
            ))
            session.add(Message(
                conversation_id=conv.id,
                sender_id=rohan_user.id,
                content="It's going great! Glad we connected here on Bandham. Are you free to chat for a few minutes this evening?",
                status=MessageStatusEnum.SENT
            ))
            await session.commit()
            print(f"Conversation created with 3 messages: {conv.id}")
        else:
            print(f"Conversation between Ananya and Rohan already exists: {existing_conv_id}")

        print("Successfully seeded Rohan demo profile and chat connection with Ananya!")


if __name__ == "__main__":
    asyncio.run(seed_rohan())
