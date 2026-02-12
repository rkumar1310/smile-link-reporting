/**
 * Content Mapper
 *
 * Maps parsed DOCX content to content registry IDs for seeding.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  ParsedModule,
  ParsedScenario,
  ParsedFallbackBlock,
  ParsedCostBlock,
  ParsedNuanceBlock,
  DocxParseResult,
} from './parseDocx.js';

// ============================================================================
// Types
// ============================================================================

export interface ContentRegistryItem {
  id: string;
  type: 'scenario' | 'a_block' | 'b_block' | 'module' | 'static';
  name: string;
  name_nl: string;
  description: string;
  description_nl: string;
  layer: 'L1' | 'L2' | 'L3';
  sections: number[];
}

export interface ContentRegistry {
  version: string;
  lastUpdated: string;
  items: ContentRegistryItem[];
}

export interface MappedContent {
  contentId: string;
  type: 'module' | 'a_block' | 'b_block' | 'scenario' | 'static';
  registryItem: ContentRegistryItem;
  dutchContent: string;
  dutchTitle: string;
  sourceFile: string;
  sourceSection?: string;
}

export interface MappingResult {
  mapped: MappedContent[];
  unmapped: Array<{
    source: string;
    title: string;
    reason: string;
  }>;
  missingFromDocx: ContentRegistryItem[];
}

// ============================================================================
// Registry Loading
// ============================================================================

const REGISTRY_PATH = path.join(process.cwd(), 'config', 'content-registry.json');

export function loadContentRegistry(): ContentRegistry {
  const content = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  return JSON.parse(content);
}

// ============================================================================
// Module Mapping
// ============================================================================

const MODULE_CONTENT_ID_MAP: Record<number, string> = {
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

// Alternative module names that might appear in the DOCX
const MODULE_ALT_NAMES: Record<string, string> = {
  'zwangerschap': 'TM_PREGNANCY',
  'medische aandoening': 'TM_DIABETES',
  'diabetes': 'TM_DIABETES',
  'roken': 'TM_SMOKING',
  'vapen': 'TM_SMOKING',
  'bruxisme': 'TM_BRUXISM',
  'tandenknarsen': 'TM_BRUXISM',
  'parodontitis': 'TM_PERIODONTITIS',
  'ontsteking': 'TM_INFLAMMATION',
  'mondhygiëne': 'TM_POOR_HYGIENE',
  'botverlies': 'TM_BONE_LOSS',
  'angst': 'TM_DENTAL_ANXIETY',
  'leeftijd': 'TM_AGE_FACTOR',
  'premium esthetiek': 'TM_PREMIUM_AESTHETIC',
  'esthetische stijl': 'TM_AESTHETIC_STYLE',
  'functioneel': 'TM_FUNCTIONAL_VS_AESTHETIC',
  'budget laag': 'TM_BUDGET_LOW',
  'budget premium': 'TM_BUDGET_PREMIUM',
  'tandstatus': 'TM_TOOTH_STATUS',
  'complexiteit': 'TM_ORAL_COMPLEXITY',
  'behandelgeschiedenis': 'TM_TREATMENT_HISTORY',
  'algemene gezondheid': 'TM_GENERAL_HEALTH',
};

export function mapModules(
  modules: ParsedModule[],
  registry: ContentRegistry
): { mapped: MappedContent[]; unmapped: Array<{ source: string; title: string; reason: string }> } {
  const mapped: MappedContent[] = [];
  const unmapped: Array<{ source: string; title: string; reason: string }> = [];

  for (const module of modules) {
    // Try direct mapping first
    let contentId = MODULE_CONTENT_ID_MAP[module.moduleNumber];

    // If no direct mapping, try fuzzy matching
    if (!contentId) {
      const titleLower = module.title.toLowerCase();
      for (const [keyword, id] of Object.entries(MODULE_ALT_NAMES)) {
        if (titleLower.includes(keyword)) {
          contentId = id;
          break;
        }
      }
    }

    if (!contentId) {
      unmapped.push({
        source: 'Moduleblokken.docx',
        title: `Module ${module.moduleNumber}: ${module.title}`,
        reason: 'No content ID mapping found',
      });
      continue;
    }

    // Find in registry
    const registryItem = registry.items.find(item => item.id === contentId);
    if (!registryItem) {
      unmapped.push({
        source: 'Moduleblokken.docx',
        title: `Module ${module.moduleNumber}: ${module.title}`,
        reason: `Content ID ${contentId} not found in registry`,
      });
      continue;
    }

    mapped.push({
      contentId,
      type: 'module',
      registryItem,
      dutchContent: module.content,
      dutchTitle: module.title,
      sourceFile: 'Moduleblokken.docx',
      sourceSection: `Module ${module.moduleNumber}`,
    });
  }

  return { mapped, unmapped };
}

// ============================================================================
// Fallback Block Mapping
// ============================================================================

const FALLBACK_CONTENT_ID_MAP: Record<string, string> = {
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
  'groei': 'A_WARN_PREGNANCY_OR_GROWTH',
  'pijn': 'A_WARN_ACTIVE_SYMPTOMS',
  'urgentie': 'A_WARN_URGENCY',
};

export function mapFallbackBlocks(
  blocks: ParsedFallbackBlock[],
  registry: ContentRegistry
): { mapped: MappedContent[]; unmapped: Array<{ source: string; title: string; reason: string }> } {
  const mapped: MappedContent[] = [];
  const unmapped: Array<{ source: string; title: string; reason: string }> = [];

  for (const block of blocks) {
    const titleLower = block.title.toLowerCase();
    let contentId: string | undefined;

    // Try fuzzy matching
    for (const [keyword, id] of Object.entries(FALLBACK_CONTENT_ID_MAP)) {
      if (titleLower.includes(keyword)) {
        contentId = id;
        break;
      }
    }

    if (!contentId) {
      unmapped.push({
        source: 'Fall back blokken.docx',
        title: `${block.type === 'absolute' ? 'Absolute' : 'Conditional'} #${block.number}: ${block.title}`,
        reason: 'No content ID mapping found',
      });
      continue;
    }

    // Find in registry
    const registryItem = registry.items.find(item => item.id === contentId);
    if (!registryItem) {
      unmapped.push({
        source: 'Fall back blokken.docx',
        title: `${block.type === 'absolute' ? 'Absolute' : 'Conditional'} #${block.number}: ${block.title}`,
        reason: `Content ID ${contentId} not found in registry`,
      });
      continue;
    }

    // Avoid duplicates (same contentId from multiple sources)
    if (mapped.some(m => m.contentId === contentId)) {
      continue;
    }

    mapped.push({
      contentId,
      type: 'a_block',
      registryItem,
      dutchContent: block.content,
      dutchTitle: block.title,
      sourceFile: 'Fall back blokken.docx',
      sourceSection: `${block.type === 'absolute' ? 'Absolute' : 'Conditional'} Fallback #${block.number}`,
    });
  }

  return { mapped, unmapped };
}

// ============================================================================
// Scenario Mapping
// ============================================================================

export function mapScenarios(
  scenarios: ParsedScenario[],
  registry: ContentRegistry
): { mapped: MappedContent[]; unmapped: Array<{ source: string; title: string; reason: string }> } {
  const mapped: MappedContent[] = [];
  const unmapped: Array<{ source: string; title: string; reason: string }> = [];

  for (const scenario of scenarios) {
    const contentId = scenario.scenarioId; // S01, S02, etc.

    // Find in registry
    const registryItem = registry.items.find(item => item.id === contentId);
    if (!registryItem) {
      unmapped.push({
        source: 'Scenarioblok per scenariodocx.docx',
        title: `${scenario.scenarioId}: ${scenario.title}`,
        reason: `Content ID ${contentId} not found in registry`,
      });
      continue;
    }

    // Build full content from sections
    const fullContent = buildScenarioContent(scenario);

    mapped.push({
      contentId,
      type: 'scenario',
      registryItem,
      dutchContent: fullContent,
      dutchTitle: scenario.title,
      sourceFile: 'Scenarioblok per scenariodocx.docx',
      sourceSection: scenario.scenarioId,
    });
  }

  return { mapped, unmapped };
}

function buildScenarioContent(scenario: ParsedScenario): string {
  const parts: string[] = [];

  if (scenario.sections.disclaimer) {
    parts.push(`## Disclaimer\n\n${scenario.sections.disclaimer}`);
  }
  if (scenario.sections.personalSummary) {
    parts.push(`## Persoonlijke samenvatting\n\n${scenario.sections.personalSummary}`);
  }
  if (scenario.sections.situation) {
    parts.push(`## Uw situatie\n\n${scenario.sections.situation}`);
  }
  if (scenario.sections.treatmentDirections) {
    parts.push(`## Mogelijke behandelrichtingen\n\n${scenario.sections.treatmentDirections}`);
  }

  for (const option of scenario.sections.options) {
    parts.push(`### Optie ${option.number} — ${option.title}\n\n${option.content}`);
    if (option.benefits?.length) {
      parts.push(`**Voordelen:**\n${option.benefits.map(b => `- ${b}`).join('\n')}`);
    }
    if (option.considerations?.length) {
      parts.push(`**Aandachtspunten:**\n${option.considerations.map(c => `- ${c}`).join('\n')}`);
    }
  }

  if (scenario.sections.expectedResults) {
    parts.push(`## Verwachte resultaten\n\n${scenario.sections.expectedResults}`);
  }
  if (scenario.sections.duration) {
    parts.push(`## Duur van het traject\n\n${scenario.sections.duration}`);
  }
  if (scenario.sections.recovery) {
    parts.push(`## Hersteltijd & impact\n\n${scenario.sections.recovery}`);
  }
  if (scenario.sections.costIndication) {
    parts.push(`## Kostenindicatie\n\n${scenario.sections.costIndication}`);
  }
  if (scenario.sections.nextSteps) {
    parts.push(`## Volgende stappen\n\n${scenario.sections.nextSteps}`);
  }

  return parts.join('\n\n');
}

// ============================================================================
// Main Mapping Function
// ============================================================================

export function mapAllContent(docxResult: DocxParseResult): MappingResult {
  const registry = loadContentRegistry();

  // Map each content type
  const moduleResult = mapModules(docxResult.modules, registry);
  const fallbackResult = mapFallbackBlocks(docxResult.fallbackBlocks, registry);
  const scenarioResult = mapScenarios(docxResult.scenarios, registry);

  // Combine results
  const allMapped = [
    ...moduleResult.mapped,
    ...fallbackResult.mapped,
    ...scenarioResult.mapped,
  ];

  const allUnmapped = [
    ...moduleResult.unmapped,
    ...fallbackResult.unmapped,
    ...scenarioResult.unmapped,
  ];

  // Find registry items that weren't found in DOCX
  const mappedIds = new Set(allMapped.map(m => m.contentId));
  const missingFromDocx = registry.items.filter(item => {
    // Only check modules and a_blocks (not scenarios, b_blocks, or static for now)
    if (item.type === 'module' || item.type === 'a_block') {
      return !mappedIds.has(item.id);
    }
    return false;
  });

  return {
    mapped: allMapped,
    unmapped: allUnmapped,
    missingFromDocx,
  };
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
                     process.argv[1]?.endsWith('contentMapper.ts');

if (isMainModule) {
  import('./parseDocx.js').then(async ({ parseAllDocx }) => {
    console.log('Parsing DOCX files...\n');
    const docxResult = await parseAllDocx();

    console.log('\nMapping content to registry...\n');
    const result = mapAllContent(docxResult);

    console.log('=== MAPPED CONTENT ===');
    console.log(`Total mapped: ${result.mapped.length}`);
    for (const m of result.mapped) {
      console.log(`  ✓ ${m.contentId} (${m.type}) <- ${m.sourceFile}`);
    }

    console.log('\n=== UNMAPPED CONTENT ===');
    console.log(`Total unmapped: ${result.unmapped.length}`);
    for (const u of result.unmapped) {
      console.log(`  ✗ ${u.title} [${u.source}]: ${u.reason}`);
    }

    console.log('\n=== MISSING FROM DOCX ===');
    console.log(`Total missing: ${result.missingFromDocx.length}`);
    for (const m of result.missingFromDocx) {
      console.log(`  ⚠ ${m.id} (${m.type}): ${m.name}`);
    }
  }).catch(err => {
    console.error('Mapping failed:', err);
    process.exit(1);
  });
}
