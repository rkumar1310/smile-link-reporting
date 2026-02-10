/**
 * Dynamic Content Store
 * Implements the ContentStore interface for the core pipeline
 * Checks MongoDB first, then generates content on-demand if missing
 */

import type { ToneProfileId, SupportedLanguage, ScenarioSections } from "../types";
import type { ContentStore } from "../composition/ReportComposer";
import type { GenerationResult } from "@/lib/types";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { createContentGenerationAgent } from "@/lib/agents/content-generator";
// Fact-checking disabled for faster iteration
// import { createFactCheckAgent } from "@/lib/agents/fact-checker";
import { createSemanticSearchService } from "@/lib/agents/search";
import { ObjectId } from "mongodb";

/**
 * Progress callback for content generation events
 */
export interface ContentGenerationProgress {
  phase: "searching" | "generating" | "fact-checking" | "completed" | "error";
  contentId: string;
  message: string;
  attempt?: number;
  maxAttempts?: number;
  score?: number;
}

export interface DynamicContentStoreOptions {
  maxFactCheckAttempts?: number;
  factCheckThreshold?: number;
  onProgress?: (progress: ContentGenerationProgress) => void | Promise<void>;
}

/**
 * DynamicContentStore
 *
 * This content store:
 * 1. First checks MongoDB for existing content variants
 * 2. If not found, uses semantic search to find relevant source material
 * 3. Generates content using LLM with the found sources
 * 4. Fact-checks the generated content
 * 5. Optionally saves to database for future use
 */
export class DynamicContentStore implements ContentStore {
  private maxFactCheckAttempts: number;
  private factCheckThreshold: number;
  private onProgress?: (progress: ContentGenerationProgress) => void | Promise<void>;
  private generationCache: Map<string, string> = new Map();
  private sectionsCache: Map<string, ScenarioSections> = new Map();

  constructor(options?: DynamicContentStoreOptions) {
    this.maxFactCheckAttempts = options?.maxFactCheckAttempts ?? 2;
    this.factCheckThreshold = options?.factCheckThreshold ?? 0.7;
    this.onProgress = options?.onProgress;
  }

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

    console.log(`🆕 [ContentStore] MISS: ${contentId} (${tone}/${language}) - will generate`);

    // Content not found - generate dynamically
    const generatedContent = await this.generateContent(contentId, tone, language);
    if (generatedContent) {
      this.generationCache.set(cacheKey, generatedContent);
    }

    return generatedContent;
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

    console.log(`🆕 [ContentStore] Sections MISS: ${contentId} (${tone}/${language}) - will generate`);

    // Generate content and extract sections
    const generatedSections = await this.generateScenarioSections(contentId, tone, language);
    if (generatedSections) {
      this.sectionsCache.set(cacheKey, generatedSections);
    }

    return generatedSections;
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
   * Generate scenario sections using LLM - returns structured data directly
   */
  private async generateScenarioSections(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage
  ): Promise<ScenarioSections | null> {
    // Use the existing generateContent method which now returns structured sections
    const searchLanguage: SupportedLanguage = "nl";
    const contentMeta = await this.getContentMetadata(contentId, searchLanguage);

    if (!contentMeta || contentMeta.type !== "scenario") {
      console.warn(`❌ [DynamicContentStore] Not a scenario or metadata not found: ${contentId}`);
      return null;
    }

    // Find sources and generate
    const sourceDocs = await this.findRelevantSources(contentMeta, searchLanguage);
    if (sourceDocs.length === 0) {
      return null;
    }

    const generationAgent = createContentGenerationAgent();

    try {
      const result = await generationAgent.generate({
        contentId,
        contentType: "scenario",
        language,
        tone,
        sourceDocuments: sourceDocs.map((doc) => ({
          id: doc._id,
          filename: doc.filename,
          sections: doc.sections.map((s) => ({
            id: s.id || s.title,
            title: s.title,
            content: s.content,
          })),
        })),
        existingManifest: {
          name: contentMeta.name,
          description: contentMeta.description || `Scenario ${contentId}`,
          targetSections: contentMeta.sections,
          wordCountTarget: 1500,
        },
      });

      // Save to database with structured sections
      if (result.scenarioSections) {
        await this.saveSectionsToDatabase(contentId, tone, language, result);
        return result.scenarioSections;
      }

      return null;
    } catch (error) {
      console.error(`Error generating scenario sections: ${contentId}`, error);
      return null;
    }
  }

  /**
   * Save structured scenario sections to database
   */
  private async saveSectionsToDatabase(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage,
    result: GenerationResult
  ): Promise<void> {
    try {
      const db = await getDb();
      const now = new Date().toISOString();
      const contentMeta = await this.getContentMetadata(contentId);

      await db.collection(COLLECTIONS.CONTENT).updateOne(
        { contentId },
        {
          $set: {
            [`variants.${language}.${tone}`]: {
              content: result.content,  // Keep for display/export
              sections: result.scenarioSections,  // Structured sections
              wordCount: result.wordCount,
              citations: result.citations,
              generatedAt: now,
              generatedBy: "agent",
              factCheckStatus: "pending",
              variantStatus: "draft",
            },
            updatedAt: now,
          },
          $setOnInsert: {
            contentId,
            name: contentMeta?.name ?? contentId,
            type: "scenario",
            layer: "L2",
            description: contentMeta?.description ?? "",
            targetSections: contentMeta?.sections ?? [],
            createdAt: now,
            status: "draft",
            version: "1.0.0",
            versionHistory: [],
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error(`Error saving sections to database: ${contentId}`, error);
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
   * Generate content dynamically using semantic search and LLM
   */
  private async generateContent(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage
  ): Promise<string | null> {
    // Always use Dutch for semantic search since source documents are Dutch
    // The 'language' parameter is only used for output content generation
    const searchLanguage: SupportedLanguage = "nl";

    console.log(`\n📝 [DynamicContentStore] Generating content: ${contentId}`);
    console.log(`   Search language: ${searchLanguage} | Output language: ${language} | Tone: ${tone}`);

    // Get content metadata from registry (using Dutch for search queries)
    const contentMeta = await this.getContentMetadata(contentId, searchLanguage);
    if (!contentMeta) {
      console.warn(`❌ [DynamicContentStore] Content metadata not found for: ${contentId}`);
      return null;
    }

    console.log(`   Content type: ${contentMeta.type} | Name: ${contentMeta.name}`);
    console.log(`   Description: ${contentMeta.description?.substring(0, 80)}...`);

    await this.emitProgress({
      phase: "searching",
      contentId,
      message: `Searching for relevant sources for ${contentMeta.name}`,
    });

    // Find relevant source documents using semantic search
    // Always search in Dutch since source documents are Dutch
    const sourceDocs = await this.findRelevantSources(contentMeta, searchLanguage);
    if (sourceDocs.length === 0) {
      await this.emitProgress({
        phase: "error",
        contentId,
        message: `No relevant sources found for ${contentId}`,
      });
      console.warn(`❌ [DynamicContentStore] No relevant sources found for: ${contentId}`);
      return null;
    }

    console.log(`   ✅ Found ${sourceDocs.length} source documents`);

    // Generate content (fact-checking disabled for faster iteration)
    const generationAgent = createContentGenerationAgent();
    // Fact-checking disabled
    // const factCheckAgent = createFactCheckAgent();

    console.log(`\n🤖 [LLM Generation] Generating ${contentId}`);

    await this.emitProgress({
      phase: "generating",
      contentId,
      message: `Generating: ${contentMeta.name}`,
    });

    try {
      // Generate content
      const genStart = Date.now();
      const result = await generationAgent.generate({
        contentId,
        contentType: contentMeta.type,
        language,
        tone,
        sourceDocuments: sourceDocs.map((doc) => ({
          id: doc._id,
          filename: doc.filename,
          sections: doc.sections.map((s) => ({
            id: s.id || s.title,
            title: s.title,
            content: s.content,
          })),
        })),
        existingManifest: {
          name: contentMeta.name,
          description: contentMeta.description || `Content for ${contentId}`,
          targetSections: contentMeta.sections,
          wordCountTarget: 300,
        },
      });

      const genTime = Date.now() - genStart;
      console.log(`   ✅ Generated ${result.wordCount} words in ${genTime}ms`);

      // Save to database directly (fact-checking disabled)
      console.log(`   💾 Saving to database...`);
      await this.saveToDatabase(contentId, tone, language, result.content, result);

      await this.emitProgress({
        phase: "completed",
        contentId,
        message: `Generated: ${contentMeta.name}`,
      });

      return result.content;

    } catch (error) {
      console.error(`   ❌ Generation failed:`, error instanceof Error ? error.message : error);
      await this.emitProgress({
        phase: "error",
        contentId,
        message: `Generation error: ${error instanceof Error ? error.message : "Unknown"}`,
      });
      return null;
    }
  }

  /**
   * Get content metadata from registry
   * Returns language-specific description for semantic search queries
   */
  private async getContentMetadata(
    contentId: string,
    language: SupportedLanguage = "en"
  ): Promise<{
    name: string;
    type: "scenario" | "a_block" | "b_block" | "module" | "static";
    description?: string;
    sections?: number[];
  } | null> {
    try {
      const contentRegistry = await import("@/lib/config/content-registry.json");

      // Extended type to handle multilingual fields
      interface RegistryItem {
        id: string;
        type: string;
        name: string;
        name_nl?: string;
        description: string;
        description_nl?: string;
        layer: string;
        sections: number[];
      }

      const item = (contentRegistry.items as RegistryItem[]).find(
        (i) => i.id === contentId
      );

      if (!item) return null;

      // Use language-specific description for semantic search
      // Falls back to English if Dutch translation not available
      const description = language === "nl" && item.description_nl
        ? item.description_nl
        : item.description;

      const name = language === "nl" && item.name_nl
        ? item.name_nl
        : item.name;

      return {
        name,
        type: item.type as "scenario" | "a_block" | "b_block" | "module" | "static",
        description,
        sections: item.sections,
      };
    } catch (error) {
      console.error("Error loading content registry:", error);
      return null;
    }
  }

  /**
   * Find relevant source documents using semantic search
   * Always uses Dutch queries since source documents are in Dutch
   */
  private async findRelevantSources(
    contentMeta: { name: string; type: string; description?: string },
    language: SupportedLanguage = "en"
  ): Promise<
    Array<{
      _id: string;
      filename: string;
      sections: Array<{
        id: string;
        title: string;
        content: string;
        pageStart: number;
        pageEnd: number;
        level: number;
        path: string[];
      }>;
    }>
  > {
    const searchService = createSemanticSearchService();

    // Build search query using language-specific name and description
    const query = `${contentMeta.name} ${contentMeta.type} ${contentMeta.description || ""}`.trim();

    console.log(`\n🔍 [SemanticSearch] Searching for: "${contentMeta.name}"`);
    console.log(`   Query (${language}): ${query.substring(0, 100)}...`);
    console.log(`   Filter: limit=15, threshold=0.1`);

    // Search Qdrant - no language filter since all source documents are Dutch
    // The Dutch query text (from description_nl) will match Dutch content semantically
    const results = await searchService.getRelevantSources(query, {
      limit: 15,
      scoreThreshold: 0.2,
      // Note: Not filtering by language - source documents may not have language metadata
      // and we rely on semantic similarity of Dutch query to Dutch content
    });

    if (results.length === 0) {
      console.log(`   ⚠️  No results found (score threshold: 0.5)`);
      return [];
    }

    // Log top results with scores
    console.log(`   📊 Found ${results.length} matching chunks:`);
    results.slice(0, 5).forEach((r, i) => {
      console.log(`      ${i + 1}. Score: ${r.score.toFixed(3)} | ${r.filename} | ${r.sectionTitle || r.title}`);
    });
    if (results.length > 5) {
      console.log(`      ... and ${results.length - 5} more`);
    }

    // Fetch full documents from MongoDB
    const docIds = [...new Set(results.map((r) => r.mongoDocId))];
    const db = await getDb();

    console.log(`   📄 Fetching ${docIds.length} unique source documents from MongoDB...`);

    const docs = await db
      .collection(COLLECTIONS.SOURCE_DOCUMENTS)
      .find({ _id: { $in: docIds.map((id) => new ObjectId(id)) } })
      .toArray();

    console.log(`   ✅ Retrieved ${docs.length} documents`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return docs.map((doc: any) => ({
      _id: doc._id.toString(),
      filename: doc.filename,
      sections: doc.sections || [],
    }));
  }

  /**
   * Save generated content to database
   */
  private async saveToDatabase(
    contentId: string,
    tone: ToneProfileId,
    language: SupportedLanguage,
    content: string,
    generationResult?: { wordCount: number; citations: unknown[] }
  ): Promise<void> {
    try {
      const db = await getDb();
      const now = new Date().toISOString();

      // Get content metadata for type/name/layer
      const contentMeta = await this.getContentMetadata(contentId);

      // Upsert the content document
      await db.collection(COLLECTIONS.CONTENT).updateOne(
        { contentId },
        {
          $set: {
            [`variants.${language}.${tone}`]: {
              content,
              wordCount: generationResult?.wordCount ?? content.split(/\s+/).length,
              citations: generationResult?.citations ?? [],
              generatedAt: now,
              generatedBy: "agent",
              factCheckStatus: "pending",
              variantStatus: "draft",
            },
            updatedAt: now,
          },
          $setOnInsert: {
            contentId,
            name: contentMeta?.name ?? contentId,
            type: contentMeta?.type ?? "static",
            layer: "L2",  // Default layer
            description: contentMeta?.description ?? "",
            targetSections: contentMeta?.sections ?? [],
            createdAt: now,
            status: "draft",
            version: "1.0.0",
            versionHistory: [],
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error(`Error saving content to database: ${contentId}`, error);
    }
  }

  /**
   * Emit progress event
   */
  private async emitProgress(progress: ContentGenerationProgress): Promise<void> {
    if (this.onProgress) {
      await this.onProgress(progress);
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
export function createDynamicContentStore(
  options?: DynamicContentStoreOptions
): DynamicContentStore {
  return new DynamicContentStore(options);
}
