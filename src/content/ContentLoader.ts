/**
 * Content Loader
 * Loads content from the file system based on content_format_spec.md
 */

import { promises as fs } from "fs";
import path from "path";
import type {
  ContentType,
  ToneProfileId,
  ContentManifest,
  LoadedContent,
  PlaceholderDef,
  SupportedLanguage
} from "../types/index.js";
import { DEFAULT_LANGUAGE } from "../types/index.js";

// Content paths relative to project root
const CONTENT_BASE_PATH = "content";

const TYPE_PATHS: Record<ContentType, string> = {
  scenario: "scenarios",
  a_block: "a_blocks",
  b_block: "b_blocks",
  module: "modules",
  static: "static"
};

// Tone fallback chains
const TONE_FALLBACKS: Record<ToneProfileId, ToneProfileId[]> = {
  "TP-01": [],
  "TP-02": ["TP-01"],
  "TP-03": ["TP-01"],
  "TP-04": ["TP-02", "TP-01"],
  "TP-05": ["TP-03", "TP-01"],
  "TP-06": ["TP-01"]
};

export interface ContentLoaderOptions {
  basePath?: string;
  cacheEnabled?: boolean;
}

export class ContentLoader {
  private basePath: string;
  private manifestCache: Map<string, ContentManifest> = new Map();
  private contentCache: Map<string, string> = new Map();
  private cacheEnabled: boolean;

  constructor(options?: ContentLoaderOptions) {
    this.basePath = options?.basePath ?? CONTENT_BASE_PATH;
    this.cacheEnabled = options?.cacheEnabled ?? true;
  }

  /**
   * Load content by ID, tone, and language
   * Falls back: requested language → default language (en)
   * Falls back: requested tone → tone fallback chain
   */
  async loadContent(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage = DEFAULT_LANGUAGE
  ): Promise<LoadedContent | null> {
    const manifest = await this.loadManifest(contentId);
    if (!manifest) return null;

    // Try requested tone, then fallbacks
    const tonesToTry = [tone, ...TONE_FALLBACKS[tone]];
    // Try requested language, then fallback to default
    const languagesToTry = language === DEFAULT_LANGUAGE
      ? [language]
      : [language, DEFAULT_LANGUAGE];

    let content: string | null = null;
    let actualTone: ToneProfileId = tone;
    let actualLanguage: SupportedLanguage = language;

    // Try each language, then each tone within that language
    outer: for (const lang of languagesToTry) {
      for (const t of tonesToTry) {
        content = await this.loadToneContent(contentId, manifest.type, t, lang);
        if (content) {
          actualTone = t;
          actualLanguage = lang;
          break outer;
        }
      }
    }

    if (!content) {
      // Return placeholder content if nothing found
      content = `[Content not found: ${contentId}]`;
    }

    // Strip YAML frontmatter if present
    content = this.stripFrontmatter(content);

    // Parse sections from content
    const sections = this.parseSections(content);

    return {
      id: contentId,
      type: manifest.type,
      tone: actualTone,
      raw_content: content,
      sections,
      placeholders: manifest.placeholders ?? [],
      metadata: manifest
    };
  }

  /**
   * Load manifest for a content ID
   */
  async loadManifest(contentId: string): Promise<ContentManifest | null> {
    // Check cache
    if (this.cacheEnabled && this.manifestCache.has(contentId)) {
      return this.manifestCache.get(contentId)!;
    }

    // Determine content type from ID prefix
    const type = this.getTypeFromId(contentId);
    const typePath = TYPE_PATHS[type];
    const manifestPath = path.join(this.basePath, typePath, contentId, "manifest.json");

    try {
      const data = await fs.readFile(manifestPath, "utf-8");
      const manifest = JSON.parse(data) as ContentManifest;

      if (this.cacheEnabled) {
        this.manifestCache.set(contentId, manifest);
      }

      return manifest;
    } catch {
      // Return generated manifest for content that exists inline
      return this.generateManifest(contentId, type);
    }
  }

  /**
   * Load tone-specific content file with language support
   * Path format: content/{type}/{contentId}/{language}/{tone}.md
   * Falls back to: content/{type}/{contentId}/{tone}.md (legacy format for migration)
   */
  private async loadToneContent(
    contentId: string,
    type: ContentType,
    tone: ToneProfileId,
    language: SupportedLanguage = DEFAULT_LANGUAGE
  ): Promise<string | null> {
    const cacheKey = `${contentId}:${language}:${tone}`;

    if (this.cacheEnabled && this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    const typePath = TYPE_PATHS[type];

    // Try new language-aware path first: content/{type}/{id}/{lang}/{tone}.md
    const langContentPath = path.join(this.basePath, typePath, contentId, language, `${tone}.md`);

    try {
      const content = await fs.readFile(langContentPath, "utf-8");

      if (this.cacheEnabled) {
        this.contentCache.set(cacheKey, content);
      }

      return content;
    } catch {
      // Fall back to legacy path without language: content/{type}/{id}/{tone}.md
      const legacyContentPath = path.join(this.basePath, typePath, contentId, `${tone}.md`);

      try {
        const content = await fs.readFile(legacyContentPath, "utf-8");

        if (this.cacheEnabled) {
          this.contentCache.set(cacheKey, content);
        }

        return content;
      } catch {
        return null;
      }
    }
  }

  /**
   * Parse sections from markdown content
   */
  private parseSections(content: string): Map<number, string> {
    const sections = new Map<number, string>();

    // Match section headers like "# Section 2: Personal Summary", "# Sectie 2: ..." or "## 2. Personal Summary"
    const sectionPattern = /^#+\s*(?:Section|Sectie)?\s*(\d+)[:.]\s*(.+)$/gm;
    let lastMatch: { index: number; section: number } | null = null;

    const matches = [...content.matchAll(sectionPattern)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const sectionNum = parseInt(match[1], 10);
      const startIndex = match.index! + match[0].length;

      // Get end index (start of next section or end of content)
      const endIndex = matches[i + 1]?.index ?? content.length;

      // Extract section content
      const sectionContent = content
        .substring(startIndex, endIndex)
        .trim();

      sections.set(sectionNum, sectionContent);
    }

    // If no sections found, treat entire content as section 0
    if (sections.size === 0) {
      sections.set(0, content.trim());
    }

    return sections;
  }

  /**
   * Strip YAML frontmatter from content
   */
  private stripFrontmatter(content: string): string {
    // Match YAML frontmatter: starts with ---, ends with ---
    const frontmatterRegex = /^---\s*\n[\s\S]*?\n---\s*\n/;
    return content.replace(frontmatterRegex, "").trim();
  }

  /**
   * Determine content type from ID prefix
   * Note: Order matters - more specific prefixes must come before shorter ones
   */
  private getTypeFromId(contentId: string): ContentType {
    if (contentId.startsWith("STATIC_")) return "static";
    if (contentId.startsWith("S")) return "scenario";
    if (contentId.startsWith("A_")) return "a_block";
    if (contentId.startsWith("B_")) return "b_block";
    if (contentId.startsWith("TM_")) return "module";
    return "scenario"; // Default
  }

  /**
   * Generate a basic manifest for inline content
   */
  private generateManifest(contentId: string, type: ContentType): ContentManifest {
    return {
      id: contentId,
      type,
      name: contentId,
      description: `Auto-generated manifest for ${contentId}`,
      layer: type === "a_block" ? "L1" : type === "b_block" ? "L2" : "L3",
      tone_variants: {
        "TP-01": { file: "TP-01.md", word_count: 0 },
        "TP-02": { file: "TP-02.md", word_count: 0 },
        "TP-03": { file: "TP-03.md", word_count: 0 },
        "TP-04": { file: "TP-04.md", word_count: 0 },
        "TP-05": { file: "TP-05.md", word_count: 0 },
        "TP-06": { file: "TP-06.md", word_count: 0 }
      },
      version: "1.0.0",
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Load multiple content items
   */
  async loadBatch(
    items: Array<{ contentId: string; tone: ToneProfileId }>,
    language: SupportedLanguage = DEFAULT_LANGUAGE
  ): Promise<LoadedContent[]> {
    const results = await Promise.all(
      items.map(item => this.loadContent(item.contentId, item.tone, language))
    );
    return results.filter((r): r is LoadedContent => r !== null);
  }

  /**
   * Check if content exists
   */
  async exists(contentId: string): Promise<boolean> {
    const type = this.getTypeFromId(contentId);
    const typePath = TYPE_PATHS[type];
    const dirPath = path.join(this.basePath, typePath, contentId);

    try {
      await fs.access(dirPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all content IDs of a type
   */
  async listContent(type: ContentType): Promise<string[]> {
    const typePath = TYPE_PATHS[type];
    const dirPath = path.join(this.basePath, typePath);

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries
        .filter(e => e.isDirectory())
        .map(e => e.name);
    } catch {
      return [];
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.manifestCache.clear();
    this.contentCache.clear();
  }

  /**
   * Parse scenario content into named sections for composition
   * Maps section headers to standardized keys like "personal_summary", "context", etc.
   */
  parseScenarioSections(content: string): Map<string, string> {
    const namedSections = new Map<string, string>();

    // Strip frontmatter first
    const cleanContent = this.stripFrontmatter(content);

    // Section name mappings - ORDER MATTERS (more specific patterns first)
    // Format: [pattern, key] - pattern is checked against lowercase header text
    // Includes both English and Dutch patterns
    const sectionMappings: Array<[string, string]> = [
      // Option patterns (must be before generic "section X" patterns)
      // English
      ["option 1", "options"],
      ["option 2", "options"],
      ["single implant", "options"],
      ["adhesive bridge", "options"],
      ["maryland bridge", "options"],
      ["dental bridge", "options"],
      ["dental implant", "options"],
      // Dutch
      ["optie 1", "options"],
      ["optie 2", "options"],

      // Personal Summary / Section 2
      // English
      ["personal summary", "personal_summary"],
      ["your personal summary", "personal_summary"],
      ["section 2", "personal_summary"],
      // Dutch
      ["persoonlijke samenvatting", "personal_summary"],
      ["sectie 2", "personal_summary"],

      // Context / Section 3
      // English
      ["your situation", "context"],
      ["situation", "context"],
      ["context", "context"],
      ["section 3", "context"],
      // Dutch
      ["uw situatie", "context"],
      ["situatie", "context"],
      ["sectie 3", "context"],

      // Section 4 - Interpretation or Treatment Directions
      // English
      ["possible treatment directions", "directions"],
      ["treatment directions", "directions"],
      ["interpretation", "interpretation"],
      ["section 4", "interpretation"],
      // Dutch
      ["mogelijke behandelrichtingen", "directions"],
      ["behandelrichtingen", "directions"],
      ["sectie 4", "interpretation"],

      // Comparison / Section 6
      // English
      ["implant vs", "comparison"],
      ["comparison", "comparison"],
      // Dutch
      ["implantaat vs", "comparison"],
      ["vergelijking", "comparison"],

      // Trade-offs / Section 7
      // English
      ["expected results", "expected_results"],
      ["trade-offs", "tradeoffs"],
      ["tradeoffs", "tradeoffs"],
      // Dutch
      ["verwachte resultaten", "expected_results"],
      ["afwegingen", "tradeoffs"],

      // Process / Duration / Section 8
      // English
      ["duration of the process", "process"],
      ["duration", "process"],
      ["treatment process", "process"],
      ["process", "process"],
      // Dutch
      ["duur van het traject", "process"],
      ["duur", "process"],
      ["behandelingsproces", "process"],

      // Costs / Section 9
      // English
      ["cost indication", "costs"],
      ["cost considerations", "costs"],
      ["costs", "costs"],
      // Dutch
      ["kostenindicatie", "costs"],
      ["kostenoverwegingen", "costs"],
      ["kosten", "costs"],

      // Risk / Recovery / Section 10
      // English
      ["risk factors", "risk"],
      ["recovery time", "recovery"],
      // Dutch
      ["risicofactoren", "risk"],
      ["hersteltijd", "recovery"],

      // Next Steps / Section 11
      // English
      ["next steps", "next_steps"],
      ["section 11", "next_steps"],
      // Dutch
      ["volgende stappen", "next_steps"],
      ["sectie 11", "next_steps"]
    ];

    // Split content by headers (# or ##)
    // Match headers like "# Section 2: Personal Summary", "# Sectie 2: ..." or "## Your Situation"
    const headerPattern = /^(#{1,3})\s*(?:(?:Section|Sectie)\s*\d+[:.])?\s*(.+?)(?:\s*\*\[\d+\s*words\]\*)?$/gm;

    const matches = [...cleanContent.matchAll(headerPattern)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const headerText = match[2].trim().toLowerCase();

      // Find the standardized key for this header (order matters - first match wins)
      let sectionKey: string | null = null;
      for (const [pattern, key] of sectionMappings) {
        if (headerText.includes(pattern)) {
          sectionKey = key;
          break;
        }
      }

      if (!sectionKey) continue;

      // Get content between this header and the next
      const startIndex = match.index! + match[0].length;
      const endIndex = matches[i + 1]?.index ?? cleanContent.length;

      let sectionContent = cleanContent
        .substring(startIndex, endIndex)
        .trim();

      // Remove word count markers like "*[96 words]*"
      sectionContent = sectionContent.replace(/\*\[\d+\s*words\]\*/g, "").trim();

      // Only add if there's actual content
      if (sectionContent.length > 0) {
        // If we already have this key, append (for subsections like Option 1, Option 2)
        if (namedSections.has(sectionKey)) {
          const existing = namedSections.get(sectionKey)!;
          namedSections.set(sectionKey, existing + "\n\n" + sectionContent);
        } else {
          namedSections.set(sectionKey, sectionContent);
        }
      }
    }

    return namedSections;
  }
}

export const contentLoader = new ContentLoader();
