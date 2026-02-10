"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ContentStats {
  totalContent: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
}

export default function Home() {
  const [stats, setStats] = useState<ContentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/content?limit=1000");
      if (res.ok) {
        const data = await res.json();
        const content = data.content || [];

        // Calculate stats
        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};

        for (const item of content) {
          byType[item.type] = (byType[item.type] || 0) + 1;
          byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        }

        setStats({
          totalContent: content.length,
          byType,
          byStatus,
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!confirm("Are you sure you want to delete ALL content from the database? This action cannot be undone.")) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch("/api/reset", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert(`Database reset! Deleted: ${data.deleted.content} content items, ${data.deleted.generationJobs} jobs, ${data.deleted.factCheckRecords} fact-check records`);
        await fetchStats();
      } else {
        alert(data.error || "Reset failed");
      }
    } catch (err) {
      alert("Failed to reset database");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Smile-Link Content Management
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Overview */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Content Card */}
            <DashboardCard
              title="Content"
              description="Manage scenarios, modules, and blocks"
              href="/content"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />

            {/* Generation Card */}
            <DashboardCard
              title="Generate"
              description="Create content from source documents"
              href="/generation"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />

            {/* Sources Card */}
            <DashboardCard
              title="Sources"
              description="View and parse source documents"
              href="/sources"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              }
            />

            {/* Report Generator Card */}
            <DashboardCard
              title="Report Generator"
              description="Generate personalized smile reports"
              href="/report-generator"
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          </div>

          {/* Quick Stats */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Content Statistics
            </h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : stats && stats.totalContent > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Total Content" value={stats.totalContent} />
                    <StatCard label="Scenarios" value={stats.byType.scenario || 0} />
                    <StatCard label="Modules" value={stats.byType.module || 0} />
                    <StatCard label="Blocks" value={(stats.byType.a_block || 0) + (stats.byType.b_block || 0)} />
                  </div>
                  <div className="pt-4 border-t dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">By Status</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(stats.byStatus).map(([status, count]) => (
                        <span
                          key={status}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {status}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t dark:border-gray-700">
                    <button
                      onClick={handleReset}
                      disabled={resetting}
                      className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50"
                    >
                      {resetting ? "Resetting..." : "Reset Database"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">
                    No content yet. Generate content using the Report Generator or Generate page.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Workflow Overview */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Content Workflow
            </h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <WorkflowStep status="draft" label="Draft" description="Content being created" />
                <Arrow />
                <WorkflowStep status="review" label="Review" description="Pending approval" />
                <Arrow />
                <WorkflowStep status="approved" label="Approved" description="Ready to publish" />
                <Arrow />
                <WorkflowStep status="published" label="Published" description="Live in reports" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="text-blue-600 dark:text-blue-400 mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function WorkflowStep({
  status,
  label,
  description,
}: {
  status: string;
  label: string;
  description: string;
}) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <div className="text-center">
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}
      >
        {label}
      </span>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

function Arrow() {
  return (
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
