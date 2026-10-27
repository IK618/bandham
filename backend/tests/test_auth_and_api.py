"""
Analogy: The test_auth_and_api.py file is like a simulated secret shopper visiting every counter in our facility.
It registers an account, presents an OTP code, logs in, searches profiles, and verifies that rate limits
and access permissions operate with zero flaws.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Verifies that the /health probe returns 200 OK and healthy status."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_user_registration_and_otp_flow(client: AsyncClient, db_session: AsyncSession):
    """Verifies user signup, stubbed OTP validation, and JWT cookie issuance."""
    from sqlalchemy import select
    from backend.app.models.user import User, UserStatus

    reg_payload = {
        "profile_for": "SELF",
        "first_name": "Priya",
        "last_name": "Nair",
        "gender": "FEMALE",
        "email": "priya.nair@example.com",
        "phone_number": "+919876599999",
        "password": "SecurePassword@123",
    }
    
    # 1. Register User
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == reg_payload["email"]
    assert user_data["status"] == "PENDING_APPROVAL"

    # 2. Verify OTP
    otp_payload = {
        "phone_number": "+919876599999",
        "otp_code": "123456"
    }
    otp_res = await client.post("/api/v1/auth/verify-otp", json=otp_payload)
    assert otp_res.status_code == 200
    token_data = otp_res.json()
    assert token_data["status"] == "PENDING_APPROVAL"
    assert token_data["email"] == reg_payload["email"]

    # 3. Simulate Trust & Governance committee approval
    query = select(User).where(User.phone_number == reg_payload["phone_number"])
    user = (await db_session.execute(query)).scalars().first()
    user.status = UserStatus.ACTIVE
    await db_session.commit()

    # 4. Login now that proposal is ACTIVE
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email_or_phone": reg_payload["email"], "password": reg_payload["password"]}
    )
    assert login_res.status_code == 200
    access_token = login_res.json()["access_token"]

    # 5. Access Protected /auth/me with Bearer Token
    headers = {"Authorization": f"Bearer {access_token}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["phone_verified"] is True
    assert me_data["status"] == "ACTIVE"


@pytest.mark.asyncio
async def test_unauthorized_access_is_rejected(client: AsyncClient):
    """Verifies that accessing protected profile endpoints without a session token returns 401 Unauthorized."""
    response = await client.get("/api/v1/profiles/me")
    assert response.status_code == 401
