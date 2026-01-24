/**
 * LLM Report Evaluator (Simplified)
 * Evaluates report quality with 6 dimensions
 * Uses report-only context (no audit trail/driver state)
 */

import { z } from "zod";
import { createLLMProvider, type LLMProvider } from "../agents/shared/LLMProvider";
import type { ComposedReport, LLMEvaluationResult, QAOutcome } from "../pipeline/types";

// Simplified evaluation schema - scores + assessment only
const SimplifiedEvaluationSchema = z.object({
  professional_quality: z.object({ score: z.number().describe("Score 1-10") }),
  clinical_safety: z.object({ score: z.number().describe("Score 1-10") }),
  tone_appropriateness: z.object({ score: z.number().describe("Score 1-10") }),
  personalization: z.object({ score: z.number().describe("Score 1-10") }),
  patient_autonomy: z.object({ score: z.number().describe("Score 1-10") }),
  structure_completeness: z.object({ score: z.number().describe("Score 1-10") }),
  overall_assessment: z.string().describe("2-3 sentence summary of report quality")
});

type SimplifiedEvaluation = z.infer<typeof SimplifiedEvaluationSchema>;

// Simplified system prompt - focused on scoring
const SYSTEM_PROMPT = `You are an expert evaluator of dental health reports.

Evaluate the report across 6 dimensions (score 1-10 each):

1. PROFESSIONAL QUALITY (15% weight)
   - Writing clarity, flow, no filler or redundant phrases
   - Professional language appropriate for patient communication

2. CLINICAL SAFETY (25% weight) - MOST IMPORTANT
   - Appropriate disclaimers present
   - No guaranteed outcomes or overpromising
   - Risk factors mentioned appropriately

3. TONE APPROPRIATENESS (20% weight)
   - Consistent tone throughout
   - Matches the stated tone profile

4. PERSONALIZATION (15% weight)
   - Content feels specific to the patient's situation
   - Not generic/cookie-cutter language

5. PATIENT AUTONOMY (15% weight)
   - Non-directive language
   - Presents options without pushing one choice
   - Respects patient's right to decide

6. STRUCTURE & COMPLETENESS (10% weight)
   - Logical flow between sections
   - All expected information present

SCORING GUIDE:
- 9-10: Excellent - minor improvements only
- 7-8: Good - solid quality with small issues
- 5-6: Acceptable - noticeable issues but usable
- 3-4: Poor - significant problems
- 1-2: Unacceptable

Provide a brief overall assessment (2-3 sentences) summarizing the report quality.`;

// Dimension weights for overall score calculation
const DIMENSION_WEIGHTS = {
  professional_quality: 0.15,
  clinical_safety: 0.25,
  tone_appropriateness: 0.20,
  personalization: 0.15,
  patient_autonomy: 0.15,
  structure_completeness: 0.10
};

export interface LLMEvaluatorConfig {
  enabled: boolean;
  model?: string;
  temperature?: number;
}

const DEFAULT_CONFIG: LLMEvaluatorConfig = {
  enabled: true,
  model: "claude-sonnet-4-20250514",
  temperature: 0.1  // Low temperature for consistent evaluations
};

export class LLMReportEvaluator {
  private config: LLMEvaluatorConfig;
  private provider: LLMProvider | null = null;

  constructor(config?: Partial<LLMEvaluatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the LLM provider (lazy)
   */
  private getProvider(): LLMProvider {
    if (!this.provider) {
      this.provider = createLLMProvider({
        model: this.config.model,
        temperature: this.config.temperature
      });
    }
    return this.provider;
  }

  /**
   * Build user prompt with ONLY the report (no audit trail)
   */
  private buildUserPrompt(report: ComposedReport): string {
    const reportContent = report.sections
      .map(s => `## ${s.section_name} (Section ${s.section_number})\n${s.content}`)
      .join("\n\n");

    return `Evaluate this dental report:

LANGUAGE: ${report.language === "nl" ? "Dutch (Nederlands)" : "English"}
TONE PROFILE: ${report.tone}
SCENARIO: ${report.scenario_id}
TOTAL WORDS: ${report.total_word_count}

--- REPORT CONTENT ---

${reportContent}

--- END OF REPORT ---

Evaluate all 6 dimensions and provide your assessment.`;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(evaluation: SimplifiedEvaluation): number {
    const score =
      evaluation.professional_quality.score * DIMENSION_WEIGHTS.professional_quality +
      evaluation.clinical_safety.score * DIMENSION_WEIGHTS.clinical_safety +
      evaluation.tone_appropriateness.score * DIMENSION_WEIGHTS.tone_appropriateness +
      evaluation.personalization.score * DIMENSION_WEIGHTS.personalization +
      evaluation.patient_autonomy.score * DIMENSION_WEIGHTS.patient_autonomy +
      evaluation.structure_completeness.score * DIMENSION_WEIGHTS.structure_completeness;

    return Math.round(score * 10) / 10;
  }

  /**
   * Determine outcome based on scores (informational only, never blocks)
   */
  private determineOutcome(overallScore: number): { outcome: QAOutcome; reasoning: string } {
    if (overallScore >= 8) {
      return { outcome: "PASS", reasoning: "Report meets quality standards" };
    } else if (overallScore >= 6) {
      return { outcome: "FLAG", reasoning: `Overall score ${overallScore.toFixed(1)} indicates room for improvement` };
    } else {
      return { outcome: "FLAG", reasoning: `Low overall score ${overallScore.toFixed(1)} - quality concerns` };
    }
  }

  /**
   * Evaluate a report using LLM
   * Returns simplified evaluation with scores + assessment
   */
  async evaluate(report: ComposedReport): Promise<LLMEvaluationResult | null> {
    if (!this.config.enabled) {
      return null;
    }

    const startTime = Date.now();

    try {
      const provider = this.getProvider();
      const userPrompt = this.buildUserPrompt(report);

      console.log(`🔍 [LLMEvaluator] Evaluating report ${report.session_id}...`);

      const response = await provider.generateStructured(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        SimplifiedEvaluationSchema,
        "evaluation",
        {
          traceName: "report-evaluation",
          sessionId: report.session_id,
          metadata: { scenario: report.scenario_id, tone: report.tone }
        }
      );

      const evaluation = response.object;
      const overallScore = this.calculateOverallScore(evaluation);
      const { outcome, reasoning } = this.determineOutcome(overallScore);
      const duration = Date.now() - startTime;

      console.log(`✅ [LLMEvaluator] Score: ${overallScore}/10 (${outcome}) in ${duration}ms`);

      // Convert to full LLMEvaluationResult format (with empty arrays for unused fields)
      return {
        professional_quality: {
          score: evaluation.professional_quality.score,
          confidence: 1,
          feedback: "",
          issues: [],
          suggestions: []
        },
        clinical_safety: {
          score: evaluation.clinical_safety.score,
          confidence: 1,
          feedback: "",
          issues: [],
          suggestions: []
        },
        tone_appropriateness: {
          score: evaluation.tone_appropriateness.score,
          confidence: 1,
          feedback: "",
          issues: [],
          suggestions: []
        },
        personalization: {
          score: evaluation.personalization.score,
          confidence: 1,
          feedback: "",
          issues: [],
          suggestions: []
        },
        patient_autonomy: {
          score: evaluation.patient_autonomy.score,
          confidence: 1,
          feedback: "",
          issues: [],
          suggestions: []
        },
        structure_completeness: {
          score: evaluation.structure_completeness.score,
          confidence: 1,
          feedback: "",
          issues: [],
          suggestions: []
        },
        content_issues: [],
        content_files_to_review: [],
        overall_score: overallScore,
        overall_assessment: evaluation.overall_assessment,
        recommended_outcome: outcome,
        outcome_reasoning: reasoning,
        metadata: {
          model_used: this.config.model || DEFAULT_CONFIG.model!,
          evaluation_timestamp: new Date().toISOString(),
          duration_ms: duration,
          token_usage: {
            input_tokens: response.usage?.inputTokens ?? 0,
            output_tokens: response.usage?.outputTokens ?? 0
          }
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [LLMEvaluator] Error after ${duration}ms:`, error);

      // Return null on error - evaluation is optional, shouldn't block report
      return null;
    }
  }

  /**
   * Check if evaluator is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable the evaluator
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Default instance
export const llmReportEvaluator = new LLMReportEvaluator();

/**
 * Create a new evaluator instance
 */
export function createLLMReportEvaluator(config?: Partial<LLMEvaluatorConfig>): LLMReportEvaluator {
  return new LLMReportEvaluator(config);
}
