/**
 * Generation Jobs API Routes
 * GET /api/generation - List all generation jobs
 * POST /api/generation - Start a new generation job
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { GenerationJob, ToneProfileId, SupportedLanguage } from "@/lib/types";

// Schema for creating a generation job
const CreateJobSchema = z.object({
  contentId: z.string().min(1),
  tones: z.array(z.enum(["TP-01", "TP-02", "TP-03", "TP-04", "TP-05", "TP-06"] as const)).min(1),
  languages: z.array(z.enum(["en", "nl"] as const)).min(1),
  sourceDocIds: z.array(z.string()).optional(),
});

/**
 * GET /api/generation
 * List all generation jobs
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

    const [jobs, total] = await Promise.all([
      db
        .collection(COLLECTIONS.GENERATION_JOBS)
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .toArray(),
      db.collection(COLLECTIONS.GENERATION_JOBS).countDocuments(query),
    ]);

    return NextResponse.json({
      items: jobs.map((job) => ({
        ...job,
        _id: job._id.toString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing generation jobs:", error);
    return NextResponse.json(
      { error: "Failed to list generation jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/generation
 * Create a new generation job
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = CreateJobSchema.parse(body);

    const db = await getDb();

    // Check if content exists
    const content = await db
      .collection(COLLECTIONS.CONTENT)
      .findOne({ contentId: input.contentId });

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    // Create the generation job
    const now = new Date().toISOString();
    const job: Omit<GenerationJob, "_id"> = {
      contentId: input.contentId,
      contentType: content.type,
      tones: input.tones as ToneProfileId[],
      languages: input.languages as SupportedLanguage[],
      sourceDocIds: input.sourceDocIds || [],
      parameters: {
        model: "claude-sonnet-4-20250514",
        maxTokens: 2000,
        temperature: 0.7,
      },
      status: "queued",
      progress: { current: 0, total: input.tones.length * input.languages.length },
      generatedVariants: [],
      createdAt: now,
      createdBy: "system",
    };

    const result = await db
      .collection(COLLECTIONS.GENERATION_JOBS)
      .insertOne(job);

    // In a real implementation, this would trigger the generation agent
    // For now, we'll update the job status to "running" to simulate the process
    await db
      .collection(COLLECTIONS.GENERATION_JOBS)
      .updateOne(
        { _id: result.insertedId },
        { $set: { status: "running", startedAt: new Date() } }
      );

    return NextResponse.json({
      success: true,
      jobId: result.insertedId.toString(),
      message: "Generation job created. Note: Actual generation requires the cms-agents package to be running.",
    }, { status: 201 });

  } catch (error) {
    console.error("Error creating generation job:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create generation job" },
      { status: 500 }
    );
  }
}
