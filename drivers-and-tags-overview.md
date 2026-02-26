# Smile-Link Drivers & Tags Overview

This document provides a complete reference of all drivers and tags used in the NLG template system.

---

## TAGS

Tags are extracted from questionnaire answers. They are the raw inputs that get processed into drivers.

### Q1: Main Reason for Smile Improvement
| Answer | Tag |
|--------|-----|
| Insecure/confidence | `motivation_confidence` |
| Discoloured/damaged/worn | `motivation_aesthetic_damage` |
| Functional issues | `motivation_functional` |
| Missing teeth (long-term) | `motivation_missing_teeth` |
| Beautiful/youthful | `motivation_aesthetic_premium` |
| Complete transformation | `motivation_full_transformation` |
| Missing teeth + improve color/shape | `motivation_combination` |

### Q2: Satisfaction Score (1-10)
| Score Range | Tag |
|-------------|-----|
| 1-4 | `satisfaction_major_dissatisfaction` |
| 5-7 | `satisfaction_moderate_dissatisfaction` |
| 8-10 | `satisfaction_minor_concerns` |

### Q2a: What Bothers Most (if score 1-4)
| Answer | Tag |
|--------|-----|
| Aesthetics | `bother_aesthetic` |
| Chewing/missing | `bother_functional` |
| Both | `bother_combination` |

### Q3: What Bothers Most About Teeth (multi-select)
| Answer | Tag |
|--------|-----|
| Discoloured/dull | `issue_discoloration` |
| Crooked/uneven | `issue_alignment` |
| Missing/damaged | `issue_missing_damaged` |
| Size/harmony | `issue_size_harmony` |
| Bite problems | `issue_bite` |
| Gum recession | `issue_gum_recession` |
| Loose/pain/chewing | `issue_functional_pain` |
| Missing + aesthetic | `issue_combination` |

### Q4: Previous Treatments (multi-select)
| Answer | Tag |
|--------|-----|
| No, never | `history_none` |
| Yes, implants | `history_implants` |
| Yes, veneers/crowns | `history_veneers_crowns` |
| Yes, orthodontics | `history_orthodontics` |
| Yes, periodontal | `history_periodontal` |

### Q5: Pain/Infection/Loose Teeth (CRITICAL - L1)
| Answer | Tag |
|--------|-----|
| Yes, pain | `acute_pain` |
| Yes, infection | `acute_infection` |
| Yes, loose/missing | `acute_loose_missing` |
| No, aesthetic only | `no_acute_issues` |

### Q6a: Current Dental Status (PRIMARY SELECTOR)
| Answer | Tag |
|--------|-----|
| No missing teeth | `status_no_missing` |
| 1 missing tooth | `status_single_missing` |
| 2-4 adjacent missing | `status_2_4_adjacent` |
| 2-4 non-adjacent | `status_2_4_dispersed` |
| Mix adjacent + spread | `status_mixed_pattern` |
| 5+ in one jaw | `status_5_plus_missing` |
| Most poor/unsaveable | `status_full_mouth_compromised` |

### Q6b: Location
| Answer | Tag |
|--------|-----|
| Front (aesthetic zone) | `location_anterior` |
| Side (chewing) | `location_posterior` |
| Both | `location_both` |

### Q6c: Condition of Neighbouring Teeth
| Answer | Tag |
|--------|-----|
| Intact | `adjacent_intact` |
| Partially restored | `adjacent_partial_restored` |
| Heavily restored | `adjacent_heavily_restored` |

### Q6d: Health of Aesthetic Teeth (multi-select)
| Answer | Tag |
|--------|-----|
| Mostly intact enamel | `tooth_health_good` |
| Large fillings/old restorations | `tooth_health_moderate` |
| Cracks/wear | `tooth_health_compromised` |
| Root canal | `tooth_health_root_canal` |
| Severe discolouration | `tooth_health_severe_discolor` |
| Bruxism | `tooth_health_bruxism` |

### Q7: Smile Style Preference
| Answer | Tag |
|--------|-----|
| Natural/subtle | `style_natural` |
| Hollywood | `style_hollywood` |
| Classic/elegant | `style_classic` |
| Functional/durable | `style_functional` |

### Q8: Natural Result Importance
| Answer | Tag |
|--------|-----|
| Very important (natural) | `natural_priority_high` |
| Hollywood/bright white | `natural_priority_low` |
| Best price/quality (flexible) | `natural_priority_balanced` |

### Q9: Age
| Answer | Tag |
|--------|-----|
| Under 30 | `age_under_30` |
| 30-45 | `age_30_45` |
| 45-60 | `age_45_60` |
| 60+ | `age_60_plus` |

### Q10: Budget
| Answer | Tag |
|--------|-----|
| Premium/best result | `budget_premium` |
| Price/quality flexible | `budget_balanced` |
| Affordable/durable | `budget_conscious` |
| Cost estimate first | `budget_uncertain` |

### Q11: Specialist Willingness
| Answer | Tag |
|--------|-----|
| Yes, for best result | `intent_high` |
| Maybe, need more info | `intent_moderate` |
| AI report first | `intent_exploratory` |

### Q12: Timeline
| Answer | Tag |
|--------|-----|
| 1-3 months | `timeline_urgent` |
| 6 months | `timeline_medium` |
| 1 year | `timeline_relaxed` |
| Still exploring | `timeline_exploratory` |

### Q13: Pregnancy (CRITICAL - L1)
| Answer | Tag |
|--------|-----|
| No | `pregnancy_no` |
| Yes, pregnant | `pregnancy_yes` |
| Possibly within 6 months | `pregnancy_planning` |
| Prefer not to say | `pregnancy_unknown` |

### Q14: Smoking
| Answer | Tag |
|--------|-----|
| No | `smoking_no` |
| Occasionally | `smoking_occasional` |
| Weekly | `smoking_weekly` |
| Daily | `smoking_daily` |

### Q15: Oral Hygiene
| Answer | Tag |
|--------|-----|
| Good | `hygiene_good` |
| Basic | `hygiene_basic` |
| Irregular | `hygiene_irregular` |
| Poor | `hygiene_poor` |

### Q16a: Growth Completed (CRITICAL - L1)
| Answer | Tag |
|--------|-----|
| No, incomplete | `growth_incomplete` |
| Yes, complete | `growth_complete` |

### Q16b: Recent Extraction
| Answer | Tag |
|--------|-----|
| Yes | `recent_extraction_yes` |
| No | `recent_extraction_no` |

### Q17: Medical Contraindications (CRITICAL - L1)
| Answer | Tag |
|--------|-----|
| No | `medical_clear` |
| Yes | `medical_contraindication` |

### Q18: Dental Anxiety
| Answer | Tag |
|--------|-----|
| No | `anxiety_none` |
| Yes, mild | `anxiety_mild` |
| Yes, severe | `anxiety_severe` |

---

## DRIVERS

Drivers are derived from tags using priority-based rules. Organized by layer.

### Layer 1 (L1) - Clinical/Safety Critical

#### `clinical_priority` (Safety Critical)
| Value | Derived From |
|-------|--------------|
| `urgent` | `acute_pain` OR `acute_infection` |
| `semi_urgent` | `acute_loose_missing` |
| `elective` | `no_acute_issues` |
| **Fallback**: `semi_urgent` | Safety-first when unknown |

#### `biological_stability` (Safety Critical)
| Value | Derived From |
|-------|--------------|
| `stable` | `hygiene_good` + `adjacent_intact` OR `status_no_missing` |
| `moderate` | `hygiene_good` OR `hygiene_basic` OR `adjacent_partial_restored` |
| `unstable` | `hygiene_irregular` OR `hygiene_poor` OR `adjacent_heavily_restored` |
| `compromised` | `issue_gum_recession` OR `history_periodontal` |
| **Fallback**: `moderate` | Conservative assumption |

#### `mouth_situation` (Safety Critical)
| Value | Derived From |
|-------|--------------|
| `no_missing_teeth` | `status_no_missing` |
| `single_missing_tooth` | `status_single_missing` |
| `multiple_adjacent` | `status_2_4_adjacent` |
| `multiple_dispersed` | `status_2_4_dispersed` |
| `mixed_pattern` | `status_mixed_pattern` |
| `extensive_missing` | `status_5_plus_missing` |
| `full_mouth_compromised` | `status_full_mouth_compromised` |
| **Fallback**: `complex` | Avoid oversimplification |

#### `age_stage`
| Value | Derived From |
|-------|--------------|
| `growing` | `growth_incomplete` |
| `young_adult` | `age_under_30` (+ `growth_complete`) |
| `adult` | `age_30_45` OR `age_45_60` |
| `senior` | `age_60_plus` |
| **Fallback**: `adult` | Most common |

#### `medical_constraints` (Safety Critical)
| Value | Derived From |
|-------|--------------|
| `surgical_contraindicated` | `medical_contraindication` |
| `pregnancy_related` | `pregnancy_yes` OR `pregnancy_planning` |
| `none` | `medical_clear` + `pregnancy_no` |
| **Fallback**: `possible_constraints` | Flag for review |

#### `treatment_viability`
| Value | Derived From |
|-------|--------------|
| `single_site` | `status_no_missing` OR `status_single_missing` |
| `multiple_site` | `status_2_4_adjacent` OR `status_2_4_dispersed` OR `status_mixed_pattern` |
| `full_mouth` | `status_5_plus_missing` OR `status_full_mouth_compromised` |
| **Fallback**: `conditional` | Requires assessment |

#### `risk_profile_biological` (Safety Critical)
| Value | Derived From |
|-------|--------------|
| `low` | `smoking_no` + `hygiene_good` |
| `moderate` | `smoking_occasional` OR `hygiene_basic` |
| `elevated` | `smoking_weekly/daily` OR `hygiene_irregular/poor` OR `tooth_health_bruxism` |
| **Fallback**: `elevated` | Conservative assumption |

---

### Layer 2 (L2) - Profile/Preference

#### `profile_type`
| Value | Derived From |
|-------|--------------|
| `aesthetic` | `motivation_aesthetic_*` OR `bother_aesthetic` |
| `functional` | `motivation_functional` OR `bother_functional` |
| `mixed` | `motivation_combination` OR `bother_combination` |
| `comfort` | `style_functional` |
| **Fallback**: `mixed` | Neutral middle ground |

#### `aesthetic_tolerance`
| Value | Derived From |
|-------|--------------|
| `conservative` | `natural_priority_high` (+ `style_natural`) |
| `moderate` | `natural_priority_balanced` |
| `aggressive` | `natural_priority_low` OR `style_hollywood` |
| **Fallback**: `moderate` | Avoid extremes |

#### `expectation_risk`
| Value | Derived From |
|-------|--------------|
| `realistic` | `satisfaction_minor_concerns` |
| `moderate` | `satisfaction_moderate_dissatisfaction` |
| `high` | `satisfaction_major_dissatisfaction` + `motivation_full_transformation` |
| **Fallback**: `moderate` | Middle ground |

#### `experience_history`
| Value | Derived From |
|-------|--------------|
| `first_timer` | `history_none` |
| `experienced` | `history_implants` OR `history_veneers_crowns` OR `history_orthodontics` OR `history_periodontal` |
| **Fallback**: `first_timer` | Assume first time |

#### `decision_stage`
| Value | Derived From |
|-------|--------------|
| `exploring` | `timeline_exploratory` OR `intent_exploratory` |
| `comparing` | `intent_moderate` OR `timeline_relaxed` |
| `ready` | `intent_high` + (`timeline_urgent` OR `timeline_medium`) |
| **Fallback**: `exploring` | Safe assumption |

#### `autonomy_level`
| Value | Derived From |
|-------|--------------|
| `guided` | `intent_high` |
| `collaborative` | `intent_moderate` |
| `autonomous` | `intent_exploratory` |
| **Fallback**: `collaborative` | Balanced default |

---

### Layer 3 (L3) - Communication/Tone

#### `anxiety_level`
| Value | Derived From |
|-------|--------------|
| `none` | `anxiety_none` |
| `mild` | `anxiety_mild` |
| `severe` | `anxiety_severe` |
| **Fallback**: `mild` | Empathic default |

#### `information_depth`
| Value | Derived From |
|-------|--------------|
| `detailed` | `intent_exploratory` |
| `standard` | `intent_moderate` OR `intent_high` |
| `summary` | `intent_high` + `timeline_urgent` |
| **Fallback**: `standard` | Balanced detail |

#### `budget_type`
| Value | Derived From |
|-------|--------------|
| `premium` | `budget_premium` |
| `balanced` | `budget_balanced` |
| `economy` | `budget_conscious` |
| `unknown` | `budget_uncertain` |
| **Fallback**: `unknown` | Omit cost section |

#### `treatment_philosophy`
| Value | Derived From |
|-------|--------------|
| `minimally_invasive` | `style_natural` (+ `natural_priority_high`) |
| `durability_focused` | `style_functional` |
| `aesthetic_maximalist` | `style_hollywood` OR `motivation_full_transformation` |
| **Fallback**: `balanced` | Neutral framing |

#### `time_horizon`
| Value | Derived From |
|-------|--------------|
| `immediate` | `timeline_urgent` |
| `short_term` | `timeline_medium` |
| `long_term` | `timeline_relaxed` |
| `undefined` | `timeline_exploratory` |
| **Fallback**: `undefined` | Omit timeline language |

---

## Quick Reference: All Tags

```
MOTIVATION: motivation_confidence, motivation_aesthetic_damage, motivation_functional,
motivation_missing_teeth, motivation_aesthetic_premium, motivation_full_transformation,
motivation_combination

SATISFACTION: satisfaction_major_dissatisfaction, satisfaction_moderate_dissatisfaction,
satisfaction_minor_concerns

BOTHER: bother_aesthetic, bother_functional, bother_combination

ISSUES: issue_discoloration, issue_alignment, issue_missing_damaged, issue_size_harmony,
issue_bite, issue_gum_recession, issue_functional_pain, issue_combination

HISTORY: history_none, history_implants, history_veneers_crowns, history_orthodontics,
history_periodontal

ACUTE: acute_pain, acute_infection, acute_loose_missing, no_acute_issues

STATUS: status_no_missing, status_single_missing, status_2_4_adjacent, status_2_4_dispersed,
status_mixed_pattern, status_5_plus_missing, status_full_mouth_compromised

LOCATION: location_anterior, location_posterior, location_both

ADJACENT: adjacent_intact, adjacent_partial_restored, adjacent_heavily_restored

TOOTH_HEALTH: tooth_health_good, tooth_health_moderate, tooth_health_compromised,
tooth_health_root_canal, tooth_health_severe_discolor, tooth_health_bruxism

STYLE: style_natural, style_hollywood, style_classic, style_functional

NATURAL_PRIORITY: natural_priority_high, natural_priority_low, natural_priority_balanced

AGE: age_under_30, age_30_45, age_45_60, age_60_plus

BUDGET: budget_premium, budget_balanced, budget_conscious, budget_uncertain

INTENT: intent_high, intent_moderate, intent_exploratory

TIMELINE: timeline_urgent, timeline_medium, timeline_relaxed, timeline_exploratory

PREGNANCY: pregnancy_no, pregnancy_yes, pregnancy_planning, pregnancy_unknown

SMOKING: smoking_no, smoking_occasional, smoking_weekly, smoking_daily

HYGIENE: hygiene_good, hygiene_basic, hygiene_irregular, hygiene_poor

GROWTH: growth_incomplete, growth_complete

EXTRACTION: recent_extraction_yes, recent_extraction_no

MEDICAL: medical_clear, medical_contraindication

ANXIETY: anxiety_none, anxiety_mild, anxiety_severe
```

---

## Quick Reference: All Drivers

```
L1 (CLINICAL):
- clinical_priority: urgent | semi_urgent | elective
- biological_stability: stable | moderate | unstable | compromised
- mouth_situation: no_missing_teeth | single_missing_tooth | multiple_adjacent |
  multiple_dispersed | mixed_pattern | extensive_missing | full_mouth_compromised
- age_stage: growing | young_adult | adult | senior
- medical_constraints: surgical_contraindicated | pregnancy_related | none | possible_constraints
- treatment_viability: single_site | multiple_site | full_mouth | conditional
- risk_profile_biological: low | moderate | elevated

L2 (PROFILE):
- profile_type: aesthetic | functional | mixed | comfort
- aesthetic_tolerance: conservative | moderate | aggressive
- expectation_risk: realistic | moderate | high
- experience_history: first_timer | experienced
- decision_stage: exploring | comparing | ready
- autonomy_level: guided | collaborative | autonomous

L3 (COMMUNICATION):
- anxiety_level: none | mild | severe
- information_depth: detailed | standard | summary
- budget_type: premium | balanced | economy | unknown
- treatment_philosophy: minimally_invasive | durability_focused | aesthetic_maximalist | balanced
- time_horizon: immediate | short_term | long_term | undefined
```
