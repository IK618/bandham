"""
Analogy: The Safety endpoint is like the estate security gate and community alert dispatch.
It allows members to set up protective restraining barriers (Blocks), report inappropriate interactions,
and view in-app notification alerts delivered to their personal bell.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.profile import Profile
from backend.app.models.safety import Block, Notification, NotificationTypeEnum, Report, ReportStatusEnum
from backend.app.schemas.safety import (
    BlockCreate,
    BlockResponse,
    NotificationResponse,
    ReportCreate,
    ReportResponse,
)

router = APIRouter(prefix="/safety", tags=["Trust & Safety"])


@router.post("/block", response_model=BlockResponse, status_code=status.HTTP_201_CREATED)
async def block_user(
    payload: BlockCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Blocks another user, immediately severing all visibility, search, and communication."""
    target_uuid = uuid.UUID(payload.blocked_user_id)
    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block your own account.")

    existing = await db.execute(
        select(Block).where(
            Block.blocker_id == current_user.id,
            Block.blocked_user_id == target_uuid
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="User is already blocked.")

    block = Block(blocker_id=current_user.id, blocked_user_id=target_uuid)
    db.add(block)
    await db.commit()
    await db.refresh(block)

    return BlockResponse(
        id=str(block.id),
        blocker_id=str(block.blocker_id),
        blocked_user_id=str(block.blocked_user_id),
        created_at=block.created_at
    )


@router.delete("/block/{target_user_id}", status_code=status.HTTP_200_OK)
async def unblock_user(
    target_user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Removes a previously placed block on a user."""
    target_uuid = uuid.UUID(target_user_id)
    block = (await db.execute(
        select(Block).where(
            Block.blocker_id == current_user.id,
            Block.blocked_user_id == target_uuid
        )
    )).scalars().first()

    if not block:
        raise HTTPException(status_code=404, detail="Block record not found.")

    await db.delete(block)
    await db.commit()
    return {"message": "User unblocked successfully."}


@router.post("/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def report_user(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits an incident report against a user and alerts platform administrators and moderators."""
    target_uuid = uuid.UUID(payload.reported_user_id)
    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot file a report against yourself.")

    report = Report(
        reporter_id=current_user.id,
        reported_user_id=target_uuid,
        category=payload.category,
        description=payload.description,
        status=ReportStatusEnum.PENDING
    )
    db.add(report)
    await db.flush()

    # Fetch reporter and reported member names
    reporter_prof = (await db.execute(select(Profile).where(Profile.user_id == current_user.id))).scalars().first()
    reporter_name = f"{reporter_prof.first_name} {reporter_prof.last_name}".strip() if reporter_prof else current_user.email

    reported_user = (await db.execute(select(User).where(User.id == target_uuid))).scalars().first()
    reported_prof = (await db.execute(select(Profile).where(Profile.user_id == target_uuid))).scalars().first()
    reported_name = f"{reported_prof.first_name} {reported_prof.last_name}".strip() if reported_prof else (reported_user.email if reported_user else str(target_uuid)[:8])

    category_label = payload.category.value.replace("_", " ").title()

    # Alert all active Admins and Moderators
    staff_users = (await db.execute(
        select(User).where(
            User.role.in_([UserRole.ADMIN, UserRole.MODERATOR]),
            User.status == UserStatus.ACTIVE
        )
    )).scalars().all()

    for staff in staff_users:
        db.add(Notification(
            user_id=staff.id,
            title=f"Incident Alert: {category_label}",
            message=f"{reporter_name} filed an incident report regarding {reported_name} ({category_label}): \"{payload.description[:120]}\"",
            notification_type=NotificationTypeEnum.SYSTEM,
            reference_link="/admin?tab=reports"
        ))

    # Reassure the reporting member
    db.add(Notification(
        user_id=current_user.id,
        title="Incident Report Submitted",
        message=f"Thank you for helping keep Bandham safe. Our Trust & Safety team has received your report regarding {reported_name} and is investigating.",
        notification_type=NotificationTypeEnum.SYSTEM,
        reference_link="/safety"
    ))

    await db.commit()
    await db.refresh(report)

    return ReportResponse(
        id=str(report.id),
        reporter_id=str(report.reporter_id),
        reported_user_id=str(report.reported_user_id),
        category=report.category,
        description=report.description,
        status=report.status,
        created_at=report.created_at,
        reported_name=reported_name,
        reporter_name=reporter_name
    )


@router.get("/notifications", response_model=List[NotificationResponse])
async def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all notifications for the authenticated user."""
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50)
    notifs = (await db.execute(query)).scalars().all()
    return [
        NotificationResponse(
            id=str(n.id),
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            reference_link=n.reference_link,
            is_read=n.is_read,
            created_at=n.created_at
        )
        for n in notifs
    ]


@router.patch("/notifications/{notification_id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Marks a notification as read."""
    n_uuid = uuid.UUID(notification_id)
    query = select(Notification).where(Notification.id == n_uuid, Notification.user_id == current_user.id)
    notif = (await db.execute(query)).scalars().first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.is_read = True
    await db.commit()
    return {"message": "Notification marked as read."}
