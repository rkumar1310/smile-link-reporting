/**
 * Report Generation API Route
 * POST /api/report/generate - Generate a personalized smile report from questionnaire answers
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Questionnaire validation schema
const QuestionnaireSchema = z.object({
  q1_mainReason: z.string().min(1, "Main reason is required"),
  q2_satisfaction: z.number().min(1).max(10),
  q2a_whatBothers: z.string().optional(),
  q3_toothConcerns: z.string().min(1, "Tooth concerns is required"),
  q4_previousTreatments: z.string().min(1, "Previous treatments is required"),
  q5_currentIssues: z.string().min(1, "Current issues is required"),
  q6a_situation: z.string().min(1, "Dental situation is required"),
  q6b_location: z.array(z.string()),
  q6c_neighboringTeeth: z.string().optional(),
  q6d_teethHealth: z.array(z.string()).optional(),
  q7_stylePreference: z.string().min(1, "Style preference is required"),
  q8_naturalImportance: z.string().min(1, "Natural importance is required"),
  q9_ageRange: z.string().min(1, "Age range is required"),
  q10_budget: z.string().min(1, "Budget is required"),
  q11_willingSpecialist: z.string().min(1, "Specialist preference is required"),
  q12_timeline: z.string().min(1, "Timeline is required"),
  q13_pregnancy: z.string().min(1, "Pregnancy status is required"),
  q14_smoking: z.string().min(1, "Smoking status is required"),
  q15_oralHygiene: z.string().min(1, "Oral hygiene is required"),
  q16a_growthComplete: z.string().min(1, "Growth status is required"),
  q16b_recentExtraction: z.string().min(1, "Recent extraction is required"),
  q17_medicalConditions: z.string().min(1, "Medical conditions is required"),
  q18_dentalAnxiety: z.string().min(1, "Dental anxiety is required"),
});

export type QuestionnaireAnswers = z.infer<typeof QuestionnaireSchema>;

/**
 * POST /api/report/generate
 * Generate a personalized smile report from questionnaire answers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const answers = QuestionnaireSchema.parse(body);

    // Generate a unique report ID
    const reportId = `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // TODO: Implement actual report generation logic
    // This could involve:
    // 1. Analyzing answers to determine scenario
    // 2. Looking up relevant content from the CMS
    // 3. Generating personalized report using LLM
    // 4. Storing report in database

    // For now, return a placeholder response
    console.log("Report generation requested:", {
      reportId,
      answers,
    });

    return NextResponse.json({
      success: true,
      reportId,
      message: "Report generation initiated",
      // Include a summary of detected scenario for debugging
      analysis: {
        satisfactionLevel: getSatisfactionLevel(answers.q2_satisfaction),
        hasMissingTeeth: answers.q6a_situation !== "no_missing",
        primaryConcern: answers.q3_toothConcerns,
        stylePreference: answers.q7_stylePreference,
        urgency: answers.q12_timeline,
      },
    });
  } catch (error) {
    console.error("Error generating report:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid questionnaire data",
          details: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

function getSatisfactionLevel(score: number): string {
  if (score <= 4) return "major_dissatisfaction";
  if (score <= 7) return "moderate_dissatisfaction";
  return "minor_concerns";
}
