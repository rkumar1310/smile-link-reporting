# Question → Tag → Driver → Scenario Resolution Matrix
## Smile-Link NLG System - Canonical Mapping v1.0

---

## PART 1: Question + Answer → Tag Mapping

### Q1 - Main reason for smile improvement
| Answer | Tag |
|--------|-----|
| Insecure/want confidence | `motivation_confidence` |
| Discoloured/damaged/worn | `motivation_aesthetic_damage` |
| Functional issues (pain/loose/chewing) | `motivation_functional` |
| Missing teeth, long-term solution | `motivation_missing_teeth` |
| Beautiful/youthful smile | `motivation_aesthetic_premium` |
| Complete transformation | `motivation_full_transformation` |
| Missing teeth + improve colour/shape | `motivation_combination` |

### Q2 - Satisfaction score (1-10)
| Answer | Tag |
|--------|-----|
| Score 1-4 | `satisfaction_major_dissatisfaction` |
| Score 5-7 | `satisfaction_moderate_dissatisfaction` |
| Score 8-10 | `satisfaction_minor_concerns` |

### Q2a - What bothers you most (filter for score 1-4)
| Answer | Tag |
|--------|-----|
| Esthetics | `bother_aesthetic` |
| Chewing/missing teeth | `bother_functional` |
| Both | `bother_combination` |

### Q3 - What bothers you most about teeth
| Answer | Tag |
|--------|-----|
| Discoloured/dull | `issue_discoloration` |
| Crooked/uneven | `issue_alignment` |
| Missing/damaged teeth | `issue_missing_damaged` |
| Size/harmony issues | `issue_size_harmony` |
| Bite problems | `issue_bite` |
| Gum recession | `issue_gum_recession` |
| Loose teeth/pain/chewing | `issue_functional_pain` |
| Missing + aesthetic concerns | `issue_combination` |

### Q4 - Previous treatments
| Answer | Tag |
|--------|-----|
| No, never | `history_none` |
| Yes, implants | `history_implants` |
| Yes, veneers/crowns | `history_veneers_crowns` |
| Yes, orthodontics | `history_orthodontics` |
| Yes, periodontal | `history_periodontal` |

### Q5 - Pain/infection/loose teeth (CRITICAL - L1 SAFETY)
| Answer | Tag |
|--------|-----|
| Yes, tooth pain | `acute_pain` |
| Yes, infection | `acute_infection` |
| Yes, loose/missing teeth | `acute_loose_missing` |
| No, aesthetic only | `no_acute_issues` |

### Q6a - Current dental status (PRIMARY SCENARIO SELECTOR)
| Answer | Tag |
|--------|-----|
| No missing teeth | `status_no_missing` |
| One tooth missing | `status_single_missing` |
| 2-4 adjacent missing | `status_2_4_adjacent` |
| 2-4 non-adjacent | `status_2_4_dispersed` |
| Mix adjacent + spread | `status_mixed_pattern` |
| 5+ missing one jaw | `status_5_plus_missing` |
| Most teeth poor/unsaveable | `status_full_mouth_compromised` |

### Q6b - Location
| Answer | Tag |
|--------|-----|
| Front teeth (aesthetic zone) | `location_anterior` |
| Side/chewing area | `location_posterior` |
| Both | `location_both` |

### Q6c - Condition of neighbouring teeth
| Answer | Tag |
|--------|-----|
| Intact | `adjacent_intact` |
| Partially restored | `adjacent_partial_restored` |
| Heavily restored | `adjacent_heavily_restored` |

### Q6d - Health of aesthetic teeth
| Answer | Tag |
|--------|-----|
| Mostly intact enamel | `tooth_health_good` |
| Large fillings/old restorations | `tooth_health_moderate` |
| Cracks or wear | `tooth_health_compromised` |
| Root canal treatment | `tooth_health_root_canal` |
| Severe discolouration | `tooth_health_severe_discolor` |
| Bruxism | `tooth_health_bruxism` |

### Q7 - Smile style preference
| Answer | Tag |
|--------|-----|
| Natural and subtle | `style_natural` |
| Hollywood smile | `style_hollywood` |
| Classic and elegant | `style_classic` |
| Functional and durable | `style_functional` |

### Q8 - Natural result importance
| Answer | Tag |
|--------|-----|
| Very important, natural | `natural_priority_high` |
| Hollywood, bright white | `natural_priority_low` |
| Best price-quality, flexible | `natural_priority_balanced` |

### Q9 - Age
| Answer | Tag |
|--------|-----|
| Under 30 | `age_under_30` |
| 30-45 | `age_30_45` |
| 45-60 | `age_45_60` |
| 60+ | `age_60_plus` |

### Q10 - Budget
| Answer | Tag |
|--------|-----|
| Premium, best result | `budget_premium` |
| Price-quality, flexible | `budget_balanced` |
| Affordable, durable | `budget_conscious` |
| Cost estimate first | `budget_uncertain` |

### Q11 - Specialist willingness
| Answer | Tag |
|--------|-----|
| Yes, for best result | `intent_high` |
| Maybe, need info | `intent_moderate` |
| AI report first | `intent_exploratory` |

### Q12 - Timeline
| Answer | Tag |
|--------|-----|
| 1-3 months | `timeline_urgent` |
| 6 months | `timeline_medium` |
| 1 year | `timeline_relaxed` |
| Still exploring | `timeline_exploratory` |

### Q13 - Pregnancy (CRITICAL - L1 SAFETY)
| Answer | Tag |
|--------|-----|
| No | `pregnancy_no` |
| Yes, pregnant | `pregnancy_yes` |
| Possibly within 6 months | `pregnancy_planning` |
| Prefer not to say | `pregnancy_unknown` |

### Q14 - Smoking
| Answer | Tag |
|--------|-----|
| No | `smoking_no` |
| Occasionally | `smoking_occasional` |
| Weekly | `smoking_weekly` |
| Daily | `smoking_daily` |

### Q15 - Oral hygiene
| Answer | Tag |
|--------|-----|
| Good | `hygiene_good` |
| Basic | `hygiene_basic` |
| Irregular | `hygiene_irregular` |
| Poor | `hygiene_poor` |

### Q16a - Growth completed
| Answer | Tag |
|--------|-----|
| Yes (under 18/incomplete) | `growth_incomplete` |
| No (adult, complete) | `growth_complete` |

### Q16b - Recent extraction
| Answer | Tag |
|--------|-----|
| Yes | `recent_extraction_yes` |
| No | `recent_extraction_no` |

### Q17 - Medical contraindications (CRITICAL - L1 SAFETY)
| Answer | Tag |
|--------|-----|
| No | `medical_clear` |
| Yes | `medical_contraindication` |

### Q18 - Dental anxiety
| Answer | Tag |
|--------|-----|
| No | `anxiety_none` |
| Yes, mild | `anxiety_mild` |
| Yes, severe | `anxiety_severe` |

---

## PART 2: Tag → Driver Value Mapping

### Layer 1 Drivers (Safety/Clinical - Non-negotiable)

#### clinical_priority
| Tag(s) | Driver Value |
|--------|--------------|
| `acute_pain`, `acute_infection` | `urgent` |
| `acute_loose_missing` | `semi_urgent` |
| `no_acute_issues` | `elective` |

#### biological_stability
| Tag(s) | Driver Value |
|--------|--------------|
| `hygiene_good` + `adjacent_intact` | `stable` |
| `hygiene_basic` OR `adjacent_partial_restored` | `moderate` |
| `hygiene_irregular/poor` OR `adjacent_heavily_restored` | `unstable` |
| `issue_gum_recession` OR `history_periodontal` | `compromised` |

#### mouth_situation
| Tag(s) | Driver Value |
|--------|--------------|
| `status_no_missing` | `no_missing_teeth` |
| `status_single_missing` | `single_missing_tooth` |
| `status_2_4_adjacent` | `multiple_adjacent` |
| `status_2_4_dispersed` | `multiple_dispersed` |
| `status_mixed_pattern` | `mixed_pattern` |
| `status_5_plus_missing` | `extensive_missing` |
| `status_full_mouth_compromised` | `full_mouth_compromised` |

#### age_stage
| Tag(s) | Driver Value |
|--------|--------------|
| `growth_incomplete` | `growing` |
| `age_under_30` + `growth_complete` | `young_adult` |
| `age_30_45`, `age_45_60` | `adult` |
| `age_60_plus` | `senior` |

#### medical_constraints
| Tag(s) | Driver Value |
|--------|--------------|
| `medical_clear` + `pregnancy_no` | `none` |
| `pregnancy_yes` OR `pregnancy_planning` | `pregnancy_related` |
| `medical_contraindication` | `surgical_contraindicated` |

#### treatment_viability
| Tag(s) | Driver Value |
|--------|--------------|
| `status_no_missing` OR `status_single_missing` | `single_site` |
| `status_2_4_adjacent` OR `status_2_4_dispersed` | `multiple_site` |
| `status_5_plus_missing` OR `status_full_mouth_compromised` | `full_mouth` |

#### risk_profile_biological
| Tag(s) | Driver Value |
|--------|--------------|
| `smoking_no` + `hygiene_good` | `low` |
| `smoking_occasional` OR `hygiene_basic` | `moderate` |
| `smoking_weekly/daily` OR `hygiene_irregular/poor` | `elevated` |
| `tooth_health_bruxism` | `elevated` (additive) |

### Layer 2 Drivers (Personalization)

#### profile_type
| Tag(s) | Driver Value |
|--------|--------------|
| `motivation_aesthetic_*` OR `bother_aesthetic` | `aesthetic` |
| `motivation_functional` OR `bother_functional` | `functional` |
| `motivation_combination` OR `bother_combination` | `mixed` |
| `style_functional` | `comfort` |

#### aesthetic_tolerance
| Tag(s) | Driver Value |
|--------|--------------|
| `natural_priority_high` + `style_natural` | `conservative` |
| `natural_priority_balanced` | `moderate` |
| `natural_priority_low` OR `style_hollywood` | `aggressive` |

#### expectation_risk
| Tag(s) | Driver Value |
|--------|--------------|
| `satisfaction_minor_concerns` | `realistic` |
| `satisfaction_moderate_dissatisfaction` | `moderate` |
| `satisfaction_major_dissatisfaction` + `motivation_full_transformation` | `high` |

#### experience_history
| Tag(s) | Driver Value |
|--------|--------------|
| `history_none` | `first_timer` |
| `history_implants/veneers/crowns` (positive context) | `experienced` |
| (negative outcomes mentioned) | `negative_history` |

#### decision_stage
| Tag(s) | Driver Value |
|--------|--------------|
| `timeline_exploratory` OR `intent_exploratory` | `exploring` |
| `intent_moderate` OR `timeline_relaxed` | `comparing` |
| `intent_high` + `timeline_urgent/medium` | `ready` |

#### autonomy_level
| Tag(s) | Driver Value |
|--------|--------------|
| `intent_high` | `guided` |
| `intent_moderate` | `collaborative` |
| `intent_exploratory` | `autonomous` |

### Layer 3 Drivers (Narrative/Tone)

#### anxiety_level
| Tag(s) | Driver Value |
|--------|--------------|
| `anxiety_none` | `none` |
| `anxiety_mild` | `mild` |
| `anxiety_severe` | `severe` |

#### information_depth
| Tag(s) | Driver Value |
|--------|--------------|
| `intent_exploratory` | `detailed` |
| `intent_moderate` | `standard` |
| `intent_high` + `timeline_urgent` | `summary` |

#### budget_type
| Tag(s) | Driver Value |
|--------|--------------|
| `budget_premium` | `premium` |
| `budget_balanced` | `balanced` |
| `budget_conscious` | `economy` |
| `budget_uncertain` | `unknown` |

#### treatment_philosophy
| Tag(s) | Driver Value |
|--------|--------------|
| `style_natural` + `natural_priority_high` | `minimally_invasive` |
| `style_functional` | `durability_focused` |
| `style_hollywood` OR `motivation_full_transformation` | `aesthetic_maximalist` |

#### time_horizon
| Tag(s) | Driver Value |
|--------|--------------|
| `timeline_urgent` | `immediate` |
| `timeline_medium` | `short_term` |
| `timeline_relaxed` | `long_term` |
| `timeline_exploratory` | `undefined` |

---

## PART 3: Driver Values → Scenario Scoring Matrix

### Scenario Definitions with Required/Supporting/Excluding Drivers

#### S01 - No missing teeth, discoloration
```yaml
required:
  mouth_situation: no_missing_teeth
  profile_type: [aesthetic, mixed]
strong:
  issue: [discoloration, aesthetic_damage]
  clinical_priority: elective
supporting:
  aesthetic_tolerance: [conservative, moderate]
  budget_type: [balanced, premium]
excluding:
  clinical_priority: [urgent, semi_urgent]
  mouth_situation: [single_missing_tooth, multiple_*]
```

#### S02 - Single tooth missing, visible zone
```yaml
required:
  mouth_situation: single_missing_tooth
  location: anterior
strong:
  profile_type: [aesthetic, mixed]
  clinical_priority: elective
supporting:
  aesthetic_tolerance: [moderate, aggressive]
  biological_stability: stable
excluding:
  location: posterior (alone)
  clinical_priority: urgent
```

#### S03 - Single tooth missing, posterior zone
```yaml
required:
  mouth_situation: single_missing_tooth
  location: posterior
strong:
  profile_type: functional
  clinical_priority: [elective, semi_urgent]
supporting:
  treatment_philosophy: durability_focused
excluding:
  location: anterior (alone)
  profile_type: aesthetic (alone)
```

#### S04 - 2-4 teeth adjacent
```yaml
required:
  mouth_situation: multiple_adjacent
strong:
  treatment_viability: multiple_site
  biological_stability: [stable, moderate]
supporting:
  profile_type: [functional, mixed]
excluding:
  mouth_situation: [single_*, dispersed, full_mouth*]
```

#### S05 - 2-4 teeth dispersed
```yaml
required:
  mouth_situation: multiple_dispersed
strong:
  treatment_viability: multiple_site
supporting:
  profile_type: [functional, mixed]
excluding:
  mouth_situation: [single_*, adjacent, full_mouth*]
```

#### S06 - Mix: missing teeth + aesthetic problem
```yaml
required:
  mouth_situation: [single_missing_tooth, multiple_*]
  profile_type: mixed
strong:
  bother: combination
  motivation: combination
supporting:
  aesthetic_tolerance: moderate
excluding:
  profile_type: [aesthetic alone, functional alone]
```

#### S07 - 5+ teeth adjacent (segmental)
```yaml
required:
  mouth_situation: extensive_missing
  pattern: adjacent/segmental
strong:
  treatment_viability: full_mouth
  biological_stability: [stable, moderate]
supporting:
  profile_type: functional
excluding:
  mouth_situation: [single_*, 2_4_*]
```

#### S08 - 5+ teeth dispersed
```yaml
required:
  mouth_situation: extensive_missing
  pattern: dispersed
strong:
  treatment_viability: full_mouth
supporting:
  profile_type: [functional, mixed]
excluding:
  mouth_situation: [single_*, 2_4_*]
```

#### S09 - Full jaw edentulous
```yaml
required:
  mouth_situation: full_mouth_compromised
  status: fully_edentulous
strong:
  treatment_viability: full_mouth
supporting:
  age_stage: senior
  profile_type: functional
excluding:
  mouth_situation: [no_missing, single_*, multiple_*]
```

#### S10 - Almost all teeth unsaveable
```yaml
required:
  mouth_situation: full_mouth_compromised
  tooth_prognosis: globally_poor
strong:
  biological_stability: [unstable, compromised]
supporting:
  clinical_priority: [semi_urgent, urgent]
excluding:
  mouth_situation: [no_missing, single_*, multiple_adjacent/dispersed]
```

#### S11 - No missing teeth, alignment issue
```yaml
required:
  mouth_situation: no_missing_teeth
  issue: alignment
strong:
  profile_type: aesthetic
  clinical_priority: elective
supporting:
  age_stage: [young_adult, adult]
  aesthetic_tolerance: conservative
excluding:
  mouth_situation: [*_missing*]
  issue: [functional_pain, missing_damaged]
```

#### S12 - Loose teeth or pain (ACUTE)
```yaml
required:
  clinical_priority: [urgent, semi_urgent]
  issue: [functional_pain, acute_*]
strong:
  acute: [pain, infection, loose_missing]
supporting:
  (none - this is safety-driven)
excluding:
  clinical_priority: elective
  no_acute_issues: true
```

#### S13 - Young profile, mild discoloration
```yaml
required:
  age_stage: [young_adult]
  mouth_situation: no_missing_teeth
  issue: discoloration
  severity: mild
strong:
  profile_type: aesthetic
  clinical_priority: elective
supporting:
  budget_type: [balanced, economy]
excluding:
  age_stage: senior
  issue: [functional_*, missing_*]
```

#### S14 - Senior, limited budget
```yaml
required:
  age_stage: senior
  budget_type: [economy, balanced]
strong:
  profile_type: [functional, comfort]
supporting:
  treatment_philosophy: durability_focused
excluding:
  budget_type: premium
  age_stage: [young_adult, growing]
```

#### S15 - Premium client, aesthetic profile
```yaml
required:
  budget_type: premium
  profile_type: aesthetic
strong:
  aesthetic_tolerance: [moderate, aggressive]
  expectation_risk: [moderate, high]
supporting:
  style: [hollywood, classic]
excluding:
  budget_type: [economy, unknown]
  profile_type: functional (alone)
```

#### S16 - Wear or damage without missing teeth
```yaml
required:
  mouth_situation: no_missing_teeth
  issue: [cracks_wear, damage]
strong:
  tooth_health: [compromised, bruxism]
  profile_type: [functional, mixed]
supporting:
  clinical_priority: [elective, semi_urgent]
excluding:
  mouth_situation: [*_missing*]
```

#### S17 - Single tooth missing, adjacent teeth restored
```yaml
required:
  mouth_situation: single_missing_tooth
  adjacent_condition: [partial_restored, heavily_restored]
strong:
  biological_stability: [moderate, compromised]
supporting:
  treatment_philosophy: minimally_invasive
excluding:
  adjacent_condition: intact
  mouth_situation: [multiple_*, full_mouth*]
```

---

## PART 4: Scoring Algorithm

### Step 1: Calculate Driver State from Tags
```
For each question answered:
  1. Map answer → tag
  2. Map tag → driver value(s)
  3. Build DriverState object
```

### Step 2: Score Each Scenario
```
For each scenario S01-S17:
  score = 0

  # Check REQUIRED drivers (must ALL match)
  for each required driver:
    if DriverState[driver] NOT IN scenario.required[driver]:
      score = -∞  # Disqualified
      break

  # Check EXCLUDING drivers (must NOT match)
  for each excluding driver:
    if DriverState[driver] IN scenario.excluding[driver]:
      score = -∞  # Disqualified
      break

  # If not disqualified, calculate positive score
  if score != -∞:
    # STRONG matches (weight = 3)
    for each strong driver:
      if DriverState[driver] IN scenario.strong[driver]:
        score += 3

    # SUPPORTING matches (weight = 1)
    for each supporting driver:
      if DriverState[driver] IN scenario.supporting[driver]:
        score += 1
```

### Step 3: Select Best Scenario
```
1. Filter: Remove all scenarios with score = -∞
2. Rank: Sort remaining by score (descending)
3. If tie: Use scenario priority order (S12 > S10 > S09 > ... safety first)
4. If no match: Return "UNKNOWN_SCENARIO" → triggers fallback path
```

### Step 4: Output
```yaml
ScenarioResolution:
  matched_scenario: S02
  match_score: 8
  confidence: HIGH  # (score >= 6)
  runner_up: S06 (score: 5)
  disqualified: [S01, S03, S09, ...]
  reason_codes:
    - REQUIRED_MATCH: mouth_situation=single_missing_tooth
    - REQUIRED_MATCH: location=anterior
    - STRONG_MATCH: profile_type=aesthetic
    - STRONG_MATCH: clinical_priority=elective
```

---

## PART 5: Confidence Levels

| Score | Confidence | Action |
|-------|------------|--------|
| >= 8 | HIGH | Proceed with full scenario content |
| 5-7 | MEDIUM | Proceed with scenario + add nuance blocks |
| 3-4 | LOW | Use scenario but trigger review flag |
| < 3 | UNCERTAIN | Fallback to generic report + escalation |

---

## PART 6: Special Rules

### Safety Override (L1 Priority)
```
IF clinical_priority = urgent OR medical_constraints = surgical_contraindicated:
  FORCE scenario = S12 (or appropriate safety scenario)
  IGNORE all other scoring
```

### Conflict Resolution
```
IF multiple scenarios tie after scoring:
  1. Prefer safety scenarios (S12, S10)
  2. Prefer more specific over general
  3. Prefer functional over aesthetic (conservative)
  4. Use explicit priority list as final tiebreaker
```

### Fallback Path
```
IF no scenario matches (all disqualified):
  1. Log reason codes
  2. Generate generic intake report
  3. Flag for manual review
  4. DO NOT generate treatment-specific content
```
