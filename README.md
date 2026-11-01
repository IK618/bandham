# Bandham Matrimonial Platform
> **An Enterprise-Grade, Privacy-First Matrimonial Web Application**

Bandham is an original, complete, end-to-end matrimonial platform built with a high-performance modern tech stack. Designed with a clean-room architecture inspired by real-world matrimonial flows, Bandham implements zero-trust privacy, multi-step candidate onboarding, an asymmetric interest lifecycle, contact reveal credit gating, a 7-vector weighted compatibility matching engine, and comprehensive GDPR/DPDP data compliance.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, React Hook Form, Zod, Lucide Icons, TanStack Query.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (Async), Alembic migrations.
- **Database & Cache**: PostgreSQL 16 (`pg_trgm` full-text search, B-Tree & GIN indices), Redis 7 (caching, daily rate limiting).
- **Object Storage**: S3-compatible MinIO for secure candidate photograph storage and presigned URLs.
- **Authentication**: Email/Phone OTP, JWT access & refresh tokens in `HttpOnly` `SameSite=Lax` cookies.
- **Testing & Orchestration**: Docker Compose, Pytest, Playwright E2E, GitHub Actions CI.

---

## Repository Structure

```text
bandhanmatrimony/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline (backend + frontend + e2e)
├── backend/
│   ├── alembic/                 # Database schema migrations
│   ├── app/
│   │   ├── api/v1/endpoints/   # REST endpoints (auth, profiles, matches, chat, etc.)
│   │   ├── core/                # Config, security, database session, Redis client
│   │   ├── models/              # SQLAlchemy 2.0 Async ORM models
│   │   ├── schemas/             # Pydantic v2 request/response schemas
│   │   └── services/            # Matching engine, contact unlock, PII scrubbers
│   ├── scripts/
│   │   └── seed_database.py     # 520+ diverse profile generator (Faker)
│   ├── tests/                   # Unit & API test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js 15 App Router pages (15 routes)
│   │   ├── components/          # Reusable UI library (Button, Badge, ProfileCard, etc.)
│   │   ├── lib/                 # API client & utilities
│   │   └── types/               # TypeScript interfaces & domain types
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── analysis/                # Phase 1: Feature inventory, user journeys, sitemap
│   ├── prd/                     # Phase 2: Product requirements, MVP vs v2 matrix, RBAC
│   ├── database/                # Phase 3: Relational design, Mermaid ERD, indexing
│   ├── matching/                # Phase 5: Matching algorithm & worked numerical proof
│   ├── security/                # Phase 7: OWASP checklist, privacy & GDPR/DPDP specs
│   └── deployment_guide.md      # Phase 8: Operations & production deployment runbook
├── tests/
│   └── e2e/                     # Playwright end-to-end integration tests
└── docker-compose.yml           # Full production-like local multi-container stack
```

---

## Quickstart

### 1. Run Everything with Docker Compose
The fastest way to boot the complete environment (PostgreSQL, Redis, MinIO, FastAPI Backend, and Next.js Frontend):

```bash
docker compose up -d --build
```

- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MinIO Storage Console**: [http://localhost:9001](http://localhost:9001) (`minioadmin` / `minioadmin`)

---

### 2. Run Manually for Local Development

#### Backend (FastAPI):
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt aiosqlite

# Run migrations & populate 520+ realistic test profiles
alembic upgrade head
python scripts/seed_database.py

# Launch development server
uvicorn app.main:app --reload --port 8000
```

#### Frontend (Next.js 15):
```bash
cd frontend
npm install
npm run dev
```

---

## Testing & Quality Assurance

```bash
# 1. Run Backend Matching Engine Calibration Tests
cd backend
python3 tests/test_matching_engine.py

# 2. Run Next.js Production Type Checking & Build
cd frontend
npx tsc --noEmit
npm run build

# 3. Run Playwright E2E Journey Tests
npx playwright test tests/e2e
```

---

## Pre-Seeded Evaluation Accounts

| Role | Email | OTP Code | Description |
| :--- | :--- | :--- | :--- |
| **Primary Member** | `ananya@bandham.local` | `123456` | Verified candidate with active subscription |
| **Moderator** | `moderator@bandham.local` | `123456` | Review flagged profiles and member verifications |
| **Administrator** | `admin@bandham.local` | `123456` | System configuration, billing & audit analytics |

---

## Security & Privacy Features

- **Asymmetric Communication**: Free members can send interests; contact details (phone, email) are gated behind subscription credits.
- **PII Scrubbing**: Freeform bio text is automatically sanitized at API boundaries with regular expression scrubbers to prevent phone/email leaks.
- **Dynamic Photo Blurring & Watermarking**: Candidate photos can be blurred on request and watermarked with viewer session IDs to deter screenshot redistribution.
- **GDPR / DPDP Compliance**: Native endpoints for complete data archive export (`GET /api/v1/privacy/export-my-data`) and account erasure (`DELETE /api/v1/privacy/delete-my-account`).

---

## License
Internal Development / Proprietary - Bandham Platform.
