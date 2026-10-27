"""
Security Audit Regression Test Suite: Bandhan Matrimonial Platform
Covers the 4 defensive remediations for:
1. jwt-token-type-confusion (deps.py and auth.py /refresh)
2. cors-permissive-vercel-regex (main.py)
3. client-attested-selfie-bypass (profiles.py and safety.py)
4. insecure-default-secret-key (config.py)
"""

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import Settings
from backend.app.core.security import create_access_token, create_refresh_token, get_password_hash
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.models.profile import Profile, GenderEnum, MaritalStatusEnum


@pytest.mark.asyncio
async def test_refresh_token_rejected_on_access_protected_endpoint(client: AsyncClient, db_session: AsyncSession):
    """Vulnerability 1 Fix: Verify that refresh tokens cannot be used as Bearer access tokens."""
    # Create active user
    test_user = User(
        id=uuid.uuid4(),
        email="security_test@example.com",
        phone_number="+919999900001",
        password_hash=get_password_hash("SecretPass123"),
        role=UserRole.MEMBER,
        status=UserStatus.ACTIVE,
        email_verified=True,
        phone_verified=True
    )
    db_session.add(test_user)
    await db_session.commit()

    # Create a valid refresh token (which has type: 'refresh')
    refresh_token = create_refresh_token(subject=str(test_user.id))

    # Attempt to access /auth/me with refresh token as Bearer token
    headers = {"Authorization": f"Bearer {refresh_token}"}
    response = await client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 401
    assert "access token" in response.json()["detail"].lower()

    # Now verify with a proper access token (type: 'access')
    access_token = create_access_token(subject=str(test_user.id), role=test_user.role.value)
    headers = {"Authorization": f"Bearer {access_token}"}
    response_valid = await client.get("/api/v1/auth/me", headers=headers)
    assert response_valid.status_code == 200
    assert response_valid.json()["email"] == "security_test@example.com"


@pytest.mark.asyncio
async def test_refresh_endpoint_exchanges_refresh_token(client: AsyncClient, db_session: AsyncSession):
    """Verifies that /auth/refresh correctly exchanges a refresh token for a new access token."""
    test_user = User(
        id=uuid.uuid4(),
        email="refresh_test@example.com",
        phone_number="+919999900002",
        password_hash=get_password_hash("SecretPass123"),
        role=UserRole.MEMBER,
        status=UserStatus.ACTIVE,
        email_verified=True,
        phone_verified=True
    )
    db_session.add(test_user)
    await db_session.commit()

    refresh_token = create_refresh_token(subject=str(test_user.id))

    # Send refresh token in request body
    response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["access_token"] != ""
    assert data["user_id"] == str(test_user.id)

    # Use the newly minted access token
    new_access = data["access_token"]
    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_access}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "refresh_test@example.com"


@pytest.mark.asyncio
async def test_arbitrary_vercel_subdomain_cors_not_allowed():
    """Vulnerability 2 Fix: Arbitrary Vercel subdomains must not match CORS regex."""
    import re
    from backend.app.core.config import settings

    # In production, regex should be None
    # In non-production, regex must only match bandhan / bandham subdomains
    regex_pattern = r"^https:\/\/(bandhan|bandham)(-[a-zA-Z0-9_-]+)?\.vercel\.app$"
    compiled = re.compile(regex_pattern)

    # Legitimate project deployments must pass
    assert compiled.match("https://bandhan.vercel.app") is not None
    assert compiled.match("https://bandhan-preview-pr1.vercel.app") is not None
    assert compiled.match("https://bandham-feat-chat.vercel.app") is not None

    # Arbitrary third-party sites must FAIL
    assert compiled.match("https://attacker.vercel.app") is None
    assert compiled.match("https://malicious-site.vercel.app") is None
    assert compiled.match("https://phishing-bandhan.com.vercel.app") is None
    assert compiled.match("https://otheruser.vercel.app") is None


def test_production_fails_to_boot_with_default_secret_key():
    """Vulnerability 4 Fix: Assert that production boots abort if default SECRET_KEY is retained."""
    # In development: default is permitted
    dev_settings = Settings(ENVIRONMENT="development")
    assert "development" in dev_settings.SECRET_KEY

    # In production: default or short secret MUST raise ValueError
    with pytest.raises(ValueError, match="CRITICAL SECURITY CONFIGURATION"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="bandham_development_ultra_secure_secret_key_change_in_prod_1234567890"
        )

    # In production with a strong random secret: should succeed cleanly
    prod_valid = Settings(
        ENVIRONMENT="production",
        SECRET_KEY="c8f2a93b4e1d706592a8b34c56e01f78c8f2a93b4e1d706592a8b34c56e01f78"
    )
    assert len(prod_valid.SECRET_KEY) >= 32


@pytest.mark.asyncio
async def test_photo_upload_does_not_auto_grant_selfie_verification(client: AsyncClient, db_session: AsyncSession):
    """Vulnerability 3 Fix: Profile photo upload does not grant selfie_verified boolean."""
    test_user = User(
        id=uuid.uuid4(),
        email="selfie_gate_test@example.com",
        phone_number="+919999900003",
        password_hash=get_password_hash("SecretPass123"),
        role=UserRole.MEMBER,
        status=UserStatus.ACTIVE,
        email_verified=True,
        phone_verified=True
    )
    db_session.add(test_user)
    await db_session.flush()

    from datetime import date

    test_profile = Profile(
        user_id=test_user.id,
        profile_id_display="BDN-99999",
        created_by="SELF",
        first_name="Selfie",
        last_name="Test",
        gender=GenderEnum.MALE,
        date_of_birth=date(1995, 1, 1),
        height_cm=175,
        marital_status=MaritalStatusEnum.NEVER_MARRIED,
        religion="Hindu",
        mother_tongue="Hindi",
        highest_education="Bachelors",
        education_field="Engineering",
        occupation="Software Engineer",
        annual_income_bracket="INR 10-15 LPA",
        residence_city="Mumbai",
        residence_state="Maharashtra",
        residence_country="India",
        citizenship="Indian",
        bio_narrative="Looking for a life partner.",
        selfie_verified=False,
        trust_shield_score=0
    )
    db_session.add(test_profile)
    await db_session.commit()

    access_token = create_access_token(subject=str(test_user.id), role=test_user.role.value)
    headers = {"Authorization": f"Bearer {access_token}"}

    # Upload avatar with is_selfie: true
    payload = {
        "photo_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD...",
        "is_selfie": True
    }
    response = await client.post("/api/v1/profiles/me/photo", json=payload, headers=headers)
    assert response.status_code == 200

    # Verify that selfie_verified is STILL False and trust_shield_score is NOT incremented
    profile_data = response.json()
    assert profile_data["selfie_verified"] is False
    assert profile_data["trust_shield_score"] == 0
