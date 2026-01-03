/**
 * Tone Selector
 * Selects appropriate tone profile based on driver state
 */

import type {
  DriverId,
  DriverState,
  ToneProfileId,
  ToneProfile,
  ToneSelectionResult
} from "../types/index.js";

import toneProfiles from "../../config/tone-profiles.json" with { type: "json" };

interface ToneConfig {
  name: string;
  description: string;
  priority: number;
  trigger_drivers: Record<string, string[]>;
  is_default?: boolean;
  always_used_for_sections?: number[];
  banned_lexical_set: string[];
}

type ToneProfilesConfig = {
  version: string;
  default_tone: ToneProfileId;
  section_11_override: ToneProfileId;
  priority_order: ToneProfileId[];
  profiles: Record<ToneProfileId, ToneConfig>;
  fallback_chains: Record<ToneProfileId, ToneProfileId[]>;
};

const config = toneProfiles as ToneProfilesConfig;

export class ToneSelector {
  private config: ToneProfilesConfig;

  constructor() {
    this.config = config;
  }

  /**
   * Select the appropriate tone profile based on driver state
   */
  select(driverState: DriverState): ToneSelectionResult {
    const evaluatedTriggers: ToneSelectionResult["evaluated_triggers"] = [];

    // Check each tone in priority order
    for (const toneId of this.config.priority_order) {
      const toneConfig = this.config.profiles[toneId];
      if (!toneConfig) continue;

      // Skip default tone in priority evaluation
      if (toneConfig.is_default) continue;

      const triggerResult = this.checkTriggers(toneId, toneConfig, driverState);
      evaluatedTriggers.push(triggerResult);

      if (triggerResult.matched) {
        return {
          selected_tone: toneId,
          reason: `Triggered by ${triggerResult.trigger_driver}: ${driverState.drivers[triggerResult.trigger_driver!]?.value}`,
          evaluated_triggers: evaluatedTriggers
        };
      }
    }

    // No triggers matched, use default
    return {
      selected_tone: this.config.default_tone,
      reason: "No specific triggers matched, using default tone",
      evaluated_triggers: evaluatedTriggers
    };
  }

  /**
   * Check if a tone's triggers are satisfied
   */
  private checkTriggers(
    toneId: ToneProfileId,
    toneConfig: ToneConfig,
    driverState: DriverState
  ): ToneSelectionResult["evaluated_triggers"][0] {
    const triggers = toneConfig.trigger_drivers;

    // If no triggers defined, this tone doesn't auto-trigger
    if (!triggers || Object.keys(triggers).length === 0) {
      return { tone: toneId, matched: false };
    }

    // Check each trigger driver
    for (const [driverId, triggerValues] of Object.entries(triggers)) {
      const driverValue = driverState.drivers[driverId as DriverId];

      if (driverValue && triggerValues.includes(driverValue.value)) {
        return {
          tone: toneId,
          matched: true,
          trigger_driver: driverId as DriverId
        };
      }
    }

    return { tone: toneId, matched: false };
  }

  /**
   * Get the tone for a specific section (handles Section 11 override)
   */
  getToneForSection(
    selectedTone: ToneProfileId,
    sectionNumber: number
  ): ToneProfileId {
    // Section 11 always uses TP-06 (Autonomy-Respecting)
    if (sectionNumber === 11) {
      return this.config.section_11_override;
    }

    return selectedTone;
  }

  /**
   * Get fallback chain for a tone
   */
  getFallbackChain(toneId: ToneProfileId): ToneProfileId[] {
    return this.config.fallback_chains[toneId] || [this.config.default_tone];
  }

  /**
   * Get banned phrases for a tone
   */
  getBannedPhrases(toneId: ToneProfileId): string[] {
    return this.config.profiles[toneId]?.banned_lexical_set || [];
  }

  /**
   * Get all banned phrases across all tones
   */
  getAllBannedPhrases(): Map<ToneProfileId, string[]> {
    const result = new Map<ToneProfileId, string[]>();

    for (const [toneId, toneConfig] of Object.entries(this.config.profiles)) {
      result.set(toneId as ToneProfileId, toneConfig.banned_lexical_set);
    }

    return result;
  }

  /**
   * Get tone profile details
   */
  getToneProfile(toneId: ToneProfileId): ToneProfile | undefined {
    const toneConfig = this.config.profiles[toneId];
    if (!toneConfig) return undefined;

    return {
      id: toneId,
      name: toneConfig.name,
      description: toneConfig.description,
      trigger_drivers: toneConfig.trigger_drivers as Partial<Record<DriverId, string[]>>,
      priority: toneConfig.priority,
      banned_lexical_set: toneConfig.banned_lexical_set
    };
  }

  /**
   * Get default tone
   */
  getDefaultTone(): ToneProfileId {
    return this.config.default_tone;
  }

  /**
   * Get all tone IDs in priority order
   */
  getAllToneIds(): ToneProfileId[] {
    return this.config.priority_order;
  }

  /**
   * Check if a phrase is banned for the given tone
   */
  isPhraseBanned(toneId: ToneProfileId, phrase: string): boolean {
    const bannedPhrases = this.getBannedPhrases(toneId);
    const lowerPhrase = phrase.toLowerCase();

    return bannedPhrases.some(banned =>
      lowerPhrase.includes(banned.toLowerCase())
    );
  }
}

export const toneSelector = new ToneSelector();
