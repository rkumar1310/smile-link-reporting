/**
 * Single Scenario API Routes
 * GET /api/scenarios/[id] - Get a single scenario
 * PUT /api/scenarios/[id] - Update a scenario
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { Scenario } from "@/lib/pipeline/nlg/schemas/ScenarioSchema";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/scenarios/[id]
 * Get a single scenario by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const db = await getDb();

    const scenario = await db
      .collection(COLLECTIONS.SCENARIOS)
      .findOne({ _id: id as unknown as import("mongodb").ObjectId });

    if (!scenario) {
      return NextResponse.json(
        { error: `Scenario "${id}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ scenario: scenario as unknown as Scenario });
  } catch (error) {
    console.error("Error fetching scenario:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenario" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/scenarios/[id]
 * Update a scenario's editable fields (NLG variables, treatment options, etc.)
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const db = await getDb();

    // Check if scenario exists
    const existing = await db
      .collection(COLLECTIONS.SCENARIOS)
      .findOne({ _id: id as unknown as import("mongodb").ObjectId });

    if (!existing) {
      return NextResponse.json(
        { error: `Scenario "${id}" not found` },
        { status: 404 }
      );
    }

    // Only allow updating certain fields (protect core identity like _id, version)
    const allowedUpdates: Partial<Scenario> = {};

    if (body.name) allowedUpdates.name = body.name;
    if (body.nlg_variables) allowedUpdates.nlg_variables = body.nlg_variables;
    if (body.matching) allowedUpdates.matching = body.matching;
    if (body.is_fallback !== undefined) allowedUpdates.is_fallback = body.is_fallback;
    if (body.is_safety_scenario !== undefined) allowedUpdates.is_safety_scenario = body.is_safety_scenario;
    if (body.priority !== undefined) allowedUpdates.priority = body.priority;

    // Always update the timestamp
    allowedUpdates.updated_at = new Date();

    const result = await db
      .collection(COLLECTIONS.SCENARIOS)
      .updateOne({ _id: id as unknown as import("mongodb").ObjectId }, { $set: allowedUpdates });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: `Scenario "${id}" not found` },
        { status: 404 }
      );
    }

    // Fetch and return the updated scenario
    const updated = await db
      .collection(COLLECTIONS.SCENARIOS)
      .findOne({ _id: id as unknown as import("mongodb").ObjectId });

    return NextResponse.json({
      success: true,
      scenario: updated as unknown as Scenario,
    });
  } catch (error) {
    console.error("Error updating scenario:", error);
    return NextResponse.json(
      { error: "Failed to update scenario" },
      { status: 500 }
    );
  }
}
