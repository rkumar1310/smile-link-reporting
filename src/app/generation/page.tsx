"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ContentDocument, ToneProfileId, SupportedLanguage } from "@/lib/types";

const TONES: ToneProfileId[] = ["TP-01", "TP-02", "TP-03", "TP-04", "TP-05", "TP-06"];
const LANGUAGES: SupportedLanguage[] = ["en", "nl"];

interface SourceDocument {
  _id: string;
  filename: string;
  path: string;
  language: SupportedLanguage;
  sectionCount: number;
  parsedAt: string;
}

interface GenerationJob {
  _id: string;
  contentId: string;
  status: "pending" | "running" | "completed" | "failed";
  tones: ToneProfileId[];
  languages: SupportedLanguage[];
  progress?: number;
  error?: string;
  createdAt: string;
}

export default function GenerationPage() {
  const [contents, setContents] = useState<ContentDocument[]>([]);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [selectedTones, setSelectedTones] = useState<ToneProfileId[]>(["TP-01"]);
  const [selectedLanguages, setSelectedLanguages] = useState<SupportedLanguage[]>(["en"]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [contentRes, sourcesRes, jobsRes] = await Promise.all([
        fetch("/api/content?limit=200"), // Get all content for dropdown
        fetch("/api/sources"),
        fetch("/api/generation"),
      ]);

      if (contentRes.ok) {
        const data = await contentRes.json();
        // API returns { content: [...] } not { items: [...] }
        console.log("Content API response:", data);
        setContents(data.content || []);
      }
      if (sourcesRes.ok) {
        const data = await sourcesRes.json();
        setSources(data.items || []);
      }
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContent || selectedTones.length === 0 || selectedLanguages.length === 0) {
      alert("Please select content, at least one tone, and at least one language");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: selectedContent,
          tones: selectedTones,
          languages: selectedLanguages,
          sourceDocIds: selectedSources,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start generation");
      }

      // Reset form and refresh jobs
      setSelectedContent("");
      setSelectedTones(["TP-01"]);
      setSelectedLanguages(["en"]);
      setSelectedSources([]);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  function toggleTone(tone: ToneProfileId) {
    setSelectedTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone]
    );
  }

  function toggleLanguage(lang: SupportedLanguage) {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function toggleSource(sourceId: string) {
    setSelectedSources((prev) =>
      prev.includes(sourceId) ? prev.filter((s) => s !== sourceId) : [...prev, sourceId]
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Generation</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Generate content variants using AI from source documents
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generation Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              New Generation Job
            </h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Generate Button - at top */}
              <button
                type="submit"
                disabled={generating || !selectedContent}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
              >
                {generating ? "Starting..." : "Start Generation"}
              </button>

              {/* Content Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content to Generate
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedContent}
                  onChange={(e) => setSelectedContent(e.target.value)}
                  required
                >
                  <option value="">Select content...</option>
                  {contents.map((content) => (
                    <option key={content.contentId} value={content.contentId}>
                      {content.contentId} - {content.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tones to Generate
                </label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => toggleTone(tone)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTones.includes(tone)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Languages
                </label>
                <div className="flex gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedLanguages.includes(lang)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {lang === "en" ? "English" : "Dutch"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Source Documents (optional)
                </label>
                {sources.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No source documents available.{" "}
                    <Link href="/sources" className="text-blue-600 hover:underline">
                      Parse some documents first →
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <label
                        key={source._id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source._id)}
                          onChange={() => toggleSource(source._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {source.filename}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({source.sectionCount} sections, {source.language.toUpperCase()})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Generation Jobs
            </h2>
            {jobs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No generation jobs yet
              </p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="border dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {job.contentId}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {job.tones.join(", ")} • {job.languages.map((l) => l.toUpperCase()).join(", ")}
                        </p>
                      </div>
                      <JobStatusBadge status={job.status} />
                    </div>
                    {job.status === "running" && job.progress !== undefined && (
                      <div className="mt-2">
                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{job.progress}% complete</p>
                      </div>
                    )}
                    {job.error && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">{job.error}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        colors[status] || colors.pending
      }`}
    >
      {status}
    </span>
  );
}
