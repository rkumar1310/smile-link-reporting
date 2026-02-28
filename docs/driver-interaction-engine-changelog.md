# Driver Interaction Engine — Implementation Report

**Date:** 2026-02-28
**Status:** Implemented and build-verified

---

## What changed

Previously all 21 drivers were derived independently from tags. There was no cross-driver awareness.
A patient with gum recession and a Hollywood smile preference received the same expectation framing as one without recession. The system now has a driver interaction layer that closes these gaps.

This update implements everything requested in the driver feedback review:
- 3 weak link fixes
- 7 refinements
- 3 new drivers
- 2 boolean flags
- 23 interaction rules
- 6 mandatory test cases

No new tags. No mapping changes. No changes to QA_Mapping or Master_Tagmapping.
Everything is deterministic. No LLM involvement. No treatment recommendations.

---

## Bug fixes

### Text module selection was silently broken

Three incorrect string values in the text module selector meant certain modules never triggered:

1. **Diabetes/medical banner** was matching on a tag name that does not exist. Now matches on the correct tag from Q17.
2. **Detailed modules** (TM_ variants) never activated because the system checked for a value "deep" that the information_depth driver does not produce. Now correctly checks for "detailed."
3. **Nuance blocks** only triggered on "high" expectation risk because the system checked for "elevated" — a value that expectation_risk does not have. Now correctly triggers on both "moderate" and "high."

### WEAK LINK 2 — treatment_viability
**PROBLEM**
status_no_missing was grouped with status_single_missing under single_site.
Patients with no missing teeth were assigned implant viability, which is semantically incorrect.

**RESOLVED**
status_no_missing now maps to conditional.
status_single_missing remains single_site.
Implant viability only applies when teeth are actually missing.

### WEAK LINK 3 — risk_profile_biological
**PROBLEM**
history_periodontal did not influence risk_profile_biological.
A patient with periodontal history could still have low biological risk if hygiene was good and no smoking.

**RESOLVED**
history_periodontal now results in at least elevated biological risk, regardless of hygiene or smoking status.

### WEAK LINK 1 — biological_stability
**PROBLEM**
status_no_missing could automatically result in stable, even with bruxism, recession, or moderate hygiene.

**RESOLVED**
The interaction engine downgrades stable to moderate when recession or bruxism is present.
The derivation rule engine does not support negation (NOT tag), so this correction is handled in the interaction layer.

---

## New drivers

Three new L2 drivers were added. All are derived from existing tags — no new tags needed.

### zone_priority
Activates location as a semantic driver for communication.

| Condition | Value |
|-----------|-------|
| location_anterior | aesthetic_zone |
| location_posterior | functional_zone |
| location_both | mixed_zone |
| Fallback | mixed_zone |

### periodontal_esthetic_tension
Captures mismatch between periodontal health and aesthetic ambitions.

| Condition | Value |
|-----------|-------|
| issue_gum_recession OR history_periodontal | high |
| hygiene_basic OR hygiene_irregular | moderate |
| Fallback | low |

Additionally: gum recession in the anterior zone forces tension to high regardless of other factors.

### budget_complexity_tension
Captures mismatch between case complexity and budget constraints.

| Condition | Value |
|-----------|-------|
| full_mouth_compromised AND budget_conscious | high |
| 5+ missing AND budget_conscious | moderate |
| full_mouth_compromised AND budget_balanced | moderate |
| Fallback | low |

When high, a dedicated budget complexity module is included in the report.

---

## Boolean flags

Two flags were added to the driver state. Flags are boolean, trigger specific modules or suppress language patterns, and never modify other drivers.

| Flag | Trigger | Purpose |
|------|---------|---------|
| expectation_budget_tension | economy budget AND high expectation risk | Communication framing for unrealistic expectations on a tight budget |
| urgency_language_suppressed | any medical constraint present | Suppresses urgency language when medical factors limit treatment options |

---

## Driver Interaction Engine

New component. Sits between driver derivation and scenario scoring in the pipeline.

### How it works
- Clones the driver state (never mutates the original)
- Processes rules in strict priority order across 4 tiers
- Uses severity ordering for "minimum" constraints (only upgrades, never downgrades)
- Logs every modification with rule ID, previous value, new value, and reason
- Fully deterministic — no LLM, no randomness

### Priority structure

**P1 — Safety Hard Overrides**
Reserved. Handled by the existing derivation rules. Never overridden by L2 or L3 logic.

**P2 — Structural Clinical Overrides (3 rules)**

| Condition | Effect |
|-----------|--------|
| Recession or bruxism present + stability = stable | Stability downgraded to moderate |
| Periodontal history present | Biological risk >= elevated |
| No missing teeth + viability = single_site | Viability set to conditional |

**P3 — Tension Drivers (14 rules)**

Periodontal-esthetic tension:

| Condition | Effect |
|-----------|--------|
| Gum recession + anterior zone | Periodontal tension = high (priority override) |
| High periodontal tension + aggressive aesthetics | Expectation risk = high |
| High periodontal tension | Philosophy = balanced |

Bruxism:

| Condition | Effect |
|-----------|--------|
| Bruxism present | Philosophy = durability_focused |
| Bruxism + aesthetic maximalist | Philosophy = balanced (safeguard) |
| Bruxism + aggressive aesthetics | Expectation risk >= moderate |
| Bruxism + full mouth compromised | Biological risk >= elevated |

Budget complexity:

| Condition | Effect |
|-----------|--------|
| High budget-complexity tension | Information depth = detailed |
| High budget-complexity tension | Autonomy = collaborative |
| High budget-complexity tension | Expectation risk >= moderate |

Zone priority:

| Condition | Effect |
|-----------|--------|
| Functional zone | Philosophy = durability_focused |
| Aesthetic zone + aggressive tolerance | Expectation risk >= moderate |

Broader expectation:

| Condition | Effect |
|-----------|--------|
| Aggressive + major dissatisfaction | Expectation risk = high |
| Economy budget + high expectation risk | Flag: expectation_budget_tension = true |

**P4 — Communication Overrides (6 rules)**

These only adjust communication framing. They never modify L1 clinical drivers.

| Condition | Effect |
|-----------|--------|
| Surgical contraindicated | Information depth = detailed, autonomy = collaborative |
| Pregnancy related | Time horizon = undefined |
| Possible constraints | Information depth >= standard |
| Any medical constraint | Flag: urgency language suppressed |
| Severe anxiety | Information depth cannot be summary, autonomy = collaborative |
| Severe anxiety + full mouth | Information depth = detailed |

---

## Pipeline position

The interaction engine runs as Phase 2.5:

```
Phase 0  Input Validation
Phase 1  Tag Extraction
Phase 2  Driver Derivation
Phase 2.5  Driver Interaction Engine  <-- NEW
Phase 3  Scenario Scoring
Phase 4  NLG Template Rendering
```

All downstream phases (scenario scoring, NLG rendering) use the enriched driver state.
The audit record stores the full interaction trail for traceability.

---

## Test cases

Six mandatory test cases implemented, each with full questionnaire input and expected outputs.

### TC-01: Front zone + aggressive + recession
**Input tags:** location_anterior, issue_gum_recession, style_hollywood, natural_priority_low
**Expected:**
- zone_priority = aesthetic_zone
- periodontal_esthetic_tension = high
- expectation_risk >= moderate
- treatment_philosophy = balanced

### TC-02: Full mouth + economy
**Input tags:** status_full_mouth_compromised, budget_conscious
**Expected:**
- budget_complexity_tension = high
- information_depth = detailed
- autonomy_level = collaborative

### TC-03: Bruxism + Hollywood
**Input tags:** tooth_health_bruxism, style_hollywood
**Expected:**
- treatment_philosophy = durability_focused
- expectation_risk >= moderate

### TC-04: Surgical contraindicated
**Input tags:** medical_contraindication
**Expected:**
- information_depth = detailed
- autonomy_level = collaborative
- urgency_language_suppressed = true

### TC-05: Severe anxiety + full mouth
**Input tags:** anxiety_severe, status_full_mouth_compromised
**Expected:**
- information_depth = detailed (NOT summary)
- autonomy_level = collaborative

Without the interaction engine, intent_high + timeline_urgent would produce information_depth = summary.
That is communicatively unsafe for a severely anxious patient facing full-mouth treatment.

### TC-06: No missing teeth
**Input tags:** status_no_missing
**Expected:**
- treatment_viability = conditional (NOT single_site)
- biological_stability is not automatically stable when recession/bruxism present

---

## What was NOT changed

- No new tags
- No changes to tag extraction rules
- No changes to QA_Mapping_v2 or Master_Tagmapping_v3
- No changes to scenario definitions or scoring logic
- No changes to NLG templates or variable resolution
- No generative interpretation
- No medical recommendations
- Everything remains deterministic

---

## Open item

The content documents for budget complexity (FB_BANNER_BUDGET_COMPLEXITY and TM_20_BUDGET_COMPLEXITY) need to be authored and added to MongoDB. The trigger is wired but the content does not exist yet.
