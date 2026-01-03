/**
 * Trace Collector
 * Records all decisions made during report generation for audit
 */

import type { DecisionTrace, DecisionTraceEvent } from "../types/index.js";

export class TraceCollector {
  private sessionId: string;
  private startTime: Date;
  private events: DecisionTraceEvent[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = new Date();
  }

  /**
   * Record a trace event
   */
  record(
    stage: string,
    action: string,
    input: unknown,
    output: unknown,
    startTime?: Date
  ): void {
    const now = new Date();
    const duration = startTime
      ? now.getTime() - startTime.getTime()
      : 0;

    this.events.push({
      timestamp: now.toISOString(),
      stage,
      action,
      input: this.sanitize(input),
      output: this.sanitize(output),
      duration_ms: duration
    });
  }

  /**
   * Create a stage timer for measuring duration
   */
  startStage(stage: string): StageTimer {
    return new StageTimer(this, stage);
  }

  /**
   * Get the complete trace
   */
  getTrace(finalOutcome: "PASS" | "FLAG" | "BLOCK"): DecisionTrace {
    return {
      session_id: this.sessionId,
      started_at: this.startTime.toISOString(),
      completed_at: new Date().toISOString(),
      events: this.events,
      final_outcome: finalOutcome
    };
  }

  /**
   * Get events for a specific stage
   */
  getStageEvents(stage: string): DecisionTraceEvent[] {
    return this.events.filter(e => e.stage === stage);
  }

  /**
   * Get total duration
   */
  getTotalDuration(): number {
    return new Date().getTime() - this.startTime.getTime();
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Sanitize data for storage (remove sensitive info, limit size)
   */
  private sanitize(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // Convert to JSON and back to ensure serializable
    try {
      const json = JSON.stringify(data, (key, value) => {
        // Remove sensitive fields
        if (key === "password" || key === "token" || key === "secret") {
          return "[REDACTED]";
        }
        // Truncate long strings
        if (typeof value === "string" && value.length > 1000) {
          return value.substring(0, 1000) + "...[truncated]";
        }
        return value;
      });

      // Limit total size
      if (json.length > 10000) {
        return { _truncated: true, _size: json.length };
      }

      return JSON.parse(json);
    } catch {
      return { _error: "Could not serialize" };
    }
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    this.startTime = new Date();
  }

  /**
   * Export trace as JSON string
   */
  toJSON(finalOutcome: "PASS" | "FLAG" | "BLOCK"): string {
    return JSON.stringify(this.getTrace(finalOutcome), null, 2);
  }
}

/**
 * Stage Timer for measuring duration
 */
export class StageTimer {
  private collector: TraceCollector;
  private stage: string;
  private startTime: Date;

  constructor(collector: TraceCollector, stage: string) {
    this.collector = collector;
    this.stage = stage;
    this.startTime = new Date();
  }

  /**
   * Complete the stage and record the event
   */
  complete(action: string, input: unknown, output: unknown): void {
    this.collector.record(this.stage, action, input, output, this.startTime);
  }

  /**
   * Record an intermediate step within the stage
   */
  step(action: string, input: unknown, output: unknown): void {
    this.collector.record(this.stage, action, input, output, this.startTime);
  }

  /**
   * Get elapsed time
   */
  elapsed(): number {
    return new Date().getTime() - this.startTime.getTime();
  }
}

/**
 * Create a new trace collector
 */
export function createTraceCollector(sessionId: string): TraceCollector {
  return new TraceCollector(sessionId);
}
