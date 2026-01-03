/**
 * Placeholder Resolver
 * Resolves placeholders in content with actual values
 */

import type { IntakeData, PlaceholderDef } from "../types/index.js";

// Placeholder pattern: {{PLACEHOLDER_NAME}}
const PLACEHOLDER_PATTERN = /\{\{([A-Z_]+)\}\}/g;

// Default fallback values
const DEFAULT_FALLBACKS: Record<string, string> = {
  PATIENT_NAME: "you",
  TOOTH_LOCATION: "the affected area",
  TOOTH_POSITION: "the missing tooth",
  TREATMENT_DURATION: "the treatment period",
  ESTIMATED_VISITS: "multiple appointments",
  AGE_BRACKET: "your age group",
  CLINIC_NAME: "your dental clinic",
  DENTIST_NAME: "your dental professional"
};

export interface PlaceholderContext {
  intake: IntakeData;
  calculated?: Record<string, string | number>;
  custom?: Record<string, string>;
}

export interface ResolvedPlaceholder {
  key: string;
  value: string;
  source: "intake" | "calculated" | "custom" | "fallback";
}

export interface PlaceholderResolutionResult {
  content: string;
  resolved: ResolvedPlaceholder[];
  unresolved: string[];
}

export class PlaceholderResolver {
  private defaultFallbacks: Record<string, string>;

  constructor(customFallbacks?: Record<string, string>) {
    this.defaultFallbacks = { ...DEFAULT_FALLBACKS, ...customFallbacks };
  }

  /**
   * Resolve all placeholders in content
   */
  resolve(
    content: string,
    context: PlaceholderContext,
    placeholderDefs?: PlaceholderDef[]
  ): PlaceholderResolutionResult {
    const resolved: ResolvedPlaceholder[] = [];
    const unresolved: string[] = [];

    // Build placeholder definition map
    const defMap = new Map<string, PlaceholderDef>();
    if (placeholderDefs) {
      for (const def of placeholderDefs) {
        defMap.set(def.key.replace(/\{\{|\}\}/g, ""), def);
      }
    }

    // Replace all placeholders
    const resolvedContent = content.replace(PLACEHOLDER_PATTERN, (match, key) => {
      const resolution = this.resolveKey(key, context, defMap.get(key));

      if (resolution) {
        resolved.push(resolution);
        return resolution.value;
      } else {
        unresolved.push(key);
        return match; // Keep original placeholder if unresolved
      }
    });

    return {
      content: resolvedContent,
      resolved,
      unresolved
    };
  }

  /**
   * Resolve a single placeholder key
   */
  private resolveKey(
    key: string,
    context: PlaceholderContext,
    def?: PlaceholderDef
  ): ResolvedPlaceholder | null {
    // Try intake metadata first
    const intakeValue = this.getFromIntake(key, context.intake);
    if (intakeValue !== null) {
      return { key, value: intakeValue, source: "intake" };
    }

    // Try calculated values
    if (context.calculated && key in context.calculated) {
      const value = String(context.calculated[key]);
      return { key, value, source: "calculated" };
    }

    // Try custom values
    if (context.custom && key in context.custom) {
      return { key, value: context.custom[key], source: "custom" };
    }

    // Try definition fallback
    if (def?.fallback) {
      return { key, value: def.fallback, source: "fallback" };
    }

    // Try default fallback
    if (key in this.defaultFallbacks) {
      return { key, value: this.defaultFallbacks[key], source: "fallback" };
    }

    return null;
  }

  /**
   * Get value from intake data
   */
  private getFromIntake(key: string, intake: IntakeData): string | null {
    // Map placeholder keys to intake fields
    const keyMapping: Record<string, string> = {
      PATIENT_NAME: "patient_name",
      TOOTH_LOCATION: "tooth_location",
      TOOTH_POSITION: "tooth_position"
    };

    const metadataKey = keyMapping[key] || key.toLowerCase();

    if (intake.metadata && metadataKey in intake.metadata) {
      const value = intake.metadata[metadataKey];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return null;
  }

  /**
   * Extract all placeholders from content
   */
  extractPlaceholders(content: string): string[] {
    const placeholders: string[] = [];
    let match;

    while ((match = PLACEHOLDER_PATTERN.exec(content)) !== null) {
      placeholders.push(match[1]);
    }

    return [...new Set(placeholders)];
  }

  /**
   * Validate that all required placeholders can be resolved
   */
  validatePlaceholders(
    content: string,
    context: PlaceholderContext,
    placeholderDefs?: PlaceholderDef[]
  ): { valid: boolean; missing: string[] } {
    const placeholders = this.extractPlaceholders(content);
    const missing: string[] = [];

    const defMap = new Map<string, PlaceholderDef>();
    if (placeholderDefs) {
      for (const def of placeholderDefs) {
        defMap.set(def.key.replace(/\{\{|\}\}/g, ""), def);
      }
    }

    for (const key of placeholders) {
      const resolution = this.resolveKey(key, context, defMap.get(key));
      if (!resolution) {
        missing.push(key);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Add or update a default fallback
   */
  setDefaultFallback(key: string, value: string): void {
    this.defaultFallbacks[key] = value;
  }

  /**
   * Get all default fallbacks
   */
  getDefaultFallbacks(): Record<string, string> {
    return { ...this.defaultFallbacks };
  }
}

export const placeholderResolver = new PlaceholderResolver();
