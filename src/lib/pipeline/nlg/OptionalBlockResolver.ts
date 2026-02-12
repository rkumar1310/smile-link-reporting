/**
 * Optional Block Resolver
 * Resolves OPTIONAL_*_TAG_BLOCK variables using existing ContentSelector logic
 * and loads content from A_blocks and TM_modules
 */

import type { DriverState, ToneProfileId, SupportedLanguage } from "../types";
import type { NLGVariable, ResolvedVariable } from "./types";
import { promises as fs } from "fs";
import path from "path";

// =============================================================================
// BLOCK MAPPINGS
// =============================================================================

/**
 * Maps NLG optional block variables to content triggers
 * Each variable can be populated by multiple A_blocks or TM_modules
 */
interface BlockTrigger {
  contentId: string;
  type: "a_block" | "module";
  driverTrigger?: { driver: string; values: string[] };
  tagTrigger?: string;
  priority: number; // Lower = higher priority
}

const OPTIONAL_BLOCK_MAPPINGS: Record<NLGVariable, BlockTrigger[]> = {
  // ==========================================================================
  // OPTIONAL_SITUATION_TAG_BLOCK
  // Warnings and safety notices for Block 1
  // ==========================================================================
  OPTIONAL_SITUATION_TAG_BLOCK: [
    // High priority safety warnings
    {
      contentId: "A_WARN_ACTIVE_SYMPTOMS",
      type: "a_block",
      driverTrigger: { driver: "clinical_priority", values: ["urgent", "semi_urgent"] },
      priority: 1
    },
    {
      contentId: "A_WARN_PREGNANCY_OR_GROWTH",
      type: "a_block",
      driverTrigger: { driver: "medical_constraints", values: ["pregnancy_related"] },
      priority: 2
    },
    {
      contentId: "TM_PREGNANCY",
      type: "module",
      tagTrigger: "pregnancy_yes",
      priority: 3
    },
    {
      contentId: "TM_PREGNANCY",
      type: "module",
      tagTrigger: "pregnancy_planning",
      priority: 3
    },
    {
      contentId: "A_WARN_BIOLOGICAL_INSTABILITY",
      type: "a_block",
      driverTrigger: { driver: "biological_stability", values: ["unstable", "compromised"] },
      priority: 4
    },
    {
      contentId: "A_BLOCK_TREATMENT_OPTIONS",
      type: "a_block",
      driverTrigger: { driver: "medical_constraints", values: ["surgical_contraindicated"] },
      priority: 5
    }
  ],

  // ==========================================================================
  // OPTIONAL_RESULT_TAG_BLOCK
  // Contextual info affecting expected results (Block 4)
  // ==========================================================================
  OPTIONAL_RESULT_TAG_BLOCK: [
    {
      contentId: "TM_SMOKING",
      type: "module",
      tagTrigger: "smoking_daily",
      priority: 1
    },
    {
      contentId: "TM_SMOKING",
      type: "module",
      tagTrigger: "smoking_weekly",
      priority: 2
    },
    {
      contentId: "TM_BRUXISM",
      type: "module",
      tagTrigger: "tooth_health_bruxism",
      priority: 3
    },
    {
      contentId: "TM_DENTAL_ANXIETY",
      type: "module",
      driverTrigger: { driver: "anxiety_level", values: ["severe"] },
      priority: 4
    }
  ],

  // ==========================================================================
  // OPTIONAL_DURATION_TAG_BLOCK
  // Factors affecting treatment duration (Block 5)
  // ==========================================================================
  OPTIONAL_DURATION_TAG_BLOCK: [
    {
      contentId: "TM_PERIODONTITIS",
      type: "module",
      tagTrigger: "history_periodontal",
      priority: 1
    },
    {
      contentId: "TM_BONE_LOSS",
      type: "module",
      tagTrigger: "issue_gum_recession",
      priority: 2
    },
    {
      contentId: "TM_POOR_HYGIENE",
      type: "module",
      tagTrigger: "hygiene_poor",
      priority: 3
    },
    {
      contentId: "TM_POOR_HYGIENE",
      type: "module",
      tagTrigger: "hygiene_irregular",
      priority: 4
    }
  ],

  // ==========================================================================
  // OPTIONAL_PRICE_TAG_BLOCK
  // Budget and cost context (Block 7)
  // ==========================================================================
  OPTIONAL_PRICE_TAG_BLOCK: [
    {
      contentId: "TM_BUDGET_LOW",
      type: "module",
      driverTrigger: { driver: "budget_type", values: ["economy"] },
      priority: 1
    },
    {
      contentId: "TM_BUDGET_FLEXIBLE",
      type: "module",
      driverTrigger: { driver: "budget_type", values: ["balanced"] },
      priority: 2
    },
    {
      contentId: "TM_BUDGET_PREMIUM",
      type: "module",
      driverTrigger: { driver: "budget_type", values: ["premium"] },
      priority: 3
    },
    {
      contentId: "A_WARN_BUDGET",
      type: "a_block",
      driverTrigger: { driver: "budget_type", values: ["economy", "unknown"] },
      priority: 4
    }
  ],

  // ==========================================================================
  // OPTIONAL_RECOVERY_TAG_BLOCK
  // Recovery considerations (Block 8)
  // ==========================================================================
  OPTIONAL_RECOVERY_TAG_BLOCK: [
    {
      contentId: "TM_SMOKING",
      type: "module",
      tagTrigger: "smoking_daily",
      priority: 1
    },
    {
      contentId: "A_WARN_RISK_FACTORS",
      type: "a_block",
      driverTrigger: { driver: "risk_profile_biological", values: ["elevated"] },
      priority: 2
    },
    {
      contentId: "TM_DIABETES",
      type: "module",
      tagTrigger: "medical_conditions_yes",
      priority: 3
    },
    {
      contentId: "TM_GENERAL_HEALTH",
      type: "module",
      driverTrigger: { driver: "risk_profile_biological", values: ["elevated"] },
      priority: 4
    }
  ],

  // ==========================================================================
  // OPTIONAL_NEXT_STEPS_TAG_BLOCK
  // Next steps context (Block 9)
  // ==========================================================================
  OPTIONAL_NEXT_STEPS_TAG_BLOCK: [
    {
      contentId: "TM_DENTAL_ANXIETY",
      type: "module",
      driverTrigger: { driver: "anxiety_level", values: ["severe", "mild"] },
      priority: 1
    },
    {
      contentId: "TM_CTX_FIRST_TIME",
      type: "module",
      driverTrigger: { driver: "experience_history", values: ["first_timer"] },
      priority: 2
    },
    {
      contentId: "TM_CTX_PREVIOUS_TREATMENT",
      type: "module",
      driverTrigger: { driver: "experience_history", values: ["experienced"] },
      priority: 3
    }
  ]
} as Record<NLGVariable, BlockTrigger[]>;

// Content paths
const CONTENT_BASE_PATH = process.cwd();

// =============================================================================
// OPTIONAL BLOCK RESOLVER CLASS
// =============================================================================

export class OptionalBlockResolver {
  private contentCache = new Map<string, string>();

  /**
   * Resolve a single optional block variable
   */
  async resolveVariable(
    variable: NLGVariable,
    driverState: DriverState,
    tags: Set<string>,
    language: SupportedLanguage,
    _tone: ToneProfileId
  ): Promise<ResolvedVariable> {
    const triggers = OPTIONAL_BLOCK_MAPPINGS[variable];

    if (!triggers) {
      return {
        variable,
        value: "",
        status: "empty",
        source: "no_mapping"
      };
    }

    // Find all triggered blocks
    const triggeredBlocks: { contentId: string; type: string; priority: number }[] = [];

    for (const trigger of triggers) {
      let shouldTrigger = false;

      // Check driver trigger
      if (trigger.driverTrigger) {
        const driverValue = driverState.drivers[trigger.driverTrigger.driver as keyof typeof driverState.drivers];
        if (driverValue && trigger.driverTrigger.values.includes(driverValue.value)) {
          shouldTrigger = true;
        }
      }

      // Check tag trigger
      if (trigger.tagTrigger && tags.has(trigger.tagTrigger)) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        triggeredBlocks.push({
          contentId: trigger.contentId,
          type: trigger.type,
          priority: trigger.priority
        });
      }
    }

    if (triggeredBlocks.length === 0) {
      return {
        variable,
        value: "",
        status: "empty",
        source: "no_triggers_matched"
      };
    }

    // Sort by priority and deduplicate
    triggeredBlocks.sort((a, b) => a.priority - b.priority);
    const uniqueBlocks = [...new Map(triggeredBlocks.map(b => [b.contentId, b])).values()];

    // Load and concatenate content (limit to top 2 to avoid bloat)
    const contentPieces: string[] = [];
    const sources: string[] = [];

    for (const block of uniqueBlocks.slice(0, 2)) {
      const content = await this.loadContent(block.contentId, block.type, language);
      if (content) {
        contentPieces.push(content);
        sources.push(`${block.type}:${block.contentId}`);
      }
    }

    if (contentPieces.length === 0) {
      return {
        variable,
        value: "",
        status: "missing_data",
        source: "content_not_found"
      };
    }

    return {
      variable,
      value: contentPieces.join("\n\n"),
      status: "resolved",
      source: sources.join(", ")
    };
  }

  /**
   * Load content from file system
   */
  private async loadContent(
    contentId: string,
    type: string,
    language: SupportedLanguage
  ): Promise<string | null> {
    const cacheKey = `${contentId}:${type}:${language}`;

    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey) || null;
    }

    // Determine file path based on type
    let filePath: string;

    if (type === "a_block") {
      // A_blocks are at content/a_blocks/BLOCK_ID.md or content/a_blocks/BLOCK_ID/en/TP-01.md
      const simplePath = path.join(CONTENT_BASE_PATH, "content", "a_blocks", `${contentId}.md`);
      const tonePath = path.join(CONTENT_BASE_PATH, "content", "a_blocks", contentId, language, "TP-01.md");

      // Try simple path first
      try {
        await fs.access(simplePath);
        filePath = simplePath;
      } catch {
        filePath = tonePath;
      }
    } else {
      // Modules are at content/modules/MODULE_ID.md or content/modules/MODULE_ID/en/TP-01.md
      const simplePath = path.join(CONTENT_BASE_PATH, "content", "modules", `${contentId}.md`);
      const tonePath = path.join(CONTENT_BASE_PATH, "content", "modules", contentId, language, "TP-01.md");

      try {
        await fs.access(simplePath);
        filePath = simplePath;
      } catch {
        filePath = tonePath;
      }
    }

    try {
      const rawContent = await fs.readFile(filePath, "utf-8");

      // Remove frontmatter if present
      const content = this.stripFrontmatter(rawContent);

      this.contentCache.set(cacheKey, content);
      return content;
    } catch (error) {
      console.warn(`[OptionalBlockResolver] Content not found: ${filePath}`);
      return null;
    }
  }

  /**
   * Strip YAML frontmatter from content
   */
  private stripFrontmatter(content: string): string {
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n*/;
    return content.replace(frontmatterRegex, "").trim();
  }

  /**
   * Resolve all optional block variables
   */
  async resolveAll(
    driverState: DriverState,
    tags: Set<string>,
    language: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<Map<NLGVariable, ResolvedVariable>> {
    const results = new Map<NLGVariable, ResolvedVariable>();

    const optionalVariables: NLGVariable[] = [
      "OPTIONAL_SITUATION_TAG_BLOCK",
      "OPTIONAL_RESULT_TAG_BLOCK",
      "OPTIONAL_DURATION_TAG_BLOCK",
      "OPTIONAL_PRICE_TAG_BLOCK",
      "OPTIONAL_RECOVERY_TAG_BLOCK",
      "OPTIONAL_NEXT_STEPS_TAG_BLOCK"
    ];

    for (const variable of optionalVariables) {
      const resolved = await this.resolveVariable(variable, driverState, tags, language, tone);
      results.set(variable, resolved);
    }

    return results;
  }

  /**
   * Get list of variables this resolver handles
   */
  getHandledVariables(): NLGVariable[] {
    return [
      "OPTIONAL_SITUATION_TAG_BLOCK",
      "OPTIONAL_RESULT_TAG_BLOCK",
      "OPTIONAL_DURATION_TAG_BLOCK",
      "OPTIONAL_PRICE_TAG_BLOCK",
      "OPTIONAL_RECOVERY_TAG_BLOCK",
      "OPTIONAL_NEXT_STEPS_TAG_BLOCK"
    ];
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear();
  }
}

export const optionalBlockResolver = new OptionalBlockResolver();
