"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComposedReport, ReportSection, ReportFactCheckIssue, LLMEvaluationData } from "@/lib/types/types/report-generation";

interface ReportDisplayProps {
  report: ComposedReport;
  llmEvaluation?: LLMEvaluationData;
  onGenerateNew?: () => void;
}

export function ReportDisplay({ report, llmEvaluation, onGenerateNew }: ReportDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(report.sections.map((_, i) => i))
  );

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
          {onGenerateNew && (
            <button
              onClick={onGenerateNew}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate New Report
            </button>
          )}
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

        {/* LLM Evaluation Summary */}
        {llmEvaluation && (
          <LLMEvaluationSummary evaluation={llmEvaluation} />
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

function MarkdownContent({ content }: MarkdownContentProps) {
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
        // Code
        code: ({ children }) => (
          <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
            {children}
          </code>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-2">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

interface LLMEvaluationSummaryProps {
  evaluation: LLMEvaluationData;
}

function LLMEvaluationSummary({ evaluation }: LLMEvaluationSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const outcomeColors = {
    PASS: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    FLAG: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    BLOCK: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
  };

  const dimensions = [
    { key: "professional_quality", label: "Professional Quality", score: evaluation.professional_quality.score },
    { key: "clinical_safety", label: "Clinical Safety", score: evaluation.clinical_safety.score },
    { key: "tone_appropriateness", label: "Tone Appropriateness", score: evaluation.tone_appropriateness.score },
    { key: "personalization", label: "Personalization", score: evaluation.personalization.score },
    { key: "patient_autonomy", label: "Patient Autonomy", score: evaluation.patient_autonomy.score },
    { key: "structure_completeness", label: "Structure", score: evaluation.structure_completeness.score }
  ];

  const criticalIssues = (evaluation.content_issues ?? []).filter(i => i.severity === "critical").length;
  const warningIssues = (evaluation.content_issues ?? []).filter(i => i.severity === "warning").length;

  return (
    <div className={`mt-4 rounded-lg border ${outcomeColors[evaluation.recommended_outcome as keyof typeof outcomeColors] ?? outcomeColors.FLAG}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm font-medium">
            LLM Quality Evaluation: {evaluation.recommended_outcome}
          </span>
          <span className="text-sm opacity-80">
            ({evaluation.overall_score.toFixed(1)}/10)
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-current/10">
          {/* Dimension scores */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {dimensions.map(dim => (
              <div key={dim.key} className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                <div className="text-xs opacity-70">{dim.label}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dim.score >= 8 ? "bg-green-500" :
                        dim.score >= 6 ? "bg-amber-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${(dim.score / 10) * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    dim.score >= 8 ? "text-green-600 dark:text-green-400" :
                    dim.score >= 6 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>
                    {dim.score}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Content issues */}
          {(evaluation.content_issues ?? []).length > 0 && (
            <div className="mt-3 text-xs opacity-70">
              Content issues: {criticalIssues > 0 && <span className="text-red-600 dark:text-red-400">{criticalIssues} critical</span>}
              {criticalIssues > 0 && warningIssues > 0 && ", "}
              {warningIssues > 0 && <span className="text-amber-600 dark:text-amber-400">{warningIssues} warnings</span>}
            </div>
          )}

          {/* Overall assessment */}
          {evaluation.overall_assessment && (
            <div className="mt-3 text-sm opacity-80 italic">
              &ldquo;{evaluation.overall_assessment}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportDisplay;
