#!/usr/bin/env node
/**
 * Standalone script to import equipment from Excel into the database
 * Usage: node import-equipment.mjs <excel-file-path> <category-id>
 */
import * as XLSX from "xlsx";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { equipmentItems } from "../drizzle/schema.ts";
import fs from "fs";

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Parse Excel file
function parseExcel(filePath) {
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const equipmentMap = new Map();

  for (const row of rows) {
    const name = (row["Equipment Name"] || "").toString().trim();
    const description = (row["Equipment description"] || "").toString().trim();
    const manufacturer = (row["Manufacturer"] || "").toString().trim();
    const model = (row["Unnamed: 8"] || "").toString().trim();
    const statusRaw = (row["Equipment Status"] || "available").toString().toLowerCase();

    let status = "available";
    if (statusRaw.includes("maintenance")) status = "maintenance";
    else if (statusRaw.includes("rented")) status = "rented";

    if (!name) continue;

    if (equipmentMap.has(name)) {
      equipmentMap.get(name).quantity += 1;
    } else {
      equipmentMap.set(name, { name, description, manufacturer, model, status, quantity: 1 });
    }
  }

  return Array.from(equipmentMap.values());
}

// Main import function
async function importEquipment() {
  const excelFile = process.argv[2] || "/home/ubuntu/upload/Equipment_Register_20260326163622.xlsx";
  const categoryId = parseInt(process.argv[3] || "1", 10);

  console.log(`📂 Parsing Excel file: ${excelFile}`);
  const items = parseExcel(excelFile);
  console.log(`✅ Found ${items.length} unique equipment items\n`);

  // Connect to database
  const connection = await mysql.createConnection(DB_URL);
  const db = drizzle({ client: connection });

  let imported = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const imageUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.name.substring(0, 20))}`;
      const availability = item.status === "maintenance" ? "maintenance" : item.status === "rented" ? "rented" : "available";
      const availableQty = item.status === "available" ? item.quantity : 0;

      await db.insert(equipmentItems).values({
        categoryId,
        name: item.name,
        description: item.description,
        brand: item.manufacturer,
        model: item.model,
        imageUrl,
        availability,
        quantity: item.quantity,
        availableQty,
        isActive: true,
        condition: "good",
      });

      console.log(`✓ ${item.name} (qty: ${item.quantity})`);
      imported++;
    } catch (err) {
      console.error(`✗ Failed to import "${item.name}":`, err.message);
      failed++;
    }
  }

  await connection.end();

  console.log(`\n📊 Import Summary:`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${items.length}`);
}

importEquipment().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
