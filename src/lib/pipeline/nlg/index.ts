/**
 * NLG Template System
 * Deterministic template-based report generation
 *
 * Flow:
 * 1. Tags → Drivers → Scenario Match (ScenarioScorer)
 * 2. Scenario → NLG Variables (blocks 0-7 from MongoDB)
 * 3. Drivers/Tags → Text Module Selection (CONTEXT_MODULES_BLOCK)
 * 4. Options Array → Dynamic OPTIONS_BLOCK rendering
 * 5. Template → Rendered Report
 */

// Types
export * from "./types";

// Schemas
export * from "./schemas/ScenarioSchema";

// Services
export { textModuleResolver, TextModuleResolver } from "./TextModuleResolver";
export { variableCalculator, VariableCalculator } from "./VariableCalculator";
export { nlgTemplateRenderer, NLGTemplateRenderer } from "./NLGTemplateRenderer";
export { buildOptionsBlock } from "./optionBlockBuilder";

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
