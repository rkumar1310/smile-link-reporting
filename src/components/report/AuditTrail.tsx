"use client";

import { useState } from "react";
import type {
  ReportAuditData,
  AuditDriverValue,
  AuditScenarioScore,
  AuditContentSelection,
  AuditToneTrigger,
  AuditTraceEvent,
  AuditDriverConflict,
} from "@/lib/types/types/report-generation";

interface AuditTrailProps {
  audit: ReportAuditData;
}

const TONE_NAMES: Record<string, string> = {
  "TP-01": "Neutral-Informative",
  "TP-02": "Empathic-Neutral",
  "TP-03": "Reflective-Contextual",
  "TP-04": "Stability-Frame",
  "TP-05": "Expectation-Calibration",
  "TP-06": "Autonomy-Respecting",
};

export function AuditTrail({ audit }: AuditTrailProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "drivers" | "scenario" | "content" | "trace">("summary");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Pipeline Audit
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
          Session: {audit.session_id} | {new Date(audit.created_at).toLocaleString()}
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-4">
        <nav className="flex gap-4 -mb-px">
          {[
            { id: "summary" as const, label: "Summary" },
            { id: "drivers" as const, label: "Drivers" },
            { id: "scenario" as const, label: "Scenario" },
            { id: "content" as const, label: "Content" },
            { id: "trace" as const, label: "Trace" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === "drivers" && (
          <DriversTab
            drivers={audit.drivers}
            conflicts={audit.driver_conflicts}
            fallbacks={audit.fallbacks_applied}
          />
        )}
        {activeTab === "scenario" && (
          <ScenarioTab
            matched={audit.matched_scenario}
            confidence={audit.scenario_confidence}
            score={audit.scenario_score}
            allScores={audit.all_scenario_scores}
            fallbackUsed={audit.fallback_used}
            fallbackReason={audit.fallback_reason}
          />
        )}
        {activeTab === "content" && (
          <ContentTab
            selections={audit.content_selections}
            tone={audit.tone}
            toneReason={audit.tone_reason}
            toneTriggers={audit.tone_triggers}
          />
        )}
        {activeTab === "trace" && (
          <TraceTab
            events={audit.trace_events}
            startedAt={audit.trace_started_at}
            completedAt={audit.trace_completed_at}
          />
        )}
      </div>
    </div>
  );
}

function SummaryTab({ audit }: { audit: ReportAuditData }) {
  const driverCount = Object.keys(audit.drivers).length;
  const activeSelections = audit.content_selections.filter(s => !s.suppressed);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Scenario" value={audit.matched_scenario} />
        <SummaryCard
          label="Confidence"
          value={audit.scenario_confidence}
          colorClass={
            audit.scenario_confidence === "HIGH" ? "text-green-600 dark:text-green-400" :
            audit.scenario_confidence === "MEDIUM" ? "text-amber-600 dark:text-amber-400" :
            "text-red-600 dark:text-red-400"
          }
        />
        <SummaryCard label="Tone" value={TONE_NAMES[audit.tone] ?? audit.tone} />
        <SummaryCard label="Score" value={`${(audit.scenario_score * 100).toFixed(0)}%`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Drivers" value={driverCount.toString()} />
        <SummaryCard label="Fallbacks" value={audit.fallbacks_applied.length.toString()} />
        <SummaryCard label="Content Used" value={activeSelections.length.toString()} />
        <SummaryCard label="Scenarios Scored" value={audit.all_scenario_scores.length.toString()} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, colorClass }: { label: string; value: string; colorClass?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`text-sm font-medium mt-1 ${colorClass ?? "text-gray-900 dark:text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function DriversTab({
  drivers,
  conflicts,
  fallbacks,
}: {
  drivers: Record<string, AuditDriverValue>;
  conflicts: AuditDriverConflict[];
  fallbacks: string[];
}) {
  const driverEntries = Object.entries(drivers);

  // Group by layer
  const l1 = driverEntries.filter(([, d]) => d.layer === "L1");
  const l2 = driverEntries.filter(([, d]) => d.layer === "L2");
  const l3 = driverEntries.filter(([, d]) => d.layer === "L3");

  return (
    <div className="space-y-4">
      {[
        { label: "L1 - Safety", drivers: l1, color: "red" },
        { label: "L2 - Personalization", drivers: l2, color: "blue" },
        { label: "L3 - Narrative", drivers: l3, color: "purple" },
      ].map(group => group.drivers.length > 0 && (
        <div key={group.label}>
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">{group.label}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {group.drivers.map(([key, dv]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-700/50 rounded px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{key}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    dv.source === "derived"
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                  }`}>
                    {dv.source}
                  </span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {dv.value}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${dv.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{(dv.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
            Conflicts Resolved ({conflicts.length})
          </h4>
          <div className="space-y-2">
            {conflicts.map((conflict, idx) => (
              <div key={idx} className="bg-amber-50 dark:bg-amber-900/20 rounded p-2 text-xs">
                <div className="font-medium text-amber-900 dark:text-amber-100">{conflict.driver_id}</div>
                <div className="text-amber-700 dark:text-amber-300 mt-1">
                  Values: {conflict.conflicting_values.join(" vs ")} → {conflict.resolved_value}
                </div>
                <div className="text-amber-600 dark:text-amber-400 mt-0.5 italic">{conflict.resolution_reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallbacks */}
      {fallbacks.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fallbacks Applied ({fallbacks.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {fallbacks.map((fb, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                {fb}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScenarioTab({
  matched,
  confidence,
  score,
  allScores,
  fallbackUsed,
  fallbackReason,
}: {
  matched: string;
  confidence: string;
  score: number;
  allScores: AuditScenarioScore[];
  fallbackUsed: boolean;
  fallbackReason?: string;
}) {
  const sorted = [...allScores].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-4">
      {/* Matched scenario highlight */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {matched}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Score: {(score * 100).toFixed(1)}% | Confidence: {confidence}
            </div>
          </div>
          {fallbackUsed && (
            <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs">
              Fallback
            </span>
          )}
        </div>
        {fallbackReason && (
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Reason: {fallbackReason}
          </div>
        )}
      </div>

      {/* All scores */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          All Scenario Scores ({sorted.length})
        </h4>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {sorted.map((s) => (
            <div
              key={s.scenario_id}
              className={`p-2 rounded ${
                s.scenario_id === matched
                  ? "bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700"
                  : s.excluded
                  ? "bg-red-50/50 dark:bg-red-900/10 opacity-60"
                  : "bg-gray-50 dark:bg-gray-700/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {s.scenario_id}
                  </span>
                  {s.excluded && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                      excluded
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                  {(s.score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.scenario_id === matched ? "bg-blue-500" : "bg-gray-400 dark:bg-gray-500"}`}
                    style={{ width: `${s.score * 100}%` }}
                  />
                </div>
              </div>
              <div className="mt-1 flex gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                <span>Req: {s.matched_required}</span>
                <span>Strong: {s.matched_strong}</span>
                <span>Support: {s.matched_supporting}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContentTab({
  selections,
  tone,
  toneReason,
  toneTriggers,
}: {
  selections: AuditContentSelection[];
  tone: string;
  toneReason: string;
  toneTriggers: AuditToneTrigger[];
}) {
  const active = selections.filter(s => !s.suppressed);
  const suppressed = selections.filter(s => s.suppressed);

  return (
    <div className="space-y-4">
      {/* Tone selection */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
        <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
          Tone: {TONE_NAMES[tone] ?? tone} ({tone})
        </div>
        <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
          {toneReason}
        </div>
        {toneTriggers.some(t => t.matched) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {toneTriggers.filter(t => t.matched).map((trigger, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-xs text-purple-700 dark:text-purple-300">
                {trigger.tone}{trigger.trigger_driver ? ` (${trigger.trigger_driver})` : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Active content selections */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          Active Content ({active.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {active.map((sel, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sel.content_id}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {sel.type}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    S{sel.target_section}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tone: {sel.tone} | Priority: {sel.priority}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suppressed content */}
      {suppressed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Suppressed ({suppressed.length})
          </h4>
          <div className="space-y-1">
            {suppressed.map((sel, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-300">{sel.content_id}</span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">{sel.suppression_reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TraceTab({
  events,
  startedAt,
  completedAt,
}: {
  events: AuditTraceEvent[];
  startedAt: string;
  completedAt: string;
}) {
  const totalDuration = events.reduce((sum, e) => sum + e.duration_ms, 0);

  return (
    <div className="space-y-4">
      {/* Timing summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Started: {new Date(startedAt).toLocaleTimeString()}</span>
        <span className="font-medium">Total: {totalDuration}ms</span>
        <span>Completed: {new Date(completedAt).toLocaleTimeString()}</span>
      </div>

      {/* Timeline */}
      {events.length > 0 ? (
        <div className="relative">
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={idx} className="relative flex items-start gap-3 pl-8">
                <div className={`absolute left-2 w-2 h-2 rounded-full mt-1.5 ${
                  event.stage === "error" ? "bg-red-500" :
                  event.stage.includes("tone") ? "bg-purple-500" :
                  event.stage.includes("scenario") ? "bg-blue-500" :
                  event.stage.includes("content") ? "bg-green-500" :
                  event.stage.includes("compos") ? "bg-indigo-500" :
                  "bg-gray-400"
                }`} />
                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {event.stage}: {event.action}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                      {event.duration_ms}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
          No trace events recorded
        </div>
      )}
    </div>
  );
}

export default AuditTrail;
