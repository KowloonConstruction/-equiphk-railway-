/*
 * Excel Equipment Register Import Handler
 * Parses Excel files and bulk imports equipment with placeholder images
 */
import * as XLSX from "xlsx";
import { createEquipmentItem } from "./db";

export interface EquipmentRow {
  equipmentName: string;
  description: string;
  manufacturer: string;
  model: string;
  status: "available" | "rented" | "maintenance" | "retired";
  quantity: number;
}

/**
 * Parse Excel buffer and extract equipment data
 * Groups identical items by name and counts quantity
 */
export function parseExcelBuffer(buffer: Buffer): EquipmentRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in workbook");

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    // Map Excel columns to our format
    const equipmentMap = new Map<string, EquipmentRow>();

    for (const _row of rows) {
      const row = _row as Record<string, unknown>;
      const equipmentName = (row["Equipment Name"] || "").toString().trim();
      const description = (row["Equipment description"] || "").toString().trim();
      const manufacturer = (row["Manufacturer"] || "").toString().trim();
      const model = (row["Unnamed: 8"] || "").toString().trim();
      const statusRaw = (row["Equipment Status"] || "available").toString().toLowerCase();

      // Map status to our enum
      let status: "available" | "rented" | "maintenance" | "retired" = "available";
      if (statusRaw.includes("maintenance")) status = "maintenance";
      else if (statusRaw.includes("rented")) status = "rented";
      else if (statusRaw.includes("retired")) status = "retired";

      if (!equipmentName) continue;

      const key = equipmentName;
      if (equipmentMap.has(key)) {
        const existing = equipmentMap.get(key)!;
        existing.quantity += 1;
      } else {
        equipmentMap.set(key, {
          equipmentName,
          description,
          manufacturer,
          model,
          status,
          quantity: 1,
        });
      }
    }

    return Array.from(equipmentMap.values());
  } catch (error) {
    console.error("[Excel Import] Parse error:", error);
    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a placeholder image URL for equipment
 */
export function getPlaceholderImageUrl(equipmentName: string): string {
  const encoded = encodeURIComponent(equipmentName.substring(0, 30));
  return `https://via.placeholder.com/400x300?text=${encoded}`;
}

/**
 * Bulk import equipment items into database
 * Creates one database entry per unique equipment name with quantity
 */
export async function bulkImportEquipment(
  items: EquipmentRow[],
  categoryId: number = 1 // Default category
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Use placeholder image
      const imageUrl = getPlaceholderImageUrl(item.equipmentName);

      // Map status to availability enum
      const availability = item.status === "maintenance" ? "maintenance" : item.status === "rented" ? "rented" : "available";

      // Create equipment item in database
      await createEquipmentItem({
        categoryId,
        name: item.equipmentName,
        description: item.description,
        brand: item.manufacturer,
        model: item.model,
        imageUrl,
        availability,
        quantity: item.quantity,
        availableQty: item.status === "available" ? item.quantity : 0,
        isActive: true,
        condition: "good",
      });

      imported++;
      console.log(`[Excel Import] Imported: ${item.equipmentName} (qty: ${item.quantity})`);
    } catch (err) {
      failed++;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Failed to import "${item.equipmentName}": ${errorMsg}`);
      console.error(`[Excel Import] Error importing ${item.equipmentName}:`, err);
    }
  }

  return { imported, failed, errors };
}
