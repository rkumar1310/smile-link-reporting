/**
 * Text Modules API
 * GET /api/text-modules — list all text modules, optionally filtered by module_type
 */

import { NextRequest, NextResponse } from "next/server";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleType = searchParams.get("module_type"); // banner, module, costblock, nuance
    const search = searchParams.get("search");

    const db = await getDb();
    const filter: Record<string, unknown> = { type: "text_module" };

    if (moduleType) {
      filter.module_type = moduleType;
    }

    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: "i" } },
        { "content.en": { $regex: search, $options: "i" } },
        { "content.nl": { $regex: search, $options: "i" } },
      ];
    }

    const modules = await db
      .collection(COLLECTIONS.CONTENT)
      .find(filter)
      .sort({ _id: 1 })
      .toArray();

    return NextResponse.json({
      modules,
      total: modules.length,
    });
  } catch (error) {
    console.error("Error fetching text modules:", error);
    return NextResponse.json(
      { error: "Failed to fetch text modules" },
      { status: 500 }
    );
  }
}
