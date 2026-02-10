/**
 * DOCX Parser
 * Parses Word documents and extracts structured sections
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createHash } from "crypto";
import mammoth from "mammoth";
import type {
  SourceDocument,
  SourceSection,
  DocumentType,
  ParsedScenario,
  ScenarioSection,
} from "@/lib/types";

export interface ParseOptions {
  documentType: DocumentType;
}

export interface ParseResult {
  document: SourceDocument;
  warnings: string[];
}

// Parser version for tracking when documents need re-parsing
// Bump this when parsing logic changes to trigger re-parsing
// v3.0.0: Hierarchical scenario parsing with nested sections
const PARSER_VERSION = "3.0.0";

export class DocxParser {
  /**
   * Parse a DOCX file and extract structured content
   */
  async parse(filePath: string, options: ParseOptions): Promise<ParseResult> {
    const warnings: string[] = [];

    // Read file
    const buffer = await fs.readFile(filePath);
    const fileHash = createHash("sha256").update(buffer).digest("hex");
    const filename = path.basename(filePath);

    // Extract text and HTML
    const [textResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ]);

    // Add any conversion warnings
    if (textResult.messages.length > 0) {
      warnings.push(...textResult.messages.map((m) => m.message));
    }

    const plainText = textResult.value;

    // Detect language
    const language = this.detectLanguage(plainText);

    const now = new Date().toISOString();

    // Parse based on document type
    if (options.documentType === "scenarios") {
      // Hierarchical parsing for scenarios
      const scenarios = this.parseScenarios(plainText);

      const document: SourceDocument = {
        filename,
        path: filePath,
        fileHash,
        scenarios,
        sections: [], // Empty for new hierarchical format
        language,
        documentType: options.documentType,
        parsedAt: now,
        parsedVersion: PARSER_VERSION,
        createdAt: now,
        updatedAt: now,
      };

      return { document, warnings };
    } else {
      // Flat parsing for other document types
      const sections = this.parseSections(plainText, filename, options.documentType);

      const document: SourceDocument = {
        filename,
        path: filePath,
        fileHash,
        sections,
        language,
        documentType: options.documentType,
        parsedAt: now,
        parsedVersion: PARSER_VERSION,
        createdAt: now,
        updatedAt: now,
      };

      return { document, warnings };
    }
  }

  /**
   * Parse scenario documents into hierarchical structure
   * Each scenario contains nested sections with their own content
   */
  private parseScenarios(plainText: string): ParsedScenario[] {
    const scenarios: ParsedScenario[] = [];
    const lines = plainText.split("\n");
    const linesPerPage = 45;

    // Find all scenario start positions
    const scenarioStarts: Array<{ line: number; id: string; title: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Match "Scenario S01 — Title" or "Scenario S01 - Title"
      const scenarioMatch = line.match(/^Scenario\s+(S\d+)\s*[—–-]\s*(.+)$/i);
      if (scenarioMatch) {
        scenarioStarts.push({
          line: i,
          id: scenarioMatch[1].toUpperCase(),
          title: line,
        });
      }
    }

    // Extract each scenario
    for (let i = 0; i < scenarioStarts.length; i++) {
      const start = scenarioStarts[i];
      const endLine = i < scenarioStarts.length - 1
        ? scenarioStarts[i + 1].line
        : lines.length;

      // Extract all lines for this scenario
      const scenarioLines = lines.slice(start.line, endLine);
      const parsed = this.parseScenarioStructure(scenarioLines);

      scenarios.push({
        scenarioId: start.id,
        title: start.title,
        versionId: parsed.versionId,
        status: parsed.status,
        sections: parsed.sections,
        pageStart: Math.floor(start.line / linesPerPage) + 1,
        pageEnd: Math.floor(endLine / linesPerPage) + 1,
      });
    }

    return scenarios;
  }

  /**
   * Parse the internal structure of a single scenario
   * Extracts version ID, status, and numbered sections
   */
  private parseScenarioStructure(lines: string[]): {
    versionId: string | null;
    status: string | null;
    sections: ScenarioSection[];
  } {
    const sections: ScenarioSection[] = [];
    let versionId: string | null = null;
    let status: string | null = null;
    let currentSection: { number: number; title: string; contentLines: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines (but don't skip them from section content)
      if (!line) {
        if (currentSection) {
          currentSection.contentLines.push(""); // Preserve paragraph breaks
        }
        continue;
      }

      // Skip scenario header (first line)
      if (i === 0) {
        continue;
      }

      // Check for version ID line (may include status on same line)
      // Format: "Versie-ID: SL-S01-VISIBLE-v2.1Status: 🔐 CANONIEK — FREEZE-KLAAR"
      // Or just: "Versie-ID: SL-S01-VISIBLE-v2.1"
      const versionMatch = line.match(/^Versie-ID:\s*(SL-S\d+-[A-Z]+-v[\d.]+)/i);
      if (versionMatch) {
        versionId = versionMatch[1];

        // Check if status is on the same line (no space separator in docx)
        const statusOnSameLine = line.match(/Status:\s*(?:🔐\s*)?(.+)$/i);
        if (statusOnSameLine) {
          status = statusOnSameLine[1].trim();
        }
        continue;
      }

      // Check for standalone status line: "Status: 🔐 CANONIEK — FREEZE-KLAAR"
      const statusMatch = line.match(/^Status:\s*(?:🔐\s*)?(.+)$/i);
      if (statusMatch) {
        status = statusMatch[1].trim();
        continue;
      }

      // Check for numbered section header (e.g., "1. Disclaimer", "5. Optie 1 — Professioneel tandenbleken")
      // Also handle "9.Hersteltijd" (no space after number)
      const sectionMatch = line.match(/^(\d+)\.?\s*(.+)$/);
      if (sectionMatch && this.looksLikeSectionHeader(sectionMatch[2])) {
        // Save previous section
        if (currentSection) {
          sections.push({
            number: currentSection.number,
            title: currentSection.title,
            content: this.cleanSectionContent(currentSection.contentLines),
          });
        }

        currentSection = {
          number: parseInt(sectionMatch[1], 10),
          title: sectionMatch[2].trim(),
          contentLines: [],
        };
        continue;
      }

      // Add content to current section
      if (currentSection) {
        currentSection.contentLines.push(line);
      }
    }

    // Don't forget last section
    if (currentSection) {
      sections.push({
        number: currentSection.number,
        title: currentSection.title,
        content: this.cleanSectionContent(currentSection.contentLines),
      });
    }

    return { versionId, status, sections };
  }

  /**
   * Determine if a string looks like a section header title
   * (vs just a numbered list item like "1. snelle zichtbare verbetering")
   */
  private looksLikeSectionHeader(text: string): boolean {
    // Section headers typically:
    // - Start with a capital letter
    // - Are relatively short (usually < 80 chars)
    // - Don't end with common sentence punctuation
    // - Match known section names

    const knownSectionPatterns = [
      /^Disclaimer$/i,
      /^Persoonlijke\s+samenvatting$/i,
      /^Uw\s+situatie$/i,
      /^Mogelijke\s+behandelrichtingen$/i,
      /^Optie\s+\d+/i,
      /^Verwachte\s+resultaten/i,
      /^Duur\s+van\s+het\s+traject$/i,
      /^Hersteltijd/i,
      /^Kostenindicatie/i,
      /^Volgende\s+stappen$/i,
      /^Herstel.*impact/i,
    ];

    // Check against known patterns first
    if (knownSectionPatterns.some((pattern) => pattern.test(text))) {
      return true;
    }

    // Heuristics for unknown sections
    const trimmed = text.trim();

    // Must start with capital letter
    if (!/^[A-Z]/.test(trimmed)) {
      return false;
    }

    // Should be reasonably short
    if (trimmed.length > 80) {
      return false;
    }

    // Shouldn't look like a sentence (ending with period after lowercase)
    if (/[a-z]\.$/.test(trimmed)) {
      return false;
    }

    return true;
  }

  /**
   * Clean and format section content
   */
  private cleanSectionContent(lines: string[]): string {
    // Remove leading/trailing empty lines and join with proper spacing
    const trimmed = lines
      .join("\n")
      .trim()
      .replace(/\n{3,}/g, "\n\n"); // Collapse multiple newlines

    return trimmed;
  }

  /**
   * Parse sections from plain text (generic parser for non-scenario documents)
   */
  private parseSections(plainText: string, filename: string, documentType: DocumentType): SourceSection[] {
    const sections: SourceSection[] = [];
    const lines = plainText.split("\n");

    let currentSection: Partial<SourceSection> | null = null;
    let currentPath: string[] = [];
    let sectionIndex = 0;
    let lineNumber = 0;

    // Approximate lines per page (for page number estimation)
    const linesPerPage = 45;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      lineNumber = i + 1;

      // Skip empty lines
      if (!line) continue;

      // Check if this is a heading
      if (this.isHeading(line)) {
        // Save previous section if exists
        if (currentSection && currentSection.content && currentSection.content.trim()) {
          sections.push(this.finalizeSection(currentSection as SourceSection));
        }

        const level = this.getHeadingLevel(line);
        const title = this.cleanHeading(line);

        // Update path based on level
        currentPath = this.updatePath(currentPath, title, level);

        currentSection = {
          id: `${filename.replace(/\.[^.]+$/, "")}_section_${sectionIndex++}`,
          title,
          content: "",
          pageStart: Math.floor(lineNumber / linesPerPage) + 1,
          pageEnd: Math.floor(lineNumber / linesPerPage) + 1,
          level,
          path: [...currentPath],
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content += line + "\n";
        currentSection.pageEnd = Math.floor(lineNumber / linesPerPage) + 1;
      } else {
        // Content before any heading - create initial section
        currentSection = {
          id: `${filename.replace(/\.[^.]+$/, "")}_section_${sectionIndex++}`,
          title: "Introduction",
          content: line + "\n",
          pageStart: 1,
          pageEnd: Math.floor(lineNumber / linesPerPage) + 1,
          level: 1,
          path: ["Introduction"],
        };
      }
    }

    // Don't forget the last section
    if (currentSection && currentSection.content && currentSection.content.trim()) {
      sections.push(this.finalizeSection(currentSection as SourceSection));
    }

    return sections;
  }

  /**
   * Check if a line is a heading
   */
  private isHeading(line: string): boolean {
    // Patterns for headings in Dutch and English dental documents
    const patterns = [
      // Markdown-style headings
      /^#{1,6}\s+/,
      // Dutch section patterns
      /^Sectie\s+\d+/i,
      /^Scenario\s+S\d+/i,
      /^Optie\s+\d+/i,
      /^Module\s+/i,
      /^Blok\s+/i,
      // English section patterns
      /^Section\s+\d+/i,
      /^Scenario\s+S\d+/i,
      /^Option\s+\d+/i,
      /^Module\s+/i,
      /^Block\s+/i,
      // Content ID patterns
      /^[A-Z]{1,2}_[A-Z_]+/,
      /^TM_[A-Z_]+/,
      /^B_[A-Z_]+/,
      /^A_[A-Z_]+/,
      // Numbered sections
      /^\d+\.\s+[A-Z]/,
      /^\d+\.\d+\s+/,
    ];

    return patterns.some((pattern) => pattern.test(line));
  }

  /**
   * Get heading level (1-6)
   */
  private getHeadingLevel(line: string): number {
    // Markdown headings
    const hashMatch = line.match(/^(#+)/);
    if (hashMatch) {
      return Math.min(hashMatch[1].length, 6);
    }

    // Scenario = level 1
    if (/^Scenario\s+S\d+/i.test(line)) return 1;

    // Section = level 2
    if (/^Sect(?:ie|ion)\s+\d+/i.test(line)) return 2;

    // Content IDs = level 2
    if (/^[A-Z]{1,2}_[A-Z_]+/.test(line)) return 2;

    // Option/Module = level 3
    if (/^Opt(?:ie|ion)\s+\d+/i.test(line)) return 3;
    if (/^Module\s+/i.test(line)) return 3;

    // Numbered sections
    if (/^\d+\.\d+\s+/.test(line)) return 3;
    if (/^\d+\.\s+[A-Z]/.test(line)) return 2;

    return 2; // Default
  }

  /**
   * Clean heading text
   */
  private cleanHeading(line: string): string {
    return line
      .replace(/^#+\s*/, "") // Remove markdown heading markers
      .replace(/^\d+\.\s*/, "") // Remove numbered prefixes
      .trim();
  }

  /**
   * Update section path based on heading level
   */
  private updatePath(currentPath: string[], title: string, level: number): string[] {
    // Truncate path to current level and add new title
    const newPath = currentPath.slice(0, level - 1);
    newPath.push(title);
    return newPath;
  }

  /**
   * Finalize a section (trim content, etc.)
   */
  private finalizeSection(section: SourceSection): SourceSection {
    return {
      ...section,
      content: section.content.trim(),
    };
  }

  /**
   * Detect document language
   */
  private detectLanguage(text: string): "en" | "nl" | "mixed" {
    const lowerText = text.toLowerCase();

    // Dutch indicator words
    const dutchWords = [
      "behandeling",
      "tandarts",
      "tanden",
      "kiezen",
      "gebit",
      "kosten",
      "sectie",
      "optie",
      "patiënt",
      "implantaat",
      "brug",
      "kroon",
    ];

    // English indicator words
    const englishWords = [
      "treatment",
      "dentist",
      "teeth",
      "tooth",
      "dental",
      "cost",
      "section",
      "option",
      "patient",
      "implant",
      "bridge",
      "crown",
    ];

    const dutchCount = dutchWords.filter((w) => lowerText.includes(w)).length;
    const englishCount = englishWords.filter((w) => lowerText.includes(w)).length;

    if (dutchCount > englishCount * 1.5) return "nl";
    if (englishCount > dutchCount * 1.5) return "en";
    return "mixed";
  }

  /**
   * Check if a file needs re-parsing
   */
  async needsReparse(filePath: string, existingDocument: SourceDocument): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      const currentHash = createHash("sha256").update(buffer).digest("hex");

      // Re-parse if hash changed or parser version is different
      return (
        currentHash !== existingDocument.fileHash ||
        existingDocument.parsedVersion !== PARSER_VERSION
      );
    } catch {
      return true; // Re-parse if we can't read the file
    }
  }
}

/**
 * Create a new DocxParser instance
 */
export function createDocxParser(): DocxParser {
  return new DocxParser();
}
