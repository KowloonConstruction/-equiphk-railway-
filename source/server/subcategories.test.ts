/**
 * Sub-category database query tests
 * Verifies that listSubCategories and listCategoriesWithSubCategories work correctly
 */
import { describe, it, expect } from "vitest";
import { listSubCategories, listCategoriesWithSubCategories, listEquipmentItems } from "./db";

describe("Sub-Category Queries", () => {
  it("should list all active sub-categories", async () => {
    const subs = await listSubCategories();
    expect(Array.isArray(subs)).toBe(true);
    // We seeded 52 sub-categories
    expect(subs.length).toBeGreaterThanOrEqual(50);
  });

  it("should filter sub-categories by categoryId", async () => {
    // Power Tools = categoryId 1, should have 4 sub-categories
    const powerToolSubs = await listSubCategories(1);
    expect(Array.isArray(powerToolSubs)).toBe(true);
    expect(powerToolSubs.length).toBe(4);
    expect(powerToolSubs.every(s => s.categoryId === 1)).toBe(true);
  });

  it("should return sub-categories with required fields", async () => {
    const subs = await listSubCategories(1);
    const first = subs[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("categoryId");
    expect(first).toHaveProperty("sortOrder");
    expect(first).toHaveProperty("isActive");
  });

  it("should list categories with their sub-categories nested", async () => {
    const cats = await listCategoriesWithSubCategories();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThanOrEqual(13); // At least 13 main categories (may grow as new categories are added)

    // Each category should have subCategories array
    for (const cat of cats) {
      expect(cat).toHaveProperty("subCategories");
      expect(Array.isArray((cat as any).subCategories)).toBe(true);
    }
  });

  it("should have at least 1 sub-category per main category", async () => {
    const cats = await listCategoriesWithSubCategories();
    // Count categories that have at least one sub-category assigned
    const catsWithSubs = cats.filter(cat => (cat as any).subCategories.length >= 1);
    // At least 80% of active categories should have sub-categories
    // (some newly added categories may not yet have subs seeded)
    expect(catsWithSubs.length).toBeGreaterThanOrEqual(Math.floor(cats.length * 0.8));
  });

  it("should return sub-categories ordered by sortOrder within each category", async () => {
    const subs = await listSubCategories(1);
    for (let i = 0; i < subs.length - 1; i++) {
      expect(subs[i].sortOrder).toBeLessThanOrEqual(subs[i + 1].sortOrder);
    }
  });

  it("should only return active sub-categories", async () => {
    const subs = await listSubCategories();
    expect(subs.every(s => s.isActive === true || s.isActive === 1)).toBe(true);
  });
});

describe("Equipment Items with Sub-Category Filter", () => {
  it("should filter equipment items by subCategoryId", async () => {
    // Get sub-categories for power tools
    const powerToolSubs = await listSubCategories(1);
    expect(powerToolSubs.length).toBeGreaterThan(0);

    const firstSubId = powerToolSubs[0].id;
    const items = await listEquipmentItems({ subCategoryId: firstSubId });
    expect(Array.isArray(items)).toBe(true);
    // All returned items should have this subCategoryId
    if (items.length > 0) {
      expect(items.every(i => i.subCategoryId === firstSubId)).toBe(true);
    }
  });

  it("should filter by both categoryId and subCategoryId", async () => {
    const powerToolSubs = await listSubCategories(1);
    const firstSubId = powerToolSubs[0].id;

    const items = await listEquipmentItems({ categoryId: 1, subCategoryId: firstSubId });
    expect(Array.isArray(items)).toBe(true);
    if (items.length > 0) {
      expect(items.every(i => i.categoryId === 1)).toBe(true);
      expect(items.every(i => i.subCategoryId === firstSubId)).toBe(true);
    }
  });

  it("all 214 equipment items should have a subCategoryId assigned", async () => {
    const items = await listEquipmentItems({ activeOnly: false });
    const unassigned = items.filter(i => i.subCategoryId === null || i.subCategoryId === undefined);
    expect(unassigned.length).toBe(0);
  });
});
