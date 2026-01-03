/**
 * Scenario Scorer
 * Scores and matches scenarios based on driver state
 */

import type {
  DriverId,
  DriverState,
  ScenarioProfile,
  ScenarioScore,
  ScenarioMatchResult,
  ConfidenceLevel
} from "../types/index.js";

import scenarioProfiles from "../../config/scenario-profiles.json" with { type: "json" };

interface ScenarioConfig {
  name: string;
  description: string;
  required_drivers: Record<string, string[]>;
  strong_drivers: Record<string, string[]>;
  supporting_drivers: Record<string, string[]>;
  excluding_drivers: Record<string, string[]>;
  is_fallback?: boolean;
  is_safety_scenario?: boolean;
  preferred_tags?: string[];
}

interface ScoringConfig {
  required_must_match: boolean;
  strong_weight: number;
  supporting_weight: number;
  excluding_disqualifies: boolean;
}

interface ConfidenceThresholds {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  FALLBACK: number;
}

type ScenarioProfilesConfig = {
  version: string;
  scoring: ScoringConfig;
  confidence_thresholds: ConfidenceThresholds;
  priority_order: string[];
  scenarios: Record<string, ScenarioConfig>;
};

const config = scenarioProfiles as ScenarioProfilesConfig;

export class ScenarioScorer {
  private config: ScenarioProfilesConfig;

  constructor() {
    this.config = config;
  }

  /**
   * Score all scenarios and find the best match
   */
  score(driverState: DriverState): ScenarioMatchResult {
    const allScores: ScenarioScore[] = [];

    // Check for safety override (L1 priority)
    const safetyOverride = this.checkSafetyOverride(driverState);
    if (safetyOverride) {
      return this.createSafetyResult(driverState.session_id, safetyOverride, allScores);
    }

    // Score each scenario
    for (const [scenarioId, scenarioConfig] of Object.entries(this.config.scenarios)) {
      // Skip fallback scenario in normal scoring
      if (scenarioConfig.is_fallback) continue;

      const score = this.scoreScenario(scenarioId, scenarioConfig, driverState);
      allScores.push(score);
    }

    // Sort by score (descending), then by priority order for ties
    allScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Use priority order for ties
      const aPriority = this.config.priority_order.indexOf(a.scenario_id);
      const bPriority = this.config.priority_order.indexOf(b.scenario_id);
      return aPriority - bPriority;
    });

    // Find best non-excluded scenario
    const bestMatch = allScores.find(s => !s.excluded && s.score > -Infinity);

    if (!bestMatch || bestMatch.score < this.config.confidence_thresholds.LOW) {
      // Try fallback cascade
      return this.tryFallbackCascade(driverState, allScores);
    }

    const confidence = this.determineConfidence(bestMatch.score);

    return {
      session_id: driverState.session_id,
      matched_scenario: bestMatch.scenario_id,
      confidence,
      score: bestMatch.score,
      all_scores: allScores,
      fallback_used: false
    };
  }

  /**
   * Score a single scenario
   */
  private scoreScenario(
    scenarioId: string,
    scenarioConfig: ScenarioConfig,
    driverState: DriverState
  ): ScenarioScore {
    const breakdown: ScenarioScore["breakdown"] = [];
    let score = 0;
    let matchedRequired = 0;
    let matchedStrong = 0;
    let matchedSupporting = 0;
    let excluded = false;

    // Check REQUIRED drivers (must ALL match)
    for (const [driverId, acceptedValues] of Object.entries(scenarioConfig.required_drivers)) {
      const driverValue = driverState.drivers[driverId as DriverId];
      const matched = driverValue && acceptedValues.includes(driverValue.value);

      breakdown.push({
        driver_id: driverId as DriverId,
        criterion: "required",
        matched,
        points: matched ? 0 : -Infinity
      });

      if (matched) {
        matchedRequired++;
      } else {
        // Required driver not matched = disqualified
        excluded = true;
        score = -Infinity;
      }
    }

    // Check EXCLUDING drivers (must NOT match)
    if (!excluded) {
      for (const [driverId, excludedValues] of Object.entries(scenarioConfig.excluding_drivers)) {
        const driverValue = driverState.drivers[driverId as DriverId];
        const matched = driverValue && excludedValues.includes(driverValue.value);

        breakdown.push({
          driver_id: driverId as DriverId,
          criterion: "excluding",
          matched,
          points: matched ? -Infinity : 0
        });

        if (matched) {
          excluded = true;
          score = -Infinity;
        }
      }
    }

    // If not excluded, calculate positive score
    if (!excluded) {
      // STRONG matches (weight = 3)
      for (const [driverId, acceptedValues] of Object.entries(scenarioConfig.strong_drivers)) {
        const driverValue = driverState.drivers[driverId as DriverId];
        const matched = driverValue && acceptedValues.includes(driverValue.value);
        const points = matched ? this.config.scoring.strong_weight : 0;

        breakdown.push({
          driver_id: driverId as DriverId,
          criterion: "strong",
          matched,
          points
        });

        if (matched) {
          matchedStrong++;
          score += points;
        }
      }

      // SUPPORTING matches (weight = 1)
      for (const [driverId, acceptedValues] of Object.entries(scenarioConfig.supporting_drivers)) {
        const driverValue = driverState.drivers[driverId as DriverId];
        const matched = driverValue && acceptedValues.includes(driverValue.value);
        const points = matched ? this.config.scoring.supporting_weight : 0;

        breakdown.push({
          driver_id: driverId as DriverId,
          criterion: "supporting",
          matched,
          points
        });

        if (matched) {
          matchedSupporting++;
          score += points;
        }
      }
    }

    return {
      scenario_id: scenarioId,
      score,
      matched_required: matchedRequired,
      matched_strong: matchedStrong,
      matched_supporting: matchedSupporting,
      excluded,
      breakdown
    };
  }

  /**
   * Check for L1 safety override
   */
  private checkSafetyOverride(driverState: DriverState): string | null {
    const clinicalPriority = driverState.drivers.clinical_priority;
    const medicalConstraints = driverState.drivers.medical_constraints;

    // Urgent clinical priority forces S12
    if (clinicalPriority?.value === "urgent") {
      return "S12";
    }

    // Surgical contraindication may force specific handling
    if (medicalConstraints?.value === "surgical_contraindicated") {
      return "S12"; // Safety scenario
    }

    return null;
  }

  /**
   * Create result for safety override
   */
  private createSafetyResult(
    sessionId: string,
    scenarioId: string,
    allScores: ScenarioScore[]
  ): ScenarioMatchResult {
    return {
      session_id: sessionId,
      matched_scenario: scenarioId,
      confidence: "HIGH",
      score: 100, // Safety override gets maximum score
      all_scores: allScores,
      fallback_used: false
    };
  }

  /**
   * Try fallback cascade when no good match
   */
  private tryFallbackCascade(
    driverState: DriverState,
    allScores: ScenarioScore[]
  ): ScenarioMatchResult {
    // Step 1: Try relaxed matching (ignore L3 drivers)
    const relaxedMatch = this.tryRelaxedMatching(driverState);
    if (relaxedMatch && relaxedMatch.score >= this.config.confidence_thresholds.LOW) {
      return {
        session_id: driverState.session_id,
        matched_scenario: relaxedMatch.scenario_id,
        confidence: "MEDIUM",
        score: relaxedMatch.score,
        all_scores: allScores,
        fallback_used: true,
        fallback_reason: "Relaxed matching (L3 drivers ignored)"
      };
    }

    // Step 2: Try archetype matching (L1 + L2 only)
    const archetypeMatch = this.tryArchetypeMatching(driverState);
    if (archetypeMatch && archetypeMatch.score >= this.config.confidence_thresholds.FALLBACK) {
      return {
        session_id: driverState.session_id,
        matched_scenario: archetypeMatch.scenario_id,
        confidence: "LOW",
        score: archetypeMatch.score,
        all_scores: allScores,
        fallback_used: true,
        fallback_reason: "Archetype matching (L1+L2 only)"
      };
    }

    // Step 3: Use generic fallback scenario
    return {
      session_id: driverState.session_id,
      matched_scenario: "S00_GENERIC",
      confidence: "FALLBACK",
      score: 0,
      all_scores: allScores,
      fallback_used: true,
      fallback_reason: "No scenario matched, using generic fallback"
    };
  }

  /**
   * Try matching with L3 drivers ignored
   */
  private tryRelaxedMatching(driverState: DriverState): ScenarioScore | null {
    const l3Drivers: DriverId[] = [
      "anxiety_level",
      "information_depth",
      "budget_type",
      "treatment_philosophy",
      "time_horizon"
    ];

    // Create modified driver state without L3
    const relaxedDrivers = { ...driverState.drivers };
    for (const driver of l3Drivers) {
      delete relaxedDrivers[driver];
    }

    const relaxedState: DriverState = {
      ...driverState,
      drivers: relaxedDrivers as Record<DriverId, typeof driverState.drivers[DriverId]>
    };

    // Re-score with relaxed matching
    let bestScore: ScenarioScore | null = null;

    for (const [scenarioId, scenarioConfig] of Object.entries(this.config.scenarios)) {
      if (scenarioConfig.is_fallback) continue;

      // Remove L3 drivers from scenario requirements
      const relaxedConfig = {
        ...scenarioConfig,
        required_drivers: this.filterOutL3(scenarioConfig.required_drivers, l3Drivers),
        strong_drivers: this.filterOutL3(scenarioConfig.strong_drivers, l3Drivers),
        supporting_drivers: this.filterOutL3(scenarioConfig.supporting_drivers, l3Drivers),
        excluding_drivers: this.filterOutL3(scenarioConfig.excluding_drivers, l3Drivers)
      };

      const score = this.scoreScenario(scenarioId, relaxedConfig, relaxedState);

      if (!score.excluded && (!bestScore || score.score > bestScore.score)) {
        bestScore = score;
      }
    }

    return bestScore;
  }

  /**
   * Filter out L3 drivers from a driver map
   */
  private filterOutL3(
    driverMap: Record<string, string[]>,
    l3Drivers: DriverId[]
  ): Record<string, string[]> {
    const filtered: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(driverMap)) {
      if (!l3Drivers.includes(key as DriverId)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * Try archetype matching (basic L1+L2 patterns)
   */
  private tryArchetypeMatching(driverState: DriverState): ScenarioScore | null {
    // Simple archetype based on mouth_situation
    const mouthSituation = driverState.drivers.mouth_situation?.value;

    const archetypeMap: Record<string, string> = {
      "no_missing_teeth": "S01",
      "single_missing_tooth": "S02",
      "multiple_adjacent": "S04",
      "multiple_dispersed": "S05",
      "mixed_pattern": "S06",
      "extensive_missing": "S07",
      "full_mouth_compromised": "S09"
    };

    const archetypeScenario = mouthSituation ? archetypeMap[mouthSituation] : null;

    if (archetypeScenario) {
      return {
        scenario_id: archetypeScenario,
        score: 1, // Minimal score for archetype match
        matched_required: 1,
        matched_strong: 0,
        matched_supporting: 0,
        excluded: false,
        breakdown: []
      };
    }

    return null;
  }

  /**
   * Determine confidence level from score
   */
  private determineConfidence(score: number): ConfidenceLevel {
    if (score >= this.config.confidence_thresholds.HIGH) return "HIGH";
    if (score >= this.config.confidence_thresholds.MEDIUM) return "MEDIUM";
    if (score >= this.config.confidence_thresholds.LOW) return "LOW";
    return "FALLBACK";
  }

  /**
   * Get scenario profile by ID
   */
  getScenario(scenarioId: string): ScenarioProfile | undefined {
    const config = this.config.scenarios[scenarioId];
    if (!config) return undefined;

    return {
      id: scenarioId,
      name: config.name,
      description: config.description,
      required_drivers: config.required_drivers as Partial<Record<DriverId, string[]>>,
      strong_drivers: config.strong_drivers as Partial<Record<DriverId, string[]>>,
      supporting_drivers: config.supporting_drivers as Partial<Record<DriverId, string[]>>,
      excluding_drivers: config.excluding_drivers as Partial<Record<DriverId, string[]>>
    };
  }

  /**
   * Get all scenario IDs
   */
  getAllScenarioIds(): string[] {
    return Object.keys(this.config.scenarios);
  }
}

export const scenarioScorer = new ScenarioScorer();
