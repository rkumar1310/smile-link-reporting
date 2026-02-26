/**
 * Report Pipeline
 * Orchestrates the full report generation process
 * Uses NLG Template Renderer for report composition
 */

import type {
  IntakeData,
  PipelineResult,
  AuditRecord,
  QAOutcome,
  SupportedLanguage,
  ComposedReport,
  ReportSection,
  DriverId,
  DriverValue,
} from "./types";
import { DEFAULT_LANGUAGE } from "./types";

import { intakeValidator } from "./validation/IntakeValidator";
import { tagExtractor } from "./engines/TagExtractor";
import { driverDeriver } from "./engines/DriverDeriver";
import { scenarioScorer } from "./engines/ScenarioScorer";
import { generateNLGReport } from "./nlg";

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
  /** Callback for real-time progress updates during pipeline execution */
  onProgress?: (event: PipelineProgressEvent) => void | Promise<void>;
}

export class ReportPipeline {
  private onProgress?: (event: PipelineProgressEvent) => void | Promise<void>;

  constructor(options?: PipelineOptions) {
    this.onProgress = options?.onProgress;
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

      // Extract language from intake (defaults to English)
      const language: SupportedLanguage = intake.language ?? DEFAULT_LANGUAGE;

      // Phase 4: NLG Template Rendering
      await this.emitProgress({
        phase: 4,
        phaseName: "nlg_rendering",
        status: "started",
        message: "Rendering report via NLG template...",
        timestamp: new Date().toISOString(),
        metrics: { scenario: scenarioMatch.matched_scenario, language }
      });

      const nlgStart = Date.now();
      const nlgOutput = await generateNLGReport({
        sessionId: intake.session_id,
        driverState,
        tags: tagSet,
        language,
        tone: "TP-01",
        scenarioId: scenarioMatch.matched_scenario,
        metadata: intake.metadata ? {
          patientName: intake.metadata.patient_name,
          ...intake.metadata,
        } : undefined,
      });

      // Parse NLG markdown output into ReportSection[]
      const sections = parseNLGSections(nlgOutput.renderedReport);
      const totalWordCount = sections.reduce((sum, s) => sum + s.word_count, 0);

      // Compute variable resolution stats
      const variableStats = {
        resolved: Object.values(nlgOutput.variableResolution.variables)
          .filter(v => v.status === "resolved").length,
        flagged: Object.values(nlgOutput.variableResolution.variables)
          .filter(v => v.status === "missing_data").length,
        fallback: nlgOutput.variableResolution.fallbackCount,
      };

      const nlgWarnings = nlgOutput.warnings.map(w => `[${w.severity}] ${w.code}: ${w.message}`);

      await this.emitProgress({
        phase: 4,
        phaseName: "nlg_rendering",
        status: "completed",
        message: `Report rendered: ${sections.length} sections, ${totalWordCount} words`,
        timestamp: new Date().toISOString(),
        metrics: {
          sections: sections.length,
          wordCount: totalWordCount,
          variablesResolved: variableStats.resolved,
          variablesFlagged: variableStats.flagged,
          variablesFallback: variableStats.fallback,
          nlgWarnings: nlgWarnings.length,
        },
        duration_ms: Date.now() - nlgStart
      });

      // Build ComposedReport from NLG output
      const report: ComposedReport = {
        session_id: intake.session_id,
        scenario_id: scenarioMatch.matched_scenario,
        tone: "TP-01",
        language,
        confidence: scenarioMatch.confidence,
        sections,
        total_word_count: totalWordCount,
        warnings_included: false,
        suppressed_sections: [],
        placeholders_resolved: variableStats.resolved,
        placeholders_unresolved: nlgOutput.variableResolution.missingDataVariables,
        nlg_warnings: nlgWarnings.length > 0 ? nlgWarnings : undefined,
        nlg_variable_stats: variableStats,
      };

      // Build audit record
      const auditRecord: AuditRecord = {
        session_id: intake.session_id,
        created_at: new Date().toISOString(),
        intake,
        driver_state: driverState,
        scenario_match: scenarioMatch,
        content_selections: [],
        tone_selection: {
          selected_tone: "TP-01",
          reason: "Fixed default (tone system removed)",
          evaluated_triggers: []
        },
        composed_report: report,
        validation_result: {
          valid: true,
          errors: [],
          warnings: nlgWarnings,
          semantic_violations: []
        },
        decision_trace: {
          session_id: intake.session_id,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          events: [],
          final_outcome: "PASS"
        },
        final_outcome: "PASS",
        report_delivered: true
      };

      return {
        success: true,
        outcome: "PASS",
        report,
        audit: auditRecord
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
}

/**
 * Parse NLG rendered markdown into ReportSection[]
 *
 * The NLG template uses `---` dividers between sections.
 * Each section starts with `## Title`.
 * Blocks 0-8 map to: Personal Summary, Your Situation, Treatment Directions,
 * Option Overview, Expected Results, Duration, Recovery, Cost, Next Steps.
 */
function parseNLGSections(renderedReport: string): ReportSection[] {
  const sections: ReportSection[] = [];

  // Split on --- dividers (with optional surrounding whitespace)
  const chunks = renderedReport.split(/\n---\n/).map(c => c.trim()).filter(c => c.length > 0);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    // Extract title from ## heading
    const titleMatch = chunk.match(/^##\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : `Block ${i}`;

    // Content is the full chunk (including the title for markdown rendering)
    const content = chunk;
    const wordCount = content.replace(/[^\w\s]/g, "").split(/\s+/).filter(w => w.length > 0).length;

    sections.push({
      section_number: i,
      section_name: title,
      content,
      sources: [`NLG:block_${i}`],
      word_count: wordCount,
    });
  }

  return sections;
}

// Export a factory function
export function createReportPipeline(options?: PipelineOptions): ReportPipeline {
  return new ReportPipeline(options);
}
