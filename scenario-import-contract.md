# Scenario Import Contract

One JSON file per scenario (`S00.json` – `S17.json`). Every text field needs **English + Dutch**.

---

## JSON Format

```json
{
  "scenario_id": "S02",
  "name": {
    "en": "Single tooth missing, visible zone",
    "nl": "Eén tand ontbreekt, zichtbare zone"
  },

  "block_0_personal_summary": {
    "CONTEXT_DESCRIPTION": {
      "en": "a single missing tooth in a visible area",
      "nl": "een ontbrekende tand in een zichtbare zone"
    },
    "PRIMARY_GOAL": {
      "en": "restoring both the appearance and function of your smile",
      "nl": "het herstellen van zowel het uiterlijk als de functie van uw glimlach"
    },
    "MAIN_CONSTRAINT": {
      "en": "treatment duration and cost",
      "nl": "behandelduur en kosten"
    }
  },

  "block_1_situation": {
    "CORE_SITUATION_DESCRIPTION": {
      "en": "a single missing tooth in the front of your mouth, which affects both appearance and bite function",
      "nl": "een ontbrekende tand aan de voorkant van uw mond, wat zowel het uiterlijk als de bijtfunctie beïnvloedt"
    },
    "NUANCE_FACTOR": {
      "en": "the aesthetic visibility of the gap in daily life",
      "nl": "de esthetische zichtbaarheid van de opening in het dagelijks leven"
    },
    "SECONDARY_FACTOR": {
      "en": "the long-term health of surrounding teeth and bone",
      "nl": "de langetermijngezondheid van omliggende tanden en bot"
    }
  },

  "block_2_treatment_directions": {
    "DIRECTION_1_CORE": {
      "en": "a fixed, implant-based replacement is placed in the jawbone",
      "nl": "een vaste, implantaatgedragen vervanging in het kaakbot wordt geplaatst"
    },
    "DIRECTION_2_CORE": {
      "en": "a bridge solution using adjacent teeth as support",
      "nl": "een brugoplossing met aangrenzende tanden als steun"
    },
    "DIRECTION_3_CORE": {
      "en": "a removable prosthetic option is used as a temporary or long-term solution",
      "nl": "een uitneembare prothese als tijdelijke of langetermijnoplossing wordt ingezet"
    }
  },

  "block_3_options": [
    {
      "OPTION_TITLE": {
        "en": "Single Implant with Crown",
        "nl": "Enkelvoudig implantaat met kroon"
      },
      "OPTION_DESCRIPTION": {
        "en": "placing a titanium post in the jawbone, topped with a custom-made ceramic crown",
        "nl": "het plaatsen van een titanium stift in het kaakbot, afgewerkt met een op maat gemaakte keramische kroon"
      },
      "PROCESS_OVERVIEW": {
        "en": "a surgical placement, a healing phase, and a final crown fitting",
        "nl": "een chirurgische plaatsing, een genezingsfase en een definitieve kroonplaatsing"
      },
      "OPTION_LIMITATIONS": {
        "en": "Sufficient jawbone density is needed, and the healing period can take several months",
        "nl": "Voldoende kaakbotdichtheid is nodig en de genezingsperiode kan enkele maanden duren"
      },
      "PROFILE_MATCH": {
        "en": "seek a long-term, fixed solution with a natural appearance",
        "nl": "op zoek zijn naar een langdurige, vaste oplossing met een natuurlijk uiterlijk"
      },
      "pricing": { "min": 2200, "max": 2500, "currency": "EUR" },
      "duration": { "min_months": 3, "max_months": 7 },
      "recovery_days": 5
    },
  ],

  "block_4_expected_results": {
    "en": "The expected outcome typically relates to restored chewing function, improved appearance, and prevention of further bone loss, depending on the initial situation and the chosen approach. Individual factors such as bone quality, oral hygiene habits, and overall health may influence the final result. Results vary from person to person and can only be assessed more specifically after professional evaluation.",
    "nl": "De verwachte uitkomst heeft doorgaans betrekking op herstelde kauwfunctie, verbeterd uiterlijk en preventie van verder botverlies, afhankelijk van de uitgangssituatie en de gekozen aanpak. Individuele factoren zoals botkwaliteit, mondhygiënegewoonten en algemene gezondheid kunnen het uiteindelijke resultaat beïnvloeden. Resultaten verschillen per persoon en kunnen pas concreet worden ingeschat na professioneel onderzoek."
  },

  "block_5_duration": {
    "en": "The total treatment duration may range from 1 month to 7 months, depending on the selected direction and planning. Factors such as bone healing speed, the number of appointments required, and any preparatory procedures may influence this timeframe. An exact time estimate is usually determined only after clinical evaluation.",
    "nl": "De totale behandelduur kan variëren van 1 maand tot 7 maanden, afhankelijk van de gekozen richting en planning. Factoren zoals de snelheid van botheling, het aantal benodigde afspraken en eventuele voorbereidende ingrepen kunnen dit tijdsverloop beïnvloeden. Een exacte tijdsinschatting wordt doorgaans pas na klinische evaluatie bepaald."
  },

  "block_6_recovery": {
    "en": "Following treatment, a recovery period of varying intensity may be experienced. This may temporarily affect daily activities such as eating, speaking, and physical activity. In some cases, additional follow-up may be required when signs of infection or prolonged discomfort occur after placement.",
    "nl": "Na de behandeling kan een herstelperiode van wisselende intensiteit worden ervaren. Dit kan tijdelijk invloed hebben op dagelijkse activiteiten zoals eten, spreken en fysieke activiteit. In sommige gevallen kan extra opvolging nodig zijn wanneer tekenen van infectie of langdurig ongemak optreden na plaatsing."
  },

  "block_7_cost": {
    "en": "Costs may vary depending on the selected approach, materials used, and individual circumstances. Elements such as the type of restoration, material choice, and any preparatory treatments like bone grafting typically play a role. In some pathways, additional phases or preparatory treatments may be included. A transparent discussion of costs with a practitioner helps align financial expectations with your priorities.",
    "nl": "De kosten kunnen variëren afhankelijk van de gekozen aanpak, het materiaalgebruik en individuele omstandigheden. Elementen zoals het type restauratie, materiaalkeuze en eventuele voorbereidende behandelingen zoals botopbouw spelen hierbij doorgaans een rol. In sommige trajecten kunnen bijkomende fases of voorbereidende behandelingen worden meegenomen. Een transparante kostenbespreking met een behandelaar helpt om financiële verwachtingen af te stemmen op uw prioriteiten."
  }
}
```

---

## Rules

1. Every text field needs `en` + `nl`. Dutch must be natural, not machine-translated.
2. Blocks 0–3: Write as **sentence fragments** — they must read naturally when plugged into the templates above.
3. Blocks 4–7: Write as **full paragraphs** — these are the complete block content, not fragments.
4. **No medical advice**, no guarantees, no ranking. Use "may", "typically", "in some cases".
5. `block_3_options`: 1–3 options. Each needs all 5 text fields + `pricing` + `duration` + `recovery_days`.
6. `block_2_treatment_directions`: 2–3 directions. Omit `DIRECTION_3_CORE` if only 2.

---

## Scenarios

S00 Fallback, S01 Discoloration, S02 Single missing (visible), S03 Single missing (back), S04 Multiple missing (front), S05 Multiple missing (back), S06 Multiple missing (spread), S07 Full upper edentulous, S08 Full lower edentulous, S09 Full jaw edentulous, S10 Crowding/alignment, S11 Bite issues, S12 Loose teeth/pain (ACUTE), S13 Worn teeth/erosion, S14 Gum recession, S15 Old restorations, S16 Cosmetic only, S17 Combined complex
