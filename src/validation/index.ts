/**
 * Validation Module
 * Input validation for intake data before pipeline processing
 */

export {
  IntakeValidator,
  intakeValidator
} from "./IntakeValidator.js";

export {
  type ValidationErrorCode,
  type ValidationErrorDetail,
  type IntakeValidationResult,
  IntakeValidationError
} from "./errors/ValidationError.js";

export {
  type ValidationQuestionId,
  ValidQuestionIds,
  MultiSelectQuestions,
  RequiredQuestions,
  CriticalQuestions,
  ConditionalRules,
  QuestionNames
} from "./schemas/QuestionMetadata.js";

export {
  AnswerSchemas,
  ValidAnswerValues
} from "./schemas/AnswerSchemas.js";
