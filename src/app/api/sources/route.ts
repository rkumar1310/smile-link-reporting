/**
 * Source Documents API Routes
 * GET /api/sources - List all source documents
 * POST /api/sources - Parse/re-parse DOCX files
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { SourceDocument, SourceDocumentListResponse } from "@/lib/types";
import { DocumentTypes } from "@/lib/types";

// Schema for parse request
const ParseSourceSchema = z.object({
  filePath: z.string().min(1),
  documentType: z.enum(DocumentTypes),
  forceReparse: z.boolean().optional(),
});

/**
 * GET /api/sources
 * List all parsed source documents
 */
export async function GET() {
  try {
    const db = await getDb();

    const documents = await db
      .collection(COLLECTIONS.SOURCE_DOCUMENTS)
      .find({})
      .sort({ filename: 1 })
      .toArray();

    // Return items array to match frontend expectations
    return NextResponse.json({
      items: documents.map((doc) => ({
        ...doc,
        _id: doc._id.toString(),
        sectionCount: (doc.sections || []).length,
      })),
      total: documents.length,
    });
  } catch (error) {
    console.error("Error listing source documents:", error);
    return NextResponse.json(
      { error: "Failed to list source documents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources
 * Parse a DOCX file and store in MongoDB
 * Note: Actual parsing is done by the cms-agents package
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = ParseSourceSchema.parse(body);

    const db = await getDb();

    // Check if already parsed
    const existing = await db
      .collection(COLLECTIONS.SOURCE_DOCUMENTS)
      .findOne({ path: input.filePath });

    if (existing && !input.forceReparse) {
      return NextResponse.json({
        success: true,
        message: "Document already parsed. Use forceReparse=true to re-parse.",
        document: existing as unknown as SourceDocument,
        sectionsCount: (existing.sections || []).length,
      });
    }

    // For now, return a placeholder response
    // The actual parsing will be done by the cms-agents package
    return NextResponse.json({
      success: false,
      error: "Document parsing not yet implemented. Use the cms-agents package.",
      filePath: input.filePath,
      documentType: input.documentType,
    }, { status: 501 });

  } catch (error) {
    console.error("Error parsing source document:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to parse source document" },
      { status: 500 }
    );
  }
}
