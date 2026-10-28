"""
Analogy: The main.py file is the main entrance and power ignition switch of our backend application.
It registers CORS access barriers, OpenAPI documentation explorers, lifecycle startup events,
and routes every incoming request to its appropriate department.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.v1.router import api_router
from backend.app.core.config import settings
from backend.app.core.redis import close_redis_connection
from backend.app.core.middleware import RateLimitAndBotProtectionMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle manager."""
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    yield
    print("Shutting down gracefully: closing connections...")
    await close_redis_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Original, clean-room matrimonial web application backend inspired by modern behavioral paradigms.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Set CORS middleware: restrict origins and prevent arbitrary third-party Vercel cross-origin access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALL_CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/(bandhan|bandham)(-[a-zA-Z0-9_-]+)?\.vercel\.app$" if settings.ENVIRONMENT.lower() != "production" else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mandatory Rate Limiting and Bot Abuse Mitigation Middleware
app.add_middleware(RateLimitAndBotProtectionMiddleware)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System Health"])
async def health_check():
    """Health check probe endpoint for container orchestrators."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Standardized top-level error format handler."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred. Our engineering team has been notified.",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )
