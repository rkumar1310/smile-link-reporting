/**
 * Embedding and Vector Search Types
 * Types for Qdrant integration with source documents
 */

import { z } from "zod";
import { DocumentTypes, type DocumentType } from "./source";

// =============================================================================
// EMBEDDING CHUNK
// =============================================================================

/**
 * Represents a chunk of content ready for embedding
 * Created from SourceDocument sections/scenarios
 */
export interface EmbeddingChunk {
  id: string;                    // Unique chunk ID for Qdrant point
  mongoDocId: string;            // Reference to MongoDB document _id
  documentType: DocumentType;
  filename: string;
  language: "en" | "nl" | "mixed";

  // Content
  title: string;
  content: string;               // Actual text to embed
  contentPreview: string;        // First 200 chars for display

  // Scenario-specific (only for scenario documents)
  scenarioId?: string;           // "S01", "S02"
  scenarioTitle?: string;
  sectionNumber?: number;        // 1-11
  sectionTitle?: string;

  // Non-scenario specific
  sectionId?: string;
  sectionPath?: string[];
  pageStart?: number;
  pageEnd?: number;

  // Chunk metadata
  chunkIndex: number;            // 0 for non-split, 0+ for split chunks
  totalChunks: number;
}

export const EmbeddingChunkSchema = z.object({
  id: z.string(),
  mongoDocId: z.string(),
  documentType: z.enum(DocumentTypes),
  filename: z.string(),
  language: z.enum(["en", "nl", "mixed"]),
  title: z.string(),
  content: z.string(),
  contentPreview: z.string(),
  scenarioId: z.string().optional(),
  scenarioTitle: z.string().optional(),
  sectionNumber: z.number().optional(),
  sectionTitle: z.string().optional(),
  sectionId: z.string().optional(),
  sectionPath: z.array(z.string()).optional(),
  pageStart: z.number().optional(),
  pageEnd: z.number().optional(),
  chunkIndex: z.number(),
  totalChunks: z.number(),
});

// =============================================================================
// QDRANT PAYLOAD
// =============================================================================

/**
 * Payload stored alongside vector in Qdrant
 * Contains all metadata needed for search results
 */
export interface QdrantPointPayload {
  mongoDocId: string;
  documentType: DocumentType;
  filename: string;
  language: "en" | "nl" | "mixed";
  title: string;
  content: string;               // Full chunk text for retrieval
  contentPreview: string;
  scenarioId?: string;
  scenarioTitle?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  sectionId?: string;
  sectionPath?: string[];
  pageStart?: number;
  pageEnd?: number;
  chunkIndex: number;
  totalChunks: number;
  embeddedAt: string;            // ISO timestamp
}

// =============================================================================
// VECTOR SYNC TYPES
// =============================================================================

export const VectorSyncStatuses = ["created", "updated", "unchanged", "error"] as const;
export type VectorSyncStatus = typeof VectorSyncStatuses[number];

/**
 * Result of syncing a single document to Qdrant
 */
export interface VectorSyncResult {
  mongoDocId: string;
  filename: string;
  chunksCreated: number;
  pointsDeleted: number;
  status: VectorSyncStatus;
  error?: string;
  embeddedAt: string;
}

export const VectorSyncResultSchema = z.object({
  mongoDocId: z.string(),
  filename: z.string(),
  chunksCreated: z.number(),
  pointsDeleted: z.number(),
  status: z.enum(VectorSyncStatuses),
  error: z.string().optional(),
  embeddedAt: z.string(),
});

// =============================================================================
// EMBED API TYPES
// =============================================================================

/**
 * Request to embed source documents
 */
export interface EmbedSourcesRequest {
  mongoDocIds?: string[];        // Specific docs to embed, or all if empty
  forceReembed?: boolean;        // Re-embed even if already embedded
}

export const EmbedSourcesRequestSchema = z.object({
  mongoDocIds: z.array(z.string()).optional(),
  forceReembed: z.boolean().optional(),
});

/**
 * Response from embed endpoint
 */
export interface EmbedSourcesResponse {
  success: boolean;
  results: VectorSyncResult[];
  totalProcessed: number;
  totalChunks: number;
  errors: number;
}

// =============================================================================
// SEMANTIC SEARCH TYPES
// =============================================================================

/**
 * Request for semantic search
 */
export interface SemanticSearchRequest {
  query: string;
  documentTypes?: DocumentType[];
  scenarioIds?: string[];        // Filter by specific scenarios
  languages?: ("en" | "nl" | "mixed")[];
  limit?: number;                // Default 10, max 50
  scoreThreshold?: number;       // Minimum similarity score (0-1), default 0.1
}

export const SemanticSearchRequestSchema = z.object({
  query: z.string().min(1),
  documentTypes: z.array(z.enum(DocumentTypes)).optional(),
  scenarioIds: z.array(z.string()).optional(),
  languages: z.array(z.enum(["en", "nl", "mixed"])).optional(),
  limit: z.number().min(1).max(50).optional(),
  scoreThreshold: z.number().min(0).max(1).optional(),
});

/**
 * Single search result
 */
export interface SemanticSearchResult {
  mongoDocId: string;
  documentType: DocumentType;
  filename: string;

  // Location info
  scenarioId?: string;
  scenarioTitle?: string;
  sectionNumber?: number;
  sectionTitle?: string;
  sectionId?: string;

  // Content
  title: string;
  content: string;               // Full chunk content
  contentPreview: string;

  // Search metadata
  score: number;                 // Similarity score 0-1
  chunkIndex: number;
  totalChunks: number;
}

export const SemanticSearchResultSchema = z.object({
  mongoDocId: z.string(),
  documentType: z.enum(DocumentTypes),
  filename: z.string(),
  scenarioId: z.string().optional(),
  scenarioTitle: z.string().optional(),
  sectionNumber: z.number().optional(),
  sectionTitle: z.string().optional(),
  sectionId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  contentPreview: z.string(),
  score: z.number(),
  chunkIndex: z.number(),
  totalChunks: z.number(),
});

/**
 * Response from semantic search
 */
export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  total: number;
  query: string;
  searchTimeMs: number;
}
