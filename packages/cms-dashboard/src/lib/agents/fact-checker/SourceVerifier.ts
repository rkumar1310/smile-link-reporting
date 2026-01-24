/**
 * Source Verifier
 * Verifies claims against source documents using LLM
 */

import { z } from "zod";
import type {
  ClaimVerdict,
  SourceMatch,
  VerificationResult,
  SourceSection,
} from "@/lib/types";
import { LLMProvider } from "../shared/LLMProvider";
import {
  VERIFICATION_SYSTEM_PROMPT,
  buildVerificationPrompt,
} from "./prompts/verification-prompts";

export interface SourceDocument {
  _id?: string;
  filename: string;
  sections: SourceSection[];
}

export interface ClaimToVerify {
  id: string;
  claimText: string;
}

// Schema for verification response
const VerificationResponseSchema = z.object({
  verdict: z.enum(["verified", "unsupported", "contradicted", "inconclusive"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().describe("Explanation of the verification result"),
  source_matches: z.array(
    z.object({
      section_id: z.string(),
      excerpt: z.string().describe("Relevant quote from source"),
      match_type: z.enum(["exact", "paraphrase", "inference", "contradiction"]),
      relevance: z.number().min(0).max(1),
    })
  ),
});

export class SourceVerifier {
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  /**
   * Verify a single claim against source documents
   */
  async verify(
    claim: ClaimToVerify,
    sourceDocuments: SourceDocument[],
    strictMode: boolean = false
  ): Promise<VerificationResult> {
    // Build source context
    const sourceContext = this.buildSourceContext(sourceDocuments);

    // Verify using LLM
    const response = await this.llm.generateStructured(
      [
        { role: "system", content: VERIFICATION_SYSTEM_PROMPT },
        { role: "user", content: buildVerificationPrompt(claim.claimText, sourceContext) },
      ],
      VerificationResponseSchema,
      "claim_verification"
    );

    // Convert source matches
    const matches: SourceMatch[] = response.object.source_matches.map((match) => {
      // Find the document containing this section
      const docWithSection = this.findDocumentBySection(match.section_id, sourceDocuments);

      return {
        sourceDocId: docWithSection?._id ?? "",
        section: match.section_id,
        excerpt: match.excerpt,
        matchType: match.match_type,
        similarity: match.relevance,
      };
    });

    // In strict mode, only accept high-confidence verifications
    let verdict = response.object.verdict as ClaimVerdict;
    if (strictMode && verdict === "verified" && response.object.confidence < 0.8) {
      verdict = "inconclusive";
    }

    return {
      verdict,
      confidence: response.object.confidence,
      matches,
      reasoning: response.object.reasoning,
      tokensUsed: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Build source context for verification prompt
   */
  private buildSourceContext(sourceDocuments: SourceDocument[]): string {
    const sections: string[] = [];

    for (const doc of sourceDocuments) {
      for (const section of doc.sections) {
        sections.push(
          `[SOURCE:${section.id}] (${doc.filename})\n# ${section.title}\n${section.content}`
        );
      }
    }

    return sections.join("\n\n---\n\n");
  }

  /**
   * Find which document contains a given section
   */
  private findDocumentBySection(
    sectionId: string,
    sourceDocuments: SourceDocument[]
  ): SourceDocument | undefined {
    return sourceDocuments.find((doc) =>
      doc.sections.some((s) => s.id === sectionId)
    );
  }
}

/**
 * Create a SourceVerifier instance
 */
export function createSourceVerifier(llm: LLMProvider): SourceVerifier {
  return new SourceVerifier(llm);
}
