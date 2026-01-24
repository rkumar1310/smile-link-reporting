/**
 * Pipeline Runner
 * Bridges the core ReportPipeline with the CMS Dashboard's SSE streaming
 * Maps 8 pipeline phases to 6 UI phases
 */

import type { ReportPhaseEvent, ReportPhase, IntakeAnswers, ComposedReport as CMSComposedReport } from "@/lib/types/types/report-generation";
import type { ToneProfileId } from "@/lib/types";

import { createReportPipeline, type PipelineProgressEvent } from "./ReportPipeline";
import { createDynamicContentStore, type ContentGenerationProgress } from "./content/DynamicContentStore";
import type { IntakeData, ComposedReport, AuditRecord, PipelineResult, SupportedLanguage, QuestionId } from "./types";

/**
 * Map pipeline phases to UI phases
 * Pipeline has 9 phases (0-8), UI has 6 phases + generating
 */
const PHASE_MAPPING: Record<number, ReportPhase> = {
  0: "analyzing",     // input_validation
  1: "analyzing",     // tag_extraction
  2: "analyzing",     // driver_derivation
  3: "analyzing",     // scenario_scoring
  4: "tone",          // tone_selection
  5: "content-check", // content_selection
  6: "content-check", // scenario_load
  7: "composing",     // composition
  8: "evaluating",    // qa_gate
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

  // Handle sub-phases within QA gate
  if (event.phaseName.startsWith("qa_gate.")) {
    const subPhase = event.phaseName.replace("qa_gate.", "");

    if (subPhase === "llm_evaluation") {
      return {
        phase: "evaluating" as ReportPhase,
        message: event.message,
        timestamp: event.timestamp,
        data: {
          status: event.status,
          metrics: event.metrics
        }
      } as ReportPhaseEvent;
    }
  }

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

    case "evaluating":
      return {
        phase: "evaluating" as ReportPhase,
        message: event.message,
        timestamp: event.timestamp,
        data: {
          status: event.status,
          outcome: event.metrics?.outcome,
          canDeliver: event.metrics?.canDeliver,
          validationErrors: event.metrics?.validationErrors,
          validationWarnings: event.metrics?.validationWarnings,
          validationErrorDetails: event.metrics?.validationErrorDetails,
          validationWarningDetails: event.metrics?.validationWarningDetails,
          semanticViolations: event.metrics?.semanticViolations,
          // Pass through all metrics for QA sub-phases
          ...event.metrics
        }
      } as ReportPhaseEvent;

    default:
      return {
        phase: uiPhase,
        message: event.message,
        timestamp: event.timestamp
      } as ReportPhaseEvent;
  }
}

/**
 * Map content generation progress to SSE event
 * Maps DynamicContentStore progress to GeneratingPhaseEvent format
 */
function mapContentGenerationToSSE(progress: ContentGenerationProgress, current: number = 1, total: number = 1): ReportPhaseEvent {
  // Map content generation phase to factCheck status
  const statusMap: Record<string, "pending" | "checking" | "passed" | "failed" | "retrying"> = {
    "searching": "pending",
    "generating": "pending",
    "fact-checking": "checking",
    "completed": "passed",
    "error": "failed"
  };

  return {
    phase: "generating",
    message: progress.message,
    timestamp: new Date().toISOString(),
    data: {
      current,
      total,
      currentContent: progress.contentId,
      factCheck: {
        status: statusMap[progress.phase] ?? "pending",
        attempt: progress.attempt ?? 1,
        maxAttempts: progress.maxAttempts ?? 2,
        score: progress.score
      }
    }
  };
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
    factCheckPassed: audit.llm_evaluation
      ? audit.llm_evaluation.recommended_outcome !== "BLOCK"
      : true,
    factCheckScore: audit.llm_evaluation?.overall_score ?? 1.0,
    warnings: audit.llm_evaluation?.content_issues.map(issue => ({
      contentId: issue.source_content,
      section: `Section ${issue.section_number}`,
      severity: issue.severity as "low" | "medium" | "high",
      description: issue.problem,
      claimText: issue.quote,
      suggestion: issue.suggested_fix
    })) ?? [],
    contentGenerated: 0,
    totalContentUsed: coreReport.sections.length
  };
}

export interface PipelineSSEOptions {
  onEvent: (event: ReportPhaseEvent) => Promise<void>;
  language?: SupportedLanguage;
  maxFactCheckAttempts?: number;
  factCheckThreshold?: number;
}

export interface PipelineSSEResult {
  success: boolean;
  outcome: string;
  report?: CMSComposedReport;
  audit: AuditRecord;
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
 * This uses the real ReportPipeline with DynamicContentStore:
 * - 8-phase pipeline matching the original documents/src/pipeline
 * - Config-driven engines using JSON config files
 * - Dynamic content generation with semantic search + LLM
 * - Fact-checking with retry loop
 */
export async function runPipelineWithSSE(
  intake: IntakeAnswers,
  options: PipelineSSEOptions
): Promise<PipelineSSEResult> {
  const { onEvent, language = "en", maxFactCheckAttempts = 2, factCheckThreshold = 0.7 } = options;

  // Track content generation for "generating" phase events
  let contentGenerationCount = 0;

  // Create content store with progress callback
  const contentStore = createDynamicContentStore({
    maxFactCheckAttempts,
    factCheckThreshold,
    onProgress: async (progress) => {
      contentGenerationCount++;
      await onEvent(mapContentGenerationToSSE(progress));
    }
  });

  // Create pipeline with progress callback
  const pipeline = createReportPipeline({
    contentStore,
    onProgress: async (event) => {
      await onEvent(mapPipelineEventToSSE(event));
    }
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

    // Include content generation count in result
    if (cmsReport) {
      cmsReport.contentGenerated = contentGenerationCount;
    }

    return {
      success: result.success,
      outcome: result.outcome,
      report: cmsReport,
      audit: result.audit,
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
      error: errorMessage
    };
  }
}
