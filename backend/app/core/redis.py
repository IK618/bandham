"""
Analogy: Redis is like the lightning-fast scratchpad and stopwatch pinned to an executive's desk.
Instead of walking down to the heavy archive vault (Postgres) on every query, the system consults the desk scratchpad
in microseconds, and checks the stopwatch to enforce "maximum 5 interests per day" rate-limiting boundaries.
"""

from typing import Optional
import redis.asyncio as aioredis
from backend.app.core.config import settings

# Global async Redis client
redis_client: Optional[aioredis.Redis] = None


async def get_redis_client() -> aioredis.Redis:
    """Returns the singleton async Redis client."""
    global redis_client
    if redis_client is None:
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    return redis_client


async def close_redis_connection() -> None:
    """Closes the Redis connection gracefully."""
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None


class RateLimiter:
    """Sliding window / daily counter rate limiter using Redis."""

    @staticmethod
    async def check_daily_limit(key: str, max_requests: int) -> bool:
        """
        Returns True if request is allowed within the 24-hour window, False if limit exceeded.
        """
        try:
            client = await get_redis_client()
            current_count = await client.get(key)
            if current_count is not None and int(current_count) >= max_requests:
                return False
            
            # Increment and set 24h expiration on initial write
            pipe = client.pipeline()
            pipe.incr(key)
            if current_count is None:
                pipe.expire(key, 86400)  # 24 hours
            await pipe.execute()
            return True
        except Exception:
            # Graceful fallback: If Redis is offline during dev/test, permit the request
            return True
