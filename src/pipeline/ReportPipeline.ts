/**
 * Report Pipeline
 * Orchestrates the full report generation process
 */

import type {
  IntakeData,
  PipelineResult,
  AuditRecord,
  QAOutcome,
  SupportedLanguage
} from "../types/index.js";
import { DEFAULT_LANGUAGE } from "../types/index.js";

import { intakeValidator } from "../validation/index.js";
import { tagExtractor } from "../engine/TagExtractor.js";
import { driverDeriver } from "../engine/DriverDeriver.js";
import { scenarioScorer } from "../engine/ScenarioScorer.js";
import { toneSelector } from "../engine/ToneSelector.js";
import { contentSelector } from "../engine/ContentSelector.js";
import { reportComposer, type ContentStore } from "../composition/ReportComposer.js";
import { createTraceCollector, type TraceCollector } from "../qa/TraceCollector.js";
import { qaGate } from "../qa/QAGate.js";
import { ContentStoreAdapter } from "../content/ContentStoreAdapter.js";
import { contentLoader } from "../content/ContentLoader.js";

export interface PipelineOptions {
  contentStore?: ContentStore;
  skipQA?: boolean;
  traceEnabled?: boolean;
}

export class ReportPipeline {
  private contentStore?: ContentStore;
  private traceEnabled: boolean;

  constructor(options?: PipelineOptions) {
    this.contentStore = options?.contentStore;
    this.traceEnabled = options?.traceEnabled ?? true;

    if (this.contentStore) {
      reportComposer.setContentStore(this.contentStore);
    }
  }

  /**
   * Run the full pipeline
   */
  async run(intake: IntakeData): Promise<PipelineResult> {
    const trace = this.traceEnabled
      ? createTraceCollector(intake.session_id)
      : null;

    try {
      // Phase 0: Input Validation
      const validationTimer = trace?.startStage("input_validation");
      const validationResult = intakeValidator.safeValidate(intake);
      validationTimer?.complete(
        "validate_input",
        { answers: intake.answers.length },
        { valid: validationResult.valid, errors: validationResult.errors.length }
      );

      if (!validationResult.valid) {
        const errorMessages = validationResult.errors
          .map(e => `${e.questionId ? `${e.questionId}: ` : ""}${e.message}`)
          .join("; ");

        const failedAudit: AuditRecord = {
          session_id: intake.session_id,
          created_at: new Date().toISOString(),
          intake,
          driver_state: {
            session_id: intake.session_id,
            drivers: {} as AuditRecord["driver_state"]["drivers"],
            conflicts: [],
            fallbacks_applied: []
          },
          scenario_match: {
            session_id: intake.session_id,
            matched_scenario: "VALIDATION_ERROR",
            confidence: "FALLBACK",
            score: 0,
            all_scores: [],
            fallback_used: true,
            fallback_reason: "Input validation failed"
          },
          content_selections: [],
          tone_selection: {
            selected_tone: "TP-01",
            reason: "Validation error fallback",
            evaluated_triggers: []
          },
          composed_report: {
            session_id: intake.session_id,
            scenario_id: "VALIDATION_ERROR",
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
            errors: validationResult.errors.map(e => e.message),
            warnings: validationResult.warnings.map(w => w.message),
            semantic_violations: []
          },
          decision_trace: trace?.getTrace("BLOCK") ?? {
            session_id: intake.session_id,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            events: [],
            final_outcome: "BLOCK"
          },
          final_outcome: "BLOCK",
          report_delivered: false
        };

        return {
          success: false,
          outcome: "BLOCK",
          audit: failedAudit,
          error: `Input validation failed: ${errorMessages}`
        };
      }

      // Phase 1: Tag Extraction
      const tagTimer = trace?.startStage("tag_extraction");
      const tagResult = tagExtractor.extract(intake);
      tagTimer?.complete("extract_tags", { answers: intake.answers.length }, tagResult);

      // Phase 2: Driver Derivation
      const driverTimer = trace?.startStage("driver_derivation");
      const driverState = driverDeriver.derive(tagResult);
      driverTimer?.complete("derive_drivers", { tags: tagResult.tags.length }, driverState);

      // Phase 3: Scenario Scoring
      const scenarioTimer = trace?.startStage("scenario_scoring");
      const scenarioMatch = scenarioScorer.score(driverState);
      scenarioTimer?.complete("score_scenarios", { session_id: intake.session_id }, scenarioMatch);

      // Phase 4: Tone Selection
      const toneTimer = trace?.startStage("tone_selection");
      const toneResult = toneSelector.select(driverState);
      toneTimer?.complete("select_tone", { drivers: Object.keys(driverState.drivers) }, toneResult);

      // Phase 5: Content Selection
      const contentTimer = trace?.startStage("content_selection");
      const tagSet = new Set(tagResult.tags.map(t => t.tag));
      const contentSelections = contentSelector.select(
        driverState,
        scenarioMatch,
        toneResult.selected_tone,
        tagSet
      );
      contentTimer?.complete(
        "select_content",
        { scenario: scenarioMatch.matched_scenario },
        { count: contentSelections.length }
      );

      // Extract language from intake (defaults to English)
      const language: SupportedLanguage = intake.language ?? DEFAULT_LANGUAGE;

      // Phase 6: Load Scenario Content for ordered assembly
      const scenarioLoadTimer = trace?.startStage("scenario_load");
      let scenarioContent: string | undefined;
      try {
        const scenarioData = await contentLoader.loadContent(
          scenarioMatch.matched_scenario,
          toneResult.selected_tone,
          language
        );
        scenarioContent = scenarioData?.raw_content;
      } catch {
        // Scenario content optional - continue without it
      }
      scenarioLoadTimer?.complete(
        "load_scenario",
        { scenario_id: scenarioMatch.matched_scenario, language },
        { loaded: !!scenarioContent }
      );

      // Phase 7: Report Composition
      const composeTimer = trace?.startStage("composition");
      const report = await reportComposer.compose(
        intake,
        driverState,
        scenarioMatch,
        contentSelections,
        toneResult.selected_tone,
        language,
        scenarioContent
      );
      composeTimer?.complete(
        "compose_report",
        { selections: contentSelections.length },
        { sections: report.sections.length, words: report.total_word_count }
      );

      // Phase 8: QA Gate
      const qaTimer = trace?.startStage("qa_gate");
      const qaResult = qaGate.check(report, contentSelections, toneResult.selected_tone);
      qaTimer?.complete("qa_check", { report_id: intake.session_id }, qaResult);

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
        decision_trace: trace?.getTrace(qaResult.outcome) ?? {
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

      const failedAudit: AuditRecord = {
        session_id: intake.session_id,
        created_at: new Date().toISOString(),
        intake,
        driver_state: {
          session_id: intake.session_id,
          drivers: {} as AuditRecord["driver_state"]["drivers"],
          conflicts: [],
          fallbacks_applied: []
        },
        scenario_match: {
          session_id: intake.session_id,
          matched_scenario: "ERROR",
          confidence: "FALLBACK",
          score: 0,
          all_scores: [],
          fallback_used: true,
          fallback_reason: errorMessage
        },
        content_selections: [],
        tone_selection: {
          selected_tone: "TP-01",
          reason: "Error fallback",
          evaluated_triggers: []
        },
        composed_report: {
          session_id: intake.session_id,
          scenario_id: "ERROR",
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
          errors: [errorMessage],
          warnings: [],
          semantic_violations: []
        },
        decision_trace: trace?.getTrace("BLOCK") ?? {
          session_id: intake.session_id,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          events: [],
          final_outcome: "BLOCK"
        },
        final_outcome: "BLOCK",
        report_delivered: false
      };

      return {
        success: false,
        outcome: "BLOCK",
        audit: failedAudit,
        error: errorMessage
      };
    }
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

  /**
   * Enable/disable tracing
   */
  setTraceEnabled(enabled: boolean): void {
    this.traceEnabled = enabled;
  }
}

// Default pipeline instance with file-based content store
export const reportPipeline = new ReportPipeline({
  contentStore: new ContentStoreAdapter()
});
