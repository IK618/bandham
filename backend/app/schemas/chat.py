"""
Chat messaging schemas consolidated into `interaction.py`.
Re-exported for backward compatibility across endpoints.
"""

from backend.app.schemas.interaction import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
)

__all__ = [
    "MessageCreate",
    "MessageResponse",
    "ConversationResponse",
]
