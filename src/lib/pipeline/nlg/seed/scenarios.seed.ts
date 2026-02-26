// @ts-nocheck — Legacy seed data for old schema, superseded by import/ JSON files + importScenarios.ts
/**
 * Scenario Seed Data
 *
 * Canonical source: reference-docs/content/Scenarioblok per scenariodocx.docx
 * Dutch content parsed from docx, English preserved from previous seed.
 * Matching criteria preserved from config/scenario-profiles.json.
 *
 * Run seed: npx ts-node -r tsconfig-paths/register src/lib/pipeline/nlg/seed/runSeed.ts
 */

import type { ScenarioCreateInput } from "../schemas/ScenarioSchema";

export const SCENARIO_SEEDS: ScenarioCreateInput[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // S00 — Fallback (not in docx, preserved from previous seed)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S00",
    name: { en: "Generic Assessment", nl: "Generieke beoordeling" },
    description: { en: "Fallback scenario when no specific match", nl: "Terugvalscenario wanneer geen specifieke match" },
    is_fallback: true,
    is_safety_scenario: false,
    priority: 18,
    matching: {
      required_drivers: {},
      strong_drivers: {},
      supporting_drivers: {},
      excluding_drivers: {},
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "Based on the information provided, your dental situation requires individual assessment by a dental professional.",
        nl: "Op basis van de verstrekte informatie vereist uw tandsituatie een individuele beoordeling door een tandheelkundig professional.",
      },
      SITUATION_BASE: {
        en: "Your responses suggest a dental concern that doesn't fit a single standard pattern.",
        nl: "Uw antwoorden wijzen op een tandheelkundige situatie die niet in één standaardpatroon past.",
      },
      SITUATION_RELEVANCE: {
        en: "This may mean your situation is unique, requires further evaluation, or involves factors that need professional assessment.",
        nl: "Dit kan betekenen dat uw situatie uniek is, verdere evaluatie vereist, of factoren bevat die professionele beoordeling nodig hebben.",
      },
    },
    treatment_options: [],
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S01 — Geen ontbrekende tanden, verkleuring
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S01",
    name: { en: "No missing teeth, discoloration", nl: "Geen ontbrekende tanden, verkleuring" },
    description: { en: "Patient with aesthetic concerns, no missing teeth", nl: "Patiënt met esthetische zorgen, geen ontbrekende tanden" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 12,
    matching: {
      required_drivers: { mouth_situation: ["no_missing_teeth"], profile_type: ["aesthetic", "mixed"] },
      strong_drivers: { clinical_priority: ["elective"] },
      supporting_drivers: { aesthetic_tolerance: ["conservative", "moderate"], budget_type: ["balanced", "premium"] },
      excluding_drivers: { clinical_priority: ["urgent", "semi_urgent"], mouth_situation: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed", "mixed_pattern", "extensive_missing", "full_mouth_compromised"] },
      preferred_tags: ["issue_discoloration"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are primarily concerned about the color of your teeth, while they are otherwise fully present and cause no functional issues.",
        nl: "U stoort zich vooral aan de kleur van uw tanden, terwijl ze verder volledig aanwezig zijn en geen functionele klachten geven. Uw wens richt zich op een natuurlijke opfrissing, zonder dat uw glimlach er gemaakt uitziet.",
      },
      SITUATION_BASE: {
        en: "In this scenario, your teeth are structurally sound, but the color has gradually changed.",
        nl: "In dit scenario zijn uw tanden structureel in orde, maar is de kleur geleidelijk veranderd. Dat valt vaak op bij foto's, in de spiegel of wanneer u uzelf vergelijkt met vroeger.",
      },
      SITUATION_RELEVANCE: {
        en: "This is often noticeable in photos, in the mirror, or when you compare yourself to earlier times.",
        nl: "Hoewel dit geen pijn of ongemak veroorzaakt, kan het wel een invloed hebben op hoe vrij u lacht. Veel mensen in deze situatie vragen zich af of een eenvoudige verbetering mogelijk is en hoe ver ze daarin willen gaan.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij verkleuring zonder ontbrekende tanden worden doorgaans twee esthetische richtingen overwogen. Welke richting voor u het meest logisch aanvoelt, hangt af van uw verwachtingen, uw gevoeligheid voor onderhoud en de gewenste duurzaamheid van het resultaat.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In beide richtingen ligt de nadruk op een natuurlijk ogende verbetering. In dit scenario wordt een overdreven wit of opvallend esthetisch resultaat meestal niet nagestreefd. Comfort en een evenwichtige uitstraling spelen een belangrijke rol in de uiteindelijke keuze.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Bleken: meestal 1–2 sessies of een traject van ongeveer 10–14 dagen\nFacings: meerdere stappen, afhankelijk van het aantal tanden en het gekozen materiaal",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Bij bleken is er geen hersteltijd. Bij facings kan een korte gewenningsperiode voorkomen.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Professioneel bleken: geen hersteltijd, lichte gevoeligheid tot 24–48 uur.\nFacings: hersteltijd 1–2 dagen, lichte gevoeligheid of drukgevoel.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Professioneel bleken: geen beperking van werk of sociale activiteiten.\nFacings: onmiddellijke hervatting mogelijk.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Professioneel bleken: ± €250 – €450\nFacings: ± €200 – €1.300 per tand",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van factoren zoals het aantal tanden, het materiaal en de aanpak van de behandelaar. Kosten maken deel uit van de totale afweging, niet van een verplichting.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het zinvol om uw verwachtingen en gevoeligheden te verduidelijken, vragen te noteren over onderhoud, duurzaamheid en alternatieven, en deze afweging samen met een tandarts te bespreken. In de Smile-link beslissingsgidsen vindt u extra handvaten om dit gesprek gestructureerd aan te pakken.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Professional Teeth Whitening", nl: "Professioneel tandenbleken" },
        rank: 1,
        category: "whitening",
        description: {
          en: "A controlled treatment that lightens the natural tooth color, through one or more sessions or through a short course.",
          nl: "Een gecontroleerde behandeling die de natuurlijke tandkleur lichter maakt, via één of meerdere sessies of via een kort traject.",
        },
        benefits: [
          { en: "Quick visible improvement", nl: "Snelle zichtbare verbetering" },
          { en: "No intervention on healthy teeth", nl: "Geen ingreep aan gezonde tanden" },
          { en: "No recovery time", nl: "Geen hersteltijd" },
          { en: "Often combinable with other aesthetic steps", nl: "Vaak combineerbaar met andere esthetische stappen" },
        ],
        considerations: [
          { en: "The result is not permanent", nl: "Het resultaat is niet permanent" },
          { en: "Periodic maintenance may be needed", nl: "Periodiek onderhoud kan nodig zijn" },
          { en: "The effect is more limited with deep or internal discoloration", nl: "Het effect is beperkter bij diepe of interne verkleuring" },
        ],
        ideal_for: {
          en: "Those who first want to see how much improvement is possible with a minimal, reversible step.",
          nl: "Voor wie eerst wil nagaan hoeveel verbetering mogelijk is met een minimale, omkeerbare stap.",
        },
        pricing: { min: 250, max: 450, currency: "EUR" },
        recovery: { days: 0 },
      },
      {
        id: "opt_2",
        name: { en: "Veneers for Deeper Discoloration", nl: "Facings bij diepere verkleuring" },
        rank: 2,
        category: "veneer",
        description: {
          en: "Thin shells (porcelain or composite) placed on the front of the teeth to correct color and appearance.",
          nl: "Dunne schildjes (porselein of composiet) die op de voorkant van de tanden worden geplaatst om kleur en uitstraling te corrigeren.",
        },
        benefits: [
          { en: "Long-lasting color stability", nl: "Langdurige kleurstabiliteit" },
          { en: "Precise matching of color and shape", nl: "Nauwkeurige afstemming van kleur en vorm" },
          { en: "Less maintenance in the long term", nl: "Minder onderhoud op lange termijn" },
        ],
        considerations: [
          { en: "More definitive character", nl: "Meer definitief karakter" },
          { en: "Careful consideration needed for healthy teeth", nl: "Zorgvuldige afweging nodig bij gezonde tanden" },
          { en: "Higher cost per tooth", nl: "Hogere kost per tand" },
        ],
        ideal_for: {
          en: "Those who notice that whitening would be insufficient or consciously choose more peace and predictability in the long term.",
          nl: "Voor wie merkt dat bleken onvoldoende zou voldoen of bewust kiest voor meer rust en voorspelbaarheid op lange termijn.",
        },
        pricing: { min: 200, max: 1300, currency: "EUR" },
        recovery: { days: 2 },
      },
    ],
    pricing: { min: 200, max: 1300, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S02 — Eén tand ontbreekt in de zichtbare zone
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S02",
    name: { en: "Single tooth missing, visible zone", nl: "Eén tand ontbreekt in de zichtbare zone" },
    description: { en: "Single missing tooth in anterior aesthetic zone", nl: "Eén ontbrekende tand in de voorste esthetische zone" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 9,
    matching: {
      required_drivers: { mouth_situation: ["single_missing_tooth"] },
      strong_drivers: { profile_type: ["aesthetic", "mixed"], clinical_priority: ["elective"] },
      supporting_drivers: { aesthetic_tolerance: ["moderate", "aggressive"], biological_stability: ["stable"] },
      excluding_drivers: { clinical_priority: ["urgent"] },
      preferred_tags: ["location_anterior"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You have one missing tooth in a visible zone, affecting both appearance and function.",
        nl: "U mist één tand in een zichtbare zone, wat zowel esthetisch als functioneel merkbaar kan zijn. Uw aandacht gaat niet alleen naar het uitzicht van uw glimlach, maar ook naar comfort, stabiliteit en vertrouwen op langere termijn.",
      },
      SITUATION_BASE: {
        en: "A missing tooth in a visible zone is often noticed sooner than expected during conversation.",
        nl: "Wanneer één tand ontbreekt op een plaats die zichtbaar is bij praten of lachen, wordt dit vaak sneller opgemerkt dan verwacht. Zelfs als u er zelf aan gewend raakt, kan de omgeving het blijven zien. Dat maakt dit scenario voor veel mensen gevoeliger dan ze vooraf inschatten.",
      },
      SITUATION_RELEVANCE: {
        en: "Your surrounding teeth are stable, which means both treatment options are suitable for you.",
        nl: "Naast het esthetische aspect kan ook onzekerheid ontstaan over de functie. U vraagt zich mogelijk af of kauwen gelijkmatig blijft verlopen, of omliggende tanden niet zullen verschuiven en of de situatie stabiel blijft in de toekomst. Die combinatie van zichtbaarheid en functionele twijfel speelt een belangrijke rol in de beleving van dit scenario.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij het ontbreken van één tand in een zichtbare zone worden doorgaans twee functioneel-esthetische richtingen besproken. Welke richting voor u het meest logisch aanvoelt, hangt af van hoe definitief u de oplossing wenst, hoe belangrijk het behoud van de omliggende tanden voor u is en welke hersteltijd u haalbaar vindt.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Bij beide opties wordt gestreefd naar een harmonisch en natuurlijk resultaat in de glimlach. Comfort tijdens en na de behandeling speelt een belangrijke rol. Bij een implantaat is rekening houden met genezing essentieel; bij een brug ligt de nadruk meer op gewenning en stabiliteit.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Implantaat + kroon: gemiddeld 3–7 maanden\nAdhesieve brug: vaak binnen enkele weken realiseerbaar",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na een implantaat kan tijdelijk lichte napijn optreden. Bij een brug is er meestal geen hersteltijd.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Implantaat met kroon: hersteltijd 2–5 dagen, napijn en/of lichte zwelling.\nAdhesieve brug: geen hersteltijd, korte gewenning (1–2 dagen).",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Implantaat: dagelijkse activiteiten meestal binnen enkele dagen hervat; tijdelijk aangepast kauwen.\nAdhesieve brug: geen beperking.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Enkelvoudig implantaat met kroon: ± €2.200 – €2.500\nAdhesieve brug: ± €1.500 – €2.500",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van factoren zoals materiaalkeuze, technische uitvoering en individuele situatie. Kosten maken deel uit van de totale afweging, niet van een verplichting.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om uw verwachtingen en zorgen helder te formuleren, vragen te noteren over duurzaamheid, comfort en alternatieven, en deze opties samen met een tandarts te bespreken. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Single Implant with Crown", nl: "Enkelvoudig implantaat met kroon" },
        rank: 1,
        category: "implant",
        description: {
          en: "A titanium post is placed into the jawbone. After healing (3-6 months), a custom crown attaches to it. The result functions like a natural tooth.",
          nl: "Een implantaat wordt in het kaakbot geplaatst ter vervanging van de ontbrekende tandwortel. Nadien wordt een kroon geplaatst die het zichtbare deel van de tand nabootst.",
        },
        benefits: [
          { en: "Very stable and durable solution", nl: "Zeer stabiele en duurzame oplossing" },
          { en: "Natural appearance possible", nl: "Natuurlijke uitstraling mogelijk" },
          { en: "No burden on neighboring teeth", nl: "Geen belasting van naburige tanden" },
          { en: "Can contribute to preservation of bone structure", nl: "Kan bijdragen aan behoud van botstructuur" },
        ],
        considerations: [
          { en: "Higher cost", nl: "Hogere kost" },
          { en: "Healing period of several months", nl: "Genezingsperiode van meerdere maanden" },
          { en: "Treatment proceeds in different steps", nl: "Behandeling verloopt in verschillende stappen" },
        ],
        ideal_for: {
          en: "Those looking for a long-term, fixed solution willing to go through a slightly longer process for extra stability.",
          nl: "Voor wie op zoek is naar een langdurige, vaste oplossing en bereid is om een iets langer traject te doorlopen voor extra stabiliteit.",
        },
        pricing: { min: 2200, max: 2500, currency: "EUR" },
        duration: { min_months: 3, max_months: 7 },
        recovery: { days: 5 },
      },
      {
        id: "opt_2",
        name: { en: "Adhesive (Maryland) Bridge", nl: "Adhesieve (Maryland) brug" },
        rank: 2,
        category: "bridge",
        description: {
          en: "A replacement tooth bonds to the back of adjacent teeth. No surgical procedure is required.",
          nl: "Een brug waarbij de ontbrekende tand wordt vervangen door een kunsttand die met een dunne constructie aan de achterzijde van de naburige tanden wordt bevestigd.",
        },
        benefits: [
          { en: "Shorter treatment time", nl: "Kortere behandeltijd" },
          { en: "Usually lower or comparable cost", nl: "Meestal lagere of vergelijkbare kost" },
          { en: "No implantation needed", nl: "Geen implantatie nodig" },
          { en: "Minimal impact on daily life", nl: "Beperkte impact op het dagelijks leven" },
        ],
        considerations: [
          { en: "Less durable in the long term", nl: "Minder duurzaam op lange termijn" },
          { en: "Chance of loosening", nl: "Kans op loskomen" },
          { en: "Not suitable for every situation", nl: "Niet in elke situatie geschikt" },
        ],
        ideal_for: {
          en: "Those looking for a quick, less invasive solution, or not yet ready for a definitive choice.",
          nl: "Voor wie een snelle en minder ingrijpende oplossing zoekt, of voorlopig geen definitieve keuze wil maken.",
        },
        pricing: { min: 1500, max: 2500, currency: "EUR" },
        duration: { min_months: 1, max_months: 1 },
        recovery: { days: 0 },
      },
    ],
    pricing: { min: 1500, max: 2500, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S03 — Eén tand ontbreekt in de kauwzone
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S03",
    name: { en: "Single tooth missing, posterior zone", nl: "Eén tand ontbreekt in de kauwzone" },
    description: { en: "Single missing tooth in chewing area", nl: "Eén ontbrekende tand in de zijdelingse kauwzone" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 10,
    matching: {
      required_drivers: { mouth_situation: ["single_missing_tooth"] },
      strong_drivers: { profile_type: ["functional", "comfort"], clinical_priority: ["elective", "semi_urgent"] },
      supporting_drivers: { treatment_philosophy: ["durability_focused"] },
      excluding_drivers: {},
      preferred_tags: ["location_posterior"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are missing one tooth in the posterior chewing zone.",
        nl: "U mist één tand in de zijdelingse kauwzone. Dit is vooral functioneel: u wilt weer comfortabel kauwen en een stabiel gevoel in de beet, zonder voortdurend rekening te houden met de lege ruimte.",
      },
      SITUATION_BASE: {
        en: "A missing tooth in the back is usually less visible, but you often notice it when eating.",
        nl: "Een ontbrekende tand achteraan valt meestal minder op, maar u merkt het vaak bij eten. Sommige mensen kauwen automatisch meer aan één kant, vermijden harde structuren of ervaren dat de drukverdeling niet meer klopt.",
      },
      SITUATION_RELEVANCE: {
        en: "Some people automatically chew more on one side, avoid hard foods, or experience that the pressure distribution no longer feels right.",
        nl: "Dat kan vragen oproepen: blijft dit stabiel, verschuiven omliggende tanden, of wordt de ruimte groter? Ook al is het esthetische aspect kleiner, de wens naar een praktische oplossing is vaak duidelijk. Voor veel mensen is het belangrijk dat de oplossing niet alleen vult, maar ook vertrouwen geeft bij kauwen en langdurig gebruik.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij één ontbrekende tand in de kauwzone worden doorgaans twee functionele richtingen besproken. De keuze hangt af van hoe definitief u het wilt aanpakken, hoeveel steun u wenst en welke balans u zoekt tussen trajectduur, ingreep en kost.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In beide richtingen is het doel dat u opnieuw normaal kunt kauwen met een stabiel gevoel. Comfort en betrouwbaarheid in dagelijks gebruik zijn belangrijker dan zichtbaarheid. Bij een implantaat is genezing een onderdeel; bij een brug ligt de nadruk op gewenning en belasting.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Implantaat + kroon: gemiddeld 3–7 maanden\nBrug: afhankelijk van aanpak, doorgaans sneller",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na een implantaat kan tijdelijk lichte napijn voorkomen. Bij een brug is er meestal geen hersteltijd.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Implantaat met kroon: hersteltijd 2–5 dagen, napijn of gevoeligheid, normaal kauwen geleidelijk binnen 1–2 weken.\nBrug: geen hersteltijd, korte gewenning, geen beperking.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Implantaat: normaal kauwen geleidelijk binnen 1–2 weken.\nBrug: geen beperking.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Implantaat met kroon: €2.200 – €2.500\nBrug: €2.100 – €2.700",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van materiaal, technische uitvoering en uw situatie. Kosten zijn onderdeel van de afweging, niet van een verplichting.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het zinvol om uw kauwcomfort en verwachtingen te benoemen, vragen te noteren over duurzaamheid, onderhoud en alternatieven, en dit met een tandarts te bespreken. De Smile-link beslissingsgids helpt u om het gesprek gestructureerd te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Single Implant with Crown", nl: "Enkelvoudig implantaat met kroon" },
        rank: 1,
        category: "implant",
        description: {
          en: "An implant replaces the missing tooth root. A crown is then placed to restore the tooth function.",
          nl: "Een implantaat vervangt de ontbrekende tandwortel. Nadien wordt een kroon geplaatst die de tandfunctie herstelt.",
        },
        benefits: [
          { en: "Functional restoration with natural pressure distribution", nl: "Functioneel herstel met natuurlijke drukopbouw" },
          { en: "Stable, durable solution", nl: "Stabiele, duurzame oplossing" },
          { en: "No burden on adjacent teeth", nl: "Geen belasting van aangrenzende tanden" },
          { en: "Can contribute to preservation of bone structure", nl: "Kan bijdragen aan behoud van botstructuur" },
        ],
        considerations: [
          { en: "Surgery and healing are required", nl: "Chirurgie en genezing zijn nodig" },
          { en: "Treatment in multiple steps", nl: "Traject in meerdere stappen" },
          { en: "Higher cost", nl: "Hogere kost" },
        ],
        ideal_for: {
          en: "You want a durable solution and accept a longer process for maximum stability.",
          nl: "Voor wie een duurzame oplossing wil en een langer traject aanvaardt voor maximale stabiliteit.",
        },
        pricing: { min: 2200, max: 2500, currency: "EUR" },
        duration: { min_months: 3, max_months: 7 },
        recovery: { days: 5 },
      },
      {
        id: "opt_2",
        name: { en: "Bridge", nl: "Brug" },
        rank: 2,
        category: "bridge",
        description: {
          en: "A bridge fills the space with a fixed construction that restores chewing function.",
          nl: "Een brug vult de ruimte op met een vaste constructie die de kauwfunctie herstelt.",
        },
        benefits: [
          { en: "Functional replacement", nl: "Functionele vervanging" },
          { en: "Often faster to complete", nl: "Vaak sneller realiseerbaar" },
          { en: "Clear approach", nl: "Duidelijke aanpak" },
        ],
        considerations: [
          { en: "Dependent on execution and support points", nl: "Afhankelijk van uitvoering en steunpunten" },
          { en: "Not suitable for every situation", nl: "Niet elke situatie is geschikt" },
          { en: "Cost remains a factor", nl: "Kost blijft een factor" },
        ],
        ideal_for: {
          en: "You primarily seek functional restoration and want a practical process within a budget consideration.",
          nl: "Voor wie vooral functioneel herstel zoekt en een praktisch traject wenst binnen een budgetafweging.",
        },
        pricing: { min: 2100, max: 2700, currency: "EUR" },
        recovery: { days: 0 },
      },
    ],
    pricing: { min: 2100, max: 2700, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S04 — 2–4 tanden ontbreken naast elkaar (single treatment direction)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S04",
    name: { en: "2-4 teeth adjacent", nl: "2–4 tanden ontbreken naast elkaar" },
    description: { en: "Multiple adjacent teeth missing", nl: "Meerdere aangrenzende tanden ontbreken" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 6,
    matching: {
      required_drivers: { mouth_situation: ["multiple_adjacent"] },
      strong_drivers: { treatment_viability: ["multiple_site"], biological_stability: ["stable", "moderate"] },
      supporting_drivers: { profile_type: ["functional", "mixed"] },
      excluding_drivers: { mouth_situation: ["single_missing_tooth", "multiple_dispersed", "full_mouth_compromised"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are missing multiple teeth next to each other, which primarily has a functional impact.",
        nl: "U mist meerdere tanden naast elkaar, wat vooral een functionele impact heeft. Uw belangrijkste wens is het herstellen van een stabiele beet en comfortabel kauwen, met een oplossing die betrouwbaar aanvoelt in het dagelijks gebruik.",
      },
      SITUATION_BASE: {
        en: "When two to four teeth next to each other are missing, the way you chew often changes noticeably.",
        nl: "Wanneer twee tot vier tanden naast elkaar ontbreken, verandert de manier waarop u kauwt vaak merkbaar. De belasting wordt ongelijk verdeeld en veel mensen merken dat ze automatisch aan één kant gaan kauwen of bepaalde voedingsmiddelen vermijden.",
      },
      SITUATION_RELEVANCE: {
        en: "The load becomes unevenly distributed, and many people notice they automatically start chewing on one side or avoiding certain foods.",
        nl: "Omdat de ontbrekende tanden naast elkaar liggen, is het voor het gebit moeilijker om die ruimte spontaan stabiel te houden. Omliggende tanden kunnen meer belasting opnemen dan bedoeld, wat onzekerheid kan geven over de lange termijn. Zelfs als er weinig pijn is, ervaren veel mensen een gevoel van instabiliteit of \"leegte\" in de beet, vooral bij stevig kauwen.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij het ontbreken van meerdere aangrenzende tanden wordt meestal gekeken naar een structurele, vaste oplossing die de kauwfunctie opnieuw verdeelt en voldoende steun biedt. In dit scenario is er één dominante behandelrichting, omdat losse of tijdelijke oplossingen vaak onvoldoende stabiliteit bieden.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Het doel van deze oplossing is dat u opnieuw evenwichtig en zonder nadenken kunt kauwen. De nadruk ligt op functie en betrouwbaarheid, niet op zichtbaarheid. Comfort tijdens het dagelijks gebruik en een stabiel gevoel bij bijten zijn hierbij doorslaggevend. Na de plaatsing volgt meestal een korte gewenningsperiode.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Brug op implantaten: gemiddeld 3–7 maanden, afhankelijk van genezing en planning",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na de chirurgische fase kan enkele dagen napijn voorkomen. Daarna herneemt u meestal snel uw dagelijkse activiteiten.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Hersteltijd: 3–7 dagen. Mogelijke impact: napijn en/of zwelling na chirurgische fase.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Dagelijkse activiteiten vaak binnen enkele dagen hervat; definitief comfort na plaatsing brug.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Brug op implantaten: ± €4.500 – €6.000",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van factoren zoals het aantal tanden, materiaalkeuze en technische uitvoering. Kosten worden best bekeken als onderdeel van een langetermijnafweging rond comfort en stabiliteit.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om uw kauwcomfort, verwachtingen en vragen te noteren en deze samen met een tandarts te bespreken. De Smile-link beslissingsgidsen helpen u om dit gesprek gestructureerd en met vertrouwen aan te gaan.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Bridge on Implants", nl: "Brug op implantaten" },
        rank: 1,
        category: "implant",
        description: {
          en: "Two implants are placed in the jawbone and serve as anchor points for a bridge that replaces the missing teeth. This restores chewing function without relying on natural teeth for support.",
          nl: "Twee implantaten worden in het kaakbot geplaatst en dienen als steunpunten voor een brug die de ontbrekende tanden vervangt. Zo wordt de kauwfunctie hersteld zonder steun te nemen op natuurlijke tanden.",
        },
        benefits: [
          { en: "Restoration of chewing function over a larger area", nl: "Herstel van de kauwfunctie over een groter gebied" },
          { en: "Stable and durable design", nl: "Stabiel en duurzaam ontwerp" },
          { en: "No burden on adjacent natural teeth", nl: "Geen belasting van aangrenzende natuurlijke tanden" },
          { en: "Suitable for multiple missing teeth next to each other", nl: "Geschikt voor meerdere ontbrekende tanden naast elkaar" },
        ],
        considerations: [
          { en: "Requires sufficient bone volume", nl: "Vereist voldoende botvolume" },
          { en: "Treatment proceeds in multiple steps", nl: "Behandeling verloopt in meerdere stappen" },
          { en: "Higher cost than single-tooth solutions", nl: "Hogere kost dan enkelvoudige oplossingen" },
        ],
        ideal_for: {
          en: "You are looking for a structural and reliable restoration of the bite and are willing to follow a longer process for more stability in the long term.",
          nl: "Voor wie een structureel en betrouwbaar herstel van de beet zoekt en bereid is een langer traject te volgen voor meer stabiliteit op lange termijn.",
        },
        pricing: { min: 4500, max: 6000, currency: "EUR" },
        duration: { min_months: 3, max_months: 7 },
        recovery: { days: 7 },
      },
    ],
    pricing: { min: 4500, max: 6000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S05 — 2–4 tanden ontbreken verspreid
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S05",
    name: { en: "2-4 teeth dispersed", nl: "2–4 tanden ontbreken verspreid" },
    description: { en: "Multiple non-adjacent teeth missing", nl: "Meerdere niet-aangrenzende tanden ontbreken" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 7,
    matching: {
      required_drivers: { mouth_situation: ["multiple_dispersed"] },
      strong_drivers: { treatment_viability: ["multiple_site"] },
      supporting_drivers: { profile_type: ["functional", "mixed"] },
      excluding_drivers: { mouth_situation: ["single_missing_tooth", "multiple_adjacent", "full_mouth_compromised"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are missing multiple teeth at different locations in the mouth.",
        nl: "U mist meerdere tanden op verschillende plaatsen in de mond. Dit heeft vooral een functionele impact, waarbij comfort, stabiliteit en een evenwichtige verdeling van kauwkrachten centraal staan.",
      },
      SITUATION_BASE: {
        en: "When two to four teeth are missing but not next to each other, an uneven loading of the dentition often results.",
        nl: "Wanneer twee tot vier tanden ontbreken, maar niet naast elkaar liggen, ontstaat vaak een ongelijkmatige belasting van het gebit. Veel mensen merken dat ze onbewust bepaalde zones vermijden of dat het kauwen minder vanzelfsprekend aanvoelt dan vroeger.",
      },
      SITUATION_RELEVANCE: {
        en: "Many people notice that they unconsciously avoid certain zones or that chewing feels less natural than before.",
        nl: "Omdat de ontbrekende tanden verspreid zijn, is er zelden één duidelijke probleemzone. Net dat maakt dit scenario complexer: elke ruimte heeft zijn eigen invloed op comfort en stabiliteit. Sommige zones vragen meer ondersteuning dan andere, wat leidt tot twijfel over de beste aanpak. Het doel is meestal niet alleen het opvullen van de ruimtes, maar het herstellen van een evenwichtige beet over de volledige mond.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij verspreid tandverlies wordt meestal gekeken naar flexibele, zonegerichte oplossingen. In dit scenario worden vaak twee functionele richtingen overwogen. De keuze hangt af van het aantal ontbrekende tanden per zone, de gewenste duurzaamheid en hoe uitgebreid u het traject wenst aan te pakken.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In beide richtingen ligt de nadruk op functioneel herstel en comfort. Het doel is dat u opnieuw zonder nadenken kunt kauwen, met een gelijkmatige verdeling van de belasting. Zichtbaarheid speelt meestal een ondergeschikte rol; betrouwbaarheid in dagelijks gebruik staat voorop.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Meervoudige implantaten met kronen: gemiddeld 4–7 maanden\nBruggen op implantaten: vergelijkbaar, afhankelijk van planning per zone",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na chirurgische stappen kan enkele dagen napijn optreden. Daarna herneemt u doorgaans snel uw dagelijkse activiteiten.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Meerdere implantaten met kronen: hersteltijd 2–5 dagen per chirurgische fase, napijn of gevoeligheid per zone, beperkte impact per fase.\nBruggen op implantaten per zone: vergelijkbaar, vaak met minder afzonderlijke fasen.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Beperkte impact per fase; totale hersteltijd gespreid over meerdere weken.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Implantaat met kroon: ± €2.200 – €2.500 per tand\nBrug op implantaten: ± €4.500 – €6.000 per zone",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal zones, materiaalkeuze en technische uitvoering. Kosten maken deel uit van de totale functionele afweging.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts per zone te bekijken welke aanpak het best past bij uw comfort, verwachtingen en planning. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Multiple Implants with Crowns", nl: "Meerdere implantaten met kronen" },
        rank: 1,
        category: "implant",
        description: {
          en: "Per missing tooth, an implant is placed with a crown on top. This approach is repeated per zone where a tooth is missing.",
          nl: "Per ontbrekende tand wordt een implantaat geplaatst met daarop een kroon. Deze aanpak wordt herhaald per zone waar een tand ontbreekt.",
        },
        benefits: [
          { en: "Very flexible per zone", nl: "Zeer flexibel per zone" },
          { en: "Natural loading per tooth", nl: "Natuurlijke belasting per tand" },
          { en: "No reliance on surrounding teeth", nl: "Geen steun op omliggende tanden" },
          { en: "Well adaptable to different situations", nl: "Goed aanpasbaar aan verschillende situaties" },
        ],
        considerations: [
          { en: "Multiple procedures needed", nl: "Meerdere ingrepen nodig" },
          { en: "Higher total cost", nl: "Hogere totale kost" },
          { en: "Process may feel longer due to spreading", nl: "Traject kan langer aanvoelen door spreiding" },
        ],
        ideal_for: {
          en: "You want maximum natural function per tooth and are willing to follow a more extensive process for optimal distribution.",
          nl: "Voor wie maximale natuurlijke functie per tand wenst en bereid is een uitgebreider traject te volgen voor optimale verdeling.",
        },
        pricing: { min: 2200, max: 2500, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 5 },
      },
      {
        id: "opt_2",
        name: { en: "Bridge on Implants", nl: "Brug op implantaten" },
        rank: 2,
        category: "implant",
        description: {
          en: "Multiple missing teeth are replaced per zone by a bridge supported by two implants.",
          nl: "Meerdere ontbrekende tanden worden per zone vervangen door een brug die steunt op twee implantaten.",
        },
        benefits: [
          { en: "Fewer implants needed", nl: "Minder implantaten nodig" },
          { en: "Clear, manageable approach", nl: "Duidelijke, overzichtelijke aanpak" },
          { en: "Strong functional stability per zone", nl: "Sterke functionele stabiliteit per zone" },
        ],
        considerations: [
          { en: "Less individual per tooth", nl: "Minder individueel per tand" },
          { en: "Less flexible for later adjustments", nl: "Minder flexibel bij latere aanpassingen" },
          { en: "Requires sufficient bone volume per zone", nl: "Vereist voldoende botvolume per zone" },
        ],
        ideal_for: {
          en: "You are looking for a practical and structured solution with a clear balance between stability and treatment complexity.",
          nl: "Voor wie een praktische en gestructureerde oplossing zoekt met een duidelijke balans tussen stabiliteit en behandelcomplexiteit.",
        },
        pricing: { min: 4500, max: 6000, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 5 },
      },
    ],
    pricing: { min: 2200, max: 6000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S06 — Mix: ontbrekende tanden + esthetisch probleem (single direction)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S06",
    name: { en: "Mix: missing teeth + aesthetic problem", nl: "Mix: ontbrekende tanden + esthetisch probleem" },
    description: { en: "Combination of missing teeth and aesthetic concerns", nl: "Combinatie van ontbrekende tanden en esthetische aandachtspunten" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 8,
    matching: {
      required_drivers: { mouth_situation: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed", "mixed_pattern"], profile_type: ["mixed"] },
      strong_drivers: {},
      supporting_drivers: { aesthetic_tolerance: ["moderate"] },
      excluding_drivers: { profile_type: ["aesthetic", "functional", "comfort"] },
      preferred_tags: ["bother_combination", "motivation_combination"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are dealing with a combination of missing teeth and aesthetic concerns.",
        nl: "U heeft te maken met een combinatie van ontbrekende tanden en esthetische aandachtspunten. Uw wens is niet alleen om opnieuw comfortabel te kunnen functioneren, maar ook om een harmonieuze en verzorgde glimlach te bekomen waarin alles beter bij elkaar past.",
      },
      SITUATION_BASE: {
        en: "In this scenario, two aspects play simultaneously.",
        nl: "In dit scenario spelen twee aspecten tegelijk. Enerzijds ontbreken er één of meerdere tanden, wat invloed heeft op kauwcomfort en stabiliteit. Anderzijds zijn er zichtbare esthetische elementen die u storen, zoals kleurverschil, vorm, slijtage of asymmetrie.",
      },
      SITUATION_RELEVANCE: {
        en: "On one hand, one or more teeth are missing, which affects chewing comfort and stability.",
        nl: "Veel mensen ervaren dit als complexer dan een puur functioneel of puur esthetisch probleem. Het gaat niet om één duidelijke klacht, maar om het gevoel dat het geheel \"niet meer klopt\". Soms ligt de nadruk meer op functie, soms meer op uitstraling, maar meestal gaat het om de combinatie. Dat maakt dit scenario typisch voor mensen die op zoek zijn naar een totaalbeeld, niet naar een losse ingreep.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij een combinatie van tandverlies en esthetische aandachtspunten wordt meestal gekozen voor een hybride aanpak. Daarbij worden functionele oplossingen (zoals implantaten) gecombineerd met esthetische correcties (zoals kronen of facings). Het doel is om zowel stabiliteit als uitstraling in één samenhangend plan te verbeteren.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Het doel van dit traject is dat uw glimlach opnieuw in balans aanvoelt, zowel bij kauwen als bij lachen. Comfort en natuurlijkheid staan centraal. De esthetische correcties zijn bedoeld om aan te sluiten bij uw gelaat en persoonlijkheid, niet om overdreven op te vallen. Na de verschillende stappen kan een korte gewenningsperiode optreden.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Gecombineerd traject (implantaten + esthetische correcties): gemiddeld 4–7 maanden, afhankelijk van het aantal zones en de volgorde van de stappen",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na chirurgische ingrepen kan 1–2 dagen napijn voorkomen. De verdere esthetische stappen verlopen meestal zonder hersteltijd.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Implantaten: hersteltijd 2–5 dagen per chirurgische fase, napijn en/of zwelling, tijdelijke aanpassing.\nFacings of kronen: hersteltijd 1–2 dagen, lichte gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Implantaten: tijdelijke aanpassing van dagelijks functioneren.\nFacings of kronen: geen structurele beperking.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Implantaat met kroon: ± €2.200 – €2.500 per tand\nPorseleinen facings of kronen: ± €900 – €1.300 per tand",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal behandelde tanden, materiaalkeuze en technische uitvoering. Kosten maken deel uit van een globale afweging rond comfort, duurzaamheid en uitstraling.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts een globaal plan per zone te bespreken. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Implants Combined with Veneers or Crowns", nl: "Implantaten gecombineerd met facings of kronen" },
        rank: 1,
        category: "other",
        description: {
          en: "Missing teeth are replaced per zone by implants with crowns. At the same time, visible teeth that are aesthetically bothersome are corrected with porcelain veneers or crowns.",
          nl: "Ontbrekende tanden worden per zone vervangen door implantaten met kronen. Tegelijk worden zichtbare tanden die esthetisch storen gecorrigeerd met porseleinen facings of kronen.",
        },
        benefits: [
          { en: "Restoration of chewing function and stability", nl: "Herstel van kauwfunctie en stabiliteit" },
          { en: "Improvement of aesthetics in the same treatment", nl: "Verbetering van esthetiek in dezelfde behandeling" },
          { en: "More harmony in the overall appearance of the smile", nl: "Meer harmonie in het totaalbeeld van de glimlach" },
          { en: "Solutions are tailored per zone", nl: "Oplossingen worden per zone afgestemd" },
        ],
        considerations: [
          { en: "Combination treatment with multiple steps", nl: "Combinatietraject met meerdere stappen" },
          { en: "Higher total cost", nl: "Hogere totale kost" },
          { en: "Careful planning needed to align everything", nl: "Zorgvuldige planning nodig om alles op elkaar af te stemmen" },
        ],
        ideal_for: {
          en: "You notice that a single solution is insufficient and consciously choose a coherent approach that improves both function and appearance.",
          nl: "Voor wie merkt dat een enkelvoudige oplossing onvoldoende is en bewust kiest voor een samenhangende aanpak die zowel functie als uitstraling verbetert.",
        },
        pricing: { min: 900, max: 2500, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 5 },
      },
    ],
    pricing: { min: 900, max: 2500, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S07 — Meer dan 5 tanden ontbreken naast elkaar (segmentair verlies)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S07",
    name: { en: "5+ teeth adjacent (segmental)", nl: "Meer dan 5 tanden ontbreken naast elkaar" },
    description: { en: "Extensive missing teeth in one segment", nl: "Uitgebreid tandverlies in één segment" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 4,
    matching: {
      required_drivers: { mouth_situation: ["extensive_missing"] },
      strong_drivers: { treatment_viability: ["full_mouth"], biological_stability: ["stable", "moderate"] },
      supporting_drivers: { profile_type: ["functional"] },
      excluding_drivers: { mouth_situation: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are missing a larger contiguous segment of teeth.",
        nl: "U mist een groter aaneensluitend segment van tanden. Dit heeft vooral een functionele impact: uw belangrijkste wens is het herstellen van een stabiele, betrouwbare kauwfunctie die natuurlijk aanvoelt in het dagelijks leven.",
      },
      SITUATION_BASE: {
        en: "When more than five adjacent teeth are missing, the functioning of the bite changes significantly.",
        nl: "Wanneer meer dan vijf tanden naast elkaar ontbreken, verandert de werking van het gebit merkbaar. Kauwen vraagt meer aandacht, de belasting wordt ongelijk verdeeld en veel mensen merken dat ze automatisch aan één zijde compenseren. Dat kan leiden tot vermoeidheid, onzekerheid bij stevig eten of het gevoel dat de beet niet meer klopt.",
      },
      SITUATION_RELEVANCE: {
        en: "The remaining teeth cannot adequately compensate for such a large gap.",
        nl: "Omdat het om een groter segment gaat, is het voor het gebit moeilijk om die krachten zelf op te vangen. Losse of beperkte oplossingen bieden hier meestal onvoldoende stabiliteit. De behoefte verschuift vaak van \"iets opvullen\" naar een structurele heropbouw van functie, zodat u opnieuw zonder nadenken kunt eten.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij segmentair tandverlies wordt vrijwel altijd gekeken naar vaste oplossingen op implantaten. Afhankelijk van de lengte van het ontbrekende segment en de gewenste ondersteuning, worden doorgaans twee functionele richtingen overwogen. Beide zijn gericht op duurzaamheid, stabiliteit en een natuurlijke kauwervaring.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Bij beide opties is het doel dat u opnieuw zelfverzekerd en comfortabel kunt kauwen. De nadruk ligt volledig op functie en betrouwbaarheid. Na plaatsing volgt meestal een korte gewenningsperiode, waarna de oplossing aanvoelt als een vast onderdeel van het gebit.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Brug op implantaten: gemiddeld 4–7 maanden, afhankelijk van genezing en planning",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na de chirurgische fase kan enkele dagen napijn voorkomen. De meeste dagelijkse activiteiten worden snel hervat.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Hersteltijd: 3–7 dagen. Mogelijke impact: napijn en/of zwelling.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Tijdelijke aanpassing; gewenning 1–2 weken na plaatsing brug.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Brug 6 tanden op 3 implantaten: ± €6.500 – €9.000\nBrug 10 tanden op 4 implantaten: ± €10.000 – €15.000",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van materiaalkeuze, technische uitvoering en individuele omstandigheden. Kosten maken deel uit van een langetermijnafweging rond stabiliteit en comfort.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts de omvang van het segment, uw kauwcomfort en uw verwachtingen te bespreken. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Bridge of 6 Teeth on 3 Implants", nl: "Brug van 6 tanden op 3 implantaten" },
        rank: 1,
        category: "implant",
        description: {
          en: "Three implants serve as anchor points for a bridge that replaces six teeth.",
          nl: "Drie implantaten worden geplaatst als steunpunten voor een brug die zes tanden vervangt.",
        },
        benefits: [
          { en: "Durable and functional restoration", nl: "Duurzaam en functioneel herstel" },
          { en: "Limited number of implants", nl: "Beperkt aantal implantaten" },
          { en: "Natural chewing function possible", nl: "Natuurlijke kauwfunctie mogelijk" },
          { en: "Fixed solution without support from natural teeth", nl: "Vaste oplossing zonder steun op natuurlijke tanden" },
        ],
        considerations: [
          { en: "Requires sufficient bone volume", nl: "Vereist voldoende botvolume" },
          { en: "Treatment in multiple steps", nl: "Behandeling in meerdere stappen" },
          { en: "Higher cost than smaller solutions", nl: "Hogere kost dan kleinere oplossingen" },
        ],
        ideal_for: {
          en: "You are looking for a reliable solution for a larger segment, without making the treatment unnecessarily complex.",
          nl: "Voor wie een betrouwbare oplossing zoekt voor een groter segment, zonder het traject onnodig complex te maken.",
        },
        pricing: { min: 6500, max: 9000, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 7 },
      },
      {
        id: "opt_2",
        name: { en: "Bridge of 10 Teeth on 4 Implants", nl: "Brug van 10 tanden op 4 implantaten" },
        rank: 2,
        category: "implant",
        description: {
          en: "Four implants support a longer bridge that replaces up to ten teeth within one segment.",
          nl: "Vier implantaten dragen een langere brug die tot tien tanden vervangt binnen één segment.",
        },
        benefits: [
          { en: "Very high stability", nl: "Zeer hoge stabiliteit" },
          { en: "Efficient reconstruction of a large segment", nl: "Efficiënte heropbouw van een groot segment" },
          { en: "Even distribution of forces", nl: "Gelijkmatige verdeling van krachten" },
          { en: "Suitable for extensive tooth loss", nl: "Geschikt bij uitgebreid tandverlies" },
        ],
        considerations: [
          { en: "Higher total cost", nl: "Hogere totale kost" },
          { en: "Careful planning required", nl: "Zorgvuldige planning vereist" },
          { en: "Dependent on bone volume and anatomy", nl: "Afhankelijk van botvolume en anatomie" },
        ],
        ideal_for: {
          en: "You want comprehensive and durable restoration and choose maximum stability in the long term.",
          nl: "Voor wie een omvattend en duurzaam herstel wenst en kiest voor maximale stabiliteit op lange termijn.",
        },
        pricing: { min: 10000, max: 15000, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 7 },
      },
    ],
    pricing: { min: 6500, max: 15000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S08 — Meer dan 5 tanden ontbreken verspreid
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S08",
    name: { en: "5+ teeth dispersed", nl: "Meer dan 5 tanden ontbreken verspreid" },
    description: { en: "Extensive missing teeth spread across mouth", nl: "Uitgebreid tandverlies verspreid over de mond" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 5,
    matching: {
      required_drivers: { mouth_situation: ["extensive_missing"] },
      strong_drivers: { treatment_viability: ["full_mouth"] },
      supporting_drivers: { profile_type: ["functional", "mixed"] },
      excluding_drivers: { mouth_situation: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are missing multiple teeth spread over different zones in the mouth.",
        nl: "U mist meerdere tanden verspreid over verschillende zones in de mond. Dit heeft vooral een functionele impact, waarbij comfort, stabiliteit en een evenwichtige verdeling van kauwkrachten centraal staan.",
      },
      SITUATION_BASE: {
        en: "When more than five teeth are missing but not next to each other, a more complex picture often emerges than with one contiguous segment.",
        nl: "Wanneer meer dan vijf tanden ontbreken, maar niet naast elkaar liggen, ontstaat vaak een complexer beeld dan bij één aaneensluitend segment. Elke zone draagt op haar manier bij aan het kauwcomfort, waardoor het geheel minder voorspelbaar kan aanvoelen.",
      },
      SITUATION_RELEVANCE: {
        en: "Each zone contributes to chewing comfort in its own way, which can make the whole feel less predictable.",
        nl: "Veel mensen merken dat ze onbewust hun kauwgedrag aanpassen: bepaalde zones worden ontzien, andere nemen extra belasting op. Dat kan leiden tot vermoeidheid, onzekerheid bij stevig eten of het gevoel dat de beet niet meer goed verdeeld is. Omdat de ontbrekende tanden verspreid zijn, is er zelden één duidelijke probleemplek, maar eerder een optelsom van kleine functionele verstoringen.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij verspreid, uitgebreid tandverlies wordt meestal gekozen voor een zonegerichte aanpak. Dat betekent dat per zone wordt bekeken welke oplossing het meest geschikt is. In dit scenario worden doorgaans twee functionele richtingen overwogen, die flexibel met elkaar gecombineerd kunnen worden.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In beide richtingen ligt de nadruk op functioneel herstel en betrouwbaarheid. Het doel is dat u opnieuw zonder nadenken kunt kauwen, met een evenwichtige verdeling van de belasting over alle zones. Zichtbaarheid speelt meestal een ondergeschikte rol; dagelijks comfort staat voorop.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Zonegerichte implantaatoplossingen: gemiddeld 4–8 maanden, afhankelijk van het aantal zones en de volgorde van de stappen",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na chirurgische ingrepen kan enkele dagen napijn voorkomen. De meeste dagelijkse activiteiten worden snel hervat.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Hersteltijd: 2–5 dagen per zone. Mogelijke impact: napijn of gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Beperkte impact per ingreep; totaal gespreid over maanden.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Implantaat met kroon: ± €2.200 – €2.500 per tand\nUitgebreidere zone-oplossingen: tot ongeveer €9.000, afhankelijk van aantal zones en aanpak",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal behandelde zones, materiaalkeuze en technische uitvoering. Kosten maken deel uit van een globale functionele afweging.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts per zone te bekijken welke aanpak het best aansluit bij uw kauwcomfort, verwachtingen en planning. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Multiple Implants with Crowns per Zone", nl: "Meerdere implantaten met kronen per zone" },
        rank: 1,
        category: "implant",
        description: {
          en: "Per missing tooth, an implant is placed with a crown on top. This approach is applied in the zones where teeth are missing.",
          nl: "Per ontbrekende tand wordt een implantaat geplaatst met daarop een kroon. Deze aanpak wordt toegepast in de zones waar tanden ontbreken.",
        },
        benefits: [
          { en: "Very flexible per zone", nl: "Zeer flexibel per zone" },
          { en: "Natural loading per tooth", nl: "Natuurlijke belasting per tand" },
          { en: "No reliance on surrounding teeth", nl: "Geen steun op omliggende tanden" },
          { en: "Well adaptable to changing situations", nl: "Goed aanpasbaar aan wisselende situaties" },
        ],
        considerations: [
          { en: "Multiple surgical procedures", nl: "Meerdere chirurgische ingrepen" },
          { en: "Higher total cost", nl: "Hogere totale kost" },
          { en: "Process may feel longer due to spreading", nl: "Traject kan langer aanvoelen door spreiding" },
        ],
        ideal_for: {
          en: "You want maximum functional control per zone and are willing to follow a more extensive process for the most natural possible distribution.",
          nl: "Voor wie maximale functionele controle per zone wenst en bereid is een uitgebreider traject te volgen voor een zo natuurlijk mogelijke verdeling.",
        },
        pricing: { min: 2200, max: 2500, currency: "EUR" },
        duration: { min_months: 4, max_months: 8 },
        recovery: { days: 5 },
      },
      {
        id: "opt_2",
        name: { en: "Bridges on Implants per Zone", nl: "Bruggen op implantaten per zone" },
        rank: 2,
        category: "implant",
        description: {
          en: "Within one zone, multiple missing teeth are replaced by a bridge supported by implants.",
          nl: "Binnen één zone worden meerdere ontbrekende tanden vervangen door een brug die steunt op implantaten.",
        },
        benefits: [
          { en: "Fewer implants needed per zone", nl: "Minder implantaten nodig per zone" },
          { en: "Clear and manageable approach", nl: "Duidelijke en overzichtelijke aanpak" },
          { en: "Strong functional stability", nl: "Sterke functionele stabiliteit" },
        ],
        considerations: [
          { en: "Less individual per tooth", nl: "Minder individueel per tand" },
          { en: "Less flexible for later adjustments", nl: "Minder flexibel bij latere aanpassingen" },
          { en: "Requires sufficient bone volume per zone", nl: "Vereist voldoende botvolume per zone" },
        ],
        ideal_for: {
          en: "You are looking for a practical and structured solution with a good balance between stability and treatment complexity.",
          nl: "Voor wie een praktische en gestructureerde oplossing zoekt met een goede balans tussen stabiliteit en behandelcomplexiteit.",
        },
        pricing: { min: 4500, max: 9000, currency: "EUR" },
        duration: { min_months: 4, max_months: 8 },
        recovery: { days: 5 },
      },
    ],
    pricing: { min: 2200, max: 9000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S09 — Volledige kaak tandeloos
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S09",
    name: { en: "Full jaw edentulous", nl: "Volledige kaak tandeloos" },
    description: { en: "Complete tooth loss in one or both jaws", nl: "Volledig tandverlies in één of beide kaken" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 3,
    matching: {
      required_drivers: { mouth_situation: ["full_mouth_compromised"] },
      strong_drivers: { treatment_viability: ["full_mouth"] },
      supporting_drivers: { age_stage: ["senior"], profile_type: ["functional"] },
      excluding_drivers: { mouth_situation: ["no_missing_teeth", "single_missing_tooth", "multiple_adjacent", "multiple_dispersed"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are completely edentulous in one jaw.",
        nl: "U bent volledig tandeloos in één kaak. Uw belangrijkste wens is het herstellen van comfort, stabiliteit en vertrouwen, zodat eten, spreken en lachen opnieuw vanzelfsprekend aanvoelen.",
      },
      SITUATION_BASE: {
        en: "When a complete jaw is edentulous, this has a major impact on daily functioning.",
        nl: "Wanneer een volledige kaak tandeloos is, heeft dat een grote impact op het dagelijks functioneren. Veel mensen ervaren onzekerheid bij eten, spreken of lachen, zelfs wanneer ze zich uiterlijk aanpassen aan de situatie. Kauwen vraagt meer aandacht, de kracht is beperkt en het gevoel van stabiliteit ontbreekt vaak.",
      },
      SITUATION_RELEVANCE: {
        en: "Many people experience uncertainty when eating, speaking, or smiling, even when they outwardly adapt to the situation.",
        nl: "Naast het functionele aspect speelt ook het psychologische comfort een rol. Het gemis van vaste tanden kan het zelfvertrouwen aantasten en maakt dat men voortdurend rekening houdt met de prothese of de lege kaak. In dit scenario gaat het daarom niet om één tand of één zone, maar om het herstellen van een volledig geheel.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij een volledig tandeloze kaak worden doorgaans twee duidelijke full-mouth richtingen besproken. Beide maken gebruik van implantaten, maar verschillen sterk in vastheid, gebruiksgemak en beleving. De keuze hangt af van uw verwachtingen, comfortwensen en hoe definitief u de oplossing wenst.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Bij beide opties is het doel dat u opnieuw zekerheid en comfort ervaart in het dagelijks leven. Bij een vaste brug ligt de nadruk op vastheid en natuurlijkheid; bij een klikgebit op praktische stabiliteit en hanteerbaarheid. De beleving verschilt duidelijk, maar beide kunnen een grote verbetering betekenen.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "All-on-4 / All-on-6: gemiddeld 4–9 maanden\nKlikgebit op implantaten: meestal korter, afhankelijk van planning",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na chirurgische stappen kan ongeveer één week napijn of zwelling voorkomen. Daarna herneemt u doorgaans geleidelijk uw normale activiteiten.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "All-on-4 / All-on-6: hersteltijd 5–10 dagen, zwelling, napijn, drukgevoel.\nKlikgebit op implantaten: vergelijkbaar, vaak iets minder intens.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "All-on-4 / All-on-6: normale activiteiten meestal binnen 1–2 weken hervat.\nKlikgebit: geleidelijke hervatting.",
      },
      COST_INDICATION: {
        en: "",
        nl: "All-on-4 / All-on-6 vaste brug: ± €10.000 – €20.000\nKlikgebit op implantaten: ± €4.000 – €9.000",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van materiaalkeuze, aantal implantaten en technische uitvoering. Kosten maken deel uit van een langetermijnafweging rond comfort en levenskwaliteit.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts uw verwachtingen rond een vaste oplossing, onderhoud en comfort te bespreken. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen aan te gaan.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "All-on-4 or All-on-6 Fixed Bridge", nl: "All-on-4 of All-on-6 vaste brug" },
        rank: 1,
        category: "bridge",
        description: {
          en: "A fixed bridge is anchored on four or six implants and replaces all teeth in one jaw.",
          nl: "Een vaste brug wordt verankerd op vier of zes implantaten en vervangt alle tanden in één kaak.",
        },
        benefits: [
          { en: "Very high stability", nl: "Zeer hoge stabiliteit" },
          { en: "Fixed feeling when chewing and speaking", nl: "Vast gevoel bij kauwen en spreken" },
          { en: "No removal or loosening", nl: "Geen uitname of loszitten" },
          { en: "Natural and reliable in daily use", nl: "Natuurlijk en betrouwbaar in dagelijks gebruik" },
        ],
        considerations: [
          { en: "Higher cost", nl: "Hogere kost" },
          { en: "Longer treatment duration", nl: "Langere behandelduur" },
          { en: "Careful planning and healing needed", nl: "Zorgvuldige planning en genezing nodig" },
        ],
        ideal_for: {
          en: "You want maximum comfort and fixation and are willing to invest in a durable full-mouth solution.",
          nl: "Voor wie maximaal comfort en vastheid wenst en bereid is te investeren in een duurzame full-mouth oplossing.",
        },
        pricing: { min: 10000, max: 20000, currency: "EUR" },
        duration: { min_months: 4, max_months: 9 },
        recovery: { days: 10 },
      },
      {
        id: "opt_2",
        name: { en: "Snap-on Denture on 2-4 Implants", nl: "Klikgebit op 2–4 implantaten" },
        rank: 2,
        category: "denture",
        description: {
          en: "A removable denture that snaps onto two to four implants for extra stability.",
          nl: "Een uitneembaar gebit dat vastklikt op twee tot vier implantaten voor extra stabiliteit.",
        },
        benefits: [
          { en: "Better stability than a loose denture", nl: "Betere stabiliteit dan een los gebit" },
          { en: "Lower cost than a fixed bridge", nl: "Lagere kost dan een vaste brug" },
          { en: "Less complex treatment", nl: "Minder complex traject" },
          { en: "Easily removable for cleaning", nl: "Gemakkelijk uitneembaar voor reiniging" },
        ],
        considerations: [
          { en: "Not completely fixed", nl: "Niet volledig vast" },
          { en: "Daily removal remains necessary", nl: "Dagelijks uitnemen blijft nodig" },
          { en: "Less natural feeling than fixed teeth", nl: "Minder natuurlijk gevoel dan vaste tanden" },
        ],
        ideal_for: {
          en: "You are looking for a functional and affordable solution with clear improvement compared to a classic denture.",
          nl: "Voor wie een functionele en betaalbare oplossing zoekt met duidelijke verbetering ten opzichte van een klassiek kunstgebit.",
        },
        pricing: { min: 4000, max: 9000, currency: "EUR" },
        duration: { min_months: 3, max_months: 6 },
        recovery: { days: 7 },
      },
    ],
    pricing: { min: 4000, max: 20000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S10 — Bijna alle tanden niet te redden (3 options)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S10",
    name: { en: "Almost all teeth unsaveable", nl: "Bijna alle tanden niet te redden" },
    description: { en: "Most teeth have poor prognosis", nl: "Het merendeel van de tanden kan niet meer behouden worden" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 2,
    matching: {
      required_drivers: { mouth_situation: ["full_mouth_compromised"] },
      strong_drivers: { biological_stability: ["unstable", "compromised"] },
      supporting_drivers: { clinical_priority: ["semi_urgent", "urgent"] },
      excluding_drivers: { mouth_situation: ["no_missing_teeth", "single_missing_tooth", "multiple_adjacent", "multiple_dispersed"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "For you, almost all teeth can no longer be saved.",
        nl: "Bij u zijn bijna alle tanden niet meer te redden. Uw belangrijkste wens is het herstellen van comfort, stabiliteit en levenskwaliteit, met een oplossing die u opnieuw vertrouwen geeft bij eten, spreken en lachen.",
      },
      SITUATION_BASE: {
        en: "When the majority of teeth can no longer be preserved, a situation arises that can be both functionally and emotionally heavy.",
        nl: "Wanneer het merendeel van de tanden niet meer behouden kan worden, ontstaat een situatie die zowel functioneel als emotioneel zwaar kan doorwegen. Kauwen is vaak moeilijk, pijnlijk of onzeker. De beet voelt instabiel aan en dagelijkse handelingen vragen meer aandacht dan vroeger.",
      },
      SITUATION_RELEVANCE: {
        en: "Chewing is often difficult, painful, or uncertain.",
        nl: "Daarnaast speelt het besef dat behoud geen realistische optie meer is. Veel mensen ervaren dat als een keerpunt: de focus verschuift van herstellen wat er nog is, naar het opnieuw opbouwen van een volledig functioneel geheel. In dit scenario draait het niet om kleine correcties, maar om een doordachte keuze voor een oplossing die opnieuw rust en zekerheid brengt.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij een situatie waarin bijna alle tanden niet te redden zijn, worden doorgaans drie full-mouth richtingen besproken. Ze verschillen in vastheid, beleving, onderhoud en kost. Welke richting het best past, hangt af van uw verwachtingen, comfortwensen en hoe definitief u de oplossing wenst.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Het doel van elke optie is dat u opnieuw zeker en comfortabel kunt functioneren. De mate van vastheid en beleving verschilt per oplossing, maar alle richtingen zijn bedoeld om uw dagelijks leven merkbaar te verbeteren.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Trajectduur ligt meestal tussen 4 en 9 maanden.",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na chirurgische stappen kan ongeveer één week napijn of zwelling voorkomen.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Hersteltijd: 5–10 dagen per chirurgische fase. Mogelijke impact: zwelling en napijn.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Herstelmomenten per fase; totale duur gespreid over maanden.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Vast gebit boven en onder: ± €20.000 – €50.000\nKlikgebit boven en onder: ± €8.000 – €15.000\nCombinatie vast + klikgebit: ± €20.000 – €30.000",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van materiaalkeuze, aantal implantaten en technische uitvoering.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts uw prioriteiten rond vastheid, onderhoud, comfort en budget te bespreken. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met vertrouwen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Fixed Denture Upper and Lower", nl: "Vast gebit boven en onder" },
        rank: 1,
        category: "bridge",
        description: {
          en: "In both jaws, a fixed bridge is placed on multiple implants (for example All-on-4 or All-on-6).",
          nl: "In beide kaken wordt een vaste brug geplaatst op meerdere implantaten (bijvoorbeeld All-on-4 of All-on-6).",
        },
        benefits: [
          { en: "Very high stability", nl: "Zeer hoge stabiliteit" },
          { en: "Fixed feeling when chewing and speaking", nl: "Vast gevoel bij kauwen en spreken" },
          { en: "No removable parts", nl: "Geen uitneembare onderdelen" },
          { en: "Great improvement in quality of life", nl: "Grote verbetering van levenskwaliteit" },
        ],
        considerations: [
          { en: "High cost", nl: "Hoge kost" },
          { en: "Long-term and phased treatment", nl: "Langdurig en gefaseerd traject" },
          { en: "Careful planning and healing needed", nl: "Zorgvuldige planning en genezing nodig" },
        ],
        ideal_for: {
          en: "You choose maximum fixation and comfort and are willing to invest in a durable total solution.",
          nl: "Voor wie kiest voor maximale vastheid en comfort en bereid is te investeren in een duurzame totaaloplossing.",
        },
        pricing: { min: 20000, max: 50000, currency: "EUR" },
        duration: { min_months: 4, max_months: 9 },
        recovery: { days: 10 },
      },
      {
        id: "opt_2",
        name: { en: "Snap-on Denture Upper and Lower", nl: "Klikgebit boven en onder" },
        rank: 2,
        category: "denture",
        description: {
          en: "Removable dentures that snap onto implants in both jaws.",
          nl: "Uitneembare gebitten die vastklikken op implantaten in beide kaken.",
        },
        benefits: [
          { en: "Better stability than loose prostheses", nl: "Betere stabiliteit dan losse protheses" },
          { en: "Lower cost than fixed bridges", nl: "Lagere kost dan vaste bruggen" },
          { en: "Less complex treatment", nl: "Minder complex traject" },
          { en: "Easily removable for maintenance", nl: "Gemakkelijk uitneembaar voor onderhoud" },
        ],
        considerations: [
          { en: "Not completely fixed", nl: "Niet volledig vast" },
          { en: "Daily removal remains necessary", nl: "Dagelijks uitnemen blijft nodig" },
          { en: "Less natural feeling than fixed teeth", nl: "Minder natuurlijk gevoel dan vaste tanden" },
        ],
        ideal_for: {
          en: "You are looking for a functional and affordable full-mouth solution with clear improvement of comfort.",
          nl: "Voor wie een functionele en betaalbare full-mouth oplossing zoekt met duidelijke verbetering van comfort.",
        },
        pricing: { min: 8000, max: 15000, currency: "EUR" },
        duration: { min_months: 4, max_months: 9 },
        recovery: { days: 10 },
      },
      {
        id: "opt_3",
        name: { en: "Fixed Upper + Snap-on Lower", nl: "Vast gebit boven + klikgebit onder" },
        rank: 3,
        category: "other",
        description: {
          en: "A fixed bridge in the upper jaw combined with a removable snap-on denture in the lower jaw.",
          nl: "Een vaste brug in de bovenkaak gecombineerd met een uitneembaar klikgebit in de onderkaak.",
        },
        benefits: [
          { en: "Good balance between stability and cost", nl: "Goede balans tussen stabiliteit en kost" },
          { en: "Fixed solution where visibility and function demand it most", nl: "Vaste oplossing waar zicht en functie het meest vragen" },
          { en: "Flexibility per jaw", nl: "Flexibiliteit per kaak" },
        ],
        considerations: [
          { en: "Difference in experience between upper and lower", nl: "Verschil in beleving tussen boven en onder" },
          { en: "More maintenance planning", nl: "Meer onderhoudsplanning" },
          { en: "Careful coordination needed", nl: "Zorgvuldige afstemming nodig" },
        ],
        ideal_for: {
          en: "You are looking for a balanced combination between comfort, fixation, and feasibility.",
          nl: "Voor wie een evenwichtige combinatie zoekt tussen comfort, vastheid en haalbaarheid.",
        },
        pricing: { min: 20000, max: 30000, currency: "EUR" },
        duration: { min_months: 4, max_months: 9 },
        recovery: { days: 10 },
      },
    ],
    pricing: { min: 8000, max: 50000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S11 — Geen ontbrekende tanden, scheefstand
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S11",
    name: { en: "No missing teeth, alignment issue", nl: "Geen ontbrekende tanden, scheefstand" },
    description: { en: "Alignment or spacing concerns without missing teeth", nl: "Scheefstand of onregelmatige stand zonder ontbrekende tanden" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 13,
    matching: {
      required_drivers: { mouth_situation: ["no_missing_teeth"] },
      strong_drivers: { profile_type: ["aesthetic"], clinical_priority: ["elective"] },
      supporting_drivers: { age_stage: ["young_adult", "adult"], aesthetic_tolerance: ["conservative"] },
      excluding_drivers: {},
      preferred_tags: ["issue_alignment"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "Your teeth are completely present, but you are bothered by misalignment or irregular positioning.",
        nl: "Uw tanden zijn volledig aanwezig, maar u stoort zich aan scheefstand of een onregelmatige stand. Uw wens is vooral esthetisch: een rechter, harmonieuzer geheel, zonder dat dit onnatuurlijk oogt.",
      },
      SITUATION_BASE: {
        en: "With misalignment without missing teeth, it's usually not about a functional problem, but about how your smile feels and looks.",
        nl: "Bij scheefstand zonder ontbrekende tanden gaat het meestal niet om een functioneel probleem, maar om hoe uw glimlach aanvoelt en oogt. Vaak zijn het kleine verschuivingen, rotaties of ongelijke lijnen die u opvallen op foto's of in de spiegel.",
      },
      SITUATION_RELEVANCE: {
        en: "Often it's small shifts, rotations, or uneven lines that you notice in photos or in the mirror.",
        nl: "Veel mensen leven hier jarenlang mee, tot het gevoel ontstaat dat de tanden \"net niet kloppen\". Soms is dat esthetisch storend bij lachen, soms geeft het het idee dat tanden moeilijker te reinigen zijn. De twijfel zit vaak in de vraag: kan dit subtiel gecorrigeerd worden zonder ingrijpende stappen?",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij esthetische scheefstand zonder tandverlies worden doorgaans twee richtingen overwogen. Ze verschillen sterk in aanpak: de ene richt zich op verplaatsen van tanden, de andere op vormcorrectie. Welke optie het meest logisch is, hangt af van de aard van de scheefstand en uw verwachtingen.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Beide opties kunnen leiden tot een rechter en evenwichtiger ogende glimlach. Bij aligners ligt de nadruk op natuurlijke correctie; bij facings op visuele harmonie. Comfort tijdens het traject verschilt: aligners vragen gewenning en discipline, facings vooral een goede voorbereiding.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Aligners: gemiddeld 6–18 maanden\nFacings: meestal enkele weken, afhankelijk van aantal tanden",
      },
      PROCESS_OVERVIEW: { en: "", nl: "" },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Aligners: geen hersteltijd, gewenning 3–7 dagen bij elke nieuwe aligner.\nFacings: hersteltijd 1–2 dagen, lichte gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Aligners: geen beperking.\nFacings: geen werkonderbreking.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Aligners: ± €2.000 – €4.000\nPorseleinen facings: ± €900 – €1.300 per tand",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal tanden, materiaalkeuze en planning. Kosten maken deel uit van een esthetische afweging, niet van een noodzaak.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het zinvol om te bespreken wat u het belangrijkst vindt: tanden verplaatsen of het eindbeeld optimaliseren. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met realistische verwachtingen aan te gaan.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Aligners (Invisible Braces)", nl: "Aligners (onzichtbare beugel)" },
        rank: 1,
        category: "orthodontic",
        description: {
          en: "A series of transparent aligners that gradually move the teeth according to a digital treatment plan.",
          nl: "Een reeks transparante aligners die de tanden stap voor stap verplaatsen volgens een digitaal behandelplan.",
        },
        benefits: [
          { en: "Invisible in daily life", nl: "Onzichtbaar in het dagelijks leven" },
          { en: "No fixed braces", nl: "Geen vaste beugel" },
          { en: "Digital planning in advance", nl: "Digitale planning vooraf" },
          { en: "Preservation of natural teeth", nl: "Behoud van natuurlijke tanden" },
        ],
        considerations: [
          { en: "Treatment usually takes longer", nl: "Traject duurt meestal langer" },
          { en: "Discipline needed in wearing", nl: "Discipline nodig bij dragen" },
          { en: "Result follows step by step", nl: "Resultaat volgt stapsgewijs" },
        ],
        ideal_for: {
          en: "You want a structural correction and are willing to invest time in a gradual process.",
          nl: "Voor wie een structurele correctie wenst en bereid is tijd te investeren in een geleidelijk traject.",
        },
        pricing: { min: 2000, max: 4000, currency: "EUR" },
        duration: { min_months: 6, max_months: 18 },
        recovery: { days: 0 },
      },
      {
        id: "opt_2",
        name: { en: "Veneers for Shape or Position Problems", nl: "Facings bij vorm- of standproblemen" },
        rank: 2,
        category: "veneer",
        description: {
          en: "Porcelain veneers are placed on the front of the teeth to visually correct shape, position, and symmetry.",
          nl: "Porseleinen facings worden geplaatst op de zichtzijde van de tanden om vorm, stand en symmetrie visueel te corrigeren.",
        },
        benefits: [
          { en: "Shorter treatment", nl: "Korter traject" },
          { en: "Immediately visible result", nl: "Direct zichtbaar resultaat" },
          { en: "Correction of shape and color possible", nl: "Correctie van vorm en kleur mogelijk" },
          { en: "Great influence on smile harmony", nl: "Grote invloed op glimlachharmonie" },
        ],
        considerations: [
          { en: "Interventions on healthy teeth require careful consideration", nl: "Ingrepen aan gezonde tanden vragen zorgvuldige afweging" },
          { en: "More definitive character", nl: "Meer definitief karakter" },
          { en: "Cost per tooth", nl: "Kost per tand" },
        ],
        ideal_for: {
          en: "You mainly find the visual result important and don't want a long treatment.",
          nl: "Voor wie vooral het uiterlijk resultaat belangrijk vindt en geen langdurig traject wenst.",
        },
        pricing: { min: 900, max: 1300, currency: "EUR" },
        recovery: { days: 2 },
      },
    ],
    pricing: { min: 900, max: 4000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S12 — Losse tanden of pijn (ACUTE / SAFETY)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S12",
    name: { en: "Loose teeth or pain (ACUTE)", nl: "Losse tanden of pijn" },
    description: { en: "Acute symptoms requiring immediate attention", nl: "Acute symptomen die onmiddellijke aandacht vereisen" },
    is_fallback: false,
    is_safety_scenario: true,
    priority: 1,
    matching: {
      required_drivers: { clinical_priority: ["urgent", "semi_urgent"] },
      strong_drivers: {},
      supporting_drivers: {},
      excluding_drivers: { clinical_priority: ["elective"] },
      preferred_tags: ["acute_pain", "acute_infection", "acute_loose_missing", "issue_functional_pain"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are experiencing looseness of teeth and/or pain complaints.",
        nl: "U ervaart losheid van tanden en/of pijnklachten. Uw belangrijkste wens is het herstellen van comfort, zekerheid en stabiliteit, zodat eten en dagelijks functioneren opnieuw zonder spanning mogelijk worden.",
      },
      SITUATION_BASE: {
        en: "When teeth feel loose or cause pain, this can evoke uncertainty.",
        nl: "Wanneer tanden los aanvoelen of pijn veroorzaken, kan dat onzekerheid oproepen. Veel mensen merken dit tijdens het kauwen, bij druk op bepaalde tanden of zelfs in rust. Het vertrouwen in het eigen gebit neemt af en eenvoudige handelingen, zoals eten of tandenpoetsen, kunnen extra aandacht vragen.",
      },
      SITUATION_RELEVANCE: {
        en: "Many people notice this during chewing, with pressure on certain teeth, or even at rest.",
        nl: "In dit scenario staat niet esthetiek voorop, maar functioneel vertrouwen. De vraag is zelden hoe het eruitziet, maar vooral: hoe krijg ik opnieuw een stabiel en comfortabel gevoel? Omdat losheid en pijn verschillende oorzaken kunnen hebben, is het belangrijk om de situatie zorgvuldig te laten beoordelen. Het Smile-rapport helpt u om mogelijke vervolgrichtingen te begrijpen, zonder conclusies te trekken.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij losse tanden of pijn wordt meestal gekeken naar oplossingen die stabiliteit en functie herstellen. Afhankelijk van hoeveel tanden nog betrouwbaar zijn en hoe de belasting verdeeld is, worden doorgaans twee functionele richtingen besproken. De keuze hangt af van duurzaamheid, comfort en de gewenste voorspelbaarheid op lange termijn.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Het doel van beide richtingen is dat u opnieuw zeker en comfortabel kunt functioneren. Pijn en losheid mogen niet langer uw dagelijkse handelingen bepalen. De nadruk ligt op stabiliteit, betrouwbaarheid en een gevoel van rust tijdens kauwen en spreken.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Implantaatoplossingen: gemiddeld 4–7 maanden\nBrugoplossingen: vergelijkbaar, afhankelijk van de planning",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na ingrepen kan enkele dagen napijn of gevoeligheid voorkomen. Daarna herneemt u meestal snel uw dagelijkse activiteiten.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Hersteltijd: 3–7 dagen. Mogelijke impact: napijn of gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Verbetering van stabiliteit na herstel.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Implantaten met kronen: ± €2.200 – €9.000, afhankelijk van aantal tanden\nBruggen op implantaten: ± €4.500 – €6.000",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van de omvang van de behandeling, materiaalkeuze en technische uitvoering. Kosten maken deel uit van een functionele afweging, niet van een verplichting.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Omdat pijn of losheid altijd aandacht vraagt, is het belangrijk om deze signalen tijdig met een tandarts te bespreken. De Smile-link beslissingsgids helpt u om uw vragen, verwachtingen en zorgen helder te formuleren, zodat u goed voorbereid het gesprek aangaat.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Implants as Replacement", nl: "Implantaten ter vervanging" },
        rank: 1,
        category: "implant",
        description: {
          en: "Teeth that can no longer be preserved are replaced by implants with crowns, possibly spread over different zones.",
          nl: "Tanden die niet meer behouden kunnen worden, worden vervangen door implantaten met kronen, eventueel gespreid over verschillende zones.",
        },
        benefits: [
          { en: "Restoration of functional security", nl: "Herstel van functionele zekerheid" },
          { en: "No reliance on possibly weakened teeth", nl: "Geen steun op mogelijk verzwakte tanden" },
          { en: "Durable solution per tooth or zone", nl: "Duurzame oplossing per tand of zone" },
          { en: "Reliable feeling when chewing", nl: "Betrouwbaar gevoel bij kauwen" },
        ],
        considerations: [
          { en: "Surgical procedure needed", nl: "Chirurgische ingreep nodig" },
          { en: "Treatment in multiple steps", nl: "Traject in meerdere stappen" },
          { en: "Higher cost", nl: "Hogere kost" },
        ],
        ideal_for: {
          en: "You are looking for a predictable and stable solution and are willing to follow a process for long-term comfort.",
          nl: "Voor wie een voorspelbare en stabiele oplossing zoekt en bereid is een traject te volgen voor langdurig comfort.",
        },
        pricing: { min: 2200, max: 9000, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 7 },
      },
      {
        id: "opt_2",
        name: { en: "Bridges with Limited Remaining Teeth", nl: "Bruggen bij beperkte resttanden" },
        rank: 2,
        category: "bridge",
        description: {
          en: "Multiple teeth are replaced together by a bridge that relies on implants or remaining stable elements.",
          nl: "Meerdere tanden worden samen vervangen door een brug die steunt op implantaten of resterende stabiele elementen.",
        },
        benefits: [
          { en: "Restoration of function over a larger area", nl: "Herstel van functie over een groter gebied" },
          { en: "Fewer separate procedures", nl: "Minder afzonderlijke ingrepen" },
          { en: "Clear and manageable approach", nl: "Duidelijke en overzichtelijke aanpak" },
        ],
        considerations: [
          { en: "Less individual per tooth", nl: "Minder individueel per tand" },
          { en: "Requires sufficient stable support points", nl: "Vereist voldoende stabiele steunpunten" },
          { en: "Less flexible for later adjustments", nl: "Minder flexibel bij latere aanpassingen" },
        ],
        ideal_for: {
          en: "You are looking for a practical and coherent solution with multiple involved teeth.",
          nl: "Voor wie een praktische en samenhangende oplossing zoekt bij meerdere betrokken tanden.",
        },
        pricing: { min: 4500, max: 6000, currency: "EUR" },
        duration: { min_months: 4, max_months: 7 },
        recovery: { days: 7 },
      },
    ],
    pricing: { min: 2200, max: 9000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S13 — Jong profiel, lichte verkleuring
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S13",
    name: { en: "Young profile, mild discoloration", nl: "Jong profiel, lichte verkleuring" },
    description: { en: "Young adult with minor aesthetic concerns", nl: "Jonge volwassene met lichte esthetische zorgen" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 14,
    matching: {
      required_drivers: { age_stage: ["young_adult"], mouth_situation: ["no_missing_teeth"] },
      strong_drivers: { profile_type: ["aesthetic"], clinical_priority: ["elective"] },
      supporting_drivers: { budget_type: ["balanced", "economy"] },
      excluding_drivers: { age_stage: ["senior"] },
      preferred_tags: ["issue_discoloration"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You have a young profile and are bothered by light discoloration of your teeth.",
        nl: "U heeft een jong profiel en stoort zich aan een lichte verkleuring van uw tanden. Uw wens is vooral een frissere en helderdere uitstraling, zonder dat uw glimlach onnatuurlijk oogt of ingrijpend wordt aangepast.",
      },
      SITUATION_BASE: {
        en: "In young people, discoloration is often not about serious color problems, but about subtle differences that become visible in photos, in bright light, or in comparison with others.",
        nl: "Bij jonge mensen gaat verkleuring vaak niet over ernstige kleurproblemen, maar over subtiele verschillen die zichtbaar worden op foto's, bij fel licht of in vergelijking met anderen. Veel mensen ervaren hun tanden als \"gezond, maar niet zo fris als ze zouden willen\".",
      },
      SITUATION_RELEVANCE: {
        en: "Many people experience their teeth as healthy, but not as fresh as they would like.",
        nl: "Omdat uw tanden verder volledig aanwezig zijn en geen functionele klachten geven, is de drempel voor ingrijpende behandelingen meestal hoog. De twijfel zit vaak in de vraag: kan dit op een eenvoudige manier verbeterd worden, zonder blijvende ingrepen? In dit scenario staat behoud van natuurlijke tanden centraal.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij lichte verkleuring in een jong profiel worden doorgaans twee esthetische richtingen overwogen. De eerste richt zich op het opfrissen van de natuurlijke kleur, de tweede op het corrigeren van kleur en vorm wanneer een sterker effect gewenst is. Welke optie het best past, hangt af van uw verwachtingen en hoe blijvend u het resultaat wilt.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In dit scenario ligt de nadruk op een natuurlijke en subtiele verbetering. Overdreven witte of opvallende resultaten worden meestal niet nagestreefd. Comfort tijdens en na de behandeling is doorgaans hoog, zeker bij bleken. Facings vragen een nauwkeurige planning om een harmonieus resultaat te bekomen.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Bleken: meestal 1–2 sessies\nFacings: doorgaans enkele weken, afhankelijk van het aantal tanden",
      },
      PROCESS_OVERVIEW: { en: "", nl: "" },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Bleken: geen hersteltijd, lichte gevoeligheid tot 24–48 uur.\nFacings: hersteltijd 1–2 dagen, lichte gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Bleken: geen beperking.\nFacings: geen impact.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Professioneel bleken: ± €250 – €450\nFacings: ± €200 – €1.300 per tand, afhankelijk van materiaal",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal behandelde tanden en uw esthetische verwachtingen. Kosten maken deel uit van een persoonlijke afweging, niet van een noodzaak.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het zinvol om voor uzelf te bepalen hoe subtiel of uitgesproken u het resultaat wenst. De Smile-link beslissingsgids helpt u om dit gesprek met een tandarts gestructureerd en met realistische verwachtingen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Professional Teeth Whitening", nl: "Professioneel tandenbleken" },
        rank: 1,
        category: "whitening",
        description: {
          en: "A controlled treatment that lightens the natural tooth color, via one or more sessions.",
          nl: "Een gecontroleerde behandeling waarbij de natuurlijke tandkleur lichter wordt gemaakt, via één of meerdere sessies.",
        },
        benefits: [
          { en: "Quick improvement", nl: "Snelle verbetering" },
          { en: "No intervention on healthy teeth", nl: "Geen ingreep aan gezonde tanden" },
          { en: "No recovery time", nl: "Geen hersteltijd" },
          { en: "Safe and often well predictable result", nl: "Veilig en vaak goed voorspelbaar resultaat" },
        ],
        considerations: [
          { en: "The effect is temporary", nl: "Het effect is tijdelijk" },
          { en: "Periodic repetition may be needed", nl: "Periodiek herhalen kan nodig zijn" },
          { en: "Not every discoloration responds the same", nl: "Niet elke verkleuring reageert hetzelfde" },
        ],
        ideal_for: {
          en: "You mainly want a fresher appearance and are looking for a simple, reversible solution.",
          nl: "Voor wie vooral een frissere uitstraling wenst en een eenvoudige, omkeerbare oplossing zoekt.",
        },
        pricing: { min: 250, max: 450, currency: "EUR" },
        recovery: { days: 0 },
      },
      {
        id: "opt_2",
        name: { en: "Veneers for Higher Aesthetic Expectations", nl: "Facings bij hogere esthetische verwachting" },
        rank: 2,
        category: "veneer",
        description: {
          en: "Thin shells in composite or porcelain are placed on the front of the teeth to correct color and appearance.",
          nl: "Dunne schildjes in composiet of porselein worden op de voorkant van de tanden geplaatst om kleur en uitstraling te corrigeren.",
        },
        benefits: [
          { en: "More stable color result", nl: "Stabieler kleurresultaat" },
          { en: "Possibility to improve shape and symmetry", nl: "Mogelijkheid om vorm en symmetrie te verbeteren" },
          { en: "Great influence on the overall picture of the smile", nl: "Grote invloed op het totaalbeeld van de glimlach" },
        ],
        considerations: [
          { en: "Interventions on healthy teeth require careful consideration", nl: "Ingrepen aan gezonde tanden vragen zorgvuldige afweging" },
          { en: "More definitive character", nl: "Meer definitief karakter" },
          { en: "Cost per tooth", nl: "Kost per tand" },
        ],
        ideal_for: {
          en: "You notice that whitening would be insufficient or consciously choose a more permanent aesthetic correction.",
          nl: "Voor wie merkt dat bleken onvoldoende zou voldoen of bewust kiest voor een meer blijvende esthetische correctie.",
        },
        pricing: { min: 200, max: 1300, currency: "EUR" },
        recovery: { days: 2 },
      },
    ],
    pricing: { min: 200, max: 1300, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S14 — Oudere persoon, beperkt budget
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S14",
    name: { en: "Senior, limited budget", nl: "Oudere persoon, beperkt budget" },
    description: { en: "Older patient with budget constraints", nl: "Ouder profiel met budgetbeperkingen" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 15,
    matching: {
      required_drivers: { age_stage: ["senior"], budget_type: ["economy", "balanced"] },
      strong_drivers: { profile_type: ["functional", "comfort"] },
      supporting_drivers: { treatment_philosophy: ["durability_focused"] },
      excluding_drivers: { budget_type: ["premium"], age_stage: ["young_adult", "growing"] },
      preferred_tags: [],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You have an older profile with visible wear and discoloration.",
        nl: "U behoort tot een ouder profiel en houdt bewust rekening met een beperkt budget. Uw belangrijkste wens is een praktische oplossing die comfort en basisfunctionaliteit herstelt, zonder onnodige complexiteit of financiële druk.",
      },
      SITUATION_BASE: {
        en: "Over time, teeth naturally change.",
        nl: "Op latere leeftijd verschuiven prioriteiten vaak. Waar vroeger esthetiek misschien belangrijker was, ligt de nadruk nu vaker op comfort, eenvoud en betaalbaarheid. Kauwen moet vlot gaan, spreken moet comfortabel aanvoelen en de oplossing moet betrouwbaar zijn in het dagelijks gebruik.",
      },
      SITUATION_RELEVANCE: {
        en: "Color can deepen, surfaces may show signs of wear, and the overall appearance may feel less vibrant than before.",
        nl: "Veel mensen in dit scenario willen vooral vermijden dat eten of sociale momenten stressvol worden. Tegelijk is het belangrijk dat onderhoud haalbaar blijft en dat de oplossing past binnen een realistisch budget. In dit scenario gaat het dus niet om \"de beste of meest uitgebreide oplossing\", maar om wat praktisch en haalbaar is.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij een ouder profiel met een beperkt budget worden doorgaans twee budgetvriendelijke full-mouth richtingen besproken. Ze verschillen vooral in stabiliteit, comfort en kost, maar hebben beide als doel het dagelijks functioneren te verbeteren.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Beide opties zijn gericht op het verbeteren van dagelijks comfort. Een klikprothese biedt meer zekerheid en stabiliteit, terwijl een klassiek kunstgebit eenvoudiger en goedkoper is. Het comfortniveau verschilt, maar beide kunnen het functioneren duidelijk verbeteren.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Klikprothese op implantaten: gemiddeld 3–9 maanden\nKlassiek kunstgebit: meestal korter, afhankelijk van aanpassing",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na ingrepen kan enkele dagen gevoeligheid voorkomen. Daarna herneemt u doorgaans snel uw dagelijkse activiteiten.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Klikprothese op implantaten: hersteltijd 3–7 dagen, napijn of gevoeligheid.\nKlassiek kunstgebit: geen hersteltijd, gewenning 1–3 weken.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Klikprothese: snelle hervatting.\nKlassiek kunstgebit: tijdelijke aanpassing bij spreken en eten.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Klikprothese op implantaten: ± €4.000 – €9.000\nKlassiek kunstgebit: ± €1.500 – €3.000",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van materiaalkeuze en technische uitvoering. Kosten maken deel uit van een budgetafweging, niet van een verplichting.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het zinvol om samen met een tandarts te bespreken welke oplossing het best aansluit bij uw comfort, verwachtingen en financiële mogelijkheden. De Smile-link beslissingsgids helpt u om dit gesprek rustig en gestructureerd aan te gaan.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Snap-on Denture on 2-4 Implants", nl: "Klikprothese op 2–4 implantaten" },
        rank: 1,
        category: "denture",
        description: {
          en: "A removable denture that snaps onto two to four implants for extra stability.",
          nl: "Een uitneembare prothese die vastklikt op twee tot vier implantaten, waardoor het gebit stabieler zit dan een klassiek kunstgebit.",
        },
        benefits: [
          { en: "More stability than a loose denture", nl: "Meer stabiliteit dan een los kunstgebit" },
          { en: "More affordable than fixed solutions", nl: "Betaalbaarder dan vaste oplossingen" },
          { en: "Easily removable for maintenance", nl: "Eenvoudig uitneembaar voor onderhoud" },
          { en: "Better chewing function and confidence", nl: "Betere kauwfunctie en zekerheid" },
        ],
        considerations: [
          { en: "Not completely fixed", nl: "Niet volledig vast" },
          { en: "Daily removal remains necessary", nl: "Dagelijks uitnemen blijft nodig" },
          { en: "Less natural feeling than fixed teeth", nl: "Minder natuurlijk gevoel dan vaste tanden" },
        ],
        ideal_for: {
          en: "You want a good balance between comfort and affordability, without a complex process.",
          nl: "Voor wie een goede balans zoekt tussen comfort en betaalbaarheid, zonder een complex traject.",
        },
        pricing: { min: 4000, max: 9000, currency: "EUR" },
        duration: { min_months: 3, max_months: 9 },
        recovery: { days: 7 },
      },
      {
        id: "opt_2",
        name: { en: "Classic Removable Denture", nl: "Klassiek uitneembaar kunstgebit" },
        rank: 2,
        category: "denture",
        description: {
          en: "A fully removable denture without implants.",
          nl: "Een volledig uitneembare prothese zonder implantaten.",
        },
        benefits: [
          { en: "Lowest cost", nl: "Laagste kost" },
          { en: "No surgical procedures", nl: "Geen chirurgische ingrepen" },
          { en: "Relatively quick solution", nl: "Relatief snelle oplossing" },
        ],
        considerations: [
          { en: "Less stable", nl: "Minder stabiel" },
          { en: "Can shift during eating or speaking", nl: "Kan verschuiven bij eten of spreken" },
          { en: "Adjustment period needed", nl: "Gewenningsperiode nodig" },
        ],
        ideal_for: {
          en: "You are looking for a very accessible solution and prioritize cost management.",
          nl: "Voor wie een zeer toegankelijke oplossing zoekt en prioriteit geeft aan kostbeheersing.",
        },
        pricing: { min: 1500, max: 3000, currency: "EUR" },
        recovery: { days: 0 },
      },
    ],
    pricing: { min: 1500, max: 9000, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S15 — Premium klant, esthetisch profiel
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S15",
    name: { en: "Premium client, aesthetic profile", nl: "Premium klant, esthetisch profiel" },
    description: { en: "High-budget patient seeking best aesthetic outcome", nl: "Patiënt met hoog budget gericht op beste esthetische resultaat" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 16,
    matching: {
      required_drivers: { budget_type: ["premium"], profile_type: ["aesthetic"] },
      strong_drivers: { aesthetic_tolerance: ["moderate", "aggressive"], expectation_risk: ["moderate", "high"] },
      supporting_drivers: {},
      excluding_drivers: { budget_type: ["economy", "unknown"], profile_type: ["functional", "comfort"] },
      preferred_tags: ["style_hollywood", "style_classic"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You're interested in achieving a bright, white, \"Hollywood\" style smile.",
        nl: "U heeft een uitgesproken esthetische verwachting en hecht veel belang aan uitstraling, detail en harmonie. Uw wens is een glimlach die er verzorgd, natuurlijk en hoogwaardig uitziet, met aandacht voor duurzaamheid en afwerking.",
      },
      SITUATION_BASE: {
        en: "A Hollywood smile represents a specific aesthetic choice—bright white, perfectly aligned teeth that create a dramatic visual impact.",
        nl: "In dit scenario zijn er meestal geen uitgesproken functionele problemen, maar ligt de focus op hoe de glimlach oogt en aanvoelt. Kleine imperfecties in kleur, vorm, symmetrie of verhoudingen kunnen storend zijn, zeker wanneer u veel aandacht besteedt aan uw uitstraling.",
      },
      SITUATION_RELEVANCE: {
        en: "This is different from subtle, natural-looking improvement; it's about achieving a distinctive, camera-ready appearance.",
        nl: "Veel mensen in dit profiel zijn niet op zoek naar een \"snelle correctie\", maar naar een doordachte esthetische verfijning. Het resultaat moet passen bij het gelaat, de persoonlijkheid en de levensstijl, zonder overdreven of kunstmatig effect. In dit scenario speelt vertrouwen in kwaliteit, materiaal en afwerking een centrale rol.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij een premium esthetisch profiel worden doorgaans twee high-end richtingen overwogen. Beide focussen op esthetiek en duurzaamheid, maar verschillen in omvang en diepgang van de correctie. Welke optie het meest geschikt is, hangt af van hoe uitgebreid u de esthetische verbetering wenst.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In beide richtingen ligt de nadruk op een hoogwaardig en natuurlijk eindresultaat. Overdreven witte of opvallende resultaten worden meestal vermeden. Comfort na plaatsing is doorgaans goed, met een korte gewenningsperiode van één tot twee dagen.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Porseleinen facings: meestal 2–3 weken\nUitgebreidere esthetische restauraties: vergelijkbaar, afhankelijk van omvang",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na plaatsing kan 1–2 dagen gevoeligheid voorkomen.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Hersteltijd: 1–2 dagen. Mogelijke impact: lichte gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Geen beperking.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Porseleinen facings: ± €900 – €1.300 per tand\nVolkeramische kronen: ± €700 – €1.000 per tand",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal tanden, materiaalkeuze en afwerkingsniveau. Kosten maken deel uit van een bewuste kwaliteitsafweging.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het zinvol om samen met een tandarts uw esthetische verwachtingen, referentiebeelden en gewenste uitstraling te bespreken. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met een helder beeld van uw prioriteiten aan te gaan.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Porcelain Veneers", nl: "Porseleinen facings" },
        rank: 1,
        category: "veneer",
        description: {
          en: "Multiple porcelain veneers (typically 8-10 upper teeth, sometimes lower as well) to create a uniformly bright, symmetric smile.",
          nl: "Dunne porseleinen facings worden op de voorkant van de tanden geplaatst om kleur, vorm en symmetrie te optimaliseren.",
        },
        benefits: [
          { en: "High-quality, color-stable materials", nl: "Hoogwaardige en kleurvaste materialen" },
          { en: "Subtle, natural aesthetics", nl: "Subtiele, natuurlijke esthetiek" },
          { en: "Great influence on the overall smile picture", nl: "Grote invloed op het totaalbeeld van de glimlach" },
          { en: "Suitable for detail-oriented corrections", nl: "Geschikt voor detailgerichte correcties" },
        ],
        considerations: [
          { en: "Not fully reversible", nl: "Niet volledig omkeerbaar" },
          { en: "Careful preparation required", nl: "Zorgvuldige voorbereiding vereist" },
          { en: "Cost per tooth", nl: "Kost per tand" },
        ],
        ideal_for: {
          en: "You want a luxurious but balanced result without a full reconstruction.",
          nl: "Voor wie een luxueus maar evenwichtig resultaat wenst zonder een volledige heropbouw.",
        },
        pricing: { min: 900, max: 1300, currency: "EUR" },
        recovery: { days: 2 },
      },
      {
        id: "opt_2",
        name: { en: "Full Aesthetic Restoration", nl: "Volledige esthetische restauratie" },
        rank: 2,
        category: "crown",
        description: {
          en: "A more extensive approach where multiple teeth are restored with all-ceramic crowns and/or veneers, with focus on total harmony.",
          nl: "Een uitgebreidere aanpak waarbij meerdere tanden worden hersteld met volkeramische kronen en/of facings, met focus op totale harmonie.",
        },
        benefits: [
          { en: "Maximum control over shape, color, and proportions", nl: "Maximale controle over vorm, kleur en verhoudingen" },
          { en: "Very durable and stable result", nl: "Zeer duurzaam en stabiel resultaat" },
          { en: "Suitable for larger aesthetic deviations", nl: "Geschikt bij grotere esthetische afwijkingen" },
        ],
        considerations: [
          { en: "More invasive", nl: "Meer ingrijpend" },
          { en: "Less reversible", nl: "Minder omkeerbaar" },
          { en: "Larger investment", nl: "Grotere investering" },
        ],
        ideal_for: {
          en: "You choose a full aesthetic optimization and value perfection in detail and coherence.",
          nl: "Voor wie kiest voor een volledige esthetische optimalisatie en waarde hecht aan perfectie in detail en samenhang.",
        },
        pricing: { min: 700, max: 1000, currency: "EUR" },
        recovery: { days: 2 },
      },
    ],
    pricing: { min: 700, max: 1300, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S16 — Slijtage of breuk zonder tandverlies (3 options)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S16",
    name: { en: "Wear or damage without missing teeth", nl: "Slijtage of breuk zonder tandverlies" },
    description: { en: "Tooth wear, cracks, or damage but no missing teeth", nl: "Tandslijtage, barsten of schade zonder tandverlies" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 17,
    matching: {
      required_drivers: { mouth_situation: ["no_missing_teeth"] },
      strong_drivers: { profile_type: ["functional", "mixed"] },
      supporting_drivers: { clinical_priority: ["elective", "semi_urgent"] },
      excluding_drivers: { mouth_situation: ["single_missing_tooth", "multiple_adjacent", "multiple_dispersed", "extensive_missing", "full_mouth_compromised"] },
      preferred_tags: ["tooth_health_compromised", "tooth_health_bruxism"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You have old dental restorations that are now visible, worn, or failing.",
        nl: "Uw tanden zijn volledig aanwezig, maar u ervaart slijtage en/of breuk. Uw wens is het herstellen van vorm, comfort en uitstraling, zodat kauwen weer natuurlijk aanvoelt en uw glimlach verzorgd oogt.",
      },
      SITUATION_BASE: {
        en: "Dental work performed years ago—fillings, crowns, or other restorations—may no longer look or function as well as they once did.",
        nl: "Bij slijtage of breuk zonder tandverlies gaat het vaak om tanden die korter, platter of gevoeliger aanvoelen, of om een tand die gedeeltelijk is afgebroken. Dit kan merkbaar zijn bij kauwen, bij temperatuurwisselingen of simpelweg bij het zien van uw glimlach.",
      },
      SITUATION_RELEVANCE: {
        en: "Materials darken, margins become visible, and wear can affect both appearance and integrity.",
        nl: "Veel mensen ervaren dat hun beet \"anders\" aanvoelt of dat tanden sneller vermoeid raken. Esthetisch kan slijtage leiden tot een ongelijkmatig beeld of een vermoeide uitstraling. Omdat de tanden nog aanwezig zijn, is het doel meestal behoud en herstel, niet vervanging. De centrale vraag is dan: hoe kan vorm en functie hersteld worden op een manier die past bij mijn situatie en verwachtingen?",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "Bij slijtage of breuk zonder tandverlies worden doorgaans drie functioneel-esthetische richtingen overwogen. Ze verschillen in ingrijpendheid, duurzaamheid en esthetisch effect. Welke optie het meest logisch is, hangt af van de mate van slijtage, uw comfortklachten en hoe zichtbaar de tanden zijn.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "In alle richtingen is het doel dat uw tanden opnieuw comfortabel en evenwichtig aanvoelen. Het esthetische resultaat wordt afgestemd op uw gelaat en natuurlijke tandkleur. Na de behandeling kan een korte gevoeligheid van 1–2 dagen voorkomen.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Het traject duurt meestal 2–3 weken, afhankelijk van de gekozen optie.",
      },
      PROCESS_OVERVIEW: { en: "", nl: "" },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Keramische kronen: hersteltijd 1–3 dagen, gevoeligheid.\nComposietopbouw: geen hersteltijd.\nFacings: hersteltijd 1–2 dagen, lichte gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Keramische kronen: snelle verbetering van kauwcomfort.\nComposietopbouw: onmiddellijk normaal.\nFacings: geen beperking.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Keramische kronen: ± €700 – €1.000 per tand\nComposietopbouw: ± €150 – €350 per tand\nPorseleinen facings: ± €900 – €1.300 per tand",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van het aantal tanden, materiaalkeuze en de gekozen aanpak.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts te bespreken welke combinatie van functie en esthetiek voor u het belangrijkst is. De Smile-link beslissingsgids helpt u om dit gesprek gestructureerd en met realistische verwachtingen te voeren.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Ceramic Crowns", nl: "Keramische kronen" },
        rank: 1,
        category: "crown",
        description: {
          en: "Old crowns are replaced with new porcelain or ceramic crowns that match your natural teeth better.",
          nl: "Een tand wordt volledig hersteld met een volkeramische kroon die vorm, sterkte en esthetiek combineert.",
        },
        benefits: [
          { en: "Restoration of shape and bite", nl: "Herstel van vorm en beet" },
          { en: "High durability", nl: "Hoge duurzaamheid" },
          { en: "Good aesthetic control", nl: "Goede esthetische controle" },
          { en: "Suitable for pronounced damage", nl: "Geschikt bij uitgesproken schade" },
        ],
        considerations: [
          { en: "More invasive", nl: "Meer ingrijpend" },
          { en: "Less reversible", nl: "Minder omkeerbaar" },
          { en: "Higher cost", nl: "Hogere kost" },
        ],
        ideal_for: {
          en: "You need structural restoration and choose maximum stability.",
          nl: "Voor wie structureel herstel nodig heeft en kiest voor maximale stabiliteit.",
        },
        pricing: { min: 700, max: 1000, currency: "EUR" },
        recovery: { days: 3 },
      },
      {
        id: "opt_2",
        name: { en: "Composite Build-up", nl: "Opbouwen in composiet" },
        rank: 2,
        category: "other",
        description: {
          en: "Old metal or composite fillings are replaced with modern tooth-colored materials.",
          nl: "De tand wordt lokaal opgebouwd met composiet om vorm en functie te herstellen.",
        },
        benefits: [
          { en: "Preservation of natural tooth structure", nl: "Behoud van natuurlijke tandstructuur" },
          { en: "Lower cost", nl: "Lagere kost" },
          { en: "Often quickly executable", nl: "Vaak snel uitvoerbaar" },
          { en: "Good functional improvement", nl: "Goede functionele verbetering" },
        ],
        considerations: [
          { en: "Less durable than ceramic", nl: "Minder duurzaam dan keramiek" },
          { en: "May require maintenance or repetition", nl: "Kan onderhoud of herhaling vragen" },
          { en: "More limited aesthetically for larger damage", nl: "Beperkter esthetisch bij grotere schade" },
        ],
        ideal_for: {
          en: "You are looking for a practical and accessible solution for limited damage.",
          nl: "Voor wie een praktische en toegankelijke oplossing zoekt bij beperkte schade.",
        },
        pricing: { min: 150, max: 350, currency: "EUR" },
        recovery: { days: 0 },
      },
      {
        id: "opt_3",
        name: { en: "Veneers for Light Erosion", nl: "Facings bij lichte erosie" },
        rank: 3,
        category: "veneer",
        description: {
          en: "Thin porcelain veneers are placed to improve shape and appearance with light wear in the visible zone.",
          nl: "Dunne porseleinen facings worden geplaatst om vorm en uitstraling te verbeteren bij lichte slijtage in de zichtzone.",
        },
        benefits: [
          { en: "Strong aesthetic improvement", nl: "Sterke esthetische verbetering" },
          { en: "Preservation of a natural appearance", nl: "Behoud van een natuurlijk uiterlijk" },
          { en: "Suitable for visible teeth", nl: "Geschikt voor zichtbare tanden" },
        ],
        considerations: [
          { en: "Not fully reversible", nl: "Niet volledig omkeerbaar" },
          { en: "Less suitable for heavy functional loading", nl: "Minder geschikt bij zware functionele belasting" },
          { en: "Cost per tooth", nl: "Kost per tand" },
        ],
        ideal_for: {
          en: "You mainly want to improve the appearance with limited functional complaints.",
          nl: "Voor wie vooral het uiterlijk wil verbeteren bij beperkte functionele klachten.",
        },
        pricing: { min: 900, max: 1300, currency: "EUR" },
        recovery: { days: 2 },
      },
    ],
    pricing: { min: 150, max: 1300, currency: "EUR" },
    version: "2.0.0",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // S17 — Eén tand ontbreekt, buurtanden hersteld
  // ═══════════════════════════════════════════════════════════════════════════
  {
    _id: "S17",
    name: { en: "Single tooth missing, adjacent teeth restored", nl: "Eén tand ontbreekt, buurtanden hersteld" },
    description: { en: "Single gap with compromised neighboring teeth", nl: "Eén ontbrekende tand met reeds herstelde buurtanden" },
    is_fallback: false,
    is_safety_scenario: false,
    priority: 11,
    matching: {
      required_drivers: { mouth_situation: ["single_missing_tooth"] },
      strong_drivers: { biological_stability: ["moderate", "compromised"] },
      supporting_drivers: { treatment_philosophy: ["minimally_invasive"] },
      excluding_drivers: { mouth_situation: ["multiple_adjacent", "multiple_dispersed", "extensive_missing", "full_mouth_compromised"] },
      preferred_tags: ["adjacent_partial_restored", "adjacent_heavily_restored"],
    },
    nlg_variables: {
      SHORT_SITUATION_DESCRIPTION: {
        en: "You are missing one tooth, while the neighboring teeth have already been restored.",
        nl: "U mist één tand, terwijl de buurtanden reeds hersteld of behandeld zijn. Uw wens is een oplossing die functioneel betrouwbaar is en tegelijk esthetisch goed aansluit bij de bestaande restauraties.",
      },
      SITUATION_BASE: {
        en: "When one tooth is missing between two already restored teeth, a special consideration arises.",
        nl: "Wanneer één tand ontbreekt tussen twee reeds herstelde tanden, ontstaat een bijzondere afweging. Enerzijds is er de wens om de lege ruimte snel en esthetisch op te lossen. Anderzijds speelt de vraag hoe de bestaande restauraties het best worden gerespecteerd.",
      },
      SITUATION_RELEVANCE: {
        en: "Since the neighboring teeth are already restored, it may make sense to involve them in the solution.",
        nl: "Omdat de buurtanden al behandeld zijn, kan het logisch aanvoelen om deze te betrekken in de oplossing. Tegelijk vragen sommige mensen zich af of het beter is om elke tand zo zelfstandig mogelijk te behandelen. Dit scenario draait dus minder om wat kan, en meer om wat in uw situatie het meest logisch aanvoelt.",
      },
      SPECIFIC_SITUATION_CONTEXT: {
        en: "",
        nl: "In deze situatie worden doorgaans twee functioneel-esthetische richtingen overwogen. Beide zijn gangbaar en betrouwbaar, maar verschillen duidelijk in ingrijpendheid, zelfstandigheid en lange-termijnbenadering.",
      },
      COMPARISON_SUMMARY: {
        en: "",
        nl: "Beide opties kunnen leiden tot een stabiel en esthetisch passend resultaat. Bij een brug ligt de nadruk op snelheid en integratie met bestaande restauraties; bij een implantaat op zelfstandigheid en duurzaamheid. Comfort is bij beide opties doorgaans goed, met een korte gewenningsperiode.",
      },
      DURATION_RANGE: {
        en: "",
        nl: "Brug: meestal enkele weken\nImplantaat met kroon: gemiddeld 3–7 maanden",
      },
      PROCESS_OVERVIEW: {
        en: "",
        nl: "Na ingrepen kan enkele dagen gevoeligheid voorkomen.",
      },
      RECOVERY_DESCRIPTION: {
        en: "",
        nl: "Brug: geen hersteltijd, gewenning 1–2 dagen.\nImplantaat met kroon: hersteltijd 2–5 dagen, napijn of gevoeligheid.",
      },
      DAILY_LIFE_IMPACT: {
        en: "",
        nl: "Brug: geen beperking.\nImplantaat: snelle hervatting.",
      },
      COST_INDICATION: {
        en: "",
        nl: "Brug van drie tanden: ± €4.500 – €6.000\nImplantaat met kroon: ± €2.200 – €2.500",
      },
      COST_FACTORS: {
        en: "",
        nl: "De uiteindelijke kost hangt af van materiaalkeuze en technische uitvoering. Kosten maken deel uit van een vergelijkende afweging, niet van een verplichting.",
      },
      RECOMMENDED_NEXT_STEPS: {
        en: "",
        nl: "Om goed voorbereid te beslissen, is het aangewezen om samen met een tandarts te bespreken welke benadering het best aansluit bij uw bestaande restauraties, verwachtingen en planning. De Smile-link beslissingsgids helpt u om deze vergelijking gestructureerd en rustig te maken.",
      },
    },
    treatment_options: [
      {
        id: "opt_1",
        name: { en: "Three-Unit Bridge", nl: "Brug van drie tanden" },
        rank: 1,
        category: "bridge",
        description: {
          en: "The missing tooth is replaced by a bridge that relies on the two adjacent, already restored teeth.",
          nl: "De ontbrekende tand wordt vervangen door een brug die steunt op de twee aangrenzende, reeds herstelde tanden.",
        },
        benefits: [
          { en: "Quick solution", nl: "Snelle oplossing" },
          { en: "Good aesthetic integration", nl: "Goede esthetische integratie" },
          { en: "No implantation needed", nl: "Geen implantatie nodig" },
          { en: "Logical when neighboring teeth already have crown restorations", nl: "Logisch wanneer buurtanden al kroonherstel hebben" },
        ],
        considerations: [
          { en: "Dependent on adjacent teeth", nl: "Afhankelijk van de aangrenzende tanden" },
          { en: "Grinding or adjusting of support points needed", nl: "Slijpen of aanpassen van steunpunten nodig" },
        ],
        ideal_for: {
          en: "You want an efficient and clear solution that aligns with already performed restorations.",
          nl: "Voor wie een efficiënte en overzichtelijke oplossing wenst die aansluit bij reeds uitgevoerde restauraties.",
        },
        pricing: { min: 4500, max: 6000, currency: "EUR" },
        duration: { min_months: 1, max_months: 1 },
        recovery: { days: 0 },
      },
      {
        id: "opt_2",
        name: { en: "Single Implant with Crown", nl: "Enkelvoudig implantaat met kroon" },
        rank: 2,
        category: "implant",
        description: {
          en: "The missing tooth is replaced by an implant with a crown, without relying on the neighboring teeth.",
          nl: "De ontbrekende tand wordt vervangen door een implantaat met een kroon, zonder steun te nemen op de buurtanden.",
        },
        benefits: [
          { en: "Independent replacement of the missing tooth", nl: "Onafhankelijke vervanging van de ontbrekende tand" },
          { en: "No burden or adjustment of neighboring teeth", nl: "Geen belasting of aanpassing van buurtanden" },
          { en: "Durable long-term solution", nl: "Duurzame oplossing op lange termijn" },
          { en: "Natural function and aesthetics", nl: "Natuurlijke functie en esthetiek" },
        ],
        considerations: [
          { en: "Surgical procedure needed", nl: "Chirurgische ingreep nodig" },
          { en: "Longer timeline", nl: "Langere doorlooptijd" },
          { en: "Higher cost than a bridge", nl: "Hogere kost dan een brug" },
        ],
        ideal_for: {
          en: "You value independence per tooth and are willing to follow a slightly longer process.",
          nl: "Voor wie waarde hecht aan zelfstandigheid per tand en bereid is een iets langer traject te volgen.",
        },
        pricing: { min: 2200, max: 2500, currency: "EUR" },
        duration: { min_months: 3, max_months: 7 },
        recovery: { days: 5 },
      },
    ],
    pricing: { min: 2200, max: 6000, currency: "EUR" },
    version: "2.0.0",
  },
];
