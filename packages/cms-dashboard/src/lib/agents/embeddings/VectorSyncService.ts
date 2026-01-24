/**
 * Vector Sync Service
 * Synchronizes MongoDB source documents with Qdrant vectors
 */

import type {
  SourceDocument,
  EmbeddingChunk,
  VectorSyncResult,
} from "@/lib/types";
import { getQdrantClient, QDRANT_COLLECTION } from "@/lib/db/qdrant";
import { EmbeddingProvider, createEmbeddingProvider } from "./EmbeddingProvider";
import { ChunkingService, createChunkingService } from "./ChunkingService";

export class VectorSyncService {
  private embedder: EmbeddingProvider;
  private chunker: ChunkingService;

  constructor() {
    this.embedder = createEmbeddingProvider();
    this.chunker = createChunkingService();
  }

  /**
   * Sync a single document to Qdrant
   * Deletes existing vectors and creates new ones
   */
  async syncDocument(doc: SourceDocument): Promise<VectorSyncResult> {
    const mongoDocId = doc._id || "";
    const now = new Date().toISOString();

    try {
      const client = await getQdrantClient();

      // Delete existing points for this document
      await client.delete(QDRANT_COLLECTION, {
        filter: {
          must: [{ key: "mongoDocId", match: { value: mongoDocId } }],
        },
      });

      // Generate chunks
      const chunks = this.chunker.chunkDocument(doc);

      if (chunks.length === 0) {
        return {
          mongoDocId,
          filename: doc.filename,
          chunksCreated: 0,
          pointsDeleted: 0,
          status: "unchanged",
          embeddedAt: now,
        };
      }

      // Generate embeddings for all chunks
      const texts = chunks.map((c) => c.content);
      const embeddings = await this.embedder.embedBatch(texts);

      // Prepare points for Qdrant
      const points = chunks.map((chunk, i) => ({
        id: this.generatePointId(chunk.id),
        vector: embeddings[i],
        payload: this.buildPayload(chunk, now),
      }));

      // Upsert points to Qdrant
      await client.upsert(QDRANT_COLLECTION, {
        wait: true,
        points,
      });

      return {
        mongoDocId,
        filename: doc.filename,
        chunksCreated: chunks.length,
        pointsDeleted: 0, // Qdrant delete doesn't return count
        status: "updated",
        embeddedAt: now,
      };
    } catch (error) {
      console.error(`Error syncing document ${mongoDocId}:`, error);
      return {
        mongoDocId,
        filename: doc.filename,
        chunksCreated: 0,
        pointsDeleted: 0,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        embeddedAt: now,
      };
    }
  }

  /**
   * Sync multiple documents to Qdrant
   */
  async syncDocuments(docs: SourceDocument[]): Promise<VectorSyncResult[]> {
    const results: VectorSyncResult[] = [];

    for (const doc of docs) {
      const result = await this.syncDocument(doc);
      results.push(result);
    }

    return results;
  }

  /**
   * Delete all vectors for a document
   */
  async deleteDocument(mongoDocId: string): Promise<void> {
    const client = await getQdrantClient();

    await client.delete(QDRANT_COLLECTION, {
      filter: {
        must: [{ key: "mongoDocId", match: { value: mongoDocId } }],
      },
    });
  }

  /**
   * Get count of vectors for a document
   */
  async getDocumentVectorCount(mongoDocId: string): Promise<number> {
    const client = await getQdrantClient();

    const result = await client.count(QDRANT_COLLECTION, {
      filter: {
        must: [{ key: "mongoDocId", match: { value: mongoDocId } }],
      },
      exact: true,
    });

    return result.count;
  }

  /**
   * Generate a UUID for Qdrant point ID
   * Uses deterministic hash based on chunk ID for consistency
   */
  private generatePointId(chunkId: string): string {
    // Create a deterministic UUID-like ID from the chunk ID
    // This ensures the same chunk always gets the same point ID
    const hash = this.hashString(chunkId);
    // Format as UUID
    return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
  }

  /**
   * Simple hash function for deterministic ID generation
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash | 0; // Convert to 32-bit integer
    }
    // Convert to hex and pad to ensure consistent length
    const hex = Math.abs(hash).toString(16).padStart(8, "0");
    // Create a longer hash by hashing different parts
    let fullHash = hex;
    for (let i = 0; i < 3; i++) {
      let part = 0;
      for (let j = 0; j < str.length; j++) {
        part = ((part << 5) - part + str.charCodeAt(j) + i * 31) | 0;
      }
      fullHash += Math.abs(part).toString(16).padStart(8, "0");
    }
    return fullHash.slice(0, 32);
  }

  /**
   * Build Qdrant payload from chunk
   */
  private buildPayload(chunk: EmbeddingChunk, embeddedAt: string): Record<string, unknown> {
    return {
      mongoDocId: chunk.mongoDocId,
      documentType: chunk.documentType,
      filename: chunk.filename,
      language: chunk.language,
      title: chunk.title,
      content: chunk.content,
      contentPreview: chunk.contentPreview,
      scenarioId: chunk.scenarioId,
      scenarioTitle: chunk.scenarioTitle,
      sectionNumber: chunk.sectionNumber,
      sectionTitle: chunk.sectionTitle,
      sectionId: chunk.sectionId,
      sectionPath: chunk.sectionPath,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      embeddedAt,
    };
  }
}

export function createVectorSyncService(): VectorSyncService {
  return new VectorSyncService();
}
