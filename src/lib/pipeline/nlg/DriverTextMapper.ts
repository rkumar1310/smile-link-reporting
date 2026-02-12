/**
 * Driver Text Mapper
 * Maps driver values to human-readable text for NLG template variables
 */

import type { DriverId, DriverState, SupportedLanguage } from "../types";
import type { NLGVariable, ResolvedVariable } from "./types";

// =============================================================================
// DRIVER TEXT MAPPINGS
// =============================================================================

type TextMapping = { en: string; nl: string };

/**
 * Maps driver values to template text
 * Structure: driver -> value -> variable -> text
 */
const DRIVER_TEXT_MAPPINGS: Record<
  DriverId,
  Record<string, Partial<Record<NLGVariable, TextMapping>>>
> = {
  // ==========================================================================
  // AGE_STAGE -> AGE_CATEGORY
  // ==========================================================================
  age_stage: {
    growing: {
      AGE_CATEGORY: {
        en: "a young person with ongoing jaw development",
        nl: "een jong persoon met doorlopende kaakgroei"
      }
    },
    young_adult: {
      AGE_CATEGORY: {
        en: "a young adult",
        nl: "een jonge volwassene"
      }
    },
    adult: {
      AGE_CATEGORY: {
        en: "an adult",
        nl: "een volwassene"
      }
    },
    senior: {
      AGE_CATEGORY: {
        en: "someone in a later life stage",
        nl: "iemand in een latere levensfase"
      }
    }
  },

  // ==========================================================================
  // PROFILE_TYPE -> MAIN_CONCERN
  // ==========================================================================
  profile_type: {
    aesthetic: {
      MAIN_CONCERN: {
        en: "aesthetic improvement of your smile",
        nl: "esthetische verbetering van uw glimlach"
      }
    },
    functional: {
      MAIN_CONCERN: {
        en: "restoring proper function and comfort",
        nl: "het herstellen van goede functie en comfort"
      }
    },
    mixed: {
      MAIN_CONCERN: {
        en: "both functional restoration and aesthetic improvement",
        nl: "zowel functioneel herstel als esthetische verbetering"
      }
    },
    comfort: {
      MAIN_CONCERN: {
        en: "comfort and ease of use",
        nl: "comfort en gebruiksgemak"
      }
    }
  },

  // ==========================================================================
  // MOUTH_SITUATION -> SHORT_SITUATION_DESCRIPTION, SITUATION_BASE
  // ==========================================================================
  mouth_situation: {
    no_missing_teeth: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "aesthetic concerns with your existing teeth",
        nl: "esthetische zorgen over uw bestaande tanden"
      },
      SITUATION_BASE: {
        en: "you have all your teeth present but are seeking improvement",
        nl: "u heeft al uw tanden maar zoekt verbetering"
      }
    },
    single_missing_tooth: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "a single missing tooth",
        nl: "een enkele ontbrekende tand"
      },
      SITUATION_BASE: {
        en: "you are missing one tooth",
        nl: "u mist één tand"
      }
    },
    multiple_adjacent: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "multiple adjacent missing teeth",
        nl: "meerdere aangrenzende ontbrekende tanden"
      },
      SITUATION_BASE: {
        en: "you have multiple teeth missing in a row",
        nl: "u mist meerdere tanden op een rij"
      }
    },
    multiple_dispersed: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "multiple missing teeth in different areas",
        nl: "meerdere ontbrekende tanden op verschillende plaatsen"
      },
      SITUATION_BASE: {
        en: "you have multiple teeth missing in different locations",
        nl: "u mist meerdere tanden op verschillende locaties"
      }
    },
    mixed_pattern: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "a complex pattern of missing teeth",
        nl: "een complex patroon van ontbrekende tanden"
      },
      SITUATION_BASE: {
        en: "you have a mixed pattern of tooth loss",
        nl: "u heeft een gemengd patroon van tandverlies"
      }
    },
    extensive_missing: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "extensive tooth loss",
        nl: "uitgebreid tandverlies"
      },
      SITUATION_BASE: {
        en: "you are dealing with significant tooth loss",
        nl: "u heeft te maken met aanzienlijk tandverlies"
      }
    },
    full_mouth_compromised: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "full mouth rehabilitation needs",
        nl: "volledige mondrehabilitatie behoeften"
      },
      SITUATION_BASE: {
        en: "your situation involves comprehensive oral rehabilitation",
        nl: "uw situatie omvat uitgebreide mondrehabilitatie"
      }
    },
    complex: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "a complex dental situation",
        nl: "een complexe tandheelkundige situatie"
      },
      SITUATION_BASE: {
        en: "your dental situation requires careful assessment",
        nl: "uw tandheelkundige situatie vereist zorgvuldige beoordeling"
      }
    }
  },

  // ==========================================================================
  // DECISION_STAGE -> DECISION_STAGE_DESCRIPTION
  // ==========================================================================
  decision_stage: {
    exploring: {
      DECISION_STAGE_DESCRIPTION: {
        en: "you are exploring your options and gathering information",
        nl: "u uw opties verkent en informatie verzamelt"
      }
    },
    comparing: {
      DECISION_STAGE_DESCRIPTION: {
        en: "you are comparing different treatment approaches",
        nl: "u verschillende behandelmethoden vergelijkt"
      }
    },
    ready: {
      DECISION_STAGE_DESCRIPTION: {
        en: "you are ready to move forward with treatment",
        nl: "u klaar bent om door te gaan met behandeling"
      }
    }
  },

  // ==========================================================================
  // CLINICAL_PRIORITY + MOUTH_SITUATION -> SITUATION_RELEVANCE
  // ==========================================================================
  clinical_priority: {
    urgent: {
      SITUATION_RELEVANCE: {
        en: "addressing your symptoms should be prioritized before considering elective treatments",
        nl: "het aanpakken van uw symptomen prioriteit moet krijgen voordat electieve behandelingen worden overwogen"
      }
    },
    semi_urgent: {
      SITUATION_RELEVANCE: {
        en: "timely professional evaluation is recommended",
        nl: "tijdige professionele evaluatie wordt aanbevolen"
      }
    },
    elective: {
      SITUATION_RELEVANCE: {
        en: "you have time to carefully consider your options",
        nl: "u heeft tijd om uw opties zorgvuldig te overwegen"
      }
    }
  },

  // ==========================================================================
  // TREATMENT_VIABILITY -> SITUATION_RELEVANCE (combined context)
  // ==========================================================================
  treatment_viability: {
    single_site: {
      SITUATION_RELEVANCE: {
        en: "treatment can typically be focused on a single area",
        nl: "de behandeling kan meestal gericht zijn op één gebied"
      }
    },
    multiple_site: {
      SITUATION_RELEVANCE: {
        en: "a coordinated approach across multiple areas may be beneficial",
        nl: "een gecoördineerde aanpak over meerdere gebieden kan gunstig zijn"
      }
    },
    full_mouth: {
      SITUATION_RELEVANCE: {
        en: "a comprehensive treatment plan would address your overall needs",
        nl: "een uitgebreid behandelplan zou uw algehele behoeften aanpakken"
      }
    },
    conditional: {
      SITUATION_RELEVANCE: {
        en: "treatment options depend on further professional assessment",
        nl: "behandelopties zijn afhankelijk van verdere professionele beoordeling"
      }
    }
  },

  // ==========================================================================
  // PROFILE_TYPE -> PRIORITY_CONTEXT
  // ==========================================================================
  // (Reusing profile_type for PRIORITY_CONTEXT)

  // ==========================================================================
  // TIME_HORIZON -> DURATION_VARIATION_FACTOR
  // ==========================================================================
  time_horizon: {
    immediate: {
      DURATION_VARIATION_FACTOR: {
        en: "your desired timeline and healing capacity",
        nl: "uw gewenste tijdlijn en genezingscapaciteit"
      }
    },
    short_term: {
      DURATION_VARIATION_FACTOR: {
        en: "individual healing response and treatment complexity",
        nl: "individuele genezingsreactie en behandelcomplexiteit"
      }
    },
    long_term: {
      DURATION_VARIATION_FACTOR: {
        en: "the staged approach and your body's natural healing process",
        nl: "de gefaseerde aanpak en het natuurlijke genezingsproces van uw lichaam"
      }
    },
    undefined: {
      DURATION_VARIATION_FACTOR: {
        en: "various individual factors that your dentist will discuss with you",
        nl: "verschillende individuele factoren die uw tandarts met u zal bespreken"
      }
    }
  },

  // ==========================================================================
  // DECISION_STAGE + AUTONOMY_LEVEL -> PROGRESSION_FOCUS
  // ==========================================================================
  autonomy_level: {
    guided: {
      PROGRESSION_FOCUS: {
        en: "schedule a consultation to discuss your specific needs with a specialist",
        nl: "een consult plannen om uw specifieke behoeften met een specialist te bespreken"
      }
    },
    collaborative: {
      PROGRESSION_FOCUS: {
        en: "gather more information and prepare questions for your dental consultation",
        nl: "meer informatie verzamelen en vragen voorbereiden voor uw tandheelkundig consult"
      }
    },
    autonomous: {
      PROGRESSION_FOCUS: {
        en: "take your time to research options and decide when you're ready to proceed",
        nl: "de tijd nemen om opties te onderzoeken en beslissen wanneer u klaar bent om door te gaan"
      }
    }
  },

  // ==========================================================================
  // Other drivers - placeholders for completeness
  // ==========================================================================
  biological_stability: {},
  medical_constraints: {},
  risk_profile_biological: {},
  aesthetic_tolerance: {},
  expectation_risk: {},
  experience_history: {},
  anxiety_level: {},
  information_depth: {},
  budget_type: {},
  treatment_philosophy: {}
};

// =============================================================================
// PRIORITY CONTEXT MAPPINGS (derived from profile_type)
// =============================================================================

const PRIORITY_CONTEXT_MAPPINGS: Record<string, TextMapping> = {
  aesthetic: {
    en: "achieving an improved appearance",
    nl: "het bereiken van een verbeterd uiterlijk"
  },
  functional: {
    en: "restoring comfortable function",
    nl: "het herstellen van comfortabele functie"
  },
  mixed: {
    en: "balancing both function and appearance",
    nl: "het balanceren van zowel functie als uiterlijk"
  },
  comfort: {
    en: "maximizing daily comfort",
    nl: "het maximaliseren van dagelijks comfort"
  }
};

// =============================================================================
// DRIVER TEXT MAPPER CLASS
// =============================================================================

export class DriverTextMapper {
  /**
   * Resolve a single variable from driver state
   */
  resolveVariable(
    variable: NLGVariable,
    driverState: DriverState,
    language: SupportedLanguage
  ): ResolvedVariable | null {
    // Special handling for PRIORITY_CONTEXT
    if (variable === "PRIORITY_CONTEXT") {
      return this.resolvePriorityContext(driverState, language);
    }

    // Search through all driver mappings
    for (const [driverId, valueMap] of Object.entries(DRIVER_TEXT_MAPPINGS)) {
      const driverValue = driverState.drivers[driverId as DriverId];
      if (!driverValue) continue;

      const variableMap = valueMap[driverValue.value];
      if (!variableMap) continue;

      const textMapping = variableMap[variable];
      if (textMapping) {
        return {
          variable,
          value: textMapping[language],
          status: "resolved",
          source: `driver:${driverId}:${driverValue.value}`
        };
      }
    }

    return null;
  }

  /**
   * Resolve PRIORITY_CONTEXT from profile_type driver
   */
  private resolvePriorityContext(
    driverState: DriverState,
    language: SupportedLanguage
  ): ResolvedVariable | null {
    const profileType = driverState.drivers.profile_type;
    if (!profileType) return null;

    const mapping = PRIORITY_CONTEXT_MAPPINGS[profileType.value];
    if (!mapping) return null;

    return {
      variable: "PRIORITY_CONTEXT",
      value: mapping[language],
      status: "resolved",
      source: `driver:profile_type:${profileType.value}`
    };
  }

  /**
   * Resolve all driver-based variables
   */
  resolveAll(
    driverState: DriverState,
    language: SupportedLanguage
  ): Map<NLGVariable, ResolvedVariable> {
    const results = new Map<NLGVariable, ResolvedVariable>();

    // Variables that can be resolved from drivers
    const driverVariables: NLGVariable[] = [
      "AGE_CATEGORY",
      "MAIN_CONCERN",
      "SHORT_SITUATION_DESCRIPTION",
      "DECISION_STAGE_DESCRIPTION",
      "SITUATION_BASE",
      "SITUATION_RELEVANCE",
      "PRIORITY_CONTEXT",
      "DURATION_VARIATION_FACTOR",
      "PROGRESSION_FOCUS"
    ];

    for (const variable of driverVariables) {
      const resolved = this.resolveVariable(variable, driverState, language);
      if (resolved) {
        results.set(variable, resolved);
      }
    }

    return results;
  }

  /**
   * Get fallback text for a variable
   */
  getFallback(variable: NLGVariable, language: SupportedLanguage): string {
    const fallbacks: Record<NLGVariable, TextMapping> = {
      AGE_CATEGORY: { en: "a patient", nl: "een patiënt" },
      MAIN_CONCERN: { en: "dental improvement", nl: "tandheelkundige verbetering" },
      SHORT_SITUATION_DESCRIPTION: { en: "your dental concerns", nl: "uw tandheelkundige zorgen" },
      DECISION_STAGE_DESCRIPTION: { en: "you are considering your options", nl: "u uw opties overweegt" },
      SITUATION_BASE: { en: "you are seeking dental treatment", nl: "u tandheelkundige behandeling zoekt" },
      SITUATION_RELEVANCE: { en: "professional assessment can help determine the best approach", nl: "professionele beoordeling kan helpen de beste aanpak te bepalen" },
      PRIORITY_CONTEXT: { en: "your dental health goals", nl: "uw tandheelkundige gezondheidsdoelen" },
      DURATION_VARIATION_FACTOR: { en: "individual factors", nl: "individuele factoren" },
      PROGRESSION_FOCUS: { en: "consult with a dental professional", nl: "overleg met een tandheelkundige professional" },
      // Placeholders for non-driver variables
      DISCLAIMER_TEXT: { en: "", nl: "" },
      OPTIONAL_SITUATION_TAG_BLOCK: { en: "", nl: "" },
      OPTION_1_NAME: { en: "[Treatment option data required]", nl: "[Behandeloptie gegevens vereist]" },
      OPTION_1_SHORT_DESCRIPTION: { en: "", nl: "" },
      OPTION_1_INDICATION: { en: "", nl: "" },
      OPTION_1_COMPLEXITY: { en: "", nl: "" },
      OPTION_1_ADVANTAGES: { en: "", nl: "" },
      OPTION_1_DISADVANTAGES: { en: "", nl: "" },
      OPTION_2_NAME: { en: "[Treatment option data required]", nl: "[Behandeloptie gegevens vereist]" },
      OPTION_2_SHORT_DESCRIPTION: { en: "", nl: "" },
      OPTION_2_INDICATION: { en: "", nl: "" },
      OPTION_2_COMPLEXITY: { en: "", nl: "" },
      OPTION_2_ADVANTAGES: { en: "", nl: "" },
      OPTION_2_DISADVANTAGES: { en: "", nl: "" },
      OPTIONAL_ADDITIONAL_OPTIONS: { en: "", nl: "" },
      OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS: { en: "", nl: "" },
      RECOMMENDED_DIRECTION: { en: "[Recommendation engine required]", nl: "[Aanbevelingsengine vereist]" },
      TAG_NUANCE_DIRECTION: { en: "", nl: "" },
      SELECTED_OPTION: { en: "[Treatment selection required]", nl: "[Behandelselectie vereist]" },
      RESULT_DESCRIPTION: { en: "", nl: "" },
      COMFORT_EXPERIENCE: { en: "", nl: "" },
      AESTHETIC_RESULT: { en: "", nl: "" },
      OPTIONAL_RESULT_TAG_BLOCK: { en: "", nl: "" },
      TREATMENT_DURATION: { en: "[Duration data required]", nl: "[Duurgegevens vereist]" },
      PHASE_1: { en: "", nl: "" },
      PHASE_2: { en: "", nl: "" },
      PHASE_3: { en: "", nl: "" },
      OPTIONAL_DURATION_TAG_BLOCK: { en: "", nl: "" },
      GENERAL_RISK: { en: "temporary discomfort, infection risk, and individual healing variations", nl: "tijdelijk ongemak, infectierisico en individuele genezingsvariaties" },
      SITUATION_SPECIFIC_CONSIDERATIONS: { en: "", nl: "" },
      PRICE_MIN: { en: "[Pricing data required]", nl: "[Prijsgegevens vereist]" },
      PRICE_MAX: { en: "[Pricing data required]", nl: "[Prijsgegevens vereist]" },
      FACTOR_1: { en: "complexity of your case", nl: "complexiteit van uw geval" },
      FACTOR_2: { en: "materials chosen", nl: "gekozen materialen" },
      FACTOR_3: { en: "regional pricing differences", nl: "regionale prijsverschillen" },
      OPTIONAL_PRICE_TAG_BLOCK: { en: "", nl: "" },
      RECOVERY_DURATION: { en: "[Recovery data required]", nl: "[Herstelgegevens vereist]" },
      RECOVERY_DISCOMFORT: { en: "mild swelling and sensitivity", nl: "milde zwelling en gevoeligheid" },
      ALARM_SIGNAL: { en: "severe pain, persistent bleeding, or signs of infection", nl: "ernstige pijn, aanhoudende bloeding of tekenen van infectie" },
      OPTIONAL_RECOVERY_TAG_BLOCK: { en: "", nl: "" },
      QUESTION_1: { en: "What are the specific options for my situation?", nl: "Wat zijn de specifieke opties voor mijn situatie?" },
      QUESTION_2: { en: "What is the expected timeline and recovery?", nl: "Wat is de verwachte tijdlijn en herstelperiode?" },
      QUESTION_3: { en: "What are the costs and payment options?", nl: "Wat zijn de kosten en betalingsopties?" },
      OPTIONAL_NEXT_STEPS_TAG_BLOCK: { en: "", nl: "" }
    };

    return fallbacks[variable]?.[language] ?? "";
  }

  /**
   * Get list of variables this mapper can handle
   */
  getHandledVariables(): NLGVariable[] {
    return [
      "AGE_CATEGORY",
      "MAIN_CONCERN",
      "SHORT_SITUATION_DESCRIPTION",
      "DECISION_STAGE_DESCRIPTION",
      "SITUATION_BASE",
      "SITUATION_RELEVANCE",
      "PRIORITY_CONTEXT",
      "DURATION_VARIATION_FACTOR",
      "PROGRESSION_FOCUS"
    ];
  }
}

export const driverTextMapper = new DriverTextMapper();
