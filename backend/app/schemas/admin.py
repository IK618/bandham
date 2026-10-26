"""
Admin & Moderator governance schemas consolidated into `safety.py`.
Re-exported for backward compatibility across endpoints.
"""

from backend.app.schemas.safety import (
    AdminUserItem,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    UpdateTrustBadgeRequest,
)

__all__ = [
    "AdminUserItem",
    "UpdateUserRoleRequest",
    "UpdateUserStatusRequest",
    "UpdateTrustBadgeRequest",
]
