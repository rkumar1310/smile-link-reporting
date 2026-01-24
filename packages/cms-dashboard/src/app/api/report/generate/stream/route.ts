/**
 * Streaming Report Generation API
 * POST /api/report/generate/stream
 * Returns Server-Sent Events for real-time progress updates
 *
 * Query params:
 *   - mock=true: Return simulated events for UI testing
 */

import { NextRequest } from "next/server";
import { GenerateReportRequestSchema } from "@/lib/types/types/report-generation";
import type { ReportPhaseEvent, ComposedReport, ReportPhase } from "@/lib/types/types/report-generation";
import { createReportGenerationService } from "@/lib/services/ReportGenerationService";
// Old adapter for backwards compatibility
import { runPipelineWithSSE as runPipelineAdapterWithSSE } from "@/lib/services/PipelineAdapter";
// New real pipeline implementation
import { runPipelineWithSSE } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to create a delay promise
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock report data for testing
function createMockReport(): ComposedReport {
  return {
    id: `report-${Date.now()}`,
    sessionId: "mock-session-123",
    patientName: "Test Patient",
    generatedAt: new Date().toISOString(),
    tone: "TP-02",
    toneName: "Empathic-Neutral",
    language: "en",
    scenarios: [
      {
        scenarioId: "S01",
        name: "Standard Single Implant",
        score: 0.85,
        matchedDrivers: ["single_missing_tooth", "healthy_bone"],
        sections: [1, 2, 3, 4],
      },
    ],
    sections: [
      {
        sectionNumber: 1,
        title: "Understanding Your Situation",
        content: "Based on your responses, we understand that you're seeking information about your dental treatment. **Your concerns are valid** and we're here to help you navigate this process.\n\n### What This Means for You\n\nYour treatment plan has been carefully considered, taking into account:\n- Your dental health history\n- Your specific concerns and preferences\n- The best available clinical evidence",
        sourceContentId: "intro-empathic-01",
        hasWarning: false,
      },
      {
        sectionNumber: 2,
        title: "Treatment Overview",
        content: "The recommended treatment approach involves careful consideration of your unique situation.\n\n### Key Points\n\n1. **Initial Assessment**: Your dental evaluation shows areas that need attention\n2. **Treatment Options**: Several approaches are available to address your needs\n3. **Expected Outcomes**: With proper care, you can expect positive results\n\n*Note: Individual results may vary based on various factors.*",
        sourceContentId: "treatment-overview-02",
        hasWarning: false,
      },
      {
        sectionNumber: 3,
        title: "What to Expect",
        content: "Here's what you can anticipate during your treatment journey:\n\n- **Preparation Phase**: Understanding what's involved\n- **Treatment Phase**: The actual procedure and what happens\n- **Recovery Phase**: How to care for yourself afterwards\n\n### Important Considerations\n\nEvery patient responds differently to treatment. We recommend discussing any specific concerns with your healthcare provider.",
        sourceContentId: "expectations-03",
        hasWarning: true,
        warnings: [
          {
            contentId: "expectations-03",
            section: "What to Expect",
            severity: "low",
            description: "Recovery timeframes are estimates and may vary",
            claimText: "Recovery Phase",
            suggestion: "Consider adding more specific recovery timeline information",
          },
        ],
      },
      {
        sectionNumber: 4,
        title: "Next Steps",
        content: "To proceed with your care, we recommend the following:\n\n1. Review this information carefully\n2. Prepare any questions you may have\n3. Schedule a consultation if needed\n\n### Questions to Consider\n\n- What are my treatment priorities?\n- What support do I need during recovery?\n- How can I best prepare for my appointment?",
        sourceContentId: "next-steps-04",
        hasWarning: false,
      },
    ],
    factCheckPassed: true,
    factCheckScore: 0.85,
    warnings: [
      {
        contentId: "expectations-03",
        section: "What to Expect",
        severity: "low",
        description: "Recovery timeframes are estimates and may vary",
        claimText: "Recovery Phase",
        suggestion: "Consider adding more specific recovery timeline information",
      },
    ],
    contentGenerated: 2,
    totalContentUsed: 5,
  };
}

// Run mock generation with simulated delays
async function runMockGeneration(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
) {
  const sendEvent = async (event: ReportPhaseEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(data));
  };

  try {
    // Phase 1: Analyzing
    await sendEvent({
      phase: "analyzing",
      message: "Analyzing your answers...",
      timestamp: new Date().toISOString(),
      data: {
        totalQuestions: 18,
        processedQuestions: 0,
      },
    });
    await delay(800);

    await sendEvent({
      phase: "analyzing",
      message: "Analysis complete",
      timestamp: new Date().toISOString(),
      data: {
        totalQuestions: 18,
        processedQuestions: 18,
      },
    });

    // Phase 2: Tone Selection
    await delay(400);
    await sendEvent({
      phase: "tone",
      message: "Selected tone: Empathic-Neutral",
      timestamp: new Date().toISOString(),
      data: {
        tone: "TP-02",
        toneName: "Empathic-Neutral",
        reason: "Based on patient's previous treatment history and emotional indicators",
      },
    });

    // Phase 3: Content Check
    await delay(600);
    await sendEvent({
      phase: "content-check",
      message: "Found 3 of 5 content items, 2 need generation",
      timestamp: new Date().toISOString(),
      data: {
        total: 5,
        available: 3,
        missing: 2,
        scenarios: ["S01", "S02"],
      },
    });

    // Phase 4: Generating (with integrated fact-checking)
    // Content 1: Generate
    await delay(400);
    await sendEvent({
      phase: "generating",
      message: "Generating content 1 of 2...",
      timestamp: new Date().toISOString(),
      data: {
        current: 1,
        total: 2,
        currentContent: "treatment-overview-02",
        factCheck: {
          status: "pending",
          attempt: 0,
          maxAttempts: 2,
        },
      },
    });
    await delay(800);

    // Content 1: Fact-checking
    await sendEvent({
      phase: "generating",
      message: "Verifying content accuracy...",
      timestamp: new Date().toISOString(),
      data: {
        current: 1,
        total: 2,
        currentContent: "treatment-overview-02",
        factCheck: {
          status: "checking",
          attempt: 1,
          maxAttempts: 2,
        },
      },
    });
    await delay(600);

    // Content 1: Passed
    await sendEvent({
      phase: "generating",
      message: "Content verified",
      timestamp: new Date().toISOString(),
      data: {
        current: 1,
        total: 2,
        currentContent: "treatment-overview-02",
        factCheck: {
          status: "passed",
          attempt: 1,
          maxAttempts: 2,
          score: 0.92,
        },
      },
    });
    await delay(400);

    // Content 2: Generate
    await sendEvent({
      phase: "generating",
      message: "Generating content 2 of 2...",
      timestamp: new Date().toISOString(),
      data: {
        current: 2,
        total: 2,
        currentContent: "expectations-03",
        factCheck: {
          status: "pending",
          attempt: 0,
          maxAttempts: 2,
        },
      },
    });
    await delay(800);

    // Content 2: Fact-check failed
    await sendEvent({
      phase: "generating",
      message: "Verifying content accuracy...",
      timestamp: new Date().toISOString(),
      data: {
        current: 2,
        total: 2,
        currentContent: "expectations-03",
        factCheck: {
          status: "checking",
          attempt: 1,
          maxAttempts: 2,
        },
      },
    });
    await delay(600);

    await sendEvent({
      phase: "generating",
      message: "Accuracy below threshold, regenerating...",
      timestamp: new Date().toISOString(),
      data: {
        current: 2,
        total: 2,
        currentContent: "expectations-03",
        factCheck: {
          status: "failed",
          attempt: 1,
          maxAttempts: 2,
          score: 0.58,
        },
      },
    });
    await delay(400);

    // Content 2: Retry
    await sendEvent({
      phase: "generating",
      message: "Regenerating content...",
      timestamp: new Date().toISOString(),
      data: {
        current: 2,
        total: 2,
        currentContent: "expectations-03",
        factCheck: {
          status: "retrying",
          attempt: 2,
          maxAttempts: 2,
        },
      },
    });
    await delay(800);

    // Content 2: Passed on retry
    await sendEvent({
      phase: "generating",
      message: "Content verified",
      timestamp: new Date().toISOString(),
      data: {
        current: 2,
        total: 2,
        currentContent: "expectations-03",
        factCheck: {
          status: "passed",
          attempt: 2,
          maxAttempts: 2,
          score: 0.85,
        },
      },
    });

    // Phase 5: Composing
    await delay(400);
    await sendEvent({
      phase: "composing",
      message: "Composing your report...",
      timestamp: new Date().toISOString(),
      data: {
        sectionsProcessed: 0,
        totalSections: 4,
      },
    });
    await delay(600);

    await sendEvent({
      phase: "composing",
      message: "Report composed",
      timestamp: new Date().toISOString(),
      data: {
        sectionsProcessed: 4,
        totalSections: 4,
      },
    });

    // Phase 6: LLM Quality Evaluation
    await delay(400);
    await sendEvent({
      phase: "evaluating",
      message: "Starting LLM quality evaluation...",
      timestamp: new Date().toISOString(),
      data: {
        status: "started",
      },
    });
    await delay(600);

    // Dimension-by-dimension evaluation progress
    const dimensions = [
      { name: "professional_quality", label: "Professional Quality", score: 8.5 },
      { name: "clinical_safety", label: "Clinical Safety", score: 9.2 },
      { name: "tone_appropriateness", label: "Tone Appropriateness", score: 8.8 },
      { name: "personalization", label: "Personalization", score: 7.5 },
      { name: "patient_autonomy", label: "Patient Autonomy", score: 8.0 },
      { name: "structure_completeness", label: "Structure & Completeness", score: 9.0 },
    ];

    for (const dim of dimensions) {
      await delay(300);
      await sendEvent({
        phase: "evaluating",
        message: `${dim.label}: ${dim.score}/10`,
        timestamp: new Date().toISOString(),
        data: {
          status: "in_progress",
          currentDimension: dim.name,
          metrics: {
            dimension: dim.name,
            score: dim.score,
          },
        },
      });
    }

    await delay(400);
    await sendEvent({
      phase: "evaluating",
      message: "Quality evaluation complete: PASS (8.5/10)",
      timestamp: new Date().toISOString(),
      data: {
        status: "completed",
        outcome: "PASS",
        overallScore: 8.5,
        dimensions: {
          professional_quality: 8.5,
          clinical_safety: 9.2,
          tone_appropriateness: 8.8,
          personalization: 7.5,
          patient_autonomy: 8.0,
          structure_completeness: 9.0,
        },
        contentIssues: 1,
      },
    });

    // Complete
    await delay(300);
    const mockReport = createMockReport();
    await sendEvent({
      phase: "complete",
      message: "Report generated successfully",
      timestamp: new Date().toISOString(),
      data: {
        report: mockReport,
      },
    });
  } finally {
    await writer.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for mock mode and pipeline mode
    const url = new URL(request.url);
    const isMockMode = url.searchParams.get("mock") === "true";
    const usePipeline = url.searchParams.get("pipeline") === "true";

    // Parse request body
    const body = await request.json();

    // Validate request
    const parseResult = GenerateReportRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: parseResult.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { intake, language } = parseResult.data;

    // Create a TransformStream for SSE
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send SSE events
    const sendEvent = async (event: ReportPhaseEvent) => {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(data));
    };

    if (isMockMode) {
      // Run mock generation in background
      runMockGeneration(writer, encoder);
    } else if (usePipeline) {
      // Use the real core pipeline with full LLM evaluation
      const runPipeline = async () => {
        try {
          const result = await runPipelineWithSSE(intake, {
            onEvent: sendEvent,
            language: (language as "en" | "nl") ?? "en",
          });

          // Send complete event with the final report and LLM evaluation
          if (result.success && result.report) {
            await sendEvent({
              phase: "complete",
              message: "Report generated successfully",
              timestamp: new Date().toISOString(),
              data: {
                report: result.report,
                llmEvaluation: result.audit?.llm_evaluation ?? undefined,
              },
            });
          } else if (!result.success) {
            // Log validation details for debugging
            if (result.audit?.validation_result) {
              console.error("[Pipeline] Validation errors:", result.audit.validation_result.errors);
              console.error("[Pipeline] Validation warnings:", result.audit.validation_result.warnings);
            }
            await sendEvent({
              phase: "error",
              message: result.error ?? "Report generation failed",
              timestamp: new Date().toISOString(),
              data: {
                error: result.error ?? "Unknown error",
                recoverable: false,
                phase: "analyzing" as ReportPhase,
              },
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await sendEvent({
            phase: "error",
            message: errorMessage,
            timestamp: new Date().toISOString(),
            data: {
              error: errorMessage,
              recoverable: false,
              phase: "analyzing" as ReportPhase,
            },
          });
        } finally {
          await writer.close();
        }
      };

      // Start pipeline without awaiting (streams in background)
      runPipeline();
    } else {
      // Start real report generation in background (legacy service)
      const generateReport = async () => {
        try {
          const service = createReportGenerationService(async (event) => {
            await sendEvent(event);
          });

          await service.generateReport({
            intake,
            language: language ?? "en",
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          await sendEvent({
            phase: "error",
            message: errorMessage,
            timestamp: new Date().toISOString(),
            data: {
              error: errorMessage,
              recoverable: false,
              phase: "analyzing" as ReportPhase,
            },
          });
        } finally {
          await writer.close();
        }
      };

      // Start generation without awaiting (streams in background)
      generateReport();
    }

    // Return SSE response
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Report generation stream error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to start report generation",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
