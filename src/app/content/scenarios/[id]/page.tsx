"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import type { Scenario, BilingualText, Block3Option, ScenarioNLGVariables } from "@/lib/pipeline/nlg/schemas/ScenarioSchema";

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
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set());

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

  // ---- Save ----

  async function handleSave() {
    if (!scenario) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenario.name,
          nlg_variables: scenario.nlg_variables,
          matching: scenario.matching,
          is_fallback: scenario.is_fallback,
          is_safety_scenario: scenario.is_safety_scenario,
          priority: scenario.priority,
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

  // ---- Name helper ----

  function updateName(value: string) {
    if (!scenario) return;
    setScenario({
      ...scenario,
      name: { ...scenario.name, [language]: value },
    });
  }

  // ---- NLG Block Variable helpers ----

  type StructuredBlockKey = "block_0_personal_summary" | "block_1_situation" | "block_2_treatment_directions";

  function updateBlockVariable(
    blockKey: StructuredBlockKey,
    variableKey: string,
    value: string
  ) {
    if (!scenario) return;
    const block = scenario.nlg_variables[blockKey] as Record<string, BilingualText>;
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        [blockKey]: {
          ...block,
          [variableKey]: {
            ...block[variableKey],
            [language]: value,
          },
        },
      },
    });
  }

  type FullTextBlockKey = "block_4_expected_results" | "block_5_duration" | "block_6_recovery" | "block_7_cost";

  function updateFullTextBlock(blockKey: FullTextBlockKey, value: string) {
    if (!scenario) return;
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        [blockKey]: {
          ...scenario.nlg_variables[blockKey],
          [language]: value,
        },
      },
    });
  }

  // ---- Block 3 Option helpers ----

  function updateOption(index: number, updates: Partial<Block3Option>) {
    if (!scenario) return;
    const options = [...scenario.nlg_variables.block_3_options];
    options[index] = { ...options[index], ...updates };
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        block_3_options: options,
      },
    });
  }

  function updateOptionBilingualField(
    index: number,
    field: "OPTION_TITLE" | "OPTION_DESCRIPTION" | "PROCESS_OVERVIEW" | "OPTION_LIMITATIONS" | "PROFILE_MATCH",
    value: string
  ) {
    if (!scenario) return;
    const options = [...scenario.nlg_variables.block_3_options];
    options[index] = {
      ...options[index],
      [field]: { ...options[index][field], [language]: value },
    };
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        block_3_options: options,
      },
    });
  }

  function addOption() {
    if (!scenario) return;
    const newOption: Block3Option = {
      OPTION_TITLE: { en: "", nl: "" },
      OPTION_DESCRIPTION: { en: "", nl: "" },
      PROCESS_OVERVIEW: { en: "", nl: "" },
      OPTION_LIMITATIONS: { en: "", nl: "" },
      PROFILE_MATCH: { en: "", nl: "" },
      pricing: { min: 0, max: 0, currency: "EUR" },
      duration: { min_months: 0, max_months: 0 },
      recovery_days: 0,
    };
    const options = [...scenario.nlg_variables.block_3_options, newOption];
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        block_3_options: options,
      },
    });
    setExpandedOptions((prev) => new Set(prev).add(options.length - 1));
  }

  function removeOption(index: number) {
    if (!scenario) return;
    if (scenario.nlg_variables.block_3_options.length <= 1) return;
    const options = scenario.nlg_variables.block_3_options.filter((_, i) => i !== index);
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        block_3_options: options,
      },
    });
    setExpandedOptions((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function moveOption(index: number, direction: "up" | "down") {
    if (!scenario) return;
    const options = [...scenario.nlg_variables.block_3_options];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= options.length) return;
    [options[index], options[target]] = [options[target], options[index]];
    setScenario({
      ...scenario,
      nlg_variables: {
        ...scenario.nlg_variables,
        block_3_options: options,
      },
    });
    setExpandedOptions((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i === index) next.add(target);
        else if (i === target) next.add(index);
        else next.add(i);
      });
      return next;
    });
  }

  function toggleOptionExpanded(index: number) {
    setExpandedOptions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // ---- Matching Criteria Helpers ----

  type DriverCategory = "required_drivers" | "strong_drivers" | "supporting_drivers" | "excluding_drivers";

  function updateDriverGroupKey(category: DriverCategory, oldKey: string, newKey: string) {
    if (!scenario?.matching) return;
    const drivers = { ...scenario.matching[category] };
    if (newKey === oldKey) return;
    const values = drivers[oldKey];
    delete drivers[oldKey];
    drivers[newKey] = values;
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, [category]: drivers },
    });
  }

  function addDriverGroup(category: DriverCategory) {
    if (!scenario?.matching) return;
    const drivers = { ...scenario.matching[category] };
    let key = "new_driver";
    let i = 1;
    while (drivers[key]) { key = `new_driver_${i++}`; }
    drivers[key] = [];
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, [category]: drivers },
    });
  }

  function removeDriverGroup(category: DriverCategory, key: string) {
    if (!scenario?.matching) return;
    const drivers = { ...scenario.matching[category] };
    delete drivers[key];
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, [category]: drivers },
    });
  }

  function addDriverValue(category: DriverCategory, group: string) {
    if (!scenario?.matching) return;
    const drivers = { ...scenario.matching[category] };
    drivers[group] = [...(drivers[group] || []), ""];
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, [category]: drivers },
    });
  }

  function removeDriverValue(category: DriverCategory, group: string, valueIndex: number) {
    if (!scenario?.matching) return;
    const drivers = { ...scenario.matching[category] };
    const values = [...(drivers[group] || [])];
    values.splice(valueIndex, 1);
    drivers[group] = values;
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, [category]: drivers },
    });
  }

  function updateDriverValue(category: DriverCategory, group: string, valueIndex: number, value: string) {
    if (!scenario?.matching) return;
    const drivers = { ...scenario.matching[category] };
    const values = [...(drivers[group] || [])];
    values[valueIndex] = value;
    drivers[group] = values;
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, [category]: drivers },
    });
  }

  function addPreferredTag(tag: string) {
    if (!scenario?.matching || !tag.trim()) return;
    const tags = [...(scenario.matching.preferred_tags || [])];
    if (tags.includes(tag.trim())) return;
    tags.push(tag.trim());
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, preferred_tags: tags },
    });
  }

  function removePreferredTag(index: number) {
    if (!scenario?.matching) return;
    const tags = [...(scenario.matching.preferred_tags || [])];
    tags.splice(index, 1);
    setScenario({
      ...scenario,
      matching: { ...scenario.matching, preferred_tags: tags },
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

  const options = scenario.nlg_variables.block_3_options;
  const minPrice = Math.min(...options.map((o) => o.pricing.min));
  const maxPrice = Math.max(...options.map((o) => o.pricing.max));
  const currency = options[0]?.pricing.currency || "EUR";

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
                      onChange={(e) => updateName(e.target.value)}
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
                </div>
              </div>

              {/* Pricing Summary (computed from options) */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Pricing Summary
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Computed from treatment options
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Minimum
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currency} {minPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Maximum
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currency} {maxPrice.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {options.length}
                    </p>
                  </div>
                </div>
              </div>

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
                      {options.length}
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
            <div className="space-y-6">
              {/* Block 0: Personal Summary */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-1">
                  Block 0 &mdash; Personal Summary
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Sentence fragments used in the personal summary section ({language.toUpperCase()})
                </p>
                <div className="space-y-4">
                  {(["CONTEXT_DESCRIPTION", "PRIMARY_GOAL", "MAIN_CONSTRAINT"] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-mono font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {`{${key}}`}
                      </label>
                      <textarea
                        rows={2}
                        value={scenario.nlg_variables.block_0_personal_summary[key][language]}
                        onChange={(e) => updateBlockVariable("block_0_personal_summary", key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 1: Your Situation */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-1">
                  Block 1 &mdash; Your Situation
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Sentence fragments for the situation description ({language.toUpperCase()})
                </p>
                <div className="space-y-4">
                  {(["CORE_SITUATION_DESCRIPTION", "NUANCE_FACTOR", "SECONDARY_FACTOR"] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-mono font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {`{${key}}`}
                      </label>
                      <textarea
                        rows={2}
                        value={scenario.nlg_variables.block_1_situation[key][language]}
                        onChange={(e) => updateBlockVariable("block_1_situation", key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 2: Treatment Directions */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-1">
                  Block 2 &mdash; Treatment Directions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Sentence fragments for treatment direction overview ({language.toUpperCase()})
                </p>
                <div className="space-y-4">
                  {(["DIRECTION_1_CORE", "DIRECTION_2_CORE", "DIRECTION_3_CORE"] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-sm font-mono font-medium text-purple-600 dark:text-purple-400 mb-1">
                        {`{${key}}`}
                      </label>
                      <textarea
                        rows={2}
                        value={scenario.nlg_variables.block_2_treatment_directions[key][language]}
                        onChange={(e) => updateBlockVariable("block_2_treatment_directions", key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Block 3 note */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <strong>Block 3 (Options)</strong> &mdash; Edit treatment options in the{" "}
                  <button
                    onClick={() => setActiveTab("options")}
                    className="underline font-medium hover:text-purple-900 dark:hover:text-purple-100"
                  >
                    Treatment Options
                  </button>{" "}
                  tab.
                </p>
              </div>

              {/* Blocks 4-7: Full text paragraphs */}
              {([
                { key: "block_4_expected_results" as FullTextBlockKey, label: "Block 4 — Expected Results", desc: "Full paragraph describing expected treatment outcomes" },
                { key: "block_5_duration" as FullTextBlockKey, label: "Block 5 — Duration", desc: "Full paragraph about treatment duration" },
                { key: "block_6_recovery" as FullTextBlockKey, label: "Block 6 — Recovery", desc: "Full paragraph about recovery expectations" },
                { key: "block_7_cost" as FullTextBlockKey, label: "Block 7 — Cost", desc: "Full paragraph about cost information" },
              ]).map(({ key, label, desc }) => (
                <div key={key} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-1">
                    {label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {desc} ({language.toUpperCase()})
                  </p>
                  <textarea
                    rows={4}
                    value={scenario.nlg_variables[key][language]}
                    onChange={(e) => updateFullTextBlock(key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Treatment Options Tab */}
          {activeTab === "options" && (
            <div className="space-y-4">
              {options.map((option, idx) => {
                const isExpanded = expandedOptions.has(idx);
                return (
                  <div key={idx} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    {/* Collapsible Header */}
                    <div
                      className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 select-none"
                      onClick={() => toggleOptionExpanded(idx)}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-mono text-purple-600 dark:text-purple-400">
                          #{idx + 1}
                        </span>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {option.OPTION_TITLE[language] || <span className="italic text-gray-400">Untitled</span>}
                        </h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {option.pricing.currency} {option.pricing.min.toLocaleString()}-{option.pricing.max.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {/* Move Up */}
                        <button
                          onClick={() => moveOption(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        {/* Move Down */}
                        <button
                          onClick={() => moveOption(idx, "down")}
                          disabled={idx === options.length - 1}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (options.length <= 1) return;
                            if (confirm(`Delete treatment option "${option.OPTION_TITLE[language] || "Untitled"}"?`)) {
                              removeOption(idx);
                            }
                          }}
                          disabled={options.length <= 1}
                          className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 ml-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={options.length <= 1 ? "Cannot remove last option" : "Delete option"}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-6">
                        {/* Option Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Option Title ({language.toUpperCase()})
                          </label>
                          <input
                            type="text"
                            value={option.OPTION_TITLE[language]}
                            onChange={(e) => updateOptionBilingualField(idx, "OPTION_TITLE", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Option Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Option Description ({language.toUpperCase()})
                          </label>
                          <textarea
                            rows={3}
                            value={option.OPTION_DESCRIPTION[language]}
                            onChange={(e) => updateOptionBilingualField(idx, "OPTION_DESCRIPTION", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Process Overview */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Process Overview ({language.toUpperCase()})
                          </label>
                          <textarea
                            rows={3}
                            value={option.PROCESS_OVERVIEW[language]}
                            onChange={(e) => updateOptionBilingualField(idx, "PROCESS_OVERVIEW", e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>

                        {/* Limitations + Profile Match */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Limitations ({language.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              value={option.OPTION_LIMITATIONS[language]}
                              onChange={(e) => updateOptionBilingualField(idx, "OPTION_LIMITATIONS", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Profile Match ({language.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              value={option.PROFILE_MATCH[language]}
                              onChange={(e) => updateOptionBilingualField(idx, "PROFILE_MATCH", e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Numeric fields: Pricing + Duration */}
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Price Min
                            </label>
                            <input
                              type="number"
                              value={option.pricing.min}
                              onChange={(e) =>
                                updateOption(idx, {
                                  pricing: { ...option.pricing, min: Number(e.target.value) },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Price Max
                            </label>
                            <input
                              type="number"
                              value={option.pricing.max}
                              onChange={(e) =>
                                updateOption(idx, {
                                  pricing: { ...option.pricing, max: Number(e.target.value) },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Currency
                            </label>
                            <input
                              type="text"
                              value={option.pricing.currency}
                              onChange={(e) =>
                                updateOption(idx, {
                                  pricing: { ...option.pricing, currency: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Duration Min (mo)
                            </label>
                            <input
                              type="number"
                              value={option.duration.min_months}
                              onChange={(e) =>
                                updateOption(idx, {
                                  duration: { ...option.duration, min_months: Number(e.target.value) },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Duration Max (mo)
                            </label>
                            <input
                              type="number"
                              value={option.duration.max_months}
                              onChange={(e) =>
                                updateOption(idx, {
                                  duration: { ...option.duration, max_months: Number(e.target.value) },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>

                        {/* Recovery days */}
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Recovery (days)
                            </label>
                            <input
                              type="number"
                              value={option.recovery_days}
                              onChange={(e) =>
                                updateOption(idx, {
                                  recovery_days: Number(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Treatment Option Button */}
              <button
                onClick={addOption}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Treatment Option
              </button>
            </div>
          )}

          {/* Matching Criteria Tab */}
          {activeTab === "matching" && scenario.matching && (
            <div className="space-y-6">
              {/* Driver Category Sections */}
              {([
                { category: "required_drivers" as DriverCategory, label: "Required Drivers", subtitle: "must match", color: "red" },
                { category: "strong_drivers" as DriverCategory, label: "Strong Drivers", subtitle: "high weight", color: "orange" },
                { category: "supporting_drivers" as DriverCategory, label: "Supporting Drivers", subtitle: "bonus weight", color: "green" },
                { category: "excluding_drivers" as DriverCategory, label: "Excluding Drivers", subtitle: "disqualifies match", color: "gray" },
              ] as const).map(({ category, label, subtitle, color }) => {
                const drivers = scenario.matching[category] || {};
                const bgClass = color === "red" ? "bg-red-50 dark:bg-red-900/10" :
                  color === "orange" ? "bg-orange-50 dark:bg-orange-900/10" :
                  color === "green" ? "bg-green-50 dark:bg-green-900/10" :
                  "bg-gray-50 dark:bg-gray-700/50";
                const headerClass = color === "red" ? "text-red-600 dark:text-red-400" :
                  color === "orange" ? "text-orange-600 dark:text-orange-400" :
                  color === "green" ? "text-green-600 dark:text-green-400" :
                  "text-gray-600 dark:text-gray-400";
                const borderClass = color === "red" ? "border-red-200 dark:border-red-800" :
                  color === "orange" ? "border-orange-200 dark:border-orange-800" :
                  color === "green" ? "border-green-200 dark:border-green-800" :
                  "border-gray-200 dark:border-gray-600";

                return (
                  <div key={category} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className={`px-6 py-3 border-b ${borderClass} ${bgClass}`}>
                      <h3 className={`text-sm font-medium ${headerClass}`}>
                        {label} <span className="font-normal">({subtitle})</span>
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      {Object.entries(drivers).map(([groupKey, values]) => (
                        <div key={groupKey} className={`rounded-lg p-4 ${bgClass} border ${borderClass}`}>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="text"
                              value={groupKey}
                              onChange={(e) => updateDriverGroupKey(category, groupKey, e.target.value)}
                              className="flex-1 px-3 py-1.5 text-sm font-medium border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            <button
                              onClick={() => {
                                if (confirm(`Remove driver group "${groupKey}" and all its values?`)) {
                                  removeDriverGroup(category, groupKey);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                              title="Remove group"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(values as string[]).map((val, vIdx) => (
                              <div key={vIdx} className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-3 pr-1 py-1">
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateDriverValue(category, groupKey, vIdx, e.target.value)}
                                  className="w-32 text-sm bg-transparent border-none outline-none dark:text-white p-0"
                                />
                                <button
                                  onClick={() => removeDriverValue(category, groupKey, vIdx)}
                                  className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-600"
                                  title="Remove value"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addDriverValue(category, groupKey)}
                              className="px-3 py-1 text-xs border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors"
                            >
                              + Add Value
                            </button>
                          </div>
                        </div>
                      ))}

                      {Object.keys(drivers).length === 0 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">
                          No driver groups defined
                        </p>
                      )}

                      <button
                        onClick={() => addDriverGroup(category)}
                        className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 dark:hover:border-purple-500 dark:hover:text-purple-400 transition-colors"
                      >
                        + Add Driver Group
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Preferred Tags */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-6 py-3 border-b border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
                  <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Preferred Tags
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(scenario.matching.preferred_tags || []).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          onClick={() => removePreferredTag(idx)}
                          className="p-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                          title="Remove tag"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    {(scenario.matching.preferred_tags || []).length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic">No tags defined</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New tag..."
                      className="flex-1 px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          addPreferredTag((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        if (input) {
                          addPreferredTag(input.value);
                          input.value = "";
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
