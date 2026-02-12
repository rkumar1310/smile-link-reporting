"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ContentType, DriverLayer } from "@/lib/types";
import type { ContentRegistryItem, ContentRegistryListResponse } from "@/lib/types/content-registry";

// Content types that can be created via this form
// Note: Scenarios are excluded - they live in a separate collection and are managed via seed scripts
type CreatableContentType = Exclude<ContentType, "scenario">;

interface GroupedRegistry {
  a_block: ContentRegistryItem[];
  b_block: ContentRegistryItem[];
  module: ContentRegistryItem[];
  static: ContentRegistryItem[];
}

const typeLabels: Record<CreatableContentType, string> = {
  a_block: "A Blocks / Warnings (A_*)",
  b_block: "B Blocks (B_*)",
  module: "Modules (TM_*)",
  static: "Static Content",
};

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registryItems, setRegistryItems] = useState<ContentRegistryItem[]>([]);
  const [registryLoading, setRegistryLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ContentRegistryItem | null>(null);

  const [formData, setFormData] = useState({
    contentId: "",
    type: "module" as CreatableContentType,
    name: "",
    description: "",
    layer: "L2" as DriverLayer,
    targetSection: "",
    targetSections: "",
  });

  // Fetch registry items on mount
  useEffect(() => {
    async function fetchRegistry() {
      try {
        const res = await fetch("/api/content-registry");
        if (!res.ok) throw new Error("Failed to load registry");
        const data: ContentRegistryListResponse = await res.json();
        setRegistryItems(data.items);
      } catch (err) {
        console.error("Failed to fetch registry:", err);
        setError("Failed to load content registry");
      } finally {
        setRegistryLoading(false);
      }
    }
    fetchRegistry();
  }, []);

  // Filter out scenarios - they live in a separate collection
  const creatableItems = registryItems.filter((i) => i.type !== "scenario");

  // Group registry items by type for the dropdown
  const groupedRegistry: GroupedRegistry = {
    a_block: creatableItems.filter((i) => i.type === "a_block"),
    b_block: creatableItems.filter((i) => i.type === "b_block"),
    module: creatableItems.filter((i) => i.type === "module"),
    static: creatableItems.filter((i) => i.type === "static"),
  };

  // Handle content ID selection
  function handleContentIdChange(contentId: string) {
    const item = creatableItems.find((i) => i.id === contentId);
    setSelectedItem(item || null);

    if (item) {
      // Auto-populate fields from registry
      setFormData({
        contentId: item.id,
        type: item.type as CreatableContentType,
        name: item.name,
        description: item.description,
        layer: item.layer as DriverLayer,
        targetSection: item.sections.length === 1 ? item.sections[0].toString() : "",
        targetSections: item.sections.length > 1 ? item.sections.join(", ") : "",
      });
    } else {
      setFormData({
        ...formData,
        contentId: "",
      });
    }
  }

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
            &larr; Back to Content
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

          {/* Info box about scenarios */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
            <strong>Note:</strong> Scenarios (S00-S17) are managed separately via seed scripts and stored in the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">scenarios</code> collection. This form is for creating A-blocks, B-blocks, modules, and static content only.
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content ID *
              </label>
              {registryLoading ? (
                <div className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500">
                  Loading content registry...
                </div>
              ) : (
                <select
                  required
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={formData.contentId}
                  onChange={(e) => handleContentIdChange(e.target.value)}
                >
                  <option value="">-- Select a content ID --</option>
                  {(Object.keys(groupedRegistry) as CreatableContentType[]).map((type) => {
                    const items = groupedRegistry[type];
                    if (items.length === 0) return null;
                    return (
                      <optgroup key={type} label={typeLabels[type]}>
                        {items.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.id} - {item.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              )}
              {selectedItem && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {selectedItem.description}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                required
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
                value={formData.type}
              >
                <option value="module">Module (TM_*)</option>
                <option value="b_block">B Block (B_*)</option>
                <option value="a_block">A Block / Warning (A_*)</option>
                <option value="static">Static</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">Auto-populated from registry</p>
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
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
                value={formData.layer}
              >
                <option value="L1">L1 - Safety (highest priority)</option>
                <option value="L2">L2 - Personalization</option>
                <option value="L3">L3 - Narrative</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">Auto-populated from registry</p>
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
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
                value={formData.targetSection}
              />
              <p className="mt-1 text-sm text-gray-500">Auto-populated from registry</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Sections (multiple)
              </label>
              <input
                type="text"
                placeholder="e.g., 3, 5, 10"
                disabled
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white cursor-not-allowed"
                value={formData.targetSections}
              />
              <p className="mt-1 text-sm text-gray-500">Auto-populated from registry</p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || !formData.contentId}
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
