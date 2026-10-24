"""
Analogy: The Admin endpoint is like the central control tower and trust command center of the platform.
It provides operations leads with high-level platform health metrics, queues flagged harassment claims,
and enables swift disciplinary suspensions to protect community integrity.
"""

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db, require_roles
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.profile import Profile
from backend.app.models.safety import Report, ReportStatusEnum
from backend.app.models.plan import Subscription, SubscriptionStatusEnum
from backend.app.schemas.safety import ReportResponse

router = APIRouter(prefix="/admin", tags=["Administration & Moderation"])


@router.get("/dashboard-stats")
async def get_admin_dashboard_stats(
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Returns high-level platform health, user census, and moderation queue metrics."""
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()
    active_users = (await db.execute(select(func.count(User.id)).where(User.status == UserStatus.ACTIVE))).scalar_one()
    suspended_users = (await db.execute(select(func.count(User.id)).where(User.status == UserStatus.SUSPENDED))).scalar_one()
    pending_reports = (await db.execute(select(func.count(Report.id)).where(Report.status == ReportStatusEnum.PENDING))).scalar_one()
    active_subscriptions = (await db.execute(select(func.count(Subscription.id)).where(Subscription.status == SubscriptionStatusEnum.ACTIVE))).scalar_one()

    return {
        "platform": "Bandham Matrimonial Administration",
        "timestamp": datetime.now(timezone.utc),
        "metrics": {
            "total_registered_users": total_users,
            "active_verified_members": active_users,
            "suspended_members": suspended_users,
            "pending_moderation_reports": pending_reports,
            "active_paid_subscriptions": active_subscriptions
        }
    }


@router.get("/reports", response_model=List[ReportResponse])
async def list_moderation_reports(
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all pending harassment and abuse reports for review."""
    query = select(Report).order_by(Report.created_at.desc()).limit(50)
    reports = (await db.execute(query)).scalars().all()
    return [
        ReportResponse(
            id=str(r.id),
            reporter_id=str(r.reporter_id),
            reported_user_id=str(r.reported_user_id),
            category=r.category,
            description=r.description,
            status=r.status,
            created_at=r.created_at
        )
        for r in reports
    ]


@router.patch("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: str,
    resolution_status: ReportStatusEnum = ReportStatusEnum.RESOLVED,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Marks an incident report as resolved or dismissed."""
    r_uuid = uuid.UUID(report_id)
    report = (await db.execute(select(Report).where(Report.id == r_uuid))).scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Incident report not found.")

    report.status = resolution_status
    report.resolved_by_id = admin_user.id
    report.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": f"Report marked as {resolution_status.value}."}


@router.patch("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    suspend: bool = True,
    admin_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MODERATOR)),
    db: AsyncSession = Depends(get_db)
):
    """Suspends or reinstates a member account."""
    u_uuid = uuid.UUID(user_id)
    user = (await db.execute(select(User).where(User.id == u_uuid))).scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.status = UserStatus.SUSPENDED if suspend else UserStatus.ACTIVE
    await db.commit()
    return {"message": f"User status updated to {user.status.value}."}
