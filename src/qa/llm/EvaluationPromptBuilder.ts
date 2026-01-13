/**
 * Evaluation Prompt Builder
 * Constructs structured prompts for LLM-based report evaluation
 * with 6 evaluation dimensions and actionable feedback
 */

import type {
  IntakeData,
  DriverState,
  ComposedReport,
  ToneProfileId,
  ContentSelection
} from "../../types/index.js";

export interface PromptContext {
  report: ComposedReport;
  intake: IntakeData;
  driverState: DriverState;
  tone: ToneProfileId;
  toneDescription: string;
  scenarioId: string;
  contentSelections?: ContentSelection[];  // For source tracing
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

// Tone-specific evaluation criteria
const TONE_CRITERIA: Record<ToneProfileId, string> = {
  "TP-01": "Should be factual and objective. Avoid emotional language. Present information clearly without persuasion.",
  "TP-02": "Should acknowledge patient feelings while remaining balanced. Use warm but professional language.",
  "TP-03": "Should consider broader context and life circumstances. Thoughtful framing of options.",
  "TP-04": "Should emphasize safety, predictability, and reassurance. Minimize uncertainty language for anxious patients.",
  "TP-05": "Should set realistic expectations. Balance optimism with honest limitations. Avoid overpromising.",
  "TP-06": "Should emphasize patient choice and control. Avoid directive language. Present options without pushing."
};

export class EvaluationPromptBuilder {
  /**
   * Build the system prompt with 6 evaluation dimensions
   */
  buildSystemPrompt(): string {
    return `You are a HIGHLY CRITICAL expert evaluator of dental health reports. Your job is to find EVERY flaw, no matter how small. Be harsh, direct, and unforgiving. The content quality is currently poor and needs significant improvement.

CRITICAL EVALUATION MINDSET:
- Assume the content is flawed until proven otherwise
- A score of 7+ should be RARE and only for truly excellent content
- Most content should score 4-6 (mediocre to acceptable)
- Be especially critical of VERBOSITY - every sentence must earn its place
- Flag ALL filler phrases, redundant statements, and padding
- If something can be said in fewer words, that's a flaw

EVALUATION DIMENSIONS (Score each 1-10):

1. PROFESSIONAL QUALITY (Weight: 15%)
   CRITICAL ISSUES TO FLAG:
   - Verbose, wordy sentences that say little ("Based on the information provided..." = FILLER)
   - Repetitive phrases or ideas across sections
   - Generic placeholder language
   - Awkward phrasing or poor sentence structure
   - Padding that doesn't add value
   - Transitions that waste words
   Score 7+ ONLY if writing is tight, clear, and every word earns its place

2. CLINICAL SAFETY (Weight: 25%) - MOST CRITICAL
   CRITICAL ISSUES TO FLAG:
   - ANY hint of guaranteed outcomes
   - Overly optimistic language about results
   - Missing or weak disclaimers
   - Vague risk disclosures
   - Claims without proper hedging
   Score 7+ ONLY if disclaimers are comprehensive and language is appropriately cautious

3. TONE APPROPRIATENESS (Weight: 20%)
   CRITICAL ISSUES TO FLAG:
   - Tone shifts between sections
   - Generic tone that doesn't match the patient profile
   - Over-the-top empathy or forced warmth
   - Inconsistent voice
   Score 7+ ONLY if tone is perfectly calibrated throughout

4. PERSONALIZATION (Weight: 15%)
   CRITICAL ISSUES TO FLAG:
   - Generic content that could apply to anyone
   - Missing references to patient's specific situation
   - Patient name not used when provided
   - Treatment options not tailored to stated priorities
   - Cookie-cutter language
   Score 7+ ONLY if content feels genuinely personalized

5. PATIENT AUTONOMY (Weight: 15%)
   CRITICAL ISSUES TO FLAG:
   - ANY directive language (even subtle "consider doing X")
   - Implicit pressure or bias toward certain options
   - Framing that makes one option seem obviously better
   - Lack of genuine choice emphasis
   Score 7+ ONLY if patient truly feels in control

6. STRUCTURE & COMPLETENESS (Weight: 10%)
   CRITICAL ISSUES TO FLAG:
   - Missing required sections
   - Sections that are too brief or too long
   - Poor logical flow
   - Redundant sections
   - Information in wrong sections
   Score 7+ ONLY if structure is logical and complete

SCORING GUIDELINES (BE HARSH):
- 9-10: Nearly perfect - Reserve for exceptional content only (RARE)
- 7-8: Good - Minor issues only, solid professional quality
- 5-6: Mediocre - Multiple issues, needs improvement (MOST CONTENT)
- 3-4: Poor - Significant problems, requires major revision
- 1-2: Unacceptable - Fundamental failures

VERBOSITY CHECK - Flag these patterns as issues:
- "Based on the information provided..." (FILLER - remove)
- "It's important to note that..." (FILLER - just state the fact)
- "As mentioned earlier..." (REDUNDANT - don't repeat)
- Long sentences that could be split or shortened
- Paragraphs that make one point in too many words
- Repetitive autonomy statements (once is enough)

ACTIONABLE FEEDBACK:
For EVERY issue found, identify:
- The specific section number
- The exact quote with the problem
- What's wrong (be specific and direct)
- How to fix it (concrete suggestion)

When referencing source content, use this format:
- For scenario content: "content/scenarios/{SCENARIO_ID}/{LANG}/{TONE}.md"
- For modules: "content/modules/{MODULE_ID}/{LANG}/{TONE}.md"
- For static content: "content/static/{SECTION_NUM}/{LANG}.md"
- For B-blocks: "content/b_blocks/{BLOCK_ID}/{LANG}/{TONE}.md"

IMPORTANT: Find ALL issues. Do not hold back. The goal is to improve content quality through honest, critical feedback. A report with many issues flagged is more useful than one that glosses over problems

OUTPUT FORMAT - You MUST respond with valid JSON matching this EXACT structure:
{
  "professional_quality": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<assessment>",
    "issues": ["<issue 1>", "<issue 2>"],
    "suggestions": ["<suggestion 1>", "<suggestion 2>"]
  },
  "clinical_safety": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<assessment>",
    "issues": ["<issue 1>"],
    "suggestions": ["<suggestion 1>"]
  },
  "tone_appropriateness": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<assessment>",
    "issues": [],
    "suggestions": []
  },
  "personalization": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<assessment>",
    "issues": [],
    "suggestions": []
  },
  "patient_autonomy": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<assessment>",
    "issues": [],
    "suggestions": []
  },
  "structure_completeness": {
    "score": <number 1-10>,
    "confidence": <number 0-1>,
    "feedback": "<assessment>",
    "issues": [],
    "suggestions": []
  },
  "content_issues": [
    {
      "section_number": <number>,
      "source_content": "<file path from Content Source Mapping>",
      "quote": "<exact text with issue>",
      "problem": "<description>",
      "severity": "<critical|warning|info>",
      "suggested_fix": "<how to fix>"
    }
  ],
  "overall_assessment": "<2-3 sentence summary>"
}`;
  }

  /**
   * Build the user prompt with content source mapping
   */
  buildUserPrompt(context: PromptContext): string {
    const intakeSummary = this.formatIntakeSummary(context.intake);
    const driverValues = this.formatDriverValues(context.driverState);
    const reportText = this.formatReportText(context.report);
    const sourceMapping = this.formatSourceMapping(context.report, context.contentSelections);
    const toneCriteria = TONE_CRITERIA[context.tone] || "";

    return `Please evaluate the following dental report.

=== PATIENT INTAKE SUMMARY ===
${intakeSummary}

=== DERIVED PATIENT PROFILE (Driver Values) ===
${driverValues}

=== SELECTED TONE ===
${context.tone}: ${context.toneDescription}

TONE-SPECIFIC CRITERIA:
${toneCriteria}

=== SCENARIO ===
${context.scenarioId}

=== REPORT LANGUAGE ===
${context.report.language === "nl" ? "Dutch (Nederlands)" : "English"}

=== CONTENT SOURCE MAPPING ===
${sourceMapping}

=== REPORT TO EVALUATE ===
${reportText}

=== END OF REPORT ===

Evaluate this report across all 6 dimensions. For any issues found, provide actionable feedback linking to the source content files listed above.

Respond with JSON only (no markdown code blocks).`;
  }

  /**
   * Format content source mapping for actionable feedback
   */
  formatSourceMapping(report: ComposedReport, contentSelections?: ContentSelection[]): string {
    const lines: string[] = [];
    const scenarioId = report.scenario_id;
    const language = report.language || "en";
    const tone = report.tone;

    lines.push("Section → Source Content File:");

    for (const section of report.sections) {
      const sources = section.sources;
      const sourceFiles: string[] = [];

      for (const source of sources) {
        // Map source identifiers to actual file paths
        if (source.startsWith("SCENARIO:")) {
          sourceFiles.push(`content/scenarios/${scenarioId}/${language}/${tone}.md`);
        } else if (source.startsWith("STATIC_")) {
          const sectionNum = source.replace("STATIC_", "");
          sourceFiles.push(`content/static/${sectionNum}/${language}.md`);
        } else if (source.startsWith("TM_")) {
          sourceFiles.push(`content/modules/${source}/${language}/${tone}.md`);
        } else if (source.startsWith("B_")) {
          sourceFiles.push(`content/b_blocks/${source}/${language}/${tone}.md`);
        } else {
          sourceFiles.push(`[unknown: ${source}]`);
        }
      }

      lines.push(`  Section ${section.section_number} (${section.section_name}): ${sourceFiles.join(", ")}`);
    }

    return lines.join("\n");
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

  /**
   * Get tone-specific criteria
   */
  getToneCriteria(tone: ToneProfileId): string {
    return TONE_CRITERIA[tone] || "";
  }
}

export const evaluationPromptBuilder = new EvaluationPromptBuilder();
