/**
 * CMS Shared Types - Main Export
 */

// Content types
export type {
  ToneProfileId,
  SupportedLanguage,
  ContentType,
  DriverLayer,
  ContentStatus,
  VariantStatus,
  FactCheckStatus,
  Citation,
  ContentVariant,
  PlaceholderDef,
  ContentVersion,
  ContentDocument,
  ContentListQuery,
  ContentListResponse,
  CreateContentInput,
  UpdateContentInput,
  UpdateVariantInput,
  WorkflowAction,
  WorkflowTransition,
} from "./content";

export {
  ToneProfileIds,
  SupportedLanguages,
  ContentTypes,
  DriverLayers,
  ContentStatuses,
  VariantStatuses,
  FactCheckStatuses,
  CitationSchema,
  ContentVariantSchema,
  PlaceholderDefSchema,
  ContentVersionSchema,
  ContentDocumentSchema,
  WORKFLOW_TRANSITIONS,
} from "./content";

// Source document types
export type {
  ScenarioSection,
  ParsedScenario,
  SourceSection,
  DocumentType,
  SourceDocument,
  SourceDocumentListResponse,
  ParseSourceRequest,
  ParseSourceResponse,
  SearchSourcesRequest,
  SearchSourceResult,
  SearchSourcesResponse,
} from "./source";

export {
  DocumentTypes,
  ScenarioSectionSchema,
  ParsedScenarioSchema,
  SourceSectionSchema,
  SourceDocumentSchema,
} from "./source";

// Fact-check types
export type {
  ClaimVerdict,
  OverallVerdict,
  MatchType,
  SourceMatch,
  ClaimLocation,
  ExtractedClaim,
  FactCheckRecord,
  StartFactCheckRequest,
  StartFactCheckResponse,
  FactCheckResultResponse,
  SubmitHumanReviewRequest,
  SubmitHumanReviewResponse,
  ClaimExtractionResult,
  VerificationResult,
  FactCheckResult,
} from "./factcheck";

export {
  ClaimVerdicts,
  OverallVerdicts,
  MatchTypes,
  SourceMatchSchema,
  ExtractedClaimSchema,
  FactCheckRecordSchema,
} from "./factcheck";

// Generation types
export type {
  JobStatus,
  GenerationParameters,
  GeneratedVariant,
  JobProgress,
  GenerationJob,
  StartGenerationRequest,
  StartGenerationResponse,
  GenerationJobResponse,
  ListGenerationJobsQuery,
  ListGenerationJobsResponse,
  AcceptGenerationRequest,
  AcceptGenerationResponse,
  GenerationConfig,
  GenerationResult,
} from "./generation";

export {
  JobStatuses,
  GenerationParametersSchema,
  GeneratedVariantSchema,
  GenerationJobSchema,
} from "./generation";

// Embedding and vector search types
export type {
  EmbeddingChunk,
  QdrantPointPayload,
  VectorSyncStatus,
  VectorSyncResult,
  EmbedSourcesRequest,
  EmbedSourcesResponse,
  SemanticSearchRequest,
  SemanticSearchResult,
  SemanticSearchResponse,
} from "./embedding";

export {
  VectorSyncStatuses,
  EmbeddingChunkSchema,
  VectorSyncResultSchema,
  EmbedSourcesRequestSchema,
  SemanticSearchRequestSchema,
  SemanticSearchResultSchema,
} from "./embedding";

// Report generation types
export type {
  IntakeAnswer,
  IntakeAnswers,
  L1SafetyDrivers,
  L2PersonalizationDrivers,
  L3NarrativeDrivers,
  DriverState,
  ToneProfile,
  ContentGap,
  ContentCheckResult,
  ScoredScenario,
  ReportFactCheckIssue,
  ReportFactCheckResult,
  ReportSection,
  ComposedReport,
  ReportPhase,
  ReportPhaseEvent,
  AnalyzingPhaseEvent,
  TonePhaseEvent,
  ContentCheckPhaseEvent,
  GeneratingPhaseEvent,
  ComposingPhaseEvent,
  CompletePhaseEvent,
  ErrorPhaseEvent,
  GenerateReportRequest,
  ReportGenerationUIState,
} from "./report-generation";

export {
  TONE_PROFILES,
  IntakeAnswerSchema,
  IntakeAnswersSchema,
  GenerateReportRequestSchema,
} from "./report-generation";
