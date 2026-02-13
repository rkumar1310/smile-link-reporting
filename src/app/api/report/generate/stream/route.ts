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
import { runPipelineWithSSE } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
        content: "Based on your responses, we understand that you're seeking information about your dental treatment.",
        sourceContentId: "intro-empathic-01",
        hasWarning: false,
      },
      {
        sectionNumber: 2,
        title: "Treatment Overview",
        content: "The recommended treatment approach involves careful consideration of your unique situation.",
        sourceContentId: "treatment-overview-02",
        hasWarning: false,
      },
      {
        sectionNumber: 3,
        title: "What to Expect",
        content: "Here's what you can anticipate during your treatment journey.",
        sourceContentId: "expectations-03",
        hasWarning: false,
      },
      {
        sectionNumber: 4,
        title: "Next Steps",
        content: "To proceed with your care, review this information and schedule a consultation when ready.",
        sourceContentId: "next-steps-04",
        hasWarning: false,
      },
    ],
    factCheckPassed: true,
    factCheckScore: 1.0,
    warnings: [],
    contentGenerated: 0,
    totalContentUsed: 4,
  };
}

async function runMockGeneration(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder
) {
  const sendEvent = async (event: ReportPhaseEvent) => {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    await writer.write(encoder.encode(data));
  };

  try {
    await sendEvent({
      phase: "analyzing",
      message: "Analyzing your answers...",
      timestamp: new Date().toISOString(),
      data: { totalQuestions: 18, processedQuestions: 0 },
    });
    await delay(800);

    await sendEvent({
      phase: "analyzing",
      message: "Analysis complete",
      timestamp: new Date().toISOString(),
      data: { totalQuestions: 18, processedQuestions: 18 },
    });

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

    await delay(600);
    await sendEvent({
      phase: "content-check",
      message: "Content available",
      timestamp: new Date().toISOString(),
      data: { total: 5, available: 5, missing: 0, scenarios: ["S01"] },
    });

    await delay(400);
    await sendEvent({
      phase: "composing",
      message: "Composing your report...",
      timestamp: new Date().toISOString(),
      data: { sectionsProcessed: 0, totalSections: 4 },
    });
    await delay(600);

    await sendEvent({
      phase: "composing",
      message: "Report composed",
      timestamp: new Date().toISOString(),
      data: { sectionsProcessed: 4, totalSections: 4 },
    });

    await delay(300);
    const mockReport = createMockReport();
    await sendEvent({
      phase: "complete",
      message: "Report generated successfully",
      timestamp: new Date().toISOString(),
      data: { report: mockReport },
    });
  } finally {
    await writer.close();
  }
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const isMockMode = url.searchParams.get("mock") === "true";

    const body = await request.json();

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

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (event: ReportPhaseEvent) => {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(data));
    };

    if (isMockMode) {
      runMockGeneration(writer, encoder);
    } else {
      const runPipeline = async () => {
        try {
          const result = await runPipelineWithSSE(intake, {
            onEvent: sendEvent,
            language: (language as "en" | "nl") ?? "en",
          });

          if (result.success && result.report) {
            await sendEvent({
              phase: "complete",
              message: "Report generated successfully",
              timestamp: new Date().toISOString(),
              data: { report: result.report, audit: result.auditData },
            });
          } else if (!result.success) {
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

      runPipeline();
    }

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
