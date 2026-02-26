/**
 * NLG Template System - Type Definitions
 * Deterministic template variable substitution for Smile-Link reports
 *
 * New block structure (0-8):
 * - Blocks 0-3: Template text + scenario sentence fragments
 * - Blocks 4-7: Full text paragraphs from scenario (no template, no individual variables)
 * - Block 8: Fully fixed text (no variables)
 */

import type { DriverId, DriverState, ToneProfileId, SupportedLanguage } from "../types";

// =============================================================================
// NLG VARIABLE DEFINITIONS
// =============================================================================

/**
 * All NLG template variables organized by block
 */
export const NLGVariablesByBlock = {
  // Block 0: Personal Summary
  BLOCK_0: [
    "CONTEXT_DESCRIPTION",
    "PRIMARY_GOAL",
    "MAIN_CONSTRAINT"
  ] as const,

  // Block 1: Your Situation
  BLOCK_1: [
    "CORE_SITUATION_DESCRIPTION",
    "NUANCE_FACTOR",
    "SECONDARY_FACTOR",
    "CONTEXT_MODULES_BLOCK"
  ] as const,

  // Block 2: Treatment Directions
  BLOCK_2: [
    "DIRECTION_1_CORE",
    "DIRECTION_2_CORE",
    "DIRECTION_3_CORE"
  ] as const,

  // Block 3: Option Overview (rendered dynamically from array)
  BLOCK_3: [
    "OPTIONS_BLOCK"
  ] as const,

  // Block 4: Expected Results (full text paragraph from scenario)
  BLOCK_4: [
    "EXPECTED_RESULTS_BLOCK"
  ] as const,

  // Block 5: Duration (full text paragraph from scenario)
  BLOCK_5: [
    "DURATION_BLOCK"
  ] as const,

  // Block 6: Recovery (full text paragraph from scenario)
  BLOCK_6: [
    "RECOVERY_BLOCK"
  ] as const,

  // Block 7: Cost (full text paragraph from scenario)
  BLOCK_7: [
    "COST_BLOCK"
  ] as const,

  // Block 8: Next Steps (fixed text, no variables)
} as const;

// Flatten all variables
export const AllNLGVariables = [
  ...NLGVariablesByBlock.BLOCK_0,
  ...NLGVariablesByBlock.BLOCK_1,
  ...NLGVariablesByBlock.BLOCK_2,
  ...NLGVariablesByBlock.BLOCK_3,
  ...NLGVariablesByBlock.BLOCK_4,
  ...NLGVariablesByBlock.BLOCK_5,
  ...NLGVariablesByBlock.BLOCK_6,
  ...NLGVariablesByBlock.BLOCK_7
] as const;

export type NLGVariable = typeof AllNLGVariables[number];

// =============================================================================
// VARIABLE RESOLUTION STATUS
// =============================================================================

export type VariableResolutionStatus =
  | "resolved"      // Successfully resolved with value
  | "fallback"      // Used fallback value
  | "empty"         // Intentionally empty (e.g., optional block not triggered)
  | "missing_data"; // Required data not available

export interface ResolvedVariable {
  variable: NLGVariable;
  value: string;
  status: VariableResolutionStatus;
  source?: string; // Where the value came from (scenario, driver, text_module, etc.)
  sourceId?: string; // ID of the source entity (e.g., scenario ID)
  fallbackUsed?: boolean;
}

export interface VariableResolutionResult {
  variables: Record<NLGVariable, ResolvedVariable>;
  unresolvedCount: number;
  fallbackCount: number;
  missingDataVariables: NLGVariable[];
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
  /** Matched scenario ID - provides NLG variable values from MongoDB */
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
  /** Scenario used for variable values */
  scenarioId?: string;
  renderedReport: string;
  variableResolution: VariableResolutionResult;
  warnings: NLGWarning[];
}

export interface NLGWarning {
  code: string;
  message: string;
  variable?: NLGVariable;
  severity: "info" | "warning" | "error";
}
