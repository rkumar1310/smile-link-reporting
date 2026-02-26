/**
 * Pipeline exports
 * Main entry point for the report generation pipeline
 */

// Main pipeline
export { ReportPipeline, createReportPipeline, type PipelineProgressEvent, type PipelineOptions } from "./ReportPipeline";

// Pipeline runner with SSE
export { runPipelineWithSSE, mapPipelineEventToSSE, transformReport, transformAudit, type PipelineSSEOptions, type PipelineSSEResult } from "./runPipeline";

// NLG system
export { generateNLGReport } from "./nlg";
export type { NLGInput, NLGOutput } from "./nlg";

// Types
export * from "./types";

// Engines
export { TagExtractor, tagExtractor } from "./engines/TagExtractor";
export { DriverDeriver, driverDeriver } from "./engines/DriverDeriver";
export { ScenarioScorer, scenarioScorer } from "./engines/ScenarioScorer";

// Validation
export { IntakeValidator, intakeValidator } from "./validation/IntakeValidator";
