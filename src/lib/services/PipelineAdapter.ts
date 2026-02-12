/**
 * Pipeline Adapter
 * Bridges the core ReportPipeline with the CMS Dashboard's SSE streaming
 * Maps 8 pipeline phases to 6 UI phases (with evaluating as a separate phase)
 *
 * NOTE: This adapter is designed to work with the core pipeline.
 * For the CMS dashboard to use the real pipeline, you need to either:
 * 1. Set up a workspace/monorepo configuration with proper package references
 * 2. Build the core pipeline as a package and install it
 * 3. Use an API endpoint that runs the pipeline server-side
 *
 * Currently, this file provides the mapping types and functions that can be
 * used when the pipeline is properly integrated.
 */

import type { ReportPhaseEvent, ReportPhase, IntakeAnswers, ComposedReport as CMSComposedReport } from "@/lib/types/types/report-generation";

// Type definitions matching the core pipeline (duplicated for decoupling)
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

export interface CoreComposedReport {
  session_id: string;
  scenario_id: string;
  tone: string;
  language: string;
  confidence: string;
  sections: Array<{
    section_number: number;
    section_name: string;
    content: string;
    sources: string[];
    word_count: number;
  }>;
  total_word_count: number;
  placeholders_resolved: number;
  placeholders_unresolved: string[];
}

export interface CoreAuditRecord {
  session_id: string;
  created_at: string;
  scenario_match: {
    matched_scenario: string;
    score: number;
    confidence: string;
  };
  tone_selection: {
    selected_tone: string;
    reason: string;
  };
  llm_evaluation?: {
    overall_score: number;
    recommended_outcome: string;
    professional_quality: { score: number };
    clinical_safety: { score: number };
    tone_appropriateness: { score: number };
    personalization: { score: number };
    patient_autonomy: { score: number };
    structure_completeness: { score: number };
    content_issues: Array<{
      source_content: string;
      section_number: number;
      severity: string;
      problem: string;
      quote: string;
      suggested_fix: string;
    }>;
  };
}

export interface PipelineResult {
  success: boolean;
  outcome: string;
  report?: CoreComposedReport;
  audit: CoreAuditRecord;
  error?: string;
}

/**
 * Map pipeline phases to UI phases
 * Pipeline has 8 phases (0-8), UI has 6 phases
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
  8: "evaluating",    // qa_gate (including LLM evaluation)
};

/**
 * Map a pipeline progress event to an SSE ReportPhaseEvent
 */
export function mapPipelineEventToSSE(event: PipelineProgressEvent): ReportPhaseEvent {
  const uiPhase = PHASE_MAPPING[event.phase] ?? "analyzing";

  // Handle sub-phases within QA gate (LLM evaluation progress)
  if (event.phaseName.startsWith("qa_gate.")) {
    const subPhase = event.phaseName.replace("qa_gate.", "");

    if (subPhase === "llm_evaluation") {
      return {
        phase: "evaluating",
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
          tone: ((event.metrics?.tone as string) ?? "TP-01") as import("@/lib/types/types/content").ToneProfileId,
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
          dimensions: event.metrics?.llmEvaluation
            ? (event.metrics.llmEvaluation as Record<string, unknown>).dimensions
            : undefined,
          overallScore: event.metrics?.llmEvaluation
            ? (event.metrics.llmEvaluation as Record<string, unknown>).overallScore
            : undefined
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
 * Transform core ComposedReport to CMS ComposedReport format
 */
export function transformReport(
  coreReport: CoreComposedReport,
  audit: CoreAuditRecord
): CMSComposedReport {
  return {
    id: `report-${coreReport.session_id}`,
    generatedAt: new Date().toISOString(),
    patientName: undefined, // Would come from intake metadata
    sessionId: coreReport.session_id,
    language: coreReport.language as "en" | "nl",
    tone: coreReport.tone as import("@/lib/types/types/content").ToneProfileId,
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
    // Note: audit and llmEvaluation are passed separately to the complete event
  };
}

export interface PipelineAdapterOptions {
  onEvent: (event: ReportPhaseEvent) => Promise<void>;
  onReportComposed?: (report: CoreComposedReport, audit: Partial<CoreAuditRecord>) => Promise<void>;
}

/**
 * Run the pipeline with SSE streaming
 *
 * This uses the ReportGenerationService which implements:
 * - Driver derivation from questionnaire answers
 * - Tone selection based on drivers
 * - Content availability checking (from registry + database)
 * - Dynamic content generation with semantic search + LLM
 * - Fact-checking with retry loop
 * - Report composition
 *
 * The flow mirrors the core ReportPipeline phases:
 * 1. Analyzing (driver derivation)
 * 2. Tone selection
 * 3. Content check (availability)
 * 4. Generating (dynamic content with fact-checking)
 * 5. Composing
 * 6. Complete
 */
export async function runPipelineWithSSE(
  intake: IntakeAnswers,
  options: PipelineAdapterOptions
): Promise<PipelineResult> {
  const { onEvent } = options;

  // Import the service here to avoid circular dependencies
  const { createReportGenerationService } = await import("./ReportGenerationService");

  // Create the service with event forwarding
  const service = createReportGenerationService(async (event) => {
    await onEvent(event);
  });

  try {
    // Run the report generation
    const report = await service.generateReport({
      intake,
      language: "en",
    });

    // Build the result
    const result: PipelineResult = {
      success: true,
      outcome: report.factCheckPassed ? "PASS" : "FLAG",
      report: {
        session_id: report.sessionId,
        scenario_id: report.scenarios[0]?.scenarioId ?? "UNKNOWN",
        tone: report.tone,
        language: report.language,
        confidence: report.factCheckScore >= 0.8 ? "HIGH" : report.factCheckScore >= 0.5 ? "MEDIUM" : "LOW",
        sections: report.sections.map(s => ({
          section_number: s.sectionNumber,
          section_name: s.title,
          content: s.content,
          sources: [s.sourceContentId],
          word_count: s.content.split(/\s+/).length,
        })),
        total_word_count: report.sections.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0),
        placeholders_resolved: 0,
        placeholders_unresolved: [],
      },
      audit: {
        session_id: report.sessionId,
        created_at: report.generatedAt,
        scenario_match: {
          matched_scenario: report.scenarios[0]?.scenarioId ?? "UNKNOWN",
          score: report.scenarios[0]?.score ?? 0,
          confidence: report.factCheckScore >= 0.8 ? "HIGH" : report.factCheckScore >= 0.5 ? "MEDIUM" : "LOW",
        },
        tone_selection: {
          selected_tone: report.tone,
          reason: `Selected based on driver analysis`,
        },
      },
    };

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      outcome: "BLOCK",
      audit: {
        session_id: intake.session_id,
        created_at: new Date().toISOString(),
        scenario_match: {
          matched_scenario: "ERROR",
          score: 0,
          confidence: "FALLBACK",
        },
        tone_selection: {
          selected_tone: "TP-01",
          reason: "Error fallback",
        },
      },
      error: errorMessage,
    };
  }
}
