"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface TextModule {
  _id: string;
  type: "text_module";
  module_type: string;
  content: { en: string; nl: string };
  updatedAt?: string;
}

export default function TextModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [module, setModule] = useState<TextModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Edit state — side-by-side EN/NL
  const [editEN, setEditEN] = useState("");
  const [editNL, setEditNL] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchModule();
  }, [id]);

  async function fetchModule() {
    setLoading(true);
    try {
      const res = await fetch(`/api/text-modules/${id}`);
      if (!res.ok) throw new Error("Text module not found");

      const data: TextModule = await res.json();
      setModule(data);
      setEditEN(data.content?.en || "");
      setEditNL(data.content?.nl || "");
      setIsDirty(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleENChange(value: string) {
    setEditEN(value);
    setIsDirty(true);
    setSaveMessage(null);
  }

  function handleNLChange(value: string) {
    setEditNL(value);
    setIsDirty(true);
    setSaveMessage(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/text-modules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { en: editEN, nl: editNL },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      const updated: TextModule = await res.json();
      setModule(updated);
      setIsDirty(false);
      setSaveMessage("Saved successfully");
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (module) {
      setEditEN(module.content?.en || "");
      setEditNL(module.content?.nl || "");
      setIsDirty(false);
      setSaveMessage(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/content/text-modules" className="text-blue-600 hover:text-blue-800 mb-4 block">
            &larr; Back to Text Modules
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error || "Text module not found"}
          </div>
        </div>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    banner: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    module: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    costblock: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    nuance: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/content/text-modules" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            &larr; Back to Text Modules
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                  {module._id}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  typeColors[module.module_type] || "bg-gray-100 text-gray-800"
                }`}>
                  {module.module_type}
                </span>
              </div>
              {module.updatedAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Last updated: {new Date(module.updatedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className={`text-sm ${
                  saveMessage.includes("success")
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {saveMessage}
                </span>
              )}
              {isDirty && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Reset
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* Side-by-side editors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* English */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  English (EN)
                </h2>
                <span className="text-xs text-gray-400">
                  {editEN.split(/\s+/).filter(w => w).length} words
                </span>
              </div>
              <textarea
                value={editEN}
                onChange={(e) => handleENChange(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm leading-relaxed resize-y"
                placeholder="English content..."
              />
            </div>

            {/* Dutch */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Dutch (NL)
                </h2>
                <span className="text-xs text-gray-400">
                  {editNL.split(/\s+/).filter(w => w).length} words
                </span>
              </div>
              <textarea
                value={editNL}
                onChange={(e) => handleNLChange(e.target.value)}
                rows={16}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm leading-relaxed resize-y"
                placeholder="Dutch content..."
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
