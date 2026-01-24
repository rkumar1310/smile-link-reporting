/**
 * Tone Service
 * Derives drivers from questionnaire answers and selects appropriate tone profile
 */

import type { ToneProfileId } from "@/lib/types";
import type {
  IntakeAnswers,
  DriverState,
  L1SafetyDrivers,
  L2PersonalizationDrivers,
  L3NarrativeDrivers,
  ToneProfile,
  ScoredScenario,
} from "@/lib/types/types/report-generation";
import { TONE_PROFILES } from "@/lib/types/types/report-generation";

/**
 * Helper to get an answer value by question ID
 */
function getAnswer(
  answers: IntakeAnswers,
  questionId: string
): string | string[] | undefined {
  const answer = answers.answers.find((a) => a.question_id === questionId);
  return answer?.answer;
}

/**
 * Helper to get answer as string
 */
function getAnswerString(
  answers: IntakeAnswers,
  questionId: string
): string {
  const answer = getAnswer(answers, questionId);
  return typeof answer === "string" ? answer : (answer?.[0] ?? "");
}

/**
 * Helper to check if answer contains a value
 */
function answerContains(
  answers: IntakeAnswers,
  questionId: string,
  value: string
): boolean {
  const answer = getAnswer(answers, questionId);
  if (typeof answer === "string") {
    return answer === value;
  }
  if (Array.isArray(answer)) {
    return answer.includes(value);
  }
  return false;
}

export class ToneService {
  /**
   * Derive driver state from intake questionnaire answers
   * Maps questionnaire responses to the 3-layer driver system
   */
  deriveDrivers(intake: IntakeAnswers): DriverState {
    const L1_Safety = this.deriveL1SafetyDrivers(intake);
    const L2_Personalization = this.deriveL2PersonalizationDrivers(intake);
    const L3_Narrative = this.deriveL3NarrativeDrivers(intake);
    const derivedTags = this.deriveTags(intake, L1_Safety, L2_Personalization, L3_Narrative);

    return {
      L1_Safety,
      L2_Personalization,
      L3_Narrative,
      derivedTags,
    };
  }

  /**
   * Derive L1 Safety drivers (clinical indicators)
   */
  private deriveL1SafetyDrivers(intake: IntakeAnswers): L1SafetyDrivers {
    const q5 = getAnswerString(intake, "Q5");
    const q13 = getAnswerString(intake, "Q13");
    const q14 = getAnswerString(intake, "Q14");
    const q16a = getAnswerString(intake, "Q16a");
    const q16b = getAnswerString(intake, "Q16b");
    const q17 = getAnswerString(intake, "Q17");

    return {
      hasActivePain: q5 === "yes_pain",
      hasActiveInfection: q5 === "yes_infection",
      hasLooseTeeth: q5 === "yes_loose",
      isPregnant: q13.startsWith("yes"),
      isSmoker: q14 === "yes" || q14 === "occasionally",
      hasGrowthIncomplete: q16a === "yes",
      hasRecentExtraction: q16b === "yes",
      hasMedicalConditions: q17 === "yes",
    };
  }

  /**
   * Derive L2 Personalization drivers (patient preferences)
   */
  private deriveL2PersonalizationDrivers(intake: IntakeAnswers): L2PersonalizationDrivers {
    const q2 = getAnswerString(intake, "Q2");
    const satisfaction = parseInt(q2) || 5;

    return {
      mainMotivation: getAnswerString(intake, "Q1"),
      satisfactionScore: satisfaction,
      primaryConcern: getAnswerString(intake, "Q3"),
      missingTeethCount: getAnswerString(intake, "Q6a"),
      toothLocation: getAnswerString(intake, "Q6b"),
      neighboringTeethCondition: getAnswerString(intake, "Q6c"),
      stylePreference: getAnswerString(intake, "Q7"),
      budgetLevel: getAnswerString(intake, "Q10"),
      timeline: getAnswerString(intake, "Q12"),
      ageRange: getAnswerString(intake, "Q9"),
    };
  }

  /**
   * Derive L3 Narrative drivers (communication preferences)
   */
  private deriveL3NarrativeDrivers(intake: IntakeAnswers): L3NarrativeDrivers {
    return {
      naturalImportance: getAnswerString(intake, "Q8"),
      willingToVisitSpecialist: getAnswerString(intake, "Q11"),
      oralHygieneLevel: getAnswerString(intake, "Q15"),
      anxietyLevel: getAnswerString(intake, "Q18"),
      previousTreatmentExperience: getAnswerString(intake, "Q4"),
    };
  }

  /**
   * Derive semantic tags from answers and drivers
   */
  private deriveTags(
    intake: IntakeAnswers,
    l1: L1SafetyDrivers,
    l2: L2PersonalizationDrivers,
    l3: L3NarrativeDrivers
  ): string[] {
    const tags: string[] = [];

    // Safety tags
    if (l1.hasActivePain) tags.push("active_pain", "urgent");
    if (l1.hasActiveInfection) tags.push("active_infection", "urgent");
    if (l1.hasLooseTeeth) tags.push("loose_teeth");
    if (l1.isPregnant) tags.push("pregnant", "contraindication_check");
    if (l1.isSmoker) tags.push("smoker", "healing_risk");
    if (l1.hasMedicalConditions) tags.push("medical_conditions", "consultation_required");
    if (l1.hasGrowthIncomplete) tags.push("growth_incomplete", "age_consideration");
    if (l1.hasRecentExtraction) tags.push("recent_extraction", "healing_time");

    // Motivation tags
    const motivation = l2.mainMotivation;
    if (motivation === "esthetics") tags.push("aesthetic_focus");
    if (motivation === "functional_issues") tags.push("functional_focus");
    if (motivation === "health_concerns") tags.push("health_focus");
    if (motivation === "pain_discomfort") tags.push("pain_driven", "urgent");

    // Missing teeth tags
    const missingTeeth = l2.missingTeethCount;
    if (missingTeeth === "1_single") tags.push("single_tooth", "implant_candidate");
    if (missingTeeth === "2_4_adjacent") tags.push("multiple_adjacent", "bridge_candidate");
    if (missingTeeth === "2_4_separate") tags.push("multiple_separate");
    if (missingTeeth === "5_more") tags.push("extensive_restoration");
    if (missingTeeth === "full_arch" || missingTeeth === "all_teeth") tags.push("full_arch");

    // Budget tags
    const budget = l2.budgetLevel;
    if (budget === "economy" || budget === "best_price_quality") tags.push("budget_conscious");
    if (budget === "premium" || budget === "best_quality_regardless_price") tags.push("premium_option");

    // Timeline tags
    const timeline = l2.timeline;
    if (timeline === "immediately" || timeline === "asap") tags.push("urgent_timeline");
    if (timeline === "1_3_months") tags.push("short_term");
    if (timeline === "6_12_months" || timeline === "flexible") tags.push("flexible_timeline");

    // Anxiety tag
    if (l3.anxietyLevel === "yes_severe") tags.push("severe_anxiety", "anxiety_support");
    if (l3.anxietyLevel === "yes_mild") tags.push("mild_anxiety");

    // Experience tags
    const experience = l3.previousTreatmentExperience;
    if (experience === "no_never") tags.push("first_time_patient");
    if (answerContains(intake, "Q4", "yes_negative")) tags.push("negative_experience");
    if (answerContains(intake, "Q4", "yes_positive")) tags.push("positive_experience");

    // Oral hygiene tags
    if (l3.oralHygieneLevel === "basic") tags.push("basic_hygiene");
    if (l3.oralHygieneLevel === "thorough") tags.push("good_hygiene");

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Select the appropriate tone profile based on driver state
   * Applies priority rules: TP-04 (anxiety) > TP-05 > TP-02 > TP-03 > TP-01
   */
  selectTone(drivers: DriverState): ToneProfile {
    const { L1_Safety, L2_Personalization, L3_Narrative, derivedTags } = drivers;

    // Priority 1: TP-04 Stability-Frame for severe anxiety (highest priority)
    if (L3_Narrative.anxietyLevel === "yes_severe" || derivedTags.includes("severe_anxiety")) {
      return TONE_PROFILES.find((t) => t.id === "TP-04")!;
    }

    // Priority 2: TP-05 Expectation-Calibration for unrealistic expectations
    // Check for expectation mismatch indicators
    const hasUnrealisticExpectations = this.checkUnrealisticExpectations(drivers);
    if (hasUnrealisticExpectations) {
      return TONE_PROFILES.find((t) => t.id === "TP-05")!;
    }

    // Priority 3: TP-02 Empathic-Neutral for negative history or high emotional load
    const hasNegativeHistory = derivedTags.includes("negative_experience");
    const hasHighEmotionalLoad =
      L1_Safety.hasActivePain ||
      L1_Safety.hasActiveInfection ||
      L3_Narrative.anxietyLevel === "yes_mild";
    if (hasNegativeHistory || hasHighEmotionalLoad) {
      return TONE_PROFILES.find((t) => t.id === "TP-02")!;
    }

    // Priority 4: TP-03 Reflective-Contextual for detailed info seekers
    // Indicators: wants thorough info, asks many questions (indicated by certain answers)
    const wantsDetailedInfo =
      L2_Personalization.stylePreference === "natural_detailed" ||
      L3_Narrative.naturalImportance === "very_important";
    if (wantsDetailedInfo) {
      return TONE_PROFILES.find((t) => t.id === "TP-03")!;
    }

    // Default: TP-01 Neutral-Informative
    return TONE_PROFILES.find((t) => t.id === "TP-01")!;
  }

  /**
   * Check for unrealistic expectations
   */
  private checkUnrealisticExpectations(drivers: DriverState): boolean {
    const { L1_Safety, L2_Personalization, L3_Narrative } = drivers;

    // Example indicators of unrealistic expectations:
    // - Wants premium results with economy budget
    // - Urgent timeline with extensive restoration needs
    // - Expects perfect results with poor oral hygiene

    const wantsPremiumWithBudget =
      L2_Personalization.stylePreference === "natural_detailed" &&
      (L2_Personalization.budgetLevel === "economy" ||
        L2_Personalization.budgetLevel === "best_price_quality");

    const urgentWithExtensive =
      (L2_Personalization.timeline === "immediately" ||
        L2_Personalization.timeline === "asap") &&
      (L2_Personalization.missingTeethCount === "5_more" ||
        L2_Personalization.missingTeethCount === "full_arch");

    const expectsPerfectWithPoorHygiene =
      L3_Narrative.naturalImportance === "very_important" &&
      L3_Narrative.oralHygieneLevel === "basic" &&
      L1_Safety.isSmoker;

    return wantsPremiumWithBudget || urgentWithExtensive || expectsPerfectWithPoorHygiene;
  }

  /**
   * Score scenarios based on driver state
   * Returns scenarios sorted by relevance score
   */
  scoreScenarios(
    drivers: DriverState,
    availableScenarios: Array<{ contentId: string; name: string; description: string }>
  ): ScoredScenario[] {
    const { derivedTags, L1_Safety, L2_Personalization } = drivers;
    const scored: ScoredScenario[] = [];

    for (const scenario of availableScenarios) {
      const { score, matchedDrivers, sections } = this.calculateScenarioScore(
        scenario,
        derivedTags,
        L1_Safety,
        L2_Personalization
      );

      if (score > 0) {
        scored.push({
          scenarioId: scenario.contentId,
          name: scenario.name,
          score,
          matchedDrivers,
          sections,
        });
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Add S00_GENERIC as fallback if no scenarios matched well
    if (scored.length === 0 || scored[0].score < 0.3) {
      scored.push({
        scenarioId: "S00_GENERIC",
        name: "Generic Report",
        score: 0.1,
        matchedDrivers: ["fallback"],
        sections: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      });
    }

    return scored;
  }

  /**
   * Calculate score for a single scenario
   */
  private calculateScenarioScore(
    scenario: { contentId: string; name: string; description: string },
    tags: string[],
    l1: L1SafetyDrivers,
    l2: L2PersonalizationDrivers
  ): { score: number; matchedDrivers: string[]; sections: number[] } {
    let score = 0;
    const matchedDrivers: string[] = [];

    // Scenario-specific scoring logic
    const scenarioId = scenario.contentId.toUpperCase();

    // S01-S03: Single tooth scenarios
    if (scenarioId.startsWith("S01") || scenarioId.startsWith("S02") || scenarioId.startsWith("S03")) {
      if (tags.includes("single_tooth")) {
        score += 0.5;
        matchedDrivers.push("single_tooth");
      }
      if (tags.includes("implant_candidate")) {
        score += 0.3;
        matchedDrivers.push("implant_candidate");
      }
    }

    // S04-S06: Multiple teeth scenarios
    if (scenarioId.startsWith("S04") || scenarioId.startsWith("S05") || scenarioId.startsWith("S06")) {
      if (tags.includes("multiple_adjacent") || tags.includes("multiple_separate")) {
        score += 0.5;
        matchedDrivers.push("multiple_teeth");
      }
      if (tags.includes("bridge_candidate")) {
        score += 0.2;
        matchedDrivers.push("bridge_candidate");
      }
    }

    // S07-S09: Extensive restoration scenarios
    if (scenarioId.startsWith("S07") || scenarioId.startsWith("S08") || scenarioId.startsWith("S09")) {
      if (tags.includes("extensive_restoration") || tags.includes("full_arch")) {
        score += 0.6;
        matchedDrivers.push("extensive_restoration");
      }
    }

    // S10-S12: Aesthetic focus scenarios
    if (scenarioId.startsWith("S10") || scenarioId.startsWith("S11") || scenarioId.startsWith("S12")) {
      if (tags.includes("aesthetic_focus")) {
        score += 0.5;
        matchedDrivers.push("aesthetic_focus");
      }
    }

    // S13-S15: Functional/health scenarios
    if (scenarioId.startsWith("S13") || scenarioId.startsWith("S14") || scenarioId.startsWith("S15")) {
      if (tags.includes("functional_focus") || tags.includes("health_focus")) {
        score += 0.5;
        matchedDrivers.push("functional_health_focus");
      }
    }

    // S16-S17: Urgent/pain scenarios
    if (scenarioId.startsWith("S16") || scenarioId.startsWith("S17")) {
      if (tags.includes("urgent") || tags.includes("pain_driven")) {
        score += 0.7;
        matchedDrivers.push("urgent");
      }
      if (l1.hasActivePain || l1.hasActiveInfection) {
        score += 0.3;
        matchedDrivers.push("active_symptoms");
      }
    }

    // Bonus for budget alignment
    if (tags.includes("budget_conscious") && scenario.description.toLowerCase().includes("economy")) {
      score += 0.1;
      matchedDrivers.push("budget_match");
    }
    if (tags.includes("premium_option") && scenario.description.toLowerCase().includes("premium")) {
      score += 0.1;
      matchedDrivers.push("premium_match");
    }

    // Determine which sections this scenario contributes to
    // For now, assume all scenarios contribute to all sections
    const sections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

    return {
      score: Math.min(score, 1), // Cap at 1.0
      matchedDrivers,
      sections,
    };
  }

  /**
   * Get tone name from ID
   */
  getToneName(toneId: ToneProfileId): string {
    const profile = TONE_PROFILES.find((t) => t.id === toneId);
    return profile?.name ?? "Unknown Tone";
  }

  /**
   * Get tone profile by ID
   */
  getToneProfile(toneId: ToneProfileId): ToneProfile | undefined {
    return TONE_PROFILES.find((t) => t.id === toneId);
  }
}

export function createToneService(): ToneService {
  return new ToneService();
}
