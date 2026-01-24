/**
 * Test Cases API Route
 * GET /api/test-cases/[filename] - Get a test case file
 */

import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validate filename to prevent directory traversal
    if (!filename.endsWith(".json") || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    // Resolve path to test_reports/inputs directory
    const projectRoot = process.cwd();
    const rootPath = projectRoot.includes("cms-dashboard")
      ? path.resolve(projectRoot, "..", "..")
      : projectRoot;
    const filePath = path.join(rootPath, "test_reports", "inputs", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Test case not found" },
        { status: 404 }
      );
    }

    // Read and parse the JSON file
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading test case:", error);
    return NextResponse.json(
      { error: "Failed to read test case" },
      { status: 500 }
    );
  }
}
