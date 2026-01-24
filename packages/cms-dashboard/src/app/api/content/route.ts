/**
 * Content API Routes
 * GET /api/content - List all content (paginated, filterable)
 * POST /api/content - Create new content
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type {
  ContentDocument,
  ContentListResponse,
  CreateContentInput,
} from "@/lib/types";
import {
  ContentTypes,
  ContentStatuses,
  DriverLayers,
} from "@/lib/types";

// Query schema for listing content
const ContentQuerySchema = z.object({
  type: z.enum(ContentTypes).optional(),
  status: z.enum(ContentStatuses).optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  search: z.string().optional(),
});

// Schema for creating content
const CreateContentSchema = z.object({
  contentId: z.string().min(1),
  type: z.enum(ContentTypes),
  name: z.string().min(1),
  description: z.string(),
  layer: z.enum(DriverLayers),
  triggerDrivers: z.record(z.string(), z.array(z.string())).optional(),
  targetSection: z.number().optional(),
  targetSections: z.array(z.number()).optional(),
  placeholders: z.array(z.object({
    key: z.string(),
    source: z.string(),
    fallback: z.string(),
  })).optional(),
});

/**
 * GET /api/content
 * List content with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = ContentQuerySchema.parse(Object.fromEntries(searchParams));

    const db = await getDb();
    const filter: Record<string, unknown> = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { contentId: { $regex: query.search, $options: "i" } },
        { name: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }

    const [content, total] = await Promise.all([
      db
        .collection(COLLECTIONS.CONTENT)
        .find(filter)
        .sort({ updatedAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .toArray(),
      db.collection(COLLECTIONS.CONTENT).countDocuments(filter),
    ]);

    const response: ContentListResponse = {
      content: content as unknown as ContentDocument[],
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error listing content:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to list content" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content
 * Create new content (as draft)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = CreateContentSchema.parse(body) as CreateContentInput;

    const db = await getDb();

    // Check if content ID already exists
    const existing = await db
      .collection(COLLECTIONS.CONTENT)
      .findOne({ contentId: input.contentId });

    if (existing) {
      return NextResponse.json(
        { error: `Content with ID "${input.contentId}" already exists` },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const newContent: Omit<ContentDocument, "_id"> = {
      contentId: input.contentId,
      type: input.type,
      name: input.name,
      description: input.description,
      layer: input.layer,
      triggerDrivers: input.triggerDrivers,
      targetSection: input.targetSection,
      targetSections: input.targetSections,
      placeholders: input.placeholders,
      variants: {},
      status: "draft",
      version: "1.0.0",
      versionHistory: [],
      createdAt: now,
      updatedAt: now,
      createdBy: "system", // TODO: Replace with authenticated user
      updatedBy: "system",
    };

    const result = await db
      .collection(COLLECTIONS.CONTENT)
      .insertOne(newContent);

    return NextResponse.json(
      {
        success: true,
        contentId: input.contentId,
        _id: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating content:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create content" },
      { status: 500 }
    );
  }
}
