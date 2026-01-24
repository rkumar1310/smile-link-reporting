/**
 * Chunking Service
 * Converts MongoDB SourceDocuments into embeddable chunks
 */

import type {
  SourceDocument,
  ParsedScenario,
  SourceSection,
  EmbeddingChunk,
} from "@/lib/types";

export interface ChunkingConfig {
  maxChunkTokens?: number;       // Max tokens per chunk (default 500)
  overlapTokens?: number;        // Overlap between chunks (default 50)
}

const DEFAULT_MAX_TOKENS = 500;
const DEFAULT_OVERLAP = 50;
const CHARS_PER_TOKEN = 4; // Rough estimate for English/Dutch text

export class ChunkingService {
  private maxChunkChars: number;
  private overlapChars: number;

  constructor(config: ChunkingConfig = {}) {
    this.maxChunkChars = (config.maxChunkTokens ?? DEFAULT_MAX_TOKENS) * CHARS_PER_TOKEN;
    this.overlapChars = (config.overlapTokens ?? DEFAULT_OVERLAP) * CHARS_PER_TOKEN;
  }

  /**
   * Convert a SourceDocument into embeddable chunks
   */
  chunkDocument(doc: SourceDocument): EmbeddingChunk[] {
    const mongoDocId = doc._id || "";

    // Use hierarchical scenario structure for scenario documents
    if (doc.documentType === "scenarios" && doc.scenarios?.length) {
      return this.chunkScenarios(doc, mongoDocId);
    }

    // Use flat sections for other document types
    return this.chunkSections(doc, mongoDocId);
  }

  /**
   * Chunk scenario documents - preserves scenario/section hierarchy
   * Creates one chunk per ScenarioSection (sections 1-11)
   */
  private chunkScenarios(doc: SourceDocument, mongoDocId: string): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [];

    for (const scenario of doc.scenarios || []) {
      for (const section of scenario.sections) {
        const content = this.buildSectionContent(section.title, section.content);
        const baseId = `${mongoDocId}_${scenario.scenarioId}_${section.number}`;

        // Check if section needs splitting
        if (content.length > this.maxChunkChars) {
          const splitChunks = this.splitScenarioSection(
            content,
            baseId,
            mongoDocId,
            doc,
            scenario,
            section
          );
          chunks.push(...splitChunks);
        } else {
          chunks.push({
            id: baseId,
            mongoDocId,
            documentType: doc.documentType,
            filename: doc.filename,
            language: doc.language,
            title: section.title,
            content,
            contentPreview: content.slice(0, 200),
            scenarioId: scenario.scenarioId,
            scenarioTitle: scenario.title,
            sectionNumber: section.number,
            sectionTitle: section.title,
            chunkIndex: 0,
            totalChunks: 1,
          });
        }
      }
    }

    return chunks;
  }

  /**
   * Chunk non-scenario documents using flat sections
   */
  private chunkSections(doc: SourceDocument, mongoDocId: string): EmbeddingChunk[] {
    const chunks: EmbeddingChunk[] = [];

    for (const section of doc.sections) {
      const content = this.buildSectionContent(section.title, section.content);
      const baseId = `${mongoDocId}_${section.id}`;

      if (content.length > this.maxChunkChars) {
        const splitChunks = this.splitSourceSection(
          content,
          baseId,
          mongoDocId,
          doc,
          section
        );
        chunks.push(...splitChunks);
      } else {
        chunks.push({
          id: baseId,
          mongoDocId,
          documentType: doc.documentType,
          filename: doc.filename,
          language: doc.language,
          title: section.title,
          content,
          contentPreview: content.slice(0, 200),
          sectionId: section.id,
          sectionPath: section.path,
          pageStart: section.pageStart,
          pageEnd: section.pageEnd,
          chunkIndex: 0,
          totalChunks: 1,
        });
      }
    }

    return chunks;
  }

  /**
   * Split a large scenario section into overlapping chunks
   */
  private splitScenarioSection(
    content: string,
    baseId: string,
    mongoDocId: string,
    doc: SourceDocument,
    scenario: ParsedScenario,
    section: { number: number; title: string }
  ): EmbeddingChunk[] {
    const sentences = this.splitIntoSentences(content);
    const chunks: EmbeddingChunk[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.maxChunkChars && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          id: `${baseId}_chunk${chunkIndex}`,
          mongoDocId,
          documentType: doc.documentType,
          filename: doc.filename,
          language: doc.language,
          title: section.title,
          content: currentChunk.trim(),
          contentPreview: currentChunk.slice(0, 200),
          scenarioId: scenario.scenarioId,
          scenarioTitle: scenario.title,
          sectionNumber: section.number,
          sectionTitle: section.title,
          chunkIndex,
          totalChunks: 0, // Will be updated
        });
        chunkIndex++;

        // Start new chunk with overlap from end of previous
        currentChunk = this.getOverlapText(currentChunk) + sentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
    }

    // Don't forget last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `${baseId}_chunk${chunkIndex}`,
        mongoDocId,
        documentType: doc.documentType,
        filename: doc.filename,
        language: doc.language,
        title: section.title,
        content: currentChunk.trim(),
        contentPreview: currentChunk.slice(0, 200),
        scenarioId: scenario.scenarioId,
        scenarioTitle: scenario.title,
        sectionNumber: section.number,
        sectionTitle: section.title,
        chunkIndex,
        totalChunks: 0,
      });
    }

    // Update totalChunks for all
    const total = chunks.length;
    chunks.forEach((c) => (c.totalChunks = total));

    return chunks;
  }

  /**
   * Split a large source section into overlapping chunks
   */
  private splitSourceSection(
    content: string,
    baseId: string,
    mongoDocId: string,
    doc: SourceDocument,
    section: SourceSection
  ): EmbeddingChunk[] {
    const sentences = this.splitIntoSentences(content);
    const chunks: EmbeddingChunk[] = [];
    let currentChunk = "";
    let chunkIndex = 0;

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > this.maxChunkChars && currentChunk.length > 0) {
        chunks.push({
          id: `${baseId}_chunk${chunkIndex}`,
          mongoDocId,
          documentType: doc.documentType,
          filename: doc.filename,
          language: doc.language,
          title: section.title,
          content: currentChunk.trim(),
          contentPreview: currentChunk.slice(0, 200),
          sectionId: section.id,
          sectionPath: section.path,
          pageStart: section.pageStart,
          pageEnd: section.pageEnd,
          chunkIndex,
          totalChunks: 0,
        });
        chunkIndex++;

        currentChunk = this.getOverlapText(currentChunk) + sentence;
      } else {
        currentChunk += (currentChunk ? " " : "") + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push({
        id: `${baseId}_chunk${chunkIndex}`,
        mongoDocId,
        documentType: doc.documentType,
        filename: doc.filename,
        language: doc.language,
        title: section.title,
        content: currentChunk.trim(),
        contentPreview: currentChunk.slice(0, 200),
        sectionId: section.id,
        sectionPath: section.path,
        pageStart: section.pageStart,
        pageEnd: section.pageEnd,
        chunkIndex,
        totalChunks: 0,
      });
    }

    const total = chunks.length;
    chunks.forEach((c) => (c.totalChunks = total));

    return chunks;
  }

  /**
   * Build content string from title and body
   */
  private buildSectionContent(title: string, content: string): string {
    return `${title}\n\n${content}`.trim();
  }

  /**
   * Split text into sentences
   * Handles Dutch and English punctuation patterns
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence-ending punctuation followed by space or end
    // Handles abbreviations by requiring space after period
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Get overlap text from end of chunk
   */
  private getOverlapText(text: string): string {
    if (text.length <= this.overlapChars) {
      return text + " ";
    }
    // Take last N characters, but start from a word boundary
    const overlap = text.slice(-this.overlapChars);
    const firstSpace = overlap.indexOf(" ");
    if (firstSpace > 0) {
      return overlap.slice(firstSpace + 1) + " ";
    }
    return overlap + " ";
  }
}

export function createChunkingService(config?: ChunkingConfig): ChunkingService {
  return new ChunkingService(config);
}
