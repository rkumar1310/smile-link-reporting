# Driver & Scenario Matching System

This document explains how patient questionnaire answers flow through the system to produce a matched clinical scenario.

---

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Questionnaire  │ ──▶ │  Tag Extraction │ ──▶ │ Driver Derivation│ ──▶ │ Scenario Scoring│
│    Answers      │     │   (89 tags)     │     │  (18 drivers)   │     │  (17 scenarios) │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                                  │
                                                                                  ▼
                                                                        ┌─────────────────┐
                                                                        │ Matched Scenario │
                                                                        │ + Confidence     │
                                                                        └─────────────────┘
```

---

## 1. Driver Layers (Priority Hierarchy)

Drivers are organized into 3 layers. **Layer 1 always takes precedence.**

### Layer 1 (L1) - Clinical/Safety Critical
These drivers determine clinical safety and are evaluated first. They can override all other matching.

| Driver | Values | Safety Critical |
|--------|--------|-----------------|
| `clinical_priority` | urgent, semi_urgent, elective | ✅ Yes |
| `biological_stability` | stable, moderate, unstable, compromised | ✅ Yes |
| `mouth_situation` | no_missing_teeth → full_mouth_compromised | ✅ Yes |
| `medical_constraints` | surgical_contraindicated, pregnancy_related, none | ✅ Yes |
| `risk_profile_biological` | low, moderate, elevated | ✅ Yes |
| `age_stage` | growing, young_adult, adult, senior | No |
| `treatment_viability` | single_site, multiple_site, full_mouth | No |

### Layer 2 (L2) - Profile/Preference
Patient preferences and decision-making style.

| Driver | Values |
|--------|--------|
| `profile_type` | aesthetic, functional, mixed, comfort |
| `aesthetic_tolerance` | conservative, moderate, aggressive |
| `expectation_risk` | realistic, moderate, high |
| `experience_history` | first_timer, experienced |
| `decision_stage` | exploring, comparing, ready |
| `autonomy_level` | guided, collaborative, autonomous |

### Layer 3 (L3) - Communication/Tone
Affects report tone and depth, not scenario selection.

| Driver | Values |
|--------|--------|
| `anxiety_level` | none, mild, severe |
| `information_depth` | detailed, standard, summary |
| `budget_type` | premium, balanced, economy, unknown |
| `treatment_philosophy` | minimally_invasive, durability_focused, aesthetic_maximalist |
| `time_horizon` | immediate, short_term, long_term, undefined |

---

## 2. Scenario Matching Algorithm

### Step 1: Safety Override Check (L1 Priority)

**Before any scoring**, the system checks for safety overrides:

```
IF clinical_priority = "urgent" → FORCE S12 (Acute)
IF medical_constraints = "surgical_contraindicated" → FORCE S12 (Acute)
```

Safety scenarios bypass all scoring and return with **HIGH confidence** and **score = 100**.

### Step 2: Scenario Scoring

Each scenario is scored using 4 criteria types:

| Criterion | Weight | Behavior |
|-----------|--------|----------|
| **Required** | Must match | ALL must match or scenario is disqualified (score = -∞) |
| **Excluding** | Must NOT match | ANY match disqualifies the scenario (score = -∞) |
| **Strong** | +3 points | Positive scoring for matches |
| **Supporting** | +1 point | Additional positive scoring |
| **Preferred Tags** | +4 points | Direct tag matches (not driver-based) |

### Step 3: Confidence Thresholds

| Score | Confidence Level |
|-------|------------------|
| ≥ 8 | HIGH |
| ≥ 4 | MEDIUM |
| ≥ 2 | LOW |
| < 2 | FALLBACK |

### Step 4: Tie-Breaking (Priority Order)

When scenarios have equal scores, the **priority order** determines the winner:

```
S12 > S10 > S09 > S07 > S08 > S04 > S05 > S06 > S02 > S03 > S17 > S01 > S11 > S13 > S14 > S15 > S16
```

This ensures:
- Safety scenarios (S12) always win ties
- Complex cases (S10, S09) are prioritized over simple ones
- Specific scenarios beat generic ones

---

## 3. The 17 Scenarios

### Safety Scenario
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S12** | Loose teeth or pain (ACUTE) | `clinical_priority: [urgent, semi_urgent]` | 1st (highest) |

### Full Mouth Scenarios
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S10** | Almost all teeth unsaveable | `mouth_situation: [full_mouth_compromised]` | 2nd |
| **S09** | Full jaw edentulous | `mouth_situation: [full_mouth_compromised]` | 3rd |

### Extensive Missing (5+)
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S07** | 5+ teeth adjacent (segmental) | `mouth_situation: [extensive_missing]` | 4th |
| **S08** | 5+ teeth dispersed | `mouth_situation: [extensive_missing]` | 5th |

### Multiple Missing (2-4)
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S04** | 2-4 teeth adjacent | `mouth_situation: [multiple_adjacent]` | 6th |
| **S05** | 2-4 teeth dispersed | `mouth_situation: [multiple_dispersed]` | 7th |
| **S06** | Mix: missing + aesthetic | `mouth_situation: [single...mixed_pattern]` + `profile_type: [mixed]` | 8th |

### Single Missing
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S02** | Single tooth, visible zone | `mouth_situation: [single_missing_tooth]` | 9th |
| **S03** | Single tooth, posterior | `mouth_situation: [single_missing_tooth]` | 10th |
| **S17** | Single tooth, adjacent restored | `mouth_situation: [single_missing_tooth]` | 11th |

### No Missing Teeth
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S01** | No missing, discoloration | `mouth_situation: [no_missing_teeth]` + `profile_type: [aesthetic, mixed]` | 12th |
| **S11** | No missing, alignment | `mouth_situation: [no_missing_teeth]` | 13th |
| **S16** | Wear/damage, no missing | `mouth_situation: [no_missing_teeth]` | 16th |

### Profile-Based
| ID | Name | Required Drivers | Priority |
|----|------|------------------|----------|
| **S13** | Young, mild discoloration | `age_stage: [young_adult]` + `mouth_situation: [no_missing_teeth]` | 14th |
| **S14** | Senior, limited budget | `age_stage: [senior]` + `budget_type: [economy, balanced]` | 15th |
| **S15** | Premium, aesthetic | `budget_type: [premium]` + `profile_type: [aesthetic]` | 17th (lowest) |

### Fallback
| ID | Name | When Used |
|----|------|-----------|
| **S00_GENERIC** | Generic Assessment | No scenario matched |

---

## 4. Fallback Cascade

When no scenario scores above the LOW threshold (2), the system tries fallback strategies:

```
┌────────────────────────────────────────────────────────────────┐
│                    PRIMARY SCORING FAILED                       │
│                    (best score < 2)                            │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              STEP 1: RELAXED MATCHING                          │
│              Ignore L3 drivers, re-score                       │
│              If score ≥ 2 → return with MEDIUM confidence      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              STEP 2: ARCHETYPE MATCHING                        │
│              Match based on mouth_situation only               │
│              If match → return with LOW confidence             │
│                                                                │
│              Archetype Map:                                    │
│              no_missing_teeth → S01                            │
│              single_missing_tooth → S02                        │
│              multiple_adjacent → S04                           │
│              multiple_dispersed → S05                          │
│              mixed_pattern → S06                               │
│              extensive_missing → S07                           │
│              full_mouth_compromised → S09                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│              STEP 3: GENERIC FALLBACK                          │
│              Return S00_GENERIC with FALLBACK confidence       │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Scoring Example

### Patient Profile:
- Single missing tooth in front
- Wants aesthetic improvement
- No acute issues
- Good hygiene
- Young adult
- Premium budget

### Extracted Tags:
```
status_single_missing, location_anterior, motivation_aesthetic_premium,
no_acute_issues, hygiene_good, age_under_30, budget_premium, style_natural
```

### Derived Drivers:
```
L1:
  clinical_priority: elective
  biological_stability: stable
  mouth_situation: single_missing_tooth
  medical_constraints: none

L2:
  profile_type: aesthetic
  aesthetic_tolerance: conservative

L3:
  budget_type: premium
```

### Scenario S02 Scoring:
```
REQUIRED (must all match):
  ✅ mouth_situation: [single_missing_tooth] → MATCHED

EXCLUDING (must not match):
  ✅ clinical_priority: [urgent] → NOT PRESENT (good)

STRONG (+3 each):
  ✅ profile_type: [aesthetic, mixed] → MATCHED (+3)
  ✅ clinical_priority: [elective] → MATCHED (+3)

SUPPORTING (+1 each):
  ✅ aesthetic_tolerance: [moderate, aggressive] → NOT MATCHED (+0)
  ✅ biological_stability: [stable] → MATCHED (+1)

PREFERRED_TAGS (+4 each):
  ✅ location_anterior → MATCHED (+4)

TOTAL SCORE: 3 + 3 + 1 + 4 = 11
CONFIDENCE: HIGH (≥8)
```

### Why S02 Wins Over S03:
- S02: Score 11, Priority 9th
- S03: Requires `profile_type: [functional, comfort]` → patient is `aesthetic` → lower score
- S02 matches the aesthetic profile better

---

## 6. Key Principles

### 1. Safety First
L1 safety drivers (`clinical_priority: urgent`) bypass all scoring and force S12.

### 2. Required = Gate
Required drivers act as gates. Missing ANY required driver = scenario disqualified.

### 3. Excluding = Veto
Excluding drivers veto scenarios. Matching ANY excluding value = scenario disqualified.

### 4. Specificity Wins
More specific scenarios (with more matching criteria) naturally score higher than generic ones.

### 5. Graceful Degradation
The fallback cascade ensures every patient gets a scenario, even with incomplete data.

### 6. Preferred Tags = User Intent
Direct tag matches (like `location_anterior`) carry high weight (+4) because they reflect explicit user input.

---

## 7. Scenario Selection Matrix

Quick reference for which drivers drive which scenarios:

| mouth_situation | Scenarios (by priority) |
|-----------------|-------------------------|
| `no_missing_teeth` | S01 (aesthetic), S11 (alignment), S13 (young), S16 (wear) |
| `single_missing_tooth` | S02 (anterior), S03 (posterior), S17 (adjacent restored), S06 (mixed) |
| `multiple_adjacent` | S04, S06 (if mixed profile) |
| `multiple_dispersed` | S05, S06 (if mixed profile) |
| `mixed_pattern` | S06 |
| `extensive_missing` | S07 (segmental), S08 (dispersed) |
| `full_mouth_compromised` | S10 (unsaveable), S09 (edentulous) |

| clinical_priority | Effect |
|-------------------|--------|
| `urgent` | **Forces S12** (safety override) |
| `semi_urgent` | Matches S12, excludes S01 |
| `elective` | Matches most scenarios, excludes S12 |

| profile_type | Favors |
|--------------|--------|
| `aesthetic` | S01, S02, S11, S13, S15 |
| `functional` | S03, S04, S07, S09, S14, S16 |
| `mixed` | S06 (specifically requires this) |
| `comfort` | S03, S14 |
