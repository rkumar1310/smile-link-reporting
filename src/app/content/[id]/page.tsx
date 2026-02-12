"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import type { ContentDocument, ToneProfileId, SupportedLanguage } from "@/lib/types";
import { MarkdownEditor, MarkdownPreview } from "@/components/content/MarkdownEditor";

const TONES: ToneProfileId[] = ["TP-01", "TP-02", "TP-03", "TP-04", "TP-05", "TP-06"];
const LANGUAGES: SupportedLanguage[] = ["en", "nl"];

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [content, setContent] = useState<ContentDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>("en");
  const [selectedTone, setSelectedTone] = useState<ToneProfileId>("TP-01");
  const [workflowLoading, setWorkflowLoading] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [id]);

  async function fetchContent() {
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${id}`);
      if (!res.ok) throw new Error("Content not found");
      const data = await res.json();
      setContent(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!content) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/content/${id}/variant/${selectedLang}/${selectedTone}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          citations: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save content");
      }

      // Refresh content and exit edit mode
      await fetchContent();
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(initialContent: string = "") {
    setEditContent(initialContent);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditContent("");
  }

  async function handleWorkflowAction(action: string) {
    if (!content) return;
    setWorkflowLoading(true);
    try {
      const res = await fetch(`/api/content/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      await fetchContent();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setWorkflowLoading(false);
    }
  }

  const currentVariant = content?.variants?.[selectedLang]?.[selectedTone];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/content" className="text-blue-600 hover:text-blue-800 mb-4 block">
            ← Back to Content
          </Link>
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error || "Content not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/content" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            ← Back to Content
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                {content.contentId}
              </h1>
              <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">{content.name}</p>
            </div>
            <StatusBadge status={content.status} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Metadata */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Details</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Type</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {content.type?.replace("_", " ") || "Unknown"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Layer</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {content.layer}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Version</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {content.version}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Target Sections</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {content.targetSections?.join(", ") || content.targetSection || "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Updated</dt>
                  <dd className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(content.updatedAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Workflow Actions */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Workflow</h2>
              <div className="space-y-3">
                {content.status === "draft" && (
                  <button
                    onClick={() => handleWorkflowAction("submit_review")}
                    disabled={workflowLoading}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  >
                    Submit for Review
                  </button>
                )}
                {content.status === "review" && (
                  <>
                    <button
                      onClick={() => handleWorkflowAction("approve")}
                      disabled={workflowLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleWorkflowAction("reject")}
                      disabled={workflowLoading}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
                {content.status === "approved" && (
                  <button
                    onClick={() => handleWorkflowAction("publish")}
                    disabled={workflowLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}
                {content.status === "published" && (
                  <button
                    onClick={() => handleWorkflowAction("unpublish")}
                    disabled={workflowLoading}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    Unpublish
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Content Variants */}
          <div className="lg:col-span-2 space-y-6">
            {/* Variant Selector */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as SupportedLanguage)}
                    disabled={isEditing}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang === "en" ? "English" : "Dutch"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tone
                  </label>
                  <select
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value as ToneProfileId)}
                    disabled={isEditing}
                  >
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Variant Matrix */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 pr-4 text-gray-500 dark:text-gray-400">Lang</th>
                      {TONES.map((tone) => (
                        <th key={tone} className="text-center py-2 px-2 text-gray-500 dark:text-gray-400">
                          {tone}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LANGUAGES.map((lang) => (
                      <tr key={lang} className="border-b dark:border-gray-700">
                        <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                          {lang.toUpperCase()}
                        </td>
                        {TONES.map((tone) => {
                          const variant = content.variants?.[lang]?.[tone];
                          const isSelected = selectedLang === lang && selectedTone === tone;
                          return (
                            <td key={tone} className="text-center py-2 px-2">
                              <button
                                onClick={() => {
                                  if (!isEditing) {
                                    setSelectedLang(lang);
                                    setSelectedTone(tone);
                                  }
                                }}
                                disabled={isEditing}
                                className={`w-8 h-8 rounded-full ${
                                  variant
                                    ? isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                    : "bg-gray-100 text-gray-400 dark:bg-gray-700"
                                } ${isEditing ? "cursor-not-allowed opacity-50" : ""}`}
                              >
                                {variant ? "✓" : "−"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Variant Content */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Content: {selectedLang.toUpperCase()} / {selectedTone}
                </h2>
                {!isEditing && currentVariant && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {currentVariant.wordCount} words
                    </span>
                    <button
                      onClick={() => startEditing(currentVariant.content)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <MarkdownEditor
                  value={editContent}
                  onChange={setEditContent}
                  onSave={handleSave}
                  onCancel={cancelEditing}
                  isSaving={isSaving}
                />
              ) : currentVariant ? (
                <div>
                  <MarkdownPreview content={currentVariant.content} />
                  {currentVariant.citations && currentVariant.citations.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Citations ({currentVariant.citations.length})
                      </h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {currentVariant.citations.map((citation, i) => (
                          <li key={i} className="truncate">
                            • {citation.section} ({citation.sourcePath})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No content for this variant yet.
                  </p>
                  <button
                    onClick={() => startEditing("")}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Variant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    archived: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.draft}`}
    >
      {status}
    </span>
  );
}
