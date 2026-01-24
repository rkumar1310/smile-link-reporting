/**
 * Intake Validator
 * Simplified validator for intake data validation in CMS Dashboard
 * Adapted for Next.js from documents/src/validation/IntakeValidator.ts
 */

import type { IntakeData, QuestionAnswer } from "../types";

export interface ValidationErrorDetail {
  code: string;
  questionId?: string;
  message: string;
  expected?: string[];
  received?: unknown;
  severity: "error" | "warning";
}

export interface IntakeValidationResult {
  valid: boolean;
  errors: ValidationErrorDetail[];
  warnings: ValidationErrorDetail[];
}

// Required questions (must be answered) - matches original documents/src/validation
const REQUIRED_QUESTIONS = new Set([
  "Q5",   // Pain/infection/loose teeth
  "Q6a",  // Current dental status
]);

// Critical L1 safety questions - matches original
const CRITICAL_QUESTIONS = new Set([
  "Q5",    // Pain/infection/loose teeth
  "Q13",   // Pregnancy
  "Q16a",  // Growth completed
  "Q17",   // Medical contraindications
]);

// Question display names - matches original QuestionMetadata.ts
const QUESTION_NAMES: Record<string, string> = {
  Q1: "Main reason for smile improvement",
  Q2: "Satisfaction score",
  Q2a: "What bothers you most",
  Q3: "What bothers you most about teeth",
  Q4: "Previous treatments",
  Q5: "Pain/infection/loose teeth",
  Q6a: "Current dental status",
  Q6b: "Location",
  Q6c: "Condition of neighbouring teeth",
  Q6d: "Health of aesthetic teeth",
  Q7: "Smile style preference",
  Q8: "Natural result importance",
  Q9: "Age",
  Q10: "Budget",
  Q11: "Specialist willingness",
  Q12: "Timeline",
  Q13: "Pregnancy",
  Q14: "Smoking",
  Q15: "Oral hygiene",
  Q16a: "Growth completed",
  Q16b: "Recent extraction",
  Q17: "Medical contraindications",
  Q18: "Dental anxiety",
};

export class IntakeValidator {
  /**
   * Validate intake data - throws error on failure
   */
  validate(intake: IntakeData): IntakeData {
    const result = this.safeValidate(intake);
    if (!result.valid) {
      throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(", ")}`);
    }
    return intake;
  }

  /**
   * Validate intake data - returns result (never throws)
   */
  safeValidate(intake: IntakeData): IntakeValidationResult {
    const errors: ValidationErrorDetail[] = [];
    const warnings: ValidationErrorDetail[] = [];

    // Build answer map for quick lookup
    const answerMap = new Map<string, QuestionAnswer>();
    for (const answer of intake.answers) {
      answerMap.set(answer.question_id, answer);
    }

    // Check for required questions
    for (const requiredQ of REQUIRED_QUESTIONS) {
      if (!answerMap.has(requiredQ)) {
        const isCritical = CRITICAL_QUESTIONS.has(requiredQ);
        errors.push({
          code: "MISSING_REQUIRED_QUESTION",
          questionId: requiredQ,
          message: `Required${isCritical ? " (critical L1)" : ""} question "${QUESTION_NAMES[requiredQ] || requiredQ}" not answered`,
          severity: "error"
        });
      }
    }

    // Basic validation of each answer
    for (const answer of intake.answers) {
      const questionId = answer.question_id;

      // Check for empty answer
      if (answer.answer === undefined || answer.answer === null || answer.answer === "") {
        if (REQUIRED_QUESTIONS.has(questionId)) {
          errors.push({
            code: "EMPTY_REQUIRED_ANSWER",
            questionId,
            message: `Required question "${QUESTION_NAMES[questionId] || questionId}" has empty answer`,
            severity: "error"
          });
        }
      }
    }

    // Check session_id
    if (!intake.session_id) {
      errors.push({
        code: "MISSING_SESSION_ID",
        message: "Intake data missing session_id",
        severity: "error"
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Format validation result as human-readable string
   */
  formatResult(result: IntakeValidationResult): string {
    const lines: string[] = [];

    if (result.valid) {
      lines.push("Validation passed");
      if (result.warnings.length > 0) {
        lines.push(`  (${result.warnings.length} warning(s))`);
      }
    } else {
      lines.push("Input validation failed:");
      for (const error of result.errors) {
        const qPart = error.questionId ? `${error.questionId}: ` : "";
        lines.push(`  - ${qPart}${error.message}`);
      }
    }

    if (result.warnings.length > 0) {
      lines.push("\nWarnings:");
      for (const warning of result.warnings) {
        const qPart = warning.questionId ? `${warning.questionId}: ` : "";
        lines.push(`  - ${qPart}${warning.message}`);
      }
    }

    return lines.join("\n");
  }
}

export const intakeValidator = new IntakeValidator();
