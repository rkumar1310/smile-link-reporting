/**
 * Text Module Detail API
 * GET  /api/text-modules/[id] — get a single text module
 * PUT  /api/text-modules/[id] — update content.en / content.nl
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const doc = await db
      .collection(COLLECTIONS.CONTENT)
      .findOne({ _id: id as unknown as import("mongodb").ObjectId, type: "text_module" });

    if (!doc) {
      return NextResponse.json(
        { error: "Text module not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Error fetching text module:", error);
    return NextResponse.json(
      { error: "Failed to fetch text module" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    // Validate: only allow updating content.en and content.nl
    const updateFields: Record<string, string> = {};
    if (typeof body.content?.en === "string") {
      updateFields["content.en"] = body.content.en;
    }
    if (typeof body.content?.nl === "string") {
      updateFields["content.nl"] = body.content.nl;
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update. Provide content.en and/or content.nl." },
        { status: 400 }
      );
    }

    const result = await db
      .collection(COLLECTIONS.CONTENT)
      .updateOne(
        { _id: id as unknown as import("mongodb").ObjectId, type: "text_module" },
        {
          $set: {
            ...updateFields,
            updatedAt: new Date().toISOString(),
          },
        }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Text module not found" },
        { status: 404 }
      );
    }

    // Return updated document
    const updated = await db
      .collection(COLLECTIONS.CONTENT)
      .findOne({ _id: id as unknown as import("mongodb").ObjectId });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating text module:", error);
    return NextResponse.json(
      { error: "Failed to update text module" },
      { status: 500 }
    );
  }
}
