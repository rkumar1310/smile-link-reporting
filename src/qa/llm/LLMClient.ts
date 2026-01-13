/**
 * LLM Client
 * Abstraction layer using Vercel AI SDK with OpenRouter provider
 */

import { generateText, generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { z } from "zod";

export interface LLMClientConfig {
  model: string;
  apiKey?: string;       // Optional - falls back to OPENROUTER_API_KEY env var
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
  model: "anthropic/claude-sonnet-4.5",  // OpenRouter model format
  timeout: 30000,
  maxRetries: 2,
  temperature: 0.1  // Low temperature for consistent, deterministic evaluations
};

export class LLMClient {
  private config: Required<Omit<LLMClientConfig, "apiKey">> & { apiKey?: string };
  private openrouter: ReturnType<typeof createOpenRouter>;

  constructor(config?: Partial<LLMClientConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Create OpenRouter provider
    this.openrouter = createOpenRouter({
      apiKey: this.config.apiKey || process.env.OPENROUTER_API_KEY
    });
  }

  /**
   * Send a chat completion request (unstructured text)
   */
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === "system");
    const nonSystemMessages = messages.filter(m => m.role !== "system");

    const result = await generateText({
      model: this.openrouter.chat(this.config.model),
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

    const result = await generateObject({
      model: this.openrouter.chat(this.config.model),
      system: systemMessage?.content,
      messages: nonSystemMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content
      })),
      schema,
      maxOutputTokens: 4000,
      temperature: this.config.temperature,
    });

    return {
      object: result.object,
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
    return !!(this.config.apiKey || process.env.OPENROUTER_API_KEY);
  }
}

/**
 * Create a new LLM client instance
 */
export function createLLMClient(config?: Partial<LLMClientConfig>): LLMClient {
  return new LLMClient(config);
}
