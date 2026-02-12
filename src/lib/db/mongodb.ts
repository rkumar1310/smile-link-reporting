/**
 * MongoDB Connection Utility
 * Provides a singleton connection to MongoDB
 */

import { MongoClient, Db } from "mongodb";

interface CachedConnection {
  client: MongoClient | null;
  db: Db | null;
  promise: Promise<{ client: MongoClient; db: Db }> | null;
}

// Cache the connection in development to prevent multiple connections
const globalWithMongo = global as typeof globalThis & {
  _mongoConnection: CachedConnection;
};

const cached: CachedConnection = globalWithMongo._mongoConnection || {
  client: null,
  db: null,
  promise: null,
};

if (!globalWithMongo._mongoConnection) {
  globalWithMongo._mongoConnection = cached;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB || "smilelink_cms";

  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }

  if (cached.client && cached.db) {
    return { client: cached.client, db: cached.db };
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI).then((client) => {
      const db = client.db(MONGODB_DB);
      return { client, db };
    });
  }

  const { client, db } = await cached.promise;
  cached.client = client;
  cached.db = db;

  return { client, db };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

// Collection names
export const COLLECTIONS = {
  CONTENT: "content",
  SOURCE_DOCUMENTS: "sourceDocuments",
  FACT_CHECK_RECORDS: "factCheckRecords",
  GENERATION_JOBS: "generationJobs",
  CONTENT_USAGE: "contentUsage",
  DERIVATIVE_CONTENT: "derivativeContent",
  SCENARIOS: "scenarios",
} as const;
