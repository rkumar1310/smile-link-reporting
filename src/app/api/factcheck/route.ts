/**
 * Fact Check API Routes
 * GET /api/factcheck - List all fact check records
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

/**
 * GET /api/factcheck
 * List all fact check records
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const contentId = searchParams.get("contentId");

    const query: Record<string, unknown> = {};
    if (contentId) {
      query.contentId = contentId;
    }

    const [records, total] = await Promise.all([
      db
        .collection(COLLECTIONS.FACT_CHECK_RECORDS)
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.FACT_CHECK_RECORDS).countDocuments(query),
    ]);

    return NextResponse.json({
      items: records.map((record) => ({
        ...record,
        _id: record._id.toString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing fact check records:", error);
    return NextResponse.json(
      { error: "Failed to list fact check records" },
      { status: 500 }
    );
  }
}
