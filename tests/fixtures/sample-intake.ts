/**
 * Sample intake data for testing
 */

import type { IntakeData } from "../../src/types/index.js";

/**
 * Sample intake: First-time patient with single missing tooth, moderate anxiety
 */
export const sampleIntake1: IntakeData = {
  session_id: "test-session-001",
  timestamp: new Date().toISOString(),
  answers: [
    { question_id: "Q1", answer: "missing_teeth_long_term" },
    { question_id: "Q2", answer: "5" },
    { question_id: "Q3", answer: ["missing_damaged"] },
    { question_id: "Q4", answer: ["no_never"] },
    { question_id: "Q5", answer: "no_aesthetic_only" },
    { question_id: "Q6a", answer: "one_missing" },
    { question_id: "Q6b", answer: "front_aesthetic_zone" },
    { question_id: "Q6c", answer: "intact" },
    { question_id: "Q6d", answer: ["mostly_intact_enamel"] },
    { question_id: "Q7", answer: "natural_subtle" },
    { question_id: "Q8", answer: "very_important_natural" },
    { question_id: "Q9", answer: "30_45" },
    { question_id: "Q10", answer: "price_quality_flexible" },
    { question_id: "Q11", answer: "maybe_need_info" },
    { question_id: "Q12", answer: "6_months" },
    { question_id: "Q13", answer: "no" },
    { question_id: "Q14", answer: "no" },
    { question_id: "Q15", answer: "good" },
    { question_id: "Q16a", answer: "no_complete" },
    { question_id: "Q16b", answer: "no" },
    { question_id: "Q17", answer: "no" },
    { question_id: "Q18", answer: "yes_mild" }
  ],
  metadata: {
    patient_name: "John",
    tooth_location: "upper front tooth"
  }
};

/**
 * Sample intake: Urgent case with pain
 */
export const sampleIntake2: IntakeData = {
  session_id: "test-session-002",
  timestamp: new Date().toISOString(),
  answers: [
    { question_id: "Q1", answer: "functional_issues" },
    { question_id: "Q2", answer: "2" },
    { question_id: "Q2a", answer: "chewing_missing" },
    { question_id: "Q3", answer: ["loose_pain_chewing"] },
    { question_id: "Q4", answer: ["no_never"] },
    { question_id: "Q5", answer: "yes_pain" },
    { question_id: "Q6a", answer: "2_4_adjacent" },
    { question_id: "Q6b", answer: "side_chewing" },
    { question_id: "Q6c", answer: "heavily_restored" },
    { question_id: "Q7", answer: "functional_durable" },
    { question_id: "Q8", answer: "best_price_quality_flexible" },
    { question_id: "Q9", answer: "45_60" },
    { question_id: "Q10", answer: "affordable_durable" },
    { question_id: "Q11", answer: "yes_for_best_result" },
    { question_id: "Q12", answer: "1_3_months" },
    { question_id: "Q13", answer: "no" },
    { question_id: "Q14", answer: "occasionally" },
    { question_id: "Q15", answer: "basic" },
    { question_id: "Q16a", answer: "no_complete" },
    { question_id: "Q17", answer: "no" },
    { question_id: "Q18", answer: "yes_severe" }
  ],
  metadata: {
    patient_name: "Maria",
    tooth_location: "lower back teeth"
  }
};

/**
 * Sample intake: Premium client, aesthetic focus
 */
export const sampleIntake3: IntakeData = {
  session_id: "test-session-003",
  timestamp: new Date().toISOString(),
  answers: [
    { question_id: "Q1", answer: "beautiful_youthful" },
    { question_id: "Q2", answer: "6" },
    { question_id: "Q3", answer: ["discoloured_dull"] },
    { question_id: "Q4", answer: ["yes_veneers_crowns"] },
    { question_id: "Q5", answer: "no_aesthetic_only" },
    { question_id: "Q6a", answer: "no_missing" },
    { question_id: "Q6d", answer: ["large_fillings_old_restorations"] },
    { question_id: "Q7", answer: "hollywood" },
    { question_id: "Q8", answer: "hollywood_bright_white" },
    { question_id: "Q9", answer: "45_60" },
    { question_id: "Q10", answer: "premium_best_result" },
    { question_id: "Q11", answer: "yes_for_best_result" },
    { question_id: "Q12", answer: "6_months" },
    { question_id: "Q13", answer: "no" },
    { question_id: "Q14", answer: "no" },
    { question_id: "Q15", answer: "good" },
    { question_id: "Q16a", answer: "no_complete" },
    { question_id: "Q17", answer: "no" },
    { question_id: "Q18", answer: "no" }
  ],
  metadata: {
    patient_name: "Robert"
  }
};

/**
 * Sample intake: Minimal data (testing fallbacks)
 */
export const sampleIntakeMinimal: IntakeData = {
  session_id: "test-session-004",
  timestamp: new Date().toISOString(),
  answers: [
    { question_id: "Q5", answer: "no_aesthetic_only" },
    { question_id: "Q6a", answer: "one_missing" }
  ],
  metadata: {}
};

export const allSampleIntakes = [
  sampleIntake1,
  sampleIntake2,
  sampleIntake3,
  sampleIntakeMinimal
];
