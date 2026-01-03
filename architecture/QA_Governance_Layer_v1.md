# QA & Governance Layer (Phase 4) v1.0
## Smile-Link NLG Report - Audit, Traceability & Quality Assurance

---

## 1. Purpose

This layer ensures every generated report is:
- **Traceable**: Full decision trail from input to output
- **Auditable**: Every choice can be explained and justified
- **Testable**: Regressions are caught before deployment
- **Compliant**: Legal and safety rules are enforced
- **Explainable**: Why this report, why these blocks, why this tone

---

## 2. Phase 4 in the Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: Intake & DriverState                                  │
│  Phase 2: Safety & Content Selection                            │
│  Phase 3: Language Packaging (Composition)                      │
│  Phase 4: QA & Governance  ◄─── THIS DOCUMENT                   │
└─────────────────────────────────────────────────────────────────┘
```

Phase 4 runs **after** the report is assembled but **before** it's delivered.

---

## 3. Components

### 3.1 Decision Trace Collector
### 3.2 Semantic Leakage Detector
### 3.3 Regression Test Runner
### 3.4 Audit Record Store
### 3.5 QA Summary Generator

---

## 4. Decision Trace Collector

### 4.1 What It Captures

Every report generation produces a **DecisionTrace** object:

```yaml
DecisionTrace:
  # Metadata
  trace_id: "uuid-v4"
  session_id: "user-session-id"
  timestamp: "2024-01-15T14:30:00Z"
  system_version: "1.2.3"
  content_version: "2024-01-10"

  # Phase 1: Input
  input_trace:
    raw_answers:
      Q1: "Missing teeth + aesthetic"
      Q2: 4
      Q2a: "Both"
      Q3: "Missing/damaged teeth"
      Q5: "No, aesthetic only"
      Q6a: "One tooth missing"
      Q6b: "Front teeth"
      # ... all 18 questions
    metadata:
      language: "nl"
      country: "BE"
      intake_complete: true

  # Phase 1: Tags
  tag_trace:
    tags_extracted:
      - motivation_combination
      - satisfaction_major_dissatisfaction
      - bother_combination
      - issue_missing_damaged
      - no_acute_issues
      - status_single_missing
      - location_anterior
      # ... all tags

  # Phase 1: Drivers
  driver_trace:
    driver_state:
      # L1 Drivers
      clinical_priority: { value: "elective", confidence: "CONFIRMED", source: ["Q5"] }
      biological_stability: { value: "stable", confidence: "INFERRED", source: ["Q15", "Q6c"] }
      mouth_situation: { value: "single_missing_tooth", confidence: "CONFIRMED", source: ["Q6a"] }
      age_stage: { value: "adult", confidence: "CONFIRMED", source: ["Q9", "Q16a"] }
      medical_constraints: { value: "none", confidence: "CONFIRMED", source: ["Q13", "Q17"] }
      treatment_viability: { value: "single_site", confidence: "CONFIRMED", source: ["Q6a"] }
      risk_profile_biological: { value: "low", confidence: "INFERRED", source: ["Q14", "Q15"] }
      # L2 Drivers
      profile_type: { value: "mixed", confidence: "CONFIRMED", source: ["Q1", "Q2a"] }
      aesthetic_tolerance: { value: "moderate", confidence: "INFERRED", source: ["Q7", "Q8"] }
      expectation_risk: { value: "moderate", confidence: "INFERRED", source: ["Q2"] }
      experience_history: { value: "first_timer", confidence: "CONFIRMED", source: ["Q4"] }
      decision_stage: { value: "comparing", confidence: "INFERRED", source: ["Q11", "Q12"] }
      autonomy_level: { value: "collaborative", confidence: "INFERRED", source: ["Q11"] }
      # L3 Drivers
      anxiety_level: { value: "none", confidence: "CONFIRMED", source: ["Q18"] }
      information_depth: { value: "standard", confidence: "INFERRED", source: ["Q11"] }
      budget_type: { value: "balanced", confidence: "CONFIRMED", source: ["Q10"] }
      treatment_philosophy: { value: "balanced", confidence: "INFERRED", source: ["Q7"] }
      time_horizon: { value: "short_term", confidence: "CONFIRMED", source: ["Q12"] }

    conflicts_detected:
      - type: "none"

    fallbacks_applied:
      - driver: "aesthetic_tolerance"
        reason: "No explicit answer, inferred from Q7+Q8"
        default_value: "moderate"

  # Phase 2: Scenario Scoring
  scenario_trace:
    scores:
      S01: { score: -Infinity, reason: "EXCLUDED: mouth_situation mismatch" }
      S02: { score: 8, reason: "MATCH: required + 2 strong + 2 supporting" }
      S03: { score: -Infinity, reason: "EXCLUDED: location mismatch" }
      S04: { score: -Infinity, reason: "EXCLUDED: mouth_situation mismatch" }
      S05: { score: -Infinity, reason: "EXCLUDED: mouth_situation mismatch" }
      S06: { score: 5, reason: "PARTIAL: required match, fewer strong" }
      # ... all 17 scenarios
    matched_scenario: "S02"
    match_confidence: "HIGH"
    runner_up: "S06"

  # Phase 2: Block Selection
  block_trace:
    l1_check:
      A_WARN_active: []
      A_BLOCK_active: []
      A_LIMIT_active: []
      A_CONFLICT_active: []
      suppression_policy: "none"

    blocks_selected:
      - block_id: "B_CTX_MOUTH_SITUATION"
        reason: "mouth_situation != unknown"
      - block_id: "B_CTX_VISIBILITY_FUNCTION"
        reason: "zone_type = visible"
      - block_id: "B_INTERP_EXPECTATION_SCOPE"
        reason: "always included"
      - block_id: "B_INTERP_DECISION_PRESSURE"
        reason: "option_count > 1"
      - block_id: "B_OPT_PRIMARY_GENERAL"
        reason: "option_primary_allowed = true"
      - block_id: "B_OPT_ALT_GENERAL"
        reason: "option_alt_allowed = true"
      - block_id: "B_COMPARE_OPTIONS"
        reason: "option_count >= 2"
      - block_id: "B_PROCESS_GENERAL_FLOW"
        reason: "process_info_allowed = true"
      - block_id: "B_RISKLANG_GENERAL"
        reason: "always included"
      - block_id: "B_RISKLANG_COSTS"
        reason: "cost_info_present = true"

    blocks_suppressed:
      - block_id: "B_TRADEOFF_BALANCE"
        reason: "tradeoff_detected = false"
      - block_id: "B_SYNTHESIS_SUMMARY"
        reason: "driver_count < 2 complex"

    text_modules_selected:
      - module_id: "Module_13_Functional_vs_Aesthetic"
        reason: "profile_type = mixed"

    cardinality_enforced:
      - rule: "B_OPT_PRIMARY max 1"
        result: "PASS"
      - rule: "B_OPT_ALT max 1"
        result: "PASS"

  # Phase 3: Tone & Composition
  tone_trace:
    dominant_tone: "TP-01"
    reason: "anxiety_level = none, no C_* drivers"
    per_section_tone:
      section_0: null  # no warnings
      section_1: "TP-01"
      section_2: "TP-01"
      section_3: "TP-01"
      section_4: "TP-01"
      section_5: "TP-01"
      section_6: "TP-01"
      section_7: null  # suppressed
      section_8: "TP-01"
      section_9: "TP-01"
      section_10: "TP-01"
      section_11: "TP-06"  # always autonomy

  composition_trace:
    sections_included: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]
    sections_suppressed:
      - section: 0
        reason: "no A_WARN blocks active"
      - section: 7
        reason: "tradeoff_detected = false"
    word_count: 847
    validation_passed: true

  # Final Output Reference
  output_trace:
    report_hash: "sha256:abc123..."
    report_length: 847
    sections_count: 10
```

### 4.2 Trace Storage

```
Storage Requirements:
- Retain traces for: 7 years (legal compliance)
- Format: JSON (structured, queryable)
- Indexed by: trace_id, session_id, timestamp, matched_scenario
- Searchable by: any driver value, any block selected/suppressed
```

---

## 5. Semantic Leakage Detector

### 5.1 Purpose

Detect when the report contains language that **violates L1 rules**:
- Recommendation language when A_BLOCK_RECOMMENDATION_LANGUAGE active
- Comparative framing when A_LIMIT_COMPARATIVE_FRAMING active
- Certainty language when A_LIMIT_CERTAINTY_LANGUAGE active

### 5.2 Forbidden Patterns

```yaml
SemanticLeakageRules:

  # When A_BLOCK_RECOMMENDATION_LANGUAGE active
  recommendation_language:
    forbidden_patterns:
      - "we recommend"
      - "you should"
      - "best option"
      - "best choice"
      - "ideal solution"
      - "most suitable"
      - "we advise"
      - "our recommendation"
      - "the right choice"
    context: "any"

  # When A_LIMIT_COMPARATIVE_FRAMING active
  comparative_framing:
    forbidden_patterns:
      - "better than"
      - "worse than"
      - "superior"
      - "inferior"
      - "preferred"
      - "safest"
      - "most effective"
      - "best results"
      - "higher quality"
      - "more reliable"
    context: "comparison sections"

  # When A_LIMIT_CERTAINTY_LANGUAGE active
  certainty_language:
    forbidden_patterns:
      - "will definitely"
      - "guaranteed"
      - "always works"
      - "100%"
      - "certainly"
      - "without doubt"
      - "absolutely"
      - "never fails"
    context: "any"

  # Always forbidden (regardless of L1)
  medical_claims:
    forbidden_patterns:
      - "this will cure"
      - "this will fix"
      - "you need this treatment"
      - "diagnosis:"
      - "we diagnose"
      - "your condition is"
    context: "any"

  # CTA language (forbidden in most contexts)
  call_to_action:
    forbidden_patterns:
      - "book now"
      - "schedule immediately"
      - "act now"
      - "don't wait"
      - "contact us today"
    context: "any except next_steps with high intent"
```

### 5.3 Leakage Check Algorithm

```python
def check_semantic_leakage(report_text, active_l1_blocks, trace):
    violations = []

    # Check recommendation language
    if "A_BLOCK_RECOMMENDATION_LANGUAGE" in active_l1_blocks:
        for pattern in recommendation_language.forbidden_patterns:
            if pattern.lower() in report_text.lower():
                violations.append({
                    "type": "RECOMMENDATION_LEAKAGE",
                    "pattern": pattern,
                    "rule": "A_BLOCK_RECOMMENDATION_LANGUAGE",
                    "severity": "HIGH"
                })

    # Check comparative framing
    if "A_LIMIT_COMPARATIVE_FRAMING" in active_l1_blocks:
        for pattern in comparative_framing.forbidden_patterns:
            if pattern.lower() in report_text.lower():
                violations.append({
                    "type": "COMPARATIVE_LEAKAGE",
                    "pattern": pattern,
                    "rule": "A_LIMIT_COMPARATIVE_FRAMING",
                    "severity": "MEDIUM"
                })

    # Check certainty language
    if "A_LIMIT_CERTAINTY_LANGUAGE" in active_l1_blocks:
        for pattern in certainty_language.forbidden_patterns:
            if pattern.lower() in report_text.lower():
                violations.append({
                    "type": "CERTAINTY_LEAKAGE",
                    "pattern": pattern,
                    "rule": "A_LIMIT_CERTAINTY_LANGUAGE",
                    "severity": "MEDIUM"
                })

    # Always check medical claims
    for pattern in medical_claims.forbidden_patterns:
        if pattern.lower() in report_text.lower():
            violations.append({
                "type": "MEDICAL_CLAIM_VIOLATION",
                "pattern": pattern,
                "rule": "GLOBAL_MEDICAL_SAFETY",
                "severity": "CRITICAL"
            })

    return violations
```

### 5.4 Leakage Response

```yaml
LeakageResponse:
  CRITICAL:
    action: "BLOCK_REPORT"
    notify: ["qa_team", "legal"]
    log: "immediate"
    fallback: "generic_safe_report"

  HIGH:
    action: "BLOCK_REPORT"
    notify: ["qa_team"]
    log: "immediate"
    fallback: "regenerate_with_stricter_rules"

  MEDIUM:
    action: "FLAG_FOR_REVIEW"
    notify: ["content_team"]
    log: "batch_daily"
    fallback: "deliver_with_warning"

  LOW:
    action: "LOG_ONLY"
    notify: []
    log: "batch_weekly"
    fallback: "deliver_as_is"
```

---

## 6. Regression Test Runner

### 6.1 Purpose

Ensure that known input combinations produce expected outputs. Catch regressions before deployment.

### 6.2 Test Case Structure

```yaml
TestCase:
  test_id: "TC-S02-001"
  description: "Single missing tooth, front zone, aesthetic priority, no complications"

  input:
    Q1: "Missing teeth + aesthetic"
    Q2: 5
    Q2a: "Both"
    Q3: "Missing/damaged teeth"
    Q5: "No, aesthetic only"
    Q6a: "One tooth missing"
    Q6b: "Front teeth"
    Q6c: "Intact"
    Q7: "Natural and subtle"
    Q8: "Very important, natural"
    Q9: "30-45"
    Q10: "Price-quality, flexible"
    Q11: "Yes, for best result"
    Q12: "6 months"
    Q13: "No"
    Q14: "No"
    Q15: "Good"
    Q16a: "No"
    Q16b: "No"
    Q17: "No"
    Q18: "No"

  expected:
    scenario: "S02"
    scenario_confidence: "HIGH"

    drivers:
      clinical_priority: "elective"
      mouth_situation: "single_missing_tooth"
      profile_type: "mixed"
      anxiety_level: "none"

    blocks_must_include:
      - "B_CTX_MOUTH_SITUATION"
      - "B_OPT_PRIMARY_GENERAL"
      - "B_OPT_ALT_GENERAL"
      - "B_RISKLANG_GENERAL"

    blocks_must_exclude:
      - "A_WARN_*"
      - "A_BLOCK_*"

    sections_must_include: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]

    tone: "TP-01"

    text_must_contain:
      - "single tooth"
      - "implant"
      - "bridge"

    text_must_not_contain:
      - "urgent"
      - "pain"
      - "infection"
      - "we recommend"

  tags: ["scenario_s02", "happy_path", "no_complications"]
```

### 6.3 Test Categories

```yaml
TestCategories:

  # One per scenario - basic happy path
  scenario_coverage:
    count: 17
    description: "Each scenario has at least one golden test case"

  # L1 safety triggers
  safety_triggers:
    count: 20+
    tests:
      - "urgent_pain_triggers_S12"
      - "pregnancy_blocks_treatment_options"
      - "medical_contraindication_blocks_surgery"
      - "unstable_biology_adds_warning"
      - "growth_incomplete_blocks_implants"

  # Edge cases
  edge_cases:
    count: 30+
    tests:
      - "all_questions_unanswered_fallback"
      - "conflicting_answers_conflict_block"
      - "maximum_severity_all_warnings"
      - "minimum_input_generic_report"

  # Tone variations
  tone_coverage:
    count: 12+
    tests:
      - "severe_anxiety_empathic_tone"
      - "decision_overload_reflective_tone"
      - "past_disappointment_expectation_tone"

  # Language compliance
  language_compliance:
    count: 10+
    tests:
      - "no_recommendation_when_blocked"
      - "no_comparative_when_limited"
      - "no_medical_claims_ever"
```

### 6.4 Test Runner Output

```yaml
TestRunResult:
  run_id: "TR-2024-01-15-001"
  timestamp: "2024-01-15T15:00:00Z"
  system_version: "1.2.3"
  content_version: "2024-01-10"

  summary:
    total_tests: 89
    passed: 86
    failed: 2
    skipped: 1

  failures:
    - test_id: "TC-S12-003"
      expected_scenario: "S12"
      actual_scenario: "S02"
      reason: "clinical_priority not correctly derived from Q5"

    - test_id: "TC-TONE-007"
      expected_tone: "TP-02"
      actual_tone: "TP-01"
      reason: "anxiety_level = mild not triggering empathic tone"

  skipped:
    - test_id: "TC-NEW-001"
      reason: "New scenario S18 not yet implemented"

  recommendation: "BLOCK_DEPLOYMENT"

  diff_from_previous:
    new_failures: 1
    resolved_failures: 0
    unchanged_failures: 1
```

---

## 7. Audit Record Store

### 7.1 What Gets Stored

```yaml
AuditRecord:
  # Identity
  record_id: "AR-uuid"
  trace_id: "reference to DecisionTrace"

  # Timestamps
  created_at: "2024-01-15T14:30:00Z"

  # Input Summary
  input_hash: "sha256 of raw answers"
  question_count: 18

  # Decision Summary
  matched_scenario: "S02"
  scenario_confidence: "HIGH"
  l1_blocks_active: []
  l2_blocks_selected: ["B_CTX_*", "B_OPT_*", ...]
  tone_applied: "TP-01"

  # Output Summary
  report_hash: "sha256 of final report"
  word_count: 847
  sections_included: [1, 2, 3, 4, 5, 6, 8, 9, 10, 11]

  # Compliance
  leakage_check: "PASS"
  validation_check: "PASS"

  # Flags
  flags: []
  review_required: false
```

### 7.2 Retention Policy

```yaml
RetentionPolicy:
  standard_records:
    retention: "7 years"
    reason: "Legal compliance, medical context"

  flagged_records:
    retention: "10 years"
    reason: "Potential dispute resolution"

  test_records:
    retention: "2 years"
    reason: "Development and debugging"

  anonymization:
    after: "7 years"
    fields_removed: ["session_id", "raw_answers"]
    fields_kept: ["scenario", "blocks", "validation"]
```

### 7.3 Query Capabilities

```yaml
AuditQueries:
  # Find all reports for a scenario
  by_scenario:
    example: "SELECT * WHERE matched_scenario = 'S12'"

  # Find all reports with warnings
  by_warnings:
    example: "SELECT * WHERE l1_blocks_active CONTAINS 'A_WARN_*'"

  # Find all flagged reports
  by_flags:
    example: "SELECT * WHERE review_required = true"

  # Find reports in date range
  by_date:
    example: "SELECT * WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31'"

  # Find reports with specific driver values
  by_driver:
    example: "SELECT * WHERE driver_state.clinical_priority = 'urgent'"

  # Aggregate: scenario distribution
  scenario_distribution:
    example: "SELECT matched_scenario, COUNT(*) GROUP BY matched_scenario"

  # Aggregate: warning frequency
  warning_frequency:
    example: "SELECT l1_blocks_active, COUNT(*) GROUP BY l1_blocks_active"
```

---

## 8. QA Summary Generator

### 8.1 Per-Report QA Summary

```yaml
QASummary:
  report_id: "RPT-uuid"

  checks:
    - check: "Disclaimer present"
      status: "PASS"

    - check: "Risk language present"
      status: "PASS"

    - check: "Next steps present"
      status: "PASS"

    - check: "L1 overrides enforced"
      status: "PASS"
      details: "No L1 blocks active"

    - check: "Cardinality respected"
      status: "PASS"
      details: "1 primary option, 1 alternative"

    - check: "Semantic leakage"
      status: "PASS"
      details: "No forbidden patterns detected"

    - check: "Tone consistency"
      status: "PASS"
      details: "TP-01 throughout, TP-06 on final section"

    - check: "Word count in range"
      status: "PASS"
      details: "847 words (range: 400-1200)"

  overall_status: "PASS"
  delivery_approved: true
```

### 8.2 Batch QA Report (Daily/Weekly)

```yaml
BatchQAReport:
  period: "2024-01-15"

  volume:
    total_reports: 1247
    passed: 1241
    flagged: 4
    blocked: 2

  scenario_distribution:
    S01: 156
    S02: 289
    S03: 134
    S04: 87
    S05: 45
    S06: 198
    # ... etc

  warning_frequency:
    A_WARN_BIOLOGICAL_INSTABILITY: 23
    A_WARN_ACTIVE_SYMPTOMS: 67
    A_WARN_PREGNANCY_OR_GROWTH: 12
    # ... etc

  leakage_incidents:
    total: 2
    details:
      - type: "COMPARATIVE_LEAKAGE"
        count: 1
        pattern: "better than"
        resolved: true
      - type: "CERTAINTY_LEAKAGE"
        count: 1
        pattern: "guaranteed"
        resolved: true

  tone_distribution:
    TP-01: 987
    TP-02: 198
    TP-03: 34
    TP-04: 21
    TP-05: 7

  average_word_count: 723

  flagged_for_review:
    - report_id: "RPT-001"
      reason: "Unusual driver combination"
    - report_id: "RPT-002"
      reason: "Edge case scenario match"

  blocked_reports:
    - report_id: "RPT-003"
      reason: "Medical claim detected"
    - report_id: "RPT-004"
      reason: "Recommendation language with L1 block active"

  recommendations:
    - "Review content for scenario S06 - high volume, check quality"
    - "Investigate comparative leakage in B_COMPARE block"
```

---

## 9. Integration Points

### 9.1 Pipeline Integration

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Phase 1   │───▶│   Phase 2   │───▶│   Phase 3   │───▶│   Phase 4   │
│   Intake    │    │  Selection  │    │ Composition │    │     QA      │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                │
                   ┌────────────────────────────────────────────┘
                   │
                   ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                        QA GATE                                │
    │                                                               │
    │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
    │   │   Trace     │   │  Leakage    │   │  Validate   │       │
    │   │  Collector  │   │  Detector   │   │  Contract   │       │
    │   └─────────────┘   └─────────────┘   └─────────────┘       │
    │          │                 │                 │               │
    │          └────────────┬────┴────────────────┘               │
    │                       ▼                                      │
    │              ┌─────────────────┐                            │
    │              │   QA Decision   │                            │
    │              └────────┬────────┘                            │
    │                       │                                      │
    │         ┌─────────────┼─────────────┐                       │
    │         ▼             ▼             ▼                       │
    │      [PASS]       [FLAG]       [BLOCK]                      │
    │         │             │             │                       │
    │         ▼             ▼             ▼                       │
    │    [Deliver]    [Review +     [Fallback                     │
    │                  Deliver]      Report]                      │
    │                                                              │
    └──────────────────────────────────────────────────────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │     Audit Record        │
                   │        Store            │
                   └─────────────────────────┘
```

### 9.2 API Endpoints (Conceptual)

```yaml
Endpoints:

  # Generate report with full QA
  POST /api/report/generate:
    input: QuestionnaireAnswers
    output: Report + QASummary

  # Get trace for a report
  GET /api/trace/{trace_id}:
    output: DecisionTrace

  # Get audit record
  GET /api/audit/{record_id}:
    output: AuditRecord

  # Run regression tests
  POST /api/qa/regression:
    output: TestRunResult

  # Get batch QA report
  GET /api/qa/report/{date}:
    output: BatchQAReport

  # Query audit records
  POST /api/audit/query:
    input: QueryParameters
    output: AuditRecord[]
```

---

## 10. Governance Rules

### 10.1 Change Control

```yaml
ChangeControl:
  content_changes:
    - type: "New scenario"
      requires: ["QA approval", "Legal review", "Regression tests pass"]

    - type: "New A_* block"
      requires: ["QA approval", "Legal review"]

    - type: "Tone variant update"
      requires: ["QA approval"]

    - type: "Driver logic change"
      requires: ["QA approval", "Full regression"]

  deployment_gates:
    - gate: "All regression tests pass"
      blocking: true

    - gate: "No CRITICAL leakage in last 7 days"
      blocking: true

    - gate: "Legal sign-off on content changes"
      blocking: true
```

### 10.2 Escalation Paths

```yaml
EscalationPaths:
  leakage_critical:
    notify: ["qa_lead", "legal", "product_owner"]
    sla: "1 hour"

  leakage_high:
    notify: ["qa_lead", "content_lead"]
    sla: "4 hours"

  regression_failure:
    notify: ["qa_lead", "dev_lead"]
    sla: "same day"

  unusual_scenario_volume:
    notify: ["product_owner", "content_lead"]
    sla: "next business day"
```

---

## 11. Metrics & Monitoring

### 11.1 Key Metrics

```yaml
Metrics:
  # Quality
  leakage_rate: "leakage incidents / total reports"
  validation_pass_rate: "passed / total reports"
  flag_rate: "flagged / total reports"
  block_rate: "blocked / total reports"

  # Coverage
  scenario_coverage: "scenarios used / total scenarios"
  warning_trigger_rate: "reports with warnings / total reports"

  # Performance
  avg_generation_time: "ms from input to output"
  avg_qa_time: "ms for QA checks"

  # Trends
  leakage_trend: "weekly comparison"
  scenario_distribution_shift: "weekly comparison"
```

### 11.2 Alerts

```yaml
Alerts:
  - name: "High leakage rate"
    condition: "leakage_rate > 0.1%"
    severity: "HIGH"

  - name: "Regression test failure"
    condition: "any test fails"
    severity: "HIGH"

  - name: "Unusual S12 volume"
    condition: "S12_count > 2x average"
    severity: "MEDIUM"

  - name: "Low validation rate"
    condition: "validation_pass_rate < 99%"
    severity: "MEDIUM"
```

---

## 12. Output Contract

```yaml
Phase4OutputContract:
  # Every report must have
  required:
    - decision_trace: "complete trace object"
    - qa_summary: "all checks performed"
    - audit_record: "stored for compliance"

  # Delivery decision
  delivery_status:
    - APPROVED: "all checks pass"
    - FLAGGED: "delivered with review flag"
    - BLOCKED: "not delivered, fallback used"

  # Trace completeness
  trace_must_include:
    - input_trace
    - tag_trace
    - driver_trace
    - scenario_trace
    - block_trace
    - tone_trace
    - composition_trace
    - output_trace
```
