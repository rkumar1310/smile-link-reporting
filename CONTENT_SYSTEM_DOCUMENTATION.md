# Smile-Link Content System: Complete Technical Documentation

> **Scope**: This document covers the content system code in this repository.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [The Pipeline: End-to-End Flow](#2-the-pipeline-end-to-end-flow)
3. [Questionnaire & Intake Data](#3-questionnaire--intake-data)
4. [Tags: Semantic Markers from Answers](#4-tags-semantic-markers-from-answers)
5. [Drivers: The 18 Normalized Dimensions](#5-drivers-the-18-normalized-dimensions)
6. [Tag-to-Driver Derivation Rules](#6-tag-to-driver-derivation-rules)
7. [Scenarios: Clinical Case Patterns](#7-scenarios-clinical-case-patterns)
8. [Tone Profiles: Communication Style](#8-tone-profiles-communication-style)
9. [Content Types & the Content Registry](#9-content-types--the-content-registry)
10. [Content Selection: What Goes Into Each Section](#10-content-selection-what-goes-into-each-section)
11. [The 12-Section Report Structure](#11-the-12-section-report-structure)
12. [Report Composition: Assembly Rules](#12-report-composition-assembly-rules)
13. [Derivative Content Synthesis](#13-derivative-content-synthesis)
14. [Content Storage: MongoDB & DynamicContentStore](#14-content-storage-mongodb--dynamiccontentstore)
15. [On-Demand Content Generation](#15-on-demand-content-generation)
16. [Placeholder Resolution](#16-placeholder-resolution)
17. [L1 Safety Suppression Rules](#17-l1-safety-suppression-rules)
18. [Quality Assurance Gate](#18-quality-assurance-gate)
19. [Content Workflow & Lifecycle](#19-content-workflow--lifecycle)
20. [Fact-Checking System](#20-fact-checking-system)
21. [Key File Reference](#21-key-file-reference)

---

## 1. System Overview

The Smile-Link reporting system generates personalized dental reports for patients based on a questionnaire (18 questions). The system is a **rule-based NLG (Natural Language Generation) pipeline** with **LLM-powered content generation** and **fact-checking**.

### Architecture Diagram

```
Patient Questionnaire (18 Questions)
         |
         v
  [0] Input Validation
         |
         v
  [1] Tag Extraction -------- tag-extraction-rules.json
         |
         v
  [2] Driver Derivation ----- driver-derivation-rules.json
         |
         +---> [3] Scenario Scoring ---- scenario-profiles.json
         |           |
         +---> [4] Tone Selection ------ tone-profiles.json
         |           |
         +---> [5] Content Selection --- ContentSelector.ts (hardcoded rules)
                     |
                     v
          [6] Scenario Content Loading (DynamicContentStore)
                     |
                     v
          [7] Report Composition ------- section-composition-rules.json
              |                          PlaceholderResolver.ts
              |                          DerivativeContentService
              v
          [8] QA Gate
              |  - CompositionValidator
              |  - SemanticLeakageDetector
              |  - LLM Report Evaluator
              v
          Final Report (12 sections, PDF-ready)
```

### Tech Stack
- **Framework**: Next.js 16.1.4 (App Router)
- **Database**: MongoDB (content, sources, fact-checks)
- **Vector DB**: Qdrant (semantic search for source documents)
- **LLM**: Anthropic Claude (content generation, fact-checking, evaluation)
- **Schema Validation**: Zod
- **Languages**: English (en), Dutch (nl)

---

## 2. The Pipeline: End-to-End Flow

**File**: [`src/lib/pipeline/ReportPipeline.ts`](src/lib/pipeline/ReportPipeline.ts)

The pipeline runs 9 sequential phases (0-8):

| Phase | Name | Engine | Input | Output |
|-------|------|--------|-------|--------|
| 0 | Input Validation | `IntakeValidator` | Raw questionnaire answers | Validated `IntakeData` |
| 1 | Tag Extraction | `TagExtractor` | `IntakeData` | `TagExtractionResult` (tag set) |
| 2 | Driver Derivation | `DriverDeriver` | Tags | `DriverState` (18 driver values) |
| 3 | Scenario Scoring | `ScenarioScorer` | Drivers + Tags | `ScenarioMatchResult` (best S01-S17) |
| 4 | Tone Selection | `ToneSelector` | Drivers | `ToneSelectionResult` (TP-01 to TP-06) |
| 5 | Content Selection | `ContentSelector` | Drivers + Scenario + Tone + Tags | `ContentSelection[]` |
| 6 | Scenario Loading | `DynamicContentStore` | Scenario ID + Tone + Language | `ScenarioSections` |
| 7 | Composition | `ReportComposer` | All above + Content from DB | `ComposedReport` (12 sections) |
| 8 | QA Gate | `QAGate` | Composed report | `PASS` / `FLAG` / `BLOCK` |

Each phase emits progress events via `onProgress` callback for real-time UI updates (used by the SSE streaming endpoint).

---

## 3. Questionnaire & Intake Data

**Type**: [`src/lib/pipeline/types.ts:96-112`](src/lib/pipeline/types.ts#L96-L112)

The questionnaire has **23 question IDs** (18 main questions with sub-questions):

```
Q1   - Primary motivation (aesthetic, functional, pain, etc.)
Q2   - Satisfaction score (1-10)
Q2a  - Satisfaction detail (conditional)
Q3   - Primary concern
Q4   - Previous treatment experience (multi-select)
Q5   - Active symptoms (pain, loose teeth, infection)
Q6a  - Missing teeth count
Q6b  - Tooth location (front/side/both)
Q6c  - Neighboring teeth condition
Q6d  - Oral hygiene level
Q7   - Smile style preference (Hollywood, natural, classic, functional)
Q8   - Natural appearance importance
Q9   - Age range
Q10  - Budget preference
Q11  - Willingness to visit specialist
Q12  - Timeline preference
Q13  - Pregnancy status
Q14  - Smoking status
Q15  - Oral hygiene frequency
Q16a - Growth complete (under-18 check)
Q16b - Recent extraction
Q17  - Medical conditions
Q18  - Anxiety level
```

Each answer can be a `string` or `string[]` (for multi-select questions). Answers may also be marked as `skipped`.

### IntakeData Structure

```typescript
interface IntakeData {
  session_id: string;
  timestamp: string;
  language?: "en" | "nl";    // Defaults to "en"
  answers: QuestionAnswer[];  // Array of {question_id, answer, skipped?}
  metadata?: {
    patient_name?: string;
    tooth_location?: string;
  };
}
```

---

## 4. Tags: Semantic Markers from Answers

**Engine**: [`src/lib/pipeline/engines/TagExtractor.ts`](src/lib/pipeline/engines/TagExtractor.ts)
**Rules**: [`src/lib/pipeline/config/tag-extraction-rules.json`](src/lib/pipeline/config/tag-extraction-rules.json)

### What Tags Are

Tags are **intermediate semantic markers** that normalize free-form questionnaire answers into discrete identifiers. They bridge the gap between raw patient answers and high-level driver values.

### How Tag Extraction Works

For each question in `tag-extraction-rules.json`:

1. **Check if the question is answered** (skip if missing; track if required)
2. **Check conditional dependencies** (e.g., Q2a only applies if Q2 answer is in a certain range)
3. **Match answers to tags** using one of two methods:
   - **Answer mapping**: Direct lookup in an `answers` dictionary
     Example: Q5 answer `"yes_pain"` maps to tags `["acute_pain"]`
   - **Numeric ranges**: For score-based questions like Q2
     Example: Q2 answer `3` falls in range `"1-4"` which maps to `["satisfaction_low"]`
4. **Multi-select support**: For questions like Q4, each selected answer independently produces tags

### Tag Format

```typescript
interface ExtractedTag {
  tag: string;              // e.g., "acute_pain", "smoking_daily", "style_hollywood"
  source_question: QuestionId;  // e.g., "Q5"
  source_answer: string;    // The original answer text
}
```

### Example Tags

| Tag | Source | Meaning |
|-----|--------|---------|
| `acute_pain` | Q5 | Patient has current pain |
| `smoking_daily` | Q14 | Patient smokes daily |
| `pregnancy_yes` | Q13 | Patient is pregnant |
| `style_hollywood` | Q7 | Prefers Hollywood smile |
| `hygiene_poor` | Q6d | Poor oral hygiene |
| `satisfaction_low` | Q2 | Low satisfaction score (1-4) |
| `growth_incomplete` | Q16a | Jaw growth not complete |
| `tooth_health_bruxism` | Q6c | Bruxism/grinding detected |

### Answer Normalization

Before matching, answers are normalized: lowercased, trimmed, spaces converted to underscores, non-alphanumeric chars removed.

---

## 5. Drivers: The 18 Normalized Dimensions

**Type**: [`src/lib/pipeline/types.ts:50-91`](src/lib/pipeline/types.ts#L50-L91)

Drivers are computed attributes organized into three layers, each serving a different purpose in report generation.

### Layer 1: Safety (7 drivers)

L1 drivers control **clinical safety decisions** and can **suppress entire report sections** or **force scenario overrides**.

| Driver ID | Values | Purpose |
|-----------|--------|---------|
| `clinical_priority` | `urgent`, `semi_urgent`, `elective` | Treatment urgency |
| `biological_stability` | `stable`, `moderate`, `unstable`, `compromised` | Oral health baseline |
| `mouth_situation` | `no_missing_teeth`, `single_missing_tooth`, `multiple_adjacent`, `multiple_dispersed`, `mixed_pattern`, `extensive_missing`, `full_mouth_compromised`, `complex` | Missing teeth pattern |
| `age_stage` | `young_adult`, `middle_aged`, `senior` | Patient age category |
| `medical_constraints` | `none`, `pregnancy_related`, `surgical_contraindicated` | Medical contraindications |
| `treatment_viability` | `single_site`, `multiple_site`, `full_mouth` | Treatment scope |
| `risk_profile_biological` | `low`, `moderate`, `elevated` | Overall health risk |

### Layer 2: Personalization (6 drivers)

L2 drivers control **content selection** and **scenario matching** to personalize the report.

| Driver ID | Values | Purpose |
|-----------|--------|---------|
| `profile_type` | `aesthetic`, `functional`, `mixed`, `comfort` | Patient's primary concern |
| `aesthetic_tolerance` | `conservative`, `moderate`, `aggressive`, `high`, `normal` | Cosmetic preference level |
| `expectation_risk` | `low`, `moderate`, `high` | Risk of unmet expectations |
| `experience_history` | `none`, `first_timer`, `negative_history`, `experienced` | Prior dental treatment |
| `decision_stage` | `exploring`, `considering`, `ready` | Decision readiness |
| `autonomy_level` | `directive`, `balanced`, `autonomous` | Decision-making preference |

### Layer 3: Narrative (5 drivers)

L3 drivers control **tone selection** and **communication framing**.

| Driver ID | Values | Purpose |
|-----------|--------|---------|
| `anxiety_level` | `none`, `mild`, `moderate`, `severe` | Dental anxiety |
| `information_depth` | `summary`, `detailed` | Explanation preference |
| `budget_type` | `economy`, `balanced`, `premium` | Financial preference |
| `treatment_philosophy` | `durability_focused`, `aesthetic_focused` | Treatment approach |
| `time_horizon` | `immediate`, `short_term`, `long_term`, `undefined` | Timeline preference |

### DriverValue Structure

```typescript
interface DriverValue {
  driver_id: DriverId;
  layer: "L1" | "L2" | "L3";
  value: string;
  source: "derived" | "fallback";
  source_tags: string[];        // Which tags produced this value
  confidence: number;           // 0-1
}
```

---

## 6. Tag-to-Driver Derivation Rules

**Engine**: [`src/lib/pipeline/engines/DriverDeriver.ts`](src/lib/pipeline/engines/DriverDeriver.ts)
**Rules**: [`src/lib/pipeline/config/driver-derivation-rules.json`](src/lib/pipeline/config/driver-derivation-rules.json)

### How Derivation Works

For each of the 18 drivers:

1. **Evaluate rules in priority order** (lower priority number = higher precedence)
2. Each rule checks for tag presence using one of three patterns:
   - `tags` / `tags_all`: **ALL** listed tags must be present in the tag set
   - `tags_any`: **At least one** listed tag must be present
3. First matching rule (by priority) determines the driver value
4. If **no rules match**, the **fallback** value is applied

### Rule Structure Example

```json
{
  "clinical_priority": {
    "layer": "L1",
    "safety_critical": true,
    "rules": [
      { "tags": ["acute_pain", "acute_infection"], "value": "urgent", "priority": 1 },
      { "tags_any": ["acute_pain", "acute_loose"], "value": "semi_urgent", "priority": 2 },
      { "tags": ["no_acute_issues"], "value": "elective", "priority": 3 }
    ],
    "fallback": { "value": "semi_urgent", "reason": "Safety-first when clinical status unknown" }
  }
}
```

### Conflict Resolution

When multiple non-additive rules match with different values, the system:
1. Records the conflict in `DriverConflict`
2. Uses the **highest-priority** (lowest priority number) rule's value
3. Logs the resolution reason

### Confidence Calculation

Confidence is computed from the number of matched tags:
```
confidence = min(1, matchedTagCount * 0.3 + 0.4)
```
Fallback values always get `confidence = 0.5`.

---

## 7. Scenarios: Clinical Case Patterns

**Engine**: [`src/lib/pipeline/engines/ScenarioScorer.ts`](src/lib/pipeline/engines/ScenarioScorer.ts)
**Profiles**: [`src/lib/pipeline/config/scenario-profiles.json`](src/lib/pipeline/config/scenario-profiles.json)

### The 18 Scenarios

| ID | Name | Key Condition |
|----|------|--------------|
| S00 | Generic fallback | No match found |
| S01 | No missing teeth, discoloration | Cosmetic concerns only |
| S02 | Single tooth missing, visible zone | Front tooth gap |
| S03 | Single tooth missing, posterior | Back tooth gap |
| S04 | 2-4 teeth missing, adjacent | Connected gap |
| S05 | 2-4 teeth missing, scattered | Dispersed gaps |
| S06 | Missing teeth + aesthetic (mixed) | Both functional and cosmetic |
| S07 | 5+ teeth missing, segmental | Extensive continuous loss |
| S08 | 5+ teeth missing, scattered | Extensive dispersed loss |
| S09 | Complete jaw edentulous | Full jaw tooth loss |
| S10 | Almost all teeth unsalvageable | Near-complete loss |
| S11 | No missing teeth, misalignment | Orthodontic needs |
| S12 | Loose teeth or pain (ACUTE) | Urgent/safety scenario |
| S13 | Young profile, light discoloration | Conservative cosmetic |
| S14 | Older profile, wear and discoloration | Age-related concerns |
| S15 | Hollywood smile preference | Dramatic transformation |
| S16 | Old restorations visible/failing | Replacement needs |
| S17 | Purely aesthetic improvement | Elective cosmetic |

### Scoring Algorithm

Each scenario has four driver criteria categories:

1. **Required drivers** - ALL must match, or scenario is **disqualified** (score = -Infinity)
2. **Excluding drivers** - If ANY match, scenario is **disqualified**
3. **Strong drivers** - Each match adds `strong_weight` (default: 3) points
4. **Supporting drivers** - Each match adds `supporting_weight` (default: 1) point
5. **Preferred tags** - Direct tag matches add `preferred_tag_weight` (default: 4) points

Final score = sum of strong + supporting + preferred_tag points.

### Safety Override

Before normal scoring, the system checks for L1 safety overrides:
- `clinical_priority = "urgent"` → Forces **S12** (Acute scenario)
- `medical_constraints = "surgical_contraindicated"` → Forces **S12**

### Fallback Cascade

If no scenario scores above the `LOW` confidence threshold:

1. **Relaxed matching**: Re-score ignoring L3 (narrative) drivers
2. **Archetype matching**: Simple lookup based on `mouth_situation` only
3. **Generic fallback**: Use **S00_GENERIC**

### Confidence Levels

| Level | Threshold | Meaning |
|-------|-----------|---------|
| HIGH | Configurable (default ~8) | Strong match |
| MEDIUM | Configurable (default ~5) | Good match |
| LOW | Configurable (default ~2) | Weak match |
| FALLBACK | 0 | No real match, using fallback |

---

## 8. Tone Profiles: Communication Style

**Engine**: [`src/lib/pipeline/engines/ToneSelector.ts`](src/lib/pipeline/engines/ToneSelector.ts)
**Profiles**: [`src/lib/pipeline/config/tone-profiles.json`](src/lib/pipeline/config/tone-profiles.json)

### The 6 Tone Profiles

| ID | Name | Priority | Trigger | Purpose |
|----|------|----------|---------|---------|
| TP-01 | Neutral-Informative | 1 (default) | No triggers match | Professional, balanced, factual |
| TP-02 | Empathic-Neutral | 2 | Negative treatment history, high expectations | Warm, reassuring |
| TP-03 | Reflective-Contextual | 2 | Detailed info preference | Thoughtful, analytical |
| TP-04 | Stability-Frame | **5 (highest)** | Severe anxiety, dental phobia | Calming, avoids triggering language |
| TP-05 | Expectation-Calibration | 3 | Unrealistic expectations | Sets realistic expectations |
| TP-06 | Autonomy-Respecting | 4 | Section 11 only | Non-directive, choice-emphasizing |

### Tone Selection Process

1. Evaluate each tone in **priority order** (highest priority first: TP-04 → TP-06 → TP-05 → TP-02/TP-03 → TP-01)
2. For each tone, check if any of its `trigger_drivers` match the current driver state
3. First matching tone wins
4. If nothing matches, default to **TP-01**

### Banned Lexical Sets

Each tone has a `banned_lexical_set` - words/phrases that must NOT appear in content using that tone. Example for TP-04 (Stability-Frame):
```
"surgery", "operation", "invasive", "drill", "cut", "remove", "extract",
"painful", "immediately", "urgent", "complication", "risk", "failure"
```

### Section 11 Override

Section 11 (Next Steps) **always** uses TP-06 (Autonomy-Respecting), regardless of the selected tone.

### Tone Fallback Chains

When content for a specific tone variant isn't available, the system tries fallback tones:
```
TP-01 → [] (no fallback, it IS the fallback)
TP-02 → [TP-01]
TP-03 → [TP-01]
TP-04 → [TP-02, TP-01]
TP-05 → [TP-03, TP-01]
TP-06 → [TP-01]
```

---

## 9. Content Types & the Content Registry

**Registry**: [`src/lib/config/content-registry.json`](src/lib/config/content-registry.json)
**Types**: [`src/lib/types/types/content.ts`](src/lib/types/types/content.ts)

### Five Content Types

| Type | Prefix | Count | Purpose | Typical Sections |
|------|--------|-------|---------|-----------------|
| **scenario** | `S01`-`S17` | 18 | Full clinical case content with 8 sub-sections | 2, 3, 5, 6, 7, 8, 9, 10 |
| **a_block** | `A_WARN_*`, `A_FB_*`, `A_CFB_*`, `A_BLOCK_*` | ~20 | Safety warnings and clinical findings | 0 |
| **b_block** | `B_CTX_*`, `B_INTERP_*`, `B_OPT_*`, `B_COMPARE_*`, `B_RISKLANG_*`, `B_NUANCE_*`, `B_COST_*` | ~45 | Contextual/explanatory content blocks | 3-10 |
| **module** | `TM_*` | ~40 | Short insertable text modules | 2, 3, 7, 9, 10 |
| **static** | `STATIC_*` | 2 | Fixed content (disclaimer, next steps) | 1, 11 |

### Three Driver Layers for Content

| Layer | Name | Color | Purpose |
|-------|------|-------|---------|
| **L1** | Safety Layer | Red | Clinical safety, warnings, contraindications |
| **L2** | Personalization Layer | Blue | Patient-specific context and preferences |
| **L3** | Narrative Layer | Green | Communication style and framing |

### Content Registry Structure

The content registry ([`content-registry.json`](src/lib/config/content-registry.json)) is a central catalog of ALL content items:

```typescript
interface ContentRegistryItem {
  id: string;           // "S01", "A_WARN_ACTIVE_SYMPTOMS", "TM_BUDGET_LIMITED"
  type: ContentType;    // "scenario" | "a_block" | "b_block" | "module" | "static"
  name: string;         // Human-readable name
  description: string;  // Rich description (used for semantic search)
  layer: ContentLayer;  // "L1" | "L2" | "L3"
  sections: number[];   // Which report sections this content targets
}
```

The registry also has Dutch (`name_nl`, `description_nl`) fields for semantic search against Dutch source documents.

### Content Item Catalog (Full List)

#### A-Blocks (Warnings & Findings)

| ID | Name | Trigger |
|----|------|---------|
| `A_WARN_ACTIVE_SYMPTOMS` | Active Symptoms Warning | `clinical_priority` = urgent/semi_urgent |
| `A_WARN_PREGNANCY_OR_GROWTH` | Pregnancy/Growth Warning | `medical_constraints` = pregnancy_related |
| `A_WARN_BIOLOGICAL_INSTABILITY` | Biological Instability Warning | `biological_stability` = unstable/compromised |
| `A_BLOCK_TREATMENT_OPTIONS` | Treatment Options Limitation | `medical_constraints` = surgical_contraindicated |
| `A_WARN_RISK_FACTORS` | Risk Factors Warning | `risk_profile_biological` = elevated |
| `A_WARN_INCOMPLETE_ASSESSMENT` | Incomplete Assessment Warning | `clinical_priority` = unknown |
| `A_FB_PREGNANCY` | Pregnancy Finding | `medical_constraints` = pregnancy_related |
| `A_FB_SMOKING` | Smoking Finding | Tag: `smoking_daily` |
| `A_FB_POOR_HYGIENE` | Poor Hygiene Finding | Tag: `hygiene_poor` |
| `A_CFB_BRUXISM` | Bruxism Finding | Tag: `tooth_health_bruxism` |
| `A_CFB_DENTAL_ANXIETY` | Dental Anxiety Finding | `anxiety_level` = severe/moderate |
| `A_CFB_GROWTH_INCOMPLETE` | Growth Incomplete Finding | Tag: `growth_incomplete` |

#### B-Blocks (Content Blocks)

| ID | Section | Trigger |
|----|---------|---------|
| `B_CTX_SINGLE_TOOTH` | 3 (Context) | `mouth_situation` = single_missing_tooth |
| `B_CTX_MULTIPLE_TEETH` | 3 (Context) | `mouth_situation` = multiple_adjacent/dispersed/mixed |
| `B_CTX_GENERAL` | 3 (Context) | `mouth_situation` = no_missing_teeth/complex |
| `B_INTERP_STANDARD` | 4 (Interpretation) | Any `profile_type` |
| `B_OPT_IMPLANT` | 5 (Options) | `mouth_situation` = single/multiple_adjacent/dispersed |
| `B_OPT_BRIDGE` | 5 (Options) | `mouth_situation` = single/multiple_adjacent |
| `B_COMPARE_IMPLANT_VS_BRIDGE` | 6 (Comparison) | `mouth_situation` = single/multiple_adjacent |
| `B_RISKLANG_STANDARD` | 10 (Risk) | `risk_profile_biological` = low/moderate |
| `B_RISKLANG_ELEVATED` | 10 (Risk) | `risk_profile_biological` = elevated |
| `B_NUANCE_S01`..`S17` | 3 (Context) | Matched scenario |
| `B_COST_S01`..`S17` | 9 (Costs) | Matched scenario |

#### Text Modules (TM_*)

Modules are organized into categories:

**Risk Modules** (sections 3, 10):
`TM_RISK_SMOKING`, `TM_RISK_PREGNANCY`, `TM_RISK_MEDICAL`, `TM_RISK_BRUXISM`, `TM_RISK_PERIODONTITIS`, `TM_RISK_CHRONIC_INFLAMMATION`, `TM_RISK_POOR_HYGIENE`, `TM_RISK_BONE_LOSS`

**Context Modules** (section 3):
`TM_CTX_FIRST_TIME`, `TM_CTX_PREVIOUS_TREATMENT`, `TM_CTX_AGE`, `TM_CTX_PREMIUM_AESTHETIC`, `TM_CTX_AESTHETIC_STYLE`, `TM_CTX_FUNCTIONAL_VS_AESTHETIC`, `TM_CTX_TOOTH_STATUS`, `TM_CTX_ORAL_COMPLEXITY`, `TM_CTX_GENERAL_HEALTH`, `TM_CTX_RESTORATION_STATUS`

**Profile Modules** (section 3 or 9):
`TM_PROFILE_COMFORT`, `TM_PROFILE_AESTHETIC`, `TM_PROFILE_FUNCTIONAL`, `TM_PROFILE_BUDGET`, `TM_PROFILE_PREMIUM`, `TM_PROFILE_COMBINATION`

**Timeline Modules** (sections 3, 7):
`TM_CTX_TIMELINE_URGENT`, `TM_CTX_TIMELINE_MEDIUM`, `TM_CTX_TIMELINE_RELAXED`, `TM_CTX_TIMELINE_EXPLORATORY`

**Style Modules** (sections 3, 5):
`TM_CTX_STYLE_HOLLYWOOD`, `TM_CTX_STYLE_NATURAL`, `TM_CTX_STYLE_CLASSIC`, `TM_CTX_STYLE_FUNCTIONAL`

**Budget Modules** (section 9):
`TM_BUDGET_LIMITED`, `TM_BUDGET_FLEXIBLE`, `TM_BUDGET_PREMIUM`

**Anxiety Module** (section 2):
`TM_ANXIETY_SEVERE` (priority: 0 = prepend before scenario content)

---

## 10. Content Selection: What Goes Into Each Section

**Engine**: [`src/lib/pipeline/engines/ContentSelector.ts`](src/lib/pipeline/engines/ContentSelector.ts)

The ContentSelector evaluates all trigger rules and produces a list of `ContentSelection` objects, each specifying:

```typescript
interface ContentSelection {
  content_id: string;          // "A_WARN_ACTIVE_SYMPTOMS", "S11", etc.
  type: ContentType;           // "a_block", "scenario", "b_block", "module", "static"
  target_section: number;      // 0-11
  tone: ToneProfileId;         // "TP-01" to "TP-06"
  priority: number;            // Lower = higher priority (0 = prepend, 2 = append)
  suppressed: boolean;         // Whether L1 rules suppress this
  suppression_reason?: string; // Why it was suppressed
}
```

### Selection Process

1. **Determine L1 suppressions** from driver state
2. **Select A-blocks** (warnings) by checking each trigger against drivers AND tags
3. **Select scenario** content for Section 2
4. **Select B-blocks** by checking driver-based triggers
5. **Select scenario-specific blocks** (nuance + cost blocks for matched scenario)
6. **Select text modules** by checking driver-based AND tag-based triggers (modules can target multiple sections)
7. **Add static content** (disclaimer in section 1, next steps in section 11)

### Trigger Types

Content selection uses two trigger mechanisms:

**Driver-based triggers**: Check if a driver has a specific value
```typescript
// A_WARN_ACTIVE_SYMPTOMS triggers when clinical_priority is urgent or semi_urgent
{ driver: "clinical_priority", values: ["urgent", "semi_urgent"] }
```

**Tag-based triggers**: Check if a specific tag was extracted
```typescript
// A_FB_SMOKING triggers when the tag "smoking_daily" is present
{ tag: "smoking_daily" }
```

### Priority System for Modules

Module priority controls insertion order within a section:
- `priority: 0` = **Prepend** (before scenario content)
- `priority: 2` = **Append** (after scenario content, the default)

Example: `TM_ANXIETY_SEVERE` has `priority: 0` so it appears before the scenario's personal summary in section 2.

---

## 11. The 12-Section Report Structure

**Config**: [`src/lib/pipeline/config/section-composition-rules.json`](src/lib/pipeline/config/section-composition-rules.json)

| # | Section Name | Content Sources | Required | Suppressible |
|---|-------------|----------------|----------|-------------|
| 0 | Important Notices | A-blocks | No | No |
| 1 | Disclaimer | Static | Yes | No |
| 2 | Your Personal Summary | Module + Scenario | Yes | No |
| 3 | Context | B-block + Module + Scenario | Yes | No |
| 4 | Interpretation | B-block | Yes | No |
| 5 | Treatment Options | B-block + Scenario | No | **Yes** |
| 6 | Comparison | B-block + Scenario | No | **Yes** |
| 7 | Trade-offs to Consider | B-block + Scenario | No | **Yes** |
| 8 | Treatment Process | B-block + Scenario | No | **Yes** |
| 9 | Cost Considerations | B-block + Module + Scenario | No | **Yes** |
| 10 | Risk Factors | B-block + Module + Scenario | Yes | No |
| 11 | Next Steps | Static (always TP-06) | Yes | No |

### Scenario Sections Mapping

Scenarios provide structured content for 8 sub-sections:

| Scenario Key | Report Section | Alternate Keys |
|-------------|---------------|----------------|
| `personal_summary` | 2 | - |
| `context` | 3 | - |
| `options` | 5 | `directions` |
| `comparison` | 6 | - |
| `tradeoffs` | 7 | `expected_results` |
| `process` | 8 | - |
| `costs` | 9 | - |
| `risk` | 10 | `recovery` |

---

## 12. Report Composition: Assembly Rules

**Engine**: [`src/lib/pipeline/composition/ReportComposer.ts`](src/lib/pipeline/composition/ReportComposer.ts)

### Ordered Assembly

For each section (0-11), composition follows these steps:

1. **Check L1 suppression**: If section is suppressed by L1 rules (see section 17), skip entirely
2. **Check if all selections are suppressed**: If so, skip section
3. **Determine section tone**: Use tone override if configured (section 11 → TP-06), otherwise use selected tone
4. **Add uncertainty language**: For sections 2-4, if confidence is not HIGH, prepend uncertainty phrases
5. **Process content in order**: Follow the `order` array from composition rules

For each content type in the `order` array:
- **`static`**: Load from ContentStore (with hardcoded fallback)
- **`scenario`**: Load structured scenario section by key (direct typed access)
- **`b_block` / `module` / `a_block`**:
  - If `b_block` and scenario has content for this section → **skip** (scenario takes precedence)
  - Otherwise, load each selected block from ContentStore
  - Apply cardinality limits (e.g., max 5 a_blocks, max 2 b_blocks in section 5)

6. **Attempt derivative synthesis**: If 2+ content parts exist, try to generate a derivative (see section 13)
7. **Resolve placeholders**: Replace `{{PLACEHOLDER}}` patterns with actual values
8. **Fallback to concatenation**: If derivative fails, join content parts with `\n\n`

### Section Name Localization

Section names are localized based on the report language via [`languages.json`](src/lib/pipeline/config/languages.json).

---

## 13. Derivative Content Synthesis

**Service**: [`src/lib/services/DerivativeContentService.ts`](src/lib/services/DerivativeContentService.ts)
**Agent**: [`src/lib/agents/derivative-generator/`](src/lib/agents/derivative-generator/)
**Types**: [`src/lib/types/types/derivative.ts`](src/lib/types/types/derivative.ts)

### What Are Derivatives?

When a report section receives content from **multiple source blocks** (e.g., a B-block + 2 modules), instead of simple concatenation, the system can use an LLM to **synthesize** them into a coherent, unified piece of text.

### How Derivatives Work

1. **Trigger**: A section has 2+ content blocks (excluding STATIC_* and SCENARIO:* sources)
2. **Cache check**: Generate a deterministic `derivativeId` by hashing sorted `sourceBlockIds + language + tone`
3. **If cached**: Return existing derivative from MongoDB
4. **If not cached**: Call `DerivativeGenerationAgent` to synthesize
5. **Fact-check**: Verify claims in derivative trace back to source blocks
6. **Save**: Store in MongoDB with usage tracking and version pinning

### Derivative ID Generation

```typescript
function generateDerivativeId(sourceBlockIds: string[], language, tone): string {
  const sorted = [...sourceBlockIds].sort();
  const input = `${sorted.join("|")}:${language}:${tone}`;
  return sha256(input).slice(0, 16);
}
```

This ensures the **same combination of blocks** always produces the **same ID**, enabling caching.

### Version Invalidation

Each derivative tracks `sourceBlockVersions`. When any source block's version changes, the derivative is considered stale and regenerated:

```typescript
function isDerivativeValid(derivative, currentVersions): boolean {
  for (const blockId of derivative.sourceBlockIds) {
    if (derivative.sourceBlockVersions[blockId] !== currentVersions[blockId]) {
      return false;  // Source block was updated, derivative is stale
    }
  }
  return true;
}
```

---

## 14. Content Storage: MongoDB & DynamicContentStore

**Store**: [`src/lib/pipeline/content/DynamicContentStore.ts`](src/lib/pipeline/content/DynamicContentStore.ts)
**Service**: [`src/lib/services/ContentService.ts`](src/lib/services/ContentService.ts)

### ContentDocument (MongoDB Schema)

Each content item in MongoDB follows this structure:

```typescript
interface ContentDocument {
  _id?: string;
  contentId: string;             // "S11", "A_WARN_ACTIVE_SYMPTOMS"
  type: ContentType;             // "scenario", "a_block", etc.
  name: string;
  description: string;
  layer: DriverLayer;            // "L1", "L2", "L3"

  // Trigger configuration
  triggerDrivers?: Record<string, string[]>;
  triggerTags?: string[];
  targetSection?: number;
  targetSections?: number[];
  priority?: number;

  // Suppression rules
  suppresses?: { sections?: number[]; blocks?: string[] };

  // Placeholders
  placeholders?: PlaceholderDef[];

  // Content variants (the actual text)
  variants: {
    en?: {
      "TP-01"?: ContentVariant,
      "TP-02"?: ContentVariant,
      // ... up to TP-06
    },
    nl?: { ... }
  };

  // Workflow
  status: "draft" | "review" | "approved" | "published" | "archived";
  version: string;
  versionHistory: ContentVersion[];
}
```

### ContentVariant

Each variant (language + tone combination) stores:

```typescript
interface ContentVariant {
  content: string;              // Markdown text
  wordCount: number;
  citations: Citation[];        // Links to source documents
  generatedAt?: string;
  generatedBy?: "manual" | "agent";
  generationJobId?: string;
  factCheckStatus: "pending" | "verified" | "failed" | "skipped";
  lastFactCheckId?: string;
  variantStatus: "draft" | "review" | "approved";
}
```

### DynamicContentStore: The Smart Content Layer

The `DynamicContentStore` implements a 3-tier content resolution strategy:

```
Request: getContent("B_CTX_SINGLE_TOOTH", "TP-02", "en")
         |
         v
  [1] In-Memory Cache (session-scoped) ──── HIT → Return
         |
         MISS
         v
  [2] MongoDB Lookup (variants.en.TP-02.content) ──── HIT → Return + cache
         |
         MISS
         v
  [3] Dynamic Generation
      a) Look up content metadata from registry
      b) Semantic search for relevant Dutch source documents (Qdrant)
      c) Call ContentGenerationAgent (LLM) to generate content
      d) Save to MongoDB
      e) Return + cache
```

For scenario content, there's a parallel path using `getScenarioSections()` that returns **structured sections** (typed `ScenarioSections` object) instead of a flat string.

---

## 15. On-Demand Content Generation

**Agent**: [`src/lib/agents/content-generator/ContentGenerationAgent.ts`](src/lib/agents/content-generator/ContentGenerationAgent.ts)
**Prompts**: [`src/lib/agents/content-generator/prompts/`](src/lib/agents/content-generator/prompts/)

### When Content Is Generated

Content is generated dynamically when:
1. The `DynamicContentStore` can't find a variant in MongoDB
2. A content gap is detected during the `content-check` pipeline phase
3. A user explicitly triggers generation from the CMS dashboard

### Generation Process

1. **Metadata lookup**: Get content item details from the registry (name, description, type, target sections)
2. **Semantic search**: Query Qdrant using the Dutch description to find relevant source document chunks
3. **Source retrieval**: Fetch full source documents from MongoDB
4. **LLM generation**: Call the ContentGenerationAgent with:
   - Content ID and type
   - Target language and tone
   - Source documents (sections with content)
   - Existing manifest (name, description, target sections, word count target)
5. **Save**: Upsert the generated variant into MongoDB

### Scenario Generation (Structured Output)

For scenarios, the LLM returns **structured sections** matching the `ScenarioSections` interface:

```typescript
interface ScenarioSections {
  personal_summary: string;  // Section 2 content
  context: string;           // Section 3 content
  options: string;           // Section 5 content
  comparison: string;        // Section 6 content
  tradeoffs: string;         // Section 7 content
  process: string;           // Section 8 content
  costs: string;             // Section 9 content
  risk: string;              // Section 10 content
}
```

This avoids the need to parse markdown sections - each section is a clean, typed property.

### Source Documents

Source documents are **Dutch dental reference material** uploaded as Word documents (`.docx`), parsed into sections, embedded into Qdrant for semantic search. The system always searches in Dutch (since sources are Dutch) but generates output in the requested language (en/nl).

---

## 16. Placeholder Resolution

**Engine**: [`src/lib/pipeline/composition/PlaceholderResolver.ts`](src/lib/pipeline/composition/PlaceholderResolver.ts)

### Placeholder Format

```
{{PLACEHOLDER_NAME}}
```

All uppercase, underscores allowed, wrapped in double curly braces.

### Resolution Priority

Placeholders are resolved in this order:

1. **Intake metadata** (e.g., `patient_name`, `tooth_location` from intake)
2. **Calculated values** (derived from driver state and intake answers)
3. **Custom values** (supplied by the caller)
4. **Placeholder definition fallback** (from the content item's `placeholders` array)
5. **Default fallback** (hardcoded defaults)

### Available Placeholders

**From intake metadata**:
| Placeholder | Fallback |
|------------|----------|
| `{{PATIENT_NAME}}` | "you" |
| `{{TOOTH_LOCATION}}` | "the affected area" |

**Calculated from answers & drivers**:
| Placeholder | Source | Example Value |
|------------|--------|---------------|
| `{{PRIMARY_CONCERN}}` | Q1 | "improving confidence in your smile" |
| `{{TOOTH_ZONE}}` | Q6b | "a visible area" |
| `{{TOOTH_ZONE_DESCRIPTION}}` | Q6b | "A missing tooth in a visible area" |
| `{{TREATMENT_COMPLEXITY}}` | `mouth_situation` driver | "straightforward" |
| `{{ESTIMATED_VISITS}}` | `mouth_situation` driver | "3-5 appointments" |
| `{{TIMELINE_PREFERENCE}}` | Q12 | "relatively soon" |
| `{{DECISION_STAGE_DESCRIPTION}}` | Q12 | "ready to move forward" |
| `{{BUDGET_APPROACH}}` | Q10 | "balancing cost and quality" |
| `{{EXPERIENCE_CONTEXT}}` | Q4 | "As this is your first time considering dental treatment" |
| `{{AGE_BRACKET}}` | Q9 | "adults in their 30s and 40s" |

**Static defaults**:
| Placeholder | Fallback |
|------------|----------|
| `{{CLINIC_NAME}}` | "your dental clinic" |
| `{{DENTIST_NAME}}` | "your dental professional" |
| `{{TREATMENT_DURATION}}` | "the treatment period" |

---

## 17. L1 Safety Suppression Rules

**Defined in**: [`src/lib/pipeline/engines/ContentSelector.ts:32-57`](src/lib/pipeline/engines/ContentSelector.ts#L32-L57)

L1 drivers can **suppress entire sections** or **specific block patterns** to prevent unsafe content from being shown.

### Suppression Rules

| Trigger | Suppressed Sections | Suppressed Blocks |
|---------|--------------------|--------------------|
| `clinical_priority: urgent` | 5, 6, 7, 8, 9 | `B_OPT_*`, `B_COMPARE_*`, `B_PROCESS_*` |
| `clinical_priority: semi_urgent` | 6, 7 | `B_COMPARE_*` |
| `medical_constraints: pregnancy_related` | - | `B_OPT_IMPLANT`, `B_PROCESS_IMPLANT` |
| `medical_constraints: surgical_contraindicated` | 5, 6, 7, 8, 9 | `B_OPT_*`, `B_COMPARE_*`, `B_PROCESS_*` |
| `biological_stability: compromised` | 6 | `B_COMPARE_*` |

### A_BLOCK_TREATMENT_OPTIONS Additional Suppression

When the `A_BLOCK_TREATMENT_OPTIONS` block is active (triggered by `surgical_contraindicated`), the **ReportComposer** additionally enforces suppression of sections 5-9 at composition time, as a safety net independent of the ContentSelector.

### How Suppression Works

1. ContentSelector marks selections as `suppressed: true` with a reason
2. ReportComposer checks for L1 suppression at section level
3. Suppressed sections are **completely omitted** from the final report
4. Suppressed sections are listed in `ComposedReport.suppressed_sections`

---

## 18. Quality Assurance Gate

**Engine**: [`src/lib/pipeline/qa/QAGate.ts`](src/lib/pipeline/qa/QAGate.ts)

The QA Gate runs three checks and determines one of three outcomes:

### Three QA Checks

**1. Composition Validation** ([`CompositionValidator.ts`](src/lib/pipeline/qa/CompositionValidator.ts))
- Required sections present
- No empty content in active sections
- Word count minimums met
- Proper section ordering

**2. Semantic Leakage Detection** ([`SemanticLeakageDetector.ts`](src/lib/pipeline/qa/SemanticLeakageDetector.ts))
- Checks every section against the selected tone's `banned_lexical_set`
- Detects banned phrases that violate the tone profile
- Each violation is rated `WARNING` or `CRITICAL`

**3. LLM Report Evaluation** ([`src/lib/qa/LLMReportEvaluator.ts`](src/lib/qa/LLMReportEvaluator.ts))
- Scores the report across 6 dimensions (1-10 each):
  - Professional quality
  - Clinical safety
  - Tone appropriateness
  - Personalization
  - Patient autonomy
  - Structure completeness
- Provides actionable `content_issues` linked to specific source content files
- **Does not block** delivery (scores only, `llmEvaluatorCanBlock: false`)

### Outcome Determination

| Outcome | Meaning | Delivery? | Thresholds |
|---------|---------|-----------|------------|
| **PASS** | All checks passed | Yes | No critical violations, no validation errors |
| **FLAG** | Passed but needs review | Yes (with flag) | >5 semantic warnings, >10 validation warnings, or LOW/FALLBACK confidence |
| **BLOCK** | Failed | No | Any critical semantic violation, any validation error, unresolved placeholders (if configured) |

### Configuration Defaults

```typescript
{
  maxCriticalViolations: 0,       // Any critical → BLOCK
  maxWarningViolations: 5,        // >5 warnings → FLAG
  maxValidationErrors: 0,         // Any error → BLOCK
  maxValidationWarnings: 10,      // >10 warnings → FLAG
  blockOnUnresolvedPlaceholders: false,
  llmEvaluatorEnabled: true,
  llmEvaluatorCanBlock: false     // LLM provides scores only
}
```

---

## 19. Content Workflow & Lifecycle

**Types**: [`src/lib/types/types/content.ts:276-300`](src/lib/types/types/content.ts#L276-L300)

### Content Status Flow

```
draft ──→ review ──→ approved ──→ published
  ↑          |           |            |
  └──────────┘           └── (archive)
  (reject)               └── (unpublish → approved)
```

| Action | From | To | Requires Approval |
|--------|------|----|--------------------|
| `submit_review` | draft | review | No |
| `approve` | review | approved | **Yes** |
| `reject` | review | draft | No |
| `publish` | approved | published | No |
| `unpublish` | published | approved | No |
| `archive` | draft/approved | archived | No |

### Variant Status

Each content variant (language + tone) also has its own status:
- `draft` → `review` → `approved`

This allows individual variants to be at different stages of readiness.

### Versioning

Content documents track version history:

```typescript
interface ContentVersion {
  version: string;
  content: string;
  changedAt: string;
  changedBy: string;
  changeReason?: string;
}
```

---

## 20. Fact-Checking System

**Agent**: [`src/lib/agents/fact-checker/FactCheckAgent.ts`](src/lib/agents/fact-checker/FactCheckAgent.ts)
**Types**: [`src/lib/types/types/factcheck.ts`](src/lib/types/types/factcheck.ts)

### How Fact-Checking Works

1. **Claim Extraction** ([`ClaimExtractor.ts`](src/lib/agents/fact-checker/ClaimExtractor.ts)): LLM extracts factual claims from generated content
2. **Source Verification** ([`SourceVerifier.ts`](src/lib/agents/fact-checker/SourceVerifier.ts)): Each claim is verified against source documents
3. **Verdict Assignment**: Each claim gets a verdict

### Claim Verdicts

| Verdict | Meaning |
|---------|---------|
| `supported` | Claim verified in source documents |
| `unsupported` | No source evidence found |
| `contradicted` | Source documents contradict the claim |
| `unverifiable` | Claim cannot be verified from available sources |

### Overall Verdicts

| Verdict | Condition |
|---------|-----------|
| `pass` | All claims supported |
| `pass_with_warnings` | Minor unsupported claims |
| `fail` | Contradicted or many unsupported claims |

### Current State

Fact-checking is currently **disabled** in the DynamicContentStore for faster iteration (see comment in [`DynamicContentStore.ts:12`](src/lib/pipeline/content/DynamicContentStore.ts#L12)). Generated content is saved with `factCheckStatus: "pending"`.

---

## 21. Key File Reference

### Pipeline Engines
| File | Purpose |
|------|---------|
| [`src/lib/pipeline/ReportPipeline.ts`](src/lib/pipeline/ReportPipeline.ts) | Main pipeline orchestrator |
| [`src/lib/pipeline/engines/TagExtractor.ts`](src/lib/pipeline/engines/TagExtractor.ts) | Question answer → tag extraction |
| [`src/lib/pipeline/engines/DriverDeriver.ts`](src/lib/pipeline/engines/DriverDeriver.ts) | Tag → driver derivation |
| [`src/lib/pipeline/engines/ScenarioScorer.ts`](src/lib/pipeline/engines/ScenarioScorer.ts) | Scenario matching & scoring |
| [`src/lib/pipeline/engines/ToneSelector.ts`](src/lib/pipeline/engines/ToneSelector.ts) | Tone profile selection |
| [`src/lib/pipeline/engines/ContentSelector.ts`](src/lib/pipeline/engines/ContentSelector.ts) | Content block selection & suppression |

### Composition
| File | Purpose |
|------|---------|
| [`src/lib/pipeline/composition/ReportComposer.ts`](src/lib/pipeline/composition/ReportComposer.ts) | Section assembly & ordering |
| [`src/lib/pipeline/composition/PlaceholderResolver.ts`](src/lib/pipeline/composition/PlaceholderResolver.ts) | `{{PLACEHOLDER}}` resolution |

### Content Storage
| File | Purpose |
|------|---------|
| [`src/lib/pipeline/content/DynamicContentStore.ts`](src/lib/pipeline/content/DynamicContentStore.ts) | Smart content resolution (cache → DB → generate) |
| [`src/lib/services/ContentService.ts`](src/lib/services/ContentService.ts) | MongoDB CRUD operations for content |
| [`src/lib/services/DerivativeContentService.ts`](src/lib/services/DerivativeContentService.ts) | Derivative synthesis caching & management |

### AI Agents
| File | Purpose |
|------|---------|
| [`src/lib/agents/content-generator/ContentGenerationAgent.ts`](src/lib/agents/content-generator/ContentGenerationAgent.ts) | LLM-based content generation |
| [`src/lib/agents/derivative-generator/`](src/lib/agents/derivative-generator/) | Multi-block content synthesis |
| [`src/lib/agents/fact-checker/FactCheckAgent.ts`](src/lib/agents/fact-checker/FactCheckAgent.ts) | Claim extraction & verification |
| [`src/lib/agents/search/SemanticSearchService.ts`](src/lib/agents/search/SemanticSearchService.ts) | Qdrant vector search |

### Quality Assurance
| File | Purpose |
|------|---------|
| [`src/lib/pipeline/qa/QAGate.ts`](src/lib/pipeline/qa/QAGate.ts) | QA orchestrator |
| [`src/lib/pipeline/qa/SemanticLeakageDetector.ts`](src/lib/pipeline/qa/SemanticLeakageDetector.ts) | Banned phrase detection |
| [`src/lib/pipeline/qa/CompositionValidator.ts`](src/lib/pipeline/qa/CompositionValidator.ts) | Section/structure validation |
| [`src/lib/qa/LLMReportEvaluator.ts`](src/lib/qa/LLMReportEvaluator.ts) | LLM-based quality scoring |

### Configuration
| File | Purpose |
|------|---------|
| [`src/lib/pipeline/config/tag-extraction-rules.json`](src/lib/pipeline/config/tag-extraction-rules.json) | Question answer → tag mappings |
| [`src/lib/pipeline/config/driver-derivation-rules.json`](src/lib/pipeline/config/driver-derivation-rules.json) | Tag → driver derivation rules |
| [`src/lib/pipeline/config/scenario-profiles.json`](src/lib/pipeline/config/scenario-profiles.json) | Scenario matching criteria |
| [`src/lib/pipeline/config/tone-profiles.json`](src/lib/pipeline/config/tone-profiles.json) | Tone profile definitions & banned words |
| [`src/lib/pipeline/config/section-composition-rules.json`](src/lib/pipeline/config/section-composition-rules.json) | Section assembly order & rules |
| [`src/lib/pipeline/config/languages.json`](src/lib/pipeline/config/languages.json) | Localized section names & confidence phrases |
| [`src/lib/config/content-registry.json`](src/lib/config/content-registry.json) | Master content catalog (all ~125 items) |

### Types
| File | Purpose |
|------|---------|
| [`src/lib/pipeline/types.ts`](src/lib/pipeline/types.ts) | Core NLG system types (drivers, tags, scenarios, etc.) |
| [`src/lib/types/types/content.ts`](src/lib/types/types/content.ts) | CMS content document & workflow types |
| [`src/lib/types/types/derivative.ts`](src/lib/types/types/derivative.ts) | Derivative content types |
| [`src/lib/types/types/report-generation.ts`](src/lib/types/types/report-generation.ts) | Report generation & SSE event types |
| [`src/lib/types/types/generation.ts`](src/lib/types/types/generation.ts) | Content generation job types |
| [`src/lib/types/types/factcheck.ts`](src/lib/types/types/factcheck.ts) | Fact-check types |
| [`src/lib/types/content-registry.ts`](src/lib/types/content-registry.ts) | Content registry types |
