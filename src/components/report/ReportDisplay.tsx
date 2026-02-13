"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComposedReport, ReportSection, ReportFactCheckIssue } from "@/lib/types/types/report-generation";
import { PDFDownloadButton } from "./PDFDownloadButton";

interface ReportDisplayProps {
  report: ComposedReport;
  onGenerateNew?: () => void;
}

/**
 * Scan report sections for unresolved {VARIABLE_NAME} placeholders.
 * Combines any variables from the pipeline with those found in rendered content.
 */
function detectUnresolvedVariables(report: ComposedReport): string[] {
  const found = new Set<string>(report.unresolvedPlaceholders ?? []);

  // Also scan section content for {UPPER_CASE_VAR} patterns
  for (const section of report.sections) {
    const matches = section.content.matchAll(/\{([A-Z][A-Z0-9_]+)\}/g);
    for (const match of matches) {
      found.add(match[1]);
    }
  }

  return Array.from(found).sort();
}

export function ReportDisplay({ report, onGenerateNew }: ReportDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(report.sections.map((_, i) => i))
  );

  const unresolvedVars = detectUnresolvedVariables(report);
  const isBlocked = unresolvedVars.length > 0;

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(report.sections.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {report.patientName ? `Report for ${report.patientName}` : "Your Personalized Report"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Generated on {new Date(report.generatedAt).toLocaleDateString()} at{" "}
              {new Date(report.generatedAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PDFDownloadButton report={report} />
            {onGenerateNew && (
              <button
                onClick={onGenerateNew}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate New Report
              </button>
            )}
          </div>
        </div>

        {/* Report metadata */}
        <div className="mt-4 flex flex-wrap gap-4">
          <MetadataBadge
            label="Tone"
            value={report.toneName}
            color="purple"
          />
          <MetadataBadge
            label="Sections"
            value={report.sections.length.toString()}
            color="blue"
          />
          <MetadataBadge
            label="Accuracy Score"
            value={`${(report.factCheckScore * 100).toFixed(0)}%`}
            color={report.factCheckPassed ? "green" : "amber"}
          />
          {report.contentGenerated > 0 && (
            <MetadataBadge
              label="Content Generated"
              value={report.contentGenerated.toString()}
              color="indigo"
            />
          )}
        </div>

        {/* Blocked disclaimer — unresolved variables */}
        {isBlocked && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 dark:border-red-800">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
                  Report Blocked — {unresolvedVars.length} Unresolved Variable{unresolvedVars.length === 1 ? "" : "s"}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  This report cannot be delivered to the patient because the following NLG variables
                  could not be resolved. They appear as red placeholders in the content below.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {unresolvedVars.map((v) => (
                    <code
                      key={v}
                      className="px-2 py-0.5 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-700 rounded text-xs font-mono text-red-700 dark:text-red-300"
                    >
                      {`{${v}}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warnings summary */}
        {report.warnings.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium">
                {report.warnings.length} content verification{" "}
                {report.warnings.length === 1 ? "warning" : "warnings"}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Section controls */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {report.sections.length} sections
          </span>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Expand all
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {/* Report sections */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {report.sections.map((section, index) => (
          <ReportSectionItem
            key={section.sectionNumber}
            section={section}
            isExpanded={expandedSections.has(index)}
            onToggle={() => toggleSection(index)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Report ID: {report.id} | Session: {report.sessionId}
        </div>
      </div>
    </div>
  );
}

interface MetadataBadgeProps {
  label: string;
  value: string;
  color: "purple" | "blue" | "green" | "amber" | "indigo" | "red";
}

function MetadataBadge({ label, value, color }: MetadataBadgeProps) {
  const colorClasses = {
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300",
    red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${colorClasses[color]}`}>
      <span className="font-medium">{label}:</span>
      <span className="ml-1">{value}</span>
    </div>
  );
}

interface ReportSectionItemProps {
  section: ReportSection;
  isExpanded: boolean;
  onToggle: () => void;
}

function ReportSectionItem({ section, isExpanded, onToggle }: ReportSectionItemProps) {
  return (
    <div className={`${section.hasWarning ? "bg-amber-50/50 dark:bg-amber-900/10" : ""}`}>
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-medium">
            {section.sectionNumber}
          </span>
          <span className="font-medium text-gray-900 dark:text-white text-left">
            {section.title}
          </span>
          {section.hasWarning && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Review suggested
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          {/* Warnings for this section */}
          {section.warnings && section.warnings.length > 0 && (
            <div className="mb-4 space-y-2">
              {section.warnings.map((warning, idx) => (
                <WarningItem key={idx} warning={warning} />
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownContent content={section.content} />
          </div>

          {/* Source reference */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Source: {section.sourceContentId}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface WarningItemProps {
  warning: ReportFactCheckIssue;
}

function WarningItem({ warning }: WarningItemProps) {
  const severityColors = {
    low: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300",
    medium: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    high: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[warning.severity]}`}>
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{warning.description}</p>
          {warning.claimText && (
            <p className="text-xs mt-1 opacity-80">
              Claim: &ldquo;{warning.claimText}&rdquo;
            </p>
          )}
          {warning.suggestion && (
            <p className="text-xs mt-2 italic">
              Suggestion: {warning.suggestion}
            </p>
          )}
        </div>
        <span className="text-xs font-medium uppercase opacity-60">
          {warning.severity}
        </span>
      </div>
    </div>
  );
}

interface MarkdownContentProps {
  content: string;
}

/**
 * Preprocess markdown to wrap {VARIABLE_NAME} patterns in backticks
 * so ReactMarkdown renders them as <code> elements we can style.
 * Uses a marker prefix so the code renderer can distinguish them.
 */
function preprocessVariablePlaceholders(content: string): string {
  // Match {UPPER_CASE_VARIABLE} patterns (NLG variable placeholders)
  return content.replace(/\{([A-Z][A-Z0-9_]+)\}/g, '`__NLG_VAR__$1`');
}

function MarkdownContent({ content }: MarkdownContentProps) {
  const processed = preprocessVariablePlaceholders(content);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Headers
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-3 mb-1">{children}</h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="text-gray-700 dark:text-gray-300 mb-2">{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc ml-6 mb-2 text-gray-700 dark:text-gray-300">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal ml-6 mb-2 text-gray-700 dark:text-gray-300">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="mb-1">{children}</li>
        ),
        // Inline formatting
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-100 dark:bg-gray-700">{children}</thead>
        ),
        tbody: ({ children }) => (
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">{children}</tbody>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">{children}</tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
            {children}
          </td>
        ),
        // Code — detect NLG variable placeholders and style them red
        code: ({ children }) => {
          const text = String(children);
          if (text.startsWith("__NLG_VAR__")) {
            const varName = text.replace("__NLG_VAR__", "");
            return (
              <code className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-sm font-mono text-red-600 dark:text-red-400">
                {`{${varName}}`}
              </code>
            );
          }
          return (
            <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
              {children}
            </code>
          );
        },
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-2">
            {children}
          </blockquote>
        ),
      }}
    >
      {processed}
    </ReactMarkdown>
  );
}

export default ReportDisplay;
