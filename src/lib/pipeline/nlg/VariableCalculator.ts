/**
 * Variable Calculator
 * Orchestrates all variable resolution for NLG template
 *
 * Resolution sources:
 * 1. Scenario data from MongoDB (blocks 0-7 variables)
 * 2. OPTIONS_BLOCK built dynamically from scenario block_3_options
 * 3. CONTEXT_MODULES_BLOCK from TextModuleResolver (driver/tag driven)
 */

import type { SupportedLanguage } from "../types";
import type {
  NLGVariable,
  NLGInput,
  ResolvedVariable,
  VariableResolutionResult,
} from "./types";
import { AllNLGVariables } from "./types";
import { scenarioService } from "@/lib/services/ScenarioService";
import { flattenScenarioVariables, getScenarioOptions } from "./schemas/ScenarioSchema";
import { buildOptionsBlock } from "./optionBlockBuilder";
import { textModuleResolver } from "./TextModuleResolver";

// =============================================================================
// VARIABLE CALCULATOR CLASS
// =============================================================================

export class VariableCalculator {
  /**
   * Calculate all variables for NLG template
   */
  async calculate(input: NLGInput): Promise<VariableResolutionResult> {
    const { driverState, tags, language, scenarioId } = input;
    const variables: Record<string, ResolvedVariable> = {};

    let unresolvedCount = 0;
    let fallbackCount = 0;
    const missingDataVariables: NLGVariable[] = [];

    // 1. Resolve scenario-based variables (blocks 0-2 fragments + blocks 4-7 paragraphs)
    if (scenarioId) {
      const scenario = await scenarioService.getById(scenarioId);

      if (scenario) {
        // Flatten blocks 0-2 + 4-7 into key-value pairs
        const flattened = flattenScenarioVariables(scenario, language);
        for (const [key, value] of Object.entries(flattened)) {
          if (value) {
            variables[key] = {
              variable: key as NLGVariable,
              value,
              status: "resolved",
              source: "scenario",
              sourceId: scenarioId,
            };
          }
        }

        // 2. Build OPTIONS_BLOCK from block_3_options array
        const options = getScenarioOptions(scenario, language);
        const optionsBlock = buildOptionsBlock(options, language);
        variables.OPTIONS_BLOCK = {
          variable: "OPTIONS_BLOCK" as NLGVariable,
          value: optionsBlock,
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId,
        };
      } else {
        console.warn(`Scenario ${scenarioId} not found in MongoDB`);
      }
    }

    // 3. Resolve CONTEXT_MODULES_BLOCK from TextModuleResolver
    const contextModulesText = await textModuleResolver.resolve(
      driverState,
      tags,
      scenarioId,
      language
    );
    variables.CONTEXT_MODULES_BLOCK = {
      variable: "CONTEXT_MODULES_BLOCK" as NLGVariable,
      value: contextModulesText,
      status: contextModulesText ? "resolved" : "empty",
      source: "text_modules",
    };

    // 4. Fill in any remaining variables with missing_data status
    for (const variable of AllNLGVariables) {
      if (variables[variable]) continue;

      variables[variable] = {
        variable,
        value: `{${variable}}`,
        status: "missing_data",
        source: "unresolved",
      };
      missingDataVariables.push(variable);
      unresolvedCount++;
    }

    return {
      variables: variables as Record<NLGVariable, ResolvedVariable>,
      unresolvedCount,
      fallbackCount,
      missingDataVariables,
    };
  }
}

export const variableCalculator = new VariableCalculator();
