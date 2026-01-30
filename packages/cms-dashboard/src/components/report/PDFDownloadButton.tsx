"use client";

import type { ComposedReport } from "@/lib/types/types/report-generation";

interface PDFDownloadButtonProps {
  report: ComposedReport;
  className?: string;
}

export function PDFDownloadButton({ report, className }: PDFDownloadButtonProps) {
  const handleDownload = () => {
    if (!report.pdfBase64) {
      console.error("No PDF available for this report");
      return;
    }

    // Decode base64 to binary
    const binary = atob(report.pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Create blob and trigger download
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    const shortId = report.id.slice(0, 8);
    link.download = `report-${shortId}-${dateStr}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const isDisabled = !report.pdfBase64;

  return (
    <button
      onClick={handleDownload}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700
                  text-gray-700 dark:text-gray-200 rounded-lg
                  hover:bg-gray-200 dark:hover:bg-gray-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors ${className ?? ""}`}
      title={isDisabled ? "PDF not available" : "Download PDF"}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      Export PDF
    </button>
  );
}

export default PDFDownloadButton;
