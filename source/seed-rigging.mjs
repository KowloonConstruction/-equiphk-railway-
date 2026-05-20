/**
 * Seed script: Add Rigging category, sub-categories, and equipment items
 * Run: node seed-rigging.mjs
 */
import mysql2 from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL);

// ── 1. Check existing categories ──────────────────────────────────────────────
const [cats] = await conn.query(
  "SELECT id, name, slug, sortOrder FROM equipment_categories ORDER BY sortOrder"
);
console.log("Existing categories:", cats.map(c => `${c.id}: ${c.name}`).join(", "));

// Check if Rigging already exists
const existing = cats.find(c => c.slug === "rigging");
let categoryId;

if (existing) {
  console.log(`Rigging category already exists (id: ${existing.id})`);
  categoryId = existing.id;
} else {
  const maxOrder = cats.reduce((m, c) => Math.max(m, c.sortOrder || 0), 0);
  const [result] = await conn.query(
    `INSERT INTO equipment_categories (name, slug, description, icon, segment, sortOrder, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      "Rigging",
      "rigging",
      "Professional rigging equipment for lifting, hoisting, and load securing operations.",
      "🪝",
      "both",
      maxOrder + 10,
      1,
    ]
  );
  categoryId = result.insertId;
  console.log(`Created Rigging category with id: ${categoryId}`);
}

// ── 2. Sub-categories ─────────────────────────────────────────────────────────
const subCats = [
  { name: "Chain Blocks & Hoists", slug: "chain-blocks-hoists", sortOrder: 1 },
  { name: "Shackles & Hardware",   slug: "shackles-hardware",   sortOrder: 2 },
  { name: "Slings & Straps",       slug: "slings-straps",       sortOrder: 3 },
  { name: "Spreader Bars & Lifting Beams", slug: "spreader-bars", sortOrder: 4 },
  { name: "Rigging Accessories",   slug: "rigging-accessories", sortOrder: 5 },
];

const subCatIds = {};
for (const sc of subCats) {
  const [existing] = await conn.query(
    "SELECT id FROM equipment_sub_categories WHERE categoryId = ? AND slug = ?",
    [categoryId, sc.slug]
  );
  if (existing.length > 0) {
    subCatIds[sc.slug] = existing[0].id;
    console.log(`Sub-category already exists: ${sc.name} (id: ${existing[0].id})`);
  } else {
    const [res] = await conn.query(
      `INSERT INTO equipment_sub_categories (categoryId, name, slug, description, sortOrder, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [categoryId, sc.name, sc.slug, null, sc.sortOrder, 1]
    );
    subCatIds[sc.slug] = res.insertId;
    console.log(`Created sub-category: ${sc.name} (id: ${res.insertId})`);
  }
}

// ── 3. Equipment items ────────────────────────────────────────────────────────
const items = [
  // Chain Blocks & Hoists
  {
    subSlug: "chain-blocks-hoists",
    name: "Chain Block 1 Tonne",
    brand: "Kito",
    model: "CB010",
    description: "Manual chain hoist rated to 1 tonne. Compact and lightweight with a hardened load sheave and precision-cut gears. Ideal for workshop lifts, maintenance tasks, and confined-space rigging where powered hoists are impractical.",
    specs: "SWL: 1T | Lift: 3m standard | Chain grade: G80 | Weight: 8.5kg",
    dailyRate: "180",
    weeklyRate: "750",
    monthlyRate: "2200",
    condition: "good",
  },
  {
    subSlug: "chain-blocks-hoists",
    name: "Chain Block 2 Tonne",
    brand: "Kito",
    model: "CB020",
    description: "Heavy-duty 2-tonne manual chain hoist with a drop-forged alloy steel hook and safety latch. The compact housing allows use in tight overhead spaces. Commonly used in marine, construction, and industrial maintenance.",
    specs: "SWL: 2T | Lift: 3m standard | Chain grade: G80 | Weight: 14kg",
    dailyRate: "250",
    weeklyRate: "1000",
    monthlyRate: "3000",
    condition: "good",
  },
  {
    subSlug: "chain-blocks-hoists",
    name: "Chain Block 5 Tonne",
    brand: "Yale",
    model: "YaleHoist-5T",
    description: "Industrial-grade 5-tonne chain block with a robust cast-iron housing and dual-pawl load brake for safe, controlled lowering. Suited to heavy plant maintenance, structural steel erection, and marine lifting operations.",
    specs: "SWL: 5T | Lift: 3m standard | Chain grade: G80 | Weight: 38kg",
    dailyRate: "450",
    weeklyRate: "1800",
    monthlyRate: "5500",
    condition: "good",
  },
  {
    subSlug: "chain-blocks-hoists",
    name: "Electric Chain Hoist 1 Tonne",
    brand: "Demag",
    model: "DC-Pro 1",
    description: "Compact electric chain hoist with variable-speed control, integrated overload protection, and a low-headroom design. Suitable for production lines, workshops, and temporary overhead lifting rigs where speed and precision matter.",
    specs: "SWL: 1T | Lift: 6m | Voltage: 220V single-phase | Speed: 8m/min | Weight: 22kg",
    dailyRate: "550",
    weeklyRate: "2200",
    monthlyRate: "6500",
    condition: "excellent",
  },
  {
    subSlug: "chain-blocks-hoists",
    name: "Lever Hoist (Tirfor) 1.5 Tonne",
    brand: "Tractel",
    model: "Tralift TS",
    description: "Ratchet lever hoist providing precise load positioning in any orientation — horizontal, vertical, or angled. The all-steel body and sealed mechanism make it reliable in wet or dusty site conditions.",
    specs: "SWL: 1.5T | Lift: 1.5m per pull | Weight: 5.8kg | Finish: Zinc-plated",
    dailyRate: "200",
    weeklyRate: "800",
    monthlyRate: "2400",
    condition: "good",
  },

  // Shackles & Hardware
  {
    subSlug: "shackles-hardware",
    name: "Bow Shackle 4.75T (25mm)",
    brand: "Crosby",
    model: "G-2130",
    description: "Forged carbon-steel bow shackle with a screw-pin closure. The wide bow allows multi-leg sling connections and is the standard choice for general rigging, crane work, and marine lifting in Hong Kong.",
    specs: "SWL: 4.75T | Pin dia: 25mm | Material: Carbon steel | Finish: Hot-dip galvanised",
    dailyRate: "30",
    weeklyRate: "120",
    monthlyRate: "350",
    condition: "good",
  },
  {
    subSlug: "shackles-hardware",
    name: "Dee Shackle 3.25T (22mm)",
    brand: "Crosby",
    model: "G-210",
    description: "Forged dee shackle with screw-pin for in-line load applications. The narrow dee profile reduces snagging risk and is preferred for connecting wire rope slings to lifting points on structural steel.",
    specs: "SWL: 3.25T | Pin dia: 22mm | Material: Carbon steel | Finish: Self-coloured",
    dailyRate: "25",
    weeklyRate: "100",
    monthlyRate: "300",
    condition: "good",
  },
  {
    subSlug: "shackles-hardware",
    name: "Swivel Hook with Safety Latch 5T",
    brand: "Pewag",
    model: "SWH-5",
    description: "360° swivel hook with a spring-loaded safety latch prevents accidental disengagement under load. Eliminates chain twist during multi-leg lifts and is compatible with G80 chain assemblies.",
    specs: "SWL: 5T | Swivel: 360° | Latch: Spring-loaded | Material: Alloy steel",
    dailyRate: "80",
    weeklyRate: "320",
    monthlyRate: "950",
    condition: "good",
  },
  {
    subSlug: "shackles-hardware",
    name: "Wire Rope Clip Set (8mm) — Pack of 10",
    brand: "Crosby",
    model: "G-450",
    description: "Drop-forged U-bolt wire rope clips for forming eyes and terminations on 8mm wire rope. Supplied in a pack of 10 with nuts and saddles. Correct installation torque and clip spacing are critical — installation guide included.",
    specs: "Rope dia: 8mm | Material: Forged steel | Finish: Zinc-plated | Pack: 10 clips",
    dailyRate: "40",
    weeklyRate: "160",
    monthlyRate: "480",
    condition: "good",
  },

  // Slings & Straps
  {
    subSlug: "slings-straps",
    name: "Round Sling 2T (1m–4m)",
    brand: "Spanset",
    model: "Endless Round Sling",
    description: "Synthetic endless round sling with a polyester core and protective sleeve. Colour-coded to WLL (red = 2T). Flexible and gentle on delicate or polished surfaces. Available in 1m, 2m, and 4m lengths.",
    specs: "WLL: 2T vertical | Material: Polyester | Colour: Red | Lengths: 1m / 2m / 4m",
    dailyRate: "60",
    weeklyRate: "240",
    monthlyRate: "700",
    condition: "good",
  },
  {
    subSlug: "slings-straps",
    name: "Round Sling 4T (2m–6m)",
    brand: "Spanset",
    model: "Endless Round Sling 4T",
    description: "Heavy-duty 4-tonne round sling for crane and hoist work. The polyester core resists stretch and UV degradation. Ideal for lifting structural steel, precast concrete panels, and mechanical plant.",
    specs: "WLL: 4T vertical | Material: Polyester | Colour: Purple | Lengths: 2m / 4m / 6m",
    dailyRate: "90",
    weeklyRate: "360",
    monthlyRate: "1050",
    condition: "good",
  },
  {
    subSlug: "slings-straps",
    name: "Flat Webbing Sling 3T (3m)",
    brand: "Spanset",
    model: "Flat Webbing Sling",
    description: "Woven polyester flat webbing sling with reinforced eyes. The wide bearing surface distributes load and reduces pressure on finished surfaces. Colour-coded green for 3T WLL. Supplied with inspection tag.",
    specs: "WLL: 3T vertical | Width: 100mm | Length: 3m | Material: Polyester | Colour: Green",
    dailyRate: "55",
    weeklyRate: "220",
    monthlyRate: "650",
    condition: "good",
  },
  {
    subSlug: "slings-straps",
    name: "Wire Rope Sling 5T (3m, 16mm)",
    brand: "Bridon",
    model: "6x36 IWRC",
    description: "Flemish-eye wire rope sling with thimble-protected eyes and swaged ferrule terminations. The independent wire rope core (IWRC) provides superior crush resistance and maintains flexibility under cyclic loading.",
    specs: "WLL: 5T vertical | Rope dia: 16mm | Length: 3m | Construction: 6×36 IWRC | Finish: Galvanised",
    dailyRate: "120",
    weeklyRate: "480",
    monthlyRate: "1400",
    condition: "good",
  },
  {
    subSlug: "slings-straps",
    name: "Chain Sling 4-Leg 5T",
    brand: "Pewag",
    model: "G8 4-Leg Sling",
    description: "Four-leg G80 alloy chain sling with master link, shortening clutches, and hook sets. Adjustable leg lengths allow levelling of asymmetric loads. Certified and tagged to EN 818-4 with individual leg SWL markings.",
    specs: "SWL: 5T (4-leg, 45°) | Chain grade: G80 | Leg length: 1.5m | Finish: Self-coloured",
    dailyRate: "350",
    weeklyRate: "1400",
    monthlyRate: "4200",
    condition: "good",
  },

  // Spreader Bars & Lifting Beams
  {
    subSlug: "spreader-bars",
    name: "Adjustable Spreader Bar 2T (1m–3m)",
    brand: "Modulift",
    model: "MOD 12+",
    description: "Telescopic aluminium spreader bar that adjusts from 1m to 3m without tools. Reduces inward sling forces on delicate loads and allows balanced lifts of long items such as pipes, beams, and HVAC units.",
    specs: "SWL: 2T | Range: 1m–3m | Material: Aluminium | Weight: 12kg | Rigging: Shackle ends",
    dailyRate: "480",
    weeklyRate: "1900",
    monthlyRate: "5600",
    condition: "excellent",
  },
  {
    subSlug: "spreader-bars",
    name: "Fixed Lifting Beam 5T (2m)",
    brand: "Modulift",
    model: "MOD 30",
    description: "Rigid steel lifting beam with a central top lug and two adjustable lower pick points. Maintains a fixed distance between lift points for precise load control. Certified to EN 13155 with test certificate supplied.",
    specs: "SWL: 5T | Span: 2m | Material: Structural steel | Weight: 45kg | Cert: EN 13155",
    dailyRate: "650",
    weeklyRate: "2600",
    monthlyRate: "7800",
    condition: "good",
  },

  // Rigging Accessories
  {
    subSlug: "rigging-accessories",
    name: "Load Cell (Digital) 5T",
    brand: "Straightpoint",
    model: "Radiolink Plus",
    description: "Wireless digital load cell with a real-time display and data-logging capability. Connects to a handheld receiver up to 100m away. Essential for verifying rigging loads, proof testing, and crane load monitoring.",
    specs: "Capacity: 5T | Accuracy: ±0.1% | Range: 100m wireless | Battery: 200hr | Display: LCD",
    dailyRate: "850",
    weeklyRate: "3400",
    monthlyRate: "10000",
    condition: "excellent",
  },
  {
    subSlug: "rigging-accessories",
    name: "Rigging Knife & Marlinspike Set",
    brand: "Wichard",
    model: "Deck Knife Set",
    description: "Stainless steel rigging knife with a serrated blade and a stainless marlinspike for splicing and shackle pin removal. The folding design with a locking mechanism makes it safe to carry on harness. Supplied in a belt pouch.",
    specs: "Blade: 316 stainless | Marlinspike: 316 stainless | Lock: Liner lock | Pouch: Included",
    dailyRate: "50",
    weeklyRate: "200",
    monthlyRate: "600",
    condition: "good",
  },
  {
    subSlug: "rigging-accessories",
    name: "Sling Protector Sleeves (Set of 4)",
    brand: "Spanset",
    model: "Corner Protector Set",
    description: "Heavy-duty polyurethane corner protectors prevent sling damage at sharp edges and corners. The set of four covers the most common sling widths and can be repositioned without removing the sling from the load.",
    specs: "Material: Polyurethane | Fits sling widths: 25–100mm | Set: 4 pieces | Temp range: -20°C to +80°C",
    dailyRate: "40",
    weeklyRate: "160",
    monthlyRate: "480",
    condition: "good",
  },
  {
    subSlug: "rigging-accessories",
    name: "Tirfor Hand Winch 1.6T (20m cable)",
    brand: "Tractel",
    model: "T-516",
    description: "Portable cable pulling machine (Tirfor) with 20m of 8mm wire rope. Operates in pull or push mode and can be used at any angle. Widely used for equipment positioning, vehicle recovery, and tensioning guy wires.",
    specs: "Pull capacity: 1.6T | Cable: 8mm × 20m | Weight: 9.5kg | Gear ratio: 32:1",
    dailyRate: "280",
    weeklyRate: "1100",
    monthlyRate: "3300",
    condition: "good",
  },
  {
    subSlug: "rigging-accessories",
    name: "Beam Clamp 3T",
    brand: "Crosby",
    model: "IP-625",
    description: "Screw-type beam clamp attaches to I-beams and H-beams without drilling or welding. The hardened jaw grips the flange and the central lifting eye accepts shackles up to 25mm. Suitable for temporary overhead rigging points.",
    specs: "SWL: 3T | Flange width: 50–300mm | Flange thickness: up to 30mm | Material: Alloy steel",
    dailyRate: "120",
    weeklyRate: "480",
    monthlyRate: "1400",
    condition: "good",
  },
];

// Insert items
let inserted = 0;
let skipped = 0;
for (const item of items) {
  const subCatId = subCatIds[item.subSlug];
  if (!subCatId) {
    console.warn(`No sub-category found for slug: ${item.subSlug}`);
    continue;
  }

  // Check if item already exists
  const [existing] = await conn.query(
    "SELECT id FROM equipment_items WHERE name = ? AND categoryId = ?",
    [item.name, categoryId]
  );
  if (existing.length > 0) {
    console.log(`Skipping existing item: ${item.name}`);
    skipped++;
    continue;
  }

  await conn.query(
    `INSERT INTO equipment_items
      (categoryId, subCategoryId, name, brand, model, description, specs,
       dailyRate, weeklyRate, monthlyRate, pricingType,
       \`condition\`, availability, quantity, availableQty,
       isActive, isFeatured, isReviewed, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      categoryId,
      subCatId,
      item.name,
      item.brand,
      item.model,
      item.description,
      item.specs,
      item.dailyRate,
      item.weeklyRate,
      item.monthlyRate,
      "fixed",
      item.condition,
      "available",
      1,
      1,
      1,
      0,
      1, // isReviewed = true since we're seeding
    ]
  );
  console.log(`✓ Inserted: ${item.name}`);
  inserted++;
}

console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
await conn.end();
