/**
 * Derivative Generation Agent
 * Synthesizes multiple content blocks into a cohesive derivative content piece
 *
 * Unlike simple concatenation, this agent:
 * 1. Intelligently combines content from multiple source blocks
 * 2. Removes redundancy while preserving completeness
 * 3. Maintains consistent tone and style
 * 4. Tracks which source block each claim comes from
 */

import { z } from "zod";
import type {
  SourceBlockContent,
  DerivativeGenerationConfig,
  DerivativeGenerationResult,
  ClaimSource,
  ToneProfileId,
} from "@/lib/types";
import { createLLMProvider } from "../shared/LLMProvider";
import type { LLMProvider } from "../shared/LLMProvider";
import { TONE_DESCRIPTIONS } from "./tone-descriptions";
import { getSystemGoalCondensed } from "../shared/system-goal";

export interface DerivativeAgentConfig {
  model?: string;
  temperature?: number;
}

// Schema for claim source tracking
const ClaimSourceOutputSchema = z.object({
  claim: z.string().describe("The factual claim or statement"),
  sourceBlockId: z.string().describe("The block ID this claim came from"),
  confidence: z.number().min(0).max(1).describe("Confidence this claim is from the source (0-1)"),
});

// Schema for derivative generation response
const DerivativeResponseSchema = z.object({
  content: z.string().describe("The synthesized markdown content"),
  claimSources: z.array(ClaimSourceOutputSchema).describe("Tracking of which claims came from which source blocks"),
  synthesisNotes: z.string().optional().describe("Notes about how content was combined"),
});

export class DerivativeGenerationAgent {
  private llm: LLMProvider;
  private model: string;

  constructor(config?: DerivativeAgentConfig) {
    this.model = config?.model ?? "claude-3-5-haiku-20241022";
    this.llm = createLLMProvider({
      model: this.model,
      temperature: config?.temperature ?? 0.3,
    });
  }

  /**
   * Generate a derivative from multiple source blocks
   */
  async generate(config: DerivativeGenerationConfig): Promise<DerivativeGenerationResult> {
    const { sourceBlocks, language, tone, targetWordCount, sectionContext } = config;

    // Build the system prompt
    const systemPrompt = this.buildSystemPrompt(tone, language);

    // Build the user prompt with source blocks
    const userPrompt = this.buildUserPrompt(sourceBlocks, {
      language,
      tone,
      targetWordCount: targetWordCount ?? 400,
      sectionContext,
    });

    // Generate synthesized content
    const response = await this.llm.generateStructured(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      DerivativeResponseSchema,
      "derivative_generation",
      {
        traceName: `derivative-generation-${sourceBlocks.map(b => b.blockId).join("-")}`,
        metadata: {
          sourceBlockIds: sourceBlocks.map(b => b.blockId),
          language,
          tone,
          sectionNumber: sectionContext?.sectionNumber,
        },
      }
    );

    // Calculate derivative ID (will be set by service, but we track source blocks here)
    const derivativeId = sourceBlocks.map(b => b.blockId).sort().join("|");

    return {
      derivativeId,
      content: response.object.content,
      wordCount: this.countWords(response.object.content),
      claimSources: response.object.claimSources,
      tokensUsed: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Build system prompt for derivative generation
   */
  private buildSystemPrompt(tone: ToneProfileId, language: string): string {
    const toneDesc = TONE_DESCRIPTIONS[tone] ?? TONE_DESCRIPTIONS["TP-01"];
    const langName = language === "nl" ? "Dutch" : "English";

    return `You are a content synthesis specialist for medical/dental information.

${getSystemGoalCondensed()}

## YOUR TASK
You will receive multiple content blocks that need to be synthesized into a single, cohesive piece of content. Your job is NOT to simply concatenate them, but to intelligently combine them into flowing, natural content.

## SYNTHESIS GUIDELINES

### Content Combination Rules
1. **Merge overlapping information** - If multiple blocks cover the same topic, combine into a single clear explanation
2. **Eliminate redundancy** - Remove repeated information while preserving all unique details
3. **Create logical flow** - Organize information in a logical progression, not just block-by-block
4. **Preserve all facts** - Every factual claim must come from a source block. Never add information not present in sources
5. **Maintain citations** - Track which source block each factual claim comes from

### Tone Profile: ${tone}
${toneDesc}

### Language
Generate content in ${langName}.

### Style Requirements
- Use clear, accessible language appropriate for patients
- Format with markdown (headers, bullets, bold) for readability
- Maintain medical accuracy while being understandable
- Never make promises or guarantees about outcomes

## CLAIM TRACKING
For EVERY factual statement in your output, you MUST track which source block it came from in the claimSources array. This includes:
- Medical facts and statistics
- Process descriptions
- Cost information
- Risk factors
- Any other verifiable claims

If you cannot attribute a claim to a source block, do not include it.`;
  }

  /**
   * Build user prompt with source blocks
   */
  private buildUserPrompt(
    sourceBlocks: SourceBlockContent[],
    options: {
      language: string;
      tone: ToneProfileId;
      targetWordCount: number;
      sectionContext?: {
        sectionNumber: number;
        sectionName: string;
      };
    }
  ): string {
    const { targetWordCount, sectionContext } = options;

    // Build source blocks section
    const blocksSection = sourceBlocks
      .map((block, index) => {
        return `### SOURCE BLOCK ${index + 1}: ${block.blockId}
**Type:** ${block.blockType}
**Name:** ${block.name}

${block.content}`;
      })
      .join("\n\n---\n\n");

    // Build context section
    let contextSection = "";
    if (sectionContext) {
      contextSection = `
## SECTION CONTEXT
This content will be used in **Section ${sectionContext.sectionNumber}: ${sectionContext.sectionName}** of a patient report.
Ensure the tone and focus are appropriate for this section.
`;
    }

    return `## SOURCE BLOCKS TO SYNTHESIZE

${blocksSection}

${contextSection}
## GENERATION REQUIREMENTS

1. **Target word count:** ~${targetWordCount} words
2. **Synthesize** the above blocks into a single, cohesive piece
3. **Track** every factual claim back to its source block
4. **Remove** redundancy while keeping all unique information
5. **Create** natural transitions between topics

Generate the synthesized content now.`;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text
      .replace(/[#*_`\[\]()]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}

/**
 * Create a new DerivativeGenerationAgent instance
 */
export function createDerivativeGenerationAgent(
  config?: DerivativeAgentConfig
): DerivativeGenerationAgent {
  return new DerivativeGenerationAgent(config);
}
