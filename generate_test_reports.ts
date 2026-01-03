/**
 * Generate Test Reports
 * Creates sample reports for review
 */

import { promises as fs } from "fs";
import path from "path";
import { ReportPipeline } from "./src/pipeline/ReportPipeline.js";
import type { IntakeData, ComposedReport, PipelineResult } from "./src/types/index.js";

// Test case definitions
const testCases: Array<{ name: string; description: string; intake: IntakeData }> = [
  {
    name: "case_01_single_tooth_first_timer",
    description: "First-time patient with single missing front tooth, mild anxiety, balanced budget",
    intake: {
      session_id: "test-case-001",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "missing_teeth_long_term" },
        { question_id: "Q2", answer: "5" },
        { question_id: "Q3", answer: "missing_damaged" },
        { question_id: "Q4", answer: "no_never" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "one_missing" },
        { question_id: "Q6b", answer: "front_aesthetic_zone" },
        { question_id: "Q6c", answer: "intact" },
        { question_id: "Q6d", answer: "mostly_intact_enamel" },
        { question_id: "Q7", answer: "natural_subtle" },
        { question_id: "Q8", answer: "very_important_natural" },
        { question_id: "Q9", answer: "30_45" },
        { question_id: "Q10", answer: "price_quality_flexible" },
        { question_id: "Q11", answer: "maybe_need_info" },
        { question_id: "Q12", answer: "6_months" },
        { question_id: "Q13", answer: "no" },
        { question_id: "Q14", answer: "no" },
        { question_id: "Q15", answer: "good" },
        { question_id: "Q16a", answer: "no_complete" },
        { question_id: "Q16b", answer: "no" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "yes_mild" }
      ],
      metadata: {
        patient_name: "John",
        tooth_location: "upper front tooth"
      }
    }
  },
  {
    name: "case_02_urgent_pain_multiple_teeth",
    description: "Urgent case with pain, multiple adjacent missing teeth, severe anxiety, economy budget",
    intake: {
      session_id: "test-case-002",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "functional_issues" },
        { question_id: "Q2", answer: "2" },
        { question_id: "Q2a", answer: "chewing_missing" },
        { question_id: "Q3", answer: "loose_pain_chewing" },
        { question_id: "Q4", answer: "no_never" },
        { question_id: "Q5", answer: "yes_pain" },
        { question_id: "Q6a", answer: "2_4_adjacent" },
        { question_id: "Q6b", answer: "side_chewing" },
        { question_id: "Q6c", answer: "heavily_restored" },
        { question_id: "Q7", answer: "functional_durable" },
        { question_id: "Q8", answer: "best_price_quality_flexible" },
        { question_id: "Q9", answer: "45_60" },
        { question_id: "Q10", answer: "affordable_durable" },
        { question_id: "Q11", answer: "yes_for_best_result" },
        { question_id: "Q12", answer: "1_3_months" },
        { question_id: "Q13", answer: "no" },
        { question_id: "Q14", answer: "occasionally" },
        { question_id: "Q15", answer: "basic" },
        { question_id: "Q16a", answer: "no_complete" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "yes_severe" }
      ],
      metadata: {
        patient_name: "Maria",
        tooth_location: "lower back teeth"
      }
    }
  },
  {
    name: "case_03_premium_aesthetic",
    description: "Premium aesthetic client, Hollywood smile desire, no missing teeth, previous veneer experience",
    intake: {
      session_id: "test-case-003",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "beautiful_youthful" },
        { question_id: "Q2", answer: "6" },
        { question_id: "Q3", answer: "discoloured_dull" },
        { question_id: "Q4", answer: "yes_veneers_crowns" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "no_missing" },
        { question_id: "Q6d", answer: "large_fillings_old_restorations" },
        { question_id: "Q7", answer: "hollywood" },
        { question_id: "Q8", answer: "hollywood_bright_white" },
        { question_id: "Q9", answer: "45_60" },
        { question_id: "Q10", answer: "premium_best_result" },
        { question_id: "Q11", answer: "yes_for_best_result" },
        { question_id: "Q12", answer: "6_months" },
        { question_id: "Q13", answer: "no" },
        { question_id: "Q14", answer: "no" },
        { question_id: "Q15", answer: "good" },
        { question_id: "Q16a", answer: "no_complete" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "no" }
      ],
      metadata: {
        patient_name: "Robert"
      }
    }
  },
  {
    name: "case_04_elderly_full_mouth",
    description: "Elderly patient with extensive tooth loss, denture consideration, health concerns",
    intake: {
      session_id: "test-case-004",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "functional_issues" },
        { question_id: "Q2", answer: "1" },
        { question_id: "Q2a", answer: "cant_chew_properly" },
        { question_id: "Q3", answer: "many_teeth_missing" },
        { question_id: "Q4", answer: "yes_dentures" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "many_missing" },
        { question_id: "Q6c", answer: "few_remaining" },
        { question_id: "Q7", answer: "functional_durable" },
        { question_id: "Q8", answer: "natural_looking" },
        { question_id: "Q9", answer: "60_plus" },
        { question_id: "Q10", answer: "affordable_durable" },
        { question_id: "Q11", answer: "prefer_minimal" },
        { question_id: "Q12", answer: "no_rush" },
        { question_id: "Q13", answer: "yes" },
        { question_id: "Q14", answer: "no" },
        { question_id: "Q15", answer: "moderate" },
        { question_id: "Q16a", answer: "heart_condition" },
        { question_id: "Q17", answer: "blood_thinners" },
        { question_id: "Q18", answer: "no" }
      ],
      metadata: {
        patient_name: "William",
        age: 72
      }
    }
  },
  {
    name: "case_05_young_professional_implant",
    description: "Young professional seeking implant for single back tooth, good health, premium budget",
    intake: {
      session_id: "test-case-005",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "missing_teeth_long_term" },
        { question_id: "Q2", answer: "3" },
        { question_id: "Q3", answer: "missing_damaged" },
        { question_id: "Q4", answer: "no_never" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "one_missing" },
        { question_id: "Q6b", answer: "side_chewing" },
        { question_id: "Q6c", answer: "intact" },
        { question_id: "Q6d", answer: "mostly_intact_enamel" },
        { question_id: "Q7", answer: "functional_durable" },
        { question_id: "Q8", answer: "natural_looking" },
        { question_id: "Q9", answer: "30_45" },
        { question_id: "Q10", answer: "premium_best_result" },
        { question_id: "Q11", answer: "yes_for_best_result" },
        { question_id: "Q12", answer: "3_6_months" },
        { question_id: "Q13", answer: "no" },
        { question_id: "Q14", answer: "no" },
        { question_id: "Q15", answer: "excellent" },
        { question_id: "Q16a", answer: "no_complete" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "no" }
      ],
      metadata: {
        patient_name: "Sarah",
        occupation: "Marketing Manager"
      }
    }
  },
  {
    name: "case_06_pregnancy_consultation",
    description: "Pregnant patient seeking consultation, treatment timing considerations",
    intake: {
      session_id: "test-case-006",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "missing_teeth_long_term" },
        { question_id: "Q2", answer: "4" },
        { question_id: "Q3", answer: "missing_damaged" },
        { question_id: "Q4", answer: "no_never" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "one_missing" },
        { question_id: "Q6b", answer: "front_aesthetic_zone" },
        { question_id: "Q6c", answer: "intact" },
        { question_id: "Q7", answer: "natural_subtle" },
        { question_id: "Q8", answer: "natural_looking" },
        { question_id: "Q9", answer: "30_45" },
        { question_id: "Q10", answer: "price_quality_flexible" },
        { question_id: "Q11", answer: "maybe_need_info" },
        { question_id: "Q12", answer: "no_rush" },
        { question_id: "Q13", answer: "yes" },
        { question_id: "Q14", answer: "no" },
        { question_id: "Q15", answer: "good" },
        { question_id: "Q16a", answer: "pregnant" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "yes_mild" }
      ],
      metadata: {
        patient_name: "Emma",
        pregnancy_trimester: 2
      }
    }
  },
  {
    name: "case_07_smoker_risk_factors",
    description: "Patient with smoking history and diabetes, risk factor consideration",
    intake: {
      session_id: "test-case-007",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "missing_teeth_long_term" },
        { question_id: "Q2", answer: "3" },
        { question_id: "Q3", answer: "missing_damaged" },
        { question_id: "Q4", answer: "no_never" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "2_4_dispersed" },
        { question_id: "Q6b", answer: "both_zones" },
        { question_id: "Q6c", answer: "some_fillings" },
        { question_id: "Q7", answer: "functional_durable" },
        { question_id: "Q8", answer: "natural_looking" },
        { question_id: "Q9", answer: "45_60" },
        { question_id: "Q10", answer: "price_quality_flexible" },
        { question_id: "Q11", answer: "yes_for_best_result" },
        { question_id: "Q12", answer: "6_months" },
        { question_id: "Q13", answer: "yes" },
        { question_id: "Q14", answer: "daily" },
        { question_id: "Q15", answer: "moderate" },
        { question_id: "Q16a", answer: "diabetes" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "no" }
      ],
      metadata: {
        patient_name: "James",
        smoking_years: 15
      }
    }
  },
  {
    name: "case_08_dental_anxiety_severe",
    description: "Patient with severe dental anxiety, needs empathic approach",
    intake: {
      session_id: "test-case-008",
      timestamp: new Date().toISOString(),
      answers: [
        { question_id: "Q1", answer: "missing_teeth_long_term" },
        { question_id: "Q2", answer: "8" },
        { question_id: "Q3", answer: "missing_damaged" },
        { question_id: "Q4", answer: "yes_negative" },
        { question_id: "Q5", answer: "no_aesthetic_only" },
        { question_id: "Q6a", answer: "one_missing" },
        { question_id: "Q6b", answer: "side_chewing" },
        { question_id: "Q6c", answer: "intact" },
        { question_id: "Q7", answer: "natural_subtle" },
        { question_id: "Q8", answer: "natural_looking" },
        { question_id: "Q9", answer: "30_45" },
        { question_id: "Q10", answer: "price_quality_flexible" },
        { question_id: "Q11", answer: "prefer_minimal" },
        { question_id: "Q12", answer: "no_rush" },
        { question_id: "Q13", answer: "no" },
        { question_id: "Q14", answer: "no" },
        { question_id: "Q15", answer: "good" },
        { question_id: "Q16a", answer: "no_complete" },
        { question_id: "Q17", answer: "no" },
        { question_id: "Q18", answer: "yes_severe" }
      ],
      metadata: {
        patient_name: "Lisa",
        previous_negative_experience: true
      }
    }
  }
];

async function generateReports() {
  const pipeline = new ReportPipeline();

  console.log("Generating test reports...\n");

  for (const testCase of testCases) {
    console.log(`Processing: ${testCase.name}`);

    // Save input
    const inputPath = path.join("test_reports", "inputs", `${testCase.name}.json`);
    await fs.writeFile(inputPath, JSON.stringify({
      description: testCase.description,
      intake: testCase.intake
    }, null, 2));

    // Generate report
    const result = await pipeline.run(testCase.intake);

    // Format report as markdown
    const reportMd = formatReport(testCase, result);

    // Save report
    const reportPath = path.join("test_reports", "reports", `${testCase.name}.md`);
    await fs.writeFile(reportPath, reportMd);

    console.log(`  - Scenario: ${result.audit.scenario_match.matched_scenario}`);
    console.log(`  - Tone: ${result.audit.tone_selection.selected_tone}`);
    console.log(`  - Outcome: ${result.outcome}`);
    console.log(`  - Saved to: ${reportPath}\n`);
  }

  // Generate summary
  const summaryPath = path.join("test_reports", "SUMMARY.md");
  await fs.writeFile(summaryPath, generateSummary(testCases));

  console.log(`\nGenerated ${testCases.length} reports in test_reports/reports/`);
  console.log(`Summary saved to ${summaryPath}`);
}

function formatReport(testCase: typeof testCases[0], result: PipelineResult): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${testCase.description}`);
  lines.push("");
  lines.push(`**Case ID:** ${testCase.name}`);
  lines.push(`**Session:** ${testCase.intake.session_id}`);
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push("");

  // Metadata
  lines.push("## Pipeline Metadata");
  lines.push("");
  lines.push(`| Field | Value |`);
  lines.push(`|-------|-------|`);
  lines.push(`| Scenario | ${result.audit.scenario_match.matched_scenario} |`);
  lines.push(`| Tone Profile | ${result.audit.tone_selection.selected_tone} |`);
  lines.push(`| Confidence | ${result.audit.scenario_match.confidence} |`);
  lines.push(`| Outcome | ${result.outcome} |`);
  lines.push(`| Success | ${result.success} |`);

  if (result.report) {
    lines.push(`| Total Words | ${result.report.total_word_count} |`);
    lines.push(`| Sections | ${result.report.sections.length} |`);
    lines.push(`| Warnings Included | ${result.report.warnings_included} |`);
  }
  lines.push("");

  // Driver state summary
  lines.push("## Driver State");
  lines.push("");
  const drivers = result.audit.driver_state.drivers;
  for (const [key, driver] of Object.entries(drivers)) {
    if (driver && driver.value) {
      lines.push(`- **${key}:** ${driver.value} (source: ${driver.source})`);
    }
  }
  lines.push("");

  // Report content
  if (result.report) {
    lines.push("---");
    lines.push("");
    lines.push("# Generated Report");
    lines.push("");

    for (const section of result.report.sections) {
      lines.push(`## ${section.section_name}`);
      lines.push("");
      lines.push(section.content);
      lines.push("");
      lines.push(`*[${section.word_count} words]*`);
      lines.push("");
    }
  } else {
    lines.push("## Report Not Generated");
    lines.push("");
    lines.push(`**Reason:** ${result.error || "Unknown"}`);
    lines.push("");

    // Show validation issues
    if (result.audit.validation_result.errors.length > 0) {
      lines.push("### Validation Errors");
      for (const err of result.audit.validation_result.errors) {
        lines.push(`- ${err}`);
      }
      lines.push("");
    }

    if (result.audit.validation_result.semantic_violations.length > 0) {
      lines.push("### Semantic Violations");
      for (const v of result.audit.validation_result.semantic_violations) {
        lines.push(`- [${v.severity}] "${v.phrase}" in section ${v.location.section}: ${v.rule}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

function generateSummary(cases: typeof testCases): string {
  const lines: string[] = [];

  lines.push("# Test Reports Summary");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Test Cases");
  lines.push("");
  lines.push("| # | Case | Description |");
  lines.push("|---|------|-------------|");

  cases.forEach((tc, i) => {
    lines.push(`| ${i + 1} | [${tc.name}](reports/${tc.name}.md) | ${tc.description} |`);
  });

  lines.push("");
  lines.push("## Quick Reference");
  lines.push("");
  lines.push("### Scenarios Covered");
  lines.push("- S02: Single tooth aesthetic zone");
  lines.push("- S04: Multiple adjacent functional");
  lines.push("- S11: Aesthetic premium");
  lines.push("- S07/S08: Full mouth / extensive");
  lines.push("- S03: Single tooth functional");
  lines.push("- Various edge cases");
  lines.push("");
  lines.push("### Tone Profiles Used");
  lines.push("- TP-01: Neutral-Informative");
  lines.push("- TP-02: Empathic-Supportive");
  lines.push("- TP-04: Stability-Framing");
  lines.push("- TP-05: Expectation-Calibration");
  lines.push("- TP-06: Autonomy-Respecting");
  lines.push("");
  lines.push("### Special Conditions Tested");
  lines.push("- Pregnancy (medical constraints)");
  lines.push("- Smoking + Diabetes (risk factors)");
  lines.push("- Severe dental anxiety");
  lines.push("- Urgent pain cases");
  lines.push("- Premium vs economy budgets");

  return lines.join("\n");
}

generateReports().catch(console.error);
