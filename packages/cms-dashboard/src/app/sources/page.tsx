"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { SupportedLanguage } from "@/lib/types";

interface EmbedResult {
  mongoDocId: string;
  status: "success" | "error";
  chunksCreated: number;
  error?: string;
}

// New hierarchical scenario types
interface ScenarioSection {
  number: number;
  title: string;
  content: string;
}

interface ParsedScenario {
  scenarioId: string;
  title: string;
  versionId: string | null;
  status: string | null;
  sections: ScenarioSection[];
  pageStart: number;
  pageEnd: number;
}

// Legacy flat section types (for non-scenario documents)
interface ScenarioSubsection {
  number: number;
  title: string;
  content: string;
}

interface ScenarioMetadata {
  scenarioId: string;
  versionId: string | null;
  subsections: ScenarioSubsection[];
}

interface SourceSection {
  id: string;
  title: string;
  content: string;
  level: number;
  metadata?: ScenarioMetadata;
}

interface SourceDocument {
  _id: string;
  filename: string;
  path: string;
  fileHash: string;
  language: SupportedLanguage;
  documentType?: string;
  scenarios?: ParsedScenario[];  // New hierarchical format
  sections: SourceSection[];      // Legacy flat format
  parsedAt: string;
  parsedVersion?: string;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [embedStatus, setEmbedStatus] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<SourceDocument | null>(null);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSources();
  }, []);

  async function fetchSources() {
    setLoading(true);
    try {
      const res = await fetch("/api/sources");
      if (res.ok) {
        const data = await res.json();
        setSources(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch sources:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleParseDocs(forceReparse: boolean = false) {
    setParsing(true);
    try {
      const res = await fetch("/api/sources/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directory: "reference-docs/all-content",
          forceReparse,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse documents");
      }

      const data = await res.json();
      const message = forceReparse
        ? `Force re-parsed ${data.parsed} documents (${data.skipped} skipped, ${data.errors} errors)`
        : `Parsed ${data.parsed} new documents (${data.skipped} unchanged)`;
      alert(message);
      await fetchSources();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setParsing(false);
    }
  }

  async function handleEmbedDocs(mongoDocIds?: string[]) {
    setEmbedding(true);
    setEmbedStatus("Starting embedding...");
    try {
      const res = await fetch("/api/sources/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mongoDocIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to embed documents");
      }

      const data = await res.json();
      const results = data.results as EmbedResult[];
      const successful = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "error").length;

      setEmbedStatus(
        `Embedded ${successful} documents (${data.totalChunks} chunks)${failed > 0 ? `, ${failed} failed` : ""}`
      );

      setTimeout(() => setEmbedStatus(null), 5000);
    } catch (err) {
      setEmbedStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      setTimeout(() => setEmbedStatus(null), 5000);
    } finally {
      setEmbedding(false);
    }
  }

  function toggleScenario(scenarioId: string) {
    setExpandedScenarios((prev) => {
      const next = new Set(prev);
      if (next.has(scenarioId)) {
        next.delete(scenarioId);
      } else {
        next.add(scenarioId);
      }
      return next;
    });
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  // Helper to get item count for display
  function getItemCount(source: SourceDocument): string {
    if (source.scenarios && source.scenarios.length > 0) {
      return `${source.scenarios.length} scenarios`;
    }
    return `${source.sections.length} sections`;
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Source Documents
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Parsed reference documents used for content generation and fact-checking
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <button
                  onClick={() => handleParseDocs(false)}
                  disabled={parsing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {parsing ? "Parsing..." : "Parse New"}
                </button>
                <button
                  onClick={() => handleParseDocs(true)}
                  disabled={parsing}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {parsing ? "Parsing..." : "Force Re-parse All"}
                </button>
                <button
                  onClick={() => handleEmbedDocs()}
                  disabled={embedding || sources.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {embedding ? "Embedding..." : "Embed All"}
                </button>
              </div>
              {embedStatus && (
                <span className={`text-sm ${embedStatus.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                  {embedStatus}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {sources.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              No Source Documents
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Parse DOCX files from the reference-docs directory to get started.
            </p>
            <button
              onClick={() => handleParseDocs(false)}
              disabled={parsing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {parsing ? "Parsing..." : "Parse Reference Documents"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document List */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Documents ({sources.length})
              </h2>
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source._id}
                    className={`border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedSource?._id === source._id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedSource(source)}
                  >
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {source.filename}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {getItemCount(source)}
                      </span>
                      <div className="flex items-center gap-2">
                        {source.documentType && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 rounded text-purple-700 dark:text-purple-300">
                            {source.documentType}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                          {source.language.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Parsed: {new Date(source.parsedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Viewer */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              {selectedSource ? (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedSource.filename}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedSource.path}
                      </p>
                      {selectedSource.parsedVersion && (
                        <p className="text-xs text-gray-400 mt-1">
                          Parser v{selectedSource.parsedVersion}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEmbedDocs([selectedSource._id])}
                        disabled={embedding}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {embedding ? "..." : "Embed"}
                      </button>
                      <button
                        onClick={() => setSelectedSource(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {/* New hierarchical scenario view */}
                    {selectedSource.scenarios && selectedSource.scenarios.length > 0 ? (
                      selectedSource.scenarios.map((scenario) => (
                        <div
                          key={scenario.scenarioId}
                          className="border dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          {/* Scenario Header */}
                          <button
                            onClick={() => toggleScenario(scenario.scenarioId)}
                            className="w-full px-4 py-3 flex justify-between items-center bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
                                {scenario.scenarioId}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {scenario.title.replace(/^Scenario\s+S\d+\s*[—–-]\s*/i, "")}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              {scenario.status && (
                                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                  {scenario.status.split("—")[0].trim()}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {scenario.sections.length} sections
                              </span>
                              <span className="text-gray-400">
                                {expandedScenarios.has(scenario.scenarioId) ? "▼" : "▶"}
                              </span>
                            </div>
                          </button>

                          {/* Expanded Scenario Content */}
                          {expandedScenarios.has(scenario.scenarioId) && (
                            <div className="bg-white dark:bg-gray-800">
                              {/* Scenario metadata */}
                              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                  {scenario.versionId && (
                                    <span>Version: <span className="font-mono">{scenario.versionId}</span></span>
                                  )}
                                  {scenario.status && (
                                    <span>Status: {scenario.status}</span>
                                  )}
                                  <span>Pages: {scenario.pageStart}-{scenario.pageEnd}</span>
                                </div>
                              </div>

                              {/* Sections list */}
                              <div className="divide-y dark:divide-gray-700">
                                {scenario.sections.map((section) => {
                                  const sectionKey = `${scenario.scenarioId}-${section.number}`;
                                  return (
                                    <div key={sectionKey}>
                                      <button
                                        onClick={() => toggleSection(sectionKey)}
                                        className="w-full px-4 py-2 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                      >
                                        <span className="text-sm text-gray-800 dark:text-gray-200">
                                          <span className="font-semibold text-gray-500 dark:text-gray-400 mr-2">
                                            {section.number}.
                                          </span>
                                          {section.title}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-400">
                                            {section.content.length} chars
                                          </span>
                                          <span className="text-gray-400 text-xs">
                                            {expandedSections.has(sectionKey) ? "▼" : "▶"}
                                          </span>
                                        </div>
                                      </button>
                                      {expandedSections.has(sectionKey) && (
                                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-l-4 border-blue-500 ml-4 mr-4 mb-2 rounded">
                                          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
                                            {section.content}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      /* Legacy flat sections view */
                      selectedSource.sections.map((section) => (
                        <div
                          key={section.id}
                          className="border dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2" style={{ paddingLeft: `${(section.level - 1) * 16}px` }}>
                              {section.metadata?.scenarioId && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded">
                                  {section.metadata.scenarioId}
                                </span>
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {section.metadata?.scenarioId
                                  ? section.title.replace(/^Scenario\s+S\d+\s*[—–-]\s*/i, "")
                                  : section.title || "(Untitled Section)"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {section.metadata?.subsections && (
                                <span className="text-xs text-gray-500">
                                  {section.metadata.subsections.length} parts
                                </span>
                              )}
                              <span className="text-gray-400">
                                {expandedSections.has(section.id) ? "▼" : "▶"}
                              </span>
                            </div>
                          </button>
                          {expandedSections.has(section.id) && (
                            <div className="px-4 py-3 bg-white dark:bg-gray-800">
                              {/* Scenario metadata header */}
                              {section.metadata && (
                                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                                      {section.metadata.scenarioId}
                                    </span>
                                    {section.metadata.versionId && (
                                      <span className="text-blue-600 dark:text-blue-400">
                                        Version: {section.metadata.versionId}
                                      </span>
                                    )}
                                    <span className="text-blue-500 dark:text-blue-400">
                                      {section.metadata.subsections?.length || 0} subsections
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Scenario subsections */}
                              {section.metadata?.subsections && section.metadata.subsections.length > 0 ? (
                                <div className="space-y-3">
                                  {section.metadata.subsections.map((sub) => (
                                    <div key={sub.number} className="border-l-2 border-gray-200 dark:border-gray-600 pl-3">
                                      <h4 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                        {sub.number}. {sub.title}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                                        {sub.content.substring(0, 300)}{sub.content.length > 300 ? "..." : ""}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto">
                                  {section.content}
                                </pre>
                              )}

                              <p className="text-xs text-gray-400 mt-4 pt-2 border-t dark:border-gray-700">
                                Section ID: {section.id} | {section.content.length} characters
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>Select a document to view its contents</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
