/**
 * Embeddings Module
 * Services for generating and managing vector embeddings
 */

export {
  EmbeddingProvider,
  createEmbeddingProvider,
  type EmbeddingConfig,
} from "./EmbeddingProvider";

export {
  ChunkingService,
  createChunkingService,
  type ChunkingConfig,
} from "./ChunkingService";

export {
  VectorSyncService,
  createVectorSyncService,
} from "./VectorSyncService";
