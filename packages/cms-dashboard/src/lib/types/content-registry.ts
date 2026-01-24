/**
 * Content Registry Types
 * Types for the unified content registry used by the CMS Dashboard
 */

export type ContentType = "scenario" | "a_block" | "b_block" | "module" | "static";
export type ContentLayer = "L1" | "L2" | "L3";

/**
 * Section definition in the content registry
 */
export interface ContentSection {
  /** Section number (0-11) */
  number: number;
  /** Section display name */
  name: string;
  /** Description explaining what this section contains */
  description: string;
}

/**
 * Content item in the registry
 */
export interface ContentRegistryItem {
  /** Unique content ID (e.g., "S01", "A_WARN_ACTIVE_SYMPTOMS", "B_CTX_SINGLE_TOOTH") */
  id: string;
  /** Content type */
  type: ContentType;
  /** Human-readable name */
  name: string;
  /** Rich description explaining what this content does, when it appears, and why */
  description: string;
  /** Layer classification (L1=Safety, L2=Personalization, L3=Narrative) */
  layer: ContentLayer;
  /** Target section numbers where this content appears */
  sections: number[];
}

/**
 * Full content registry structure
 */
export interface ContentRegistry {
  /** Registry schema version */
  version: string;
  /** Last updated timestamp */
  lastUpdated: string;
  /** Section definitions */
  sections: ContentSection[];
  /** All content items */
  items: ContentRegistryItem[];
}

/**
 * API response for content registry list
 */
export interface ContentRegistryListResponse {
  items: ContentRegistryItem[];
  total: number;
  filters?: {
    type?: ContentType;
    layer?: ContentLayer;
    section?: number;
  };
}

/**
 * API response for single content item
 */
export interface ContentRegistryItemResponse {
  item: ContentRegistryItem;
  section: ContentSection | null;
}

/**
 * Query parameters for content registry API
 */
export interface ContentRegistryQueryParams {
  /** Filter by content type */
  type?: ContentType;
  /** Filter by layer */
  layer?: ContentLayer;
  /** Filter by section number */
  section?: number;
  /** Search query for name/description */
  search?: string;
}

/**
 * Layer metadata for UI display
 */
export const LAYER_METADATA: Record<ContentLayer, { name: string; description: string; color: string }> = {
  L1: {
    name: "Safety Layer",
    description: "Clinical safety, warnings, and contraindications",
    color: "red"
  },
  L2: {
    name: "Personalization Layer",
    description: "Patient-specific context and preferences",
    color: "blue"
  },
  L3: {
    name: "Narrative Layer",
    description: "Communication style and framing",
    color: "green"
  }
};

/**
 * Content type metadata for UI display
 */
export const CONTENT_TYPE_METADATA: Record<ContentType, { name: string; description: string; icon: string }> = {
  scenario: {
    name: "Scenario",
    description: "Full report template for a clinical case pattern",
    icon: "FileText"
  },
  a_block: {
    name: "A-Block",
    description: "Warning, alert, or safety notice",
    icon: "AlertTriangle"
  },
  b_block: {
    name: "B-Block",
    description: "Contextual or explanatory content block",
    icon: "FileCode"
  },
  module: {
    name: "Module",
    description: "Short insertable text module",
    icon: "Puzzle"
  },
  static: {
    name: "Static",
    description: "Fixed content like disclaimer or next steps",
    icon: "Lock"
  }
};
