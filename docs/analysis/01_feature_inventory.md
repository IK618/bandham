# Feature Inventory: Matrimonial Platform (Clean-Room Behavioral Reverse Engineering)

> **Methodology Note (REA Skill Compliance)**: This document records the functional surface observed across publicly accessible matrimonial workflows (referencing public behavioral patterns exemplified by services like Shaadi.com). Per clean-room reverse-engineering rules, no proprietary code, trademarks, scraping, or confidential assets are utilized. All specifications below define the blueprint for our original matrimonial application, **Bandham** (`<APP_NAME>`).

---

## 1. Registration & Identity Foundation (Signup)

### 1.1 Account Ownership & Relationship Delegation ("Profile Created For")
Matrimonial platforms in South Asian and traditional contexts differ fundamentally from dating apps: accounts are frequently created or managed by family members.
- **Observed Creator Types**:
  - `SELF`: Candidate manages their own account.
  - `PARENT` (Mother / Father): High degree of formality; family-oriented filters prioritized.
  - `SIBLING` (Brother / Sister): Often collaborative with the candidate.
  - `RELATIVE` / `FRIEND` / `GUARDIAN`: Authorized representative managing initial discovery.
- **Behavioral Impact**:
  - Sets pronoun and copy context throughout the app (e.g., "Tell us about your son" vs "Tell us about yourself").
  - Affects contact verification flows (identifying who is the primary phone contact).

### 1.2 Core Credentials & Onboarding Entry
- **Identity Triad**:
  - **Email Address**: Unique login identifier, primary channel for transactional receipts, security alerts, and match digests.
  - **Mobile Phone Number**: Key anti-fraud vector; verified via SMS/WhatsApp One-Time Password (OTP).
  - **Password / Passwordless Option**: Strong password policy (min 8 chars, mixed case, numbers, special characters) with optional magic-link/OTP fallback.
- **Basic Demographic Anchors**:
  - Legal First Name and Last Name (Stored securely; public display defaults to First Name + Last Initial for privacy).
  - Gender (`MALE`, `FEMALE`, `OTHER`) and Gender of interest (defaults to heterosexual pairing in traditional matrimonial configurations, extensible).
  - Date of Birth: Validates legal age requirement (e.g., min 21 for males, min 18/21 for females depending on regional jurisdiction).

---

## 2. Multi-Tier Profile Builder & Data Schema

Matrimonial profiles require structured, multi-dimensional attributes to support fine-grained search filters and matching algorithms.

### 2.1 Personal & Physical Characteristics
- **Height**: Granular imperial/metric values (e.g., 4ft 6in to 7ft 0in / 137cm to 213cm).
- **Physical Status**: Normal, Physically Challenged / Specially Abled (with optional details).
- **Body Type & Complexion**: Optional legacy matrimonial fields (Modern UX treats as optional to discourage superficial discrimination).

### 2.2 Religious, Social & Cultural Heritage
- **Religion**: Hindu, Muslim, Christian, Sikh, Jain, Buddhist, Parsi, Jewish, Spiritual, Non-Religious / Atheist.
- **Mother Tongue / Linguistic Identity**: Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, Odia, Punjabi, Assamese, English, etc.
- **Community / Caste / Sub-caste**: Stored as hierarchical taxonomy (Religion -> Caste/Community -> Sub-caste / Gotra). Includes "Willing to marry other communities" toggle.
- **Manglik / Horoscope / Astro Details**:
  - Manglik status: `YES`, `NO`, `DON'T_KNOW`, `ANGSHIK` (Partial).
  - Date, Time, and City of Birth (for optional Kundali / Natal chart generation).

### 2.3 Educational & Professional Credentials
- **Highest Education Level**: Doctorate, Masters, Bachelors, Diploma, High School.
- **Education Field**: Engineering/Tech, Medicine, Management, Law, Arts/Humanities, Commerce, Science.
- **Institutions Attended**: College/University name.
- **Employment Sector**: Private Sector, Government / Public Sector, Defense, Business / Entrepreneur, Self-Employed, Non-Working.
- **Occupation Title**: Standardized job roles (e.g., Software Architect, Civil Surgeon, Chartered Accountant).
- **Annual Income Currency & Bracket**: Bracketed ranges (e.g., INR 5-10 LPA, 10-20 LPA, 20-30 LPA, 50+ LPA; USD equivalents) to protect exact figures while enabling economic compatibility filtering.

### 2.4 Residential & Location Attributes
- **Citizenship & Residency**: Country of Residence, State/Province, City, Postal Code.
- **Residency Status**: Citizen, Permanent Resident, Work Visa (H1-B, L1, etc.), Student Visa.
- **Ancestral / Native Origin**: Ancestral City/Town/State (frequently queried by families).

### 2.5 Family Background & Values
- **Family Type**: Joint Family, Nuclear Family.
- **Family Values**: Traditional, Moderate, Liberal.
- **Family Affluence / Status**: Middle Class, Upper Middle Class, Rich / Affluent.
- **Parents' Occupations**: Father's and Mother's occupational status.
- **Siblings Details**: Number of brothers/sisters and marital status.

### 2.6 Lifestyle, Habits & Personal Bio
- **Dietary Habits**: Vegetarian, Non-Vegetarian, Eggetarian, Vegan, Jain Vegetarian.
- **Smoking & Drinking**: `NO`, `OCCASIONALLY`, `YES`.
- **Hobbies & Interests**: Multi-select tags (Reading, Traveling, Cooking, Fitness, Music, Pets).
- **"About Me" Freeform Narrative**: Structured rich text narrative (min 100 characters) checked by automated content moderation for PII leaks (phone numbers, email addresses, external URLs).

---

## 3. Partner Preferences (Expectation Criteria)

Partner preferences form the inverse query used by the matching engine to score candidate profiles bidirectionally.

- **Age Range**: Lower bound to upper bound (e.g., 25 to 30).
- **Height Range**: Min to Max.
- **Marital Status**: Never Married, Divorced, Widowed, Awaiting Divorce.
- **Religious & Caste Criteria**: Multi-select acceptable religions, communities, and Gotra exclusion.
- **Mother Tongue Acceptance**: Multi-select acceptable native languages.
- **Country & City Relocation Flexibility**: Preferred countries/cities; toggle for "Open to relocate abroad".
- **Education & Career Criteria**: Acceptable minimum education levels and professional industries.
- **Income Floor**: Minimum desired annual earnings.
- **Dietary & Lifestyle Compatibility**: Strictness flag on vegetarianism, smoking, and drinking.

---

## 4. Search, Discovery & Recommendation Engine

### 4.1 Search Paradigms
- **Basic Search**: Age, Height, Religion, Mother Tongue, Marital Status, City.
- **Advanced Multi-Faceted Search**: Includes Income range, Education field, Occupation type, Manglik compatibility, Family type, Dietary preferences.
- **Profile ID Search**: Direct lookup by unique alphanumeric identifier (e.g., `BDN-89234`).
- **Keyword Search**: Trigram/Full-text search on user bio, occupation, and hobbies.

### 4.2 Automated Recommendation Feeds
- **Daily Recommendations ("Today's Matches")**: Algorithmic top 10-20 profiles refreshed daily at midnight UTC based on mutual compatibility score.
- **Mutual Matches**: Both Candidate A matches Candidate B's preferences AND Candidate B matches Candidate A's preferences.
- **"Near Me" / Geographic Proximity**: Proximity filtering based on city/state coordinates.
- **Recently Joined**: Showcases newly onboarded profiles within the last 7 to 14 days.

---

## 5. Engagement, Express Interest & Shortlisting

### 5.1 The "Express Interest" Funnel
- Unlike casual dating where two users must swipe right simultaneously before any notification occurs, matrimonial platforms feature an **asymmetric intent workflow**:
  1. **Sender Action**: Member clicks "Send Interest" (with optional predefined polite greeting).
  2. **Recipient Delivery**: Interest appears in the recipient's "Pending Interests" inbox and triggers email/push notification.
  3. **Recipient Disposition**:
     - `ACCEPT`: Unlocks reciprocal connection; status updates to `ACCEPTED`; unlocks mutual messaging (subject to tier rules).
     - `DECLINE`: Sender is quietly informed or status updates to `DECLINED` without aggressive notification.
     - `PENDING`: Stays in queue with expiration TTL (e.g., 30 days).

### 5.2 Shortlist & Bookmarking
- Private bookmarked list of profiles under consideration.
- Does not notify the target candidate; allows private comparison and notes.

---

## 6. Communication & Chat

### 6.1 In-App Real-Time Messaging
- WebSockets-based real-time 1-on-1 chat.
- Message status indicators: `SENT`, `DELIVERED`, `READ`.
- Pre-chat safety warnings and anti-harassment banners (e.g., "Never share banking passwords or send money to matches").

### 6.2 Contact Reveal (Phone / WhatsApp / Email)
- Matrimonial decisions involve off-platform discussions between families.
- Verified phone numbers and email addresses are masked by default.
- "View Contact" button triggers credit deduction from the viewer's subscription wallet and logs an audit record.
- Both parties receive an SMS/in-app alert informing them that contact details were accessed.

---

## 7. Photo Privacy & Media Management

### 7.1 Media Uploads
- Primary Display Avatar + Gallery storage (up to 10 photos).
- Cloud storage integration (MinIO/S3) with presigned URLs, thumbnail resizing (AVIF/WebP), and metadata EXIF stripping.

### 7.2 Visibility Modes
- **Public**: Visible to all registered, verified members.
- **Visible to Accepted / Contacted Only**: Photos appear with gaussian blur and a padlock icon until an Interest is accepted or contact is established.
- **Password Protected / On-Request**: Photos hidden; requires explicit "Photo Request" action approved by the owner.
- **Dynamic Watermarking**: System overlays the viewer's Profile ID and timestamp across high-res photos to deter unauthorized screenshots and redistribution.

---

## 8. Premium Plans & Monetization Strategy

### 8.1 Tier Structure
1. **Free Tier ("Explorer")**:
   - Create and maintain full profile.
   - Upload photos with privacy controls.
   - Search and browse public directory.
   - Send up to 5 Interests per day.
   - Receive and accept/decline incoming interests.
   - Cannot initiate direct chat; cannot view phone numbers.
2. **Gold Tier**:
   - Unlimited Interests.
   - 50 Contact Number reveals.
   - Direct messaging with accepted matches.
   - View hidden photos of members who allow Gold users.
3. **Platinum / Diamond Tier**:
   - 150 Contact Number reveals.
   - Direct messaging with any registered member (bypassing interest approval gate).
   - Priority placement in search results and "Today's Recommendations".
   - Read receipts on all messages.
   - Dedicated relationship advisor / priority support.

---

## 9. Trust, Safety & Verification Badges

Matrimonial platforms handle deeply sensitive life decisions; trust verification is the primary competitive differentiator.

### 9.1 Verification Mechanisms
- **Government ID Verification**: Upload of government photo ID (Aadhaar, Passport, Driver's License) reviewed by automated OCR / human moderators. Grants a "Verified Identity" green shield badge.
- **Phone / OTP Verification**: Mandatory badge confirming real telecommunication binding.
- **Selfie Liveness Verification**: Pose-matching selfie compared against uploaded gallery photos to eliminate catfishing.
- **Salary / Income Slip Verification**: Optional confidential document review for high-net-worth badges.

### 9.2 Moderation, Blocking & Reporting
- **Instant Block**: Prevents profile visibility, searches, and messaging bidirectionally.
- **Multi-Category Report**: Fake profile, Inappropriate messages, Financial solicitation / scam, Married pretending to be single, Offensive photo.
- **Moderator Dashboard**: Queue for inspecting flagged accounts, approving pending photos, and banning offenders.
