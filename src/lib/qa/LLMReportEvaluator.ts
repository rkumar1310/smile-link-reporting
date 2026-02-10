/**
 * LLM Report Evaluator (Simplified)
 * Evaluates report quality with 6 dimensions
 * Uses report-only context (no audit trail/driver state)
 */

import { z } from "zod";
import { createLLMProvider, type LLMProvider } from "../agents/shared/LLMProvider";
import type { ComposedReport, LLMEvaluationResult, QAOutcome, IntakeData } from "../pipeline/types";
import { getSystemGoalCondensed, EVALUATION_CRITERIA } from "../agents/shared/system-goal";

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

// Build system prompt with system goal context
const SYSTEM_PROMPT = `You are a critical evaluator of dental health reports. Carefully analyze each dimension for problems. When you find a problem, deduct points based on severity. When you genuinely find no issues in a dimension, score it 10.

${getSystemGoalCondensed()}

## REPORT STRUCTURE

Reports may include some or all of these sections depending on the patient's scenario:

- **Important Notices** (Section 0) - Treatment limitations or special alerts when applicable
- **Disclaimer** - Legal disclaimers about the informational nature of the report
- **Your Personal Summary** - Brief overview addressing the patient directly
- **Context** - Background on the patient's dental journey and considerations
- **Interpretation** - Clinical interpretation of the patient's dental profile
- **Treatment Options** - Available treatment options (when multiple options exist)
- **Comparison** - Side-by-side comparison of options (when comparing treatments)
- **Trade-offs to Consider** - Pros and cons of approaches (when relevant)
- **Treatment Process** - What to expect during treatment (when applicable)
- **Cost Considerations** - General cost factors (without specific prices)
- **Risk Factors** - Potential risks and mitigation strategies
- **Next Steps** - Guidance for the patient's next actions

Not all sections are required for every report. The sections included should be appropriate for the patient's specific situation. Do NOT penalize reports for omitting sections that aren't relevant to the patient's scenario.

## EVALUATION DIMENSIONS (score 1-10 each)

SCORING RULE: Start at 10 for each dimension. Deduct points when you identify specific problems:
- Minor issue: deduct 1 point (score 9)
- Moderate issue: deduct 2-3 points (score 7-8)
- Significant issue: deduct 4+ points (score 6 or below)

1. PROFESSIONAL QUALITY (15% weight)
   Start at 10. Deduct only for: grammar errors, unclear writing, unprofessional language

2. CLINICAL SAFETY (25% weight)
   Start at 10. Deduct only for: missing disclaimers, specific price quotes, diagnosis claims, outcome guarantees

3. TONE APPROPRIATENESS (20% weight)
   Start at 10. Deduct only for: dismissive language, inappropriate tone, inconsistent voice

4. PERSONALIZATION (15% weight)
   Start at 10. Deduct for:
   - Content completely unrelated to patient's concern
   - Missed opportunities: if intake answers mention specific issues (e.g., "loose teeth", "5+ teeth need replacing") that the report fails to address
   The report should contain information relevant to the patient's intake answers. Exact quotes not required - general relevance is sufficient.

5. PATIENT AUTONOMY (15% weight)
   Start at 10. Deduct only for: pushy language, pressuring toward specific treatment choices

6. STRUCTURE & COMPLETENESS (10% weight)
   Start at 10. Deduct only for: illogical section order, missing critical information
   (Not all sections required - evaluate what IS present, not what's absent)

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
  model: "claude-opus-4-5-20251101",
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
   * Build user prompt with report and optional intake answers
   */
  private buildUserPrompt(report: ComposedReport, intake?: IntakeData): string {
    const reportContent = report.sections
      .map(s => `## ${s.section_name} (Section ${s.section_number})\n${s.content}`)
      .join("\n\n");

    // Format intake answers if provided
    let intakeSection = "";
    if (intake?.answers && intake.answers.length > 0) {
      const answersFormatted = intake.answers
        .filter(a => !a.skipped)
        .map(a => {
          const answerText = Array.isArray(a.answer) ? a.answer.join(", ") : a.answer;
          return `- ${a.question_id}: ${answerText}`;
        })
        .join("\n");

      intakeSection = `
--- PATIENT INTAKE ANSWERS ---

These are the patient's responses to the intake questionnaire. The report should accurately reflect and address the patient's specific situation based on these answers:

${answersFormatted}

--- END OF INTAKE ANSWERS ---

`;
    }

    return `Evaluate this dental report:

LANGUAGE: ${report.language === "nl" ? "Dutch (Nederlands)" : "English"}
TONE PROFILE: ${report.tone}
SCENARIO: ${report.scenario_id}
TOTAL WORDS: ${report.total_word_count}
${intakeSection}
--- REPORT CONTENT ---

${reportContent}

--- END OF REPORT ---

Evaluate all 6 dimensions and provide your assessment.${intake ? " Consider whether the report appropriately addresses the patient's intake answers." : ""}`;
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
   * @param report The composed report to evaluate
   * @param intake Optional patient intake data to include in evaluation context
   */
  async evaluate(report: ComposedReport, intake?: IntakeData): Promise<LLMEvaluationResult | null> {
    if (!this.config.enabled) {
      return null;
    }

    const startTime = Date.now();

    try {
      const provider = this.getProvider();
      const userPrompt = this.buildUserPrompt(report, intake);

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
