/**
 * Embedding Provider
 * Generates embeddings using OpenAI API
 */

import OpenAI from "openai";

export interface EmbeddingConfig {
  model?: string;
  batchSize?: number;
}

const DEFAULT_MODEL = "text-embedding-3-large";
const DEFAULT_BATCH_SIZE = 100;

export class EmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private batchSize: number;

  constructor(config: EmbeddingConfig = {}) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required for embeddings");
    }

    this.client = new OpenAI({ apiKey });
    this.model = config.model ?? DEFAULT_MODEL;
    this.batchSize = config.batchSize ?? DEFAULT_BATCH_SIZE;
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * Generate embeddings for multiple texts (batched)
   * Automatically handles batching for large arrays
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);

      const response = await this.client.embeddings.create({
        model: this.model,
        input: batch,
      });

      // Sort by index to ensure order matches input
      const sortedData = response.data.sort((a, b) => a.index - b.index);
      embeddings.push(...sortedData.map((d) => d.embedding));
    }

    return embeddings;
  }

  /**
   * Get the model being used
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Get embedding dimensions for the current model
   */
  getDimensions(): number {
    // OpenAI embedding model dimensions
    const dimensions: Record<string, number> = {
      "text-embedding-3-large": 3072,
      "text-embedding-3-small": 1536,
      "text-embedding-ada-002": 1536,
    };
    return dimensions[this.model] ?? 3072;
  }
}

export function createEmbeddingProvider(config?: EmbeddingConfig): EmbeddingProvider {
  return new EmbeddingProvider(config);
}
