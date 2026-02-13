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
  ComposingPhaseEvent,
  CompletePhaseEvent,
  ErrorPhaseEvent,
  GenerateReportRequest,
  ReportGenerationUIState,
  // Audit types
  ReportAuditData,
  AuditDriverValue,
  AuditDriverConflict,
  AuditScenarioScore,
  AuditContentSelection,
  AuditToneTrigger,
  AuditTraceEvent,
} from "./report-generation";

export {
  TONE_PROFILES,
  IntakeAnswerSchema,
  IntakeAnswersSchema,
  GenerateReportRequestSchema,
} from "./report-generation";

