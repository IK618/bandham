"""
Analogy: The API v1 router is like the grand directory board and concourse hub inside a central station.
It aggregates all individual platform tracks—auth, profiles, matches, interests, chat, plans, safety, and admin—
into one clean, versioned unified API surface.
"""

from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    admin,
    auth,
    chat,
    contacts,
    interests,
    matches,
    plans,
    preferences,
    privacy,
    profiles,
    safety,
    shortlists,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(profiles.router)
api_router.include_router(preferences.router)
api_router.include_router(matches.router)
api_router.include_router(interests.router)
api_router.include_router(shortlists.router)
api_router.include_router(contacts.router)
api_router.include_router(chat.router)
api_router.include_router(plans.router)
api_router.include_router(safety.router)
api_router.include_router(privacy.router)
api_router.include_router(admin.router)
