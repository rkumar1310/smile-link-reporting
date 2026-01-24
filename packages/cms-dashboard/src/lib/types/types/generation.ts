/**
 * Content Generation Types
 * Types for LLM-based content generation jobs
 */

import { z } from "zod";
import type { Citation } from "./content";
import type { ToneProfileId, ContentType, SupportedLanguage } from "./content";

// =============================================================================
// JOB STATUS
// =============================================================================

export const JobStatuses = ["queued", "processing", "completed", "failed", "cancelled"] as const;
export type JobStatus = typeof JobStatuses[number];

// =============================================================================
// GENERATION PARAMETERS
// =============================================================================

export interface GenerationParameters {
  model: string;                 // e.g., "claude-sonnet-4-20250514"
  temperature: number;           // 0-1
  maxTokens: number;
  customInstructions?: string;
}

export const GenerationParametersSchema = z.object({
  model: z.string(),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().positive(),
  customInstructions: z.string().optional(),
});

// =============================================================================
// GENERATED VARIANT
// =============================================================================

export interface GeneratedVariant {
  language: SupportedLanguage;
  tone: ToneProfileId;
  content: string;
  citations: Citation[];
  wordCount: number;
}

export const GeneratedVariantSchema = z.object({
  language: z.enum(["en", "nl"]),
  tone: z.string(),
  content: z.string(),
  citations: z.array(z.object({
    sourceDocId: z.string(),
    sourcePath: z.string(),
    section: z.string(),
    pageNumber: z.number().optional(),
    excerpt: z.string(),
    matchConfidence: z.number(),
  })),
  wordCount: z.number(),
});

// =============================================================================
// JOB PROGRESS
// =============================================================================

export interface JobProgress {
  current: number;
  total: number;
  currentTone?: string;
  currentLanguage?: string;
}

// =============================================================================
// GENERATION JOB
// =============================================================================

export interface GenerationJob {
  _id?: string;                  // MongoDB ObjectId as string

  // Job configuration
  contentType: ContentType;
  contentId: string;             // Target content ID
  languages: SupportedLanguage[];
  tones: ToneProfileId[];

  // Source documents to use
  sourceDocIds: string[];

  // Generation parameters
  parameters: GenerationParameters;

  // Status
  status: JobStatus;
  progress: JobProgress;

  // Results
  generatedVariants: GeneratedVariant[];

  // Error handling
  error?: {
    message: string;
    stack?: string;
    failedAt: string;            // Which tone/language failed
  };

  // Timestamps
  createdAt: string;
  startedAt?: string;
  completedAt?: string;

  // Audit
  createdBy: string;

  // Token usage for cost tracking
  totalTokensUsed?: {
    input: number;
    output: number;
  };
}

export const GenerationJobSchema = z.object({
  _id: z.string().optional(),
  contentType: z.enum(["scenario", "a_block", "b_block", "module", "static"]),
  contentId: z.string(),
  languages: z.array(z.enum(["en", "nl"])),
  tones: z.array(z.string()),
  sourceDocIds: z.array(z.string()),
  parameters: GenerationParametersSchema,
  status: z.enum(JobStatuses),
  progress: z.object({
    current: z.number(),
    total: z.number(),
    currentTone: z.string().optional(),
    currentLanguage: z.string().optional(),
  }),
  generatedVariants: z.array(GeneratedVariantSchema),
  error: z.object({
    message: z.string(),
    stack: z.string().optional(),
    failedAt: z.string(),
  }).optional(),
  createdAt: z.string(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  createdBy: z.string(),
  totalTokensUsed: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
});

// =============================================================================
// API TYPES
// =============================================================================

export interface StartGenerationRequest {
  contentId: string;
  contentType: ContentType;
  languages: SupportedLanguage[];
  tones: ToneProfileId[];
  sourceDocIds: string[];
  parameters?: Partial<GenerationParameters>;
}

export interface StartGenerationResponse {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface GenerationJobResponse {
  job: GenerationJob;
}

export interface ListGenerationJobsQuery {
  status?: JobStatus;
  contentId?: string;
  page?: number;
  limit?: number;
}

export interface ListGenerationJobsResponse {
  jobs: GenerationJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AcceptGenerationRequest {
  jobId: string;
  variantsToAccept: Array<{
    language: SupportedLanguage;
    tone: ToneProfileId;
  }>;
}

export interface AcceptGenerationResponse {
  success: boolean;
  acceptedCount: number;
  error?: string;
}

// =============================================================================
// AGENT OUTPUT TYPES
// =============================================================================

export interface GenerationConfig {
  contentId: string;
  contentType: ContentType;
  language: SupportedLanguage;
  tone: ToneProfileId;
  sourceDocuments: Array<{
    id: string;
    filename: string;
    sections: Array<{
      id: string;
      title: string;
      content: string;
    }>;
  }>;
  existingManifest?: {
    name: string;
    description: string;
    targetSections?: number[];
    placeholders?: Array<{
      key: string;
      source: string;
      fallback: string;
    }>;
    wordCountTarget?: number;
  };
}

// Structured scenario sections - exported from pipeline/types.ts
import type { ScenarioSections } from "../../pipeline/types";

export interface GenerationResult {
  content: string;
  scenarioSections?: ScenarioSections;  // Structured sections for scenario content
  citations: Citation[];
  wordCount: number;
  tokensUsed: {
    input: number;
    output: number;
  };
}
