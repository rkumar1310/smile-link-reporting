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
 * Placeholder values for flagged (not implemented) variables
 * These clearly indicate what's missing
 */
const FLAGGED_PLACEHOLDERS: Record<string, { en: string; nl: string }> = {
  // Treatment Options (FLAGGED)
  OPTION_1_NAME: {
    en: "[FLAGGED: Treatment option data not available - requires treatmentOptions collection]",
    nl: "[FLAGGED: Behandeloptie gegevens niet beschikbaar - vereist treatmentOptions collectie]"
  },
  OPTION_1_SHORT_DESCRIPTION: { en: "", nl: "" },
  OPTION_1_INDICATION: { en: "", nl: "" },
  OPTION_1_COMPLEXITY: { en: "", nl: "" },
  OPTION_1_ADVANTAGES: { en: "", nl: "" },
  OPTION_1_DISADVANTAGES: { en: "", nl: "" },
  OPTION_2_NAME: {
    en: "[FLAGGED: Treatment option data not available - requires treatmentOptions collection]",
    nl: "[FLAGGED: Behandeloptie gegevens niet beschikbaar - vereist treatmentOptions collectie]"
  },
  OPTION_2_SHORT_DESCRIPTION: { en: "", nl: "" },
  OPTION_2_INDICATION: { en: "", nl: "" },
  OPTION_2_COMPLEXITY: { en: "", nl: "" },
  OPTION_2_ADVANTAGES: { en: "", nl: "" },
  OPTION_2_DISADVANTAGES: { en: "", nl: "" },
  OPTIONAL_ADDITIONAL_OPTIONS: { en: "", nl: "" },
  OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS: { en: "", nl: "" },

  // Recommendation (FLAGGED)
  RECOMMENDED_DIRECTION: {
    en: "[FLAGGED: Recommendation engine not implemented - requires priority matrix]",
    nl: "[FLAGGED: Aanbevelingsengine niet geïmplementeerd - vereist prioriteitsmatrix]"
  },
  TAG_NUANCE_DIRECTION: { en: "", nl: "" },
  SELECTED_OPTION: {
    en: "[FLAGGED: Treatment selection not implemented]",
    nl: "[FLAGGED: Behandelselectie niet geïmplementeerd]"
  },

  // Results (FLAGGED)
  RESULT_DESCRIPTION: { en: "", nl: "" },
  COMFORT_EXPERIENCE: { en: "", nl: "" },
  AESTHETIC_RESULT: { en: "", nl: "" },

  // Duration (FLAGGED)
  TREATMENT_DURATION: {
    en: "[FLAGGED: Duration data not available - requires treatmentOptions collection]",
    nl: "[FLAGGED: Duurgegevens niet beschikbaar - vereist treatmentOptions collectie]"
  },
  PHASE_1: { en: "", nl: "" },
  PHASE_2: { en: "", nl: "" },
  PHASE_3: { en: "", nl: "" },

  // Risks (FLAGGED - partial)
  GENERAL_RISK: {
    en: "temporary discomfort, swelling, and individual healing variations",
    nl: "tijdelijk ongemak, zwelling en individuele genezingsvariaties"
  },
  SITUATION_SPECIFIC_CONSIDERATIONS: { en: "", nl: "" },

  // Pricing (FLAGGED)
  PRICE_MIN: {
    en: "[FLAGGED: Pricing data not available - requires pricingData collection]",
    nl: "[FLAGGED: Prijsgegevens niet beschikbaar - vereist pricingData collectie]"
  },
  PRICE_MAX: {
    en: "[FLAGGED: Pricing data not available]",
    nl: "[FLAGGED: Prijsgegevens niet beschikbaar]"
  },
  FACTOR_1: { en: "complexity of your individual case", nl: "complexiteit van uw individuele geval" },
  FACTOR_2: { en: "materials and techniques used", nl: "gebruikte materialen en technieken" },
  FACTOR_3: { en: "regional pricing variations", nl: "regionale prijsvariaties" },

  // Recovery (FLAGGED - partial)
  RECOVERY_DURATION: {
    en: "[FLAGGED: Recovery data not available - requires treatmentOptions collection]",
    nl: "[FLAGGED: Herstelgegevens niet beschikbaar - vereist treatmentOptions collectie]"
  },
  RECOVERY_DISCOMFORT: {
    en: "mild swelling and sensitivity that typically resolves within a few days",
    nl: "milde zwelling en gevoeligheid die meestal binnen enkele dagen verdwijnt"
  },
  ALARM_SIGNAL: {
    en: "severe pain, persistent bleeding, high fever, or signs of infection",
    nl: "ernstige pijn, aanhoudende bloeding, hoge koorts of tekenen van infectie"
  },

  // Questions (FLAGGED)
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

      // Map duration from first treatment option (as primary)
      const primaryOption = scenario.treatment_options[0];
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

    // Treatment Options Flag
    flags.push({
      component: "TreatmentOptionService",
      reason: "Treatment option structured data (names, descriptions, pros/cons, phases) does not exist. Requires: treatmentOptions MongoDB collection with ~12 treatment records.",
      affectedVariables: [
        "OPTION_1_NAME", "OPTION_1_SHORT_DESCRIPTION", "OPTION_1_INDICATION",
        "OPTION_1_COMPLEXITY", "OPTION_1_ADVANTAGES", "OPTION_1_DISADVANTAGES",
        "OPTION_2_NAME", "OPTION_2_SHORT_DESCRIPTION", "OPTION_2_INDICATION",
        "OPTION_2_COMPLEXITY", "OPTION_2_ADVANTAGES", "OPTION_2_DISADVANTAGES",
        "OPTIONAL_ADDITIONAL_OPTIONS", "OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS",
        "RESULT_DESCRIPTION", "COMFORT_EXPERIENCE", "AESTHETIC_RESULT",
        "TREATMENT_DURATION", "PHASE_1", "PHASE_2", "PHASE_3",
        "GENERAL_RISK", "RECOVERY_DURATION", "RECOVERY_DISCOMFORT", "ALARM_SIGNAL"
      ],
      workaround: "Variables show placeholder text indicating missing data"
    });

    // Recommendation Engine Flag
    flags.push({
      component: "RecommendationEngine",
      reason: "Treatment recommendation logic (priority matrix, option ranking) not implemented. Requires: driver-to-treatment priority rules + recommendation algorithm.",
      affectedVariables: [
        "RECOMMENDED_DIRECTION", "TAG_NUANCE_DIRECTION", "SELECTED_OPTION",
        "SITUATION_SPECIFIC_CONSIDERATIONS"
      ],
      workaround: "Variables show placeholder text indicating missing logic"
    });

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
        "OPTIONAL_*_TAG_BLOCK (6 variables - uses existing ContentSelector)"
      ],
      partial: [
        "AGE_CATEGORY, MAIN_CONCERN, SHORT_SITUATION_DESCRIPTION (driver mappings)",
        "DECISION_STAGE_DESCRIPTION, SITUATION_BASE, SITUATION_RELEVANCE (driver mappings)",
        "PRIORITY_CONTEXT, DURATION_VARIATION_FACTOR, PROGRESSION_FOCUS (driver mappings)",
        "GENERAL_RISK, RECOVERY_DISCOMFORT, ALARM_SIGNAL (generic fallbacks)",
        "FACTOR_1, FACTOR_2, FACTOR_3 (generic fallbacks)",
        "QUESTION_1, QUESTION_2, QUESTION_3 (generic fallbacks)"
      ],
      flagged: [
        "OPTION_1_*, OPTION_2_* (12 vars - needs treatmentOptions collection)",
        "RECOMMENDED_DIRECTION, SELECTED_OPTION (needs recommendation engine)",
        "RESULT_DESCRIPTION, COMFORT_EXPERIENCE, AESTHETIC_RESULT (needs treatment data)",
        "TREATMENT_DURATION, PHASE_1-3 (needs treatment data)",
        "PRICE_MIN, PRICE_MAX (needs pricingData collection)"
      ]
    };
  }
}

export const variableCalculator = new VariableCalculator();
