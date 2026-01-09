import { ReportPipeline } from "../src/pipeline/ReportPipeline.js";
import { promises as fs } from "fs";

async function debugCase(caseName: string) {
  const data = JSON.parse(await fs.readFile(`./test_reports/inputs/${caseName}.json`, "utf-8"));
  const pipeline = new ReportPipeline();
  const result = await pipeline.run(data.intake);

  console.log(`\n=== ${caseName.toUpperCase()} ===`);
  console.log("Success:", result.success);
  console.log("Outcome:", result.audit?.final_outcome);
  console.log("Error:", result.error);
  console.log("");

  // Show key drivers
  console.log("Key drivers:");
  const drivers = result.audit?.driver_state?.drivers;
  if (drivers) {
    console.log("  medical_constraints:", drivers.medical_constraints?.value);
    console.log("  clinical_priority:", drivers.clinical_priority?.value);
    console.log("  mouth_situation:", drivers.mouth_situation?.value);
  }
  console.log("");

  // Show A_BLOCK selections
  console.log("A_* blocks:");
  for (const sel of result.audit?.content_selections || []) {
    if (sel.content_id.startsWith("A_")) {
      console.log(`  ${sel.content_id} - suppressed: ${sel.suppressed}`);
    }
  }
  console.log("");

  console.log("Validation errors:", result.audit?.validation_result?.errors);
  console.log("Validation warnings:", result.audit?.validation_result?.warnings);
  console.log("");
  console.log("Semantic violations:", JSON.stringify(result.audit?.validation_result?.semantic_violations, null, 2));
}

async function main() {
  const data = JSON.parse(await fs.readFile(`./test_reports/inputs/case_07_smoker_risk_factors.json`, "utf-8"));
  const pipeline = new ReportPipeline();
  const result = await pipeline.run(data.intake);
  console.log("Scenario:", result.audit?.scenario_match?.matched_scenario);
  console.log("Confidence:", result.audit?.scenario_match?.confidence);
  console.log("Scenario Match:", JSON.stringify(result.audit?.scenario_match, null, 2));
  await debugCase("case_07_smoker_risk_factors");
}

main().catch(console.error);
