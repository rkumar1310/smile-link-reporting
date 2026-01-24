/**
 * Source Embedding API
 * POST /api/sources/embed - Embed source documents into Qdrant
 */

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import { createVectorSyncService } from "@/lib/agents/embeddings";
import {
  EmbedSourcesRequestSchema,
  type SourceDocument,
  type EmbedSourcesResponse,
} from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<EmbedSourcesResponse | { error: string; details?: unknown }>> {
  try {
    const body = await request.json();
    const parseResult = EmbedSourcesRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const input = parseResult.data;
    const db = await getDb();
    const syncService = createVectorSyncService();

    // Get documents to embed
    let documents: SourceDocument[];

    if (input.mongoDocIds?.length) {
      // Embed specific documents
      const objectIds = input.mongoDocIds.map((id) => new ObjectId(id));
      documents = (await db
        .collection(COLLECTIONS.SOURCE_DOCUMENTS)
        .find({ _id: { $in: objectIds } })
        .toArray()) as unknown as SourceDocument[];
    } else {
      // Embed all documents
      documents = (await db
        .collection(COLLECTIONS.SOURCE_DOCUMENTS)
        .find({})
        .toArray()) as unknown as SourceDocument[];
    }

    // Convert ObjectId to string for each document
    documents = documents.map((doc) => ({
      ...doc,
      _id: doc._id?.toString(),
    }));

    if (documents.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalProcessed: 0,
        totalChunks: 0,
        errors: 0,
      });
    }

    // Sync documents to Qdrant
    const results = await syncService.syncDocuments(documents);

    const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0);
    const errorCount = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      success: errorCount === 0,
      results,
      totalProcessed: documents.length,
      totalChunks,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Error embedding sources:", error);
    return NextResponse.json(
      { error: "Failed to embed sources", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sources/embed - Get embedding status for documents
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const mongoDocId = searchParams.get("mongoDocId");

    const syncService = createVectorSyncService();

    if (mongoDocId) {
      // Get vector count for specific document
      const count = await syncService.getDocumentVectorCount(mongoDocId);
      return NextResponse.json({
        mongoDocId,
        vectorCount: count,
        hasVectors: count > 0,
      });
    }

    // Return general info
    return NextResponse.json({
      message: "Use POST to embed documents, or pass ?mongoDocId=xxx to check status",
    });
  } catch (error) {
    console.error("Error getting embedding status:", error);
    return NextResponse.json(
      { error: "Failed to get embedding status" },
      { status: 500 }
    );
  }
}
