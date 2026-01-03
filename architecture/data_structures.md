# Smile-Link NLG System - Data Structures
## Schema Definitions v1.0

---

## 1. Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  QuestionnaireResponse                                          │
│         │                                                        │
│         ▼                                                        │
│  TagSet                                                          │
│         │                                                        │
│         ▼                                                        │
│  DriverState                                                     │
│         │                                                        │
│         ▼                                                        │
│  ScenarioMatch                                                   │
│         │                                                        │
│         ▼                                                        │
│  ContentSelection                                                │
│         │                                                        │
│         ▼                                                        │
│  ReportComposition                                               │
│         │                                                        │
│         ▼                                                        │
│  Report                                                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Input Layer

### 2.1 QuestionnaireResponse

```typescript
interface QuestionnaireResponse {
  session_id: string;
  timestamp: string;  // ISO 8601
  language: "nl" | "en" | "fr" | "de";
  country: "BE" | "NL" | "DE" | "FR";

  answers: {
    Q1: Q1Answer;
    Q2: number;  // 1-10
    Q2a?: Q2aAnswer;  // conditional
    Q3: Q3Answer;
    Q4: Q4Answer[];  // multi-select
    Q5: Q5Answer;
    Q6a: Q6aAnswer;
    Q6b: Q6bAnswer[];  // multi-select
    Q6c?: Q6cAnswer;  // conditional
    Q6d?: Q6dAnswer[];  // conditional, multi-select
    Q7: Q7Answer;
    Q8: Q8Answer;
    Q9: Q9Answer;
    Q10: Q10Answer;
    Q11: Q11Answer;
    Q12: Q12Answer;
    Q13: Q13Answer;
    Q14: Q14Answer;
    Q15: Q15Answer;
    Q16a: Q16aAnswer;
    Q16b: Q16bAnswer;
    Q17: Q17Answer;
    Q18: Q18Answer;
  };

  metadata: {
    intake_complete: boolean;
    missing_required: string[];  // list of missing question IDs
    version: string;
  };
}

// Answer type definitions
type Q1Answer =
  | "insecure_confidence"
  | "discoloured_damaged_worn"
  | "functional_issues"
  | "missing_teeth"
  | "beautiful_youthful"
  | "complete_transformation"
  | "missing_plus_aesthetic";

type Q2aAnswer =
  | "esthetics"
  | "chewing_function"
  | "both";

type Q3Answer =
  | "discoloured_dull"
  | "crooked_uneven"
  | "missing_damaged"
  | "size_harmony"
  | "bite_problems"
  | "gum_recession"
  | "loose_pain_chewing"
  | "missing_plus_aesthetic";

type Q4Answer =
  | "none"
  | "implants"
  | "veneers_crowns"
  | "orthodontics"
  | "periodontal";

type Q5Answer =
  | "pain"
  | "infection"
  | "loose_missing"
  | "aesthetic_only";

type Q6aAnswer =
  | "no_missing"
  | "one_missing"
  | "two_four_adjacent"
  | "two_four_dispersed"
  | "mixed_pattern"
  | "five_plus_missing"
  | "most_poor_condition";

type Q6bAnswer =
  | "front_teeth"
  | "side_chewing";

type Q6cAnswer =
  | "intact"
  | "partially_restored"
  | "heavily_restored";

type Q6dAnswer =
  | "mostly_intact"
  | "large_fillings"
  | "cracks_wear"
  | "root_canal"
  | "severe_discolouration"
  | "bruxism";

type Q7Answer =
  | "natural_subtle"
  | "hollywood"
  | "classic_elegant"
  | "functional_durable";

type Q8Answer =
  | "very_important_natural"
  | "hollywood_bright"
  | "best_price_quality";

type Q9Answer =
  | "under_30"
  | "30_45"
  | "45_60"
  | "60_plus";

type Q10Answer =
  | "premium"
  | "price_quality"
  | "affordable"
  | "cost_estimate_first";

type Q11Answer =
  | "yes_best_result"
  | "maybe_more_info"
  | "ai_report_first";

type Q12Answer =
  | "1_3_months"
  | "6_months"
  | "1_year"
  | "exploring";

type Q13Answer =
  | "no"
  | "yes_pregnant"
  | "possibly_6_months"
  | "prefer_not_say";

type Q14Answer =
  | "no"
  | "occasionally"
  | "weekly"
  | "daily";

type Q15Answer =
  | "good"
  | "basic"
  | "irregular"
  | "poor";

type Q16aAnswer =
  | "yes"  // under 18 / incomplete growth
  | "no";  // adult

type Q16bAnswer =
  | "yes"  // recent extraction
  | "no";

type Q17Answer =
  | "no"
  | "yes";

type Q18Answer =
  | "no"
  | "mild"
  | "severe";
```

---

## 3. Tag Layer

### 3.1 Tag

```typescript
interface Tag {
  id: string;  // e.g., "motivation_combination"
  category: TagCategory;
  source_question: string;  // e.g., "Q1"
  source_answer: string;  // e.g., "missing_plus_aesthetic"
}

type TagCategory =
  | "motivation"
  | "satisfaction"
  | "bother"
  | "issue"
  | "history"
  | "acute"
  | "status"
  | "location"
  | "adjacent"
  | "tooth_health"
  | "style"
  | "natural_priority"
  | "age"
  | "budget"
  | "intent"
  | "timeline"
  | "pregnancy"
  | "smoking"
  | "hygiene"
  | "growth"
  | "extraction"
  | "medical"
  | "anxiety";
```

### 3.2 TagSet

```typescript
interface TagSet {
  session_id: string;
  tags: Tag[];

  // Convenience lookups
  by_category: Record<TagCategory, Tag[]>;
  by_question: Record<string, Tag[]>;
}
```

### 3.3 Tag Definitions (Complete List)

```typescript
const TAG_DEFINITIONS: Record<string, TagDefinition> = {
  // Q1 - Motivation
  "motivation_confidence": { question: "Q1", answer: "insecure_confidence", category: "motivation" },
  "motivation_aesthetic_damage": { question: "Q1", answer: "discoloured_damaged_worn", category: "motivation" },
  "motivation_functional": { question: "Q1", answer: "functional_issues", category: "motivation" },
  "motivation_missing_teeth": { question: "Q1", answer: "missing_teeth", category: "motivation" },
  "motivation_aesthetic_premium": { question: "Q1", answer: "beautiful_youthful", category: "motivation" },
  "motivation_full_transformation": { question: "Q1", answer: "complete_transformation", category: "motivation" },
  "motivation_combination": { question: "Q1", answer: "missing_plus_aesthetic", category: "motivation" },

  // Q2 - Satisfaction
  "satisfaction_major_dissatisfaction": { question: "Q2", answer: "1-4", category: "satisfaction" },
  "satisfaction_moderate_dissatisfaction": { question: "Q2", answer: "5-7", category: "satisfaction" },
  "satisfaction_minor_concerns": { question: "Q2", answer: "8-10", category: "satisfaction" },

  // Q2a - Bother
  "bother_aesthetic": { question: "Q2a", answer: "esthetics", category: "bother" },
  "bother_functional": { question: "Q2a", answer: "chewing_function", category: "bother" },
  "bother_combination": { question: "Q2a", answer: "both", category: "bother" },

  // Q3 - Issue
  "issue_discoloration": { question: "Q3", answer: "discoloured_dull", category: "issue" },
  "issue_alignment": { question: "Q3", answer: "crooked_uneven", category: "issue" },
  "issue_missing_damaged": { question: "Q3", answer: "missing_damaged", category: "issue" },
  "issue_size_harmony": { question: "Q3", answer: "size_harmony", category: "issue" },
  "issue_bite": { question: "Q3", answer: "bite_problems", category: "issue" },
  "issue_gum_recession": { question: "Q3", answer: "gum_recession", category: "issue" },
  "issue_functional_pain": { question: "Q3", answer: "loose_pain_chewing", category: "issue" },
  "issue_combination": { question: "Q3", answer: "missing_plus_aesthetic", category: "issue" },

  // Q4 - History
  "history_none": { question: "Q4", answer: "none", category: "history" },
  "history_implants": { question: "Q4", answer: "implants", category: "history" },
  "history_veneers_crowns": { question: "Q4", answer: "veneers_crowns", category: "history" },
  "history_orthodontics": { question: "Q4", answer: "orthodontics", category: "history" },
  "history_periodontal": { question: "Q4", answer: "periodontal", category: "history" },

  // Q5 - Acute
  "acute_pain": { question: "Q5", answer: "pain", category: "acute" },
  "acute_infection": { question: "Q5", answer: "infection", category: "acute" },
  "acute_loose_missing": { question: "Q5", answer: "loose_missing", category: "acute" },
  "no_acute_issues": { question: "Q5", answer: "aesthetic_only", category: "acute" },

  // Q6a - Status
  "status_no_missing": { question: "Q6a", answer: "no_missing", category: "status" },
  "status_single_missing": { question: "Q6a", answer: "one_missing", category: "status" },
  "status_2_4_adjacent": { question: "Q6a", answer: "two_four_adjacent", category: "status" },
  "status_2_4_dispersed": { question: "Q6a", answer: "two_four_dispersed", category: "status" },
  "status_mixed_pattern": { question: "Q6a", answer: "mixed_pattern", category: "status" },
  "status_5_plus_missing": { question: "Q6a", answer: "five_plus_missing", category: "status" },
  "status_full_mouth_compromised": { question: "Q6a", answer: "most_poor_condition", category: "status" },

  // Q6b - Location
  "location_anterior": { question: "Q6b", answer: "front_teeth", category: "location" },
  "location_posterior": { question: "Q6b", answer: "side_chewing", category: "location" },

  // Q6c - Adjacent
  "adjacent_intact": { question: "Q6c", answer: "intact", category: "adjacent" },
  "adjacent_partial_restored": { question: "Q6c", answer: "partially_restored", category: "adjacent" },
  "adjacent_heavily_restored": { question: "Q6c", answer: "heavily_restored", category: "adjacent" },

  // Q6d - Tooth Health
  "tooth_health_good": { question: "Q6d", answer: "mostly_intact", category: "tooth_health" },
  "tooth_health_moderate": { question: "Q6d", answer: "large_fillings", category: "tooth_health" },
  "tooth_health_compromised": { question: "Q6d", answer: "cracks_wear", category: "tooth_health" },
  "tooth_health_root_canal": { question: "Q6d", answer: "root_canal", category: "tooth_health" },
  "tooth_health_severe_discolor": { question: "Q6d", answer: "severe_discolouration", category: "tooth_health" },
  "tooth_health_bruxism": { question: "Q6d", answer: "bruxism", category: "tooth_health" },

  // Q7 - Style
  "style_natural": { question: "Q7", answer: "natural_subtle", category: "style" },
  "style_hollywood": { question: "Q7", answer: "hollywood", category: "style" },
  "style_classic": { question: "Q7", answer: "classic_elegant", category: "style" },
  "style_functional": { question: "Q7", answer: "functional_durable", category: "style" },

  // Q8 - Natural Priority
  "natural_priority_high": { question: "Q8", answer: "very_important_natural", category: "natural_priority" },
  "natural_priority_low": { question: "Q8", answer: "hollywood_bright", category: "natural_priority" },
  "natural_priority_balanced": { question: "Q8", answer: "best_price_quality", category: "natural_priority" },

  // Q9 - Age
  "age_under_30": { question: "Q9", answer: "under_30", category: "age" },
  "age_30_45": { question: "Q9", answer: "30_45", category: "age" },
  "age_45_60": { question: "Q9", answer: "45_60", category: "age" },
  "age_60_plus": { question: "Q9", answer: "60_plus", category: "age" },

  // Q10 - Budget
  "budget_premium": { question: "Q10", answer: "premium", category: "budget" },
  "budget_balanced": { question: "Q10", answer: "price_quality", category: "budget" },
  "budget_conscious": { question: "Q10", answer: "affordable", category: "budget" },
  "budget_uncertain": { question: "Q10", answer: "cost_estimate_first", category: "budget" },

  // Q11 - Intent
  "intent_high": { question: "Q11", answer: "yes_best_result", category: "intent" },
  "intent_moderate": { question: "Q11", answer: "maybe_more_info", category: "intent" },
  "intent_exploratory": { question: "Q11", answer: "ai_report_first", category: "intent" },

  // Q12 - Timeline
  "timeline_urgent": { question: "Q12", answer: "1_3_months", category: "timeline" },
  "timeline_medium": { question: "Q12", answer: "6_months", category: "timeline" },
  "timeline_relaxed": { question: "Q12", answer: "1_year", category: "timeline" },
  "timeline_exploratory": { question: "Q12", answer: "exploring", category: "timeline" },

  // Q13 - Pregnancy
  "pregnancy_no": { question: "Q13", answer: "no", category: "pregnancy" },
  "pregnancy_yes": { question: "Q13", answer: "yes_pregnant", category: "pregnancy" },
  "pregnancy_planning": { question: "Q13", answer: "possibly_6_months", category: "pregnancy" },
  "pregnancy_unknown": { question: "Q13", answer: "prefer_not_say", category: "pregnancy" },

  // Q14 - Smoking
  "smoking_no": { question: "Q14", answer: "no", category: "smoking" },
  "smoking_occasional": { question: "Q14", answer: "occasionally", category: "smoking" },
  "smoking_weekly": { question: "Q14", answer: "weekly", category: "smoking" },
  "smoking_daily": { question: "Q14", answer: "daily", category: "smoking" },

  // Q15 - Hygiene
  "hygiene_good": { question: "Q15", answer: "good", category: "hygiene" },
  "hygiene_basic": { question: "Q15", answer: "basic", category: "hygiene" },
  "hygiene_irregular": { question: "Q15", answer: "irregular", category: "hygiene" },
  "hygiene_poor": { question: "Q15", answer: "poor", category: "hygiene" },

  // Q16a - Growth
  "growth_incomplete": { question: "Q16a", answer: "yes", category: "growth" },
  "growth_complete": { question: "Q16a", answer: "no", category: "growth" },

  // Q16b - Extraction
  "recent_extraction_yes": { question: "Q16b", answer: "yes", category: "extraction" },
  "recent_extraction_no": { question: "Q16b", answer: "no", category: "extraction" },

  // Q17 - Medical
  "medical_clear": { question: "Q17", answer: "no", category: "medical" },
  "medical_contraindication": { question: "Q17", answer: "yes", category: "medical" },

  // Q18 - Anxiety
  "anxiety_none": { question: "Q18", answer: "no", category: "anxiety" },
  "anxiety_mild": { question: "Q18", answer: "mild", category: "anxiety" },
  "anxiety_severe": { question: "Q18", answer: "severe", category: "anxiety" },
};
```

---

## 4. Driver Layer

### 4.1 Driver

```typescript
interface Driver {
  id: DriverId;
  layer: DriverLayer;
  value: string;
  confidence: DriverConfidence;
  source_tags: string[];  // tag IDs that contributed
  source_questions: string[];  // question IDs
}

type DriverLayer = "L1" | "L2" | "L3";

type DriverConfidence =
  | "CONFIRMED"   // explicitly provided by user
  | "INFERRED"    // derived via fallback logic
  | "UNKNOWN";    // insufficient information

type DriverId =
  // Layer 1 (Safety)
  | "clinical_priority"
  | "biological_stability"
  | "mouth_situation"
  | "age_stage"
  | "medical_constraints"
  | "treatment_viability"
  | "risk_profile_biological"
  // Layer 2 (Personalization)
  | "profile_type"
  | "aesthetic_tolerance"
  | "expectation_risk"
  | "experience_history"
  | "decision_stage"
  | "autonomy_level"
  // Layer 3 (Narrative)
  | "anxiety_level"
  | "information_depth"
  | "budget_type"
  | "treatment_philosophy"
  | "time_horizon";
```

### 4.2 DriverState

```typescript
interface DriverState {
  session_id: string;
  timestamp: string;

  // All 18 drivers
  drivers: Record<DriverId, Driver>;

  // Layer groupings
  l1_drivers: Driver[];  // 7 safety drivers
  l2_drivers: Driver[];  // 6 personalization drivers
  l3_drivers: Driver[];  // 5 narrative drivers

  // Conflict tracking
  conflicts: DriverConflict[];

  // Fallback tracking
  fallbacks_applied: FallbackRecord[];

  // Overall completeness
  completeness: {
    total_drivers: 18;
    confirmed: number;
    inferred: number;
    unknown: number;
    is_complete: boolean;
  };
}

interface DriverConflict {
  conflict_id: string;
  type: ConflictType;
  drivers_involved: DriverId[];
  resolution: string;  // which driver won
  reason: string;
}

type ConflictType =
  | "CLINICAL_VS_AESTHETIC"
  | "BUDGET_VS_EXPECTATION"
  | "TIMING_VS_COMPLEXITY"
  | "DATA_CONTRADICTION";

interface FallbackRecord {
  driver_id: DriverId;
  default_value: string;
  reason: string;
}
```

### 4.3 Driver Value Definitions

```typescript
// Layer 1: Safety Drivers
interface L1DriverValues {
  clinical_priority: "urgent" | "semi_urgent" | "elective";
  biological_stability: "stable" | "moderate" | "unstable" | "compromised";
  mouth_situation:
    | "no_missing_teeth"
    | "single_missing_tooth"
    | "multiple_adjacent"
    | "multiple_dispersed"
    | "mixed_pattern"
    | "extensive_missing"
    | "full_mouth_compromised";
  age_stage: "growing" | "young_adult" | "adult" | "senior";
  medical_constraints: "none" | "pregnancy_related" | "surgical_contraindicated";
  treatment_viability: "single_site" | "multiple_site" | "full_mouth";
  risk_profile_biological: "low" | "moderate" | "elevated";
}

// Layer 2: Personalization Drivers
interface L2DriverValues {
  profile_type: "aesthetic" | "functional" | "mixed" | "comfort";
  aesthetic_tolerance: "conservative" | "moderate" | "aggressive";
  expectation_risk: "realistic" | "moderate" | "high";
  experience_history: "first_timer" | "experienced" | "negative_history";
  decision_stage: "exploring" | "comparing" | "ready";
  autonomy_level: "guided" | "collaborative" | "autonomous";
}

// Layer 3: Narrative Drivers
interface L3DriverValues {
  anxiety_level: "none" | "mild" | "severe";
  information_depth: "summary" | "standard" | "detailed";
  budget_type: "premium" | "balanced" | "economy" | "unknown";
  treatment_philosophy: "minimally_invasive" | "durability_focused" | "aesthetic_maximalist";
  time_horizon: "immediate" | "short_term" | "long_term" | "undefined";
}
```

---

## 5. Scenario Layer

### 5.1 Scenario Definition

```typescript
interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  description: string;

  // Matching criteria
  required_drivers: DriverCriteria[];  // must ALL match
  strong_drivers: DriverCriteria[];    // +3 points each
  supporting_drivers: DriverCriteria[]; // +1 point each
  excluding_drivers: DriverCriteria[];  // instant disqualification

  // Content structure
  sections: ScenarioSection[];

  // Metadata
  version: string;
  last_updated: string;
}

type ScenarioId =
  | "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08"
  | "S09" | "S10" | "S11" | "S12" | "S13" | "S14" | "S15" | "S16" | "S17";

interface DriverCriteria {
  driver_id: DriverId;
  values: string[];  // acceptable values
}

interface ScenarioSection {
  section_id: string;
  section_type: SectionType;
  content_key: string;  // reference to content library
}

type SectionType =
  | "disclaimer"
  | "personal_summary"
  | "situation"
  | "option_primary"
  | "option_alternative"
  | "expected_results"
  | "duration"
  | "recovery"
  | "costs"
  | "next_steps";
```

### 5.2 ScenarioMatch

```typescript
interface ScenarioMatch {
  session_id: string;

  // Result
  matched_scenario: ScenarioId | null;
  confidence: MatchConfidence;

  // Scoring details
  scores: ScenarioScore[];

  // Winner details
  winner: {
    scenario_id: ScenarioId;
    total_score: number;
    required_matched: number;
    strong_matched: number;
    supporting_matched: number;
  } | null;

  // Runner up (for auditing)
  runner_up: {
    scenario_id: ScenarioId;
    total_score: number;
  } | null;

  // Disqualified scenarios
  disqualified: DisqualifiedScenario[];

  // Fallback flag
  is_fallback: boolean;
  fallback_reason?: string;
}

type MatchConfidence = "HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN";

interface ScenarioScore {
  scenario_id: ScenarioId;
  score: number;  // -Infinity if disqualified
  breakdown: {
    required_matched: string[];
    required_failed: string[];
    strong_matched: string[];
    supporting_matched: string[];
    excluding_triggered: string[];
  };
}

interface DisqualifiedScenario {
  scenario_id: ScenarioId;
  reason: "REQUIRED_MISMATCH" | "EXCLUDING_TRIGGERED";
  details: string[];
}
```

---

## 6. Content Layer

### 6.1 Content Block Types

```typescript
// A_* Blocks (Safety/Override)
type ABlockId =
  // Warnings
  | "A_WARN_BIOLOGICAL_INSTABILITY"
  | "A_WARN_MEDICAL_CONTRAINDICATION"
  | "A_WARN_PREGNANCY_OR_GROWTH"
  | "A_WARN_ACTIVE_SYMPTOMS"
  | "A_WARN_HIGH_UNCERTAINTY"
  // Hard Blocks
  | "A_BLOCK_TREATMENT_OPTIONS"
  | "A_BLOCK_COST_ESTIMATES"
  | "A_BLOCK_RECOMMENDATION_LANGUAGE"
  // Limits
  | "A_LIMIT_COMPARATIVE_FRAMING"
  | "A_LIMIT_CERTAINTY_LANGUAGE"
  // Conflicts
  | "A_CONFLICT_TOOTH_STATUS"
  | "A_CONFLICT_SYMPTOM_PRIORITY"
  | "A_CONFLICT_BUDGET_VS_RISK"
  // Intake
  | "A_INTAKE_COMPLETENESS_GATE"
  | "A_INTAKE_MISSING_CORE_ZONE"
  | "A_INTAKE_REPAIR_GUIDANCE";

// B_* Blocks (Content Modules)
type BBlockId =
  // Context
  | "B_CTX_MOUTH_SITUATION"
  | "B_CTX_COMPLEXITY_LEVEL"
  | "B_CTX_VISIBILITY_FUNCTION"
  // Interpretation
  | "B_INTERP_EXPECTATION_SCOPE"
  | "B_INTERP_DECISION_PRESSURE"
  // Options
  | "B_OPT_PRIMARY_GENERAL"
  | "B_OPT_ALT_GENERAL"
  // Comparison
  | "B_COMPARE_OPTIONS"
  // Trade-off
  | "B_TRADEOFF_BALANCE"
  // Process
  | "B_PROCESS_GENERAL_FLOW"
  // Synthesis
  | "B_SYNTHESIS_SUMMARY"
  // Risk Language
  | "B_RISKLANG_GENERAL"
  | "B_RISKLANG_COSTS";

// Text Module IDs
type TextModuleId =
  | "MODULE_PREGNANCY"
  | "MODULE_DIABETES"
  | "MODULE_SMOKING"
  | "MODULE_BRUXISM"
  | "MODULE_PERIODONTITIS"
  | "MODULE_CHRONIC_INFLAMMATION"
  | "MODULE_POOR_HYGIENE"
  | "MODULE_BONE_LOSS"
  | "MODULE_DENTAL_ANXIETY"
  | "MODULE_AGE"
  | "MODULE_PREMIUM_AESTHETIC"
  | "MODULE_AESTHETIC_STYLE"
  | "MODULE_FUNCTIONAL_VS_AESTHETIC"
  | "MODULE_BUDGET_LOW"
  | "MODULE_BUDGET_PREMIUM"
  | "MODULE_TOOTH_STATUS"
  | "MODULE_ORAL_COMPLEXITY"
  | "MODULE_TREATMENT_HISTORY"
  | "MODULE_GENERAL_HEALTH";

// Tone Profile IDs
type ToneProfileId =
  | "TP-01"  // Neutral-Informative (default)
  | "TP-02"  // Empathic-Neutral
  | "TP-03"  // Reflective-Contextual
  | "TP-04"  // Stability-Frame
  | "TP-05"  // Expectation-Calibration
  | "TP-06"; // Autonomy-Respecting (always for final section)

// Tone Profile Definitions
interface ToneProfile {
  id: ToneProfileId;
  name: string;
  description: string;
  trigger_conditions: ToneTrigger[];
  allowed_lexical_set: string[];
  banned_lexical_set: string[];
}

interface ToneTrigger {
  driver_id: DriverId;
  values: string[];
}

const TONE_PROFILES: Record<ToneProfileId, ToneProfile> = {
  "TP-01": {
    id: "TP-01",
    name: "Neutral-Informative",
    description: "Default. Neutral, businesslike information voice without emotional colouring.",
    trigger_conditions: [], // Default when no other triggers
    allowed_lexical_set: [
      "This report provides an overview of…",
      "There are several possibilities…",
      "Generally speaking…"
    ],
    banned_lexical_set: ["you must", "best choice", "recommended", "certainly", "guarantee"]
  },
  "TP-02": {
    id: "TP-02",
    name: "Empathic-Neutral",
    description: "Acknowledging and normalizing, without reassurance or direction.",
    trigger_conditions: [
      { driver_id: "anxiety_level", values: ["mild", "severe"] }
    ],
    allowed_lexical_set: [
      "Many people experience…",
      "It is not uncommon that…",
      "In such situations…"
    ],
    banned_lexical_set: ["you don't have to worry", "this will be fine", "no problem", "safe"]
  },
  "TP-03": {
    id: "TP-03",
    name: "Reflective-Contextual",
    description: "Clarifying and structuring in cases of complexity or doubt.",
    trigger_conditions: [
      { driver_id: "decision_stage", values: ["exploring"] },
      { driver_id: "expectation_risk", values: ["high"] }
    ],
    allowed_lexical_set: [
      "This may feel complex because…",
      "Several factors come together here…",
      "It often helps to look at this step by step…"
    ],
    banned_lexical_set: ["the right choice", "best approach", "you could choose"]
  },
  "TP-04": {
    id: "TP-04",
    name: "Stability-Frame",
    description: "Providing psychological stability without reassurance or risk minimization.",
    trigger_conditions: [
      { driver_id: "anxiety_level", values: ["severe"] },
      { driver_id: "autonomy_level", values: ["guided"] }
    ],
    allowed_lexical_set: [
      "It is understandable that uncertainty plays a role…",
      "The need for an overview is common…",
      "This report helps to structure questions…"
    ],
    banned_lexical_set: ["you are safe", "this is not a risk", "you don't have to be afraid"]
  },
  "TP-05": {
    id: "TP-05",
    name: "Expectation-Calibration",
    description: "Nuanced framework for previous disappointment or high expectations.",
    trigger_conditions: [
      { driver_id: "experience_history", values: ["negative_history"] },
      { driver_id: "expectation_risk", values: ["high"] }
    ],
    allowed_lexical_set: [
      "Results may vary…",
      "Expectations are often influenced by…",
      "This varies from person to person…"
    ],
    banned_lexical_set: ["is realistic", "is unrealistic", "you may expect that…"]
  },
  "TP-06": {
    id: "TP-06",
    name: "Autonomy-Respecting",
    description: "Respect decision-making autonomy without pressure or implicit CTA.",
    trigger_conditions: [], // Always used for final section (Next Steps)
    allowed_lexical_set: [
      "This report is intended to…",
      "You can use this information to…",
      "It may help to formulate questions such as…"
    ],
    banned_lexical_set: ["next step is", "take action now", "book a consultation", "get in touch"]
  }
};

// Tone Selection Algorithm
interface ToneSelectionResult {
  selected_tone: ToneProfileId;
  reason: string;
  applicable_triggers: string[];
}

function selectToneProfile(driverState: DriverState): ToneSelectionResult {
  // Priority order: TP-04 > TP-05 > TP-02 > TP-03 > TP-01

  // Check for severe anxiety → TP-04 (Stability)
  if (driverState.drivers.anxiety_level.value === "severe") {
    return {
      selected_tone: "TP-04",
      reason: "Severe anxiety detected",
      applicable_triggers: ["anxiety_level=severe"]
    };
  }

  // Check for negative history + high expectations → TP-05 (Expectation)
  if (driverState.drivers.experience_history.value === "negative_history" ||
      driverState.drivers.expectation_risk.value === "high") {
    return {
      selected_tone: "TP-05",
      reason: "Past disappointment or high expectations detected",
      applicable_triggers: ["experience_history=negative_history", "expectation_risk=high"]
    };
  }

  // Check for mild anxiety → TP-02 (Empathic)
  if (driverState.drivers.anxiety_level.value === "mild") {
    return {
      selected_tone: "TP-02",
      reason: "Mild anxiety detected",
      applicable_triggers: ["anxiety_level=mild"]
    };
  }

  // Check for exploring/complexity → TP-03 (Reflective)
  if (driverState.drivers.decision_stage.value === "exploring") {
    return {
      selected_tone: "TP-03",
      reason: "Exploratory decision stage detected",
      applicable_triggers: ["decision_stage=exploring"]
    };
  }

  // Default → TP-01 (Neutral)
  return {
    selected_tone: "TP-01",
    reason: "No special tone triggers, using neutral default",
    applicable_triggers: []
  };
}

// Note: Section 11 (Next Steps) ALWAYS uses TP-06 regardless of selection
```

### 6.2 Content Block Definition

```typescript
interface ContentBlock {
  id: string;  // A_*, B_*, or Module ID
  type: "A_BLOCK" | "B_BLOCK" | "TEXT_MODULE" | "SCENARIO_SECTION";

  // Activation rules
  trigger: TriggerCondition;
  suppression: SuppressionCondition | null;

  // Content variants (one per tone)
  variants: Record<ToneProfileId, ContentVariant>;

  // Metadata
  version: string;
  last_updated: string;
  owner: string;
}

interface TriggerCondition {
  type: "DRIVER_VALUE" | "TAG_PRESENT" | "ALWAYS" | "COMPOUND";
  conditions: ConditionExpression[];
  logic: "AND" | "OR";
}

interface SuppressionCondition {
  type: "A_BLOCK_ACTIVE" | "DRIVER_VALUE" | "CARDINALITY";
  conditions: ConditionExpression[];
}

interface ConditionExpression {
  field: string;  // driver_id or tag_id
  operator: "EQUALS" | "NOT_EQUALS" | "IN" | "NOT_IN" | "EXISTS";
  value: string | string[];
}

interface ContentVariant {
  tone_id: ToneProfileId;
  content: string;
  placeholders: string[];  // e.g., ["{{procedure_name}}", "{{recovery_time}}"]
}
```

### 6.3 Content Library

```typescript
interface ContentLibrary {
  version: string;
  last_updated: string;

  // All content indexed by ID
  a_blocks: Record<ABlockId, ContentBlock>;
  b_blocks: Record<BBlockId, ContentBlock>;
  text_modules: Record<TextModuleId, ContentBlock>;
  scenarios: Record<ScenarioId, ScenarioContent>;

  // Statistics
  stats: {
    total_a_blocks: 16;
    total_b_blocks: 14;
    total_text_modules: 19;
    total_scenarios: 17;
    total_variants: 396;  // 66 * 6 tones
  };
}

interface ScenarioContent {
  id: ScenarioId;
  name: string;
  sections: Record<SectionType, ContentVariant[]>;  // each section has 6 tone variants
}
```

---

## 7. Content Selection Layer

### 7.1 ContentSelection

```typescript
interface ContentSelection {
  session_id: string;

  // L1 check results
  l1_override: {
    is_active: boolean;
    active_warnings: ABlockId[];
    active_blocks: ABlockId[];
    active_limits: ABlockId[];
    suppression_policy: SuppressionPolicy;
  };

  // Selected content
  selected_a_blocks: SelectedBlock[];
  selected_b_blocks: SelectedBlock[];
  selected_text_modules: SelectedBlock[];
  selected_scenario_sections: SelectedScenarioSection[];

  // Suppressed content (for audit)
  suppressed: SuppressedBlock[];

  // Cardinality check
  cardinality_check: CardinalityResult[];

  // Tone selection
  tone_profile: ToneProfileId;
  tone_reason: string;
}

interface SelectedBlock {
  block_id: string;
  reason: string;
  tone_variant: ToneProfileId;
  content: string;
}

interface SelectedScenarioSection {
  scenario_id: ScenarioId;
  section_type: SectionType;
  tone_variant: ToneProfileId;
  content: string;
}

interface SuppressedBlock {
  block_id: string;
  reason: string;
  suppressed_by: string;  // which rule or A_* block
}

interface SuppressionPolicy {
  block_treatment_options: boolean;
  block_cost_estimates: boolean;
  block_recommendation_language: boolean;
  limit_comparative_framing: boolean;
  limit_certainty_language: boolean;
}

interface CardinalityResult {
  block_type: string;
  max_allowed: number;
  actual_count: number;
  passed: boolean;
  removed?: string[];  // blocks removed to enforce cardinality
}
```

---

## 8. Report Composition Layer

### 8.1 ReportComposition

```typescript
interface ReportComposition {
  session_id: string;

  // Input references
  scenario_match: ScenarioMatch;
  content_selection: ContentSelection;
  driver_state: DriverState;

  // Assembled sections
  sections: ReportSection[];

  // Composition metadata
  composition_contract_version: string;
  total_word_count: number;

  // Validation
  validation: CompositionValidation;
}

interface ReportSection {
  section_number: number;  // 0-11
  section_type: ReportSectionType;
  is_included: boolean;
  excluded_reason?: string;

  // Content pieces in this section
  content_pieces: ContentPiece[];

  // Section metadata
  word_count: number;
  tone_applied: ToneProfileId;
}

type ReportSectionType =
  | "WARNINGS"           // Section 0
  | "DISCLAIMER"         // Section 1
  | "PERSONAL_SUMMARY"   // Section 2
  | "CONTEXT"            // Section 3
  | "INTERPRETATION"     // Section 4
  | "OPTIONS"            // Section 5
  | "COMPARISON"         // Section 6
  | "TRADEOFFS"          // Section 7
  | "PROCESS"            // Section 8
  | "COSTS"              // Section 9
  | "RISK_LANGUAGE"      // Section 10
  | "NEXT_STEPS";        // Section 11

interface ContentPiece {
  source_type: "A_BLOCK" | "B_BLOCK" | "TEXT_MODULE" | "SCENARIO";
  source_id: string;
  content: string;
  order: number;
}

interface CompositionValidation {
  passed: boolean;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  check_name: string;
  passed: boolean;
  details?: string;
}
```

---

## 9. Report Output Layer

### 9.1 Report

```typescript
interface Report {
  // Identity
  report_id: string;
  session_id: string;
  timestamp: string;

  // Content
  full_text: string;
  sections: RenderedSection[];

  // Metadata
  scenario_id: ScenarioId | "FALLBACK";
  tone_profile: ToneProfileId;
  language: string;
  word_count: number;

  // QA Status
  qa_status: "APPROVED" | "FLAGGED" | "BLOCKED";
  qa_notes?: string[];

  // Hash for integrity
  content_hash: string;
}

interface RenderedSection {
  section_number: number;
  section_title: string;
  content: string;
  word_count: number;
}
```

---

## 10. Audit/Trace Layer

### 10.1 DecisionTrace

```typescript
interface DecisionTrace {
  trace_id: string;
  session_id: string;
  timestamp: string;
  system_version: string;
  content_version: string;

  // Full pipeline trace
  input_trace: QuestionnaireResponse;
  tag_trace: TagSet;
  driver_trace: DriverState;
  scenario_trace: ScenarioMatch;
  selection_trace: ContentSelection;
  composition_trace: ReportComposition;
  output_trace: Report;

  // QA results
  qa_trace: QATrace;
}

interface QATrace {
  leakage_check: LeakageCheckResult;
  validation_check: ValidationResult;
  overall_status: "PASS" | "FLAG" | "BLOCK";
}

interface LeakageCheckResult {
  passed: boolean;
  violations: SemanticViolation[];
}

interface SemanticViolation {
  type: string;
  pattern: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  location: string;
}

interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}
```

---

## 11. Summary: Entity Counts

| Entity | Count | Notes |
|--------|-------|-------|
| Questions | 18 | Q1-Q18 (some conditional) |
| Tags | 67 | Unique tag definitions |
| Drivers | 18 | 7 L1 + 6 L2 + 5 L3 |
| Scenarios | 17 | S01-S17 |
| A_* Blocks | 16 | Safety/override content |
| B_* Blocks | 14 | Content modules |
| Text Modules | 19 | Context/risk modules |
| Tone Profiles | 6 | TP-01 to TP-06 |
| Report Sections | 12 | Fixed structure (0-11) |
| **Total Content Variants** | **396** | 66 content pieces × 6 tones |
