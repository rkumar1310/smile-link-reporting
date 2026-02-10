/**
 * Content Registry Sections API
 * GET /api/content-registry/sections
 *
 * Returns all section definitions
 */

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { ContentRegistry, ContentSection } from "@/lib/types/content-registry";

// Cache the registry in memory
let registryCache: ContentRegistry | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

async function loadRegistry(): Promise<ContentRegistry> {
  const now = Date.now();

  if (registryCache && (now - cacheTime) < CACHE_TTL) {
    return registryCache;
  }

  const registryPath = path.join(process.cwd(), "config/content-registry.json");

  try {
    const content = await fs.readFile(registryPath, "utf-8");
    registryCache = JSON.parse(content) as ContentRegistry;
    cacheTime = now;
    return registryCache;
  } catch (error) {
    console.error("Failed to load content registry:", error);
    throw new Error("Content registry not found");
  }
}

export async function GET() {
  try {
    const registry = await loadRegistry();

    const response: { sections: ContentSection[] } = {
      sections: registry.sections
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Content registry sections API error:", error);
    return NextResponse.json(
      { error: "Failed to load sections" },
      { status: 500 }
    );
  }
}
