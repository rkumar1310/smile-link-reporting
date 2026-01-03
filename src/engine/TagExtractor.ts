/**
 * Tag Extractor
 * Extracts tags from question answers based on extraction rules
 */

import type {
  QuestionId,
  QuestionAnswer,
  IntakeData,
  ExtractedTag,
  TagExtractionResult
} from "../types/index.js";

import tagExtractionRules from "../../config/tag-extraction-rules.json" with { type: "json" };

interface QuestionRule {
  name: string;
  required?: boolean;
  critical?: boolean;
  layer?: string;
  type?: string;
  multi_select?: boolean;
  conditional_on?: Record<string, string[]>;
  answers?: Record<string, string[]>;
  ranges?: Record<string, string[]>;
}

type TagExtractionRulesConfig = {
  version: string;
  questions: Record<string, QuestionRule>;
};

const rules = tagExtractionRules as TagExtractionRulesConfig;

export class TagExtractor {
  private rules: TagExtractionRulesConfig;

  constructor() {
    this.rules = rules;
  }

  /**
   * Extract tags from intake data
   */
  extract(intake: IntakeData): TagExtractionResult {
    const tags: ExtractedTag[] = [];
    const missingQuestions: QuestionId[] = [];
    const answeredQuestions = new Map<QuestionId, string | string[]>();

    // Build map of answered questions
    for (const answer of intake.answers) {
      if (!answer.skipped) {
        answeredQuestions.set(answer.question_id, answer.answer);
      }
    }

    // Process each question in the rules
    for (const [questionId, questionRule] of Object.entries(this.rules.questions)) {
      const qId = questionId as QuestionId;
      const answer = answeredQuestions.get(qId);

      // Check if required question is missing
      if (questionRule.required && !answer) {
        missingQuestions.push(qId);
        continue;
      }

      // Skip if no answer
      if (!answer) continue;

      // Check conditional rules
      if (questionRule.conditional_on) {
        let conditionMet = false;
        for (const [condQId, condValues] of Object.entries(questionRule.conditional_on)) {
          const condAnswer = answeredQuestions.get(condQId as QuestionId);
          if (condAnswer && condValues.includes(String(condAnswer))) {
            conditionMet = true;
            break;
          }
        }
        if (!conditionMet) continue;
      }

      // Extract tags based on question type
      if (questionRule.type === "numeric_range" && questionRule.ranges) {
        // Handle numeric range questions (e.g., satisfaction score)
        const extractedTags = this.extractFromNumericRange(
          qId,
          answer,
          questionRule.ranges
        );
        tags.push(...extractedTags);
      } else if (questionRule.answers) {
        // Handle standard answer mapping
        const extractedTags = this.extractFromAnswers(
          qId,
          answer,
          questionRule.answers,
          questionRule.multi_select ?? false
        );
        tags.push(...extractedTags);
      }
    }

    return {
      session_id: intake.session_id,
      tags,
      missing_questions: missingQuestions
    };
  }

  /**
   * Extract tags from numeric range questions
   */
  private extractFromNumericRange(
    questionId: QuestionId,
    answer: string | string[],
    ranges: Record<string, string[]>
  ): ExtractedTag[] {
    const tags: ExtractedTag[] = [];
    const numValue = parseInt(String(answer), 10);

    if (isNaN(numValue)) return tags;

    for (const [range, rangeTags] of Object.entries(ranges)) {
      const [min, max] = range.split("-").map(Number);
      if (numValue >= min && numValue <= max) {
        for (const tag of rangeTags) {
          tags.push({
            tag,
            source_question: questionId,
            source_answer: String(answer)
          });
        }
        break;
      }
    }

    return tags;
  }

  /**
   * Extract tags from standard answer mappings
   */
  private extractFromAnswers(
    questionId: QuestionId,
    answer: string | string[],
    answerMap: Record<string, string[]>,
    multiSelect: boolean
  ): ExtractedTag[] {
    const tags: ExtractedTag[] = [];
    const answers = multiSelect && Array.isArray(answer) ? answer : [String(answer)];

    for (const ans of answers) {
      const normalizedAnswer = this.normalizeAnswer(ans);
      const matchedTags = answerMap[normalizedAnswer];

      if (matchedTags) {
        for (const tag of matchedTags) {
          tags.push({
            tag,
            source_question: questionId,
            source_answer: ans
          });
        }
      }
    }

    return tags;
  }

  /**
   * Normalize answer for matching
   */
  private normalizeAnswer(answer: string): string {
    return answer
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  /**
   * Get all possible tags for a question
   */
  getPossibleTags(questionId: QuestionId): string[] {
    const questionRule = this.rules.questions[questionId];
    if (!questionRule) return [];

    const allTags: string[] = [];

    if (questionRule.answers) {
      for (const tags of Object.values(questionRule.answers)) {
        allTags.push(...tags);
      }
    }

    if (questionRule.ranges) {
      for (const tags of Object.values(questionRule.ranges)) {
        allTags.push(...tags);
      }
    }

    return [...new Set(allTags)];
  }

  /**
   * Check if a question is required
   */
  isRequired(questionId: QuestionId): boolean {
    return this.rules.questions[questionId]?.required ?? false;
  }

  /**
   * Check if a question is critical (L1 safety)
   */
  isCritical(questionId: QuestionId): boolean {
    return this.rules.questions[questionId]?.critical ?? false;
  }
}

export const tagExtractor = new TagExtractor();
