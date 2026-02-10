/**
 * Reset Database API
 * DELETE /api/reset - Delete all content from the database
 */

import { NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

/**
 * DELETE /api/reset
 * Deletes all content from the database (content, generation jobs, fact-check records)
 */
export async function DELETE() {
  try {
    const db = await getDb();

    // Delete from all content-related collections
    const results = await Promise.all([
      db.collection(COLLECTIONS.CONTENT).deleteMany({}),
      db.collection(COLLECTIONS.GENERATION_JOBS).deleteMany({}),
      db.collection(COLLECTIONS.FACT_CHECK_RECORDS).deleteMany({}),
      db.collection(COLLECTIONS.CONTENT_USAGE).deleteMany({}),
    ]);

    const deletedCounts = {
      content: results[0].deletedCount,
      generationJobs: results[1].deletedCount,
      factCheckRecords: results[2].deletedCount,
      contentUsage: results[3].deletedCount,
    };

    const totalDeleted = Object.values(deletedCounts).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      message: `Deleted ${totalDeleted} documents`,
      deleted: deletedCounts,
    });
  } catch (error) {
    console.error("Error resetting database:", error);
    return NextResponse.json(
      { error: "Failed to reset database" },
      { status: 500 }
    );
  }
}
