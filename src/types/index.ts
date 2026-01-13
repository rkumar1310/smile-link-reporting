/**
 * Smile-Link NLG System - Core Type Definitions
 * Based on architecture/data_structures.md
 */

import { z } from "zod";

// =============================================================================
// ENUMS & LITERALS
// =============================================================================

export const QuestionIds = [
  "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9",
  "Q10", "Q11", "Q12", "Q13", "Q14", "Q15", "Q16", "Q17", "Q18"
] as const;
export type QuestionId = typeof QuestionIds[number];

export const ToneProfileIds = [
  "TP-01", // Neutral-Informative (default)
  "TP-02", // Empathic-Neutral
  "TP-03", // Reflective-Contextual
  "TP-04", // Stability-Frame (anxiety)
  "TP-05", // Expectation-Calibration
  "TP-06"  // Autonomy-Respecting
] as const;
export type ToneProfileId = typeof ToneProfileIds[number];

export const DriverLayers = ["L1", "L2", "L3"] as const;
export type DriverLayer = typeof DriverLayers[number];

export const ContentTypes = ["scenario", "a_block", "b_block", "module", "static"] as const;
export type ContentType = typeof ContentTypes[number];

export const ConfidenceLevels = ["HIGH", "MEDIUM", "LOW", "FALLBACK"] as const;
export type ConfidenceLevel = typeof ConfidenceLevels[number];

export const QAOutcomes = ["PASS", "FLAG", "BLOCK"] as const;
export type QAOutcome = typeof QAOutcomes[number];

export const SupportedLanguages = ["en", "nl"] as const;
export type SupportedLanguage = typeof SupportedLanguages[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

// =============================================================================
// LAYER 1: SAFETY DRIVERS (7)
// =============================================================================

export const L1DriverIds = [
  "clinical_priority",
  "biological_stability",
  "mouth_situation",
  "age_stage",
  "medical_constraints",
  "treatment_viability",
  "risk_profile_biological"
] as const;
export type L1DriverId = typeof L1DriverIds[number];

// =============================================================================
// LAYER 2: PERSONALIZATION DRIVERS (6)
// =============================================================================

export const L2DriverIds = [
  "profile_type",
  "aesthetic_tolerance",
  "expectation_risk",
  "experience_history",
  "decision_stage",
  "autonomy_level"
] as const;
export type L2DriverId = typeof L2DriverIds[number];

// =============================================================================
// LAYER 3: NARRATIVE DRIVERS (5)
// =============================================================================

export const L3DriverIds = [
  "anxiety_level",
  "information_depth",
  "budget_type",
  "treatment_philosophy",
  "time_horizon"
] as const;
export type L3DriverId = typeof L3DriverIds[number];

export const AllDriverIds = [...L1DriverIds, ...L2DriverIds, ...L3DriverIds] as const;
export type DriverId = typeof AllDriverIds[number];

// =============================================================================
// INPUT TYPES
// =============================================================================

export interface QuestionAnswer {
  question_id: QuestionId;
  answer: string | string[]; // single or multi-select
  skipped?: boolean;
}

export interface IntakeData {
  session_id: string;
  timestamp: string;
  language?: SupportedLanguage;
  answers: QuestionAnswer[];
  metadata?: {
    patient_name?: string;
    tooth_location?: string;
    [key: string]: string | undefined;
  };
}

// =============================================================================
// TAG TYPES
// =============================================================================

export interface ExtractedTag {
  tag: string;
  source_question: QuestionId;
  source_answer: string;
}

export interface TagExtractionResult {
  session_id: string;
  tags: ExtractedTag[];
  missing_questions: QuestionId[];
}

// =============================================================================
// DRIVER TYPES
// =============================================================================

export interface DriverValue {
  driver_id: DriverId;
  layer: DriverLayer;
  value: string;
  source: "derived" | "fallback";
  source_tags: string[];
  confidence: number; // 0-1
}

export interface DriverConflict {
  driver_id: DriverId;
  conflicting_values: string[];
  resolved_value: string;
  resolution_reason: string;
}

export interface DriverState {
  session_id: string;
  drivers: Record<DriverId, DriverValue>;
  conflicts: DriverConflict[];
  fallbacks_applied: DriverId[];
}

// =============================================================================
// SCENARIO TYPES
// =============================================================================

export interface ScenarioProfile {
  id: string; // S01, S02, ... S17, S00_GENERIC
  name: string;
  description: string;
  required_drivers: Partial<Record<DriverId, string[]>>;
  strong_drivers: Partial<Record<DriverId, string[]>>;
  supporting_drivers: Partial<Record<DriverId, string[]>>;
  excluding_drivers: Partial<Record<DriverId, string[]>>;
}

export interface ScenarioScore {
  scenario_id: string;
  score: number;
  matched_required: number;
  matched_strong: number;
  matched_supporting: number;
  excluded: boolean;
  breakdown: {
    driver_id: DriverId;
    criterion: "required" | "strong" | "supporting" | "excluding";
    matched: boolean;
    points: number;
  }[];
}

export interface ScenarioMatchResult {
  session_id: string;
  matched_scenario: string;
  confidence: ConfidenceLevel;
  score: number;
  all_scores: ScenarioScore[];
  fallback_used: boolean;
  fallback_reason?: string;
}

// =============================================================================
// CONTENT TYPES
// =============================================================================

export interface PlaceholderDef {
  key: string;
  source: string;
  fallback: string;
}

export interface ContentManifest {
  id: string;
  type: ContentType;
  name: string;
  description: string;
  layer: DriverLayer;
  trigger_drivers?: Partial<Record<DriverId, string[]>>;
  trigger_tags?: string[];
  target_section?: number;
  target_sections?: number[];
  priority?: number;
  suppresses?: {
    sections?: number[];
    blocks?: string[];
  };
  suppressed_by?: Record<string, boolean>;
  combinable_with?: string[];
  conflicts_with?: string[];
  placeholders?: PlaceholderDef[];
  tone_variants: Record<ToneProfileId, {
    file: string;
    word_count: number;
  }>;
  version: string;
  last_updated: string;
}

export interface LoadedContent {
  id: string;
  type: ContentType;
  tone: ToneProfileId;
  raw_content: string;
  sections: Map<number, string>;
  placeholders: PlaceholderDef[];
  metadata: ContentManifest;
}

export interface ContentSelection {
  content_id: string;
  type: ContentType;
  target_section: number;
  tone: ToneProfileId;
  priority: number;
  suppressed: boolean;
  suppression_reason?: string;
}

// =============================================================================
// TONE TYPES
// =============================================================================

export interface ToneProfile {
  id: ToneProfileId;
  name: string;
  description: string;
  trigger_drivers: Partial<Record<DriverId, string[]>>;
  priority: number;
  banned_lexical_set: string[];
}

export interface ToneSelectionResult {
  selected_tone: ToneProfileId;
  reason: string;
  evaluated_triggers: {
    tone: ToneProfileId;
    matched: boolean;
    trigger_driver?: DriverId;
  }[];
}

// =============================================================================
// COMPOSITION TYPES
// =============================================================================

export interface ReportSection {
  section_number: number;
  section_name: string;
  content: string;
  sources: string[]; // content IDs that contributed
  word_count: number;
}

export interface ComposedReport {
  session_id: string;
  scenario_id: string;
  tone: ToneProfileId;
  language: SupportedLanguage;
  confidence: ConfidenceLevel;
  sections: ReportSection[];
  total_word_count: number;
  warnings_included: boolean;
  suppressed_sections: number[];
  placeholders_resolved: number;
  placeholders_unresolved: string[];
}

// =============================================================================
// QA TYPES
// =============================================================================

// LLM Evaluation Types
export interface LLMDimensionScore {
  score: number;           // 1-10
  confidence: number;      // 0-1 (LLM's self-reported confidence)
  feedback: string;        // Detailed textual feedback
  issues: string[];        // Specific issues identified
  suggestions: string[];   // Improvement suggestions
}

export interface LLMEvaluationMetadata {
  model_used: string;
  evaluation_timestamp: string;
  duration_ms: number;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Actionable content issue with source file reference
export type ContentIssueSeverity = "critical" | "warning" | "info";

export interface ContentIssue {
  section_number: number;      // Which report section has the issue
  source_content: string;      // Source file path (e.g., "content/scenarios/S11/en/TP-05.md")
  quote: string;               // Exact text with the issue
  problem: string;             // Description of what's wrong
  severity: ContentIssueSeverity;
  suggested_fix: string;       // How to fix it in the source content
}

export interface LLMEvaluationResult {
  // 6 Evaluation Dimensions
  professional_quality: LLMDimensionScore;    // Writing clarity, grammar, flow, no repetition
  clinical_safety: LLMDimensionScore;         // No unsafe claims, proper disclaimers, no guarantees
  tone_appropriateness: LLMDimensionScore;    // Matches TP-xx profile, consistent throughout
  personalization: LLMDimensionScore;         // References patient inputs, relevant options
  patient_autonomy: LLMDimensionScore;        // Non-directive, emphasizes choice
  structure_completeness: LLMDimensionScore;  // Required sections present, logical order

  // Actionable feedback
  content_issues: ContentIssue[];             // Specific issues linked to source files
  content_files_to_review: string[];          // List of content files that need updates

  // Overall assessment
  overall_score: number;                      // Weighted average
  overall_assessment: string;                 // Summary assessment
  recommended_outcome: QAOutcome;
  outcome_reasoning: string;
  metadata: LLMEvaluationMetadata;
}

export interface SemanticViolation {
  phrase: string;
  location: {
    section: number;
    position: number;
  };
  severity: "WARNING" | "CRITICAL";
  rule: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  semantic_violations: SemanticViolation[];
}

export interface DecisionTraceEvent {
  timestamp: string;
  stage: string;
  action: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
}

export interface DecisionTrace {
  session_id: string;
  started_at: string;
  completed_at: string;
  events: DecisionTraceEvent[];
  final_outcome: QAOutcome;
}

export interface AuditRecord {
  session_id: string;
  created_at: string;
  intake: IntakeData;
  driver_state: DriverState;
  scenario_match: ScenarioMatchResult;
  content_selections: ContentSelection[];
  tone_selection: ToneSelectionResult;
  composed_report: ComposedReport;
  validation_result: ValidationResult;
  llm_evaluation?: LLMEvaluationResult;  // Optional LLM-based quality evaluation
  decision_trace: DecisionTrace;
  final_outcome: QAOutcome;
  report_delivered: boolean;
}

// =============================================================================
// PIPELINE TYPES
// =============================================================================

export interface PipelineResult {
  success: boolean;
  outcome: QAOutcome;
  report?: ComposedReport;
  audit: AuditRecord;
  error?: string;
}

// =============================================================================
// ZOD SCHEMAS (for runtime validation)
// =============================================================================

export const IntakeDataSchema = z.object({
  session_id: z.string().min(1),
  timestamp: z.string().datetime(),
  language: z.enum(SupportedLanguages).optional(),
  answers: z.array(z.object({
    question_id: z.enum(QuestionIds),
    answer: z.union([z.string(), z.array(z.string())]),
    skipped: z.boolean().optional()
  })),
  metadata: z.record(z.string(), z.string()).optional()
});

export const ContentManifestSchema = z.object({
  id: z.string(),
  type: z.enum(ContentTypes),
  name: z.string(),
  description: z.string(),
  layer: z.enum(DriverLayers),
  trigger_drivers: z.record(z.string(), z.array(z.string())).optional(),
  trigger_tags: z.array(z.string()).optional(),
  target_section: z.number().optional(),
  target_sections: z.array(z.number()).optional(),
  priority: z.number().optional(),
  suppresses: z.object({
    sections: z.array(z.number()).optional(),
    blocks: z.array(z.string()).optional()
  }).optional(),
  suppressed_by: z.record(z.string(), z.boolean()).optional(),
  combinable_with: z.array(z.string()).optional(),
  conflicts_with: z.array(z.string()).optional(),
  placeholders: z.array(z.object({
    key: z.string(),
    source: z.string(),
    fallback: z.string()
  })).optional(),
  tone_variants: z.record(z.string(), z.object({
    file: z.string(),
    word_count: z.number()
  })),
  version: z.string(),
  last_updated: z.string()
});
