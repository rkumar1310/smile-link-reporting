/**
 * Fact Check API Routes for specific content
 * GET /api/factcheck/[contentId] - Get fact check results for content
 * POST /api/factcheck/[contentId] - Run fact check on content
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { FactCheckRecord, ClaimVerdict } from "@/lib/types";

// Schema for running fact check
const RunFactCheckSchema = z.object({
  language: z.enum(["en", "nl"]),
  tone: z.enum(["TP-01", "TP-02", "TP-03", "TP-04", "TP-05", "TP-06"]),
});

/**
 * GET /api/factcheck/[contentId]
 * Get fact check results for a specific content
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const db = await getDb();

    const records = await db
      .collection(COLLECTIONS.FACT_CHECK_RECORDS)
      .find({ contentId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      items: records.map((record) => ({
        ...record,
        _id: record._id.toString(),
      })),
      total: records.length,
    });
  } catch (error) {
    console.error("Error getting fact check results:", error);
    return NextResponse.json(
      { error: "Failed to get fact check results" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/factcheck/[contentId]
 * Run fact check on content
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const body = await request.json();
    const input = RunFactCheckSchema.parse(body);

    const db = await getDb();

    // Check if content exists and has the variant
    const content = await db
      .collection(COLLECTIONS.CONTENT)
      .findOne({ contentId });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const variant = content.variants?.[input.language]?.[input.tone];
    if (!variant) {
      return NextResponse.json(
        { error: `No variant found for ${input.language}/${input.tone}` },
        { status: 404 }
      );
    }

    // In a real implementation, this would run the fact-check agent
    // For now, create a placeholder record
    const now = new Date().toISOString();
    const record: Omit<FactCheckRecord, "_id"> = {
      contentId,
      contentVariantKey: `${input.language}:${input.tone}`,
      claims: [],
      overallVerdict: "inconclusive",
      overallConfidence: 0,
      verifiedCount: 0,
      failedCount: 0,
      inconclusiveCount: 0,
      checkedAt: now,
      checkedBy: "agent",
      durationMs: 0,
      humanReviewed: false,
    };

    const result = await db
      .collection(COLLECTIONS.FACT_CHECK_RECORDS)
      .insertOne(record);

    return NextResponse.json({
      success: true,
      recordId: result.insertedId.toString(),
      message: "Fact check record created. Note: Actual fact-checking requires the cms-agents package.",
    }, { status: 201 });

  } catch (error) {
    console.error("Error running fact check:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to run fact check" },
      { status: 500 }
    );
  }
}
