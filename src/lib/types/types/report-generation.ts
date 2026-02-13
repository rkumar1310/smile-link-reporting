/**
 * Report Generation Types
 * Types for the Generative UI report workflow
 */

import { z } from "zod";
import type { ToneProfileId, SupportedLanguage, ContentDocument } from "./content";

// =============================================================================
// INTAKE ANSWERS (from questionnaire)
// =============================================================================

export interface IntakeAnswer {
  question_id: string;
  answer: string | string[];
}

export interface IntakeAnswers {
  session_id: string;
  timestamp: string;
  answers: IntakeAnswer[];
  metadata?: {
    patient_name?: string;
    tooth_location?: string;
  };
}

export const IntakeAnswerSchema = z.object({
  question_id: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
});

export const IntakeAnswersSchema = z.object({
  session_id: z.string(),
  timestamp: z.string(),
  answers: z.array(IntakeAnswerSchema),
  metadata: z.object({
    patient_name: z.string().optional(),
    tooth_location: z.string().optional(),
  }).optional(),
});

// =============================================================================
// DRIVER STATE (from questionnaire analysis)
// =============================================================================

/**
 * L1 Safety Layer - Clinical indicators and contraindications
 * These drivers can block or modify treatment recommendations
 */
export interface L1SafetyDrivers {
  hasActivePain: boolean;              // Q5 = yes_pain
  hasActiveInfection: boolean;         // Q5 = yes_infection
  hasLooseTeeth: boolean;              // Q5 = yes_loose
  isPregnant: boolean;                 // Q13 = yes_*
  isSmoker: boolean;                   // Q14 = yes_*
  hasGrowthIncomplete: boolean;        // Q16a = yes
  hasRecentExtraction: boolean;        // Q16b = yes
  hasMedicalConditions: boolean;       // Q17 = yes
}

/**
 * L2 Personalization Layer - Patient preferences and characteristics
 * These drivers influence content selection and tone
 */
export interface L2PersonalizationDrivers {
  mainMotivation: string;              // Q1 value
  satisfactionScore: number;           // Q2 (1-10)
  primaryConcern: string;              // Q3 value
  missingTeethCount: string;           // Q6a value
  toothLocation: string;               // Q6b value
  neighboringTeethCondition: string;   // Q6c value
  stylePreference: string;             // Q7 value
  budgetLevel: string;                 // Q10 value
  timeline: string;                    // Q12 value
  ageRange: string;                    // Q9 value
}

/**
 * L3 Narrative Layer - Communication and framing preferences
 * These drivers determine how content is presented
 */
export interface L3NarrativeDrivers {
  naturalImportance: string;           // Q8 value
  willingToVisitSpecialist: string;    // Q11 value
  oralHygieneLevel: string;            // Q15 value
  anxietyLevel: string;                // Q18 value
  previousTreatmentExperience: string; // Q4 value
}

export interface DriverState {
  L1_Safety: L1SafetyDrivers;
  L2_Personalization: L2PersonalizationDrivers;
  L3_Narrative: L3NarrativeDrivers;
  derivedTags: string[];               // Tags extracted from driver analysis
}

// =============================================================================
// TONE PROFILES
// =============================================================================

export interface ToneProfile {
  id: ToneProfileId;
  name: string;
  description: string;
  triggers: string[];                  // Conditions that activate this tone
  priority: number;                    // Higher = takes precedence
}

export const TONE_PROFILES: ToneProfile[] = [
  {
    id: "TP-01",
    name: "Neutral-Informative",
    description: "Default balanced tone for straightforward cases",
    triggers: ["default", "no_special_conditions"],
    priority: 1,
  },
  {
    id: "TP-02",
    name: "Empathic-Neutral",
    description: "For patients with negative history or high emotional load",
    triggers: ["negative_treatment_history", "high_expectations", "previous_bad_experience"],
    priority: 2,
  },
  {
    id: "TP-03",
    name: "Reflective-Contextual",
    description: "For detailed information seekers",
    triggers: ["wants_detailed_info", "analytical_personality", "many_questions"],
    priority: 2,
  },
  {
    id: "TP-04",
    name: "Stability-Frame",
    description: "For patients with severe dental anxiety - HIGHEST PRIORITY",
    triggers: ["severe_anxiety", "dental_phobia"],
    priority: 5,  // Highest priority
  },
  {
    id: "TP-05",
    name: "Expectation-Calibration",
    description: "For patients with unrealistic expectations",
    triggers: ["unrealistic_expectations", "expectation_mismatch"],
    priority: 3,
  },
  {
    id: "TP-06",
    name: "Autonomy-Respecting",
    description: "For Section 11 only - patient autonomy emphasis",
    triggers: ["section_11", "decision_support"],
    priority: 4,
  },
];

// =============================================================================
// CONTENT AVAILABILITY
// =============================================================================

export interface ContentGap {
  contentId: string;
  scenarioId: string;
  contentType: string;
  name: string;
  description?: string;           // Description for semantic search context
  sections?: number[];            // Target sections this content provides
  missingVariant: {
    lang: SupportedLanguage;
    tone: ToneProfileId;
  };
}

export interface ContentCheckResult {
  totalRequired: number;
  available: number;
  missing: ContentGap[];
  availableContent: Array<{
    contentId: string;
    scenarioId?: string;
    name: string;
  }>;
}

// =============================================================================
// SCENARIO SCORING
// =============================================================================

export interface ScoredScenario {
  scenarioId: string;                  // S01-S17 or S00_GENERIC
  name: string;
  score: number;                       // 0-1 relevance score
  matchedDrivers: string[];            // Which drivers triggered this scenario
  sections: number[];                  // Report sections this scenario provides
}

// =============================================================================
// FACT CHECK RESULT (simplified for report workflow)
// =============================================================================

export interface ReportFactCheckIssue {
  contentId: string;
  section: string;
  severity: "low" | "medium" | "high";
  description: string;
  claimText: string;
  suggestion?: string;
}

export interface ReportFactCheckResult {
  passed: boolean;
  score: number;                       // 0-1, passes if >= 0.7
  issues: ReportFactCheckIssue[];
  attempts: number;
  fullRecord?: Record<string, unknown>;
}

// =============================================================================
// REPORT SECTIONS
// =============================================================================

export interface ReportSection {
  sectionNumber: number;
  title: string;
  content: string;                     // Rendered markdown
  sourceContentId: string;             // Which content provided this
  hasWarning: boolean;
  warnings?: ReportFactCheckIssue[];
}

// =============================================================================
// COMPOSED REPORT
// =============================================================================

export interface ComposedReport {
  id: string;
  generatedAt: string;

  // Patient info
  patientName?: string;
  sessionId: string;

  // Configuration used
  language: SupportedLanguage;
  tone: ToneProfileId;
  toneName: string;

  // Matched scenarios
  scenarios: ScoredScenario[];

  // Report content
  sections: ReportSection[];

  // Fact-check status
  factCheckPassed: boolean;
  factCheckScore: number;
  warnings: ReportFactCheckIssue[];

  // Generation metadata
  contentGenerated: number;            // How many content items were generated
  totalContentUsed: number;

  // Unresolved NLG variable placeholders (e.g., {OPTION_1_NAME})
  unresolvedPlaceholders?: string[];

  // Intake questionnaire answers (for PDF export)
  intakeAnswers?: IntakeAnswer[];

  // PDF export (base64 encoded)
  pdfBase64?: string;
}

// =============================================================================
// AUDIT DATA (pipeline decision trace for UI display)
// =============================================================================

export interface AuditDriverValue {
  driver_id: string;
  layer: string;
  value: string;
  source: "derived" | "fallback";
  confidence: number;
}

export interface AuditDriverConflict {
  driver_id: string;
  conflicting_values: string[];
  resolved_value: string;
  resolution_reason: string;
}

export interface AuditScenarioScore {
  scenario_id: string;
  score: number;
  matched_required: number;
  matched_strong: number;
  matched_supporting: number;
  excluded: boolean;
}

export interface AuditContentSelection {
  content_id: string;
  type: string;
  target_section: number;
  tone: string;
  priority: number;
  suppressed: boolean;
  suppression_reason?: string;
}

export interface AuditToneTrigger {
  tone: string;
  matched: boolean;
  trigger_driver?: string;
}

export interface AuditTraceEvent {
  timestamp: string;
  stage: string;
  action: string;
  duration_ms: number;
}

export interface ReportAuditData {
  session_id: string;
  created_at: string;
  final_outcome: string;

  // Driver state
  drivers: Record<string, AuditDriverValue>;
  driver_conflicts: AuditDriverConflict[];
  fallbacks_applied: string[];

  // Scenario matching
  matched_scenario: string;
  scenario_confidence: string;
  scenario_score: number;
  all_scenario_scores: AuditScenarioScore[];
  fallback_used: boolean;
  fallback_reason?: string;

  // Content selections
  content_selections: AuditContentSelection[];

  // Tone selection
  tone: string;
  tone_reason: string;
  tone_triggers: AuditToneTrigger[];

  // Decision trace
  trace_events: AuditTraceEvent[];
  trace_started_at: string;
  trace_completed_at: string;
}

// =============================================================================
// PROGRESS TRACKING
// =============================================================================

// =============================================================================
// SSE PHASE EVENTS
// =============================================================================

export type ReportPhase =
  | "analyzing"
  | "tone"
  | "content-check"
  | "composing"
  | "complete"
  | "error";

export interface PhaseEventBase {
  phase: ReportPhase;
  message: string;
  timestamp: string;
}

export interface AnalyzingPhaseEvent extends PhaseEventBase {
  phase: "analyzing";
  data?: {
    totalQuestions: number;
    processedQuestions: number;
  };
}

export interface TonePhaseEvent extends PhaseEventBase {
  phase: "tone";
  data: {
    tone: ToneProfileId;
    toneName: string;
    reason: string;
  };
}

export interface ContentCheckPhaseEvent extends PhaseEventBase {
  phase: "content-check";
  data: {
    total: number;
    available: number;
    missing: number;
    scenarios: string[];
    /** List of content blocks that need to be generated */
    missingBlocks?: Array<{
      id: string;
      name: string;
      contentType: string;
    }>;
  };
}

export interface ComposingPhaseEvent extends PhaseEventBase {
  phase: "composing";
  data?: {
    sectionsProcessed: number;
    totalSections: number;
    currentSection?: string;
  };
}

export interface CompletePhaseEvent extends PhaseEventBase {
  phase: "complete";
  data: {
    report: ComposedReport;
    audit?: ReportAuditData;
  };
}

export interface ErrorPhaseEvent extends PhaseEventBase {
  phase: "error";
  data: {
    error: string;
    recoverable: boolean;
    phase: ReportPhase;
  };
}

export type ReportPhaseEvent =
  | AnalyzingPhaseEvent
  | TonePhaseEvent
  | ContentCheckPhaseEvent
  | ComposingPhaseEvent
  | CompletePhaseEvent
  | ErrorPhaseEvent;

// =============================================================================
// API REQUEST/RESPONSE
// =============================================================================

export interface GenerateReportRequest {
  intake: IntakeAnswers;
  language?: SupportedLanguage;        // Defaults to "en"
}

export const GenerateReportRequestSchema = z.object({
  intake: IntakeAnswersSchema,
  language: z.enum(["en", "nl"]).optional(),
});

// =============================================================================
// UI STATE
// =============================================================================

export interface ReportGenerationUIState {
  status: "idle" | "generating" | "complete" | "error";
  phases: Array<{
    phase: ReportPhase;
    status: "pending" | "active" | "complete" | "error";
    message?: string;
    data?: Record<string, unknown>;
  }>;
  report?: ComposedReport;
  error?: string;
}
