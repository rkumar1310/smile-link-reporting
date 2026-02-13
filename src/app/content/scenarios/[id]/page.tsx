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
          matching: scenario.matching,
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

  function addTreatmentOption() {
    if (!scenario) return;
    const options = scenario.treatment_options || [];
    const newIndex = options.length;
    const newId = `option_${Date.now()}`;
    const newOption: TreatmentOption = {
      id: newId,
      name: { en: "", nl: "" },
      rank: newIndex + 1,
      category: "other",
      description: { en: "", nl: "" },
      benefits: [],
      considerations: [],
      ideal_for: { en: "", nl: "" },
      pricing: { min: 0, max: 0, currency: "EUR" },
      duration: { min_months: 0, max_months: 0 },
      recovery: { days: 0 },
    };
    setScenario({
      ...scenario,
      treatment_options: [...options, newOption],
    });
    setExpandedOptions((prev) => new Set(prev).add(newIndex));
  }

  function removeTreatmentOption(index: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    options.splice(index, 1);
    // Recalculate ranks
    options.forEach((opt, i) => { opt.rank = i + 1; });
    setScenario({ ...scenario, treatment_options: options });
    // Update expanded set
    setExpandedOptions((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  }

  function moveTreatmentOption(index: number, direction: "up" | "down") {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= options.length) return;
    [options[index], options[targetIndex]] = [options[targetIndex], options[index]];
    // Recalculate ranks
    options.forEach((opt, i) => { opt.rank = i + 1; });
    setScenario({ ...scenario, treatment_options: options });
    // Update expanded set to follow the moved item
    setExpandedOptions((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i === index) next.add(targetIndex);
        else if (i === targetIndex) next.add(index);
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

  function addBenefit(optionIndex: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    option.benefits = [...(option.benefits || []), { en: "", nl: "" }];
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function removeBenefit(optionIndex: number, benefitIndex: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const benefits = [...(option.benefits || [])];
    benefits.splice(benefitIndex, 1);
    option.benefits = benefits;
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function updateBenefit(optionIndex: number, benefitIndex: number, value: string) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const benefits = [...(option.benefits || [])];
    benefits[benefitIndex] = { ...benefits[benefitIndex], [language]: value };
    option.benefits = benefits;
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function addConsideration(optionIndex: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    option.considerations = [...(option.considerations || []), { en: "", nl: "" }];
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function removeConsideration(optionIndex: number, considerationIndex: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const considerations = [...(option.considerations || [])];
    considerations.splice(considerationIndex, 1);
    option.considerations = considerations;
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function addPhase(optionIndex: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const phases = [...(option.phases || [])];
    if (phases.length >= 3) return; // max 3 phases
    option.phases = [...phases, { en: "", nl: "" }];
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function removePhase(optionIndex: number, phaseIndex: number) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const phases = [...(option.phases || [])];
    phases.splice(phaseIndex, 1);
    option.phases = phases;
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function updatePhase(optionIndex: number, phaseIndex: number, value: string) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const phases = [...(option.phases || [])];
    phases[phaseIndex] = { ...phases[phaseIndex], [language]: value };
    option.phases = phases;
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
  }

  function updateConsideration(optionIndex: number, considerationIndex: number, value: string) {
    if (!scenario) return;
    const options = [...(scenario.treatment_options || [])];
    const option = { ...options[optionIndex] };
    const considerations = [...(option.considerations || [])];
    considerations[considerationIndex] = { ...considerations[considerationIndex], [language]: value };
    option.considerations = considerations;
    options[optionIndex] = option;
    setScenario({ ...scenario, treatment_options: options });
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
            <div className="space-y-4">
              {scenario.treatment_options && scenario.treatment_options.length > 0 ? (
                scenario.treatment_options.map((option, idx) => {
                  const isExpanded = expandedOptions.has(idx);
                  return (
                    <div key={option.id || idx} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
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
                          <span className="text-sm font-mono text-purple-600 dark:text-purple-400">#{option.rank}</span>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {option.name[language] || <span className="italic text-gray-400">Untitled</span>}
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            {option.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* Move Up */}
                          <button
                            onClick={() => moveTreatmentOption(idx, "up")}
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
                            onClick={() => moveTreatmentOption(idx, "down")}
                            disabled={idx === (scenario.treatment_options?.length || 0) - 1}
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
                              if (confirm(`Delete treatment option "${option.name[language] || "Untitled"}"?`)) {
                                removeTreatmentOption(idx);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 ml-2"
                            title="Delete option"
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
                          {/* Row 1: Name + Category */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
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
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Category
                              </label>
                              <select
                                value={option.category}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    category: e.target.value as TreatmentOption["category"],
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              >
                                {["implant", "bridge", "denture", "crown", "veneer", "whitening", "orthodontic", "other"].map((cat) => (
                                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Row 2: Description */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Description ({language.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              value={option.description?.[language] || ""}
                              onChange={(e) =>
                                updateTreatmentOption(idx, {
                                  description: { ...(option.description || { en: "", nl: "" }), [language]: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>

                          {/* Row 3: Benefits + Considerations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Benefits */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Benefits ({language.toUpperCase()})
                                </label>
                                <button
                                  onClick={() => addBenefit(idx)}
                                  className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(option.benefits || []).map((benefit, bIdx) => (
                                  <div key={bIdx} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={benefit[language] || ""}
                                      onChange={(e) => updateBenefit(idx, bIdx, e.target.value)}
                                      placeholder={`Benefit ${bIdx + 1}`}
                                      className="flex-1 px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <button
                                      onClick={() => removeBenefit(idx, bIdx)}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      title="Remove benefit"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                {(option.benefits || []).length === 0 && (
                                  <p className="text-xs text-gray-400 italic">No benefits added</p>
                                )}
                              </div>
                            </div>

                            {/* Considerations */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Considerations ({language.toUpperCase()})
                                </label>
                                <button
                                  onClick={() => addConsideration(idx)}
                                  className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded"
                                >
                                  + Add
                                </button>
                              </div>
                              <div className="space-y-2">
                                {(option.considerations || []).map((consideration, cIdx) => (
                                  <div key={cIdx} className="flex gap-2">
                                    <input
                                      type="text"
                                      value={consideration[language] || ""}
                                      onChange={(e) => updateConsideration(idx, cIdx, e.target.value)}
                                      placeholder={`Consideration ${cIdx + 1}`}
                                      className="flex-1 px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <button
                                      onClick={() => removeConsideration(idx, cIdx)}
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                      title="Remove consideration"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))}
                                {(option.considerations || []).length === 0 && (
                                  <p className="text-xs text-gray-400 italic">No considerations added</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Row 4: Ideal For */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Ideal For ({language.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              value={option.ideal_for?.[language] || ""}
                              onChange={(e) =>
                                updateTreatmentOption(idx, {
                                  ideal_for: { ...(option.ideal_for || { en: "", nl: "" }), [language]: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </div>

                          {/* Row 5: NLG Variable Fields */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Complexity ({language.toUpperCase()})
                              </label>
                              <textarea
                                rows={2}
                                value={option.complexity?.[language] || ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    complexity: { ...(option.complexity || { en: "", nl: "" }), [language]: e.target.value },
                                  })
                                }
                                placeholder="e.g. Medium complexity, requires multiple visits"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Result Description ({language.toUpperCase()})
                              </label>
                              <textarea
                                rows={2}
                                value={option.result_description?.[language] || ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    result_description: { ...(option.result_description || { en: "", nl: "" }), [language]: e.target.value },
                                  })
                                }
                                placeholder="Expected result of this treatment"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Comfort Experience ({language.toUpperCase()})
                              </label>
                              <textarea
                                rows={2}
                                value={option.comfort_experience?.[language] || ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    comfort_experience: { ...(option.comfort_experience || { en: "", nl: "" }), [language]: e.target.value },
                                  })
                                }
                                placeholder="What the patient can expect comfort-wise"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Aesthetic Result ({language.toUpperCase()})
                              </label>
                              <textarea
                                rows={2}
                                value={option.aesthetic_result?.[language] || ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    aesthetic_result: { ...(option.aesthetic_result || { en: "", nl: "" }), [language]: e.target.value },
                                  })
                                }
                                placeholder="Expected aesthetic outcome"
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Phases */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Phases ({language.toUpperCase()}) — max 3
                              </label>
                              <button
                                onClick={() => addPhase(idx)}
                                disabled={(option.phases || []).length >= 3}
                                className="text-xs px-2 py-1 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                + Add Phase
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(option.phases || []).map((phase, pIdx) => (
                                <div key={pIdx} className="flex gap-2">
                                  <span className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 w-16 shrink-0">
                                    Phase {pIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    value={phase[language] || ""}
                                    onChange={(e) => updatePhase(idx, pIdx, e.target.value)}
                                    placeholder={`Phase ${pIdx + 1} description`}
                                    className="flex-1 px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                  />
                                  <button
                                    onClick={() => removePhase(idx, pIdx)}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    title="Remove phase"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                              {(option.phases || []).length === 0 && (
                                <p className="text-xs text-gray-400 italic">No phases added</p>
                              )}
                            </div>
                          </div>

                          {/* Row 6: Pricing + Duration + Recovery numbers */}
                          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Price Min
                              </label>
                              <input
                                type="number"
                                value={option.pricing?.min ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    pricing: { ...(option.pricing || { min: 0, max: 0, currency: "EUR" }), min: Number(e.target.value) },
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
                                value={option.pricing?.max ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    pricing: { ...(option.pricing || { min: 0, max: 0, currency: "EUR" }), max: Number(e.target.value) },
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
                                value={option.pricing?.currency ?? "EUR"}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    pricing: { ...(option.pricing || { min: 0, max: 0, currency: "EUR" }), currency: e.target.value },
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
                                value={option.duration?.min_months ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    duration: { ...(option.duration || { min_months: 0, max_months: 0 }), min_months: Number(e.target.value) },
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
                                value={option.duration?.max_months ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    duration: { ...(option.duration || { min_months: 0, max_months: 0 }), max_months: Number(e.target.value) },
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Recovery days on its own row for clarity */}
                          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Recovery (days)
                              </label>
                              <input
                                type="number"
                                value={option.recovery?.days ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    recovery: { ...(option.recovery || { days: 0 }), days: Number(e.target.value) },
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Row 6: Notes — Pricing note, Duration note, Recovery description */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Pricing Note ({language.toUpperCase()})
                              </label>
                              <input
                                type="text"
                                value={option.pricing?.note?.[language] ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    pricing: {
                                      ...(option.pricing || { min: 0, max: 0, currency: "EUR" }),
                                      note: { ...(option.pricing?.note || { en: "", nl: "" }), [language]: e.target.value },
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Duration Note ({language.toUpperCase()})
                              </label>
                              <input
                                type="text"
                                value={option.duration?.note?.[language] ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    duration: {
                                      ...(option.duration || { min_months: 0, max_months: 0 }),
                                      note: { ...(option.duration?.note || { en: "", nl: "" }), [language]: e.target.value },
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Recovery Description ({language.toUpperCase()})
                              </label>
                              <input
                                type="text"
                                value={option.recovery?.description?.[language] ?? ""}
                                onChange={(e) =>
                                  updateTreatmentOption(idx, {
                                    recovery: {
                                      ...(option.recovery || { days: 0 }),
                                      description: { ...(option.recovery?.description || { en: "", nl: "" }), [language]: e.target.value },
                                    },
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
                })
              ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
                  No treatment options defined for this scenario.
                </div>
              )}

              {/* Add Treatment Option Button */}
              <button
                onClick={addTreatmentOption}
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
