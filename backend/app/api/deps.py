"""
Analogy: The deps module is like the security checkpoint and badge scanner at the entrance of a private facility.
Before any request reaches an API room, deps scans the guest's digital token, ensures their account is in good standing,
and confirms whether they hold Member, Moderator, or Admin clearances.
"""

import uuid
from typing import AsyncGenerator, Callable, List, Optional
from fastapi import Cookie, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.core.security import decode_token
from backend.app.models.user import User, UserRole, UserStatus


async def get_optional_token(
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> Optional[str]:
    """Extracts the Bearer token or HttpOnly access_token cookie if present, without raising 401."""
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ")[1]
    if access_token:
        return access_token
    return None


async def get_optional_current_user(
    token: Optional[str] = Depends(get_optional_token),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Decodes JWT if present; returns User if authenticated and active, else None for public visitors."""
    if not token:
        return None
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            return None
        user_uuid = uuid.UUID(user_id_str)
        user = (await db.execute(select(User).where(User.id == user_uuid))).scalars().first()
        if user and user.status not in [UserStatus.SUSPENDED, UserStatus.BANNED]:
            return user
    except Exception:
        return None
    return None


async def get_token_from_header_or_cookie(
    authorization: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> str:
    """Extracts the Bearer token or HttpOnly cookie, raising 401 if missing."""
    token = await get_optional_token(authorization, access_token)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid session token.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return token


async def get_current_user(
    token: str = Depends(get_token_from_header_or_cookie),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Decodes the JWT token and fetches the current active user from the database."""
    try:
        payload = decode_token(token)
        # Defense against token confusion: strictly enforce access token type
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type: session requires an access token.",
                headers={"WWW-Authenticate": "Bearer"}
            )
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")
        user_uuid = uuid.UUID(user_id_str)
    except HTTPException:
        raise
    except (ValueError, KeyError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid token.")

    query = select(User).where(User.id == user_uuid)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account no longer exists.")
    if user.status in [UserStatus.SUSPENDED, UserStatus.BANNED]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account access restricted: Status is {user.status.value}. Please contact support."
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensures the user account is fully verified and in ACTIVE status."""
    if current_user.status in [UserStatus.PENDING_VERIFICATION, UserStatus.PENDING_APPROVAL]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your membership proposal is currently under review by our Trust & Governance committee. Matchmaking, viewing full contact details, and sending interest requests will be unlocked once an Administrator or Moderator accepts your proposal."
        )
    if current_user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your membership proposal to join Bandham was declined by the Trust & Governance committee."
        )
    if current_user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account access restricted: Status is {current_user.status.value}. Please contact support."
        )
    return current_user


def require_roles(*allowed_roles: UserRole) -> Callable:
    """Higher-order dependency enforcing strict role boundaries."""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: Action requires one of {[r.value for r in allowed_roles]}."
            )
        return current_user
    return role_checker
