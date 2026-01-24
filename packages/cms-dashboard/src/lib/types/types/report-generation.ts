/**
 * Report Generation Types
 * Types for the Generative UI report workflow
 */

import { z } from "zod";
import type { ToneProfileId, SupportedLanguage, ContentDocument } from "./content";
import type { FactCheckRecord, ExtractedClaim } from "./factcheck";

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
  fullRecord?: FactCheckRecord;
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
}

// =============================================================================
// SSE PHASE EVENTS
// =============================================================================

export type ReportPhase =
  | "analyzing"
  | "tone"
  | "content-check"
  | "generating"
  | "composing"
  | "evaluating"
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
  };
}

export interface GeneratingPhaseEvent extends PhaseEventBase {
  phase: "generating";
  data: {
    current: number;
    total: number;
    currentContent: string;
    // Fact-check status for the current content being generated
    factCheck?: {
      status: "pending" | "checking" | "passed" | "failed" | "retrying";
      attempt: number;
      maxAttempts: number;
      score?: number;
    };
  };
}

export interface ComposingPhaseEvent extends PhaseEventBase {
  phase: "composing";
  data?: {
    sectionsProcessed: number;
    totalSections: number;
  };
}

export interface EvaluatingPhaseEvent extends PhaseEventBase {
  phase: "evaluating";
  data?: {
    status: string;
    outcome?: string;
    overallScore?: number;
    dimensions?: {
      professional_quality?: number;
      clinical_safety?: number;
      tone_appropriateness?: number;
      personalization?: number;
      patient_autonomy?: number;
      structure_completeness?: number;
    };
    contentIssues?: number;
    currentDimension?: string;
    metrics?: Record<string, unknown>;
  };
}

// Simplified LLM evaluation data for the complete event
export interface LLMEvaluationData {
  overall_score: number;
  recommended_outcome: string;
  professional_quality: { score: number };
  clinical_safety: { score: number };
  tone_appropriateness: { score: number };
  personalization: { score: number };
  patient_autonomy: { score: number };
  structure_completeness: { score: number };
  content_issues?: Array<{ severity: string }>;
  overall_assessment?: string;
}

export interface CompletePhaseEvent extends PhaseEventBase {
  phase: "complete";
  data: {
    report: ComposedReport;
    llmEvaluation?: LLMEvaluationData;
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
  | GeneratingPhaseEvent
  | ComposingPhaseEvent
  | EvaluatingPhaseEvent
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
