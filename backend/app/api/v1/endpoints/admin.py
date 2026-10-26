"""
Analogy: The Admin endpoint is like the central control tower and trust command center of the platform.
It provides operations leads with high-level platform health metrics, queues flagged harassment claims,
enables swift disciplinary suspensions/blocks, and manages staff positions (upgrading & degrading roles).
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Body, Response
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, require_roles
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.profile import Profile, GenderEnum, MaritalStatusEnum
from backend.app.models.preference import PartnerPreference
from backend.app.models.safety import Notification, NotificationTypeEnum, Report, ReportStatusEnum
from backend.app.models.plan import Subscription, SubscriptionStatusEnum
from backend.app.schemas.safety import ReportResponse
from backend.app.schemas.admin import (
    AdminUserItem,
    UpdateUserRoleRequest,
    UpdateUserStatusRequest,
    UpdateTrustBadgeRequest,
)

router = APIRouter(prefix="/admin", tags=["Administration & Moderation"])


@router.get("/dashboard-stats")
async def get_admin_dashboard_stats(
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Returns high-level platform health, user census, pending proposals, and moderation queue metrics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (await db.execute(select(func.count(User.id)).where(User.status == UserStatus.ACTIVE))).scalar_one()
    suspended_users = (await db.execute(select(func.count(User.id)).where(User.status.in_([UserStatus.SUSPENDED, UserStatus.BANNED, UserStatus.REJECTED])))).scalar_one()
    pending_proposals = (await db.execute(select(func.count(User.id)).where(User.status.in_([UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION])))).scalar_one()
    pending_reports = (await db.execute(select(func.count(Report.id)).where(Report.status == ReportStatusEnum.PENDING))).scalar_one()
    active_subscriptions = (await db.execute(select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatusEnum.ACTIVE))).scalar_one()

    return {
        "platform": "Bandham Matrimonial Administration",
        "timestamp": datetime.now(timezone.utc),
        "metrics": {
            "total_registered_users": total_users,
            "active_verified_members": active_users,
            "suspended_members": suspended_users,
            "pending_account_proposals": pending_proposals,
            "pending_moderation_reports": pending_reports,
            "active_paid_subscriptions": active_subscriptions
        }
    }


@router.get("/users", response_model=List[AdminUserItem])
async def list_admin_users(
    query: Optional[str] = None,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    limit: int = 50,
    offset: int = 0,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves user census with role and status for administration."""
    stmt = (
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .order_by(User.created_at.desc())
    )
    if role:
        stmt = stmt.where(User.role == role)
    if status:
        stmt = stmt.where(User.status == status)
    if query and query.strip():
        q = f"%{query.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.email).like(q),
                User.phone_number.like(q),
                func.lower(Profile.first_name).like(q),
                func.lower(Profile.last_name).like(q),
                func.lower(Profile.profile_id_display).like(q),
            )
        )
    stmt = stmt.offset(offset).limit(limit)
    rows = (await db.execute(stmt)).all()

    results: List[AdminUserItem] = []
    for user, profile in rows:
        results.append(AdminUserItem(
            id=str(user.id),
            email=user.email,
            phone_number=user.phone_number,
            role=user.role,
            status=user.status,
            created_at=user.created_at,
            first_name=profile.first_name if profile else None,
            last_name=profile.last_name if profile else None,
            profile_id_display=profile.profile_id_display if profile else None,
            gender=profile.gender.value if profile and profile.gender else None,
            city=profile.residence_city if profile else None,
            id_verified=bool(profile.id_verified) if profile else False,
            selfie_verified=bool(profile.selfie_verified) if profile else False,
            employment_verified=bool(profile.employment_verified) if profile else False,
            family_reference_verified=bool(profile.family_reference_verified) if profile else False,
            trust_shield_score=profile.trust_shield_score if profile and profile.trust_shield_score else 0,
            family_references=profile.family_references if profile else []
        ))
    return results


@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    payload: UpdateUserRoleRequest,
    admin_user: User = Depends(require_roles(UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    """Upgrades or degrades a user position (MEMBER, MODERATOR, ADMIN)."""
    try:
        u_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user UUID format.")

    if u_uuid == admin_user.id and payload.role != admin_user.role:
        raise HTTPException(status_code=400, detail="Security restriction: You cannot demote or alter your own active role.")

    target = (await db.execute(select(User).where(User.id == u_uuid))).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    old_role = target.role.value
    target.role = payload.role
    await db.commit()
    return {
        "message": f"User position updated from {old_role} to {payload.role.value}.",
        "user_id": str(target.id),
        "role": target.role.value
    }


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Blocks, suspends, approves, or reactivates a user account."""
    try:
        u_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user UUID format.")

    if u_uuid == admin_user.id:
        raise HTTPException(status_code=400, detail="Security restriction: You cannot block or suspend your own account.")

    target = (await db.execute(select(User).where(User.id == u_uuid))).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.status = payload.status
    prof = (await db.execute(select(Profile).where(Profile.user_id == u_uuid))).scalars().first()
    if prof:
        prof.is_searchable = (payload.status == UserStatus.ACTIVE)

    if payload.status == UserStatus.ACTIVE:
        target.phone_verified = True
        pref = (await db.execute(select(PartnerPreference).where(PartnerPreference.user_id == u_uuid))).scalars().first()
        if not pref and prof:
            target_gender = GenderEnum.MALE if prof.gender == GenderEnum.FEMALE else GenderEnum.FEMALE
            pref = PartnerPreference(
                user_id=u_uuid,
                min_age=21 if target_gender == GenderEnum.FEMALE else 24,
                max_age=32 if target_gender == GenderEnum.FEMALE else 38,
                min_height_cm=145 if target_gender == GenderEnum.FEMALE else 160,
                max_height_cm=180 if target_gender == GenderEnum.FEMALE else 200,
                acceptable_marital_statuses=[MaritalStatusEnum.NEVER_MARRIED],
                acceptable_religions=["Hindu", "Jain", "Sikh", "Universal"],
                acceptable_communities=[],
                acceptable_mother_tongues=["Hindi"],
                acceptable_countries=["India"],
                acceptable_cities=[],
                min_education_level="Bachelors",
                acceptable_employment_sectors=[],
                min_income_bracket=None,
                acceptable_diets=[],
                manglik_preference=None
            )
            db.add(pref)

    await db.commit()
    action_verb = (
        "blocked / banned" if payload.status == UserStatus.BANNED 
        else ("suspended" if payload.status == UserStatus.SUSPENDED 
        else ("approved / activated" if payload.status == UserStatus.ACTIVE 
        else ("rejected" if payload.status == UserStatus.REJECTED else "updated")))
    )
    return {
        "message": f"User account has been {action_verb} ({payload.status.value}).",
        "user_id": str(target.id),
        "status": target.status.value
    }


@router.patch("/users/{user_id}/trust-badge")
async def update_user_trust_badges(
    user_id: str,
    payload: UpdateTrustBadgeRequest,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Manually grants or revokes Trust Shield badges (Govt ID, Selfie, Employment, Family References)."""
    try:
        u_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user UUID format.")

    prof = (await db.execute(select(Profile).where(Profile.user_id == u_uuid))).scalars().first()
    if not prof:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    if payload.id_verified is not None:
        prof.id_verified = payload.id_verified
    if payload.selfie_verified is not None:
        prof.selfie_verified = payload.selfie_verified
    if payload.employment_verified is not None:
        prof.employment_verified = payload.employment_verified
    if payload.family_reference_verified is not None:
        prof.family_reference_verified = payload.family_reference_verified

    # Recalculate Trust Shield Score (25% per verified badge, max 100%)
    score = (
        (1 if prof.id_verified else 0) +
        (1 if prof.selfie_verified else 0) +
        (1 if prof.employment_verified else 0) +
        (1 if prof.family_reference_verified else 0)
    ) * 25
    prof.trust_shield_score = score

    # Send notification to user about their updated Trust Shield score
    db.add(Notification(
        user_id=u_uuid,
        title=f"🛡️ Trust Shield Updated: {score}% Verified",
        message=f"A platform governance administrator ({admin_user.role.value}) has reviewed your credentials. Your Trust Shield score is now {score}%.",
        notification_type=NotificationTypeEnum.SYSTEM,
        reference_link="/profile/edit"
    ))

    await db.commit()
    await db.refresh(prof)

    return {
        "message": f"Trust badges updated. Trust Shield Score: {score}%.",
        "user_id": str(u_uuid),
        "id_verified": prof.id_verified,
        "selfie_verified": prof.selfie_verified,
        "employment_verified": prof.employment_verified,
        "family_reference_verified": prof.family_reference_verified,
        "trust_shield_score": prof.trust_shield_score
    }


@router.get("/proposals", response_model=List[AdminUserItem])
async def list_pending_proposals(
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all pending membership registration proposals for admin/moderator manual review."""
    stmt = (
        select(User, Profile)
        .outerjoin(Profile, Profile.user_id == User.id)
        .where(User.status.in_([UserStatus.PENDING_APPROVAL, UserStatus.PENDING_VERIFICATION]))
        .order_by(User.created_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    results: List[AdminUserItem] = []
    for user, profile in rows:
        results.append(AdminUserItem(
            id=str(user.id),
            email=user.email,
            phone_number=user.phone_number,
            role=user.role,
            status=user.status,
            created_at=user.created_at,
            first_name=profile.first_name if profile else None,
            last_name=profile.last_name if profile else None,
            profile_id_display=profile.profile_id_display if profile else None,
            gender=profile.gender.value if profile and profile.gender else None,
            city=profile.residence_city if profile else None,
            id_verified=bool(profile.id_verified) if profile else False,
            selfie_verified=bool(profile.selfie_verified) if profile else False,
            employment_verified=bool(profile.employment_verified) if profile else False,
            family_reference_verified=bool(profile.family_reference_verified) if profile else False,
            trust_shield_score=profile.trust_shield_score if profile and profile.trust_shield_score else 0,
            family_references=profile.family_references if profile else []
        ))
    return results


@router.post("/proposals/{user_id}/approve")
async def approve_proposal(
    user_id: str,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Manually approves/accepts a new applicant's membership proposal to join Bandham."""
    try:
        u_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user UUID format.")

    target = (await db.execute(select(User).where(User.id == u_uuid))).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.status = UserStatus.ACTIVE
    target.phone_verified = True
    prof = (await db.execute(select(Profile).where(Profile.user_id == u_uuid))).scalars().first()
    if prof:
        prof.is_searchable = True

    # Ensure partner preferences exist
    pref = (await db.execute(select(PartnerPreference).where(PartnerPreference.user_id == u_uuid))).scalars().first()
    if not pref and prof:
        target_gender = GenderEnum.MALE if prof.gender == GenderEnum.FEMALE else GenderEnum.FEMALE
        pref = PartnerPreference(
            user_id=u_uuid,
            min_age=21 if target_gender == GenderEnum.FEMALE else 24,
            max_age=32 if target_gender == GenderEnum.FEMALE else 38,
            min_height_cm=145 if target_gender == GenderEnum.FEMALE else 160,
            max_height_cm=180 if target_gender == GenderEnum.FEMALE else 200,
            acceptable_marital_statuses=[MaritalStatusEnum.NEVER_MARRIED],
            acceptable_religions=["Hindu", "Jain", "Sikh", "Universal"],
            acceptable_communities=[],
            acceptable_mother_tongues=["Hindi"],
            acceptable_countries=["India"],
            acceptable_cities=[],
            min_education_level="Bachelors",
            acceptable_employment_sectors=[],
            min_income_bracket=None,
            acceptable_diets=[],
            manglik_preference=None
        )
        db.add(pref)

    # In-app welcome notification
    db.add(Notification(
        user_id=u_uuid,
        title="Proposal Accepted! Welcome to Bandham",
        message=f"Your membership application has been manually reviewed and approved by platform governance ({admin_user.role.value}). Your profile is now active.",
        notification_type=NotificationTypeEnum.SYSTEM,
        reference_link="/dashboard"
    ))

    await db.commit()
    return {
        "message": f"Proposal for {target.email} approved successfully. User is now active.",
        "user_id": str(target.id),
        "status": target.status.value
    }


@router.post("/proposals/{user_id}/reject")
async def reject_proposal(
    user_id: str,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Manually rejects/declines a new applicant's proposal to join Bandham."""
    try:
        u_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user UUID format.")

    target = (await db.execute(select(User).where(User.id == u_uuid))).scalars().first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    target.status = UserStatus.REJECTED
    prof = (await db.execute(select(Profile).where(Profile.user_id == u_uuid))).scalars().first()
    if prof:
        prof.is_searchable = False

    await db.commit()
    return {
        "message": f"Proposal for {target.email} was declined.",
        "user_id": str(target.id),
        "status": target.status.value
    }


@router.get("/reports", response_model=List[ReportResponse])
async def list_moderation_reports(
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all harassment and incident reports with party names for review."""
    query = select(Report).order_by(Report.created_at.desc()).limit(50)
    reports = (await db.execute(query)).scalars().all()
    
    responses: List[ReportResponse] = []
    for r in reports:
        reporter_p = (await db.execute(select(Profile).where(Profile.user_id == r.reporter_id))).scalars().first()
        reported_p = (await db.execute(select(Profile).where(Profile.user_id == r.reported_user_id))).scalars().first()
        reporter_u = (await db.execute(select(User).where(User.id == r.reporter_id))).scalars().first()
        reported_u = (await db.execute(select(User).where(User.id == r.reported_user_id))).scalars().first()

        reporter_name = f"{reporter_p.first_name} {reporter_p.last_name}".strip() if reporter_p else (reporter_u.email if reporter_u else "Member")
        reported_name = f"{reported_p.first_name} {reported_p.last_name}".strip() if reported_p else (reported_u.email if reported_u else "Member")

        has_transcript = bool(
            r.chat_transcript_text and
            r.attached_chat_context and
            r.attached_chat_context.get("has_chat")
        )

        responses.append(
            ReportResponse(
                id=str(r.id),
                reporter_id=str(r.reporter_id),
                reported_user_id=str(r.reported_user_id),
                category=r.category,
                description=r.description,
                status=r.status,
                created_at=r.created_at,
                reported_name=reported_name,
                reporter_name=reporter_name,
                has_transcript=has_transcript
            )
        )
    return responses


@router.get("/reports/{report_id}/transcript")
async def download_report_transcript(
    report_id: str,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Downloads the unredacted full chat log as a .txt file for legal and moderation review."""
    try:
        r_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report UUID format.")

    report = (await db.execute(select(Report).where(Report.id == r_uuid))).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found.")

    filename = f"incident_{report_id[:8]}_chat_audit.txt"
    if report.attached_chat_context and report.attached_chat_context.get("filename"):
        filename = report.attached_chat_context.get("filename")

    content = report.chat_transcript_text or "No direct chat history was found for this incident."

    return Response(
        content=content,
        media_type="text/plain; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache"
        }
    )


@router.get("/reports/{report_id}/transcript-preview")
async def preview_report_transcript(
    report_id: str,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Returns the chat transcript text for in-app viewing on the admin portal."""
    try:
        r_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report UUID format.")

    report = (await db.execute(select(Report).where(Report.id == r_uuid))).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found.")

    has_chat = bool(report.attached_chat_context and report.attached_chat_context.get("has_chat"))
    deleted_count = report.attached_chat_context.get("deleted_messages", 0) if report.attached_chat_context else 0

    return {
        "report_id": str(report.id),
        "transcript": report.chat_transcript_text or "No chat log available.",
        "has_chat": has_chat,
        "deleted_messages_count": deleted_count,
        "filename": f"incident_{report_id[:8]}_chat_audit.txt"
    }


@router.patch("/reports/{report_id}/resolve")
@router.post("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    resolution_status: Optional[str] = Query(None),
    payload: Optional[dict] = Body(None),
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Marks an incident report as resolved or dismissed."""
    try:
        r_uuid = uuid.UUID(report_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid report UUID format.")

    report = (await db.execute(select(Report).where(Report.id == r_uuid))).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found.")

    target_status_str = "RESOLVED"
    if payload and isinstance(payload, dict) and "resolution_status" in payload:
        target_status_str = str(payload["resolution_status"]).upper()
    elif resolution_status:
        target_status_str = str(resolution_status).upper()

    try:
        parsed_status = ReportStatusEnum(target_status_str)
    except ValueError:
        parsed_status = ReportStatusEnum.RESOLVED

    report.status = parsed_status
    report.resolved_by_id = admin_user.id
    report.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": f"Report marked as {parsed_status.value}."}


@router.patch("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    suspend: bool = True,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Legacy endpoint for fast suspension/reinstatement."""
    new_status = UserStatus.SUSPENDED if suspend else UserStatus.ACTIVE
    return await update_user_status(
        user_id=user_id,
        payload=UpdateUserStatusRequest(status=new_status),
        admin_user=admin_user,
        db=db
    )
