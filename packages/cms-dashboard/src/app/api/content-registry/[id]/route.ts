/**
 * Content Registry Item API
 * GET /api/content-registry/[id]
 *
 * Returns details for a specific content item
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type {
  ContentRegistry,
  ContentRegistryItemResponse
} from "@/lib/types/content-registry";

// Cache the registry in memory
let registryCache: ContentRegistry | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

async function loadRegistry(): Promise<ContentRegistry> {
  const now = Date.now();

  if (registryCache && (now - cacheTime) < CACHE_TTL) {
    return registryCache;
  }

  const registryPath = path.join(process.cwd(), "../../config/content-registry.json");

  try {
    const content = await fs.readFile(registryPath, "utf-8");
    registryCache = JSON.parse(content) as ContentRegistry;
    cacheTime = now;
    return registryCache;
  } catch (error) {
    const altPath = path.join(process.cwd(), "config/content-registry.json");
    try {
      const content = await fs.readFile(altPath, "utf-8");
      registryCache = JSON.parse(content) as ContentRegistry;
      cacheTime = now;
      return registryCache;
    } catch {
      console.error("Failed to load content registry:", error);
      throw new Error("Content registry not found");
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const registry = await loadRegistry();
    const { id } = await params;

    // Find the item
    const item = registry.items.find(i => i.id === id);

    if (!item) {
      return NextResponse.json(
        { error: `Content item '${id}' not found` },
        { status: 404 }
      );
    }

    // Get the primary section for this item
    const primarySectionNum = item.sections[0];
    const section = registry.sections.find(s => s.number === primarySectionNum) || null;

    const response: ContentRegistryItemResponse = {
      item,
      section
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Content registry item API error:", error);
    return NextResponse.json(
      { error: "Failed to load content item" },
      { status: 500 }
    );
  }
}
