# Matching Engine Specification & Worked Numerical Example: Bandham Platform

> **Algorithm Specification**: The Bandham Matching Engine calculates a bidirectional or expectation-weighted compatibility score (0% to 100%) between a Member's defined `PartnerPreference` vector and a prospective candidate's hydrated `Profile`.

---

## 1. Weighted Scoring Model Architecture

The overall compatibility score is computed as a weighted linear combination of normalized category sub-scores:

$$\text{Total Score } S = \sum_{i=1}^{n} w_i \cdot s_i$$

Where:
- $w_i \ge 0$ is the category weight, and $\sum w_i = 100$.
- $s_i \in [0.0, 1.0]$ is the normalized sub-score achieved in category $i$.

### Category Weight Distribution

| Category ($i$) | Weight ($w_i$) | Description & Rationale |
| :--- | :---: | :--- |
| **1. Age Compatibility** | **18%** | Critical biological & generational alignment factor. |
| **2. Religion & Community** | **22%** | High cultural significance in traditional & family matrimony. |
| **3. Educational Pedigree** | **15%** | Intellectual alignment & socioeconomic background. |
| **4. Professional Industry & Income**| **15%** | Career stability and economic standard of living. |
| **5. Residential Location** | **15%** | Geographic proximity and willingness to relocate. |
| **6. Diet & Lifestyle Habits** | **10%** | Daily living compatibility (vegetarianism, smoking, drinking). |
| **7. Astrological / Manglik Status** | **5%** | Horoscope / Manglik compatibility (if configured). |
| **Total Weight** | **100%** | |

---

## 2. Granular Category Evaluation Functions

### Category 1: Age Score ($w_1 = 18$)
- If Candidate Age $A_c \in [\text{min\_age}, \text{max\_age}]$:
  $$s_1 = 1.0$$
- If $A_c$ is within 2 years of the boundary:
  $$s_1 = 0.5$$
- Otherwise:
  $$s_1 = 0.0$$

### Category 2: Religion & Community Score ($w_2 = 22$)
- If Candidate Religion $\in \text{acceptable\_religions}$ AND Candidate Community $\in \text{acceptable\_communities}$:
  $$s_2 = 1.0$$
- If Candidate Religion $\in \text{acceptable\_religions}$ (Same religion, different community):
  $$s_2 = 0.70$$
- Otherwise (Different religion):
  $$s_2 = 0.0$$

### Category 3: Education Score ($w_3 = 15$)
Education is mapped to an ordinal rank:
1. `High School` (Rank 1)
2. `Diploma` (Rank 2)
3. `Bachelors` (Rank 3)
4. `Masters / CA / MD` (Rank 4)
5. `Doctorate / Ph.D.` (Rank 5)
- If $\text{Rank}(E_c) \ge \text{Rank}(E_{pref})$:
  $$s_3 = 1.0$$
- If $\text{Rank}(E_c) = \text{Rank}(E_{pref}) - 1$:
  $$s_3 = 0.60$$
- Otherwise:
  $$s_3 = 0.20$$

### Category 4: Profession & Income Score ($w_4 = 15$)
- **Sector Match**: Candidate sector $\in \text{acceptable\_sectors} \implies 0.5$ points.
- **Income Floor**: Candidate income bracket $\ge \text{min\_income\_bracket} \implies 0.5$ points.
- $$s_4 = \text{Sector Match} + \text{Income Floor} \in [0.0, 1.0]$$

### Category 5: Location Score ($w_5 = 15$)
- If Candidate City $\in \text{acceptable\_cities}$:
  $$s_5 = 1.0$$
- Else if Candidate State matches preferred State:
  $$s_5 = 0.75$$
- Else if Candidate Country $\in \text{acceptable\_countries}$:
  $$s_5 = 0.50$$
- Otherwise:
  $$s_5 = 0.10$$

### Category 6: Diet & Lifestyle Score ($w_6 = 10$)
- **Dietary Match**: Candidate diet $\in \text{acceptable\_diets} \implies 0.6$ points.
- **Smoking / Drinking**: If candidate is non-smoker and non-drinker (or matches preference) $\implies 0.4$ points.
- $$s_6 = \text{Diet} + \text{Habits} \in [0.0, 1.0]$$

### Category 7: Manglik / Astrological Score ($w_7 = 5$)
- If `manglik_preference` == `DOES_NOT_MATTER`:
  $$s_7 = 1.0$$
- If `manglik_preference` == `STRICT_MATCH`:
  - If both parties have matching Manglik status: $s_7 = 1.0$
  - Otherwise: $s_7 = 0.2$

---

## 3. Worked Numerical Example

### Profile 1 (Evaluator): Ananya Sharma (`BDN-10001`)
- **Age**: 28 | **Height**: 165 cm | **Religion**: Hindu | **Community**: Brahmin
- **Education**: M.Tech (Rank 4) | **Occupation**: Software Architect | **Income**: INR 25-40 LPA
- **City**: Bangalore | **Diet**: Vegetarian | **Manglik**: No
- **Her Partner Preferences**:
  - `min_age`: 27, `max_age`: 34
  - `min_height`: 172 cm, `max_height`: 190 cm
  - `acceptable_religions`: `["Hindu"]`
  - `acceptable_communities`: `["Brahmin", "Agarwal", "Kayastha", "Khatri"]`
  - `min_education`: `Bachelors` (Rank 3)
  - `acceptable_sectors`: `["PRIVATE", "GOVERNMENT", "BUSINESS"]`
  - `min_income`: `INR 15-25 LPA`
  - `acceptable_cities`: `["Bangalore", "Mumbai", "Pune", "Hyderabad"]`
  - `acceptable_diets`: `["VEGETARIAN", "EGGETARIAN"]`
  - `manglik_preference`: `DOES_NOT_MATTER`

---

### Candidate A: Rohan Mehta (`BDN-10042`)
- **Age**: 30 (Born 1994)
- **Height**: 178 cm
- **Religion**: Hindu | **Community**: Brahmin
- **Highest Education**: MBA in Finance from IIM Ahmedabad (Rank 4)
- **Sector**: Private | **Occupation**: Investment Banker | **Income**: INR 30-45 LPA
- **Location**: Bangalore, Karnataka
- **Diet**: Vegetarian | **Smoking**: No | **Drinking**: Occasionally
- **Manglik**: No

#### Step-by-Step Scoring for Candidate A:
1. **Age**: $30 \in [27, 34] \implies s_1 = 1.0 \implies 18 \times 1.0 = \mathbf{18.0}$
2. **Religion & Community**: Hindu + Brahmin $\in$ acceptable $\implies s_2 = 1.0 \implies 22 \times 1.0 = \mathbf{22.0}$
3. **Education**: MBA (Rank 4) $\ge$ Bachelors (Rank 3) $\implies s_3 = 1.0 \implies 15 \times 1.0 = \mathbf{15.0}$
4. **Profession & Income**: Private Sector (0.5) + INR 30-45 LPA $\ge$ INR 15-25 LPA (0.5) $\implies s_4 = 1.0 \implies 15 \times 1.0 = \mathbf{15.0}$
5. **Location**: Bangalore $\in$ acceptable cities $\implies s_5 = 1.0 \implies 15 \times 1.0 = \mathbf{15.0}$
6. **Diet & Lifestyle**: Vegetarian (0.6) + Non-Smoker (0.4) $\implies s_6 = 1.0 \implies 10 \times 1.0 = \mathbf{10.0}$
7. **Manglik**: Preference is `DOES_NOT_MATTER` $\implies s_7 = 1.0 \implies 5 \times 1.0 = \mathbf{5.0}$

$$\text{Final Score for Candidate A } S_A = 18.0 + 22.0 + 15.0 + 15.0 + 15.0 + 10.0 + 5.0 = \mathbf{100\%} \quad (\text{Perfect Match})$$

---

### Candidate B: Siddharth Verma (`BDN-10118`)
- **Age**: 36 (Born 1988) -> 2 years above max_age (34)
- **Height**: 175 cm
- **Religion**: Hindu | **Community**: Rajput (Not in her community preference list, but same religion)
- **Highest Education**: B.Tech in Mechanical Engineering (Rank 3)
- **Sector**: Private | **Occupation**: Operations Director | **Income**: INR 20-30 LPA
- **Location**: Chennai, Tamil Nadu (Same country, but not in her preferred cities)
- **Diet**: Non-Vegetarian (Does not match preferred Vegetarian/Eggetarian) | **Smoking**: No | **Drinking**: No
- **Manglik**: Yes

#### Step-by-Step Scoring for Candidate B:
1. **Age**: Age 36 is within 2 years of max (34) $\implies s_1 = 0.5 \implies 18 \times 0.5 = \mathbf{9.0}$
2. **Religion & Community**: Same Religion (Hindu), different community (Rajput) $\implies s_2 = 0.70 \implies 22 \times 0.70 = \mathbf{15.4}$
3. **Education**: B.Tech (Rank 3) $\ge$ Bachelors (Rank 3) $\implies s_3 = 1.0 \implies 15 \times 1.0 = \mathbf{15.0}$
4. **Profession & Income**: Private Sector (0.5) + Income satisfies floor (0.5) $\implies s_4 = 1.0 \implies 15 \times 1.0 = \mathbf{15.0}$
5. **Location**: Same Country (India), but different state/city $\implies s_5 = 0.50 \implies 15 \times 0.50 = \mathbf{7.5}$
6. **Diet & Lifestyle**: Non-Vegetarian (0.0) + Non-Smoker/Non-Drinker (0.4) $\implies s_6 = 0.4 \implies 10 \times 0.4 = \mathbf{4.0}$
7. **Manglik**: Preference is `DOES_NOT_MATTER` $\implies s_7 = 1.0 \implies 5 \times 1.0 = \mathbf{5.0}$

$$\text{Final Score for Candidate B } S_B = 9.0 + 15.4 + 15.0 + 15.0 + 7.5 + 4.0 + 5.0 = \mathbf{70.9\%} \quad (\text{Moderate Match})$$
