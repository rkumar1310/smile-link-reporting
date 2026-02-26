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
 * Text module definitions — sourced from Text Modules.docx (SL_DYNAMIC_LIBRARY_DEDUP_v1.1)
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
      en: "Pregnancy may influence timing and overall treatment burden, so non-urgent steps may be adapted or postponed. It can be helpful to discuss this explicitly with the dentist so planning fits the personal situation.",
      nl: "Zwangerschap kan meewegen in timing en belasting, waardoor niet-dringende stappen soms worden aangepast of uitgesteld. Het kan helpend zijn dit expliciet met uw tandarts te bespreken.",
    },
  },
  {
    _id: "FB_BANNER_MEDICAL_DIABETES",
    module_type: "banner",
    topic: "diabetes",
    content: {
      en: "A medical condition such as diabetes may influence healing and planning. The dentist can take general health and medication context into account when evaluating options.",
      nl: "Een medische aandoening, zoals diabetes, kan invloed hebben op herstel en planning. Uw tandarts kan uw algemene gezondheid en medicatiecontext meenemen in de beoordeling.",
    },
  },
  {
    _id: "FB_BANNER_SMOKING_VAPING",
    module_type: "banner",
    topic: "smoking",
    content: {
      en: "Smoking or vaping may affect healing and may increase complication risk, especially when tissue recovery matters. Sharing this openly can support realistic planning and expectations.",
      nl: "Roken of vapen kan genezing beïnvloeden en het risico op complicaties verhogen, vooral wanneer weefselherstel belangrijk is. Dit open bespreken kan helpen om verwachtingen realistischer af te stemmen.",
    },
  },
  {
    _id: "FB_BANNER_PERIODONTITIS",
    module_type: "banner",
    topic: "periodontitis",
    content: {
      en: "When periodontal concerns are present, gum stability may influence predictability. In many cases, stabilisation may be considered before other steps are evaluated.",
      nl: "Bij parodontale problemen kan tandvleesstabiliteit de voorspelbaarheid beïnvloeden. In veel situaties wordt stabilisatie eerst mee bekeken vóór andere stappen worden overwogen.",
    },
  },
  {
    _id: "FB_BANNER_CHRONIC_INFLAMMATION",
    module_type: "banner",
    topic: "chronic_inflammation",
    content: {
      en: "If chronic inflammation is present, timing and treatment order may be adjusted to support comfort and predictability. This can be discussed during the clinical assessment.",
      nl: "Bij chronische ontsteking kan timing en volgorde van behandelingen worden aangepast om comfort en voorspelbaarheid te ondersteunen. Dit kan in het consult worden besproken.",
    },
  },
  {
    _id: "FB_BANNER_POOR_HYGIENE",
    module_type: "banner",
    topic: "poor_hygiene",
    content: {
      en: "When oral hygiene needs attention, treatment durability may be affected. Improving daily care first can support more predictable outcomes.",
      nl: "Wanneer mondhygiëne aandacht vraagt, kan dit de duurzaamheid van behandelingen beïnvloeden. Eerst basiszorg versterken kan meer voorspelbare resultaten ondersteunen.",
    },
  },
  {
    _id: "FB_BANNER_BRUXISM",
    module_type: "banner",
    topic: "bruxism",
    content: {
      en: "Clenching or grinding may increase load on teeth and restorations. Material choice and protection may be planned more cautiously.",
      nl: "Klemmen of knarsen kan extra belasting geven op tanden en restauraties. Materiaalkeuze en bescherming kunnen daardoor voorzichtiger worden gepland.",
    },
  },
  {
    _id: "FB_BANNER_BONE_LOSS",
    module_type: "banner",
    topic: "bone_loss",
    content: {
      en: "Bone loss may influence feasibility, complexity, and timing of certain treatments. A clinical evaluation can clarify realistic options.",
      nl: "Botverlies kan invloed hebben op haalbaarheid, complexiteit en timing van bepaalde behandelingen. Een klinische beoordeling kan realistische opties verduidelijken.",
    },
  },
  {
    _id: "FB_BANNER_DENTAL_ANXIETY",
    module_type: "banner",
    topic: "anxiety",
    content: {
      en: "Dental anxiety may influence pacing and comfort planning. Sharing this can help the dentist adapt communication and tempo.",
      nl: "Tandheelkundige angst kan invloed hebben op tempo en comfortplanning. Dit delen kan helpen om communicatie en aanpak af te stemmen.",
    },
  },
  {
    _id: "FB_BANNER_GROWTH_INCOMPLETE",
    module_type: "banner",
    topic: "growth_incomplete",
    content: {
      en: "If jaw/facial growth is not completed, definitive solutions may be timed more cautiously to account for future changes.",
      nl: "Wanneer groei nog niet voltooid is, wordt vaak voorzichtiger omgegaan met definitieve oplossingen om latere veranderingen beter op te vangen.",
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
      en: "Because pregnancy has been indicated, it may play a role in how treatments are considered and scheduled. Many people wonder what is appropriate at which moment, even without acute complaints. Decisions are often weighed more deliberately, so planning can be aligned with personal circumstances and expectations.",
      nl: "Omdat u heeft aangegeven dat u zwanger bent, kan dit meewegen in hoe behandelingen worden gepland. Ook zonder acute klachten wordt timing en belasting vaak bewuster afgewogen, zodat de aanpak kan aansluiten bij uw situatie en verwachtingen.",
    },
  },
  {
    _id: "TM_02_MEDICAL_DIABETES",
    module_type: "module",
    topic: "diabetes",
    content: {
      en: "Because a medical condition such as diabetes has been indicated, this may influence how treatments are approached. Questions about healing and tolerance are common, which can affect preparation, timing, and follow-up. This does not automatically exclude treatment, but careful alignment can be more important.",
      nl: "Omdat u een medische aandoening heeft aangegeven, zoals diabetes, kan dit invloed hebben op hoe behandelingen worden benaderd. Vragen over herstel en belastbaarheid kunnen mee bepalen hoe voorbereiding, timing en opvolging worden gepland.",
    },
  },
  {
    _id: "TM_03_SMOKING_VAPING",
    module_type: "module",
    topic: "smoking",
    content: {
      en: "Because smoking or vaping has been indicated, healing and comfort estimates may change. Aftercare, recovery expectations, and follow-up may be planned more conservatively. Open discussion can help keep expectations realistic.",
      nl: "Omdat u heeft aangegeven dat u rookt of vapet, kan dit genezing en comfort mee beïnvloeden. Nazorg en opvolging worden vaak voorzichtiger gepland. Open bespreking helpt om verwachtingen realistisch te houden.",
    },
  },
  {
    _id: "TM_04_BRUXISM",
    module_type: "module",
    topic: "bruxism",
    content: {
      en: "Because clenching or grinding has been indicated, load management may be relevant. This can influence material choices, protective measures, and long-term durability, so the plan can match functional loading.",
      nl: "Omdat u knarst of klemt, kan belasting een relevante factor zijn. Dit kan invloed hebben op materiaalkeuze, bescherming en duurzaamheid, zodat het plan beter aansluit bij uw kauwbelasting.",
    },
  },
  {
    _id: "TM_05_PERIODONTAL",
    module_type: "module",
    topic: "periodontitis",
    content: {
      en: "Because periodontal concerns have been indicated, stability and maintenance may become central. Sequence, predictability, and long-term upkeep may be weighed more carefully, depending on clinical findings.",
      nl: "Omdat parodontale problemen zijn aangegeven, kan stabiliteit en onderhoud zwaarder doorwegen. Dit kan invloed hebben op volgorde, voorspelbaarheid en lange-termijnresultaten, afhankelijk van de klinische bevindingen.",
    },
  },
  {
    _id: "TM_06_CHRONIC_INFLAMMATION",
    module_type: "module",
    topic: "chronic_inflammation",
    content: {
      en: "Because chronic inflammation has been indicated, timing and sequencing may be approached with extra care. Control and stabilisation may be prioritised to support predictability.",
      nl: "Omdat er signalen van chronische ontsteking zijn, kan timing en volgorde voorzichtiger worden gepland. Controle en stabilisatie kunnen meer nadruk krijgen om voorspelbaarheid te ondersteunen.",
    },
  },
  {
    _id: "TM_07_POOR_HYGIENE",
    module_type: "module",
    topic: "poor_hygiene",
    content: {
      en: "Because oral hygiene needs attention, durability and maintenance may be affected. Staging and reinforcing basic routines first may support more predictable outcomes.",
      nl: "Omdat mondhygiëne aandacht vraagt, kan behoud van resultaten moeilijker zijn. Fasering en eerst basiszorg versterken kan helpen om meer voorspelbare resultaten te ondersteunen.",
    },
  },
  {
    _id: "TM_08_BONE_LOSS",
    module_type: "module",
    topic: "bone_loss",
    content: {
      en: "Because bone loss has been indicated, stability and feasibility may vary by technique. Additional planning may be needed to keep options and expectations realistic.",
      nl: "Omdat er aanwijzingen zijn van botverlies, kan stabiliteit en haalbaarheid per techniek verschillen. Extra planning kan nodig zijn om realistische opties te bepalen.",
    },
  },
  {
    _id: "TM_09_DENTAL_ANXIETY",
    module_type: "module",
    topic: "anxiety",
    content: {
      en: "Because dental anxiety has been indicated, pacing, explanation, and comfort may be prioritised. This can help make the pathway feel manageable.",
      nl: "Omdat angst of spanning is aangegeven, kunnen tempo, uitleg en comfort centraal staan. Dit kan helpen om het traject beter hanteerbaar te maken.",
    },
  },
  {
    _id: "TM_10_AGE_CONTEXT",
    module_type: "module",
    topic: "age_context",
    content: {
      en: "Because age is relevant, long-term comfort, recovery, and maintenance expectations may influence choices. Age does not set strict limits, but can guide what feels realistic.",
      nl: "Omdat leeftijd relevant is, kunnen verwachtingen rond herstel, onderhoud en comfort op lange termijn mee richting geven. Leeftijd is geen vaste beperking, maar kan wel helpen bij keuzes.",
    },
  },
  {
    _id: "TM_11_PREMIUM_AESTHETIC",
    module_type: "module",
    topic: "premium_aesthetic",
    content: {
      en: "Because premium aesthetics are prioritised, detail, harmony, and finishing may become central. Planning and material choices may be aligned to the desired level of refinement.",
      nl: "Omdat u premium esthetiek belangrijk vindt, kunnen detail, harmonie en afwerking centraal staan. Materiaalkeuze en voorbereiding kunnen daarop worden afgestemd.",
    },
  },
  {
    _id: "TM_12_AESTHETIC_STYLE",
    module_type: "module",
    topic: "aesthetic_style",
    content: {
      en: 'Because an aesthetic style preference is present, choices around shape, shade, translucency, and texture may need careful alignment. No single style is "better," but fit is crucial.',
      nl: 'Omdat u een stijlvoorkeur heeft, is afstemming over vorm, kleur, transparantie en textuur belangrijk. Geen stijl is "beter," maar passendheid is cruciaal.',
    },
  },
  {
    _id: "TM_13_FUNCTIONAL_VS_AESTHETIC",
    module_type: "module",
    topic: "functional_vs_aesthetic",
    content: {
      en: "Because functional and aesthetic elements may both be present, clarifying priorities can help structure the sequence. This supports a coherent plan rather than fragmented steps.",
      nl: "Omdat functionele en esthetische aspecten kunnen samenkomen, kan het verduidelijken van prioriteiten helpen om de volgorde logisch te structureren.",
    },
  },
  {
    _id: "TM_14_BUDGET_LOW",
    module_type: "module",
    topic: "budget_low",
    content: {
      en: "Because affordability is a key factor, options may be evaluated with cost-awareness. Staging and prioritisation may help keep planning realistic.",
      nl: "Omdat betaalbaarheid belangrijk is, kunnen opties kostenbewust worden bekeken. Fasering en prioriteiten kunnen helpen om planning realistisch te houden.",
    },
  },
  {
    _id: "TM_15_BUDGET_PREMIUM",
    module_type: "module",
    topic: "budget_premium",
    content: {
      en: "Because a premium approach is preferred, quality and longevity may weigh more heavily than minimal cost. Choices can be made deliberately without needing to maximise everything.",
      nl: "Omdat u een premium aanpak verkiest, kunnen kwaliteit en duurzaamheid zwaarder doorwegen dan minimale kost. Keuzes kunnen doordacht worden gemaakt zonder alles te maximaliseren.",
    },
  },
  {
    _id: "TM_16_TOOTH_STATUS",
    module_type: "module",
    topic: "tooth_status",
    content: {
      en: "Tooth status (presence and condition) often shapes feasibility, complexity, and sequencing. Small differences can change what is realistic, so context matters.",
      nl: "Uw tandstatus en conditie vormen vaak de basis voor haalbaarheid, complexiteit en volgorde. Kleine verschillen kunnen een groot effect hebben op wat realistisch is.",
    },
  },
  {
    _id: "TM_17_ORAL_COMPLEXITY",
    module_type: "module",
    topic: "oral_complexity",
    content: {
      en: "When multiple factors interact, complexity may increase. Staging and coordination can support clearer expectations and a manageable plan.",
      nl: "Wanneer meerdere factoren samenkomen, kan orale complexiteit toenemen. Fasering en afstemming kunnen helpen om verwachtingen en planning beter te organiseren.",
    },
  },
  {
    _id: "TM_18_TREATMENT_HISTORY",
    module_type: "module",
    topic: "treatment_history",
    content: {
      en: "Treatment history can shape expectations and trust. It does not determine outcomes, but can guide planning and communication.",
      nl: "Uw behandelgeschiedenis kan verwachtingen en vertrouwen beïnvloeden. Dit bepaalt de toekomst niet, maar kan richting geven aan planning en communicatie.",
    },
  },
  {
    _id: "TM_19_GENERAL_HEALTH_CAPACITY",
    module_type: "module",
    topic: "general_health",
    content: {
      en: "General health and capacity can influence how intensive a pathway feels. Pacing and scheduling may be adapted to what feels manageable.",
      nl: "Uw algemene gezondheid en belastbaarheid kunnen meespelen in hoe intensief een traject aanvoelt. Tempo en planning kunnen worden afgestemd op wat haalbaar is.",
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
      en: "Discolouration costs may vary by approach; whitening is often influenced by session count, method, and starting shade, while veneers are commonly per-tooth and influenced by material and finishing.",
      nl: "Bij verkleuring kan de kost variëren volgens aanpak; bleken hangt vaak samen met sessies, methode en uitgangskleur, facings zijn meestal per tand en variëren met materiaal en afwerking.",
    },
  },
  {
    _id: "COSTBLOCK_S02",
    module_type: "costblock",
    scenario_id: "S02",
    content: {
      en: "One missing tooth in a visible zone may vary by solution; implant pathways may depend on bone, materials, and aesthetics, while adhesive bridges may depend on position and loading.",
      nl: "Bij één ontbrekende tand in de zichtzone kan de kost variëren volgens oplossing; implantaten hangen vaak samen met bot, materiaal en esthetiek, adhesieve bruggen met positie en belasting.",
    },
  },
  {
    _id: "COSTBLOCK_S03",
    module_type: "costblock",
    scenario_id: "S03",
    content: {
      en: "In the chewing zone, costs may reflect functional loading, support design, materials, and long-term structural demands.",
      nl: "In de kauwzone kan de prijs vooral samenhangen met belasting, steunpunten, materiaalkeuze en structurele eisen op lange termijn.",
    },
  },
  {
    _id: "COSTBLOCK_S04",
    module_type: "costblock",
    scenario_id: "S04",
    content: {
      en: "Adjacent multi-tooth gaps may be influenced by implant count, span length, and available bone.",
      nl: "Bij 2\u20134 tanden naast elkaar kan de kost worden beïnvloed door aantal implantaten, lengte van de brug en beschikbaar botvolume.",
    },
  },
  {
    _id: "COSTBLOCK_S05",
    module_type: "costblock",
    scenario_id: "S05",
    content: {
      en: "Scattered gaps may vary by number of zones and staging; implants are often per-tooth, while zone-bridges depend on design and positioning.",
      nl: "Bij verspreide gaten kan de kost variëren volgens aantal zones en fasering; implantaten zijn vaak per tand, zonebruggen hangen samen met ontwerp en positionering.",
    },
  },
  {
    _id: "COSTBLOCK_S06",
    module_type: "costblock",
    scenario_id: "S06",
    content: {
      en: "Mixed function + aesthetics may combine separate components; totals may vary by tooth count, materials, and finishing.",
      nl: "Bij een mix van functie en esthetiek wordt de kost vaak opgebouwd uit meerdere componenten; totaal varieert met aantal tanden, materiaal en afwerking.",
    },
  },
  {
    _id: "COSTBLOCK_S07",
    module_type: "costblock",
    scenario_id: "S07",
    content: {
      en: "Segmental loss costs often increase with scale and structural requirements across multiple support points.",
      nl: "Bij segmentair verlies nemen kosten vaak toe door schaal en structurele vereisten over meerdere steunpunten.",
    },
  },
  {
    _id: "COSTBLOCK_S08",
    module_type: "costblock",
    scenario_id: "S08",
    content: {
      en: "Extensive scattered loss may vary by zones, staging, and bone conditions; overall totals can differ widely.",
      nl: "Bij uitgebreid verspreid verlies kan de kost sterk variëren door zones, fasering en botconditie.",
    },
  },
  {
    _id: "COSTBLOCK_S09",
    module_type: "costblock",
    scenario_id: "S09",
    content: {
      en: "Full edentulism in one jaw may vary by fixed vs removable stability, implant configuration, and materials.",
      nl: "Bij een tandeloze kaak kan de kost variëren door vast versus uitneembaar comfort, implantaatconfiguratie en materiaal.",
    },
  },
  {
    _id: "COSTBLOCK_S10",
    module_type: "costblock",
    scenario_id: "S10",
    content: {
      en: "Full-mouth rehabilitation may vary widely; fixed vs removable vs hybrid designs influence scope and technical complexity.",
      nl: "Bij full-mouth herstel kan de kost sterk uiteenlopen; vast, uitneembaar of hybride beïnvloedt omvang en technische complexiteit.",
    },
  },
  {
    _id: "COSTBLOCK_S11",
    module_type: "costblock",
    scenario_id: "S11",
    content: {
      en: "Misalignment costs may depend on aligner pathway complexity versus per-tooth veneer scope and finishing.",
      nl: "Bij scheefstand hangt de kost vaak af van complexiteit van aligners versus aantal facings en afwerking per tand.",
    },
  },
  {
    _id: "COSTBLOCK_S12",
    module_type: "costblock",
    scenario_id: "S12",
    content: {
      en: "Loose/pain scenarios may vary with stabilisation and replacement extent, design, and functional load.",
      nl: "Bij losheid/pijn kan de kost variëren met de mate van stabilisatie en vervanging, ontwerp en belasting.",
    },
  },
  {
    _id: "COSTBLOCK_S13",
    module_type: "costblock",
    scenario_id: "S13",
    content: {
      en: "Young mild discolouration may remain limited with whitening; veneers may vary per-tooth by material and finishing.",
      nl: "Bij jonge lichte verkleuring blijft de kost vaak beperkt met bleken; facings variëren per tand volgens materiaal en afwerking.",
    },
  },
  {
    _id: "COSTBLOCK_S14",
    module_type: "costblock",
    scenario_id: "S14",
    content: {
      en: "Budget-focused pathways may be shaped by implant count, removable design type, and staging.",
      nl: "Bij budgetfocus kunnen implantaat-aantal, prothesetype en fasering de kost sturen.",
    },
  },
  {
    _id: "COSTBLOCK_S15",
    module_type: "costblock",
    scenario_id: "S15",
    content: {
      en: "Premium aesthetics may be influenced by per-tooth material, finishing detail, and planning/try-in intensity.",
      nl: "Bij premium esthetiek spelen per-tand materiaal, detailniveau en planningsintensiteit vaak mee.",
    },
  },
  {
    _id: "COSTBLOCK_S16",
    module_type: "costblock",
    scenario_id: "S16",
    content: {
      en: "Wear/fracture repairs may range from conservative build-ups to per-tooth ceramics; durability and finishing influence totals.",
      nl: "Bij slijtage/breuk kan de kost variëren van behoudende opbouw tot per-tand keramiek; duurzaamheid en afwerking sturen het totaal.",
    },
  },
  {
    _id: "COSTBLOCK_S17",
    module_type: "costblock",
    scenario_id: "S17",
    content: {
      en: "Adjacent restored teeth often trigger bridge vs implant comparison; preparation scope, materials, and bone conditions may influence totals.",
      nl: "Bij herstelde buurttanden wordt vaak brug versus implantaat vergeleken; slijpwerk, materiaal en botconditie kunnen de kost beïnvloeden.",
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
      en: 'A "whiter" goal may look less natural if shade and translucency no longer match the face. The key trade-off is often enamel preservation and predictable everyday appearance versus maximal colour change.',
      nl: 'Een "witter" resultaat kan minder natuurlijk ogen wanneer tint en translucentie niet meer bij het gezicht passen. De afweging ligt vaak tussen glazuurbewaring en voorspelbaar dagelijks eindbeeld versus maximale kleurverandering.',
    },
  },
  {
    _id: "NUANCE_S02_SHORT",
    module_type: "nuance",
    scenario_id: "S02",
    content: {
      en: "In a visible gap, small transition details (gum contour and light reflection) may drive how natural the result feels. The trade-off is often speed versus long-term stability and low-maintenance integration.",
      nl: "In een zichtbare zone kunnen kleine overgangsdetails (tandvlees, lichtreflectie) bepalen hoe natuurlijk het resultaat aanvoelt. De afweging ligt vaak tussen snelheid en langetermijnstabiliteit met beperkt onderhoud.",
    },
  },
  {
    _id: "NUANCE_S03_SHORT",
    module_type: "nuance",
    scenario_id: "S03",
    content: {
      en: "A posterior gap may feel manageable short-term while load gradually shifts to other teeth. The trade-off is often immediate comfort versus structural re-balancing that protects adjacent areas over time.",
      nl: "Een achteraan ontbrekende tand kan op korte termijn meevallen terwijl belasting geleidelijk verschuift. De afweging ligt vaak tussen direct comfort en structureel herverdelen om aangrenzende zones te beschermen.",
    },
  },
  {
    _id: "NUANCE_S04_SHORT",
    module_type: "nuance",
    scenario_id: "S04",
    content: {
      en: 'With adjacent gaps, durability is often determined by segment-level support, not just "filling space." The trade-off is often simplicity versus even force distribution across the whole segment.',
      nl: 'Bij aaneensluitende gaten wordt duurzaamheid vaak bepaald door segmentondersteuning, niet enkel door "opvullen." De afweging ligt vaak tussen eenvoud en gelijkmatige krachtverdeling.',
    },
  },
  {
    _id: "NUANCE_S05_SHORT",
    module_type: "nuance",
    scenario_id: "S05",
    content: {
      en: "Scattered gaps can create imbalance if zones are treated without a global plan. The trade-off is often per-zone efficiency versus staged coherence across the full bite.",
      nl: "Bij verspreide gaten kan onevenwicht ontstaan wanneer zones zonder globale visie worden aangepakt. De afweging ligt vaak tussen zonegewijze efficiëntie en gefaseerde samenhang in de beet.",
    },
  },
  {
    _id: "NUANCE_S06_SHORT",
    module_type: "nuance",
    scenario_id: "S06",
    content: {
      en: "In mixed cases, aesthetics tends to stay natural-looking only when function is structurally supported. The trade-off is often visible improvement versus integrated sequencing that remains stable.",
      nl: "In combinatiescenario's blijft esthetiek vaak pas geloofwaardig wanneer functie structureel wordt gedragen. De afweging ligt vaak tussen zichtbare verbetering en geïntegreerde volgorde die stabiel blijft.",
    },
  },
  {
    _id: "NUANCE_S07_SHORT",
    module_type: "nuance",
    scenario_id: "S07",
    content: {
      en: "Large segment loss requires multi-point structural support to feel reliable. The trade-off is often minimal intervention versus long-term stability and confidence.",
      nl: "Bij groot segmentverlies is ondersteuning over meerdere steunpunten bepalend voor betrouwbaarheid. De afweging ligt vaak tussen minimale ingreep en langetermijnstabiliteit en zekerheid.",
    },
  },
  {
    _id: "NUANCE_S08_SHORT",
    module_type: "nuance",
    scenario_id: "S08",
    content: {
      en: "When loss is widespread, symptoms may not match what is visibly missing, so planning cohesion matters. The trade-off is often zone-by-zone fixes versus a staged plan that preserves balance.",
      nl: "Bij uitgebreid verspreid verlies komen klachten niet altijd overeen met wat zichtbaar ontbreekt, waardoor samenhangende planning belangrijk wordt. De afweging ligt vaak tussen zone-oplossingen en een gefaseerd plan dat evenwicht bewaart.",
    },
  },
  {
    _id: "NUANCE_S09_SHORT",
    module_type: "nuance",
    scenario_id: "S09",
    content: {
      en: "Full edentulism changes daily confidence, and adaptation often takes time even with good technical function. The trade-off is often immediate expectations versus long-term comfort and maintenance predictability.",
      nl: "Een tandeloze kaak beïnvloedt dagelijks vertrouwen en gewenning vraagt vaak tijd, ook bij technisch goede oplossingen. De afweging ligt vaak tussen onmiddellijke verwachtingen en langetermijncomfort met voorspelbaar onderhoud.",
    },
  },
  {
    _id: "NUANCE_S10_SHORT",
    module_type: "nuance",
    scenario_id: "S10",
    content: {
      en: 'Full-mouth change is often a turning point where the pathway rhythm and sequencing affect how manageable it feels. The trade-off is often "quick decisions" versus a coherent plan that supports adaptation.',
      nl: "Bij full-mouth verandering bepaalt ritme en volgorde van stappen vaak hoe hanteerbaar het traject aanvoelt. De afweging ligt vaak tussen snelle keuzes en een coherent plan dat gewenning ondersteunt.",
    },
  },
  {
    _id: "NUANCE_S11_SHORT",
    module_type: "nuance",
    scenario_id: "S11",
    content: {
      en: "Misalignment is often experienced subjectively through visibility and light reflection, not only tooth position. The trade-off is often process commitment versus speed of visible change.",
      nl: "Scheefstand wordt vaak subjectief ervaren via zichtbaarheid en lichtreflectie, niet alleen via tandstand. De afweging ligt vaak tussen procesinzet en snelheid van zichtbaar effect.",
    },
  },
  {
    _id: "NUANCE_S12_SHORT",
    module_type: "nuance",
    scenario_id: "S12",
    content: {
      en: "Pain/looseness may reduce confidence and gradually change eating behaviour. The trade-off is often temporary stabilisation versus predictable structural restoration.",
      nl: "Pijn/losheid kan vertrouwen verminderen en eetgedrag geleidelijk veranderen. De afweging ligt vaak tussen tijdelijke stabilisatie en voorspelbaar structureel herstel.",
    },
  },
  {
    _id: "NUANCE_S13_SHORT",
    module_type: "nuance",
    scenario_id: "S13",
    content: {
      en: "In young mild discolouration, subtlety is a deliberate choice and lighting can change perceived results. The trade-off is often easy repeatability versus longer-term colour stability.",
      nl: "Bij jonge lichte verkleuring is subtiliteit een bewuste keuze en lichtomstandigheden beïnvloeden beleving. De afweging ligt vaak tussen eenvoudige herhaalbaarheid en langetermijnkleurstabiliteit.",
    },
  },
  {
    _id: "NUANCE_S14_SHORT",
    module_type: "nuance",
    scenario_id: "S14",
    content: {
      en: 'In a budget-focused stage, simplicity and maintenance can matter more than technical sophistication. The trade-off is often "more advanced" versus what stays comfortable and manageable long term.',
      nl: 'In een budgetfase kunnen eenvoud en onderhoud zwaarder wegen dan technische complexiteit. De afweging ligt vaak tussen "meer geavanceerd" en wat haalbaar en comfortabel blijft.',
    },
  },
  {
    _id: "NUANCE_S15_SHORT",
    module_type: "nuance",
    scenario_id: "S15",
    content: {
      en: "Premium aesthetics tends to depend on preparation, alignment, and fine finishing, not material alone. The trade-off is often high-detail control versus scope and long-term predictability of the look.",
      nl: "Premium esthetiek hangt vaak samen met voorbereiding en afstemming, niet alleen met materiaal. De afweging ligt vaak tussen detailcontrole en de voorspelbaarheid van het eindbeeld op lange termijn.",
    },
  },
  {
    _id: "NUANCE_S16_SHORT",
    module_type: "nuance",
    scenario_id: "S16",
    content: {
      en: "Wear/fracture often links function and aesthetics\u2014small shape changes can shift bite forces. The trade-off is often cosmetic correction versus structural support that stays comfortable.",
      nl: "Slijtage/breuk verbindt functie en esthetiek: kleine vormaanpassingen kunnen beetkrachten beïnvloeden. De afweging ligt vaak tussen cosmetische correctie en structurele ondersteuning die comfortabel blijft.",
    },
  },
  {
    _id: "NUANCE_S17_SHORT",
    module_type: "nuance",
    scenario_id: "S17",
    content: {
      en: "With adjacent restorations, the key issue is integration with existing work and whether additional changes affect restored structures. The trade-off is often preserving existing restorations versus broader integration control.",
      nl: "Bij bestaande restauraties draait het vaak om aansluiting op bestaand werk en impact van bijkomende ingrepen. De afweging ligt vaak tussen behoud van bestaande restauraties en meer controle over integratie.",
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
