/**
 * Content Registry API
 * GET /api/content-registry
 *
 * Returns the content registry with optional filtering
 *
 * Query params:
 *   - type: Filter by content type (scenario, a_block, b_block, module, static)
 *   - layer: Filter by layer (L1, L2, L3)
 *   - section: Filter by section number (0-11)
 *   - search: Search in name and description
 */

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type {
  ContentRegistry,
  ContentRegistryItem,
  ContentType,
  ContentLayer,
  ContentRegistryListResponse
} from "@/lib/types/content-registry";

// Cache the registry in memory to avoid repeated file reads
let registryCache: ContentRegistry | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

async function loadRegistry(): Promise<ContentRegistry> {
  const now = Date.now();

  // Return cached if valid
  if (registryCache && (now - cacheTime) < CACHE_TTL) {
    return registryCache;
  }

  // Load from file
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

export async function GET(request: NextRequest) {
  try {
    const registry = await loadRegistry();
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const typeFilter = searchParams.get("type") as ContentType | null;
    const layerFilter = searchParams.get("layer") as ContentLayer | null;
    const sectionFilter = searchParams.get("section");
    const searchQuery = searchParams.get("search")?.toLowerCase();

    // Start with all items
    let filteredItems: ContentRegistryItem[] = [...registry.items];

    // Apply type filter
    if (typeFilter) {
      filteredItems = filteredItems.filter(item => item.type === typeFilter);
    }

    // Apply layer filter
    if (layerFilter) {
      filteredItems = filteredItems.filter(item => item.layer === layerFilter);
    }

    // Apply section filter
    if (sectionFilter !== null) {
      const sectionNum = parseInt(sectionFilter, 10);
      if (!isNaN(sectionNum)) {
        filteredItems = filteredItems.filter(item =>
          item.sections.includes(sectionNum)
        );
      }
    }

    // Apply search filter
    if (searchQuery) {
      filteredItems = filteredItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery) ||
        item.description.toLowerCase().includes(searchQuery) ||
        item.id.toLowerCase().includes(searchQuery)
      );
    }

    // Sort by type, then by ID
    filteredItems.sort((a, b) => {
      const typeOrder: Record<ContentType, number> = {
        scenario: 0,
        a_block: 1,
        b_block: 2,
        module: 3,
        static: 4
      };

      const typeCompare = typeOrder[a.type] - typeOrder[b.type];
      if (typeCompare !== 0) return typeCompare;

      return a.id.localeCompare(b.id);
    });

    const response: ContentRegistryListResponse = {
      items: filteredItems,
      total: filteredItems.length,
      filters: {
        ...(typeFilter && { type: typeFilter }),
        ...(layerFilter && { layer: layerFilter }),
        ...(sectionFilter && { section: parseInt(sectionFilter, 10) })
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Content registry API error:", error);
    return NextResponse.json(
      { error: "Failed to load content registry" },
      { status: 500 }
    );
  }
}
