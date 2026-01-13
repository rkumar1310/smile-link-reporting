/**
 * Regenerate all test reports from input files
 * Stores LLM evaluations in a separate directory for actionable feedback
 */

import { promises as fs } from "fs";
import * as path from "path";
import { ReportPipeline } from "../src/pipeline/ReportPipeline.js";
import type { LLMEvaluationResult, AuditRecord } from "../src/types/index.js";

const inputDir = "./test_reports/inputs";
const reportDir = "./test_reports/reports";
const auditDir = "./test_reports/audits";
const llmEvalDir = "./test_reports/llm_evaluations";

const pipeline = new ReportPipeline();

interface LLMEvaluationFile {
  session_id: string;
  case_id: string;
  evaluation_timestamp: string;
  outcome: string;
  overall_score: number;
  dimensions: {
    professional_quality: { score: number; feedback: string };
    clinical_safety: { score: number; feedback: string };
    tone_appropriateness: { score: number; feedback: string };
    personalization: { score: number; feedback: string };
    patient_autonomy: { score: number; feedback: string };
    structure_completeness: { score: number; feedback: string };
  };
  content_issues: Array<{
    section_number: number;
    source_content: string;
    quote: string;
    problem: string;
    severity: string;
    suggested_fix: string;
  }>;
  content_files_to_review: string[];
  overall_assessment: string;
  metadata: {
    model_used: string;
    duration_ms: number;
    token_usage: { input_tokens: number; output_tokens: number };
  };
}

/**
 * Extract LLM evaluation into a separate, actionable file format
 */
function extractLLMEvaluation(
  audit: AuditRecord,
  caseId: string
): LLMEvaluationFile | null {
  const llmEval = audit.llm_evaluation;
  if (!llmEval) return null;

  return {
    session_id: audit.session_id,
    case_id: caseId,
    evaluation_timestamp: llmEval.metadata.evaluation_timestamp,
    outcome: llmEval.recommended_outcome,
    overall_score: llmEval.overall_score,
    dimensions: {
      professional_quality: {
        score: llmEval.professional_quality.score,
        feedback: llmEval.professional_quality.feedback
      },
      clinical_safety: {
        score: llmEval.clinical_safety.score,
        feedback: llmEval.clinical_safety.feedback
      },
      tone_appropriateness: {
        score: llmEval.tone_appropriateness.score,
        feedback: llmEval.tone_appropriateness.feedback
      },
      personalization: {
        score: llmEval.personalization.score,
        feedback: llmEval.personalization.feedback
      },
      patient_autonomy: {
        score: llmEval.patient_autonomy.score,
        feedback: llmEval.patient_autonomy.feedback
      },
      structure_completeness: {
        score: llmEval.structure_completeness.score,
        feedback: llmEval.structure_completeness.feedback
      }
    },
    content_issues: llmEval.content_issues,
    content_files_to_review: llmEval.content_files_to_review,
    overall_assessment: llmEval.overall_assessment,
    metadata: {
      model_used: llmEval.metadata.model_used,
      duration_ms: llmEval.metadata.duration_ms,
      token_usage: llmEval.metadata.token_usage
    }
  };
}

async function generateReport(inputFile: string) {
  const baseName = path.basename(inputFile, ".json");
  const content = await fs.readFile(inputFile, "utf-8");
  const { description, intake } = JSON.parse(content);

  console.log(`Processing: ${baseName}`);

  const result = await pipeline.run(intake);

  if (!result.success) {
    console.error(`\n❌ FAILED: ${baseName}`);
    console.error(`   Error: ${result.error}`);
    if (result.audit?.validation_result) {
      console.error(`   Validation errors: ${result.audit.validation_result.errors.join(", ")}`);
      console.error(`   Semantic violations: ${result.audit.validation_result.semantic_violations.join(", ")}`);
    }
    if (result.audit?.scenario_match) {
      console.error(`   Scenario: ${result.audit.scenario_match.matched_scenario}`);
    }
    if (result.audit?.tone_selection) {
      console.error(`   Tone: ${result.audit.tone_selection.selected_tone}`);
    }
    throw new Error(`Report generation failed for ${baseName}: ${result.error}`);
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

  // Add LLM evaluation summary to markdown if available
  if (audit.llm_evaluation) {
    const llmEval = audit.llm_evaluation;
    markdown += `## LLM Quality Evaluation\n\n`;
    markdown += `| Dimension | Score | Weight |\n`;
    markdown += `|-----------|-------|--------|\n`;
    markdown += `| Professional Quality | ${llmEval.professional_quality.score}/10 | 15% |\n`;
    markdown += `| Clinical Safety | ${llmEval.clinical_safety.score}/10 | 25% |\n`;
    markdown += `| Tone Appropriateness | ${llmEval.tone_appropriateness.score}/10 | 20% |\n`;
    markdown += `| Personalization | ${llmEval.personalization.score}/10 | 15% |\n`;
    markdown += `| Patient Autonomy | ${llmEval.patient_autonomy.score}/10 | 15% |\n`;
    markdown += `| Structure & Completeness | ${llmEval.structure_completeness.score}/10 | 10% |\n`;
    markdown += `| **Overall** | **${llmEval.overall_score}/10** | |\n\n`;
    markdown += `**Assessment:** ${llmEval.overall_assessment}\n\n`;

    if (llmEval.content_issues.length > 0) {
      markdown += `### Content Issues (${llmEval.content_issues.length})\n\n`;
      for (const issue of llmEval.content_issues) {
        markdown += `- **[${issue.severity.toUpperCase()}]** Section ${issue.section_number}: ${issue.problem}\n`;
        markdown += `  - Source: \`${issue.source_content}\`\n`;
        markdown += `  - Fix: ${issue.suggested_fix}\n\n`;
      }
    }

    if (llmEval.content_files_to_review.length > 0) {
      markdown += `### Files to Review\n\n`;
      for (const file of llmEval.content_files_to_review) {
        markdown += `- \`${file}\`\n`;
      }
      markdown += `\n`;
    }
  }

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

  // Write audit (full audit still goes to audits dir)
  const auditPath = path.join(auditDir, `${baseName}.json`);
  await fs.writeFile(auditPath, JSON.stringify(audit, null, 2));

  // Write separate LLM evaluation file if available
  const llmEvalFile = extractLLMEvaluation(audit, baseName);
  if (llmEvalFile) {
    const llmEvalPath = path.join(llmEvalDir, `${baseName}.json`);
    await fs.writeFile(llmEvalPath, JSON.stringify(llmEvalFile, null, 2));
  }

  // Build output status
  let status = `  ${result.outcome}`;
  if (audit.llm_evaluation) {
    status += `, LLM: ${audit.llm_evaluation.overall_score}/10`;
    if (audit.llm_evaluation.content_issues.length > 0) {
      const critical = audit.llm_evaluation.content_issues.filter(i => i.severity === "critical").length;
      const warning = audit.llm_evaluation.content_issues.filter(i => i.severity === "warning").length;
      status += ` (${critical}C/${warning}W issues)`;
    }
  }
  status += `, ${report.sections.length} sections, ${report.total_word_count} words`;
  console.log(status);
}

async function main() {
  // Ensure output directories exist
  await fs.mkdir(reportDir, { recursive: true });
  await fs.mkdir(auditDir, { recursive: true });
  await fs.mkdir(llmEvalDir, { recursive: true });

  const files = await fs.readdir(inputDir);
  const jsonFiles = files.filter(f => f.endsWith(".json")).sort();

  console.log(`Regenerating ${jsonFiles.length} reports...\n`);

  let passCount = 0;
  let flagCount = 0;
  let blockCount = 0;

  for (const file of jsonFiles) {
    try {
      await generateReport(path.join(inputDir, file));
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log("\nAll reports regenerated.");
  console.log(`Output directories:`);
  console.log(`  - Reports: ${reportDir}`);
  console.log(`  - Audits: ${auditDir}`);
  console.log(`  - LLM Evaluations: ${llmEvalDir}`);
}

main().catch(console.error);
