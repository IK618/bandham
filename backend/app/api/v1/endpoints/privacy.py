"""
Analogy: The Privacy endpoint is like the compliance archive office where a citizen exercises their Right to Information
and Right to be Forgotten. It bundles the user's entire digital footprint into an exported JSON suitcase,
or executes a clean, irreversible shredding of their personal records upon account closure.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User, UserStatus
from backend.app.models.profile import Profile
from backend.app.models.preference import PartnerPreference
from backend.app.models.interaction import Interest, Shortlist
from backend.app.models.plan import Subscription

router = APIRouter(prefix="/privacy", tags=["Data Privacy & GDPR/DPDP"])


@router.get("/export-my-data")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generates a complete, downloadable JSON archive of all personal data held by the platform."""
    prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    pref = (await db.execute(select(PartnerPreference).where(PartnerPreference.user_id == current_user.id))).scalars().first()
    interests_sent = (await db.execute(select(Interest).where(Interest.sender_id == current_user.id))).scalars().all()
    shortlists = (await db.execute(select(Shortlist).where(Shortlist.user_id == current_user.id))).scalars().all()
    subs = (await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))).scalars().all()

    export_payload = {
        "export_metadata": {
            "platform": "Bandham Matrimonial Platform",
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "compliance": "GDPR / Digital Personal Data Protection (DPDP) Act",
        },
        "account": {
            "id": str(current_user.id),
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "role": current_user.role.value,
            "status": current_user.status.value,
            "created_at": current_user.created_at.isoformat(),
        },
        "profile": {
            "first_name": prof.first_name if prof else None,
            "last_name": prof.last_name if prof else None,
            "gender": prof.gender.value if prof else None,
            "date_of_birth": prof.date_of_birth.isoformat() if prof else None,
            "religion": prof.religion if prof else None,
            "mother_tongue": prof.mother_tongue if prof else None,
            "community": prof.community if prof else None,
            "occupation": prof.occupation if prof else None,
            "bio": prof.bio_narrative if prof else None,
        } if prof else None,
        "partner_preferences": {
            "min_age": pref.min_age,
            "max_age": pref.max_age,
            "acceptable_religions": pref.acceptable_religions,
            "acceptable_cities": pref.acceptable_cities,
        } if pref else None,
        "activity_summary": {
            "total_interests_sent": len(interests_sent),
            "total_profiles_shortlisted": len(shortlists),
            "subscriptions_count": len(subs),
        }
    }

    return export_payload


@router.delete("/delete-my-account", status_code=status.HTTP_200_OK)
async def delete_my_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently erases the user's account and profile data (Right to be Forgotten).
    Cascades through profiles, photos, and interactions, then clears session cookies.
    """
    # Delete User record (cascade deletes profile, photos, preferences, interests, etc.)
    await db.delete(current_user)
    await db.commit()

    # Clear auth cookies
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {
        "status": "success",
        "message": "Your account and all associated personal matrimonial records have been permanently deleted."
    }
