/**
 * LLM Client
 * Abstraction layer using Vercel AI SDK with Anthropic provider
 */

import { generateText, generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { z } from "zod";

// Simple logger for LLM operations
const log = {
  info: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [LLM] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  },
  warn: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [LLM] ⚠️  ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  },
  error: (msg: string, data?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [LLM] ❌ ${msg}`, data ? JSON.stringify(data, null, 2) : "");
  },
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (process.env.LLM_DEBUG === "true") {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [LLM] [DEBUG] ${msg}`, data ? JSON.stringify(data, null, 2) : "");
    }
  }
};

export interface LLMClientConfig {
  model: string;
  apiKey?: string;       // Optional - falls back to ANTHROPIC_API_KEY env var
  timeout?: number;      // Milliseconds
  maxRetries?: number;
  temperature?: number;  // 0.0-1.0, lower = more deterministic (default: 0.1)
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

export interface LLMStructuredResponse<T> {
  object: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
}

const DEFAULT_CONFIG: Required<Omit<LLMClientConfig, "apiKey">> = {
  model: "claude-sonnet-4-5-20250929",  // Anthropic model ID
  timeout: 30000,
  maxRetries: 2,
  temperature: 0.1  // Low temperature for consistent, deterministic evaluations
};

export class LLMClient {
  private config: Required<Omit<LLMClientConfig, "apiKey">> & { apiKey?: string };
  private anthropic: ReturnType<typeof createAnthropic>;

  constructor(config?: Partial<LLMClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create Anthropic provider
    this.anthropic = createAnthropic({
      apiKey: this.config.apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Send a chat completion request (unstructured text)
   */
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === "system");
    const nonSystemMessages = messages.filter(m => m.role !== "system");

    const result = await generateText({
      model: this.anthropic(this.config.model),
      system: systemMessage?.content,
      messages: nonSystemMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })),
      maxOutputTokens: 4000,
      temperature: this.config.temperature,
    });

    return {
      content: result.text,
      usage: {
        input_tokens: result.usage?.inputTokens ?? 0,
        output_tokens: result.usage?.outputTokens ?? 0
      },
      model: this.config.model
    };
  }

  /**
   * Generate structured output with a Zod schema
   */
  async generateStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>
  ): Promise<LLMStructuredResponse<T>> {
    const systemMessage = messages.find(m => m.role === "system");
    const nonSystemMessages = messages.filter(m => m.role !== "system");
    const maxTokens = 8000; // Increased for detailed critical evaluations

    log.info("Starting structured generation", {
      model: this.config.model,
      temperature: this.config.temperature,
      maxOutputTokens: maxTokens,
      messageCount: messages.length,
      systemPromptLength: systemMessage?.content.length ?? 0,
      userPromptLength: nonSystemMessages[0]?.content.length ?? 0
    });

    const startTime = Date.now();

    try {
      const result = await generateObject({
        model: this.anthropic(this.config.model),
        system: systemMessage?.content,
        messages: nonSystemMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content
        })),
        schema,
        maxOutputTokens: maxTokens,
        temperature: this.config.temperature,
      });

      const duration = Date.now() - startTime;
      const inputTokens = result.usage?.inputTokens ?? 0;
      const outputTokens = result.usage?.outputTokens ?? 0;

      log.info("Structured generation completed", {
        duration_ms: duration,
        inputTokens,
        outputTokens,
        finishReason: (result as unknown as { finishReason?: string }).finishReason ?? "unknown",
        tokensPerSecond: Math.round(outputTokens / (duration / 1000))
      });

      // Check if we hit token limit
      if (outputTokens >= maxTokens - 100) {
        log.warn("Output may have been truncated - approaching token limit", {
          outputTokens,
          maxTokens,
          remaining: maxTokens - outputTokens
        });
      }

      return {
        object: result.object,
        usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens
        },
        model: this.config.model
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      // Extract useful info from the error
      const errorInfo: Record<string, unknown> = {
        duration_ms: duration,
        errorType: error?.constructor?.name ?? "Unknown",
        message: error instanceof Error ? error.message : String(error)
      };

      // Check for specific error types
      if (error && typeof error === "object") {
        const err = error as Record<string, unknown>;
        if (err.finishReason) errorInfo.finishReason = err.finishReason;
        if (err.usage) errorInfo.usage = err.usage;
        if (err.cause && typeof err.cause === "object") {
          const cause = err.cause as Record<string, unknown>;
          errorInfo.causeType = cause.constructor?.name;
          if (cause.text) {
            // Truncate the raw text for logging
            const text = String(cause.text);
            errorInfo.responseTextLength = text.length;
            errorInfo.responseTextPreview = text.substring(0, 500) + (text.length > 500 ? "..." : "");
          }
        }
      }

      log.error("Structured generation failed", errorInfo);
      throw error;
    }
  }

  /**
   * Get the configured model name
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey || process.env.ANTHROPIC_API_KEY);
  }
}

/**
 * Create a new LLM client instance
 */
export function createLLMClient(config?: Partial<LLMClientConfig>): LLMClient {
  return new LLMClient(config);
}
