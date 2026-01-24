/**
 * Content Workflow API Routes
 * POST /api/content/:id/approve - Handle workflow transitions
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { ContentDocument, ContentStatus, WorkflowAction } from "@/lib/types";
import { WORKFLOW_TRANSITIONS } from "@/lib/types";

// Schema for workflow action
const WorkflowActionSchema = z.object({
  action: z.enum([
    "submit_review",
    "approve",
    "publish",
    "unpublish",
    "reject",
    "archive",
  ]),
  reason: z.string().optional(), // Required for reject
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/content/:id/approve
 * Execute a workflow transition
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = WorkflowActionSchema.parse(body);

    const db = await getDb();

    // Find the content
    let filter: Record<string, unknown> = { contentId: id };
    let content = await db.collection(COLLECTIONS.CONTENT).findOne(filter);

    if (!content && ObjectId.isValid(id)) {
      filter = { _id: new ObjectId(id) };
      content = await db.collection(COLLECTIONS.CONTENT).findOne(filter);
    }

    if (!content) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    const currentStatus = content.status as ContentStatus;

    // Find valid transition
    const transition = WORKFLOW_TRANSITIONS.find(
      (t) => t.from === currentStatus && t.action === action
    );

    if (!transition) {
      return NextResponse.json(
        {
          error: `Invalid workflow transition: cannot "${action}" from "${currentStatus}" status`,
          validActions: WORKFLOW_TRANSITIONS
            .filter((t) => t.from === currentStatus)
            .map((t) => t.action),
        },
        { status: 400 }
      );
    }

    // Validate rejection requires reason
    if (action === "reject" && !reason) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const updateFields: Record<string, unknown> = {
      status: transition.to,
      updatedAt: now,
      updatedBy: "system", // TODO: Replace with authenticated user
    };

    // Set approvedBy when approving
    if (action === "approve") {
      updateFields.approvedBy = "system"; // TODO: Replace with authenticated user
    }

    // Set publishedAt when publishing
    if (action === "publish") {
      updateFields.publishedAt = now;
    }

    // Clear publishedAt when unpublishing
    if (action === "unpublish") {
      updateFields.publishedAt = null;
    }

    // Add to version history when content is approved or published
    if (action === "approve" || action === "publish") {
      const versionHistory = content.versionHistory || [];
      versionHistory.push({
        version: content.version,
        content: JSON.stringify(content.variants),
        changedAt: now,
        changedBy: "system",
        changeReason: `${action}d`,
      });
      updateFields.versionHistory = versionHistory;
    }

    await db.collection(COLLECTIONS.CONTENT).updateOne(filter, { $set: updateFields });

    // Return updated content
    const updated = await db.collection(COLLECTIONS.CONTENT).findOne(filter);

    return NextResponse.json({
      success: true,
      previousStatus: currentStatus,
      newStatus: transition.to,
      action,
      content: updated as unknown as ContentDocument,
    });
  } catch (error) {
    console.error("Error executing workflow:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to execute workflow transition" },
      { status: 500 }
    );
  }
}
