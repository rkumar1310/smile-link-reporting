/**
 * Scenario Service
 * MongoDB operations for scenario retrieval and NLG variable resolution
 */

import { getDb, COLLECTIONS } from "@/lib/db/mongodb";
import type { Filter, ObjectId, Document as MongoDocument } from "mongodb";

/** Scenarios use string _ids (e.g. "S01"), not ObjectIds. This helper satisfies the MongoDB driver types. */
function idFilter(id: string) {
  return { _id: id as unknown as ObjectId };
}
import {
  type Scenario,
  type ScenarioCreateInput,
  type ScenarioUpdateInput,
  type FlattenedNLGVariables,
  ScenarioSchema,
  flattenScenarioVariables,
} from "@/lib/pipeline/nlg/schemas/ScenarioSchema";

export class ScenarioService {
  /**
   * Get a scenario by ID
   */
  async getById(scenarioId: string): Promise<Scenario | null> {
    const db = await getDb();
    const doc = await db.collection(COLLECTIONS.SCENARIOS).findOne(idFilter(scenarioId));

    if (!doc) return null;

    // Validate against schema
    const parsed = ScenarioSchema.safeParse(doc);
    if (!parsed.success) {
      console.error(`Invalid scenario document ${scenarioId}:`, parsed.error);
      return null;
    }

    return parsed.data;
  }

  /**
   * Get all scenarios
   */
  async getAll(): Promise<Scenario[]> {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.SCENARIOS)
      .find({})
      .sort({ priority: 1 })
      .toArray();

    return docs
      .map((doc) => {
        const parsed = ScenarioSchema.safeParse(doc);
        return parsed.success ? parsed.data : null;
      })
      .filter((s): s is Scenario => s !== null);
  }

  /**
   * Get scenarios by filter
   */
  async find(filter: Filter<Scenario>): Promise<Scenario[]> {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.SCENARIOS)
      .find(filter as Filter<MongoDocument>)
      .sort({ priority: 1 })
      .toArray();

    return docs
      .map((doc) => {
        const parsed = ScenarioSchema.safeParse(doc);
        return parsed.success ? parsed.data : null;
      })
      .filter((s): s is Scenario => s !== null);
  }

  /**
   * Get the fallback scenario
   */
  async getFallback(): Promise<Scenario | null> {
    const scenarios = await this.find({ is_fallback: true });
    return scenarios[0] || null;
  }

  /**
   * Get safety scenarios
   */
  async getSafetyScenarios(): Promise<Scenario[]> {
    return this.find({ is_safety_scenario: true });
  }

  /**
   * Get flattened NLG variables for a scenario
   * Ready for template substitution
   */
  async getNLGVariables(
    scenarioId: string,
    language: "en" | "nl"
  ): Promise<FlattenedNLGVariables | null> {
    const scenario = await this.getById(scenarioId);
    if (!scenario) return null;

    return flattenScenarioVariables(scenario, language);
  }

  /**
   * Get matching criteria for all scenarios
   * Used by ScenarioScorer for matching
   */
  async getMatchingCriteria(): Promise<
    Array<{ _id: string; matching: Scenario["matching"]; priority: number; is_fallback: boolean; is_safety_scenario: boolean }>
  > {
    const db = await getDb();
    const docs = await db
      .collection(COLLECTIONS.SCENARIOS)
      .find({})
      .project({
        _id: 1,
        matching: 1,
        priority: 1,
        is_fallback: 1,
        is_safety_scenario: 1,
      })
      .sort({ priority: 1 })
      .toArray();

    return docs as Array<{
      _id: string;
      matching: Scenario["matching"];
      priority: number;
      is_fallback: boolean;
      is_safety_scenario: boolean;
    }>;
  }

  /**
   * Create a new scenario
   */
  async create(scenario: ScenarioCreateInput): Promise<Scenario> {
    const db = await getDb();

    const doc: Scenario = {
      ...scenario,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Validate
    const parsed = ScenarioSchema.parse(doc);

    await db.collection(COLLECTIONS.SCENARIOS).insertOne(parsed as unknown as MongoDocument);

    return parsed;
  }

  /**
   * Update a scenario
   */
  async update(scenarioId: string, updates: ScenarioUpdateInput): Promise<Scenario | null> {
    const db = await getDb();

    const updateDoc = {
      ...updates,
      updated_at: new Date(),
    };

    const result = await db.collection(COLLECTIONS.SCENARIOS).findOneAndUpdate(
      idFilter(scenarioId),
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) return null;

    const parsed = ScenarioSchema.safeParse(result);
    return parsed.success ? parsed.data : null;
  }

  /**
   * Upsert a scenario (create or update)
   */
  async upsert(scenario: ScenarioCreateInput): Promise<Scenario> {
    const db = await getDb();

    const doc: Scenario = {
      ...scenario,
      created_at: scenario.created_at || new Date(),
      updated_at: new Date(),
    };

    // Validate
    const parsed = ScenarioSchema.parse(doc);

    await db.collection(COLLECTIONS.SCENARIOS).updateOne(
      idFilter(parsed._id),
      { $set: parsed as unknown as MongoDocument },
      { upsert: true }
    );

    return parsed;
  }

  /**
   * Delete a scenario
   */
  async delete(scenarioId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.collection(COLLECTIONS.SCENARIOS).deleteOne(idFilter(scenarioId));
    return result.deletedCount > 0;
  }

  /**
   * Delete all scenarios
   */
  async deleteAll(): Promise<number> {
    const db = await getDb();
    const result = await db.collection(COLLECTIONS.SCENARIOS).deleteMany({});
    return result.deletedCount;
  }

  /**
   * Bulk upsert scenarios (for seeding/migration)
   */
  async bulkUpsert(scenarios: ScenarioCreateInput[]): Promise<{ inserted: number; updated: number }> {
    const db = await getDb();
    let inserted = 0;
    let updated = 0;

    for (const scenario of scenarios) {
      const existing = await this.getById(scenario._id);

      if (existing) {
        await this.update(scenario._id, scenario);
        updated++;
      } else {
        await this.create(scenario);
        inserted++;
      }
    }

    return { inserted, updated };
  }

  /**
   * Check if scenario collection has data
   */
  async hasData(): Promise<boolean> {
    const db = await getDb();
    const count = await db.collection(COLLECTIONS.SCENARIOS).countDocuments();
    return count > 0;
  }

  /**
   * Get scenario count
   */
  async count(): Promise<number> {
    const db = await getDb();
    return db.collection(COLLECTIONS.SCENARIOS).countDocuments();
  }
}

// Singleton instance
export const scenarioService = new ScenarioService();
