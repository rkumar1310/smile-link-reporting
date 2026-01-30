/**
 * Derivative Content Service
 * Manages synthesized content generated from multiple source blocks
 */

import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type {
  DerivativeContent,
  ToneProfileId,
  SupportedLanguage,
  SourceBlockContent,
  GetOrCreateDerivativeOptions,
  DerivativeGenerationResult,
  ClaimSource,
  FactCheckStatus,
} from "@/lib/types";
import { generateDerivativeId, isDerivativeValid } from "@/lib/types";
import { createContentService } from "./ContentService";

export class DerivativeContentService {
  private contentService = createContentService();

  /**
   * Get or create a derivative for a set of source blocks
   * This is the main entry point for derivative content
   */
  async getOrCreateDerivative(
    options: GetOrCreateDerivativeOptions,
    generateFn: (blocks: SourceBlockContent[]) => Promise<DerivativeGenerationResult>
  ): Promise<DerivativeContent> {
    const { sourceBlockIds, language, tone, sectionContext, skipFactCheck } = options;

    // Generate the derivative ID
    const derivativeId = generateDerivativeId(sourceBlockIds, language, tone);
    console.log(`🔑 [DerivativeService] Generated ID: ${derivativeId} for blocks: [${sourceBlockIds.join(", ")}]`);

    // Check if derivative already exists and is valid
    const existing = await this.findDerivative(derivativeId);

    if (existing) {
      console.log(`📦 [DerivativeService] Found existing derivative: ${derivativeId}`);
      // Get current versions of source blocks
      const currentVersions = await this.getSourceBlockVersions(sourceBlockIds);

      // Check if derivative is still valid
      if (isDerivativeValid(existing, currentVersions)) {
        console.log(`✅ [DerivativeService] Cache HIT - derivative ${derivativeId} is valid`);
        // Update usage tracking
        await this.incrementUsage(derivativeId);
        return existing;
      }

      // Derivative is stale, will regenerate
      console.log(`⚠️ [DerivativeService] Derivative ${derivativeId} is stale, regenerating...`);
    } else {
      console.log(`🆕 [DerivativeService] No existing derivative found, creating new one`);
    }

    // Get source block content
    const sourceBlocks = await this.getSourceBlocksContent(sourceBlockIds, language, tone);
    console.log(`📄 [DerivativeService] Fetched ${sourceBlocks.length} source blocks for generation`);

    if (sourceBlocks.length === 0) {
      throw new Error(`No source blocks found for IDs: ${sourceBlockIds.join(", ")}`);
    }

    // Generate new derivative
    console.log(`🤖 [DerivativeService] Calling generation agent for derivative...`);
    const result = await generateFn(sourceBlocks);
    console.log(`✅ [DerivativeService] Generation complete - ${result.wordCount} words, ${result.claimSources.length} claims tracked`);

    // Get current versions for tracking
    const sourceBlockVersions = await this.getSourceBlockVersions(sourceBlockIds);

    // Create derivative document
    const now = new Date().toISOString();
    const derivative: DerivativeContent = {
      derivativeId,
      sourceBlockIds,
      sourceBlockVersions,
      language,
      tone,
      content: result.content,
      wordCount: result.wordCount,
      factCheckStatus: skipFactCheck ? "skipped" : "pending",
      generatedAt: now,
      generatedBy: "agent",
      usageCount: 1,
      lastUsedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    // Save to database
    await this.saveDerivative(derivative);
    console.log(`💾 [DerivativeService] Saved derivative ${derivativeId} to database`);

    return derivative;
  }

  /**
   * Find an existing derivative by ID
   */
  async findDerivative(derivativeId: string): Promise<DerivativeContent | null> {
    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.DERIVATIVE_CONTENT).findOne({ derivativeId });
    return doc as DerivativeContent | null;
  }

  /**
   * Find derivative by source block combination
   */
  async findBySourceBlocks(
    sourceBlockIds: string[],
    language: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<DerivativeContent | null> {
    const derivativeId = generateDerivativeId(sourceBlockIds, language, tone);
    return this.findDerivative(derivativeId);
  }

  /**
   * Save a new derivative to the database
   */
  async saveDerivative(derivative: DerivativeContent): Promise<void> {
    const db = await getDb();
    await db.collection(COLLECTIONS.DERIVATIVE_CONTENT).updateOne(
      { derivativeId: derivative.derivativeId },
      { $set: derivative },
      { upsert: true }
    );
  }

  /**
   * Update fact-check status and results for a derivative
   */
  async updateFactCheckStatus(
    derivativeId: string,
    status: FactCheckStatus,
    result?: {
      overallConfidence: number;
      claimCount: number;
      verifiedCount: number;
      unsupportedCount: number;
      claimSources: ClaimSource[];
      verifiedAgainst: string[];
    }
  ): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
      factCheckStatus: status,
      updatedAt: now,
    };

    if (result) {
      update.factCheckResult = {
        ...result,
        checkedAt: now,
      };
    }

    await db.collection(COLLECTIONS.DERIVATIVE_CONTENT).updateOne(
      { derivativeId },
      { $set: update }
    );
  }

  /**
   * Increment usage count for a derivative
   */
  async incrementUsage(derivativeId: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.collection(COLLECTIONS.DERIVATIVE_CONTENT).updateOne(
      { derivativeId },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: now },
      }
    );
  }

  /**
   * Invalidate derivatives that depend on a specific source block
   * Called when a source block is updated
   */
  async invalidateBySourceBlock(sourceBlockId: string): Promise<number> {
    const db = await getDb();

    const result = await db.collection(COLLECTIONS.DERIVATIVE_CONTENT).updateMany(
      { sourceBlockIds: sourceBlockId },
      {
        $set: {
          factCheckStatus: "pending" as FactCheckStatus,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return result.modifiedCount;
  }

  /**
   * Delete derivatives that are stale (source blocks have changed)
   */
  async deleteStaleDerivatives(): Promise<number> {
    const db = await getDb();

    // Get all derivatives
    const derivatives = await db
      .collection(COLLECTIONS.DERIVATIVE_CONTENT)
      .find({})
      .toArray() as unknown as DerivativeContent[];

    let deletedCount = 0;

    for (const derivative of derivatives) {
      const currentVersions = await this.getSourceBlockVersions(derivative.sourceBlockIds);

      if (!isDerivativeValid(derivative, currentVersions)) {
        await db.collection(COLLECTIONS.DERIVATIVE_CONTENT).deleteOne({
          derivativeId: derivative.derivativeId,
        });
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get content for source blocks
   */
  async getSourceBlocksContent(
    sourceBlockIds: string[],
    language: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<SourceBlockContent[]> {
    const blocks: SourceBlockContent[] = [];

    for (const blockId of sourceBlockIds) {
      const doc = await this.contentService.getContentById(blockId);

      if (!doc) {
        console.warn(`Source block not found: ${blockId}`);
        continue;
      }

      const variant = doc.variants?.[language]?.[tone];

      if (!variant?.content) {
        console.warn(`No variant found for ${blockId} in ${language}/${tone}`);
        continue;
      }

      blocks.push({
        blockId: doc.contentId,
        blockType: doc.type,
        name: doc.name,
        content: variant.content,
        version: doc.version,
      });
    }

    return blocks;
  }

  /**
   * Get current versions of source blocks
   */
  async getSourceBlockVersions(sourceBlockIds: string[]): Promise<Record<string, string>> {
    const versions: Record<string, string> = {};

    for (const blockId of sourceBlockIds) {
      const doc = await this.contentService.getContentById(blockId);
      versions[blockId] = doc?.version || "unknown";
    }

    return versions;
  }

  /**
   * Get statistics about derivatives
   */
  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgUsageCount: number;
    staleCount: number;
  }> {
    const db = await getDb();

    const [total, byStatus, avgUsage] = await Promise.all([
      db.collection(COLLECTIONS.DERIVATIVE_CONTENT).countDocuments(),
      db
        .collection(COLLECTIONS.DERIVATIVE_CONTENT)
        .aggregate([
          { $group: { _id: "$factCheckStatus", count: { $sum: 1 } } },
        ])
        .toArray(),
      db
        .collection(COLLECTIONS.DERIVATIVE_CONTENT)
        .aggregate([
          { $group: { _id: null, avg: { $avg: "$usageCount" } } },
        ])
        .toArray(),
    ]);

    const statusMap: Record<string, number> = {};
    for (const item of byStatus) {
      statusMap[item._id as string] = item.count;
    }

    // Count stale derivatives
    const derivatives = await db
      .collection(COLLECTIONS.DERIVATIVE_CONTENT)
      .find({})
      .toArray() as unknown as DerivativeContent[];

    let staleCount = 0;
    for (const derivative of derivatives) {
      const currentVersions = await this.getSourceBlockVersions(derivative.sourceBlockIds);
      if (!isDerivativeValid(derivative, currentVersions)) {
        staleCount++;
      }
    }

    return {
      total,
      byStatus: statusMap,
      avgUsageCount: avgUsage[0]?.avg || 0,
      staleCount,
    };
  }

  /**
   * List derivatives with pagination
   */
  async listDerivatives(options: {
    page?: number;
    limit?: number;
    status?: FactCheckStatus;
  } = {}): Promise<{
    derivatives: DerivativeContent[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const db = await getDb();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (options.status) {
      query.factCheckStatus = options.status;
    }

    const [derivatives, total] = await Promise.all([
      db
        .collection(COLLECTIONS.DERIVATIVE_CONTENT)
        .find(query)
        .sort({ lastUsedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.DERIVATIVE_CONTENT).countDocuments(query),
    ]);

    return {
      derivatives: derivatives as unknown as DerivativeContent[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export function createDerivativeContentService(): DerivativeContentService {
  return new DerivativeContentService();
}
