"use client";

import { useMemo } from "react";
import type {
  ReportPhase,
} from "@/lib/types/types/report-generation";

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
    id: "composing",
    label: "Compose Report",
    activeLabel: "Composing your report...",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColors[status]} transition-colors duration-300`}
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

        {/* Phase-specific data display - show during active and complete states */}
        {data && (status === "complete" || status === "active") && (
          <PhaseDataDisplay phase={config.id} data={data} isActive={status === "active"} />
        )}
      </div>
    </div>
  );
}

interface PhaseDataDisplayProps {
  phase: ReportPhase;
  data: Record<string, unknown>;
  isActive?: boolean;
}

function PhaseDataDisplay({ phase, data, isActive }: PhaseDataDisplayProps) {
  if (phase === "tone" && data.toneName) {
    return (
      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
        {data.toneName as string}
      </div>
    );
  }

  if (phase === "content-check" && typeof data.available === "number") {
    const missing = (data.missing as number) || 0;
    const missingBlocks = data.missingBlocks as Array<{ id: string; name: string; contentType: string }> | undefined;

    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-green-600 dark:text-green-400">
            {data.available} available
          </span>
          {missing > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              {missing} to generate
            </span>
          )}
        </div>
        {/* Show list of blocks to generate */}
        {missingBlocks && missingBlocks.length > 0 && (
          <div className="mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-600 space-y-1">
            {missingBlocks.slice(0, 5).map((block) => (
              <div key={block.id} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate">{block.name}</span>
                <span className="text-gray-400 text-[10px]">({block.contentType})</span>
              </div>
            ))}
            {missingBlocks.length > 5 && (
              <div className="text-xs text-gray-400">
                +{missingBlocks.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (phase === "composing") {
    const currentSection = data.currentSection as string | undefined;

    return (
      <div className="mt-2 space-y-2">
        {/* Section progress */}
        {typeof data.sectionsProcessed === "number" && typeof data.totalSections === "number" && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Sections: {data.sectionsProcessed}/{data.totalSections}
          </div>
        )}

        {/* Current section */}
        {currentSection && isActive && (
          <div className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">
            Composing: {currentSection}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default ReportGenerationProgress;
