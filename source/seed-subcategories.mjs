/**
 * Seed script: create sub-categories and assign them to equipment items
 * Run: node seed-subcategories.mjs
 * Uses actual category slugs from the database.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection(process.env.DATABASE_URL);

// ─── 1. Get existing main categories ────────────────────────────────────────
const [cats] = await db.query("SELECT id, name, slug FROM equipment_categories ORDER BY id");
const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]));
console.log("Main categories:", cats.map(c => `${c.slug}(${c.id})`).join(", "));

// ─── 2. Define sub-categories using actual DB slugs ──────────────────────────
const subCatDefs = [
  // Power Tools (id:1)
  { catSlug: "power-tools", name: "Drills & Hammer Drills",  slug: "drills-hammer-drills",  icon: "drill",   sort: 1 },
  { catSlug: "power-tools", name: "Grinders & Sanders",      slug: "grinders-sanders",       icon: "disc",    sort: 2 },
  { catSlug: "power-tools", name: "Saws & Cutting Tools",    slug: "saws-cutting-tools",     icon: "scissors",sort: 3 },
  { catSlug: "power-tools", name: "Impact & Fastening",      slug: "impact-fastening",       icon: "zap",     sort: 4 },

  // Scaffolding & Access (id:2)
  { catSlug: "scaffolding-access", name: "Scaffolding Systems",  slug: "scaffolding-systems",  icon: "grid",      sort: 1 },
  { catSlug: "scaffolding-access", name: "Mobile Towers",        slug: "mobile-towers",        icon: "layers",    sort: 2 },
  { catSlug: "scaffolding-access", name: "Ladders & Steps",      slug: "ladders-steps",        icon: "align-justify", sort: 3 },
  { catSlug: "scaffolding-access", name: "Aerial Platforms",     slug: "aerial-platforms",     icon: "arrow-up",  sort: 4 },

  // Safety Equipment (id:3)
  { catSlug: "safety-equipment", name: "Fall Protection",    slug: "fall-protection",    icon: "shield",         sort: 1 },
  { catSlug: "safety-equipment", name: "PPE & Clothing",     slug: "ppe-clothing",       icon: "user",           sort: 2 },
  { catSlug: "safety-equipment", name: "Barriers & Signage", slug: "barriers-signage",   icon: "alert-triangle", sort: 3 },
  { catSlug: "safety-equipment", name: "Gas Detection",      slug: "gas-detection",      icon: "activity",       sort: 4 },

  // Measuring & Leveling (id:4)
  { catSlug: "measuring-leveling", name: "Laser Levels",     slug: "laser-levels",       icon: "crosshair", sort: 1 },
  { catSlug: "measuring-leveling", name: "Spirit & Optical Levels", slug: "spirit-optical-levels", icon: "minus", sort: 2 },
  { catSlug: "measuring-leveling", name: "Distance & Layout",slug: "distance-layout",    icon: "ruler",     sort: 3 },
  { catSlug: "measuring-leveling", name: "Thermal & Detection", slug: "thermal-detection", icon: "eye",     sort: 4 },

  // Welding & Cutting (id:5)
  { catSlug: "welding-cutting", name: "MIG & TIG Welders",   slug: "mig-tig-welders",    icon: "zap",      sort: 1 },
  { catSlug: "welding-cutting", name: "Plasma Cutters",       slug: "plasma-cutters",     icon: "scissors", sort: 2 },
  { catSlug: "welding-cutting", name: "Oxy-Acetylene Sets",   slug: "oxy-acetylene-sets", icon: "flame",    sort: 3 },
  { catSlug: "welding-cutting", name: "Welding Accessories",  slug: "welding-accessories",icon: "tool",     sort: 4 },

  // Pneumatic Tools (id:6)
  { catSlug: "pneumatic-tools", name: "Air Drills & Grinders", slug: "air-drills-grinders", icon: "wind",  sort: 1 },
  { catSlug: "pneumatic-tools", name: "Impact Wrenches",       slug: "impact-wrenches",     icon: "zap",   sort: 2 },
  { catSlug: "pneumatic-tools", name: "Nail & Staple Guns",    slug: "nail-staple-guns",    icon: "target",sort: 3 },
  { catSlug: "pneumatic-tools", name: "Hoses & Fittings",      slug: "air-hoses-fittings",  icon: "git-branch", sort: 4 },

  // Hydraulic Equipment (id:7)
  { catSlug: "hydraulic-equipment", name: "Hydraulic Jacks",   slug: "hydraulic-jacks",    icon: "chevrons-up", sort: 1 },
  { catSlug: "hydraulic-equipment", name: "Hydraulic Breakers",slug: "hydraulic-breakers",  icon: "tool",       sort: 2 },
  { catSlug: "hydraulic-equipment", name: "Hydraulic Presses", slug: "hydraulic-presses",   icon: "layers",     sort: 3 },
  { catSlug: "hydraulic-equipment", name: "Hydraulic Hoses",   slug: "hydraulic-hoses",     icon: "git-branch", sort: 4 },

  // Pumps & Fluid Handling (id:8)
  { catSlug: "pumps-fluid-handling", name: "Water Pumps",      slug: "water-pumps",         icon: "droplets",  sort: 1 },
  { catSlug: "pumps-fluid-handling", name: "Submersible Pumps",slug: "submersible-pumps",   icon: "arrow-down",sort: 2 },
  { catSlug: "pumps-fluid-handling", name: "Chemical Pumps",   slug: "chemical-pumps",      icon: "flask",     sort: 3 },
  { catSlug: "pumps-fluid-handling", name: "Hoses & Couplings",slug: "pump-hoses-couplings",icon: "link",      sort: 4 },

  // Chainsaws & Outdoor (id:9)
  { catSlug: "chainsaws-outdoor", name: "Chainsaws",           slug: "chainsaws",            icon: "tree",      sort: 1 },
  { catSlug: "chainsaws-outdoor", name: "Hedge Trimmers",      slug: "hedge-trimmers",       icon: "scissors",  sort: 2 },
  { catSlug: "chainsaws-outdoor", name: "Leaf Blowers",        slug: "leaf-blowers",         icon: "wind",      sort: 3 },
  { catSlug: "chainsaws-outdoor", name: "Outdoor Power",       slug: "outdoor-power",        icon: "sun",       sort: 4 },

  // Batteries & Power (id:10)
  { catSlug: "batteries-power", name: "Battery Packs",         slug: "battery-packs",        icon: "battery",   sort: 1 },
  { catSlug: "batteries-power", name: "Chargers",              slug: "battery-chargers",     icon: "zap",       sort: 2 },
  { catSlug: "batteries-power", name: "Generators",            slug: "portable-generators",  icon: "cpu",       sort: 3 },
  { catSlug: "batteries-power", name: "Power Stations",        slug: "power-stations",       icon: "plug",      sort: 4 },

  // Hand Tools & Accessories (id:11)
  { catSlug: "hand-tools-accessories", name: "Striking Tools", slug: "striking-tools",       icon: "tool",      sort: 1 },
  { catSlug: "hand-tools-accessories", name: "Cutting & Shaping", slug: "cutting-shaping",  icon: "scissors",  sort: 2 },
  { catSlug: "hand-tools-accessories", name: "Clamping & Holding", slug: "clamping-holding", icon: "lock",     sort: 3 },
  { catSlug: "hand-tools-accessories", name: "Blades & Bits",  slug: "blades-bits",          icon: "disc",      sort: 4 },

  // Compressors & Air (id:12)
  { catSlug: "compressors-air", name: "Portable Compressors",  slug: "portable-compressors", icon: "wind",      sort: 1 },
  { catSlug: "compressors-air", name: "Industrial Compressors",slug: "industrial-compressors",icon: "cpu",      sort: 2 },
  { catSlug: "compressors-air", name: "Oil-Free Compressors",  slug: "oil-free-compressors", icon: "droplets",  sort: 3 },
  { catSlug: "compressors-air", name: "Air Accessories",       slug: "air-accessories",      icon: "git-branch",sort: 4 },

  // Specialized Equipment (id:13)
  { catSlug: "specialized-equipment", name: "Concrete & Masonry", slug: "concrete-masonry-tools", icon: "layers", sort: 1 },
  { catSlug: "specialized-equipment", name: "Lifting & Rigging",  slug: "lifting-rigging-tools",  icon: "anchor", sort: 2 },
  { catSlug: "specialized-equipment", name: "Marine & Diving",    slug: "marine-diving-tools",    icon: "anchor", sort: 3 },
  { catSlug: "specialized-equipment", name: "Survey & Detection", slug: "survey-detection-tools", icon: "crosshair", sort: 4 },
];

// ─── 3. Insert sub-categories ────────────────────────────────────────────────
console.log(`\nInserting ${subCatDefs.length} sub-categories...`);
const subCatIdMap = {}; // slug -> id

for (const sc of subCatDefs) {
  const catId = catMap[sc.catSlug];
  if (!catId) {
    console.warn(`  ⚠ Category not found: ${sc.catSlug}, skipping ${sc.name}`);
    continue;
  }
  try {
    await db.query(
      `INSERT INTO equipment_sub_categories (categoryId, name, slug, icon, sortOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
       ON DUPLICATE KEY UPDATE name=VALUES(name), icon=VALUES(icon), sortOrder=VALUES(sortOrder), categoryId=VALUES(categoryId)`,
      [catId, sc.name, sc.slug, sc.icon, sc.sort]
    );
    const [rows] = await db.query("SELECT id FROM equipment_sub_categories WHERE slug = ?", [sc.slug]);
    subCatIdMap[sc.slug] = rows[0].id;
    console.log(`  ✓ [${sc.catSlug}] ${sc.name} (id: ${rows[0].id})`);
  } catch (err) {
    console.error(`  ✗ Failed to insert ${sc.name}:`, err.message);
  }
}

// ─── 4. Assign sub-categories to items by keyword matching ──────────────────
console.log("\nAssigning sub-categories to equipment items...");

const keywordMap = [
  // Power Tools
  { keywords: ["drill", "hammer drill", "rotary hammer", "impact driver", "sds", "core drill"], subSlug: "drills-hammer-drills" },
  { keywords: ["grinder", "sander", "polisher", "angle grinder", "belt sander", "orbital"], subSlug: "grinders-sanders" },
  { keywords: ["saw", "circular saw", "jigsaw", "reciprocating", "mitre", "table saw", "chainsaw", "cut-off"], subSlug: "saws-cutting-tools" },
  { keywords: ["nail gun", "nailer", "stapler", "fastener", "screw gun", "impact wrench"], subSlug: "impact-fastening" },

  // Scaffolding
  { keywords: ["scaffold", "scaffolding", "tube and fitting", "system scaffold"], subSlug: "scaffolding-systems" },
  { keywords: ["mobile tower", "tower scaffold", "aluminium tower", "podium"], subSlug: "mobile-towers" },
  { keywords: ["ladder", "step ladder", "extension ladder", "step stool"], subSlug: "ladders-steps" },
  { keywords: ["cherry picker", "boom lift", "scissor lift", "aerial", "mewp", "ewp", "elevating"], subSlug: "aerial-platforms" },

  // Safety
  { keywords: ["harness", "fall arrest", "lanyard", "safety line", "anchor", "fall protection"], subSlug: "fall-protection" },
  { keywords: ["helmet", "hard hat", "gloves", "boots", "ppe", "hi-vis", "safety vest", "ear protection", "eye protection"], subSlug: "ppe-clothing" },
  { keywords: ["barrier", "fence", "cone", "sign", "signage", "traffic cone", "delineator"], subSlug: "barriers-signage" },
  { keywords: ["gas detector", "gas monitor", "multi-gas", "co detector", "gas detection"], subSlug: "gas-detection" },

  // Measuring
  { keywords: ["laser level", "line laser", "rotary laser", "cross line"], subSlug: "laser-levels" },
  { keywords: ["spirit level", "optical level", "dumpy level", "theodolite"], subSlug: "spirit-optical-levels" },
  { keywords: ["tape measure", "measuring wheel", "distance meter", "rangefinder", "layout"], subSlug: "distance-layout" },
  { keywords: ["thermal", "thermal camera", "moisture meter", "stud finder", "cable detector"], subSlug: "thermal-detection" },

  // Welding
  { keywords: ["mig welder", "tig welder", "welder", "welding machine", "arc welder", "stick welder"], subSlug: "mig-tig-welders" },
  { keywords: ["plasma cutter", "plasma cutting"], subSlug: "plasma-cutters" },
  { keywords: ["oxy", "acetylene", "gas cutting", "cutting torch", "oxy-fuel"], subSlug: "oxy-acetylene-sets" },
  { keywords: ["welding helmet", "welding glove", "welding accessory", "wire feed", "electrode"], subSlug: "welding-accessories" },

  // Pneumatic
  { keywords: ["air drill", "air grinder", "pneumatic grinder", "die grinder"], subSlug: "air-drills-grinders" },
  { keywords: ["air impact", "pneumatic impact", "impact wrench", "air ratchet"], subSlug: "impact-wrenches" },
  { keywords: ["nail gun", "air nailer", "framing nailer", "brad nailer", "staple gun"], subSlug: "nail-staple-guns" },
  { keywords: ["air hose", "pneumatic hose", "quick coupler", "air fitting"], subSlug: "air-hoses-fittings" },

  // Hydraulic
  { keywords: ["hydraulic jack", "bottle jack", "floor jack", "toe jack"], subSlug: "hydraulic-jacks" },
  { keywords: ["hydraulic breaker", "hydraulic hammer", "hydraulic chisel"], subSlug: "hydraulic-breakers" },
  { keywords: ["hydraulic press", "press frame", "shop press"], subSlug: "hydraulic-presses" },
  { keywords: ["hydraulic hose", "hydraulic fitting", "hydraulic coupling"], subSlug: "hydraulic-hoses" },

  // Pumps
  { keywords: ["water pump", "centrifugal pump", "trash pump", "dewatering pump"], subSlug: "water-pumps" },
  { keywords: ["submersible pump", "sump pump", "submersible"], subSlug: "submersible-pumps" },
  { keywords: ["chemical pump", "diaphragm pump", "acid pump"], subSlug: "chemical-pumps" },
  { keywords: ["pump hose", "suction hose", "discharge hose", "camlock"], subSlug: "pump-hoses-couplings" },

  // Chainsaws & Outdoor
  { keywords: ["chainsaw", "chain saw"], subSlug: "chainsaws" },
  { keywords: ["hedge trimmer", "hedge cutter", "bush cutter"], subSlug: "hedge-trimmers" },
  { keywords: ["leaf blower", "blower vac", "garden blower"], subSlug: "leaf-blowers" },
  { keywords: ["brushcutter", "strimmer", "lawn mower", "turf cutter", "scarifier"], subSlug: "outdoor-power" },

  // Batteries & Power
  { keywords: ["battery pack", "18v battery", "20v battery", "lithium battery"], subSlug: "battery-packs" },
  { keywords: ["battery charger", "rapid charger", "multi charger"], subSlug: "battery-chargers" },
  { keywords: ["generator", "petrol generator", "diesel generator", "inverter generator"], subSlug: "portable-generators" },
  { keywords: ["power station", "portable power", "solar generator"], subSlug: "power-stations" },

  // Hand Tools
  { keywords: ["hammer", "mallet", "sledgehammer", "club hammer", "chisel", "cold chisel"], subSlug: "striking-tools" },
  { keywords: ["hand saw", "hacksaw", "file", "rasp", "plane", "chisel"], subSlug: "cutting-shaping" },
  { keywords: ["clamp", "vice", "g-clamp", "f-clamp", "bar clamp", "pipe clamp"], subSlug: "clamping-holding" },
  { keywords: ["blade", "drill bit", "saw blade", "cutting disc", "grinding disc", "bit set"], subSlug: "blades-bits" },

  // Compressors
  { keywords: ["portable compressor", "pancake compressor", "mini compressor"], subSlug: "portable-compressors" },
  { keywords: ["industrial compressor", "screw compressor", "rotary compressor", "piston compressor"], subSlug: "industrial-compressors" },
  { keywords: ["oil-free compressor", "oil free", "silent compressor"], subSlug: "oil-free-compressors" },
  { keywords: ["air tank", "receiver tank", "air dryer", "air filter"], subSlug: "air-accessories" },

  // Specialized
  { keywords: ["concrete mixer", "cement mixer", "mixer", "screed", "float", "power float", "core drill", "breaker", "jackhammer"], subSlug: "concrete-masonry-tools" },
  { keywords: ["chain block", "chain hoist", "lever hoist", "gantry", "sling", "shackle", "rigging", "lifting"], subSlug: "lifting-rigging-tools" },
  { keywords: ["dive", "diving", "scuba", "marine", "underwater", "boat"], subSlug: "marine-diving-tools" },
  { keywords: ["survey", "total station", "gps", "gnss", "rtk", "detection", "pipe locator"], subSlug: "survey-detection-tools" },
];

const [items] = await db.query("SELECT id, name FROM equipment_items");
console.log(`  Processing ${items.length} items...`);

let assigned = 0;
let unassigned = 0;
const unassignedNames = [];

for (const item of items) {
  const nameLower = item.name.toLowerCase();
  let matchedSubSlug = null;

  for (const { keywords, subSlug } of keywordMap) {
    if (keywords.some(kw => nameLower.includes(kw.toLowerCase()))) {
      matchedSubSlug = subSlug;
      break;
    }
  }

  if (matchedSubSlug && subCatIdMap[matchedSubSlug]) {
    await db.query("UPDATE equipment_items SET subCategoryId = ? WHERE id = ?", [subCatIdMap[matchedSubSlug], item.id]);
    assigned++;
  } else {
    unassigned++;
    unassignedNames.push(item.name);
  }
}

console.log(`  ✓ Assigned: ${assigned} items`);
console.log(`  ⚠ Unassigned: ${unassigned} items`);
if (unassignedNames.length > 0) {
  console.log("  Unassigned items:", unassignedNames.slice(0, 20).join(", "));
}

await db.end();
console.log("\n✅ Sub-category seeding complete!");
