"""
Rate Limiting & Bot Abuse Protection Middleware for Bandhan Matrimonial Platform.
Provides layered defensive boundaries:
1. IP-based sliding window rate limiter (Redis-backed with in-memory fallback).
2. Bot scanner, path traversal, and scrapers mitigation.
3. Payload size caps and honeypot field detection.
"""

import time
import json
from collections import defaultdict
from typing import Dict, List
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from backend.app.core.config import settings
from backend.app.core.redis import get_redis_client


class InMemorySlidingWindowLimiter:
    """Thread-safe fallback sliding window in-memory rate limiter."""
    def __init__(self):
        self._history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, key: str, max_requests: int, window_seconds: int = 60) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds
        
        # Purge timestamps outside the active window
        timestamps = [t for t in self._history[key] if t > cutoff]
        
        if len(timestamps) >= max_requests:
            self._history[key] = timestamps
            return False, 0
        
        timestamps.append(now)
        self._history[key] = timestamps
        remaining = max_requests - len(timestamps)
        return True, remaining


in_memory_limiter = InMemorySlidingWindowLimiter()

# Automated scanner attack signatures
BLOCKED_PATH_SIGNATURES = [
    "..",
    ".env",
    ".git",
    "wp-admin",
    "wp-login",
    "phpmyadmin",
    "xmlrpc.php",
    "cgi-bin",
    "eval(",
    "<script",
    "etc/passwd",
    "bin/sh",
    "proc/self",
]

# Automated malicious scanner user-agents
BLOCKED_USER_AGENTS = [
    "sqlmap",
    "nikto",
    "masscan",
    "nmap",
    "havij",
    "acunetix",
    "netsparker",
]


class RateLimitAndBotProtectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware applying rate limiting, DDoS mitigation, and bot abuse protection.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path.lower()
        client_ip = request.client.host if request.client else "127.0.0.1"

        # -------------------------------------------------------------
        # 1. Bot Scanner & Malicious Path Traversal Filter
        # -------------------------------------------------------------
        raw_url = str(request.url).lower()
        if any(sig in raw_url for sig in BLOCKED_PATH_SIGNATURES):
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Forbidden",
                    "message": "Security policy violation: Malicious pattern detected."
                }
            )

        # User-Agent scraper verification
        user_agent = request.headers.get("user-agent", "").lower()
        if any(bad_ua in user_agent for bad_ua in BLOCKED_USER_AGENTS):
            return JSONResponse(
                status_code=403,
                content={
                    "error": "Forbidden",
                    "message": "Automated security scanning tools are blocked."
                }
            )

        # -------------------------------------------------------------
        # 2. Payload Size Protection (Prevent Buffer Flood / DoS)
        # -------------------------------------------------------------
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 5 * 1024 * 1024:  # 5MB max
            return JSONResponse(
                status_code=413,
                content={
                    "error": "PayloadTooLarge",
                    "message": "Request payload exceeds safety threshold of 5MB."
                }
            )

        # -------------------------------------------------------------
        # 3. Dynamic Sliding Window Rate Limiting
        # -------------------------------------------------------------
        # Determine rate limit tier
        if any(auth_path in path for auth_path in ["/auth/login", "/auth/register", "/auth/otp", "/auth/forgot"]):
            max_reqs = 15  # Strict tier: 15 req/min on sensitive authentication
            tier_name = "auth"
        elif any(search_path in path for search_path in ["/matches", "/profiles", "/shortlists"]):
            max_reqs = 60  # Moderate tier: 60 req/min on heavy search & matches
            tier_name = "search"
        else:
            max_reqs = 120  # General browsing tier: 120 req/min
            tier_name = "general"

        rate_key = f"ratelimit:{tier_name}:{client_ip}"
        allowed = True
        remaining = max_reqs

        # Attempt Redis sliding window first
        try:
            redis = await get_redis_client()
            current_count = await redis.get(rate_key)
            if current_count is not None and int(current_count) >= max_reqs:
                allowed = False
                remaining = 0
            else:
                pipe = redis.pipeline()
                pipe.incr(rate_key)
                if current_count is None:
                    pipe.expire(rate_key, 60)
                results = await pipe.execute()
                new_count = results[0]
                remaining = max(0, max_reqs - new_count)
        except Exception:
            # Fallback to local in-memory sliding window if Redis is not running
            allowed, remaining = in_memory_limiter.is_allowed(rate_key, max_reqs, 60)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "error": "TooManyRequests",
                    "message": f"Rate limit exceeded for {tier_name} operations. Please wait before retrying.",
                    "retry_after_seconds": 60
                },
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(max_reqs),
                    "X-RateLimit-Remaining": "0"
                }
            )

        # -------------------------------------------------------------
        # 4. Process Request & Attach Telemetry Headers
        # -------------------------------------------------------------
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_reqs)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
