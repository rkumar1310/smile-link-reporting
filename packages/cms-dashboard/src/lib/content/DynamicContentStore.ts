/**
 * Dynamic Content Store
 * Implements the ContentStore interface from the core pipeline
 * Checks MongoDB first, then generates content on-demand if missing
 */

import type { ToneProfileId, SupportedLanguage } from "@/lib/types";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import { createContentGenerationAgent } from "@/lib/agents/content-generator";
import { createFactCheckAgent } from "@/lib/agents/fact-checker";
import { createSemanticSearchService } from "@/lib/agents/search";

/**
 * ContentStore interface (matching core pipeline)
 */
export interface ContentStore {
  getContent(
    contentId: string,
    tone: ToneProfileId,
    language?: SupportedLanguage
  ): Promise<string | null>;
}

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
      return this.generationCache.get(cacheKey)!;
    }

    // Check MongoDB for existing content
    const existingContent = await this.getFromDatabase(contentId, tone, language);
    if (existingContent) {
      this.generationCache.set(cacheKey, existingContent);
      return existingContent;
    }

    // Content not found - generate dynamically
    const generatedContent = await this.generateContent(contentId, tone, language);
    if (generatedContent) {
      this.generationCache.set(cacheKey, generatedContent);
    }

    return generatedContent;
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
        return variant.content;
      }

      // Also accept draft content if no approved exists
      if (variant?.content) {
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
    // Get content metadata from registry
    const contentMeta = await this.getContentMetadata(contentId);
    if (!contentMeta) {
      console.warn(`Content metadata not found for: ${contentId}`);
      return null;
    }

    await this.emitProgress({
      phase: "searching",
      contentId,
      message: `Searching for relevant sources for ${contentMeta.name}`,
    });

    // Find relevant source documents using semantic search
    const sourceDocs = await this.findRelevantSources(contentMeta);
    if (sourceDocs.length === 0) {
      await this.emitProgress({
        phase: "error",
        contentId,
        message: `No relevant sources found for ${contentId}`,
      });
      console.warn(`No relevant sources found for: ${contentId}`);
      return null;
    }

    // Generate content with fact-checking loop
    const generationAgent = createContentGenerationAgent();
    const factCheckAgent = createFactCheckAgent();

    let attempt = 0;
    let generatedContent: string | null = null;

    while (attempt < this.maxFactCheckAttempts) {
      attempt++;

      await this.emitProgress({
        phase: "generating",
        contentId,
        message: attempt === 1 ? `Generating: ${contentMeta.name}` : `Regenerating: ${contentMeta.name}`,
        attempt,
        maxAttempts: this.maxFactCheckAttempts,
      });

      try {
        // Generate content
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

        generatedContent = result.content;

        // Fact-check
        await this.emitProgress({
          phase: "fact-checking",
          contentId,
          message: `Verifying: ${contentMeta.name}`,
          attempt,
          maxAttempts: this.maxFactCheckAttempts,
        });

        const factCheckResult = await factCheckAgent.check({
          contentId,
          content: generatedContent,
          sourceDocuments: sourceDocs.map((doc) => ({
            _id: doc._id,
            filename: doc.filename,
            sections: doc.sections,
          })),
          strictMode: false,
        });

        const score = factCheckResult.overallConfidence;

        if (score >= this.factCheckThreshold) {
          // Passed! Save to database and return
          await this.saveToDatabase(contentId, tone, language, generatedContent, result);

          await this.emitProgress({
            phase: "completed",
            contentId,
            message: `Generated and verified: ${contentMeta.name}`,
            attempt,
            maxAttempts: this.maxFactCheckAttempts,
            score,
          });

          return generatedContent;
        }

        // Score too low, will retry
        await this.emitProgress({
          phase: "fact-checking",
          contentId,
          message: `Score ${(score * 100).toFixed(0)}% below threshold, ${attempt < this.maxFactCheckAttempts ? "retrying..." : "using anyway"}`,
          attempt,
          maxAttempts: this.maxFactCheckAttempts,
          score,
        });

      } catch (error) {
        console.error(`Generation attempt ${attempt} failed for ${contentId}:`, error);
        await this.emitProgress({
          phase: "error",
          contentId,
          message: `Generation error: ${error instanceof Error ? error.message : "Unknown"}`,
          attempt,
          maxAttempts: this.maxFactCheckAttempts,
        });
      }
    }

    // If we get here, all attempts completed but score was below threshold
    // Save with warnings and return
    if (generatedContent) {
      await this.saveToDatabase(contentId, tone, language, generatedContent);
      return generatedContent;
    }

    return null;
  }

  /**
   * Get content metadata from registry
   */
  private async getContentMetadata(contentId: string): Promise<{
    name: string;
    type: "scenario" | "a_block" | "b_block" | "module" | "static";
    description?: string;
    sections?: number[];
  } | null> {
    try {
      const contentRegistry = await import("@/lib/config/content-registry.json");
      const item = contentRegistry.items.find(
        (i: { id: string }) => i.id === contentId
      );

      if (!item) return null;

      return {
        name: item.name,
        type: item.type as "scenario" | "a_block" | "b_block" | "module" | "static",
        description: item.description,
        sections: item.sections,
      };
    } catch (error) {
      console.error("Error loading content registry:", error);
      return null;
    }
  }

  /**
   * Find relevant source documents using semantic search
   */
  private async findRelevantSources(
    contentMeta: { name: string; type: string; description?: string }
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

    // Build search query
    const query = `${contentMeta.name} ${contentMeta.type} ${contentMeta.description || ""}`.trim();

    // Search Qdrant
    const results = await searchService.getRelevantSources(query, {
      limit: 15,
      scoreThreshold: 0.1,
    });

    if (results.length === 0) {
      return [];
    }

    // Fetch full documents from MongoDB
    const docIds = [...new Set(results.map((r) => r.mongoDocId))];
    const db = await getDb();

    const docs = await db
      .collection(COLLECTIONS.SOURCE_DOCUMENTS)
      .find({ _id: { $in: docIds.map((id) => new ObjectId(id)) } })
      .toArray();

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
