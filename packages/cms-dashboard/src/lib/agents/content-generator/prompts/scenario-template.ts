/**
 * Scenario Generation Template
 * For scenario content (S00-S17)
 * Produces a structured document with 8 internal sections
 */

import {
  REPORT_SECTIONS,
  SCENARIO_SECTION_MAPPING,
  formatReportStructure,
  formatScenarioSectionRequirements
} from './report-structure';
import { TONE_INSTRUCTIONS } from './generation-system';
import { getSystemGoalCondensed } from '../../shared/system-goal';

export interface ScenarioGenerationConfig {
  scenarioId: string;
  scenarioName: string;
  description: string;
  language: 'en' | 'nl';
  tone: string;
  sources: string;
}

/**
 * Scenario section keys in order
 */
export const SCENARIO_SECTION_KEYS = [
  'personal_summary',
  'context',
  'options',
  'comparison',
  'tradeoffs',
  'process',
  'costs',
  'risk'
] as const;

export type ScenarioSectionKey = typeof SCENARIO_SECTION_KEYS[number];

/**
 * Build the system prompt for scenario generation
 */
export function buildScenarioSystemPrompt(config: ScenarioGenerationConfig): string {
  const toneInstructions = TONE_INSTRUCTIONS[config.tone] || TONE_INSTRUCTIONS['TP-01'];

  return `You are a specialized dental content writer for Smile-Link patient reports.

${getSystemGoalCondensed()}

## REPORT STRUCTURE
The final patient report has 12 sections. Your scenario document provides the main content for sections 2-10:

${formatReportStructure()}

## YOUR ROLE
You are generating a COMPLETE SCENARIO document: ${config.scenarioId}
"${config.scenarioName}"

A scenario is the primary content source for a patient report. It provides personalized, cohesive content across 8 internal sections that map to report sections 2-10.

## SCENARIO SECTIONS YOU MUST GENERATE
${formatScenarioSectionRequirements()}

${toneInstructions}

## CRITICAL REQUIREMENTS

1. COMPLETE STRUCTURED OUTPUT
   - You MUST generate ALL 8 sections
   - Return as a JSON object with section keys
   - Each section should be complete markdown content

2. COHESIVE NARRATIVE
   - All sections should work together as one document
   - Maintain consistent terminology throughout
   - Build on context established in earlier sections
   - Avoid repeating the same points across sections

3. SOURCE FIDELITY
   - Generate ONLY from provided source material
   - Never invent medical facts, statistics, or claims
   - Include citations for each section

4. PATIENT-CENTERED
   - Address the patient directly using "you/your"
   - Be empathetic to their specific situation
   - Use placeholders: {{PATIENT_NAME}}, {{TOOTH_ZONE}}, {{TREATMENT_COMPLEXITY}}

5. MEDICAL SAFETY
   - Never guarantee treatment outcomes
   - Include appropriate caveats
   - Emphasize consulting with dentist

6. LANGUAGE
   - Write in ${config.language === 'nl' ? 'Dutch (Nederlands)' : 'English'}
   - Professional but accessible
   - Consistent terminology throughout`;
}

/**
 * Build the user prompt for scenario generation
 */
export function buildScenarioUserPrompt(config: ScenarioGenerationConfig): string {
  const sectionRequirements = Object.entries(SCENARIO_SECTION_MAPPING)
    .map(([key, info]) => {
      const reportSection = REPORT_SECTIONS[info.section];
      return `
### ${key} (~${info.wordTarget} words)
**Maps to:** §${info.section} "${info.name}"
**Purpose:** ${reportSection?.purpose || 'See report structure'}
**Guidelines:**
${getSectionGuidelines(key)}`;
    })
    .join('\n');

  return `## SCENARIO GENERATION TASK

**Scenario ID:** ${config.scenarioId}
**Name:** ${config.scenarioName}
**Language:** ${config.language === 'nl' ? 'Dutch' : 'English'}
**Tone:** ${config.tone}

## SCENARIO DESCRIPTION
${config.description}

## REQUIRED OUTPUT STRUCTURE
You MUST return a JSON object with these exact keys:

\`\`\`json
{
  "personal_summary": "...",
  "context": "...",
  "options": "...",
  "comparison": "...",
  "tradeoffs": "...",
  "process": "...",
  "costs": "...",
  "risk": "...",
  "citations": [...]
}
\`\`\`

## SECTION-BY-SECTION REQUIREMENTS
${sectionRequirements}

## SOURCE MATERIAL
${config.sources}

## CITATION FORMAT
Include a "citations" array with entries for factual claims:
\`\`\`json
{
  "sectionKey": "context",
  "sectionId": "source_section_42",
  "excerpt": "Brief quote from source",
  "claimSummary": "What this citation supports"
}
\`\`\`

Generate the complete scenario document now:`;
}

/**
 * Get specific guidelines for each scenario section
 */
function getSectionGuidelines(sectionKey: string): string {
  switch (sectionKey) {
    case 'personal_summary':
      return `- Open with empathy, acknowledging the patient's situation
- Reference their specific concerns from the questionnaire
- Set expectations for what the report will cover
- Use warm but professional tone
- Include: {{PATIENT_NAME}} if appropriate`;

    case 'context':
      return `- Explain the clinical significance of their situation
- Help them understand "why this matters"
- Provide educational background without being overwhelming
- Connect to their daily life impact
- Include: {{TOOTH_ZONE}}, {{TOOTH_ZONE_DESCRIPTION}} where relevant`;

    case 'options':
      return `- Present each treatment option objectively
- Describe what each option involves
- Highlight key benefits without overselling
- Include relevant considerations for each
- Use bullet points or structured format for clarity`;

    case 'comparison':
      return `- Side-by-side comparison format works well
- Compare on relevant factors: durability, aesthetics, cost, time
- Be balanced - show genuine trade-offs
- Help patient understand what differentiates options
- Consider using a comparison table`;

    case 'tradeoffs':
      return `- Honest discussion of pros and cons
- Address common concerns proactively
- Help set realistic expectations
- Acknowledge that no option is perfect
- Frame trade-offs constructively`;

    case 'process':
      return `- Timeline and what to expect
- Number of appointments typically needed
- Healing periods and recovery expectations
- What happens at each stage
- Include: {{ESTIMATED_VISITS}}, {{TREATMENT_DURATION}} where relevant`;

    case 'costs':
      return `- General cost factors without specific prices
- What affects pricing (materials, complexity, etc.)
- Budget considerations without judgment
- Payment/financing context if appropriate
- Include: {{BUDGET_APPROACH}} where relevant`;

    case 'risk':
      return `- Patient-specific risk factors
- General procedural risks (balanced, not alarming)
- How their factors (smoking, health, etc.) may affect outcomes
- What can be done to mitigate risks
- Emphasize importance of follow-up care`;

    default:
      return '- Follow general content guidelines';
  }
}

/**
 * Validate that all required sections are present in generated content
 */
export function validateScenarioSections(content: Record<string, string>): {
  valid: boolean;
  missing: string[];
} {
  const missing = SCENARIO_SECTION_KEYS.filter(key => !content[key] || content[key].trim() === '');
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Calculate total word count across all scenario sections
 */
export function getScenarioWordTarget(): number {
  return Object.values(SCENARIO_SECTION_MAPPING)
    .reduce((sum, info) => sum + info.wordTarget, 0);
}
