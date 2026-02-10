/**
 * Source Documents Parse API Route
 * POST /api/sources/parse - Parse DOCX files from a directory
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import * as fs from "fs";
import * as path from "path";
import { createDocxParser } from "@/lib/agents";
import { createVectorSyncService } from "@/lib/agents/embeddings";
import type { DocumentType, SourceDocument } from "@/lib/types";

// Schema for parse request
const ParseDirectorySchema = z.object({
  directory: z.string().min(1),
  forceReparse: z.boolean().optional(),
});

/**
 * POST /api/sources/parse
 * Parse all DOCX files in a directory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = ParseDirectorySchema.parse(body);

    // Resolve the directory path relative to project root
    const projectRoot = process.cwd();
    // Go up from cms-dashboard to documents root
    const rootPath = projectRoot.includes("cms-dashboard")
      ? path.resolve(projectRoot, "..", "..")
      : projectRoot;
    const dirPath = path.resolve(rootPath, input.directory);

    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json(
        { error: `Directory not found: ${input.directory}` },
        { status: 404 }
      );
    }

    // Find all DOCX files
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".docx"));

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No DOCX files found in directory" },
        { status: 404 }
      );
    }

    const db = await getDb();
    const parser = createDocxParser();
    const vectorSyncService = createVectorSyncService();
    let parsed = 0;
    let skipped = 0;
    let errors = 0;
    let embedded = 0;
    const results: Array<{ filename: string; status: string; sections?: number; embedded?: boolean; error?: string }> = [];

    for (const filename of files) {
      const filePath = path.join(dirPath, filename);
      const relativePath = path.join(input.directory, filename);

      try {
        // Check if already parsed with same hash (unless force reparse)
        const existing = await db
          .collection(COLLECTIONS.SOURCE_DOCUMENTS)
          .findOne({ path: relativePath });

        if (existing && !input.forceReparse) {
          // Check if needs reparse using the parser
          const needsReparse = await parser.needsReparse(filePath, existing as any);
          if (!needsReparse) {
            skipped++;
            results.push({
              filename,
              status: "skipped (unchanged)",
              sections: existing.sections?.length || 0
            });
            continue;
          }
        }

        // Determine document type from filename
        const documentType = detectDocumentType(filename);

        // Parse the document using DocxParser
        const parseResult = await parser.parse(filePath, { documentType });

        // Build the document record
        const docRecord: Record<string, unknown> = {
          filename: parseResult.document.filename,
          path: relativePath,
          fileHash: parseResult.document.fileHash,
          sections: parseResult.document.sections,
          language: parseResult.document.language,
          documentType: parseResult.document.documentType,
          parsedAt: parseResult.document.parsedAt,
          parsedVersion: parseResult.document.parsedVersion,
          createdAt: existing?.createdAt || parseResult.document.createdAt,
          updatedAt: parseResult.document.updatedAt,
          metadata: {
            warnings: parseResult.warnings,
            fileSize: fs.statSync(filePath).size,
          },
        };

        // Add scenarios field for scenario documents (hierarchical structure)
        if (parseResult.document.scenarios && parseResult.document.scenarios.length > 0) {
          docRecord.scenarios = parseResult.document.scenarios;
        }

        let docId: string;
        if (existing) {
          await db
            .collection(COLLECTIONS.SOURCE_DOCUMENTS)
            .updateOne({ _id: existing._id }, { $set: docRecord });
          docId = existing._id.toString();
        } else {
          const insertResult = await db.collection(COLLECTIONS.SOURCE_DOCUMENTS).insertOne(docRecord);
          docId = insertResult.insertedId.toString();
        }

        // Auto-embed to Qdrant
        let wasEmbedded = false;
        try {
          const sourceDoc: SourceDocument = {
            ...docRecord,
            _id: docId,
          } as SourceDocument;
          const syncResult = await vectorSyncService.syncDocument(sourceDoc);
          wasEmbedded = syncResult.status !== "error";
          if (wasEmbedded) embedded++;
        } catch (embedError) {
          console.error(`Error embedding ${filename}:`, embedError);
          // Don't fail the whole parse if embedding fails
        }

        parsed++;
        const itemCount = parseResult.document.scenarios?.length || parseResult.document.sections.length;
        results.push({
          filename,
          status: existing ? "updated" : "created",
          sections: itemCount,
          embedded: wasEmbedded,
        });
      } catch (err) {
        errors++;
        results.push({
          filename,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
        console.error(`Error parsing ${filename}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      parsed,
      skipped,
      errors,
      embedded,
      total: files.length,
      results,
    });
  } catch (error) {
    console.error("Error parsing source documents:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to parse source documents", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

/**
 * Detect document type from filename
 */
function detectDocumentType(filename: string): DocumentType {
  const lowerName = filename.toLowerCase();

  if (lowerName.includes("scenario")) return "scenarios";
  if (lowerName.includes("module")) return "modules";
  if (lowerName.includes("fall") && lowerName.includes("back")) return "fallbacks";
  if (lowerName.includes("nuance")) return "nuances";
  if (lowerName.includes("kost")) return "costs";

  return "modules"; // Default
}
