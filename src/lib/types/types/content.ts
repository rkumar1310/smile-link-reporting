/**
 * CMS Content Types
 * These extend the core NLG types with CMS-specific metadata
 */

import { z } from "zod";

// =============================================================================
// CORE ENUMS (matching NLG system)
// =============================================================================

export const ToneProfileIds = [
  "TP-01", "TP-02", "TP-03", "TP-04", "TP-05", "TP-06"
] as const;
export type ToneProfileId = typeof ToneProfileIds[number];

export const SupportedLanguages = ["en", "nl"] as const;
export type SupportedLanguage = typeof SupportedLanguages[number];

export const ContentTypes = ["scenario", "a_block", "b_block", "module", "static"] as const;
export type ContentType = typeof ContentTypes[number];

export const DriverLayers = ["L1", "L2", "L3"] as const;
export type DriverLayer = typeof DriverLayers[number];

// =============================================================================
// WORKFLOW STATUS
// =============================================================================

export const ContentStatuses = ["draft", "review", "approved", "published", "archived"] as const;
export type ContentStatus = typeof ContentStatuses[number];

export const VariantStatuses = ["draft", "review", "approved"] as const;
export type VariantStatus = typeof VariantStatuses[number];

export const FactCheckStatuses = ["pending", "verified", "failed", "skipped"] as const;
export type FactCheckStatus = typeof FactCheckStatuses[number];

// =============================================================================
// CITATION TYPES
// =============================================================================

export interface Citation {
  sourceDocId: string;           // MongoDB ObjectId as string
  sourcePath: string;            // "reference-docs/all-content/Moduleblokken.docx"
  section: string;               // "Section 5: Treatment Options"
  pageNumber?: number;
  excerpt: string;               // Exact quoted text from source
  matchConfidence: number;       // 0-1 confidence of citation match
}

export const CitationSchema = z.object({
  sourceDocId: z.string(),
  sourcePath: z.string(),
  section: z.string(),
  pageNumber: z.number().optional(),
  excerpt: z.string(),
  matchConfidence: z.number().min(0).max(1),
});

// =============================================================================
// CONTENT VARIANT
// =============================================================================

export interface ContentVariant {
  content: string;               // Markdown content
  wordCount: number;

  // Source citations
  citations: Citation[];

  // Generation metadata
  generatedAt?: string;          // ISO date string
  generatedBy?: "manual" | "agent";
  generationJobId?: string;      // Reference to GenerationJob

  // Fact-check status
  factCheckStatus: FactCheckStatus;
  lastFactCheckId?: string;      // Reference to FactCheckRecord

  // Variant-specific workflow
  variantStatus: VariantStatus;
}

export const ContentVariantSchema = z.object({
  content: z.string(),
  wordCount: z.number(),
  citations: z.array(CitationSchema),
  generatedAt: z.string().optional(),
  generatedBy: z.enum(["manual", "agent"]).optional(),
  generationJobId: z.string().optional(),
  factCheckStatus: z.enum(FactCheckStatuses),
  lastFactCheckId: z.string().optional(),
  variantStatus: z.enum(VariantStatuses),
});

// =============================================================================
// PLACEHOLDER TYPES
// =============================================================================

export interface PlaceholderDef {
  key: string;                   // "{{PATIENT_NAME}}"
  source: string;                // "intake.patient_name"
  fallback: string;              // "you"
}

export const PlaceholderDefSchema = z.object({
  key: z.string(),
  source: z.string(),
  fallback: z.string(),
});

// =============================================================================
// VERSION HISTORY
// =============================================================================

export interface ContentVersion {
  version: string;
  content: string;
  changedAt: string;             // ISO date string
  changedBy: string;
  changeReason?: string;
}

export const ContentVersionSchema = z.object({
  version: z.string(),
  content: z.string(),
  changedAt: z.string(),
  changedBy: z.string(),
  changeReason: z.string().optional(),
});

// =============================================================================
// MAIN CONTENT DOCUMENT
// =============================================================================

export interface ContentDocument {
  _id?: string;                  // MongoDB ObjectId as string

  // Identity (matches existing ContentManifest)
  contentId: string;             // "S11", "A_WARN_ACTIVE_SYMPTOMS", "TM_BUDGET_LIMITED"
  type: ContentType;

  // Metadata
  name: string;
  description: string;
  layer: DriverLayer;

  // Trigger configuration
  triggerDrivers?: Record<string, string[]>;
  triggerTags?: string[];
  targetSection?: number;
  targetSections?: number[];
  priority?: number;

  // Suppression rules
  suppresses?: {
    sections?: number[];
    blocks?: string[];
  };
  suppressedBy?: Record<string, boolean>;
  combinableWith?: string[];
  conflictsWith?: string[];

  // Placeholders
  placeholders?: PlaceholderDef[];

  // Content variants (nested by language then tone)
  variants: Partial<Record<SupportedLanguage, Partial<Record<ToneProfileId, ContentVariant>>>>;

  // Workflow state
  status: ContentStatus;

  // Versioning
  version: string;
  versionHistory: ContentVersion[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;

  // Audit
  createdBy: string;
  updatedBy: string;
  approvedBy?: string;
}

export const ContentDocumentSchema = z.object({
  _id: z.string().optional(),
  contentId: z.string(),
  type: z.enum(ContentTypes),
  name: z.string(),
  description: z.string(),
  layer: z.enum(DriverLayers),
  triggerDrivers: z.record(z.string(), z.array(z.string())).optional(),
  triggerTags: z.array(z.string()).optional(),
  targetSection: z.number().optional(),
  targetSections: z.array(z.number()).optional(),
  priority: z.number().optional(),
  suppresses: z.object({
    sections: z.array(z.number()).optional(),
    blocks: z.array(z.string()).optional(),
  }).optional(),
  suppressedBy: z.record(z.string(), z.boolean()).optional(),
  combinableWith: z.array(z.string()).optional(),
  conflictsWith: z.array(z.string()).optional(),
  placeholders: z.array(PlaceholderDefSchema).optional(),
  variants: z.record(
    z.enum(SupportedLanguages),
    z.record(z.enum(ToneProfileIds), ContentVariantSchema).optional()
  ),
  status: z.enum(ContentStatuses),
  version: z.string(),
  versionHistory: z.array(ContentVersionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  createdBy: z.string(),
  updatedBy: z.string(),
  approvedBy: z.string().optional(),
});

// =============================================================================
// API TYPES
// =============================================================================

export interface ContentListQuery {
  type?: ContentType;
  status?: ContentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ContentListResponse {
  content: ContentDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateContentInput {
  contentId: string;
  type: ContentType;
  name: string;
  description: string;
  layer: DriverLayer;
  triggerDrivers?: Record<string, string[]>;
  targetSection?: number;
  targetSections?: number[];
  placeholders?: PlaceholderDef[];
}

export interface UpdateContentInput {
  name?: string;
  description?: string;
  triggerDrivers?: Record<string, string[]>;
  targetSection?: number;
  targetSections?: number[];
  placeholders?: PlaceholderDef[];
}

export interface UpdateVariantInput {
  content: string;
  citations?: Citation[];
}

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export type WorkflowAction =
  | "submit_review"   // draft -> review
  | "approve"         // review -> approved
  | "publish"         // approved -> published
  | "unpublish"       // published -> approved
  | "reject"          // review -> draft
  | "archive";        // any -> archived

export interface WorkflowTransition {
  from: ContentStatus;
  to: ContentStatus;
  action: WorkflowAction;
  requiresApproval?: boolean;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  { from: "draft", to: "review", action: "submit_review" },
  { from: "review", to: "approved", action: "approve", requiresApproval: true },
  { from: "review", to: "draft", action: "reject" },
  { from: "approved", to: "published", action: "publish" },
  { from: "approved", to: "draft", action: "reject" },
  { from: "published", to: "approved", action: "unpublish" },
  { from: "draft", to: "archived", action: "archive" },
  { from: "approved", to: "archived", action: "archive" },
];
