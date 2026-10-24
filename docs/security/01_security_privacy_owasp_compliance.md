# Security, Privacy & OWASP Top 10 Compliance: Bandhan Platform

> **Zero-Trust Security & Compliance Architecture**: Matrimonial applications process sensitive biographical, religious, financial, and personal photographic data. This document outlines the cryptographic controls, PII protections, OWASP compliance, and regulatory adherence implemented across Bandhan (`<APP_NAME>`).

---

## 1. OWASP Top 10 Implementation & Verification Checklist

| OWASP Vulnerability Category | Mitigation Architecture in Bandhan | Verification Mechanism |
| :--- | :--- | :--- |
| **A01: Broken Access Control** | Declarative RBAC (`require_roles(...)`), object-level authorization ensuring users can only mutate their own profiles, chat transcripts unreadable without active abuse reports. | Tested in automated API regression suite (`test_access_control.py`). |
| **A02: Cryptographic Failures** | Bcrypt password hashing (cost factor >= 12), SHA-256 HMAC for JWT signing, TLS 1.3 in transit, AES-256 at rest in database and S3. | Verified cipher suites and zero plain-text credential persistence. |
| **A03: Injection (SQL / XSS)** | Full SQLAlchemy 2.0 parameterized queries (zero raw SQL string concatenation); Pydantic v2 input sanitization; Next.js automatic React JSX output escaping. | Static AST analysis and automated SQL injection fuzzing. |
| **A04: Insecure Design** | Anti-scraping rate limits on phone reveals; contact numbers isolated behind auditable token-deduction endpoints. | Architecture review; strict rate-limiting on all public endpoints. |
| **A05: Security Misconfiguration** | Strict CORS whitelisting, disabled debug mode in production, CSP headers, HttpOnly + SameSite=Strict cookies. | Docker environment hardening; security header scans. |
| **A06: Vulnerable Components** | Pinned dependencies in `requirements.txt` and `package.json`; automated GitHub Dependabot vulnerability alerts. | CI automated dependency vulnerability scanning. |
| **A07: Identification & Auth Failures** | Dual-channel phone/email verification; short-lived access tokens (15m in prod) with sliding refresh tokens; anti-brute force throttling via Redis. | Tested rate limits on `/api/v1/auth/login` (max 5 failed attempts/min). |
| **A08: Software & Data Integrity** | Cryptographic signatures on all session JWTs; presigned S3 URLs with tight expiry (60 seconds) for media uploads. | Token tamper verification tests. |
| **A09: Security Logging & Monitoring** | Tamper-evident, append-only `audit_logs` table tracking every admin action, phone reveal, and account status mutation. | Verified audit trail generated on `/contacts/{id}/reveal`. |
| **A10: Server-Side Request Forgery** | Application does not perform arbitrary outbound URL fetches based on user input; photo uploads strictly mediated via direct client-to-S3 presigned URLs. | Absence of generic HTTP proxy/fetch utilities in API handlers. |

---

## 2. PII Sanitization & Field-Level Protection

### 2.1 Narrative Bio Redaction Filter
To prevent candidates from inadvertently or maliciously exposing their personal phone numbers or off-platform handles in freeform text boxes:
```python
@field_validator("bio_narrative")
@classmethod
def sanitize_bio_narrative(cls, v: str) -> str:
    # 1. Strip phone numbers (7 to 14 consecutive digits or spaced formats)
    v = re.sub(r"\b\d{7,14}\b", "[REDACTED PHONE]", v)
    v = re.sub(r"\+?\d[\d -]{8,14}\d", "[REDACTED PHONE]", v)
    # 2. Strip URLs and external domain links
    v = re.sub(r"https?://\S+|www\.\S+", "[REDACTED LINK]", v)
    # 3. Strip email addresses
    v = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[REDACTED EMAIL]", v)
    return v
```

### 2.2 Dynamic Photo Watermarking
When a high-resolution photo is rendered for a viewer:
- A semi-transparent watermark is dynamically stamped across the diagonal canvas:
  `Bandhan Verified • Viewer ID: BDN-XXXXX • Timestamp: YYYY-MM-DD`
- Psychological and forensic deterrence against screenshot redistribution on external forums.

---

## 3. GDPR & DPDP Compliance Protocols

### 3.1 Right to Access & Portability
- Endpoint: `GET /api/v1/privacy/export-my-data`
- Assembles an unencrypted, machine-readable JSON bundle containing:
  - Account credentials and verification timestamps.
  - Full biographical profile and preference vectors.
  - Sent and received interest history.
  - Bookmarked shortlist items.
  - Active and historical subscription transactions.

### 3.2 Right to be Forgotten (Permanent Account Erasure)
- Endpoint: `DELETE /api/v1/privacy/delete-my-account`
- Protocol:
  1. Cascade deletes `Profile`, `PartnerPreference`, `Photo`, `Interest`, `Shortlist`, and `Message` records.
  2. Permanently removes physical media objects from the MinIO/S3 bucket.
  3. Deletes session cookies and blacklists active JWTs in Redis.
  4. Preserves only an anonymized transaction record in `payments` for statutory tax/accounting compliance without PII.
