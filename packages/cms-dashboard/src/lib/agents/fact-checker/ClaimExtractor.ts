/**
 * Claim Extractor
 * Extracts verifiable claims from content using LLM
 */

import { z } from "zod";
import type { ClaimExtractionResult, ClaimLocation } from "@/lib/types";
import { LLMProvider } from "../shared/LLMProvider";
import {
  CLAIM_EXTRACTION_SYSTEM_PROMPT,
  buildClaimExtractionPrompt,
} from "./prompts/verification-prompts";

// Schema for extracted claims
const ExtractedClaimsSchema = z.object({
  claims: z.array(
    z.object({
      claim_text: z.string().describe("The exact text of the factual claim"),
      section: z.number().describe("Section number where claim appears"),
      start_offset: z.number().describe("Approximate character position"),
      claim_type: z.enum(["medical_fact", "statistic", "process", "outcome", "general"]),
    })
  ),
});

export class ClaimExtractor {
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  /**
   * Extract claims from content
   */
  async extract(content: string): Promise<ClaimExtractionResult> {
    const response = await this.llm.generateStructured(
      [
        { role: "system", content: CLAIM_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildClaimExtractionPrompt(content) },
      ],
      ExtractedClaimsSchema,
      "claim_extraction"
    );

    const claims = response.object.claims.map((claim, index) => ({
      id: `claim_${index}`,
      claimText: claim.claim_text,
      location: {
        section: claim.section,
        startOffset: claim.start_offset,
        endOffset: claim.start_offset + claim.claim_text.length,
      } as ClaimLocation,
    }));

    return {
      claims,
      tokensUsed: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }
}

/**
 * Create a ClaimExtractor instance
 */
export function createClaimExtractor(llm: LLMProvider): ClaimExtractor {
  return new ClaimExtractor(llm);
}
