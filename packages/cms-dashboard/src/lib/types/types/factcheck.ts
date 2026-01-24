/**
 * Fact Check Types
 * Types for LLM-based content verification
 */

import { z } from "zod";

// =============================================================================
// CLAIM VERDICTS
// =============================================================================

export const ClaimVerdicts = ["verified", "unsupported", "contradicted", "inconclusive"] as const;
export type ClaimVerdict = typeof ClaimVerdicts[number];

export const OverallVerdicts = ["verified", "partially_verified", "failed", "inconclusive"] as const;
export type OverallVerdict = typeof OverallVerdicts[number];

export const MatchTypes = ["exact", "paraphrase", "inference", "contradiction"] as const;
export type MatchType = typeof MatchTypes[number];

// =============================================================================
// SOURCE MATCH
// =============================================================================

export interface SourceMatch {
  sourceDocId: string;           // Reference to SourceDocument
  section: string;
  excerpt: string;
  matchType: MatchType;
  similarity: number;            // 0-1
}

export const SourceMatchSchema = z.object({
  sourceDocId: z.string(),
  section: z.string(),
  excerpt: z.string(),
  matchType: z.enum(MatchTypes),
  similarity: z.number().min(0).max(1),
});

// =============================================================================
// EXTRACTED CLAIM
// =============================================================================

export interface ClaimLocation {
  section: number;
  startOffset: number;
  endOffset: number;
}

export interface ExtractedClaim {
  id: string;
  claimText: string;             // The claim from generated content
  location: ClaimLocation;

  // Verification result
  verdict: ClaimVerdict;
  confidence: number;            // 0-1

  // Source evidence
  sourceMatches: SourceMatch[];

  reasoning: string;             // LLM's explanation
}

export const ExtractedClaimSchema = z.object({
  id: z.string(),
  claimText: z.string(),
  location: z.object({
    section: z.number(),
    startOffset: z.number(),
    endOffset: z.number(),
  }),
  verdict: z.enum(ClaimVerdicts),
  confidence: z.number().min(0).max(1),
  sourceMatches: z.array(SourceMatchSchema),
  reasoning: z.string(),
});

// =============================================================================
// FACT CHECK RECORD
// =============================================================================

export interface FactCheckRecord {
  _id?: string;                  // MongoDB ObjectId as string

  // Reference to content
  contentId: string;             // Content document ID
  contentVariantKey: string;     // "en:TP-01"

  // Claims extracted
  claims: ExtractedClaim[];

  // Overall result
  overallVerdict: OverallVerdict;
  overallConfidence: number;     // 0-1

  // Summary
  verifiedCount: number;
  failedCount: number;
  inconclusiveCount: number;

  // Metadata
  checkedAt: string;             // ISO date string
  checkedBy: "agent" | "human";
  modelUsed?: string;
  tokenUsage?: {
    input: number;
    output: number;
  };
  durationMs: number;

  // Human review
  humanReviewed: boolean;
  humanReviewedAt?: string;
  humanReviewedBy?: string;
  humanNotes?: string;
}

export const FactCheckRecordSchema = z.object({
  _id: z.string().optional(),
  contentId: z.string(),
  contentVariantKey: z.string(),
  claims: z.array(ExtractedClaimSchema),
  overallVerdict: z.enum(OverallVerdicts),
  overallConfidence: z.number().min(0).max(1),
  verifiedCount: z.number(),
  failedCount: z.number(),
  inconclusiveCount: z.number(),
  checkedAt: z.string(),
  checkedBy: z.enum(["agent", "human"]),
  modelUsed: z.string().optional(),
  tokenUsage: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
  durationMs: z.number(),
  humanReviewed: z.boolean(),
  humanReviewedAt: z.string().optional(),
  humanReviewedBy: z.string().optional(),
  humanNotes: z.string().optional(),
});

// =============================================================================
// API TYPES
// =============================================================================

export interface StartFactCheckRequest {
  contentId: string;
  language: "en" | "nl";
  tone: string;                  // ToneProfileId
  strictMode?: boolean;
}

export interface StartFactCheckResponse {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface FactCheckResultResponse {
  record: FactCheckRecord;
  contentId: string;
  variantKey: string;
}

export interface SubmitHumanReviewRequest {
  recordId: string;
  claimReviews?: Array<{
    claimId: string;
    verdict: ClaimVerdict;
    notes?: string;
  }>;
  overallNotes?: string;
  overrideVerdict?: OverallVerdict;
}

export interface SubmitHumanReviewResponse {
  success: boolean;
  record?: FactCheckRecord;
  error?: string;
}

// =============================================================================
// AGENT OUTPUT TYPES
// =============================================================================

export interface ClaimExtractionResult {
  claims: Array<{
    id: string;
    claimText: string;
    location: ClaimLocation;
  }>;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface VerificationResult {
  verdict: ClaimVerdict;
  confidence: number;
  matches: SourceMatch[];
  reasoning: string;
  tokensUsed: {
    input: number;
    output: number;
  };
}

export interface FactCheckResult {
  claims: ExtractedClaim[];
  overallVerdict: OverallVerdict;
  overallConfidence: number;
  summary: {
    verified: number;
    unsupported: number;
    contradicted: number;
    inconclusive: number;
  };
  tokensUsed: {
    input: number;
    output: number;
  };
  durationMs: number;
}
