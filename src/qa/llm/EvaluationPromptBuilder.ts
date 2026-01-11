/**
 * Evaluation Prompt Builder
 * Constructs structured prompts for LLM-based report evaluation
 */

import type {
  IntakeData,
  DriverState,
  ComposedReport,
  ToneProfileId,
  DriverId
} from "../../types/index.js";

export interface PromptContext {
  report: ComposedReport;
  intake: IntakeData;
  driverState: DriverState;
  tone: ToneProfileId;
  toneDescription: string;
  scenarioId: string;
}

// Tone descriptions for context
const TONE_DESCRIPTIONS: Record<ToneProfileId, string> = {
  "TP-01": "Neutral-Informative: Clear, factual, professional tone without emotional emphasis",
  "TP-02": "Empathic-Neutral: Warm and understanding while maintaining objectivity",
  "TP-03": "Reflective-Contextual: Thoughtful, considers patient's broader situation",
  "TP-04": "Stability-Frame: Reassuring, emphasizes safety and predictability for anxious patients",
  "TP-05": "Expectation-Calibration: Manages expectations carefully, realistic about outcomes",
  "TP-06": "Autonomy-Respecting: Emphasizes patient choice and control over decisions"
};

export class EvaluationPromptBuilder {
  /**
   * Build the system prompt with evaluation criteria
   */
  buildSystemPrompt(): string {
    return `You are an expert evaluator of personalized dental health reports. Your task is to evaluate reports across three dimensions and provide structured feedback.

EVALUATION DIMENSIONS:

1. QUALITY & COHERENCE (Score 1-10)
   - Writing quality and grammatical correctness
   - Logical flow between sections
   - Readability and clarity
   - Professional tone maintenance
   - Appropriate length and detail level
   - No repetition or contradictions

2. CLINICAL ACCURACY (Score 1-10)
   - Medical/dental accuracy of information
   - Appropriate disclaimers present
   - No unsafe or misleading recommendations
   - Risk disclosures where appropriate
   - No guaranteed outcomes or absolute claims
   - Balanced presentation of options

3. PERSONALIZATION (Score 1-10)
   - How well the report addresses the patient's specific situation
   - Tone appropriateness for the patient profile
   - Relevance of treatment options to stated concerns
   - Appropriate empathy level based on anxiety indicators
   - References to patient's specific inputs
   - Alignment between driver values and content

SCORING GUIDELINES:
- 9-10: Excellent, no significant issues
- 7-8: Good, minor improvements possible
- 5-6: Acceptable, notable issues to address
- 3-4: Poor, significant problems
- 1-2: Unacceptable, major failures

OUTCOME RECOMMENDATIONS:
- PASS: Overall score >= 7 and no dimension below 5
- FLAG: Overall score 4-7 or any dimension 3-5
- BLOCK: Overall score < 4 or any dimension below 3

OUTPUT FORMAT:
You MUST respond with valid JSON matching this exact structure (no markdown, just raw JSON):
{
  "quality": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<detailed assessment>",
    "issues": ["<issue 1>", "<issue 2>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  },
  "clinical_accuracy": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<detailed assessment>",
    "issues": ["<issue 1>", "<issue 2>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  },
  "personalization": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<detailed assessment>",
    "issues": ["<issue 1>", "<issue 2>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  },
  "overall_assessment": "<2-3 sentence summary of the evaluation>",
  "recommended_outcome": "<PASS|FLAG|BLOCK>",
  "outcome_reasoning": "<explanation for the recommended outcome>"
}`;
  }

  /**
   * Build the user prompt with the actual content to evaluate
   */
  buildUserPrompt(context: PromptContext): string {
    const intakeSummary = this.formatIntakeSummary(context.intake);
    const driverValues = this.formatDriverValues(context.driverState);
    const reportText = this.formatReportText(context.report);

    return `Please evaluate the following dental report.

=== PATIENT INTAKE SUMMARY ===
${intakeSummary}

=== DERIVED PATIENT PROFILE (Driver Values) ===
${driverValues}

=== SELECTED TONE ===
${context.tone}: ${context.toneDescription}

=== SCENARIO ===
${context.scenarioId}

=== REPORT LANGUAGE ===
${context.report.language === "nl" ? "Dutch (Nederlands)" : "English"}

=== REPORT TO EVALUATE ===
${reportText}

=== END OF REPORT ===

Evaluate this report and respond with JSON only (no markdown code blocks):`;
  }

  /**
   * Format intake data into a readable summary
   */
  formatIntakeSummary(intake: IntakeData): string {
    const lines: string[] = [];

    lines.push(`Session ID: ${intake.session_id}`);
    lines.push(`Language: ${intake.language || "en"}`);

    if (intake.metadata?.patient_name) {
      lines.push(`Patient Name: ${intake.metadata.patient_name}`);
    }
    if (intake.metadata?.tooth_location) {
      lines.push(`Tooth Location: ${intake.metadata.tooth_location}`);
    }

    lines.push("");
    lines.push("Questionnaire Answers:");

    for (const answer of intake.answers) {
      if (answer.skipped) {
        lines.push(`  ${answer.question_id}: [skipped]`);
      } else {
        const answerText = Array.isArray(answer.answer)
          ? answer.answer.join(", ")
          : answer.answer;
        lines.push(`  ${answer.question_id}: ${answerText}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Format driver state into readable profile
   */
  formatDriverValues(driverState: DriverState): string {
    const lines: string[] = [];

    // Group by layer
    const layers: Record<string, string[]> = {
      L1: [],
      L2: [],
      L3: []
    };

    for (const [driverId, driver] of Object.entries(driverState.drivers)) {
      const line = `${driverId}: ${driver.value} (${driver.source}, confidence: ${driver.confidence.toFixed(2)})`;
      layers[driver.layer]?.push(line);
    }

    lines.push("Layer 1 (Safety):");
    for (const l of layers.L1) {
      lines.push(`  ${l}`);
    }

    lines.push("");
    lines.push("Layer 2 (Personalization):");
    for (const l of layers.L2) {
      lines.push(`  ${l}`);
    }

    lines.push("");
    lines.push("Layer 3 (Narrative):");
    for (const l of layers.L3) {
      lines.push(`  ${l}`);
    }

    if (driverState.conflicts.length > 0) {
      lines.push("");
      lines.push("Conflicts Resolved:");
      for (const conflict of driverState.conflicts) {
        lines.push(`  ${conflict.driver_id}: ${conflict.conflicting_values.join(" vs ")} → ${conflict.resolved_value}`);
      }
    }

    if (driverState.fallbacks_applied.length > 0) {
      lines.push("");
      lines.push(`Fallbacks Applied: ${driverState.fallbacks_applied.join(", ")}`);
    }

    return lines.join("\n");
  }

  /**
   * Format composed report into evaluation-ready text
   */
  formatReportText(report: ComposedReport): string {
    const lines: string[] = [];

    lines.push(`Scenario: ${report.scenario_id}`);
    lines.push(`Tone: ${report.tone}`);
    lines.push(`Confidence: ${report.confidence}`);
    lines.push(`Total Words: ${report.total_word_count}`);
    lines.push(`Warnings Included: ${report.warnings_included}`);

    if (report.suppressed_sections.length > 0) {
      lines.push(`Suppressed Sections: ${report.suppressed_sections.join(", ")}`);
    }

    lines.push("");
    lines.push("--- REPORT CONTENT ---");
    lines.push("");

    for (const section of report.sections) {
      lines.push(`## ${section.section_name} (Section ${section.section_number})`);
      lines.push(`[${section.word_count} words, sources: ${section.sources.join(", ")}]`);
      lines.push("");
      lines.push(section.content);
      lines.push("");
    }

    if (report.placeholders_unresolved.length > 0) {
      lines.push("--- UNRESOLVED PLACEHOLDERS ---");
      lines.push(report.placeholders_unresolved.join(", "));
    }

    return lines.join("\n");
  }

  /**
   * Get tone description
   */
  getToneDescription(tone: ToneProfileId): string {
    return TONE_DESCRIPTIONS[tone] || `Tone ${tone}`;
  }
}

export const evaluationPromptBuilder = new EvaluationPromptBuilder();
