/**
 * Error thrown when required content is missing from the database
 * Used to fail report generation with actionable information
 */
export interface MissingContentItem {
  contentId: string;
  language: string;
  tone: string;
}

export class MissingContentError extends Error {
  public readonly missingContent: MissingContentItem[];

  constructor(message: string, missingContent: MissingContentItem[]) {
    super(message);
    this.name = "MissingContentError";
    this.missingContent = missingContent;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MissingContentError);
    }
  }

  /**
   * Get a formatted list of missing content for display
   */
  getFormattedList(): string {
    return this.missingContent
      .map((item) => `  - ${item.contentId} (${item.language}/${item.tone})`)
      .join("\n");
  }

  /**
   * Convert to a JSON-serializable object for API responses
   */
  toJSON() {
    return {
      error: "missing_content",
      message: this.message,
      missingContent: this.missingContent,
    };
  }
}
