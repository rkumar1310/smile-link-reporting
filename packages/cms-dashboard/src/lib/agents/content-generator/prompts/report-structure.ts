/**
 * Report Structure Constants
 * Defines the 12-section report structure and content type mappings
 * Used by content generation prompts to provide context
 */

export interface ReportSection {
  number: number;
  name: string;
  purpose: string;
  contentSources: string[];
  scenarioKey?: string;
}

/**
 * Complete report structure - 12 sections (0-11)
 */
export const REPORT_SECTIONS: ReportSection[] = [
  {
    number: 0,
    name: "Warnings",
    purpose: "Safety alerts and important notices shown at the top of the report. Contains critical information about contraindications, risk factors, or urgent symptoms that the patient and dentist should be aware of before proceeding.",
    contentSources: ["a_block"],
  },
  {
    number: 1,
    name: "Disclaimer",
    purpose: "Legal disclaimer explaining the informational nature of the report. Clarifies that the report is not a substitute for professional dental advice and that all treatment decisions should be made in consultation with a qualified dentist.",
    contentSources: ["static"],
  },
  {
    number: 2,
    name: "Personal Summary",
    purpose: "Personalized overview of the patient's situation based on their questionnaire responses. Provides context about their concerns, goals, and current dental status in an empathetic, patient-centered way.",
    contentSources: ["module", "scenario"],
    scenarioKey: "personal_summary",
  },
  {
    number: 3,
    name: "Context",
    purpose: "Background information explaining the clinical context of the patient's dental situation. Helps patients understand what their condition means, why it matters, and how it typically develops.",
    contentSources: ["b_block", "module", "scenario"],
    scenarioKey: "context",
  },
  {
    number: 4,
    name: "Interpretation",
    purpose: "Clinical interpretation of the patient's profile and how it relates to treatment options. Bridges the gap between raw questionnaire data and actionable treatment considerations.",
    contentSources: ["b_block"],
  },
  {
    number: 5,
    name: "Treatment Options",
    purpose: "Available treatment approaches relevant to the patient's situation. Describes each option's procedure, benefits, and considerations without making specific recommendations.",
    contentSources: ["b_block", "scenario"],
    scenarioKey: "options",
  },
  {
    number: 6,
    name: "Comparison",
    purpose: "Side-by-side comparison of treatment alternatives. Helps patients understand the key differences between options across factors like durability, aesthetics, cost, and recovery time.",
    contentSources: ["b_block", "scenario"],
    scenarioKey: "comparison",
  },
  {
    number: 7,
    name: "Trade-offs",
    purpose: "Honest discussion of pros and cons for different approaches. Acknowledges that every treatment involves compromises and helps set realistic expectations about outcomes.",
    contentSources: ["b_block", "scenario"],
    scenarioKey: "tradeoffs",
  },
  {
    number: 8,
    name: "Process",
    purpose: "What to expect during treatment. Explains typical treatment timelines, number of appointments, healing periods, and what happens at each stage of the process.",
    contentSources: ["b_block", "scenario"],
    scenarioKey: "process",
  },
  {
    number: 9,
    name: "Costs",
    purpose: "Financial considerations and cost factors. Provides context about pricing ranges, what affects costs, and considerations for patients with different budgets.",
    contentSources: ["b_block", "module", "scenario"],
    scenarioKey: "costs",
  },
  {
    number: 10,
    name: "Risk Factors",
    purpose: "Potential risks and complications associated with treatment. Discusses patient-specific risk factors like smoking, medical conditions, or bone quality that may affect outcomes.",
    contentSources: ["b_block", "module", "scenario"],
    scenarioKey: "risk",
  },
  {
    number: 11,
    name: "Next Steps",
    purpose: "Recommended actions for the patient. Guides them on how to proceed, what questions to ask their dentist, and how to prepare for a consultation. Always uses the Autonomy-Respecting tone (TP-06).",
    contentSources: ["static"],
  },
];

/**
 * Scenario internal section keys mapped to report sections
 */
export const SCENARIO_SECTION_MAPPING: Record<string, { section: number; name: string; wordTarget: number }> = {
  personal_summary: { section: 2, name: "Personal Summary", wordTarget: 150 },
  context: { section: 3, name: "Context", wordTarget: 200 },
  options: { section: 5, name: "Treatment Options", wordTarget: 300 },
  comparison: { section: 6, name: "Comparison", wordTarget: 250 },
  tradeoffs: { section: 7, name: "Trade-offs", wordTarget: 200 },
  process: { section: 8, name: "Process", wordTarget: 200 },
  costs: { section: 9, name: "Costs", wordTarget: 150 },
  risk: { section: 10, name: "Risk Factors", wordTarget: 200 },
};

/**
 * Which sections each content type can appear in
 */
export const CONTENT_TYPE_SECTIONS: Record<string, number[]> = {
  a_block: [0],                    // Warnings only
  b_block: [3, 4, 5, 6, 7, 8, 9, 10], // Context through Risk Factors
  module: [2, 3, 5, 7, 9, 10],     // Various sections based on module type
  static: [1, 11],                 // Disclaimer and Next Steps
  scenario: [2, 3, 5, 6, 7, 8, 9, 10], // All main content sections
};

/**
 * Format the report structure as a readable string for prompts
 */
export function formatReportStructure(): string {
  return REPORT_SECTIONS.map(s =>
    `§${s.number} ${s.name}: ${s.purpose.split('.')[0]}.`
  ).join('\n');
}

/**
 * Get section details by number
 */
export function getSection(sectionNumber: number): ReportSection | undefined {
  return REPORT_SECTIONS.find(s => s.number === sectionNumber);
}

/**
 * Get sections where a content type can appear
 */
export function getSectionsForContentType(contentType: string): ReportSection[] {
  const sectionNumbers = CONTENT_TYPE_SECTIONS[contentType] || [];
  return sectionNumbers.map(num => REPORT_SECTIONS[num]).filter(Boolean);
}

/**
 * Format scenario section requirements for prompts
 */
export function formatScenarioSectionRequirements(): string {
  return Object.entries(SCENARIO_SECTION_MAPPING)
    .map(([key, info]) =>
      `- ${key} (~${info.wordTarget} words): Maps to §${info.section} "${info.name}"`
    )
    .join('\n');
}
