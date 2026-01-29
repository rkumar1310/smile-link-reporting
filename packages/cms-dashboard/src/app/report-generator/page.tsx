"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ReportGenerationProgress } from "@/components/report/ReportGenerationProgress";
import { ReportDisplay } from "@/components/report/ReportDisplay";
import type { ReportPhase, ReportPhaseEvent, ComposedReport, IntakeAnswers, LLMEvaluationData } from "@/lib/types/types/report-generation";

// Question option types
interface Option {
  value: string;
  label: string;
}

// Test case type
interface TestCase {
  id: string;
  filename: string;
  description: string;
  intake: {
    answers: Array<{ question_id: string; answer: string | string[] }>;
  };
}

// Form state type
interface QuestionnaireAnswers {
  q1_mainReason: string;
  q2_satisfaction: number;
  q2a_whatBothers: string;
  q3_toothConcerns: string;
  q4_previousTreatments: string;
  q5_currentIssues: string;
  q6a_situation: string;
  q6b_location: string[];
  q6c_neighboringTeeth: string;
  q6d_teethHealth: string[];
  q7_stylePreference: string;
  q8_naturalImportance: string;
  q9_ageRange: string;
  q10_budget: string;
  q11_willingSpecialist: string;
  q12_timeline: string;
  q13_pregnancy: string;
  q14_smoking: string;
  q15_oralHygiene: string;
  q16a_growthComplete: string;
  q16b_recentExtraction: string;
  q17_medicalConditions: string;
  q18_dentalAnxiety: string;
}

// Predefined test cases
const TEST_CASES: TestCase[] = [
  { id: "case_01", filename: "case_01_single_tooth_first_timer.json", description: "Case 1: Single tooth, first-timer", intake: { answers: [] } },
  { id: "case_02", filename: "case_02_urgent_pain_multiple_teeth.json", description: "Case 2: Urgent pain, multiple teeth", intake: { answers: [] } },
  { id: "case_03", filename: "case_03_premium_aesthetic.json", description: "Case 3: Premium aesthetic", intake: { answers: [] } },
  { id: "case_04", filename: "case_04_elderly_full_mouth.json", description: "Case 4: Elderly, full mouth", intake: { answers: [] } },
  { id: "case_05", filename: "case_05_young_professional_implant.json", description: "Case 5: Young professional, implant", intake: { answers: [] } },
  { id: "case_06", filename: "case_06_pregnancy_consultation.json", description: "Case 6: Pregnancy consultation", intake: { answers: [] } },
  { id: "case_07", filename: "case_07_smoker_risk_factors.json", description: "Case 7: Smoker, risk factors", intake: { answers: [] } },
  { id: "case_08", filename: "case_08_dental_anxiety_severe.json", description: "Case 8: Severe dental anxiety", intake: { answers: [] } },
];

// Question options - values match test case format
const Q1_OPTIONS: Option[] = [
  { value: "insecure_confidence", label: "I feel insecure about my teeth and want more confidence" },
  { value: "discoloured_damaged", label: "My teeth are discoloured, damaged, or worn down" },
  { value: "functional_issues", label: "I have functional issues such as pain, loose teeth, or chewing problems" },
  { value: "missing_teeth_long_term", label: "I am missing teeth and want a long-term solution" },
  { value: "beautiful_youthful", label: "I want a more beautiful and youthful-looking smile" },
  { value: "complete_transformation", label: "I want a complete transformation of my smile" },
  { value: "missing_improve_colour", label: "I am missing teeth and I also want to improve colour, shape, or alignment" },
];

const Q2A_OPTIONS: Option[] = [
  { value: "esthetics", label: "Esthetics - colour, shape, alignment, or old restorations" },
  { value: "chewing_missing", label: "Chewing function / missing teeth - difficulty eating, loose teeth, pain" },
  { value: "both", label: "Both esthetics and chewing function" },
];

const Q3_OPTIONS: Option[] = [
  { value: "discoloured_dull", label: "My teeth are discoloured or dull" },
  { value: "crooked_uneven", label: "My teeth are crooked or uneven" },
  { value: "missing_damaged", label: "I am missing teeth or have damaged teeth" },
  { value: "size_harmony", label: "My teeth are too small, too big, or not in harmony with my face" },
  { value: "bite_off", label: "My bite feels off (overbite, underbite, crossbite)" },
  { value: "gums_receding", label: "My gums are receding or uneven" },
  { value: "loose_pain_chewing", label: "My teeth feel uncomfortable (loose teeth, pain, difficulty chewing)" },
  { value: "both_missing_esthetic", label: "Both missing teeth and esthetic concerns" },
];

const Q4_OPTIONS: Option[] = [
  { value: "no_never", label: "No, never" },
  { value: "yes_implants", label: "Yes, implants" },
  { value: "yes_veneers_crowns", label: "Yes, veneers or crowns" },
  { value: "yes_orthodontics", label: "Yes, orthodontics (braces)" },
  { value: "yes_periodontal", label: "Yes, periodontal treatment (gum treatment)" },
];

const Q5_OPTIONS: Option[] = [
  { value: "yes_pain", label: "Yes, I have tooth pain or discomfort" },
  { value: "yes_infection", label: "Yes, I have an infection" },
  { value: "yes_loose_missing", label: "Yes, I have loose or missing teeth" },
  { value: "no_aesthetic_only", label: "No, I am only looking for an esthetic solution" },
];

const Q6A_OPTIONS: Option[] = [
  { value: "no_missing", label: "No missing teeth (I want to improve colour, shape, or alignment)" },
  { value: "one_missing", label: "One tooth is missing" },
  { value: "2_4_adjacent", label: "2-4 teeth missing next to each other (adjacent)" },
  { value: "2_4_non_adjacent", label: "2-4 teeth missing in different areas (non-adjacent)" },
  { value: "mix", label: "A mix: some missing next to each other, some spread out" },
  { value: "5_plus_one_jaw", label: "5 or more teeth missing in one jaw" },
  { value: "most_poor", label: "Most teeth are in poor condition or cannot be saved" },
];

const Q6B_OPTIONS: Option[] = [
  { value: "front_aesthetic_zone", label: "Front teeth (esthetic zone)" },
  { value: "side_chewing", label: "Side or chewing area (premolars/molars)" },
  { value: "both", label: "Both front and side/chewing area" },
];

const Q6C_OPTIONS: Option[] = [
  { value: "intact", label: "Intact (few or no large fillings, no crowns needed)" },
  { value: "partially_restored", label: "Partially filled or moderately restored" },
  { value: "heavily_restored", label: "Heavily restored or likely to need crowns" },
];

const Q6D_OPTIONS: Option[] = [
  { value: "mostly_intact_enamel", label: "Mostly intact enamel (few or no large fillings)" },
  { value: "large_fillings_old_restorations", label: "Large fillings or old restorations" },
  { value: "cracks_wear", label: "Cracks or wear" },
  { value: "root_canal", label: "Root canal treatment performed" },
  { value: "severe_discoloration", label: "Severe discolouration (e.g., tetracycline)" },
  { value: "bruxism", label: "Grinding or clenching (bruxism)" },
];

const Q7_OPTIONS: Option[] = [
  { value: "natural_subtle", label: "Natural and subtle smile" },
  { value: "hollywood", label: "Hollywood smile" },
  { value: "classic_elegant", label: "Classic and elegant" },
  { value: "functional_durable", label: "Functional and durable" },
];

const Q8_OPTIONS: Option[] = [
  { value: "very_important_natural", label: "Very important - it must look as natural as possible" },
  { value: "hollywood_bright_white", label: "I prefer a Hollywood smile with bright white, symmetrical teeth" },
  { value: "best_price_quality_flexible", label: "I want the best price-quality ratio and am open to different options" },
];

const Q9_OPTIONS: Option[] = [
  { value: "under_30", label: "Under 30 years" },
  { value: "30_45", label: "30-45 years" },
  { value: "45_60", label: "45-60 years" },
  { value: "60_plus", label: "60+ years" },
];

const Q10_OPTIONS: Option[] = [
  { value: "premium_best_result", label: "I want a premium solution and the best possible result" },
  { value: "price_quality_flexible", label: "I want the best price-quality ratio and am flexible" },
  { value: "affordable_durable", label: "I want an affordable yet durable solution" },
  { value: "cost_estimate_first", label: "I prefer to receive a cost estimate before deciding" },
];

const Q11_OPTIONS: Option[] = [
  { value: "yes_for_best_result", label: "Yes, if it gives me the best possible result" },
  { value: "maybe_need_info", label: "Maybe, I want more information first" },
  { value: "ai_report_first", label: "I would first like an AI Smile Report to understand which treatment suits me best" },
];

const Q12_OPTIONS: Option[] = [
  { value: "1_3_months", label: "Within 1-3 months" },
  { value: "6_months", label: "Within 6 months" },
  { value: "1_year", label: "Within 1 year" },
  { value: "still_exploring", label: "I am still exploring" },
];

const Q13_OPTIONS: Option[] = [
  { value: "no", label: "No" },
  { value: "yes_pregnant", label: "Yes, I am pregnant" },
  { value: "possibly_6_months", label: "Not pregnant, but possibly within 6 months" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

const Q14_OPTIONS: Option[] = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
];

const Q15_OPTIONS: Option[] = [
  { value: "good", label: "Good (daily brushing + interdental cleaning)" },
  { value: "basic", label: "Basic (daily brushing)" },
  { value: "irregular", label: "Irregular" },
  { value: "poor", label: "Poor" },
];

const Q16A_OPTIONS: Option[] = [
  { value: "yes_incomplete", label: "Yes" },
  { value: "no_complete", label: "No" },
];

const Q16B_OPTIONS: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const Q17_OPTIONS: Option[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

const Q18_OPTIONS: Option[] = [
  { value: "no", label: "No" },
  { value: "yes_mild", label: "Yes, mild anxiety" },
  { value: "yes_severe", label: "Yes, severe anxiety" },
];

// Helper to convert answer values to human-readable labels
function getAnswerLabel(value: string | string[] | number, options?: Option[]): string {
  if (typeof value === "number") return value.toString();
  if (!options) return Array.isArray(value) ? value.join(", ") : value;
  if (Array.isArray(value)) {
    return value.map(v => options.find(o => o.value === v)?.label ?? v).join(", ");
  }
  return options.find(o => o.value === value)?.label ?? value;
}

// Default empty answers
const EMPTY_ANSWERS: QuestionnaireAnswers = {
  q1_mainReason: "",
  q2_satisfaction: 5,
  q2a_whatBothers: "",
  q3_toothConcerns: "",
  q4_previousTreatments: "",
  q5_currentIssues: "",
  q6a_situation: "",
  q6b_location: [],
  q6c_neighboringTeeth: "",
  q6d_teethHealth: [],
  q7_stylePreference: "",
  q8_naturalImportance: "",
  q9_ageRange: "",
  q10_budget: "",
  q11_willingSpecialist: "",
  q12_timeline: "",
  q13_pregnancy: "",
  q14_smoking: "",
  q15_oralHygiene: "",
  q16a_growthComplete: "",
  q16b_recentExtraction: "",
  q17_medicalConditions: "",
  q18_dentalAnxiety: "",
};

// Phase state interface
interface PhaseState {
  phase: ReportPhase;
  status: "pending" | "active" | "complete" | "error" | "skipped";
  message?: string;
  data?: Record<string, unknown>;
}

// Page view states
type ViewState = "form" | "generating" | "complete";

// Convert form answers to intake format
function formToIntake(answers: QuestionnaireAnswers): IntakeAnswers {
  const intakeAnswers: Array<{ question_id: string; answer: string | string[] }> = [];

  // Map each form field to its question ID
  if (answers.q1_mainReason) intakeAnswers.push({ question_id: "Q1", answer: answers.q1_mainReason });
  intakeAnswers.push({ question_id: "Q2", answer: answers.q2_satisfaction.toString() });
  if (answers.q2a_whatBothers) intakeAnswers.push({ question_id: "Q2a", answer: answers.q2a_whatBothers });
  if (answers.q3_toothConcerns) intakeAnswers.push({ question_id: "Q3", answer: [answers.q3_toothConcerns] });
  if (answers.q4_previousTreatments) intakeAnswers.push({ question_id: "Q4", answer: [answers.q4_previousTreatments] });
  if (answers.q5_currentIssues) intakeAnswers.push({ question_id: "Q5", answer: answers.q5_currentIssues });
  if (answers.q6a_situation) intakeAnswers.push({ question_id: "Q6a", answer: answers.q6a_situation });
  if (answers.q6b_location.length > 0) intakeAnswers.push({ question_id: "Q6b", answer: answers.q6b_location[0] });
  if (answers.q6c_neighboringTeeth) intakeAnswers.push({ question_id: "Q6c", answer: answers.q6c_neighboringTeeth });
  if (answers.q6d_teethHealth.length > 0) intakeAnswers.push({ question_id: "Q6d", answer: answers.q6d_teethHealth });
  if (answers.q7_stylePreference) intakeAnswers.push({ question_id: "Q7", answer: answers.q7_stylePreference });
  if (answers.q8_naturalImportance) intakeAnswers.push({ question_id: "Q8", answer: answers.q8_naturalImportance });
  if (answers.q9_ageRange) intakeAnswers.push({ question_id: "Q9", answer: answers.q9_ageRange });
  if (answers.q10_budget) intakeAnswers.push({ question_id: "Q10", answer: answers.q10_budget });
  if (answers.q11_willingSpecialist) intakeAnswers.push({ question_id: "Q11", answer: answers.q11_willingSpecialist });
  if (answers.q12_timeline) intakeAnswers.push({ question_id: "Q12", answer: answers.q12_timeline });
  if (answers.q13_pregnancy) intakeAnswers.push({ question_id: "Q13", answer: answers.q13_pregnancy });
  if (answers.q14_smoking) intakeAnswers.push({ question_id: "Q14", answer: answers.q14_smoking });
  if (answers.q15_oralHygiene) intakeAnswers.push({ question_id: "Q15", answer: answers.q15_oralHygiene });
  if (answers.q16a_growthComplete) intakeAnswers.push({ question_id: "Q16a", answer: answers.q16a_growthComplete });
  if (answers.q16b_recentExtraction) intakeAnswers.push({ question_id: "Q16b", answer: answers.q16b_recentExtraction });
  if (answers.q17_medicalConditions) intakeAnswers.push({ question_id: "Q17", answer: answers.q17_medicalConditions });
  if (answers.q18_dentalAnxiety) intakeAnswers.push({ question_id: "Q18", answer: answers.q18_dentalAnxiety });

  return {
    session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    answers: intakeAnswers,
    metadata: {
      patient_name: "Patient",
    },
  };
}

export default function ReportGeneratorPage() {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(EMPTY_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<string>("");
  const [loadingTestCase, setLoadingTestCase] = useState(false);
  const [useMockMode, setUseMockMode] = useState(false); // Set to false to use real generation
  const [language, setLanguage] = useState<"en" | "nl">("en"); // Report language

  // Generative UI state
  const [viewState, setViewState] = useState<ViewState>("form");
  const [phases, setPhases] = useState<PhaseState[]>([]);
  const [currentPhase, setCurrentPhase] = useState<ReportPhase | undefined>();
  const [report, setReport] = useState<ComposedReport | null>(null);
  const [llmEvaluation, setLlmEvaluation] = useState<LLMEvaluationData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize phases for progress display
  const initializePhases = useCallback(() => {
    setPhases([
      { phase: "analyzing", status: "pending" },
      { phase: "tone", status: "pending" },
      { phase: "content-check", status: "pending" },
      { phase: "generating", status: "pending" },
      { phase: "composing", status: "pending" },
    ]);
  }, []);

  // Handle SSE events
  const handlePhaseEvent = useCallback((event: ReportPhaseEvent) => {
    setPhases((prev) => {
      const newPhases = [...prev];
      const phaseIndex = newPhases.findIndex((p) => p.phase === event.phase);

      if (phaseIndex !== -1) {
        // Mark current phase as active
        newPhases[phaseIndex] = {
          ...newPhases[phaseIndex],
          status: event.phase === "complete" ? "complete" : event.phase === "error" ? "error" : "active",
          message: event.message,
          data: "data" in event ? event.data as Record<string, unknown> : undefined,
        };

        // Mark previous phases as complete (if not already)
        for (let i = 0; i < phaseIndex; i++) {
          if (newPhases[i].status === "active" || newPhases[i].status === "pending") {
            newPhases[i] = { ...newPhases[i], status: "complete" };
          }
        }
      }

      return newPhases;
    });

    setCurrentPhase(event.phase);

    // Handle completion
    if (event.phase === "complete" && "data" in event && event.data?.report) {
      setReport(event.data.report as ComposedReport);
      // Extract LLM evaluation if present
      if (event.data.llmEvaluation) {
        setLlmEvaluation(event.data.llmEvaluation as LLMEvaluationData);
      }
      setViewState("complete");
    }

    // Handle error
    if (event.phase === "error" && "data" in event) {
      setError((event.data as { error?: string })?.error || "An error occurred");
    }
  }, []);

  // Start report generation with SSE
  const startGeneration = useCallback(async () => {
    // Reset state
    setError(null);
    setReport(null);
    initializePhases();
    setViewState("generating");

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const intake = formToIntake(answers);

      const url = useMockMode
        ? "/api/report/generate/stream?mock=true"
        : "/api/report/generate/stream?pipeline=true";  // Use new core pipeline

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake, language }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start report generation");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              handlePhaseEvent(data as ReportPhaseEvent);
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled
        setViewState("form");
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [answers, initializePhases, handlePhaseEvent, useMockMode]);

  // Cancel generation
  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setViewState("form");
  }, []);

  // Retry after error
  const handleRetry = useCallback(() => {
    startGeneration();
  }, [startGeneration]);

  // Go back to form
  const handleGenerateNew = useCallback(() => {
    setViewState("form");
    setReport(null);
    setLlmEvaluation(null);
    setPhases([]);
    setCurrentPhase(undefined);
    setError(null);
  }, []);

  // Load test case data when selected
  async function loadTestCase(caseId: string) {
    if (!caseId) {
      setAnswers(EMPTY_ANSWERS);
      return;
    }

    const testCase = TEST_CASES.find((tc) => tc.id === caseId);
    if (!testCase) return;

    setLoadingTestCase(true);
    try {
      const res = await fetch(`/api/test-cases/${testCase.filename}`);
      if (!res.ok) throw new Error("Failed to load test case");

      const data = await res.json();
      const loaded = parseTestCaseAnswers(data.intake.answers);
      setAnswers(loaded);
    } catch (err) {
      console.error("Failed to load test case:", err);
      setError("Failed to load test case");
    } finally {
      setLoadingTestCase(false);
    }
  }

  // Parse test case answers into form state
  function parseTestCaseAnswers(testAnswers: Array<{ question_id: string; answer: string | string[] }>): QuestionnaireAnswers {
    const result = { ...EMPTY_ANSWERS };

    for (const { question_id, answer } of testAnswers) {
      const val = Array.isArray(answer) ? answer[0] : answer;
      const arrVal = Array.isArray(answer) ? answer : [answer];

      switch (question_id) {
        case "Q1": result.q1_mainReason = val; break;
        case "Q2": result.q2_satisfaction = parseInt(val) || 5; break;
        case "Q2a": result.q2a_whatBothers = val; break;
        case "Q3": result.q3_toothConcerns = val; break;
        case "Q4": result.q4_previousTreatments = val; break;
        case "Q5": result.q5_currentIssues = val; break;
        case "Q6a": result.q6a_situation = val; break;
        case "Q6b": result.q6b_location = arrVal; break;
        case "Q6c": result.q6c_neighboringTeeth = val; break;
        case "Q6d": result.q6d_teethHealth = arrVal; break;
        case "Q7": result.q7_stylePreference = val; break;
        case "Q8": result.q8_naturalImportance = val; break;
        case "Q9": result.q9_ageRange = val; break;
        case "Q10": result.q10_budget = val; break;
        case "Q11": result.q11_willingSpecialist = val; break;
        case "Q12": result.q12_timeline = val; break;
        case "Q13": result.q13_pregnancy = val; break;
        case "Q14": result.q14_smoking = val; break;
        case "Q15": result.q15_oralHygiene = val; break;
        case "Q16a": result.q16a_growthComplete = val; break;
        case "Q16b": result.q16b_recentExtraction = val; break;
        case "Q17": result.q17_medicalConditions = val; break;
        case "Q18": result.q18_dentalAnxiety = val; break;
      }
    }

    return result;
  }

  function updateAnswer<K extends keyof QuestionnaireAnswers>(key: K, value: QuestionnaireAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMultiSelect(key: "q6b_location" | "q6d_teethHealth", value: string) {
    setAnswers((prev) => {
      const current = prev[key];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      }
      return { ...prev, [key]: [...current, value] };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startGeneration();
  }

  // Conditional visibility helpers
  const showQ2a = answers.q2_satisfaction <= 7;
  const showQ6c = answers.q6a_situation !== "no_missing" && answers.q6a_situation !== "";
  const showQ6d = answers.q6a_situation === "no_missing";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mb-2 block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Report Generator
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Complete the questionnaire to generate your personalized Smile Report
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* View: Generating - Show progress UI */}
        {viewState === "generating" && (
          <div className="space-y-6">
            <ReportGenerationProgress
              phases={phases}
              currentPhase={currentPhase}
              error={error || undefined}
              onRetry={handleRetry}
            />
            <div className="flex justify-center">
              <button
                onClick={cancelGeneration}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* View: Complete - Show report with Q&A sidebar */}
        {viewState === "complete" && report && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report - 2/3 on large screens */}
            <div className="lg:col-span-2">
              <ReportDisplay report={report} llmEvaluation={llmEvaluation ?? undefined} onGenerateNew={handleGenerateNew} />
            </div>
            {/* Q&A Panel - 1/3 on large screens */}
            <div className="lg:col-span-1">
              <IntakeAnswersPanel answers={answers} />
            </div>
          </div>
        )}

        {/* View: Form - Show questionnaire */}
        {viewState === "form" && (
          <>
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Test Case Selector and Mock Mode Toggle */}
            <div className="mb-6 bg-white dark:bg-gray-800 shadow rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Load Test Case:
                </label>
                <select
                  value={selectedTestCase}
                  onChange={(e) => {
                    setSelectedTestCase(e.target.value);
                    loadTestCase(e.target.value);
                  }}
                  disabled={loadingTestCase}
                  className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                >
                  <option value="">-- Select a test case --</option>
                  {TEST_CASES.map((tc) => (
                    <option key={tc.id} value={tc.id}>
                      {tc.description}
                    </option>
                  ))}
                </select>
                {loadingTestCase && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                )}
                {selectedTestCase && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTestCase("");
                      setAnswers(EMPTY_ANSWERS);
                    }}
                    className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Language Selector */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Output Language
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Language for generated report (sources are always Dutch)
                  </p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "nl")}
                  className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                >
                  <option value="en">English</option>
                  <option value="nl">Dutch (Nederlands)</option>
                </select>
              </div>

              {/* Mock Mode Toggle */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mock Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Use simulated data for UI testing (no LLM calls)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUseMockMode(!useMockMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useMockMode ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useMockMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Questionnaire Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
            {/* Generate Button - at top */}
            <div className="sticky top-4 z-10">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg shadow-lg"
              >
                {loading ? "Generating Report..." : "Generate Report"}
              </button>
            </div>

            {/* Q1: Main reason */}
            <QuestionCard number={1} title="What is the main reason you want to improve your smile?">
              <RadioGroup
                options={Q1_OPTIONS}
                value={answers.q1_mainReason}
                onChange={(v) => updateAnswer("q1_mainReason", v)}
              />
            </QuestionCard>

            {/* Q2: Satisfaction */}
            <QuestionCard number={2} title="How satisfied are you with your smile today?">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">1 (Very dissatisfied)</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={answers.q2_satisfaction}
                    onChange={(e) => updateAnswer("q2_satisfaction", parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">10 (Completely satisfied)</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{answers.q2_satisfaction}</span>
                </div>
              </div>
            </QuestionCard>

            {/* Q2a: What bothers you most (conditional) */}
            {showQ2a && (
              <QuestionCard number="2a" title="What bothers you most about your smile today?">
                <RadioGroup
                  options={Q2A_OPTIONS}
                  value={answers.q2a_whatBothers}
                  onChange={(v) => updateAnswer("q2a_whatBothers", v)}
                />
              </QuestionCard>
            )}

            {/* Q3: What bothers you most */}
            <QuestionCard number={3} title="What bothers you most about your teeth?">
              <RadioGroup
                options={Q3_OPTIONS}
                value={answers.q3_toothConcerns}
                onChange={(v) => updateAnswer("q3_toothConcerns", v)}
              />
            </QuestionCard>

            {/* Q4: Previous treatments */}
            <QuestionCard number={4} title="Have you had any dental treatments before?">
              <RadioGroup
                options={Q4_OPTIONS}
                value={answers.q4_previousTreatments}
                onChange={(v) => updateAnswer("q4_previousTreatments", v)}
              />
            </QuestionCard>

            {/* Q5: Current issues */}
            <QuestionCard number={5} title="Are you currently experiencing pain, infections, or loose teeth?">
              <RadioGroup
                options={Q5_OPTIONS}
                value={answers.q5_currentIssues}
                onChange={(v) => updateAnswer("q5_currentIssues", v)}
              />
            </QuestionCard>

            {/* Q6: Situation and dental status */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                6. Situation and dental status
              </h3>

              {/* Q6a */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  6a. What is the current situation of the teeth you want treated?
                </label>
                <RadioGroup
                  options={Q6A_OPTIONS}
                  value={answers.q6a_situation}
                  onChange={(v) => updateAnswer("q6a_situation", v)}
                />
              </div>

              {/* Q6b */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  6b. Where is this mainly located? (You may choose multiple)
                </label>
                <CheckboxGroup
                  options={Q6B_OPTIONS}
                  values={answers.q6b_location}
                  onChange={(v) => toggleMultiSelect("q6b_location", v)}
                />
              </div>

              {/* Q6c (conditional - shown if teeth are missing) */}
              {showQ6c && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    6c. What is the condition of the neighbouring teeth?
                  </label>
                  <RadioGroup
                    options={Q6C_OPTIONS}
                    value={answers.q6c_neighboringTeeth}
                    onChange={(v) => updateAnswer("q6c_neighboringTeeth", v)}
                  />
                </div>
              )}

              {/* Q6d (conditional - shown if no teeth missing) */}
              {showQ6d && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    6d. How healthy and strong are the teeth you want to improve esthetically? (Multiple answers allowed)
                  </label>
                  <CheckboxGroup
                    options={Q6D_OPTIONS}
                    values={answers.q6d_teethHealth}
                    onChange={(v) => toggleMultiSelect("q6d_teethHealth", v)}
                  />
                </div>
              )}
            </div>

            {/* Q7: Style preference */}
            <QuestionCard number={7} title="Which style of smile appeals to you the most?">
              <RadioGroup
                options={Q7_OPTIONS}
                value={answers.q7_stylePreference}
                onChange={(v) => updateAnswer("q7_stylePreference", v)}
              />
            </QuestionCard>

            {/* Q8: Natural importance */}
            <QuestionCard number={8} title="How important is a natural-looking result to you?">
              <RadioGroup
                options={Q8_OPTIONS}
                value={answers.q8_naturalImportance}
                onChange={(v) => updateAnswer("q8_naturalImportance", v)}
              />
            </QuestionCard>

            {/* Q9: Age */}
            <QuestionCard number={9} title="What is your age?">
              <RadioGroup
                options={Q9_OPTIONS}
                value={answers.q9_ageRange}
                onChange={(v) => updateAnswer("q9_ageRange", v)}
              />
            </QuestionCard>

            {/* Q10: Budget */}
            <QuestionCard number={10} title="Do you have a specific budget in mind?">
              <RadioGroup
                options={Q10_OPTIONS}
                value={answers.q10_budget}
                onChange={(v) => updateAnswer("q10_budget", v)}
              />
            </QuestionCard>

            {/* Q11: Specialist */}
            <QuestionCard number={11} title="Are you willing to visit a specialised dentist for treatment?">
              <RadioGroup
                options={Q11_OPTIONS}
                value={answers.q11_willingSpecialist}
                onChange={(v) => updateAnswer("q11_willingSpecialist", v)}
              />
            </QuestionCard>

            {/* Q12: Timeline */}
            <QuestionCard number={12} title="When would you like to improve your smile?">
              <RadioGroup
                options={Q12_OPTIONS}
                value={answers.q12_timeline}
                onChange={(v) => updateAnswer("q12_timeline", v)}
              />
            </QuestionCard>

            {/* Q13: Pregnancy */}
            <QuestionCard number={13} title="Are you currently pregnant or planning a pregnancy within 6 months?">
              <RadioGroup
                options={Q13_OPTIONS}
                value={answers.q13_pregnancy}
                onChange={(v) => updateAnswer("q13_pregnancy", v)}
              />
            </QuestionCard>

            {/* Q14: Smoking */}
            <QuestionCard number={14} title="Do you smoke or vape regularly?">
              <RadioGroup
                options={Q14_OPTIONS}
                value={answers.q14_smoking}
                onChange={(v) => updateAnswer("q14_smoking", v)}
              />
            </QuestionCard>

            {/* Q15: Oral hygiene */}
            <QuestionCard number={15} title="How would you describe your oral hygiene?">
              <RadioGroup
                options={Q15_OPTIONS}
                value={answers.q15_oralHygiene}
                onChange={(v) => updateAnswer("q15_oralHygiene", v)}
              />
            </QuestionCard>

            {/* Q16: Growth and extraction */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                16. Is your growth fully completed and have you had a recent extraction in this area?
              </h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  16a. Are you under 18 or is your dental growth not fully completed?
                </label>
                <RadioGroup
                  options={Q16A_OPTIONS}
                  value={answers.q16a_growthComplete}
                  onChange={(v) => updateAnswer("q16a_growthComplete", v)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  16b. Have you had a tooth extraction in this area in the last 3 months?
                </label>
                <RadioGroup
                  options={Q16B_OPTIONS}
                  value={answers.q16b_recentExtraction}
                  onChange={(v) => updateAnswer("q16b_recentExtraction", v)}
                />
              </div>
            </div>

            {/* Q17: Medical conditions */}
            <QuestionCard number={17} title="Do you have a medical condition or take medication that makes surgical treatment inadvisable?">
              <RadioGroup
                options={Q17_OPTIONS}
                value={answers.q17_medicalConditions}
                onChange={(v) => updateAnswer("q17_medicalConditions", v)}
              />
            </QuestionCard>

            {/* Q18: Dental anxiety */}
            <QuestionCard number={18} title="Do you avoid dental visits due to (severe) anxiety?">
              <RadioGroup
                options={Q18_OPTIONS}
                value={answers.q18_dentalAnxiety}
                onChange={(v) => updateAnswer("q18_dentalAnxiety", v)}
              />
            </QuestionCard>

            {/* Submit button */}
            <div className="flex justify-end gap-4">
              <Link
                href="/"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Generating Report..." : "Generate Report"}
              </button>
            </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

// Helper Components

function QuestionCard({ number, title, children }: { number: number | string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {number}. {title}
      </h3>
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: { options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
            value === option.value
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400"
              : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <input
            type="radio"
            name={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
            value === option.value
              ? "border-blue-500 dark:border-blue-400"
              : "border-gray-300 dark:border-gray-600"
          }`}>
            {value === option.value && (
              <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400" />
            )}
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ options, values, onChange }: { options: Option[]; values: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isChecked = values.includes(option.value);
        return (
          <label
            key={option.value}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              isChecked
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400"
                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className={`w-4 h-4 rounded border-2 mr-3 flex items-center justify-center ${
              isChecked
                ? "border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400"
                : "border-gray-300 dark:border-gray-600"
            }`}>
              {isChecked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function IntakeAnswersPanel({ answers }: { answers: QuestionnaireAnswers }) {
  // Build list of all questions with their labels and values
  const questionItems: Array<{ id: string; label: string; value: string | string[] | number; options?: Option[] }> = [
    { id: "Q1", label: "Main reason for improving smile", value: answers.q1_mainReason, options: Q1_OPTIONS },
    { id: "Q2", label: "Satisfaction with smile", value: answers.q2_satisfaction },
    { id: "Q2a", label: "What bothers you most", value: answers.q2a_whatBothers, options: Q2A_OPTIONS },
    { id: "Q3", label: "Tooth concerns", value: answers.q3_toothConcerns, options: Q3_OPTIONS },
    { id: "Q4", label: "Previous treatments", value: answers.q4_previousTreatments, options: Q4_OPTIONS },
    { id: "Q5", label: "Current issues", value: answers.q5_currentIssues, options: Q5_OPTIONS },
    { id: "Q6a", label: "Current situation", value: answers.q6a_situation, options: Q6A_OPTIONS },
    { id: "Q6b", label: "Location", value: answers.q6b_location, options: Q6B_OPTIONS },
    { id: "Q6c", label: "Neighbouring teeth", value: answers.q6c_neighboringTeeth, options: Q6C_OPTIONS },
    { id: "Q6d", label: "Teeth health", value: answers.q6d_teethHealth, options: Q6D_OPTIONS },
    { id: "Q7", label: "Style preference", value: answers.q7_stylePreference, options: Q7_OPTIONS },
    { id: "Q8", label: "Natural importance", value: answers.q8_naturalImportance, options: Q8_OPTIONS },
    { id: "Q9", label: "Age range", value: answers.q9_ageRange, options: Q9_OPTIONS },
    { id: "Q10", label: "Budget", value: answers.q10_budget, options: Q10_OPTIONS },
    { id: "Q11", label: "Willing to see specialist", value: answers.q11_willingSpecialist, options: Q11_OPTIONS },
    { id: "Q12", label: "Timeline", value: answers.q12_timeline, options: Q12_OPTIONS },
    { id: "Q13", label: "Pregnancy status", value: answers.q13_pregnancy, options: Q13_OPTIONS },
    { id: "Q14", label: "Smoking", value: answers.q14_smoking, options: Q14_OPTIONS },
    { id: "Q15", label: "Oral hygiene", value: answers.q15_oralHygiene, options: Q15_OPTIONS },
    { id: "Q16a", label: "Growth complete", value: answers.q16a_growthComplete, options: Q16A_OPTIONS },
    { id: "Q16b", label: "Recent extraction", value: answers.q16b_recentExtraction, options: Q16B_OPTIONS },
    { id: "Q17", label: "Medical conditions", value: answers.q17_medicalConditions, options: Q17_OPTIONS },
    { id: "Q18", label: "Dental anxiety", value: answers.q18_dentalAnxiety, options: Q18_OPTIONS },
  ];

  // Filter to only show answered questions
  const answeredQuestions = questionItems.filter(q => {
    if (Array.isArray(q.value)) return q.value.length > 0;
    if (typeof q.value === "number") return true; // Always show satisfaction score
    return q.value && q.value.trim() !== "";
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sticky top-0">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Answers</h3>
      <div className="space-y-3 max-h-screen overflow-y-auto">
        {answeredQuestions.map(q => (
          <div key={q.id} className="border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{q.id}: {q.label}</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
              {getAnswerLabel(q.value, q.options)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
