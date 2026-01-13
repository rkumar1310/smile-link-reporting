/**
 * LLM Report Evaluator
 * Orchestrates LLM-based quality evaluation of composed reports
 * with 6 evaluation dimensions and actionable feedback
 */

import { promises as fs } from "fs";
import { z } from "zod";

// Logger for evaluation operations
const log = {
  info: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [EVAL] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [EVAL] ⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  },
  error: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [EVAL] ❌ ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  },
  success: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [EVAL] ✅ ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  }
};

import type {
  ComposedReport,
  IntakeData,
  DriverState,
  ToneProfileId,
  QAOutcome,
  LLMEvaluationResult,
  LLMDimensionScore,
  ContentIssue,
  ContentSelection
} from "../types/index.js";
import { LLMClient, createLLMClient } from "./llm/LLMClient.js";
import { EvaluationPromptBuilder, evaluationPromptBuilder } from "./llm/EvaluationPromptBuilder.js";

// Zod schema for dimension scores
// Note: Removed .min()/.max() constraints - not supported by all providers
const DimensionScoreSchema = z.object({
  score: z.number().describe("Score from 1-10"),
  confidence: z.number().describe("Confidence level 0-1"),
  feedback: z.string().describe("Brief explanation of the score"),
  issues: z.array(z.string()).describe("List of specific issues found"),
  suggestions: z.array(z.string()).describe("Suggestions for improvement")
});

// Zod schema for content issues (actionable feedback)
const ContentIssueSchema = z.object({
  section_number: z.number().describe("Report section number with the issue"),
  source_content: z.string().describe("Source content file path"),
  quote: z.string().describe("Exact text with the issue"),
  problem: z.string().describe("Description of the problem"),
  severity: z.enum(["critical", "warning", "info"]).describe("Issue severity"),
  suggested_fix: z.string().describe("How to fix the issue")
});

// Zod schema for structured LLM output with 6 dimensions
const EvaluationResponseSchema = z.object({
  // 6 Evaluation Dimensions
  professional_quality: DimensionScoreSchema.describe("Writing quality, clarity, flow"),
  clinical_safety: DimensionScoreSchema.describe("Safety, disclaimers, no guarantees"),
  tone_appropriateness: DimensionScoreSchema.describe("Matches tone profile"),
  personalization: DimensionScoreSchema.describe("Patient-specific content"),
  patient_autonomy: DimensionScoreSchema.describe("Non-directive, respects choice"),
  structure_completeness: DimensionScoreSchema.describe("Required sections, logical order"),

  // Actionable feedback
  content_issues: z.array(ContentIssueSchema).describe("Specific issues with source file references"),

  // Overall assessment
  overall_assessment: z.string().describe("Overall assessment summary")
});

type EvaluationResponse = z.infer<typeof EvaluationResponseSchema>;

// Configuration types
export interface LLMEvaluatorThresholds {
  block_below: number;           // Block if overall_score < this (default: 6)
  flag_below: number;            // Flag if overall_score < this (default: 8)
  dimension_block_below: number; // Block if any dimension < this (default: 4)
  dimension_flag_below: number;  // Flag if any dimension < this (default: 6)
}

export interface LLMEvaluatorWeights {
  professional_quality: number;    // Default: 0.15
  clinical_safety: number;         // Default: 0.25 (highest - safety critical)
  tone_appropriateness: number;    // Default: 0.20
  personalization: number;         // Default: 0.15
  patient_autonomy: number;        // Default: 0.15
  structure_completeness: number;  // Default: 0.10
}

export interface LLMEvaluatorSkipConditions {
  high_confidence_pass: boolean; // Skip if report confidence is HIGH
  cost_control_sampling: number; // 0-1, percentage to evaluate (1.0 = all)
}

export interface LLMEvaluatorConfig {
  enabled: boolean;
  model: string;
  api_key_env: string;
  timeout_ms: number;
  max_retries: number;
  temperature: number;
  thresholds: LLMEvaluatorThresholds;
  weights: LLMEvaluatorWeights;
  skip_conditions: LLMEvaluatorSkipConditions;
  fallback_on_error: QAOutcome;
}

export interface EvaluationContext {
  report: ComposedReport;
  intake: IntakeData;
  driverState: DriverState;
  tone: ToneProfileId;
  scenarioId: string;
  contentSelections?: ContentSelection[];  // For source tracing
}

// Default configuration with tighter thresholds
const DEFAULT_CONFIG: LLMEvaluatorConfig = {
  enabled: true,  // Enabled by default - always evaluate reports
  model: "anthropic/claude-sonnet-4.5",
  api_key_env: "OPENROUTER_API_KEY",
  timeout_ms: 30000,
  max_retries: 2,
  temperature: 0.1,  // Low temperature for consistent evaluations
  thresholds: {
    block_below: 6,           // Tighter than before (was 4)
    flag_below: 8,            // Tighter than before (was 7)
    dimension_block_below: 4, // Tighter than before (was 3)
    dimension_flag_below: 6   // Tighter than before (was 5)
  },
  weights: {
    professional_quality: 0.15,
    clinical_safety: 0.25,      // Highest weight - patient safety
    tone_appropriateness: 0.20,
    personalization: 0.15,
    patient_autonomy: 0.15,
    structure_completeness: 0.10
  },
  skip_conditions: {
    high_confidence_pass: false,
    cost_control_sampling: 1.0  // Evaluate all by default
  },
  fallback_on_error: "FLAG"
};

export class LLMReportEvaluator {
  private config: LLMEvaluatorConfig;
  private client: LLMClient | null = null;
  private promptBuilder: EvaluationPromptBuilder;
  private configLoaded: boolean = false;

  constructor(config?: Partial<LLMEvaluatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.promptBuilder = evaluationPromptBuilder;
  }

  /**
   * Load configuration from file
   */
  private async loadConfig(): Promise<void> {
    if (this.configLoaded) return;

    try {
      const configPath = "config/llm-evaluator.json";
      const data = await fs.readFile(configPath, "utf-8");
      const fileConfig = JSON.parse(data) as Partial<LLMEvaluatorConfig>;

      // Deep merge with defaults
      this.config = {
        ...DEFAULT_CONFIG,
        ...fileConfig,
        thresholds: { ...DEFAULT_CONFIG.thresholds, ...fileConfig.thresholds },
        weights: { ...DEFAULT_CONFIG.weights, ...fileConfig.weights },
        skip_conditions: { ...DEFAULT_CONFIG.skip_conditions, ...fileConfig.skip_conditions }
      };

      this.configLoaded = true;
    } catch {
      // Use default config if file not found
      this.configLoaded = true;
    }
  }

  /**
   * Initialize the LLM client (lazy initialization)
   */
  private initClient(): LLMClient {
    if (!this.client) {
      const apiKey = process.env[this.config.api_key_env];
      if (!apiKey) {
        throw new Error(`Missing API key: ${this.config.api_key_env} environment variable not set`);
      }

      this.client = createLLMClient({
        model: this.config.model,
        apiKey,
        timeout: this.config.timeout_ms,
        maxRetries: this.config.max_retries,
        temperature: this.config.temperature
      });
    }
    return this.client;
  }

  /**
   * Check if the API key is configured
   */
  isApiKeyConfigured(): boolean {
    const apiKey = process.env[this.config.api_key_env];
    return !!apiKey;
  }

  /**
   * Evaluate a report using LLM with structured output
   * Throws an error if API key is not configured (required for quality assurance)
   */
  async evaluate(context: EvaluationContext): Promise<LLMEvaluationResult | null> {
    // Load config if not already loaded
    await this.loadConfig();

    log.info("Starting LLM evaluation", {
      session_id: context.report.session_id,
      scenario: context.scenarioId,
      tone: context.tone,
      reportSections: context.report.sections.length,
      reportWordCount: context.report.total_word_count
    });

    // Check if evaluation should run
    if (!this.shouldEvaluate(context)) {
      log.info("Evaluation skipped", { reason: "skip conditions met" });
      return null;
    }

    // Check API key availability - this is required when LLM evaluation is enabled
    if (!this.isApiKeyConfigured()) {
      log.error("API key not configured", { env_var: this.config.api_key_env });
      throw new Error(
        `LLM evaluation is enabled but ${this.config.api_key_env} environment variable is not set. ` +
        `Cannot generate reports without quality evaluation. ` +
        `Either set the API key or disable LLM evaluation.`
      );
    }

    const startTime = Date.now();

    try {
      const client = this.initClient();

      // Build prompts
      const systemPrompt = this.promptBuilder.buildSystemPrompt();
      const userPrompt = this.promptBuilder.buildUserPrompt({
        report: context.report,
        intake: context.intake,
        driverState: context.driverState,
        tone: context.tone,
        toneDescription: this.promptBuilder.getToneDescription(context.tone),
        scenarioId: context.scenarioId,
        contentSelections: context.contentSelections
      });

      log.info("Calling LLM for evaluation", {
        model: this.config.model,
        temperature: this.config.temperature,
        systemPromptChars: systemPrompt.length,
        userPromptChars: userPrompt.length
      });

      // Call LLM with structured output
      const response = await client.generateStructured(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        EvaluationResponseSchema
      );

      // Extract evaluation from structured response
      const evaluation = response.object;

      // Calculate overall score
      const overall_score = this.calculateOverallScore(evaluation);

      // Determine recommended outcome
      const { outcome, reasoning } = this.determineOutcome(evaluation, overall_score);

      // Extract unique content files to review
      const content_files_to_review = this.extractContentFilesToReview(evaluation.content_issues);

      const duration = Date.now() - startTime;

      log.success("Evaluation completed", {
        session_id: context.report.session_id,
        overall_score,
        outcome,
        reasoning,
        dimensions: {
          professional_quality: evaluation.professional_quality.score,
          clinical_safety: evaluation.clinical_safety.score,
          tone_appropriateness: evaluation.tone_appropriateness.score,
          personalization: evaluation.personalization.score,
          patient_autonomy: evaluation.patient_autonomy.score,
          structure_completeness: evaluation.structure_completeness.score
        },
        content_issues_count: evaluation.content_issues.length,
        critical_issues: evaluation.content_issues.filter(i => i.severity === "critical").length,
        warning_issues: evaluation.content_issues.filter(i => i.severity === "warning").length,
        duration_ms: duration,
        tokens: response.usage
      });

      return {
        professional_quality: evaluation.professional_quality,
        clinical_safety: evaluation.clinical_safety,
        tone_appropriateness: evaluation.tone_appropriateness,
        personalization: evaluation.personalization,
        patient_autonomy: evaluation.patient_autonomy,
        structure_completeness: evaluation.structure_completeness,
        content_issues: evaluation.content_issues,
        content_files_to_review,
        overall_score,
        overall_assessment: evaluation.overall_assessment,
        recommended_outcome: outcome,
        outcome_reasoning: reasoning,
        metadata: {
          model_used: this.config.model,
          evaluation_timestamp: new Date().toISOString(),
          duration_ms: duration,
          token_usage: response.usage
        }
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      // Re-throw API key errors - these should block report generation
      if (error instanceof Error && error.message.includes(this.config.api_key_env)) {
        throw error;
      }

      // Log detailed error info
      log.error("Evaluation failed", {
        session_id: context.report.session_id,
        duration_ms: duration,
        errorType: error?.constructor?.name ?? "Unknown",
        message: error instanceof Error ? error.message : String(error),
        fallback_outcome: this.config.fallback_on_error
      });

      return this.createFallbackResult(error, startTime);
    }
  }

  /**
   * Extract unique content files that need review from issues
   */
  private extractContentFilesToReview(contentIssues: ContentIssue[]): string[] {
    const files = new Set<string>();
    for (const issue of contentIssues) {
      if (issue.source_content && !issue.source_content.startsWith("[unknown")) {
        files.add(issue.source_content);
      }
    }
    return Array.from(files);
  }

  /**
   * Check if evaluation should run based on skip conditions
   */
  private shouldEvaluate(context: EvaluationContext): boolean {
    if (!this.config.enabled) {
      return false;
    }

    // Skip high-confidence reports if configured
    if (
      this.config.skip_conditions.high_confidence_pass &&
      context.report.confidence === "HIGH"
    ) {
      return false;
    }

    // Cost control sampling
    const samplingRate = this.config.skip_conditions.cost_control_sampling;
    if (samplingRate < 1.0) {
      // Use session_id hash for deterministic sampling
      const hash = this.hashString(context.report.session_id);
      const threshold = (hash % 100) / 100;
      if (threshold >= samplingRate) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(evaluation: EvaluationResponse): number {
    const { weights } = this.config;

    const score = (
      evaluation.professional_quality.score * weights.professional_quality +
      evaluation.clinical_safety.score * weights.clinical_safety +
      evaluation.tone_appropriateness.score * weights.tone_appropriateness +
      evaluation.personalization.score * weights.personalization +
      evaluation.patient_autonomy.score * weights.patient_autonomy +
      evaluation.structure_completeness.score * weights.structure_completeness
    );

    // Round to 1 decimal place
    return Math.round(score * 10) / 10;
  }

  /**
   * Determine PASS/FLAG/BLOCK outcome
   */
  private determineOutcome(
    evaluation: EvaluationResponse,
    overall_score: number
  ): { outcome: QAOutcome; reasoning: string } {
    const { thresholds } = this.config;

    const dimensions = [
      { name: "professional_quality", score: evaluation.professional_quality.score },
      { name: "clinical_safety", score: evaluation.clinical_safety.score },
      { name: "tone_appropriateness", score: evaluation.tone_appropriateness.score },
      { name: "personalization", score: evaluation.personalization.score },
      { name: "patient_autonomy", score: evaluation.patient_autonomy.score },
      { name: "structure_completeness", score: evaluation.structure_completeness.score }
    ];

    // Check for blocking conditions
    if (overall_score < thresholds.block_below) {
      return {
        outcome: "BLOCK",
        reasoning: `Overall score ${overall_score.toFixed(1)} below blocking threshold ${thresholds.block_below}`
      };
    }

    for (const dim of dimensions) {
      if (dim.score < thresholds.dimension_block_below) {
        return {
          outcome: "BLOCK",
          reasoning: `${dim.name} score ${dim.score} below dimension blocking threshold ${thresholds.dimension_block_below}`
        };
      }
    }

    // Check for critical content issues
    const criticalIssues = evaluation.content_issues.filter(i => i.severity === "critical");
    if (criticalIssues.length > 0) {
      return {
        outcome: "BLOCK",
        reasoning: `${criticalIssues.length} critical content issue(s) found`
      };
    }

    // Check for flagging conditions
    if (overall_score < thresholds.flag_below) {
      return {
        outcome: "FLAG",
        reasoning: `Overall score ${overall_score.toFixed(1)} below flagging threshold ${thresholds.flag_below}`
      };
    }

    for (const dim of dimensions) {
      if (dim.score < thresholds.dimension_flag_below) {
        return {
          outcome: "FLAG",
          reasoning: `${dim.name} score ${dim.score} below dimension flagging threshold ${thresholds.dimension_flag_below}`
        };
      }
    }

    // Check for warning content issues
    const warningIssues = evaluation.content_issues.filter(i => i.severity === "warning");
    if (warningIssues.length >= 3) {
      return {
        outcome: "FLAG",
        reasoning: `${warningIssues.length} warning-level content issues found`
      };
    }

    return {
      outcome: "PASS",
      reasoning: "All scores above thresholds, no critical issues"
    };
  }

  /**
   * Create fallback result when LLM fails
   */
  private createFallbackResult(
    error: unknown,
    startTime: number
  ): LLMEvaluationResult {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const fallbackDimension: LLMDimensionScore = {
      score: 0,
      confidence: 0,
      feedback: "Evaluation failed",
      issues: ["LLM evaluation error"],
      suggestions: []
    };

    return {
      professional_quality: fallbackDimension,
      clinical_safety: fallbackDimension,
      tone_appropriateness: fallbackDimension,
      personalization: fallbackDimension,
      patient_autonomy: fallbackDimension,
      structure_completeness: fallbackDimension,
      content_issues: [],
      content_files_to_review: [],
      overall_score: 0,
      overall_assessment: `LLM evaluation failed: ${errorMessage}`,
      recommended_outcome: this.config.fallback_on_error,
      outcome_reasoning: `Fallback due to error: ${errorMessage}`,
      metadata: {
        model_used: this.config.model,
        evaluation_timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        token_usage: { input_tokens: 0, output_tokens: 0 }
      }
    };
  }

  /**
   * Simple string hash for deterministic sampling
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<LLMEvaluatorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      thresholds: { ...this.config.thresholds, ...config.thresholds },
      weights: { ...this.config.weights, ...config.weights },
      skip_conditions: { ...this.config.skip_conditions, ...config.skip_conditions }
    };
    this.client = null; // Reset client to pick up new config
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMEvaluatorConfig {
    return { ...this.config };
  }

  /**
   * Check if evaluator is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Enable or disable the evaluator
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }
}

// Default instance
export const llmReportEvaluator = new LLMReportEvaluator();
