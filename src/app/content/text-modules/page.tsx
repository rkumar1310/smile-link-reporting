"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";

interface TextModule {
  _id: string;
  type: "text_module";
  module_type: string;
  content: { en: string; nl: string };
  updatedAt?: string;
}

const MODULE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  banner: {
    label: "Banner",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  module: {
    label: "Module",
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  },
  costblock: {
    label: "Cost Block",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  },
  nuance: {
    label: "Nuance",
    color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  },
};

export default function TextModulesListPage() {
  const [modules, setModules] = useState<TextModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "nl">("en");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("module_type", filterType);
      if (search) params.set("search", search);

      const res = await fetch(`/api/text-modules?${params}`);
      if (!res.ok) throw new Error("Failed to fetch text modules");

      const data = await res.json();
      setModules(data.modules);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // Group modules by module_type
  const grouped = useMemo(() => {
    const groups: Record<string, TextModule[]> = {};
    for (const mod of modules) {
      const key = mod.module_type || "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(mod);
    }
    return groups;
  }, [modules]);

  const moduleTypes = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/content" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
              &larr; Back to Content
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Text Modules</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Banners, modules, cost blocks, and nuance blocks for NLG template rendering
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
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search modules..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="banner">Banner</option>
                  <option value="module">Module</option>
                  <option value="costblock">Cost Block</option>
                  <option value="nuance">Nuance</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterType("");
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-3 mb-6">
            {Object.entries(MODULE_TYPE_LABELS).map(([key, { label, color }]) => {
              const count = grouped[key]?.length || 0;
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(filterType === key ? "" : key)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filterType === key
                      ? color
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {label}
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
            <div className="ml-auto text-sm text-gray-500 dark:text-gray-400 self-center">
              {modules.length} total modules
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading text modules...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
              {error}
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">
                No text modules found. Run the import script to populate modules.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {moduleTypes.map((typeKey) => {
                const typeModules = grouped[typeKey];
                const typeInfo = MODULE_TYPE_LABELS[typeKey] || {
                  label: typeKey,
                  color: "bg-gray-100 text-gray-800",
                };

                return (
                  <div key={typeKey}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {typeModules.length} module{typeModules.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-56">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Content ({language.toUpperCase()})
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {typeModules.map((mod) => {
                            const isExpanded = expandedId === mod._id;
                            const contentText = mod.content?.[language] || "";
                            const preview = contentText.length > 120
                              ? contentText.slice(0, 120) + "..."
                              : contentText;

                            return (
                              <tr
                                key={mod._id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : mod._id)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400">
                                    {mod._id}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {isExpanded ? (
                                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                                      {contentText || <span className="text-gray-400 italic">No content</span>}
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                      {preview || <span className="italic">No content</span>}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                  <Link
                                    href={`/content/text-modules/${mod._id}`}
                                    className="text-sm text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Edit
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
