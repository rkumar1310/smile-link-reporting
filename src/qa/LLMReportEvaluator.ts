/**
 * LLM Report Evaluator
 * Orchestrates LLM-based quality evaluation of composed reports
 */

import { promises as fs } from "fs";
import type {
  ComposedReport,
  IntakeData,
  DriverState,
  ToneProfileId,
  QAOutcome,
  LLMEvaluationResult,
  LLMDimensionScore
} from "../types/index.js";
import { LLMClient, createLLMClient } from "./llm/LLMClient.js";
import { EvaluationPromptBuilder, evaluationPromptBuilder } from "./llm/EvaluationPromptBuilder.js";

// Configuration types
export interface LLMEvaluatorThresholds {
  block_below: number;           // Block if overall_score < this (default: 4)
  flag_below: number;            // Flag if overall_score < this (default: 7)
  dimension_block_below: number; // Block if any dimension < this (default: 3)
  dimension_flag_below: number;  // Flag if any dimension < this (default: 5)
}

export interface LLMEvaluatorWeights {
  quality: number;               // Default: 0.3
  clinical_accuracy: number;     // Default: 0.4 (highest - safety critical)
  personalization: number;       // Default: 0.3
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
}

// Default configuration
const DEFAULT_CONFIG: LLMEvaluatorConfig = {
  enabled: true,  // Enabled by default - always evaluate reports
  model: "claude-sonnet-4-20250514",
  api_key_env: "ANTHROPIC_API_KEY",
  timeout_ms: 30000,
  max_retries: 2,
  thresholds: {
    block_below: 4,
    flag_below: 7,
    dimension_block_below: 3,
    dimension_flag_below: 5
  },
  weights: {
    quality: 0.3,
    clinical_accuracy: 0.4,  // Highest weight - patient safety
    personalization: 0.3
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
        maxRetries: this.config.max_retries
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
   * Evaluate a report using LLM
   * Throws an error if API key is not configured (required for quality assurance)
   */
  async evaluate(context: EvaluationContext): Promise<LLMEvaluationResult | null> {
    // Load config if not already loaded
    await this.loadConfig();

    // Check if evaluation should run
    if (!this.shouldEvaluate(context)) {
      return null;
    }

    // Check API key availability - this is required when LLM evaluation is enabled
    if (!this.isApiKeyConfigured()) {
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
        scenarioId: context.scenarioId
      });

      // Call LLM
      const response = await client.chat([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]);

      // Parse response
      const evaluation = this.parseResponse(response.content);

      // Calculate overall score
      const overall_score = this.calculateOverallScore(evaluation);

      // Determine recommended outcome
      const { outcome, reasoning } = this.determineOutcome(evaluation, overall_score);

      return {
        quality: evaluation.quality,
        clinical_accuracy: evaluation.clinical_accuracy,
        personalization: evaluation.personalization,
        overall_score,
        overall_assessment: evaluation.overall_assessment,
        recommended_outcome: outcome,
        outcome_reasoning: reasoning,
        metadata: {
          model_used: this.config.model,
          evaluation_timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          token_usage: response.usage
        }
      };

    } catch (error) {
      // Re-throw API key errors - these should block report generation
      if (error instanceof Error && error.message.includes(this.config.api_key_env)) {
        throw error;
      }
      // For other errors (network, parsing, etc.), use fallback
      console.error("LLM evaluation failed:", error);
      return this.createFallbackResult(error, startTime);
    }
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
   * Parse LLM response into structured result
   */
  private parseResponse(content: string): {
    quality: LLMDimensionScore;
    clinical_accuracy: LLMDimensionScore;
    personalization: LLMDimensionScore;
    overall_assessment: string;
  } {
    // Extract JSON from response (handle markdown code blocks if present)
    let jsonStr = content.trim();

    // Remove markdown code block if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!objectMatch) {
      throw new Error("Failed to parse LLM response: no JSON object found");
    }

    const json = JSON.parse(objectMatch[0]);

    // Validate structure
    this.validateEvaluationStructure(json);

    return {
      quality: this.normalizeDimensionScore(json.quality),
      clinical_accuracy: this.normalizeDimensionScore(json.clinical_accuracy),
      personalization: this.normalizeDimensionScore(json.personalization),
      overall_assessment: json.overall_assessment || ""
    };
  }

  /**
   * Normalize dimension score to ensure all fields are present
   */
  private normalizeDimensionScore(dim: Partial<LLMDimensionScore>): LLMDimensionScore {
    return {
      score: Math.min(10, Math.max(1, dim.score ?? 5)),
      confidence: Math.min(1, Math.max(0, dim.confidence ?? 0.5)),
      feedback: dim.feedback ?? "",
      issues: Array.isArray(dim.issues) ? dim.issues : [],
      suggestions: Array.isArray(dim.suggestions) ? dim.suggestions : []
    };
  }

  /**
   * Validate the evaluation structure
   */
  private validateEvaluationStructure(json: unknown): void {
    if (!json || typeof json !== "object") {
      throw new Error("Invalid evaluation structure: not an object");
    }

    const obj = json as Record<string, unknown>;
    const requiredFields = ["quality", "clinical_accuracy", "personalization"];

    for (const field of requiredFields) {
      if (!obj[field] || typeof obj[field] !== "object") {
        throw new Error(`Invalid evaluation structure: missing or invalid ${field}`);
      }

      const dim = obj[field] as Record<string, unknown>;
      if (typeof dim.score !== "number") {
        throw new Error(`Invalid evaluation structure: ${field}.score must be a number`);
      }
    }
  }

  /**
   * Calculate weighted overall score
   */
  private calculateOverallScore(evaluation: {
    quality: LLMDimensionScore;
    clinical_accuracy: LLMDimensionScore;
    personalization: LLMDimensionScore;
  }): number {
    const { weights } = this.config;

    const score = (
      evaluation.quality.score * weights.quality +
      evaluation.clinical_accuracy.score * weights.clinical_accuracy +
      evaluation.personalization.score * weights.personalization
    );

    // Round to 1 decimal place
    return Math.round(score * 10) / 10;
  }

  /**
   * Determine PASS/FLAG/BLOCK outcome
   */
  private determineOutcome(
    evaluation: {
      quality: LLMDimensionScore;
      clinical_accuracy: LLMDimensionScore;
      personalization: LLMDimensionScore;
    },
    overall_score: number
  ): { outcome: QAOutcome; reasoning: string } {
    const { thresholds } = this.config;

    const dimensions = [
      { name: "quality", score: evaluation.quality.score },
      { name: "clinical_accuracy", score: evaluation.clinical_accuracy.score },
      { name: "personalization", score: evaluation.personalization.score }
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

    return {
      outcome: "PASS",
      reasoning: "All scores above thresholds"
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
      quality: fallbackDimension,
      clinical_accuracy: fallbackDimension,
      personalization: fallbackDimension,
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
