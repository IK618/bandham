"""
Analogy: The security module is like an elite master locksmith and diplomatic notary service.
It transforms human passwords into uncrackable cryptographic hashes via bcrypt, and issues tamper-evident,
digitally signed wax seals (JWTs) so authorized users can navigate the platform securely without revealing credentials.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
import jwt
from backend.app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Generates a secure bcrypt hash for a plaintext password."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8")[:72], salt).decode("utf-8")


def _build_jwt(subject: str, token_type: str, delta: timedelta, role: Optional[str] = None) -> str:
    """Builds and signs a JWT with unified claims."""
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": datetime.now(timezone.utc) + delta,
        "type": token_type,
        "iat": datetime.now(timezone.utc),
    }
    if role:
        to_encode["role"] = str(role)
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT access token carrying the user ID and role."""
    delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _build_jwt(subject, "access", delta, role=role)


def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed long-lived JWT refresh token."""
    delta = expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_jwt(subject, "refresh", delta)


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes and validates a JWT token signature and expiration."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError as e:
        raise ValueError(f"Invalid or expired token: {str(e)}")
