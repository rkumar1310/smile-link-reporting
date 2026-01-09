/**
 * Fix test input files to use valid answer values
 */

import { promises as fs } from "fs";
import * as path from "path";

const inputDir = "./test_reports/inputs";

// Mapping of invalid values to valid values
const valueFixes: Record<string, Record<string, string | string[]>> = {
  Q2a: {
    "cant_chew_properly": "chewing_missing",
  },
  Q3: {
    "many_teeth_missing": ["missing_damaged"],
    "teeth_gaps": ["missing_damaged"],
    "discolored": ["discoloured_dull"],
  },
  Q4: {
    "yes_dentures": ["no_never"],
    "yes_whitening": ["no_never"],
  },
  Q6a: {
    "many_missing": "5_plus_one_jaw",
    "several_missing": "2_4_adjacent",
  },
  Q6b: {
    "throughout": "both",
  },
  Q6c: {
    "few_remaining": "heavily_restored",
    "some_damaged": "partially_restored",
  },
  Q8: {
    "natural_looking": "very_important_natural",
    "bright_white": "hollywood_bright_white",
  },
  Q11: {
    "prefer_minimal": "ai_report_first",
    "open_to_options": "maybe_need_info",
  },
  Q12: {
    "no_rush": "still_exploring",
    "soon": "1_3_months",
    "within_year": "1_year",
  },
  Q13: {
    "yes": "no",  // Q13 is about pregnancy - "yes" should be "yes_pregnant", but for elderly patient use "no"
    "not_applicable": "no",
    "n/a": "no",
  },
  Q15: {
    "moderate": "basic",
    "excellent": "good",
  },
  Q16a: {
    "heart_condition": "no_complete",  // Q16a is about jaw growth, not heart
    "complete": "no_complete",
    "yes": "yes_incomplete",
  },
  Q17: {
    "blood_thinners": "yes",  // Has medical contraindications
    "none": "no",
  },
};

async function fixInputFile(filePath: string) {
  const content = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(content);

  let modified = false;

  for (const answer of data.intake.answers) {
    const qid = answer.question_id;
    const fixes = valueFixes[qid];

    if (fixes) {
      const currentValue = Array.isArray(answer.answer) ? answer.answer[0] : answer.answer;
      const fixedValue = fixes[currentValue];

      if (fixedValue !== undefined) {
        answer.answer = fixedValue;
        console.log(`  ${qid}: "${currentValue}" -> "${JSON.stringify(fixedValue)}"`);
        modified = true;
      }
    }
  }

  if (modified) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n");
    return true;
  }
  return false;
}

async function main() {
  const files = await fs.readdir(inputDir);
  const jsonFiles = files.filter(f => f.endsWith(".json")).sort();

  console.log(`Fixing ${jsonFiles.length} input files...\n`);

  for (const file of jsonFiles) {
    console.log(`${file}:`);
    const wasModified = await fixInputFile(path.join(inputDir, file));
    if (!wasModified) {
      console.log("  (no fixes needed)");
    }
  }

  console.log("\nDone.");
}

main().catch(console.error);
