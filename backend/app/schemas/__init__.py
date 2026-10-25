"""
Schema exports for Pydantic v2 data transfer objects.
Organized into 5 cohesive domain modules:
- auth: Authentication & Identity
- profile: Candidate Profiles & Partner Preferences
- interaction: Interests, Shortlists, Contacts, and Chat Messaging
- safety: Abuse Reports, Blocks, Audit, and Admin/Moderator Governance
- plan: Membership Subscriptions, Credits, and Checkout
"""

from backend.app.schemas.auth import (
    RegisterRequest,
    VerifyOTPRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from backend.app.schemas.profile import (
    ProfileBase,
    ProfileCreate,
    ProfileUpdate,
    ProfilePublicCard,
    ProfileDetailResponse,
    PartnerPreferenceBase,
    PartnerPreferenceCreate,
    PartnerPreferenceUpdate,
    PartnerPreferenceResponse,
)
from backend.app.schemas.interaction import (
    InterestCreate,
    InterestResponse,
    ShortlistCreate,
    ShortlistResponse,
    ContactRevealResponse,
    ContactStatusResponse,
    MessageCreate,
    MessageResponse,
    ConversationResponse,
)
from backend.app.schemas.safety import (
    BlockCreate,
    BlockResponse,
    ReportCreate,
    ReportResponse,
    NotificationResponse,
    AdminUserItem,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
)
from backend.app.schemas.plan import (
    PlanResponse,
    SubscriptionResponse,
    MockCheckoutRequest,
    MockCheckoutResponse,
)

__all__ = [
    # Auth
    "RegisterRequest",
    "VerifyOTPRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    # Profile & Preferences
    "ProfileBase",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfilePublicCard",
    "ProfileDetailResponse",
    "PartnerPreferenceBase",
    "PartnerPreferenceCreate",
    "PartnerPreferenceUpdate",
    "PartnerPreferenceResponse",
    # Social Interactions & Chat
    "InterestCreate",
    "InterestResponse",
    "ShortlistCreate",
    "ShortlistResponse",
    "ContactRevealResponse",
    "ContactStatusResponse",
    "MessageCreate",
    "MessageResponse",
    "ConversationResponse",
    # Trust, Safety & Governance
    "BlockCreate",
    "BlockResponse",
    "ReportCreate",
    "ReportResponse",
    "NotificationResponse",
    "AdminUserItem",
    "UpdateUserRoleRequest",
    "UpdateUserStatusRequest",
    # Plans & Billing
    "PlanResponse",
    "SubscriptionResponse",
    "MockCheckoutRequest",
    "MockCheckoutResponse",
]
