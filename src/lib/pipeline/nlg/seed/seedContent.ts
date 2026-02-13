/**
 * Content Seeder
 *
 * Seeds MongoDB content collection from DOCX files.
 * Translates Dutch content to English using Claude API.
 *
 * Run with: npx tsx src/lib/pipeline/nlg/seed/seedContent.ts
 */

import { MongoClient, Db } from 'mongodb';
import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { parseAllDocx } from './parseDocx.js';
import { mapAllContent, loadContentRegistry, type MappedContent } from './contentMapper.js';

// ============================================================================
// Types
// ============================================================================

interface ContentVariant {
  content: string;
  wordCount: number;
  citations: Array<{
    sourceDocId: string;
    sourcePath: string;
    section: string;
    excerpt: string;
    matchConfidence: number;
  }>;
  generatedAt: string;
  generatedBy: 'manual' | 'agent';
  factCheckStatus: 'pending' | 'verified' | 'failed' | 'skipped';
  variantStatus: 'draft' | 'review' | 'approved';
}

interface ContentDocument {
  contentId: string;
  type: 'scenario' | 'a_block' | 'b_block' | 'module' | 'static';
  name: string;
  description: string;
  layer: 'L1' | 'L2' | 'L3';
  triggerDrivers?: Record<string, string[]>;
  triggerTags?: string[];
  targetSection?: number;
  targetSections?: number[];
  priority?: number;
  variants: {
    nl?: {
      'TP-01'?: ContentVariant;
    };
    en?: {
      'TP-01'?: ContentVariant;
    };
  };
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  version: string;
  versionHistory: Array<{
    version: string;
    content: string;
    changedAt: string;
    changedBy: string;
    changeReason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

interface TranslationResult {
  english: string;
  tokensUsed: number;
}

interface SeedReport {
  totalParsed: number;
  totalMapped: number;
  totalTranslated: number;
  totalSeeded: number;
  missingFromDocx: string[];
  errors: string[];
  tokensUsed: number;
}

// ============================================================================
// Translation
// ============================================================================

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function translateToEnglish(
  dutchContent: string,
  contentType: string,
  title: string
): Promise<TranslationResult> {
  const systemPrompt = `You are a professional medical/dental translator specializing in Dutch to English translation.

IMPORTANT RULES:
1. Translate the Dutch text to English accurately
2. Preserve all medical and dental terminology precisely
3. Maintain the exact formatting (markdown headers, bullet points, etc.)
4. Keep any placeholders like {{PATIENT_NAME}} or {OPTION_1_NAME} unchanged
5. Do NOT add any explanations or notes - only output the translation
6. Maintain the professional, patient-friendly tone

Content type: ${contentType}
Title: ${title}`;

  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Translate this Dutch dental content to English:\n\n${dutchContent}`,
      },
    ],
    temperature: 0.2,
    maxOutputTokens: 4096,
  });

  return {
    english: result.text,
    tokensUsed: (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0),
  };
}

// ============================================================================
// Content Document Builder
// ============================================================================

function buildContentDocument(
  mapped: MappedContent,
  dutchContent: string,
  englishContent: string
): ContentDocument {
  const now = new Date().toISOString();

  const createVariant = (content: string, isTranslated: boolean): ContentVariant => ({
    content,
    wordCount: content.split(/\s+/).length,
    citations: [{
      sourceDocId: 'docx-import',
      sourcePath: `reference-docs/all-content/${mapped.sourceFile}`,
      section: mapped.sourceSection || mapped.dutchTitle,
      excerpt: content.substring(0, 200) + '...',
      matchConfidence: 1.0,
    }],
    generatedAt: now,
    generatedBy: isTranslated ? 'agent' : 'manual',
    factCheckStatus: 'pending',
    variantStatus: 'draft',
  });

  return {
    contentId: mapped.contentId,
    type: mapped.type,
    name: mapped.registryItem.name,
    description: mapped.registryItem.description,
    layer: mapped.registryItem.layer,
    targetSections: mapped.registryItem.sections,
    priority: mapped.type === 'a_block' ? 100 : mapped.type === 'module' ? 50 : 10,
    variants: {
      nl: {
        'TP-01': createVariant(dutchContent, false),
      },
      en: {
        'TP-01': createVariant(englishContent, true),
      },
    },
    status: 'draft',
    version: '1.0.0',
    versionHistory: [{
      version: '1.0.0',
      content: dutchContent,
      changedAt: now,
      changedBy: 'seed-script',
      changeReason: 'Initial import from DOCX',
    }],
    createdAt: now,
    updatedAt: now,
    createdBy: 'seed-script',
    updatedBy: 'seed-script',
  };
}

// ============================================================================
// MongoDB Operations
// ============================================================================

async function connectToMongo(): Promise<{ client: MongoClient; db: Db }> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const client = await MongoClient.connect(uri);
  const dbName = process.env.MONGODB_DB || 'smilelink_cms';
  const db = client.db(dbName);

  return { client, db };
}

async function upsertContent(db: Db, doc: ContentDocument): Promise<'inserted' | 'updated'> {
  const collection = db.collection('content');

  const existing = await collection.findOne({ contentId: doc.contentId });

  if (existing) {
    await collection.updateOne(
      { contentId: doc.contentId },
      {
        $set: {
          variants: doc.variants,
          updatedAt: doc.updatedAt,
          updatedBy: doc.updatedBy,
        },
        $push: {
          versionHistory: doc.versionHistory[0] as never,
        },
      }
    );
    return 'updated';
  } else {
    await collection.insertOne(doc);
    return 'inserted';
  }
}

// ============================================================================
// Main Seeder
// ============================================================================

async function seedContent(): Promise<SeedReport> {
  const report: SeedReport = {
    totalParsed: 0,
    totalMapped: 0,
    totalTranslated: 0,
    totalSeeded: 0,
    missingFromDocx: [],
    errors: [],
    tokensUsed: 0,
  };

  console.log('================================================================================');
  console.log('                        CONTENT SEEDING');
  console.log('================================================================================\n');

  // Step 1: Parse DOCX files
  console.log('STEP 1: Parsing DOCX files...\n');
  const docxResult = await parseAllDocx();
  report.totalParsed =
    docxResult.modules.length +
    docxResult.scenarios.length +
    docxResult.fallbackBlocks.length;
  console.log(`  Parsed ${report.totalParsed} content items from DOCX\n`);

  // Step 2: Map to registry IDs
  console.log('STEP 2: Mapping to registry IDs...\n');
  const mappingResult = mapAllContent(docxResult);
  report.totalMapped = mappingResult.mapped.length;
  report.missingFromDocx = mappingResult.missingFromDocx.map(m => `${m.id} (${m.type})`);

  console.log(`  Mapped: ${report.totalMapped} items`);
  console.log(`  Unmapped: ${mappingResult.unmapped.length} items`);
  console.log(`  Missing from DOCX: ${report.missingFromDocx.length} registry items\n`);

  if (mappingResult.unmapped.length > 0) {
    console.log('  Unmapped items (no registry ID found):');
    for (const u of mappingResult.unmapped) {
      console.log(`    ⚠ ${u.title}: ${u.reason}`);
    }
    console.log('');
  }

  // Step 3: Connect to MongoDB
  console.log('STEP 3: Connecting to MongoDB...\n');
  const { client, db } = await connectToMongo();
  console.log('  Connected successfully\n');

  // Step 4: Translate and seed
  console.log('STEP 4: Translating and seeding content...\n');

  // Only seed modules and a_blocks (not scenarios - those have their own collection)
  const contentToSeed = mappingResult.mapped.filter(m =>
    m.type === 'module' || m.type === 'a_block'
  );

  console.log(`  Processing ${contentToSeed.length} content items (modules + a_blocks)...\n`);

  let inserted = 0;
  let updated = 0;

  for (const mapped of contentToSeed) {
    try {
      process.stdout.write(`  Translating ${mapped.contentId}... `);

      // Translate NL -> EN
      const translation = await translateToEnglish(
        mapped.dutchContent,
        mapped.type,
        mapped.dutchTitle
      );
      report.tokensUsed += translation.tokensUsed;
      report.totalTranslated++;

      console.log(`✓ (${translation.tokensUsed} tokens)`);

      // Build document
      const doc = buildContentDocument(mapped, mapped.dutchContent, translation.english);

      // Upsert to MongoDB
      const result = await upsertContent(db, doc);
      if (result === 'inserted') inserted++;
      else updated++;

      report.totalSeeded++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      const errMsg = `Failed to seed ${mapped.contentId}: ${error instanceof Error ? error.message : String(error)}`;
      console.log(`✗ ${errMsg}`);
      report.errors.push(errMsg);
    }
  }

  // Close connection
  await client.close();

  // Print summary
  console.log('\n================================================================================');
  console.log('                        SEEDING REPORT');
  console.log('================================================================================\n');

  console.log('SUMMARY');
  console.log('-------');
  console.log(`  Total parsed from DOCX: ${report.totalParsed}`);
  console.log(`  Total mapped to registry: ${report.totalMapped}`);
  console.log(`  Total translated (NL→EN): ${report.totalTranslated}`);
  console.log(`  Total seeded to MongoDB: ${report.totalSeeded}`);
  console.log(`    - Inserted: ${inserted}`);
  console.log(`    - Updated: ${updated}`);
  console.log(`  API tokens used: ${report.tokensUsed}`);

  if (report.missingFromDocx.length > 0) {
    console.log('\nMISSING FROM DOCX (registry IDs without source content):');
    for (const missing of report.missingFromDocx) {
      console.log(`  ✗ ${missing}`);
    }
  }

  if (report.errors.length > 0) {
    console.log('\nERRORS:');
    for (const err of report.errors) {
      console.log(`  ✗ ${err}`);
    }
  }

  console.log('\n================================================================================\n');

  return report;
}

// ============================================================================
// Entry Point
// ============================================================================

seedContent()
  .then(report => {
    if (report.errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
