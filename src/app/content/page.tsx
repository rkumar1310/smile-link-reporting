"use client";

import Link from "next/link";

export default function ContentHubPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage scenarios and text modules for NLG report generation
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scenarios */}
            <Link
              href="/content/scenarios"
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Scenarios
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Clinical case patterns (S00-S17) with NLG variables, treatment options, matching criteria, and pricing
                  </p>
                  <p className="mt-3 text-sm font-medium text-purple-600 dark:text-purple-400">
                    View Scenarios &rarr;
                  </p>
                </div>
              </div>
            </Link>

            {/* Text Modules */}
            <Link
              href="/content/text-modules"
              className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Text Modules
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Banners, context modules, cost blocks, and nuance blocks injected into reports based on driver state
                  </p>
                  <p className="mt-3 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                    View Text Modules &rarr;
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
