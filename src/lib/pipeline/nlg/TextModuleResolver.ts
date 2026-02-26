/**
 * Text Module Resolver
 *
 * Selects and concatenates text modules for injection into Block 1's
 * {CONTEXT_MODULES_BLOCK} based on driver state and scenario.
 *
 * Module types:
 * - FB_BANNER_*  — short safety/context banners (max 1-2 sentences)
 * - TM_*         — long context modules (detailed risk/context explanations)
 * - COSTBLOCK_*  — scenario-specific cost driver explanations
 * - NUANCE_*     — scenario-specific trade-off clarifications
 *
 * Selection rules:
 * - Never show both FB_BANNER and TM for the same topic
 * - Use FB_BANNER for standard depth, TM for detailed/anxious profiles
 * - COSTBLOCK only if scenario block_7 lacks cost narrative (rare)
 * - NUANCE only when expectation_risk is flagged
 */

import type { DriverState, SupportedLanguage } from "../types";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

// =============================================================================
// TOPIC DEFINITIONS
// =============================================================================

/**
 * Topics that can trigger either a banner or a full module
 */
const BANNER_TM_TOPICS = [
  {
    topic: "pregnancy",
    bannerId: "FB_BANNER_PREGNANCY",
    moduleId: "TM_01_PREGNANCY",
    trigger: { type: "tag" as const, values: ["pregnancy_yes", "pregnancy_planning"] },
  },
  {
    topic: "diabetes",
    bannerId: "FB_BANNER_MEDICAL_DIABETES",
    moduleId: "TM_02_MEDICAL_DIABETES",
    trigger: { type: "tag" as const, values: ["medical_conditions_yes"] },
  },
  {
    topic: "smoking",
    bannerId: "FB_BANNER_SMOKING_VAPING",
    moduleId: "TM_03_SMOKING_VAPING",
    trigger: { type: "tag" as const, values: ["smoking_daily", "smoking_weekly"] },
  },
  {
    topic: "bruxism",
    bannerId: "FB_BANNER_BRUXISM",
    moduleId: "TM_04_BRUXISM",
    trigger: { type: "tag" as const, values: ["tooth_health_bruxism"] },
  },
  {
    topic: "anxiety",
    bannerId: "FB_BANNER_DENTAL_ANXIETY",
    moduleId: "TM_09_DENTAL_ANXIETY",
    trigger: { type: "driver" as const, driver: "anxiety_level", values: ["severe", "mild"] },
  },
  {
    topic: "periodontitis",
    bannerId: "FB_BANNER_PERIODONTITIS",
    moduleId: "TM_05_PERIODONTAL",
    trigger: { type: "tag" as const, values: ["history_periodontal"] },
  },
  {
    topic: "bone_loss",
    bannerId: "FB_BANNER_BONE_LOSS",
    moduleId: "TM_08_BONE_LOSS",
    trigger: { type: "tag" as const, values: ["issue_gum_recession"] },
  },
  {
    topic: "poor_hygiene",
    bannerId: "FB_BANNER_POOR_HYGIENE",
    moduleId: "TM_07_POOR_HYGIENE",
    trigger: { type: "tag" as const, values: ["hygiene_poor", "hygiene_irregular"] },
  },
  {
    topic: "chronic_inflammation",
    bannerId: "FB_BANNER_CHRONIC_INFLAMMATION",
    moduleId: "TM_06_CHRONIC_INFLAMMATION",
    trigger: { type: "driver" as const, driver: "risk_profile_biological", values: ["elevated"] },
  },
  {
    topic: "budget",
    bannerId: "FB_BANNER_BUDGET",
    moduleId: "TM_14_BUDGET_LOW",
    trigger: { type: "driver" as const, driver: "budget_type", values: ["economy"] },
  },
] as const;

// =============================================================================
// TEXT MODULE RESOLVER
// =============================================================================

export class TextModuleResolver {
  private contentCache = new Map<string, string | null>();

  /**
   * Resolve the CONTEXT_MODULES_BLOCK text for Block 1.
   *
   * @param driverState - Patient's driver state
   * @param tags - Patient's extracted tags
   * @param scenarioId - Matched scenario ID (e.g., "S01")
   * @param language - "en" or "nl"
   */
  async resolve(
    driverState: DriverState,
    tags: Set<string>,
    scenarioId: string | undefined,
    language: SupportedLanguage
  ): Promise<string> {
    const pieces: string[] = [];

    // Determine depth preference: detailed for anxious/information-seeking patients
    const useDetailedModules = this.shouldUseDetailedModules(driverState);

    // 1. Select banner or TM for each triggered topic
    for (const topicDef of BANNER_TM_TOPICS) {
      const triggered = this.isTriggered(topicDef.trigger, driverState, tags);
      if (!triggered) continue;

      // Choose banner (short) vs. full module (detailed)
      const moduleId = useDetailedModules ? topicDef.moduleId : topicDef.bannerId;
      const content = await this.loadModule(moduleId, language);
      if (content) {
        pieces.push(content);
      } else {
        // Fall back to the other variant if primary not found
        const fallbackId = useDetailedModules ? topicDef.bannerId : topicDef.moduleId;
        const fallbackContent = await this.loadModule(fallbackId, language);
        if (fallbackContent) {
          pieces.push(fallbackContent);
        }
      }
    }

    // 2. COSTBLOCK — scenario-specific cost context
    if (scenarioId) {
      const costBlockId = `COSTBLOCK_${scenarioId}`;
      const costContent = await this.loadModule(costBlockId, language);
      if (costContent) {
        pieces.push(costContent);
      }
    }

    // 3. NUANCE — scenario-specific trade-off clarifications when expectation risk is flagged
    if (scenarioId && this.hasHighExpectationRisk(driverState)) {
      const nuanceId = `NUANCE_${scenarioId}_SHORT`;
      const nuanceContent = await this.loadModule(nuanceId, language);
      if (nuanceContent) {
        pieces.push(nuanceContent);
      }
    }

    return pieces.join("\n\n");
  }

  /**
   * Determine if detailed (TM) modules should be used instead of banners
   */
  private shouldUseDetailedModules(driverState: DriverState): boolean {
    const anxietyLevel = driverState.drivers.anxiety_level?.value;
    const infoDepth = driverState.drivers.information_depth?.value;
    return anxietyLevel === "severe" || infoDepth === "deep";
  }

  /**
   * Check if a trigger condition is met
   */
  private isTriggered(
    trigger: { type: "tag"; values: readonly string[] } | { type: "driver"; driver: string; values: readonly string[] },
    driverState: DriverState,
    tags: Set<string>
  ): boolean {
    if (trigger.type === "tag") {
      return trigger.values.some(v => tags.has(v));
    }

    const driverValue = driverState.drivers[trigger.driver as keyof typeof driverState.drivers];
    return driverValue != null && trigger.values.includes(driverValue.value);
  }

  /**
   * Check if expectation risk warrants nuance blocks
   */
  private hasHighExpectationRisk(driverState: DriverState): boolean {
    const expectationRisk = driverState.drivers.expectation_risk?.value;
    return expectationRisk === "elevated" || expectationRisk === "high";
  }

  /**
   * Load a text module from MongoDB content collection
   */
  private async loadModule(moduleId: string, language: SupportedLanguage): Promise<string | null> {
    const cacheKey = `${moduleId}:${language}`;
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey) ?? null;
    }

    try {
      const db = await getDb();
      const doc = await db.collection(COLLECTIONS.CONTENT).findOne({ _id: moduleId as unknown as import("mongodb").ObjectId });

      if (!doc) {
        this.contentCache.set(cacheKey, null);
        return null;
      }

      // Content documents store bilingual text
      const text = doc.content?.[language] ?? doc.body?.[language] ?? null;
      this.contentCache.set(cacheKey, text);
      return text;
    } catch {
      this.contentCache.set(cacheKey, null);
      return null;
    }
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear();
  }
}

export const textModuleResolver = new TextModuleResolver();
