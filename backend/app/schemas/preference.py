"""
Partner preference schemas consolidated into `profile.py`.
Re-exported for backward compatibility across endpoints.
"""

from backend.app.schemas.profile import (
    PartnerPreferenceBase,
    PartnerPreferenceCreate,
    PartnerPreferenceUpdate,
    PartnerPreferenceResponse,
)

__all__ = [
    "PartnerPreferenceBase",
    "PartnerPreferenceCreate",
    "PartnerPreferenceUpdate",
    "PartnerPreferenceResponse",
]
