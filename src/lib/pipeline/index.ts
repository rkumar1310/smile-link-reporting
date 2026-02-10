/**
 * Pipeline exports
 * Main entry point for the report generation pipeline
 */

// Main pipeline
export { ReportPipeline, createReportPipeline, type PipelineProgressEvent, type PipelineOptions } from "./ReportPipeline";

// Pipeline runner with SSE
export { runPipelineWithSSE, mapPipelineEventToSSE, transformReport, type PipelineSSEOptions, type PipelineSSEResult } from "./runPipeline";

// Content store
export { DynamicContentStore, createDynamicContentStore, type DynamicContentStoreOptions, type ContentGenerationProgress } from "./content/DynamicContentStore";

// Types
export * from "./types";

// Engines
export { TagExtractor, tagExtractor } from "./engines/TagExtractor";
export { DriverDeriver, driverDeriver } from "./engines/DriverDeriver";
export { ScenarioScorer, scenarioScorer } from "./engines/ScenarioScorer";
export { ToneSelector, toneSelector } from "./engines/ToneSelector";
export { ContentSelector, contentSelector } from "./engines/ContentSelector";

// Composition
export { ReportComposer, reportComposer, type ContentStore } from "./composition/ReportComposer";
export { PlaceholderResolver, placeholderResolver, type PlaceholderContext } from "./composition/PlaceholderResolver";

// Validation
export { IntakeValidator, intakeValidator } from "./validation/IntakeValidator";

// QA
export { QAGate, qaGate, type QAGateResult, type QAProgressEvent } from "./qa/QAGate";
export { SemanticLeakageDetector, semanticLeakageDetector, type DetectionResult } from "./qa/SemanticLeakageDetector";
export { CompositionValidator, compositionValidator } from "./qa/CompositionValidator";
