/**
 * Report Composer
 * Assembles the final report from selected content blocks
 * Implements ordered assembly per section as defined in Composition_Contract_v1.md
 * Adapted for Next.js from documents/src/composition/ReportComposer.ts
 */

import type {
  DriverState,
  ToneProfileId,
  ConfidenceLevel,
  ContentSelection,
  ContentType,
  ReportSection,
  ComposedReport,
  ScenarioMatchResult,
  IntakeData,
  SupportedLanguage,
  ScenarioSections,
  ScenarioSectionKey
} from "../types";
import { DEFAULT_LANGUAGE } from "../types";

import { PlaceholderResolver, type PlaceholderContext } from "./PlaceholderResolver";
import { toneSelector } from "../engines/ToneSelector";

import sectionCompositionRules from "../config/section-composition-rules.json";
import languagesConfig from "../config/languages.json";

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

// Language configuration type
interface LanguageConfig {
  supported_languages: string[];
  default_language: string;
  section_names: Record<string, Record<string, string>>;
  confidence_language: Record<string, Record<string, string[]>>;
}

// Default section names (English fallback)
const DEFAULT_SECTION_NAMES: Record<number, string> = {
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
  MEDIUM: [],
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
  getContent(contentId: string, tone: ToneProfileId, language?: SupportedLanguage): Promise<string | null>;
  /** Get structured scenario sections - returns typed data, no parsing needed */
  getScenarioSections?(contentId: string, tone: ToneProfileId, language?: SupportedLanguage): Promise<ScenarioSections | null>;
}

// Mock content store for development
class MockContentStore implements ContentStore {
  async getContent(contentId: string, tone: ToneProfileId, language?: SupportedLanguage): Promise<string | null> {
    // Return placeholder content for now
    return `[Content: ${contentId} in tone ${tone} lang ${language ?? "en"}]`;
  }
}

export class ReportComposer {
  private placeholderResolver: PlaceholderResolver;
  private contentStore: ContentStore;
  private rules: CompositionRules;
  private languageConfig: LanguageConfig | null;

  constructor(contentStore?: ContentStore) {
    this.placeholderResolver = new PlaceholderResolver();
    this.contentStore = contentStore ?? new MockContentStore();
    this.rules = sectionCompositionRules as CompositionRules;
    this.languageConfig = languagesConfig as LanguageConfig;
  }

  /**
   * Get section name for a given section number and language
   */
  private getSectionName(sectionNum: number, language: SupportedLanguage): string {
    const langConfig = this.languageConfig;
    if (langConfig?.section_names?.[language]?.[sectionNum.toString()]) {
      return langConfig.section_names[language][sectionNum.toString()];
    }
    // Fall back to English from config, then default
    if (langConfig?.section_names?.["en"]?.[sectionNum.toString()]) {
      return langConfig.section_names["en"][sectionNum.toString()];
    }
    return DEFAULT_SECTION_NAMES[sectionNum] || `Section ${sectionNum}`;
  }

  /**
   * Get confidence language phrases for a given confidence level and language
   */
  private getConfidenceLanguage(confidence: ConfidenceLevel, language: SupportedLanguage): string[] {
    const langConfig = this.languageConfig;
    if (langConfig?.confidence_language?.[language]?.[confidence]) {
      return langConfig.confidence_language[language][confidence];
    }
    // Fall back to default English
    return CONFIDENCE_LANGUAGE[confidence] || [];
  }

  /**
   * Compose the final report with ordered assembly
   * @param scenarioSections - Structured scenario sections (typed, no parsing needed)
   */
  async compose(
    intake: IntakeData,
    driverState: DriverState,
    scenarioMatch: ScenarioMatchResult,
    contentSelections: ContentSelection[],
    selectedTone: ToneProfileId,
    language: SupportedLanguage = DEFAULT_LANGUAGE,
    scenarioSections?: ScenarioSections
  ): Promise<ComposedReport> {
    const rules = this.rules || DEFAULT_RULES;
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

    // Group selections by section and type
    const selectionsBySection = this.groupBySection(contentSelections);

    // Build placeholder context with calculated values from intake
    const placeholderContext: PlaceholderContext = {
      intake,
      calculated: this.buildCalculatedValues(driverState, intake),
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
        scenarioSections,  // Now typed as ScenarioSections | undefined
        sectionRule || DEFAULT_RULES.sections[sectionNum.toString()],
        language
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
          section_name: this.getSectionName(sectionNum, language),
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
      language,
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
   * @param scenarioSections - Typed scenario sections (direct property access, no Map lookup)
   */
  private async composeSectionOrdered(
    sectionNum: number,
    selections: ContentSelection[],
    tone: ToneProfileId,
    context: PlaceholderContext,
    confidence: ConfidenceLevel,
    scenarioSections: ScenarioSections | undefined,
    rule: SectionRule,
    language: SupportedLanguage = DEFAULT_LANGUAGE
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
      const uncertaintyPhrases = this.getConfidenceLanguage(confidence, language);
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
    // With typed sections, we can directly check the property
    const scenarioKey = rule.scenarioSection as ScenarioSectionKey | null;
    const scenarioHasContent = scenarioKey && scenarioSections
      ? Boolean(scenarioSections[scenarioKey]?.trim())
      : false;

    // Process in order defined by rule
    for (const sourceType of rule.order) {
      if (sourceType === "static") {
        // Handle static content
        const staticContent = await this.getStaticContent(sectionNum, tone, language);
        if (staticContent) {
          const resolved = this.placeholderResolver.resolve(staticContent, context);
          contentParts.push(resolved.content);
          totalResolved += resolved.resolved.length;
          allUnresolved.push(...resolved.unresolved);
          sources.push(`STATIC_${sectionNum}`);
        }
      } else if (sourceType === "scenario") {
        // Handle scenario section content - direct typed access
        if (scenarioKey && scenarioSections) {
          const scenarioContent = scenarioSections[scenarioKey];
          if (scenarioContent?.trim()) {
            const resolved = this.placeholderResolver.resolve(scenarioContent, context);
            contentParts.push(resolved.content);
            totalResolved += resolved.resolved.length;
            allUnresolved.push(...resolved.unresolved);
            sources.push(`SCENARIO:${scenarioKey}`);
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
            selection.tone,
            language
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
  private async getStaticContent(sectionNum: number, tone: ToneProfileId, language: SupportedLanguage = DEFAULT_LANGUAGE): Promise<string | null> {
    if (sectionNum === 1) {
      // Try to load from content store first
      const content = await this.contentStore.getContent("STATIC_DISCLAIMER", tone, language);
      return content || this.getDisclaimerContent();
    }
    if (sectionNum === 11) {
      // Try to load from content store first
      const content = await this.contentStore.getContent("STATIC_NEXT_STEPS", tone, language);
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
   * Build calculated values for placeholders from driver state and intake
   */
  private buildCalculatedValues(
    driverState: DriverState,
    intake?: IntakeData
  ): Record<string, string | number> {
    const calculated: Record<string, string | number> = {};

    // ========================================
    // Mouth situation → Treatment complexity
    // ========================================
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

    // ========================================
    // Extract values from intake answers
    // ========================================
    if (intake?.answers) {
      const getAnswer = (qId: string): string | string[] | undefined => {
        const qa = intake.answers.find(a => a.question_id === qId);
        return qa?.answer;
      };

      // Q6b: Tooth zone (visible vs chewing)
      const toothZone = getAnswer("Q6b");
      if (toothZone === "front_visible" || toothZone === "anterior") {
        calculated["TOOTH_ZONE"] = "a visible area";
        calculated["TOOTH_ZONE_DESCRIPTION"] = "A missing tooth in a visible area";
      } else if (toothZone === "side_chewing" || toothZone === "posterior") {
        calculated["TOOTH_ZONE"] = "the chewing area";
        calculated["TOOTH_ZONE_DESCRIPTION"] = "A missing tooth in the chewing area";
      } else if (toothZone === "both_areas" || toothZone === "mixed") {
        calculated["TOOTH_ZONE"] = "both visible and chewing areas";
        calculated["TOOTH_ZONE_DESCRIPTION"] = "Your missing teeth in multiple areas";
      }

      // Q1: Primary concern/motivation
      const motivation = getAnswer("Q1");
      if (motivation === "confidence_smile") {
        calculated["PRIMARY_CONCERN"] = "improving confidence in your smile";
      } else if (motivation === "missing_teeth_long_term") {
        calculated["PRIMARY_CONCERN"] = "addressing a long-term gap from missing teeth";
      } else if (motivation === "function_chewing") {
        calculated["PRIMARY_CONCERN"] = "restoring comfortable chewing function";
      } else if (motivation === "pain_discomfort") {
        calculated["PRIMARY_CONCERN"] = "resolving discomfort or pain";
      } else if (motivation === "aesthetic_damage") {
        calculated["PRIMARY_CONCERN"] = "repairing visible damage to teeth";
      }

      // Q12: Timeline/decision stage
      const timeline = getAnswer("Q12");
      if (timeline === "within_month" || timeline === "1_3_months") {
        calculated["TIMELINE_PREFERENCE"] = "relatively soon";
        calculated["DECISION_STAGE_DESCRIPTION"] = "ready to move forward";
      } else if (timeline === "3_6_months" || timeline === "6_12_months") {
        calculated["TIMELINE_PREFERENCE"] = "in the coming months";
        calculated["DECISION_STAGE_DESCRIPTION"] = "taking time to decide";
      } else if (timeline === "still_exploring" || timeline === "no_rush") {
        calculated["TIMELINE_PREFERENCE"] = "when you feel ready";
        calculated["DECISION_STAGE_DESCRIPTION"] = "still exploring options";
      }

      // Q10: Budget approach
      const budget = getAnswer("Q10");
      if (budget === "price_quality_flexible") {
        calculated["BUDGET_APPROACH"] = "flexibility when quality matters";
      } else if (budget === "best_available" || budget === "premium") {
        calculated["BUDGET_APPROACH"] = "prioritizing quality and durability";
      } else if (budget === "budget_conscious" || budget === "economy") {
        calculated["BUDGET_APPROACH"] = "finding cost-effective solutions";
      } else if (budget === "balanced") {
        calculated["BUDGET_APPROACH"] = "balancing cost and quality";
      }

      // Q4: Experience context
      const experience = getAnswer("Q4");
      if (Array.isArray(experience)) {
        if (experience.includes("no_never")) {
          calculated["EXPERIENCE_CONTEXT"] = "As this is your first time considering dental treatment";
        } else if (experience.includes("implant_yes") || experience.includes("crown_bridge_yes")) {
          calculated["EXPERIENCE_CONTEXT"] = "Given your previous dental treatment experience";
        }
      } else if (experience === "no_never") {
        calculated["EXPERIENCE_CONTEXT"] = "As this is your first time considering dental treatment";
      }

      // Q9: Age bracket
      const age = getAnswer("Q9");
      if (age === "under_30" || age === "18_29") {
        calculated["AGE_BRACKET"] = "younger adults";
      } else if (age === "30_45" || age === "30_49") {
        calculated["AGE_BRACKET"] = "adults in their 30s and 40s";
      } else if (age === "45_60" || age === "50_64") {
        calculated["AGE_BRACKET"] = "adults in their 50s and 60s";
      } else if (age === "over_60" || age === "65_plus") {
        calculated["AGE_BRACKET"] = "older adults";
      }
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
}

export const reportComposer = new ReportComposer();
