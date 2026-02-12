/**
 * Scenario Seed Runner
 *
 * Run with: npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/runSeed.ts
 * Or: npm run seed:scenarios
 */

import { scenarioService } from "@/lib/services/ScenarioService";
import { SCENARIO_SEEDS } from "./scenarios.seed";

async function runSeed() {
  console.log("Starting scenario seed...\n");

  try {
    // Check existing data
    const existingCount = await scenarioService.count();
    console.log(`Existing scenarios in database: ${existingCount}`);

    // Upsert all scenarios
    console.log(`\nSeeding ${SCENARIO_SEEDS.length} scenarios...`);

    const result = await scenarioService.bulkUpsert(SCENARIO_SEEDS);

    console.log(`\nSeed complete:`);
    console.log(`  - Inserted: ${result.inserted}`);
    console.log(`  - Updated: ${result.updated}`);

    // Verify
    const finalCount = await scenarioService.count();
    console.log(`\nTotal scenarios in database: ${finalCount}`);

    // List all scenarios
    const all = await scenarioService.getAll();
    console.log("\nScenarios:");
    for (const s of all) {
      console.log(`  - ${s._id}: ${s.name.en} (priority: ${s.priority}${s.is_safety_scenario ? ", SAFETY" : ""}${s.is_fallback ? ", FALLBACK" : ""})`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

runSeed();
