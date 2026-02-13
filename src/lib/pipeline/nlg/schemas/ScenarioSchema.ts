/**
 * Scenario Schema for MongoDB
 *
 * Scenarios are first-class entities that:
 * 1. Get matched via ScenarioScorer (driver-based matching)
 * 2. Provide NLG variable values for template rendering
 * 3. Define treatment options and pricing for that scenario
 * 4. Support bilingual content (EN/NL)
 */

import { z } from "zod";

// ============================================================================
// NLG Variable Schemas
// ============================================================================

/**
 * Text content with bilingual support
 */
export const BilingualTextSchema = z.object({
  en: z.string(),
  nl: z.string(),
});

export type BilingualText = z.infer<typeof BilingualTextSchema>;

/**
 * NLG variables provided by a scenario
 * These map directly to template placeholders like {OPTION_1_NAME}
 */
export const ScenarioNLGVariablesSchema = z.object({
  // Block 0 - Situation description
  SHORT_SITUATION_DESCRIPTION: BilingualTextSchema.optional(),
  SITUATION_BASE: BilingualTextSchema.optional(),
  SITUATION_RELEVANCE: BilingualTextSchema.optional(),

  // Block 3 - Context
  SPECIFIC_SITUATION_CONTEXT: BilingualTextSchema.optional(),

  // Block 4 - Treatment options
  OPTION_1_NAME: BilingualTextSchema.optional(),
  OPTION_1_DESCRIPTION: BilingualTextSchema.optional(),
  OPTION_1_BENEFITS: BilingualTextSchema.optional(),
  OPTION_1_CONSIDERATIONS: BilingualTextSchema.optional(),
  OPTION_1_IDEAL_FOR: BilingualTextSchema.optional(),

  OPTION_2_NAME: BilingualTextSchema.optional(),
  OPTION_2_DESCRIPTION: BilingualTextSchema.optional(),
  OPTION_2_BENEFITS: BilingualTextSchema.optional(),
  OPTION_2_CONSIDERATIONS: BilingualTextSchema.optional(),
  OPTION_2_IDEAL_FOR: BilingualTextSchema.optional(),

  OPTION_3_NAME: BilingualTextSchema.optional(),
  OPTION_3_DESCRIPTION: BilingualTextSchema.optional(),
  OPTION_3_BENEFITS: BilingualTextSchema.optional(),
  OPTION_3_CONSIDERATIONS: BilingualTextSchema.optional(),
  OPTION_3_IDEAL_FOR: BilingualTextSchema.optional(),

  // Block 5 - Comparison
  COMPARISON_SUMMARY: BilingualTextSchema.optional(),
  KEY_TRADEOFFS: BilingualTextSchema.optional(),

  // Block 6 - Duration & Process
  DURATION_RANGE: BilingualTextSchema.optional(),
  PROCESS_OVERVIEW: BilingualTextSchema.optional(),

  // Block 7 - Recovery
  RECOVERY_DESCRIPTION: BilingualTextSchema.optional(),
  DAILY_LIFE_IMPACT: BilingualTextSchema.optional(),

  // Block 8 - Costs
  COST_INDICATION: BilingualTextSchema.optional(),
  COST_FACTORS: BilingualTextSchema.optional(),

  // Block 9 - Next steps
  RECOMMENDED_NEXT_STEPS: BilingualTextSchema.optional(),

  // Recommendation & direction variables
  RECOMMENDED_DIRECTION: BilingualTextSchema.optional(),
  SELECTED_OPTION: BilingualTextSchema.optional(),
  TAG_NUANCE_DIRECTION: BilingualTextSchema.optional(),
  SITUATION_SPECIFIC_CONSIDERATIONS: BilingualTextSchema.optional(),
  OPTIONAL_ADDITIONAL_OPTIONS: BilingualTextSchema.optional(),
  OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS: BilingualTextSchema.optional(),
});

export type ScenarioNLGVariables = z.infer<typeof ScenarioNLGVariablesSchema>;

// ============================================================================
// Treatment Option Schemas
// ============================================================================

/**
 * A single treatment option within a scenario
 */
export const TreatmentOptionSchema = z.object({
  id: z.string(),
  name: BilingualTextSchema,
  rank: z.number().int().min(1).max(5),
  category: z.enum(["implant", "bridge", "denture", "crown", "veneer", "whitening", "orthodontic", "other"]),

  // Structured data for this option
  description: BilingualTextSchema.optional(),
  benefits: z.array(BilingualTextSchema).optional(),
  considerations: z.array(BilingualTextSchema).optional(),
  ideal_for: BilingualTextSchema.optional(),

  // Option-specific pricing
  pricing: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("EUR"),
    note: BilingualTextSchema.optional(),
  }).optional(),

  // Option-specific duration
  duration: z.object({
    min_months: z.number(),
    max_months: z.number(),
    note: BilingualTextSchema.optional(),
  }).optional(),

  // Recovery info
  recovery: z.object({
    days: z.number(),
    description: BilingualTextSchema.optional(),
  }).optional(),

  // NLG variable fields (resolve to template placeholders)
  complexity: BilingualTextSchema.optional(),
  result_description: BilingualTextSchema.optional(),
  comfort_experience: BilingualTextSchema.optional(),
  aesthetic_result: BilingualTextSchema.optional(),
  phases: z.array(BilingualTextSchema).optional(),
});

export type TreatmentOption = z.infer<typeof TreatmentOptionSchema>;

// ============================================================================
// Matching Criteria Schemas
// ============================================================================

/**
 * Driver matching criteria (migrated from scenario-profiles.json)
 */
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

/**
 * Complete scenario document for MongoDB
 */
export const ScenarioSchema = z.object({
  // Identity
  _id: z.string(), // e.g., "S02"
  name: BilingualTextSchema,
  description: BilingualTextSchema,

  // Classification
  is_fallback: z.boolean().default(false),
  is_safety_scenario: z.boolean().default(false),
  priority: z.number().int().min(1).max(20), // Used for tie-breaking

  // Matching criteria (for ScenarioScorer)
  matching: MatchingCriteriaSchema,

  // NLG variable values
  nlg_variables: ScenarioNLGVariablesSchema,

  // Structured treatment options
  treatment_options: z.array(TreatmentOptionSchema).default([]),

  // Aggregate pricing for this scenario
  pricing: z.object({
    min: z.number(),
    max: z.number(),
    currency: z.string().default("EUR"),
  }).optional(),

  // Metadata
  version: z.string().default("1.0.0"),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type Scenario = z.infer<typeof ScenarioSchema>;

// ============================================================================
// MongoDB Collection Types
// ============================================================================

/**
 * Input type for creating a new scenario (without auto-generated fields)
 */
export type ScenarioCreateInput = Omit<Scenario, "created_at" | "updated_at"> & {
  created_at?: Date;
  updated_at?: Date;
};

/**
 * Input type for updating a scenario
 */
export type ScenarioUpdateInput = Partial<Omit<Scenario, "_id" | "created_at">> & {
  updated_at?: Date;
};

// ============================================================================
// Helper Types for NLG Integration
// ============================================================================

/**
 * Flattened NLG variables for a specific language
 * Used by the template renderer
 */
export type FlattenedNLGVariables = Record<string, string>;

/**
 * Extract flattened variables from scenario for a given language
 */
export function flattenScenarioVariables(
  scenario: Scenario,
  language: "en" | "nl"
): FlattenedNLGVariables {
  const result: FlattenedNLGVariables = {};

  for (const [key, value] of Object.entries(scenario.nlg_variables)) {
    if (value && typeof value === "object" && language in value) {
      result[key] = value[language];
    }
  }

  // Also flatten treatment options into OPTION_N_* variables
  scenario.treatment_options.forEach((option, index) => {
    const n = index + 1;
    result[`OPTION_${n}_NAME`] = option.name[language];

    if (option.description) {
      result[`OPTION_${n}_DESCRIPTION`] = option.description[language];
    }
    if (option.ideal_for) {
      result[`OPTION_${n}_IDEAL_FOR`] = option.ideal_for[language];
    }
    if (option.benefits?.length) {
      result[`OPTION_${n}_BENEFITS`] = option.benefits.map(b => b[language]).join("\n- ");
    }
    if (option.considerations?.length) {
      result[`OPTION_${n}_CONSIDERATIONS`] = option.considerations.map(c => c[language]).join("\n- ");
    }
    if (option.complexity) {
      result[`OPTION_${n}_COMPLEXITY`] = option.complexity[language];
    }
    if (option.pricing) {
      result[`OPTION_${n}_PRICE_MIN`] = option.pricing.min.toString();
      result[`OPTION_${n}_PRICE_MAX`] = option.pricing.max.toString();
    }
    if (option.duration) {
      result[`OPTION_${n}_DURATION`] = `${option.duration.min_months}-${option.duration.max_months} months`;
    }
  });

  // Primary option fields (index 0) for global variables
  const primaryOption = scenario.treatment_options[0];
  if (primaryOption) {
    if (primaryOption.result_description) {
      result["RESULT_DESCRIPTION"] = primaryOption.result_description[language];
    }
    if (primaryOption.comfort_experience) {
      result["COMFORT_EXPERIENCE"] = primaryOption.comfort_experience[language];
    }
    if (primaryOption.aesthetic_result) {
      result["AESTHETIC_RESULT"] = primaryOption.aesthetic_result[language];
    }
    if (primaryOption.phases?.length) {
      primaryOption.phases.forEach((phase, i) => {
        result[`PHASE_${i + 1}`] = phase[language];
      });
    }
  }

  // Aggregate pricing
  if (scenario.pricing) {
    result["PRICE_MIN"] = scenario.pricing.min.toString();
    result["PRICE_MAX"] = scenario.pricing.max.toString();
  }

  return result;
}
