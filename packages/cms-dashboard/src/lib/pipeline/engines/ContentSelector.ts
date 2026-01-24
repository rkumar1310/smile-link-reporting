/**
 * Content Selector
 * Selects appropriate content blocks based on driver state and scenario
 * Adapted for Next.js from documents/src/engine/ContentSelector.ts
 */

import type {
  DriverId,
  DriverState,
  ToneProfileId,
  ContentSelection,
  ScenarioMatchResult
} from "../types";

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

// A_* block triggers - supports both driver-based and tag-based triggers
const A_BLOCK_TRIGGERS: Record<string, { driver?: DriverId; values?: string[]; tag?: string }> = {
  // Driver-based triggers (general warnings)
  "A_WARN_ACTIVE_SYMPTOMS": { driver: "clinical_priority", values: ["urgent", "semi_urgent"] },
  "A_WARN_PREGNANCY_OR_GROWTH": { driver: "medical_constraints", values: ["pregnancy_related"] },
  "A_WARN_BIOLOGICAL_INSTABILITY": { driver: "biological_stability", values: ["unstable", "compromised"] },
  "A_BLOCK_TREATMENT_OPTIONS": { driver: "medical_constraints", values: ["surgical_contraindicated"] },
  "A_WARN_RISK_FACTORS": { driver: "risk_profile_biological", values: ["elevated"] },
  "A_WARN_INCOMPLETE_ASSESSMENT": { driver: "clinical_priority", values: ["unknown"] },

  // Tag-based triggers (specific conditions)
  "A_FB_PREGNANCY": { driver: "medical_constraints", values: ["pregnancy_related"] },
  "A_FB_SMOKING": { tag: "smoking_daily" },
  "A_FB_POOR_HYGIENE": { tag: "hygiene_poor" },
  "A_CFB_BRUXISM": { tag: "tooth_health_bruxism" },
  "A_CFB_DENTAL_ANXIETY": { driver: "anxiety_level", values: ["severe", "moderate"] },
  "A_CFB_GROWTH_INCOMPLETE": { tag: "growth_incomplete" }

  // Disabled until questionnaire captures these conditions:
  // "A_FB_MEDICAL_DIABETES": { tag: "diabetes_yes" },
  // "A_FB_PERIODONTITIS": { tag: "periodontitis_yes" },
  // "A_FB_CHRONIC_INFLAMMATION": { tag: "chronic_inflammation_yes" },
  // "A_CFB_BONE_LOSS": { tag: "bone_loss_yes" },
};

// B_* block triggers (by section)
const B_BLOCK_TRIGGERS: Record<string, { section: number; driver: DriverId; values: string[]; scenario?: string }> = {
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

// Scenario-based B_* block mapping (for nuance and cost blocks)
const SCENARIO_B_BLOCKS: Record<string, { nuance: string; cost: string }> = {
  "S01": { nuance: "B_NUANCE_S01", cost: "B_COST_S01" },
  "S02": { nuance: "B_NUANCE_S02", cost: "B_COST_S02" },
  "S03": { nuance: "B_NUANCE_S03", cost: "B_COST_S03" },
  "S04": { nuance: "B_NUANCE_S04", cost: "B_COST_S04" },
  "S05": { nuance: "B_NUANCE_S05", cost: "B_COST_S05" },
  "S06": { nuance: "B_NUANCE_S06", cost: "B_COST_S06" },
  "S07": { nuance: "B_NUANCE_S07", cost: "B_COST_S07" },
  "S08": { nuance: "B_NUANCE_S08", cost: "B_COST_S08" },
  "S09": { nuance: "B_NUANCE_S09", cost: "B_COST_S09" },
  "S10": { nuance: "B_NUANCE_S10", cost: "B_COST_S10" },
  "S11": { nuance: "B_NUANCE_S11", cost: "B_COST_S11" },
  "S12": { nuance: "B_NUANCE_S12", cost: "B_COST_S12" },
  "S13": { nuance: "B_NUANCE_S13", cost: "B_COST_S13" },
  "S14": { nuance: "B_NUANCE_S14", cost: "B_COST_S14" },
  "S15": { nuance: "B_NUANCE_S15", cost: "B_COST_S15" },
  "S16": { nuance: "B_NUANCE_S16", cost: "B_COST_S16" },
  "S17": { nuance: "B_NUANCE_S17", cost: "B_COST_S17" }
};

// Text module triggers
// priority: 0 = prepend (before scenario), 2 = append (after scenario), default is 2
const MODULE_TRIGGERS: Record<string, { sections: number[]; driver?: DriverId; values?: string[]; tag?: string; priority?: number }> = {
  // Existing modules
  "TM_RISK_SMOKING": { sections: [3, 10], tag: "smoking_daily" },
  "TM_RISK_DIABETES": { sections: [3, 10], tag: "diabetes_yes" },
  "TM_CTX_FIRST_TIME": { sections: [3], driver: "experience_history", values: ["first_timer"] },
  "TM_CTX_PREVIOUS_TREATMENT": { sections: [3], driver: "experience_history", values: ["experienced"] },
  "TM_BUDGET_LIMITED": { sections: [9], driver: "budget_type", values: ["economy"] },
  "TM_BUDGET_FLEXIBLE": { sections: [9], driver: "budget_type", values: ["balanced"] },
  "TM_BUDGET_PREMIUM": { sections: [9], driver: "budget_type", values: ["premium"] },
  "TM_ANXIETY_SEVERE": { sections: [2], driver: "anxiety_level", values: ["severe"], priority: 0 },

  // New Risk Modules
  "TM_RISK_PREGNANCY": { sections: [3, 10], tag: "pregnancy_yes" },
  "TM_RISK_MEDICAL": { sections: [3, 10], tag: "medical_conditions_yes" },
  "TM_RISK_BRUXISM": { sections: [3, 10], tag: "bruxism_yes" },
  "TM_RISK_PERIODONTITIS": { sections: [3, 10], tag: "periodontitis_yes" },
  "TM_RISK_CHRONIC_INFLAMMATION": { sections: [3, 10], tag: "chronic_inflammation_yes" },
  "TM_RISK_POOR_HYGIENE": { sections: [3, 10], tag: "poor_hygiene_yes" },
  "TM_RISK_BONE_LOSS": { sections: [3, 10], tag: "bone_loss_yes" },

  // New Context Modules
  "TM_CTX_AGE": { sections: [3], driver: "age_stage", values: ["young_adult", "middle_aged", "senior"] },
  "TM_CTX_PREMIUM_AESTHETIC": { sections: [3], driver: "profile_type", values: ["aesthetic"] },
  "TM_CTX_AESTHETIC_STYLE": { sections: [3], driver: "aesthetic_tolerance", values: ["high", "normal"] },
  "TM_CTX_FUNCTIONAL_VS_AESTHETIC": { sections: [3], driver: "profile_type", values: ["functional", "mixed"] },
  "TM_CTX_TOOTH_STATUS": { sections: [3], driver: "mouth_situation", values: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed"] },
  "TM_CTX_ORAL_COMPLEXITY": { sections: [3], driver: "mouth_situation", values: ["complex", "mixed_pattern"] },
  "TM_CTX_GENERAL_HEALTH": { sections: [3], driver: "risk_profile_biological", values: ["elevated"] },

  // New Profile Modules
  "TM_PROFILE_COMFORT": { sections: [3], driver: "profile_type", values: ["comfort"] },
  "TM_PROFILE_AESTHETIC": { sections: [3], driver: "profile_type", values: ["aesthetic"] },
  "TM_PROFILE_FUNCTIONAL": { sections: [3], driver: "profile_type", values: ["functional"] },
  "TM_PROFILE_BUDGET": { sections: [9], driver: "budget_type", values: ["economy"] },
  "TM_PROFILE_PREMIUM": { sections: [9], driver: "budget_type", values: ["premium"] },
  "TM_PROFILE_COMBINATION": { sections: [3], driver: "profile_type", values: ["mixed"] }
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
    const aBlocks = this.selectABlocks(driverState, tone, suppressedBlockPatterns, tags);
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

    // Select scenario-specific nuance and cost blocks
    const scenarioBlocks = this.selectScenarioBlocks(scenarioMatch.matched_scenario, tone, suppressedSections);
    selections.push(...scenarioBlocks);

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
   * Supports both driver-based and tag-based triggers
   */
  private selectABlocks(
    driverState: DriverState,
    tone: ToneProfileId,
    suppressedPatterns: string[],
    tags: Set<string> = new Set()
  ): ContentSelection[] {
    const selections: ContentSelection[] = [];

    for (const [blockId, trigger] of Object.entries(A_BLOCK_TRIGGERS)) {
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
   * Select scenario-specific nuance and cost blocks
   */
  private selectScenarioBlocks(
    scenarioId: string,
    tone: ToneProfileId,
    suppressedSections: Set<number>
  ): ContentSelection[] {
    const selections: ContentSelection[] = [];

    const scenarioBlocks = SCENARIO_B_BLOCKS[scenarioId];
    if (!scenarioBlocks) {
      return selections;
    }

    // Add nuance block to section 3 (Context)
    const nuanceSuppressed = suppressedSections.has(3);
    selections.push({
      content_id: scenarioBlocks.nuance,
      type: "b_block",
      target_section: 3,
      tone,
      priority: 2,
      suppressed: nuanceSuppressed,
      suppression_reason: nuanceSuppressed ? "Section suppressed by L1" : undefined
    });

    // Add cost block to section 9 (Costs)
    const costSuppressed = suppressedSections.has(9);
    selections.push({
      content_id: scenarioBlocks.cost,
      type: "b_block",
      target_section: 9,
      tone,
      priority: 1,
      suppressed: costSuppressed,
      suppression_reason: costSuppressed ? "Section suppressed by L1" : undefined
    });

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
