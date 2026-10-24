"""
Analogy: Think of this __init__.py file as the grand reception desk of our database building.
Instead of wandering down separate corridors to find users, photos, or chat booths, this entry point
assembles and presents every model in one unified catalog for Alembic migrations and the FastAPI engine.
"""

from backend.app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
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
from backend.app.models.interaction import Interest, InterestStatusEnum, Shortlist, ContactView
from backend.app.models.chat import Conversation, ConversationParticipant, Message, MessageStatusEnum
from backend.app.models.plan import (
    Plan,
    Subscription,
    SubscriptionStatusEnum,
    Payment,
    PaymentStatusEnum,
)
from backend.app.models.safety import (
    Verification,
    VerificationTypeEnum,
    VerificationStatusEnum,
    Report,
    ReportCategoryEnum,
    ReportStatusEnum,
    Block,
    Notification,
    NotificationTypeEnum,
    AuditLog,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "User",
    "UserRole",
    "UserStatus",
    "Profile",
    "CreatedByEnum",
    "GenderEnum",
    "MaritalStatusEnum",
    "ManglikEnum",
    "EmploymentSectorEnum",
    "FamilyTypeEnum",
    "FamilyValuesEnum",
    "DietEnum",
    "SmokingDrinkingEnum",
    "PartnerPreference",
    "ManglikPreferenceEnum",
    "Photo",
    "PhotoVisibilityEnum",
    "Interest",
    "InterestStatusEnum",
    "Shortlist",
    "ContactView",
    "Conversation",
    "ConversationParticipant",
    "Message",
    "MessageStatusEnum",
    "Plan",
    "Subscription",
    "SubscriptionStatusEnum",
    "Payment",
    "PaymentStatusEnum",
    "Verification",
    "VerificationTypeEnum",
    "VerificationStatusEnum",
    "Report",
    "ReportCategoryEnum",
    "ReportStatusEnum",
    "Block",
    "Notification",
    "NotificationTypeEnum",
    "AuditLog",
]
