"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import type { Scenario, BilingualText, TreatmentOption } from "@/lib/pipeline/nlg/schemas/ScenarioSchema";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ScenarioDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState<"en" | "nl">("en");
  const [activeTab, setActiveTab] = useState<"overview" | "nlg" | "options" | "matching">("overview");

  const fetchScenario = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scenarios/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Scenario "${id}" not found`);
        }
        throw new Error("Failed to fetch scenario");
      }
      const data = await res.json();
      setScenario(data.scenario);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScenario();
  }, [fetchScenario]);

  async function handleSave() {
    if (!scenario) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenario.name,
          description: scenario.description,
          nlg_variables: scenario.nlg_variables,
          treatment_options: scenario.treatment_options,
          pricing: scenario.pricing,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save scenario");
      }

      const data = await res.json();
      setScenario(data.scenario);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function updateBilingualField(
    field: keyof Scenario,
    value: string
  ) {
    if (!scenario) return;
    setScenario({
      ...scenario,
      [field]: {
        ...(scenario[field] as BilingualText),
        [language]: value,
      },
    });
  }

  function updateNLGVariable(key: string, value: string) {
    if (!scenario) return;
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        [key]: {
          ...(scenario.nlg_variables[key as keyof typeof scenario.nlg_variables] || { en: "", nl: "" }),
          [language]: value,
        },
      },
    });
  }

  function updateTreatmentOption(index: number, updates: Partial<TreatmentOption>) {
    if (!scenario) return;
    const newOptions = [...(scenario.treatment_options || [])];
    newOptions[index] = { ...newOptions[index], ...updates };
    setScenario({
      ...scenario,
      treatment_options: newOptions,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading scenario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
          <Link href="/content/scenarios" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            &larr; Back to Scenarios
          </Link>
        </div>
      </div>
    );
  }

  if (!scenario) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-start">
            <div>
              <Link href="/content/scenarios" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
                &larr; Back to Scenarios
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                  {scenario._id}
                </h1>
                {scenario.is_fallback && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    Fallback
                  </span>
                )}
                {scenario.is_safety_scenario && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Safety
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg text-gray-600 dark:text-gray-300">
                {scenario.name[language]}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Toggle */}
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

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "Overview" },
                { id: "nlg", label: "NLG Variables" },
                { id: "options", label: "Treatment Options" },
                { id: "matching", label: "Matching Criteria" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-600 dark:text-purple-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name ({language.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={scenario.name[language]}
                      onChange={(e) => updateBilingualField("name", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={scenario.priority}
                      disabled
                      className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Set via seed scripts</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description ({language.toUpperCase()})
                    </label>
                    <textarea
                      rows={3}
                      value={scenario.description[language]}
                      onChange={(e) => updateBilingualField("description", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              {scenario.pricing && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Pricing Range
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Minimum
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {scenario.pricing.currency || "EUR"} {scenario.pricing.min.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Maximum
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {scenario.pricing.currency || "EUR"} {scenario.pricing.max.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Currency
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {scenario.pricing.currency || "EUR"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Metadata
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Version</span>
                    <p className="font-medium text-gray-900 dark:text-white">{scenario.version}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Treatment Options</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {scenario.treatment_options?.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Created</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {scenario.created_at
                        ? new Date(scenario.created_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Updated</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {scenario.updated_at
                        ? new Date(scenario.updated_at).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NLG Variables Tab */}
          {activeTab === "nlg" && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                NLG Variables ({language.toUpperCase()})
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                These variables are used in template rendering. Edit the text for each variable below.
              </p>

              <div className="space-y-6">
                {Object.entries(scenario.nlg_variables || {}).map(([key, value]) => {
                  if (!value) return null;
                  const bilingualValue = value as BilingualText;
                  return (
                    <div key={key}>
                      <label className="block text-sm font-mono font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {`{${key}}`}
                      </label>
                      <textarea
                        rows={2}
                        value={bilingualValue[language] || ""}
                        onChange={(e) => updateNLGVariable(key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                      />
                    </div>
                  );
                })}

                {Object.keys(scenario.nlg_variables || {}).filter(
                  (k) => scenario.nlg_variables[k as keyof typeof scenario.nlg_variables]
                ).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No NLG variables defined for this scenario.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Treatment Options Tab */}
          {activeTab === "options" && (
            <div className="space-y-6">
              {scenario.treatment_options && scenario.treatment_options.length > 0 ? (
                scenario.treatment_options.map((option, idx) => (
                  <div key={option.id || idx} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Option {idx + 1}: {option.name[language]}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Rank: {option.rank}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {option.category}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name ({language.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={option.name[language]}
                          onChange={(e) =>
                            updateTreatmentOption(idx, {
                              name: { ...option.name, [language]: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>

                      {option.pricing && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Price Range
                          </label>
                          <p className="px-3 py-2 text-gray-900 dark:text-white">
                            {option.pricing.currency || "EUR"} {option.pricing.min.toLocaleString()} -{" "}
                            {option.pricing.max.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {option.description && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description ({language.toUpperCase()})
                          </label>
                          <textarea
                            rows={2}
                            value={option.description[language] || ""}
                            onChange={(e) =>
                              updateTreatmentOption(idx, {
                                description: { ...option.description!, [language]: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      )}

                      {option.ideal_for && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ideal For ({language.toUpperCase()})
                          </label>
                          <textarea
                            rows={2}
                            value={option.ideal_for[language] || ""}
                            onChange={(e) =>
                              updateTreatmentOption(idx, {
                                ideal_for: { ...option.ideal_for!, [language]: e.target.value },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      )}

                      {option.duration && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Duration
                          </label>
                          <p className="px-3 py-2 text-gray-900 dark:text-white">
                            {option.duration.min_months} - {option.duration.max_months} months
                          </p>
                        </div>
                      )}

                      {option.recovery && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Recovery
                          </label>
                          <p className="px-3 py-2 text-gray-900 dark:text-white">
                            {option.recovery.days} days
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
                  No treatment options defined for this scenario.
                </div>
              )}
            </div>
          )}

          {/* Matching Criteria Tab */}
          {activeTab === "matching" && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Matching Criteria
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                These criteria determine when this scenario is matched. Edit via seed scripts.
              </p>

              {scenario.matching && (
                <div className="space-y-6">
                  {/* Required Drivers */}
                  {Object.keys(scenario.matching.required_drivers || {}).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                        Required Drivers (must match)
                      </h3>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                        {Object.entries(scenario.matching.required_drivers).map(([group, values]) => (
                          <div key={group} className="mb-2 last:mb-0">
                            <span className="font-medium text-gray-900 dark:text-white">{group}:</span>{" "}
                            <span className="text-gray-600 dark:text-gray-300">
                              {(values as string[]).join(", ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strong Drivers */}
                  {Object.keys(scenario.matching.strong_drivers || {}).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                        Strong Drivers (high weight)
                      </h3>
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                        {Object.entries(scenario.matching.strong_drivers).map(([group, values]) => (
                          <div key={group} className="mb-2 last:mb-0">
                            <span className="font-medium text-gray-900 dark:text-white">{group}:</span>{" "}
                            <span className="text-gray-600 dark:text-gray-300">
                              {(values as string[]).join(", ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Supporting Drivers */}
                  {Object.keys(scenario.matching.supporting_drivers || {}).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                        Supporting Drivers (bonus weight)
                      </h3>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        {Object.entries(scenario.matching.supporting_drivers).map(([group, values]) => (
                          <div key={group} className="mb-2 last:mb-0">
                            <span className="font-medium text-gray-900 dark:text-white">{group}:</span>{" "}
                            <span className="text-gray-600 dark:text-gray-300">
                              {(values as string[]).join(", ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Excluding Drivers */}
                  {Object.keys(scenario.matching.excluding_drivers || {}).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Excluding Drivers (disqualifies match)
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        {Object.entries(scenario.matching.excluding_drivers).map(([group, values]) => (
                          <div key={group} className="mb-2 last:mb-0">
                            <span className="font-medium text-gray-900 dark:text-white">{group}:</span>{" "}
                            <span className="text-gray-600 dark:text-gray-300">
                              {(values as string[]).join(", ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred Tags */}
                  {scenario.matching.preferred_tags && scenario.matching.preferred_tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                        Preferred Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {scenario.matching.preferred_tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(scenario.matching.required_drivers || {}).length === 0 &&
                    Object.keys(scenario.matching.strong_drivers || {}).length === 0 &&
                    Object.keys(scenario.matching.supporting_drivers || {}).length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                        No matching criteria defined. This scenario may be a fallback.
                      </p>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
