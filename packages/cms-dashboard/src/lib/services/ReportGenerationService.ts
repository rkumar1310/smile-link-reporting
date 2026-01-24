/**
 * Report Generation Service
 * Orchestrates the 6-phase report generation workflow with progress events
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
} from "@/lib/types/types/report-generation";
import { createContentService, ContentService } from "./ContentService";
import { createToneService, ToneService } from "./ToneService";
import { createContentGenerationAgent } from "@/lib/agents/content-generator";
import { createFactCheckAgent } from "@/lib/agents/fact-checker";
import { createSemanticSearchService, SemanticSearchService } from "@/lib/agents/search";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export type ProgressCallback = (event: ReportPhaseEvent) => void;

export interface ReportGenerationConfig {
  intake: IntakeAnswers;
  language?: SupportedLanguage;
  maxFactCheckAttempts?: number;
  factCheckThreshold?: number;
}

export class ReportGenerationService {
  private contentService: ContentService;
  private toneService: ToneService;
  private searchService: SemanticSearchService;
  private onProgress: ProgressCallback;

  constructor(onProgress: ProgressCallback) {
    this.contentService = createContentService();
    this.toneService = createToneService();
    this.searchService = createSemanticSearchService();
    this.onProgress = onProgress;
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

    for (let i = 0; i < missing.length; i++) {
      const gap = missing[i];
      let attempt = 0;
      let passed = false;
      let generatedContent: string | null = null;

      while (attempt < maxFactCheckAttempts && !passed) {
        attempt++;

        // Emit generating status
        this.emitProgress({
          phase: "generating",
          message: attempt === 1 ? `Generating content: ${gap.name}` : `Regenerating content: ${gap.name}`,
          timestamp: new Date().toISOString(),
          data: {
            current: i + 1,
            total: missing.length,
            currentContent: gap.name,
            factCheck: {
              status: attempt === 1 ? "pending" : "retrying",
              attempt,
              maxAttempts: maxFactCheckAttempts,
            },
          },
        });

      try {
        // Find relevant source documents using semantic search
        const rawSourceDocs = await this.findRelevantSourceDocs(gap);

        if (rawSourceDocs.length === 0) {
          console.warn(`No relevant sources found for ${gap.contentId}`);
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
        this.emitProgress({
          phase: "generating",
          message: `Verifying content: ${gap.name}`,
          timestamp: new Date().toISOString(),
          data: {
            current: i + 1,
            total: missing.length,
            currentContent: gap.name,
            factCheck: {
              status: "checking",
              attempt,
              maxAttempts: maxFactCheckAttempts,
            },
          },
        });

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
          this.emitProgress({
            phase: "generating",
            message: `Content verified: ${gap.name}`,
            timestamp: new Date().toISOString(),
            data: {
              current: i + 1,
              total: missing.length,
              currentContent: gap.name,
              factCheck: {
                status: "passed",
                attempt,
                maxAttempts: maxFactCheckAttempts,
                score,
              },
            },
          });

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
          // Emit failed status
          this.emitProgress({
            phase: "generating",
            message: `Accuracy below threshold (${(score * 100).toFixed(0)}%), ${attempt < maxFactCheckAttempts ? "regenerating..." : "using with warnings"}`,
            timestamp: new Date().toISOString(),
            data: {
              current: i + 1,
              total: missing.length,
              currentContent: gap.name,
              factCheck: {
                status: "failed",
                attempt,
                maxAttempts: maxFactCheckAttempts,
                score,
              },
            },
          });

          // If this is the last attempt, save anyway with warnings
          if (attempt >= maxFactCheckAttempts) {
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
    };

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
}

/**
 * Create a ReportGenerationService instance
 */
export function createReportGenerationService(
  onProgress: ProgressCallback
): ReportGenerationService {
  return new ReportGenerationService(onProgress);
}
