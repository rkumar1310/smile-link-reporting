/**
 * Semantic Search API
 * POST /api/search/semantic - Search sources by semantic similarity
 */

import { NextRequest, NextResponse } from "next/server";
import { createSemanticSearchService } from "@/lib/agents/search";
import {
  SemanticSearchRequestSchema,
  type SemanticSearchResponse,
} from "@/lib/types";

export async function POST(request: NextRequest): Promise<NextResponse<SemanticSearchResponse | { error: string; details?: unknown }>> {
  try {
    const body = await request.json();
    const parseResult = SemanticSearchRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const input = parseResult.data;
    const searchService = createSemanticSearchService();

    const response = await searchService.search({
      query: input.query,
      documentTypes: input.documentTypes,
      scenarioIds: input.scenarioIds,
      languages: input.languages,
      limit: input.limit,
      scoreThreshold: input.scoreThreshold,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in semantic search:", error);
    return NextResponse.json(
      { error: "Failed to perform semantic search", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
