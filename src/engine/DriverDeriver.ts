/**
 * Driver Deriver
 * Derives driver values from extracted tags
 */

import type {
  DriverId,
  DriverLayer,
  DriverValue,
  DriverConflict,
  DriverState,
  ExtractedTag,
  TagExtractionResult
} from "../types/index.js";

import driverDerivationRules from "../../config/driver-derivation-rules.json" with { type: "json" };

interface DerivationRule {
  tags?: string[];
  tags_all?: string[];
  tags_any?: string[];
  value: string;
  priority: number;
  additive?: boolean;
}

interface DriverConfig {
  layer: string;
  safety_critical: boolean;
  rules: DerivationRule[];
  fallback: {
    value: string;
    reason: string;
  };
}

type DriverDerivationRulesConfig = {
  version: string;
  drivers: Record<string, DriverConfig>;
};

const rules = driverDerivationRules as DriverDerivationRulesConfig;

export class DriverDeriver {
  private rules: DriverDerivationRulesConfig;

  constructor() {
    this.rules = rules;
  }

  /**
   * Derive all driver values from extracted tags
   */
  derive(tagResult: TagExtractionResult): DriverState {
    const drivers: Record<string, DriverValue> = {};
    const conflicts: DriverConflict[] = [];
    const fallbacksApplied: DriverId[] = [];

    // Create a set of all tags for quick lookup
    const tagSet = new Set(tagResult.tags.map(t => t.tag));
    const tagSources = new Map<string, ExtractedTag>();
    for (const tag of tagResult.tags) {
      tagSources.set(tag.tag, tag);
    }

    // Process each driver
    for (const [driverId, driverConfig] of Object.entries(this.rules.drivers)) {
      const result = this.deriveDriver(
        driverId as DriverId,
        driverConfig,
        tagSet,
        tagSources
      );

      if (result.conflict) {
        conflicts.push(result.conflict);
      }

      if (result.value.source === "fallback") {
        fallbacksApplied.push(driverId as DriverId);
      }

      drivers[driverId] = result.value;
    }

    return {
      session_id: tagResult.session_id,
      drivers: drivers as Record<DriverId, DriverValue>,
      conflicts,
      fallbacks_applied: fallbacksApplied
    };
  }

  /**
   * Derive a single driver value
   */
  private deriveDriver(
    driverId: DriverId,
    config: DriverConfig,
    tagSet: Set<string>,
    tagSources: Map<string, ExtractedTag>
  ): { value: DriverValue; conflict?: DriverConflict } {
    const matchedRules: Array<{ rule: DerivationRule; matchedTags: string[] }> = [];

    // Check each rule
    for (const rule of config.rules) {
      const matchResult = this.checkRule(rule, tagSet);
      if (matchResult.matched) {
        matchedRules.push({ rule, matchedTags: matchResult.matchedTags });
      }
    }

    // Sort by priority (lower = higher priority)
    matchedRules.sort((a, b) => a.rule.priority - b.rule.priority);

    let conflict: DriverConflict | undefined;

    // Check for conflicts (multiple non-additive matches with different values)
    const nonAdditiveMatches = matchedRules.filter(m => !m.rule.additive);
    if (nonAdditiveMatches.length > 1) {
      const uniqueValues = [...new Set(nonAdditiveMatches.map(m => m.rule.value))];
      if (uniqueValues.length > 1) {
        conflict = {
          driver_id: driverId,
          conflicting_values: uniqueValues,
          resolved_value: nonAdditiveMatches[0].rule.value,
          resolution_reason: `Priority-based: rule priority ${nonAdditiveMatches[0].rule.priority} wins`
        };
      }
    }

    // Use highest priority match or fallback
    if (matchedRules.length > 0) {
      const bestMatch = matchedRules[0];
      const sourceTags = bestMatch.matchedTags;

      return {
        value: {
          driver_id: driverId,
          layer: config.layer as DriverLayer,
          value: bestMatch.rule.value,
          source: "derived",
          source_tags: sourceTags,
          confidence: this.calculateConfidence(sourceTags.length, config.rules.length)
        },
        conflict
      };
    }

    // Apply fallback
    return {
      value: {
        driver_id: driverId,
        layer: config.layer as DriverLayer,
        value: config.fallback.value,
        source: "fallback",
        source_tags: [],
        confidence: 0.5 // Lower confidence for fallback
      }
    };
  }

  /**
   * Check if a rule matches the tag set
   */
  private checkRule(
    rule: DerivationRule,
    tagSet: Set<string>
  ): { matched: boolean; matchedTags: string[] } {
    const matchedTags: string[] = [];

    // Check tags (simple match)
    if (rule.tags) {
      const allMatch = rule.tags.every(tag => tagSet.has(tag));
      if (allMatch) {
        matchedTags.push(...rule.tags);
        return { matched: true, matchedTags };
      }
      return { matched: false, matchedTags: [] };
    }

    // Check tags_all (all must match)
    if (rule.tags_all) {
      const allMatch = rule.tags_all.every(tag => tagSet.has(tag));
      if (allMatch) {
        matchedTags.push(...rule.tags_all);
        return { matched: true, matchedTags };
      }
      return { matched: false, matchedTags: [] };
    }

    // Check tags_any (at least one must match)
    if (rule.tags_any) {
      for (const tag of rule.tags_any) {
        if (tagSet.has(tag)) {
          matchedTags.push(tag);
        }
      }
      if (matchedTags.length > 0) {
        return { matched: true, matchedTags };
      }
      return { matched: false, matchedTags: [] };
    }

    return { matched: false, matchedTags: [] };
  }

  /**
   * Calculate confidence based on matching
   */
  private calculateConfidence(matchedCount: number, totalRules: number): number {
    // Base confidence on number of matched tags
    const baseConfidence = Math.min(1, matchedCount * 0.3 + 0.4);
    return Math.round(baseConfidence * 100) / 100;
  }

  /**
   * Get the layer for a driver
   */
  getDriverLayer(driverId: DriverId): DriverLayer | undefined {
    const config = this.rules.drivers[driverId];
    return config?.layer as DriverLayer | undefined;
  }

  /**
   * Check if a driver is safety-critical
   */
  isSafetyCritical(driverId: DriverId): boolean {
    return this.rules.drivers[driverId]?.safety_critical ?? false;
  }

  /**
   * Get all driver IDs
   */
  getAllDriverIds(): DriverId[] {
    return Object.keys(this.rules.drivers) as DriverId[];
  }

  /**
   * Get drivers by layer
   */
  getDriversByLayer(layer: DriverLayer): DriverId[] {
    return Object.entries(this.rules.drivers)
      .filter(([_, config]) => config.layer === layer)
      .map(([id, _]) => id as DriverId);
  }
}

export const driverDeriver = new DriverDeriver();
