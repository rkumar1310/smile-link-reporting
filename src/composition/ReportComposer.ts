/**
 * Report Composer
 * Assembles the final report from selected content blocks
 * Implements ordered assembly per section as defined in Composition_Contract_v1.md
 */

import { promises as fs } from "fs";
import type {
  DriverState,
  ToneProfileId,
  ConfidenceLevel,
  ContentSelection,
  ContentType,
  ReportSection,
  ComposedReport,
  ScenarioMatchResult,
  IntakeData
} from "../types/index.js";

import { PlaceholderResolver, type PlaceholderContext } from "./PlaceholderResolver.js";
import { toneSelector } from "../engine/ToneSelector.js";
import { contentLoader } from "../content/ContentLoader.js";

// Section composition rules type
interface SectionRule {
  name: string;
  order: ContentType[];
  scenarioSection: string | null;
  scenarioSectionAlt?: string[];  // Alternate scenario section keys to try
  toneOverride?: ToneProfileId;
  maxCardinality?: Record<string, number>;
}

interface CompositionRules {
  sections: Record<string, SectionRule>;
  scenarioSectionMappings: Record<string, string[]>;
  maxModulesPerSection: number;
}

// Section names
const SECTION_NAMES: Record<number, string> = {
  0: "Important Notices",
  1: "Disclaimer",
  2: "Your Personal Summary",
  3: "Context",
  4: "Interpretation",
  5: "Treatment Options",
  6: "Comparison",
  7: "Trade-offs to Consider",
  8: "Treatment Process",
  9: "Cost Considerations",
  10: "Risk Factors",
  11: "Next Steps"
};

// Confidence level language
const CONFIDENCE_LANGUAGE: Record<ConfidenceLevel, string[]> = {
  HIGH: [],
  MEDIUM: [
    "Based on the information provided...",
    "From what you've shared..."
  ],
  LOW: [
    "With the limited information available...",
    "A more complete picture would require..."
  ],
  FALLBACK: [
    "This general overview is based on typical situations...",
    "Your specific circumstances may differ significantly..."
  ]
};

// Default composition rules (fallback if config not loaded)
const DEFAULT_RULES: CompositionRules = {
  sections: {
    "0": { name: "Warnings", order: ["a_block"], scenarioSection: null },
    "1": { name: "Disclaimer", order: ["static"], scenarioSection: null },
    "2": { name: "Personal Summary", order: ["module", "scenario"], scenarioSection: "personal_summary" },
    "3": { name: "Context", order: ["b_block", "module", "scenario"], scenarioSection: "context" },
    "4": { name: "Interpretation", order: ["b_block"], scenarioSection: null },
    "5": { name: "Treatment Options", order: ["b_block", "scenario"], scenarioSection: "options" },
    "6": { name: "Comparison", order: ["b_block"], scenarioSection: null },
    "7": { name: "Trade-offs", order: ["b_block"], scenarioSection: null },
    "8": { name: "Process", order: ["b_block", "scenario"], scenarioSection: "process" },
    "9": { name: "Costs", order: ["module", "scenario"], scenarioSection: "costs" },
    "10": { name: "Risk Factors", order: ["b_block", "module"], scenarioSection: null },
    "11": { name: "Next Steps", order: ["static"], scenarioSection: null, toneOverride: "TP-06" }
  },
  scenarioSectionMappings: {},
  maxModulesPerSection: 4
};

export interface ContentStore {
  getContent(contentId: string, tone: ToneProfileId): Promise<string | null>;
}

// Mock content store for development
class MockContentStore implements ContentStore {
  async getContent(contentId: string, tone: ToneProfileId): Promise<string | null> {
    // Return placeholder content for now
    return `[Content: ${contentId} in tone ${tone}]`;
  }
}

export class ReportComposer {
  private placeholderResolver: PlaceholderResolver;
  private contentStore: ContentStore;
  private rules: CompositionRules | null = null;

  constructor(contentStore?: ContentStore) {
    this.placeholderResolver = new PlaceholderResolver();
    this.contentStore = contentStore ?? new MockContentStore();
  }

  /**
   * Load composition rules from config file
   */
  private async loadRules(): Promise<CompositionRules> {
    if (this.rules) return this.rules;

    try {
      const rulesPath = "config/section-composition-rules.json";
      const data = await fs.readFile(rulesPath, "utf-8");
      this.rules = JSON.parse(data) as CompositionRules;
      return this.rules;
    } catch {
      return DEFAULT_RULES;
    }
  }

  /**
   * Compose the final report with ordered assembly
   */
  async compose(
    intake: IntakeData,
    driverState: DriverState,
    scenarioMatch: ScenarioMatchResult,
    contentSelections: ContentSelection[],
    selectedTone: ToneProfileId,
    scenarioContent?: string
  ): Promise<ComposedReport> {
    const rules = await this.loadRules();
    const sections: ReportSection[] = [];
    const suppressedSections: number[] = [];
    let totalWordCount = 0;
    let placeholdersResolved = 0;
    const placeholdersUnresolved: string[] = [];
    let warningsIncluded = false;

    // Check if A_BLOCK_TREATMENT_OPTIONS is active - if so, suppress treatment sections
    const hasBlockTreatmentOptions = contentSelections.some(
      s => s.content_id === "A_BLOCK_TREATMENT_OPTIONS" && !s.suppressed
    );
    const l1SuppressedSections = new Set<number>();
    if (hasBlockTreatmentOptions) {
      // Sections 5, 6, 7, 8, 9 should be suppressed when treatment options are blocked
      [5, 6, 7, 8, 9].forEach(s => l1SuppressedSections.add(s));
    }

    // Parse scenario into named sections
    const scenarioSections = scenarioContent
      ? contentLoader.parseScenarioSections(scenarioContent)
      : new Map<string, string>();

    // Group selections by section and type
    const selectionsBySection = this.groupBySection(contentSelections);

    // Build placeholder context
    const placeholderContext: PlaceholderContext = {
      intake,
      calculated: this.buildCalculatedValues(driverState),
      custom: {}
    };

    // Process each section in order
    for (let sectionNum = 0; sectionNum <= 11; sectionNum++) {
      // Check if section is suppressed by L1 rules (A_BLOCK_TREATMENT_OPTIONS)
      if (l1SuppressedSections.has(sectionNum)) {
        suppressedSections.push(sectionNum);
        continue;
      }

      const sectionSelections = selectionsBySection.get(sectionNum) || [];
      const sectionRule = rules.sections[sectionNum.toString()];

      // Check if section is entirely suppressed by content selections
      const allSuppressed = sectionSelections.length > 0 &&
        sectionSelections.every(s => s.suppressed);

      if (allSuppressed && sectionSelections.length > 0) {
        suppressedSections.push(sectionNum);
        continue;
      }

      // Get active (non-suppressed) selections
      const activeSelections = sectionSelections.filter(s => !s.suppressed);

      // Determine tone for this section
      const sectionTone = sectionRule?.toneOverride ??
        toneSelector.getToneForSection(selectedTone, sectionNum);

      // Compose section content using ordered assembly
      const sectionContent = await this.composeSectionOrdered(
        sectionNum,
        activeSelections,
        sectionTone,
        placeholderContext,
        scenarioMatch.confidence,
        scenarioSections,
        sectionRule || DEFAULT_RULES.sections[sectionNum.toString()]
      );

      if (sectionContent && sectionContent.content.trim().length > 0) {
        // Track warnings
        if (sectionNum === 0 && sectionContent.content.length > 0) {
          warningsIncluded = true;
        }

        // Track placeholders
        placeholdersResolved += sectionContent.placeholdersResolved;
        placeholdersUnresolved.push(...sectionContent.placeholdersUnresolved);

        // Count words
        const wordCount = this.countWords(sectionContent.content);
        totalWordCount += wordCount;

        sections.push({
          section_number: sectionNum,
          section_name: SECTION_NAMES[sectionNum] || `Section ${sectionNum}`,
          content: sectionContent.content,
          sources: sectionContent.sources,
          word_count: wordCount
        });
      }
    }

    return {
      session_id: intake.session_id,
      scenario_id: scenarioMatch.matched_scenario,
      tone: selectedTone,
      confidence: scenarioMatch.confidence,
      sections,
      total_word_count: totalWordCount,
      warnings_included: warningsIncluded,
      suppressed_sections: suppressedSections,
      placeholders_resolved: placeholdersResolved,
      placeholders_unresolved: [...new Set(placeholdersUnresolved)]
    };
  }

  /**
   * Group selections by target section
   */
  private groupBySection(selections: ContentSelection[]): Map<number, ContentSelection[]> {
    const grouped = new Map<number, ContentSelection[]>();

    for (const selection of selections) {
      const existing = grouped.get(selection.target_section) || [];
      existing.push(selection);
      grouped.set(selection.target_section, existing);
    }

    // Sort each group by priority (lower = higher priority)
    for (const [section, items] of grouped) {
      items.sort((a, b) => a.priority - b.priority);
      grouped.set(section, items);
    }

    return grouped;
  }

  /**
   * Compose a single section using ordered assembly rules
   */
  private async composeSectionOrdered(
    sectionNum: number,
    selections: ContentSelection[],
    tone: ToneProfileId,
    context: PlaceholderContext,
    confidence: ConfidenceLevel,
    scenarioSections: Map<string, string>,
    rule: SectionRule
  ): Promise<{
    content: string;
    sources: string[];
    placeholdersResolved: number;
    placeholdersUnresolved: string[];
  } | null> {
    const contentParts: string[] = [];
    const sources: string[] = [];
    let totalResolved = 0;
    const allUnresolved: string[] = [];

    // Add uncertainty language if needed (for certain sections)
    if ([2, 3, 4].includes(sectionNum) && confidence !== "HIGH") {
      const uncertaintyPhrases = CONFIDENCE_LANGUAGE[confidence];
      if (uncertaintyPhrases.length > 0) {
        contentParts.push(uncertaintyPhrases[0]);
      }
    }

    // Group selections by type for ordered processing
    const selectionsByType = new Map<ContentType, ContentSelection[]>();
    for (const sel of selections) {
      const existing = selectionsByType.get(sel.type) || [];
      existing.push(sel);
      selectionsByType.set(sel.type, existing);
    }

    // Check if scenario has content for this section (used to skip B_* fallbacks)
    const keysToTry = [rule.scenarioSection, ...(rule.scenarioSectionAlt || [])].filter(Boolean) as string[];
    const scenarioHasContent = keysToTry.some(key => scenarioSections.has(key));

    // Process in order defined by rule
    for (const sourceType of rule.order) {
      if (sourceType === "static") {
        // Handle static content
        const staticContent = await this.getStaticContent(sectionNum, tone);
        if (staticContent) {
          const resolved = this.placeholderResolver.resolve(staticContent, context);
          contentParts.push(resolved.content);
          totalResolved += resolved.resolved.length;
          allUnresolved.push(...resolved.unresolved);
          sources.push(`STATIC_${sectionNum}`);
        }
      } else if (sourceType === "scenario") {
        // Handle scenario section content
        // Try primary key first, then alternates
        const keysToTry = [rule.scenarioSection, ...(rule.scenarioSectionAlt || [])].filter(Boolean) as string[];
        let foundContent = false;

        for (const scenarioKey of keysToTry) {
          if (scenarioSections.has(scenarioKey)) {
            const scenarioContent = scenarioSections.get(scenarioKey)!;
            const resolved = this.placeholderResolver.resolve(scenarioContent, context);
            contentParts.push(resolved.content);
            totalResolved += resolved.resolved.length;
            allUnresolved.push(...resolved.unresolved);
            sources.push(`SCENARIO:${scenarioKey}`);
            foundContent = true;
            break;  // Only use first matching key
          }
        }
      } else {
        // Handle block types (a_block, b_block, module)
        // Skip b_block when scenario has content for this section (b_block is fallback)
        if (sourceType === "b_block" && scenarioHasContent) {
          continue;  // Scenario takes precedence over B_* blocks
        }

        const typeSelections = selectionsByType.get(sourceType) || [];

        // Apply cardinality limits
        const maxItems = rule.maxCardinality?.[sourceType] ?? Infinity;
        const limitedSelections = typeSelections.slice(0, maxItems);

        for (const selection of limitedSelections) {
          const rawContent = await this.contentStore.getContent(
            selection.content_id,
            selection.tone
          );

          if (rawContent) {
            const resolved = this.placeholderResolver.resolve(rawContent, context);
            contentParts.push(resolved.content);
            totalResolved += resolved.resolved.length;
            allUnresolved.push(...resolved.unresolved);
            sources.push(selection.content_id);
          }
        }
      }
    }

    if (contentParts.length === 0) {
      return null;
    }

    return {
      content: contentParts.join("\n\n"),
      sources,
      placeholdersResolved: totalResolved,
      placeholdersUnresolved: allUnresolved
    };
  }

  /**
   * Get static content for a section
   */
  private async getStaticContent(sectionNum: number, tone: ToneProfileId): Promise<string | null> {
    if (sectionNum === 1) {
      // Try to load from content store first
      const content = await this.contentStore.getContent("STATIC_DISCLAIMER", tone);
      return content || this.getDisclaimerContent();
    }
    if (sectionNum === 11) {
      // Try to load from content store first
      const content = await this.contentStore.getContent("STATIC_NEXT_STEPS", tone);
      return content || this.getNextStepsContent(tone);
    }
    return null;
  }

  /**
   * Get fallback disclaimer content
   */
  private getDisclaimerContent(): string {
    return `This report is generated based on your responses to our questionnaire and is intended for informational purposes only. It does not constitute medical advice, diagnosis, or treatment recommendations.

Please consult with a qualified dental professional before making any decisions about your dental care. Your dentist will conduct a thorough examination and provide personalized recommendations based on your specific situation.

The information presented here is general in nature and may not apply to your individual circumstances. Treatment outcomes vary between patients and depend on many factors that can only be assessed through clinical examination.`;
  }

  /**
   * Get fallback next steps content
   */
  private getNextStepsContent(tone: ToneProfileId): string {
    return `**Your next steps are entirely up to you.** Here are some options to consider:

- Review this report at your own pace
- Prepare questions for your dental consultation
- Schedule an appointment when you feel ready
- Request additional information on specific topics

Remember, this is your journey. Take the time you need to make decisions that feel right for you.

## How to Prepare for Your Consultation

Consider noting down:
- Your main concerns and priorities
- Questions about specific treatment options
- Your timeline preferences
- Budget considerations you'd like to discuss

The choice of how to proceed is yours. Your dentist is there to provide information and guidance, but you remain in control of your dental care decisions.`;
  }

  /**
   * Build calculated values for placeholders
   */
  private buildCalculatedValues(driverState: DriverState): Record<string, string | number> {
    const calculated: Record<string, string | number> = {};

    // Add driver-based calculations
    const mouthSituation = driverState.drivers.mouth_situation?.value;
    if (mouthSituation === "single_missing_tooth") {
      calculated["TREATMENT_COMPLEXITY"] = "straightforward";
      calculated["ESTIMATED_VISITS"] = "3-5 appointments";
    } else if (mouthSituation === "multiple_adjacent" || mouthSituation === "multiple_dispersed") {
      calculated["TREATMENT_COMPLEXITY"] = "moderate";
      calculated["ESTIMATED_VISITS"] = "5-8 appointments";
    } else if (mouthSituation === "extensive_missing" || mouthSituation === "full_mouth_compromised") {
      calculated["TREATMENT_COMPLEXITY"] = "comprehensive";
      calculated["ESTIMATED_VISITS"] = "multiple appointments over several months";
    }

    return calculated;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * Set custom content store
   */
  setContentStore(store: ContentStore): void {
    this.contentStore = store;
  }

  /**
   * Clear cached rules (for testing)
   */
  clearRulesCache(): void {
    this.rules = null;
  }
}

export const reportComposer = new ReportComposer();
