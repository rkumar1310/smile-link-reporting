/**
 * Intake Validator
 * Main validator class for intake data validation
 * Validates all questionnaire answers before pipeline processing
 */

import type { IntakeData, QuestionAnswer } from "../types/index.js";
import {
  type ValidationErrorDetail,
  type IntakeValidationResult,
  IntakeValidationError
} from "./errors/ValidationError.js";
import {
  type ValidationQuestionId,
  ValidQuestionIds,
  MultiSelectQuestions,
  RequiredQuestions,
  CriticalQuestions,
  ConditionalRules,
  QuestionNames
} from "./schemas/QuestionMetadata.js";
import { AnswerSchemas, ValidAnswerValues } from "./schemas/AnswerSchemas.js";

export class IntakeValidator {
  /**
   * Validate intake data - throws IntakeValidationError on failure
   */
  validate(intake: IntakeData): IntakeData {
    const result = this.safeValidate(intake);
    if (!result.valid) {
      throw new IntakeValidationError(result.errors, result.warnings);
    }
    return intake;
  }

  /**
   * Validate intake data - returns IntakeValidationResult (never throws)
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
    for (const requiredQ of RequiredQuestions) {
      if (!answerMap.has(requiredQ)) {
        const isCritical = CriticalQuestions.has(requiredQ);
        errors.push({
          code: "MISSING_REQUIRED_QUESTION",
          questionId: requiredQ,
          message: `Required${isCritical ? " (critical L1)" : ""} question "${QuestionNames[requiredQ]}" not answered`,
          severity: "error"
        });
      }
    }

    // Validate each answer
    for (const answer of intake.answers) {
      const questionId = answer.question_id;

      // Check for unknown question ID
      if (!ValidQuestionIds.has(questionId)) {
        errors.push({
          code: "INVALID_QUESTION_ID",
          questionId,
          message: `Unknown question ID "${questionId}"`,
          received: questionId,
          severity: "error"
        });
        continue;
      }

      const qId = questionId as ValidationQuestionId;

      // Check conditional dependencies
      const conditionalRule = ConditionalRules.find(r => r.questionId === qId);
      if (conditionalRule) {
        const dependsOnAnswer = answerMap.get(conditionalRule.dependsOn);
        const dependsOnValue = dependsOnAnswer?.answer;

        if (!dependsOnValue || !conditionalRule.requiredValues.includes(String(dependsOnValue))) {
          warnings.push({
            code: "CONDITIONAL_DEPENDENCY_NOT_MET",
            questionId: qId,
            message: `${qId} requires ${conditionalRule.dependsOn} to be one of [${conditionalRule.requiredValues.join(", ")}], skipping`,
            expected: conditionalRule.requiredValues,
            received: dependsOnValue,
            severity: "warning"
          });
          // Skip further validation of this answer (it will be ignored)
          continue;
        }
      }

      // Check type for multi-select questions
      const isMultiSelect = MultiSelectQuestions.has(qId);
      const answerValue = answer.answer;

      if (isMultiSelect) {
        if (!Array.isArray(answerValue)) {
          errors.push({
            code: "TYPE_MISMATCH",
            questionId: qId,
            message: `Expected array for multi-select question "${QuestionNames[qId]}", received ${typeof answerValue}`,
            expected: ["array"],
            received: answerValue,
            severity: "error"
          });
          continue;
        }
      } else {
        if (Array.isArray(answerValue)) {
          errors.push({
            code: "TYPE_MISMATCH",
            questionId: qId,
            message: `Expected single value for question "${QuestionNames[qId]}", received array`,
            expected: ["string or number"],
            received: answerValue,
            severity: "error"
          });
          continue;
        }
      }

      // Validate answer value against schema
      const schema = AnswerSchemas[qId];
      const parseResult = schema.safeParse(answerValue);

      if (!parseResult.success) {
        const validValues = ValidAnswerValues[qId];
        errors.push({
          code: "INVALID_ANSWER_VALUE",
          questionId: qId,
          message: `Invalid value for "${QuestionNames[qId]}"`,
          expected: [...validValues],
          received: answerValue,
          severity: "error"
        });
      }
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
        if (error.expected && error.expected.length <= 10) {
          lines.push(`    Expected: ${error.expected.join(", ")}`);
        } else if (error.expected) {
          lines.push(`    Expected: one of ${error.expected.length} valid values`);
        }
        if (error.received !== undefined) {
          const receivedStr = typeof error.received === "object"
            ? JSON.stringify(error.received)
            : String(error.received);
          lines.push(`    Received: ${receivedStr}`);
        }
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
