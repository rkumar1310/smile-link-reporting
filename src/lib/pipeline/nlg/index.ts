/**
 * NLG Template System
 * Deterministic template-based report generation
 *
 * Flow:
 * 1. Tags → Drivers → Scenario Match (ScenarioScorer)
 * 2. Scenario → Base NLG Variables (from MongoDB)
 * 3. Drivers → Personalization Overrides
 * 4. Tags → Optional Content Blocks
 * 5. Template → Rendered Report
 */

// Types
export * from "./types";

// Schemas
export * from "./schemas/ScenarioSchema";

// Services
export { driverTextMapper, DriverTextMapper } from "./DriverTextMapper";
export { optionalBlockResolver, OptionalBlockResolver } from "./OptionalBlockResolver";
export { variableCalculator, VariableCalculator } from "./VariableCalculator";
export { nlgTemplateRenderer, NLGTemplateRenderer } from "./NLGTemplateRenderer";

// Main entry point
import type { NLGInput, NLGOutput } from "./types";
import { nlgTemplateRenderer } from "./NLGTemplateRenderer";

/**
 * Generate an NLG report
 * Main entry point for the NLG system
 */
export async function generateNLGReport(input: NLGInput): Promise<NLGOutput> {
  return nlgTemplateRenderer.render(input);
}
