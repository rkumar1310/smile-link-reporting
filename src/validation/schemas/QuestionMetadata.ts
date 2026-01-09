/**
 * Question Metadata
 * Defines required, critical, multi-select flags and conditional rules
 * Derived from config/tag-extraction-rules.json
 */

export type ValidationQuestionId =
  | "Q1" | "Q2" | "Q2a" | "Q3" | "Q4" | "Q5"
  | "Q6a" | "Q6b" | "Q6c" | "Q6d"
  | "Q7" | "Q8" | "Q9" | "Q10" | "Q11" | "Q12"
  | "Q13" | "Q14" | "Q15" | "Q16a" | "Q16b" | "Q17" | "Q18";

export const ValidQuestionIds = new Set<string>([
  "Q1", "Q2", "Q2a", "Q3", "Q4", "Q5",
  "Q6a", "Q6b", "Q6c", "Q6d",
  "Q7", "Q8", "Q9", "Q10", "Q11", "Q12",
  "Q13", "Q14", "Q15", "Q16a", "Q16b", "Q17", "Q18"
]);

/** Questions that allow multiple selections (answers must be array) */
export const MultiSelectQuestions = new Set<ValidationQuestionId>(["Q3", "Q4", "Q6d"]);

/** Questions that MUST be answered */
export const RequiredQuestions = new Set<ValidationQuestionId>(["Q5", "Q6a"]);

/** Critical L1 safety questions */
export const CriticalQuestions = new Set<ValidationQuestionId>(["Q5", "Q13", "Q16a", "Q17"]);

/** Conditional dependency rules */
export interface ConditionalRule {
  questionId: ValidationQuestionId;
  dependsOn: ValidationQuestionId;
  requiredValues: string[];
}

export const ConditionalRules: ConditionalRule[] = [
  {
    questionId: "Q2a",
    dependsOn: "Q2",
    requiredValues: ["1", "2", "3", "4"]
  }
];

/** Question names for error messages */
export const QuestionNames: Record<ValidationQuestionId, string> = {
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
  Q18: "Dental anxiety"
};
