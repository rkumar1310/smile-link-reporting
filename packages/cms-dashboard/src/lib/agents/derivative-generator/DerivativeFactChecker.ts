/**
 * Derivative Fact Checker
 * Verifies derivative content against its source blocks
 *
 * Unlike regular fact-checking which verifies against source documents,
 * derivative fact-checking verifies that:
 * 1. All claims in the derivative can be traced to a source block
 * 2. No hallucinated content was added during synthesis
 * 3. The synthesis accurately represents the source blocks
 */

import { z } from "zod";
import type {
  SourceBlockContent,
  ClaimSource,
  DerivativeFactCheckResult,
  FactCheckStatus,
} from "@/lib/types";
import { createLLMProvider } from "../shared/LLMProvider";
import type { LLMProvider } from "../shared/LLMProvider";

export interface DerivativeFactCheckConfig {
  derivativeContent: string;
  sourceBlocks: SourceBlockContent[];
  claimSources: ClaimSource[];  // Claims tracked during generation
}

// Schema for verification output
const VerificationResultSchema = z.object({
  verifiedClaims: z.array(z.object({
    claim: z.string(),
    sourceBlockId: z.string(),
    isVerified: z.boolean(),
    confidence: z.number().min(0).max(1),
  })),
  unsupportedClaims: z.array(z.object({
    claim: z.string(),
    reason: z.string(),
  })),
  overallAssessment: z.object({
    fidelityScore: z.number().min(0).max(1).describe("How faithfully the derivative represents the sources"),
    completenessScore: z.number().min(0).max(1).describe("How much of the source content is represented"),
    addedContentFlag: z.boolean().describe("True if content was added that's not in sources"),
  }),
});

export class DerivativeFactChecker {
  private llm: LLMProvider;

  constructor() {
    this.llm = createLLMProvider({
      model: "claude-3-5-haiku-20241022",
      temperature: 0.1, // Low temperature for consistent verification
    });
  }

  /**
   * Verify a derivative against its source blocks
   */
  async verify(config: DerivativeFactCheckConfig): Promise<{
    status: FactCheckStatus;
    result: DerivativeFactCheckResult;
    tokensUsed: { input: number; output: number };
  }> {
    const { derivativeContent, sourceBlocks, claimSources } = config;

    // Build verification prompt
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(derivativeContent, sourceBlocks, claimSources);

    // Run verification
    const response = await this.llm.generateStructured(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      VerificationResultSchema,
      "derivative_fact_check",
      {
        traceName: "derivative-fact-check",
        metadata: {
          sourceBlockCount: sourceBlocks.length,
          claimCount: claimSources.length,
        },
      }
    );

    const verificationResult = response.object;

    // Calculate metrics
    const verifiedCount = verificationResult.verifiedClaims.filter(c => c.isVerified).length;
    const totalClaims = verificationResult.verifiedClaims.length + verificationResult.unsupportedClaims.length;

    // Determine overall confidence
    const avgConfidence = verificationResult.verifiedClaims.length > 0
      ? verificationResult.verifiedClaims.reduce((sum, c) => sum + c.confidence, 0) / verificationResult.verifiedClaims.length
      : 0;

    // Combine with fidelity score
    const overallConfidence = (avgConfidence + verificationResult.overallAssessment.fidelityScore) / 2;

    // Determine status
    let status: FactCheckStatus;
    if (verificationResult.overallAssessment.addedContentFlag) {
      status = "failed"; // Hallucination detected
    } else if (overallConfidence >= 0.8) {
      status = "verified";
    } else if (overallConfidence >= 0.5) {
      status = "pending"; // Needs review
    } else {
      status = "failed";
    }

    // Build result
    const result: DerivativeFactCheckResult = {
      overallConfidence,
      claimCount: totalClaims,
      verifiedCount,
      unsupportedCount: verificationResult.unsupportedClaims.length,
      claimSources: verificationResult.verifiedClaims.map(c => ({
        claim: c.claim,
        sourceBlockId: c.sourceBlockId,
        confidence: c.confidence,
      })),
      verifiedAgainst: [...new Set(verificationResult.verifiedClaims.map(c => c.sourceBlockId))],
      checkedAt: new Date().toISOString(),
    };

    return {
      status,
      result,
      tokensUsed: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Quick check using claim sources from generation
   * This is faster than full verification and can be used for initial pass
   */
  async quickCheck(config: DerivativeFactCheckConfig): Promise<{
    status: FactCheckStatus;
    confidence: number;
  }> {
    const { derivativeContent, sourceBlocks, claimSources } = config;

    // Check if all claim sources reference valid blocks
    const blockIds = new Set(sourceBlocks.map(b => b.blockId));
    let validClaims = 0;
    let totalConfidence = 0;

    for (const cs of claimSources) {
      if (blockIds.has(cs.sourceBlockId)) {
        validClaims++;
        totalConfidence += cs.confidence;
      }
    }

    const claimRatio = claimSources.length > 0 ? validClaims / claimSources.length : 0;
    const avgConfidence = claimSources.length > 0 ? totalConfidence / claimSources.length : 0;
    const confidence = (claimRatio + avgConfidence) / 2;

    // Determine status
    let status: FactCheckStatus;
    if (confidence >= 0.8) {
      status = "verified";
    } else if (confidence >= 0.5) {
      status = "pending";
    } else {
      status = "failed";
    }

    return { status, confidence };
  }

  /**
   * Build system prompt for verification
   */
  private buildSystemPrompt(): string {
    return `You are a fact-checker verifying that synthesized content accurately represents its source material.

## YOUR TASK
Given a DERIVATIVE (synthesized content) and its SOURCE BLOCKS (original content pieces), verify:
1. Every factual claim in the derivative can be traced to a source block
2. No information was added that isn't in the sources
3. The synthesis accurately represents the source blocks

## VERIFICATION RULES
- A claim is VERIFIED if it appears (exactly or paraphrased) in a source block
- A claim is UNSUPPORTED if it cannot be found in any source block
- Added content flag should be TRUE if the derivative contains significant information not present in sources
- Fidelity score: How accurately the derivative represents the sources (1.0 = perfect representation)
- Completeness score: How much of the important source content is included (1.0 = everything important)

## BE STRICT
- Medical/dental facts MUST be verified
- Statistics and numbers MUST match sources exactly
- Process descriptions MUST align with source descriptions
- Vague or general statements don't need verification`;
  }

  /**
   * Build user prompt with derivative and sources
   */
  private buildUserPrompt(
    derivativeContent: string,
    sourceBlocks: SourceBlockContent[],
    claimSources: ClaimSource[]
  ): string {
    // Build source blocks section
    const sourcesSection = sourceBlocks
      .map((block) => {
        return `### SOURCE: ${block.blockId}
**Type:** ${block.blockType}
**Name:** ${block.name}

${block.content}`;
      })
      .join("\n\n---\n\n");

    // Build claim sources section (from generation)
    const claimsSection = claimSources
      .map((cs) => `- "${cs.claim}" (attributed to: ${cs.sourceBlockId}, confidence: ${cs.confidence})`)
      .join("\n");

    return `## DERIVATIVE CONTENT TO VERIFY

${derivativeContent}

## SOURCE BLOCKS

${sourcesSection}

## CLAIMS TRACKED DURING GENERATION

${claimsSection || "No claims were tracked during generation."}

## VERIFICATION REQUEST

1. Check each factual claim in the derivative against the source blocks
2. Identify any claims that cannot be traced to a source
3. Assess overall fidelity and completeness
4. Flag if content was added that isn't in the sources`;
  }
}

/**
 * Create a DerivativeFactChecker instance
 */
export function createDerivativeFactChecker(): DerivativeFactChecker {
  return new DerivativeFactChecker();
}
