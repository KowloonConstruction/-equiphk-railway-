import { drizzle } from "drizzle-orm/mysql2";
import { equipmentCategories } from "../drizzle/schema.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read AI-generated categories
const categoriesPath = path.join(__dirname, "../../ai_categories.json");
const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));

async function seedCategories() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log(`\n📦 Seeding ${categoriesData.length} AI-generated categories...\n`);

  let created = 0;
  let failed = 0;

  for (const cat of categoriesData) {
    try {
      await db.insert(equipmentCategories).values({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        segment: cat.segment || "both",
        sortOrder: created,
        isActive: true,
      });
      console.log(`✓ Created: ${cat.name} (${cat.item_count} items, ${cat.total_quantity} units)`);
      created++;
    } catch (error) {
      console.error(`✗ Failed: ${cat.name}`, error instanceof Error ? error.message : error);
      failed++;
    }
  }

  console.log(`\n✓ Seeding complete: ${created} categories created, ${failed} failed\n`);
  process.exit(0);
}

seedCategories().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
