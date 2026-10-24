"""
Analogy: The database module is like the high-pressure water pumping station of a modern metropolis.
It maintains an active connection pool of async database pipes and dispenses isolated, leak-proof faucets (AsyncSession)
to every incoming web request, ensuring transactions commit cleanly or roll back completely upon error.
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from backend.app.core.config import settings

# Create Async Engine with pooling
engine = create_async_engine(
    settings.DATABASE_URL_ASYNC,
    echo=(settings.ENVIRONMENT == "development_verbose"),
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    future=True
)

# Async Session Factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an asynchronous database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
