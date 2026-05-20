/*
 * Bulk Equipment Import Handler
 * Parses Excel files and generates AI product images + descriptions for each item
 */
import * as XLSX from "xlsx";
import { createEquipmentItem } from "./db";
import { invokeLLM } from "./_core/llm";
import { fetchProductImageFromWeb } from "./productImageScraper";

export interface EquipmentImportRow {
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
export function parseExcelBuffer(buffer: Buffer): EquipmentImportRow[] {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("No sheets found in workbook");

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const equipmentMap = new Map<string, EquipmentImportRow>();

    for (const _row of rows) {
      const row = _row as Record<string, unknown>;
      const equipmentName = (row["Equipment Name"] || "").toString().trim();
      const description = (row["Equipment description"] || "").toString().trim();
      const manufacturer = (row["Manufacturer"] || "").toString().trim();
      const model = (row["Unnamed: 8"] || "").toString().trim();
      const statusRaw = (row["Equipment Status"] || "available").toString().toLowerCase();

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
 * Generate AI product description and specifications
 * Uses LLM to create detailed product information
 */
export async function generateProductInfo(item: EquipmentImportRow): Promise<{ description: string; specs: string }> {
  try {
    const prompt = `You are a professional equipment rental specialist. Generate detailed product information for this equipment:

Name: ${item.equipmentName}
Manufacturer: ${item.manufacturer}
Model: ${item.model}
Current Description: ${item.description}

Provide:
1. A professional 2-3 sentence product description suitable for a rental website
2. Key specifications and features (comma-separated list)

Make it compelling, professional, and focused on rental use cases for contractors and DIY enthusiasts.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional equipment rental copywriter. Generate compelling product descriptions and specifications for rental equipment.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "product_info",
          strict: true,
          schema: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Professional product description for rental",
              },
              specs: {
                type: "string",
                description: "Key specifications and features",
              },
            },
            required: ["description", "specs"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from LLM");

    const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    return {
      description: parsed.description || item.description,
      specs: parsed.specs || "",
    };
  } catch (error) {
    console.error(`[AI Info Generation] Failed for ${item.equipmentName}:`, error);
    // Return original description if generation fails
    return {
      description: item.description || `Professional ${item.equipmentName} by ${item.manufacturer}`,
      specs: `Model: ${item.model}`,
    };
  }
}

/**
 * Source real manufacturer product image for equipment
 * Searches the web using brand + model to find the actual product photo
 */
export async function generateProductImage(item: EquipmentImportRow): Promise<string> {
  try {
    console.log(`[Photo Sourcing] Searching real manufacturer image for: ${item.equipmentName}`);
    const imgResult = await fetchProductImageFromWeb(
      item.manufacturer,
      item.model,
      item.equipmentName
    );
    if (imgResult) {
      console.log(`[Photo Sourcing] Found real image for: ${item.equipmentName}`);
      return imgResult.cdnUrl;
    }
    throw new Error("No manufacturer image found");
  } catch (error) {
    console.error(`[Photo Sourcing] Failed for ${item.equipmentName}:`, error);
    // Return placeholder if sourcing fails
    return `https://via.placeholder.com/400x300?text=${encodeURIComponent(item.equipmentName.substring(0, 20))}`;
  }
}

/**
 * Bulk import equipment items with AI-generated images and descriptions
 */
export async function bulkImportEquipmentWithImages(
  items: EquipmentImportRow[],
  categoryId: number = 1,
  onProgress?: (current: number, total: number, item: string) => void
): Promise<{ imported: number; failed: number; errors: string[] }> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      onProgress?.(i + 1, items.length, item.equipmentName);

      // Generate AI image
      const imageUrl = await generateProductImage(item);

      // Generate AI product information (description + specs)
      const productInfo = await generateProductInfo(item);

      // Map status to availability
      const availability = item.status === "maintenance" ? "maintenance" : item.status === "rented" ? "rented" : "available";
      const availableQty = item.status === "available" ? item.quantity : 0;

      // Create equipment item in database
      await createEquipmentItem({
        categoryId,
        name: item.equipmentName,
        description: productInfo.description,
        brand: item.manufacturer,
        model: item.model,
        specs: productInfo.specs,
        imageUrl,
        availability,
        quantity: item.quantity,
        availableQty,
        isActive: true,
        condition: "good",
      });

      imported++;
      console.log(`[Bulk Import] ✓ ${item.equipmentName} (qty: ${item.quantity})`);
    } catch (err) {
      failed++;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      errors.push(`Failed to import "${item.equipmentName}": ${errorMsg}`);
      console.error(`[Bulk Import] ✗ Error importing ${item.equipmentName}:`, err);
    }
  }

  return { imported, failed, errors };
}
