/**
 * Import Scenarios from JSON files
 *
 * Reads JSON files from import/ directory and upserts them into MongoDB.
 * Derives scenario_id from filename when the JSON has "S__" placeholder.
 * Preserves existing matching criteria, classification, and priority from MongoDB.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/importScenarios.ts
 *   npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/importScenarios.ts import/s1.json
 */

import * as fs from "fs";
import * as path from "path";
import { scenarioService } from "@/lib/services/ScenarioService";
import type { ScenarioCreateInput } from "../schemas/ScenarioSchema";

const IMPORT_DIR = path.join(process.cwd(), "import");

/**
 * Derive a scenario ID from filename.
 * "s1.json" → "S01", "s12.json" → "S12"
 */
function deriveScenarioId(filename: string): string {
  const match = filename.match(/^s(\d+)\.json$/i);
  if (!match) throw new Error(`Cannot derive scenario ID from filename: ${filename}`);
  return `S${match[1].padStart(2, "0")}`;
}

/**
 * Map an import JSON object to ScenarioCreateInput
 */
function mapImportToScenario(
  data: Record<string, unknown>,
  scenarioId: string,
  existing?: { matching?: unknown; is_fallback?: boolean; is_safety_scenario?: boolean; priority?: number }
): ScenarioCreateInput {
  const name = data.name as { en: string; nl: string };

  return {
    _id: scenarioId,
    name,
    is_fallback: existing?.is_fallback ?? false,
    is_safety_scenario: existing?.is_safety_scenario ?? false,
    priority: existing?.priority ?? 10,
    matching: (existing?.matching as ScenarioCreateInput["matching"]) ?? {
      required_drivers: {},
      strong_drivers: {},
      supporting_drivers: {},
      excluding_drivers: {},
      preferred_tags: [],
    },
    nlg_variables: {
      block_0_personal_summary: data.block_0_personal_summary as ScenarioCreateInput["nlg_variables"]["block_0_personal_summary"],
      block_1_situation: data.block_1_situation as ScenarioCreateInput["nlg_variables"]["block_1_situation"],
      block_2_treatment_directions: data.block_2_treatment_directions as ScenarioCreateInput["nlg_variables"]["block_2_treatment_directions"],
      block_3_options: data.block_3_options as ScenarioCreateInput["nlg_variables"]["block_3_options"],
      block_4_expected_results: data.block_4_expected_results as { en: string; nl: string },
      block_5_duration: data.block_5_duration as { en: string; nl: string },
      block_6_recovery: data.block_6_recovery as { en: string; nl: string },
      block_7_cost: data.block_7_cost as { en: string; nl: string },
    },
    version: "2.0.0",
  };
}

/**
 * Import a single JSON file
 */
async function importFile(filePath: string): Promise<void> {
  const filename = path.basename(filePath);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  // Derive scenario ID from filename if placeholder
  let scenarioId = data.scenario_id as string;
  if (!scenarioId || scenarioId.startsWith("S__")) {
    scenarioId = deriveScenarioId(filename);
  }

  console.log(`Importing ${filename} → ${scenarioId}...`);

  // Check for existing scenario to preserve matching/classification
  let existing: { matching?: unknown; is_fallback?: boolean; is_safety_scenario?: boolean; priority?: number } | undefined;
  try {
    const existingScenario = await scenarioService.getById(scenarioId);
    if (existingScenario) {
      existing = {
        matching: existingScenario.matching,
        is_fallback: existingScenario.is_fallback,
        is_safety_scenario: existingScenario.is_safety_scenario,
        priority: existingScenario.priority,
      };
      console.log(`  Found existing scenario, preserving matching/classification.`);
    }
  } catch {
    // getById may fail if schema validation fails on old data — that's fine, we'll create fresh
  }

  const scenario = mapImportToScenario(data, scenarioId, existing);
  await scenarioService.upsert(scenario);
  console.log(`  ✓ Upserted ${scenarioId}`);
}

/**
 * Import all JSON files from import/ directory
 */
async function importAll(): Promise<void> {
  const files = fs.readdirSync(IMPORT_DIR)
    .filter(f => f.match(/^s\d+\.json$/i))
    .sort();

  if (files.length === 0) {
    console.log("No scenario JSON files found in import/ directory.");
    return;
  }

  console.log(`Found ${files.length} scenario file(s) to import.\n`);

  for (const file of files) {
    await importFile(path.join(IMPORT_DIR, file));
  }

  console.log(`\nDone. Imported ${files.length} scenario(s).`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const clearFlag = args.includes("--clear");
  const specificFile = args.find(a => !a.startsWith("--"));

  if (clearFlag) {
    const deleted = await scenarioService.deleteAll();
    console.log(`Deleted ${deleted} scenarios.\n`);
  }

  if (specificFile) {
    const filePath = path.isAbsolute(specificFile)
      ? specificFile
      : path.join(process.cwd(), specificFile);
    await importFile(filePath);
  } else {
    await importAll();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
