/**
 * Regenerate all test reports from input files
 */

import { promises as fs } from "fs";
import * as path from "path";
import { ReportPipeline } from "../src/pipeline/ReportPipeline.js";

const inputDir = "./test_reports/inputs";
const reportDir = "./test_reports/reports";
const auditDir = "./test_reports/audits";

const pipeline = new ReportPipeline();

async function generateReport(inputFile: string) {
  const baseName = path.basename(inputFile, ".json");
  const content = await fs.readFile(inputFile, "utf-8");
  const { description, intake } = JSON.parse(content);

  console.log(`Processing: ${baseName}`);

  const result = await pipeline.run(intake);

  if (!result.success) {
    console.log(`  ERROR: ${result.error}`);
    if (result.audit?.validation_result) {
      console.log(`  Validation errors: ${result.audit.validation_result.errors.join(", ")}`);
      console.log(`  Semantic violations: ${result.audit.validation_result.semantic_violations.join(", ")}`);
    }
    return;
  }

  // Generate markdown report
  const report = result.report!;
  const audit = result.audit;

  let markdown = `# ${description}\n\n`;
  markdown += `**Case ID:** ${baseName}\n`;
  markdown += `**Session:** ${intake.session_id}\n`;
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;

  markdown += `## Pipeline Metadata\n\n`;
  markdown += `| Field | Value |\n`;
  markdown += `|-------|-------|\n`;
  markdown += `| Scenario | ${audit.scenario_match.matched_scenario} |\n`;
  markdown += `| Tone Profile | ${audit.tone_selection.selected_tone} |\n`;
  markdown += `| Confidence | ${audit.scenario_match.confidence} |\n`;
  markdown += `| Outcome | ${result.outcome} |\n`;
  markdown += `| Success | ${result.success} |\n`;
  markdown += `| Total Words | ${report.total_word_count} |\n`;
  markdown += `| Sections | ${report.sections.length} |\n`;
  markdown += `| Warnings Included | ${report.warnings_included} |\n\n`;

  markdown += `## Driver State\n\n`;
  for (const [key, driver] of Object.entries(audit.driver_state.drivers) as [string, { value: string; source: string }][]) {
    markdown += `- **${key}:** ${driver.value} (source: ${driver.source})\n`;
  }
  markdown += `\n---\n\n`;

  markdown += `# Generated Report\n\n`;
  for (const section of report.sections) {
    markdown += `## ${section.section_name}\n\n`;
    markdown += section.content;
    markdown += `\n\n*[${section.word_count} words]*\n\n`;
  }

  // Write report
  const reportPath = path.join(reportDir, `${baseName}.md`);
  await fs.writeFile(reportPath, markdown);

  // Write audit
  const auditPath = path.join(auditDir, `${baseName}.json`);
  await fs.writeFile(auditPath, JSON.stringify(audit, null, 2));

  console.log(`  OK: ${result.outcome}, ${report.sections.length} sections, ${report.total_word_count} words`);
}

async function main() {
  const files = await fs.readdir(inputDir);
  const jsonFiles = files.filter(f => f.endsWith(".json")).sort();

  console.log(`Regenerating ${jsonFiles.length} reports...\n`);

  for (const file of jsonFiles) {
    await generateReport(path.join(inputDir, file));
  }

  console.log("\nAll reports regenerated.");
}

main().catch(console.error);
