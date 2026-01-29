/**
 * Agents
 * Content generation and fact-check agents for Smile-Link CMS
 */

// Content Generator
export {
  DocxParser,
  createDocxParser,
  ContentGenerationAgent,
  createContentGenerationAgent,
} from "./content-generator/index";

// Fact Checker
export {
  ClaimExtractor,
  createClaimExtractor,
  SourceVerifier,
  createSourceVerifier,
  FactCheckAgent,
  createFactCheckAgent,
} from "./fact-checker/index";

// Shared
export { LLMProvider, createLLMProvider } from "./shared/LLMProvider";

// Langfuse Tracing
export {
  initLangfuse,
  getLangfuse,
  createTrace,
  traceGeneration,
  createSpan,
  scoreTrace,
  shutdownLangfuse,
  flushLangfuse,
} from "./shared/LangfuseTracer";

// Embeddings
export {
  EmbeddingProvider,
  createEmbeddingProvider,
  ChunkingService,
  createChunkingService,
  VectorSyncService,
  createVectorSyncService,
} from "./embeddings/index";

// Search
export {
  SemanticSearchService,
  createSemanticSearchService,
} from "./search/index";

// Types
export type { ParseOptions, ParseResult } from "./content-generator/index";
export type { FactCheckConfig } from "./fact-checker/index";
export type { LLMConfig, LLMMessage, LLMResponse, TraceOptions } from "./shared/LLMProvider";
export type { LangfuseConfig, TraceContext } from "./shared/LangfuseTracer";
export type { EmbeddingConfig } from "./embeddings/index";
export type { ChunkingConfig } from "./embeddings/index";
