/**
 * Content Generation Agent
 * Generates content from source documents using Claude API
 *
 * Supports two generation modes:
 * 1. Block generation (A_BLOCK, B_BLOCK, Module, Static) - single section output
 * 2. Scenario generation (S00-S17) - structured 8-section output
 */

import { z } from "zod";
import type {
  GenerationConfig,
  GenerationResult,
} from "@/lib/types";
import { createLLMProvider } from "../shared/LLMProvider";
import type { LLMProvider } from "../shared/LLMProvider";
import {
  buildBlockSystemPrompt,
  buildBlockUserPrompt,
  type BlockGenerationConfig,
} from "./prompts/block-template";
import {
  buildScenarioSystemPrompt,
  buildScenarioUserPrompt,
  SCENARIO_SECTION_KEYS,
  type ScenarioGenerationConfig,
} from "./prompts/scenario-template";

export interface AgentConfig {
  model?: string;
  temperature?: number;
}

// Schema for structured citation in generation response
const CitationOutputSchema = z.object({
  sectionId: z.string().describe("The source section ID (e.g., 'section_42')"),
  excerpt: z.string().describe("Brief excerpt from the source that supports the claim (max 200 chars)"),
  claimSummary: z.string().describe("Brief description of what claim this citation supports"),
});

// Schema for structured generation response (blocks)
const GenerationResponseSchema = z.object({
  content: z.string().describe("The generated markdown content (clean, without citation markers)"),
  citations: z.array(CitationOutputSchema).describe("List of citations for factual claims in the content"),
  sections_used: z.array(z.string()).describe("List of source section IDs that were used"),
  notes: z.string().optional().describe("Any notes about the generation process"),
});

// Schema for scenario citation with section key
const ScenarioCitationSchema = z.object({
  sectionKey: z.string().describe("Which scenario section this citation belongs to (e.g., 'context')"),
  sectionId: z.string().describe("The source section ID"),
  excerpt: z.string().describe("Brief excerpt from the source (max 200 chars)"),
  claimSummary: z.string().describe("What claim this citation supports"),
});

// Schema for structured scenario response (8 sections)
const ScenarioResponseSchema = z.object({
  personal_summary: z.string().describe("Section 2: Personalized patient overview (~150 words)"),
  context: z.string().describe("Section 3: Clinical background and context (~200 words)"),
  options: z.string().describe("Section 5: Available treatment approaches (~300 words)"),
  comparison: z.string().describe("Section 6: Side-by-side comparison of options (~250 words)"),
  tradeoffs: z.string().describe("Section 7: Honest pros/cons discussion (~200 words)"),
  process: z.string().describe("Section 8: Treatment timeline and what to expect (~200 words)"),
  costs: z.string().describe("Section 9: Financial considerations (~150 words)"),
  risk: z.string().describe("Section 10: Risks and patient-specific factors (~200 words)"),
  citations: z.array(ScenarioCitationSchema).describe("Citations for factual claims across all sections"),
});

export class ContentGenerationAgent {
  private llm: LLMProvider;

  constructor(config?: AgentConfig) {
    this.llm = createLLMProvider({
      model: config?.model ?? "claude-3-5-haiku-20241022",
      temperature: config?.temperature ?? 0.1, // Low temperature for source fidelity
    });
  }

  /**
   * Generate content for a specific content ID and tone
   * Routes to scenario or block generation based on content type
   */
  async generate(config: GenerationConfig): Promise<GenerationResult> {
    // Route to appropriate generation method
    if (config.contentType === "scenario") {
      return this.generateScenario(config);
    } else {
      return this.generateBlock(config);
    }
  }

  /**
   * Generate a complete scenario document with 8 structured sections
   */
  private async generateScenario(config: GenerationConfig): Promise<GenerationResult> {
    const sourceContext = this.buildSourceContext(config);

    const scenarioConfig: ScenarioGenerationConfig = {
      scenarioId: config.contentId,
      scenarioName: config.existingManifest?.name ?? config.contentId,
      description: config.existingManifest?.description ?? `Scenario ${config.contentId}`,
      language: config.language as 'en' | 'nl',
      tone: config.tone,
      sources: sourceContext,
    };

    const systemPrompt = buildScenarioSystemPrompt(scenarioConfig);
    const userPrompt = buildScenarioUserPrompt(scenarioConfig);

    // Generate structured scenario content
    const response = await this.llm.generateStructured(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      ScenarioResponseSchema,
      "scenario_generation",
      {
        traceName: `scenario-generation-${config.contentId}`,
        metadata: {
          contentId: config.contentId,
          contentType: config.contentType,
          language: config.language,
          tone: config.tone,
        },
      }
    );

    // Validate all sections are present
    const missingSections = SCENARIO_SECTION_KEYS.filter(
      key => !response.object[key] || response.object[key].trim() === ''
    );
    if (missingSections.length > 0) {
      console.warn(`Scenario ${config.contentId} missing sections: ${missingSections.join(', ')}`);
    }

    // Combine all sections into a single markdown document (kept for display/content field)
    const combinedContent = this.combineScenarioSections(response.object);

    // Build source document lookup for enriching citations
    const sectionLookup = this.buildSectionLookup(config.sourceDocuments);

    // Map citations
    const citations = response.object.citations.map((c) => {
      const sourceInfo = sectionLookup.get(c.sectionId);
      return {
        sourceDocId: sourceInfo?.docId ?? "",
        sourcePath: sourceInfo?.filename ?? "",
        section: sourceInfo?.title ?? c.sectionId,
        pageNumber: undefined,
        excerpt: c.excerpt,
        matchConfidence: sourceInfo ? 1.0 : 0.5,
      };
    });

    return {
      content: combinedContent,
      // Pass through structured sections - no parsing needed downstream
      scenarioSections: {
        personal_summary: response.object.personal_summary,
        context: response.object.context,
        options: response.object.options,
        comparison: response.object.comparison,
        tradeoffs: response.object.tradeoffs,
        process: response.object.process,
        costs: response.object.costs,
        risk: response.object.risk,
      },
      citations,
      wordCount: this.countWords(combinedContent),
      tokensUsed: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Generate a single block content piece (A_BLOCK, B_BLOCK, Module, Static)
   */
  private async generateBlock(config: GenerationConfig): Promise<GenerationResult> {
    const sourceContext = this.buildSourceContext(config);

    const blockConfig: BlockGenerationConfig = {
      contentId: config.contentId,
      contentType: config.contentType as 'a_block' | 'b_block' | 'module' | 'static',
      name: config.existingManifest?.name ?? config.contentId,
      description: config.existingManifest?.description ?? `Content for ${config.contentId}`,
      targetSections: config.existingManifest?.targetSections ?? [],
      language: config.language as 'en' | 'nl',
      tone: config.tone,
      wordCount: config.existingManifest?.wordCountTarget ?? 300,
      sources: sourceContext,
    };

    const systemPrompt = buildBlockSystemPrompt(blockConfig);
    const userPrompt = buildBlockUserPrompt(blockConfig);

    // Generate content with structured citations
    const response = await this.llm.generateStructured(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      GenerationResponseSchema,
      "block_generation",
      {
        traceName: `block-generation-${config.contentId}`,
        metadata: {
          contentId: config.contentId,
          contentType: config.contentType,
          language: config.language,
          tone: config.tone,
        },
      }
    );

    // Build source document lookup for enriching citations
    const sectionLookup = this.buildSectionLookup(config.sourceDocuments);

    // Map structured citations to the Citation format expected by the system
    const citations = response.object.citations.map((c) => {
      const sourceInfo = sectionLookup.get(c.sectionId);
      return {
        sourceDocId: sourceInfo?.docId ?? "",
        sourcePath: sourceInfo?.filename ?? "",
        section: sourceInfo?.title ?? c.sectionId,
        pageNumber: undefined,
        excerpt: c.excerpt,
        matchConfidence: sourceInfo ? 1.0 : 0.5,
      };
    });

    return {
      content: response.object.content,
      citations,
      wordCount: this.countWords(response.object.content),
      tokensUsed: {
        input: response.usage.inputTokens,
        output: response.usage.outputTokens,
      },
    };
  }

  /**
   * Combine scenario sections into a single document with markdown headers
   * Format: ## Section Name\n\ncontent
   *
   * The header format must match what ReportComposer.parseScenarioSections() expects:
   * - "Personal Summary" for personal_summary
   * - "Context" for context
   * - etc.
   */
  private combineScenarioSections(scenario: z.infer<typeof ScenarioResponseSchema>): string {
    const sections: string[] = [];

    // Map internal keys to header names that parseScenarioSections() recognizes
    const headerNames: Record<string, string> = {
      personal_summary: "Personal Summary",
      context: "Your Situation",
      options: "Treatment Options",
      comparison: "Comparison",
      tradeoffs: "Trade-offs",
      process: "Treatment Process",
      costs: "Cost Considerations",
      risk: "Risk Factors",
    };

    for (const key of SCENARIO_SECTION_KEYS) {
      const content = scenario[key];
      const headerName = headerNames[key] || key;

      if (content && content.trim()) {
        sections.push(`## ${headerName}\n\n${content}`);
      }
    }

    return sections.join('\n\n');
  }

  /**
   * Build a lookup map for source sections
   */
  private buildSectionLookup(
    sourceDocuments: GenerationConfig["sourceDocuments"]
  ): Map<string, { docId: string; filename: string; title: string }> {
    const lookup = new Map<string, { docId: string; filename: string; title: string }>();

    for (const doc of sourceDocuments) {
      for (const section of doc.sections) {
        lookup.set(section.id, {
          docId: doc.id,
          filename: doc.filename,
          title: section.title,
        });
      }
    }

    return lookup;
  }

  /**
   * Build source context from documents
   */
  private buildSourceContext(config: GenerationConfig): string {
    const sections: string[] = [];

    for (const doc of config.sourceDocuments) {
      for (const section of doc.sections) {
        sections.push(
          `[SECTION:${section.id}] (from ${doc.filename})\n# ${section.title}\n${section.content}`
        );
      }
    }

    return sections.join("\n\n---\n\n");
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
 * Create a new ContentGenerationAgent instance
 */
export function createContentGenerationAgent(config?: AgentConfig): ContentGenerationAgent {
  return new ContentGenerationAgent(config);
}
