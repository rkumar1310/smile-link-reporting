/**
 * Semantic Leakage Detector
 * Scans reports for banned phrases and inappropriate content
 */

import type { ToneProfileId, SemanticViolation, ReportSection } from "../types/index.js";
import { toneSelector } from "../engine/ToneSelector.js";

// Global banned phrases (regardless of tone)
const GLOBAL_BANNED_PHRASES = [
  // Medical claims
  "guaranteed",
  "100% success",
  "will definitely",
  "always works",
  "never fails",
  "cure",
  "permanent solution",

  // Inappropriate advice
  "you must do this",
  "the only option",
  "don't bother with",
  "waste of money",

  // Legal liability
  "we promise",
  "we guarantee",
  "no risk",
  "risk-free",

  // Competitive claims
  "better than",
  "the best in",
  "superior to",
  "cheaper than"
];

// Severity levels for violations
type Severity = "WARNING" | "CRITICAL";

const PHRASE_SEVERITY: Record<string, Severity> = {
  // Critical phrases that should block the report
  "guaranteed": "CRITICAL",
  "100% success": "CRITICAL",
  "we guarantee": "CRITICAL",
  "no risk": "CRITICAL",
  "cure": "CRITICAL",

  // Warning phrases that should flag for review
  "you must": "WARNING",
  "the only option": "WARNING",
  "will definitely": "WARNING"
};

export interface DetectionResult {
  violations: SemanticViolation[];
  hasViolations: boolean;
  hasCriticalViolations: boolean;
  summary: {
    total: number;
    critical: number;
    warning: number;
  };
}

export class SemanticLeakageDetector {
  private globalBanned: string[];
  private phraseCase: Map<string, string>; // lowercase -> original case

  constructor(additionalBanned?: string[]) {
    this.globalBanned = [...GLOBAL_BANNED_PHRASES, ...(additionalBanned || [])];
    this.phraseCase = new Map();

    // Build case mapping
    for (const phrase of this.globalBanned) {
      this.phraseCase.set(phrase.toLowerCase(), phrase);
    }
  }

  /**
   * Detect violations in a full report
   */
  detect(sections: ReportSection[], tone: ToneProfileId): DetectionResult {
    const violations: SemanticViolation[] = [];

    // Get tone-specific banned phrases
    const toneBanned = toneSelector.getBannedPhrases(tone);
    const allBanned = [...this.globalBanned, ...toneBanned];

    // Check each section
    for (const section of sections) {
      const sectionViolations = this.detectInText(
        section.content,
        section.section_number,
        allBanned
      );
      violations.push(...sectionViolations);
    }

    // Calculate summary
    const critical = violations.filter(v => v.severity === "CRITICAL").length;
    const warning = violations.filter(v => v.severity === "WARNING").length;

    return {
      violations,
      hasViolations: violations.length > 0,
      hasCriticalViolations: critical > 0,
      summary: {
        total: violations.length,
        critical,
        warning
      }
    };
  }

  /**
   * Detect violations in a single text
   */
  detectInText(
    text: string,
    sectionNumber: number,
    bannedPhrases: string[]
  ): SemanticViolation[] {
    const violations: SemanticViolation[] = [];
    const lowerText = text.toLowerCase();

    for (const phrase of bannedPhrases) {
      const lowerPhrase = phrase.toLowerCase();
      // Use word boundary regex to avoid matching substrings like "secure" for "cure"
      const escapedPhrase = lowerPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedPhrase}\\b`, "g");
      let match;

      // Find all occurrences with word boundaries
      while ((match = regex.exec(lowerText)) !== null) {
        const originalPhrase = this.phraseCase.get(lowerPhrase) || phrase;

        violations.push({
          phrase: originalPhrase,
          location: {
            section: sectionNumber,
            position: match.index
          },
          severity: this.getSeverity(lowerPhrase),
          rule: this.getRule(lowerPhrase)
        });
      }
    }

    return violations;
  }

  /**
   * Get severity for a phrase
   */
  private getSeverity(phrase: string): Severity {
    const lowerPhrase = phrase.toLowerCase();

    // Check specific severity mapping
    for (const [key, severity] of Object.entries(PHRASE_SEVERITY)) {
      if (lowerPhrase.includes(key.toLowerCase())) {
        return severity;
      }
    }

    // Default to WARNING
    return "WARNING";
  }

  /**
   * Get rule description for a phrase
   */
  private getRule(phrase: string): string {
    const lowerPhrase = phrase.toLowerCase();

    if (lowerPhrase.includes("guarantee") || lowerPhrase.includes("100%")) {
      return "Medical claims prohibition: No guarantees of outcomes";
    }

    if (lowerPhrase.includes("must") || lowerPhrase.includes("only option")) {
      return "Patient autonomy: Avoid directive language";
    }

    if (lowerPhrase.includes("cure") || lowerPhrase.includes("permanent")) {
      return "Accuracy: Avoid absolute medical claims";
    }

    if (lowerPhrase.includes("better than") || lowerPhrase.includes("superior")) {
      return "Competitive claims prohibition";
    }

    if (lowerPhrase.includes("no risk") || lowerPhrase.includes("risk-free")) {
      return "Risk disclosure: All procedures carry some risk";
    }

    return "General banned phrase";
  }

  /**
   * Check if a single phrase would violate
   */
  wouldViolate(text: string, tone: ToneProfileId): boolean {
    const toneBanned = toneSelector.getBannedPhrases(tone);
    const allBanned = [...this.globalBanned, ...toneBanned];
    const lowerText = text.toLowerCase();

    for (const phrase of allBanned) {
      const lowerPhrase = phrase.toLowerCase();
      const escapedPhrase = lowerPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedPhrase}\\b`);
      if (regex.test(lowerText)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all banned phrases for a tone
   */
  getAllBannedPhrases(tone: ToneProfileId): string[] {
    const toneBanned = toneSelector.getBannedPhrases(tone);
    return [...new Set([...this.globalBanned, ...toneBanned])];
  }

  /**
   * Add a custom banned phrase
   */
  addBannedPhrase(phrase: string, severity?: Severity): void {
    if (!this.globalBanned.includes(phrase)) {
      this.globalBanned.push(phrase);
      this.phraseCase.set(phrase.toLowerCase(), phrase);

      if (severity) {
        PHRASE_SEVERITY[phrase.toLowerCase()] = severity;
      }
    }
  }

  /**
   * Remove a banned phrase
   */
  removeBannedPhrase(phrase: string): void {
    const index = this.globalBanned.indexOf(phrase);
    if (index !== -1) {
      this.globalBanned.splice(index, 1);
      this.phraseCase.delete(phrase.toLowerCase());
    }
  }
}

export const semanticLeakageDetector = new SemanticLeakageDetector();
