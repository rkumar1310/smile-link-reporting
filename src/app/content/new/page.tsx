"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ContentType, DriverLayer } from "@/lib/types";

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    contentId: "",
    type: "module" as ContentType,
    name: "",
    description: "",
    layer: "L2" as DriverLayer,
    targetSection: "",
    targetSections: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        contentId: formData.contentId,
        type: formData.type,
        name: formData.name,
        description: formData.description,
        layer: formData.layer,
        targetSection: formData.targetSection ? parseInt(formData.targetSection) : undefined,
        targetSections: formData.targetSections
          ? formData.targetSections.split(",").map((s) => parseInt(s.trim()))
          : undefined,
      };

      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create content");
      }

      router.push("/content");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/content" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            ← Back to Content
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Content</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., TM_RISK_NEW, B_OPT_CUSTOM, S18"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.contentId}
                onChange={(e) => setFormData({ ...formData, contentId: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                Use format: TM_* for modules, B_* for blocks, A_* for warnings, S* for scenarios
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
              >
                <option value="module">Module (TM_*)</option>
                <option value="b_block">B Block (B_*)</option>
                <option value="a_block">A Block / Warning (A_*)</option>
                <option value="scenario">Scenario (S*)</option>
                <option value="static">Static</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                placeholder="Human-readable name"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe what this content is for..."
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Layer *
              </label>
              <select
                required
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.layer}
                onChange={(e) => setFormData({ ...formData, layer: e.target.value as DriverLayer })}
              >
                <option value="L1">L1 - Safety (highest priority)</option>
                <option value="L2">L2 - Personalization</option>
                <option value="L3">L3 - Narrative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Section (single)
              </label>
              <input
                type="number"
                min="0"
                max="11"
                placeholder="0-11"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.targetSection}
                onChange={(e) => setFormData({ ...formData, targetSection: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Sections (multiple)
              </label>
              <input
                type="text"
                placeholder="e.g., 3, 5, 10"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={formData.targetSections}
                onChange={(e) => setFormData({ ...formData, targetSections: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">Comma-separated section numbers</p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Content"}
              </button>
              <Link
                href="/content"
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
