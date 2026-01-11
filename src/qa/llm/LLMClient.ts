/**
 * LLM Client
 * Abstraction layer using Vercel AI SDK with Anthropic provider
 */

import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LLMEvaluationMetadata } from "../../types/index.js";

export interface LLMClientConfig {
  model: string;
  apiKey?: string;       // Optional - falls back to ANTHROPIC_API_KEY env var
  timeout?: number;      // Milliseconds
  maxRetries?: number;
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

const DEFAULT_CONFIG: Required<Omit<LLMClientConfig, "apiKey">> = {
  model: "claude-sonnet-4-20250514",
  timeout: 30000,
  maxRetries: 2
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
   * Send a chat completion request
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
      maxOutputTokens: 2000,
      // Note: Vercel AI SDK handles retries internally
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
