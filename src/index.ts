/**
 * Smile-Link NLG Report Generation System
 * Main entry point
 */

// Types
export * from "./types/index.js";

// Engine
export * from "./engine/index.js";

// Composition
export * from "./composition/index.js";

// QA
export * from "./qa/index.js";

// Pipeline
export * from "./pipeline/index.js";

// Main function
import { ReportPipeline } from "./pipeline/ReportPipeline.js";
import type { IntakeData, PipelineResult } from "./types/index.js";

/**
 * Generate a report from intake data
 */
export async function generateReport(intake: IntakeData): Promise<PipelineResult> {
  const pipeline = new ReportPipeline();
  return pipeline.run(intake);
}

// CLI entry point
async function main() {
  console.log("Smile-Link NLG Report Generation System");
  console.log("========================================");
  console.log("");
  console.log("This is a library module. Import and use programmatically:");
  console.log("");
  console.log("  import { generateReport } from './src/index.js';");
  console.log("");
  console.log("  const result = await generateReport(intakeData);");
  console.log("");
}

// Run if executed directly
main().catch(console.error);
