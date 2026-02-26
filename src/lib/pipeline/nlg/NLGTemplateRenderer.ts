/**
 * NLG Template Renderer
 * Loads templates and substitutes variables.
 *
 * New structure (blocks 0-8):
 * - Blocks 0-3: Template text with scenario sentence fragments + dynamic options
 * - Block 1 includes {CONTEXT_MODULES_BLOCK} for injected text modules
 * - Block 3 uses {OPTIONS_BLOCK} rendered dynamically from block_3_options array
 * - Blocks 4-7: Single variable per block (full paragraph from scenario)
 * - Block 8: Fully fixed text (no variables)
 */

import type { SupportedLanguage } from "../types";
import type {
  NLGVariable,
  NLGInput,
  NLGOutput,
  NLGWarning,
  VariableResolutionResult
} from "./types";
import { variableCalculator } from "./VariableCalculator";

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

/**
 * English NLG Template — based on target_nlg.md
 */
const NLG_TEMPLATE_EN = `## Personal Summary

Based on the information you have provided, you are currently in a situation where {CONTEXT_DESCRIPTION} is relevant to your smile and oral condition.

You indicate that {PRIMARY_GOAL} is particularly important to you when considering possible treatment directions.

At the same time, you are taking {MAIN_CONSTRAINT} into account, which may influence how you evaluate different options.

This report helps you review your situation and possible directions in a structured way, without making a choice on your behalf.

---

## Your Situation

Your current situation is characterized by {CORE_SITUATION_DESCRIPTION}. This may influence both the functional and aesthetic aspects of your smile.

Your answers also indicate that {NUANCE_FACTOR} plays an additional role.

In addition, {SECONDARY_FACTOR} may further shape how treatment options are considered.

{CONTEXT_MODULES_BLOCK}

A careful assessment of your starting situation typically forms the basis for further decision-making.

---

## Treatment Directions

Within your profile, multiple treatment directions may be considered.

- A direction in which {DIRECTION_1_CORE}.
- An approach that focuses on {DIRECTION_2_CORE}.
- A possibility in which {DIRECTION_3_CORE}.

Which direction may be appropriate depends on your personal priorities and the clinical assessment of a practitioner.

---

## Option Overview

{OPTIONS_BLOCK}

---

## Expected Results

{EXPECTED_RESULTS_BLOCK}

---

## Duration

{DURATION_BLOCK}

---

## Recovery

{RECOVERY_BLOCK}

---

## Cost

{COST_BLOCK}

---

## Next Steps

You may use this report as a structured guide for further conversations or reflection.

- Consider which aspects weigh most heavily for you.
- Note any questions you would like to explore further.
- Reflect on timing and practical feasibility.

Final decisions are always made in consultation with a qualified healthcare professional.`;

/**
 * Dutch NLG Template
 */
const NLG_TEMPLATE_NL = `## Persoonlijke Samenvatting

Op basis van de informatie die u heeft ingevuld, bevindt u zich in een situatie waarin {CONTEXT_DESCRIPTION} relevant is voor uw glimlach en mondsituatie.

U geeft aan dat voor u vooral {PRIMARY_GOAL} belangrijk is bij het overwegen van mogelijke behandelrichtingen.

Tegelijk houdt u rekening met {MAIN_CONSTRAINT}, wat invloed kan hebben op hoe u opties beoordeelt.

Dit rapport helpt u om uw situatie en mogelijke richtingen gestructureerd te bekijken, zonder een keuze voor u te maken.

---

## Uw Situatie

Uw huidige situatie wordt gekenmerkt door {CORE_SITUATION_DESCRIPTION}. Dit kan invloed hebben op zowel de functionele als esthetische aspecten van uw glimlach.

In uw antwoorden komt ook naar voren dat {NUANCE_FACTOR} een bijkomende rol speelt.

Daarnaast kan {SECONDARY_FACTOR} mee bepalen hoe behandelopties worden overwogen.

{CONTEXT_MODULES_BLOCK}

Een zorgvuldige beoordeling van uw uitgangssituatie vormt doorgaans het startpunt van verdere besluitvorming.

---

## Behandelrichtingen

Binnen uw profiel kunnen meerdere behandelrichtingen in overweging worden genomen.

- Een richting waarbij {DIRECTION_1_CORE}.
- Een benadering die zich richt op {DIRECTION_2_CORE}.
- Een mogelijkheid waarbij {DIRECTION_3_CORE}.

Welke richting passend is, hangt af van uw persoonlijke prioriteiten en de klinische beoordeling door een behandelaar.

---

## Optieoverzicht

{OPTIONS_BLOCK}

---

## Verwachte Resultaten

{EXPECTED_RESULTS_BLOCK}

---

## Duur

{DURATION_BLOCK}

---

## Herstel

{RECOVERY_BLOCK}

---

## Kosten

{COST_BLOCK}

---

## Volgende Stappen

U kan dit rapport gebruiken als gestructureerde leidraad bij verdere gesprekken of reflectie.

- Overweeg welke aspecten voor u het zwaarst doorwegen.
- Noteer vragen die u graag verder verduidelijkt ziet.
- Denk na over timing en praktische haalbaarheid.

Definitieve beslissingen worden steeds genomen in overleg met een gekwalificeerde zorgverlener.`;

// =============================================================================
// TEMPLATE RENDERER CLASS
// =============================================================================

export class NLGTemplateRenderer {
  private templates: Record<SupportedLanguage, string> = {
    en: NLG_TEMPLATE_EN,
    nl: NLG_TEMPLATE_NL
  };

  /**
   * Render the NLG report
   */
  async render(input: NLGInput): Promise<NLGOutput> {
    const { sessionId, language } = input;
    const warnings: NLGWarning[] = [];

    // 1. Calculate all variables (including OPTIONS_BLOCK and CONTEXT_MODULES_BLOCK)
    const variableResolution = await variableCalculator.calculate(input);

    // 2. Get the template
    const template = this.templates[language];

    // 3. Substitute variables
    let renderedReport = template;
    const variablePattern = /\{([A-Z_0-9]+)\}/g;

    renderedReport = renderedReport.replace(variablePattern, (match, variableName) => {
      const resolved = variableResolution.variables[variableName as NLGVariable];

      if (!resolved) {
        warnings.push({
          code: "UNKNOWN_VARIABLE",
          message: `Unknown variable in template: ${variableName}`,
          variable: variableName as NLGVariable,
          severity: "warning"
        });
        return match;
      }

      if (resolved.status === "missing_data") {
        warnings.push({
          code: "MISSING_DATA",
          message: `Data not available for: ${variableName}`,
          variable: variableName as NLGVariable,
          severity: "warning"
        });
        return `{${variableName}}`;
      }

      if (resolved.status === "fallback" && resolved.fallbackUsed) {
        warnings.push({
          code: "FALLBACK_USED",
          message: `Using fallback for: ${variableName}`,
          variable: variableName as NLGVariable,
          severity: "info"
        });
      }

      return resolved.value;
    });

    // 4. Clean up
    renderedReport = this.cleanupReport(renderedReport);

    return {
      sessionId,
      language,
      scenarioId: input.scenarioId,
      renderedReport,
      variableResolution,
      warnings
    };
  }

  /**
   * Clean up the rendered report
   */
  private cleanupReport(report: string): string {
    let cleaned = report;

    // Remove empty list items
    cleaned = cleaned.replace(/^-\s*$/gm, "");

    // Remove lines that are just whitespace
    cleaned = cleaned.replace(/^\s+$/gm, "");

    // Collapse multiple blank lines
    cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");

    // Remove trailing whitespace on lines
    cleaned = cleaned.replace(/[ \t]+$/gm, "");

    return cleaned.trim();
  }

  /**
   * Get template for preview/debugging
   */
  getTemplate(language: SupportedLanguage): string {
    return this.templates[language];
  }

  /**
   * Get list of all variables in template
   */
  getTemplateVariables(language: SupportedLanguage): string[] {
    const template = this.templates[language];
    const variablePattern = /\{([A-Z_0-9]+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }
}

// Re-export for API compatibility (moved to optionBlockBuilder.ts to break circular import)
export { buildOptionsBlock } from "./optionBlockBuilder";

export const nlgTemplateRenderer = new NLGTemplateRenderer();
