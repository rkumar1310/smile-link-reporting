/**
 * Quick test to verify LLM evaluator integration
 */
import { describe, it, expect, afterEach } from "vitest";
import { llmReportEvaluator, qaGate } from "../src/qa/index.js";

describe("LLM Evaluator Integration", () => {
  // Reset to enabled after each test (since that's the default)
  afterEach(() => {
    llmReportEvaluator.setEnabled(true);
    qaGate.setLLMEvaluatorEnabled(true);
  });

  it("should have evaluator enabled by default", () => {
    expect(llmReportEvaluator.isEnabled()).toBe(true);
  });

  it("should have LLM config options in QA Gate", () => {
    const qaConfig = qaGate.getConfig();
    expect(qaConfig.llmEvaluatorEnabled).toBe(true);
    expect(qaConfig.llmEvaluatorCanBlock).toBe(false);  // Safety: LLM can only FLAG by default
  });

  it("should allow enable/disable of evaluator", () => {
    llmReportEvaluator.setEnabled(false);
    expect(llmReportEvaluator.isEnabled()).toBe(false);
    llmReportEvaluator.setEnabled(true);
    expect(llmReportEvaluator.isEnabled()).toBe(true);
  });

  it("should allow config updates", () => {
    const origConfig = llmReportEvaluator.getConfig();
    llmReportEvaluator.updateConfig({
      thresholds: { ...origConfig.thresholds, block_below: 5 }
    });
    const newConfig = llmReportEvaluator.getConfig();
    expect(newConfig.thresholds.block_below).toBe(5);

    // Reset
    llmReportEvaluator.updateConfig({
      thresholds: { ...origConfig.thresholds }
    });
  });

  it("should allow QA Gate config updates for LLM", () => {
    qaGate.setLLMEvaluatorEnabled(false);
    expect(qaGate.getConfig().llmEvaluatorEnabled).toBe(false);
    qaGate.setLLMEvaluatorEnabled(true);
    expect(qaGate.getConfig().llmEvaluatorEnabled).toBe(true);
  });

  it("should have isApiKeyConfigured method", () => {
    // This test just verifies the method exists and returns a boolean
    const result = llmReportEvaluator.isApiKeyConfigured();
    expect(typeof result).toBe("boolean");
  });

  it("should require API key when LLM evaluation is enabled", async () => {
    // When enabled and no API key, evaluate() should throw
    // (In test environment, OPENROUTER_API_KEY is not set)
    if (!llmReportEvaluator.isApiKeyConfigured()) {
      const mockContext = {
        report: {
          session_id: "test",
          scenario_id: "S01",
          tone: "TP-01" as const,
          language: "en" as const,
          confidence: "HIGH" as const,
          sections: [],
          total_word_count: 100,
          warnings_included: false,
          suppressed_sections: [],
          placeholders_resolved: 0,
          placeholders_unresolved: []
        },
        intake: {
          session_id: "test",
          timestamp: new Date().toISOString(),
          answers: []
        },
        driverState: {
          session_id: "test",
          drivers: {} as any,
          conflicts: [],
          fallbacks_applied: []
        },
        tone: "TP-01" as const,
        scenarioId: "S01"
      };

      await expect(llmReportEvaluator.evaluate(mockContext)).rejects.toThrow(
        /OPENROUTER_API_KEY environment variable is not set/
      );
    }
  });
});
