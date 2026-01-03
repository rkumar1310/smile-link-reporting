# Content Format Specification

## Overview

This document defines the storage format for all 396 text pieces in the Smile-Link NLG Content Library.

---

## Content Categories

| Category | Count | Prefix | Purpose |
|----------|-------|--------|---------|
| Scenarios | 17 | `S` | Core narrative paths |
| A_* Blocks | 16 | `A_` | Safety/Warning content |
| B_* Blocks | 14 | `B_` | Content modules |
| Text Modules | 19 | `TM_` | Contextual/Risk language |
| **Total Base** | **66** | | |
| **× 6 Tones** | **396** | | All variants |

---

## Content File Structure

```
content/
├── scenarios/
│   ├── S01/
│   │   ├── manifest.json
│   │   ├── TP-01.md
│   │   ├── TP-02.md
│   │   ├── TP-03.md
│   │   ├── TP-04.md
│   │   ├── TP-05.md
│   │   └── TP-06.md
│   ├── S02/
│   │   └── ...
│   └── S17/
│       └── ...
│
├── a_blocks/
│   ├── A_WARN_ACTIVE_SYMPTOMS/
│   │   ├── manifest.json
│   │   └── TP-01.md ... TP-06.md
│   ├── A_WARN_PREGNANCY_OR_GROWTH/
│   ├── A_WARN_BIOLOGICAL_INSTABILITY/
│   ├── A_BLOCK_TREATMENT_OPTIONS/
│   └── ... (16 total)
│
├── b_blocks/
│   ├── B_CTX_SINGLE_TOOTH/
│   │   ├── manifest.json
│   │   └── TP-01.md ... TP-06.md
│   ├── B_CTX_MULTIPLE_TEETH/
│   ├── B_INTERP_STANDARD/
│   ├── B_OPT_IMPLANT/
│   ├── B_OPT_BRIDGE/
│   ├── B_COMPARE_IMPLANT_VS_BRIDGE/
│   ├── B_TRADEOFF_COST_VS_LONGEVITY/
│   ├── B_PROCESS_IMPLANT/
│   ├── B_RISKLANG_STANDARD/
│   └── ... (14 total)
│
└── modules/
    ├── TM_RISK_SMOKING/
    │   ├── manifest.json
    │   └── TP-01.md ... TP-06.md
    ├── TM_RISK_DIABETES/
    ├── TM_RISK_BONE_LOSS/
    ├── TM_CTX_FIRST_TIME/
    ├── TM_CTX_PREVIOUS_TREATMENT/
    └── ... (19 total)
```

---

## Manifest Schema

Each content piece has a `manifest.json` defining its metadata:

```json
{
  "$schema": "content-manifest-v1",
  "id": "S01",
  "type": "scenario",
  "name": "First-Time Single Implant Candidate",
  "description": "Standard path for patient considering first implant",

  "layer": "L2",
  "primary_drivers": ["profile_type", "decision_stage"],

  "applicable_sections": [2, 3, 4, 5],

  "requires_drivers": {
    "profile_type": ["first_time", "informed_explorer"],
    "mouth_situation": ["single_missing_tooth"]
  },

  "conflicts_with": ["S03", "S07"],

  "suppressed_by": {
    "A_WARN_ACTIVE_SYMPTOMS": true,
    "A_BLOCK_TREATMENT_OPTIONS": true
  },

  "placeholders": [
    {
      "key": "{{TOOTH_LOCATION}}",
      "source": "intake.tooth_location",
      "fallback": "the affected area"
    },
    {
      "key": "{{PATIENT_NAME}}",
      "source": "intake.patient_name",
      "fallback": "you"
    }
  ],

  "tone_variants": {
    "TP-01": { "file": "TP-01.md", "word_count": 245 },
    "TP-02": { "file": "TP-02.md", "word_count": 268 },
    "TP-03": { "file": "TP-03.md", "word_count": 312 },
    "TP-04": { "file": "TP-04.md", "word_count": 289 },
    "TP-05": { "file": "TP-05.md", "word_count": 276 },
    "TP-06": { "file": "TP-06.md", "word_count": 234 }
  },

  "version": "1.0.0",
  "last_updated": "2024-01-15",
  "author": "content-team"
}
```

---

## Content Text Format

Each tone variant is a Markdown file with structured sections:

### Example: `S01/TP-01.md` (Neutral-Informative)

```markdown
---
id: S01
tone: TP-01
version: 1.0.0
---

# Section 2: Personal Summary

Based on your responses, {{PATIENT_NAME}}, you are considering a dental implant for {{TOOTH_LOCATION}}. This appears to be your first experience with implant treatment.

# Section 3: Context

A single missing tooth can be addressed through several approaches. The location of {{TOOTH_LOCATION}} and your overall oral health will influence which options may be most suitable.

# Section 4: Interpretation

Your dental professional will evaluate factors including bone density, gum health, and spacing to determine the most appropriate path forward.

# Section 5: Options

For a single missing tooth, the primary treatment approaches include:
- Dental implant with crown
- Fixed bridge
- Removable partial denture

Each option has different characteristics regarding longevity, maintenance, and impact on adjacent teeth.
```

### Example: `S01/TP-04.md` (Stability-Frame - for anxious patients)

```markdown
---
id: S01
tone: TP-04
version: 1.0.0
---

# Section 2: Personal Summary

{{PATIENT_NAME}}, we understand that considering dental treatment can feel overwhelming. Based on what you've shared, you're exploring options for {{TOOTH_LOCATION}}. There's no rush to make any decisions right now.

# Section 3: Context

Many people in your situation have the same questions. A single missing tooth is one of the most common dental situations, and there are well-established approaches that have helped countless patients.

# Section 4: Interpretation

Your dental team will take time to thoroughly explain everything and answer all your questions. Nothing will happen without your full understanding and agreement.

# Section 5: Options

When you're ready to learn more, your dentist can explain the available approaches. Each option is well-proven, and together you'll find what feels right for your situation.
```

---

## A_* Block Format

Safety blocks have a simpler structure focused on warnings:

### Example: `A_WARN_ACTIVE_SYMPTOMS/manifest.json`

```json
{
  "$schema": "content-manifest-v1",
  "id": "A_WARN_ACTIVE_SYMPTOMS",
  "type": "a_block",
  "name": "Active Symptoms Warning",
  "description": "Warning for patients with current pain/infection",

  "layer": "L1",
  "trigger_drivers": {
    "clinical_priority": ["urgent", "semi_urgent"]
  },

  "target_section": 0,
  "priority": 1,

  "suppresses": {
    "sections": [5, 6, 9],
    "blocks": ["B_OPT_*", "B_COMPARE_*"]
  },

  "tone_variants": {
    "TP-01": { "file": "TP-01.md", "word_count": 89 },
    "TP-02": { "file": "TP-02.md", "word_count": 102 },
    "TP-03": { "file": "TP-03.md", "word_count": 98 },
    "TP-04": { "file": "TP-04.md", "word_count": 115 },
    "TP-05": { "file": "TP-05.md", "word_count": 94 },
    "TP-06": { "file": "TP-06.md", "word_count": 87 }
  }
}
```

### Example: `A_WARN_ACTIVE_SYMPTOMS/TP-01.md`

```markdown
---
id: A_WARN_ACTIVE_SYMPTOMS
tone: TP-01
version: 1.0.0
section: 0
---

**Important Notice**

Based on your responses, you may be experiencing symptoms that require prompt attention from your dental professional. Please prioritize scheduling an appointment to address any current discomfort or concerns before considering long-term treatment options.

This report focuses on providing context rather than treatment recommendations until your immediate needs have been assessed.
```

---

## B_* Block Format

Content blocks target specific report sections:

### Example: `B_CTX_SINGLE_TOOTH/manifest.json`

```json
{
  "$schema": "content-manifest-v1",
  "id": "B_CTX_SINGLE_TOOTH",
  "type": "b_block",
  "name": "Single Tooth Context",
  "description": "Contextual information for single tooth replacement",

  "layer": "L2",
  "trigger_drivers": {
    "mouth_situation": ["single_missing_tooth"]
  },

  "target_section": 3,
  "priority": 1,

  "combinable_with": ["TM_RISK_*", "TM_CTX_*"],

  "placeholders": [
    {
      "key": "{{TOOTH_POSITION}}",
      "source": "intake.tooth_position",
      "fallback": "the missing tooth area"
    }
  ],

  "tone_variants": {
    "TP-01": { "file": "TP-01.md", "word_count": 156 },
    "TP-02": { "file": "TP-02.md", "word_count": 178 },
    "TP-03": { "file": "TP-03.md", "word_count": 198 },
    "TP-04": { "file": "TP-04.md", "word_count": 185 },
    "TP-05": { "file": "TP-05.md", "word_count": 167 },
    "TP-06": { "file": "TP-06.md", "word_count": 149 }
  }
}
```

---

## Text Module Format

Modules are smaller, composable units:

### Example: `TM_RISK_SMOKING/manifest.json`

```json
{
  "$schema": "content-manifest-v1",
  "id": "TM_RISK_SMOKING",
  "type": "module",
  "name": "Smoking Risk Factor",
  "description": "Additional context about smoking as a risk factor",

  "layer": "L2",
  "trigger_drivers": {
    "risk_profile_biological": ["elevated", "high"]
  },
  "trigger_tags": ["smoking_yes"],

  "insert_into_sections": [3, 10],
  "insert_position": "append",

  "tone_variants": {
    "TP-01": { "file": "TP-01.md", "word_count": 67 },
    "TP-02": { "file": "TP-02.md", "word_count": 82 },
    "TP-03": { "file": "TP-03.md", "word_count": 78 },
    "TP-04": { "file": "TP-04.md", "word_count": 91 },
    "TP-05": { "file": "TP-05.md", "word_count": 75 },
    "TP-06": { "file": "TP-06.md", "word_count": 64 }
  }
}
```

### Example: `TM_RISK_SMOKING/TP-01.md`

```markdown
---
id: TM_RISK_SMOKING
tone: TP-01
version: 1.0.0
---

Smoking can affect healing and long-term success rates for certain dental procedures. Your dental professional can discuss how this factor may influence your treatment timeline and expectations.
```

---

## Placeholder System

All content supports dynamic placeholders:

| Placeholder | Source | Fallback |
|-------------|--------|----------|
| `{{PATIENT_NAME}}` | intake.patient_name | "you" |
| `{{TOOTH_LOCATION}}` | intake.tooth_location | "the affected area" |
| `{{TOOTH_POSITION}}` | intake.tooth_position | "the missing tooth" |
| `{{TREATMENT_DURATION}}` | calculated.duration | "the treatment period" |
| `{{ESTIMATED_VISITS}}` | calculated.visits | "multiple appointments" |
| `{{AGE_BRACKET}}` | derived.age_bracket | "your age group" |

### Placeholder Resolution

```typescript
function resolvePlaceholders(
  content: string,
  context: CompositionContext
): string {
  const placeholderPattern = /\{\{([A-Z_]+)\}\}/g;

  return content.replace(placeholderPattern, (match, key) => {
    const value = context.placeholders[key];
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
    // Return fallback from manifest or keep placeholder for QA flag
    return context.fallbacks[key] || match;
  });
}
```

---

## Content Index

A master index file for fast lookup:

### `content/index.json`

```json
{
  "$schema": "content-index-v1",
  "version": "1.0.0",
  "generated": "2024-01-15T10:30:00Z",

  "summary": {
    "total_base_content": 66,
    "total_with_tones": 396,
    "scenarios": 17,
    "a_blocks": 16,
    "b_blocks": 14,
    "modules": 19
  },

  "scenarios": [
    { "id": "S01", "path": "scenarios/S01/", "name": "First-Time Single Implant Candidate" },
    { "id": "S02", "path": "scenarios/S02/", "name": "Informed Explorer - Multiple Options" },
    // ... S03-S17
  ],

  "a_blocks": [
    { "id": "A_WARN_ACTIVE_SYMPTOMS", "path": "a_blocks/A_WARN_ACTIVE_SYMPTOMS/", "section": 0 },
    { "id": "A_WARN_PREGNANCY_OR_GROWTH", "path": "a_blocks/A_WARN_PREGNANCY_OR_GROWTH/", "section": 0 },
    { "id": "A_WARN_BIOLOGICAL_INSTABILITY", "path": "a_blocks/A_WARN_BIOLOGICAL_INSTABILITY/", "section": 0 },
    { "id": "A_BLOCK_TREATMENT_OPTIONS", "path": "a_blocks/A_BLOCK_TREATMENT_OPTIONS/", "section": 0 },
    // ... remaining A_* blocks
  ],

  "b_blocks": [
    { "id": "B_CTX_SINGLE_TOOTH", "path": "b_blocks/B_CTX_SINGLE_TOOTH/", "section": 3 },
    { "id": "B_CTX_MULTIPLE_TEETH", "path": "b_blocks/B_CTX_MULTIPLE_TEETH/", "section": 3 },
    { "id": "B_INTERP_STANDARD", "path": "b_blocks/B_INTERP_STANDARD/", "section": 4 },
    { "id": "B_OPT_IMPLANT", "path": "b_blocks/B_OPT_IMPLANT/", "section": 5 },
    { "id": "B_OPT_BRIDGE", "path": "b_blocks/B_OPT_BRIDGE/", "section": 5 },
    { "id": "B_COMPARE_IMPLANT_VS_BRIDGE", "path": "b_blocks/B_COMPARE_IMPLANT_VS_BRIDGE/", "section": 6 },
    { "id": "B_TRADEOFF_COST_VS_LONGEVITY", "path": "b_blocks/B_TRADEOFF_COST_VS_LONGEVITY/", "section": 7 },
    { "id": "B_PROCESS_IMPLANT", "path": "b_blocks/B_PROCESS_IMPLANT/", "section": 8 },
    { "id": "B_RISKLANG_STANDARD", "path": "b_blocks/B_RISKLANG_STANDARD/", "section": 10 },
    // ... remaining B_* blocks
  ],

  "modules": [
    { "id": "TM_RISK_SMOKING", "path": "modules/TM_RISK_SMOKING/", "sections": [3, 10] },
    { "id": "TM_RISK_DIABETES", "path": "modules/TM_RISK_DIABETES/", "sections": [3, 10] },
    { "id": "TM_RISK_BONE_LOSS", "path": "modules/TM_RISK_BONE_LOSS/", "sections": [3, 10] },
    { "id": "TM_CTX_FIRST_TIME", "path": "modules/TM_CTX_FIRST_TIME/", "sections": [3] },
    { "id": "TM_CTX_PREVIOUS_TREATMENT", "path": "modules/TM_CTX_PREVIOUS_TREATMENT/", "sections": [3] },
    // ... remaining modules
  ],

  "section_mapping": {
    "0": { "name": "Warnings", "sources": ["A_WARN_*"] },
    "1": { "name": "Disclaimer", "sources": ["static"] },
    "2": { "name": "Personal Summary", "sources": ["scenario"] },
    "3": { "name": "Context", "sources": ["B_CTX_*", "TM_CTX_*", "TM_RISK_*"] },
    "4": { "name": "Interpretation", "sources": ["B_INTERP_*"] },
    "5": { "name": "Options", "sources": ["B_OPT_*"] },
    "6": { "name": "Comparison", "sources": ["B_COMPARE_*"] },
    "7": { "name": "Trade-offs", "sources": ["B_TRADEOFF_*"] },
    "8": { "name": "Process", "sources": ["B_PROCESS_*"] },
    "9": { "name": "Costs", "sources": ["calculated", "B_COST_*"] },
    "10": { "name": "Risk Language", "sources": ["B_RISKLANG_*", "TM_RISK_*"] },
    "11": { "name": "Next Steps", "sources": ["static", "tone_specific"] }
  },

  "driver_to_content": {
    "clinical_priority": {
      "urgent": ["A_WARN_ACTIVE_SYMPTOMS"],
      "semi_urgent": ["A_WARN_ACTIVE_SYMPTOMS"]
    },
    "medical_constraints": {
      "pregnancy": ["A_WARN_PREGNANCY_OR_GROWTH"],
      "contraindicated": ["A_BLOCK_TREATMENT_OPTIONS"]
    },
    "biological_stability": {
      "unstable": ["A_WARN_BIOLOGICAL_INSTABILITY"]
    },
    "mouth_situation": {
      "single_missing_tooth": ["B_CTX_SINGLE_TOOTH"],
      "multiple_missing_teeth": ["B_CTX_MULTIPLE_TEETH"]
    },
    "risk_profile_biological": {
      "elevated": ["TM_RISK_*"],
      "high": ["TM_RISK_*"]
    }
  }
}
```

---

## Content Loader Interface

```typescript
interface ContentLoader {
  // Load single content piece with specific tone
  loadContent(id: string, tone: ToneProfileId): Promise<LoadedContent>;

  // Load manifest only (for selection logic)
  loadManifest(id: string): Promise<ContentManifest>;

  // Batch load for composition
  loadBatch(selections: ContentSelection[]): Promise<LoadedContent[]>;

  // Get all content matching driver criteria
  findByDrivers(driverState: DriverState): Promise<ContentMatch[]>;
}

interface LoadedContent {
  id: string;
  type: ContentType;
  tone: ToneProfileId;
  sections: Map<number, string>;  // section_number -> raw markdown
  placeholders: PlaceholderDef[];
  metadata: ContentManifest;
}

interface ContentMatch {
  id: string;
  type: ContentType;
  match_score: number;
  matched_drivers: string[];
  target_sections: number[];
}
```

---

## Validation Rules

Content must pass these checks:

1. **Structure Validation**
   - All 6 tone variants present
   - Valid manifest.json schema
   - All placeholders defined in manifest

2. **Content Validation**
   - No medical claims or guarantees
   - No specific pricing
   - No treatment recommendations (for A_* blocks)
   - Word count within limits

3. **Consistency Validation**
   - Same placeholders across all tones
   - Same section structure across tones
   - Tone-appropriate language verified

---

## Version Control

Each content piece tracks:
- `version`: Semantic version (1.0.0)
- `last_updated`: ISO timestamp
- `author`: Content creator ID
- `change_log`: Array of changes

Content updates require:
1. Increment version
2. Update all 6 tone variants
3. Re-run validation
4. Update index.json
