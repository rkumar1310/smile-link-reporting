"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Scenario } from "@/lib/pipeline/nlg/schemas/ScenarioSchema";

interface ScenarioListResponse {
  scenarios: Scenario[];
  total: number;
}

export default function ScenariosListPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [language, setLanguage] = useState<"en" | "nl">("en");

  const fetchScenarios = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scenarios");
      if (!res.ok) throw new Error("Failed to fetch scenarios");

      const data: ScenarioListResponse = await res.json();
      setScenarios(data.scenarios);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch scenarios on mount
  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  // Filter scenarios by search
  const filteredScenarios = useMemo(() => {
    if (!search) return scenarios;
    const lowerSearch = search.toLowerCase();
    return scenarios.filter(
      (s) =>
        s._id.toLowerCase().includes(lowerSearch) ||
        s.name.en.toLowerCase().includes(lowerSearch) ||
        s.name.nl.toLowerCase().includes(lowerSearch) ||
        s.nlg_variables.block_0_personal_summary.CONTEXT_DESCRIPTION.en.toLowerCase().includes(lowerSearch) ||
        s.nlg_variables.block_0_personal_summary.CONTEXT_DESCRIPTION.nl.toLowerCase().includes(lowerSearch)
    );
  }, [scenarios, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/content" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
              &larr; Back to Content
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Scenarios</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Clinical case patterns with NLG variables and treatment options
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === "en"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("nl")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  language === "nl"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                NL
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {/* Info Banner */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200">
                  Scenarios are managed via seed scripts
                </h3>
                <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                  Scenarios (S00-S17) are seeded from markdown files in <code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">config/nlg-content/scenarios/</code>.
                  You can view and edit NLG variables and treatment options here, but structural changes should be made to the source files.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search scenarios by ID, name, or context..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scenarios List */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading scenarios...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                  {error}
                </div>
              ) : filteredScenarios.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p className="text-gray-500 dark:text-gray-400">
                    {scenarios.length === 0
                      ? "No scenarios found. Run the seed script to populate scenarios."
                      : "No scenarios match your search."}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Options
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredScenarios.map((scenario) => (
                        <tr
                          key={scenario._id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                            selectedScenario?._id === scenario._id
                              ? "bg-purple-50 dark:bg-purple-900/20"
                              : ""
                          }`}
                          onClick={() => setSelectedScenario(scenario)}
                          onDoubleClick={() =>
                            (window.location.href = `/content/scenarios/${scenario._id}`)
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                              {scenario._id}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {scenario.name[language]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-1">
                              {scenario.is_fallback && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  Fallback
                                </span>
                              )}
                              {scenario.is_safety_scenario && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Safety
                                </span>
                              )}
                              {!scenario.is_fallback && !scenario.is_safety_scenario && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  Standard
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {scenario.nlg_variables.block_3_options.length} options
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {scenario.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow sticky top-6">
                {selectedScenario ? (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-lg font-bold text-purple-600 dark:text-purple-400">
                        {selectedScenario._id}
                      </span>
                      {selectedScenario.is_fallback && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Fallback
                        </span>
                      )}
                      {selectedScenario.is_safety_scenario && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Safety
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                      {selectedScenario.name[language]}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {selectedScenario.nlg_variables.block_0_personal_summary.CONTEXT_DESCRIPTION[language]}
                    </p>

                    <div className="space-y-4">
                      {/* Treatment Options */}
                      {selectedScenario.nlg_variables.block_3_options.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Treatment Options
                          </h5>
                          <div className="space-y-2">
                            {selectedScenario.nlg_variables.block_3_options.map((opt, idx) => (
                              <div
                                key={idx}
                                className="text-sm bg-gray-50 dark:bg-gray-700 rounded p-2"
                              >
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {idx + 1}. {opt.OPTION_TITLE[language]}
                                </span>
                                <span className="ml-2 text-gray-500 dark:text-gray-400">
                                  ({opt.pricing.currency} {opt.pricing.min}-{opt.pricing.max})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pricing Summary */}
                      {selectedScenario.nlg_variables.block_3_options.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price Range
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedScenario.nlg_variables.block_3_options[0]?.pricing.currency || "EUR"}{" "}
                            {Math.min(...selectedScenario.nlg_variables.block_3_options.map(o => o.pricing.min)).toLocaleString()} -{" "}
                            {Math.max(...selectedScenario.nlg_variables.block_3_options.map(o => o.pricing.max)).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Matching Criteria Summary */}
                      {selectedScenario.matching && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Matching Criteria
                          </h5>
                          <div className="text-xs space-y-1">
                            {Object.keys(selectedScenario.matching.required_drivers || {}).length >
                              0 && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Required:</span>{" "}
                                {Object.keys(selectedScenario.matching.required_drivers).length} driver groups
                              </p>
                            )}
                            {Object.keys(selectedScenario.matching.strong_drivers || {}).length >
                              0 && (
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Strong:</span>{" "}
                                {Object.keys(selectedScenario.matching.strong_drivers).length} driver groups
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* NLG Variables count */}
                      {selectedScenario.nlg_variables && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            NLG Variables
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            8 blocks, {selectedScenario.nlg_variables.block_3_options.length} options
                          </p>
                        </div>
                      )}

                      <div className="pt-3 border-t dark:border-gray-700">
                        <Link
                          href={`/content/scenarios/${selectedScenario._id}`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          View Details
                          <svg
                            className="ml-2 h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="mt-4 text-sm">Click a scenario to see details</p>
                    <p className="mt-1 text-xs">Double-click to open full view</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
