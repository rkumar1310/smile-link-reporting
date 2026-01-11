/**
 * QA Module Exports
 */

export { TraceCollector, StageTimer, createTraceCollector } from "./TraceCollector.js";
export { SemanticLeakageDetector, semanticLeakageDetector } from "./SemanticLeakageDetector.js";
export type { DetectionResult } from "./SemanticLeakageDetector.js";
export { CompositionValidator, compositionValidator } from "./CompositionValidator.js";
export { QAGate, qaGate } from "./QAGate.js";
export type { QAGateResult, QAGateConfig } from "./QAGate.js";

// LLM Evaluator exports
export { LLMReportEvaluator, llmReportEvaluator } from "./LLMReportEvaluator.js";
export type { LLMEvaluatorConfig, EvaluationContext } from "./LLMReportEvaluator.js";
export { LLMClient, createLLMClient } from "./llm/LLMClient.js";
export type { LLMClientConfig, LLMMessage, LLMResponse } from "./llm/LLMClient.js";
export { EvaluationPromptBuilder, evaluationPromptBuilder } from "./llm/EvaluationPromptBuilder.js";
export type { PromptContext } from "./llm/EvaluationPromptBuilder.js";
