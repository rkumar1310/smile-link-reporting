# Implementation TODO List

## Overview

This document provides a granular task list for implementing the Smile-Link NLG Report Generation System based on the completed architecture.

---

## Phase 1: Content Authoring

### 1.1 Create Fallback Content Blocks

| Task | How | Expected Output |
|------|-----|-----------------|
| **1.1.1** Create `A_WARN_INCOMPLETE_ASSESSMENT` | Write warning text for missing L1 driver data. 6 tone variants. Use empathic language acknowledging incomplete info. | `content/a_blocks/A_WARN_INCOMPLETE_ASSESSMENT/` with manifest.json + TP-01.md through TP-06.md |
| **1.1.2** Create `A_DISCLAIMER_GENERIC_REPORT` | Write disclaimer explaining report is generic due to insufficient data. 6 tone variants. | `content/a_blocks/A_DISCLAIMER_GENERIC_REPORT/` with manifest.json + 6 tone files |
| **1.1.3** Create `A_DISCLAIMER_CONSULT_REQUIRED` | Write strong recommendation to consult dental professional. 6 tone variants. | `content/a_blocks/A_DISCLAIMER_CONSULT_REQUIRED/` with manifest.json + 6 tone files |
| **1.1.4** Create `A_GENERIC_WARNING` | Generic safety warning fallback. 6 tone variants. | `content/a_blocks/A_GENERIC_WARNING/` with manifest.json + 6 tone files |
| **1.1.5** Create `B_CTX_GENERAL` | Generic context block for unknown mouth situation. 6 tone variants. | `content/b_blocks/B_CTX_GENERAL/` with manifest.json + 6 tone files |
| **1.1.6** Create `B_INTERP_GENERIC` | Generic interpretation block. 6 tone variants. | `content/b_blocks/B_INTERP_GENERIC/` with manifest.json + 6 tone files |
| **1.1.7** Create `S00_GENERIC` scenario | Full generic scenario with all sections. 6 tone variants. | `content/scenarios/S00/` with manifest.json + 6 tone files |

---

### 1.2 Create A_* Safety Blocks (16 blocks × 6 tones = 96 texts)

| Task | How | Expected Output |
|------|-----|-----------------|
| **1.2.1** Create `A_WARN_ACTIVE_SYMPTOMS` | Write warning for patients with current pain/infection. Reference `clinical_priority=urgent`. 6 tones. | `content/a_blocks/A_WARN_ACTIVE_SYMPTOMS/` |
| **1.2.2** Create `A_WARN_PREGNANCY_OR_GROWTH` | Write warning for pregnancy/growth considerations. Reference `medical_constraints=pregnancy`. 6 tones. | `content/a_blocks/A_WARN_PREGNANCY_OR_GROWTH/` |
| **1.2.3** Create `A_WARN_BIOLOGICAL_INSTABILITY` | Write warning for unstable biological conditions. Reference `biological_stability=unstable`. 6 tones. | `content/a_blocks/A_WARN_BIOLOGICAL_INSTABILITY/` |
| **1.2.4** Create `A_BLOCK_TREATMENT_OPTIONS` | Write block explaining why options cannot be shown. Reference `medical_constraints=contraindicated`. 6 tones. | `content/a_blocks/A_BLOCK_TREATMENT_OPTIONS/` |
| **1.2.5** Create `A_WARN_AGE_CONSIDERATIONS` | Write age-related considerations. Reference `age_stage`. 6 tones. | `content/a_blocks/A_WARN_AGE_CONSIDERATIONS/` |
| **1.2.6** Create `A_WARN_MEDICAL_REVIEW` | Write warning requiring medical review. Reference `medical_constraints=possible_constraints`. 6 tones. | `content/a_blocks/A_WARN_MEDICAL_REVIEW/` |
| **1.2.7** Create `A_WARN_RISK_FACTORS` | Write warning about elevated risk factors. Reference `risk_profile_biological=high`. 6 tones. | `content/a_blocks/A_WARN_RISK_FACTORS/` |
| **1.2.8** Create `A_WARN_TREATMENT_VIABILITY` | Write warning about conditional treatment viability. Reference `treatment_viability=conditional`. 6 tones. | `content/a_blocks/A_WARN_TREATMENT_VIABILITY/` |
| **1.2.9-1.2.16** Create remaining 8 A_* blocks | Review original documents for additional safety scenarios. Each with 6 tones. | 8 additional `content/a_blocks/A_*/` directories |

---

### 1.3 Create B_* Content Blocks (14 blocks × 6 tones = 84 texts)

| Task | How | Expected Output |
|------|-----|-----------------|
| **1.3.1** Create `B_CTX_SINGLE_TOOTH` | Context for single missing tooth. Reference `mouth_situation=single_missing_tooth`. 6 tones. | `content/b_blocks/B_CTX_SINGLE_TOOTH/` |
| **1.3.2** Create `B_CTX_MULTIPLE_TEETH` | Context for multiple missing teeth. Reference `mouth_situation=multiple_missing_teeth`. 6 tones. | `content/b_blocks/B_CTX_MULTIPLE_TEETH/` |
| **1.3.3** Create `B_INTERP_STANDARD` | Standard interpretation of dental situation. 6 tones. | `content/b_blocks/B_INTERP_STANDARD/` |
| **1.3.4** Create `B_OPT_IMPLANT` | Implant option description. 6 tones. | `content/b_blocks/B_OPT_IMPLANT/` |
| **1.3.5** Create `B_OPT_BRIDGE` | Bridge option description. 6 tones. | `content/b_blocks/B_OPT_BRIDGE/` |
| **1.3.6** Create `B_OPT_DENTURE` | Denture option description. 6 tones. | `content/b_blocks/B_OPT_DENTURE/` |
| **1.3.7** Create `B_COMPARE_IMPLANT_VS_BRIDGE` | Comparison of implant vs bridge. 6 tones. | `content/b_blocks/B_COMPARE_IMPLANT_VS_BRIDGE/` |
| **1.3.8** Create `B_TRADEOFF_COST_VS_LONGEVITY` | Trade-off analysis cost vs longevity. 6 tones. | `content/b_blocks/B_TRADEOFF_COST_VS_LONGEVITY/` |
| **1.3.9** Create `B_PROCESS_IMPLANT` | Implant process description. 6 tones. | `content/b_blocks/B_PROCESS_IMPLANT/` |
| **1.3.10** Create `B_PROCESS_BRIDGE` | Bridge process description. 6 tones. | `content/b_blocks/B_PROCESS_BRIDGE/` |
| **1.3.11** Create `B_RISKLANG_STANDARD` | Standard risk language. 6 tones. | `content/b_blocks/B_RISKLANG_STANDARD/` |
| **1.3.12** Create `B_RISKLANG_ELEVATED` | Elevated risk language. 6 tones. | `content/b_blocks/B_RISKLANG_ELEVATED/` |
| **1.3.13-1.3.14** Create remaining B_* blocks | Review original documents for additional content blocks. 6 tones each. | 2 additional `content/b_blocks/B_*/` directories |

---

### 1.4 Create Text Modules (19 modules × 6 tones = 114 texts)

| Task | How | Expected Output |
|------|-----|-----------------|
| **1.4.1** Create `TM_RISK_SMOKING` | Smoking risk factor text. Triggered by tag `smoking_yes`. 6 tones. | `content/modules/TM_RISK_SMOKING/` |
| **1.4.2** Create `TM_RISK_DIABETES` | Diabetes risk factor text. Triggered by tag `diabetes_yes`. 6 tones. | `content/modules/TM_RISK_DIABETES/` |
| **1.4.3** Create `TM_RISK_BONE_LOSS` | Bone loss risk factor text. 6 tones. | `content/modules/TM_RISK_BONE_LOSS/` |
| **1.4.4** Create `TM_RISK_GUM_DISEASE` | Gum disease risk factor text. 6 tones. | `content/modules/TM_RISK_GUM_DISEASE/` |
| **1.4.5** Create `TM_CTX_FIRST_TIME` | First-time patient context. Reference `experience_history=no_history`. 6 tones. | `content/modules/TM_CTX_FIRST_TIME/` |
| **1.4.6** Create `TM_CTX_PREVIOUS_TREATMENT` | Previous treatment context. Reference `experience_history=positive_history`. 6 tones. | `content/modules/TM_CTX_PREVIOUS_TREATMENT/` |
| **1.4.7** Create `TM_CTX_NEGATIVE_HISTORY` | Negative history context. Reference `experience_history=negative_history`. 6 tones. | `content/modules/TM_CTX_NEGATIVE_HISTORY/` |
| **1.4.8** Create `TM_BUDGET_LIMITED` | Limited budget context. Reference `budget_type=limited`. 6 tones. | `content/modules/TM_BUDGET_LIMITED/` |
| **1.4.9** Create `TM_BUDGET_FLEXIBLE` | Flexible budget context. Reference `budget_type=flexible`. 6 tones. | `content/modules/TM_BUDGET_FLEXIBLE/` |
| **1.4.10** Create `TM_BUDGET_PREMIUM` | Premium budget context. Reference `budget_type=premium`. 6 tones. | `content/modules/TM_BUDGET_PREMIUM/` |
| **1.4.11** Create `TM_TIME_URGENT` | Urgent timeline context. Reference `time_horizon=urgent`. 6 tones. | `content/modules/TM_TIME_URGENT/` |
| **1.4.12** Create `TM_TIME_FLEXIBLE` | Flexible timeline context. Reference `time_horizon=flexible`. 6 tones. | `content/modules/TM_TIME_FLEXIBLE/` |
| **1.4.13** Create `TM_PHILOSOPHY_CONSERVATIVE` | Conservative treatment philosophy. Reference `treatment_philosophy=conservative`. 6 tones. | `content/modules/TM_PHILOSOPHY_CONSERVATIVE/` |
| **1.4.14** Create `TM_PHILOSOPHY_PROACTIVE` | Proactive treatment philosophy. Reference `treatment_philosophy=proactive`. 6 tones. | `content/modules/TM_PHILOSOPHY_PROACTIVE/` |
| **1.4.15-1.4.19** Create remaining 5 TM_* modules | Review original documents for additional modules. 6 tones each. | 5 additional `content/modules/TM_*/` directories |

---

### 1.5 Create Scenarios (17 scenarios × 6 tones = 102 texts)

| Task | How | Expected Output |
|------|-----|-----------------|
| **1.5.1** Create `S01` scenario | First-time single implant candidate. Map from scenario profiles Excel. 6 tones. | `content/scenarios/S01/` |
| **1.5.2** Create `S02` scenario | Informed explorer - multiple options. 6 tones. | `content/scenarios/S02/` |
| **1.5.3** Create `S03` scenario | Based on scenario profiles. 6 tones. | `content/scenarios/S03/` |
| **1.5.4-1.5.17** Create `S04-S17` scenarios | Map each from scenario profiles Excel. Each with 6 tones. | `content/scenarios/S04/` through `content/scenarios/S17/` |

---

### 1.6 Create Static Content

| Task | How | Expected Output |
|------|-----|-----------------|
| **1.6.1** Create Section 1 Disclaimer | Standard legal disclaimer. 6 tone variants. | `content/static/SEC1_DISCLAIMER/` |
| **1.6.2** Create Section 11 Next Steps base | Base next steps text. Always uses TP-06 tone. | `content/static/SEC11_NEXT_STEPS/` |
| **1.6.3** Create Confidence Badge texts | Text for HIGH/MEDIUM/LOW/FALLBACK confidence levels. | `content/static/CONFIDENCE_BADGES/` |
| **1.6.4** Create Uncertainty Phrases | Uncertainty language injection texts per confidence level. | `content/static/UNCERTAINTY_PHRASES/` |

---

## Phase 2: Content Infrastructure

### 2.1 Build Content Storage

| Task | How | Expected Output |
|------|-----|-----------------|
| **2.1.1** Create content directory structure | Run script to create `content/scenarios/`, `content/a_blocks/`, `content/b_blocks/`, `content/modules/`, `content/static/` directories. | Empty directory tree matching content_format_spec.md |
| **2.1.2** Create manifest.json template | Create JSON template file with all required fields from content_format_spec.md. | `templates/manifest_template.json` |
| **2.1.3** Create tone file template | Create markdown template with front matter. | `templates/tone_template.md` |
| **2.1.4** Build manifest validation script | Write script (TypeScript/Python) to validate manifest.json against schema. Check required fields, valid references. | `scripts/validate_manifest.ts` - exits 0 if valid, 1 if errors with details |
| **2.1.5** Build content index generator | Write script to scan all content directories and generate `content/index.json`. | `scripts/generate_index.ts` - outputs `content/index.json` |

---

### 2.2 Build Content Loader

| Task | How | Expected Output |
|------|-----|-----------------|
| **2.2.1** Implement `ContentLoader` interface | Create TypeScript class implementing interface from data_structures.md. Methods: `loadContent()`, `loadManifest()`, `loadBatch()`, `findByDrivers()`. | `src/content/ContentLoader.ts` |
| **2.2.2** Implement manifest caching | Add in-memory cache for manifests to avoid repeated file reads. LRU cache with configurable size. | Cache integrated into ContentLoader, ~100ms load time for batch operations |
| **2.2.3** Implement tone fallback chain | When requested tone missing, try fallback chain: TP-04→TP-02→TP-01, etc. Log fallback events. | Fallback logic in ContentLoader, never throws "tone not found" |
| **2.2.4** Implement placeholder extraction | Parse markdown files and extract all `{{PLACEHOLDER}}` patterns. Validate against manifest definitions. | `src/content/PlaceholderExtractor.ts` |
| **2.2.5** Write ContentLoader unit tests | Test all methods, edge cases, fallback behavior. Use mock content files. | `tests/content/ContentLoader.test.ts` - 100% coverage |

---

## Phase 3: Core Engine

### 3.1 Build Tag Extraction

| Task | How | Expected Output |
|------|-----|-----------------|
| **3.1.1** Implement `TagExtractor` class | Create class that takes question answers and returns extracted tags. Use mapping from Question_Tag_Driver_Scenario_Matrix.md Part 1. | `src/engine/TagExtractor.ts` |
| **3.1.2** Define tag extraction rules | Create config file with Q→A→Tags mapping. JSON format for easy updates. | `config/tag_extraction_rules.json` |
| **3.1.3** Handle multi-select questions | Some questions allow multiple answers. Extract all applicable tags. | TagExtractor handles arrays, returns union of tags |
| **3.1.4** Write TagExtractor unit tests | Test all 18 questions with all answer options. | `tests/engine/TagExtractor.test.ts` |

---

### 3.2 Build Driver Derivation

| Task | How | Expected Output |
|------|-----|-----------------|
| **3.2.1** Implement `DriverDeriver` class | Create class that takes tags and derives 18 drivers. Use mapping from Matrix doc Part 2. | `src/engine/DriverDeriver.ts` |
| **3.2.2** Define driver derivation rules | Create config file with Tag→Driver mapping. Include layer assignment (L1/L2/L3). | `config/driver_derivation_rules.json` |
| **3.2.3** Implement fallback values | When tags insufficient for driver, apply fallback from Fallback_Matrix. | DriverDeriver returns value + source (derived/fallback) |
| **3.2.4** Implement conflict detection | Detect when tags produce conflicting driver values. Flag for resolution. | Conflicts array in DriverState output |
| **3.2.5** Write DriverDeriver unit tests | Test derivation, fallbacks, conflicts. | `tests/engine/DriverDeriver.test.ts` |

---

### 3.3 Build Scenario Scoring

| Task | How | Expected Output |
|------|-----|-----------------|
| **3.3.1** Implement `ScenarioScorer` class | Create class that scores all scenarios against DriverState. Use algorithm from Matrix doc Part 4. | `src/engine/ScenarioScorer.ts` |
| **3.3.2** Define scenario scoring profiles | Create config file with all 17 scenarios and their required/strong/supporting/excluding drivers. | `config/scenario_profiles.json` |
| **3.3.3** Implement scoring algorithm | Required = must match. Strong = +3. Supporting = +1. Excluding = -∞. | `scoreScenario(driverState, scenarioProfile): number` |
| **3.3.4** Implement confidence calculation | Score ≥8 = HIGH, 5-7 = MEDIUM, 3-4 = LOW, <3 = try fallback. | Confidence level in scoring result |
| **3.3.5** Implement fallback cascade | When no match: relax matching → archetype matching → S00_GENERIC. | Never returns "no scenario" - always a result |
| **3.3.6** Write ScenarioScorer unit tests | Test all scenarios, edge cases, fallback cascade. | `tests/engine/ScenarioScorer.test.ts` |

---

### 3.4 Build Conflict Resolution

| Task | How | Expected Output |
|------|-----|-----------------|
| **3.4.1** Implement `ConflictResolver` class | Create class that resolves driver conflicts per Fallback_Matrix Section 6. | `src/engine/ConflictResolver.ts` |
| **3.4.2** Define conflict resolution rules | Create config with known conflict pairs and resolutions. | `config/conflict_resolution_rules.json` |
| **3.4.3** Implement layer hierarchy | L1 > L2 > L3 for conflict resolution. | Layer-based resolution logic |
| **3.4.4** Implement safety-first rule | Safety-critical drivers always win within same layer. | Safety flag in driver definition |
| **3.4.5** Write ConflictResolver unit tests | Test all conflict scenarios from Fallback_Matrix. | `tests/engine/ConflictResolver.test.ts` |

---

### 3.5 Build Tone Selector

| Task | How | Expected Output |
|------|-----|-----------------|
| **3.5.1** Implement `ToneSelector` class | Create class implementing `selectToneProfile()` from data_structures.md. | `src/engine/ToneSelector.ts` |
| **3.5.2** Implement priority order | TP-04 > TP-05 > TP-02 > TP-03 > TP-01 per spec. | Correct tone selection based on drivers |
| **3.5.3** Implement Section 11 override | Section 11 (Next Steps) always uses TP-06 regardless of selection. | Override in composition, not selector |
| **3.5.4** Write ToneSelector unit tests | Test all trigger combinations. | `tests/engine/ToneSelector.test.ts` |

---

### 3.6 Build Content Selector

| Task | How | Expected Output |
|------|-----|-----------------|
| **3.6.1** Implement `ContentSelector` class | Create class that selects A_*, B_*, TM_* blocks based on DriverState and matched scenario. | `src/engine/ContentSelector.ts` |
| **3.6.2** Implement L1 override check | Check L1 drivers for warnings/blocks. Apply suppression rules. | Suppression list in selection result |
| **3.6.3** Implement block selection per section | For each section (0-11), select appropriate blocks. | Map<SectionNumber, BlockId[]> |
| **3.6.4** Implement cardinality enforcement | Max 1 primary option, max 1 alt per Composition_Contract. | Cardinality violations flagged |
| **3.6.5** Write ContentSelector unit tests | Test selection logic, suppression, cardinality. | `tests/engine/ContentSelector.test.ts` |

---

## Phase 4: Composition Engine

### 4.1 Build Report Composer

| Task | How | Expected Output |
|------|-----|-----------------|
| **4.1.1** Implement `ReportComposer` class | Create class that assembles final report from selected content. | `src/composition/ReportComposer.ts` |
| **4.1.2** Implement section ordering | Enforce 0-11 section order per Composition_Contract. | Sections always in correct order |
| **4.1.3** Implement conditional sections | Sections 5,6,7,8,9 conditional based on L1 override. | Sections omitted when blocked |
| **4.1.4** Implement content merging | Merge scenario sections + B_* blocks + TM_* modules per section. | Single coherent text per section |
| **4.1.5** Write ReportComposer unit tests | Test assembly, ordering, merging. | `tests/composition/ReportComposer.test.ts` |

---

### 4.2 Build Placeholder Resolver

| Task | How | Expected Output |
|------|-----|-----------------|
| **4.2.1** Implement `PlaceholderResolver` class | Create class that replaces `{{PLACEHOLDER}}` with actual values. | `src/composition/PlaceholderResolver.ts` |
| **4.2.2** Define placeholder sources | Map placeholders to intake data, calculated values, derived values. | `config/placeholder_sources.json` |
| **4.2.3** Implement fallback values | When value missing, use fallback from manifest. | Never leaves raw `{{PLACEHOLDER}}` in output |
| **4.2.4** Implement unresolved detection | Flag any placeholders that couldn't be resolved even with fallback. | Unresolved list for QA |
| **4.2.5** Write PlaceholderResolver unit tests | Test resolution, fallbacks, edge cases. | `tests/composition/PlaceholderResolver.test.ts` |

---

### 4.3 Build Uncertainty Injector

| Task | How | Expected Output |
|------|-----|-----------------|
| **4.3.1** Implement `UncertaintyInjector` class | Create class that injects uncertainty language based on confidence level. | `src/composition/UncertaintyInjector.ts` |
| **4.3.2** Define injection points | Determine where uncertainty phrases are inserted (section starts, specific patterns). | Injection rules in config |
| **4.3.3** Implement confidence badges | Add confidence badge to report header based on level. | Badge text in report metadata |
| **4.3.4** Write UncertaintyInjector unit tests | Test all confidence levels. | `tests/composition/UncertaintyInjector.test.ts` |

---

## Phase 5: QA & Governance

### 5.1 Build Trace Collector

| Task | How | Expected Output |
|------|-----|-----------------|
| **5.1.1** Implement `TraceCollector` class | Create class that records all decisions made during report generation. | `src/qa/TraceCollector.ts` |
| **5.1.2** Define trace schema | Use DecisionTrace interface from QA_Governance_Layer. | TypeScript types for all trace events |
| **5.1.3** Implement event recording | Record: tag extraction, driver derivation, scenario scoring, content selection, tone selection, composition. | Chronological event log |
| **5.1.4** Implement trace serialization | Serialize trace to JSON for storage. | `toJSON()` method on trace |
| **5.1.5** Write TraceCollector unit tests | Test event recording, serialization. | `tests/qa/TraceCollector.test.ts` |

---

### 5.2 Build Semantic Leakage Detector

| Task | How | Expected Output |
|------|-----|-----------------|
| **5.2.1** Implement `SemanticLeakageDetector` class | Create class that scans report for banned phrases. | `src/qa/SemanticLeakageDetector.ts` |
| **5.2.2** Define banned phrase lists | Use banned_lexical_set from each ToneProfile. Add global bans. | `config/banned_phrases.json` |
| **5.2.3** Implement pattern matching | Regex-based matching for banned phrases. Case-insensitive. | List of violations found |
| **5.2.4** Implement severity classification | Classify violations as WARNING (minor) or BLOCK (critical). | Severity in violation result |
| **5.2.5** Write SemanticLeakageDetector unit tests | Test all banned phrases, edge cases. | `tests/qa/SemanticLeakageDetector.test.ts` |

---

### 5.3 Build Composition Validator

| Task | How | Expected Output |
|------|-----|-----------------|
| **5.3.1** Implement `CompositionValidator` class | Create class that validates report against Composition_Contract. | `src/qa/CompositionValidator.ts` |
| **5.3.2** Implement section presence check | Verify required sections (1, 2, 10, 11) are present. | Missing sections list |
| **5.3.3** Implement cardinality check | Verify max 1 primary option, max 1 alt. | Cardinality violations list |
| **5.3.4** Implement L1 consistency check | Verify blocked sections are actually omitted. | Consistency violations list |
| **5.3.5** Implement word count check | Optional: verify sections within word limits. | Word count per section |
| **5.3.6** Write CompositionValidator unit tests | Test all validation rules. | `tests/qa/CompositionValidator.test.ts` |

---

### 5.4 Build QA Gate

| Task | How | Expected Output |
|------|-----|-----------------|
| **5.4.1** Implement `QAGate` class | Create class that orchestrates all QA checks and returns PASS/FLAG/BLOCK. | `src/qa/QAGate.ts` |
| **5.4.2** Define gate thresholds | No critical violations = PASS. Minor violations = FLAG. Critical = BLOCK. | Threshold config |
| **5.4.3** Implement gate decision logic | Combine results from SemanticLeakageDetector + CompositionValidator. | Final decision + reasons |
| **5.4.4** Implement fallback trigger | When BLOCK, trigger fallback report generation. | Fallback integration |
| **5.4.5** Write QAGate unit tests | Test all decision paths. | `tests/qa/QAGate.test.ts` |

---

### 5.5 Build Audit Store

| Task | How | Expected Output |
|------|-----|-----------------|
| **5.5.1** Design audit database schema | Create schema for storing audit records. Fields from QA_Governance_Layer Section 4. | `schema/audit_schema.sql` or equivalent |
| **5.5.2** Implement `AuditStore` class | Create class for CRUD operations on audit records. | `src/qa/AuditStore.ts` |
| **5.5.3** Implement write operations | Store full trace, report, QA result. | `store(auditRecord)` method |
| **5.5.4** Implement query operations | Query by session_id, date range, outcome. | Query methods |
| **5.5.5** Implement retention policy | 7-year retention per QA spec. Implement cleanup for older records. | Retention enforcement |
| **5.5.6** Write AuditStore unit tests | Test CRUD, queries, retention. | `tests/qa/AuditStore.test.ts` |

---

## Phase 6: Integration

### 6.1 Build Main Pipeline

| Task | How | Expected Output |
|------|-----|-----------------|
| **6.1.1** Implement `ReportPipeline` class | Create orchestrator class that runs full pipeline: Input → Decision → Composition → QA → Output. | `src/ReportPipeline.ts` |
| **6.1.2** Implement pipeline stages | Wire together: TagExtractor → DriverDeriver → ScenarioScorer → ContentSelector → ToneSelector → ReportComposer → QAGate. | Sequential stage execution |
| **6.1.3** Implement error handling | Catch errors at each stage. Trigger fallback when needed. Never fail completely. | Error recovery at each stage |
| **6.1.4** Implement timing/metrics | Record time taken for each stage. | Performance metrics in trace |
| **6.1.5** Write ReportPipeline integration tests | Test full pipeline with sample inputs. | `tests/integration/ReportPipeline.test.ts` |

---

### 6.2 Build API Layer (if needed)

| Task | How | Expected Output |
|------|-----|-----------------|
| **6.2.1** Define API contract | Define input/output JSON schemas. | `api/schemas/input.json`, `api/schemas/output.json` |
| **6.2.2** Implement API endpoint | Create HTTP endpoint (Express/Fastify/etc.) that accepts intake and returns report. | `src/api/generateReport.ts` |
| **6.2.3** Implement request validation | Validate incoming requests against schema. | 400 errors for invalid input |
| **6.2.4** Implement response formatting | Format report as JSON, HTML, or plain text based on Accept header. | Content negotiation |
| **6.2.5** Write API integration tests | Test API with valid/invalid requests. | `tests/api/generateReport.test.ts` |

---

## Phase 7: Testing & Validation

### 7.1 Build Test Fixtures

| Task | How | Expected Output |
|------|-----|-----------------|
| **7.1.1** Create sample intake data | Create 10-20 representative intake scenarios covering all driver combinations. | `tests/fixtures/intakes/` |
| **7.1.2** Create expected outputs | For each sample intake, create expected report output. | `tests/fixtures/expected/` |
| **7.1.3** Create edge case intakes | Create intakes for edge cases: all missing, all conflicts, fallback triggers. | `tests/fixtures/edge_cases/` |

---

### 7.2 Build Regression Test Suite

| Task | How | Expected Output |
|------|-----|-----------------|
| **7.2.1** Implement snapshot testing | For each fixture, compare generated report against expected. | Snapshot test framework |
| **7.2.2** Implement diff reporting | When snapshot fails, show clear diff of changes. | Readable diff output |
| **7.2.3** Implement golden file updates | Allow updating expected outputs when changes are intentional. | `--update-snapshots` flag |
| **7.2.4** Integrate with CI | Run regression tests on every commit/PR. | CI pipeline config |

---

### 7.3 Build Content Validation Suite

| Task | How | Expected Output |
|------|-----|-----------------|
| **7.3.1** Validate all manifests | Run manifest validator on all 66+ content pieces. | All manifests valid or error list |
| **7.3.2** Validate all tone variants | Ensure all 6 tones present for each content piece. | Missing tone report |
| **7.3.3** Validate placeholder consistency | Ensure same placeholders across all tones of same content. | Inconsistency report |
| **7.3.4** Validate no banned phrases in content | Scan all content for banned phrases. | Violation report |

---

## Phase 8: Documentation & Handoff

### 8.1 Technical Documentation

| Task | How | Expected Output |
|------|-----|-----------------|
| **8.1.1** Write API documentation | Document all API endpoints, request/response formats. | `docs/api.md` |
| **8.1.2** Write configuration guide | Document all config files and how to modify. | `docs/configuration.md` |
| **8.1.3** Write deployment guide | Document how to deploy the system. | `docs/deployment.md` |
| **8.1.4** Write troubleshooting guide | Document common issues and solutions. | `docs/troubleshooting.md` |

---

### 8.2 Content Authoring Documentation

| Task | How | Expected Output |
|------|-----|-----------------|
| **8.2.1** Write content authoring guide | Document how to write new content blocks, tone variants. | `docs/content_authoring.md` |
| **8.2.2** Write tone guide | Document each tone profile with examples, do's and don'ts. | `docs/tone_guide.md` |
| **8.2.3** Write placeholder guide | Document all available placeholders and their sources. | `docs/placeholders.md` |
| **8.2.4** Create content templates | Provide copy-paste templates for new content. | `templates/` directory |

---

## Summary Metrics

| Phase | Tasks | Content Pieces | Code Files |
|-------|-------|----------------|------------|
| Phase 1: Content Authoring | 50+ | 396 texts | - |
| Phase 2: Content Infrastructure | 10 | - | 5 |
| Phase 3: Core Engine | 25 | - | 12 |
| Phase 4: Composition Engine | 15 | - | 6 |
| Phase 5: QA & Governance | 20 | - | 8 |
| Phase 6: Integration | 10 | - | 4 |
| Phase 7: Testing | 10 | - | 5 |
| Phase 8: Documentation | 8 | - | 8 docs |
| **Total** | **~150 tasks** | **396 texts** | **~40 code files** |

---

## Recommended Execution Order

1. **Phase 2** (Content Infrastructure) - Build the scaffolding first
2. **Phase 1.1** (Fallback Content) - Create fallback content so system can always produce output
3. **Phase 3** (Core Engine) - Build the decision logic
4. **Phase 4** (Composition) - Build the assembly logic
5. **Phase 5** (QA) - Build the validation layer
6. **Phase 6** (Integration) - Wire everything together
7. **Phase 7** (Testing) - Validate with fixtures
8. **Phase 1.2-1.6** (Full Content) - Author all 396 texts
9. **Phase 8** (Documentation) - Document for handoff
