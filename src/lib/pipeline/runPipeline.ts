/**
 * Pipeline Runner
 * Bridges the core ReportPipeline with the CMS Dashboard's SSE streaming
 * Maps 7 pipeline phases to 5 UI phases
 */

import type {
  ReportPhaseEvent,
  ReportPhase,
  IntakeAnswers,
  ComposedReport as CMSComposedReport,
  ReportAuditData,
} from "@/lib/types/types/report-generation";
import type { ToneProfileId } from "@/lib/types";

import { createReportPipeline, type PipelineProgressEvent } from "./ReportPipeline";
import type { IntakeData, ComposedReport, AuditRecord, SupportedLanguage, QuestionId } from "./types";
import { generateReportPdf } from "@/lib/services/PdfGenerationService";

/**
 * Map pipeline phases to UI phases
 * Pipeline has 7 phases (0-6), UI has 5 phases
 */
const PHASE_MAPPING: Record<number, ReportPhase> = {
  0: "analyzing",     // input_validation
  1: "analyzing",     // tag_extraction
  2: "analyzing",     // driver_derivation
  3: "analyzing",     // scenario_scoring
  4: "tone",          // tone_selection
  5: "content-check", // content_selection
  6: "composing",     // nlg_rendering
};

/**
 * Get tone display name
 */
function getToneName(toneId: string): string {
  const toneNames: Record<string, string> = {
    "TP-01": "Neutral-Informative",
    "TP-02": "Empathic-Neutral",
    "TP-03": "Reflective-Contextual",
    "TP-04": "Stability-Frame",
    "TP-05": "Expectation-Calibration",
    "TP-06": "Autonomy-Respecting"
  };
  return toneNames[toneId] ?? toneId;
}

/**
 * Map a pipeline progress event to an SSE ReportPhaseEvent
 */
export function mapPipelineEventToSSE(event: PipelineProgressEvent): ReportPhaseEvent {
  const uiPhase = PHASE_MAPPING[event.phase] ?? "analyzing";

  // Map based on phase
  switch (uiPhase) {
    case "analyzing":
      return {
        phase: "analyzing",
        message: event.message,
        timestamp: event.timestamp,
        data: {
          totalQuestions: (event.metrics?.answers as number) ?? 0,
          processedQuestions: event.status === "completed"
            ? (event.metrics?.answers as number) ?? 0
            : 0
        }
      };

    case "tone":
      return {
        phase: "tone",
        message: event.message,
        timestamp: event.timestamp,
        data: {
          tone: ((event.metrics?.tone as string) ?? "TP-01") as ToneProfileId,
          toneName: getToneName((event.metrics?.tone as string) ?? "TP-01"),
          reason: (event.metrics?.reason as string) ?? ""
        }
      };

    case "content-check":
      return {
        phase: "content-check",
        message: event.message,
        timestamp: event.timestamp,
        data: {
          total: (event.metrics?.contentCount as number) ?? 0,
          available: (event.metrics?.contentCount as number) ?? 0,
          missing: 0,
          scenarios: [(event.metrics?.scenario as string) ?? ""]
        }
      };

    case "composing":
      return {
        phase: "composing",
        message: event.message,
        timestamp: event.timestamp,
        data: {
          sectionsProcessed: (event.metrics?.sections as number) ?? 0,
          totalSections: (event.metrics?.sections as number) ?? 0
        }
      };

    default:
      return {
        phase: uiPhase,
        message: event.message,
        timestamp: event.timestamp
      } as ReportPhaseEvent;
  }
}


/**
 * Transform core ComposedReport to CMS ComposedReport format
 */
export function transformReport(
  coreReport: ComposedReport,
  audit: AuditRecord
): CMSComposedReport {
  return {
    id: `report-${coreReport.session_id}`,
    generatedAt: new Date().toISOString(),
    patientName: undefined,
    sessionId: coreReport.session_id,
    language: coreReport.language as "en" | "nl",
    tone: coreReport.tone as ToneProfileId,
    toneName: getToneName(coreReport.tone),
    scenarios: audit.scenario_match ? [{
      scenarioId: audit.scenario_match.matched_scenario,
      name: audit.scenario_match.matched_scenario,
      score: audit.scenario_match.score,
      matchedDrivers: [],
      sections: coreReport.sections.map(s => s.section_number)
    }] : [],
    sections: coreReport.sections.map(s => ({
      sectionNumber: s.section_number,
      title: s.section_name,
      content: s.content,
      sourceContentId: s.sources[0] ?? `section-${s.section_number}`,
      hasWarning: false,
      warnings: []
    })),
    factCheckPassed: true,
    factCheckScore: 1.0,
    warnings: [],
    contentGenerated: 0,
    totalContentUsed: coreReport.sections.length,
    unresolvedPlaceholders: coreReport.placeholders_unresolved.length > 0
      ? coreReport.placeholders_unresolved
      : undefined,
    intakeAnswers: audit.intake.answers.map(a => ({
      question_id: a.question_id,
      answer: a.answer
    }))
  };
}

/**
 * Transform core AuditRecord to UI-friendly ReportAuditData
 */
export function transformAudit(audit: AuditRecord): ReportAuditData {
  return {
    session_id: audit.session_id,
    created_at: audit.created_at,
    final_outcome: audit.final_outcome,

    // Driver state
    drivers: Object.fromEntries(
      Object.entries(audit.driver_state.drivers).map(([key, dv]) => [
        key,
        {
          driver_id: dv.driver_id,
          layer: dv.layer,
          value: dv.value,
          source: dv.source,
          confidence: dv.confidence,
        },
      ])
    ),
    driver_conflicts: audit.driver_state.conflicts.map((c) => ({
      driver_id: c.driver_id,
      conflicting_values: c.conflicting_values,
      resolved_value: c.resolved_value,
      resolution_reason: c.resolution_reason,
    })),
    fallbacks_applied: [...audit.driver_state.fallbacks_applied],

    // Scenario matching
    matched_scenario: audit.scenario_match.matched_scenario,
    scenario_confidence: audit.scenario_match.confidence,
    scenario_score: audit.scenario_match.score,
    all_scenario_scores: audit.scenario_match.all_scores.map((s) => ({
      scenario_id: s.scenario_id,
      score: s.score,
      matched_required: s.matched_required,
      matched_strong: s.matched_strong,
      matched_supporting: s.matched_supporting,
      excluded: s.excluded,
    })),
    fallback_used: audit.scenario_match.fallback_used,
    fallback_reason: audit.scenario_match.fallback_reason,

    // Content selections
    content_selections: audit.content_selections.map((cs) => ({
      content_id: cs.content_id,
      type: cs.type,
      target_section: cs.target_section,
      tone: cs.tone,
      priority: cs.priority,
      suppressed: cs.suppressed,
      suppression_reason: cs.suppression_reason,
    })),

    // Tone selection
    tone: audit.tone_selection.selected_tone,
    tone_reason: audit.tone_selection.reason,
    tone_triggers: audit.tone_selection.evaluated_triggers.map((t) => ({
      tone: t.tone,
      matched: t.matched,
      trigger_driver: t.trigger_driver,
    })),

    // Decision trace (omit input/output to keep payload small)
    trace_events: audit.decision_trace.events.map((e) => ({
      timestamp: e.timestamp,
      stage: e.stage,
      action: e.action,
      duration_ms: e.duration_ms,
    })),
    trace_started_at: audit.decision_trace.started_at,
    trace_completed_at: audit.decision_trace.completed_at,
  };
}

export interface PipelineSSEOptions {
  onEvent: (event: ReportPhaseEvent) => Promise<void>;
  language?: SupportedLanguage;
}

export interface PipelineSSEResult {
  success: boolean;
  outcome: string;
  report?: CMSComposedReport;
  audit: AuditRecord;
  auditData: ReportAuditData;
  error?: string;
}

/**
 * Convert IntakeAnswers to IntakeData format expected by pipeline
 * IntakeAnswers (CMS) uses string for question_id, pipeline uses QuestionId union
 */
function convertIntakeAnswers(intake: IntakeAnswers, language: SupportedLanguage = "en"): IntakeData {
  return {
    session_id: intake.session_id,
    timestamp: intake.timestamp ?? new Date().toISOString(),
    language,
    answers: intake.answers.map(a => ({
      question_id: a.question_id as QuestionId,  // Cast to pipeline's QuestionId type
      answer: a.answer
    })),
    metadata: intake.metadata
  };
}

/**
 * Run the pipeline with SSE streaming
 *
 * This uses the real ReportPipeline with NLG Template Renderer:
 * - 7-phase pipeline (0-6) matching the original documents/src/pipeline
 * - Config-driven engines using JSON config files
 * - NLG template rendering with scenario data from MongoDB
 * - Rule-based QA validation
 */
export async function runPipelineWithSSE(
  intake: IntakeAnswers,
  options: PipelineSSEOptions
): Promise<PipelineSSEResult> {
  const { onEvent, language = "en" } = options;

  // Create pipeline with progress callbacks
  const pipeline = createReportPipeline({
    onProgress: async (event) => {
      await onEvent(mapPipelineEventToSSE(event));
    },
  });

  try {
    // Convert intake format with language
    const pipelineIntake = convertIntakeAnswers(intake, language);

    // Run the pipeline
    const result = await pipeline.run(pipelineIntake);

    // Transform report for CMS format
    const cmsReport = result.report
      ? transformReport(result.report, result.audit)
      : undefined;

    // Generate PDF if we have a report
    if (cmsReport) {
      cmsReport.contentGenerated = 0; // No longer generating content

      try {
        const pdfBuffer = await generateReportPdf(cmsReport);
        cmsReport.pdfBase64 = pdfBuffer.toString("base64");
      } catch (error) {
        console.error("PDF generation failed:", error);
        // Continue without PDF - it's not critical
      }
    }

    return {
      success: result.success,
      outcome: result.outcome,
      report: cmsReport,
      audit: result.audit,
      auditData: transformAudit(result.audit),
      error: result.error
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Send error event
    await onEvent({
      phase: "error",
      message: errorMessage,
      timestamp: new Date().toISOString()
    } as ReportPhaseEvent);

    // Create minimal error audit
    const errorAudit: AuditRecord = {
      session_id: intake.session_id,
      created_at: new Date().toISOString(),
      intake: convertIntakeAnswers(intake),
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
        language,
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

    return {
      success: false,
      outcome: "BLOCK",
      audit: errorAudit,
      auditData: transformAudit(errorAudit),
      error: errorMessage
    };
  }
}
