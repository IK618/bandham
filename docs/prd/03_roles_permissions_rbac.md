# Roles, Permissions & RBAC Matrix: Bandhan Matrimonial Platform

> **Security & Access Governance**: Matrimonial applications store high-sensitivity personal information (birth details, family backgrounds, financial income brackets, private photographs, and romantic communications). Access control must follow the **Principle of Least Privilege (PoLP)**. This document specifies the exact Role-Based Access Control (RBAC) model.

---

## 1. Role Definitions

### 1. `MEMBER` (Primary Application User)
- **Description**: Standard end-user registered on the platform. Can be a Candidate creating their own profile or an Authorized Family Member (Parent, Sibling, Relative).
- **Scope**:
  - Full control over their own account, profile attributes, partner preferences, and uploaded media.
  - Read-only access to other active, non-blocked members' profiles (subject to privacy tiers and visibility modes).
  - Ability to initiate and receive interests, shortlist profiles, and participate in 1-on-1 chats with accepted connections.
  - Ability to purchase subscription tiers and consume contact reveal credits.
  - Ability to block and report other members.
- **Constraints**:
  - Zero access to system administrative endpoints or moderation queues.
  - Cannot access other users' raw phone numbers, email addresses, or unapproved photos without verified authorization.

### 2. `MODERATOR` (Trust, Safety & Content Operations)
- **Description**: Internal platform operator responsible for maintaining community trust, filtering spam/scams, verifying documents, and resolving safety incidents.
- **Scope**:
  - Read-only access to reported user profiles, incident claims, and flagged content queues.
  - Permission to approve or reject pending photo uploads (marking `is_approved = true/false`).
  - Permission to inspect uploaded Government ID documents and grant the `ID_VERIFIED` badge.
  - Permission to temporarily suspend or warn members accused of harassment or policy violations.
  - Permission to inspect chat transcripts **ONLY IF** an explicit report has been filed and the transcript is attached as evidence.
- **Constraints**:
  - Cannot alter platform subscription pricing or financial configurations.
  - Cannot access users' payment card credentials or billing secrets.
  - Cannot alter administrative permissions or create new staff accounts.
  - Cannot browse private member chats at will (preventing internal employee snooping).

### 3. `ADMIN` (Superuser & System Executive)
- **Description**: Platform administrator with ultimate operational, financial, and technical oversight.
- **Scope**:
  - Full CRUD access across all system entities: Users, Roles, Plans, Subscriptions, and Audit Logs.
  - Ability to create, revoke, or reassign `MODERATOR` and `ADMIN` roles.
  - Full visibility into financial metrics, transaction histories, refund triggers, and revenue analytics.
  - Ability to trigger manual database backups, review system rate limits, and inspect security audit logs.
  - Authority to permanently ban users and initiate compliance data purges.
- **Constraints**:
  - Even Admins cannot view raw member passwords (passwords are one-way hashed via Argon2id/bcrypt).
  - Every administrative action (bans, role escalations, refund approvals) is permanently logged to an append-only `audit_logs` table with caller ID and IP signature.

---

## 2. Granular Permissions & CRUD Matrix

| Resource / Entity | Action / Capability | Member (Own) | Member (Other) | Moderator | Admin |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **User Account** | Register / Create | **Yes** | No | No | **Yes** |
| | Read Account Details | **Yes** | No | Read-Only | **Yes** |
| | Update Password / Email | **Yes** | No | No | Reset Link |
| | Deactivate / Delete Account | **Yes** | No | Suspend Only | Permanent Ban / Delete |
| **Profile** | Create / Edit Attributes | **Yes** | No | Reject Inappropriate | Full Edit / Override |
| | View Public / Redacted Profile | **Yes** | **Yes** | **Yes** | **Yes** |
| | View Phone / Email Contact | **Yes** | Credit Gated | Audit Required | Audit Logged |
| **Photos** | Upload / Delete Photos | **Yes** | No | Delete Inappropriate | Full Control |
| | Approve / Reject Photo Queue | No | No | **Yes** | **Yes** |
| | View Blurred / Private Photo | **Yes** | Rule Gated | Review Mode | **Yes** |
| **Interests & Shortlists** | Send / Cancel Interest | **Yes** | No | No | No |
| | Accept / Decline Interest | **Yes** | No | No | No |
| | View Shortlisted Bookmarks | **Yes** | No | No | View Anonymous Stats |
| **Messages / Chat** | Send Message in Chat | **Yes** | If Accepted | No | No |
| | Read Ongoing Conversation | **Yes** | No | Report Evidence Only | System Audit Only |
| **Verification & Trust** | Submit Govt ID / Selfie | **Yes** | No | No | No |
| | Inspect & Approve ID Badge | No | No | **Yes** | **Yes** |
| **Moderation & Safety** | Block Member | **Yes** | No | Force Block | Force Block |
| | File Abuse / Scam Report | **Yes** | No | No | No |
| | Resolve / Dismiss Report | No | No | **Yes** | **Yes** |
| | Suspend / Ban Member | No | No | Suspend Only | Permanent Ban |
| **Plans & Billing** | View Public Plans | **Yes** | **Yes** | **Yes** | **Yes** |
| | Purchase Subscription | **Yes** | No | No | Grant Manual Pass |
| | Create / Modify Plan Tiers | No | No | No | **Yes** |
| | Issue Refunds | No | No | Request Refund | Approve Refund |
| **Audit Logs & Metrics** | View Personal Login History | **Yes** | No | No | **Yes** |
| | View System Audit Logs | No | No | Flagged Reports Only | Full Access |
| | Platform Financial Analytics | No | No | No | Full Access |

---

## 3. Enforcement Architecture: FastAPI Middleware & Dependency Injection

Access control in the backend is enforced declaratively using FastAPI's dependency injection system (`Depends`).

```python
"""
Conceptual Architectural Pattern for FastAPI RBAC Enforcement
"""
from enum import Enum
from fastapi import Depends, HTTPException, status
from pydantic import BaseModel

class UserRole(str, Enum):
    MEMBER = "MEMBER"
    MODERATOR = "MODERATOR"
    ADMIN = "ADMIN"

class CurrentUser(BaseModel):
    id: str
    email: str
    role: UserRole
    is_active: bool

async def get_current_active_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    # 1. Decodes JWT access token
    # 2. Checks Redis token blocklist (revocation check)
    # 3. Validates is_active == True
    ...

def require_roles(*allowed_roles: UserRole):
    """
    Higher-order dependency enforcing strict role boundaries.
    """
    def role_checker(current_user: CurrentUser = Depends(get_current_active_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Required role in {[r.value for r in allowed_roles]}, "
                       f"current role: {current_user.role.value}"
            )
        return current_user
    return role_checker

# Usage Examples on Protected Endpoints:
# @router.post("/api/v1/interests", dependencies=[Depends(require_roles(UserRole.MEMBER))])
# @router.patch("/api/v1/admin/photos/{id}/approve", dependencies=[Depends(require_roles(UserRole.MODERATOR, UserRole.ADMIN))])
# @router.post("/api/v1/admin/plans", dependencies=[Depends(require_roles(UserRole.ADMIN))])
```

---

## 4. Multi-Tenant Data Isolation & Privacy Rules

1. **Object-Level Authorization**:
   - Simply possessing the `MEMBER` role does not grant permission to edit another member's profile.
   - Every mutation endpoint (`PUT /api/v1/profiles/me`, `DELETE /api/v1/photos/{id}`) explicitly asserts:
     ```python
     if resource.user_id != current_user.id and current_user.role != UserRole.ADMIN:
         raise HTTPException(status_code=403, detail="Unauthorized access to resource")
     ```
2. **Harassment Report Chat Inspection Boundary**:
   - To prevent rogue moderators from invading user privacy, chat transcripts are cryptographically bound to an incident report ID.
   - The `/api/v1/admin/reports/{report_id}/chat-transcript` endpoint requires an active, un-dismissed report ID and logs every moderator access into `audit_logs` with the moderator's UUID and timestamp.
