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
  ReportFactCheckIssue,
  ReportSection,
  ComposedReport,
  ReportPhaseEvent,
  ContentGap,
  ContentBlockProgress,
  ContentBlockStatus,
} from "@/lib/types/types/report-generation";
import { createContentService, ContentService } from "./ContentService";
import { createToneService, ToneService } from "./ToneService";
import { createDerivativeContentService, DerivativeContentService } from "./DerivativeContentService";
import { createContentGenerationAgent } from "@/lib/agents/content-generator";
import { createFactCheckAgent } from "@/lib/agents/fact-checker";
import { createDerivativeFactChecker } from "@/lib/agents/derivative-generator";
import { createSemanticSearchService, SemanticSearchService } from "@/lib/agents/search";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { generateReportPdf } from "./PdfGenerationService";

export type ProgressCallback = (event: ReportPhaseEvent) => void;

export interface ReportGenerationConfig {
  intake: IntakeAnswers;
  language?: SupportedLanguage;
  maxFactCheckAttempts?: number;
  factCheckThreshold?: number;
  enableDerivatives?: boolean;  // Enable derivative content synthesis (default: true)
}

export class ReportGenerationService {
  private contentService: ContentService;
  private toneService: ToneService;
  private searchService: SemanticSearchService;
  private derivativeService: DerivativeContentService;
  private onProgress: ProgressCallback;
  private enableDerivatives: boolean;

  constructor(onProgress: ProgressCallback, enableDerivatives: boolean = true) {
    this.contentService = createContentService();
    this.toneService = createToneService();
    this.searchService = createSemanticSearchService();
    this.derivativeService = createDerivativeContentService();
    this.onProgress = onProgress;
    this.enableDerivatives = enableDerivatives;
  }

  /**
   * Run the complete report generation workflow
   */
  async generateReport(config: ReportGenerationConfig): Promise<ComposedReport> {
    const language = config.language ?? "en";
    const maxFactCheckAttempts = config.maxFactCheckAttempts ?? 2;
    const factCheckThreshold = config.factCheckThreshold ?? 0.7;

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
          // Include the list of blocks that need to be generated
          missingBlocks: contentCheck.missing.map((gap) => ({
            id: gap.contentId,
            name: gap.name,
            contentType: gap.contentType,
          })),
        },
      });

      // Phase 4: Generate missing content (if needed)
      let generatedCount = 0;
      if (contentCheck.missing.length > 0) {
        generatedCount = await this.generateMissingContent(
          contentCheck.missing,
          language,
          toneProfile.id,
          maxFactCheckAttempts,
          factCheckThreshold
        );
      }

      // Fact-checking is now integrated into generateMissingContent
      // Get fact-check results from generated content
      const factCheckResult = await this.factCheckContent(
        scenarios,
        language,
        toneProfile.id,
        maxFactCheckAttempts,
        factCheckThreshold
      );

      // Phase 5: Compose final report
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
        generatedCount
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
   * Source document format for generation (simplified)
   */
  private mapToGenerationFormat(docs: Array<{ _id: { toString(): string }; filename: string; sections?: Array<{ id?: string; title: string; content: string }> }>): Array<{
    id: string;
    filename: string;
    sections: Array<{ id: string; title: string; content: string }>;
  }> {
    return docs.map((doc) => ({
      id: doc._id.toString(),
      filename: doc.filename,
      sections:
        doc.sections?.map((s) => ({
          id: s.id || s.title,
          title: s.title,
          content: s.content,
        })) || [],
    }));
  }

  /**
   * Find relevant source documents using semantic search
   * Returns raw MongoDB documents for use with both generation and fact-checking
   */
  private async findRelevantSourceDocs(
    gap: ContentGap
  ): Promise<Array<{
    _id: { toString(): string };
    filename: string;
    sections: Array<{
      id: string;
      title: string;
      content: string;
      pageStart: number;
      pageEnd: number;
      level: number;
      path: string[];
    }>;
  }>> {
    // Build search query from content gap metadata
    const query = `${gap.name} ${gap.contentType} ${gap.description || ""}`.trim();

    // Search Qdrant for relevant source chunks
    const results = await this.searchService.getRelevantSources(query, {
      limit: 15,
      scoreThreshold: 0.1,
    });

    if (results.length === 0) {
      console.warn(`No semantic search results for query: "${query}"`);
      return [];
    }

    // Group results by mongoDocId and fetch full documents from MongoDB
    const docIds = [...new Set(results.map((r) => r.mongoDocId))];
    const db = await getDb();

    const docs = await db
      .collection(COLLECTIONS.SOURCE_DOCUMENTS)
      .find({ _id: { $in: docIds.map((id) => new ObjectId(id)) } })
      .toArray();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return docs as any;
  }

  /**
   * Phase 4: Generate missing content with integrated fact-checking
   */
  async generateMissingContent(
    missing: ContentGap[],
    lang: SupportedLanguage,
    tone: ToneProfileId,
    maxFactCheckAttempts: number = 2,
    factCheckThreshold: number = 0.7
  ): Promise<number> {
    const generationAgent = createContentGenerationAgent();
    const factCheckAgent = createFactCheckAgent();
    let generated = 0;

    // Initialize content blocks progress tracking
    const contentBlocks: ContentBlockProgress[] = missing.map((gap) => ({
      id: gap.contentId,
      name: gap.name,
      contentType: gap.contentType,
      status: "pending" as ContentBlockStatus,
    }));

    // Helper to emit progress with full block list
    const emitBlockProgress = (
      index: number,
      status: ContentBlockStatus,
      message: string,
      factCheckData?: { status: string; attempt: number; maxAttempts: number; score?: number }
    ) => {
      // Update the block status
      contentBlocks[index].status = status;
      if (factCheckData?.attempt) {
        contentBlocks[index].factCheckAttempt = factCheckData.attempt;
      }
      if (factCheckData?.score !== undefined) {
        contentBlocks[index].factCheckScore = factCheckData.score;
      }

      this.emitProgress({
        phase: "generating",
        message,
        timestamp: new Date().toISOString(),
        data: {
          current: index + 1,
          total: missing.length,
          currentContent: missing[index].name,
          factCheck: factCheckData ? {
            status: factCheckData.status as "pending" | "checking" | "passed" | "failed" | "retrying",
            attempt: factCheckData.attempt,
            maxAttempts: factCheckData.maxAttempts,
            score: factCheckData.score,
          } : undefined,
          contentBlocks: [...contentBlocks], // Send a copy of the current state
        },
      });
    };

    for (let i = 0; i < missing.length; i++) {
      const gap = missing[i];
      let attempt = 0;
      let passed = false;
      let generatedContent: string | null = null;

      while (attempt < maxFactCheckAttempts && !passed) {
        attempt++;

        // Emit generating status with full block list
        emitBlockProgress(
          i,
          "generating",
          attempt === 1 ? `Generating content: ${gap.name}` : `Regenerating content: ${gap.name}`,
          { status: attempt === 1 ? "pending" : "retrying", attempt, maxAttempts: maxFactCheckAttempts }
        );

      try {
        // Find relevant source documents using semantic search
        const rawSourceDocs = await this.findRelevantSourceDocs(gap);

        if (rawSourceDocs.length === 0) {
          console.warn(`No relevant sources found for ${gap.contentId}`);
          // Mark the block as failed due to no sources
          emitBlockProgress(
            i,
            "failed",
            `No source documents found for: ${gap.name}`,
            { status: "failed", attempt, maxAttempts: maxFactCheckAttempts }
          );
          break; // Exit retry loop for this content
        }

        // Convert to generation format (simplified sections)
        const generationSourceDocs = this.mapToGenerationFormat(rawSourceDocs);

        // Generate content with semantically relevant sources
        const result = await generationAgent.generate({
          contentId: gap.contentId,
          contentType: gap.contentType as "scenario" | "a_block" | "b_block" | "module" | "static",
          language: lang,
          tone: tone,
          sourceDocuments: generationSourceDocs,
          existingManifest: {
            name: gap.name,
            description: gap.description || `Generated content for ${gap.contentId}`,
            targetSections: gap.sections,
            wordCountTarget: 300,
          },
        });

        generatedContent = result.content;

        // Emit fact-checking status
        emitBlockProgress(
          i,
          "verifying",
          `Verifying content: ${gap.name}`,
          { status: "checking", attempt, maxAttempts: maxFactCheckAttempts }
        );

        // Fact-check the generated content using raw docs (with full SourceSection structure)
        const factCheckResult = await factCheckAgent.check({
          contentId: gap.contentId,
          content: generatedContent,
          sourceDocuments: rawSourceDocs.map(doc => ({
            _id: doc._id.toString(),
            filename: doc.filename,
            sections: doc.sections,
          })),
          strictMode: false,
        });

        const score = factCheckResult.overallConfidence;
        passed = score >= factCheckThreshold;

        if (passed) {
          // Emit passed status
          emitBlockProgress(
            i,
            "done",
            `Content verified: ${gap.name}`,
            { status: "passed", attempt, maxAttempts: maxFactCheckAttempts, score }
          );

          // Save to database
          await this.contentService.updateContentVariant(
            gap.contentId,
            lang,
            tone,
            {
              content: result.content,
              wordCount: result.wordCount,
              citations: result.citations,
              generatedBy: "agent",
            }
          );

          generated++;
        } else {
          // Emit failed status - mark as done if last attempt, otherwise keep as verifying (will retry)
          const isLastAttempt = attempt >= maxFactCheckAttempts;
          emitBlockProgress(
            i,
            isLastAttempt ? "done" : "verifying",
            `Accuracy below threshold (${(score * 100).toFixed(0)}%), ${!isLastAttempt ? "regenerating..." : "using with warnings"}`,
            { status: "failed", attempt, maxAttempts: maxFactCheckAttempts, score }
          );

          // If this is the last attempt, save anyway with warnings
          if (isLastAttempt) {
            await this.contentService.updateContentVariant(
              gap.contentId,
              lang,
              tone,
              {
                content: result.content,
                wordCount: result.wordCount,
                citations: result.citations,
                generatedBy: "agent",
              }
            );
            generated++;
          }
        }
      } catch (error) {
        console.error(`Failed to generate content for ${gap.contentId}:`, error);
        // Mark the block as failed
        emitBlockProgress(
          i,
          "failed",
          `Failed to generate: ${gap.name}`,
          { status: "failed", attempt, maxAttempts: maxFactCheckAttempts }
        );
        break; // Exit retry loop for this content
      }
    } // end while retry loop
    } // end for loop

    return generated;
  }

  /**
   * Phase 5: Fact-check content with retry
   */
  async factCheckContent(
    scenarios: ScoredScenario[],
    lang: SupportedLanguage,
    tone: ToneProfileId,
    maxAttempts: number,
    threshold: number
  ): Promise<ReportFactCheckResult> {
    const factCheckAgent = createFactCheckAgent();
    const allIssues: ReportFactCheckIssue[] = [];
    let totalScore = 0;
    let checkedCount = 0;

    // Get content for fact-checking
    const contentDocs = await this.contentService.getContentForReport(
      scenarios.map((s) => s.scenarioId),
      lang,
      tone
    );

    // Get source documents for verification
    const db = await getDb();
    const sourceDocs = await db
      .collection(COLLECTIONS.SOURCE_DOCUMENTS)
      .find({})
      .limit(10)
      .toArray();

    const sourceDocuments = sourceDocs.map((doc) => ({
      id: doc._id.toString(),
      filename: doc.filename,
      sections: doc.sections?.map((s: { id?: string; title: string; content: string }) => ({
        id: s.id || s.title,
        title: s.title,
        content: s.content,
      })) || [],
    }));

    for (const content of contentDocs) {
      const variant = content.variants?.[lang]?.[tone];
      if (!variant?.content) continue;

      let attempt = 0;
      let passed = false;
      let currentScore = 0;

      while (attempt < maxAttempts && !passed) {
        attempt++;

        // Fact-check status is now shown within generating phase
        // This method is called after generation completes for final verification

        try {
          const result = await factCheckAgent.check({
            contentId: content.contentId,
            content: variant.content,
            sourceDocuments,
            strictMode: false,
          });

          currentScore = result.overallConfidence;
          passed = currentScore >= threshold;

          if (!passed && result.claims) {
            // Collect issues
            for (const claim of result.claims) {
              if (claim.verdict !== "verified") {
                allIssues.push({
                  contentId: content.contentId,
                  section: content.name,
                  severity: claim.verdict === "contradicted" ? "high" : "medium",
                  description: claim.reasoning,
                  claimText: claim.claimText,
                  suggestion: claim.verdict === "unsupported"
                    ? "Consider adding source citation"
                    : "Review this claim against source material",
                });
              }
            }
          }

          totalScore += currentScore;
          checkedCount++;
        } catch (error) {
          console.error(`Fact-check failed for ${content.contentId}:`, error);
          // Continue without fact-check result
          break;
        }
      }
    }

    const avgScore = checkedCount > 0 ? totalScore / checkedCount : 0;

    return {
      passed: avgScore >= threshold,
      score: avgScore,
      issues: allIssues,
      attempts: checkedCount,
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
   * This verifies that derivative content accurately represents its source blocks
   */
  async factCheckDerivatives(derivativeIds: string[]): Promise<{
    passed: boolean;
    results: Array<{ derivativeId: string; status: string; confidence: number }>;
  }> {
    if (!this.enableDerivatives || derivativeIds.length === 0) {
      return { passed: true, results: [] };
    }

    const factChecker = createDerivativeFactChecker();
    const results: Array<{ derivativeId: string; status: string; confidence: number }> = [];

    for (const derivativeId of derivativeIds) {
      const derivative = await this.derivativeService.findDerivative(derivativeId);
      if (!derivative) continue;

      // Get source blocks for verification
      const sourceBlocks = await this.derivativeService.getSourceBlocksContent(
        derivative.sourceBlockIds,
        derivative.language,
        derivative.tone
      );

      if (sourceBlocks.length === 0) continue;

      // Quick check using existing claim sources
      const { status, confidence } = await factChecker.quickCheck({
        derivativeContent: derivative.content,
        sourceBlocks,
        claimSources: derivative.factCheckResult?.claimSources || [],
      });

      results.push({ derivativeId, status, confidence });

      // Update derivative status
      await this.derivativeService.updateFactCheckStatus(
        derivativeId,
        status,
        derivative.factCheckResult
      );
    }

    const allPassed = results.every((r) => r.status === "verified" || r.status === "pending");
    return { passed: allPassed, results };
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
