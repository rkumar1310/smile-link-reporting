/**
 * Content Store Adapter
 * Bridges ContentLoader to ReportComposer's ContentStore interface
 */

import type { ToneProfileId, SupportedLanguage } from "../types/index.js";
import { DEFAULT_LANGUAGE } from "../types/index.js";
import type { ContentStore } from "../composition/ReportComposer.js";
import { ContentLoader, type ContentLoaderOptions } from "./ContentLoader.js";

/**
 * Adapter that wraps ContentLoader to implement ContentStore interface
 * This allows the ReportComposer to use file-based content
 */
export class ContentStoreAdapter implements ContentStore {
  private loader: ContentLoader;

  constructor(options?: ContentLoaderOptions) {
    this.loader = new ContentLoader(options);
  }

  /**
   * Get content by ID, tone, and language
   * Implements ContentStore interface
   */
  async getContent(contentId: string, tone: ToneProfileId, language: SupportedLanguage = DEFAULT_LANGUAGE): Promise<string | null> {
    const loaded = await this.loader.loadContent(contentId, tone, language);

    if (!loaded) {
      return null;
    }

    // Return the raw content (markdown)
    // The ReportComposer will handle placeholder resolution
    return loaded.raw_content;
  }

  /**
   * Get the underlying ContentLoader for advanced operations
   */
  getLoader(): ContentLoader {
    return this.loader;
  }

  /**
   * Clear the content cache
   */
  clearCache(): void {
    this.loader.clearCache();
  }
}

// Default instance with standard configuration
export const contentStoreAdapter = new ContentStoreAdapter();
