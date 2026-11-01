# Sitemap & Information Architecture: Bandham Matrimonial Platform

> **REA Behavioral Architecture**: This document defines the page taxonomy, routing structure, component hierarchy, and navigation states for the **Bandham** (`<APP_NAME>`) matrimonial web platform.

---

## 1. High-Level Page Hierarchy & Sitemap

```
Bandham Matrimonial Platform
│
├──  Public / Guest Routes
│   ├── / .................................... Public Landing Page (Hero, Value Props, Search Widget, Stories)
│   ├── /about ............................... Mission, Vision, and Trust Manifesto
│   ├── /safety-guidelines ................... Dating/Matrimony Safety Tips, Scam Alerts & Reporting Guidelines
│   ├── /success-stories ..................... Curated Testimonials & Verified Marriage Stories
│   ├── /plans ............................... Membership Tier Comparisons & Pricing Table
│   ├── /contact-us .......................... Customer Support, Grievance Officer, and Help Center
│   ├── /terms ............................... Terms of Service, Legal Declarations, Age Criteria
│   └── /privacy ............................. Privacy Policy, DPDP/GDPR Data Protection Notice
│
├──  Authentication & Onboarding Routes
│   ├── /login ............................... Unified Phone/Email Login with Password or OTP
│   ├── /register ............................ Initial Registration Form ("Profile Created For", Credentials)
│   ├── /verify-otp .......................... 6-Digit SMS/Email OTP Verification Screen
│   ├── /forgot-password ..................... Password Reset Flow with Signed Token Link
│   └── /onboarding
│       ├── /onboarding/step-1 ............... Personal & Physical Attributes
│       ├── /onboarding/step-2 ............... Education, Career & Income Bracket
│       ├── /onboarding/step-3 ............... Religious, Cultural & Astrological Background
│       ├── /onboarding/step-4 ............... Family Background & Values
│       ├── /onboarding/step-5 ............... Lifestyle, Habits & "About Me" Narrative
│       ├── /onboarding/step-6 ............... Photo Gallery Upload & Privacy Preference
│       └── /onboarding/step-7 ............... Partner Preference Configuration (Age, Height, Caste, Location)
│
├──  Authenticated Member Workspace (Requires Auth Cookie + Completed Profile)
│   ├── /dashboard ........................... Activity Center: New Matches, Incoming Interests, Profile Views
│   ├── /matches
│       ├── /matches/daily ................... Curated "Today's Top 20 Matches"
│       ├── /matches/mutual .................. 100% Two-Way Compatibility Matches
│       ├── /matches/near-me ................. Geographic Radius / Same City Matches
│       ├── /matches/recently-joined ......... Profiles Joined in the Past 14 Days
│       └── /matches/premium ................. Verified Profiles with High Compatibility
│   │
│   ├── /search
│       ├── /search/basic .................... Quick Parameter Filtering (Age, Religion, Tongue, Location)
│       ├── /search/advanced ................. Full Faceted Filter Studio (Education, Income, Diet, Manglik)
│       ├── /search/by-id .................... Direct Unique Profile Identifier Lookup (e.g., BDN-10492)
│       └── /search/saved .................... User's Saved Search Queries & Alert Preferences
│   │
│   ├── /profile
│       ├── /profile/me ...................... Own Profile View (with Completeness Scorecard)
│       ├── /profile/me/edit ................. Tabbed Editor: Personal, Career, Family, Horoscope, Photos
│       ├── /profile/me/preferences .......... Edit Partner Preferences
│       └── /profile/[profileId] ............. Candidate Profile Detail View (Dynamic Public/Protected Card)
│   │
│   ├── /inbox
│       ├── /inbox/received .................. Incoming Interests Received (Accept / Decline actions)
│       ├── /inbox/sent ...................... Outgoing Interests Sent (Pending, Accepted, Declined states)
│       ├── /inbox/shortlisted ............... Bookmarked / Saved Profiles
│       ├── /inbox/viewers ................... "Who Viewed My Profile" Analytics
│       ├── /inbox/contact-requests .......... Photo Unlock & Contact Requests
│       └── /inbox/contacted ................. List of Profiles Whose Contact Number Was Unlocked
│   │
│   ├── /chat
│       ├── /chat ............................ Active Messaging Drawer / Full-Screen Messenger
│       └── /chat/[conversationId] .......... 1-on-1 Real-Time Chat Thread with Typing & Read Status
│   │
│   ├── /upgrade
│       ├── /upgrade/plans ................... Tier Selection (Gold vs Platinum vs Diamond)
│       ├── /upgrade/checkout ................ Payment Gateway Modal (Card, UPI, NetBanking)
│       └── /upgrade/success ................. Payment Confirmation & Credit Allocation Summary
│   │
│   └── /settings
│       ├── /settings/account ................ Email/Phone Updates, Password Change, 2FA
│       ├── /settings/privacy ................ Photo Visibility, Contact Reveal Permissions, Profile Masking
│       ├── /settings/notifications .......... Push, Email & SMS Notification Toggles
│       ├── /settings/blocked-users .......... Blocked Profiles Management List
│       └── /settings/data-privacy ........... Export My Data (JSON) & Request Account Deletion
│
└──  Moderation & Administrative Portal (Role: ADMIN / MODERATOR)
    ├── /admin/login ......................... Multi-Factor Administrative Access
    ├── /admin/dashboard ..................... Metrics: Active Members, Revenue, Verification Queues
    ├── /admin/users ......................... User Management, Audit Logs, Suspension Controls
    ├── /admin/verification-queue ............ Photo Approval & Government ID Inspection Queue
    ├── /admin/reports ....................... Member Incident Reports & Harassment Claims
    └── /admin/financials .................... Transactions, Invoices, Subscriptions, Refunds
```

---

## 2. Information Architecture (IA) & Component Hierarchy

### 2.1 Navigation Bar (Global Header)
- **Guest State**:
  - Logo (`Bandham` with trademark wedding knot emblem)
  - Nav Links: `Explore Matches`, `Success Stories`, `Membership Plans`, `Safety`
  - Action Buttons: `Login` (Secondary Outline), `Register Free` (Primary High-Contrast Accent)
- **Authenticated Member State**:
  - Logo -> Links to `/dashboard`
  - Primary Nav Tabs: `My Dashboard`, `Matches` (with badge counter), `Search`, `Inbox` (with unread counter), `Chat` (WebSocket online pill)
  - Quick Search Bar: By Profile ID
  - Utility Icons:
    -  Notifications Popover (Interests received, Profile views, Contact reveals)
    -  Messages Dropdown (Latest active threads)
  - User Avatar Menu:
    - User Name + Profile ID badge
    - Profile Completeness Indicator (e.g., "78% Complete - Add Horoscope to reach 90%")
    - Membership Tier Badge (`Free Member` / `Gold Member` / `Platinum Member`)
    - Links: `My Profile`, `Edit Partner Preferences`, `Settings & Privacy`, `Upgrade to Premium`, `Logout`

---

## 3. Core Page Component Layouts

### 3.1 Candidate Profile Detail View (`/profile/[profileId]`)

```
+-----------------------------------------------------------------------------------+
|  [Sticky Breadcrumb: Dashboard > Matches > Profile BDN-98421]                     |
+-----------------------------------------------------------------------------------+
|  LEFT COLUMN (40% Width)                 | RIGHT COLUMN (60% Width)               |
|                                          |                                        |
|  [Hero Photo Carousel / Gallery]         |  ANANYA S. (Profile ID: BDN-98421)     |
|  - Watermarked Main Display Photo        |  28 Yrs, 5'6", Hindu, Brahmin          |
|  - Thumbnails (1 to 6)                   |  Software Architect at Tier-1 Tech     |
|  - [Privacy Badge: "Visible to Members"] |  Bangalore, Karnataka, India           |
|                                          |                                        |
|  [Key Action Panel]                      |  [COMPATIBILITY MATCH SCORE: 92%]      |
|  +------------------------------------+  |  Match Breakdown:                      |
|  | [ Send Interest]                  |  |  Age [] | Religion [] | Diet []    |
|  | [ Add to Shortlist]               |  |  Height [] | Education []           |
|  | [ View Contact Number] (Locked)  |  +----------------------------------------+
|  | [ Chat Now] (Requires Accept)    |  | ABOUT HER                              |
|  +------------------------------------+  |  Detailed narrative written by self... |
|                                          +----------------------------------------+
|  [Trust & Verification Card]             | CAREER & EDUCATION                     |
|  - [] Government ID Verified            | - Degree: M.Tech in Computer Science   |
|  - [] Phone Verified                    | - College: National Institute of Tech  |
|  - [] Selfie Photo Verified             | - Income Bracket: INR 25-35 LPA        |
|                                          +----------------------------------------+
|  [Safety Actions]                        | FAMILY DETAILS                         |
|  - [ Report Profile]                   | - Family Type: Nuclear                 |
|  - [ Block Member]                     | - Father: Retired Central Govt Officer |
|                                          | - Siblings: 1 Younger Brother (Unm.)   |
|                                          +----------------------------------------+
|                                          | LIFESTYLE & ASTROLOGY                  |
|                                          | - Diet: Vegetarian | Smoke: No         |
|                                          | - Manglik: No | Rashi: Aries           |
|                                          +----------------------------------------+
|                                          | WHAT SHE IS LOOKING FOR                |
|                                          | - Age: 28-33 | Height: 5'8"+           |
|                                          | - Profession: Tech / Corporate         |
+-----------------------------------------------------------------------------------+
```

### 3.2 Inbox Layout (`/inbox`)

```
+-----------------------------------------------------------------------------------+
| INBOX & CONNECTIONS                                                               |
+-----------------------------------------------------------------------------------+
| TABS: [Pending Received (4)] | [Accepted (12)] | [Sent (7)] | [Shortlist (9)]      |
+-----------------------------------------------------------------------------------+
| Filter by: [All Communities v] [Verified Only Toggle] [With Photos Only Toggle]    |
+-----------------------------------------------------------------------------------+
|  CARD 1: ROHAN M. (BDN-34901) - Received Yesterday                               |
|  [Photo]  29 Yrs, 5'11", Product Manager, Mumbai                                  |
|           "Hi Ananya, I found your profile very aligned with my values..."        |
|           [ ACCEPT INTEREST]      [ DECLINE]      [View Full Profile]           |
+-----------------------------------------------------------------------------------+
|  CARD 2: VIKRAM K. (BDN-51204) - Received 3 days ago                              |
|  [Photo]  31 Yrs, 6'0", Doctor / Surgeon, Delhi                                   |
|           "Expressed interest in your profile."                                   |
|           [ ACCEPT INTEREST]      [ DECLINE]      [View Full Profile]           |
+-----------------------------------------------------------------------------------+
```

---

## 4. State Transitions & Routing Access Guards

| Route Group | Required Auth State | Profile State | Role Required | Unauthorized Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `/login`, `/register` | Guest / Anonymous | Any | Public | If authenticated, redirect to `/dashboard` |
| `/onboarding/*` | Authenticated | `INCOMPLETE` | Member | If completed, redirect to `/dashboard` |
| `/dashboard`, `/matches/*`, `/search/*` | Authenticated | `COMPLETED` | Member | If incomplete, redirect to `/onboarding/step-1` |
| `/inbox/*`, `/chat/*` | Authenticated | `COMPLETED` & `ACTIVE` | Member | If suspended, redirect to `/account-suspended` |
| `/upgrade/*` | Authenticated | `COMPLETED` | Member | If anonymous, redirect to `/login?next=/upgrade` |
| `/admin/*` | Authenticated (MFA) | N/A | `ADMIN` / `MODERATOR` | 403 Forbidden / Redirect to `/admin/login` |
