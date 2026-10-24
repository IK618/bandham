"""
Analogy: The Auth schemas are like standardized application forms and security credentials at an international consulate.
They specify the exact format of registration requests, phone verification OTPs, and the JWT credentials returned.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from backend.app.models.user import UserRole, UserStatus
from backend.app.models.profile import CreatedByEnum, GenderEnum


class RegisterRequest(BaseModel):
    email: EmailStr
    phone_number: str = Field(..., pattern=r"^\+?[1-9]\d{7,14}$", description="E.164 formatted telephone number")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    profile_for: CreatedByEnum = CreatedByEnum.SELF
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    gender: GenderEnum


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class LoginRequest(BaseModel):
    email_or_phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: UserRole
    email: str
    profile_id_display: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    phone_number: str
    role: UserRole
    status: UserStatus
    email_verified: bool
    phone_verified: bool
