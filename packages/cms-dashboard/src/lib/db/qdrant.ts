/**
 * Qdrant Vector Database Client
 * Provides a singleton connection to Qdrant with collection management
 */

import { QdrantClient } from "@qdrant/js-client-rest";

interface QdrantConnection {
  client: QdrantClient | null;
  collectionReady: boolean;
}

// Cache the connection in development to prevent multiple connections
const globalWithQdrant = global as typeof globalThis & {
  _qdrantConnection: QdrantConnection;
};

const cached: QdrantConnection = globalWithQdrant._qdrantConnection || {
  client: null,
  collectionReady: false,
};

if (!globalWithQdrant._qdrantConnection) {
  globalWithQdrant._qdrantConnection = cached;
}

export const QDRANT_COLLECTION = "source_embeddings";
export const VECTOR_SIZE = 3072; // OpenAI text-embedding-3-large

export async function getQdrantClient(): Promise<QdrantClient> {
  if (cached.client && cached.collectionReady) {
    return cached.client;
  }

  const host = process.env.QDRANT_HOST || "localhost";
  const port = parseInt(process.env.QDRANT_PORT || "6333", 10);

  cached.client = new QdrantClient({ host, port });

  // Ensure collection exists with correct schema
  if (!cached.collectionReady) {
    await ensureCollection(cached.client);
    cached.collectionReady = true;
  }

  return cached.client;
}

async function ensureCollection(client: QdrantClient): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some(
    (c) => c.name === QDRANT_COLLECTION
  );

  if (!exists) {
    await client.createCollection(QDRANT_COLLECTION, {
      vectors: {
        size: VECTOR_SIZE,
        distance: "Cosine",
      },
      optimizers_config: {
        default_segment_number: 2,
      },
      replication_factor: 1,
    });

    // Create payload indexes for efficient filtering
    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: "mongoDocId",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: "documentType",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: "scenarioId",
      field_schema: "keyword",
    });
    await client.createPayloadIndex(QDRANT_COLLECTION, {
      field_name: "language",
      field_schema: "keyword",
    });
  }
}

/**
 * Reset the collection (for testing or schema changes)
 */
export async function resetQdrantCollection(): Promise<void> {
  const client = await getQdrantClient();

  try {
    await client.deleteCollection(QDRANT_COLLECTION);
  } catch {
    // Collection may not exist
  }

  cached.collectionReady = false;
  await ensureCollection(client);
  cached.collectionReady = true;
}
