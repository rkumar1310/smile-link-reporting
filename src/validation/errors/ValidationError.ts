/**
 * Validation Error Types
 * Custom error types for intake validation failures
 */

export type ValidationErrorCode =
  | "INVALID_QUESTION_ID"
  | "INVALID_ANSWER_VALUE"
  | "MISSING_REQUIRED_QUESTION"
  | "TYPE_MISMATCH"
  | "CONDITIONAL_DEPENDENCY_NOT_MET";

export interface ValidationErrorDetail {
  code: ValidationErrorCode;
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

export class IntakeValidationError extends Error {
  public readonly errors: ValidationErrorDetail[];
  public readonly warnings: ValidationErrorDetail[];

  constructor(errors: ValidationErrorDetail[], warnings: ValidationErrorDetail[] = []) {
    const errorMessages = errors
      .filter(e => e.severity === "error")
      .map(e => `  - ${e.questionId ? `${e.questionId}: ` : ""}${e.message}`)
      .join("\n");

    super(`Input validation failed:\n${errorMessages}`);
    this.name = "IntakeValidationError";
    this.errors = errors.filter(e => e.severity === "error");
    this.warnings = [...warnings, ...errors.filter(e => e.severity === "warning")];
  }

  toValidationResult(): IntakeValidationResult {
    return {
      valid: false,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}
