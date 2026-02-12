/**
 * DOCX Parser for Content Seeding
 *
 * Parses DOCX files from reference-docs/all-content/ to extract Dutch content.
 * Uses mammoth for DOCX conversion to HTML/text.
 */

import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface ParsedModule {
  moduleNumber: number;
  title: string;
  content: string;
  contentId?: string; // Mapped content ID (TM_*)
}

export interface ParsedScenario {
  scenarioId: string; // S01, S02, etc.
  title: string;
  sections: {
    disclaimer?: string;
    personalSummary?: string;
    situation?: string;
    treatmentDirections?: string;
    options: Array<{
      number: number;
      title: string;
      content: string;
      benefits?: string[];
      considerations?: string[];
    }>;
    expectedResults?: string;
    duration?: string;
    recovery?: string;
    costIndication?: string;
    nextSteps?: string;
  };
  rawContent: string;
}

export interface ParsedFallbackBlock {
  type: 'absolute' | 'conditional';
  number: number;
  title: string;
  content: string;
  contentId?: string; // A_WARN_*
}

export interface ParsedCostBlock {
  scenarioNumber: number;
  scenarioTitle: string;
  content: string;
}

export interface ParsedNuanceBlock {
  scenarioId: string;
  scenarioTitle: string;
  profile?: string;
  context?: string;
  content: string;
}

export interface DocxParseResult {
  modules: ParsedModule[];
  scenarios: ParsedScenario[];
  fallbackBlocks: ParsedFallbackBlock[];
  costBlocks: ParsedCostBlock[];
  nuanceBlocks: ParsedNuanceBlock[];
}

// ============================================================================
// Module ID Mapping
// ============================================================================

const MODULE_ID_MAP: Record<number, string> = {
  1: 'TM_PREGNANCY',
  2: 'TM_DIABETES',
  3: 'TM_SMOKING',
  4: 'TM_BRUXISM',
  5: 'TM_PERIODONTITIS',
  6: 'TM_INFLAMMATION',
  7: 'TM_POOR_HYGIENE',
  8: 'TM_BONE_LOSS',
  9: 'TM_DENTAL_ANXIETY',
  10: 'TM_AGE_FACTOR',
  11: 'TM_PREMIUM_AESTHETIC',
  12: 'TM_AESTHETIC_STYLE',
  13: 'TM_FUNCTIONAL_VS_AESTHETIC',
  14: 'TM_BUDGET_LOW',
  15: 'TM_BUDGET_PREMIUM',
  16: 'TM_TOOTH_STATUS',
  17: 'TM_ORAL_COMPLEXITY',
  18: 'TM_TREATMENT_HISTORY',
  19: 'TM_GENERAL_HEALTH',
};

// Fallback block ID mapping
const FALLBACK_ID_MAP: Record<string, string> = {
  'zwangerschap': 'A_WARN_PREGNANCY_OR_GROWTH',
  'medische aandoening': 'A_WARN_MEDICAL',
  'diabetes': 'A_WARN_MEDICAL',
  'roken': 'A_WARN_SMOKING',
  'vapen': 'A_WARN_SMOKING',
  'parodontitis': 'A_WARN_BIOLOGICAL_INSTABILITY',
  'chronische ontsteking': 'A_WARN_BIOLOGICAL_INSTABILITY',
  'slechte mondhygiëne': 'A_WARN_INCOMPLETE_ASSESSMENT',
  'bruxisme': 'A_WARN_RISK_FACTORS',
  'botverlies': 'A_WARN_RISK_FACTORS',
  'tandheelkundige angst': 'A_WARN_ANXIETY',
};

// ============================================================================
// DOCX Reading
// ============================================================================

const DOCX_DIR = path.join(process.cwd(), 'reference-docs', 'all-content');

async function readDocxAsText(filename: string): Promise<string> {
  const filepath = path.join(DOCX_DIR, filename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`DOCX file not found: ${filepath}`);
  }

  const result = await mammoth.extractRawText({ path: filepath });
  return result.value;
}

// ============================================================================
// Module Parser
// ============================================================================

export async function parseModuleblokken(): Promise<ParsedModule[]> {
  const text = await readDocxAsText('Moduleblokken.docx');
  const modules: ParsedModule[] = [];

  // Split by "Module X" pattern (using [\s\S] instead of . with s flag)
  const moduleRegex = /Module\s+(\d+)\s*[–—-]\s*([\s\S]+?)(?=Module\s+\d+|$)/gi;
  let match;

  while ((match = moduleRegex.exec(text)) !== null) {
    const moduleNumber = parseInt(match[1], 10);
    const rest = match[2].trim();

    // Extract title (first line or text before first paragraph)
    const lines = rest.split('\n').filter(l => l.trim());
    const title = lines[0]?.trim() || `Module ${moduleNumber}`;
    const content = lines.slice(1).join('\n').trim() || rest;

    modules.push({
      moduleNumber,
      title,
      content,
      contentId: MODULE_ID_MAP[moduleNumber],
    });
  }

  return modules;
}

// ============================================================================
// Scenario Parser
// ============================================================================

export async function parseScenarioblok(): Promise<ParsedScenario[]> {
  const text = await readDocxAsText('Scenarioblok per scenariodocx.docx');
  const scenarios: ParsedScenario[] = [];

  // Split by "Scenario S##" pattern (using [\s\S] instead of . with s flag)
  const scenarioRegex = /Scenario\s+(S\d{2})\s*[–—-]\s*([\s\S]+?)(?=Scenario\s+S\d{2}|$)/gi;
  let match;

  while ((match = scenarioRegex.exec(text)) !== null) {
    const scenarioId = match[1].toUpperCase();
    const rest = match[2].trim();

    // Extract title
    const titleMatch = rest.match(/^([^\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : scenarioId;

    // Parse sections
    const sections = parseScenarioSections(rest);

    scenarios.push({
      scenarioId,
      title,
      sections,
      rawContent: rest,
    });
  }

  return scenarios;
}

function parseScenarioSections(text: string) {
  const sections: ParsedScenario['sections'] = {
    options: [],
  };

  // Extract numbered sections
  const sectionPatterns: Record<string, RegExp> = {
    disclaimer: /1\.\s*Disclaimer\s*([\s\S]*?)(?=2\.|$)/i,
    personalSummary: /2\.\s*Persoonlijke samenvatting\s*([\s\S]*?)(?=3\.|$)/i,
    situation: /3\.\s*Uw situatie\s*([\s\S]*?)(?=4\.|$)/i,
    treatmentDirections: /4\.\s*Mogelijke behandelrichtingen\s*([\s\S]*?)(?=5\.|$)/i,
    expectedResults: /7\.\s*Verwachte resultaten\s*([\s\S]*?)(?=8\.|$)/i,
    duration: /8\.\s*Duur van het traject\s*([\s\S]*?)(?=9\.|$)/i,
    recovery: /(?:9|10)\.\s*Hersteltijd\s*([\s\S]*?)(?=\d+\.|$)/i,
    costIndication: /(?:9|10)\.\s*Kostenindicatie\s*([\s\S]*?)(?=\d+\.|$)/i,
    nextSteps: /(?:10|11)\.\s*Volgende stappen\s*([\s\S]*?)(?=Scenario|$)/i,
  };

  for (const [key, pattern] of Object.entries(sectionPatterns)) {
    const match = text.match(pattern);
    if (match && key !== 'options') {
      // Use type assertion for dynamic property assignment
      const sectionKey = key as keyof typeof sections;
      if (sectionKey !== 'options') {
        (sections as Record<string, string | undefined>)[sectionKey] = match[1].trim();
      }
    }
  }

  // Extract options (Optie 1, Optie 2, etc.)
  const optionRegex = /(?:5|6)\.\s*Optie\s+(\d+)\s*[–—-]\s*(.+?)\s*([\s\S]*?)(?=(?:5|6)\.\s*Optie|\d+\.\s*[A-Z]|$)/gi;
  let optMatch;

  while ((optMatch = optionRegex.exec(text)) !== null) {
    const optionNumber = parseInt(optMatch[1], 10);
    const optionTitle = optMatch[2].trim();
    const optionContent = optMatch[3].trim();

    // Extract benefits and considerations
    const benefitsMatch = optionContent.match(/Voordelen\s*([\s\S]*?)(?=Aandachtspunten|$)/i);
    const considerationsMatch = optionContent.match(/Aandachtspunten\s*([\s\S]*?)(?=Voor wie|$)/i);

    sections.options.push({
      number: optionNumber,
      title: optionTitle,
      content: optionContent,
      benefits: benefitsMatch ? extractBulletPoints(benefitsMatch[1]) : undefined,
      considerations: considerationsMatch ? extractBulletPoints(considerationsMatch[1]) : undefined,
    });
  }

  return sections;
}

function extractBulletPoints(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(line => line.length > 0);
}

// ============================================================================
// Fallback Block Parser
// ============================================================================

export async function parseFallbackBlokken(): Promise<ParsedFallbackBlock[]> {
  const text = await readDocxAsText('Fall back blokken.docx');
  const blocks: ParsedFallbackBlock[] = [];

  // Split by section headers
  const absoluteSection = text.match(/ABSOLUTE FALL BACK BLOKKEN\s*([\s\S]*?)(?=CONDITIONELE|$)/i);
  const conditionalSection = text.match(/CONDITIONELE FALL BACK BLOKKEN\s*([\s\S]*?)$/i);

  // Parse absolute fallbacks
  if (absoluteSection) {
    const absoluteBlocks = parseNumberedBlocks(absoluteSection[1], 'absolute');
    blocks.push(...absoluteBlocks);
  }

  // Parse conditional fallbacks
  if (conditionalSection) {
    const conditionalBlocks = parseNumberedBlocks(conditionalSection[1], 'conditional');
    blocks.push(...conditionalBlocks);
  }

  return blocks;
}

function parseNumberedBlocks(text: string, type: 'absolute' | 'conditional'): ParsedFallbackBlock[] {
  const blocks: ParsedFallbackBlock[] = [];
  const blockRegex = /(\d+)\.\s*(.+?)\s*(?:\n|$)([\s\S]*?)(?=\d+\.\s*[A-Z]|$)/gi;
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    const number = parseInt(match[1], 10);
    const title = match[2].trim();
    const content = match[3].trim();

    // Map to content ID
    const titleLower = title.toLowerCase();
    let contentId: string | undefined;
    for (const [keyword, id] of Object.entries(FALLBACK_ID_MAP)) {
      if (titleLower.includes(keyword)) {
        contentId = id;
        break;
      }
    }

    blocks.push({
      type,
      number,
      title,
      content,
      contentId,
    });
  }

  return blocks;
}

// ============================================================================
// Cost Block Parser
// ============================================================================

export async function parseKostenblokken(): Promise<ParsedCostBlock[]> {
  const text = await readDocxAsText('Kostenblokken.docx');
  const blocks: ParsedCostBlock[] = [];

  // Split by numbered sections
  const blockRegex = /(\d+)\.\s*(.+?)(?:\n|$)([\s\S]*?)(?=\d+\.\s*[A-Z]|$)/gi;
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    const scenarioNumber = parseInt(match[1], 10);
    const scenarioTitle = match[2].trim();
    const content = match[3].trim();

    blocks.push({
      scenarioNumber,
      scenarioTitle,
      content,
    });
  }

  return blocks;
}

// ============================================================================
// Nuance Block Parser
// ============================================================================

export async function parseNuanceblokken(): Promise<ParsedNuanceBlock[]> {
  const text = await readDocxAsText('Nuanceblokken final.docx');
  const blocks: ParsedNuanceBlock[] = [];

  // Split by "Scenario S##" pattern (using [\s\S] instead of . with s flag)
  const blockRegex = /Scenario\s+(S\d{2})\s*[–—-]\s*([^\n]+)[\s\S]*?Belangrijke nuance[^:]*:\s*([\s\S]*?)(?=Scenario\s+S\d{2}|$)/gi;
  let match;

  while ((match = blockRegex.exec(text)) !== null) {
    const scenarioId = match[1].toUpperCase();
    const scenarioTitle = match[2].trim();
    const content = match[3].trim();

    // Extract profile and context from the full block text if available
    const fullBlock = text.substring(match.index, match.index + match[0].length);
    const profileMatch = fullBlock.match(/Profiel:\s*([^\n]+)/i);
    const contextMatch = fullBlock.match(/Context:\s*([^\n]+)/i);

    blocks.push({
      scenarioId,
      scenarioTitle,
      profile: profileMatch?.[1]?.trim(),
      context: contextMatch?.[1]?.trim(),
      content,
    });
  }

  return blocks;
}

// ============================================================================
// Main Parser
// ============================================================================

export async function parseAllDocx(): Promise<DocxParseResult> {
  console.log('Parsing DOCX files from reference-docs/all-content/...\n');

  const [modules, scenarios, fallbackBlocks, costBlocks, nuanceBlocks] = await Promise.all([
    parseModuleblokken().catch(err => {
      console.error('Error parsing Moduleblokken.docx:', err.message);
      return [] as ParsedModule[];
    }),
    parseScenarioblok().catch(err => {
      console.error('Error parsing Scenarioblok.docx:', err.message);
      return [] as ParsedScenario[];
    }),
    parseFallbackBlokken().catch(err => {
      console.error('Error parsing Fall back blokken.docx:', err.message);
      return [] as ParsedFallbackBlock[];
    }),
    parseKostenblokken().catch(err => {
      console.error('Error parsing Kostenblokken.docx:', err.message);
      return [] as ParsedCostBlock[];
    }),
    parseNuanceblokken().catch(err => {
      console.error('Error parsing Nuanceblokken.docx:', err.message);
      return [] as ParsedNuanceBlock[];
    }),
  ]);

  console.log(`Parsed:`);
  console.log(`  - Modules: ${modules.length}`);
  console.log(`  - Scenarios: ${scenarios.length}`);
  console.log(`  - Fallback blocks: ${fallbackBlocks.length}`);
  console.log(`  - Cost blocks: ${costBlocks.length}`);
  console.log(`  - Nuance blocks: ${nuanceBlocks.length}`);

  return {
    modules,
    scenarios,
    fallbackBlocks,
    costBlocks,
    nuanceBlocks,
  };
}

// ============================================================================
// CLI Entry Point
// ============================================================================

// Check if this module is being run directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1]?.endsWith('parseDocx.ts');

if (isMainModule) {
  parseAllDocx()
    .then(result => {
      console.log('\n--- Modules ---');
      for (const m of result.modules) {
        console.log(`  ${m.moduleNumber}. ${m.title} -> ${m.contentId || 'UNMAPPED'}`);
      }

      console.log('\n--- Scenarios ---');
      for (const s of result.scenarios) {
        console.log(`  ${s.scenarioId}: ${s.title} (${s.sections.options.length} options)`);
      }

      console.log('\n--- Fallback Blocks ---');
      for (const f of result.fallbackBlocks) {
        console.log(`  [${f.type}] ${f.number}. ${f.title} -> ${f.contentId || 'UNMAPPED'}`);
      }
    })
    .catch(err => {
      console.error('Parse failed:', err);
      process.exit(1);
    });
}
