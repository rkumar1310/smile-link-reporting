/**
 * PDF Generation Service
 * Converts ComposedReport to PDF using marked + puppeteer directly
 * (avoiding md-to-pdf path resolution bugs in monorepo environments)
 */

import { marked } from "marked";
import puppeteer from "puppeteer";
import type { ComposedReport, ReportFactCheckIssue, IntakeAnswer } from "@/lib/types/types/report-generation";

/**
 * Question ID to display name mapping
 */
const QUESTION_NAMES: Record<string, string> = {
  Q1: "Main reason for smile improvement",
  Q2: "Satisfaction score",
  Q2a: "What bothers you most",
  Q3: "What bothers you most about teeth",
  Q4: "Previous treatments",
  Q5: "Pain/infection/loose teeth",
  Q6a: "Current dental status",
  Q6b: "Location",
  Q6c: "Condition of neighbouring teeth",
  Q6d: "Health of aesthetic teeth",
  Q7: "Smile style preference",
  Q8: "Natural result importance",
  Q9: "Age",
  Q10: "Budget",
  Q11: "Specialist willingness",
  Q12: "Timeline",
  Q13: "Pregnancy",
  Q14: "Smoking",
  Q15: "Oral hygiene",
  Q16a: "Growth completed",
  Q16b: "Recent extraction",
  Q17: "Medical contraindications",
  Q18: "Dental anxiety",
};

/**
 * Generate a PDF buffer from a ComposedReport
 */
export async function generateReportPdf(report: ComposedReport): Promise<Buffer> {
  const markdown = reportToMarkdown(report);
  const html = await marked.parse(markdown);
  const fullHtml = wrapHtml(html);

  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Wrap HTML content with full document structure and styles
 */
function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${getPdfStyles()}</style>
</head>
<body>
  ${content}
</body>
</html>`;
}

/**
 * Convert ComposedReport to markdown string
 */
function reportToMarkdown(report: ComposedReport): string {
  const lines: string[] = [];

  // Title
  const title = report.patientName
    ? `Report for ${report.patientName}`
    : "Your Personalized Report";
  lines.push(`# ${title}`);
  lines.push("");

  // Metadata
  const formattedDate = new Date(report.generatedAt).toLocaleDateString();
  const formattedTime = new Date(report.generatedAt).toLocaleTimeString();
  lines.push(`*Generated on ${formattedDate} at ${formattedTime}*`);
  lines.push("");

  // Metadata badges as a list
  lines.push(`- **Tone:** ${report.toneName}`);
  lines.push(`- **Sections:** ${report.sections.length}`);
  lines.push(`- **Accuracy:** ${(report.factCheckScore * 100).toFixed(0)}%`);
  if (report.contentGenerated > 0) {
    lines.push(`- **Generated content:** ${report.contentGenerated}`);
  }
  lines.push("");

  // Global warnings summary
  if (report.warnings.length > 0) {
    lines.push(`> **⚠️ ${report.warnings.length} content verification warning${report.warnings.length === 1 ? "" : "s"}**`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Sections
  for (const section of report.sections) {
    // Section header
    lines.push(`## ${section.sectionNumber}. ${section.title}`);
    if (section.hasWarning) {
      lines.push("*⚠️ Review suggested*");
    }
    lines.push("");

    // Section warnings
    if (section.warnings && section.warnings.length > 0) {
      for (const warning of section.warnings) {
        lines.push(formatWarning(warning));
        lines.push("");
      }
    }

    // Section content (already markdown)
    lines.push(section.content);
    lines.push("");
  }

  // Questionnaire responses section
  if (report.intakeAnswers && report.intakeAnswers.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## Your Responses");
    lines.push("");
    lines.push("*The following answers were used to personalize this report:*");
    lines.push("");

    for (const answer of report.intakeAnswers) {
      const questionText = QUESTION_NAMES[answer.question_id] || answer.question_id;
      const answerText = Array.isArray(answer.answer)
        ? answer.answer.join(", ")
        : answer.answer;
      lines.push(`**${questionText}:** ${answerText}`);
      lines.push("");
    }
  }

  // Footer
  lines.push("---");
  lines.push("");
  lines.push(`*Report ID: ${report.id} | Session: ${report.sessionId}*`);

  return lines.join("\n");
}

/**
 * Format a warning as a blockquote
 */
function formatWarning(warning: ReportFactCheckIssue): string {
  const lines: string[] = [];
  lines.push(`> **[${warning.severity.toUpperCase()}]** ${warning.description}`);
  if (warning.claimText) {
    lines.push(`> *Claim: "${warning.claimText}"*`);
  }
  if (warning.suggestion) {
    lines.push(`> *Suggestion: ${warning.suggestion}*`);
  }
  return lines.join("\n");
}

/**
 * CSS styles for the PDF
 */
function getPdfStyles(): string {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #374151;
    }

    h1 {
      font-size: 22pt;
      color: #111827;
      margin-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 12px;
    }

    h2 {
      font-size: 14pt;
      color: #111827;
      margin-top: 24px;
      margin-bottom: 12px;
    }

    h3 {
      font-size: 12pt;
      color: #111827;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    p {
      margin-bottom: 12px;
    }

    ul, ol {
      margin-bottom: 12px;
      padding-left: 24px;
    }

    li {
      margin-bottom: 6px;
    }

    blockquote {
      border-left: 3px solid #fcd34d;
      background-color: #fffbeb;
      padding: 12px 16px;
      margin: 12px 0;
      color: #92400e;
      font-size: 10pt;
    }

    blockquote strong {
      color: #92400e;
    }

    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 24px 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    th, td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
      font-size: 10pt;
    }

    th {
      background-color: #f3f4f6;
      font-weight: bold;
    }

    em {
      color: #6b7280;
    }

    strong {
      color: #111827;
    }
  `;
}
