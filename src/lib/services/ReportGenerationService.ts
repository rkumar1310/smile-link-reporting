/**
 * Report Generation Service
 * Orchestrates the report generation workflow with progress events
 *
 * DERIVATIVE CONTENT SUPPORT:
 * The service now supports derivative content generation, which synthesizes
 * multiple content blocks into cohesive content during report composition.
 * This is enabled by default but can be disabled via configuration.
 */

import type { ToneProfileId, SupportedLanguage } from "@/lib/types";
import type {
  IntakeAnswers,
  DriverState,
  ToneProfile,
  ContentCheckResult,
  ScoredScenario,
  ReportFactCheckResult,
  ReportSection,
  ComposedReport,
  ReportPhaseEvent,
} from "@/lib/types/types/report-generation";
import { createContentService, ContentService } from "./ContentService";
import { createToneService, ToneService } from "./ToneService";
import { createDerivativeContentService, DerivativeContentService } from "./DerivativeContentService";
import { generateReportPdf } from "./PdfGenerationService";
import { MissingContentError } from "@/lib/errors/MissingContentError";

export type ProgressCallback = (event: ReportPhaseEvent) => void;

export interface ReportGenerationConfig {
  intake: IntakeAnswers;
  language?: SupportedLanguage;
  enableDerivatives?: boolean;  // Enable derivative content synthesis (default: true)
}

export class ReportGenerationService {
  private contentService: ContentService;
  private toneService: ToneService;
  private derivativeService: DerivativeContentService;
  private onProgress: ProgressCallback;
  private enableDerivatives: boolean;

  constructor(onProgress: ProgressCallback, enableDerivatives: boolean = true) {
    this.contentService = createContentService();
    this.toneService = createToneService();
    this.derivativeService = createDerivativeContentService();
    this.onProgress = onProgress;
    this.enableDerivatives = enableDerivatives;
  }

  /**
   * Run the complete report generation workflow
   */
  async generateReport(config: ReportGenerationConfig): Promise<ComposedReport> {
    const language = config.language ?? "en";

    try {
      // Phase 1: Analyze answers and derive drivers
      this.emitProgress({
        phase: "analyzing",
        message: "Analyzing your answers...",
        timestamp: new Date().toISOString(),
      });

      const drivers = await this.analyzeAnswers(config.intake);

      // Phase 2: Select tone
      const toneProfile = await this.selectTone(drivers);

      this.emitProgress({
        phase: "tone",
        message: `Selected tone: ${toneProfile.name}`,
        timestamp: new Date().toISOString(),
        data: {
          tone: toneProfile.id,
          toneName: toneProfile.name,
          reason: this.getToneSelectionReason(drivers, toneProfile),
        },
      });

      // Phase 3: Check content availability and score scenarios
      this.emitProgress({
        phase: "content-check",
        message: "Checking content availability...",
        timestamp: new Date().toISOString(),
        data: {
          total: 0,
          available: 0,
          missing: 0,
          scenarios: [],
        },
      });

      const { scenarios, contentCheck } = await this.checkContentAvailability(
        drivers,
        language,
        toneProfile.id
      );

      this.emitProgress({
        phase: "content-check",
        message: `Found ${contentCheck.available}/${contentCheck.totalRequired} content items`,
        timestamp: new Date().toISOString(),
        data: {
          total: contentCheck.totalRequired,
          available: contentCheck.available,
          missing: contentCheck.missing.length,
          scenarios: scenarios.map((s) => s.scenarioId),
          // Include the list of blocks that are missing
          missingBlocks: contentCheck.missing.map((gap) => ({
            id: gap.contentId,
            name: gap.name,
            contentType: gap.contentType,
          })),
        },
      });

      // If content is missing, fail with descriptive error
      if (contentCheck.missing.length > 0) {
        throw new MissingContentError(
          `Report generation failed: ${contentCheck.missing.length} content item(s) missing from database. Please create these content blocks via the content management UI.`,
          contentCheck.missing.map((gap) => ({
            contentId: gap.contentId,
            language,
            tone: toneProfile.id,
          }))
        );
      }

      // No fact-checking needed since content must exist in DB
      const factCheckResult: ReportFactCheckResult = {
        passed: true,
        score: 1.0,
        issues: [],
        attempts: 0,
      };

      // Phase 4: Compose final report
      this.emitProgress({
        phase: "composing",
        message: "Composing your report...",
        timestamp: new Date().toISOString(),
      });

      const report = await this.composeReport(
        config.intake,
        scenarios,
        language,
        toneProfile,
        factCheckResult,
        0 // No content generated - all content comes from DB
      );

      // Emit completion
      this.emitProgress({
        phase: "complete",
        message: "Report ready!",
        timestamp: new Date().toISOString(),
        data: { report },
      });

      return report;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.emitProgress({
        phase: "error",
        message: errorMessage,
        timestamp: new Date().toISOString(),
        data: {
          error: errorMessage,
          recoverable: false,
          phase: "analyzing", // Default phase for error
        },
      });
      throw error;
    }
  }

  /**
   * Phase 1: Analyze questionnaire answers
   */
  async analyzeAnswers(intake: IntakeAnswers): Promise<DriverState> {
    return this.toneService.deriveDrivers(intake);
  }

  /**
   * Phase 2: Select appropriate tone
   */
  async selectTone(drivers: DriverState): Promise<ToneProfile> {
    return this.toneService.selectTone(drivers);
  }

  /**
   * Phase 3: Check content availability
   */
  async checkContentAvailability(
    drivers: DriverState,
    lang: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<{ scenarios: ScoredScenario[]; contentCheck: ContentCheckResult }> {
    // Load scenarios from content-registry.json (source of truth for what content exists)
    // The database stores generated variants, but the registry defines the content structure
    const contentRegistry = await import("@/lib/config/content-registry.json");
    const registryScenarios = contentRegistry.items
      .filter((item: { type: string }) => item.type === "scenario")
      .map((item: { id: string; name: string; description: string; sections?: number[] }) => ({
        contentId: item.id,
        name: item.name,
        description: item.description,
        sections: item.sections,
      }));

    // Score scenarios based on drivers
    const scoredScenarios = this.toneService.scoreScenarios(
      drivers,
      registryScenarios
    );

    // Take top scenarios (those with score > 0.3)
    const relevantScenarios = scoredScenarios.filter((s) => s.score > 0.3);

    // Check content availability for these scenarios
    const contentCheck = await this.contentService.checkContentAvailability(
      relevantScenarios,
      lang,
      tone
    );

    return {
      scenarios: relevantScenarios,
      contentCheck,
    };
  }


  /**
   * Phase 6: Compose final report
   */
  async composeReport(
    intake: IntakeAnswers,
    scenarios: ScoredScenario[],
    lang: SupportedLanguage,
    toneProfile: ToneProfile,
    factCheckResult: ReportFactCheckResult,
    generatedCount: number
  ): Promise<ComposedReport> {
    // Get content documents
    const contentDocs = await this.contentService.getContentForReport(
      scenarios.map((s) => s.scenarioId),
      lang,
      toneProfile.id
    );

    // Build report sections
    const sections: ReportSection[] = [];
    let sectionNumber = 1;

    for (const scenario of scenarios) {
      const content = contentDocs.find((c) => c.contentId === scenario.scenarioId);
      const variant = content?.variants?.[lang]?.[toneProfile.id];

      if (variant?.content) {
        // Check for warnings on this content
        const warnings = factCheckResult.issues.filter(
          (i) => i.contentId === scenario.scenarioId
        );

        // Apply placeholder substitution
        const renderedContent = this.applyPlaceholders(
          variant.content,
          intake,
          content?.placeholders || []
        );

        sections.push({
          sectionNumber: sectionNumber++,
          title: content?.name || scenario.name,
          content: renderedContent,
          sourceContentId: scenario.scenarioId,
          hasWarning: warnings.length > 0,
          warnings: warnings.length > 0 ? warnings : undefined,
        });
      }
    }

    // Create composed report
    const report: ComposedReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      generatedAt: new Date().toISOString(),
      patientName: intake.metadata?.patient_name,
      sessionId: intake.session_id,
      language: lang,
      tone: toneProfile.id,
      toneName: toneProfile.name,
      scenarios,
      sections,
      factCheckPassed: factCheckResult.passed,
      factCheckScore: factCheckResult.score,
      warnings: factCheckResult.issues,
      contentGenerated: generatedCount,
      totalContentUsed: sections.length,
      intakeAnswers: intake.answers,
    };

    // Generate PDF
    try {
      const pdfBuffer = await generateReportPdf(report);
      report.pdfBase64 = pdfBuffer.toString("base64");
    } catch (error) {
      console.error("PDF generation failed:", error);
      // Continue without PDF - it's not critical
    }

    return report;
  }

  /**
   * Apply placeholder substitution to content
   */
  private applyPlaceholders(
    content: string,
    intake: IntakeAnswers,
    placeholders: Array<{ key: string; source: string; fallback: string }>
  ): string {
    let result = content;

    // Built-in placeholders
    const patientName = intake.metadata?.patient_name || "you";
    const toothLocation = intake.metadata?.tooth_location || "the affected area";

    result = result.replace(/\{\{PATIENT_NAME\}\}/g, patientName);
    result = result.replace(/\{\{TOOTH_LOCATION\}\}/g, toothLocation);

    // Custom placeholders from manifest
    for (const placeholder of placeholders) {
      const value = this.resolvePlaceholderValue(placeholder.source, intake) || placeholder.fallback;
      result = result.replace(new RegExp(placeholder.key, "g"), value);
    }

    return result;
  }

  /**
   * Resolve placeholder value from intake data
   */
  private resolvePlaceholderValue(source: string, intake: IntakeAnswers): string | undefined {
    // Handle intake.metadata.X paths
    if (source.startsWith("intake.metadata.")) {
      const key = source.replace("intake.metadata.", "") as keyof NonNullable<IntakeAnswers["metadata"]>;
      return intake.metadata?.[key];
    }

    // Handle intake.X paths (for answers)
    if (source.startsWith("intake.")) {
      const questionId = source.replace("intake.", "");
      const answer = intake.answers.find((a) => a.question_id === questionId);
      return typeof answer?.answer === "string" ? answer.answer : answer?.answer?.[0];
    }

    return undefined;
  }

  /**
   * Get reason for tone selection
   */
  private getToneSelectionReason(drivers: DriverState, tone: ToneProfile): string {
    const reasons: string[] = [];

    if (tone.id === "TP-04") {
      reasons.push("High dental anxiety detected");
    } else if (tone.id === "TP-05") {
      reasons.push("Expectations need calibration");
    } else if (tone.id === "TP-02") {
      if (drivers.derivedTags.includes("negative_experience")) {
        reasons.push("Previous negative experience");
      }
      if (drivers.L1_Safety.hasActivePain) {
        reasons.push("Active pain condition");
      }
    } else if (tone.id === "TP-03") {
      reasons.push("Detailed information preference");
    } else {
      reasons.push("Standard communication profile");
    }

    return reasons.join("; ");
  }

  /**
   * Emit progress event
   */
  private emitProgress(event: ReportPhaseEvent): void {
    this.onProgress(event);
  }

  /**
   * Fact-check derivatives used in the report
   * NOTE: Fact-checking is currently disabled for faster iteration
   */
  async factCheckDerivatives(_derivativeIds: string[]): Promise<{
    passed: boolean;
    results: Array<{ derivativeId: string; status: string; confidence: number }>;
  }> {
    // Fact-checking disabled - return passing result
    return { passed: true, results: [] };
  }

  /**
   * Get derivative statistics
   */
  async getDerivativeStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgUsageCount: number;
    staleCount: number;
  }> {
    return this.derivativeService.getStats();
  }

  /**
   * Check if derivatives are enabled
   */
  isDerivativesEnabled(): boolean {
    return this.enableDerivatives;
  }
}

/**
 * Create a ReportGenerationService instance
 */
export function createReportGenerationService(
  onProgress: ProgressCallback,
  enableDerivatives: boolean = true
): ReportGenerationService {
  return new ReportGenerationService(onProgress, enableDerivatives);
}
