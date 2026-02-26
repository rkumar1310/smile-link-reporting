/**
 * Scenario Schema for MongoDB
 *
 * New NLG structure with blocks 0-8:
 * - Blocks 0-3: Template text + scenario-provided sentence fragments
 * - block_3_options: Array of treatment options (replaces separate treatment_options)
 * - Blocks 4-7: Full text paragraphs (no template variables)
 * - Block 8: Fixed text (no scenario data needed)
 */

import { z } from "zod";

// ============================================================================
// Bilingual Text
// ============================================================================

export const BilingualTextSchema = z.object({
  en: z.string(),
  nl: z.string(),
});

export type BilingualText = z.infer<typeof BilingualTextSchema>;

// ============================================================================
// Block Schemas
// ============================================================================

/**
 * Block 0 – Personal Summary sentence fragments
 */
export const Block0Schema = z.object({
  CONTEXT_DESCRIPTION: BilingualTextSchema,
  PRIMARY_GOAL: BilingualTextSchema,
  MAIN_CONSTRAINT: BilingualTextSchema,
});

/**
 * Block 1 – Your Situation sentence fragments
 */
export const Block1Schema = z.object({
  CORE_SITUATION_DESCRIPTION: BilingualTextSchema,
  NUANCE_FACTOR: BilingualTextSchema,
  SECONDARY_FACTOR: BilingualTextSchema,
});

/**
 * Block 2 – Treatment Directions sentence fragments
 */
export const Block2Schema = z.object({
  DIRECTION_1_CORE: BilingualTextSchema,
  DIRECTION_2_CORE: BilingualTextSchema,
  DIRECTION_3_CORE: BilingualTextSchema,
});

/**
 * Block 3 – Single treatment option within the options array
 */
export const Block3OptionSchema = z.object({
  OPTION_TITLE: BilingualTextSchema,
  OPTION_DESCRIPTION: BilingualTextSchema,
  PROCESS_OVERVIEW: BilingualTextSchema,
  OPTION_LIMITATIONS: BilingualTextSchema,
  PROFILE_MATCH: BilingualTextSchema,
  pricing: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("EUR"),
  }),
  duration: z.object({
    min_months: z.number(),
    max_months: z.number(),
  }),
  recovery_days: z.number(),
});

export type Block3Option = z.infer<typeof Block3OptionSchema>;

// ============================================================================
// NLG Variables Schema (block-organized)
// ============================================================================

export const ScenarioNLGVariablesSchema = z.object({
  block_0_personal_summary: Block0Schema,
  block_1_situation: Block1Schema,
  block_2_treatment_directions: Block2Schema,
  block_3_options: z.array(Block3OptionSchema).min(1),
  block_4_expected_results: BilingualTextSchema,
  block_5_duration: BilingualTextSchema,
  block_6_recovery: BilingualTextSchema,
  block_7_cost: BilingualTextSchema,
});

export type ScenarioNLGVariables = z.infer<typeof ScenarioNLGVariablesSchema>;

// ============================================================================
// Matching Criteria Schemas
// ============================================================================

export const MatchingCriteriaSchema = z.object({
  required_drivers: z.record(z.string(), z.array(z.string())).default({}),
  strong_drivers: z.record(z.string(), z.array(z.string())).default({}),
  supporting_drivers: z.record(z.string(), z.array(z.string())).default({}),
  excluding_drivers: z.record(z.string(), z.array(z.string())).default({}),
  preferred_tags: z.array(z.string()).optional(),
});

export type MatchingCriteria = z.infer<typeof MatchingCriteriaSchema>;

// ============================================================================
// Main Scenario Schema
// ============================================================================

export const ScenarioSchema = z.object({
  // Identity
  _id: z.string(), // e.g., "S01"
  name: BilingualTextSchema,

  // Classification
  is_fallback: z.boolean().default(false),
  is_safety_scenario: z.boolean().default(false),
  priority: z.number().int().min(1).max(20),

  // Matching criteria (for ScenarioScorer)
  matching: MatchingCriteriaSchema,

  // NLG variable values (block-organized)
  nlg_variables: ScenarioNLGVariablesSchema,

  // Metadata
  version: z.string().default("2.0.0"),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

// ============================================================================
// MongoDB Collection Types
// ============================================================================

export type ScenarioCreateInput = Omit<Scenario, "created_at" | "updated_at"> & {
  created_at?: Date;
  updated_at?: Date;
};

export type ScenarioUpdateInput = Partial<Omit<Scenario, "_id" | "created_at">> & {
  updated_at?: Date;
};

// ============================================================================
// Helper Types for NLG Integration
// ============================================================================

export type FlattenedNLGVariables = Record<string, string>;

/**
 * Extract flattened variables from scenario for a given language.
 * Maps block fields to template variable names.
 */
export function flattenScenarioVariables(
  scenario: Scenario,
  language: "en" | "nl"
): FlattenedNLGVariables {
  const result: FlattenedNLGVariables = {};
  const vars = scenario.nlg_variables;

  // Block 0
  result.CONTEXT_DESCRIPTION = vars.block_0_personal_summary.CONTEXT_DESCRIPTION[language];
  result.PRIMARY_GOAL = vars.block_0_personal_summary.PRIMARY_GOAL[language];
  result.MAIN_CONSTRAINT = vars.block_0_personal_summary.MAIN_CONSTRAINT[language];

  // Block 1
  result.CORE_SITUATION_DESCRIPTION = vars.block_1_situation.CORE_SITUATION_DESCRIPTION[language];
  result.NUANCE_FACTOR = vars.block_1_situation.NUANCE_FACTOR[language];
  result.SECONDARY_FACTOR = vars.block_1_situation.SECONDARY_FACTOR[language];

  // Block 2
  result.DIRECTION_1_CORE = vars.block_2_treatment_directions.DIRECTION_1_CORE[language];
  result.DIRECTION_2_CORE = vars.block_2_treatment_directions.DIRECTION_2_CORE[language];
  result.DIRECTION_3_CORE = vars.block_2_treatment_directions.DIRECTION_3_CORE[language];

  // Blocks 4-7 (full text paragraphs)
  result.EXPECTED_RESULTS_BLOCK = vars.block_4_expected_results[language];
  result.DURATION_BLOCK = vars.block_5_duration[language];
  result.RECOVERY_BLOCK = vars.block_6_recovery[language];
  result.COST_BLOCK = vars.block_7_cost[language];

  return result;
}

/**
 * Get the treatment options array from a scenario for a given language.
 * Used by the template renderer to build the OPTIONS_BLOCK dynamically.
 */
export function getScenarioOptions(
  scenario: Scenario,
  language: "en" | "nl"
): Array<{
  title: string;
  description: string;
  processOverview: string;
  limitations: string;
  profileMatch: string;
  pricing: { min: number; max: number; currency: string };
  duration: { minMonths: number; maxMonths: number };
  recoveryDays: number;
}> {
  return scenario.nlg_variables.block_3_options.map((opt) => ({
    title: opt.OPTION_TITLE[language],
    description: opt.OPTION_DESCRIPTION[language],
    processOverview: opt.PROCESS_OVERVIEW[language],
    limitations: opt.OPTION_LIMITATIONS[language],
    profileMatch: opt.PROFILE_MATCH[language],
    pricing: { min: opt.pricing.min, max: opt.pricing.max, currency: opt.pricing.currency },
    duration: { minMonths: opt.duration.min_months, maxMonths: opt.duration.max_months },
    recoveryDays: opt.recovery_days,
  }));
}
