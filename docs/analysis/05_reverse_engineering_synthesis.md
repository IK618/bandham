# REA Reverse-Engineering Synthesis & Architectural Blueprint: Bandhan Platform

> **REA Skill Execution Record**: This synthesis codifies the structural, operational, and privacy findings into a clean-room architectural foundation for **Bandhan** (`<APP_NAME>`), our original matrimonial web application.

---

## 1. Executive Synthesis & Architectural Philosophy

Matrimonial platforms represent a unique category of social software that sits at the intersection of **intimate personal data**, **family-driven decision making**, and **high-stakes financial monetization**. Unlike casual dating applications (Tinder, Bumble) where interactions are transient, ephemeral, and driven by visual swipe decks:

1. **Information Density is Essential**: Users evaluate prospective life partners based on multidimensional lifestyle compatibility, education, career stability, family background, religious traditions, and astrological alignment.
2. **Asymmetric and Delegated Stewardship**: Accounts are frequently operated by parents, elder siblings, or guardians acting on behalf of the candidate. This necessitates clear creator-attribution, multi-generational user experiences, and granular contact sharing boundaries.
3. **Privacy Must Be Zero-Trust by Design**: Users upload high-resolution photographs, phone numbers, family occupational details, and salary brackets. Uncontrolled exposure leads to harassment, stalker vulnerability, spam calls, and social exposure. Privacy is not a feature toggle; it is the core product trust foundation.
4. **Monetization Centers on Unlocking Communication**: Free exploration and matching must remain functional to build network density, while direct communication channels (phone number reveals, unconstrained messaging) serve as the conversion catalyst.

---

## 2. Comparative Matrix: Reference Benchmark vs. Original Bandhan System

| Architectural Dimension | Reference Paradigm (Legacy Public Benchmark) | Bandhan Clean-Room Architecture (`<APP_NAME>`) |
| :--- | :--- | :--- |
| **Authentication & Session** | Legacy session cookies, SMS aggregator credentials | Modern Stateless JWT Auth (Access + Refresh tokens stored in HttpOnly, SameSite=Strict, Secure cookies) + Pluggable OTP Provider stub |
| **Frontend Stack** | Monolithic SSR / mixed legacy client scripts | Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS, TanStack Query, React Hook Form + Zod) |
| **Backend API Engine** | Legacy proprietary services | High-performance Python FastAPI, Pydantic v2 schemas, SQLAlchemy 2.0 Async ORM |
| **Database Architecture** | Relational DB + legacy search indices | PostgreSQL 16 with B-Tree indices, Trigram (`pg_trgm`) full-text search, GIN indexing on array filters, and strict foreign key integrity |
| **Caching & Rate Limiting** | Memcached / Proprietary cache | Redis 7 for sub-millisecond session caching, daily match caching, and sliding-window rate limiting |
| **Media Pipeline** | Centralized image storage | S3-Compatible Object Store (MinIO local / AWS S3 prod), EXIF sanitization, WebP optimization, and dynamic viewer-watermarking |
| **Matching Algorithm** | Black-box proprietary heuristic | Transparent, weighted multi-attribute compatibility scoring engine (0 to 100%) with granular breakdown per category |
| **Data Protection & Compliance** | Regional privacy updates | Built-in GDPR & DPDP compliance: automated data export (JSON), hard account deletion, PII field-level masking, and contact reveal audit trail |

---

## 3. Core Privacy-by-Design Safeguards

### 3.1 PII Field Masking Architecture
1. **Name Masking**: Unauthenticated or free users only see the candidate's first name and last initial (e.g., `Ananya S.`) or a generated system pseudonym based on their Profile ID (`Member BDN-98421`).
2. **Contact Number Vault**: Phone numbers and email addresses are stored encrypted at rest. They are NEVER sent in standard profile API payloads. They can only be accessed through a dedicated `/api/v1/profiles/{id}/reveal-contact` endpoint that validates active subscription status, deducts credits, logs an audit entry, and notifies the target user.
3. **Bio Content Sanitization**: User-submitted narratives in the "About Me" and "Family Details" sections pass through regex and semantic validation filters to automatically detect and redact phone numbers, email handles, and external social media links (Instagram, Facebook handles).

### 3.2 Media & Photo Safeguards
1. **Metadata Stripping**: All user uploads pass through an image processing pipeline that completely strips EXIF data (GPS coordinates, camera model, timestamps).
2. **Dynamic Watermarking**: When an image is served in high-resolution, a lightweight serverless/edge transform stamps the viewer's Profile ID and the access timestamp across the image, discouraging unauthorized redistribution or scraping.
3. **Progressive Visibility**: Photos can be toggled between:
   - `PUBLIC`: All registered, verified users can view.
   - `PROTECTED_BLUR`: Photo is blurred with a 20px Gaussian filter until an Interest is accepted.
   - `ON_REQUEST`: Photo is completely hidden; a "Request Photo" notification must be approved by the owner.

---

## 4. Multi-Phase Roadmap Transition

With Phase 1 reverse-engineering and system analysis complete, the blueprint is codified to execute subsequent phases:

- **Phase 2**: Product Requirements Document (PRD), explicit MVP vs. v2 scope cuts, and Role-Based Access Control (RBAC).
- **Phase 3**: Relational Database Design, PostgreSQL schema, Alembic migrations, constraints, and Faker seed generation.
- **Phase 4**: FastAPI backend API development with modular service/repository architecture, rate limiting, and OpenAPI contracts.
- **Phase 5**: Mathematical matching and compatibility scoring engine with worked numerical validation.
- **Phase 6**: Next.js App Router frontend implementation with reusable components, responsive UI, and state management.
- **Phase 7**: Security, OWASP hardening, photo privacy engines, and audit logging.
- **Phase 8**: End-to-end testing (pytest, Playwright), Docker Compose orchestration, and CI pipelines.
