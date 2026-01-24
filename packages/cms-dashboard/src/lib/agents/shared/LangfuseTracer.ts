/**
 * Langfuse Tracing Integration
 * Provides observability for all agent LLM calls
 */

import { Langfuse } from "langfuse";

export interface LangfuseConfig {
  secretKey?: string;
  publicKey?: string;
  baseUrl?: string;
  enabled?: boolean;
}

export interface TraceContext {
  traceId: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

let langfuseInstance: Langfuse | null = null;

/**
 * Initialize Langfuse client
 * Call this once at application startup
 */
export function initLangfuse(config?: LangfuseConfig): Langfuse | null {
  const secretKey = config?.secretKey ?? process.env.LANGFUSE_SECRET_KEY;
  const publicKey = config?.publicKey ?? process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = config?.baseUrl ?? process.env.LANGFUSE_BASEURL ?? "http://localhost:3001";
  const enabled = config?.enabled ?? (secretKey && publicKey);

  if (!enabled || !secretKey || !publicKey) {
    console.log("[Langfuse] Tracing disabled - missing API keys");
    return null;
  }

  langfuseInstance = new Langfuse({
    secretKey,
    publicKey,
    baseUrl,
  });

  console.log(`[Langfuse] Tracing enabled at ${baseUrl}`);
  return langfuseInstance;
}

/**
 * Get the Langfuse instance (or null if not initialized)
 */
export function getLangfuse(): Langfuse | null {
  return langfuseInstance;
}

/**
 * Create a new trace for an agent operation
 */
export function createTrace(name: string, context?: Partial<TraceContext>) {
  if (!langfuseInstance) return null;

  return langfuseInstance.trace({
    name,
    id: context?.traceId,
    sessionId: context?.sessionId,
    userId: context?.userId,
    metadata: context?.metadata,
  });
}

/**
 * Wrapper for tracing LLM generations
 */
export async function traceGeneration<T>(
  trace: ReturnType<typeof createTrace>,
  params: {
    name: string;
    model: string;
    input: unknown;
    modelParameters?: Record<string, string | number | boolean | string[] | null>;
  },
  fn: () => Promise<{ result: T; usage: { inputTokens: number; outputTokens: number } }>
): Promise<T> {
  if (!trace) {
    const { result } = await fn();
    return result;
  }

  const generation = trace.generation({
    name: params.name,
    model: params.model,
    input: params.input,
    modelParameters: params.modelParameters ?? null,
  });

  try {
    const { result, usage } = await fn();

    generation.end({
      output: result,
      usage: {
        input: usage.inputTokens,
        output: usage.outputTokens,
      },
    });

    return result;
  } catch (error) {
    generation.end({
      statusMessage: error instanceof Error ? error.message : "Unknown error",
      level: "ERROR",
    });
    throw error;
  }
}

/**
 * Create a span for tracking a sub-operation
 */
export function createSpan(
  trace: ReturnType<typeof createTrace>,
  name: string,
  input?: unknown
) {
  if (!trace) return null;
  return trace.span({ name, input });
}

/**
 * Score a trace for evaluation
 */
export function scoreTrace(
  trace: ReturnType<typeof createTrace>,
  params: {
    name: string;
    value: number;
    comment?: string;
  }
) {
  if (!trace) return;
  trace.score({
    name: params.name,
    value: params.value,
    comment: params.comment ?? undefined,
  });
}

/**
 * Shutdown Langfuse and flush pending events
 * Call this before application exit
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseInstance) {
    await langfuseInstance.shutdownAsync();
    langfuseInstance = null;
  }
}
