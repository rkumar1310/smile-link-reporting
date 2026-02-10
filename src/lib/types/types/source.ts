/**
 * Source Document Types
 * Types for parsed DOCX source documents
 */

import { z } from "zod";

// =============================================================================
// SCENARIO TYPES (Hierarchical Structure)
// =============================================================================

/**
 * Section within a scenario (e.g., "1. Disclaimer", "5. Optie 1 — Bleken")
 * Each section has its own content, properly nested under its parent scenario
 */
export interface ScenarioSection {
  number: number;           // 1, 2, 3, etc.
  title: string;            // "Disclaimer", "Optie 1 — Professioneel tandenbleken"
  content: string;          // Section content only (not the entire scenario)
}

export const ScenarioSectionSchema = z.object({
  number: z.number(),
  title: z.string(),
  content: z.string(),
});

/**
 * Complete parsed scenario with hierarchical sections
 * This is the primary structure for scenario documents
 */
export interface ParsedScenario {
  scenarioId: string;           // "S01", "S02", etc.
  title: string;                // "Scenario S01 — Geen ontbrekende tanden, verkleuring"
  versionId: string | null;     // "SL-S01-VISIBLE-v2.1"
  status: string | null;        // "CANONIEK — FREEZE-KLAAR"
  sections: ScenarioSection[];  // Numbered sections (1-11 typically)
  pageStart: number;
  pageEnd: number;
}

export const ParsedScenarioSchema = z.object({
  scenarioId: z.string(),
  title: z.string(),
  versionId: z.string().nullable(),
  status: z.string().nullable(),
  sections: z.array(ScenarioSectionSchema),
  pageStart: z.number(),
  pageEnd: z.number(),
});

// =============================================================================
// LEGACY TYPES (kept for backwards compatibility with non-scenario docs)
// =============================================================================

/**
 * @deprecated Use ScenarioSection for scenario documents
 * Subsection within a scenario (legacy flat structure)
 */
export interface ScenarioSubsection {
  number: number;
  title: string;
  content: string;
}

export const ScenarioSubsectionSchema = z.object({
  number: z.number(),
  title: z.string(),
  content: z.string(),
});

/**
 * @deprecated Use ParsedScenario for scenario documents
 * Extended metadata for scenarios (legacy)
 */
export interface ScenarioMetadata {
  scenarioId: string;
  versionId: string | null;
  subsections: ScenarioSubsection[];
}

export const ScenarioMetadataSchema = z.object({
  scenarioId: z.string(),
  versionId: z.string().nullable(),
  subsections: z.array(ScenarioSubsectionSchema),
});

export interface SourceSection {
  id: string;                    // Generated unique ID
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  level: number;                 // Heading level (1-6)
  path: string[];                // Hierarchical path ["Scenario S11", "Section 5"]
  metadata?: ScenarioMetadata;   // Optional structured metadata for scenarios
}

export const SourceSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  pageStart: z.number(),
  pageEnd: z.number(),
  level: z.number(),
  path: z.array(z.string()),
  metadata: ScenarioMetadataSchema.optional(),
});

// =============================================================================
// SOURCE DOCUMENT
// =============================================================================

export const DocumentTypes = ["scenarios", "modules", "fallbacks", "nuances", "costs"] as const;
export type DocumentType = typeof DocumentTypes[number];

export interface SourceDocument {
  _id?: string;                  // MongoDB ObjectId as string

  // File info
  filename: string;              // "Scenarioblok per scenariodocx.docx"
  path: string;                  // "reference-docs/all-content/Scenarioblok..."
  fileHash: string;              // SHA-256 for change detection

  // Parsed content - hierarchical for scenarios, flat for others
  scenarios?: ParsedScenario[];  // For scenario documents - hierarchical structure
  sections: SourceSection[];     // For non-scenario documents OR legacy flat structure

  // Metadata
  language: "en" | "nl" | "mixed";
  documentType: DocumentType;

  // Processing state
  parsedAt: string;              // ISO date string
  parsedVersion: string;         // Parser version for re-processing

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export const SourceDocumentSchema = z.object({
  _id: z.string().optional(),
  filename: z.string(),
  path: z.string(),
  fileHash: z.string(),
  scenarios: z.array(ParsedScenarioSchema).optional(),
  sections: z.array(SourceSectionSchema),
  language: z.enum(["en", "nl", "mixed"]),
  documentType: z.enum(DocumentTypes),
  parsedAt: z.string(),
  parsedVersion: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// =============================================================================
// API TYPES
// =============================================================================

export interface SourceDocumentListResponse {
  documents: SourceDocument[];
  total: number;
}

export interface ParseSourceRequest {
  filePath: string;
  documentType: DocumentType;
  forceReparse?: boolean;
}

export interface ParseSourceResponse {
  success: boolean;
  document?: SourceDocument;
  sectionsCount: number;
  error?: string;
}

export interface SearchSourcesRequest {
  query: string;
  documentTypes?: DocumentType[];
  limit?: number;
}

export interface SearchSourceResult {
  document: SourceDocument;
  section: SourceSection;
  matchScore: number;
  excerpt: string;
}

export interface SearchSourcesResponse {
  results: SearchSourceResult[];
  total: number;
}
