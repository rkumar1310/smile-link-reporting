/**
 * Content Detail API Routes
 * GET /api/content/:id - Get single content with all variants
 * PUT /api/content/:id - Update content metadata
 * DELETE /api/content/:id - Archive content (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { ContentDocument, UpdateContentInput } from "@/lib/types";

// Schema for updating content
const UpdateContentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  triggerDrivers: z.record(z.string(), z.array(z.string())).optional(),
  targetSection: z.number().optional(),
  targetSections: z.array(z.number()).optional(),
  placeholders: z.array(z.object({
    key: z.string(),
    source: z.string(),
    fallback: z.string(),
  })).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/content/:id
 * Get content by ID or MongoDB _id
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Try to find by contentId first, then by _id
    let content = await db
      .collection(COLLECTIONS.CONTENT)
      .findOne({ contentId: id });

    if (!content && ObjectId.isValid(id)) {
      content = await db
        .collection(COLLECTIONS.CONTENT)
        .findOne({ _id: new ObjectId(id) });
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(content as unknown as ContentDocument);
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content/:id
 * Update content metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const input = UpdateContentSchema.parse(body) as UpdateContentInput;

    const db = await getDb();

    // Find the content
    let filter: Record<string, unknown> = { contentId: id };
    let content = await db.collection(COLLECTIONS.CONTENT).findOne(filter);

    if (!content && ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
      content = await db.collection(COLLECTIONS.CONTENT).findOne(filter);
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updateFields: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
      updatedBy: "system", // TODO: Replace with authenticated user
    };

    if (input.name !== undefined) updateFields.name = input.name;
    if (input.description !== undefined) updateFields.description = input.description;
    if (input.triggerDrivers !== undefined) updateFields.triggerDrivers = input.triggerDrivers;
    if (input.targetSection !== undefined) updateFields.targetSection = input.targetSection;
    if (input.targetSections !== undefined) updateFields.targetSections = input.targetSections;
    if (input.placeholders !== undefined) updateFields.placeholders = input.placeholders;

    await db.collection(COLLECTIONS.CONTENT).updateOne(filter, { $set: updateFields });

    // Return updated content
    const updated = await db.collection(COLLECTIONS.CONTENT).findOne(filter);
    return NextResponse.json(updated as unknown as ContentDocument);
  } catch (error) {
    console.error("Error updating content:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update content" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content/:id
 * Archive content (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Find the content
    let filter: Record<string, unknown> = { contentId: id };
    let content = await db.collection(COLLECTIONS.CONTENT).findOne(filter);

    if (!content && ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
      content = await db.collection(COLLECTIONS.CONTENT).findOne(filter);
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Archive instead of delete
    await db.collection(COLLECTIONS.CONTENT).updateOne(filter, {
      $set: {
        status: "archived",
        updatedAt: new Date().toISOString(),
        updatedBy: "system",
      },
    });

    return NextResponse.json({ success: true, message: "Content archived" });
  } catch (error) {
    console.error("Error archiving content:", error);
    return NextResponse.json(
      { error: "Failed to archive content" },
      { status: 500 }
    );
  }
}
