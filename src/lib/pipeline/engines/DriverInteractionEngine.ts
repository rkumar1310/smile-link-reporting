/**
 * Driver Interaction Engine
 *
 * Applies cross-driver interaction rules after initial driver derivation.
 * Processes 23 rules across 4 priority tiers:
 *   P1 - Safety Hard Overrides (reserved, not implemented here — handled by derivation)
 *   P2 - Structural Clinical Overrides
 *   P3 - Tension Drivers
 *   P4 - Communication Overrides
 *
 * Rules are deterministic and order-independent within each tier.
 * Conflict resolution: safest (most conservative) outcome wins.
 */

import type {
  DriverState,
  DriverId,
  DriverValue,
  InteractionPriority,
  InteractionAuditEntry,
} from "../types";

// =============================================================================
// ORDINAL MAPS — used for "minimum" constraint enforcement
// =============================================================================

const ORDINAL_MAPS: Record<string, Record<string, number>> = {
  expectation_risk: { realistic: 0, moderate: 1, high: 2 },
  risk_profile_biological: { low: 0, moderate: 1, elevated: 2 },
  information_depth: { summary: 0, standard: 1, detailed: 2 },
  biological_stability: { stable: 0, moderate: 1, unstable: 2, compromised: 3 },
};

// =============================================================================
// HELPERS
// =============================================================================

function getDriverValue(drivers: Record<string, DriverValue>, id: string): string | undefined {
  return drivers[id]?.value;
}

function cloneDrivers(state: DriverState): DriverState {
  const cloned: DriverState = {
    ...state,
    drivers: {} as Record<DriverId, DriverValue>,
    conflicts: [...state.conflicts],
    fallbacks_applied: [...state.fallbacks_applied],
    flags: { ...(state.flags ?? {}) },
    interaction_audit: [...(state.interaction_audit ?? [])],
  };
  for (const [key, val] of Object.entries(state.drivers)) {
    cloned.drivers[key as DriverId] = { ...val };
  }
  return cloned;
}

// =============================================================================
// ENGINE
// =============================================================================

class DriverInteractionEngine {
  /**
   * Apply all interaction rules to a driver state.
   * Returns a new DriverState with modifications and audit trail.
   */
  apply(driverState: DriverState, tags: Set<string>): DriverState {
    const state = cloneDrivers(driverState);

    // Process tiers in strict order
    this.applyP2ClinicalRules(state, tags);
    this.applyP3TensionRules(state, tags);
    this.applyP4CommunicationRules(state, tags);

    return state;
  }

  // ===========================================================================
  // P2 — Structural Clinical Overrides (3 rules)
  // ===========================================================================

  private applyP2ClinicalRules(state: DriverState, tags: Set<string>): void {
    const d = state.drivers;

    // P2.1: recession/bruxism + stable → downgrade biological_stability to moderate
    // Fixes Weak Link 1: status_no_missing should not auto-stabilize when recession/bruxism present
    if (
      (tags.has("issue_gum_recession") || tags.has("tooth_health_bruxism")) &&
      getDriverValue(d, "biological_stability") === "stable"
    ) {
      this.setDriver(state, "biological_stability", "moderate", "P2_CLINICAL",
        "P2.1", "Recession/bruxism present — stable downgraded to moderate");
    }

    // P2.2: history_periodontal → risk_profile_biological >= elevated
    if (tags.has("history_periodontal")) {
      this.applyMinimum(state, "risk_profile_biological", "elevated", "P2_CLINICAL",
        "P2.2", "Periodontal history requires at least elevated biological risk");
    }

    // P2.3: status_no_missing → treatment_viability = conditional
    // Reinforces the derivation rule fix (Weak Link 2) as a safety net
    if (tags.has("status_no_missing") && getDriverValue(d, "treatment_viability") === "single_site") {
      this.setDriver(state, "treatment_viability", "conditional", "P2_CLINICAL",
        "P2.3", "No missing teeth — implant viability is conditional");
    }
  }

  // ===========================================================================
  // P3 — Tension Drivers (14 rules)
  // ===========================================================================

  private applyP3TensionRules(state: DriverState, tags: Set<string>): void {
    const d = state.drivers;

    // --- Periodontal-esthetic tension computations ---

    // P3.1: gum_recession + location_anterior → periodontal_esthetic_tension = high (priority override)
    if (tags.has("issue_gum_recession") && tags.has("location_anterior")) {
      this.setDriver(state, "periodontal_esthetic_tension", "high", "P3_TENSION",
        "P3.1", "Gum recession in anterior zone forces high periodontal-esthetic tension");
    }

    // P3.2: periodontal_esthetic_tension=high + aggressive → expectation_risk=high
    if (
      getDriverValue(d, "periodontal_esthetic_tension") === "high" &&
      getDriverValue(d, "aesthetic_tolerance") === "aggressive"
    ) {
      this.setDriver(state, "expectation_risk", "high", "P3_TENSION",
        "P3.2", "High periodontal tension + aggressive aesthetics → high expectation risk");
    }

    // P3.3: periodontal_esthetic_tension=high → treatment_philosophy=balanced
    if (getDriverValue(d, "periodontal_esthetic_tension") === "high") {
      this.setDriver(state, "treatment_philosophy", "balanced", "P3_TENSION",
        "P3.3", "High periodontal tension requires balanced philosophy");
    }

    // --- Bruxism rules ---

    // P3.4: bruxism → treatment_philosophy = durability_focused
    if (tags.has("tooth_health_bruxism")) {
      this.setDriver(state, "treatment_philosophy", "durability_focused", "P3_TENSION",
        "P3.4", "Bruxism present — treatment philosophy set to durability_focused");
    }

    // P3.5: bruxism + aesthetic_maximalist → treatment_philosophy = balanced (safeguard)
    if (
      tags.has("tooth_health_bruxism") &&
      getDriverValue(d, "treatment_philosophy") === "aesthetic_maximalist"
    ) {
      this.setDriver(state, "treatment_philosophy", "balanced", "P3_TENSION",
        "P3.5", "Bruxism + aesthetic maximalist safeguard → balanced philosophy");
    }

    // P3.6: bruxism + aggressive → expectation_risk >= moderate
    if (
      tags.has("tooth_health_bruxism") &&
      getDriverValue(d, "aesthetic_tolerance") === "aggressive"
    ) {
      this.applyMinimum(state, "expectation_risk", "moderate", "P3_TENSION",
        "P3.6", "Bruxism + aggressive aesthetics → expectation risk at least moderate");
    }

    // P3.7: bruxism + full_mouth_compromised → risk_profile_biological = elevated
    if (
      tags.has("tooth_health_bruxism") &&
      getDriverValue(d, "mouth_situation") === "full_mouth_compromised"
    ) {
      this.applyMinimum(state, "risk_profile_biological", "elevated", "P3_TENSION",
        "P3.7", "Bruxism + full mouth compromised → elevated biological risk");
    }

    // --- Budget complexity rules ---

    // P3.8: budget_complexity_tension=high → information_depth=detailed
    if (getDriverValue(d, "budget_complexity_tension") === "high") {
      this.setDriver(state, "information_depth", "detailed", "P3_TENSION",
        "P3.8", "High budget-complexity tension → detailed information depth");
    }

    // P3.9: budget_complexity_tension=high → autonomy_level=collaborative
    if (getDriverValue(d, "budget_complexity_tension") === "high") {
      this.setDriver(state, "autonomy_level", "collaborative", "P3_TENSION",
        "P3.9", "High budget-complexity tension → collaborative autonomy");
    }

    // P3.10: budget_complexity_tension=high → expectation_risk >= moderate
    if (getDriverValue(d, "budget_complexity_tension") === "high") {
      this.applyMinimum(state, "expectation_risk", "moderate", "P3_TENSION",
        "P3.10", "High budget-complexity tension → expectation risk at least moderate");
    }

    // --- Zone rules ---

    // P3.11: functional_zone → treatment_philosophy = durability_focused (minimum)
    if (getDriverValue(d, "zone_priority") === "functional_zone") {
      const currentPhilosophy = getDriverValue(d, "treatment_philosophy");
      if (currentPhilosophy !== "durability_focused") {
        this.setDriver(state, "treatment_philosophy", "durability_focused", "P3_TENSION",
          "P3.11", "Functional zone → durability-focused philosophy");
      }
    }

    // P3.12: aesthetic_zone + aggressive → expectation_risk >= moderate
    if (
      getDriverValue(d, "zone_priority") === "aesthetic_zone" &&
      getDriverValue(d, "aesthetic_tolerance") === "aggressive"
    ) {
      this.applyMinimum(state, "expectation_risk", "moderate", "P3_TENSION",
        "P3.12", "Aesthetic zone + aggressive tolerance → expectation risk at least moderate");
    }

    // --- Broader expectation rules ---

    // P3.13: aggressive + major_dissatisfaction → expectation_risk = high
    if (
      getDriverValue(d, "aesthetic_tolerance") === "aggressive" &&
      tags.has("satisfaction_major_dissatisfaction")
    ) {
      this.setDriver(state, "expectation_risk", "high", "P3_TENSION",
        "P3.13", "Aggressive aesthetics + major dissatisfaction → high expectation risk");
    }

    // P3.14: economy + high expectation_risk → flag expectation_budget_tension
    if (
      getDriverValue(d, "budget_type") === "economy" &&
      getDriverValue(d, "expectation_risk") === "high"
    ) {
      state.flags = state.flags ?? {};
      state.flags["expectation_budget_tension"] = true;
      state.interaction_audit = state.interaction_audit ?? [];
      state.interaction_audit.push({
        rule_id: "P3.14",
        priority: "P3_TENSION",
        driver_id: "flag:expectation_budget_tension",
        previous_value: "false",
        new_value: "true",
        reason: "Economy budget + high expectation risk → tension flag set",
      });
    }
  }

  // ===========================================================================
  // P4 — Communication Overrides (6 rules)
  // ===========================================================================

  private applyP4CommunicationRules(state: DriverState, tags: Set<string>): void {
    const d = state.drivers;

    // P4.1: surgical_contraindicated → detailed + collaborative
    if (getDriverValue(d, "medical_constraints") === "surgical_contraindicated") {
      this.setDriver(state, "information_depth", "detailed", "P4_COMMUNICATION",
        "P4.1a", "Surgical contraindicated → detailed information depth");
      this.setDriver(state, "autonomy_level", "collaborative", "P4_COMMUNICATION",
        "P4.1b", "Surgical contraindicated → collaborative autonomy");
    }

    // P4.2: pregnancy → time_horizon = undefined
    if (getDriverValue(d, "medical_constraints") === "pregnancy_related") {
      this.setDriver(state, "time_horizon", "undefined", "P4_COMMUNICATION",
        "P4.2", "Pregnancy related → time horizon undefined");
    }

    // P4.3: possible_constraints → information_depth >= standard
    if (getDriverValue(d, "medical_constraints") === "possible_constraints") {
      this.applyMinimum(state, "information_depth", "standard", "P4_COMMUNICATION",
        "P4.3", "Possible medical constraints → information depth at least standard");
    }

    // P4.4: medical_constraints != none → flag urgency_language_suppressed
    if (
      getDriverValue(d, "medical_constraints") !== "none" &&
      getDriverValue(d, "medical_constraints") !== undefined
    ) {
      state.flags = state.flags ?? {};
      state.flags["urgency_language_suppressed"] = true;
      state.interaction_audit = state.interaction_audit ?? [];
      state.interaction_audit.push({
        rule_id: "P4.4",
        priority: "P4_COMMUNICATION",
        driver_id: "flag:urgency_language_suppressed",
        previous_value: "false",
        new_value: "true",
        reason: "Medical constraints present → urgency language suppressed",
      });
    }

    // P4.5: severe anxiety → info_depth != summary, autonomy = collaborative
    if (getDriverValue(d, "anxiety_level") === "severe") {
      // Ensure not summary — upgrade to standard minimum
      if (getDriverValue(d, "information_depth") === "summary") {
        this.setDriver(state, "information_depth", "standard", "P4_COMMUNICATION",
          "P4.5a", "Severe anxiety — information depth cannot be summary");
      }
      this.setDriver(state, "autonomy_level", "collaborative", "P4_COMMUNICATION",
        "P4.5b", "Severe anxiety → collaborative autonomy");
    }

    // P4.6: severe anxiety + full_mouth → information_depth = detailed
    if (
      getDriverValue(d, "anxiety_level") === "severe" &&
      getDriverValue(d, "mouth_situation") === "full_mouth_compromised"
    ) {
      this.setDriver(state, "information_depth", "detailed", "P4_COMMUNICATION",
        "P4.6", "Severe anxiety + full mouth compromised → detailed information depth");
    }
  }

  // ===========================================================================
  // MUTATION HELPERS
  // ===========================================================================

  /**
   * Set a driver to a specific value with audit trail.
   * Only writes if the value actually changes.
   */
  private setDriver(
    state: DriverState,
    driverId: string,
    newValue: string,
    priority: InteractionPriority,
    ruleId: string,
    reason: string
  ): void {
    const current = state.drivers[driverId as DriverId];
    if (!current) return; // Driver not yet derived — skip
    if (current.value === newValue) return; // No change needed

    const previousValue = current.value;
    current.value = newValue;
    current.source = "derived"; // Mark as derived (interaction-modified)

    state.interaction_audit = state.interaction_audit ?? [];
    state.interaction_audit.push({
      rule_id: ruleId,
      priority,
      driver_id: driverId,
      previous_value: previousValue,
      new_value: newValue,
      reason,
    });
  }

  /**
   * Apply a minimum constraint — only upgrades if current value is less severe.
   * Uses ordinal maps to determine severity ordering.
   */
  private applyMinimum(
    state: DriverState,
    driverId: string,
    minimumValue: string,
    priority: InteractionPriority,
    ruleId: string,
    reason: string
  ): void {
    const ordinals = ORDINAL_MAPS[driverId];
    if (!ordinals) {
      // No ordinal map — fall back to direct set
      this.setDriver(state, driverId, minimumValue, priority, ruleId, reason);
      return;
    }

    const current = state.drivers[driverId as DriverId];
    if (!current) return;

    const currentOrd = ordinals[current.value] ?? -1;
    const minimumOrd = ordinals[minimumValue] ?? -1;

    // Only upgrade (increase severity)
    if (currentOrd < minimumOrd) {
      this.setDriver(state, driverId, minimumValue, priority, ruleId, reason);
    }
  }
}

export const driverInteractionEngine = new DriverInteractionEngine();
