/**
 * NLG Template Renderer
 * Loads templates and substitutes variables
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
 * English NLG Template
 * Based on target_nlg.md - deterministic, zero drift
 */
const NLG_TEMPLATE_EN = `{DISCLAIMER_TEXT}

---

## Your Personal Summary

Based on your answers ({AGE_CATEGORY}, {MAIN_CONCERN}), it appears that you are currently primarily dealing with {SHORT_SITUATION_DESCRIPTION}.

You are in a phase in which {DECISION_STAGE_DESCRIPTION}.

In this context, this report provides you with an overview of the possible options, what you can realistically expect, and which aspects in your situation deserve additional attention.

---

## Your Situation

Your answers indicate {SITUATION_BASE}.

This means that {SITUATION_RELEVANCE}.

{OPTIONAL_SITUATION_TAG_BLOCK}

From this situation, it is relevant to objectively review the possible treatment options side by side.

---

## Treatment Options

### Overview of Treatment Options

Below you will find a clear overview of the possible treatment options for your situation:

**{OPTION_1_NAME}**: {OPTION_1_SHORT_DESCRIPTION}
- Indication: {OPTION_1_INDICATION}
- Complexity: {OPTION_1_COMPLEXITY}

**{OPTION_2_NAME}**: {OPTION_2_SHORT_DESCRIPTION}
- Indication: {OPTION_2_INDICATION}
- Complexity: {OPTION_2_COMPLEXITY}

{OPTIONAL_ADDITIONAL_OPTIONS}

### Pros and Cons

**{OPTION_1_NAME}**
- Advantages: {OPTION_1_ADVANTAGES}
- Disadvantages: {OPTION_1_DISADVANTAGES}

**{OPTION_2_NAME}**
- Advantages: {OPTION_2_ADVANTAGES}
- Disadvantages: {OPTION_2_DISADVANTAGES}

{OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS}

---

## Recommended Direction

Based on your answers, {RECOMMENDED_DIRECTION} appears to be a logical direction to consider in your situation.

This direction aligns with what is currently important to you, namely {PRIORITY_CONTEXT}.

This is not medical advice, but a neutral clarification of which option is often considered appropriate in comparable situations.

{TAG_NUANCE_DIRECTION}

---

## Expected Results & Comfort

When choosing {SELECTED_OPTION}, the aim is generally to achieve {RESULT_DESCRIPTION}.

Many people experience {COMFORT_EXPERIENCE} after the treatment.

From an aesthetic perspective, you may expect that {AESTHETIC_RESULT}.

{OPTIONAL_RESULT_TAG_BLOCK}

---

## Treatment Duration

The average treatment duration for {SELECTED_OPTION} is approximately {TREATMENT_DURATION}.

This process usually consists of the following steps:
1. {PHASE_1}
2. {PHASE_2}
3. {PHASE_3}

The exact timeline depends, among other factors, on {DURATION_VARIATION_FACTOR}.

{OPTIONAL_DURATION_TAG_BLOCK}

---

## Risks & Points of Attention

Every dental treatment involves general risks, such as {GENERAL_RISK}.

In your situation, the following aspects are important to take into account:
{SITUATION_SPECIFIC_CONSIDERATIONS}

This information is provided solely to support your decision-making process.

---

## Costs & Price Factors

### Cost Estimate

The cost of {SELECTED_OPTION} may vary depending on individual factors.

In your region, the typical cost range usually falls between {PRICE_MIN} and {PRICE_MAX}.

This is an indicative estimate and not a formal price quotation.

### Price Factors

The final cost may vary due to:
- {FACTOR_1}
- {FACTOR_2}
- {FACTOR_3}

{OPTIONAL_PRICE_TAG_BLOCK}

---

## Recovery & Practical Instructions

Recovery after {SELECTED_OPTION} usually takes {RECOVERY_DURATION}.

Possible discomfort may include {RECOVERY_DISCOMFORT}.

You should seek professional assistance if you experience {ALARM_SIGNAL}.

{OPTIONAL_RECOVERY_TAG_BLOCK}

---

## Next Steps

You now have a clear overview of your situation, the possible options, and what you can expect.

For someone in your current phase, it is particularly important to {PROGRESSION_FOCUS}.

If you would like more in-depth guidance, you can consult our decision guides. There, you will discover how to save time and money, avoid common mistakes, and recognize realistic and predictable outcomes.

When preparing for a follow-up consultation, you may wish to consider the following questions:
- {QUESTION_1}
- {QUESTION_2}
- {QUESTION_3}

{OPTIONAL_NEXT_STEPS_TAG_BLOCK}

You do not need to make a final decision today; this overview is intended to help you reflect in a more informed and prepared way.`;

/**
 * Dutch NLG Template
 */
const NLG_TEMPLATE_NL = `{DISCLAIMER_TEXT}

---

## Uw Persoonlijke Samenvatting

Op basis van uw antwoorden ({AGE_CATEGORY}, {MAIN_CONCERN}) blijkt dat u momenteel vooral te maken hebt met {SHORT_SITUATION_DESCRIPTION}.

U bevindt zich in een fase waarin {DECISION_STAGE_DESCRIPTION}.

In dat kader geeft dit rapport u een overzicht van de mogelijke opties, wat u realistisch kunt verwachten en welke aspecten in uw situatie extra aandacht verdienen.

---

## Uw Situatie

Uw antwoorden wijzen op {SITUATION_BASE}.

Dit betekent dat {SITUATION_RELEVANCE}.

{OPTIONAL_SITUATION_TAG_BLOCK}

Vanuit deze situatie is het relevant om de mogelijke behandelopties objectief naast elkaar te bekijken.

---

## Behandelopties

### Overzicht Behandelingsopties

Hieronder vindt u een duidelijk overzicht van de mogelijke behandelingsopties voor uw situatie:

**{OPTION_1_NAME}**: {OPTION_1_SHORT_DESCRIPTION}
- Indicatie: {OPTION_1_INDICATION}
- Complexiteit: {OPTION_1_COMPLEXITY}

**{OPTION_2_NAME}**: {OPTION_2_SHORT_DESCRIPTION}
- Indicatie: {OPTION_2_INDICATION}
- Complexiteit: {OPTION_2_COMPLEXITY}

{OPTIONAL_ADDITIONAL_OPTIONS}

### Voor- en Nadelen

**{OPTION_1_NAME}**
- Voordelen: {OPTION_1_ADVANTAGES}
- Nadelen: {OPTION_1_DISADVANTAGES}

**{OPTION_2_NAME}**
- Voordelen: {OPTION_2_ADVANTAGES}
- Nadelen: {OPTION_2_DISADVANTAGES}

{OPTIONAL_ADDITIONAL_OPTION_PRO_CON_BLOCKS}

---

## Aanbevolen Richting

Op basis van uw antwoorden lijkt {RECOMMENDED_DIRECTION} in uw situatie een logische richting om te overwegen.

Deze richting sluit aan bij wat voor u momenteel belangrijk is, namelijk {PRIORITY_CONTEXT}.

Dit is geen medisch advies, maar een neutrale duiding van welke optie in vergelijkbare situaties vaak als passend wordt gezien.

{TAG_NUANCE_DIRECTION}

---

## Verwachte Resultaten & Comfort

Wanneer u kiest voor {SELECTED_OPTION}, wordt doorgaans gestreefd naar {RESULT_DESCRIPTION}.

Veel mensen ervaren na de behandeling {COMFORT_EXPERIENCE}.

Op esthetisch vlak mag u verwachten dat {AESTHETIC_RESULT}.

{OPTIONAL_RESULT_TAG_BLOCK}

---

## Duur van de Behandeling

De gemiddelde doorlooptijd voor {SELECTED_OPTION} bedraagt ongeveer {TREATMENT_DURATION}.

Dit traject verloopt meestal in de volgende stappen:
1. {PHASE_1}
2. {PHASE_2}
3. {PHASE_3}

De exacte tijd hangt onder meer af van {DURATION_VARIATION_FACTOR}.

{OPTIONAL_DURATION_TAG_BLOCK}

---

## Risico's & Aandachtspunten

Elke tandheelkundige behandeling houdt algemene risico's in, zoals {GENERAL_RISK}.

In uw situatie zijn onderstaande punten belangrijk om mee te nemen:
{SITUATION_SPECIFIC_CONSIDERATIONS}

Deze informatie dient enkel ter ondersteuning van uw besluitvorming.

---

## Kosten & Prijsfactoren

### Kostenschatting

De kostprijs van {SELECTED_OPTION} kan variëren afhankelijk van individuele factoren.

In uw regio ligt de gebruikelijke kostenrange meestal tussen {PRICE_MIN} en {PRICE_MAX}.

Dit betreft een indicatieve schatting en geen prijsofferte.

### Prijsfactoren

De uiteindelijke prijs kan variëren door:
- {FACTOR_1}
- {FACTOR_2}
- {FACTOR_3}

{OPTIONAL_PRICE_TAG_BLOCK}

---

## Herstel & Praktische Instructies

Het herstel na {SELECTED_OPTION} duurt meestal {RECOVERY_DURATION}.

Mogelijke ongemakken zijn {RECOVERY_DISCOMFORT}.

U mag hulp zoeken wanneer u {ALARM_SIGNAL}.

{OPTIONAL_RECOVERY_TAG_BLOCK}

---

## Volgende Stappen

U hebt nu een helder overzicht van uw situatie, de mogelijke opties en wat u kunt verwachten.

Voor iemand in uw fase is het vooral belangrijk om {PROGRESSION_FOCUS}.

Als u graag meer diepgang wilt, kunt u terecht in onze beslissingsgidsen. Daarin ontdekt u hoe u tijd en geld kunt besparen, veelvoorkomende fouten kunt vermijden en hoe u realistische en voorspelbare resultaten herkent.

Overweeg bij een vervolgconsult zeker de volgende vragen:
- {QUESTION_1}
- {QUESTION_2}
- {QUESTION_3}

{OPTIONAL_NEXT_STEPS_TAG_BLOCK}

U hoeft vandaag geen definitieve beslissing te nemen; dit overzicht is bedoeld om u beter voorbereid te laten nadenken.`;

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

    // 1. Calculate all variables
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
        return match; // Keep original placeholder
      }

      if (resolved.status === "not_implemented") {
        warnings.push({
          code: "NOT_IMPLEMENTED",
          message: `Variable not implemented: ${variableName}`,
          variable: variableName as NLGVariable,
          severity: "info"
        });
      }

      if (resolved.status === "missing_data") {
        warnings.push({
          code: "MISSING_DATA",
          message: `Data not available for: ${variableName}`,
          variable: variableName as NLGVariable,
          severity: "warning"
        });
      }

      return resolved.value;
    });

    // 4. Clean up empty sections and extra whitespace
    renderedReport = this.cleanupReport(renderedReport);

    // 5. Generate flags
    const flags = variableCalculator.generateFlags();

    // 6. Add summary warning if many variables are flagged
    if (variableResolution.notImplementedVariables.length > 10) {
      warnings.push({
        code: "PARTIAL_IMPLEMENTATION",
        message: `${variableResolution.notImplementedVariables.length} variables are not yet implemented. See flags for details.`,
        severity: "info"
      });
    }

    return {
      sessionId,
      language,
      renderedReport,
      variableResolution,
      warnings,
      flags
    };
  }

  /**
   * Clean up the rendered report
   * - Remove empty optional blocks
   * - Normalize whitespace
   * - Remove orphaned list items
   */
  private cleanupReport(report: string): string {
    let cleaned = report;

    // Remove empty list items (e.g., "- \n")
    cleaned = cleaned.replace(/^-\s*$/gm, "");

    // Remove lines that are just whitespace
    cleaned = cleaned.replace(/^\s+$/gm, "");

    // Collapse multiple blank lines into two (for section spacing)
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

export const nlgTemplateRenderer = new NLGTemplateRenderer();
