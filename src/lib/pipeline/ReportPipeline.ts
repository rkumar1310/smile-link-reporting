/**
 * Report Pipeline
 * Orchestrates the full report generation process
 * Adapted for Next.js from documents/src/pipeline/ReportPipeline.ts
 */

import type {
  IntakeData,
  PipelineResult,
  AuditRecord,
  QAOutcome,
  SupportedLanguage,
  ComposedReport,
  DriverId,
  DriverValue,
  ScenarioSections
} from "./types";
import { DEFAULT_LANGUAGE } from "./types";

import { intakeValidator } from "./validation/IntakeValidator";
import { tagExtractor } from "./engines/TagExtractor";
import { driverDeriver } from "./engines/DriverDeriver";
import { scenarioScorer } from "./engines/ScenarioScorer";
import { toneSelector } from "./engines/ToneSelector";
import { contentSelector } from "./engines/ContentSelector";
import { reportComposer, type ContentStore, type DerivativeProgressCallback } from "./composition/ReportComposer";
import { qaGate } from "./qa/QAGate";

/**
 * Progress event emitted during pipeline execution
 */
export interface PipelineProgressEvent {
  phase: number;
  phaseName: string;
  status: "started" | "in_progress" | "completed" | "error";
  message: string;
  timestamp: string;
  metrics?: Record<string, unknown>;
  duration_ms?: number;
  error?: string;
}

export interface PipelineOptions {
  contentStore?: ContentStore;
  skipQA?: boolean;
  /** Callback called after report composition but before LLM evaluation */
  onReportComposed?: (report: ComposedReport, audit: Partial<AuditRecord>) => Promise<void> | void;
  /** Callback for real-time progress updates during pipeline execution */
  onProgress?: (event: PipelineProgressEvent) => void | Promise<void>;
  /** Callback for derivative content generation progress during composition */
  onDerivativeProgress?: DerivativeProgressCallback;
}

export class ReportPipeline {
  private contentStore?: ContentStore;
  private onReportComposed?: (report: ComposedReport, audit: Partial<AuditRecord>) => Promise<void> | void;
  private onProgress?: (event: PipelineProgressEvent) => void | Promise<void>;
  private onDerivativeProgress?: DerivativeProgressCallback;

  constructor(options?: PipelineOptions) {
    this.contentStore = options?.contentStore;
    this.onReportComposed = options?.onReportComposed;
    this.onProgress = options?.onProgress;
    this.onDerivativeProgress = options?.onDerivativeProgress;

    if (this.contentStore) {
      reportComposer.setContentStore(this.contentStore);
    }

    // Set derivative progress callback on the composer
    if (this.onDerivativeProgress) {
      reportComposer.setDerivativeProgressCallback(this.onDerivativeProgress);
    }
  }

  /**
   * Emit a progress event
   */
  private async emitProgress(event: PipelineProgressEvent): Promise<void> {
    if (this.onProgress) {
      await this.onProgress(event);
    }
  }

  /**
   * Run the full pipeline
   */
  async run(intake: IntakeData): Promise<PipelineResult> {
    try {
      // Phase 0: Input Validation
      await this.emitProgress({
        phase: 0,
        phaseName: "input_validation",
        status: "started",
        message: "Validating input data...",
        timestamp: new Date().toISOString(),
        metrics: { answers: intake.answers.length }
      });

      const validationStart = Date.now();
      const validationResult = intakeValidator.safeValidate(intake);

      await this.emitProgress({
        phase: 0,
        phaseName: "input_validation",
        status: validationResult.valid ? "completed" : "error",
        message: validationResult.valid ? "Input validated successfully" : `Validation failed: ${validationResult.errors.length} errors`,
        timestamp: new Date().toISOString(),
        metrics: { valid: validationResult.valid, errors: validationResult.errors.length },
        duration_ms: Date.now() - validationStart
      });

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors
          .map(e => `${e.questionId ? `${e.questionId}: ` : ""}${e.message}`)
          .join("; ");

        const failedAudit = this.createFailedAudit(intake, "VALIDATION_ERROR", `Input validation failed: ${errorMessages}`);

        return {
          success: false,
          outcome: "BLOCK",
          audit: failedAudit,
          error: `Input validation failed: ${errorMessages}`
        };
      }

      // Phase 1: Tag Extraction
      await this.emitProgress({
        phase: 1,
        phaseName: "tag_extraction",
        status: "started",
        message: "Extracting tags from answers...",
        timestamp: new Date().toISOString(),
        metrics: { answers: intake.answers.length }
      });

      const tagStart = Date.now();
      const tagResult = tagExtractor.extract(intake);

      await this.emitProgress({
        phase: 1,
        phaseName: "tag_extraction",
        status: "completed",
        message: `Extracted ${tagResult.tags.length} tags`,
        timestamp: new Date().toISOString(),
        metrics: { tagsExtracted: tagResult.tags.length },
        duration_ms: Date.now() - tagStart
      });

      // Phase 2: Driver Derivation
      await this.emitProgress({
        phase: 2,
        phaseName: "driver_derivation",
        status: "started",
        message: "Deriving drivers from tags...",
        timestamp: new Date().toISOString(),
        metrics: { tags: tagResult.tags.length }
      });

      const driverStart = Date.now();
      const driverState = driverDeriver.derive(tagResult);

      await this.emitProgress({
        phase: 2,
        phaseName: "driver_derivation",
        status: "completed",
        message: `Derived ${Object.keys(driverState.drivers).length} drivers`,
        timestamp: new Date().toISOString(),
        metrics: {
          driversCount: Object.keys(driverState.drivers).length,
          conflicts: driverState.conflicts.length,
          fallbacks: driverState.fallbacks_applied.length
        },
        duration_ms: Date.now() - driverStart
      });

      // Phase 3: Scenario Scoring
      await this.emitProgress({
        phase: 3,
        phaseName: "scenario_scoring",
        status: "started",
        message: "Scoring clinical scenarios...",
        timestamp: new Date().toISOString()
      });

      const scenarioStart = Date.now();
      // Pass extracted tags to scorer for preferred_tags matching
      const tagSet = new Set(tagResult.tags.map(t => t.tag));
      const scenarioMatch = scenarioScorer.score(driverState, tagSet);

      await this.emitProgress({
        phase: 3,
        phaseName: "scenario_scoring",
        status: "completed",
        message: `Matched scenario: ${scenarioMatch.matched_scenario} (${scenarioMatch.confidence})`,
        timestamp: new Date().toISOString(),
        metrics: {
          matchedScenario: scenarioMatch.matched_scenario,
          confidence: scenarioMatch.confidence,
          score: scenarioMatch.score,
          topScenarios: scenarioMatch.all_scores.slice(0, 3).map(s => ({ id: s.scenario_id, score: s.score }))
        },
        duration_ms: Date.now() - scenarioStart
      });

      // Phase 4: Tone Selection
      await this.emitProgress({
        phase: 4,
        phaseName: "tone_selection",
        status: "started",
        message: "Selecting communication tone...",
        timestamp: new Date().toISOString()
      });

      const toneStart = Date.now();
      const toneResult = toneSelector.select(driverState);

      await this.emitProgress({
        phase: 4,
        phaseName: "tone_selection",
        status: "completed",
        message: `Selected tone: ${toneResult.selected_tone}`,
        timestamp: new Date().toISOString(),
        metrics: {
          tone: toneResult.selected_tone,
          reason: toneResult.reason,
          triggersEvaluated: toneResult.evaluated_triggers.length
        },
        duration_ms: Date.now() - toneStart
      });

      // Phase 5: Content Selection
      await this.emitProgress({
        phase: 5,
        phaseName: "content_selection",
        status: "started",
        message: "Selecting content for report...",
        timestamp: new Date().toISOString(),
        metrics: { scenario: scenarioMatch.matched_scenario }
      });

      const contentStart = Date.now();
      const contentSelections = contentSelector.select(
        driverState,
        scenarioMatch,
        toneResult.selected_tone,
        tagSet
      );

      await this.emitProgress({
        phase: 5,
        phaseName: "content_selection",
        status: "completed",
        message: `Selected ${contentSelections.length} content blocks`,
        timestamp: new Date().toISOString(),
        metrics: {
          contentCount: contentSelections.length,
          scenario: scenarioMatch.matched_scenario
        },
        duration_ms: Date.now() - contentStart
      });

      // Extract language from intake (defaults to English)
      const language: SupportedLanguage = intake.language ?? DEFAULT_LANGUAGE;

      // Phase 6: Load Scenario Sections (via ContentStore)
      await this.emitProgress({
        phase: 6,
        phaseName: "scenario_load",
        status: "started",
        message: "Loading scenario sections...",
        timestamp: new Date().toISOString(),
        metrics: { scenario: scenarioMatch.matched_scenario, language }
      });

      const loadStart = Date.now();
      let scenarioSections: ScenarioSections | undefined;

      // Try to load structured scenario sections from content store
      if (this.contentStore?.getScenarioSections) {
        try {
          scenarioSections = await this.contentStore.getScenarioSections(
            scenarioMatch.matched_scenario,
            toneResult.selected_tone,
            language
          ) ?? undefined;
        } catch {
          // Scenario content is optional - continue without it
        }
      }

      await this.emitProgress({
        phase: 6,
        phaseName: "scenario_load",
        status: "completed",
        message: scenarioSections ? "Scenario sections loaded" : "Using default content structure",
        timestamp: new Date().toISOString(),
        metrics: {
          loaded: !!scenarioSections,
          scenario: scenarioMatch.matched_scenario
        },
        duration_ms: Date.now() - loadStart
      });

      // Phase 7: Report Composition
      await this.emitProgress({
        phase: 7,
        phaseName: "composition",
        status: "started",
        message: "Composing report...",
        timestamp: new Date().toISOString(),
        metrics: { contentBlocks: contentSelections.length }
      });

      const composeStart = Date.now();
      const report = await reportComposer.compose(
        intake,
        driverState,
        scenarioMatch,
        contentSelections,
        toneResult.selected_tone,
        language,
        scenarioSections
      );

      await this.emitProgress({
        phase: 7,
        phaseName: "composition",
        status: "completed",
        message: `Report composed: ${report.sections.length} sections, ${report.total_word_count} words`,
        timestamp: new Date().toISOString(),
        metrics: {
          sections: report.sections.length,
          wordCount: report.total_word_count,
          placeholdersResolved: report.placeholders_resolved,
          unresolvedPlaceholders: report.placeholders_unresolved.length
        },
        duration_ms: Date.now() - composeStart
      });

      // Call callback with composed report before QA
      if (this.onReportComposed) {
        const partialAudit: Partial<AuditRecord> = {
          session_id: intake.session_id,
          created_at: new Date().toISOString(),
          intake,
          driver_state: driverState,
          scenario_match: scenarioMatch,
          content_selections: contentSelections,
          tone_selection: toneResult,
          composed_report: report
        };
        await this.onReportComposed(report, partialAudit);
      }

      // Phase 8: QA Gate
      await this.emitProgress({
        phase: 8,
        phaseName: "qa_gate",
        status: "started",
        message: "Running quality checks...",
        timestamp: new Date().toISOString(),
        metrics: { sections: report.sections.length }
      });

      const qaStart = Date.now();
      const qaResult = await qaGate.check(
        report,
        contentSelections,
        toneResult.selected_tone,
        intake,
        driverState,
        // Forward QA progress events as pipeline events
        async (qaEvent) => {
          await this.emitProgress({
            phase: 8,
            phaseName: `qa_gate.${qaEvent.stage}`,
            status: qaEvent.status === "completed" ? "in_progress" : qaEvent.status,
            message: qaEvent.message,
            timestamp: qaEvent.timestamp,
            metrics: qaEvent.metrics
          });
        }
      );

      await this.emitProgress({
        phase: 8,
        phaseName: "qa_gate",
        status: qaResult.canDeliver ? "completed" : "error",
        message: qaResult.canDeliver
          ? `Quality check passed (${qaResult.outcome})`
          : `Quality check: ${qaResult.outcome} - ${qaResult.reasons.join("; ")}`,
        timestamp: new Date().toISOString(),
        metrics: {
          outcome: qaResult.outcome,
          canDeliver: qaResult.canDeliver,
          validationErrors: qaResult.validationResult.errors.length,
          validationWarnings: qaResult.validationResult.warnings.length,
          validationErrorDetails: qaResult.validationResult.errors,
          validationWarningDetails: qaResult.validationResult.warnings,
          semanticViolations: qaResult.semanticResult.violations
        },
        duration_ms: Date.now() - qaStart,
        error: qaResult.canDeliver ? undefined : qaResult.reasons.join("; ")
      });

      // Build audit record
      const auditRecord: AuditRecord = {
        session_id: intake.session_id,
        created_at: new Date().toISOString(),
        intake,
        driver_state: driverState,
        scenario_match: scenarioMatch,
        content_selections: contentSelections,
        tone_selection: toneResult,
        composed_report: report,
        validation_result: qaResult.validationResult,
        llm_evaluation: qaResult.llmEvaluation,
        decision_trace: {
          session_id: intake.session_id,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          events: [],
          final_outcome: qaResult.outcome
        },
        final_outcome: qaResult.outcome,
        report_delivered: qaResult.canDeliver
      };

      return {
        success: qaResult.canDeliver,
        outcome: qaResult.outcome,
        report: qaResult.canDeliver ? report : undefined,
        audit: auditRecord,
        error: qaResult.outcome === "BLOCK"
          ? qaResult.reasons.join("; ")
          : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const failedAudit = this.createFailedAudit(intake, "ERROR", errorMessage);

      return {
        success: false,
        outcome: "BLOCK",
        audit: failedAudit,
        error: errorMessage
      };
    }
  }

  /**
   * Create a failed audit record
   */
  private createFailedAudit(intake: IntakeData, scenarioId: string, reason: string): AuditRecord {
    return {
      session_id: intake.session_id,
      created_at: new Date().toISOString(),
      intake,
      driver_state: {
        session_id: intake.session_id,
        drivers: {} as Record<DriverId, DriverValue>,
        conflicts: [],
        fallbacks_applied: []
      },
      scenario_match: {
        session_id: intake.session_id,
        matched_scenario: scenarioId,
        confidence: "FALLBACK",
        score: 0,
        all_scores: [],
        fallback_used: true,
        fallback_reason: reason
      },
      content_selections: [],
      tone_selection: {
        selected_tone: "TP-01",
        reason: "Error fallback",
        evaluated_triggers: []
      },
      composed_report: {
        session_id: intake.session_id,
        scenario_id: scenarioId,
        tone: "TP-01",
        language: intake.language ?? DEFAULT_LANGUAGE,
        confidence: "FALLBACK",
        sections: [],
        total_word_count: 0,
        warnings_included: false,
        suppressed_sections: [],
        placeholders_resolved: 0,
        placeholders_unresolved: []
      },
      validation_result: {
        valid: false,
        errors: [reason],
        warnings: [],
        semantic_violations: []
      },
      decision_trace: {
        session_id: intake.session_id,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        events: [],
        final_outcome: "BLOCK"
      },
      final_outcome: "BLOCK",
      report_delivered: false
    };
  }

  /**
   * Run pipeline with minimal output (for testing)
   */
  async runQuick(intake: IntakeData): Promise<{
    scenario: string;
    tone: string;
    confidence: string;
    outcome: QAOutcome;
  }> {
    const result = await this.run(intake);

    return {
      scenario: result.audit.scenario_match.matched_scenario,
      tone: result.audit.tone_selection.selected_tone,
      confidence: result.audit.scenario_match.confidence,
      outcome: result.outcome
    };
  }

  /**
   * Set content store
   */
  setContentStore(store: ContentStore): void {
    this.contentStore = store;
    reportComposer.setContentStore(store);
  }
}

// Export a factory function instead of a singleton (content store must be provided)
export function createReportPipeline(options?: PipelineOptions): ReportPipeline {
  return new ReportPipeline(options);
}
