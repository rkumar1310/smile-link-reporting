/**
 * Cleanup script: Remove legacy content from the `content` collection
 * Keeps only documents with type: "text_module"
 *
 * Usage: npx tsx scripts/cleanup-legacy-content.ts
 */

import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is required");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || "smilelink_cms";
  const client = await MongoClient.connect(uri);
  const db = client.db(dbName);
  const collection = db.collection("content");

  // Count before
  const totalBefore = await collection.countDocuments();
  const textModuleCount = await collection.countDocuments({ type: "text_module" });
  const legacyCount = await collection.countDocuments({ type: { $ne: "text_module" } });

  console.log(`Content collection: ${totalBefore} total documents`);
  console.log(`  - text_module: ${textModuleCount} (keeping)`);
  console.log(`  - legacy: ${legacyCount} (deleting)`);

  if (legacyCount === 0) {
    console.log("\nNo legacy content to remove.");
    await client.close();
    return;
  }

  // Delete legacy content
  const result = await collection.deleteMany({ type: { $ne: "text_module" } });
  console.log(`\nDeleted ${result.deletedCount} legacy documents.`);

  // Count after
  const totalAfter = await collection.countDocuments();
  console.log(`Content collection now has ${totalAfter} documents (all text_module).`);

  await client.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
