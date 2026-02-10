"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import type { ContentDocument, ContentType, ContentStatus } from "@/lib/types";
import type {
  ContentRegistryItem,
  ContentSection,
  ContentLayer,
} from "@/lib/types/content-registry";
import { LAYER_METADATA } from "@/lib/types/content-registry";

interface ContentListResponse {
  content: ContentDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ContentListPage() {
  // Database content state
  const [content, setContent] = useState<ContentDocument[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{
    type?: ContentType;
    status?: ContentStatus;
    search?: string;
  }>({});

  // Registry state (for context/info panel)
  const [registryItems, setRegistryItems] = useState<ContentRegistryItem[]>([]);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  // Fetch registry data on mount
  useEffect(() => {
    async function fetchRegistry() {
      try {
        const [itemsRes, sectionsRes] = await Promise.all([
          fetch("/api/content-registry"),
          fetch("/api/content-registry/sections")
        ]);

        if (itemsRes.ok && sectionsRes.ok) {
          const itemsData = await itemsRes.json();
          const sectionsData = await sectionsRes.json();
          setRegistryItems(itemsData.items);
          setSections(sectionsData.sections);
        }
      } catch (err) {
        console.error("Failed to load registry:", err);
      }
    }

    fetchRegistry();
  }, []);

  // Fetch database content
  useEffect(() => {
    fetchContent();
  }, [filters, pagination.page]);

  async function fetchContent() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set("type", filters.type);
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());

      const res = await fetch(`/api/content?${params}`);
      if (!res.ok) throw new Error("Failed to fetch content");

      const data: ContentListResponse = await res.json();
      setContent(data.content);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // Get registry info for a content ID
  const getRegistryInfo = (contentId: string): ContentRegistryItem | undefined => {
    return registryItems.find(item => item.id === contentId);
  };

  // Selected item's registry info
  const selectedRegistryInfo = useMemo(() => {
    if (!selectedContentId) return null;
    return getRegistryInfo(selectedContentId);
  }, [selectedContentId, registryItems]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content</h1>
          </div>
          <Link
            href="/content/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Content
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search content..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={filters.search || ""}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={filters.type || ""}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as ContentType || undefined })}
                >
                  <option value="">All Types</option>
                  <option value="scenario">Scenario</option>
                  <option value="a_block">A Block</option>
                  <option value="b_block">B Block</option>
                  <option value="module">Module</option>
                  <option value="static">Static</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as ContentStatus || undefined })}
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({})}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Content List */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading content...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                  {error}
                </div>
              ) : content.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                  <p className="text-gray-500 dark:text-gray-400">No content found</p>
                  <Link
                    href="/content/new"
                    className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                  >
                    Create your first content
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Content ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Variants
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {content.map((item) => {
                          const registryInfo = getRegistryInfo(item.contentId);
                          return (
                            <tr
                              key={item._id || item.contentId}
                              className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                selectedContentId === item.contentId ? "bg-blue-50 dark:bg-blue-900/20" : ""
                              }`}
                              onClick={() => setSelectedContentId(item.contentId)}
                              onDoubleClick={() => window.location.href = `/content/${item.contentId}`}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm text-gray-900 dark:text-white">
                                    {item.contentId}
                                  </span>
                                  {registryInfo && (
                                    <LayerBadge layer={registryInfo.layer} />
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-900 dark:text-white">{item.name}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <TypeBadge type={item.type} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <StatusBadge status={item.status} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <VariantCount variants={item.variants} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-4 flex justify-between items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} results
                      </p>
                      <div className="flex gap-2">
                        <button
                          disabled={pagination.page === 1}
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                          className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
                        >
                          Previous
                        </button>
                        <button
                          disabled={pagination.page === pagination.totalPages}
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                          className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-600"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Info Panel - shows registry context for selected item */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow sticky top-6">
                {selectedRegistryInfo ? (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <LayerBadge layer={selectedRegistryInfo.layer} />
                      <TypeBadge type={selectedRegistryInfo.type as ContentType} />
                    </div>

                    <h3 className="font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1">
                      {selectedRegistryInfo.id}
                    </h3>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                      {selectedRegistryInfo.name}
                    </h4>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRegistryInfo.description}</p>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Sections</h5>
                        <div className="space-y-1">
                          {selectedRegistryInfo.sections.map(sectionNum => {
                            const section = sections.find(s => s.number === sectionNum);
                            return (
                              <div key={sectionNum} className="text-sm">
                                <span className="font-medium text-gray-900 dark:text-white">§{sectionNum}:</span>{" "}
                                <span className="text-gray-600 dark:text-gray-400">{section?.name || "Unknown"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Layer</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{LAYER_METADATA[selectedRegistryInfo.layer].name}:</span>{" "}
                          {LAYER_METADATA[selectedRegistryInfo.layer].description}
                        </p>
                      </div>

                      <div className="pt-3 border-t dark:border-gray-700">
                        <Link
                          href={`/content/${selectedRegistryInfo.id}`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Content
                          <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : selectedContentId ? (
                  <div className="p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No registry info available for this content ID.
                    </p>
                    <div className="pt-3 mt-3 border-t dark:border-gray-700">
                      <Link
                        href={`/content/${selectedContentId}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Edit Content
                        <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-sm">Click a row to see content details</p>
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

function TypeBadge({ type }: { type: ContentType }) {
  if (!type) return null;

  const colors: Record<ContentType, string> = {
    scenario: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    a_block: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    b_block: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    module: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    static: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-800"}`}>
      {type.replace("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const colors: Record<ContentStatus, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    archived: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
  );
}

function VariantCount({ variants }: { variants: ContentDocument["variants"] }) {
  let count = 0;
  if (variants) {
    for (const lang of Object.keys(variants)) {
      const langVariants = variants[lang as keyof typeof variants];
      if (langVariants) {
        count += Object.keys(langVariants).length;
      }
    }
  }
  return (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {count} variant{count !== 1 ? "s" : ""}
    </span>
  );
}

function LayerBadge({ layer }: { layer: ContentLayer }) {
  const colors: Record<ContentLayer, string> = {
    L1: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    L2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    L3: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[layer]}`}>
      {layer}
    </span>
  );
}
