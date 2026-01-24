/**
 * Composition Validator
 * Validates report against composition contract rules
 * Adapted for Next.js from documents/src/qa/CompositionValidator.ts
 */

import type {
  ComposedReport,
  ContentSelection,
  ValidationResult
} from "../types";

// Required sections that must be present
const REQUIRED_SECTIONS = [1, 2, 10, 11];

// Word count limits per section
const WORD_COUNT_LIMITS: Record<number, { min: number; max: number }> = {
  0: { min: 0, max: 200 },      // Warnings
  1: { min: 50, max: 200 },     // Disclaimer
  2: { min: 100, max: 400 },    // Personal Summary
  3: { min: 100, max: 500 },    // Context
  4: { min: 50, max: 300 },     // Interpretation
  5: { min: 0, max: 600 },      // Options
  6: { min: 0, max: 400 },      // Comparison
  7: { min: 0, max: 300 },      // Trade-offs
  8: { min: 0, max: 400 },      // Process
  9: { min: 0, max: 300 },      // Costs
  10: { min: 50, max: 300 },    // Risk Language
  11: { min: 50, max: 200 }     // Next Steps
};

export class CompositionValidator {
  /**
   * Validate a composed report
   */
  validate(
    report: ComposedReport,
    selections: ContentSelection[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required sections
    const presentSections = new Set(report.sections.map(s => s.section_number));
    for (const required of REQUIRED_SECTIONS) {
      if (!presentSections.has(required) && !report.suppressed_sections.includes(required)) {
        errors.push(`Required section ${required} is missing`);
      }
    }

    // Check cardinality
    const cardinalityIssues = this.checkCardinality(selections);
    errors.push(...cardinalityIssues.errors);
    warnings.push(...cardinalityIssues.warnings);

    // Check word counts
    for (const section of report.sections) {
      const limits = WORD_COUNT_LIMITS[section.section_number];
      if (limits) {
        if (section.word_count < limits.min) {
          warnings.push(
            `Section ${section.section_number} has ${section.word_count} words, ` +
            `minimum recommended is ${limits.min}`
          );
        }
        if (section.word_count > limits.max) {
          warnings.push(
            `Section ${section.section_number} has ${section.word_count} words, ` +
            `maximum recommended is ${limits.max}`
          );
        }
      }
    }

    // Check L1 consistency
    const l1Issues = this.checkL1Consistency(report, selections);
    errors.push(...l1Issues.errors);
    warnings.push(...l1Issues.warnings);

    // Check unresolved placeholders
    if (report.placeholders_unresolved.length > 0) {
      warnings.push(
        `Unresolved placeholders: ${report.placeholders_unresolved.join(", ")}`
      );
    }

    // Check for empty sections
    for (const section of report.sections) {
      if (section.content.trim().length === 0) {
        errors.push(`Section ${section.section_number} has empty content`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      semantic_violations: [] // Filled by SemanticLeakageDetector
    };
  }

  /**
   * Check cardinality rules
   */
  private checkCardinality(selections: ContentSelection[]): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Group active selections by section
    const activeBySection = new Map<number, ContentSelection[]>();
    for (const sel of selections) {
      if (!sel.suppressed) {
        const existing = activeBySection.get(sel.target_section) || [];
        existing.push(sel);
        activeBySection.set(sel.target_section, existing);
      }
    }

    // Check Section 5 (Options)
    const section5 = activeBySection.get(5) || [];
    const optionBlocks = section5.filter(s => s.content_id.startsWith("B_OPT_"));
    if (optionBlocks.length > 2) {
      warnings.push(
        `Section 5 has ${optionBlocks.length} option blocks, ` +
        `recommended max is 2 (1 primary + 1 alternative)`
      );
    }

    // Check Section 6 (Comparison)
    const section6 = activeBySection.get(6) || [];
    const compareBlocks = section6.filter(s => s.content_id.startsWith("B_COMPARE_"));
    if (compareBlocks.length > 1) {
      warnings.push(
        `Section 6 has ${compareBlocks.length} comparison blocks, recommended max is 1`
      );
    }

    // Check for duplicate content blocks
    const contentIdCounts = new Map<string, number>();
    for (const sel of selections) {
      if (!sel.suppressed) {
        const count = contentIdCounts.get(sel.content_id) || 0;
        contentIdCounts.set(sel.content_id, count + 1);
      }
    }

    for (const [contentId, count] of contentIdCounts) {
      if (count > 1 && !contentId.startsWith("TM_")) {
        // Text modules can appear in multiple sections
        warnings.push(`Content block ${contentId} appears ${count} times`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Check L1 override consistency
   */
  private checkL1Consistency(
    report: ComposedReport,
    selections: ContentSelection[]
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // If warnings are present, certain sections should be suppressed
    if (report.warnings_included) {
      const presentSections = new Set(report.sections.map(s => s.section_number));

      // Check if A_BLOCK_TREATMENT_OPTIONS is active
      const hasBlocker = selections.some(
        s => s.content_id === "A_BLOCK_TREATMENT_OPTIONS" && !s.suppressed
      );

      if (hasBlocker) {
        // Sections 5, 6, 7, 8, 9 should be suppressed
        const shouldBeSuppressed = [5, 6, 7, 8, 9];
        for (const section of shouldBeSuppressed) {
          if (presentSections.has(section) && !report.suppressed_sections.includes(section)) {
            errors.push(
              `Section ${section} should be suppressed when A_BLOCK_TREATMENT_OPTIONS is active`
            );
          }
        }
      }
    }

    // Check that suppressed sections don't have content
    for (const section of report.sections) {
      if (report.suppressed_sections.includes(section.section_number)) {
        errors.push(
          `Section ${section.section_number} is marked as suppressed but has content`
        );
      }
    }

    return { errors, warnings };
  }

  /**
   * Get required sections
   */
  getRequiredSections(): number[] {
    return [...REQUIRED_SECTIONS];
  }

  /**
   * Get word count limits for a section
   */
  getWordCountLimits(sectionNumber: number): { min: number; max: number } | undefined {
    return WORD_COUNT_LIMITS[sectionNumber];
  }

  /**
   * Check if a section is required
   */
  isRequired(sectionNumber: number): boolean {
    return REQUIRED_SECTIONS.includes(sectionNumber);
  }
}

export const compositionValidator = new CompositionValidator();
