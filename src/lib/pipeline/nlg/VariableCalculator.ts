/**
 * Variable Calculator
 * Orchestrates all variable resolution for NLG template
 *
 * Resolution priority:
 * 1. Static content (DISCLAIMER)
 * 2. Scenario data from MongoDB (treatment options, pricing, etc.)
 * 3. Driver-based text mappings (personalization)
 * 4. Optional tag blocks (contextual content)
 * 5. Flagged placeholders (missing data)
 */

import type { DriverState, ToneProfileId, SupportedLanguage } from "../types";
import type {
  NLGVariable,
  NLGInput,
  NLGFlag,
  ResolvedVariable,
  VariableResolutionResult,
  NLGImplementationStatus
} from "./types";
import {
  AllNLGVariables,
  getVariableImplementationStatus,
  getFlaggedVariables
} from "./types";
import { driverTextMapper } from "./DriverTextMapper";
import { optionalBlockResolver } from "./OptionalBlockResolver";
import { scenarioService } from "@/lib/services/ScenarioService";
import { flattenScenarioVariables } from "./schemas/ScenarioSchema";

// =============================================================================
// STATIC CONTENT
// =============================================================================

const DISCLAIMER_TEXT = {
  en: `**Important Notice**

This report is generated based on your questionnaire responses and provides general information about dental treatment options. It is not a medical diagnosis or treatment recommendation.

- This information is for educational purposes only
- Always consult a qualified dental professional for personalized advice
- Treatment decisions should be made in consultation with your dentist
- Individual results may vary based on your specific situation

The information provided does not replace professional dental examination and consultation.`,

  nl: `**Belangrijke Mededeling**

Dit rapport is gegenereerd op basis van uw vragenlijstantwoorden en biedt algemene informatie over tandheelkundige behandelopties. Het is geen medische diagnose of behandeladvies.

- Deze informatie is alleen voor educatieve doeleinden
- Raadpleeg altijd een gekwalificeerde tandheelkundige professional voor persoonlijk advies
- Behandelbeslissingen moeten in overleg met uw tandarts worden genomen
- Individuele resultaten kunnen variëren op basis van uw specifieke situatie

De verstrekte informatie vervangt geen professioneel tandheelkundig onderzoek en consult.`
};

// =============================================================================
// FLAGGED VARIABLE PLACEHOLDERS
// =============================================================================

/**
 * Placeholder values for flagged (not implemented) variables.
 * Variables with actual fallback content keep their text.
 * Variables without data show {VARIABLE_NAME} so the missing variable is visible.
 */
const FLAGGED_PLACEHOLDERS: Record<string, { en: string; nl: string }> = {
  // Risks (partial — has fallback content)
  GENERAL_RISK: {
    en: "temporary discomfort, swelling, and individual healing variations",
    nl: "tijdelijk ongemak, zwelling en individuele genezingsvariaties"
  },

  // Pricing (FLAGGED — no data yet)
  PRICE_MIN: { en: "{PRICE_MIN}", nl: "{PRICE_MIN}" },
  PRICE_MAX: { en: "{PRICE_MAX}", nl: "{PRICE_MAX}" },
  FACTOR_1: { en: "complexity of your individual case", nl: "complexiteit van uw individuele geval" },
  FACTOR_2: { en: "materials and techniques used", nl: "gebruikte materialen en technieken" },
  FACTOR_3: { en: "regional pricing variations", nl: "regionale prijsvariaties" },

  // Recovery (partial — has fallback content)
  RECOVERY_DURATION: { en: "{RECOVERY_DURATION}", nl: "{RECOVERY_DURATION}" },
  RECOVERY_DISCOMFORT: {
    en: "mild swelling and sensitivity that typically resolves within a few days",
    nl: "milde zwelling en gevoeligheid die meestal binnen enkele dagen verdwijnt"
  },
  ALARM_SIGNAL: {
    en: "severe pain, persistent bleeding, high fever, or signs of infection",
    nl: "ernstige pijn, aanhoudende bloeding, hoge koorts of tekenen van infectie"
  },

  // Questions (has fallback content)
  QUESTION_1: {
    en: "What are the specific treatment options for my situation?",
    nl: "Wat zijn de specifieke behandelopties voor mijn situatie?"
  },
  QUESTION_2: {
    en: "What is the expected timeline and what should I expect during recovery?",
    nl: "Wat is de verwachte tijdlijn en wat kan ik verwachten tijdens het herstel?"
  },
  QUESTION_3: {
    en: "What are the costs involved and are there payment options available?",
    nl: "Wat zijn de kosten en zijn er betalingsopties beschikbaar?"
  }
};

// =============================================================================
// VARIABLE CALCULATOR CLASS
// =============================================================================

export class VariableCalculator {
  /**
   * Calculate all variables for NLG template
   *
   * Resolution order:
   * 1. Static content (DISCLAIMER_TEXT)
   * 2. Scenario data from MongoDB (if scenarioId provided)
   * 3. Driver-based text mappings (personalization overrides)
   * 4. Optional tag blocks (contextual content)
   * 5. Flagged placeholders (for missing data)
   */
  async calculate(input: NLGInput): Promise<VariableResolutionResult> {
    const { driverState, tags, language, tone, scenarioId } = input;
    const variables: Record<NLGVariable, ResolvedVariable> = {} as Record<NLGVariable, ResolvedVariable>;

    // Track statistics
    let unresolvedCount = 0;
    let fallbackCount = 0;
    const missingDataVariables: NLGVariable[] = [];
    const notImplementedVariables: NLGVariable[] = [];

    // 1. Resolve static content (DISCLAIMER)
    variables.DISCLAIMER_TEXT = {
      variable: "DISCLAIMER_TEXT",
      value: DISCLAIMER_TEXT[language],
      status: "resolved",
      source: "static"
    };

    // 2. Resolve scenario-based variables (if scenarioId provided)
    if (scenarioId) {
      const scenarioVariables = await this.resolveScenarioVariables(scenarioId, language);
      for (const [variable, resolved] of Object.entries(scenarioVariables)) {
        variables[variable as NLGVariable] = resolved;
      }
    }

    // 3. Resolve driver-based variables (these can override scenario values for personalization)
    const driverResolved = driverTextMapper.resolveAll(driverState, language);
    for (const [variable, resolved] of driverResolved) {
      // Only override if driver mapping has a value (not empty)
      if (resolved.value && resolved.status === "resolved") {
        variables[variable] = resolved;
      } else if (!variables[variable]) {
        // Use driver value if no scenario value exists
        variables[variable] = resolved;
      }
    }

    // 4. Resolve optional tag blocks
    const optionalResolved = await optionalBlockResolver.resolveAll(
      driverState,
      tags,
      language,
      tone
    );
    for (const [variable, resolved] of optionalResolved) {
      variables[variable] = resolved;
    }

    // 5. Fill in remaining variables with fallbacks or flags
    for (const variable of AllNLGVariables) {
      if (variables[variable]) continue;

      const implementationStatus = getVariableImplementationStatus(variable);

      if (implementationStatus === "flagged") {
        // Use flagged placeholder
        const placeholder = FLAGGED_PLACEHOLDERS[variable];
        variables[variable] = {
          variable,
          value: placeholder?.[language] ?? "",
          status: "not_implemented",
          source: "flagged"
        };
        notImplementedVariables.push(variable);
        unresolvedCount++;
      } else {
        // Use fallback from driver mapper
        const fallbackValue = driverTextMapper.getFallback(variable, language);
        variables[variable] = {
          variable,
          value: fallbackValue,
          status: "fallback",
          source: "fallback",
          fallbackUsed: true
        };
        fallbackCount++;
      }
    }

    return {
      variables,
      unresolvedCount,
      fallbackCount,
      missingDataVariables,
      notImplementedVariables
    };
  }

  /**
   * Resolve variables from scenario data in MongoDB
   */
  private async resolveScenarioVariables(
    scenarioId: string,
    language: "en" | "nl"
  ): Promise<Record<string, ResolvedVariable>> {
    const resolved: Record<string, ResolvedVariable> = {};

    try {
      const scenario = await scenarioService.getById(scenarioId);
      if (!scenario) {
        console.warn(`Scenario ${scenarioId} not found in MongoDB`);
        return resolved;
      }

      // Flatten scenario variables to strings
      const flattened = flattenScenarioVariables(scenario, language);

      for (const [variable, value] of Object.entries(flattened)) {
        if (value) {
          resolved[variable] = {
            variable: variable as NLGVariable,
            value,
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }
      }

      // Map treatment options to OPTION_N_* variables
      scenario.treatment_options.forEach((option, index) => {
        const n = index + 1;
        const prefix = `OPTION_${n}`;

        resolved[`${prefix}_NAME`] = {
          variable: `${prefix}_NAME` as NLGVariable,
          value: option.name[language],
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };

        if (option.description) {
          resolved[`${prefix}_SHORT_DESCRIPTION`] = {
            variable: `${prefix}_SHORT_DESCRIPTION` as NLGVariable,
            value: option.description[language],
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }

        if (option.ideal_for) {
          resolved[`${prefix}_INDICATION`] = {
            variable: `${prefix}_INDICATION` as NLGVariable,
            value: option.ideal_for[language],
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }

        if (option.benefits?.length) {
          resolved[`${prefix}_ADVANTAGES`] = {
            variable: `${prefix}_ADVANTAGES` as NLGVariable,
            value: option.benefits.map(b => `- ${b[language]}`).join("\n"),
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }

        if (option.considerations?.length) {
          resolved[`${prefix}_DISADVANTAGES`] = {
            variable: `${prefix}_DISADVANTAGES` as NLGVariable,
            value: option.considerations.map(c => `- ${c[language]}`).join("\n"),
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }

        if (option.complexity) {
          resolved[`${prefix}_COMPLEXITY`] = {
            variable: `${prefix}_COMPLEXITY` as NLGVariable,
            value: option.complexity[language],
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }
      });

      // Map pricing
      if (scenario.pricing) {
        resolved.PRICE_MIN = {
          variable: "PRICE_MIN" as NLGVariable,
          value: `€${scenario.pricing.min.toLocaleString()}`,
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };
        resolved.PRICE_MAX = {
          variable: "PRICE_MAX" as NLGVariable,
          value: `€${scenario.pricing.max.toLocaleString()}`,
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };
      }

      // Map fields from first treatment option (as primary)
      const primaryOption = scenario.treatment_options[0];

      if (primaryOption?.result_description) {
        resolved.RESULT_DESCRIPTION = {
          variable: "RESULT_DESCRIPTION" as NLGVariable,
          value: primaryOption.result_description[language],
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };
      }

      if (primaryOption?.comfort_experience) {
        resolved.COMFORT_EXPERIENCE = {
          variable: "COMFORT_EXPERIENCE" as NLGVariable,
          value: primaryOption.comfort_experience[language],
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };
      }

      if (primaryOption?.aesthetic_result) {
        resolved.AESTHETIC_RESULT = {
          variable: "AESTHETIC_RESULT" as NLGVariable,
          value: primaryOption.aesthetic_result[language],
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };
      }

      if (primaryOption?.phases?.length) {
        primaryOption.phases.forEach((phase, i) => {
          resolved[`PHASE_${i + 1}`] = {
            variable: `PHASE_${i + 1}` as NLGVariable,
            value: phase[language],
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        });
      }

      if (primaryOption?.duration) {
        resolved.TREATMENT_DURATION = {
          variable: "TREATMENT_DURATION" as NLGVariable,
          value: language === "en"
            ? `${primaryOption.duration.min_months}-${primaryOption.duration.max_months} months`
            : `${primaryOption.duration.min_months}-${primaryOption.duration.max_months} maanden`,
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };
      }

      // Map recovery from first treatment option
      if (primaryOption?.recovery) {
        resolved.RECOVERY_DURATION = {
          variable: "RECOVERY_DURATION" as NLGVariable,
          value: language === "en"
            ? `${primaryOption.recovery.days} days`
            : `${primaryOption.recovery.days} dagen`,
          status: "resolved",
          source: "scenario",
          sourceId: scenarioId
        };

        if (primaryOption.recovery.description) {
          resolved.RECOVERY_DISCOMFORT = {
            variable: "RECOVERY_DISCOMFORT" as NLGVariable,
            value: primaryOption.recovery.description[language],
            status: "resolved",
            source: "scenario",
            sourceId: scenarioId
          };
        }
      }

    } catch (error) {
      console.error(`Error resolving scenario variables for ${scenarioId}:`, error);
    }

    return resolved;
  }

  /**
   * Generate flags for the NLG output
   */
  generateFlags(): NLGFlag[] {
    const flags: NLGFlag[] = [];

    // Pricing Flag
    flags.push({
      component: "PricingService",
      reason: "Regional pricing data does not exist. Requires: pricingData MongoDB collection with price ranges per treatment per region.",
      affectedVariables: ["PRICE_MIN", "PRICE_MAX", "FACTOR_1", "FACTOR_2", "FACTOR_3"],
      workaround: "FACTOR_* use generic fallbacks; PRICE_MIN/MAX show flagged placeholder"
    });

    // Question Bank Flag
    flags.push({
      component: "QuestionBankService",
      reason: "Question bank for dynamic next-steps questions not implemented. Requires: questionBank MongoDB collection with context-appropriate questions.",
      affectedVariables: ["QUESTION_1", "QUESTION_2", "QUESTION_3"],
      workaround: "Generic fallback questions are used"
    });

    return flags;
  }

  /**
   * Get implementation summary
   */
  getImplementationSummary(): {
    implemented: string[];
    partial: string[];
    flagged: string[];
  } {
    return {
      implemented: [
        "DISCLAIMER_TEXT (static content)",
        "OPTIONAL_*_TAG_BLOCK (6 variables - uses existing ContentSelector)",
        "OPTION_N_NAME, OPTION_N_SHORT_DESCRIPTION, OPTION_N_INDICATION (scenario treatment options)",
        "OPTION_N_COMPLEXITY, OPTION_N_ADVANTAGES, OPTION_N_DISADVANTAGES (scenario treatment options)",
        "RESULT_DESCRIPTION, COMFORT_EXPERIENCE, AESTHETIC_RESULT (primary treatment option)",
        "PHASE_1, PHASE_2, PHASE_3 (primary treatment option phases)",
        "TREATMENT_DURATION, RECOVERY_DURATION, RECOVERY_DISCOMFORT (primary treatment option)",
        "RECOMMENDED_DIRECTION, SELECTED_OPTION, TAG_NUANCE_DIRECTION (scenario NLG variables)",
        "SITUATION_SPECIFIC_CONSIDERATIONS (scenario NLG variables)",
        "OPTIONAL_ADDITIONAL_OPTIONS, OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS (scenario NLG variables)",
        "PRICE_MIN, PRICE_MAX (scenario aggregate pricing)"
      ],
      partial: [
        "AGE_CATEGORY, MAIN_CONCERN, SHORT_SITUATION_DESCRIPTION (driver mappings)",
        "DECISION_STAGE_DESCRIPTION, SITUATION_BASE, SITUATION_RELEVANCE (driver mappings)",
        "PRIORITY_CONTEXT, DURATION_VARIATION_FACTOR, PROGRESSION_FOCUS (driver mappings)",
        "GENERAL_RISK, RECOVERY_DISCOMFORT, ALARM_SIGNAL (generic fallbacks)",
        "FACTOR_1, FACTOR_2, FACTOR_3 (generic fallbacks)",
        "QUESTION_1, QUESTION_2, QUESTION_3 (generic fallbacks)"
      ],
      flagged: []
    };
  }
}

export const variableCalculator = new VariableCalculator();
