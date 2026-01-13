/**
 * Regenerate a single test report
 * Usage: npx tsx --env-file=.env scripts/regenerate-single.ts case_05_young_professional_implant
 */

import { promises as fs } from "fs";
import * as path from "path";
import { ReportPipeline } from "../src/pipeline/ReportPipeline.js";

const pipeline = new ReportPipeline();
const caseName = process.argv[2] || "case_05_young_professional_implant";
const inputFile = `./test_reports/inputs/${caseName}.json`;

async function run() {
  console.log(`Processing: ${caseName}`);

  const content = await fs.readFile(inputFile, "utf-8");
  const { description, intake } = JSON.parse(content);

  const result = await pipeline.run(intake);

  if (!result.success) {
    console.error("Failed:", result.error);
    return;
  }

  const report = result.report!;
  const audit = result.audit;

  // Write audit
  await fs.writeFile(
    `./test_reports/audits/${caseName}.json`,
    JSON.stringify(audit, null, 2)
  );

  // Write LLM evaluation if available
  if (audit.llm_evaluation) {
    const llmEval = {
      session_id: audit.session_id,
      case_id: caseName,
      evaluation_timestamp: audit.llm_evaluation.metadata.evaluation_timestamp,
      outcome: audit.llm_evaluation.recommended_outcome,
      overall_score: audit.llm_evaluation.overall_score,
      dimensions: {
        professional_quality: {
          score: audit.llm_evaluation.professional_quality.score,
          feedback: audit.llm_evaluation.professional_quality.feedback
        },
        clinical_safety: {
          score: audit.llm_evaluation.clinical_safety.score,
          feedback: audit.llm_evaluation.clinical_safety.feedback
        },
        tone_appropriateness: {
          score: audit.llm_evaluation.tone_appropriateness.score,
          feedback: audit.llm_evaluation.tone_appropriateness.feedback
        },
        personalization: {
          score: audit.llm_evaluation.personalization.score,
          feedback: audit.llm_evaluation.personalization.feedback
        },
        patient_autonomy: {
          score: audit.llm_evaluation.patient_autonomy.score,
          feedback: audit.llm_evaluation.patient_autonomy.feedback
        },
        structure_completeness: {
          score: audit.llm_evaluation.structure_completeness.score,
          feedback: audit.llm_evaluation.structure_completeness.feedback
        }
      },
      content_issues: audit.llm_evaluation.content_issues,
      content_files_to_review: audit.llm_evaluation.content_files_to_review,
      overall_assessment: audit.llm_evaluation.overall_assessment,
      metadata: audit.llm_evaluation.metadata
    };
    await fs.writeFile(
      `./test_reports/llm_evaluations/${caseName}.json`,
      JSON.stringify(llmEval, null, 2)
    );
  }

  // Build status
  let status = `  ${result.outcome}`;
  if (audit.llm_evaluation) {
    status += `, LLM: ${audit.llm_evaluation.overall_score}/10`;
    const issues = audit.llm_evaluation.content_issues;
    if (issues.length > 0) {
      const critical = issues.filter(i => i.severity === "critical").length;
      const warning = issues.filter(i => i.severity === "warning").length;
      status += ` (${critical}C/${warning}W issues)`;
    }
  }
  status += `, ${report.sections.length} sections, ${report.total_word_count} words`;
  console.log(status);
}

run().catch(console.error);
