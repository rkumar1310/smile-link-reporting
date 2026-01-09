# Questionnaire Reference

This document lists all valid question IDs and their accepted answer values for the intake questionnaire.

## Question Summary

| Question | Name | Required | Critical | Multi-Select |
|----------|------|:--------:|:--------:|:------------:|
| Q1 | Main reason for smile improvement | | | |
| Q2 | Satisfaction score (1-10) | | | |
| Q2a | What bothers you most | | | |
| Q3 | What bothers you most about teeth | | | Yes |
| Q4 | Previous treatments | | | Yes |
| **Q5** | Pain/infection/loose teeth | **Yes** | **Yes (L1)** | |
| **Q6a** | Current dental status | **Yes** | | |
| Q6b | Location | | | |
| Q6c | Condition of neighbouring teeth | | | |
| Q6d | Health of aesthetic teeth | | | Yes |
| Q7 | Smile style preference | | | |
| Q8 | Natural result importance | | | |
| Q9 | Age | | | |
| Q10 | Budget | | | |
| Q11 | Specialist willingness | | | |
| Q12 | Timeline | | | |
| Q13 | Pregnancy | | **Yes (L1)** | |
| Q14 | Smoking | | | |
| Q15 | Oral hygiene | | | |
| Q16a | Growth completed | | **Yes (L1)** | |
| Q16b | Recent extraction | | | |
| Q17 | Medical contraindications | | **Yes (L1)** | |
| Q18 | Dental anxiety | | | |

---

## Valid Answer Values

### Q1: Main reason for smile improvement
```
insecure_confidence
discoloured_damaged_worn
functional_issues
missing_teeth_long_term
beautiful_youthful
complete_transformation
missing_teeth_improve_color_shape
```

### Q2: Satisfaction score
```
1, 2, 3, 4, 5, 6, 7, 8, 9, 10
```
*Numeric range, can be string or number*

### Q2a: What bothers you most
*Conditional: Only valid when Q2 = 1, 2, 3, or 4*
```
esthetics
chewing_missing
both
```

### Q3: What bothers you most about teeth
*Multi-select: Answer must be an array*
```
discoloured_dull
crooked_uneven
missing_damaged
size_harmony
bite_problems
gum_recession
loose_pain_chewing
missing_aesthetic
```

### Q4: Previous treatments
*Multi-select: Answer must be an array*
```
no_never
yes_implants
yes_veneers_crowns
yes_orthodontics
yes_periodontal
```

### Q5: Pain/infection/loose teeth (REQUIRED, CRITICAL L1)
```
yes_pain
yes_infection
yes_loose_missing
no_aesthetic_only
```

### Q6a: Current dental status (REQUIRED)
```
no_missing
one_missing
2_4_adjacent
2_4_non_adjacent
mix_adjacent_spread
5_plus_one_jaw
most_poor_unsaveable
```

### Q6b: Location
```
front_aesthetic_zone
side_chewing
both
```

### Q6c: Condition of neighbouring teeth
```
intact
partially_restored
heavily_restored
```

### Q6d: Health of aesthetic teeth
*Multi-select: Answer must be an array*
```
mostly_intact_enamel
large_fillings_old_restorations
cracks_wear
root_canal
severe_discolouration
bruxism
```

### Q7: Smile style preference
```
natural_subtle
hollywood
classic_elegant
functional_durable
```

### Q8: Natural result importance
```
very_important_natural
hollywood_bright_white
best_price_quality_flexible
```

### Q9: Age
```
under_30
30_45
45_60
60_plus
```

### Q10: Budget
```
premium_best_result
price_quality_flexible
affordable_durable
cost_estimate_first
```

### Q11: Specialist willingness
```
yes_for_best_result
maybe_need_info
ai_report_first
```

### Q12: Timeline
```
1_3_months
6_months
1_year
still_exploring
```

### Q13: Pregnancy (CRITICAL L1)
```
no
yes_pregnant
possibly_within_6_months
prefer_not_to_say
```

### Q14: Smoking
```
no
occasionally
weekly
daily
```

### Q15: Oral hygiene
```
good
basic
irregular
poor
```

### Q16a: Growth completed (CRITICAL L1)
```
yes_incomplete
no_complete
```

### Q16b: Recent extraction
```
yes
no
```

### Q17: Medical contraindications (CRITICAL L1)
```
no
yes
```

### Q18: Dental anxiety
```
no
yes_mild
yes_severe
```

---

## Validation Rules

### Required Questions
- **Q5** and **Q6a** must always be answered
- Missing required questions will BLOCK the pipeline

### Critical L1 Questions
- Q5, Q13, Q16a, Q17 are safety-critical
- Used for safety driver derivation

### Multi-Select Questions
- Q3, Q4, Q6d accept multiple values
- Answer must be provided as an array: `["value1", "value2"]`
- Providing a single string will cause validation error

### Conditional Questions
- **Q2a** is only valid when Q2 = 1, 2, 3, or 4
- If Q2a is provided without valid Q2, it will be skipped with a warning

---

## Example Valid Intake

```typescript
const intake = {
  session_id: "example-001",
  timestamp: new Date().toISOString(),
  answers: [
    { question_id: "Q1", answer: "missing_teeth_long_term" },
    { question_id: "Q2", answer: "5" },
    { question_id: "Q3", answer: ["missing_damaged", "discoloured_dull"] },  // Array!
    { question_id: "Q4", answer: ["no_never"] },  // Array!
    { question_id: "Q5", answer: "no_aesthetic_only" },  // Required
    { question_id: "Q6a", answer: "one_missing" },  // Required
    { question_id: "Q6d", answer: ["mostly_intact_enamel"] },  // Array!
    { question_id: "Q7", answer: "natural_subtle" },
    { question_id: "Q13", answer: "no" },
    { question_id: "Q17", answer: "no" },
    { question_id: "Q18", answer: "yes_mild" }
  ]
};
```

---

## Source Files

- **Config**: `config/tag-extraction-rules.json`
- **Zod Schemas**: `src/validation/schemas/AnswerSchemas.ts`
- **Metadata**: `src/validation/schemas/QuestionMetadata.ts`
- **Validator**: `src/validation/IntakeValidator.ts`
