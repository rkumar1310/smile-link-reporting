/**
 * Answer Schemas
 * Zod schemas for validating answer values per question
 * Derived from config/tag-extraction-rules.json
 */

import { z } from "zod";
import type { ValidationQuestionId } from "./QuestionMetadata.js";

// Q1: Main reason for smile improvement
const Q1Values = [
  "insecure_confidence",
  "discoloured_damaged_worn",
  "functional_issues",
  "missing_teeth_long_term",
  "beautiful_youthful",
  "complete_transformation",
  "missing_teeth_improve_color_shape"
] as const;
export const Q1Schema = z.enum(Q1Values);

// Q2: Satisfaction score (1-10) - accepts string or number
export const Q2Schema = z.union([
  z.number().int().min(1).max(10),
  z.string().regex(/^([1-9]|10)$/, "Must be a number between 1 and 10")
]);

// Q2a: What bothers you most (conditional on Q2 = 1-4)
const Q2aValues = ["esthetics", "chewing_missing", "both"] as const;
export const Q2aSchema = z.enum(Q2aValues);

// Q3: What bothers you most about teeth (multi-select)
const Q3Values = [
  "discoloured_dull",
  "crooked_uneven",
  "missing_damaged",
  "size_harmony",
  "bite_problems",
  "gum_recession",
  "loose_pain_chewing",
  "missing_aesthetic"
] as const;
export const Q3Schema = z.array(z.enum(Q3Values)).min(1);
export const Q3SingleSchema = z.enum(Q3Values); // For type checking individual values

// Q4: Previous treatments (multi-select)
const Q4Values = [
  "no_never",
  "yes_implants",
  "yes_veneers_crowns",
  "yes_orthodontics",
  "yes_periodontal"
] as const;
export const Q4Schema = z.array(z.enum(Q4Values)).min(1);
export const Q4SingleSchema = z.enum(Q4Values);

// Q5: Pain/infection/loose teeth (REQUIRED, CRITICAL L1)
const Q5Values = [
  "yes_pain",
  "yes_infection",
  "yes_loose_missing",
  "no_aesthetic_only"
] as const;
export const Q5Schema = z.enum(Q5Values);

// Q6a: Current dental status (REQUIRED)
const Q6aValues = [
  "no_missing",
  "one_missing",
  "2_4_adjacent",
  "2_4_non_adjacent",
  "mix_adjacent_spread",
  "5_plus_one_jaw",
  "most_poor_unsaveable"
] as const;
export const Q6aSchema = z.enum(Q6aValues);

// Q6b: Location
const Q6bValues = [
  "front_aesthetic_zone",
  "side_chewing",
  "both"
] as const;
export const Q6bSchema = z.enum(Q6bValues);

// Q6c: Condition of neighbouring teeth
const Q6cValues = [
  "intact",
  "partially_restored",
  "heavily_restored"
] as const;
export const Q6cSchema = z.enum(Q6cValues);

// Q6d: Health of aesthetic teeth (multi-select)
const Q6dValues = [
  "mostly_intact_enamel",
  "large_fillings_old_restorations",
  "cracks_wear",
  "root_canal",
  "severe_discolouration",
  "bruxism"
] as const;
export const Q6dSchema = z.array(z.enum(Q6dValues)).min(1);
export const Q6dSingleSchema = z.enum(Q6dValues);

// Q7: Smile style preference
const Q7Values = [
  "natural_subtle",
  "hollywood",
  "classic_elegant",
  "functional_durable"
] as const;
export const Q7Schema = z.enum(Q7Values);

// Q8: Natural result importance
const Q8Values = [
  "very_important_natural",
  "hollywood_bright_white",
  "best_price_quality_flexible"
] as const;
export const Q8Schema = z.enum(Q8Values);

// Q9: Age
const Q9Values = [
  "under_30",
  "30_45",
  "45_60",
  "60_plus"
] as const;
export const Q9Schema = z.enum(Q9Values);

// Q10: Budget
const Q10Values = [
  "premium_best_result",
  "price_quality_flexible",
  "affordable_durable",
  "cost_estimate_first"
] as const;
export const Q10Schema = z.enum(Q10Values);

// Q11: Specialist willingness
const Q11Values = [
  "yes_for_best_result",
  "maybe_need_info",
  "ai_report_first"
] as const;
export const Q11Schema = z.enum(Q11Values);

// Q12: Timeline
const Q12Values = [
  "1_3_months",
  "6_months",
  "1_year",
  "still_exploring"
] as const;
export const Q12Schema = z.enum(Q12Values);

// Q13: Pregnancy (CRITICAL L1)
const Q13Values = [
  "no",
  "yes_pregnant",
  "possibly_within_6_months",
  "prefer_not_to_say"
] as const;
export const Q13Schema = z.enum(Q13Values);

// Q14: Smoking
const Q14Values = [
  "no",
  "occasionally",
  "weekly",
  "daily"
] as const;
export const Q14Schema = z.enum(Q14Values);

// Q15: Oral hygiene
const Q15Values = [
  "good",
  "basic",
  "irregular",
  "poor"
] as const;
export const Q15Schema = z.enum(Q15Values);

// Q16a: Growth completed (CRITICAL L1)
const Q16aValues = [
  "yes_incomplete",
  "no_complete"
] as const;
export const Q16aSchema = z.enum(Q16aValues);

// Q16b: Recent extraction
const Q16bValues = ["yes", "no"] as const;
export const Q16bSchema = z.enum(Q16bValues);

// Q17: Medical contraindications (CRITICAL L1)
const Q17Values = ["no", "yes"] as const;
export const Q17Schema = z.enum(Q17Values);

// Q18: Dental anxiety
const Q18Values = [
  "no",
  "yes_mild",
  "yes_severe"
] as const;
export const Q18Schema = z.enum(Q18Values);

// Schema lookup map
export const AnswerSchemas: Record<ValidationQuestionId, z.ZodType> = {
  Q1: Q1Schema,
  Q2: Q2Schema,
  Q2a: Q2aSchema,
  Q3: Q3Schema,
  Q4: Q4Schema,
  Q5: Q5Schema,
  Q6a: Q6aSchema,
  Q6b: Q6bSchema,
  Q6c: Q6cSchema,
  Q6d: Q6dSchema,
  Q7: Q7Schema,
  Q8: Q8Schema,
  Q9: Q9Schema,
  Q10: Q10Schema,
  Q11: Q11Schema,
  Q12: Q12Schema,
  Q13: Q13Schema,
  Q14: Q14Schema,
  Q15: Q15Schema,
  Q16a: Q16aSchema,
  Q16b: Q16bSchema,
  Q17: Q17Schema,
  Q18: Q18Schema
};

// Valid values lookup for error messages
export const ValidAnswerValues: Record<ValidationQuestionId, readonly string[]> = {
  Q1: Q1Values,
  Q2: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  Q2a: Q2aValues,
  Q3: Q3Values,
  Q4: Q4Values,
  Q5: Q5Values,
  Q6a: Q6aValues,
  Q6b: Q6bValues,
  Q6c: Q6cValues,
  Q6d: Q6dValues,
  Q7: Q7Values,
  Q8: Q8Values,
  Q9: Q9Values,
  Q10: Q10Values,
  Q11: Q11Values,
  Q12: Q12Values,
  Q13: Q13Values,
  Q14: Q14Values,
  Q15: Q15Values,
  Q16a: Q16aValues,
  Q16b: Q16bValues,
  Q17: Q17Values,
  Q18: Q18Values
};
