/**
 * Fact Check Agent
 * Orchestrates claim extraction and verification
 */

import type {
  ExtractedClaim,
  FactCheckResult,
  OverallVerdict,
  SourceSection,
} from "@/lib/types";
import { LLMProvider, createLLMProvider } from "../shared/LLMProvider";
import { ClaimExtractor, createClaimExtractor } from "./ClaimExtractor";
import { SourceVerifier, createSourceVerifier, SourceDocument } from "./SourceVerifier";

export interface FactCheckConfig {
  contentId: string;
  content: string;
  sourceDocuments: SourceDocument[];
  strictMode?: boolean;
}

export interface AgentConfig {
  model?: string;
}

export class FactCheckAgent {
  private llm: LLMProvider;
  private claimExtractor: ClaimExtractor;
  private sourceVerifier: SourceVerifier;

  constructor(config?: AgentConfig) {
    this.llm = createLLMProvider({
      model: config?.model ?? "claude-sonnet-4-20250514",
      temperature: 0.1, // Low temperature for consistent fact-checking
    });
    this.claimExtractor = createClaimExtractor(this.llm);
    this.sourceVerifier = createSourceVerifier(this.llm);
  }

  /**
   * Run fact-check on content
   */
  async check(config: FactCheckConfig): Promise<FactCheckResult> {
    const startTime = Date.now();
    let totalTokens = { input: 0, output: 0 };

    // Step 1: Extract claims from content
    const extractionResult = await this.claimExtractor.extract(config.content);
    totalTokens.input += extractionResult.tokensUsed.input;
    totalTokens.output += extractionResult.tokensUsed.output;

    // Step 2: Verify each claim
    const verifiedClaims: ExtractedClaim[] = [];

    for (const claim of extractionResult.claims) {
      const verificationResult = await this.sourceVerifier.verify(
        { id: claim.id, claimText: claim.claimText },
        config.sourceDocuments,
        config.strictMode
      );

      verifiedClaims.push({
        id: claim.id,
        claimText: claim.claimText,
        location: claim.location,
        verdict: verificationResult.verdict,
        confidence: verificationResult.confidence,
        sourceMatches: verificationResult.matches,
        reasoning: verificationResult.reasoning,
      });

      totalTokens.input += verificationResult.tokensUsed.input;
      totalTokens.output += verificationResult.tokensUsed.output;
    }

    // Step 3: Calculate summary
    const summary = this.calculateSummary(verifiedClaims);

    // Step 4: Determine overall verdict
    const overallVerdict = this.determineOverallVerdict(summary, verifiedClaims.length);
    const overallConfidence = this.calculateOverallConfidence(verifiedClaims);

    const durationMs = Date.now() - startTime;

    return {
      claims: verifiedClaims,
      overallVerdict,
      overallConfidence,
      summary,
      tokensUsed: totalTokens,
      durationMs,
    };
  }

  /**
   * Calculate summary counts
   */
  private calculateSummary(claims: ExtractedClaim[]): FactCheckResult["summary"] {
    return {
      verified: claims.filter((c) => c.verdict === "verified").length,
      unsupported: claims.filter((c) => c.verdict === "unsupported").length,
      contradicted: claims.filter((c) => c.verdict === "contradicted").length,
      inconclusive: claims.filter((c) => c.verdict === "inconclusive").length,
    };
  }

  /**
   * Determine overall verdict based on claim results
   */
  private determineOverallVerdict(
    summary: FactCheckResult["summary"],
    totalClaims: number
  ): OverallVerdict {
    // Any contradiction = failed
    if (summary.contradicted > 0) {
      return "failed";
    }

    // All verified = verified
    if (summary.verified === totalClaims && totalClaims > 0) {
      return "verified";
    }

    // Most verified = partially verified
    if (summary.verified > totalClaims * 0.7) {
      return "partially_verified";
    }

    // Too many unsupported = failed
    if (summary.unsupported > totalClaims * 0.5) {
      return "failed";
    }

    return "inconclusive";
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(claims: ExtractedClaim[]): number {
    if (claims.length === 0) return 0;

    const avgConfidence =
      claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;

    return Math.round(avgConfidence * 100) / 100;
  }
}

/**
 * Create a FactCheckAgent instance
 */
export function createFactCheckAgent(config?: AgentConfig): FactCheckAgent {
  return new FactCheckAgent(config);
}
