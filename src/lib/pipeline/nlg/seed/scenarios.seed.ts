/**
 * Scenario Seed Data
 *
 * Auto-generated from content/scenarios/ markdown files
 * Run migration: npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/migrateScenarios.ts
 *
 * Generated: 2026-02-12T12:01:57.650Z
 */

import type { ScenarioCreateInput } from "../schemas/ScenarioSchema";

export const SCENARIO_SEEDS: ScenarioCreateInput[] = [
  {
    "_id": "S00",
    "name": {
      "en": "Generic Assessment",
      "nl": "Fallback scenario when no specific match"
    },
    "description": {
      "en": "Fallback scenario when no specific match",
      "nl": ""
    },
    "is_fallback": true,
    "is_safety_scenario": false,
    "priority": 18,
    "matching": {
      "required_drivers": {},
      "strong_drivers": {},
      "supporting_drivers": {},
      "excluding_drivers": {},
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "Based on the information provided, your dental situation requires individual assessment by a dental professional.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "Your responses suggest a dental concern that doesn't fit a single standard pattern.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "This may mean your situation is unique, requires further evaluation, or involves factors that need professional assessment.",
        "nl": ""
      }
    },
    "treatment_options": [],
    "version": "2.0.0"
  },
  {
    "_id": "S01",
    "name": {
      "en": "No missing teeth, discoloration",
      "nl": "Patient with aesthetic concerns, no missing teeth"
    },
    "description": {
      "en": "Patient with aesthetic concerns, no missing teeth",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 12,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "no_missing_teeth"
        ],
        "profile_type": [
          "aesthetic",
          "mixed"
        ]
      },
      "strong_drivers": {
        "clinical_priority": [
          "elective"
        ]
      },
      "supporting_drivers": {
        "aesthetic_tolerance": [
          "conservative",
          "moderate"
        ],
        "budget_type": [
          "balanced",
          "premium"
        ]
      },
      "excluding_drivers": {
        "clinical_priority": [
          "urgent",
          "semi_urgent"
        ],
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed",
          "mixed_pattern",
          "extensive_missing",
          "full_mouth_compromised"
        ]
      },
      "preferred_tags": [
        "issue_discoloration"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are primarily concerned about the color of your teeth, while they are otherwise fully present and cause no functional issues.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "In this scenario, your teeth are structurally sound, but the color has gradually changed.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "This is often noticeable in photos, in the mirror, or when you compare yourself to earlier times.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Professional Teeth Whitening",
          "nl": "Professional Teeth Whitening"
        },
        "rank": 1,
        "category": "whitening",
        "description": {
          "en": "A controlled treatment that lightens the natural tooth color, through one or more sessions or through a short course.",
          "nl": "A controlled treatment that lightens the natural tooth color, through one or more sessions or through a short course."
        },
        "benefits": [
          {
            "en": "Quick visible improvement",
            "nl": "Quick visible improvement"
          },
          {
            "en": "No intervention on healthy teeth",
            "nl": "No intervention on healthy teeth"
          },
          {
            "en": "No recovery time",
            "nl": "No recovery time"
          },
          {
            "en": "Often combinable with other aesthetic steps",
            "nl": "Often combinable with other aesthetic steps"
          }
        ]
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Veneers for Deeper Discoloration",
          "nl": "Veneers for Deeper Discoloration"
        },
        "rank": 2,
        "category": "veneer",
        "description": {
          "en": "Thin shells (porcelain or composite) placed on the front of the teeth to correct color and appearance.",
          "nl": "Thin shells (porcelain or composite) placed on the front of the teeth to correct color and appearance."
        },
        "benefits": [
          {
            "en": "Long-lasting color stability",
            "nl": "Long-lasting color stability"
          },
          {
            "en": "Precise matching of color and shape",
            "nl": "Precise matching of color and shape"
          },
          {
            "en": "Less maintenance in the long term",
            "nl": "Less maintenance in the long term"
          }
        ]
      }
    ],
    "pricing": {
      "min": 200,
      "max": 1300,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S02",
    "name": {
      "en": "Single tooth missing, visible zone",
      "nl": "Single missing tooth in anterior aesthetic zone"
    },
    "description": {
      "en": "Single missing tooth in anterior aesthetic zone",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 9,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "single_missing_tooth"
        ]
      },
      "strong_drivers": {
        "profile_type": [
          "aesthetic",
          "mixed"
        ],
        "clinical_priority": [
          "elective"
        ]
      },
      "supporting_drivers": {
        "aesthetic_tolerance": [
          "moderate",
          "aggressive"
        ],
        "biological_stability": [
          "stable"
        ]
      },
      "excluding_drivers": {
        "clinical_priority": [
          "urgent"
        ]
      },
      "preferred_tags": [
        "location_anterior"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "{{PATIENT_NAME}}, you have one missing tooth in {{TOOTH_ZONE}}, affecting both appearance and function.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "{{TOOTH_ZONE_DESCRIPTION}} is visible during conversation and affects both aesthetics and chewing.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Your surrounding teeth are stable, which means both treatment options are suitable for you.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Single Implant with Crown",
          "nl": "Single Implant with Crown"
        },
        "rank": 1,
        "category": "implant",
        "description": {
          "en": "A titanium post is placed into the jawbone. After healing (3-6 months), a custom crown attaches to it. The result functions like a natural tooth.",
          "nl": "A titanium post is placed into the jawbone. After healing (3-6 months), a custom crown attaches to it. The result functions like a natural tooth."
        },
        "benefits": [
          {
            "en": "Does not modify neighboring teeth",
            "nl": "Does not modify neighboring teeth"
          },
          {
            "en": "Helps preserve bone structure",
            "nl": "Helps preserve bone structure"
          },
          {
            "en": "No special maintenance once healed",
            "nl": "No special maintenance once healed"
          }
        ],
        "considerations": [
          {
            "en": "Higher upfront cost",
            "nl": "Higher upfront cost"
          },
          {
            "en": "Healing period of 3-6 months",
            "nl": "Healing period of 3-6 months"
          },
          {
            "en": "Multiple appointments required",
            "nl": "Multiple appointments required"
          }
        ],
        "ideal_for": {
          "en": "You prioritize long-term durability; Preserving healthy adjacent teeth is important; Bone quality is adequate (dentist will assess)",
          "nl": "You prioritize long-term durability; Preserving healthy adjacent teeth is important; Bone quality is adequate (dentist will assess)"
        },
        "pricing": {
          "min": 2200,
          "max": 2500,
          "currency": "EUR"
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Adhesive (Maryland) Bridge",
          "nl": "Adhesive (Maryland) Bridge"
        },
        "rank": 2,
        "category": "bridge",
        "description": {
          "en": "A replacement tooth bonds to the back of adjacent teeth. No surgical procedure is required.",
          "nl": "A replacement tooth bonds to the back of adjacent teeth. No surgical procedure is required."
        },
        "benefits": [
          {
            "en": "Shorter treatment time (2-4 weeks)",
            "nl": "Shorter treatment time (2-4 weeks)"
          },
          {
            "en": "Usually lower upfront cost",
            "nl": "Usually lower upfront cost"
          },
          {
            "en": "No surgery required",
            "nl": "No surgery required"
          },
          {
            "en": "Minimal impact on daily life",
            "nl": "Minimal impact on daily life"
          }
        ],
        "considerations": [
          {
            "en": "May need replacement after 10-15 years",
            "nl": "May need replacement after 10-15 years"
          },
          {
            "en": "Relies on adjacent teeth for support",
            "nl": "Relies on adjacent teeth for support"
          },
          {
            "en": "Not suitable for every case",
            "nl": "Not suitable for every case"
          }
        ],
        "ideal_for": {
          "en": "You prefer a non-surgical approach; A faster timeline is important; Surgery is not possible or advised",
          "nl": "You prefer a non-surgical approach; A faster timeline is important; Surgery is not possible or advised"
        }
      }
    ],
    "pricing": {
      "min": 1500,
      "max": 2500,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S03",
    "name": {
      "en": "Single tooth missing, posterior zone",
      "nl": "Single missing tooth in chewing area"
    },
    "description": {
      "en": "Single missing tooth in chewing area",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 10,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "single_missing_tooth"
        ]
      },
      "strong_drivers": {
        "profile_type": [
          "functional",
          "comfort"
        ],
        "clinical_priority": [
          "elective",
          "semi_urgent"
        ]
      },
      "supporting_drivers": {
        "treatment_philosophy": [
          "durability_focused"
        ]
      },
      "excluding_drivers": {},
      "preferred_tags": [
        "location_posterior"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are missing one tooth in the posterior chewing zone.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "A missing tooth in the back is usually less visible, but you often notice it when eating.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Some people automatically chew more on one side, avoid hard foods, or experience that the pressure distribution no longer feels right.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Single Implant with Crown",
          "nl": "Single Implant with Crown"
        },
        "rank": 1,
        "category": "implant",
        "description": {
          "en": "An implant replaces the missing tooth root. A crown is then placed to restore the tooth function.",
          "nl": "An implant replaces the missing tooth root. A crown is then placed to restore the tooth function."
        },
        "benefits": [
          {
            "en": "Functional restoration with natural pressure distribution",
            "nl": "Functional restoration with natural pressure distribution"
          },
          {
            "en": "Stable, durable solution",
            "nl": "Stable, durable solution"
          },
          {
            "en": "No burden on adjacent teeth",
            "nl": "No burden on adjacent teeth"
          },
          {
            "en": "Can contribute to preservation of bone structure",
            "nl": "Can contribute to preservation of bone structure"
          }
        ],
        "considerations": [
          {
            "en": "Surgery and healing are required",
            "nl": "Surgery and healing are required"
          },
          {
            "en": "Treatment in multiple steps",
            "nl": "Treatment in multiple steps"
          },
          {
            "en": "Higher cost",
            "nl": "Higher cost"
          }
        ],
        "ideal_for": {
          "en": "You want a durable solution and accept a longer process for maximum stability.",
          "nl": "You want a durable solution and accept a longer process for maximum stability."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Bridge",
          "nl": "Bridge"
        },
        "rank": 2,
        "category": "bridge",
        "description": {
          "en": "A bridge fills the space with a fixed construction that restores chewing function.",
          "nl": "A bridge fills the space with a fixed construction that restores chewing function."
        },
        "benefits": [
          {
            "en": "Functional replacement",
            "nl": "Functional replacement"
          },
          {
            "en": "Often faster to complete",
            "nl": "Often faster to complete"
          },
          {
            "en": "Clear approach",
            "nl": "Clear approach"
          }
        ],
        "considerations": [
          {
            "en": "Dependent on execution and support points",
            "nl": "Dependent on execution and support points"
          },
          {
            "en": "Not suitable for every situation",
            "nl": "Not suitable for every situation"
          },
          {
            "en": "Cost remains a factor",
            "nl": "Cost remains a factor"
          }
        ],
        "ideal_for": {
          "en": "You primarily seek functional restoration and want a practical process within a budget consideration.",
          "nl": "You primarily seek functional restoration and want a practical process within a budget consideration."
        },
        "pricing": {
          "min": 2100,
          "max": 2700,
          "currency": "EUR"
        }
      }
    ],
    "pricing": {
      "min": 2100,
      "max": 2700,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S04",
    "name": {
      "en": "2-4 teeth adjacent",
      "nl": "Multiple adjacent teeth missing"
    },
    "description": {
      "en": "Multiple adjacent teeth missing",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 6,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "multiple_adjacent"
        ]
      },
      "strong_drivers": {
        "treatment_viability": [
          "multiple_site"
        ],
        "biological_stability": [
          "stable",
          "moderate"
        ]
      },
      "supporting_drivers": {
        "profile_type": [
          "functional",
          "mixed"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_dispersed",
          "full_mouth_compromised"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are missing multiple teeth next to each other, which primarily has a functional impact.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When two to four teeth next to each other are missing, the way you chew often changes noticeably.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "The load becomes unevenly distributed, and many people notice they automatically start chewing on one side or avoiding certain foods.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Option 1",
          "nl": "Option 1"
        },
        "rank": 1,
        "category": "other",
        "description": {
          "en": "Two implants are placed in the jawbone and serve as anchor points for a bridge that replaces the missing teeth. This restores chewing function without relying on natural teeth for support.",
          "nl": "Two implants are placed in the jawbone and serve as anchor points for a bridge that replaces the missing teeth. This restores chewing function without relying on natural teeth for support."
        },
        "benefits": [
          {
            "en": "Restoration of chewing function over a larger area",
            "nl": "Restoration of chewing function over a larger area"
          },
          {
            "en": "Stable and durable design",
            "nl": "Stable and durable design"
          },
          {
            "en": "No burden on adjacent natural teeth",
            "nl": "No burden on adjacent natural teeth"
          },
          {
            "en": "Suitable for multiple missing teeth next to each other",
            "nl": "Suitable for multiple missing teeth next to each other"
          }
        ],
        "considerations": [
          {
            "en": "Requires sufficient bone volume",
            "nl": "Requires sufficient bone volume"
          },
          {
            "en": "Treatment proceeds in multiple steps",
            "nl": "Treatment proceeds in multiple steps"
          },
          {
            "en": "Higher cost than single-tooth solutions",
            "nl": "Higher cost than single-tooth solutions"
          }
        ],
        "ideal_for": {
          "en": "You are looking for a structural and reliable restoration of the bite and are willing to follow a longer process for more stability in the long term.",
          "nl": "You are looking for a structural and reliable restoration of the bite and are willing to follow a longer process for more stability in the long term."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Option 2",
          "nl": "Option 2"
        },
        "rank": 2,
        "category": "other"
      }
    ],
    "pricing": {
      "min": 4500,
      "max": 6000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S05",
    "name": {
      "en": "2-4 teeth dispersed",
      "nl": "Multiple non-adjacent teeth missing"
    },
    "description": {
      "en": "Multiple non-adjacent teeth missing",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 7,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "multiple_dispersed"
        ]
      },
      "strong_drivers": {
        "treatment_viability": [
          "multiple_site"
        ]
      },
      "supporting_drivers": {
        "profile_type": [
          "functional",
          "mixed"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_adjacent",
          "full_mouth_compromised"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are missing multiple teeth at different locations in the mouth.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When two to four teeth are missing but not next to each other, an uneven loading of the dentition often results.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Many people notice that they unconsciously avoid certain zones or that chewing feels less natural than before.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Multiple Implants with Crowns",
          "nl": "Multiple Implants with Crowns"
        },
        "rank": 1,
        "category": "implant",
        "description": {
          "en": "Per missing tooth, an implant is placed with a crown on top. This approach is repeated per zone where a tooth is missing.",
          "nl": "Per missing tooth, an implant is placed with a crown on top. This approach is repeated per zone where a tooth is missing."
        },
        "benefits": [
          {
            "en": "Very flexible per zone",
            "nl": "Very flexible per zone"
          },
          {
            "en": "Natural loading per tooth",
            "nl": "Natural loading per tooth"
          },
          {
            "en": "No reliance on surrounding teeth",
            "nl": "No reliance on surrounding teeth"
          },
          {
            "en": "Well adaptable to different situations",
            "nl": "Well adaptable to different situations"
          }
        ],
        "considerations": [
          {
            "en": "Multiple procedures needed",
            "nl": "Multiple procedures needed"
          },
          {
            "en": "Higher total cost",
            "nl": "Higher total cost"
          },
          {
            "en": "Process may feel longer due to spreading",
            "nl": "Process may feel longer due to spreading"
          }
        ],
        "ideal_for": {
          "en": "You want maximum natural function per tooth and are willing to follow a more extensive process for optimal distribution.",
          "nl": "You want maximum natural function per tooth and are willing to follow a more extensive process for optimal distribution."
        },
        "duration": {
          "min_months": 4,
          "max_months": 7
        },
        "recovery": {
          "days": 4
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Bridge on Implants",
          "nl": "Bridge on Implants"
        },
        "rank": 2,
        "category": "implant",
        "description": {
          "en": "Multiple missing teeth are replaced per zone by a bridge supported by two implants.",
          "nl": "Multiple missing teeth are replaced per zone by a bridge supported by two implants."
        },
        "benefits": [
          {
            "en": "Fewer implants needed",
            "nl": "Fewer implants needed"
          },
          {
            "en": "Clear, manageable approach",
            "nl": "Clear, manageable approach"
          },
          {
            "en": "Strong functional stability per zone",
            "nl": "Strong functional stability per zone"
          }
        ],
        "considerations": [
          {
            "en": "Less individual per tooth",
            "nl": "Less individual per tooth"
          },
          {
            "en": "Less flexible for later adjustments",
            "nl": "Less flexible for later adjustments"
          },
          {
            "en": "Requires sufficient bone volume per zone",
            "nl": "Requires sufficient bone volume per zone"
          }
        ],
        "ideal_for": {
          "en": "You are looking for a practical and structured solution with a clear balance between stability and treatment complexity.",
          "nl": "You are looking for a practical and structured solution with a clear balance between stability and treatment complexity."
        },
        "pricing": {
          "min": 4500,
          "max": 6000,
          "currency": "EUR"
        }
      }
    ],
    "pricing": {
      "min": 2200,
      "max": 6000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S06",
    "name": {
      "en": "Mix: missing teeth + aesthetic problem",
      "nl": "Combination of missing teeth and aesthetic concerns"
    },
    "description": {
      "en": "Combination of missing teeth and aesthetic concerns",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 8,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed",
          "mixed_pattern"
        ],
        "profile_type": [
          "mixed"
        ]
      },
      "strong_drivers": {},
      "supporting_drivers": {
        "aesthetic_tolerance": [
          "moderate"
        ]
      },
      "excluding_drivers": {
        "profile_type": [
          "aesthetic",
          "functional",
          "comfort"
        ]
      },
      "preferred_tags": [
        "bother_combination",
        "motivation_combination"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are dealing with a combination of missing teeth and aesthetic concerns.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "In this scenario, two aspects play simultaneously.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "On one hand, one or more teeth are missing, which affects chewing comfort and stability.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Option 1",
          "nl": "Option 1"
        },
        "rank": 1,
        "category": "other",
        "description": {
          "en": "Missing teeth are replaced per zone by implants with crowns. At the same time, visible teeth that are aesthetically bothersome are corrected with porcelain veneers or crowns.",
          "nl": "Missing teeth are replaced per zone by implants with crowns. At the same time, visible teeth that are aesthetically bothersome are corrected with porcelain veneers or crowns."
        },
        "benefits": [
          {
            "en": "Restoration of chewing function and stability",
            "nl": "Restoration of chewing function and stability"
          },
          {
            "en": "Improvement of aesthetics in the same treatment",
            "nl": "Improvement of aesthetics in the same treatment"
          },
          {
            "en": "More harmony in the overall appearance of the smile",
            "nl": "More harmony in the overall appearance of the smile"
          },
          {
            "en": "Solutions are tailored per zone",
            "nl": "Solutions are tailored per zone"
          }
        ],
        "considerations": [
          {
            "en": "Combination treatment with multiple steps",
            "nl": "Combination treatment with multiple steps"
          },
          {
            "en": "Higher total cost",
            "nl": "Higher total cost"
          },
          {
            "en": "Careful planning needed to align everything",
            "nl": "Careful planning needed to align everything"
          }
        ],
        "ideal_for": {
          "en": "You notice that a single solution is insufficient and consciously choose a coherent approach that improves both function and appearance.",
          "nl": "You notice that a single solution is insufficient and consciously choose a coherent approach that improves both function and appearance."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Option 2",
          "nl": "Option 2"
        },
        "rank": 2,
        "category": "other"
      }
    ],
    "pricing": {
      "min": 900,
      "max": 2500,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S07",
    "name": {
      "en": "5+ teeth adjacent (segmental)",
      "nl": "Extensive missing teeth in one segment"
    },
    "description": {
      "en": "Extensive missing teeth in one segment",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 4,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "extensive_missing"
        ]
      },
      "strong_drivers": {
        "treatment_viability": [
          "full_mouth"
        ],
        "biological_stability": [
          "stable",
          "moderate"
        ]
      },
      "supporting_drivers": {
        "profile_type": [
          "functional"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are missing a larger contiguous segment of teeth.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When more than five adjacent teeth are missing, the functioning of the bite changes significantly.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "The remaining teeth cannot adequately compensate for such a large gap.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Bridge of 6 Teeth on 3 Implants",
          "nl": "Bridge of 6 Teeth on 3 Implants"
        },
        "rank": 1,
        "category": "implant",
        "description": {
          "en": "Three implants serve as anchor points for a bridge that replaces six teeth.",
          "nl": "Three implants serve as anchor points for a bridge that replaces six teeth."
        },
        "benefits": [
          {
            "en": "Durable and functional restoration",
            "nl": "Durable and functional restoration"
          },
          {
            "en": "Limited number of implants",
            "nl": "Limited number of implants"
          },
          {
            "en": "Natural chewing function possible",
            "nl": "Natural chewing function possible"
          },
          {
            "en": "Fixed solution without support from natural teeth",
            "nl": "Fixed solution without support from natural teeth"
          }
        ],
        "considerations": [
          {
            "en": "Requires sufficient bone volume",
            "nl": "Requires sufficient bone volume"
          },
          {
            "en": "Treatment in multiple steps",
            "nl": "Treatment in multiple steps"
          },
          {
            "en": "Higher cost than smaller solutions",
            "nl": "Higher cost than smaller solutions"
          }
        ],
        "ideal_for": {
          "en": "You are looking for a reliable solution for a larger segment, without making the treatment unnecessarily complex.",
          "nl": "You are looking for a reliable solution for a larger segment, without making the treatment unnecessarily complex."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Bridge of 10 Teeth on 4 Implants",
          "nl": "Bridge of 10 Teeth on 4 Implants"
        },
        "rank": 2,
        "category": "implant",
        "description": {
          "en": "Four implants support a longer bridge that replaces up to ten teeth within one segment.",
          "nl": "Four implants support a longer bridge that replaces up to ten teeth within one segment."
        },
        "benefits": [
          {
            "en": "Very high stability",
            "nl": "Very high stability"
          },
          {
            "en": "Efficient reconstruction of a large segment",
            "nl": "Efficient reconstruction of a large segment"
          },
          {
            "en": "Even distribution of forces",
            "nl": "Even distribution of forces"
          },
          {
            "en": "Suitable for extensive tooth loss",
            "nl": "Suitable for extensive tooth loss"
          }
        ],
        "considerations": [
          {
            "en": "Higher total cost",
            "nl": "Higher total cost"
          },
          {
            "en": "Careful planning required",
            "nl": "Careful planning required"
          },
          {
            "en": "Dependent on bone volume and anatomy",
            "nl": "Dependent on bone volume and anatomy"
          }
        ],
        "ideal_for": {
          "en": "You want comprehensive and durable restoration and choose maximum stability in the long term.",
          "nl": "You want comprehensive and durable restoration and choose maximum stability in the long term."
        }
      }
    ],
    "pricing": {
      "min": 6500,
      "max": 15000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S08",
    "name": {
      "en": "5+ teeth dispersed",
      "nl": "Extensive missing teeth spread across mouth"
    },
    "description": {
      "en": "Extensive missing teeth spread across mouth",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 5,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "extensive_missing"
        ]
      },
      "strong_drivers": {
        "treatment_viability": [
          "full_mouth"
        ]
      },
      "supporting_drivers": {
        "profile_type": [
          "functional",
          "mixed"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are missing multiple teeth spread over different zones in the mouth.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When more than five teeth are missing but not next to each other, a more complex picture often emerges than with one contiguous segment.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Each zone contributes to chewing comfort in its own way, which can make the whole feel less predictable.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Multiple Implants with Crowns per Zone",
          "nl": "Multiple Implants with Crowns per Zone"
        },
        "rank": 1,
        "category": "implant",
        "description": {
          "en": "Per missing tooth, an implant is placed with a crown on top. This approach is applied in the zones where teeth are missing.",
          "nl": "Per missing tooth, an implant is placed with a crown on top. This approach is applied in the zones where teeth are missing."
        },
        "benefits": [
          {
            "en": "Very flexible per zone",
            "nl": "Very flexible per zone"
          },
          {
            "en": "Natural loading per tooth",
            "nl": "Natural loading per tooth"
          },
          {
            "en": "No reliance on surrounding teeth",
            "nl": "No reliance on surrounding teeth"
          },
          {
            "en": "Well adaptable to changing situations",
            "nl": "Well adaptable to changing situations"
          }
        ],
        "considerations": [
          {
            "en": "Multiple surgical procedures",
            "nl": "Multiple surgical procedures"
          },
          {
            "en": "Higher total cost",
            "nl": "Higher total cost"
          },
          {
            "en": "Process may feel longer due to spreading",
            "nl": "Process may feel longer due to spreading"
          }
        ],
        "ideal_for": {
          "en": "You want maximum functional control per zone and are willing to follow a more extensive process for the most natural possible distribution.",
          "nl": "You want maximum functional control per zone and are willing to follow a more extensive process for the most natural possible distribution."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Bridges on Implants per Zone",
          "nl": "Bridges on Implants per Zone"
        },
        "rank": 2,
        "category": "implant",
        "description": {
          "en": "Within one zone, multiple missing teeth are replaced by a bridge supported by implants.",
          "nl": "Within one zone, multiple missing teeth are replaced by a bridge supported by implants."
        },
        "benefits": [
          {
            "en": "Fewer implants needed per zone",
            "nl": "Fewer implants needed per zone"
          },
          {
            "en": "Clear and manageable approach",
            "nl": "Clear and manageable approach"
          },
          {
            "en": "Strong functional stability",
            "nl": "Strong functional stability"
          }
        ],
        "considerations": [
          {
            "en": "Less individual per tooth",
            "nl": "Less individual per tooth"
          },
          {
            "en": "Less flexible for later adjustments",
            "nl": "Less flexible for later adjustments"
          },
          {
            "en": "Requires sufficient bone volume per zone",
            "nl": "Requires sufficient bone volume per zone"
          }
        ],
        "ideal_for": {
          "en": "You are looking for a practical and structured solution with a good balance between stability and treatment complexity.",
          "nl": "You are looking for a practical and structured solution with a good balance between stability and treatment complexity."
        }
      }
    ],
    "pricing": {
      "min": 2200,
      "max": 9000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S09",
    "name": {
      "en": "Full jaw edentulous",
      "nl": "Complete tooth loss in one or both jaws"
    },
    "description": {
      "en": "Complete tooth loss in one or both jaws",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 3,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "full_mouth_compromised"
        ]
      },
      "strong_drivers": {
        "treatment_viability": [
          "full_mouth"
        ]
      },
      "supporting_drivers": {
        "age_stage": [
          "senior"
        ],
        "profile_type": [
          "functional"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "no_missing_teeth",
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are completely edentulous in one jaw.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When a complete jaw is edentulous, this has a major impact on daily functioning.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Many people experience uncertainty when eating, speaking, or smiling, even when they outwardly adapt to the situation.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "All-on-4 or All-on-6 Fixed Bridge",
          "nl": "All-on-4 or All-on-6 Fixed Bridge"
        },
        "rank": 1,
        "category": "bridge",
        "description": {
          "en": "A fixed bridge is anchored on four or six implants and replaces all teeth in one jaw.",
          "nl": "A fixed bridge is anchored on four or six implants and replaces all teeth in one jaw."
        },
        "benefits": [
          {
            "en": "Very high stability",
            "nl": "Very high stability"
          },
          {
            "en": "Fixed feeling when chewing and speaking",
            "nl": "Fixed feeling when chewing and speaking"
          },
          {
            "en": "No removal or loosening",
            "nl": "No removal or loosening"
          },
          {
            "en": "Natural and reliable in daily use",
            "nl": "Natural and reliable in daily use"
          }
        ],
        "considerations": [
          {
            "en": "Higher cost",
            "nl": "Higher cost"
          },
          {
            "en": "Longer treatment duration",
            "nl": "Longer treatment duration"
          },
          {
            "en": "Careful planning and healing needed",
            "nl": "Careful planning and healing needed"
          }
        ]
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Snap-on Denture on 2-4 Implants",
          "nl": "Snap-on Denture on 2-4 Implants"
        },
        "rank": 2,
        "category": "implant",
        "description": {
          "en": "A removable denture that snaps onto two to four implants for extra stability.",
          "nl": "A removable denture that snaps onto two to four implants for extra stability."
        },
        "benefits": [
          {
            "en": "Better stability than a loose denture",
            "nl": "Better stability than a loose denture"
          },
          {
            "en": "Lower cost than a fixed bridge",
            "nl": "Lower cost than a fixed bridge"
          },
          {
            "en": "Less complex treatment",
            "nl": "Less complex treatment"
          },
          {
            "en": "Easily removable for cleaning",
            "nl": "Easily removable for cleaning"
          }
        ],
        "considerations": [
          {
            "en": "Not completely fixed",
            "nl": "Not completely fixed"
          },
          {
            "en": "Daily removal remains necessary",
            "nl": "Daily removal remains necessary"
          },
          {
            "en": "Less natural feeling than fixed teeth",
            "nl": "Less natural feeling than fixed teeth"
          }
        ],
        "ideal_for": {
          "en": "You are looking for a functional and affordable solution with clear improvement compared to a classic denture.",
          "nl": "You are looking for a functional and affordable solution with clear improvement compared to a classic denture."
        }
      }
    ],
    "pricing": {
      "min": 4000,
      "max": 20000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S10",
    "name": {
      "en": "Almost all teeth unsaveable",
      "nl": "Most teeth have poor prognosis"
    },
    "description": {
      "en": "Most teeth have poor prognosis",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 2,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "full_mouth_compromised"
        ]
      },
      "strong_drivers": {
        "biological_stability": [
          "unstable",
          "compromised"
        ]
      },
      "supporting_drivers": {
        "clinical_priority": [
          "semi_urgent",
          "urgent"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "no_missing_teeth",
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "For you, almost all teeth can no longer be saved.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When the majority of teeth can no longer be preserved, a situation arises that can be both functionally and emotionally heavy.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Chewing is often difficult, painful, or uncertain.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Fixed Denture Upper and Lower",
          "nl": "Fixed Denture Upper and Lower"
        },
        "rank": 1,
        "category": "denture",
        "description": {
          "en": "In both jaws, a fixed bridge is placed on multiple implants (for example All-on-4 or All-on-6).",
          "nl": "In both jaws, a fixed bridge is placed on multiple implants (for example All-on-4 or All-on-6)."
        },
        "benefits": [
          {
            "en": "Very high stability",
            "nl": "Very high stability"
          },
          {
            "en": "Fixed feeling when chewing and speaking",
            "nl": "Fixed feeling when chewing and speaking"
          },
          {
            "en": "No removable parts",
            "nl": "No removable parts"
          },
          {
            "en": "Great improvement in quality of life",
            "nl": "Great improvement in quality of life"
          }
        ],
        "considerations": [
          {
            "en": "High cost",
            "nl": "High cost"
          },
          {
            "en": "Long-term and phased treatment",
            "nl": "Long-term and phased treatment"
          },
          {
            "en": "Careful planning and healing needed",
            "nl": "Careful planning and healing needed"
          }
        ],
        "ideal_for": {
          "en": "You choose maximum fixation and comfort and are willing to invest in a durable total solution.",
          "nl": "You choose maximum fixation and comfort and are willing to invest in a durable total solution."
        },
        "pricing": {
          "min": 20000,
          "max": 50000,
          "currency": "EUR"
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Snap-on Denture Upper and Lower",
          "nl": "Snap-on Denture Upper and Lower"
        },
        "rank": 2,
        "category": "denture",
        "description": {
          "en": "Removable dentures that snap onto implants in both jaws.",
          "nl": "Removable dentures that snap onto implants in both jaws."
        },
        "benefits": [
          {
            "en": "Better stability than loose prostheses",
            "nl": "Better stability than loose prostheses"
          },
          {
            "en": "Lower cost than fixed bridges",
            "nl": "Lower cost than fixed bridges"
          },
          {
            "en": "Less complex treatment",
            "nl": "Less complex treatment"
          },
          {
            "en": "Easily removable for maintenance",
            "nl": "Easily removable for maintenance"
          }
        ],
        "considerations": [
          {
            "en": "Not completely fixed",
            "nl": "Not completely fixed"
          },
          {
            "en": "Daily removal remains necessary",
            "nl": "Daily removal remains necessary"
          },
          {
            "en": "Less natural feeling than fixed teeth",
            "nl": "Less natural feeling than fixed teeth"
          }
        ],
        "pricing": {
          "min": 8000,
          "max": 15000,
          "currency": "EUR"
        }
      }
    ],
    "pricing": {
      "min": 8000,
      "max": 50000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S11",
    "name": {
      "en": "No missing teeth, alignment issue",
      "nl": "Alignment or spacing concerns without missing teeth"
    },
    "description": {
      "en": "Alignment or spacing concerns without missing teeth",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 13,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "no_missing_teeth"
        ]
      },
      "strong_drivers": {
        "profile_type": [
          "aesthetic"
        ],
        "clinical_priority": [
          "elective"
        ]
      },
      "supporting_drivers": {
        "age_stage": [
          "young_adult",
          "adult"
        ],
        "aesthetic_tolerance": [
          "conservative"
        ]
      },
      "excluding_drivers": {},
      "preferred_tags": [
        "issue_alignment"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "Your teeth are completely present, but you are bothered by misalignment or irregular positioning.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "With misalignment without missing teeth, it's usually not about a functional problem, but about how your smile feels and looks.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Often it's small shifts, rotations, or uneven lines that you notice in photos or in the mirror.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Aligners (Invisible Braces)",
          "nl": "Aligners (Invisible Braces)"
        },
        "rank": 1,
        "category": "orthodontic",
        "description": {
          "en": "A series of transparent aligners that gradually move the teeth according to a digital treatment plan.",
          "nl": "A series of transparent aligners that gradually move the teeth according to a digital treatment plan."
        },
        "benefits": [
          {
            "en": "Invisible in daily life",
            "nl": "Invisible in daily life"
          },
          {
            "en": "No fixed braces",
            "nl": "No fixed braces"
          },
          {
            "en": "Digital planning in advance",
            "nl": "Digital planning in advance"
          },
          {
            "en": "Preservation of natural teeth",
            "nl": "Preservation of natural teeth"
          }
        ],
        "considerations": [
          {
            "en": "Treatment usually takes longer",
            "nl": "Treatment usually takes longer"
          },
          {
            "en": "Discipline needed in wearing",
            "nl": "Discipline needed in wearing"
          },
          {
            "en": "Result follows step by step",
            "nl": "Result follows step by step"
          }
        ],
        "ideal_for": {
          "en": "You want a structural correction and are willing to invest time in a gradual process.",
          "nl": "You want a structural correction and are willing to invest time in a gradual process."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Veneers for Shape or Position Problems",
          "nl": "Veneers for Shape or Position Problems"
        },
        "rank": 2,
        "category": "veneer",
        "description": {
          "en": "Porcelain veneers are placed on the front of the teeth to visually correct shape, position, and symmetry.",
          "nl": "Porcelain veneers are placed on the front of the teeth to visually correct shape, position, and symmetry."
        },
        "benefits": [
          {
            "en": "Shorter treatment",
            "nl": "Shorter treatment"
          },
          {
            "en": "Immediately visible result",
            "nl": "Immediately visible result"
          },
          {
            "en": "Correction of shape and color possible",
            "nl": "Correction of shape and color possible"
          },
          {
            "en": "Great influence on smile harmony",
            "nl": "Great influence on smile harmony"
          }
        ],
        "considerations": [
          {
            "en": "Interventions on healthy teeth require careful consideration",
            "nl": "Interventions on healthy teeth require careful consideration"
          },
          {
            "en": "More definitive character",
            "nl": "More definitive character"
          },
          {
            "en": "Cost per tooth",
            "nl": "Cost per tooth"
          }
        ],
        "ideal_for": {
          "en": "You mainly find the visual result important and don't want a long treatment.",
          "nl": "You mainly find the visual result important and don't want a long treatment."
        }
      }
    ],
    "pricing": {
      "min": 900,
      "max": 4000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S12",
    "name": {
      "en": "Loose teeth or pain (ACUTE)",
      "nl": "Acute symptoms requiring immediate attention"
    },
    "description": {
      "en": "Acute symptoms requiring immediate attention",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": true,
    "priority": 1,
    "matching": {
      "required_drivers": {
        "clinical_priority": [
          "urgent",
          "semi_urgent"
        ]
      },
      "strong_drivers": {},
      "supporting_drivers": {},
      "excluding_drivers": {
        "clinical_priority": [
          "elective"
        ]
      },
      "preferred_tags": [
        "acute_pain",
        "acute_infection",
        "acute_loose_missing",
        "issue_functional_pain"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You are experiencing looseness of teeth and/or pain complaints.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When teeth feel loose or cause pain, this can evoke uncertainty.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Many people notice this during chewing, with pressure on certain teeth, or even at rest.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Implants as Replacement",
          "nl": "Implants as Replacement"
        },
        "rank": 1,
        "category": "implant",
        "description": {
          "en": "Teeth that can no longer be preserved are replaced by implants with crowns, possibly spread over different zones.",
          "nl": "Teeth that can no longer be preserved are replaced by implants with crowns, possibly spread over different zones."
        },
        "benefits": [
          {
            "en": "Restoration of functional security",
            "nl": "Restoration of functional security"
          },
          {
            "en": "No reliance on possibly weakened teeth",
            "nl": "No reliance on possibly weakened teeth"
          },
          {
            "en": "Durable solution per tooth or zone",
            "nl": "Durable solution per tooth or zone"
          },
          {
            "en": "Reliable feeling when chewing",
            "nl": "Reliable feeling when chewing"
          }
        ],
        "considerations": [
          {
            "en": "Surgical procedure needed",
            "nl": "Surgical procedure needed"
          },
          {
            "en": "Treatment in multiple steps",
            "nl": "Treatment in multiple steps"
          },
          {
            "en": "Higher cost",
            "nl": "Higher cost"
          }
        ]
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Bridges with Limited Remaining Teeth",
          "nl": "Bridges with Limited Remaining Teeth"
        },
        "rank": 2,
        "category": "bridge",
        "description": {
          "en": "Multiple teeth are replaced together by a bridge that relies on implants or remaining stable elements.",
          "nl": "Multiple teeth are replaced together by a bridge that relies on implants or remaining stable elements."
        },
        "benefits": [
          {
            "en": "Restoration of function over a larger area",
            "nl": "Restoration of function over a larger area"
          },
          {
            "en": "Fewer separate procedures",
            "nl": "Fewer separate procedures"
          },
          {
            "en": "Clear and manageable approach",
            "nl": "Clear and manageable approach"
          }
        ],
        "considerations": [
          {
            "en": "Less individual per tooth",
            "nl": "Less individual per tooth"
          },
          {
            "en": "Requires sufficient stable support points",
            "nl": "Requires sufficient stable support points"
          },
          {
            "en": "Less flexible for later adjustments",
            "nl": "Less flexible for later adjustments"
          }
        ],
        "ideal_for": {
          "en": "You are looking for a practical and coherent solution with multiple involved teeth.",
          "nl": "You are looking for a practical and coherent solution with multiple involved teeth."
        }
      }
    ],
    "pricing": {
      "min": 2200,
      "max": 9000,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S13",
    "name": {
      "en": "Young profile, mild discoloration",
      "nl": "Young adult with minor aesthetic concerns"
    },
    "description": {
      "en": "Young adult with minor aesthetic concerns",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 14,
    "matching": {
      "required_drivers": {
        "age_stage": [
          "young_adult"
        ],
        "mouth_situation": [
          "no_missing_teeth"
        ]
      },
      "strong_drivers": {
        "profile_type": [
          "aesthetic"
        ],
        "clinical_priority": [
          "elective"
        ]
      },
      "supporting_drivers": {
        "budget_type": [
          "balanced",
          "economy"
        ]
      },
      "excluding_drivers": {
        "age_stage": [
          "senior"
        ]
      },
      "preferred_tags": [
        "issue_discoloration"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You have a young profile and are bothered by light discoloration of your teeth.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "In young people, discoloration is often not about serious color problems, but about subtle differences that become visible in photos, in bright light, or in comparison with others.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Many people experience their teeth as \"healthy, but not as fresh as they would like.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Professional Teeth Whitening",
          "nl": "Professional Teeth Whitening"
        },
        "rank": 1,
        "category": "whitening",
        "description": {
          "en": "A controlled treatment that lightens the natural tooth color, via one or more sessions.",
          "nl": "A controlled treatment that lightens the natural tooth color, via one or more sessions."
        },
        "benefits": [
          {
            "en": "Quick improvement",
            "nl": "Quick improvement"
          },
          {
            "en": "No intervention on healthy teeth",
            "nl": "No intervention on healthy teeth"
          },
          {
            "en": "No recovery time",
            "nl": "No recovery time"
          },
          {
            "en": "Safe and often well predictable result",
            "nl": "Safe and often well predictable result"
          }
        ],
        "considerations": [
          {
            "en": "The effect is temporary",
            "nl": "The effect is temporary"
          },
          {
            "en": "Periodic repetition may be needed",
            "nl": "Periodic repetition may be needed"
          },
          {
            "en": "Not every discoloration responds the same",
            "nl": "Not every discoloration responds the same"
          }
        ],
        "ideal_for": {
          "en": "You mainly want a fresher appearance and are looking for a simple, reversible solution.",
          "nl": "You mainly want a fresher appearance and are looking for a simple, reversible solution."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Veneers for Higher Aesthetic Expectations",
          "nl": "Veneers for Higher Aesthetic Expectations"
        },
        "rank": 2,
        "category": "veneer",
        "description": {
          "en": "Thin shells in composite or porcelain are placed on the front of the teeth to correct color and appearance.",
          "nl": "Thin shells in composite or porcelain are placed on the front of the teeth to correct color and appearance."
        },
        "benefits": [
          {
            "en": "More stable color result",
            "nl": "More stable color result"
          },
          {
            "en": "Possibility to improve shape and symmetry",
            "nl": "Possibility to improve shape and symmetry"
          },
          {
            "en": "Great influence on the overall picture of the smile",
            "nl": "Great influence on the overall picture of the smile"
          }
        ],
        "considerations": [
          {
            "en": "Interventions on healthy teeth require careful consideration",
            "nl": "Interventions on healthy teeth require careful consideration"
          },
          {
            "en": "More definitive character",
            "nl": "More definitive character"
          },
          {
            "en": "Cost per tooth",
            "nl": "Cost per tooth"
          }
        ],
        "ideal_for": {
          "en": "You notice that whitening would be insufficient or consciously choose a more permanent aesthetic correction.",
          "nl": "You notice that whitening would be insufficient or consciously choose a more permanent aesthetic correction."
        }
      }
    ],
    "pricing": {
      "min": 200,
      "max": 1300,
      "currency": "EUR"
    },
    "version": "2.0.0"
  },
  {
    "_id": "S14",
    "name": {
      "en": "Senior, limited budget",
      "nl": "Older patient with budget constraints"
    },
    "description": {
      "en": "Older patient with budget constraints",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 15,
    "matching": {
      "required_drivers": {
        "age_stage": [
          "senior"
        ],
        "budget_type": [
          "economy",
          "balanced"
        ]
      },
      "strong_drivers": {
        "profile_type": [
          "functional",
          "comfort"
        ]
      },
      "supporting_drivers": {
        "treatment_philosophy": [
          "durability_focused"
        ]
      },
      "excluding_drivers": {
        "budget_type": [
          "premium"
        ],
        "age_stage": [
          "young_adult",
          "growing"
        ]
      },
      "preferred_tags": []
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You have an older profile with visible wear and discoloration.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "Over time, teeth naturally change.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Color can deepen, surfaces may show signs of wear, and the overall appearance may feel less vibrant than before.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Professional Whitening with Realistic Expectations",
          "nl": "Professional Whitening with Realistic Expectations"
        },
        "rank": 1,
        "category": "whitening",
        "description": {
          "en": "A professional treatment that lightens the natural color, taking into account the limitations of aged enamel.",
          "nl": "A professional treatment that lightens the natural color, taking into account the limitations of aged enamel."
        },
        "benefits": [
          {
            "en": "Non-invasive approach",
            "nl": "Non-invasive approach"
          },
          {
            "en": "Natural-looking improvement",
            "nl": "Natural-looking improvement"
          },
          {
            "en": "Preserves tooth structure",
            "nl": "Preserves tooth structure"
          },
          {
            "en": "Reasonable cost",
            "nl": "Reasonable cost"
          }
        ],
        "considerations": [
          {
            "en": "Results may be less dramatic on aged enamel",
            "nl": "Results may be less dramatic on aged enamel"
          },
          {
            "en": "May need periodic maintenance",
            "nl": "May need periodic maintenance"
          },
          {
            "en": "Deep discoloration may respond less",
            "nl": "Deep discoloration may respond less"
          }
        ],
        "ideal_for": {
          "en": "You want gentle improvement without major intervention.",
          "nl": "You want gentle improvement without major intervention."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Crowns or Veneers for Restoration",
          "nl": "Crowns or Veneers for Restoration"
        },
        "rank": 2,
        "category": "crown",
        "description": {
          "en": "Worn or discolored teeth are restored with crowns or veneers that provide both structural support and aesthetic improvement.",
          "nl": "Worn or discolored teeth are restored with crowns or veneers that provide both structural support and aesthetic improvement."
        },
        "benefits": [
          {
            "en": "Addresses multiple issues simultaneously",
            "nl": "Addresses multiple issues simultaneously"
          },
          {
            "en": "More predictable color outcome",
            "nl": "More predictable color outcome"
          },
          {
            "en": "Can restore lost tooth structure",
            "nl": "Can restore lost tooth structure"
          },
          {
            "en": "Long-lasting results",
            "nl": "Long-lasting results"
          }
        ],
        "considerations": [
          {
            "en": "More involved treatment",
            "nl": "More involved treatment"
          },
          {
            "en": "Higher cost",
            "nl": "Higher cost"
          },
          {
            "en": "Requires careful planning",
            "nl": "Requires careful planning"
          }
        ],
        "ideal_for": {
          "en": "Your teeth show significant wear or you want more comprehensive restoration.",
          "nl": "Your teeth show significant wear or you want more comprehensive restoration."
        }
      }
    ],
    "version": "2.0.0"
  },
  {
    "_id": "S15",
    "name": {
      "en": "Premium client, aesthetic profile",
      "nl": "High-budget patient seeking best aesthetic outcome"
    },
    "description": {
      "en": "High-budget patient seeking best aesthetic outcome",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 16,
    "matching": {
      "required_drivers": {
        "budget_type": [
          "premium"
        ],
        "profile_type": [
          "aesthetic"
        ]
      },
      "strong_drivers": {
        "aesthetic_tolerance": [
          "moderate",
          "aggressive"
        ],
        "expectation_risk": [
          "moderate",
          "high"
        ]
      },
      "supporting_drivers": {},
      "excluding_drivers": {
        "budget_type": [
          "economy",
          "unknown"
        ],
        "profile_type": [
          "functional",
          "comfort"
        ]
      },
      "preferred_tags": [
        "style_hollywood",
        "style_classic"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You're interested in achieving a bright, white, \"Hollywood\" style smile.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "A Hollywood smile represents a specific aesthetic choice—bright white, perfectly aligned teeth that create a dramatic visual impact.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "This is different from subtle, natural-looking improvement; it's about achieving a distinctive, camera-ready appearance.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Option 1",
          "nl": "Option 1"
        },
        "rank": 1,
        "category": "other",
        "description": {
          "en": "Multiple porcelain veneers (typically 8-10 upper teeth, sometimes lower as well) to create a uniformly bright, symmetric smile.",
          "nl": "Multiple porcelain veneers (typically 8-10 upper teeth, sometimes lower as well) to create a uniformly bright, symmetric smile."
        },
        "benefits": [
          {
            "en": "Achieves the specific Hollywood look",
            "nl": "Achieves the specific Hollywood look"
          },
          {
            "en": "Uniform color and shape",
            "nl": "Uniform color and shape"
          },
          {
            "en": "Long-lasting results",
            "nl": "Long-lasting results"
          },
          {
            "en": "Complete control over final appearance",
            "nl": "Complete control over final appearance"
          }
        ],
        "considerations": [
          {
            "en": "Significant investment",
            "nl": "Significant investment"
          },
          {
            "en": "Involves preparing multiple healthy teeth",
            "nl": "Involves preparing multiple healthy teeth"
          },
          {
            "en": "More definitive decision",
            "nl": "More definitive decision"
          },
          {
            "en": "Requires ongoing maintenance",
            "nl": "Requires ongoing maintenance"
          }
        ],
        "ideal_for": {
          "en": "You specifically want the dramatic, bright white aesthetic and are prepared for the commitment involved.",
          "nl": "You specifically want the dramatic, bright white aesthetic and are prepared for the commitment involved."
        }
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Option 2",
          "nl": "Option 2"
        },
        "rank": 2,
        "category": "other"
      }
    ],
    "version": "2.0.0"
  },
  {
    "_id": "S16",
    "name": {
      "en": "Wear or damage without missing teeth",
      "nl": "Tooth wear, cracks, or damage but no missing teeth"
    },
    "description": {
      "en": "Tooth wear, cracks, or damage but no missing teeth",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 17,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "no_missing_teeth"
        ]
      },
      "strong_drivers": {
        "profile_type": [
          "functional",
          "mixed"
        ]
      },
      "supporting_drivers": {
        "clinical_priority": [
          "elective",
          "semi_urgent"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "single_missing_tooth",
          "multiple_adjacent",
          "multiple_dispersed",
          "extensive_missing",
          "full_mouth_compromised"
        ]
      },
      "preferred_tags": [
        "tooth_health_compromised",
        "tooth_health_bruxism"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "You have old dental restorations that are now visible, worn, or failing.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "Dental work performed years ago—fillings, crowns, or other restorations—may no longer look or function as well as they once did.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "Materials darken, margins become visible, and wear can affect both appearance and integrity.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Crown Replacement",
          "nl": "Crown Replacement"
        },
        "rank": 1,
        "category": "crown",
        "description": {
          "en": "Old crowns are replaced with new porcelain or ceramic crowns that match your natural teeth better.",
          "nl": "Old crowns are replaced with new porcelain or ceramic crowns that match your natural teeth better."
        },
        "benefits": [
          {
            "en": "Eliminates visible metal margins",
            "nl": "Eliminates visible metal margins"
          },
          {
            "en": "Better color matching",
            "nl": "Better color matching"
          },
          {
            "en": "Modern materials and techniques",
            "nl": "Modern materials and techniques"
          },
          {
            "en": "Updated protection for underlying teeth",
            "nl": "Updated protection for underlying teeth"
          }
        ],
        "considerations": [
          {
            "en": "Each crown requires preparation",
            "nl": "Each crown requires preparation"
          },
          {
            "en": "Cost per crown",
            "nl": "Cost per crown"
          },
          {
            "en": "Requires multiple appointments",
            "nl": "Requires multiple appointments"
          }
        ]
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Filling Replacement with Tooth-Colored Materials",
          "nl": "Filling Replacement with Tooth-Colored Materials"
        },
        "rank": 2,
        "category": "other",
        "description": {
          "en": "Old metal or composite fillings are replaced with modern tooth-colored materials.",
          "nl": "Old metal or composite fillings are replaced with modern tooth-colored materials."
        },
        "benefits": [
          {
            "en": "No visible metal",
            "nl": "No visible metal"
          },
          {
            "en": "Better aesthetics",
            "nl": "Better aesthetics"
          },
          {
            "en": "Improved bonding technology",
            "nl": "Improved bonding technology"
          },
          {
            "en": "Can address new decay if present",
            "nl": "Can address new decay if present"
          }
        ],
        "considerations": [
          {
            "en": "Multiple appointments may be needed",
            "nl": "Multiple appointments may be needed"
          },
          {
            "en": "Not all fillings need replacement",
            "nl": "Not all fillings need replacement"
          },
          {
            "en": "Evaluation by dentist required",
            "nl": "Evaluation by dentist required"
          }
        ]
      }
    ],
    "version": "2.0.0"
  },
  {
    "_id": "S17",
    "name": {
      "en": "Single tooth missing, adjacent teeth restored",
      "nl": "Single gap with compromised neighboring teeth"
    },
    "description": {
      "en": "Single gap with compromised neighboring teeth",
      "nl": ""
    },
    "is_fallback": false,
    "is_safety_scenario": false,
    "priority": 11,
    "matching": {
      "required_drivers": {
        "mouth_situation": [
          "single_missing_tooth"
        ]
      },
      "strong_drivers": {
        "biological_stability": [
          "moderate",
          "compromised"
        ]
      },
      "supporting_drivers": {
        "treatment_philosophy": [
          "minimally_invasive"
        ]
      },
      "excluding_drivers": {
        "mouth_situation": [
          "multiple_adjacent",
          "multiple_dispersed",
          "extensive_missing",
          "full_mouth_compromised"
        ]
      },
      "preferred_tags": [
        "adjacent_partial_restored",
        "adjacent_heavily_restored"
      ]
    },
    "nlg_variables": {
      "SHORT_SITUATION_DESCRIPTION": {
        "en": "Your teeth are all present and healthy, but you're interested in purely cosmetic improvement.",
        "nl": ""
      },
      "SITUATION_BASE": {
        "en": "When teeth are healthy and complete, cosmetic treatment is purely elective—chosen for personal satisfaction rather than medical need.",
        "nl": ""
      },
      "SITUATION_RELEVANCE": {
        "en": "This is about optimizing appearance, whether that means brightening color, improving symmetry, or refining shape.",
        "nl": ""
      }
    },
    "treatment_options": [
      {
        "id": "opt_1",
        "name": {
          "en": "Professional Whitening",
          "nl": "Professional Whitening"
        },
        "rank": 1,
        "category": "whitening"
      },
      {
        "id": "opt_2",
        "name": {
          "en": "Veneers",
          "nl": "Veneers"
        },
        "rank": 2,
        "category": "veneer"
      }
    ],
    "version": "2.0.0"
  }
];
