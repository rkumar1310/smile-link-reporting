/**
 * QA Gate
 * Orchestrates all QA checks and determines final outcome
 */

import type {
  ComposedReport,
  ContentSelection,
  ToneProfileId,
  QAOutcome,
  ValidationResult,
  SemanticViolation,
  IntakeData,
  DriverState,
  LLMEvaluationResult
} from "../types/index.js";

import { SemanticLeakageDetector, type DetectionResult } from "./SemanticLeakageDetector.js";
import { CompositionValidator } from "./CompositionValidator.js";
import { llmReportEvaluator } from "./LLMReportEvaluator.js";

export interface QAGateResult {
  outcome: QAOutcome;
  validationResult: ValidationResult;
  semanticResult: DetectionResult;
  llmEvaluation?: LLMEvaluationResult;  // Optional LLM evaluation result
  reasons: string[];
  canDeliver: boolean;
  requiresReview: boolean;
}

export interface QAGateConfig {
  maxCriticalViolations: number;
  maxWarningViolations: number;
  maxValidationErrors: number;
  maxValidationWarnings: number;
  blockOnUnresolvedPlaceholders: boolean;
  // LLM evaluator config
  llmEvaluatorEnabled: boolean;
  llmEvaluatorCanBlock: boolean;    // If false, LLM can only FLAG, not BLOCK
}

const DEFAULT_CONFIG: QAGateConfig = {
  maxCriticalViolations: 0,      // Any critical violation blocks
  maxWarningViolations: 5,        // More than 5 warnings flags
  maxValidationErrors: 0,         // Any validation error blocks
  maxValidationWarnings: 10,      // More than 10 warnings flags
  blockOnUnresolvedPlaceholders: false,
  llmEvaluatorEnabled: true,      // Always evaluate reports with LLM
  llmEvaluatorCanBlock: false     // LLM can only FLAG by default (safety)
};

export class QAGate {
  private semanticDetector: SemanticLeakageDetector;
  private compositionValidator: CompositionValidator;
  private config: QAGateConfig;

  constructor(config?: Partial<QAGateConfig>) {
    this.semanticDetector = new SemanticLeakageDetector();
    this.compositionValidator = new CompositionValidator();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Run all QA checks and determine outcome (async for LLM evaluation)
   */
  async check(
    report: ComposedReport,
    selections: ContentSelection[],
    tone: ToneProfileId,
    intake?: IntakeData,
    driverState?: DriverState
  ): Promise<QAGateResult> {
    const reasons: string[] = [];

    // Run semantic leakage detection
    const semanticResult = this.semanticDetector.detect(report.sections, tone);

    // Run composition validation
    const validationResult = this.compositionValidator.validate(report, selections);

    // Add semantic violations to validation result
    validationResult.semantic_violations = semanticResult.violations;

    // Determine rule-based outcome
    let outcome = this.determineRuleBasedOutcome(
      semanticResult,
      validationResult,
      report,
      reasons
    );

    // Run LLM evaluation if enabled and not already blocked
    let llmEvaluation: LLMEvaluationResult | undefined;

    if (
      this.config.llmEvaluatorEnabled &&
      outcome !== "BLOCK" &&
      intake &&
      driverState
    ) {
      // Update LLM evaluator enabled state
      llmReportEvaluator.setEnabled(true);

      llmEvaluation = await llmReportEvaluator.evaluate({
        report,
        intake,
        driverState,
        tone,
        scenarioId: report.scenario_id
      }) ?? undefined;

      if (llmEvaluation) {
        outcome = this.applyLLMOutcome(outcome, llmEvaluation, reasons);
      }
    }

    // If still passing, add success reason
    if (outcome === "PASS" && reasons.length === 0) {
      reasons.push("All QA checks passed");
    }

    return {
      outcome,
      validationResult,
      semanticResult,
      llmEvaluation,
      reasons,
      canDeliver: outcome !== "BLOCK",
      requiresReview: outcome === "FLAG"
    };
  }

  /**
   * Synchronous check (legacy method for backward compatibility)
   */
  checkSync(
    report: ComposedReport,
    selections: ContentSelection[],
    tone: ToneProfileId
  ): Omit<QAGateResult, "llmEvaluation"> {
    const reasons: string[] = [];

    // Run semantic leakage detection
    const semanticResult = this.semanticDetector.detect(report.sections, tone);

    // Run composition validation
    const validationResult = this.compositionValidator.validate(report, selections);

    // Add semantic violations to validation result
    validationResult.semantic_violations = semanticResult.violations;

    // Determine rule-based outcome
    const outcome = this.determineRuleBasedOutcome(
      semanticResult,
      validationResult,
      report,
      reasons
    );

    // If still passing, add success reason
    if (outcome === "PASS" && reasons.length === 0) {
      reasons.push("All QA checks passed");
    }

    return {
      outcome,
      validationResult,
      semanticResult,
      reasons,
      canDeliver: outcome !== "BLOCK",
      requiresReview: outcome === "FLAG"
    };
  }

  /**
   * Determine outcome from rule-based checks
   */
  private determineRuleBasedOutcome(
    semanticResult: DetectionResult,
    validationResult: ValidationResult,
    report: ComposedReport,
    reasons: string[]
  ): QAOutcome {
    let outcome: QAOutcome = "PASS";

    // Check for blocking conditions
    if (semanticResult.summary.critical > this.config.maxCriticalViolations) {
      outcome = "BLOCK";
      reasons.push(
        `${semanticResult.summary.critical} critical semantic violation(s) detected`
      );
    }

    if (validationResult.errors.length > this.config.maxValidationErrors) {
      outcome = "BLOCK";
      reasons.push(
        `${validationResult.errors.length} validation error(s) detected`
      );
    }

    if (
      this.config.blockOnUnresolvedPlaceholders &&
      report.placeholders_unresolved.length > 0
    ) {
      outcome = "BLOCK";
      reasons.push(
        `${report.placeholders_unresolved.length} unresolved placeholder(s)`
      );
    }

    // Check for flagging conditions (if not already blocked)
    if (outcome !== "BLOCK") {
      if (semanticResult.summary.warning > this.config.maxWarningViolations) {
        outcome = "FLAG";
        reasons.push(
          `${semanticResult.summary.warning} semantic warning(s) exceed threshold`
        );
      }

      if (validationResult.warnings.length > this.config.maxValidationWarnings) {
        outcome = "FLAG";
        reasons.push(
          `${validationResult.warnings.length} validation warning(s) exceed threshold`
        );
      }

      // Flag low confidence reports
      if (report.confidence === "LOW" || report.confidence === "FALLBACK") {
        outcome = "FLAG";
        reasons.push(`Report confidence is ${report.confidence}`);
      }
    }

    return outcome;
  }

  /**
   * Apply LLM evaluation outcome to the current outcome
   */
  private applyLLMOutcome(
    currentOutcome: QAOutcome,
    llmResult: LLMEvaluationResult,
    reasons: string[]
  ): QAOutcome {
    const llmOutcome = llmResult.recommended_outcome;

    // Handle BLOCK recommendation
    if (llmOutcome === "BLOCK") {
      if (this.config.llmEvaluatorCanBlock) {
        reasons.push(`LLM evaluation BLOCKED: ${llmResult.outcome_reasoning}`);
        return "BLOCK";
      } else {
        reasons.push(`LLM evaluation flagged (BLOCK downgraded): ${llmResult.outcome_reasoning}`);
        return "FLAG";
      }
    }

    // Handle FLAG recommendation
    if (llmOutcome === "FLAG") {
      reasons.push(`LLM evaluation flagged: ${llmResult.outcome_reasoning}`);
      return "FLAG";
    }

    // Handle PASS recommendation
    if (llmOutcome === "PASS") {
      if (currentOutcome === "PASS") {
        reasons.push(`LLM evaluation passed (score: ${llmResult.overall_score.toFixed(1)})`);
      }
      // Don't override a FLAG from rule-based checks
    }

    return currentOutcome;
  }

  /**
   * Quick check if a report would pass basic validation
   */
  quickCheck(report: ComposedReport): { pass: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check required sections
    const requiredSections = this.compositionValidator.getRequiredSections();
    const presentSections = new Set(report.sections.map(s => s.section_number));

    for (const required of requiredSections) {
      if (!presentSections.has(required) && !report.suppressed_sections.includes(required)) {
        issues.push(`Missing required section ${required}`);
      }
    }

    // Check for empty content
    for (const section of report.sections) {
      if (section.content.trim().length === 0) {
        issues.push(`Empty content in section ${section.section_number}`);
      }
    }

    // Check total word count
    if (report.total_word_count < 200) {
      issues.push(`Report too short: ${report.total_word_count} words`);
    }

    return {
      pass: issues.length === 0,
      issues
    };
  }

  /**
   * Get detailed report on all violations
   */
  getViolationReport(result: QAGateResult): string {
    const lines: string[] = [];

    lines.push(`QA Gate Result: ${result.outcome}`);
    lines.push(`Reasons: ${result.reasons.join("; ")}`);
    lines.push("");

    if (result.semanticResult.violations.length > 0) {
      lines.push("Semantic Violations:");
      for (const v of result.semanticResult.violations) {
        lines.push(
          `  [${v.severity}] "${v.phrase}" in section ${v.location.section} - ${v.rule}`
        );
      }
      lines.push("");
    }

    if (result.validationResult.errors.length > 0) {
      lines.push("Validation Errors:");
      for (const e of result.validationResult.errors) {
        lines.push(`  - ${e}`);
      }
      lines.push("");
    }

    if (result.validationResult.warnings.length > 0) {
      lines.push("Validation Warnings:");
      for (const w of result.validationResult.warnings) {
        lines.push(`  - ${w}`);
      }
      lines.push("");
    }

    // Add LLM evaluation summary if present
    if (result.llmEvaluation) {
      const llm = result.llmEvaluation;
      lines.push("LLM Evaluation:");
      lines.push(`  Overall Score: ${llm.overall_score.toFixed(1)}/10`);
      lines.push(`  Quality: ${llm.quality.score}/10`);
      lines.push(`  Clinical Accuracy: ${llm.clinical_accuracy.score}/10`);
      lines.push(`  Personalization: ${llm.personalization.score}/10`);
      lines.push(`  Recommended: ${llm.recommended_outcome}`);
      lines.push(`  Assessment: ${llm.overall_assessment}`);
    }

    return lines.join("\n");
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<QAGateConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): QAGateConfig {
    return { ...this.config };
  }

  /**
   * Enable or disable LLM evaluation
   */
  setLLMEvaluatorEnabled(enabled: boolean): void {
    this.config.llmEvaluatorEnabled = enabled;
  }
}

export const qaGate = new QAGate();
