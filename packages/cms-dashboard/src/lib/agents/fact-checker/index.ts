/**
 * Fact Checker Module Exports
 */

export { ClaimExtractor, createClaimExtractor } from "./ClaimExtractor";
export { SourceVerifier, createSourceVerifier } from "./SourceVerifier";
export { FactCheckAgent, createFactCheckAgent } from "./FactCheckAgent";

export type { SourceDocument } from "./SourceVerifier";
export type { FactCheckConfig, AgentConfig } from "./FactCheckAgent";
