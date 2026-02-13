/**
 * NLG Template System - Type Definitions
 * Deterministic template variable substitution for Smile-Link reports
 */

import type { DriverId, DriverState, ToneProfileId, SupportedLanguage } from "../types";

// =============================================================================
// NLG VARIABLE DEFINITIONS
// =============================================================================

/**
 * All NLG template variables organized by block
 */
export const NLGVariablesByBlock = {
  // Block -1: Disclaimer
  DISCLAIMER: ["DISCLAIMER_TEXT"] as const,

  // Block 0: Personal Micro-Summary
  BLOCK_0: [
    "AGE_CATEGORY",
    "MAIN_CONCERN",
    "SHORT_SITUATION_DESCRIPTION",
    "DECISION_STAGE_DESCRIPTION"
  ] as const,

  // Block 1: Situation
  BLOCK_1: [
    "SITUATION_BASE",
    "SITUATION_RELEVANCE",
    "OPTIONAL_SITUATION_TAG_BLOCK"
  ] as const,

  // Block 2: Treatment Options
  BLOCK_2: [
    "OPTION_1_NAME",
    "OPTION_1_SHORT_DESCRIPTION",
    "OPTION_1_INDICATION",
    "OPTION_1_COMPLEXITY",
    "OPTION_1_ADVANTAGES",
    "OPTION_1_DISADVANTAGES",
    "OPTION_2_NAME",
    "OPTION_2_SHORT_DESCRIPTION",
    "OPTION_2_INDICATION",
    "OPTION_2_COMPLEXITY",
    "OPTION_2_ADVANTAGES",
    "OPTION_2_DISADVANTAGES",
    "OPTIONAL_ADDITIONAL_OPTIONS",
    "OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS"
  ] as const,

  // Block 3: Recommended Direction
  BLOCK_3: [
    "RECOMMENDED_DIRECTION",
    "PRIORITY_CONTEXT",
    "TAG_NUANCE_DIRECTION"
  ] as const,

  // Block 4: Expected Results
  BLOCK_4: [
    "SELECTED_OPTION",
    "RESULT_DESCRIPTION",
    "COMFORT_EXPERIENCE",
    "AESTHETIC_RESULT",
    "OPTIONAL_RESULT_TAG_BLOCK"
  ] as const,

  // Block 5: Treatment Duration
  BLOCK_5: [
    "TREATMENT_DURATION",
    "PHASE_1",
    "PHASE_2",
    "PHASE_3",
    "DURATION_VARIATION_FACTOR",
    "OPTIONAL_DURATION_TAG_BLOCK"
  ] as const,

  // Block 6: Risks
  BLOCK_6: [
    "GENERAL_RISK",
    "SITUATION_SPECIFIC_CONSIDERATIONS"
  ] as const,

  // Block 7: Costs
  BLOCK_7: [
    "PRICE_MIN",
    "PRICE_MAX",
    "FACTOR_1",
    "FACTOR_2",
    "FACTOR_3",
    "OPTIONAL_PRICE_TAG_BLOCK"
  ] as const,

  // Block 8: Recovery
  BLOCK_8: [
    "RECOVERY_DURATION",
    "RECOVERY_DISCOMFORT",
    "ALARM_SIGNAL",
    "OPTIONAL_RECOVERY_TAG_BLOCK"
  ] as const,

  // Block 9: Next Steps
  BLOCK_9: [
    "PROGRESSION_FOCUS",
    "QUESTION_1",
    "QUESTION_2",
    "QUESTION_3",
    "OPTIONAL_NEXT_STEPS_TAG_BLOCK"
  ] as const
} as const;

// Flatten all variables
export const AllNLGVariables = [
  ...NLGVariablesByBlock.DISCLAIMER,
  ...NLGVariablesByBlock.BLOCK_0,
  ...NLGVariablesByBlock.BLOCK_1,
  ...NLGVariablesByBlock.BLOCK_2,
  ...NLGVariablesByBlock.BLOCK_3,
  ...NLGVariablesByBlock.BLOCK_4,
  ...NLGVariablesByBlock.BLOCK_5,
  ...NLGVariablesByBlock.BLOCK_6,
  ...NLGVariablesByBlock.BLOCK_7,
  ...NLGVariablesByBlock.BLOCK_8,
  ...NLGVariablesByBlock.BLOCK_9
] as const;

export type NLGVariable = typeof AllNLGVariables[number];

// =============================================================================
// VARIABLE RESOLUTION STATUS
// =============================================================================

export type VariableResolutionStatus =
  | "resolved"      // Successfully resolved with value
  | "fallback"      // Used fallback value
  | "empty"         // Intentionally empty (e.g., optional block not triggered)
  | "missing_data"  // Required data not available
  | "not_implemented"; // Feature not yet implemented

export interface ResolvedVariable {
  variable: NLGVariable;
  value: string;
  status: VariableResolutionStatus;
  source?: string; // Where the value came from (driver, tag, collection, etc.)
  sourceId?: string; // ID of the source entity (e.g., scenario ID)
  fallbackUsed?: boolean;
}

export interface VariableResolutionResult {
  variables: Record<NLGVariable, ResolvedVariable>;
  unresolvedCount: number;
  fallbackCount: number;
  missingDataVariables: NLGVariable[];
  notImplementedVariables: NLGVariable[];
}

// =============================================================================
// DRIVER TEXT MAPPINGS
// =============================================================================

/**
 * Maps driver values to human-readable text for template variables
 */
export interface DriverTextMapping {
  driver: DriverId;
  value: string;
  targetVariable: NLGVariable;
  text: {
    en: string;
    nl: string;
  };
}

// =============================================================================
// TREATMENT OPTIONS (FLAGGED - NEEDS DATA)
// =============================================================================

/**
 * @FLAG: MISSING_DATA
 * Treatment option structured data does not exist in current system.
 * This interface defines what's needed but data must be created.
 */
export interface TreatmentOption {
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
  // Eligibility criteria
  eligibleMouthSituations: string[];
  contraindications: string[];
  // Priority for recommendation
  basePriority: number;
}

// =============================================================================
// PRICING DATA (FLAGGED - NEEDS DATA)
// =============================================================================

/**
 * @FLAG: MISSING_DATA
 * Regional pricing data does not exist in current system.
 */
export interface PricingData {
  treatmentId: string;
  region: string; // "NL", "BE", "US", etc.
  priceMin: number;
  priceMax: number;
  currency: string;
  factors: { en: string[]; nl: string[] };
  lastUpdated: string;
}

// =============================================================================
// QUESTION BANK (FLAGGED - NEEDS DATA)
// =============================================================================

/**
 * @FLAG: MISSING_DATA
 * Question bank for next steps does not exist in current system.
 */
export interface QuestionBankEntry {
  id: string;
  text: { en: string; nl: string };
  applicableDrivers: Partial<Record<DriverId, string[]>>;
  applicableTags: string[];
  priority: number;
}

// =============================================================================
// NLG PIPELINE TYPES
// =============================================================================

export interface NLGInput {
  sessionId: string;
  driverState: DriverState;
  tags: Set<string>;
  language: SupportedLanguage;
  tone: ToneProfileId;
  /** Matched scenario ID - provides base NLG variable values from MongoDB */
  scenarioId?: string;
  metadata?: {
    patientName?: string;
    region?: string;
    [key: string]: string | undefined;
  };
}

export interface NLGOutput {
  sessionId: string;
  language: SupportedLanguage;
  /** Scenario used for base variable values (if any) */
  scenarioId?: string;
  renderedReport: string;
  variableResolution: VariableResolutionResult;
  warnings: NLGWarning[];
  flags: NLGFlag[];
}

export interface NLGWarning {
  code: string;
  message: string;
  variable?: NLGVariable;
  severity: "info" | "warning" | "error";
}

/**
 * Flags for missing implementations or data
 */
export interface NLGFlag {
  component: string;
  reason: string;
  affectedVariables: NLGVariable[];
  workaround?: string;
}

// =============================================================================
// IMPLEMENTATION FLAGS
// =============================================================================

/**
 * Tracks what's implemented vs flagged
 */
export const NLGImplementationStatus = {
  // IMPLEMENTED: Can resolve from existing data
  DRIVER_TEXT_MAPPINGS: {
    status: "partial" as const,
    variables: [
      "AGE_CATEGORY",
      "MAIN_CONCERN",
      "SHORT_SITUATION_DESCRIPTION",
      "DECISION_STAGE_DESCRIPTION",
      "SITUATION_BASE",
      "SITUATION_RELEVANCE",
      "PRIORITY_CONTEXT",
      "DURATION_VARIATION_FACTOR",
      "PROGRESSION_FOCUS"
    ] as NLGVariable[],
    note: "Mappings need content but infrastructure exists"
  },

  OPTIONAL_TAG_BLOCKS: {
    status: "implemented" as const,
    variables: [
      "OPTIONAL_SITUATION_TAG_BLOCK",
      "OPTIONAL_RESULT_TAG_BLOCK",
      "OPTIONAL_DURATION_TAG_BLOCK",
      "OPTIONAL_PRICE_TAG_BLOCK",
      "OPTIONAL_RECOVERY_TAG_BLOCK",
      "OPTIONAL_NEXT_STEPS_TAG_BLOCK"
    ] as NLGVariable[],
    note: "Uses existing ContentSelector + A_blocks/TM_modules"
  },

  STATIC_CONTENT: {
    status: "implemented" as const,
    variables: ["DISCLAIMER_TEXT"] as NLGVariable[],
    note: "Loads from existing A_DISCLAIMER content"
  },

  // IMPLEMENTED: Resolved from scenario treatment options & NLG variables
  SCENARIO_TREATMENT_DATA: {
    status: "implemented" as const,
    variables: [
      "OPTION_1_NAME", "OPTION_1_SHORT_DESCRIPTION", "OPTION_1_INDICATION",
      "OPTION_1_COMPLEXITY", "OPTION_1_ADVANTAGES", "OPTION_1_DISADVANTAGES",
      "OPTION_2_NAME", "OPTION_2_SHORT_DESCRIPTION", "OPTION_2_INDICATION",
      "OPTION_2_COMPLEXITY", "OPTION_2_ADVANTAGES", "OPTION_2_DISADVANTAGES",
      "OPTIONAL_ADDITIONAL_OPTIONS", "OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS",
      "RECOMMENDED_DIRECTION", "TAG_NUANCE_DIRECTION",
      "SELECTED_OPTION", "RESULT_DESCRIPTION", "COMFORT_EXPERIENCE",
      "AESTHETIC_RESULT", "TREATMENT_DURATION", "PHASE_1", "PHASE_2", "PHASE_3",
      "SITUATION_SPECIFIC_CONSIDERATIONS",
      "RECOVERY_DURATION", "RECOVERY_DISCOMFORT"
    ] as NLGVariable[],
    note: "Resolved from scenario treatment option fields and scenario NLG variables in MongoDB"
  },

  // PARTIAL: Has fallback content but not scenario-specific
  TREATMENT_FALLBACKS: {
    status: "partial" as const,
    variables: [
      "GENERAL_RISK", "ALARM_SIGNAL"
    ] as NLGVariable[],
    note: "Generic fallback content; can be overridden by scenario NLG variables"
  },

  PRICING: {
    status: "flagged" as const,
    variables: [
      "PRICE_MIN", "PRICE_MAX", "FACTOR_1", "FACTOR_2", "FACTOR_3"
    ] as NLGVariable[],
    note: "Requires: pricingData collection with regional data"
  },

  QUESTION_BANK: {
    status: "flagged" as const,
    variables: ["QUESTION_1", "QUESTION_2", "QUESTION_3"] as NLGVariable[],
    note: "Requires: questionBank collection"
  }
} as const;

/**
 * Helper to check if a variable is implemented
 */
export function getVariableImplementationStatus(variable: NLGVariable): "implemented" | "partial" | "flagged" {
  for (const [, info] of Object.entries(NLGImplementationStatus)) {
    if (info.variables.includes(variable)) {
      return info.status;
    }
  }
  return "flagged";
}

/**
 * Get all flagged variables
 */
export function getFlaggedVariables(): NLGVariable[] {
  const flagged: NLGVariable[] = [];
  for (const [, info] of Object.entries(NLGImplementationStatus)) {
    if (info.status === "flagged") {
      flagged.push(...info.variables);
    }
  }
  return flagged;
}

/**
 * Get implementation summary
 */
export function getImplementationSummary(): {
  implemented: number;
  partial: number;
  flagged: number;
  total: number;
} {
  let implemented = 0;
  let partial = 0;
  let flagged = 0;

  for (const [, info] of Object.entries(NLGImplementationStatus)) {
    const count = info.variables.length;
    switch (info.status) {
      case "implemented": implemented += count; break;
      case "partial": partial += count; break;
      case "flagged": flagged += count; break;
    }
  }

  return {
    implemented,
    partial,
    flagged,
    total: AllNLGVariables.length
  };
}
