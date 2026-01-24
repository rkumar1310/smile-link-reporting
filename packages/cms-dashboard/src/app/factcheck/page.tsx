"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ContentDocument } from "@/lib/types";

interface FactCheckRecord {
  _id: string;
  contentId: string;
  language: string;
  tone: string;
  claims: {
    claimText: string;
    verdict: "verified" | "unsupported" | "contradicted" | "unverifiable";
    confidence: number;
    sourceMatches: {
      sourceDocId: string;
      excerpt: string;
      section: string;
      similarity: number;
    }[];
    reasoning: string;
  }[];
  overallVerdict: "verified" | "partially_verified" | "unverified" | "contradicted";
  overallConfidence: number;
  humanReviewed: boolean;
  humanReviewedBy?: string;
  humanReviewedAt?: string;
  humanNotes?: string;
  createdAt: string;
}

export default function FactCheckPage() {
  const [contents, setContents] = useState<ContentDocument[]>([]);
  const [factChecks, setFactChecks] = useState<FactCheckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
  const [selectedTone, setSelectedTone] = useState<string>("TP-01");
  const [checking, setChecking] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FactCheckRecord | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [contentRes, factcheckRes] = await Promise.all([
        fetch("/api/content"),
        fetch("/api/factcheck"),
      ]);

      if (contentRes.ok) {
        const data = await contentRes.json();
        // API returns { content: [...] } not { items: [...] }
        setContents(data.content || []);
      }
      if (factcheckRes.ok) {
        const data = await factcheckRes.json();
        setFactChecks(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFactCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContent) {
      alert("Please select content to fact-check");
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/factcheck/${selectedContent}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: selectedLanguage,
          tone: selectedTone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to run fact-check");
      }

      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setChecking(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fact Checking</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Verify content claims against source documents
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fact Check Form */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Run Fact Check
            </h2>
            <form onSubmit={handleFactCheck} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
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
                      {content.contentId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="nl">Dutch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tone
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                  >
                    {["TP-01", "TP-02", "TP-03", "TP-04", "TP-05", "TP-06"].map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={checking || !selectedContent}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {checking ? "Running..." : "Run Fact Check"}
              </button>
            </form>
          </div>

          {/* Fact Check History */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Fact Check Results
            </h2>
            {factChecks.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No fact-check records yet
              </p>
            ) : (
              <div className="space-y-4">
                {factChecks.map((record) => (
                  <div
                    key={record._id}
                    className={`border dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedRecord?._id === record._id ? "ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {record.contentId}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {record.language.toUpperCase()} / {record.tone} • {record.claims.length}{" "}
                          claims
                        </p>
                      </div>
                      <div className="text-right">
                        <VerdictBadge verdict={record.overallVerdict} />
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(record.overallConfidence * 100)}% confidence
                        </p>
                      </div>
                    </div>
                    {record.humanReviewed && (
                      <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                        ✓ Human reviewed
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(record.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detailed View */}
        {selectedRecord && (
          <div className="mt-6 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Detailed Results: {selectedRecord.contentId}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedRecord.language.toUpperCase()} / {selectedRecord.tone}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {selectedRecord.claims.map((claim, index) => (
                <div
                  key={index}
                  className="border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-900 dark:text-white font-medium">
                      Claim {index + 1}
                    </p>
                    <ClaimVerdictBadge verdict={claim.verdict} confidence={claim.confidence} />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3 italic">
                    &ldquo;{claim.claimText}&rdquo;
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <strong>Reasoning:</strong> {claim.reasoning}
                  </p>
                  {claim.sourceMatches.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Source Matches:
                      </p>
                      <div className="space-y-2">
                        {claim.sourceMatches.map((match, matchIndex) => (
                          <div
                            key={matchIndex}
                            className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm"
                          >
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                              {match.section} ({Math.round(match.similarity * 100)}% match)
                            </p>
                            <p className="text-gray-700 dark:text-gray-300">{match.excerpt}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!selectedRecord.humanReviewed && (
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Human Review
                </h3>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Approve Results
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Flag for Review
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const colors: Record<string, string> = {
    verified: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    partially_verified: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    unverified: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    contradicted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        colors[verdict] || colors.unverified
      }`}
    >
      {verdict.replace("_", " ")}
    </span>
  );
}

function ClaimVerdictBadge({
  verdict,
  confidence,
}: {
  verdict: string;
  confidence: number;
}) {
  const colors: Record<string, string> = {
    verified: "text-green-600 dark:text-green-400",
    unsupported: "text-yellow-600 dark:text-yellow-400",
    contradicted: "text-red-600 dark:text-red-400",
    unverifiable: "text-gray-600 dark:text-gray-400",
  };

  return (
    <span className={`text-sm font-medium ${colors[verdict] || colors.unverifiable}`}>
      {verdict} ({Math.round(confidence * 100)}%)
    </span>
  );
}
