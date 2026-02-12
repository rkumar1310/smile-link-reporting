# Smile-Link Content Management System

A Next.js application for managing dental content and generating personalized patient reports using NLG (Natural Language Generation).

## Quick Start

```bash
npm run dev      # Start dev server (uses Turbopack)
npm run build    # Production build
npm run lint     # Run ESLint
```

## Environment Variables

```env
MONGODB_URI=mongodb://...        # Required: MongoDB connection string
MONGODB_DB=smilelink_cms         # Optional: Database name (default: smilelink_cms)
ANTHROPIC_API_KEY=...            # For LLM-powered generation
OPENAI_API_KEY=...               # For embeddings
QDRANT_URL=...                   # Vector database for semantic search
LANGFUSE_*                       # Tracing/observability
```

## Architecture Overview

```
Patient Questionnaire
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                    Report Pipeline                       │
│  ┌─────────┐   ┌─────────────┐   ┌──────────────────┐   │
│  │ Intake  │──▶│   Driver    │──▶│    Scenario      │   │
│  │Validator│   │   Deriver   │   │     Scorer       │   │
│  └─────────┘   └─────────────┘   └──────────────────┘   │
│                       │                    │             │
│                       ▼                    ▼             │
│              ┌─────────────┐      ┌──────────────┐      │
│              │    Tag      │      │   Content    │      │
│              │  Extractor  │      │   Selector   │      │
│              └─────────────┘      └──────────────┘      │
│                       │                    │             │
│                       ▼                    ▼             │
│              ┌────────────────────────────────┐         │
│              │     Variable Calculator        │         │
│              │   (NLG Template Rendering)     │         │
│              └────────────────────────────────┘         │
│                            │                             │
│                            ▼                             │
│                   ┌────────────────┐                    │
│                   │ Report Composer │                   │
│                   └────────────────┘                    │
└─────────────────────────────────────────────────────────┘
        │
        ▼
  Personalized Report (EN/NL)
```

## Key Concepts

### Drivers
Patient characteristics extracted from questionnaire answers (e.g., `has_missing_teeth`, `bite_type: overbite`, `age_group: adult`). Used for scenario matching and content personalization.

### Scenarios (S00-S17)
Clinical case patterns stored in MongoDB `scenarios` collection. Each scenario contains:
- **Matching criteria**: `required_drivers`, `strong_drivers`, `supporting_drivers`, `excluding_drivers`
- **NLG variables**: Bilingual text for template placeholders
- **Treatment options**: Embedded with pricing, duration, recovery info
- **Aggregate pricing**: Min/max for the scenario

### Content Types
| Type | ID Pattern | Purpose |
|------|------------|---------|
| `scenario` | S00-S17 | Clinical patterns (separate collection) |
| `module` | TM_* | Reusable text modules |
| `a_block` | A_* | Warnings/alerts (safety-critical) |
| `b_block` | B_* | Standard content blocks |
| `static` | Various | Fixed content |

### NLG Variables
Template placeholders like `{OPTION_1_NAME}`, `{SHORT_SITUATION_DESCRIPTION}` that get resolved by `VariableCalculator` from:
1. Static content
2. Scenario data (treatment options, pricing, NLG variables)
3. Driver-based text mappings
4. Optional tag blocks

### Bilingual Support
All content supports EN/NL via `BilingualText` type: `{ en: string, nl: string }`

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── content/              # Content CRUD
│   │   ├── scenarios/            # Scenarios API
│   │   ├── report/generate/      # Report generation
│   │   └── ...
│   ├── content/                  # Content management UI
│   │   ├── scenarios/            # Scenarios UI (purple theme)
│   │   └── new/                  # Content creation form
│   └── report-generator/         # Report generation UI
├── lib/
│   ├── db/
│   │   ├── mongodb.ts            # MongoDB singleton connection
│   │   └── qdrant.ts             # Vector DB client
│   ├── pipeline/
│   │   ├── engines/              # DriverDeriver, ScenarioScorer, etc.
│   │   ├── nlg/                  # NLG system
│   │   │   ├── VariableCalculator.ts
│   │   │   ├── DriverTextMapper.ts
│   │   │   ├── schemas/ScenarioSchema.ts
│   │   │   └── seed/             # Scenario seed scripts
│   │   ├── composition/          # Report assembly
│   │   └── qa/                   # Quality assurance
│   ├── services/                 # Business logic services
│   ├── agents/                   # LLM-powered agents
│   └── types/                    # TypeScript types
config/
├── content-registry.json         # 42 predefined content IDs
├── scenario-profiles.json        # Legacy scenario matching (migrating to MongoDB)
├── driver-derivation-rules.json  # Answer → driver mappings
├── tone-profiles.json            # Tone variations (analytical, empathetic, etc.)
└── section-composition-rules.json
```

## MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `scenarios` | Clinical scenarios with NLG variables & treatment options |
| `content` | Modules, A-blocks, B-blocks, static content |
| `derivativeContent` | Tone/language variants of content |
| `sourceDocuments` | Uploaded source documents |
| `factCheckRecords` | Fact-checking results |
| `generationJobs` | Content generation job tracking |

## API Patterns

### Scenarios
```
GET  /api/scenarios           # List all scenarios
GET  /api/scenarios/[id]      # Get single scenario
PUT  /api/scenarios/[id]      # Update scenario (NLG vars, treatment options)
```

### Content
```
GET  /api/content             # List content (paginated, filterable)
POST /api/content             # Create content (validates against registry)
GET  /api/content/[id]        # Get single content
PUT  /api/content/[id]        # Update content
```

### Report Generation
```
POST /api/report/generate/stream   # Stream report generation
```

## Important Patterns

### Next.js 15 Dynamic Route Params
Params are Promises in Next.js 15+. Use `use()` hook:
```tsx
interface PageProps {
  params: Promise<{ id: string }>;
}
export default function Page({ params }: PageProps) {
  const { id } = use(params);
  // ...
}
```

### Content ID Validation
Content creation is restricted to predefined IDs from `config/content-registry.json`. The API validates against this registry.

### Scenario Management
Scenarios are managed via seed scripts (`src/lib/pipeline/nlg/seed/`), not the content creation form. They have a different schema and live in a separate MongoDB collection.

## Testing

Test cases are stored in `test-cases/` as JSON files with driver states for report generation testing.

## Key Files

- `src/lib/pipeline/nlg/VariableCalculator.ts` - Core NLG variable resolution
- `src/lib/pipeline/nlg/schemas/ScenarioSchema.ts` - Scenario Zod schema
- `src/lib/pipeline/engines/ScenarioScorer.ts` - Scenario matching algorithm
- `src/lib/services/ReportGenerationService.ts` - Report generation orchestration
- `config/content-registry.json` - Authoritative list of content IDs
