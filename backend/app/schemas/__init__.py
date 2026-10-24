"""
Schema exports for Pydantic v2 data transfer objects.
"""

from backend.app.schemas.auth import (
    RegisterRequest,
    VerifyOTPRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from backend.app.schemas.profile import (
    ProfileCreate,
    ProfileUpdate,
    ProfilePublicCard,
    ProfileDetailResponse,
    ProfileSearchFilters,
)
from backend.app.schemas.preference import (
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
)
from backend.app.schemas.chat import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
)
from backend.app.schemas.plan import (
    PlanResponse,
    SubscriptionResponse,
    MockCheckoutRequest,
    MockCheckoutResponse,
)
from backend.app.schemas.safety import (
    BlockCreate,
    BlockResponse,
    ReportCreate,
    ReportResponse,
    NotificationResponse,
)

__all__ = [
    "RegisterRequest",
    "VerifyOTPRequest",
    "LoginRequest",
    "TokenResponse",
    "UserResponse",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfilePublicCard",
    "ProfileDetailResponse",
    "ProfileSearchFilters",
    "PartnerPreferenceCreate",
    "PartnerPreferenceUpdate",
    "PartnerPreferenceResponse",
    "InterestCreate",
    "InterestResponse",
    "ShortlistCreate",
    "ShortlistResponse",
    "ContactRevealResponse",
    "MessageCreate",
    "MessageResponse",
    "ConversationResponse",
    "PlanResponse",
    "SubscriptionResponse",
    "MockCheckoutRequest",
    "MockCheckoutResponse",
    "BlockCreate",
    "BlockResponse",
    "ReportCreate",
    "ReportResponse",
    "NotificationResponse",
]
