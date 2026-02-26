/**
 * Option Block Builder — extracted to break circular import
 *
 * Previously in NLGTemplateRenderer.ts, but VariableCalculator also needs it.
 * Extracting here avoids: NLGTemplateRenderer → VariableCalculator → NLGTemplateRenderer cycle.
 */

import type { SupportedLanguage } from "../types";

// =============================================================================
// OPTION BLOCK TEMPLATES
// =============================================================================

const OPTION_TEMPLATE_EN = (opt: {
  title: string;
  description: string;
  processOverview: string;
  limitations: string;
  profileMatch: string;
}) => `### ${opt.title}

**What this involves**
This option generally includes ${opt.description}.

**What you may expect**
The process may consist of ${opt.processOverview}, depending on your specific situation.

**Possible considerations**
${opt.limitations} may be taken into account.

**For whom this may be relevant**
This approach is sometimes considered for individuals who ${opt.profileMatch}.`;

const OPTION_TEMPLATE_NL = (opt: {
  title: string;
  description: string;
  processOverview: string;
  limitations: string;
  profileMatch: string;
}) => `### ${opt.title}

**Wat dit inhoudt**
Deze optie omvat doorgaans ${opt.description}.

**Wat u mag verwachten**
Het traject kan bestaan uit ${opt.processOverview}, afhankelijk van uw specifieke situatie.

**Mogelijke aandachtspunten**
Er kan rekening worden gehouden met ${opt.limitations}.

**Voor wie dit logisch kan zijn**
Deze benadering wordt soms overwogen bij personen die ${opt.profileMatch}.`;

// =============================================================================
// BUILDER FUNCTION
// =============================================================================

/**
 * Build the OPTIONS_BLOCK string from scenario options array
 */
export function buildOptionsBlock(
  options: Array<{
    title: string;
    description: string;
    processOverview: string;
    limitations: string;
    profileMatch: string;
  }>,
  language: SupportedLanguage
): string {
  const templateFn = language === "en" ? OPTION_TEMPLATE_EN : OPTION_TEMPLATE_NL;
  return options.map(opt => templateFn(opt)).join("\n\n");
}
