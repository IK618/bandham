# Project Memory: Bandhan Matrimonial Platform
Last Updated: 2026-11-01
Repository: https://github.com/IK618/bandham.git

## 1. Project Purpose & Tech Stack
- **Description**: Production-grade matrimonial web application inspired by modern behavioral paradigms.
- **Backend**: FastAPI (Python 3.14), SQLAlchemy Async, Alembic, PostgreSQL, Redis, Bcrypt, PyJWT.
- **Frontend**: Next.js 14 / React, Tailwind CSS, TypeScript.
- **Deployment**: Railway / Vercel configurations.

## 2. Key Architecture Decisions & Conventions
- **Rate Limiting & Abuse Defense (`backend/app/core/middleware.py`)**:
  - Multi-tier sliding window rate limiter:
    - Auth tier: 15 req/min (anti-brute-force).
    - Search & matches: 60 req/min.
    - General endpoints: 120 req/min.
  - Redis sliding window with in-memory fallback.
  - Automated scanner & path traversal blocking (`.env`, `.git`, `wp-admin`, `phpmyadmin`, `sqlmap`, `nikto`).
  - Request payload caps (5MB max) and security telemetry headers (`X-RateLimit-*`).
- **Clean Room Architecture**: Clean separation between schemas, models, repositories, and API routers.

## 3. Active Status
- Main branch synced and committed with security middleware (`bed022e`).
