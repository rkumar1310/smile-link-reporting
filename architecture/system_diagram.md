# Smile-Link NLG Report Generation System
## Architecture Diagram

```mermaid
flowchart TB
    subgraph Input["Phase 1: Input & Driver Extraction"]
        Q[("Questions<br/>(Q1-Q18)")] --> T["Tag Extraction"]
        T --> D["Driver Derivation"]
        D --> DS[("DriverState<br/>(18 Drivers)")]
    end

    subgraph Decision["Phase 2: Decision Engine"]
        DS --> PM["Priority Matrix<br/>(Conflict Resolution)"]
        PM --> FM["Fallback Matrix<br/>(Missing Data)"]
        FM --> SSE["Scenario Scoring Engine"]

        SSE --> MS{{"Matched Scenario<br/>(S01-S17)"}}
        SSE --> NS{{"No Scenario<br/>Unknown"}}
    end

    subgraph ContentLib["Content Library (396 texts)"]
        SC[("Scenarios<br/>17 × 6 tones<br/>= 102 texts")]
        AB[("A_* Blocks<br/>16 × 6 tones<br/>= 96 texts")]
        BB[("B_* Blocks<br/>14 × 6 tones<br/>= 84 texts")]
        TM[("Text Modules<br/>19 × 6 tones<br/>= 114 texts")]
    end

    subgraph Selection["Phase 2.5: Content Selection"]
        MS --> L1C["L1 Override Check"]
        DS --> L1C
        L1C --> ABS["A_* Block Selection<br/>(Safety/Warnings)"]
        L1C --> BBS["B_* Block Selection<br/>(Content Modules)"]
        L1C --> TMS["Text Module Selection<br/>(Context/Risk)"]
        L1C --> SCS["Scenario Section Selection"]

        AB --> ABS
        BB --> BBS
        TM --> TMS
        SC --> SCS

        ABS --> CBS["Selected Content Blocks"]
        BBS --> CBS
        TMS --> CBS
        SCS --> CBS
    end

    subgraph Tone["Phase 2.5: Tone Selection"]
        DS --> TS["Tone Selector<br/>(L3 Drivers)"]
        TS --> TP{{"Tone Profile<br/>(TP-01 to TP-06)"}}
    end

    subgraph Composition["Phase 3: Report Composition"]
        CBS --> NLG["NLG Composition Engine"]
        TP --> NLG
        DS --> NLG

        NLG --> |"Apply Composition Contract"| RA["Report Assembly"]

        RA --> SEC0["Section 0: Warnings (A_WARN_*)"]
        RA --> SEC1["Section 1: Disclaimer"]
        RA --> SEC2["Section 2: Personal Summary"]
        RA --> SEC3["Section 3: Context (B_CTX_* + Modules)"]
        RA --> SEC4["Section 4: Interpretation (B_INTERP_*)"]
        RA --> SEC5["Section 5: Options (B_OPT_*)"]
        RA --> SEC6["Section 6: Comparison (B_COMPARE_*)"]
        RA --> SEC7["Section 7: Trade-offs (B_TRADEOFF_*)"]
        RA --> SEC8["Section 8: Process (B_PROCESS_*)"]
        RA --> SEC9["Section 9: Costs"]
        RA --> SEC10["Section 10: Risk Language (B_RISKLANG_*)"]
        RA --> SEC11["Section 11: Next Steps"]

        SEC0 --> DR["Draft Report"]
        SEC1 --> DR
        SEC2 --> DR
        SEC3 --> DR
        SEC4 --> DR
        SEC5 --> DR
        SEC6 --> DR
        SEC7 --> DR
        SEC8 --> DR
        SEC9 --> DR
        SEC10 --> DR
        SEC11 --> DR
    end

    subgraph Fallback["Fallback Path"]
        NS --> FT["Fallback Template<br/>(Generic Report)"]
        FT --> DR
    end

    subgraph QA["Phase 4: QA & Governance"]
        DR --> TC["Trace Collector"]
        TC --> SLD["Semantic Leakage<br/>Detector"]
        SLD --> VAL["Validation<br/>(Composition Contract)"]

        VAL --> PASS{{"PASS"}}
        VAL --> FLAG{{"FLAG"}}
        VAL --> BLOCK{{"BLOCK"}}

        PASS --> FR["Final Report"]
        FLAG --> REV["Review + Deliver"]
        BLOCK --> FBR["Fallback Report"]

        TC --> ARS[("Audit Record<br/>Store")]
    end

    subgraph Output["Output"]
        FR --> R[("Report")]
        REV --> R
        FBR --> R
    end

    style Input fill:#e1f5fe
    style Decision fill:#fff3e0
    style ContentLib fill:#f3e5f5
    style Selection fill:#e8f5e9
    style Tone fill:#fce4ec
    style Composition fill:#e0f2f1
    style Fallback fill:#ffebee
    style QA fill:#f5f5f5
    style Output fill:#e8eaf6
```

---

## Simplified View

```mermaid
flowchart LR
    subgraph Input
        Q["Questions"] --> T["Tags"] --> D["Drivers"]
    end

    subgraph Engine["Decision Engine"]
        D --> PM["Priority<br/>Matrix"]
        PM --> FM["Fallback<br/>Matrix"]
        FM --> SS["Scenario<br/>Scoring"]
    end

    subgraph Content["Content Selection"]
        SS --> CS["Select<br/>A_* B_* Modules"]
        CL[("Content<br/>Library<br/>396 texts")] --> CS
    end

    subgraph Compose["Composition"]
        CS --> NLG["NLG<br/>Composition"]
        TP["Tone<br/>Profile"] --> NLG
    end

    subgraph QA
        NLG --> QAG["QA<br/>Gate"]
        QAG --> R["Report"]
    end

    D --> TP
```

---

## Content Library Breakdown

```mermaid
pie title Content Library (396 total texts)
    "Scenarios (102)" : 102
    "A_* Safety Blocks (96)" : 96
    "B_* Content Blocks (84)" : 84
    "Text Modules (114)" : 114
```

---

## Driver Layers

```mermaid
flowchart TB
    subgraph L1["Layer 1: Safety (7 drivers)"]
        D1["clinical_priority"]
        D2["biological_stability"]
        D3["mouth_situation"]
        D4["age_stage"]
        D5["medical_constraints"]
        D6["treatment_viability"]
        D7["risk_profile_biological"]
    end

    subgraph L2["Layer 2: Personalization (6 drivers)"]
        D8["profile_type"]
        D9["aesthetic_tolerance"]
        D10["expectation_risk"]
        D11["experience_history"]
        D12["decision_stage"]
        D13["autonomy_level"]
    end

    subgraph L3["Layer 3: Narrative (5 drivers)"]
        D14["anxiety_level"]
        D15["information_depth"]
        D16["budget_type"]
        D17["treatment_philosophy"]
        D18["time_horizon"]
    end

    L1 --> |"Override"| L2
    L2 --> |"Override"| L3

    L1 --> AB["A_* Blocks<br/>(Safety)"]
    L2 --> BB["B_* Blocks<br/>(Content)"]
    L3 --> TP["Tone Profile<br/>(TP-01 to TP-06)"]
```

---

## Scenario Scoring Flow

```mermaid
flowchart LR
    DS["DriverState"] --> SC["Score All<br/>Scenarios"]

    SC --> S01["S01: ?"]
    SC --> S02["S02: 8 ✓"]
    SC --> S03["S03: -∞"]
    SC --> S04["S04: -∞"]
    SC --> SDot["..."]
    SC --> S17["S17: 3"]

    S02 --> |"Highest Score"| MS["Matched: S02<br/>Confidence: HIGH"]

    subgraph Legend
        REQ["Required: must match"]
        STR["Strong: +3 points"]
        SUP["Supporting: +1 point"]
        EXC["Excluding: -∞"]
    end
```

---

## L1 Override Logic

```mermaid
flowchart TB
    DS["DriverState"] --> CHK{"L1 Safety<br/>Check"}

    CHK --> |"clinical_priority=urgent"| W1["A_WARN_ACTIVE_SYMPTOMS"]
    CHK --> |"medical_constraints=pregnancy"| W2["A_WARN_PREGNANCY_OR_GROWTH"]
    CHK --> |"biological_stability=unstable"| W3["A_WARN_BIOLOGICAL_INSTABILITY"]
    CHK --> |"medical_constraints=contraindicated"| B1["A_BLOCK_TREATMENT_OPTIONS"]

    W1 --> SUP["Suppression Policy"]
    W2 --> SUP
    W3 --> SUP
    B1 --> SUP

    SUP --> |"Block"| SUPB["Suppress B_OPT_*<br/>Suppress B_COMPARE_*<br/>Suppress Costs"]
    SUP --> |"Limit"| SUPL["Remove comparative language<br/>Remove certainty language"]
    SUP --> |"None"| SUPN["Full content allowed"]
```

---

## Report Composition Flow

```mermaid
flowchart TB
    subgraph Inputs
        SC["Selected Content"]
        TP["Tone Profile"]
        DR["Drivers"]
    end

    Inputs --> CC["Apply Composition Contract"]

    CC --> S0["0: Warnings<br/>(if L1 active)"]
    CC --> S1["1: Disclaimer<br/>(always)"]
    CC --> S2["2: Summary<br/>(always)"]
    CC --> S3["3: Context"]
    CC --> S4["4: Interpretation"]
    CC --> S5["5: Options<br/>(if not blocked)"]
    CC --> S6["6: Comparison<br/>(if 2+ options)"]
    CC --> S7["7: Trade-offs<br/>(if detected)"]
    CC --> S8["8: Process<br/>(if options shown)"]
    CC --> S9["9: Costs<br/>(if not blocked)"]
    CC --> S10["10: Risk Language<br/>(always)"]
    CC --> S11["11: Next Steps<br/>(always, TP-06)"]

    S0 --> R["Assembled Report"]
    S1 --> R
    S2 --> R
    S3 --> R
    S4 --> R
    S5 --> R
    S6 --> R
    S7 --> R
    S8 --> R
    S9 --> R
    S10 --> R
    S11 --> R
```

---

## QA Gate

```mermaid
flowchart LR
    DR["Draft Report"] --> TC["Trace<br/>Collector"]
    TC --> SL["Semantic<br/>Leakage Check"]
    SL --> VC["Validate<br/>Contract"]

    VC --> |"All Pass"| P["✓ PASS"]
    VC --> |"Minor Issues"| F["⚠ FLAG"]
    VC --> |"Critical Issues"| B["✗ BLOCK"]

    P --> DEL["Deliver Report"]
    F --> REV["Review + Deliver"]
    B --> FB["Use Fallback"]

    TC --> AR[("Audit<br/>Store")]
```
