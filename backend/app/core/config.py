"""
Analogy: The config module is like the central electrical breaker and utility control panel of a modern smart building.
It reads the configuration dials (environment variables) to tell all backend subsystems—PostgreSQL, Redis, MinIO,
and JWT signing engines—the exact network hosts, ports, and security secrets to operate with.
"""

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Bandham Matrimonial Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Security & Tokens
    SECRET_KEY: str = "bandham_development_ultra_secure_secret_key_change_in_prod_1234567890"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for dev; 15 mins in prod
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    COOKIE_SAMESITE: str = "lax"
    COOKIE_SECURE: Optional[bool] = None

    @property
    def IS_COOKIE_SECURE(self) -> bool:
        if self.COOKIE_SECURE is not None:
            return self.COOKIE_SECURE
        return self.ENVIRONMENT.lower() in ("production", "prod")

    # Database URLs (Railway / Neon / Supabase DATABASE_URL takes priority)
    DATABASE_URL: Optional[str] = None
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "bandhan_db"

    def _build_db_url(self, protocol: str) -> str:
        if self.DATABASE_URL:
            raw = self.DATABASE_URL.strip()
            for prefix in ("postgres://", "postgresql://", "postgresql+asyncpg://"):
                if raw.startswith(prefix):
                    return raw.replace(prefix, f"{protocol}://", 1)
            return raw
        return f"{protocol}://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def DATABASE_URL_ASYNC(self) -> str:
        return self._build_db_url("postgresql+asyncpg")

    @property
    def DATABASE_URL_SYNC(self) -> str:
        return self._build_db_url("postgresql")

    # Redis URL (Railway / Upstash REDIS_URL takes priority)
    REDIS_URL_ENV: Optional[str] = Field(None, validation_alias="REDIS_URL")
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_URL_ENV:
            return self.REDIS_URL_ENV.strip()
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # MinIO / S3 Object Storage
    S3_ENDPOINT_URL: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET_PHOTOS: str = "bandhan-photos"
    S3_BUCKET_DOCUMENTS: str = "bandhan-documents"
    S3_REGION: str = "us-east-1"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]
    ADDITIONAL_CORS_ORIGINS: Optional[str] = None

    @property
    def ALL_CORS_ORIGINS(self) -> List[str]:
        origins = list(self.BACKEND_CORS_ORIGINS)
        if self.ADDITIONAL_CORS_ORIGINS:
            for item in self.ADDITIONAL_CORS_ORIGINS.split(","):
                clean = item.strip()
                if clean and clean not in origins:
                    origins.append(clean)
        return origins

    # Rate Limiting
    FREE_TIER_DAILY_INTEREST_LIMIT: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
