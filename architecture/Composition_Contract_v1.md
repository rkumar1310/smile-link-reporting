# Composition Contract v1.0
## Smile-Link NLG Report Assembly Rules

---

## 1. Purpose

This document defines **how** the final report is assembled from content pieces. It specifies:
- Section order (fixed structure)
- What content goes in each section
- Conditional inclusion/exclusion rules
- Cardinality limits
- Driver-based variations

---

## 2. Content Library Reference

| Type | Count | Description |
|------|-------|-------------|
| A_* blocks | 16 | Safety/warnings/overrides |
| B_* blocks | 14 | Modular content pieces |
| Scenarios (S01-S17) | 17 | Base report structures |
| Text Modules | 19 | Context/risk additions |
| Tone Variants | 6 | TP-01 to TP-06 per content piece |

**Total: 66 content pieces × 6 tones = 396 text variants**

---

## 3. Report Structure (Canonical Section Order)

The report follows a **fixed structure** with 12 sections. Each section may be populated, conditional, or suppressed based on drivers.

```
┌─────────────────────────────────────────────────────────────┐
│  SECTION 0: SAFETY WARNINGS (A_WARN_*)                      │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 1: DISCLAIMER                                       │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 2: PERSONAL SUMMARY                                 │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 3: CONTEXT (Your Situation)                         │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 4: INTERPRETATION                                   │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 5: TREATMENT OPTIONS                                │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 6: COMPARISON                                       │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 7: TRADE-OFFS                                       │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 8: PROCESS & TIMELINE                               │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 9: COSTS                                            │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 10: RISK LANGUAGE                                   │
│  ─────────────────────────────────────────────────────────  │
│  SECTION 11: NEXT STEPS                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Section Definitions

### SECTION 0: Safety Warnings
**Position:** Top of report (before everything)
**Source:** A_WARN_* blocks
**Condition:** Only if L1 safety drivers triggered

| Block | Trigger |
|-------|---------|
| A_WARN_BIOLOGICAL_INSTABILITY | `biological_stability = unstable/compromised` |
| A_WARN_MEDICAL_CONTRAINDICATION | `medical_constraints = surgical_contraindicated` |
| A_WARN_PREGNANCY_OR_GROWTH | `medical_constraints = pregnancy_related` OR `age_stage = growing` |
| A_WARN_ACTIVE_SYMPTOMS | `clinical_priority = urgent/semi_urgent` |
| A_WARN_HIGH_UNCERTAINTY | `data_confidence = low` OR multiple conflicts |

**Cardinality:** Unlimited (all triggered warnings appear)
**Order:** Severity order (most critical first)

---

### SECTION 1: Disclaimer
**Position:** After warnings, before personalized content
**Source:** Scenario disclaimer section
**Condition:** ALWAYS PRESENT (mandatory)

**Content:**
```
This report is intended solely to provide insight into possible treatment
directions and choices. It does not replace clinical examination, diagnosis,
or individual medical advice...
```

**Cardinality:** Exactly 1
**Variations:** None (same text for all scenarios, but tone variant applies)

---

### SECTION 2: Personal Summary
**Position:** After disclaimer
**Source:** Scenario personal summary section
**Condition:** ALWAYS PRESENT

**Content varies by scenario:**
- S01: "You are mainly bothered by the color of your teeth..."
- S02: "You are missing one tooth in a visible zone..."
- S12: "You are experiencing pain, infection, or loose teeth..."

**Cardinality:** Exactly 1
**Driver influence:** Scenario selection determines content

---

### SECTION 3: Context (Your Situation)
**Position:** After personal summary
**Source:** B_CTX_* blocks + Text Modules + Scenario situation section
**Condition:** ALWAYS PRESENT (but content varies)

**Components:**

| Component | Condition |
|-----------|-----------|
| B_CTX_MOUTH_SITUATION | `mouth_situation != unknown` |
| B_CTX_COMPLEXITY_LEVEL | `complexity_level = low/medium/high` |
| B_CTX_VISIBILITY_FUNCTION | `zone_type = visible/functional/mixed` |
| Text Module (pregnancy) | `medical_constraints = pregnancy_related` |
| Text Module (diabetes) | `medical_condition = diabetes` |
| Text Module (smoking) | `smoking = weekly/daily` |
| Text Module (bruxism) | `tooth_health_bruxism = true` |
| Text Module (anxiety) | `anxiety_level = severe` |
| Scenario situation section | Always (from matched scenario) |

**Cardinality:**
- B_CTX_*: Max 3
- Text Modules: Max 4
- Scenario section: Exactly 1

**Order:** B_CTX_* first → Text Modules → Scenario section

---

### SECTION 4: Interpretation
**Position:** After context, before options
**Source:** B_INTERP_* blocks
**Condition:** Always present (frames expectations)

| Block | Condition |
|-------|-----------|
| B_INTERP_EXPECTATION_SCOPE | Always |
| B_INTERP_DECISION_PRESSURE | `option_count > 1` |

**Cardinality:** Max 2
**Suppression:** If `A_BLOCK_TREATMENT_OPTIONS` active → use neutral framing only

---

### SECTION 5: Treatment Options
**Position:** Core of report
**Source:** B_OPT_PRIMARY_* + B_OPT_ALT_* + Scenario options section
**Condition:** Only if NOT blocked by L1

**Components:**

| Component | Condition | Cardinality |
|-----------|-----------|-------------|
| B_OPT_PRIMARY_GENERAL | `option_primary_allowed = true` | Max 1 |
| B_OPT_ALT_GENERAL | `option_alt_allowed = true` | Max 1 |
| Scenario Option 1 | From matched scenario | 1 |
| Scenario Option 2 | From matched scenario (if exists) | 0-1 |

**Suppression Rules:**
```
IF A_BLOCK_TREATMENT_OPTIONS active:
  → Suppress entire section
  → Replace with: "To avoid misinterpretations, this report does not
    detail treatment options in your situation..."

IF clinical_priority = urgent:
  → Suppress detailed options
  → Show only: "Please consult a professional first"
```

**Cardinality:** Max 1 primary + Max 1 alternative

---

### SECTION 6: Comparison
**Position:** After options
**Source:** B_COMPARE_* blocks
**Condition:** Only if 2+ options shown

| Block | Condition |
|-------|-----------|
| B_COMPARE_OPTIONS | `option_count >= 2` AND `comparison_disabled = false` |

**Suppression Rules:**
```
IF A_LIMIT_COMPARATIVE_FRAMING active:
  → Suppress comparative language
  → Use neutral descriptive comparison only

IF option_count < 2:
  → Suppress entire section
```

**Cardinality:** Max 1

---

### SECTION 7: Trade-offs
**Position:** After comparison
**Source:** B_TRADEOFF_* blocks
**Condition:** Only if trade-off detected

| Block | Condition |
|-------|-----------|
| B_TRADEOFF_BALANCE | `tradeoff_detected = true` |

**Suppression Rules:**
```
IF A_BLOCK_TREATMENT_OPTIONS active:
  → Suppress (no options = no trade-offs)

IF A_LIMIT_COMPARATIVE_FRAMING active:
  → Modify language to avoid preference
```

**Cardinality:** Max 1

---

### SECTION 8: Process & Timeline
**Position:** After trade-offs
**Source:** B_PROCESS_* blocks + Scenario process section
**Condition:** Only if options shown

| Component | Condition |
|-----------|-----------|
| B_PROCESS_GENERAL_FLOW | `process_info_allowed = true` |
| Scenario duration section | From matched scenario |
| Scenario recovery section | From matched scenario |

**Suppression Rules:**
```
IF A_BLOCK_TREATMENT_OPTIONS active:
  → Suppress detailed process
  → Show only generic: "Treatment processes vary by individual situation"
```

**Cardinality:** Max 1 B_PROCESS + scenario sections

---

### SECTION 9: Costs
**Position:** After process
**Source:** B_RISKLANG_COSTS + Scenario cost section
**Condition:** Only if NOT blocked

| Component | Condition |
|-----------|-----------|
| B_RISKLANG_COSTS | `cost_info_present = true` |
| Scenario cost indication | From matched scenario |

**Suppression Rules:**
```
IF A_BLOCK_COST_ESTIMATES active:
  → Suppress entire section
  → Replace with: "Cost estimates depend heavily on clinical findings
    and cannot be reliably determined based on a questionnaire..."

IF clinical_priority = urgent:
  → Suppress (not relevant for acute situations)

IF biological_stability = unstable:
  → Add disclaimer about cost uncertainty
```

**Cardinality:** Max 1

---

### SECTION 10: Risk Language
**Position:** Near end, before next steps
**Source:** B_RISKLANG_* blocks
**Condition:** ALWAYS PRESENT (legal protection)

| Block | Condition |
|-------|-----------|
| B_RISKLANG_GENERAL | Always |

**Content:**
```
Dental treatments always involve uncertainties, and results can vary
from person to person. This report uses only general and conditional
statements and does not replace professional advice.
```

**Cardinality:** Exactly 1
**Suppression:** Never (legally required)

---

### SECTION 11: Next Steps
**Position:** Final section
**Source:** Scenario next steps section
**Condition:** ALWAYS PRESENT

**Content varies by scenario and drivers:**

| Condition | Next Steps Focus |
|-----------|------------------|
| `clinical_priority = urgent` | "Seek professional evaluation immediately" |
| `decision_stage = exploring` | "Consider these questions for your consultation..." |
| `decision_stage = ready` | "You may want to schedule a consultation..." |
| `autonomy_level = autonomous` | "You can use this information to..." |

**Cardinality:** Exactly 1
**Tone:** Always TP-06 (Autonomy-Respecting) for this section

---

## 5. Cardinality Summary

| Content Type | Min | Max | Notes |
|--------------|-----|-----|-------|
| A_WARN_* | 0 | 5 | All triggered warnings appear |
| A_BLOCK_* | 0 | 3 | Suppress other sections |
| A_LIMIT_* | 0 | 2 | Modify language in sections |
| A_CONFLICT_* | 0 | 3 | Add conflict explanations |
| B_CTX_* | 1 | 3 | Context blocks |
| B_INTERP_* | 1 | 2 | Interpretation blocks |
| B_OPT_PRIMARY_* | 0 | 1 | Primary option |
| B_OPT_ALT_* | 0 | 1 | Alternative option |
| B_COMPARE_* | 0 | 1 | Comparison |
| B_TRADEOFF_* | 0 | 1 | Trade-off |
| B_PROCESS_* | 0 | 1 | Process flow |
| B_RISKLANG_* | 1 | 2 | Risk language (required) |
| B_SYNTHESIS_* | 0 | 1 | Summary |
| Text Modules | 0 | 4 | Context/risk modules |
| Scenario Sections | 5 | 10 | From matched scenario |

---

## 6. L1 Override Effects on Composition

When L1 blocks are active, they affect the entire composition:

### A_BLOCK_TREATMENT_OPTIONS Active
```
Suppress:
  - SECTION 5 (Treatment Options) → Replace with block message
  - SECTION 6 (Comparison) → Remove entirely
  - SECTION 7 (Trade-offs) → Remove entirely
  - SECTION 8 (Process) → Simplify to generic
  - SECTION 9 (Costs) → Remove entirely

Keep:
  - SECTION 0-4 (Warnings, Disclaimer, Summary, Context, Interpretation)
  - SECTION 10-11 (Risk Language, Next Steps)
```

### A_BLOCK_COST_ESTIMATES Active
```
Suppress:
  - SECTION 9 (Costs) → Replace with block message

Keep:
  - All other sections
```

### A_BLOCK_RECOMMENDATION_LANGUAGE Active
```
Modify:
  - All sections: Remove any "recommended", "best", "suitable" language
  - SECTION 5: Present options without preference
  - SECTION 6: Descriptive only, no ranking
```

### A_LIMIT_COMPARATIVE_FRAMING Active
```
Modify:
  - SECTION 6: Neutral comparison only
  - SECTION 7: Factual trade-offs only
  - All sections: Avoid "better", "safer", "more suitable"
```

### A_LIMIT_CERTAINTY_LANGUAGE Active
```
Modify:
  - All sections: Avoid absolutes
  - Add hedging: "typically", "often", "may", "can vary"
```

---

## 7. Driver-Based Section Variations

### By clinical_priority

| Value | Effect |
|-------|--------|
| `urgent` | Warnings first, options suppressed, "seek help" focus |
| `semi_urgent` | Warnings + limited options + urgency framing |
| `elective` | Full report with all sections |

### By profile_type

| Value | Effect |
|-------|--------|
| `aesthetic` | Emphasize appearance outcomes in options |
| `functional` | Emphasize durability/comfort in options |
| `mixed` | Balance both aspects |
| `comfort` | Focus on ease and maintenance |

### By decision_stage

| Value | Effect |
|-------|--------|
| `exploring` | More context, educational tone, no pressure |
| `comparing` | Detailed comparison, trade-offs emphasized |
| `ready` | Streamlined, action-oriented next steps |

### By anxiety_level

| Value | Effect |
|-------|--------|
| `none` | TP-01 (Neutral) throughout |
| `mild` | TP-02 (Empathic) for context/options |
| `severe` | TP-02 throughout, simplify technical details |

### By budget_type

| Value | Effect |
|-------|--------|
| `premium` | Include premium options, detailed quality info |
| `balanced` | Show range of options |
| `economy` | Focus on cost-effective solutions |
| `unknown` | Present options without cost emphasis |

---

## 8. Conflict Block Insertion

When A_CONFLICT_* blocks are active, they insert explanations:

### A_CONFLICT_TOOTH_STATUS
**Insert in:** SECTION 3 (Context)
**Content:** Explains that answers don't fully align, system is being cautious

### A_CONFLICT_SYMPTOM_PRIORITY
**Insert in:** SECTION 4 (Interpretation)
**Content:** Explains aesthetic + clinical concerns need professional prioritization

### A_CONFLICT_BUDGET_VS_RISK
**Insert in:** SECTION 9 (Costs) or SECTION 5 (Options)
**Content:** Explains that budget discussion requires medical feasibility first

---

## 9. Tone Application Rules

Each section gets a tone variant based on L3 drivers:

| Condition | Tone Profile | Applied To |
|-----------|--------------|------------|
| Default (no C_* drivers) | TP-01 Neutral | All sections |
| `anxiety_level = mild/severe` | TP-02 Empathic | Sections 2-8 |
| Decision overload detected | TP-03 Reflective | Sections 4-7 |
| Control/anxiety drivers | TP-04 Stability | Sections 3-5 |
| Past disappointment | TP-05 Expectation | Sections 5-8 |
| Final section | TP-06 Autonomy | Section 11 always |

**Rule:** One dominant tone per report, except Section 11 which always uses TP-06.

---

## 10. Assembly Algorithm

```
FUNCTION AssembleReport(matched_scenario, driver_state, active_blocks):

  report = []

  # SECTION 0: Safety Warnings
  FOR each A_WARN_* in active_blocks:
    report.append(A_WARN_*.get_variant(tone))

  # SECTION 1: Disclaimer (always)
  report.append(scenario.disclaimer.get_variant(tone))

  # SECTION 2: Personal Summary (always)
  report.append(scenario.personal_summary.get_variant(tone))

  # SECTION 3: Context
  IF NOT data_confidence_low:
    FOR each B_CTX_* triggered:
      report.append(B_CTX_*.get_variant(tone))
    FOR each TextModule triggered (max 4):
      report.append(TextModule.get_variant(tone))
    report.append(scenario.situation.get_variant(tone))

  # SECTION 4: Interpretation
  report.append(B_INTERP_EXPECTATION_SCOPE.get_variant(tone))
  IF option_count > 1:
    report.append(B_INTERP_DECISION_PRESSURE.get_variant(tone))

  # SECTION 5: Treatment Options
  IF A_BLOCK_TREATMENT_OPTIONS NOT active:
    report.append(B_OPT_PRIMARY.get_variant(tone))
    IF option_alt_allowed:
      report.append(B_OPT_ALT.get_variant(tone))
    report.append(scenario.options.get_variant(tone))
  ELSE:
    report.append(A_BLOCK_TREATMENT_OPTIONS.get_variant(tone))

  # SECTION 6: Comparison
  IF option_count >= 2 AND comparison_allowed:
    report.append(B_COMPARE_OPTIONS.get_variant(tone))

  # SECTION 7: Trade-offs
  IF tradeoff_detected AND options_shown:
    report.append(B_TRADEOFF_BALANCE.get_variant(tone))

  # SECTION 8: Process
  IF options_shown:
    report.append(B_PROCESS_GENERAL_FLOW.get_variant(tone))
    report.append(scenario.duration.get_variant(tone))
    report.append(scenario.recovery.get_variant(tone))

  # SECTION 9: Costs
  IF A_BLOCK_COST_ESTIMATES NOT active AND options_shown:
    report.append(B_RISKLANG_COSTS.get_variant(tone))
    report.append(scenario.costs.get_variant(tone))
  ELSE IF A_BLOCK_COST_ESTIMATES active:
    report.append(A_BLOCK_COST_ESTIMATES.get_variant(tone))

  # SECTION 10: Risk Language (always)
  report.append(B_RISKLANG_GENERAL.get_variant(tone))

  # SECTION 11: Next Steps (always, TP-06)
  report.append(scenario.next_steps.get_variant(TP-06))

  RETURN report
```

---

## 11. Output Contract

The assembled report must satisfy:

```yaml
ReportContract:
  has_disclaimer: true (always)
  has_risk_language: true (always)
  has_next_steps: true (always)

  max_warnings: 5
  max_options: 2 (1 primary + 1 alternative)
  max_text_modules: 4

  if_l1_block_active:
    has_treatment_options: false
    has_cost_estimates: false (if cost block)
    has_comparison: false

  tone_consistent: true (one dominant tone, except section 11)

  word_count_range: 400-1200 words
  reading_level: accessible (no jargon without explanation)
```

---

## 12. Validation Checklist

Before finalizing report:

- [ ] Disclaimer present
- [ ] Risk language present
- [ ] Next steps present
- [ ] No recommendation language if A_BLOCK active
- [ ] No comparative framing if A_LIMIT active
- [ ] Cardinality limits respected
- [ ] Tone consistent throughout
- [ ] All placeholders filled
- [ ] No contradictory content
- [ ] L1 overrides enforced

---

## Appendix: Section × Content Matrix

| Section | Scenario | A_* | B_* | Text Module | Tone |
|---------|----------|-----|-----|-------------|------|
| 0. Warnings | - | A_WARN_* | - | - | Selected |
| 1. Disclaimer | ✓ | - | - | - | Selected |
| 2. Summary | ✓ | - | - | - | Selected |
| 3. Context | ✓ | A_CONFLICT_* | B_CTX_* | ✓ | Selected |
| 4. Interpretation | - | - | B_INTERP_* | - | Selected |
| 5. Options | ✓ | A_BLOCK_* | B_OPT_* | - | Selected |
| 6. Comparison | - | A_LIMIT_* | B_COMPARE_* | - | Selected |
| 7. Trade-offs | - | A_LIMIT_* | B_TRADEOFF_* | - | Selected |
| 8. Process | ✓ | - | B_PROCESS_* | - | Selected |
| 9. Costs | ✓ | A_BLOCK_* | B_RISKLANG_COSTS | - | Selected |
| 10. Risk Lang | - | - | B_RISKLANG_GEN | - | Selected |
| 11. Next Steps | ✓ | - | - | - | TP-06 |
