/**
 * Content Selector
 * Selects appropriate content blocks based on driver state and scenario
 */

import type {
  DriverId,
  DriverState,
  ToneProfileId,
  ContentType,
  ContentSelection,
  ScenarioMatchResult
} from "../types/index.js";

// Section configuration
const SECTION_CONFIG = {
  0: { name: "Warnings", sources: ["a_block"], required: false },
  1: { name: "Disclaimer", sources: ["static"], required: true },
  2: { name: "Personal Summary", sources: ["scenario"], required: true },
  3: { name: "Context", sources: ["b_block", "module"], required: true },
  4: { name: "Interpretation", sources: ["b_block"], required: true },
  5: { name: "Options", sources: ["b_block"], required: false, suppressible: true },
  6: { name: "Comparison", sources: ["b_block"], required: false, suppressible: true },
  7: { name: "Trade-offs", sources: ["b_block"], required: false, suppressible: true },
  8: { name: "Process", sources: ["b_block"], required: false, suppressible: true },
  9: { name: "Costs", sources: ["b_block", "calculated"], required: false, suppressible: true },
  10: { name: "Risk Language", sources: ["b_block", "module"], required: true },
  11: { name: "Next Steps", sources: ["static"], required: true }
} as const;

// L1 Override rules
const L1_SUPPRESSION_RULES: Record<string, { blocks: string[]; sections: number[] }> = {
  "clinical_priority:urgent": {
    blocks: ["B_OPT_*", "B_COMPARE_*", "B_PROCESS_*"],
    sections: [5, 6, 7, 8, 9]
  },
  "clinical_priority:semi_urgent": {
    blocks: ["B_COMPARE_*"],
    sections: [6, 7]
  },
  "medical_constraints:pregnancy_related": {
    blocks: ["B_OPT_IMPLANT", "B_PROCESS_IMPLANT"],
    sections: []
  },
  "medical_constraints:surgical_contraindicated": {
    blocks: ["B_OPT_*", "B_COMPARE_*", "B_PROCESS_*"],
    sections: [5, 6, 7, 8, 9]
  },
  "biological_stability:unstable": {
    blocks: [],
    sections: []
  },
  "biological_stability:compromised": {
    blocks: ["B_COMPARE_*"],
    sections: [6]
  }
};

// A_* block triggers
const A_BLOCK_TRIGGERS: Record<string, { driver: DriverId; values: string[] }> = {
  "A_WARN_ACTIVE_SYMPTOMS": { driver: "clinical_priority", values: ["urgent", "semi_urgent"] },
  "A_WARN_PREGNANCY_OR_GROWTH": { driver: "medical_constraints", values: ["pregnancy_related"] },
  "A_WARN_BIOLOGICAL_INSTABILITY": { driver: "biological_stability", values: ["unstable", "compromised"] },
  "A_BLOCK_TREATMENT_OPTIONS": { driver: "medical_constraints", values: ["surgical_contraindicated"] },
  "A_WARN_RISK_FACTORS": { driver: "risk_profile_biological", values: ["elevated"] },
  "A_WARN_INCOMPLETE_ASSESSMENT": { driver: "clinical_priority", values: ["unknown"] }
};

// B_* block triggers (by section)
const B_BLOCK_TRIGGERS: Record<string, { section: number; driver: DriverId; values: string[] }> = {
  "B_CTX_SINGLE_TOOTH": { section: 3, driver: "mouth_situation", values: ["single_missing_tooth"] },
  "B_CTX_MULTIPLE_TEETH": { section: 3, driver: "mouth_situation", values: ["multiple_adjacent", "multiple_dispersed", "mixed_pattern"] },
  "B_CTX_GENERAL": { section: 3, driver: "mouth_situation", values: ["no_missing_teeth", "complex"] },
  "B_INTERP_STANDARD": { section: 4, driver: "profile_type", values: ["aesthetic", "functional", "mixed", "comfort"] },
  "B_OPT_IMPLANT": { section: 5, driver: "mouth_situation", values: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed"] },
  "B_OPT_BRIDGE": { section: 5, driver: "mouth_situation", values: ["single_missing_tooth", "multiple_adjacent"] },
  "B_COMPARE_IMPLANT_VS_BRIDGE": { section: 6, driver: "mouth_situation", values: ["single_missing_tooth", "multiple_adjacent"] },
  "B_RISKLANG_STANDARD": { section: 10, driver: "risk_profile_biological", values: ["low", "moderate"] },
  "B_RISKLANG_ELEVATED": { section: 10, driver: "risk_profile_biological", values: ["elevated"] }
};

// Text module triggers
// priority: 0 = prepend (before scenario), 2 = append (after scenario), default is 2
const MODULE_TRIGGERS: Record<string, { sections: number[]; driver?: DriverId; values?: string[]; tag?: string; priority?: number }> = {
  "TM_RISK_SMOKING": { sections: [3, 10], tag: "smoking_daily" },
  "TM_RISK_DIABETES": { sections: [3, 10], tag: "diabetes_yes" },
  "TM_CTX_FIRST_TIME": { sections: [3], driver: "experience_history", values: ["first_timer"] },
  "TM_CTX_PREVIOUS_TREATMENT": { sections: [3], driver: "experience_history", values: ["experienced"] },
  "TM_BUDGET_LIMITED": { sections: [9], driver: "budget_type", values: ["economy"] },
  "TM_BUDGET_FLEXIBLE": { sections: [9], driver: "budget_type", values: ["balanced"] },
  "TM_BUDGET_PREMIUM": { sections: [9], driver: "budget_type", values: ["premium"] },
  "TM_ANXIETY_SEVERE": { sections: [2], driver: "anxiety_level", values: ["severe"], priority: 0 }
};

export class ContentSelector {
  /**
   * Select all content blocks for a report
   */
  select(
    driverState: DriverState,
    scenarioMatch: ScenarioMatchResult,
    tone: ToneProfileId,
    tags: Set<string> = new Set()
  ): ContentSelection[] {
    const selections: ContentSelection[] = [];

    // Determine L1 suppressions
    const suppressedSections = this.getL1SuppressedSections(driverState);
    const suppressedBlockPatterns = this.getL1SuppressedBlocks(driverState);

    // Select A_* blocks (warnings)
    const aBlocks = this.selectABlocks(driverState, tone, suppressedBlockPatterns);
    selections.push(...aBlocks);

    // Select scenario content for Section 2
    selections.push({
      content_id: scenarioMatch.matched_scenario,
      type: "scenario",
      target_section: 2,
      tone,
      priority: 1,
      suppressed: false
    });

    // Select B_* blocks
    const bBlocks = this.selectBBlocks(driverState, tone, suppressedSections, suppressedBlockPatterns);
    selections.push(...bBlocks);

    // Select text modules
    const modules = this.selectModules(driverState, tone, tags, suppressedSections);
    selections.push(...modules);

    // Add static content
    selections.push({
      content_id: "STATIC_DISCLAIMER",
      type: "static",
      target_section: 1,
      tone,
      priority: 1,
      suppressed: false
    });

    selections.push({
      content_id: "STATIC_NEXT_STEPS",
      type: "static",
      target_section: 11,
      tone: "TP-06", // Always TP-06 for section 11
      priority: 1,
      suppressed: false
    });

    return selections;
  }

  /**
   * Get sections suppressed by L1 drivers
   */
  private getL1SuppressedSections(driverState: DriverState): Set<number> {
    const suppressed = new Set<number>();

    for (const [ruleKey, rule] of Object.entries(L1_SUPPRESSION_RULES)) {
      const [driverId, value] = ruleKey.split(":");
      const driverValue = driverState.drivers[driverId as DriverId];

      if (driverValue?.value === value) {
        for (const section of rule.sections) {
          suppressed.add(section);
        }
      }
    }

    return suppressed;
  }

  /**
   * Get block patterns suppressed by L1 drivers
   */
  private getL1SuppressedBlocks(driverState: DriverState): string[] {
    const patterns: string[] = [];

    for (const [ruleKey, rule] of Object.entries(L1_SUPPRESSION_RULES)) {
      const [driverId, value] = ruleKey.split(":");
      const driverValue = driverState.drivers[driverId as DriverId];

      if (driverValue?.value === value) {
        patterns.push(...rule.blocks);
      }
    }

    return patterns;
  }

  /**
   * Check if a block ID matches any suppression pattern
   */
  private isBlockSuppressed(blockId: string, patterns: string[]): boolean {
    for (const pattern of patterns) {
      if (pattern.endsWith("*")) {
        const prefix = pattern.slice(0, -1);
        if (blockId.startsWith(prefix)) return true;
      } else if (blockId === pattern) {
        return true;
      }
    }
    return false;
  }

  /**
   * Select A_* blocks (warnings)
   */
  private selectABlocks(
    driverState: DriverState,
    tone: ToneProfileId,
    suppressedPatterns: string[]
  ): ContentSelection[] {
    const selections: ContentSelection[] = [];

    for (const [blockId, trigger] of Object.entries(A_BLOCK_TRIGGERS)) {
      const driverValue = driverState.drivers[trigger.driver];

      if (driverValue && trigger.values.includes(driverValue.value)) {
        const isSuppressed = this.isBlockSuppressed(blockId, suppressedPatterns);

        selections.push({
          content_id: blockId,
          type: "a_block",
          target_section: 0,
          tone,
          priority: this.getABlockPriority(blockId),
          suppressed: isSuppressed,
          suppression_reason: isSuppressed ? "L1 override" : undefined
        });
      }
    }

    return selections;
  }

  /**
   * Get priority for A_* blocks (lower = higher priority)
   */
  private getABlockPriority(blockId: string): number {
    const priorities: Record<string, number> = {
      "A_BLOCK_TREATMENT_OPTIONS": 1,
      "A_WARN_ACTIVE_SYMPTOMS": 2,
      "A_WARN_BIOLOGICAL_INSTABILITY": 3,
      "A_WARN_PREGNANCY_OR_GROWTH": 4,
      "A_WARN_RISK_FACTORS": 5,
      "A_WARN_INCOMPLETE_ASSESSMENT": 6
    };
    return priorities[blockId] ?? 10;
  }

  /**
   * Select B_* blocks
   */
  private selectBBlocks(
    driverState: DriverState,
    tone: ToneProfileId,
    suppressedSections: Set<number>,
    suppressedPatterns: string[]
  ): ContentSelection[] {
    const selections: ContentSelection[] = [];

    for (const [blockId, trigger] of Object.entries(B_BLOCK_TRIGGERS)) {
      const driverValue = driverState.drivers[trigger.driver];

      if (driverValue && trigger.values.includes(driverValue.value)) {
        const sectionSuppressed = suppressedSections.has(trigger.section);
        const blockSuppressed = this.isBlockSuppressed(blockId, suppressedPatterns);
        const isSuppressed = sectionSuppressed || blockSuppressed;

        selections.push({
          content_id: blockId,
          type: "b_block",
          target_section: trigger.section,
          tone,
          priority: 1,
          suppressed: isSuppressed,
          suppression_reason: isSuppressed
            ? (sectionSuppressed ? "Section suppressed by L1" : "Block suppressed by L1")
            : undefined
        });
      }
    }

    return selections;
  }

  /**
   * Select text modules
   */
  private selectModules(
    driverState: DriverState,
    tone: ToneProfileId,
    tags: Set<string>,
    suppressedSections: Set<number>
  ): ContentSelection[] {
    const selections: ContentSelection[] = [];

    for (const [moduleId, trigger] of Object.entries(MODULE_TRIGGERS)) {
      let shouldSelect = false;

      // Check driver trigger
      if (trigger.driver && trigger.values) {
        const driverValue = driverState.drivers[trigger.driver];
        if (driverValue && trigger.values.includes(driverValue.value)) {
          shouldSelect = true;
        }
      }

      // Check tag trigger
      if (trigger.tag && tags.has(trigger.tag)) {
        shouldSelect = true;
      }

      if (shouldSelect) {
        // Add for each target section
        for (const section of trigger.sections) {
          const isSuppressed = suppressedSections.has(section);

          selections.push({
            content_id: moduleId,
            type: "module",
            target_section: section,
            tone,
            priority: trigger.priority ?? 2, // 0 = prepend, 2 = append (default)
            suppressed: isSuppressed,
            suppression_reason: isSuppressed ? "Section suppressed by L1" : undefined
          });
        }
      }
    }

    return selections;
  }

  /**
   * Get section configuration
   */
  getSectionConfig(sectionNumber: number): typeof SECTION_CONFIG[keyof typeof SECTION_CONFIG] | undefined {
    return SECTION_CONFIG[sectionNumber as keyof typeof SECTION_CONFIG];
  }

  /**
   * Get all section numbers
   */
  getAllSections(): number[] {
    return Object.keys(SECTION_CONFIG).map(Number);
  }

  /**
   * Check if a section is required
   */
  isSectionRequired(sectionNumber: number): boolean {
    return SECTION_CONFIG[sectionNumber as keyof typeof SECTION_CONFIG]?.required ?? false;
  }

  /**
   * Check if a section is suppressible
   */
  isSectionSuppressible(sectionNumber: number): boolean {
    const config = SECTION_CONFIG[sectionNumber as keyof typeof SECTION_CONFIG];
    return (config as { suppressible?: boolean })?.suppressible ?? false;
  }
}

export const contentSelector = new ContentSelector();
