/**
 * Semantic Search Service
 * Performs vector similarity search against source documents in Qdrant
 */

import type {
  SemanticSearchRequest,
  SemanticSearchResult,
  SemanticSearchResponse,
  DocumentType,
} from "@/lib/types";
import { getQdrantClient, QDRANT_COLLECTION } from "@/lib/db/qdrant";
import { EmbeddingProvider, createEmbeddingProvider } from "../embeddings/EmbeddingProvider";

interface QdrantFilter {
  key: string;
  match: { value: string } | { any: string[] };
}

export class SemanticSearchService {
  private embedder: EmbeddingProvider;

  constructor() {
    this.embedder = createEmbeddingProvider();
  }

  /**
   * Search for semantically similar content
   */
  async search(request: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    const startTime = Date.now();

    const client = await getQdrantClient();

    // Generate query embedding
    const queryVector = await this.embedder.embed(request.query);

    // Build filter conditions
    const filter = this.buildFilter(request);

    // Perform search
    const results = await client.search(QDRANT_COLLECTION, {
      vector: queryVector,
      limit: request.limit ?? 10,
      filter: filter.length > 0 ? { must: filter } : undefined,
      score_threshold: request.scoreThreshold ?? 0.1,
      with_payload: true,
    });

    // Transform results
    const searchResults: SemanticSearchResult[] = results.map((hit) => ({
      mongoDocId: hit.payload?.mongoDocId as string,
      documentType: hit.payload?.documentType as DocumentType,
      filename: hit.payload?.filename as string,
      scenarioId: hit.payload?.scenarioId as string | undefined,
      scenarioTitle: hit.payload?.scenarioTitle as string | undefined,
      sectionNumber: hit.payload?.sectionNumber as number | undefined,
      sectionTitle: hit.payload?.sectionTitle as string | undefined,
      sectionId: hit.payload?.sectionId as string | undefined,
      title: hit.payload?.title as string,
      content: hit.payload?.content as string,
      contentPreview: hit.payload?.contentPreview as string,
      score: hit.score,
      chunkIndex: hit.payload?.chunkIndex as number,
      totalChunks: hit.payload?.totalChunks as number,
    }));

    return {
      results: searchResults,
      total: searchResults.length,
      query: request.query,
      searchTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Get relevant sources for a query
   * Convenience method for content generation
   */
  async getRelevantSources(
    query: string,
    options: {
      documentTypes?: DocumentType[];
      scenarioId?: string;
      language?: "en" | "nl" | "mixed";
      limit?: number;
      scoreThreshold?: number;
    } = {}
  ): Promise<SemanticSearchResult[]> {
    const searchStart = Date.now();

    const response = await this.search({
      query,
      documentTypes: options.documentTypes,
      scenarioIds: options.scenarioId ? [options.scenarioId] : undefined,
      languages: options.language ? [options.language] : undefined,
      limit: options.limit ?? 10,
      scoreThreshold: options.scoreThreshold ?? 0.6,
    });

    console.log(`   ⚡ Qdrant search completed in ${response.searchTimeMs}ms (embedding + search: ${Date.now() - searchStart}ms)`);

    return response.results;
  }

  /**
   * Find similar content to a given text
   * Useful for finding related sections
   */
  async findSimilar(
    text: string,
    excludeMongoDocId?: string,
    limit: number = 5
  ): Promise<SemanticSearchResult[]> {
    const client = await getQdrantClient();
    const queryVector = await this.embedder.embed(text);

    const filter: QdrantFilter[] = [];
    if (excludeMongoDocId) {
      // Qdrant doesn't have "not equal" directly, so we'd need to handle this differently
      // For now, we'll filter in post-processing
    }

    const results = await client.search(QDRANT_COLLECTION, {
      vector: queryVector,
      limit: excludeMongoDocId ? limit + 10 : limit, // Get extra to filter
      filter: filter.length > 0 ? { must: filter } : undefined,
      score_threshold: 0.6,
      with_payload: true,
    });

    let searchResults: SemanticSearchResult[] = results.map((hit) => ({
      mongoDocId: hit.payload?.mongoDocId as string,
      documentType: hit.payload?.documentType as DocumentType,
      filename: hit.payload?.filename as string,
      scenarioId: hit.payload?.scenarioId as string | undefined,
      scenarioTitle: hit.payload?.scenarioTitle as string | undefined,
      sectionNumber: hit.payload?.sectionNumber as number | undefined,
      sectionTitle: hit.payload?.sectionTitle as string | undefined,
      sectionId: hit.payload?.sectionId as string | undefined,
      title: hit.payload?.title as string,
      content: hit.payload?.content as string,
      contentPreview: hit.payload?.contentPreview as string,
      score: hit.score,
      chunkIndex: hit.payload?.chunkIndex as number,
      totalChunks: hit.payload?.totalChunks as number,
    }));

    // Filter out excluded document
    if (excludeMongoDocId) {
      searchResults = searchResults
        .filter((r) => r.mongoDocId !== excludeMongoDocId)
        .slice(0, limit);
    }

    return searchResults;
  }

  /**
   * Build Qdrant filter from search request
   */
  private buildFilter(request: SemanticSearchRequest): QdrantFilter[] {
    const conditions: QdrantFilter[] = [];

    if (request.documentTypes?.length) {
      conditions.push({
        key: "documentType",
        match: { any: request.documentTypes },
      });
    }

    if (request.scenarioIds?.length) {
      conditions.push({
        key: "scenarioId",
        match: { any: request.scenarioIds },
      });
    }

    if (request.languages?.length) {
      conditions.push({
        key: "language",
        match: { any: request.languages },
      });
    }

    return conditions;
  }
}

export function createSemanticSearchService(): SemanticSearchService {
  return new SemanticSearchService();
}
