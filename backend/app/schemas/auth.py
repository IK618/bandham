"""
Analogy: The Auth schemas are like standardized application forms and security credentials at an international consulate.
They specify the exact format of registration requests, phone verification OTPs, and the JWT credentials returned.
"""

import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.app.models.user import UserRole, UserStatus
from backend.app.models.profile import CreatedByEnum, GenderEnum


class RegisterRequest(BaseModel):
    email: EmailStr
    phone_number: str = Field(..., description="E.164 formatted telephone number")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    profile_for: CreatedByEnum = CreatedByEnum.SELF
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    gender: GenderEnum

    @field_validator("phone_number", mode="before")
    @classmethod
    def sanitize_phone_number(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = re.sub(r"[\s\-\(\)]", "", v.strip())
            if not cleaned.startswith("+"):
                if len(cleaned) == 10:
                    cleaned = "+91" + cleaned
                else:
                    cleaned = "+" + cleaned
            return cleaned
        return v


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

    @field_validator("phone_number", mode="before")
    @classmethod
    def sanitize_phone_number(cls, v: str) -> str:
        if isinstance(v, str):
            cleaned = re.sub(r"[\s\-\(\)]", "", v.strip())
            if not cleaned.startswith("+"):
                if len(cleaned) == 10:
                    cleaned = "+91" + cleaned
                else:
                    cleaned = "+" + cleaned
            return cleaned
        return v


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
