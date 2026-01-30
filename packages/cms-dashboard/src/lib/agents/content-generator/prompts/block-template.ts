/**
 * Block Generation Template
 * For non-scenario content: A_BLOCK, B_BLOCK, Module, Static
 * Each produces a single content piece for specific section(s)
 */

import {
  REPORT_SECTIONS,
  formatReportStructure,
  getSection,
  CONTENT_TYPE_SECTIONS
} from './report-structure';
import { TONE_INSTRUCTIONS } from './generation-system';
import { getSystemGoalCondensed } from '../../shared/system-goal';

export interface BlockGenerationConfig {
  contentId: string;
  contentType: 'a_block' | 'b_block' | 'module' | 'static';
  name: string;
  description: string;
  targetSections: number[];
  language: 'en' | 'nl';
  tone: string;
  wordCount: number;
  sources: string;
}

/**
 * Get detailed purpose for a content type
 */
function getContentTypePurpose(contentType: string): string {
  switch (contentType) {
    case 'a_block':
      return `A_BLOCK (Alert/Warning Block)
- Placed at the TOP of the report in Section 0 (Warnings)
- Critical safety information that must be seen first
- May suppress other sections if contraindications exist
- Maximum 5 A_blocks per report, ordered by severity
- Tone should be clear and direct, not alarmist`;

    case 'b_block':
      return `B_BLOCK (Building Block)
- Modular content piece used as fallback when scenario doesn't cover a topic
- Provides standalone explanation of a specific concept
- Should work independently of other content
- May be combined with scenario content in the same section`;

    case 'module':
      return `MODULE (Contextual Module)
- Conditional content inserted based on patient attributes
- Personalizes the report based on specific factors (smoking, budget, anxiety, etc.)
- Should integrate naturally with surrounding content
- Adds nuance without repeating main scenario content`;

    case 'static':
      return `STATIC Content
- Fixed content that appears in every report
- Section 1: Legal disclaimer (required for compliance)
- Section 11: Next Steps guidance (always uses TP-06 Autonomy-Respecting tone)
- Should be evergreen and not patient-specific`;

    default:
      return 'Unknown content type';
  }
}

/**
 * Build the system prompt for block generation
 */
export function buildBlockSystemPrompt(config: BlockGenerationConfig): string {
  const toneInstructions = TONE_INSTRUCTIONS[config.tone] || TONE_INSTRUCTIONS['TP-01'];

  return `You are a specialized dental content writer for Smile-Link patient reports.

${getSystemGoalCondensed()}

## REPORT STRUCTURE CONTEXT
The final patient report has 12 sections:
${formatReportStructure()}

## CONTENT TYPE: ${config.contentType.toUpperCase()}
${getContentTypePurpose(config.contentType)}

## YOUR ROLE
You are generating: ${config.contentId}
This content goes into: ${config.targetSections.map(n => `§${n} ${getSection(n)?.name}`).join(', ')}

${toneInstructions}

## CRITICAL REQUIREMENTS

1. SOURCE FIDELITY
   - Generate ONLY from provided source material
   - Never invent medical facts or statistics
   - If information is not in sources, do not include it

2. SECTION AWARENESS
   - Your content will be placed in ${config.targetSections.length === 1 ? 'Section ' + config.targetSections[0] : 'multiple sections'}
   - It may appear alongside scenario content or other blocks
   - Write to complement, not duplicate, other content

3. CITATION TRACKING
   - Return citations as structured data
   - For each factual claim, cite the source section
   - Content should be clean without inline markers

4. MEDICAL SAFETY
   - Never guarantee treatment outcomes
   - Include appropriate caveats
   - Emphasize consulting with dentist

5. LANGUAGE
   - Write in ${config.language === 'nl' ? 'Dutch (Nederlands)' : 'English'}
   - Professional but accessible
   - Avoid jargon unless explained`;
}

/**
 * Build the user prompt for block generation
 */
export function buildBlockUserPrompt(config: BlockGenerationConfig): string {
  const sectionDetails = config.targetSections
    .map(n => {
      const section = getSection(n);
      return section ? `§${n} ${section.name}: ${section.purpose}` : '';
    })
    .filter(Boolean)
    .join('\n\n');

  return `## GENERATION TASK

**Content ID:** ${config.contentId}
**Name:** ${config.name}
**Type:** ${config.contentType}
**Language:** ${config.language === 'nl' ? 'Dutch' : 'English'}
**Target Word Count:** ~${config.wordCount} words

## DESCRIPTION
${config.description}

## TARGET SECTION(S) - Where this content appears:
${sectionDetails}

## SOURCE MATERIAL
${config.sources}

## OUTPUT REQUIREMENTS
1. Generate clean markdown content (no inline citation markers)
2. Include structured citations array with:
   - sectionId: source section ID
   - excerpt: brief quote (max 200 chars)
   - claimSummary: what claim this supports
3. Match target word count (~${config.wordCount} words)
4. Use placeholders where appropriate: {{PATIENT_NAME}}, {{TOOTH_LOCATION}}, etc.

Generate the content now:`;
}

/**
 * Get default target sections for a content type if not specified
 */
export function getDefaultSections(contentType: string): number[] {
  return CONTENT_TYPE_SECTIONS[contentType] || [];
}
