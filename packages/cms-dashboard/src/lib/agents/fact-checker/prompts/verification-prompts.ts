/**
 * Fact Check Verification Prompts
 */

export const CLAIM_EXTRACTION_SYSTEM_PROMPT = `You are an expert fact-checker analyzing dental health content. Your task is to extract factual claims that can be verified against source documents.

WHAT COUNTS AS A CLAIM:
- Statements of fact (not opinions or recommendations)
- Medical/dental information
- Statistics and numbers
- Process descriptions
- Treatment outcomes
- Cause and effect statements

WHAT IS NOT A CLAIM:
- General advice ("consult your dentist")
- Subjective statements ("you may feel...")
- Placeholder content ({{PATIENT_NAME}})
- Formatting or structural text
- Questions

For each claim, identify:
1. The exact text of the claim
2. Its location in the content (section number)
3. The type of claim (medical fact, statistic, process, outcome)`;

export const VERIFICATION_SYSTEM_PROMPT = `You are an expert fact-checker verifying dental health claims against source documents.

For each claim, you must:
1. Search the provided source material for supporting evidence
2. Determine if the claim is:
   - VERIFIED: Directly supported by source material
   - UNSUPPORTED: Not found in source material (but not contradicted)
   - CONTRADICTED: Directly contradicts source material
   - INCONCLUSIVE: Partially supported or ambiguous

3. Provide reasoning for your verdict
4. Quote the relevant source excerpt(s)
5. Rate your confidence (0-1)

CRITICAL GUIDELINES:
- Be strict about medical claims - require clear source support
- Statistics must match exactly
- Process descriptions should align with sources
- Consider paraphrasing - meaning must match, not exact words
- When unsure, lean toward UNSUPPORTED rather than VERIFIED`;

export function buildClaimExtractionPrompt(content: string): string {
  return `Analyze the following dental content and extract all verifiable factual claims.

=== CONTENT ===
${content}

Extract all factual claims from this content. For each claim, identify:
1. The exact claim text
2. Which section it appears in
3. The approximate character position

Return the claims in structured format.`;
}

export function buildVerificationPrompt(
  claim: string,
  sourceContext: string
): string {
  return `Verify the following claim against the source material.

=== CLAIM TO VERIFY ===
${claim}

=== SOURCE MATERIAL ===
${sourceContext}

Verify this claim:
1. Search for supporting evidence in the sources
2. Determine the verdict (verified/unsupported/contradicted/inconclusive)
3. Quote relevant source excerpts
4. Explain your reasoning
5. Rate your confidence (0-1)`;
}
