# Text Modules Import

Updates the 63 text modules (banners, TMs, costblocks, nuance blocks) in MongoDB.

## Prerequisites

- `.env.local` with `MONGODB_URI` (and optionally `MONGODB_DB`, defaults to `smilelink_cms`)
- Node.js dependencies installed (`npm install`)

## Run

```bash
npx dotenv -e .env.local -- npx tsx src/lib/pipeline/nlg/seed/importTextModules.ts
```

This upserts all 63 modules. Existing documents are updated in place; new ones are created.

## Clear + Re-import

To delete all text modules first and then re-import:

```bash
npx dotenv -e .env.local -- npx tsx src/lib/pipeline/nlg/seed/importTextModules.ts --clear
```

## What it does

- Reads module definitions from `src/lib/pipeline/nlg/seed/importTextModules.ts`
- Upserts each into the `content` collection with `type: "text_module"`
- Modules are matched by `_id` so re-running is safe (idempotent)

## Module types

| Type | Count | ID pattern | Example |
|------|-------|------------|---------|
| banner | 10 | `FB_BANNER_*` | `FB_BANNER_PREGNANCY` |
| module | 19 | `TM_01_*` to `TM_19_*` | `TM_05_PERIODONTAL` |
| costblock | 17 | `COSTBLOCK_S01` to `COSTBLOCK_S17` | `COSTBLOCK_S09` |
| nuance | 17 | `NUANCE_S01_SHORT` to `NUANCE_S17_SHORT` | `NUANCE_S15_SHORT` |

## Verify

After running, check a sample:

```bash
npx dotenv -e .env.local -- node -e "
const { MongoClient } = require('mongodb');
async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'smilelink_cms');
  const count = await db.collection('content').countDocuments({ type: 'text_module' });
  console.log('Text modules in DB:', count);
  await client.close();
}
main();
"
```

Expected output: `Text modules in DB: 63`
