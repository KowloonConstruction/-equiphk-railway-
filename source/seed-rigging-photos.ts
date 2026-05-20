/**
 * Server-side script to auto-source photos for all rigging items
 * Run: npx tsx seed-rigging-photos.ts
 */
import * as dotenv from "dotenv";
dotenv.config();

import { fetchProductImageFromWeb } from "./server/productImageScraper";
import { getDb } from "./server/db";
import { equipmentItems } from "./drizzle/schema";
import { eq, inArray } from "drizzle-orm";

const riggingItemIds = [
  120001, 120002, 120003, 120004, 120005,
  120006, 120007, 120008, 120009,
  120010, 120011, 120012, 120013, 120014,
  120015, 120016,
  120017, 120018, 120019, 120020, 120021,
];

const db = await getDb();
if (!db) throw new Error("Database not available");

const items = await db
  .select()
  .from(equipmentItems)
  .where(inArray(equipmentItems.id, riggingItemIds));

console.log(`Found ${items.length} rigging items. Starting photo sourcing...\n`);

let success = 0;
let failed = 0;

for (const item of items) {
  const brand = item.brand || "";
  const model = (item as any).model || "";
  const name = item.name || "";

  console.log(`Sourcing: ${name} (${brand} ${model})`);

  try {
    const result = await fetchProductImageFromWeb(brand, model, name);
    if (result?.cdnUrl) {
      await db
        .update(equipmentItems)
        .set({
          pendingImageUrl: result.cdnUrl,
          pendingImageSourceUrl: result.sourceUrl,
          imageApprovalStatus: "pending",
        } as any)
        .where(eq(equipmentItems.id, item.id));
      console.log(`  ✓ Found: ${result.cdnUrl.substring(0, 80)}...`);
      success++;
    } else {
      console.log(`  ✗ No image found`);
      failed++;
    }
  } catch (e: any) {
    console.log(`  ✗ Error: ${e.message}`);
    failed++;
  }

  // Delay to avoid rate limiting
  await new Promise((r) => setTimeout(r, 1500));
}

console.log(`\n✅ Done! Success: ${success}, Failed: ${failed}`);
process.exit(0);
