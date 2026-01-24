/**
 * QA Gate
 * Orchestrates all QA checks and determines final outcome
 * Adapted for Next.js from documents/src/qa/QAGate.ts
 */

import type {
  ComposedReport,
  ContentSelection,
  ToneProfileId,
  QAOutcome,
  ValidationResult,
  IntakeData,
  DriverState,
  LLMEvaluationResult
} from "../types";

import { SemanticLeakageDetector, type DetectionResult } from "./SemanticLeakageDetector";
import { CompositionValidator } from "./CompositionValidator";
import { llmReportEvaluator } from "../../qa/LLMReportEvaluator";

/**
 * Progress callback for QA Gate operations
 */
export type QAProgressCallback = (event: QAProgressEvent) => void | Promise<void>;

export interface QAProgressEvent {
  stage: "validation" | "semantic_detection" | "llm_evaluation";
  status: "started" | "in_progress" | "completed" | "error";
  message: string;
  timestamp: string;
  metrics?: Record<string, unknown>;
  duration_ms?: number;
  error?: string;
}

export interface QAGateResult {
  outcome: QAOutcome;
  validationResult: ValidationResult;
  semanticResult: DetectionResult;
  llmEvaluation?: LLMEvaluationResult;
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
  llmEvaluatorEnabled: boolean;
  llmEvaluatorCanBlock: boolean;
}

const DEFAULT_CONFIG: QAGateConfig = {
  maxCriticalViolations: 0,      // Any critical violation blocks
  maxWarningViolations: 5,        // More than 5 warnings flags
  maxValidationErrors: 0,         // Any validation error blocks
  maxValidationWarnings: 10,      // More than 10 warnings flags
  blockOnUnresolvedPlaceholders: false,
  llmEvaluatorEnabled: true,      // Enable LLM evaluation for quality scores
  llmEvaluatorCanBlock: false     // LLM provides scores only, cannot block
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
   * Run all QA checks and determine outcome
   */
  async check(
    report: ComposedReport,
    selections: ContentSelection[],
    tone: ToneProfileId,
    intake?: IntakeData,
    driverState?: DriverState,
    onProgress?: QAProgressCallback
  ): Promise<QAGateResult> {
    const reasons: string[] = [];

    // Helper to emit progress
    const emitProgress = async (event: QAProgressEvent) => {
      if (onProgress) {
        await onProgress(event);
      }
    };

    // Run composition validation
    await emitProgress({
      stage: "validation",
      status: "started",
      message: "Running composition validation...",
      timestamp: new Date().toISOString()
    });

    const validationStart = Date.now();
    const validationResult = this.compositionValidator.validate(report, selections);

    await emitProgress({
      stage: "validation",
      status: "completed",
      message: `Validation complete: ${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`,
      timestamp: new Date().toISOString(),
      metrics: {
        errors: validationResult.errors.length,
        warnings: validationResult.warnings.length,
        errorDetails: validationResult.errors,
        warningDetails: validationResult.warnings
      },
      duration_ms: Date.now() - validationStart
    });

    // Run semantic leakage detection
    await emitProgress({
      stage: "semantic_detection",
      status: "started",
      message: "Checking for semantic leakage...",
      timestamp: new Date().toISOString()
    });

    const semanticStart = Date.now();
    const semanticResult = this.semanticDetector.detect(report.sections, tone);

    await emitProgress({
      stage: "semantic_detection",
      status: "completed",
      message: `Semantic check complete: ${semanticResult.summary.critical} critical, ${semanticResult.summary.warning} warnings`,
      timestamp: new Date().toISOString(),
      metrics: {
        critical: semanticResult.summary.critical,
        warnings: semanticResult.summary.warning,
        total: semanticResult.violations.length
      },
      duration_ms: Date.now() - semanticStart
    });

    // Add semantic violations to validation result
    validationResult.semantic_violations = semanticResult.violations;

    // Determine rule-based outcome
    const outcome = this.determineRuleBasedOutcome(
      semanticResult,
      validationResult,
      report,
      reasons
    );

    // Run LLM evaluation if enabled (doesn't affect outcome - scores only)
    let llmEvaluation: LLMEvaluationResult | undefined;
    if (this.config.llmEvaluatorEnabled) {
      await emitProgress({
        stage: "llm_evaluation",
        status: "started",
        message: "Running LLM quality evaluation...",
        timestamp: new Date().toISOString()
      });

      const llmStart = Date.now();
      try {
        const result = await llmReportEvaluator.evaluate(report);
        llmEvaluation = result ?? undefined;

        await emitProgress({
          stage: "llm_evaluation",
          status: "completed",
          message: llmEvaluation
            ? `LLM evaluation: ${llmEvaluation.overall_score}/10 (${llmEvaluation.recommended_outcome})`
            : "LLM evaluation skipped",
          timestamp: new Date().toISOString(),
          metrics: llmEvaluation ? {
            overall_score: llmEvaluation.overall_score,
            outcome: llmEvaluation.recommended_outcome,
            dimensions: {
              professional_quality: llmEvaluation.professional_quality.score,
              clinical_safety: llmEvaluation.clinical_safety.score,
              tone_appropriateness: llmEvaluation.tone_appropriateness.score,
              personalization: llmEvaluation.personalization.score,
              patient_autonomy: llmEvaluation.patient_autonomy.score,
              structure_completeness: llmEvaluation.structure_completeness.score
            }
          } : undefined,
          duration_ms: Date.now() - llmStart
        });
      } catch (error) {
        console.error("[QAGate] LLM evaluation failed:", error);
        await emitProgress({
          stage: "llm_evaluation",
          status: "error",
          message: "LLM evaluation failed (report still delivered)",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown error",
          duration_ms: Date.now() - llmStart
        });
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
   * Synchronous check (without LLM evaluation)
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
}

export const qaGate = new QAGate();
