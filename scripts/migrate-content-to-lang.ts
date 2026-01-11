/**
 * Migration script: Move content files into language subfolders
 *
 * Before: content/scenarios/S01/TP-01.md
 * After:  content/scenarios/S01/en/TP-01.md
 */

import { promises as fs } from "fs";
import path from "path";

const CONTENT_BASE = "content";
const TARGET_LANGUAGE = "en";

async function migrateDirectory(contentType: string) {
  const typePath = path.join(CONTENT_BASE, contentType);

  try {
    const items = await fs.readdir(typePath, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) continue;

      const itemPath = path.join(typePath, item.name);
      const langPath = path.join(itemPath, TARGET_LANGUAGE);

      // Check if already migrated (en/ folder exists)
      try {
        await fs.access(langPath);
        console.log(`  Skipping ${item.name} (already migrated)`);
        continue;
      } catch {
        // Not migrated yet, proceed
      }

      // Find all TP-*.md files
      const files = await fs.readdir(itemPath);
      const toneFiles = files.filter(f => f.match(/^TP-\d+\.md$/));

      if (toneFiles.length === 0) {
        console.log(`  Skipping ${item.name} (no tone files)`);
        continue;
      }

      // Create language subfolder
      await fs.mkdir(langPath, { recursive: true });

      // Move each tone file
      for (const toneFile of toneFiles) {
        const srcPath = path.join(itemPath, toneFile);
        const destPath = path.join(langPath, toneFile);
        await fs.rename(srcPath, destPath);
      }

      console.log(`  Migrated ${item.name}: ${toneFiles.length} files → ${TARGET_LANGUAGE}/`);
    }
  } catch (err) {
    console.error(`Error processing ${contentType}:`, err);
  }
}

async function main() {
  console.log(`Migrating content to ${TARGET_LANGUAGE}/ subfolders...\n`);

  const contentTypes = ["scenarios", "a_blocks", "b_blocks", "modules", "static"];

  for (const contentType of contentTypes) {
    console.log(`Processing ${contentType}...`);
    await migrateDirectory(contentType);
    console.log("");
  }

  console.log("Migration complete!");
}

main().catch(console.error);
