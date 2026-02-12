/**
 * Dynamic Content Store
 * Implements the ContentStore interface for the core pipeline
 * Checks MongoDB for existing content - no longer generates content dynamically
 */

import type { ToneProfileId, SupportedLanguage, ScenarioSections } from "../types";
import type { ContentStore } from "../composition/ReportComposer";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

/**
 * DynamicContentStore
 *
 * This content store:
 * 1. Checks MongoDB for existing content variants
 * 2. Returns null if content is not found (no LLM generation)
 *
 * Content must be created manually via the content management UI.
 */
export class DynamicContentStore implements ContentStore {
  private generationCache: Map<string, string> = new Map();
  private sectionsCache: Map<string, ScenarioSections> = new Map();
  private missingContent: Array<{ contentId: string; tone: ToneProfileId; language: SupportedLanguage }> = [];

  /**
   * Get content by ID, tone, and language
   * Implements ContentStore interface
   */
  async getContent(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage = "en"
  ): Promise<string | null> {
    // Build cache key
    const cacheKey = `${contentId}:${tone}:${language}`;

    // Check in-memory cache first (for this session)
    if (this.generationCache.has(cacheKey)) {
      console.log(`📦 [ContentStore] Cache HIT: ${contentId} (${tone}/${language})`);
      return this.generationCache.get(cacheKey)!;
    }

    // Check MongoDB for existing content
    const existingContent = await this.getFromDatabase(contentId, tone, language);
    if (existingContent) {
      console.log(`💾 [ContentStore] DB HIT: ${contentId} (${tone}/${language})`);
      this.generationCache.set(cacheKey, existingContent);
      return existingContent;
    }

    console.log(`❌ [ContentStore] MISS: ${contentId} (${tone}/${language}) - content not found in database`);

    // Track missing content for error reporting
    this.missingContent.push({ contentId, tone, language });

    // Content not found - return null (no LLM generation)
    return null;
  }

  /**
   * Get structured scenario sections by ID, tone, and language
   * Returns typed ScenarioSections object - no parsing needed
   */
  async getScenarioSections(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage = "en"
  ): Promise<ScenarioSections | null> {
    const cacheKey = `sections:${contentId}:${tone}:${language}`;

    // Check in-memory cache first
    if (this.sectionsCache.has(cacheKey)) {
      console.log(`📦 [ContentStore] Sections cache HIT: ${contentId} (${tone}/${language})`);
      return this.sectionsCache.get(cacheKey)!;
    }

    // Check MongoDB for existing structured sections
    const sections = await this.getSectionsFromDatabase(contentId, tone, language);
    if (sections) {
      console.log(`💾 [ContentStore] Sections DB HIT: ${contentId} (${tone}/${language})`);
      this.sectionsCache.set(cacheKey, sections);
      return sections;
    }

    console.log(`❌ [ContentStore] Sections MISS: ${contentId} (${tone}/${language}) - content not found in database`);

    // Track missing content for error reporting
    this.missingContent.push({ contentId, tone, language });

    // Content not found - return null (no LLM generation)
    return null;
  }

  /**
   * Get list of missing content encountered during this session
   */
  getMissingContent(): Array<{ contentId: string; tone: ToneProfileId; language: SupportedLanguage }> {
    return [...this.missingContent];
  }

  /**
   * Check if any content is missing
   */
  hasMissingContent(): boolean {
    return this.missingContent.length > 0;
  }

  /**
   * Clear the missing content list
   */
  clearMissingContent(): void {
    this.missingContent = [];
  }

  /**
   * Check MongoDB for existing structured scenario sections
   */
  private async getSectionsFromDatabase(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage
  ): Promise<ScenarioSections | null> {
    try {
      const db = await getDb();
      const doc = await db.collection(COLLECTIONS.CONTENT).findOne({ contentId });

      if (!doc) return null;

      const variant = doc.variants?.[language]?.[tone];
      // Check for structured sections field
      if (variant?.sections) {
        console.log(`   Found structured sections for ${contentId}`);
        return variant.sections as ScenarioSections;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching sections from database: ${contentId}`, error);
      return null;
    }
  }

  /**
   * Check MongoDB for existing content variant
   */
  private async getFromDatabase(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage
  ): Promise<string | null> {
    try {
      const db = await getDb();
      const doc = await db.collection(COLLECTIONS.CONTENT).findOne({
        contentId: contentId,
      });

      if (!doc) return null;

      // Check for the specific variant
      const variant = doc.variants?.[language]?.[tone];
      if (variant?.content && variant.variantStatus === "approved") {
        console.log(`   Found approved variant for ${contentId}`);
        return variant.content;
      }

      // Also accept draft content if no approved exists
      if (variant?.content) {
        console.log(`   Found draft variant for ${contentId}`);
        return variant.content;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching content from database: ${contentId}`, error);
      return null;
    }
  }

  /**
   * Clear the in-memory cache
   */
  clearCache(): void {
    this.generationCache.clear();
    this.sectionsCache.clear();
  }
}

/**
 * Create a DynamicContentStore instance
 */
export function createDynamicContentStore(): DynamicContentStore {
  return new DynamicContentStore();
}
