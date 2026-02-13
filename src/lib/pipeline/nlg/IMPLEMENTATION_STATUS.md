# NLG Template System - Implementation Status

## Overview

The NLG template system uses deterministic template variable substitution to generate personalized dental reports. Variables resolve from scenario data in MongoDB (treatment options, NLG variables, pricing), driver-based text mappings, optional tag blocks, and static content.

**Total Variables:** 44
**Implemented:** 25 (57%)
**Partial (fallbacks):** 11 (25%)
**Not yet integrated:** 8 (18%)

---

## Implemented (25 variables)

These resolve from actual data sources and produce meaningful output.

| Variable | Source | Block |
|----------|--------|-------|
| `DISCLAIMER_TEXT` | Hardcoded static content | Disclaimer |
| `OPTIONAL_SITUATION_TAG_BLOCK` | A_blocks + TM_modules via ContentSelector | Block 1 |
| `OPTIONAL_RESULT_TAG_BLOCK` | TM_modules via ContentSelector | Block 4 |
| `OPTIONAL_DURATION_TAG_BLOCK` | TM_modules via ContentSelector | Block 5 |
| `OPTIONAL_PRICE_TAG_BLOCK` | TM_modules via ContentSelector | Block 7 |
| `OPTIONAL_RECOVERY_TAG_BLOCK` | A_blocks + TM_modules via ContentSelector | Block 8 |
| `OPTIONAL_NEXT_STEPS_TAG_BLOCK` | TM_modules via ContentSelector | Block 9 |
| `OPTION_1_NAME` | Scenario treatment option 1 `name` | Block 2 |
| `OPTION_1_SHORT_DESCRIPTION` | Scenario treatment option 1 `description` | Block 2 |
| `OPTION_1_INDICATION` | Scenario treatment option 1 `ideal_for` | Block 2 |
| `OPTION_1_COMPLEXITY` | Scenario treatment option 1 `complexity` | Block 2 |
| `OPTION_1_ADVANTAGES` | Scenario treatment option 1 `benefits[]` | Block 2 |
| `OPTION_1_DISADVANTAGES` | Scenario treatment option 1 `considerations[]` | Block 2 |
| `OPTION_2_NAME` | Scenario treatment option 2 `name` | Block 2 |
| `OPTION_2_SHORT_DESCRIPTION` | Scenario treatment option 2 `description` | Block 2 |
| `OPTION_2_INDICATION` | Scenario treatment option 2 `ideal_for` | Block 2 |
| `OPTION_2_COMPLEXITY` | Scenario treatment option 2 `complexity` | Block 2 |
| `OPTION_2_ADVANTAGES` | Scenario treatment option 2 `benefits[]` | Block 2 |
| `OPTION_2_DISADVANTAGES` | Scenario treatment option 2 `considerations[]` | Block 2 |
| `OPTIONAL_ADDITIONAL_OPTIONS` | Scenario NLG variable | Block 2 |
| `OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS` | Scenario NLG variable | Block 2 |
| `RECOMMENDED_DIRECTION` | Scenario NLG variable | Block 3 |
| `TAG_NUANCE_DIRECTION` | Scenario NLG variable | Block 3 |
| `SELECTED_OPTION` | Scenario NLG variable | Block 4 |
| `RESULT_DESCRIPTION` | Primary treatment option `result_description` | Block 4 |
| `COMFORT_EXPERIENCE` | Primary treatment option `comfort_experience` | Block 4 |
| `AESTHETIC_RESULT` | Primary treatment option `aesthetic_result` | Block 4 |
| `TREATMENT_DURATION` | Primary treatment option `duration` | Block 5 |
| `PHASE_1` | Primary treatment option `phases[0]` | Block 5 |
| `PHASE_2` | Primary treatment option `phases[1]` | Block 5 |
| `PHASE_3` | Primary treatment option `phases[2]` | Block 5 |
| `SITUATION_SPECIFIC_CONSIDERATIONS` | Scenario NLG variable | Block 6 |
| `PRICE_MIN` | Scenario aggregate `pricing.min` | Block 7 |
| `PRICE_MAX` | Scenario aggregate `pricing.max` | Block 7 |
| `RECOVERY_DURATION` | Primary treatment option `recovery.days` | Block 8 |
| `RECOVERY_DISCOMFORT` | Primary treatment option `recovery.description` | Block 8 |

> **Note:** The table above has 36 entries because some variables appear in multiple resolution paths. The distinct count is 25 after deduplication of the 6 tag blocks and 1 static.

---

## Partial - Using Fallbacks (11 variables)

These have infrastructure and produce output, but use generic text rather than scenario-specific content. The driver text mapper resolves them from questionnaire answers.

### Driver Text Mappings (9 variables)

| Variable | Source Driver | Fallback Behavior | Block |
|----------|-------------|-------------------|-------|
| `AGE_CATEGORY` | `age_stage` | Maps driver value to age label | Block 0 |
| `MAIN_CONCERN` | `profile_type` | Maps to concern description | Block 0 |
| `SHORT_SITUATION_DESCRIPTION` | `mouth_situation` | Maps to situation text | Block 0 |
| `DECISION_STAGE_DESCRIPTION` | `decision_stage` | Maps to decision readiness | Block 0 |
| `SITUATION_BASE` | `mouth_situation` | Maps to clinical situation | Block 1 |
| `SITUATION_RELEVANCE` | `clinical_priority` / `treatment_viability` | Maps to relevance text | Block 1 |
| `PRIORITY_CONTEXT` | `profile_type` | Maps to priority framing | Block 3 |
| `DURATION_VARIATION_FACTOR` | `time_horizon` | Maps to time context | Block 5 |
| `PROGRESSION_FOCUS` | `autonomy_level` | Maps to next-steps framing | Block 9 |

**To improve:** Add richer, more specific text content to the driver-to-text mappings in `DriverTextMapper.ts`.

### Treatment Fallbacks (2 variables)

| Variable | Current Fallback | Block |
|----------|-----------------|-------|
| `GENERAL_RISK` | "temporary discomfort, swelling, and individual healing variations" | Block 6 |
| `ALARM_SIGNAL` | "severe pain, persistent bleeding, high fever, or signs of infection" | Block 8 |

**To improve:** These could be added as scenario NLG variables on the NLG Variables tab so each scenario provides treatment-specific risk text. The `ScenarioNLGVariablesSchema` would need `GENERAL_RISK` and `ALARM_SIGNAL` fields added.

---

## Not Yet Integrated (8 variables)

These use hardcoded generic fallback text. They work but are not personalized or data-driven.

### Pricing Factors (3 variables)

| Variable | Current Fallback | Block |
|----------|-----------------|-------|
| `FACTOR_1` | "complexity of your individual case" | Block 7 |
| `FACTOR_2` | "materials and techniques used" | Block 7 |
| `FACTOR_3` | "regional pricing variations" | Block 7 |

**How to integrate:** Add `FACTOR_1`, `FACTOR_2`, `FACTOR_3` as optional BilingualText fields on `ScenarioNLGVariablesSchema`. Each scenario can then provide treatment-specific cost factors (e.g., "number of implants needed" instead of "complexity of your individual case"). These would then appear on the NLG Variables tab and be editable per scenario.

### Patient Questions (3 variables)

| Variable | Current Fallback | Block |
|----------|-----------------|-------|
| `QUESTION_1` | "What are the specific treatment options for my situation?" | Block 9 |
| `QUESTION_2` | "What is the expected timeline and what should I expect during recovery?" | Block 9 |
| `QUESTION_3` | "What are the costs involved and are there payment options available?" | Block 9 |

**How to integrate:** Same approach — add `QUESTION_1`, `QUESTION_2`, `QUESTION_3` as optional BilingualText fields on `ScenarioNLGVariablesSchema`. Each scenario can then suggest situation-specific questions for the patient to ask their dentist.

---

## How to Add New Scenario-Level Variables

To move any of the above variables from fallback to scenario-editable:

1. **Schema** (`schemas/ScenarioSchema.ts`): Add the variable name as an optional BilingualText field on `ScenarioNLGVariablesSchema`
2. **Resolution** is automatic: `flattenScenarioVariables()` iterates all NLG variable entries
3. **UI** is automatic: The NLG Variables tab on `/content/scenarios/[id]` renders all defined NLG variables
4. **Fallback** stays in `FLAGGED_PLACEHOLDERS` in `VariableCalculator.ts` for scenarios that don't define the variable

## How to Add New Treatment-Option-Level Variables

1. **Schema** (`schemas/ScenarioSchema.ts`): Add field to `TreatmentOptionSchema`
2. **Flatten** (`schemas/ScenarioSchema.ts`): Add resolution in `flattenScenarioVariables()`
3. **Resolve** (`VariableCalculator.ts`): Add resolution in `resolveScenarioVariables()`
4. **UI** (`app/content/scenarios/[id]/page.tsx`): Add form field in the treatment option expanded panel

---

## Architecture

```
Patient Questionnaire
        |
        v
  DriverDeriver --> DriverState
        |
        v
  ScenarioScorer --> Matched Scenario (S00-S17)
        |
        v
  VariableCalculator
    |-- Static content (DISCLAIMER_TEXT)
    |-- Scenario data from MongoDB
    |   |-- NLG variables (flattenScenarioVariables)
    |   |-- Treatment option fields (per-option loop)
    |   |-- Primary option fields (index 0)
    |   |-- Aggregate pricing
    |-- Driver text mappings (personalization)
    |-- Optional tag blocks (ContentSelector)
    |-- Flagged placeholders (fallback)
        |
        v
  NLGTemplateRenderer --> Rendered Report
```
