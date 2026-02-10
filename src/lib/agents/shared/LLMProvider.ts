/**
 * LLM Provider
 * Wrapper around Anthropic Claude API for agent operations
 * With Langfuse tracing integration
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText, generateObject } from "ai";
import { z } from "zod";
import { getLangfuse, createTrace, traceGeneration } from "./LangfuseTracer";

export interface LLMConfig {
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMStructuredResponse<T> {
  object: T;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface TraceOptions {
  traceName?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export class LLMProvider {
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private anthropic: ReturnType<typeof createAnthropic>;

  constructor(config: LLMConfig = {}) {
    this.model = config.model ?? DEFAULT_MODEL;
    this.temperature = config.temperature ?? 0.3;
    this.maxTokens = config.maxTokens ?? 4096;

    const apiKey = config.apiKey ?? process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }

    this.anthropic = createAnthropic({ apiKey });
  }

  /**
   * Generate text response
   */
  async chat(messages: LLMMessage[], traceOptions?: TraceOptions): Promise<LLMResponse> {
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    // Create trace if Langfuse is enabled
    const trace = traceOptions?.traceName
      ? createTrace(traceOptions.traceName, {
          sessionId: traceOptions.sessionId,
          userId: traceOptions.userId,
          metadata: traceOptions.metadata,
        })
      : null;

    const executeGeneration = async () => {
      const result = await generateText({
        model: this.anthropic(this.model),
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
      });

      return {
        result: {
          text: result.text,
          usage: {
            inputTokens: result.usage?.inputTokens ?? 0,
            outputTokens: result.usage?.outputTokens ?? 0,
          },
        },
        usage: {
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
        },
      };
    };

    if (trace) {
      const response = await traceGeneration(
        trace,
        {
          name: "chat",
          model: this.model,
          input: messages,
          modelParameters: {
            temperature: this.temperature,
            maxTokens: this.maxTokens,
          },
        },
        executeGeneration
      );
      return response;
    }

    const { result } = await executeGeneration();
    return result;
  }

  /**
   * Generate structured output with schema validation
   */
  async generateStructured<T>(
    messages: LLMMessage[],
    schema: z.ZodType<T>,
    schemaName: string = "response",
    traceOptions?: TraceOptions
  ): Promise<LLMStructuredResponse<T>> {
    const systemMessage = messages.find((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    // Create trace if Langfuse is enabled
    const trace = traceOptions?.traceName
      ? createTrace(traceOptions.traceName, {
          sessionId: traceOptions.sessionId,
          userId: traceOptions.userId,
          metadata: traceOptions.metadata,
        })
      : null;

    const executeGeneration = async () => {
      const result = await generateObject({
        model: this.anthropic(this.model),
        system: systemMessage?.content,
        messages: nonSystemMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        schema,
        schemaName,
        temperature: this.temperature,
        maxOutputTokens: this.maxTokens,
      });

      return {
        result: {
          object: result.object,
          usage: {
            inputTokens: result.usage?.inputTokens ?? 0,
            outputTokens: result.usage?.outputTokens ?? 0,
          },
        },
        usage: {
          inputTokens: result.usage?.inputTokens ?? 0,
          outputTokens: result.usage?.outputTokens ?? 0,
        },
      };
    };

    if (trace) {
      const response = await traceGeneration(
        trace,
        {
          name: `generateStructured:${schemaName}`,
          model: this.model,
          input: messages,
          modelParameters: {
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            schemaName,
          },
        },
        executeGeneration
      );
      return response;
    }

    const { result } = await executeGeneration();
    return result;
  }
}

/**
 * Create a new LLM provider instance
 */
export function createLLMProvider(config?: LLMConfig): LLMProvider {
  return new LLMProvider(config);
}
