# NLG Template System - Implementation Status

## Overview

The NLG template system replaces the scenario-based content selection with deterministic template variable substitution. This document tracks what's implemented vs what's flagged for future work.

**Total Variables:** 52
**Implemented:** 16 (31%)
**Partial (fallbacks):** 12 (23%)
**Flagged (not implemented):** 24 (46%)

---

## ✅ IMPLEMENTED (Working)

### Static Content (1 variable)
| Variable | Source | Status |
|----------|--------|--------|
| `DISCLAIMER_TEXT` | Hardcoded content | ✅ Complete |

### Driver-Based Text (9 variables)
| Variable | Source Driver | Status |
|----------|---------------|--------|
| `AGE_CATEGORY` | `age_stage` | ✅ Complete |
| `MAIN_CONCERN` | `profile_type` | ✅ Complete |
| `SHORT_SITUATION_DESCRIPTION` | `mouth_situation` | ✅ Complete |
| `DECISION_STAGE_DESCRIPTION` | `decision_stage` | ✅ Complete |
| `SITUATION_BASE` | `mouth_situation` | ✅ Complete |
| `SITUATION_RELEVANCE` | `clinical_priority` / `treatment_viability` | ✅ Complete |
| `PRIORITY_CONTEXT` | `profile_type` | ✅ Complete |
| `DURATION_VARIATION_FACTOR` | `time_horizon` | ✅ Complete |
| `PROGRESSION_FOCUS` | `autonomy_level` | ✅ Complete |

### Optional Tag Blocks (6 variables)
| Variable | Source | Status |
|----------|--------|--------|
| `OPTIONAL_SITUATION_TAG_BLOCK` | A_blocks + TM_modules | ✅ Complete |
| `OPTIONAL_RESULT_TAG_BLOCK` | TM_modules | ✅ Complete |
| `OPTIONAL_DURATION_TAG_BLOCK` | TM_modules | ✅ Complete |
| `OPTIONAL_PRICE_TAG_BLOCK` | TM_modules | ✅ Complete |
| `OPTIONAL_RECOVERY_TAG_BLOCK` | A_blocks + TM_modules | ✅ Complete |
| `OPTIONAL_NEXT_STEPS_TAG_BLOCK` | TM_modules | ✅ Complete |

---

## ⚠️ PARTIAL (Using Fallbacks)

These variables have generic fallback text that works but isn't personalized:

| Variable | Fallback Value | Needs |
|----------|----------------|-------|
| `GENERAL_RISK` | Generic risk text | Treatment-specific risks |
| `RECOVERY_DISCOMFORT` | Generic discomfort text | Treatment-specific |
| `ALARM_SIGNAL` | Generic alarm signals | Treatment-specific |
| `FACTOR_1` | "complexity of your case" | Dynamic factors |
| `FACTOR_2` | "materials chosen" | Dynamic factors |
| `FACTOR_3` | "regional pricing" | Dynamic factors |
| `QUESTION_1` | Generic question | Context-aware questions |
| `QUESTION_2` | Generic question | Context-aware questions |
| `QUESTION_3` | Generic question | Context-aware questions |

---

## ❌ FLAGGED (Not Implemented)

### Treatment Options (12 variables)
**Requires:** `treatmentOptions` MongoDB collection with structured treatment data

| Variable | Needs |
|----------|-------|
| `OPTION_1_NAME` | Treatment name |
| `OPTION_1_SHORT_DESCRIPTION` | Treatment description |
| `OPTION_1_INDICATION` | When treatment is indicated |
| `OPTION_1_COMPLEXITY` | Complexity level |
| `OPTION_1_ADVANTAGES` | List of advantages |
| `OPTION_1_DISADVANTAGES` | List of disadvantages |
| `OPTION_2_NAME` | Same as above for option 2 |
| `OPTION_2_SHORT_DESCRIPTION` | |
| `OPTION_2_INDICATION` | |
| `OPTION_2_COMPLEXITY` | |
| `OPTION_2_ADVANTAGES` | |
| `OPTION_2_DISADVANTAGES` | |

**Also affected:**
- `OPTIONAL_ADDITIONAL_OPTIONS`
- `OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS`

### Recommendation Engine (4 variables)
**Requires:** Priority matrix + recommendation algorithm

| Variable | Needs |
|----------|-------|
| `RECOMMENDED_DIRECTION` | Logic to select best treatment |
| `TAG_NUANCE_DIRECTION` | Conditional nuance text |
| `SELECTED_OPTION` | The chosen treatment name |
| `SITUATION_SPECIFIC_CONSIDERATIONS` | Dynamic risk considerations |

### Treatment Details (7 variables)
**Requires:** `treatmentOptions` collection with detailed data

| Variable | Needs |
|----------|-------|
| `RESULT_DESCRIPTION` | Expected results per treatment |
| `COMFORT_EXPERIENCE` | Comfort expectations |
| `AESTHETIC_RESULT` | Aesthetic outcomes |
| `TREATMENT_DURATION` | Duration per treatment |
| `PHASE_1` | Treatment phase 1 |
| `PHASE_2` | Treatment phase 2 |
| `PHASE_3` | Treatment phase 3 |

### Pricing (2 variables)
**Requires:** `pricingData` MongoDB collection with regional pricing

| Variable | Needs |
|----------|-------|
| `PRICE_MIN` | Minimum price for treatment in region |
| `PRICE_MAX` | Maximum price for treatment in region |

---

## Required Collections (Not Created)

### 1. `treatmentOptions`
```typescript
interface TreatmentOption {
  id: string;
  name: { en: string; nl: string };
  shortDescription: { en: string; nl: string };
  indication: { en: string; nl: string };
  complexity: "low" | "medium" | "high";
  advantages: { en: string[]; nl: string[] };
  disadvantages: { en: string[]; nl: string[] };
  resultDescription: { en: string; nl: string };
  comfortExperience: { en: string; nl: string };
  aestheticResult: { en: string; nl: string };
  duration: { en: string; nl: string };
  phases: { en: string[]; nl: string[] };
  recoveryDuration: { en: string; nl: string };
  recoveryDiscomfort: { en: string; nl: string };
  alarmSignal: { en: string; nl: string };
  generalRisk: { en: string; nl: string };
  eligibleMouthSituations: string[];
  contraindications: string[];
  basePriority: number;
}
```

**Estimated records:** ~12 (implant, bridge, veneer, crown, denture, etc.)

### 2. `pricingData`
```typescript
interface PricingData {
  treatmentId: string;
  region: string;
  priceMin: number;
  priceMax: number;
  currency: string;
  factors: { en: string[]; nl: string[] };
  lastUpdated: string;
}
```

**Estimated records:** ~30 (treatments × regions)

### 3. `questionBank`
```typescript
interface QuestionBankEntry {
  id: string;
  text: { en: string; nl: string };
  applicableDrivers: Record<string, string[]>;
  applicableTags: string[];
  priority: number;
}
```

**Estimated records:** ~25

---

## Required Services (Not Created)

### 1. TreatmentOptionService
- Query treatments by mouth situation
- Filter by contraindications
- Sort by priority/suitability

### 2. PricingService
- Get price range by treatment + region
- Get pricing factors

### 3. RecommendationEngine
- Priority matrix: drivers → treatment ranking
- Select OPTION_1, OPTION_2, SELECTED_OPTION
- Generate TAG_NUANCE_DIRECTION

### 4. QuestionBankService
- Select contextual questions based on drivers/tags
- Return QUESTION_1, QUESTION_2, QUESTION_3

---

## File Structure

```
src/lib/pipeline/nlg/
├── types.ts                 ✅ Created
├── DriverTextMapper.ts      ✅ Created
├── OptionalBlockResolver.ts ✅ Created
├── VariableCalculator.ts    ✅ Created
├── NLGTemplateRenderer.ts   ✅ Created
├── index.ts                 ✅ Created
├── IMPLEMENTATION_STATUS.md ✅ Created (this file)
│
├── TreatmentOptionService.ts    ❌ Not created
├── PricingService.ts            ❌ Not created
├── RecommendationEngine.ts      ❌ Not created
└── QuestionBankService.ts       ❌ Not created
```

---

## Usage

```typescript
import { generateNLGReport, NLGInput } from "./nlg";

const input: NLGInput = {
  sessionId: "abc123",
  driverState: driverState, // from DriverDeriver
  tags: new Set(["status_single_missing", "location_anterior"]),
  language: "en",
  tone: "TP-01",
  metadata: { region: "NL" }
};

const output = await generateNLGReport(input);

console.log(output.renderedReport); // The generated report
console.log(output.flags); // What's not implemented
console.log(output.warnings); // Runtime warnings
```

---

## Next Steps

1. **Create seed data** for `treatmentOptions` collection (~12 records)
2. **Create seed data** for `pricingData` collection (~30 records)
3. **Create seed data** for `questionBank` collection (~25 records)
4. **Build TreatmentOptionService** to query treatments
5. **Build RecommendationEngine** with priority matrix
6. **Build PricingService** for regional pricing
7. **Build QuestionBankService** for dynamic questions
8. **Integrate services** into VariableCalculator
