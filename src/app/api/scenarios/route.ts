/**
 * Scenarios API Routes
 * GET /api/scenarios - List all scenarios from the scenarios collection
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { Scenario } from "@/lib/pipeline/nlg/schemas/ScenarioSchema";

export interface ScenarioListResponse {
  scenarios: Scenario[];
  total: number;
}

/**
 * GET /api/scenarios
 * List all scenarios with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isFallback = searchParams.get("is_fallback");
    const isSafety = searchParams.get("is_safety");

    const db = await getDb();
    const filter: Record<string, unknown> = {};

    // Apply filters
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: "i" } },
        { "name.en": { $regex: search, $options: "i" } },
        { "name.nl": { $regex: search, $options: "i" } },
        { "description.en": { $regex: search, $options: "i" } },
        { "description.nl": { $regex: search, $options: "i" } },
      ];
    }

    if (isFallback === "true") {
      filter.is_fallback = true;
    } else if (isFallback === "false") {
      filter.is_fallback = false;
    }

    if (isSafety === "true") {
      filter.is_safety_scenario = true;
    } else if (isSafety === "false") {
      filter.is_safety_scenario = false;
    }

    const scenarios = await db
      .collection(COLLECTIONS.SCENARIOS)
      .find(filter)
      .sort({ priority: 1, _id: 1 })
      .toArray();

    const response: ScenarioListResponse = {
      scenarios: scenarios as unknown as Scenario[],
      total: scenarios.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error listing scenarios:", error);
    return NextResponse.json(
      { error: "Failed to list scenarios" },
      { status: 500 }
    );
  }
}
