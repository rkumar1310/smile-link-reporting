# Composition Layer Implementation Plan

## Problem Statement

Current composition **concatenates** scenario content with B_* blocks, causing:
1. Duplicate sections (scenario has Section 3, B_CTX_* also targets Section 3)
2. Missing content errors (`[Content not found: TM_BUDGET_PREMIUM]`)
3. Section numbering conflicts

**Required behavior:** Scenario content is the **base**; TM_*/A_*/B_* blocks **override or supplement** specific sections based on drivers.

---

## Implementation Plan

### Step 1: Parse Scenario Content into Sections

**File:** `src/content/ContentLoader.ts`

Current `loadContent()` returns raw markdown. Enhance to:
- Parse scenario content into `Map<sectionNumber, sectionContent>`
- Already has `parseSections()` method - ensure it's used correctly

**New interface:**
```typescript
interface ParsedScenarioContent {
  sections: Map<number, string>;
  metadata: { id: string; tone: string };
}
```

### Step 2: Create Section Override Rules Config

**New file:** `config/section-override-rules.json`

Maps drivers to content blocks that override specific sections:

```json
{
  "overrides": [
    {
      "section": 9,
      "driver": "budget_type",
      "rules": [
        { "value": "premium", "content_id": "TM_BUDGET_PREMIUM" },
        { "value": "economy", "content_id": "TM_BUDGET_LIMITED" },
        { "value": "balanced", "content_id": "TM_BUDGET_FLEXIBLE" }
      ]
    },
    {
      "section": 10,
      "driver": "risk_profile_biological",
      "rules": [
        { "value": "elevated", "content_id": "B_RISKLANG_ELEVATED" },
        { "value": "low", "content_id": "B_RISKLANG_STANDARD" }
      ]
    },
    {
      "section": 3,
      "driver": "experience_history",
      "rules": [
        { "value": "first_timer", "content_id": "TM_CTX_FIRST_TIME", "mode": "append" },
        { "value": "experienced", "content_id": "TM_CTX_PREVIOUS_TREATMENT", "mode": "append" }
      ]
    }
  ]
}
```

**Modes:**
- `replace` (default): Override entire section
- `append`: Add after scenario section content
- `prepend`: Add before scenario section content

### Step 3: Update ContentSelector

**File:** `src/engine/ContentSelector.ts`

Change from "select all applicable blocks" to "select overrides for sections not covered by scenario":

```typescript
interface ContentSelection {
  content_id: string;
  target_section: number;
  tone: ToneProfileId;
  priority: number;
  suppressed: boolean;
  mode: 'base' | 'replace' | 'append' | 'prepend';  // NEW
}
```

**Logic:**
1. Scenario content marked as `mode: 'base'`
2. Driver-triggered overrides marked with their mode
3. A_* warnings always `mode: 'prepend'` to section 0

### Step 4: Update ReportComposer

**File:** `src/composition/ReportComposer.ts`

Change `composeSection()` to:
1. Find base content (scenario section)
2. Apply overrides based on mode:
   - `replace`: Use override content, discard base
   - `append`: Base + override
   - `prepend`: Override + base
3. If no base and no override → skip section (unless static)

**Key change in assembly loop:**
```typescript
for (let sectionNum = 0; sectionNum <= 11; sectionNum++) {
  const selections = selectionsBySection.get(sectionNum) || [];

  const base = selections.find(s => s.mode === 'base');
  const overrides = selections.filter(s => s.mode !== 'base' && !s.suppressed);

  let content = base ? await this.loadContent(base) : '';

  for (const override of overrides) {
    const overrideContent = await this.loadContent(override);
    if (override.mode === 'replace') {
      content = overrideContent;
    } else if (override.mode === 'append') {
      content = content + '\n\n' + overrideContent;
    } else if (override.mode === 'prepend') {
      content = overrideContent + '\n\n' + content;
    }
  }

  if (content) {
    sections.push({ number: sectionNum, content });
  }
}
```

### Step 5: Remove Redundant B_* Block Selections

**File:** `src/engine/ContentSelector.ts`

Current code selects B_CTX_*, B_INTERP_* etc. for every report. These should only be selected when:
1. Scenario doesn't have that section, OR
2. Driver explicitly triggers an override

Remove or guard the automatic B_* selection in `selectBBlocks()`.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/content/ContentLoader.ts` | Ensure `parseSections()` returns section map |
| `src/engine/ContentSelector.ts` | Add override mode logic, remove auto B_* selection |
| `src/composition/ReportComposer.ts` | Implement base/override assembly logic |
| `src/types/index.ts` | Add `mode` to ContentSelection type |
| `config/section-override-rules.json` | NEW - driver-to-content override rules |

---

## Expected Outcome

For case_03 (premium aesthetic, S11):
- Section 9 (Cost): S11's cost section **replaced** by TM_BUDGET_PREMIUM
- Section 3 (Context): S11's context section **appended** with TM_CTX_PREVIOUS_TREATMENT
- Section 10 (Risk): S11's risk section stays (no elevated risk driver)
- No duplicate sections
- No `[Content not found]` errors

---

# Feedback Issue Tracker

## Issue 1: Test Data Quality (case_04, case_06, case_07)
**Status:** Partially fixed (case_04 done)

**Problem:** Test inputs use invalid answer values that don't match tag-extraction-rules.json

**Fixes needed:**
- [x] case_04: Q3 `many_teeth_missing` → `loose_pain_chewing`, Q6a `many_missing` → `most_poor_unsaveable`
- [ ] case_06: Q13 `yes` → `yes_pregnant`, Q16a `pregnant` → remove (wrong question)
- [ ] case_07: Q6a `2_4_dispersed` → `2_4_non_adjacent`, Q6b `both_zones` → `both`, Q16a `diabetes` → remove

---

## Issue 2: Missing Content Modules
**Status:** Not started

**Problem:** Referenced modules don't exist

**Missing content:**
- [ ] `TM_RISK_SMOKING` - smoking risk guidance
- [ ] `TM_BUDGET_PREMIUM` - premium budget guidance
- [ ] `S00_GENERIC` scenario content - fallback scenario is empty

---

## Issue 3: Missing Tag Mappings
**Status:** Not started

**Problem:** Some conditions have no question/tag mapping

**Gaps:**
- [ ] Diabetes - no dedicated question or tag
- [ ] Other medical conditions beyond yes/no

---

## Issue 4: Anxiety-Based Section Reordering (case_08)
**Status:** Not started - Feature gap

**Problem:** For severe anxiety profiles, report should lead with reassurance before treatment options. Current system uses fixed section order regardless of anxiety_level driver.

**Current behavior:**
- Sections always ordered: Disclaimer → Summary → Situation → Options → ...
- Tone (TP-04) is correct but structure is fixed

**Required behavior for `anxiety_level: severe`:**
1. Lead with anxiety acknowledgment/normalization section
2. Extended reassurance before diving into treatment details
3. Options presented after emotional safety established

**Possible solutions:**

### Option A: Anxiety-Specific Scenario
Create S_ANXIETY scenarios that have different section ordering baked in.
- Pro: Simple, no composition changes
- Con: Content duplication, combinatorial explosion with other scenarios

### Option B: Section Reordering Rules
Add driver-based section reordering to composition layer:
```json
{
  "reorder_rules": [
    {
      "driver": "anxiety_level",
      "value": "severe",
      "section_order": [1, "ANXIETY_INTRO", 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    }
  ]
}
```
- Pro: Flexible, no content duplication
- Con: More complex composition logic

### Option C: Prepend Anxiety Module
Create `TM_ANXIETY_SEVERE` module that prepends to section 2 (Personal Summary):
```json
{
  "section": 2,
  "driver": "anxiety_level",
  "rules": [
    { "value": "severe", "content_id": "TM_ANXIETY_SEVERE", "mode": "prepend" }
  ]
}
```
- Pro: Uses existing override mechanism from composition plan
- Con: Doesn't truly reorder, just adds intro content

**Recommendation:** Option C as quick win (fits existing plan), Option B for full solution later.
