/**
 * Fix Dutch Module Content
 * Replaces English content in nl/ folders with proper Dutch translations
 * Source: reference-docs/content/Moduleblokken.docx
 */

import { promises as fs } from "fs";
import path from "path";

// Dutch module content extracted from Moduleblokken.docx
const DUTCH_MODULE_CONTENT: Record<string, string> = {
  // TM_CTX_FIRST_TIME - Maps to first-timer context
  "TM_CTX_FIRST_TIME": `# Context bij eerste behandeling

Omdat dit uw eerste kennismaking is met dit type tandheelkundige behandeling, is het logisch dat u veel vragen heeft. Het tandheelkundige vakgebied biedt verschillende benaderingen, elk met eigen kenmerken.

Uw tandarts zal u stap voor stap door het proces leiden en uitleggen wat u bij elke fase kunt verwachten. Er is geen druk om direct beslissingen te nemen — neem de tijd die u nodig heeft om uw opties te begrijpen.`,

  // TM_CTX_PREVIOUS_TREATMENT - Maps to previous treatment context
  "TM_CTX_PREVIOUS_TREATMENT": `# Context bij eerdere behandeling

Uw behandelgeschiedenis geeft context aan nieuwe keuzes. Veel mensen dragen eerdere ervaringen mee in hun verwachtingen en vertrouwen. Dit beïnvloedt hoe haalbaarheid en planning worden bekeken.

Dit betekent niet dat eerdere resultaten bepalend zijn voor de toekomst, maar wel dat ze richting geven. Bespreek uw behandelverleden altijd openlijk met uw tandarts.`,

  // TM_RISK_SMOKING - Maps to Module 3
  "TM_RISK_SMOKING": `# Roken of vapen

Omdat u heeft aangegeven dat u rookt of vapet, kan dit invloed hebben op hoe tandheelkundige behandelingen en herstel worden ingeschat. Veel mensen onderschatten de rol die leefgewoonten spelen in genezing en comfort na een behandeling.

Dit beïnvloedt vaak hoe wordt nagedacht over nazorg, herstelperiode en realistische verwachtingen. Dit betekent niet dat behandelingen uitgesloten zijn, maar wel dat extra aandacht voor opvolging logisch is.

Bespreek dit altijd openlijk met uw tandarts, zodat behandelingen zorgvuldig kunnen worden afgestemd op uw situatie.`,

  // TM_ANXIETY_SEVERE - Maps to Module 9
  "TM_ANXIETY_SEVERE": `# Tandheelkundige angst

Omdat u heeft aangegeven angst of spanning te ervaren bij tandheelkundige behandelingen, is dit een belangrijk aandachtspunt. Veel mensen stellen behandelingen uit door spanning, zelfs wanneer ze weten dat ingrijpen zinvol is.

Dit beïnvloedt vaak tempo, uitleg en beleving van het traject. Dit betekent niet dat behandelingen zwaarder zijn, maar wel dat comfort en rust centraal mogen staan.

Bespreek uw angst altijd openlijk met uw tandarts, zodat de aanpak kan worden afgestemd op wat voor u haalbaar aanvoelt.`,

  // TM_BUDGET_LIMITED - Maps to Module 14
  "TM_BUDGET_LIMITED": `# Budgetoverwegingen: Kostenbewust

Omdat betaalbaarheid voor u een belangrijke rol speelt, is het logisch dat behandelingen ook kostenbewust worden bekeken. Veel mensen willen overzicht en controle over uitgaven.

Dit beïnvloedt hoe wordt nagedacht over fasering en prioriteiten. Dit betekent niet dat kwaliteit onbelangrijk is, maar wel dat keuzes zorgvuldig worden afgewogen.

Uw tandarts kan bespreken:
- Welke opties binnen uw budget passen
- Hoe behandelingen gefaseerd kunnen worden
- Waar prioriteiten kunnen liggen
- Welke compromissen aanvaardbaar zijn

Bespreek uw budgetverwachtingen altijd openlijk met uw tandarts.`,

  // TM_BUDGET_PREMIUM - Maps to Module 15
  "TM_BUDGET_PREMIUM": `# Budgetoverwegingen: Premium aanpak

Omdat u heeft aangegeven te kiezen voor een premium aanpak, ligt de nadruk op kwaliteit en duurzaamheid. Veel mensen geven in deze situatie de voorkeur aan lange-termijnresultaten boven minimale kost.

Dit beïnvloedt materiaalniveau, voorbereiding en afwerking. Dit betekent niet dat alles maximaal moet zijn, maar wel doordacht.

Uw tandarts kan bespreken:
- De hoogste kwaliteit materialen en technieken
- Hoe premium opties verbeterde duurzaamheid en esthetiek kunnen bieden
- Geavanceerde behandeltechnologieën die resultaten optimaliseren
- De lange-termijnwaarde van investeren in kwaliteitstandheelkunde

Bespreek uw prioriteiten duidelijk met uw tandarts.`,

  // TM_BUDGET_FLEXIBLE - Budget flexible
  "TM_BUDGET_FLEXIBLE": `# Budgetoverwegingen: Flexibel

U heeft aangegeven dat budget een factor is, maar niet de enige bepalende factor bij uw beslissing. Dit geeft ruimte om verschillende opties te overwegen op basis van hun waarde en passendheid voor uw situatie.

Uw tandarts kan u helpen:
- De verhouding tussen kosten en voordelen van verschillende opties te begrijpen
- Prioriteiten te stellen op basis van wat het belangrijkst voor u is
- Een behandelplan te vinden dat kwaliteit en waarde in balans brengt`
};

// Dutch B-block content
const DUTCH_BBLOCK_CONTENT: Record<string, string> = {
  // B_INTERP_STANDARD - Standard interpretation
  "B_INTERP_STANDARD": `# Sectie 4: Interpretatie

Op basis van uw antwoorden lijkt uw tandsituatie binnen gevestigde behandelkaders te vallen. Klinische bevindingen zullen helpen om specifieke aanbevelingen te bepalen.

Uw prioriteiten — of ze nu gericht zijn op esthetiek, functie, comfort of balans — zijn waardevolle input. Deze voorkeuren helpen bij het identificeren van opties die aansluiten bij wat voor u belangrijk is.

Een consultatie met uw tandarts zou hen in staat stellen uw doelen te combineren met klinische bevindingen. Van daaruit kunt u opties verkennen en beslissen welke richting het beste bij uw situatie past.`,

  // B_COMPARE_IMPLANT_VS_BRIDGE - Comparison
  "B_COMPARE_IMPLANT_VS_BRIDGE": `# Sectie 6: Vergelijking

## Implantaat vs. Brug

Hier ziet u hoe deze opties zich verhouden op belangrijke factoren:

| Factor | Tandimplantaat | Tandheelkundige brug |
|--------|----------------|----------------------|
| **Naburige tanden** | Niet betrokken | Vereisen preparatie |
| **Botgezondheid** | Helpt behouden | Voorkomt verlies niet |
| **Procedure** | Chirurgisch | Niet-chirurgisch |
| **Behandeltijd** | 3-6 maanden | 2-4 weken |
| **Initiële kosten** | Hoger | Lager |
| **Typische levensduur** | 15-25+ jaar | 10-15 jaar |
| **Dagelijkse verzorging** | Standaard hygiëne | Speciale technieken |

**Een implantaat past mogelijk bij u als:**
- Uw naburige tanden gezond zijn
- U voldoende bot heeft
- Duurzaamheid op lange termijn een prioriteit is

**Een brug past mogelijk bij u als:**
- Naburige tanden al behandeling nodig hebben
- U chirurgie wilt vermijden
- Snellere afronding belangrijk is

Uw tandarts kan bespreken hoe deze factoren van toepassing zijn op uw situatie. De keuze is uiteindelijk aan u, gebaseerd op wat voor u het belangrijkst is.`
};

async function updateModuleContent(moduleId: string, dutchContent: string): Promise<void> {
  const nlDir = `content/modules/${moduleId}/nl`;

  try {
    await fs.access(nlDir);
  } catch {
    console.log(`  Skipping ${moduleId} - nl directory doesn't exist`);
    return;
  }

  // Get all tone files in the nl directory
  const files = await fs.readdir(nlDir);
  const mdFiles = files.filter(f => f.endsWith(".md"));

  for (const file of mdFiles) {
    const filePath = path.join(nlDir, file);
    await fs.writeFile(filePath, dutchContent, "utf-8");
  }

  console.log(`  Updated ${moduleId}/nl (${mdFiles.length} files)`);
}

async function updateBBlockContent(blockId: string, dutchContent: string): Promise<void> {
  const nlDir = `content/b_blocks/${blockId}/nl`;

  try {
    await fs.access(nlDir);
  } catch {
    console.log(`  Skipping ${blockId} - nl directory doesn't exist`);
    return;
  }

  // Get all tone files in the nl directory
  const files = await fs.readdir(nlDir);
  const mdFiles = files.filter(f => f.endsWith(".md"));

  for (const file of mdFiles) {
    const filePath = path.join(nlDir, file);
    await fs.writeFile(filePath, dutchContent, "utf-8");
  }

  console.log(`  Updated ${blockId}/nl (${mdFiles.length} files)`);
}

async function main() {
  console.log("Fixing Dutch module content...\n");

  console.log("Updating modules:");
  for (const [moduleId, content] of Object.entries(DUTCH_MODULE_CONTENT)) {
    await updateModuleContent(moduleId, content);
  }

  console.log("\nUpdating B-blocks:");
  for (const [blockId, content] of Object.entries(DUTCH_BBLOCK_CONTENT)) {
    await updateBBlockContent(blockId, content);
  }

  console.log("\nDone!");
}

main().catch(console.error);
