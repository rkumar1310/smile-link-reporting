/**
 * Content Variant API Routes
 * PUT /api/content/:id/variant/:lang/:tone - Update specific variant
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { ContentVariant, SupportedLanguage, ToneProfileId } from "@/lib/types";
import { SupportedLanguages, ToneProfileIds, CitationSchema } from "@/lib/types";

// Schema for updating variant
const UpdateVariantSchema = z.object({
  content: z.string().min(1),
  citations: z.array(CitationSchema).optional(),
});

interface RouteParams {
  params: Promise<{ id: string; lang: string; tone: string }>;
}

/**
 * PUT /api/content/:id/variant/:lang/:tone
 * Update or create a specific content variant
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, lang, tone } = await params;

    // Validate language and tone
    if (!SupportedLanguages.includes(lang as SupportedLanguage)) {
      return NextResponse.json(
        { error: `Invalid language: ${lang}. Must be one of: ${SupportedLanguages.join(", ")}` },
        { status: 400 }
      );
    }

    if (!ToneProfileIds.includes(tone as ToneProfileId)) {
      return NextResponse.json(
        { error: `Invalid tone: ${tone}. Must be one of: ${ToneProfileIds.join(", ")}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const input = UpdateVariantSchema.parse(body);

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

    const now = new Date().toISOString();

    // Create or update the variant
    const variant: ContentVariant = {
      content: input.content,
      wordCount: countWords(input.content),
      citations: input.citations || [],
      generatedAt: now,
      generatedBy: "manual",
      factCheckStatus: "pending", // Reset fact-check when content changes
      variantStatus: "draft", // Reset to draft when content changes
    };

    // Build the update path
    const variantPath = `variants.${lang}.${tone}`;

    await db.collection(COLLECTIONS.CONTENT).updateOne(
      filter,
      {
        $set: {
          [variantPath]: variant,
          updatedAt: now,
          updatedBy: "system", // TODO: Replace with authenticated user
        },
      }
    );

    // Return updated content
    const updated = await db.collection(COLLECTIONS.CONTENT).findOne(filter);

    return NextResponse.json({
      success: true,
      variant,
      content: updated,
    });
  } catch (error) {
    console.error("Error updating variant:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update variant" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/content/:id/variant/:lang/:tone
 * Get a specific content variant
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, lang, tone } = await params;

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

    const variant = content.variants?.[lang]?.[tone];

    if (!variant) {
      return NextResponse.json(
        { error: `Variant not found: ${lang}/${tone}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      contentId: content.contentId,
      language: lang,
      tone,
      variant,
    });
  } catch (error) {
    console.error("Error fetching variant:", error);
    return NextResponse.json(
      { error: "Failed to fetch variant" },
      { status: 500 }
    );
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text
    .replace(/[#*_`\[\]()]/g, "") // Remove markdown syntax
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
