"use client";

import { useMemo } from "react";
import type { ReportPhase, ReportPhaseEvent, ComposedReport } from "@/lib/types/types/report-generation";

interface PhaseConfig {
  id: ReportPhase;
  label: string;
  activeLabel: string;
  icon: React.ReactNode;
}

const PHASE_CONFIG: PhaseConfig[] = [
  {
    id: "analyzing",
    label: "Analyze Answers",
    activeLabel: "Analyzing answers...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "tone",
    label: "Select Tone",
    activeLabel: "Selecting communication tone...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: "content-check",
    label: "Check Content",
    activeLabel: "Checking content availability...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
  },
  {
    id: "generating",
    label: "Generate & Verify",
    activeLabel: "Generating & verifying content...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "composing",
    label: "Compose Report",
    activeLabel: "Composing your report...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "evaluating",
    label: "Quality Evaluation",
    activeLabel: "Running LLM quality evaluation...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

interface PhaseState {
  phase: ReportPhase;
  status: "pending" | "active" | "complete" | "error" | "skipped";
  message?: string;
  data?: Record<string, unknown>;
}

interface ReportGenerationProgressProps {
  phases: PhaseState[];
  currentPhase?: ReportPhase;
  error?: string;
  onRetry?: () => void;
}

export function ReportGenerationProgress({
  phases,
  currentPhase,
  error,
  onRetry,
}: ReportGenerationProgressProps) {
  const phaseStates = useMemo(() => {
    return PHASE_CONFIG.map((config) => {
      const phaseData = phases.find((p) => p.phase === config.id);
      return {
        ...config,
        status: phaseData?.status ?? "pending",
        message: phaseData?.message,
        data: phaseData?.data,
      };
    });
  }, [phases]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Generating Your Report
      </h2>

      <div className="space-y-4">
        {phaseStates.map((phase, index) => (
          <PhaseItem
            key={phase.id}
            config={phase}
            status={phase.status}
            message={phase.message}
            data={phase.data}
            isLast={index === phaseStates.length - 1}
          />
        ))}
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Error occurred
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhaseItemProps {
  config: PhaseConfig;
  status: "pending" | "active" | "complete" | "error" | "skipped";
  message?: string;
  data?: Record<string, unknown>;
  isLast: boolean;
}

function PhaseItem({ config, status, message, data, isLast }: PhaseItemProps) {
  const statusColors = {
    pending: "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700",
    active: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    complete: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    error: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    skipped: "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700",
  };

  const lineColors = {
    pending: "bg-gray-200 dark:bg-gray-700",
    active: "bg-blue-200 dark:bg-blue-800",
    complete: "bg-green-200 dark:bg-green-800",
    error: "bg-red-200 dark:bg-red-800",
    skipped: "bg-gray-200 dark:bg-gray-700",
  };

  return (
    <div className="relative flex items-start gap-4">
      {/* Connector line */}
      {!isLast && (
        <div
          className={`absolute left-5 top-10 w-0.5 h-6 ${lineColors[status]}`}
        />
      )}

      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColors[status]} transition-colors duration-300`}
      >
        {status === "active" ? (
          <div className="animate-spin">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : status === "complete" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : status === "error" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          config.icon
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2">
          <span
            className={`font-medium ${
              status === "active"
                ? "text-blue-600 dark:text-blue-400"
                : status === "complete"
                ? "text-green-600 dark:text-green-400"
                : status === "error"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {status === "active" ? config.activeLabel : config.label}
          </span>
          {status === "complete" && (
            <span className="text-xs text-green-500 dark:text-green-400">
              Done
            </span>
          )}
        </div>

        {/* Additional info based on phase */}
        {message && status !== "pending" && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {message}
          </p>
        )}

        {/* Phase-specific data display */}
        {data && status === "complete" && (
          <PhaseDataDisplay phase={config.id} data={data} />
        )}
      </div>
    </div>
  );
}

interface PhaseDataDisplayProps {
  phase: ReportPhase;
  data: Record<string, unknown>;
}

function PhaseDataDisplay({ phase, data }: PhaseDataDisplayProps) {
  if (phase === "tone" && data.toneName) {
    return (
      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
        {data.toneName as string}
      </div>
    );
  }

  if (phase === "content-check" && typeof data.available === "number") {
    const missing = (data.missing as number) || 0;
    return (
      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-green-600 dark:text-green-400">
          {data.available} available
        </span>
        {missing > 0 && (
          <span className="text-amber-600 dark:text-amber-400">
            {missing} to generate
          </span>
        )}
      </div>
    );
  }

  if (phase === "generating" && typeof data.current === "number") {
    const factCheck = data.factCheck as { status: string; attempt: number; maxAttempts: number; score?: number } | undefined;
    return (
      <div className="mt-2 space-y-2">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Content {String(data.current)}/{String(data.total)}</span>
            <span className="text-gray-400">{data.currentContent as string}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((data.current as number) / (data.total as number)) * 100}%` }}
            />
          </div>
        </div>
        {/* Fact-check status */}
        {factCheck && (
          <div className="flex items-center gap-2 text-xs">
            {factCheck.status === "checking" && (
              <>
                <span className="text-blue-500 dark:text-blue-400 animate-pulse">Verifying...</span>
                <span className="text-gray-400">attempt {factCheck.attempt}/{factCheck.maxAttempts}</span>
              </>
            )}
            {factCheck.status === "passed" && (
              <>
                <span className="text-green-600 dark:text-green-400">Verified</span>
                {factCheck.score !== undefined && (
                  <span className="text-gray-400">({(factCheck.score * 100).toFixed(0)}%)</span>
                )}
              </>
            )}
            {factCheck.status === "failed" && (
              <span className="text-amber-600 dark:text-amber-400">
                Failed ({(factCheck.score! * 100).toFixed(0)}%) - will retry
              </span>
            )}
            {factCheck.status === "retrying" && (
              <span className="text-amber-500 dark:text-amber-400 animate-pulse">
                Regenerating (attempt {factCheck.attempt}/{factCheck.maxAttempts})...
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  if (phase === "evaluating") {
    const dimensions = data.dimensions as Record<string, number> | undefined;
    const overallScore = data.overallScore as number | undefined;
    const outcome = data.outcome as string | undefined;

    return (
      <div className="mt-2 space-y-2">
        {/* Overall score */}
        {overallScore !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Overall:</span>
            <span className={`text-sm font-medium ${
              overallScore >= 8 ? "text-green-600 dark:text-green-400" :
              overallScore >= 6 ? "text-amber-600 dark:text-amber-400" :
              "text-red-600 dark:text-red-400"
            }`}>
              {overallScore.toFixed(1)}/10
            </span>
            {outcome && (
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                outcome === "PASS" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
                outcome === "FLAG" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
                "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
              }`}>
                {outcome}
              </span>
            )}
          </div>
        )}

        {/* Dimension scores */}
        {dimensions && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {Object.entries(dimensions).map(([key, score]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-gray-400 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <span className={`font-medium ${
                  score >= 8 ? "text-green-600 dark:text-green-400" :
                  score >= 6 ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400"
                }`}>
                  {score}/10
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ReportGenerationProgress;
