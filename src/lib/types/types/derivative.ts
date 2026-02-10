/**
 * Derivative Content Types
 * Types for synthesized content generated from multiple source blocks
 */

import { z } from "zod";
import crypto from "crypto";
import {
  ToneProfileIds,
  SupportedLanguages,
  FactCheckStatuses,
  type ToneProfileId,
  type SupportedLanguage,
  type FactCheckStatus,
} from "./content";

// =============================================================================
// DERIVATIVE CONTENT DOCUMENT
// =============================================================================

/**
 * Claim source tracking - links claims in derivative to source blocks
 */
export interface ClaimSource {
  claim: string;              // The factual claim text
  sourceBlockId: string;      // Which block this claim came from
  confidence: number;         // How confident we are in the attribution (0-1)
}

export const ClaimSourceSchema = z.object({
  claim: z.string(),
  sourceBlockId: z.string(),
  confidence: z.number().min(0).max(1),
});

/**
 * Fact-check result for a derivative
 */
export interface DerivativeFactCheckResult {
  overallConfidence: number;
  claimCount: number;
  verifiedCount: number;
  unsupportedCount: number;
  claimSources: ClaimSource[];      // Traceability to source blocks
  verifiedAgainst: string[];        // List of source block IDs that verified claims
  checkedAt: string;                // ISO timestamp
}

export const DerivativeFactCheckResultSchema = z.object({
  overallConfidence: z.number().min(0).max(1),
  claimCount: z.number(),
  verifiedCount: z.number(),
  unsupportedCount: z.number(),
  claimSources: z.array(ClaimSourceSchema),
  verifiedAgainst: z.array(z.string()),
  checkedAt: z.string(),
});

/**
 * Main derivative content document
 */
export interface DerivativeContent {
  _id?: string;

  // Identity - hash of sorted sourceBlockIds + language + tone
  derivativeId: string;

  // Source tracking
  sourceBlockIds: string[];                       // ["S11", "B_IMPLANT_INFO", "M_COST_FACTORS"]
  sourceBlockVersions: Record<string, string>;    // { "S11": "v1.0", ... } for cache invalidation

  // Content
  language: SupportedLanguage;
  tone: ToneProfileId;
  content: string;                                // Synthesized markdown
  wordCount: number;

  // Fact-check against source blocks
  factCheckStatus: FactCheckStatus;
  factCheckResult?: DerivativeFactCheckResult;

  // Generation metadata
  generatedAt: string;
  generatedBy: "agent";
  generationModel?: string;                       // e.g., "claude-3-5-haiku-20241022"

  // Usage tracking
  usageCount: number;
  lastUsedAt: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export const DerivativeContentSchema = z.object({
  _id: z.string().optional(),
  derivativeId: z.string(),
  sourceBlockIds: z.array(z.string()),
  sourceBlockVersions: z.record(z.string(), z.string()),
  language: z.enum(SupportedLanguages),
  tone: z.enum(ToneProfileIds),
  content: z.string(),
  wordCount: z.number(),
  factCheckStatus: z.enum(FactCheckStatuses),
  factCheckResult: DerivativeFactCheckResultSchema.optional(),
  generatedAt: z.string(),
  generatedBy: z.literal("agent"),
  generationModel: z.string().optional(),
  usageCount: z.number(),
  lastUsedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique derivative ID from source block IDs, language, and tone
 * This ensures the same combination of blocks always produces the same ID
 */
export function generateDerivativeId(
  sourceBlockIds: string[],
  language: SupportedLanguage,
  tone: ToneProfileId
): string {
  const sorted = [...sourceBlockIds].sort();
  const input = `${sorted.join("|")}:${language}:${tone}`;
  return crypto.createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/**
 * Check if a derivative is still valid based on source block versions
 */
export function isDerivativeValid(
  derivative: DerivativeContent,
  currentVersions: Record<string, string>
): boolean {
  for (const blockId of derivative.sourceBlockIds) {
    const storedVersion = derivative.sourceBlockVersions[blockId];
    const currentVersion = currentVersions[blockId];

    // If versions don't match, derivative is stale
    if (storedVersion !== currentVersion) {
      return false;
    }
  }
  return true;
}

// =============================================================================
// INPUT/OUTPUT TYPES FOR SERVICE
// =============================================================================

/**
 * Source block content for derivative generation
 */
export interface SourceBlockContent {
  blockId: string;
  blockType: "scenario" | "a_block" | "b_block" | "module" | "static";
  name: string;
  content: string;
  version: string;
}

/**
 * Configuration for generating a derivative
 */
export interface DerivativeGenerationConfig {
  sourceBlocks: SourceBlockContent[];
  language: SupportedLanguage;
  tone: ToneProfileId;
  targetWordCount?: number;
  sectionContext?: {
    sectionNumber: number;
    sectionName: string;
  };
}

/**
 * Result of derivative generation
 */
export interface DerivativeGenerationResult {
  derivativeId: string;
  content: string;
  wordCount: number;
  claimSources: ClaimSource[];
  tokensUsed: {
    input: number;
    output: number;
  };
}

/**
 * Options for retrieving/creating a derivative
 */
export interface GetOrCreateDerivativeOptions {
  sourceBlockIds: string[];
  language: SupportedLanguage;
  tone: ToneProfileId;
  sectionContext?: {
    sectionNumber: number;
    sectionName: string;
  };
  targetWordCount?: number;
  skipFactCheck?: boolean;
}
