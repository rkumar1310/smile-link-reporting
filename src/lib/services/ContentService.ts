/**
 * Content Service
 * MongoDB operations for content retrieval and availability checking
 */

import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type {
  ContentDocument,
  ToneProfileId,
  SupportedLanguage,
  ContentType,
} from "@/lib/types";
import type {
  ContentGap,
  ContentCheckResult,
  ScoredScenario,
} from "@/lib/types/types/report-generation";

export class ContentService {
  /**
   * Get a single content document by contentId
   */
  async getContentById(contentId: string): Promise<ContentDocument | null> {
    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.CONTENT).findOne({ contentId });
    return doc as ContentDocument | null;
  }

  /**
   * Get content documents by type
   */
  async getContentByType(type: ContentType): Promise<ContentDocument[]> {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.CONTENT)
      .find({ type })
      .toArray();
    return docs as unknown as ContentDocument[];
  }

  /**
   * Get content for a specific scenario
   */
  async getContentByScenario(
    scenarioId: string,
    lang: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<ContentDocument | null> {
    const db = await getDb();

    // Query for content with the specific variant
    const doc = await db.collection(COLLECTIONS.CONTENT).findOne({
      contentId: scenarioId,
      [`variants.${lang}.${tone}`]: { $exists: true },
    });

    return doc as ContentDocument | null;
  }

  /**
   * Get all content documents that have a specific tone variant
   */
  async getContentWithVariant(
    lang: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<ContentDocument[]> {
    const db = await getDb();

    const docs = await db
      .collection(COLLECTIONS.CONTENT)
      .find({
        [`variants.${lang}.${tone}`]: { $exists: true },
      })
      .toArray();

    return docs as unknown as ContentDocument[];
  }

  /**
   * Check which content items are missing a specific tone variant
   * This is used to determine what needs to be generated
   */
  async findMissingVariants(
    contentIds: string[],
    lang: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<ContentGap[]> {
    const db = await getDb();

    // Get all requested content documents
    const docs = await db
      .collection(COLLECTIONS.CONTENT)
      .find({ contentId: { $in: contentIds } })
      .toArray();

    const contentDocs = docs as unknown as ContentDocument[];
    const gaps: ContentGap[] = [];

    for (const contentId of contentIds) {
      const doc = contentDocs.find((d) => d.contentId === contentId);

      if (!doc) {
        // Content document doesn't exist at all
        gaps.push({
          contentId,
          scenarioId: contentId,
          contentType: "scenario",
          name: contentId,
          missingVariant: { lang, tone },
        });
      } else {
        // Check if the specific variant exists
        const variant = doc.variants?.[lang]?.[tone];
        if (!variant || !variant.content) {
          gaps.push({
            contentId: doc.contentId,
            scenarioId: doc.contentId,
            contentType: doc.type,
            name: doc.name,
            description: doc.description,       // Include description for semantic search
            sections: doc.targetSections,       // Include target sections
            missingVariant: { lang, tone },
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Check content availability for a set of scenarios
   * Returns detailed information about what's available and what's missing
   */
  async checkContentAvailability(
    scenarios: ScoredScenario[],
    lang: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<ContentCheckResult> {
    const scenarioIds = scenarios.map((s) => s.scenarioId);

    // Also check for related A_blocks and B_blocks for these scenarios
    const db = await getDb();
    const allContent = await db
      .collection(COLLECTIONS.CONTENT)
      .find({
        $or: [
          { contentId: { $in: scenarioIds } },
          { type: { $in: ["a_block", "b_block"] } },
        ],
      })
      .toArray();

    const contentDocs = allContent as unknown as ContentDocument[];

    // Determine which content items we need for the report
    // For now, we'll focus on scenarios only
    const requiredContentIds = scenarioIds;

    const available: Array<{ contentId: string; scenarioId?: string; name: string }> = [];
    const missing: ContentGap[] = [];

    for (const contentId of requiredContentIds) {
      const doc = contentDocs.find((d) => d.contentId === contentId);

      if (doc && doc.variants?.[lang]?.[tone]?.content) {
        available.push({
          contentId: doc.contentId,
          scenarioId: doc.contentId,
          name: doc.name,
        });
      } else {
        missing.push({
          contentId: contentId,
          scenarioId: contentId,
          contentType: doc?.type || "scenario",
          name: doc?.name || contentId,
          description: doc?.description, // Include description for semantic search
          sections: doc?.targetSections,  // Include target sections
          missingVariant: { lang, tone },
        });
      }
    }

    return {
      totalRequired: requiredContentIds.length,
      available: available.length,
      missing,
      availableContent: available,
    };
  }

  /**
   * Get content for composing a report
   * Returns content documents with the specific variant populated
   */
  async getContentForReport(
    contentIds: string[],
    lang: SupportedLanguage,
    tone: ToneProfileId
  ): Promise<ContentDocument[]> {
    const db = await getDb();

    const docs = await db
      .collection(COLLECTIONS.CONTENT)
      .find({
        contentId: { $in: contentIds },
        [`variants.${lang}.${tone}`]: { $exists: true },
      })
      .toArray();

    return docs as unknown as ContentDocument[];
  }

  /**
   * Get all scenarios
   */
  async getAllScenarios(): Promise<ContentDocument[]> {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.CONTENT)
      .find({ type: "scenario" })
      .sort({ contentId: 1 })
      .toArray();

    return docs as unknown as ContentDocument[];
  }

  /**
   * Update a content variant
   * Used after generating new content
   */
  async updateContentVariant(
    contentId: string,
    lang: SupportedLanguage,
    tone: ToneProfileId,
    variant: {
      content: string;
      wordCount: number;
      citations: Array<{
        sourceDocId: string;
        sourcePath: string;
        section: string;
        pageNumber?: number;
        excerpt: string;
        matchConfidence: number;
      }>;
      generatedBy: "manual" | "agent";
      generationJobId?: string;
    }
  ): Promise<boolean> {
    const db = await getDb();

    const updatePath = `variants.${lang}.${tone}`;
    const result = await db.collection(COLLECTIONS.CONTENT).updateOne(
      { contentId },
      {
        $set: {
          [updatePath]: {
            content: variant.content,
            wordCount: variant.wordCount,
            citations: variant.citations,
            generatedAt: new Date().toISOString(),
            generatedBy: variant.generatedBy,
            generationJobId: variant.generationJobId,
            factCheckStatus: "pending",
            variantStatus: "draft",
          },
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Check if any content exists in the database
   */
  async hasContent(): Promise<boolean> {
    const db = await getDb();
    const count = await db.collection(COLLECTIONS.CONTENT).countDocuments();
    return count > 0;
  }

  /**
   * Get content statistics
   */
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    withVariants: number;
  }> {
    const db = await getDb();

    const [total, byType, byStatus, withVariants] = await Promise.all([
      db.collection(COLLECTIONS.CONTENT).countDocuments(),
      db
        .collection(COLLECTIONS.CONTENT)
        .aggregate([
          { $group: { _id: "$type", count: { $sum: 1 } } },
        ])
        .toArray(),
      db
        .collection(COLLECTIONS.CONTENT)
        .aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray(),
      db.collection(COLLECTIONS.CONTENT).countDocuments({
        "variants.en": { $exists: true },
      }),
    ]);

    const typeMap: Record<string, number> = {};
    for (const item of byType) {
      typeMap[item._id as string] = item.count;
    }

    const statusMap: Record<string, number> = {};
    for (const item of byStatus) {
      statusMap[item._id as string] = item.count;
    }

    return {
      total,
      byType: typeMap,
      byStatus: statusMap,
      withVariants,
    };
  }
}

export function createContentService(): ContentService {
  return new ContentService();
}
