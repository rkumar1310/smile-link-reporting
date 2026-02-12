/**
 * Verify seeded content in MongoDB
 */

import { MongoClient } from 'mongodb';

async function verify() {
  const client = await MongoClient.connect(process.env.MONGODB_URI!);
  const db = client.db(process.env.MONGODB_DB || 'smilelink_cms');

  const content = await db.collection('content').find({}).toArray();

  console.log('================================================================================');
  console.log('                        CONTENT VERIFICATION');
  console.log('================================================================================\n');

  console.log(`Total content documents: ${content.length}\n`);

  console.log('By type:');
  const byType: Record<string, number> = {};
  for (const c of content) {
    byType[c.type] = (byType[c.type] || 0) + 1;
  }
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count}`);
  }

  console.log('\nContent items with bilingual variants:');
  for (const c of content) {
    const nlContent = c.variants?.nl?.['TP-01']?.content;
    const enContent = c.variants?.en?.['TP-01']?.content;
    const hasNL = nlContent ? '✓' : '✗';
    const hasEN = enContent ? '✓' : '✗';
    const nlWords = nlContent ? nlContent.split(/\s+/).length : 0;
    const enWords = enContent ? enContent.split(/\s+/).length : 0;
    console.log(`  ${c.contentId.padEnd(35)} NL:${hasNL} (${nlWords}w)  EN:${hasEN} (${enWords}w)`);
  }

  // Show sample content
  const sample = content.find(c => c.contentId === 'TM_PREGNANCY');
  if (sample) {
    console.log('\n================================================================================');
    console.log('SAMPLE CONTENT: TM_PREGNANCY');
    console.log('================================================================================\n');

    console.log('--- Dutch (NL) ---');
    console.log(sample.variants?.nl?.['TP-01']?.content?.substring(0, 500) + '...\n');

    console.log('--- English (EN) ---');
    console.log(sample.variants?.en?.['TP-01']?.content?.substring(0, 500) + '...\n');
  }

  await client.close();
}

verify().catch(console.error);
