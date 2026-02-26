// @ts-nocheck — Legacy migration script, superseded by importScenarios.ts
/**
 * Scenario Migration Script
 *
 * Combines:
 * 1. Parsed markdown content from content/scenarios/
 * 2. Matching criteria from scenario-profiles.json
 * 3. Generates proper ScenarioCreateInput objects for MongoDB
 *
 * Run with: npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/migrateScenarios.ts
 */

import * as fs from "fs";
import * as path from "path";
import {
  parseScenarioMarkdown,
  getAllScenarioIds,
  type ParsedScenarioData,
  type ParsedTreatmentOption,
} from "./parseScenarioMarkdown";
import type { ScenarioCreateInput, BilingualText, TreatmentOption } from "../schemas/ScenarioSchema";

// ============================================================================
// Load scenario profiles (matching criteria)
// ============================================================================

interface ScenarioProfile {
  name: string;
  description: string;
  required_drivers: Record<string, string[]>;
  strong_drivers: Record<string, string[]>;
  supporting_drivers: Record<string, string[]>;
  excluding_drivers: Record<string, string[]>;
  is_fallback?: boolean;
  is_safety_scenario?: boolean;
  preferred_tags?: string[];
}

function loadScenarioProfiles(): Record<string, ScenarioProfile> {
  const profilesPath = path.join(process.cwd(), "src/lib/pipeline/config/scenario-profiles.json");
  const profilesJson = fs.readFileSync(profilesPath, "utf-8");
  const profiles = JSON.parse(profilesJson);

  // Normalize IDs (S00_GENERIC -> S00)
  const normalized: Record<string, ScenarioProfile> = {};
  for (const [key, value] of Object.entries(profiles.scenarios)) {
    const normalizedKey = key === "S00_GENERIC" ? "S00" : key;
    normalized[normalizedKey] = value as ScenarioProfile;
  }

  return normalized;
}

// ============================================================================
// Transform parsed data to schema format
// ============================================================================

function transformTreatmentOption(
  parsed: ParsedTreatmentOption,
  parsedNl: ParsedTreatmentOption | null,
  index: number
): TreatmentOption {
  const categoryMap: Record<string, TreatmentOption["category"]> = {
    implant: "implant",
    crown: "crown",
    bridge: "bridge",
    denture: "denture",
    veneer: "veneer",
    whitening: "whitening",
    orthodontic: "orthodontic",
    aligner: "orthodontic",
    braces: "orthodontic",
  };

  // Determine category from name
  let category: TreatmentOption["category"] = "other";
  const nameLower = parsed.name.toLowerCase();
  for (const [keyword, cat] of Object.entries(categoryMap)) {
    if (nameLower.includes(keyword)) {
      category = cat;
      break;
    }
  }

  // Create bilingual text
  const bilingual = (en: string, nl: string | undefined): BilingualText => ({
    en,
    nl: nl || en, // Fallback to English if NL not available
  });

  return {
    id: `opt_${index + 1}`,
    name: bilingual(parsed.name, parsedNl?.name),
    rank: index + 1,
    category,
    description: parsed.description
      ? bilingual(parsed.description, parsedNl?.description)
      : undefined,
    benefits: parsed.benefits.length > 0
      ? parsed.benefits.map((b, i) => bilingual(b, parsedNl?.benefits?.[i]))
      : undefined,
    considerations: parsed.considerations.length > 0
      ? parsed.considerations.map((c, i) => bilingual(c, parsedNl?.considerations?.[i]))
      : undefined,
    ideal_for: parsed.idealFor
      ? bilingual(parsed.idealFor, parsedNl?.idealFor)
      : undefined,
    pricing: parsed.pricing
      ? {
          min: parsed.pricing.min,
          max: parsed.pricing.max,
          currency: "EUR",
        }
      : undefined,
    duration: parsed.duration
      ? {
          min_months: parsed.duration.minMonths,
          max_months: parsed.duration.maxMonths,
        }
      : undefined,
    recovery: parsed.recovery
      ? {
          days: parsed.recovery.days,
          description: parsed.recovery.description
            ? bilingual(parsed.recovery.description, "")
            : undefined,
        }
      : undefined,
  };
}

function createScenarioFromParsed(
  scenarioId: string,
  enData: ParsedScenarioData | null,
  nlData: ParsedScenarioData | null,
  profile: ScenarioProfile | null,
  priority: number
): ScenarioCreateInput | null {
  if (!enData && !nlData) {
    console.warn(`No data found for scenario ${scenarioId}`);
    return null;
  }

  const en = enData || nlData!;
  const nl = nlData || enData!;

  // Create bilingual helper
  const bilingual = (enText: string, nlText: string): BilingualText => ({
    en: enText,
    nl: nlText,
  });

  // Transform treatment options
  const treatmentOptions: TreatmentOption[] = en.options.map((opt, i) =>
    transformTreatmentOption(opt, nl?.options?.[i] || null, i)
  );

  // Build the scenario
  const scenario: ScenarioCreateInput = {
    _id: scenarioId,
    name: bilingual(
      profile?.name || `Scenario ${scenarioId}`,
      profile?.description || `Scenario ${scenarioId}`
    ),
    description: bilingual(
      profile?.description || en.personalSummary.substring(0, 200),
      nl.personalSummary.substring(0, 200)
    ),
    is_fallback: profile?.is_fallback || false,
    is_safety_scenario: profile?.is_safety_scenario || false,
    priority,
    matching: {
      required_drivers: profile?.required_drivers || {},
      strong_drivers: profile?.strong_drivers || {},
      supporting_drivers: profile?.supporting_drivers || {},
      excluding_drivers: profile?.excluding_drivers || {},
      preferred_tags: profile?.preferred_tags || [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: bilingual(
        extractFirstSentence(en.personalSummary),
        extractFirstSentence(nl.personalSummary)
      ),
      SITUATION_BASE: bilingual(
        extractFirstSentence(en.situation),
        extractFirstSentence(nl.situation)
      ),
      SITUATION_RELEVANCE: bilingual(
        extractSecondSentence(en.situation),
        extractSecondSentence(nl.situation)
      ),
    },
    treatment_options: treatmentOptions,
    pricing: en.aggregatePricing
      ? {
          min: en.aggregatePricing.min,
          max: en.aggregatePricing.max,
          currency: "EUR",
        }
      : undefined,
    version: "2.0.0",
  };

  return scenario;
}

function stripMarkdownHeaders(text: string): string {
  // Remove markdown headers (lines starting with #)
  return text.replace(/^#[^\n]*\n+/gm, "").trim();
}

function extractFirstSentence(text: string): string {
  const cleaned = stripMarkdownHeaders(text);
  const match = cleaned.match(/^[^.!?]+[.!?]/);
  return match ? match[0].trim() : cleaned.substring(0, 150);
}

function extractSecondSentence(text: string): string {
  const cleaned = stripMarkdownHeaders(text);
  const sentences = cleaned.match(/[^.!?]+[.!?]/g);
  if (sentences && sentences.length > 1) {
    return sentences[1].trim();
  }
  return "";
}

// ============================================================================
// Main migration function
// ============================================================================

export async function migrateAllScenarios(): Promise<ScenarioCreateInput[]> {
  const contentDir = path.join(process.cwd(), "content/scenarios");
  const scenarioIds = getAllScenarioIds(contentDir);
  const profiles = loadScenarioProfiles();

  console.log(`Found ${scenarioIds.length} scenarios to migrate: ${scenarioIds.join(", ")}`);

  // Priority order from scenario-profiles.json
  const priorityOrder = ["S12", "S10", "S09", "S07", "S08", "S04", "S05", "S06", "S02", "S03", "S17", "S01", "S11", "S13", "S14", "S15", "S16", "S00"];

  const scenarios: ScenarioCreateInput[] = [];

  for (const scenarioId of scenarioIds) {
    console.log(`\nProcessing ${scenarioId}...`);

    // Parse EN file (use TP-01.md as the base)
    const enPath = path.join(contentDir, scenarioId, "en", "TP-01.md");
    const nlPath = path.join(contentDir, scenarioId, "nl", "TP-01.md");

    const enData = fs.existsSync(enPath) ? parseScenarioMarkdown(enPath) : null;
    const nlData = fs.existsSync(nlPath) ? parseScenarioMarkdown(nlPath) : null;

    if (enData) {
      console.log(`  EN: ${enData.options.length} treatment options found`);
      if (enData.aggregatePricing) {
        console.log(`  Pricing: €${enData.aggregatePricing.min} - €${enData.aggregatePricing.max}`);
      }
    } else {
      console.log(`  EN: No TP-01.md found`);
    }

    const profile = profiles[scenarioId] || null;
    const priority = priorityOrder.indexOf(scenarioId) + 1 || 99;

    const scenario = createScenarioFromParsed(scenarioId, enData, nlData, profile, priority);
    if (scenario) {
      scenarios.push(scenario);
      console.log(`  Created scenario with ${scenario.treatment_options.length} options`);
    }
  }

  return scenarios;
}

// ============================================================================
// Generate seed file
// ============================================================================

function generateSeedFile(scenarios: ScenarioCreateInput[]): string {
  const header = `/**
 * Scenario Seed Data
 *
 * Auto-generated from content/scenarios/ markdown files
 * Run migration: npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/migrateScenarios.ts
 *
 * Generated: ${new Date().toISOString()}
 */

import type { ScenarioCreateInput } from "../schemas/ScenarioSchema";

export const SCENARIO_SEEDS: ScenarioCreateInput[] = `;

  return header + JSON.stringify(scenarios, null, 2) + ";\n";
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  console.log("=".repeat(60));
  console.log("Scenario Migration Script");
  console.log("=".repeat(60));

  const scenarios = await migrateAllScenarios();

  console.log("\n" + "=".repeat(60));
  console.log(`Migration complete: ${scenarios.length} scenarios processed`);
  console.log("=".repeat(60));

  // Generate seed file
  const seedContent = generateSeedFile(scenarios);
  const seedPath = path.join(process.cwd(), "src/lib/pipeline/nlg/seed/scenarios.seed.ts");

  fs.writeFileSync(seedPath, seedContent, "utf-8");
  console.log(`\nSeed file written to: ${seedPath}`);

  // Print summary
  console.log("\nScenario Summary:");
  for (const s of scenarios) {
    const optCount = s.treatment_options.length;
    const pricing = s.pricing ? `€${s.pricing.min}-€${s.pricing.max}` : "no pricing";
    console.log(`  ${s._id}: ${optCount} options, ${pricing}`);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
