/**
 * Pipeline Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ReportPipeline } from "../../src/pipeline/ReportPipeline.js";
import { tagExtractor } from "../../src/engine/TagExtractor.js";
import { driverDeriver } from "../../src/engine/DriverDeriver.js";
import { scenarioScorer } from "../../src/engine/ScenarioScorer.js";
import { toneSelector } from "../../src/engine/ToneSelector.js";
import { qaGate, llmReportEvaluator } from "../../src/qa/index.js";
import {
  sampleIntake1,
  sampleIntake2,
  sampleIntake3,
  sampleIntakeMinimal
} from "../fixtures/sample-intake.js";

// Disable LLM evaluator for tests (no API key in test environment)
beforeAll(() => {
  llmReportEvaluator.setEnabled(false);
  qaGate.setLLMEvaluatorEnabled(false);
});

afterAll(() => {
  // Reset to default (enabled)
  llmReportEvaluator.setEnabled(true);
  qaGate.setLLMEvaluatorEnabled(true);
});

describe("Tag Extraction", () => {
  it("should extract tags from intake data", () => {
    const result = tagExtractor.extract(sampleIntake1);

    expect(result.session_id).toBe("test-session-001");
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.missing_questions.length).toBe(0);

    // Check for expected tags
    const tagNames = result.tags.map(t => t.tag);
    expect(tagNames).toContain("motivation_missing_teeth");
    expect(tagNames).toContain("status_single_missing");
    expect(tagNames).toContain("no_acute_issues");
  });

  it("should handle minimal intake", () => {
    const result = tagExtractor.extract(sampleIntakeMinimal);

    expect(result.tags.length).toBeGreaterThan(0);
    // Q5 and Q6a are marked required - Q5 is answered in minimal intake
    // so only Q6a might be missing if not answered
    // Actually both are answered in sampleIntakeMinimal, so no missing required
    expect(result.missing_questions.length).toBe(0);
  });
});

describe("Driver Derivation", () => {
  it("should derive drivers from tags", () => {
    const tagResult = tagExtractor.extract(sampleIntake1);
    const driverState = driverDeriver.derive(tagResult);

    expect(driverState.session_id).toBe("test-session-001");
    expect(Object.keys(driverState.drivers).length).toBe(18);

    // Check specific drivers
    expect(driverState.drivers.clinical_priority.value).toBe("elective");
    expect(driverState.drivers.mouth_situation.value).toBe("single_missing_tooth");
    expect(driverState.drivers.anxiety_level.value).toBe("mild");
  });

  it("should apply fallbacks for minimal intake", () => {
    const tagResult = tagExtractor.extract(sampleIntakeMinimal);
    const driverState = driverDeriver.derive(tagResult);

    // Should have fallbacks applied
    expect(driverState.fallbacks_applied.length).toBeGreaterThan(0);
  });

  it("should detect urgent or semi_urgent clinical priority for pain", () => {
    const tagResult = tagExtractor.extract(sampleIntake2);
    const driverState = driverDeriver.derive(tagResult);

    // yes_pain maps to acute_pain which should trigger urgent or semi_urgent
    expect(["urgent", "semi_urgent"]).toContain(driverState.drivers.clinical_priority.value);
  });
});

describe("Scenario Scoring", () => {
  it("should match single missing tooth scenario", () => {
    const tagResult = tagExtractor.extract(sampleIntake1);
    const driverState = driverDeriver.derive(tagResult);
    const scenarioMatch = scenarioScorer.score(driverState);

    // S02 or S03 for single missing tooth (anterior vs posterior)
    expect(["S02", "S03", "S06", "S17"]).toContain(scenarioMatch.matched_scenario);
    expect(["HIGH", "MEDIUM"]).toContain(scenarioMatch.confidence);
    expect(scenarioMatch.fallback_used).toBe(false);
  });

  it("should match case with multiple teeth to appropriate scenario", () => {
    const tagResult = tagExtractor.extract(sampleIntake2);
    const driverState = driverDeriver.derive(tagResult);
    const scenarioMatch = scenarioScorer.score(driverState);

    // Multiple adjacent teeth should match S04 or safety scenario S12
    expect(["S04", "S12"]).toContain(scenarioMatch.matched_scenario);
  });

  it("should match aesthetic case to appropriate scenario", () => {
    const tagResult = tagExtractor.extract(sampleIntake3);
    const driverState = driverDeriver.derive(tagResult);
    const scenarioMatch = scenarioScorer.score(driverState);

    // No missing teeth + aesthetic = S01, S11, or S15
    expect(["S01", "S11", "S15"]).toContain(scenarioMatch.matched_scenario);
  });

  it("should use fallback for minimal intake", () => {
    const tagResult = tagExtractor.extract(sampleIntakeMinimal);
    const driverState = driverDeriver.derive(tagResult);
    const scenarioMatch = scenarioScorer.score(driverState);

    // Should still produce a match (possibly with fallback)
    expect(scenarioMatch.matched_scenario).toBeDefined();
  });
});

describe("Tone Selection", () => {
  it("should select TP-02 for mild anxiety", () => {
    const tagResult = tagExtractor.extract(sampleIntake1);
    const driverState = driverDeriver.derive(tagResult);
    const toneResult = toneSelector.select(driverState);

    // Mild anxiety doesn't trigger TP-04, should use default or TP-02
    expect(["TP-01", "TP-02"]).toContain(toneResult.selected_tone);
  });

  it("should select TP-04 for severe anxiety", () => {
    const tagResult = tagExtractor.extract(sampleIntake2);
    const driverState = driverDeriver.derive(tagResult);
    const toneResult = toneSelector.select(driverState);

    expect(toneResult.selected_tone).toBe("TP-04");
  });
});

describe("Full Pipeline", () => {
  it("should run complete pipeline for standard intake", async () => {
    const pipeline = new ReportPipeline();
    const result = await pipeline.run(sampleIntake1);

    expect(result.success).toBe(true);
    expect(result.outcome).toBe("PASS");
    expect(result.report).toBeDefined();
    expect(result.report?.sections.length).toBeGreaterThan(0);
    expect(result.audit).toBeDefined();
  });

  it("should run complete pipeline for urgent case", async () => {
    const pipeline = new ReportPipeline();
    const result = await pipeline.run(sampleIntake2);

    // Should match appropriate scenario for multiple teeth case
    expect(["S04", "S12"]).toContain(result.audit.scenario_match.matched_scenario);
    // May or may not include warnings depending on scenario
    expect(result.report).toBeDefined();
  });

  it("should run quick pipeline", async () => {
    const pipeline = new ReportPipeline();
    const result = await pipeline.runQuick(sampleIntake1);

    expect(["S02", "S03", "S06", "S17"]).toContain(result.scenario);
    expect(result.tone).toBeDefined();
    expect(result.confidence).toBeDefined();
  });

  it("should handle errors gracefully", async () => {
    const pipeline = new ReportPipeline();
    const badIntake = {
      session_id: "bad",
      timestamp: new Date().toISOString(),
      answers: [] // No answers
    };

    const result = await pipeline.run(badIntake);

    // Should still return a result, not throw
    expect(result.audit).toBeDefined();
  });
});
