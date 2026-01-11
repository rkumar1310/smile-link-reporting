/**
 * Create Dutch translations from reference documents
 *
 * This script:
 * 1. Extracts Dutch content from the reference DOCX files
 * 2. Creates nl/ folders and files matching the English structure
 * 3. Uses direct Dutch text for scenarios, translates headers for other content
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, "../content");
const REFERENCE_DOCS_DIR = path.join(__dirname, "../reference-docs/content");

// Extract text from DOCX using unzip and regex
function extractDOCXText(docxPath: string): string {
  try {
    const xml = execSync(`unzip -p "${docxPath}" word/document.xml`, {
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });
    const texts = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    return texts
      .map((t) => t.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, "$1"))
      .join("");
  } catch (error) {
    console.error(`Error extracting ${docxPath}:`, error);
    return "";
  }
}

// Parse Dutch scenarios from extracted text - returns raw text blocks
function parseDutchScenarios(text: string): Map<string, string> {
  const scenarios = new Map<string, string>();

  // Split by "Scenario S" pattern - each block is a complete scenario
  const parts = text.split(/(?=Scenario S\d+)/);

  for (const block of parts) {
    if (!block.trim()) continue;

    // Extract scenario ID - normalize to 2-digit format
    const idMatch = block.match(/Scenario S(\d+)/);
    if (!idMatch) continue;

    const num = parseInt(idMatch[1]);
    const id = `S${num.toString().padStart(2, "0")}`;

    scenarios.set(id, block);
  }

  return scenarios;
}

// Build proper markdown from Dutch scenario block
function buildScenarioMarkdown(
  scenarioId: string,
  dutchBlock: string,
  tone: string
): string {
  // Clean the block
  let content = dutchBlock
    .replace(/&amp;/g, "&")
    .replace(/Versie-ID:.*?(?=\d+\.|$)/g, "")
    .replace(/Status:.*?(?=\d+\.|$)/g, "")
    .replace(/🔐.*?(?=\d+\.|$)/g, "")
    .replace(/\(exact \d+ woorden\)/g, "")
    .replace(/\(±\d+ woorden.*?\)/g, "")
    .replace(/CANONIEK.*?(?=\d+\.)/g, "");

  // Build structured markdown
  let markdown = `---
id: ${scenarioId}
tone: ${tone}
version: 2.1
source: Scenarioblok per scenariodocx.docx
---

`;

  // Section 2: Personal Summary (Dutch section 2)
  const section2Match = content.match(
    /2\.\s*Persoonlijke samenvatting([\s\S]*?)(?=3\.\s*(?:Uw situatie|Uw Situatie))/
  );
  if (section2Match) {
    markdown += `# Sectie 2: Persoonlijke samenvatting

${section2Match[1].trim()}

`;
  }

  // Section 3: Your Situation (Dutch section 3)
  const section3Match = content.match(
    /3\.\s*Uw situatie([\s\S]*?)(?=4\.\s*(?:Mogelijke behandelrichtingen|Behandelrichting|Mogelijke behandel))/i
  );
  if (section3Match) {
    markdown += `# Sectie 3: Uw situatie

${section3Match[1].trim()}

`;
  }

  // Section 4: Treatment Directions (Dutch section 4)
  const section4Match = content.match(
    /4\.\s*(Mogelijke behandelrichtingen|Behandelrichting)([\s\S]*?)(?=5\.\s*(?:Optie|Behandeloptie))/i
  );
  if (section4Match) {
    markdown += `# Sectie 4: ${section4Match[1]}

${section4Match[2].trim()}

`;
  }

  // Section 5: Option 1 (Dutch section 5)
  const section5Match = content.match(
    /5\.\s*(Optie 1|Behandeloptie)([\s\S]*?)(?=6\.\s*(?:Optie|Verwachte)|7\.\s*Verwachte)/i
  );
  if (section5Match) {
    const optionContent = formatOptionContent(section5Match[2]);
    markdown += `# Sectie 5: ${section5Match[1]}

${optionContent}

`;
  }

  // Section 6: Option 2 (Dutch section 6) - may not exist in all scenarios
  const section6Match = content.match(
    /6\.\s*(Optie 2)([\s\S]*?)(?=7\.\s*Verwachte)/i
  );
  if (section6Match) {
    const optionContent = formatOptionContent(section6Match[2]);
    markdown += `# Sectie 6: ${section6Match[1]}

${optionContent}

`;
  }

  // Section 7: Expected Results & Comfort
  const section7Match = content.match(
    /7\.\s*Verwachte resultaten\s*[&]\s*comfort([\s\S]*?)(?=8\.\s*Duur)/i
  );
  if (section7Match) {
    markdown += `# Sectie 7: Verwachte resultaten & comfort

${section7Match[1].trim()}

`;
  }

  // Section 8: Duration
  const section8Match = content.match(
    /8\.\s*Duur van het traject([\s\S]*?)(?=9\.\s*(?:Hersteltijd|Kostenindicatie))/i
  );
  if (section8Match) {
    const durationContent = formatListContent(section8Match[1]);
    markdown += `# Sectie 8: Duur van het traject

${durationContent}

`;
  }

  // Section 9: Recovery Time (may be section 9 or 10)
  const section9Match = content.match(
    /(?:9|10)\.\s*Hersteltijd\s*[&]\s*impact op dagelijks leven([\s\S]*?)(?=(?:10|11)\.\s*(?:Kostenindicatie|Volgende|Aandachtspunten))/i
  );
  if (section9Match) {
    const recoveryContent = formatRecoveryContent(section9Match[1]);
    markdown += `# Sectie 9: Hersteltijd & impact op dagelijks leven

${recoveryContent}

`;
  }

  // Section 10: Cost Indication
  const section10Match = content.match(
    /(?:9|10)\.\s*Kostenindicatie[^]*?([\s\S]*?)(?=(?:10|11)\.\s*(?:Volgende|Aandachtspunten)|$)/i
  );
  if (section10Match) {
    const costContent = formatCostContent(section10Match[1]);
    markdown += `# Sectie 10: Kostenindicatie (richtprijzen)

${costContent}

`;
  }

  // Section 11: Next Steps
  const section11Match = content.match(
    /(?:10|11)\.\s*Volgende stappen([\s\S]*?)(?=Scenario S|$)/i
  );
  if (section11Match) {
    const nextStepsContent = formatNextStepsContent(section11Match[1]);
    markdown += `# Sectie 11: Volgende stappen

${nextStepsContent}
`;
  }

  return markdown;
}

// Format option content with proper markdown structure
function formatOptionContent(content: string): string {
  return content
    .replace(/—\s*([^\n]+)/, "— $1\n\n")
    .replace(/Wat dit inhoudt/g, "**Wat dit inhoudt**\n")
    .replace(/Wat u mag verwachten/g, "\n**Wat u mag verwachten**\n")
    .replace(/Voordelen([A-Z])/g, "**Voordelen**\n- $1")
    .replace(/Voordelen/g, "\n**Voordelen**")
    .replace(/Aandachtspunten([A-Z])/g, "**Aandachtspunten**\n- $1")
    .replace(/Aandachtspunten/g, "\n**Aandachtspunten**")
    .replace(/Voor wie dit logisch is/g, "\n**Voor wie dit logisch is**\n")
    // Split concatenated bullet points
    .replace(
      /(Zeer|Geen|Minder|Meer|Kan|Vaak|Niet|Langdurige|Nauwkeurige|Snelle|Stabiel|Duurzaam|Herstel|Logisch|Chirurg|Traject|Hogere|Vereist|Beperkte|Functionele|Natuurlijke)/g,
      "\n- $1"
    )
    .replace(/\n- ([a-z])/g, "$1") // Fix false positives
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Format list content
function formatListContent(content: string): string {
  return content
    .replace(/([A-Za-z][^:]+):\s*([^\n]+)/g, "- $1: $2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Format recovery content with option blocks
function formatRecoveryContent(content: string): string {
  return content
    .replace(/Optie:\s*([^\n]+)/g, "\n**Optie: $1**")
    .replace(/Hersteltijd:\s*/g, "\n- Hersteltijd: ")
    .replace(/Mogelijke impact:\s*/g, "\n- Mogelijke impact: ")
    .replace(/Dagelijks functioneren:\s*/g, "\n- Dagelijks functioneren: ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Format cost content
function formatCostContent(content: string): string {
  return content
    .replace(
      /([A-Za-z][^:€]+):\s*(±?\s*€[\d.,\s–€]+(?:per [^\n]+)?)/g,
      "- $1: $2"
    )
    .replace(/De uiteindelijke/g, "\nDe uiteindelijke")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Format next steps content
function formatNextStepsContent(content: string): string {
  let result = content
    .replace(/Om goed voorbereid/g, "Om goed voorbereid")
    .replace(
      /(uw [^,]+),\s*(vragen [^,]+),\s*(en [^.]+|deze [^.]+)/gi,
      "- $1\n- $2\n- $3"
    )
    .trim();

  // If it contains Smile-link reference, format it
  if (result.includes("Smile-link")) {
    result = result.replace(
      /(In de Smile-link.*)/,
      "\n$1"
    );
  }

  return result;
}

// Dutch section titles mapping
const DUTCH_SECTION_TITLES: Record<string, string> = {
  "# Section 1: Disclaimer": "# Sectie 1: Disclaimer",
  "# Section 2: Personal Summary": "# Sectie 2: Persoonlijke samenvatting",
  "# Section 3: Your Situation": "# Sectie 3: Uw situatie",
  "# Section 4: Possible Treatment Directions":
    "# Sectie 4: Mogelijke behandelrichtingen",
  "# Section 5: Option 1": "# Sectie 5: Optie 1",
  "# Section 6: Option 2": "# Sectie 6: Optie 2",
  "# Section 7: Expected Results & Comfort":
    "# Sectie 7: Verwachte resultaten & comfort",
  "# Section 8: Duration of the Process": "# Sectie 8: Duur van het traject",
  "# Section 9: Recovery Time & Impact on Daily Life":
    "# Sectie 9: Hersteltijd & impact op dagelijks leven",
  "# Section 10: Cost Indication (Guide Prices)":
    "# Sectie 10: Kostenindicatie (richtprijzen)",
  "# Section 11: Next Steps": "# Sectie 11: Volgende stappen",
};

// English to Dutch phrase translations for generic content
const PHRASE_TRANSLATIONS: Record<string, string> = {
  "**What this involves**": "**Wat dit inhoudt**",
  "**What you can expect**": "**Wat u mag verwachten**",
  "**Advantages**": "**Voordelen**",
  "**Points of attention**": "**Aandachtspunten**",
  "**For whom this makes sense**": "**Voor wie dit logisch is**",
  "**Option:": "**Optie:",
  "- Recovery time:": "- Hersteltijd:",
  "- Possible impact:": "- Mogelijke impact:",
  "- Daily functioning:": "- Dagelijks functioneren:",
  "Important Notice": "Belangrijke mededeling",
  "Risk Factor Considerations": "Risicofactoren overwegingen",
  "Your responses indicate": "Uw antwoorden geven aan",
  "Your dentist will discuss": "Uw tandarts zal bespreken",
  "Factors that may be relevant": "Factoren die relevant kunnen zijn",
  "Smoking affects healing": "Roken beïnvloedt de genezing",
  "Certain medical conditions": "Bepaalde medische aandoeningen",
  "Some medications may affect": "Sommige medicijnen kunnen",
  "Lifestyle factors can influence": "Leefstijlfactoren kunnen invloed hebben",
};

// Translate generic content (for non-scenario files)
function translateGenericContent(englishContent: string): string {
  let result = englishContent;

  // Translate section headers
  for (const [eng, nl] of Object.entries(DUTCH_SECTION_TITLES)) {
    result = result.replace(new RegExp(eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), nl);
  }

  // Translate common phrases
  for (const [eng, nl] of Object.entries(PHRASE_TRANSLATIONS)) {
    result = result.replace(new RegExp(eng.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), nl);
  }

  return result;
}

// Create Dutch file for any content type
function createDutchFile(
  englishFilePath: string,
  dutchScenarios: Map<string, string>
): string | null {
  const englishContent = fs.readFileSync(englishFilePath, "utf-8");
  const relativePath = path.relative(CONTENT_DIR, englishFilePath);

  // Extract content ID and tone from path
  const pathParts = relativePath.split(path.sep);
  const toneFile = path.basename(englishFilePath, ".md"); // e.g., "TP-01"

  // Determine content type and ID
  let contentId = "";
  if (relativePath.includes("scenarios/")) {
    contentId = pathParts[1]; // e.g., "S01"
  } else if (relativePath.includes("static/")) {
    contentId = pathParts[1]; // e.g., "STATIC_DISCLAIMER"
  } else if (relativePath.includes("modules/")) {
    contentId = pathParts[1]; // e.g., "TM_ANXIETY_SEVERE"
  } else if (relativePath.includes("a_blocks/")) {
    contentId = pathParts[1]; // e.g., "A_WARN_RISK_FACTORS"
  } else if (relativePath.includes("b_blocks/")) {
    contentId = pathParts[1]; // e.g., "B_OPT_IMPLANT"
  }

  // Handle scenarios with Dutch source content
  if (contentId.startsWith("S") && dutchScenarios.has(contentId)) {
    const dutchBlock = dutchScenarios.get(contentId)!;
    return buildScenarioMarkdown(contentId, dutchBlock, toneFile);
  }

  // Handle static content
  if (contentId === "STATIC_DISCLAIMER") {
    return `# Sectie 1: Disclaimer

Dit rapport is uitsluitend bedoeld om u inzicht te geven in mogelijke behandelrichtingen en keuzes. Het vervangt geen klinisch onderzoek, diagnose of individueel medisch advies.

De uiteindelijke beoordeling, indicatiestelling en keuze van de behandeling worden altijd uitgevoerd door een bevoegde tandarts of specialist na klinisch onderzoek van uw persoonlijke situatie.

Smile-Link geeft geen medische instructies en neemt geen medische beslissingen. Alle informatie in dit rapport is informatief en niet-bindend, en dient als ondersteuning om u beter voorbereid naar een consultatie te laten gaan.

Interpretatie zonder professioneel klinisch overleg kan leiden tot onvolledige of foutieve conclusies.
`;
  }

  if (contentId === "STATIC_NEXT_STEPS") {
    return `# Volgende stappen

Om goed voorbereid te beslissen, is het zinvol om:
- Uw verwachtingen en gevoeligheden te verduidelijken
- Vragen te noteren over onderhoud, duurzaamheid en alternatieven
- Deze afweging samen met een tandarts te bespreken

In de Smile-link beslissingsgidsen vindt u extra handvaten om dit gesprek gestructureerd aan te pakken.
`;
  }

  // For all other content (blocks, modules), translate headers and phrases
  return translateGenericContent(englishContent);
}

// Main execution
async function main() {
  console.log("Starting Dutch translation creation...\n");

  // Extract content from DOCX files
  const scenariosDocx = path.join(
    REFERENCE_DOCS_DIR,
    "Scenarioblok per scenariodocx.docx"
  );

  console.log("Extracting Dutch content from DOCX files...");
  const scenariosText = extractDOCXText(scenariosDocx);
  console.log(`Scenarios text length: ${scenariosText.length}`);

  // Parse the extracted text
  console.log("\nParsing Dutch scenarios...");
  const dutchScenarios = parseDutchScenarios(scenariosText);
  console.log(`Found ${dutchScenarios.size} scenarios:`);
  for (const id of dutchScenarios.keys()) {
    console.log(`  - ${id}`);
  }

  // Find all English content files
  console.log("\nFinding English content files...");
  const englishFiles: string[] = [];

  function findEnglishFiles(dir: string) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        if (item.name === "en") {
          const mdFiles = fs
            .readdirSync(fullPath)
            .filter((f) => f.endsWith(".md"));
          for (const mdFile of mdFiles) {
            englishFiles.push(path.join(fullPath, mdFile));
          }
        } else if (item.name !== "nl") {
          findEnglishFiles(fullPath);
        }
      }
    }
  }

  findEnglishFiles(CONTENT_DIR);
  console.log(`Found ${englishFiles.length} English files`);

  // Create Dutch translations
  console.log("\nCreating Dutch translations...");
  let created = 0;
  let failed = 0;

  for (const englishFile of englishFiles) {
    const dutchFile = englishFile.replace("/en/", "/nl/");
    const dutchDir = path.dirname(dutchFile);

    // Create nl/ directory if it doesn't exist
    if (!fs.existsSync(dutchDir)) {
      fs.mkdirSync(dutchDir, { recursive: true });
    }

    // Create Dutch content
    const dutchContent = createDutchFile(englishFile, dutchScenarios);

    if (dutchContent) {
      fs.writeFileSync(dutchFile, dutchContent);
      created++;
      console.log(`  Created: ${path.relative(CONTENT_DIR, dutchFile)}`);
    } else {
      failed++;
      console.warn(`  Failed: ${path.relative(CONTENT_DIR, englishFile)}`);
    }
  }

  console.log(`\n✓ Created ${created} Dutch files`);
  if (failed > 0) {
    console.log(`✗ Failed to create ${failed} files`);
  }
}

main().catch(console.error);
