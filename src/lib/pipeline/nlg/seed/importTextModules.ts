/**
 * Import Text Modules into MongoDB
 *
 * Imports text modules (FB_BANNER_*, TM_*, COSTBLOCK_*, NUANCE_*) into the
 * content collection for use by TextModuleResolver.
 *
 * Each module is stored as:
 * {
 *   _id: "FB_BANNER_PREGNANCY",
 *   type: "text_module",
 *   module_type: "banner" | "module" | "costblock" | "nuance",
 *   content: { en: "...", nl: "..." },
 *   topic?: string,
 *   scenario_id?: string,
 *   created_at: Date,
 *   updated_at: Date
 * }
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx src/lib/pipeline/nlg/seed/importTextModules.ts
 *   npx dotenv -e .env.local -- npx tsx src/lib/pipeline/nlg/seed/importTextModules.ts --clear
 */

import { getDb, COLLECTIONS } from "@/lib/db/mongodb";

interface TextModuleInput {
  _id: string;
  module_type: "banner" | "module" | "costblock" | "nuance";
  content: { en: string; nl: string };
  topic?: string;
  scenario_id?: string;
}

/**
 * Text module definitions — sourced from "New adapted text blocks.docx"
 */
const TEXT_MODULES: TextModuleInput[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FB_BANNER — Short safety/context banners (1-2 sentences)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "FB_BANNER_PREGNANCY",
    module_type: "banner",
    topic: "pregnancy",
    content: {
      en: "During pregnancy, non-urgent procedures are generally approached with greater caution, especially when medication, anesthesia, or X-rays are involved. It is often assessed which steps can be postponed and which may be appropriate at that time. This can influence the sequence or timing of the treatment pathway.",
      nl: "Tijdens een zwangerschap wordt meestal terughoudender omgegaan met niet-dringende ingrepen, vooral wanneer medicatie, verdoving of röntgenopnames betrokken zijn. Vaak wordt gekeken welke stappen kunnen wachten en welke op dat moment aangewezen lijken. Dit kan de volgorde of timing van het traject beïnvloeden.",
    },
  },
  {
    _id: "FB_BANNER_MEDICAL_DIABETES",
    module_type: "banner",
    topic: "diabetes",
    content: {
      en: "In conditions such as diabetes, wound healing plays an important role, particularly in surgical or extensive treatments. When blood glucose levels are less stable, recovery may be slower. This is generally taken into account when assessing planning, with attention to overall health and medication.",
      nl: "Bij aandoeningen zoals diabetes speelt wondgenezing een belangrijke rol, vooral bij chirurgische of uitgebreide behandelingen. Wanneer bloedsuikerwaarden minder stabiel zijn, kan herstel trager verlopen. Dit wordt doorgaans meegewogen in de inschatting van planning met aandacht voor de algemene gezondheid en medicatie.",
    },
  },
  {
    _id: "FB_BANNER_SMOKING_VAPING",
    module_type: "banner",
    topic: "smoking",
    content: {
      en: "Smoking reduces blood flow to the gums and may delay healing after procedures. This is especially relevant for implants or when gum healing is important. It is generally considered when assessing healing time and follow-up.",
      nl: "Roken vermindert de doorbloeding van het tandvlees en kan het herstel na ingrepen vertragen. Dit is vooral relevant bij implantaten of wanneer tandvleesherstel belangrijk is. Dit wordt doorgaans meegewogen in de inschatting van genezingsduur en opvolging.",
    },
  },
  {
    _id: "FB_BANNER_PERIODONTITIS",
    module_type: "banner",
    topic: "periodontitis",
    content: {
      en: "In periodontal conditions, the stability of the gums and jawbone determines predictability. Active inflammation or progressive bone loss may make the placement of definitive restorations less predictable.",
      nl: "Bij parodontale problemen is de stabiliteit van tandvlees en kaakbot bepalend voor voorspelbaarheid. Actieve ontsteking of voortschrijdend botverlies kan de plaatsing van definitieve restauraties minder voorspelbaar maken.",
    },
  },
  {
    _id: "FB_BANNER_CHRONIC_INFLAMMATION",
    module_type: "banner",
    topic: "chronic_inflammation",
    content: {
      en: "In cases of chronic inflammation, gum stability generally plays a role in evaluating further steps. A biologically unstable foundation may reduce the predictability of restorations.",
      nl: "Bij chronische ontsteking speelt de stabiliteit van het tandvlees doorgaans een rol in de beoordeling van verdere stappen. Een biologisch instabiele basis kan de voorspelbaarheid van restauraties verminderen.",
    },
  },
  {
    _id: "FB_BANNER_POOR_HYGIENE",
    module_type: "banner",
    topic: "poor_hygiene",
    content: {
      en: "Insufficient oral hygiene increases the risk of inflammation around restorations or implants. Improvement of daily care is taken into account when assessing long-term durability.",
      nl: "Onvoldoende mondhygiëne verhoogt het risico op ontsteking rond restauraties of implantaten. Verbetering van dagelijkse verzorging speelt mee in de beoordeling van duurzaamheid.",
    },
  },
  {
    _id: "FB_BANNER_BRUXISM",
    module_type: "banner",
    topic: "bruxism",
    content: {
      en: "Grinding or clenching creates prolonged horizontal forces on teeth and restorations. This may lead to accelerated wear or loosening of dental work. It is generally considered when evaluating material strength and possible protective measures.",
      nl: "Bij knarsen of klemmen ontstaan langdurige horizontale krachten op tanden en restauraties. Dit kan leiden tot versnelde slijtage of loskomen van werkstukken. Dit speelt doorgaans mee in de afweging rond materiaalsterkte en eventuele bescherming.",
    },
  },
  {
    _id: "FB_BANNER_BONE_LOSS",
    module_type: "banner",
    topic: "bone_loss",
    content: {
      en: "In cases of bone loss, the available height or width of the jawbone may be limited. This influences the position or length of implants and may require additional preparatory steps. The technical structure of the treatment pathway may be adjusted accordingly.",
      nl: "Bij botverlies kan de beschikbare hoogte of breedte van het kaakbot beperkt zijn. Dit beïnvloedt de positie of lengte van implantaten en kan extra voorbereidende stappen vereisen. De technische opbouw van het traject kan hierop worden afgestemd.",
    },
  },
  {
    _id: "FB_BANNER_DENTAL_ANXIETY",
    module_type: "banner",
    topic: "anxiety",
    content: {
      en: "In cases of dental anxiety, smaller and clearly structured steps, along with thorough explanations in advance, may help. This can influence the pace of the treatment pathway but generally increases comfort and sense of control.",
      nl: "Bij tandheelkundige angst kunnen kleinere, overzichtelijke stappen en duidelijke uitleg vooraf helpen. Dit kan het tempo van het traject beïnvloeden, maar verhoogt meestal het comfort en de controle.",
    },
  },
  {
    _id: "FB_BANNER_GROWTH_INCOMPLETE",
    module_type: "banner",
    topic: "growth_incomplete",
    content: {
      en: "When jaw growth is not yet fully completed, definitive solutions may shift later due to further development. In younger patients, the timing of permanent procedures is considered more carefully.",
      nl: "Wanneer de kaakgroei nog niet volledig is afgerond, kunnen definitieve oplossingen later verschuiven door verdere ontwikkeling. Bij jonge patiënten wordt de timing van permanente ingrepen zorgvuldiger afgewogen.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TM — Long context modules (detailed risk/context explanations)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "TM_01_PREGNANCY",
    module_type: "module",
    topic: "pregnancy",
    content: {
      en: "During pregnancy, procedures involving medication, anesthesia, or X-rays are approached more cautiously. Non-urgent steps are often postponed until after delivery.\nThis may alter the sequence of the treatment pathway and extend the overall duration, without automatically affecting the final outcome.",
      nl: "Tijdens een zwangerschap wordt terughoudender omgegaan met ingrepen waarbij medicatie, verdoving of röntgenopnames betrokken zijn. Niet-dringende stappen worden vaak verschoven tot na de bevalling.\nDit kan de volgorde van het traject veranderen en de totale doorlooptijd verlengen, zonder dat dit automatisch invloed heeft op het uiteindelijke resultaat.",
    },
  },
  {
    _id: "TM_02_MEDICAL_DIABETES",
    module_type: "module",
    topic: "diabetes",
    content: {
      en: "In diabetes, wound healing plays a central role, particularly in surgical or extensive restorative procedures. Less stable blood glucose levels may slow recovery and increase the risk of complications.\nOverall health and medical stability are generally considered when assessing planning and recovery.",
      nl: "Bij diabetes speelt wondgenezing een centrale rol, vooral bij chirurgische of uitgebreide restauratieve ingrepen. Minder stabiele bloedsuikerwaarden kunnen herstel vertragen en het risico op complicaties verhogen.\nAlgemene gezondheid en medische stabiliteit worden doorgaans meegewogen in de inschatting van planning en herstel.",
    },
  },
  {
    _id: "TM_03_SMOKING_VAPING",
    module_type: "module",
    topic: "smoking",
    content: {
      en: "Smoking reduces blood flow to the gums and affects bone metabolism. This is particularly relevant for implants and procedures where tissue healing is essential.\nAs a result, the healing phase may take longer, and follow-up may play a more important role.",
      nl: "Roken vermindert de doorbloeding van het tandvlees en beïnvloedt het botmetabolisme. Dit is vooral relevant bij implantaten en bij ingrepen waarbij weefselherstel essentieel is.\nHierdoor kan de genezingsfase langer duren en kan opvolging een belangrijkere rol spelen.",
    },
  },
  {
    _id: "TM_04_BRUXISM",
    module_type: "module",
    topic: "bruxism",
    content: {
      en: "Grinding or clenching creates prolonged horizontal forces on teeth and restorations. This increases the likelihood of wear, cracks, or loosening of dental work.\nIt is generally considered when evaluating material strength, design, and possible protective measures to support durability.",
      nl: "Bij knarsen of klemmen ontstaan langdurige horizontale krachten op tanden en restauraties. Dit verhoogt de kans op slijtage, barsten of loskomen van werkstukken.\nDit speelt doorgaans mee in de afweging rond materiaalsterkte, ontwerp en eventuele beschermende maatregelen om duurzaamheid te ondersteunen.",
    },
  },
  {
    _id: "TM_05_PERIODONTAL",
    module_type: "module",
    topic: "periodontitis",
    content: {
      en: "In periodontal conditions, gum stability and bone level determine predictability. Active inflammation or progressive bone loss may negatively affect the lifespan of restorations.\nClinical gum stability is generally considered when evaluating further steps.",
      nl: "Bij parodontale problematiek zijn tandvleesstabiliteit en botniveau bepalend voor voorspelbaarheid. Actieve ontsteking of voortschrijdend botverlies kan de levensduur van restauraties negatief beïnvloeden.\nDe klinische stabiliteit van het tandvlees speelt doorgaans mee in de beoordeling van verdere stappen.",
    },
  },
  {
    _id: "TM_06_CHRONIC_INFLAMMATION",
    module_type: "module",
    topic: "chronic_inflammation",
    content: {
      en: "Chronic inflammation is often associated with reduced biological stability. An active inflammatory condition may reduce the predictability of restorations.\nIn such situations, stability is generally taken into consideration during further planning.",
      nl: "Chronische ontsteking gaat vaak samen met een verminderde biologische stabiliteit. Een actieve ontstekingsbasis kan de voorspelbaarheid van restauraties verminderen.\nStabiliteit kan in dergelijke situaties doorgaans mee in overweging genomen worden bij verdere planning.",
    },
  },
  {
    _id: "TM_07_POOR_HYGIENE",
    module_type: "module",
    topic: "poor_hygiene",
    content: {
      en: "Insufficient oral hygiene increases the risk of inflammation around crowns, bridges, or implants. This primarily affects long-term durability.\nImprovement of daily care is often considered when assessing long-term stability.",
      nl: "Onvoldoende mondhygiëne verhoogt het risico op ontsteking rond kronen, bruggen of implantaten. Dat beïnvloedt vooral de duurzaamheid op lange termijn.\nVerbetering van dagelijkse verzorging speelt vaak mee in de inschatting van langetermijnstabiliteit.",
    },
  },
  {
    _id: "TM_08_BONE_LOSS",
    module_type: "module",
    topic: "bone_loss",
    content: {
      en: "In cases of bone loss, the available height or width of the jawbone may be limited. This affects implant positioning and stability and may require additional preparatory steps.\nThe technical complexity of the treatment pathway increases as a result, which may influence planning and the number of appointments.",
      nl: "Bij botverlies kan de beschikbare hoogte of breedte van het kaakbot beperkt zijn. Dit beïnvloedt de positionering en stabiliteit van implantaten en kan extra voorbereidende stappen vereisen.\nDe technische complexiteit van het traject neemt hierdoor toe, wat invloed kan hebben op planning en aantal afspraken.",
    },
  },
  {
    _id: "TM_09_DENTAL_ANXIETY",
    module_type: "module",
    topic: "anxiety",
    content: {
      en: "In cases of pronounced dental anxiety, smaller, clearly structured steps may contribute to a greater sense of control. This may slow the pace of the treatment pathway but usually increases perceived control.\nThe technical approach does not necessarily change, but the progression may.",
      nl: "Bij uitgesproken tandheelkundige angst kunnen kleinere, overzichtelijke stappen bijdragen aan meer controle. Dit kan het tempo van het traject vertragen, maar verhoogt meestal het gevoel van controle.\nDe technische aanpak verandert hierdoor niet noodzakelijk, het verloop wel.",
    },
  },
  {
    _id: "TM_10_AGE_CONTEXT",
    module_type: "module",
    topic: "age_context",
    content: {
      en: "Age primarily influences tissue healing, degree of wear, and maintenance needs. Younger patients generally have more stable bone, while in older patients existing restorations or bone loss more often play a role.\nThis does not automatically determine the choice of treatment but does influence expectations regarding durability.",
      nl: "Leeftijd beïnvloedt vooral weefselherstel, slijtagegraad en onderhoudsbehoefte. Jongere patiënten hebben doorgaans stabieler bot, terwijl bij oudere patiënten bestaande restauraties of botverlies vaker meespelen.\nDit bepaalt niet automatisch de keuze van behandeling, maar wel de verwachtingen rond duurzaamheid.",
    },
  },
  {
    _id: "TM_11_PREMIUM_AESTHETIC",
    module_type: "module",
    topic: "premium_aesthetic",
    content: {
      en: "Premium aesthetics focus on proportion, symmetry, margin finishing, and light reflection. Minor deviations are more quickly noticed in the visible zone.\nThis generally requires precise preparation and alignment before final placement to maintain predictability and reproducibility.",
      nl: "Premium esthetiek draait om proportie, symmetrie, randafwerking en lichtreflectie. Kleine afwijkingen worden in de zichtzone sneller opgemerkt.\nDit vraagt doorgaans nauwkeurige voorbereiding en afstemming vóór definitieve plaatsing, zodat het eindresultaat voorspelbaar en reproduceerbaar blijft.",
    },
  },
  {
    _id: "TM_12_AESTHETIC_STYLE",
    module_type: "module",
    topic: "aesthetic_style",
    content: {
      en: "In cases of a pronounced style preference, tooth length, color intensity, shape, and translucency play a role. Very bright shades or distinctive shapes deviate more quickly from natural aging patterns.",
      nl: "Bij een uitgesproken stijlvoorkeur spelen tandlengte, kleurintensiteit, vorm en transparantie een rol. Een zeer heldere kleur of uitgesproken vorm wijkt sneller af van natuurlijke verouderingspatronen.",
    },
  },
  {
    _id: "TM_13_FUNCTIONAL_VS_AESTHETIC",
    module_type: "module",
    topic: "functional_vs_aesthetic",
    content: {
      en: "When function and aesthetics intersect, it is important that bite forces and design remain balanced. An aesthetic modification may influence force distribution.\nFunctional stability generally plays a role when considering aesthetic optimization.",
      nl: "Wanneer functie en esthetiek samenkomen, is het belangrijk dat beetkrachten en vormgeving in balans blijven. Een esthetische wijziging kan de krachtsverdeling beïnvloeden.\nFunctionele stabiliteit speelt doorgaans een rol in de afweging bij esthetische optimalisatie.",
    },
  },
  {
    _id: "TM_14_BUDGET_LOW",
    module_type: "module",
    topic: "budget_low",
    content: {
      en: "With a limited budget, phasing often plays a role. Not all steps need to be performed simultaneously.\nThis may extend the total duration but allows priorities to be determined without neglecting the biological foundation.",
      nl: "Bij een beperkt budget speelt fasering vaak een rol. Niet alle stappen hoeven tegelijk uitgevoerd te worden.\nDit kan de totale doorlooptijd verlengen, maar laat toe om prioriteiten te bepalen zonder de biologische basis te verwaarlozen.",
    },
  },
  {
    _id: "TM_15_BUDGET_PREMIUM",
    module_type: "module",
    topic: "budget_premium",
    content: {
      en: "In a premium approach, materials and finishing with higher precision and durability are generally selected. This mainly influences the level of detail and reproducibility.\nThe added value rarely lies in \"more procedures,\" but in precision and long-term stability.",
      nl: "Bij een premium aanpak wordt doorgaans gekozen voor materialen en afwerking met hogere precisie en duurzaamheid. Dit beïnvloedt vooral detailniveau en reproduceerbaarheid.\nDe meerwaarde zit zelden in \"meer ingrepen\", maar in nauwkeurigheid en lange-termijnstabiliteit.",
    },
  },
  {
    _id: "TM_16_TOOTH_STATUS",
    module_type: "module",
    topic: "tooth_status",
    content: {
      en: "The current condition of teeth \u2014 such as large fillings, root canal treatments, or cracks \u2014 affects structural strength.\nThis partly determines whether preservation, reinforcement, or replacement is technically the most predictable option.",
      nl: "De huidige conditie van tanden \u2014 zoals grote vullingen, wortelkanaalbehandelingen of scheuren \u2014 beïnvloedt de structurele sterkte.\nDit bepaalt mede of behoud, versterking of vervanging technisch het meest voorspelbaar is.",
    },
  },
  {
    _id: "TM_17_ORAL_COMPLEXITY",
    module_type: "module",
    topic: "oral_complexity",
    content: {
      en: "When multiple issues occur simultaneously \u2014 such as tooth loss, wear, and gum problems \u2014 technical complexity increases.\nIn such cases, a phased approach may help build stability.",
      nl: "Wanneer meerdere problemen samen voorkomen \u2014 zoals tandverlies, slijtage en tandvleesproblemen \u2014 stijgt de technische complexiteit.\nIn zulke situaties kan een gefaseerde aanpak bijdragen aan het opbouwen van stabiliteit.",
    },
  },
  {
    _id: "TM_18_TREATMENT_HISTORY",
    module_type: "module",
    topic: "treatment_history",
    content: {
      en: "Previous treatments may influence the current situation, for example due to scar tissue, altered bite, or existing restorative work.\nThis does not mean options are limited, but integration with existing work must be handled carefully.",
      nl: "Eerdere behandelingen kunnen de huidige situatie beïnvloeden, bijvoorbeeld door littekenvorming, veranderde beet of bestaand restauratiewerk.\nDit betekent niet dat opties beperkt zijn, maar wel dat integratie met bestaand werk zorgvuldig moet gebeuren.",
    },
  },
  {
    _id: "TM_19_GENERAL_HEALTH_CAPACITY",
    module_type: "module",
    topic: "general_health",
    content: {
      en: "General health affects recovery capacity and tolerance. Chronic conditions, medication, or reduced resistance may slow healing.\nPhysical resilience is generally considered when assessing planning and timing.",
      nl: "Algemene gezondheid beïnvloedt herstelcapaciteit en belastbaarheid. Chronische aandoeningen, medicatie of verminderde weerstand kunnen herstel vertragen.\nFysieke belastbaarheid speelt doorgaans mee in de inschatting van planning en timing.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COSTBLOCK — Scenario-specific cost driver explanations (numbers-free)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "COSTBLOCK_S01",
    module_type: "costblock",
    scenario_id: "S01",
    content: {
      en: "In cases of discoloration, cost is determined by the type of treatment and its intensity. For whitening, the number of required sessions, the technique used (at-home or in-office), and the starting shade play a role.\nFor veneers, pricing is generally calculated per tooth, with material selection, individual shape correction, and tooth preparation influencing the total.",
      nl: "Bij verkleuring wordt de kost bepaald door het type behandeling en de intensiteit ervan. Bij bleken spelen vooral het aantal benodigde sessies, de gebruikte techniek (thuis- of praktijkbleken) en de uitgangskleur een rol.\nBij facings wordt doorgaans per tand gerekend, waarbij materiaalkeuze, individuele vormcorrectie en tandvoorbereiding de prijs bepalen.",
    },
  },
  {
    _id: "COSTBLOCK_S02",
    module_type: "costblock",
    scenario_id: "S02",
    content: {
      en: "For a single missing tooth in the visible zone, cost depends on the chosen replacement method.\nWith an implant, factors such as available bone volume, the need for preparatory procedures, crown type, and aesthetic finishing influence the total.\nWith an adhesive bridge, pricing is mainly affected by the design, the number of involved teeth, and bite force distribution.",
      nl: "Bij één ontbrekende tand in de zichtzone hangt de kost af van de gekozen vervangingsmethode.\nBij een implantaat bepalen onder meer de hoeveelheid beschikbaar bot, de nood aan voorbereidende stappen, het type kroon en de esthetische afwerking het totaal.\nBij een adhesieve brug wordt de prijs vooral beïnvloed door het ontwerp, het aantal betrokken tanden en de krachtsverdeling in de beet.",
    },
  },
  {
    _id: "COSTBLOCK_S03",
    module_type: "costblock",
    scenario_id: "S03",
    content: {
      en: "In the chewing zone, cost is strongly influenced by load and durability. Material strength, crown or bridge type, and the condition of adjacent teeth play a greater role than aesthetic refinement.",
      nl: "In de kauwzone wordt de kost sterk beïnvloed door belasting en duurzaamheid. Materiaalsterkte, kroon- of brugtype en de toestand van aangrenzende tanden spelen hier een grotere rol dan esthetische verfijning.",
    },
  },
  {
    _id: "COSTBLOCK_S04",
    module_type: "costblock",
    scenario_id: "S04",
    content: {
      en: "When 2 to 4 adjacent teeth are missing, cost is determined by the number of implants or the length of the bridge construction.\nLonger spans often require additional structural support. Bone quality and volume may necessitate additional technical steps.",
      nl: "Wanneer 2 tot 4 tanden naast elkaar ontbreken, wordt de kost bepaald door het aantal implantaten of de lengte van de brugconstructie.\nLangere overspanningen vereisen vaak extra structurele ondersteuning. Ook de kwaliteit en het volume van het kaakbot kunnen bijkomende technische stappen noodzakelijk maken.",
    },
  },
  {
    _id: "COSTBLOCK_S05",
    module_type: "costblock",
    scenario_id: "S05",
    content: {
      en: "In cases of scattered missing teeth, pricing is typically calculated per zone. Each missing element may be assessed individually, making cost dependent on position, load, and integration with existing restorations.\nPhasing over multiple stages may influence overall planning.",
      nl: "Bij verspreide tandgaten wordt meestal per zone gerekend. Elk ontbrekend element kan afzonderlijk beoordeeld worden, wat de kost afhankelijk maakt van positie, belasting en integratie met bestaande restauraties.\nFasering over meerdere momenten kan de totale planning beïnvloeden.",
    },
  },
  {
    _id: "COSTBLOCK_S06",
    module_type: "costblock",
    scenario_id: "S06",
    content: {
      en: "When both function and aesthetics must be restored, cost consists of multiple components: structural reconstruction, material selection, and finishing per tooth.\nThe number of involved elements and bite complexity largely determine the price.",
      nl: "Wanneer zowel functie als esthetiek moeten worden hersteld, bestaat de kost uit meerdere componenten: structurele opbouw, materiaalkeuze en afwerking per tand.\nHet aantal betrokken elementen en de complexiteit van de beet bepalen hier het grootste deel van de prijs.",
    },
  },
  {
    _id: "COSTBLOCK_S07",
    module_type: "costblock",
    scenario_id: "S07",
    content: {
      en: "With segmental tooth loss over a larger area, cost generally increases due to the scale of reconstruction.\nMore support points, larger bridge constructions, and increased bite forces require technically more robust solutions.",
      nl: "Bij segmentair tandverlies over een grotere zone stijgt de kost meestal door de schaal van het herstel. Meer steunpunten, grotere brugconstructies en verhoogde krachten in de beet vragen technisch robuustere oplossingen.",
    },
  },
  {
    _id: "COSTBLOCK_S08",
    module_type: "costblock",
    scenario_id: "S08",
    content: {
      en: "In extensive and dispersed tooth loss, cost is determined by the number of zones, the selected replacement strategy, and the underlying bone condition.\nCombinations of fixed and removable solutions may further influence technical complexity.",
      nl: "Bij uitgebreid en verspreid tandverlies wordt de kost bepaald door het aantal zones, de gekozen vervangingsstrategie en de onderliggende botconditie.\nCombinaties van vaste en uitneembare oplossingen kunnen de technische complexiteit verder beïnvloeden.",
    },
  },
  {
    _id: "COSTBLOCK_S09",
    module_type: "costblock",
    scenario_id: "S09",
    content: {
      en: "For a fully edentulous jaw, cost depends on the chosen stabilization method: a fully removable denture, an implant-supported overdenture, or a fixed bridge construction.\nThe number of implants, connection type, and material selection determine the majority of the total.",
      nl: "Bij een tandeloze kaak hangt de kost af van de gekozen stabilisatie: een volledig uitneembare prothese, een implantaatgedragen klikprothese of een vaste brugconstructie.\nHet aantal implantaten, het type verbinding en het gebruikte materiaal bepalen het grootste deel van het totaal.",
    },
  },
  {
    _id: "COSTBLOCK_S10",
    module_type: "costblock",
    scenario_id: "S10",
    content: {
      en: "In full-mouth rehabilitation, cost is influenced by the total number of teeth to be replaced or restored, the selected construction type (fixed, removable, or hybrid), and the need for preparatory stabilization.\nThe greater the technical reconstruction, the more extensive the planning and execution.",
      nl: "Bij een full-mouth herstel wordt de kost beïnvloed door het totale aantal te vervangen of te restaureren tanden, de gekozen constructievorm (vast, uitneembaar of hybride) en de nood aan voorbereidende stabilisatie.\nHoe groter de technische heropbouw, hoe uitgebreider de planning en uitvoering.",
    },
  },
  {
    _id: "COSTBLOCK_S11",
    module_type: "costblock",
    scenario_id: "S11",
    content: {
      en: "In cases of misalignment, cost depends on the chosen correction method.\nAligner treatment is generally determined by treatment duration and complexity, while veneers are calculated per tooth based on preparation, material, and aesthetic finishing.",
      nl: "Bij scheefstand hangt de kost af van de gekozen correctiemethode.\nAlignerbehandeling wordt meestal bepaald door de duur en complexiteit van het traject, terwijl facings per tand worden berekend op basis van voorbereiding, materiaal en esthetische afwerking.",
    },
  },
  {
    _id: "COSTBLOCK_S12",
    module_type: "costblock",
    scenario_id: "S12",
    content: {
      en: "When teeth are mobile or painful, cost may relate to stabilization or replacement, depending on the underlying condition.\nThe underlying cause and chosen reconstruction determine the scope of treatment.",
      nl: "Wanneer tanden los staan of pijnlijk zijn, kan de kost samenhangen met stabilisatie of vervanging, afhankelijk van de onderliggende situatie.\nDe onderliggende oorzaak en de gekozen heropbouw bepalen hier de omvang van het traject.",
    },
  },
  {
    _id: "COSTBLOCK_S13",
    module_type: "costblock",
    scenario_id: "S13",
    content: {
      en: "For mild discoloration without structural damage, whitening typically remains limited in scope.\nWhen shape correction or structural modification is required, veneers are calculated per tooth according to material choice and individual finishing.",
      nl: "Bij lichte verkleuring zonder structurele schade blijft bleken doorgaans beperkt in omvang.\nWanneer vormcorrectie of structurele aanpassing nodig is, worden facings per tand berekend volgens materiaalkeuze en individuele afwerking.",
    },
  },
  {
    _id: "COSTBLOCK_S14",
    module_type: "costblock",
    scenario_id: "S14",
    content: {
      en: "When budget is central, cost is strongly influenced by the number of implants, prosthetic type, and degree of phasing.\nStaging treatment may influence planning but does not alter the technical foundation of the solution.",
      nl: "Wanneer budget centraal staat, wordt de kost sterk beïnvloed door het aantal implantaten, het type prothese en de mate van fasering.\nSpreiding in fases kan de planning beïnvloeden, maar verandert de technische basis van de oplossing niet.",
    },
  },
  {
    _id: "COSTBLOCK_S15",
    module_type: "costblock",
    scenario_id: "S15",
    content: {
      en: "In premium aesthetic cases, pricing is primarily determined by material precision, individual tooth shaping, and the intensity of preparation and alignment.\nHigher levels of detail and reproducibility increase technical time investment.",
      nl: "Bij premium esthetiek wordt de prijs vooral bepaald door materiaalprecisie, individuele vormopbouw per tand en de intensiteit van voorbereiding en afstemming.\nDetailniveau en reproduceerbaarheid verhogen hier de technische tijdsinvestering.",
    },
  },
  {
    _id: "COSTBLOCK_S16",
    module_type: "costblock",
    scenario_id: "S16",
    content: {
      en: "In cases of wear or fracture, cost depends on the degree of structural damage.\nLimited build-up requires fewer technical steps than full ceramic replacement per tooth, where material strength and shape correction are determining factors.",
      nl: "Bij slijtage of breuk hangt de kost af van de mate van structurele schade.\nEen beperkte opbouw vraagt minder technische stappen dan volledige keramische vervanging per tand, waarbij materiaalsterkte en vormcorrectie bepalend zijn.",
    },
  },
  {
    _id: "COSTBLOCK_S17",
    module_type: "costblock",
    scenario_id: "S17",
    content: {
      en: "When adjacent teeth are already restored, a bridge is often compared with an implant.\nCost is influenced by the need for additional preparation, crown material type, and local bone condition.",
      nl: "Wanneer aangrenzende tanden reeds gerestaureerd zijn, wordt vaak een brug vergeleken met een implantaat.\nDe kost wordt hier beïnvloed door de nood aan bijkomend slijpwerk, het type kroonmateriaal en de botconditie ter plaatse.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NUANCE — Scenario-specific trade-off clarifications (short)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "NUANCE_S01_SHORT",
    module_type: "nuance",
    scenario_id: "S01",
    content: {
      en: "Intensive whitening or very white veneers often reduce natural enamel translucency. As a result, the surface may appear flatter and less vibrant in daylight.\nThe consideration lies between maximum whiteness and preservation of natural light reflection.",
      nl: "Sterk bleken of zeer witte facings verminderen vaak de natuurlijke translucentie van glazuur. Hierdoor kan het oppervlak vlakker en minder levendig ogen bij daglicht.\nDe afweging ligt tussen maximale witheid en behoud van natuurlijke lichtbreking.",
    },
  },
  {
    _id: "NUANCE_S02_SHORT",
    module_type: "nuance",
    scenario_id: "S02",
    content: {
      en: "In the front zone, differences of less than one millimeter in tooth length or gum line are visually noticeable. Irregular margin finishing increases this effect.\nThe consideration lies between rapid placement and maximum precision in finishing details.",
      nl: "In de frontzone vallen verschillen van minder dan één millimeter in tandlengte of tandvleeslijn zichtbaar op. Onregelmatige randafwerking vergroot dit effect.\nDe afweging ligt tussen snelle plaatsing en maximale precisie in detailafwerking.",
    },
  },
  {
    _id: "NUANCE_S03_SHORT",
    module_type: "nuance",
    scenario_id: "S03",
    content: {
      en: "When a molar is missing, adjacent teeth absorb a greater share of chewing forces. Over time, this may lead to additional wear or tilting.\nThe consideration lies between monitoring and active redistribution of load.",
      nl: "Wanneer een molaar ontbreekt, nemen de aangrenzende tanden een groter deel van de kauwkracht over. Dit kan op termijn extra slijtage of kanteling veroorzaken.\nDe afweging ligt tussen afwachten en actieve herverdeling van belasting.",
    },
  },
  {
    _id: "NUANCE_S04_SHORT",
    module_type: "nuance",
    scenario_id: "S04",
    content: {
      en: "A bridge spanning multiple missing teeth creates a lever effect on the support points. The longer the span, the greater the mechanical load.\nThe consideration lies between fewer implants and greater structural stability.",
      nl: "Een brug over meerdere ontbrekende tanden creëert een hefboomeffect op de steunpunten. Hoe langer de overspanning, hoe groter de mechanische belasting.\nDe afweging ligt tussen minder implantaten en meer structurele stabiliteit.",
    },
  },
  {
    _id: "NUANCE_S05_SHORT",
    module_type: "nuance",
    scenario_id: "S05",
    content: {
      en: "Isolated corrections per zone do not automatically account for the overall bite. Uneven contact points may increase muscular strain.\nThe consideration lies between a local solution and global occlusal balance.",
      nl: "Losstaande correcties per zone houden niet automatisch rekening met de totale beet. Ongelijke contactpunten kunnen spierbelasting verhogen.\nDe afweging ligt tussen lokale oplossing en globale occlusale balans.",
    },
  },
  {
    _id: "NUANCE_S06_SHORT",
    module_type: "nuance",
    scenario_id: "S06",
    content: {
      en: "Changing the shape of front teeth affects how upper and lower teeth meet. Minor adjustments may shift contact points.\nThe consideration lies between aesthetic correction and functional consistency.",
      nl: "Vormverandering van voortanden beïnvloedt hoe onder- en boventanden elkaar raken. Kleine aanpassingen kunnen contactpunten verplaatsen.\nDe afweging ligt tussen esthetische correctie en functionele consistentie.",
    },
  },
  {
    _id: "NUANCE_S07_SHORT",
    module_type: "nuance",
    scenario_id: "S07",
    content: {
      en: "With multiple missing teeth, load per support point increases when the number of supporting elements remains limited. This raises the likelihood of technical complications.\nThe consideration lies between minimal invasiveness and structural reserve.",
      nl: "Bij meerdere ontbrekende tanden stijgt de belasting per steunpunt wanneer het aantal dragende elementen beperkt blijft. Dit verhoogt de kans op technische complicaties.\nDe afweging ligt tussen minimale invasiviteit en structurele reserve.",
    },
  },
  {
    _id: "NUANCE_S08_SHORT",
    module_type: "nuance",
    scenario_id: "S08",
    content: {
      en: "In extensive tooth loss, bite height may gradually decrease due to wear and instability. This alters muscle load and jaw position.\nThe consideration lies between isolated replacements and full bite rehabilitation.",
      nl: "Bij uitgebreid tandverlies kan de beethoogte geleidelijk verlagen door slijtage en instabiliteit. Dit verandert spierbelasting en kaakpositie.\nDe afweging ligt tussen afzonderlijke vervangingen en volledige beetrehabilitatie.",
    },
  },
  {
    _id: "NUANCE_S09_SHORT",
    module_type: "nuance",
    scenario_id: "S09",
    content: {
      en: "A new prosthesis initially changes the sensation in the mouth and jaw. Pressure points and speech adaptation are not uncommon at the beginning.\nThe consideration lies between immediate functionality and adaptation over time.",
      nl: "Een nieuwe prothese verandert aanvankelijk het gevoel in mond en kaak. Drukpunten en spraakaanpassing zijn in het begin niet ongebruikelijk.\nDe afweging ligt tussen onmiddellijke functionaliteit en adaptatie over tijd.",
    },
  },
  {
    _id: "NUANCE_S10_SHORT",
    module_type: "nuance",
    scenario_id: "S10",
    content: {
      en: "In full reconstruction, the existing bite is often revised. Excessive changes in a single phase may complicate muscular adaptation.\nThe consideration lies between speed of transformation and controlled stabilization.",
      nl: "Bij een volledige heropbouw wordt de bestaande beet vaak herzien. Te grote wijzigingen in één fase kunnen spieraanpassing bemoeilijken.\nDe afweging ligt tussen snelheid van transformatie en gecontroleerde stabilisatie.",
    },
  },
  {
    _id: "NUANCE_S11_SHORT",
    module_type: "nuance",
    scenario_id: "S11",
    content: {
      en: "Misalignment affects light reflection and shadow formation. A minor rotation may appear more visually disruptive than functionally necessary.\nThe consideration lies between visual perfection and treatment duration.",
      nl: "Scheefstand beïnvloedt lichtval en schaduwvorming. Een kleine rotatie kan visueel storender zijn dan functioneel noodzakelijk.\nDe afweging ligt tussen visuele perfectie en behandelduur.",
    },
  },
  {
    _id: "NUANCE_S12_SHORT",
    module_type: "nuance",
    scenario_id: "S12",
    content: {
      en: "Mobility is usually associated with loss of supporting tissue. Restoring only the visible part does not change underlying stability.\nThe consideration lies between symptom relief and structural management.",
      nl: "Losheid gaat meestal samen met verlies van steunweefsel. Alleen het zichtbare deel herstellen verandert de onderliggende stabiliteit niet.\nDe afweging ligt tussen symptoomverlichting en structurele aanpak.",
    },
  },
  {
    _id: "NUANCE_S13_SHORT",
    module_type: "nuance",
    scenario_id: "S13",
    content: {
      en: "With intact enamel, intensive discoloration correction may reduce the natural reflective quality of the surface.\nThe consideration lies between color enhancement and preservation of natural texture.",
      nl: "Bij intact glazuur kan intensieve verkleuringcorrectie het oppervlak minder natuurlijk doen reflecteren.\nDe afweging ligt tussen kleurversterking en behoud van natuurlijke textuur.",
    },
  },
  {
    _id: "NUANCE_S14_SHORT",
    module_type: "nuance",
    scenario_id: "S14",
    content: {
      en: "Fewer implants or simpler constructions increase load per element. This may affect wear and maintenance frequency.\nThe consideration lies between initial cost and long-term load distribution.",
      nl: "Minder implantaten of eenvoudigere constructies verhogen de belasting per element. Dit kan invloed hebben op slijtage en onderhoudsfrequentie.\nDe afweging ligt tussen initiële kost en lange-termijnbelasting.",
    },
  },
  {
    _id: "NUANCE_S15_SHORT",
    module_type: "nuance",
    scenario_id: "S15",
    content: {
      en: "Premium aesthetics require precise symmetry, margin finishing, and color gradation. Minor deviations are immediately visible in the front zone.\nThe consideration lies between level of detail and practical feasibility.",
      nl: "Premium esthetiek vereist exacte symmetrie, randafwerking en kleurgradatie. Kleine afwijkingen zijn in de frontzone direct zichtbaar.\nDe afweging ligt tussen detailniveau en praktische uitvoerbaarheid.",
    },
  },
  {
    _id: "NUANCE_S16_SHORT",
    module_type: "nuance",
    scenario_id: "S16",
    content: {
      en: "Wear often reduces bite height. Restoring shape alone without correcting force distribution may result in renewed fracture.\nThe consideration lies between cosmetic repair and structural reconstruction.",
      nl: "Slijtage verlaagt vaak de beethoogte. Enkel vormherstel zonder correctie van krachtsverdeling kan hernieuwde breuk veroorzaken.\nDe afweging ligt tussen cosmetisch herstel en structurele heropbouw.",
    },
  },
  {
    _id: "NUANCE_S17_SHORT",
    module_type: "nuance",
    scenario_id: "S17",
    content: {
      en: "Existing restorations may have different wear patterns or materials compared to new work. Transitions between both may create stress points.\nThe consideration lies between partial adjustment and complete reintegration.",
      nl: "Bestaande restauraties kunnen andere slijtagepatronen of materialen hebben dan nieuw werk. Overgangen tussen beide kunnen spanningspunten creëren.\nDe afweging ligt tussen gedeeltelijke aanpassing en volledige herintegratie.",
    },
  },
];

async function clearTextModules(): Promise<number> {
  const db = await getDb();
  const result = await db.collection(COLLECTIONS.CONTENT).deleteMany({ type: "text_module" });
  return result.deletedCount;
}

async function importTextModules(): Promise<void> {
  console.log("Importing text modules into MongoDB...\n");

  const db = await getDb();
  const collection = db.collection(COLLECTIONS.CONTENT);

  let upserted = 0;
  for (const module of TEXT_MODULES) {
    await collection.updateOne(
      { _id: module._id as unknown as import("mongodb").ObjectId },
      {
        $set: {
          contentId: module._id,
          type: "text_module",
          module_type: module.module_type,
          content: module.content,
          topic: module.topic,
          scenario_id: module.scenario_id,
          updated_at: new Date(),
        },
        $setOnInsert: { created_at: new Date() },
      },
      { upsert: true }
    );
    console.log(`  \u2713 ${module._id} (${module.module_type})`);
    upserted++;
  }

  console.log(`\nDone. Upserted ${upserted} text modules.`);
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const clearFlag = args.includes("--clear");

  if (clearFlag) {
    const deleted = await clearTextModules();
    console.log(`Deleted ${deleted} text modules.\n`);
  }

  await importTextModules();
  process.exit(0);
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
