"use client";

import { useState } from "react";

/**
 * Driver State from the pipeline
 */
interface DriverState {
  session_id: string;
  drivers: {
    LIFESTYLE?: string;
    MEDICAL?: string;
    BUDGET?: string;
    TIMELINE?: string;
    ANXIETY?: string;
    MOTIVATION?: string;
    [key: string]: string | undefined;
  };
  conflicts: Array<{
    driver: string;
    conflictWith: string;
    resolution: string;
  }>;
  fallbacks_applied: string[];
}

/**
 * Scenario Match Result from the pipeline
 */
interface ScenarioMatchResult {
  session_id: string;
  matched_scenario: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "FALLBACK";
  score: number;
  all_scores: Array<{
    scenario_id: string;
    score: number;
    matched_criteria: string[];
  }>;
  fallback_used: boolean;
  fallback_reason?: string;
}

/**
 * Content Selection from the pipeline
 */
interface ContentSelection {
  slot: string;
  content_id: string;
  reason: string;
  priority: number;
}

/**
 * Tone Selection Result from the pipeline
 */
interface ToneSelectionResult {
  selected_tone: string;
  reason: string;
  evaluated_triggers: Array<{
    trigger: string;
    matched: boolean;
    tone: string;
  }>;
}

/**
 * Decision Trace Event
 */
interface DecisionTraceEvent {
  timestamp: string;
  stage: string;
  action: string;
  input: unknown;
  output: unknown;
  duration_ms: number;
}

/**
 * Full Audit Record
 */
interface AuditRecord {
  session_id: string;
  created_at: string;
  driver_state: DriverState;
  scenario_match: ScenarioMatchResult;
  content_selections: ContentSelection[];
  tone_selection: ToneSelectionResult;
  validation_result: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  decision_trace: {
    session_id: string;
    started_at: string;
    completed_at: string;
    events: DecisionTraceEvent[];
    final_outcome: string;
  };
  final_outcome: string;
  report_delivered: boolean;
}

interface AuditTrailProps {
  audit: AuditRecord;
}

export function AuditTrail({ audit }: AuditTrailProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "drivers" | "scenario" | "content" | "trace">("summary");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Audit Trail
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded ${
            audit.final_outcome === "PASS" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" :
            audit.final_outcome === "FLAG" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" :
            "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }`}>
            {audit.final_outcome}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Session: {audit.session_id} | Created: {new Date(audit.created_at).toLocaleString()}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4">
        <nav className="flex gap-4 -mb-px">
          {[
            { id: "summary", label: "Summary" },
            { id: "drivers", label: "Drivers" },
            { id: "scenario", label: "Scenario" },
            { id: "content", label: "Content" },
            { id: "trace", label: "Trace" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === "summary" && <SummaryTab audit={audit} />}
        {activeTab === "drivers" && <DriversTab driverState={audit.driver_state} />}
        {activeTab === "scenario" && <ScenarioTab scenarioMatch={audit.scenario_match} />}
        {activeTab === "content" && <ContentTab selections={audit.content_selections} toneSelection={audit.tone_selection} />}
        {activeTab === "trace" && <TraceTab trace={audit.decision_trace} />}
      </div>
    </div>
  );
}

function SummaryTab({ audit }: { audit: AuditRecord }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Scenario</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            {audit.scenario_match.matched_scenario}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Confidence</div>
          <div className={`text-sm font-medium mt-1 ${
            audit.scenario_match.confidence === "HIGH" ? "text-green-600 dark:text-green-400" :
            audit.scenario_match.confidence === "MEDIUM" ? "text-amber-600 dark:text-amber-400" :
            "text-red-600 dark:text-red-400"
          }`}>
            {audit.scenario_match.confidence}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Tone</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            {audit.tone_selection.selected_tone}
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">Content Items</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
            {audit.content_selections.length}
          </div>
        </div>
      </div>

      {/* Validation results */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Validation</div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs rounded ${
            audit.validation_result.valid
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }`}>
            {audit.validation_result.valid ? "Valid" : "Invalid"}
          </span>
          {audit.validation_result.errors.length > 0 && (
            <span className="text-xs text-red-600 dark:text-red-400">
              {audit.validation_result.errors.length} errors
            </span>
          )}
          {audit.validation_result.warnings.length > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {audit.validation_result.warnings.length} warnings
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DriversTab({ driverState }: { driverState: DriverState }) {
  const drivers = Object.entries(driverState.drivers).filter(([_, v]) => v !== undefined);

  return (
    <div className="space-y-4">
      {/* Driver values */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Derived Drivers</h4>
        <div className="grid grid-cols-2 gap-2">
          {drivers.map(([key, value]) => (
            <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded px-3 py-2 flex justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      {driverState.conflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
            Conflicts Resolved
          </h4>
          <div className="space-y-2">
            {driverState.conflicts.map((conflict, idx) => (
              <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 rounded p-2 text-xs">
                <div className="font-medium">{conflict.driver} vs {conflict.conflictWith}</div>
                <div className="text-amber-600 dark:text-amber-400 mt-1">{conflict.resolution}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallbacks */}
      {driverState.fallbacks_applied.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fallbacks Applied
          </h4>
          <div className="flex flex-wrap gap-2">
            {driverState.fallbacks_applied.map((fb, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                {fb}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioTab({ scenarioMatch }: { scenarioMatch: ScenarioMatchResult }) {
  return (
    <div className="space-y-4">
      {/* Matched scenario */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {scenarioMatch.matched_scenario}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Score: {(scenarioMatch.score * 100).toFixed(1)}% | Confidence: {scenarioMatch.confidence}
            </div>
          </div>
          {scenarioMatch.fallback_used && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
              Fallback
            </span>
          )}
        </div>
        {scenarioMatch.fallback_reason && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Reason: {scenarioMatch.fallback_reason}
          </div>
        )}
      </div>

      {/* All scores */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          All Scenario Scores
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {scenarioMatch.all_scores
            .sort((a, b) => b.score - a.score)
            .map((score, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded ${
                  score.scenario_id === scenarioMatch.matched_scenario
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : "bg-gray-50 dark:bg-gray-700/50"
                }`}
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {score.scenario_id}
                  </span>
                  {score.matched_criteria.length > 0 && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      ({score.matched_criteria.slice(0, 3).join(", ")}{score.matched_criteria.length > 3 ? "..." : ""})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${score.score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-10 text-right">
                    {(score.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function ContentTab({ selections, toneSelection }: { selections: ContentSelection[]; toneSelection: ToneSelectionResult }) {
  return (
    <div className="space-y-4">
      {/* Tone selection */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
        <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
          Tone: {toneSelection.selected_tone}
        </div>
        <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
          {toneSelection.reason}
        </div>
        {toneSelection.evaluated_triggers.some(t => t.matched) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {toneSelection.evaluated_triggers.filter(t => t.matched).map((trigger, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                {trigger.trigger}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content selections */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Content Selections ({selections.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {selections.map((selection, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selection.slot}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Priority: {selection.priority}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {selection.content_id}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1 italic">
                {selection.reason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TraceTab({ trace }: { trace: AuditRecord["decision_trace"] }) {
  const totalDuration = trace.events.reduce((sum, e) => sum + e.duration_ms, 0);

  return (
    <div className="space-y-4">
      {/* Timing summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Started: {new Date(trace.started_at).toLocaleTimeString()}</span>
        <span>Total: {totalDuration}ms</span>
        <span>Completed: {new Date(trace.completed_at).toLocaleTimeString()}</span>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-3">
          {trace.events.map((event, idx) => (
            <div key={idx} className="relative flex items-start gap-3 pl-8">
              <div className={`absolute left-2 w-2 h-2 rounded-full mt-1.5 ${
                event.stage === "error" ? "bg-red-500" :
                event.stage === "qa_gate" ? "bg-purple-500" :
                "bg-blue-500"
              }`} />
              <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {event.stage}: {event.action}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {event.duration_ms}ms
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final outcome */}
      <div className={`text-center py-2 rounded ${
        trace.final_outcome === "PASS" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" :
        trace.final_outcome === "FLAG" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" :
        "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      }`}>
        Final Outcome: {trace.final_outcome}
      </div>
    </div>
  );
}

export default AuditTrail;
