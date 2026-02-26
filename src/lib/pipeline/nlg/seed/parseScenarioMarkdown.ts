// @ts-nocheck — Legacy parser, superseded by importScenarios.ts
/**
 * Markdown Parser for Scenario Files
 *
 * Extracts structured data from content/scenarios/S##/[en|nl]/*.md files
 * for use in MongoDB scenarios collection.
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Types
// ============================================================================

export interface ParsedTreatmentOption {
  name: string;
  description: string;
  benefits: string[];
  considerations: string[];
  idealFor: string;
  pricing?: { min: number; max: number };
  duration?: { minMonths: number; maxMonths: number };
  recovery?: { days: number; description: string };
}

export interface ParsedScenarioData {
  id: string;
  tone: string;
  version: string;
  toneDescription: string;
  personalSummary: string;
  situation: string;
  treatmentDirections: string;
  options: ParsedTreatmentOption[];
  expectedResults: string;
  duration: string;
  recovery: string;
  costIndication: string;
  nextSteps: string;
  // Extracted structured data
  aggregatePricing?: { min: number; max: number };
}

// ============================================================================
// Parsing Functions
// ============================================================================

/**
 * Parse frontmatter from markdown
 */
function parseFrontmatter(content: string): { id: string; tone: string; version: string; description: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return { id: "", tone: "", version: "", description: "" };
  }

  const frontmatter = frontmatterMatch[1];
  const id = frontmatter.match(/id:\s*(\S+)/)?.[1] || "";
  const tone = frontmatter.match(/tone:\s*(\S+)/)?.[1] || "";
  const version = frontmatter.match(/version:\s*(\S+)/)?.[1] || "";
  const description = frontmatter.match(/description:\s*(.+)/)?.[1] || "";

  return { id, tone, version, description };
}

/**
 * Extract section content by section number (includes header for option name extraction)
 */
function extractSection(content: string, sectionNum: number): string {
  const regex = new RegExp(`(# Section ${sectionNum}:[^\\n]*)\\n([\\s\\S]*?)(?=# Section \\d+:|$)`);
  const match = content.match(regex);
  if (!match) return "";
  // Include the header line so we can extract option names from it
  return (match[1] + "\n" + match[2]).trim();
}

/**
 * Parse treatment option from section content
 */
function parseOption(sectionContent: string, optionNum: number): ParsedTreatmentOption | null {
  if (!sectionContent) return null;

  // Extract option name from header (e.g., "# Section 5: Option 1 — Single Implant with Crown")
  // Try multiple patterns for different formatting styles
  let name = `Option ${optionNum}`;

  // Pattern 1: "Option 1 — Name" or "Option 1 - Name"
  const headerMatch = sectionContent.match(/Option \d+\s*[—–-]\s*([^\n]+)/i);
  if (headerMatch) {
    name = headerMatch[1].trim();
  }

  // If still generic, try to extract from the first bold header that's not a standard section
  if (name === `Option ${optionNum}`) {
    const firstBoldMatch = sectionContent.match(/^#[^#\n]*:\s*Option \d+\s*[—–-]\s*(.+)$/m);
    if (firstBoldMatch) {
      name = firstBoldMatch[1].trim();
    }
  }

  // Extract "What this involves" / description
  const descMatch = sectionContent.match(/\*\*What this involves\*\*\n([^\n*]+)/);
  const description = descMatch ? descMatch[1].trim() : "";

  // Extract benefits (various patterns)
  const benefitsPatterns = [
    /\*\*Benefits\*\*\n([\s\S]*?)(?=\*\*|$)/,
    /\*\*What others in your situation have valued\*\*\n([\s\S]*?)(?=\*\*|$)/,
    /\*\*Advantages\*\*\n([\s\S]*?)(?=\*\*|$)/,
  ];
  let benefits: string[] = [];
  for (const pattern of benefitsPatterns) {
    const match = sectionContent.match(pattern);
    if (match) {
      benefits = extractBulletPoints(match[1]);
      break;
    }
  }

  // Extract considerations (various patterns)
  const considerationsPatterns = [
    /\*\*Considerations\*\*\n([\s\S]*?)(?=\*\*|$)/,
    /\*\*What to be aware of\*\*\n([\s\S]*?)(?=\*\*|$)/,
    /\*\*Points to consider\*\*\n([\s\S]*?)(?=\*\*|$)/,
  ];
  let considerations: string[] = [];
  for (const pattern of considerationsPatterns) {
    const match = sectionContent.match(pattern);
    if (match) {
      considerations = extractBulletPoints(match[1]);
      break;
    }
  }

  // Extract "ideal for" / "This might feel right if..." / "This option may suit you if:"
  const idealForPatterns = [
    /\*\*This option may suit you if:\*\*\n([\s\S]*?)(?=\n\n|# Section|$)/,
    /\*\*This might feel right if\.\.\.\*\*\n([^\n*]+)/,
    /\*\*This may be logical for you if\.\.\.\*\*\n([^\n*]+)/,
  ];
  let idealFor = "";
  for (const pattern of idealForPatterns) {
    const match = sectionContent.match(pattern);
    if (match) {
      const text = match[1].trim();
      // If it contains bullet points, extract them
      if (text.includes("-")) {
        const bullets = extractBulletPoints(text);
        idealFor = bullets.join("; ");
      } else {
        idealFor = text;
      }
      break;
    }
  }

  return {
    name,
    description,
    benefits,
    considerations,
    idealFor,
  };
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text: string): string[] {
  const lines = text.split("\n");
  const bullets: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
      bullets.push(trimmed.replace(/^[-•]\s*/, ""));
    }
  }

  return bullets;
}

/**
 * Parse pricing from text like "€2,200 – €2,500" or "€2,200 - €2,500"
 */
export function parsePricing(text: string): { min: number; max: number } | null {
  // Match patterns like "€2,200 – €2,500" or "approximately €2,200 - €2,500"
  const match = text.match(/€([\d,\.]+)\s*[-–—]\s*€([\d,\.]+)/);
  if (!match) return null;

  const min = parseFloat(match[1].replace(/,/g, ""));
  const max = parseFloat(match[2].replace(/,/g, ""));

  return { min, max };
}

/**
 * Parse duration from text like "3–7 months" or "4-7 months"
 */
export function parseDuration(text: string): { minMonths: number; maxMonths: number } | null {
  const match = text.match(/(\d+)\s*[-–—]\s*(\d+)\s*months?/i);
  if (!match) return null;

  return {
    minMonths: parseInt(match[1], 10),
    maxMonths: parseInt(match[2], 10),
  };
}

/**
 * Parse recovery days from text like "2–5 days" or "3-7 days"
 */
export function parseRecoveryDays(text: string): number | null {
  // Match patterns like "2–5 days" or "Recovery: 2-5 days"
  const match = text.match(/(\d+)\s*[-–—]\s*(\d+)\s*days?/i);
  if (match) {
    // Return the average
    return Math.round((parseInt(match[1], 10) + parseInt(match[2], 10)) / 2);
  }

  // Single number
  const singleMatch = text.match(/(\d+)\s*days?/i);
  if (singleMatch) {
    return parseInt(singleMatch[1], 10);
  }

  return null;
}

/**
 * Parse a single scenario markdown file
 */
export function parseScenarioMarkdown(filePath: string): ParsedScenarioData | null {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return null;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const { id, tone, version, description } = parseFrontmatter(content);

  // Extract sections
  const personalSummary = extractSection(content, 2);
  const situation = extractSection(content, 3);
  const treatmentDirections = extractSection(content, 4);
  const option1Section = extractSection(content, 5);
  const option2Section = extractSection(content, 6);
  const expectedResults = extractSection(content, 7);
  const durationSection = extractSection(content, 8);

  // Section 9 and 10 vary in content (cost vs recovery)
  const section9 = extractSection(content, 9);
  const section10 = extractSection(content, 10);
  const section11 = extractSection(content, 11);

  // Determine which section has cost vs recovery
  let costIndication = "";
  let recovery = "";

  if (section9.toLowerCase().includes("cost") || section9.includes("€")) {
    costIndication = section9;
    recovery = section10;
  } else if (section10.toLowerCase().includes("cost") || section10.includes("€")) {
    costIndication = section10;
    recovery = section9;
  } else {
    // Default assignment
    costIndication = section9;
    recovery = section10;
  }

  // Parse treatment options
  const options: ParsedTreatmentOption[] = [];

  const option1 = parseOption(option1Section, 1);
  if (option1) {
    // Extract pricing for this option from cost section
    const option1PriceMatch = costIndication.match(new RegExp(`${escapeRegex(option1.name)}[^€]*€([\\d,\\.]+)\\s*[-–—]\\s*€([\\d,\\.]+)`, "i"));
    if (option1PriceMatch) {
      option1.pricing = {
        min: parseFloat(option1PriceMatch[1].replace(/,/g, "")),
        max: parseFloat(option1PriceMatch[2].replace(/,/g, "")),
      };
    }

    // Extract duration for this option
    const option1DurMatch = durationSection.match(new RegExp(`${escapeRegex(option1.name)}[^\\d]*(\\d+)\\s*[-–—]\\s*(\\d+)\\s*months?`, "i"));
    if (option1DurMatch) {
      option1.duration = {
        minMonths: parseInt(option1DurMatch[1], 10),
        maxMonths: parseInt(option1DurMatch[2], 10),
      };
    }

    // Extract recovery for this option
    const option1RecMatch = recovery.match(new RegExp(`${escapeRegex(option1.name)}[\\s\\S]*?Recovery[^\\d]*(\\d+)\\s*[-–—]\\s*(\\d+)\\s*days?`, "i"));
    if (option1RecMatch) {
      option1.recovery = {
        days: Math.round((parseInt(option1RecMatch[1], 10) + parseInt(option1RecMatch[2], 10)) / 2),
        description: "",
      };
    }

    options.push(option1);
  }

  const option2 = parseOption(option2Section, 2);
  if (option2) {
    // Extract pricing for this option
    const option2PriceMatch = costIndication.match(new RegExp(`${escapeRegex(option2.name)}[^€]*€([\\d,\\.]+)\\s*[-–—]\\s*€([\\d,\\.]+)`, "i"));
    if (option2PriceMatch) {
      option2.pricing = {
        min: parseFloat(option2PriceMatch[1].replace(/,/g, "")),
        max: parseFloat(option2PriceMatch[2].replace(/,/g, "")),
      };
    }

    options.push(option2);
  }

  // Extract aggregate pricing
  const allPrices = costIndication.match(/€([\d,\.]+)/g)?.map(p => parseFloat(p.replace(/[€,]/g, ""))) || [];
  const aggregatePricing = allPrices.length >= 2 ? {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices),
  } : undefined;

  return {
    id,
    tone,
    version,
    toneDescription: description,
    personalSummary,
    situation,
    treatmentDirections,
    options,
    expectedResults,
    duration: durationSection,
    recovery,
    costIndication,
    nextSteps: section11,
    aggregatePricing,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse all markdown files for a scenario (EN and NL)
 */
export function parseScenarioFiles(
  scenarioId: string,
  contentDir: string = "content/scenarios"
): { en: ParsedScenarioData | null; nl: ParsedScenarioData | null } {
  const enPath = path.join(contentDir, scenarioId, "en", "TP-01.md");
  const nlPath = path.join(contentDir, scenarioId, "nl", "TP-01.md");

  return {
    en: parseScenarioMarkdown(enPath),
    nl: parseScenarioMarkdown(nlPath),
  };
}

/**
 * Get all scenario IDs from content directory
 */
export function getAllScenarioIds(contentDir: string = "content/scenarios"): string[] {
  if (!fs.existsSync(contentDir)) {
    console.warn(`Content directory not found: ${contentDir}`);
    return [];
  }

  const entries = fs.readdirSync(contentDir, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory() && e.name.match(/^S\d+$/))
    .map(e => e.name)
    .sort((a, b) => {
      const numA = parseInt(a.replace("S", ""), 10);
      const numB = parseInt(b.replace("S", ""), 10);
      return numA - numB;
    });
}
