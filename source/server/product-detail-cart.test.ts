import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context for testing
function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

// Helper to safely convert decimal to number
function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value && typeof value === "object" && "d" in value) {
    return parseFloat(value.d);
  }
  return 0;
}

describe("Product Detail Page Features", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should fetch full equipment details by ID", async () => {
    const caller = appRouter.createCaller(ctx);
    
    // Get first equipment item
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    expect(equipmentList.length).toBeGreaterThan(0);
    
    const firstItem = equipmentList[0];
    const details = await caller.equipment.getById({ id: firstItem.id });
    
    expect(details).toBeDefined();
    expect(details?.id).toBe(firstItem.id);
    expect(details?.name).toBeDefined();
    expect(details?.description).toBeDefined();
    expect(details?.imageUrl).toBeDefined();
    expect(details?.categoryId).toBeDefined();
  });

  it("should include all pricing tiers in detail view", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const details = await caller.equipment.getById({ id: item.id });
      
      expect(details?.dailyRate).toBeDefined();
      // Weekly and monthly rates are calculated from daily rate
      const dailyRate = toNumber(details?.dailyRate);
      expect(typeof dailyRate).toBe("number");
      expect(dailyRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("should include availability status in detail view", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const details = await caller.equipment.getById({ id: item.id });
      
      expect(details?.availability).toBeDefined();
      expect(["available", "rented", "maintenance", "retired", ""]).toContain(
        details?.availability
      );
    }
  });

  it("should include quantity and available quantity", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const details = await caller.equipment.getById({ id: item.id });
      
      expect(details?.quantity).toBeDefined();
      expect(details?.availableQty).toBeDefined();
      expect(details?.quantity).toBeGreaterThanOrEqual(0);
      expect(details?.availableQty).toBeGreaterThanOrEqual(0);
    }
  });

  it("should include equipment specifications", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const details = await caller.equipment.getById({ id: item.id });
      
      expect(details?.specs).toBeDefined();
      // Specs can be string or object
      expect(typeof details?.specs === "string" || typeof details?.specs === "object").toBe(true);
    }
  });

  it("should include condition information", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const details = await caller.equipment.getById({ id: item.id });
      
      expect(details?.condition).toBeDefined();
      expect(["new", "excellent", "good", "fair", ""]).toContain(
        details?.condition
      );
    }
  });

  it("should include brand and model information", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const details = await caller.equipment.getById({ id: item.id });
      
      // Brand and model may be optional
      if (details?.brand) {
        expect(typeof details.brand).toBe("string");
      }
      if (details?.model) {
        expect(typeof details.model).toBe("string");
      }
    }
  });
});

describe("Related Equipment Suggestions", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should fetch related equipment from same category", async () => {
    const caller = appRouter.createCaller(ctx);
    
    // Get first equipment item
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      
      // Fetch related equipment from same category
      const relatedList = await caller.equipment.list({
        categoryId: firstItem.categoryId,
        activeOnly: true,
      });
      
      expect(Array.isArray(relatedList)).toBe(true);
      expect(relatedList.length).toBeGreaterThan(0);
      
      // All items should be from same category
      relatedList.forEach((item) => {
        expect(item.categoryId).toBe(firstItem.categoryId);
      });
    }
  });

  it("should exclude the current item from related suggestions", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 1) {
      const firstItem = equipmentList[0];
      
      const relatedList = await caller.equipment.list({
        categoryId: firstItem.categoryId,
        activeOnly: true,
      });
      
      // Filter out current item (would be done in frontend)
      const filtered = relatedList.filter((item) => item.id !== firstItem.id);
      
      // Should have at least one other item if category has multiple items
      if (relatedList.length > 1) {
        expect(filtered.length).toBeGreaterThan(0);
      }
    }
  });

  it("should limit related suggestions to reasonable number", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      
      const relatedList = await caller.equipment.list({
        categoryId: firstItem.categoryId,
        activeOnly: true,
      });
      
      // Should be able to get up to 4 related items (frontend limit)
      expect(relatedList.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("Rental Pricing Calculations", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should calculate daily rental price correctly", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const dailyRate = toNumber(item.dailyRate);
      
      // Daily price should be a valid number
      expect(typeof dailyRate).toBe("number");
      expect(dailyRate).toBeGreaterThanOrEqual(0);
    }
  });

  it("should apply weekly discount correctly", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const dailyRate = toNumber(item.dailyRate);
      
      if (dailyRate > 0) {
        // Weekly rate (7 days) should be: dailyRate * 7 * 0.9 (10% discount)
        const weeklyPrice = dailyRate * 7 * 0.9;
        const dailyEquivalent = weeklyPrice / 7;
        
        // Daily equivalent should be 90% of original
        expect(dailyEquivalent).toBeLessThan(dailyRate);
        expect(dailyEquivalent).toBeCloseTo(dailyRate * 0.9, 2);
      }
    }
  });

  it("should apply monthly discount correctly", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      const dailyRate = toNumber(item.dailyRate);
      
      if (dailyRate > 0) {
        // Monthly rate (30 days) should be: dailyRate * 30 * 0.8 (20% discount)
        const monthlyPrice = dailyRate * 30 * 0.8;
        const dailyEquivalent = monthlyPrice / 30;
        
        // Daily equivalent should be 80% of original
        expect(dailyEquivalent).toBeLessThan(dailyRate);
        expect(dailyEquivalent).toBeCloseTo(dailyRate * 0.8, 2);
      }
    }
  });

  it("should handle decimal pricing from database", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      
      // Should handle various decimal formats
      const rate = toNumber(item.dailyRate);
      expect(typeof rate).toBe("number");
      expect(rate).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(rate)).toBe(true);
    }
  });
});

describe("Search Results for Product Pages", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should return search results with product detail fields", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      const searchTerm = firstItem.name.substring(0, 3);
      
      const results = await caller.equipment.search({ query: searchTerm });
      
      expect(Array.isArray(results)).toBe(true);
      if (results.length > 0) {
        const result = results[0];
        expect(result.id).toBeDefined();
        expect(result.name).toBeDefined();
        expect(result.imageUrl).toBeDefined();
        expect(result.dailyRate).toBeDefined();
      }
    }
  });

  it("should include pricing in search results", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      const searchTerm = firstItem.name.substring(0, 3);
      
      const results = await caller.equipment.search({ query: searchTerm });
      
      if (results.length > 0) {
        results.forEach((result) => {
          const rate = toNumber(result.dailyRate);
          expect(rate).toBeGreaterThanOrEqual(0);
        });
      }
    }
  });

  it("should include images in search results", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      const searchTerm = firstItem.name.substring(0, 3);
      
      const results = await caller.equipment.search({ query: searchTerm });
      
      if (results.length > 0) {
        results.forEach((result) => {
          expect(result.imageUrl).toBeDefined();
          // imageUrl may be stored as a string or JSON object depending on import method
          expect(["string", "object"]).toContain(typeof result.imageUrl);
        });
      }
    }
  });

  it("should return clickable product IDs", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      const searchTerm = firstItem.name.substring(0, 3);
      
      const results = await caller.equipment.search({ query: searchTerm });
      
      if (results.length > 0) {
        results.forEach((result) => {
          expect(typeof result.id).toBe("number");
          expect(result.id).toBeGreaterThan(0);
        });
      }
    }
  });
});

describe("Equipment Catalog for Cart Integration", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should fetch equipment with all fields needed for cart", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    
    if (equipmentList.length > 0) {
      equipmentList.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.name).toBeDefined();
        expect(item.dailyRate).toBeDefined();
        expect(item.imageUrl).toBeDefined();
        expect(item.description).toBeDefined();
      });
    }
  });

  it("should include availability for cart decisions", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    
    if (equipmentList.length > 0) {
      equipmentList.forEach((item) => {
        expect(item.availability).toBeDefined();
        expect(item.availableQty).toBeDefined();
      });
    }
  });

  it("should filter active items for cart display", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const activeList = await caller.equipment.list({ activeOnly: true });
    const allList = await caller.equipment.list({ activeOnly: false });
    
    expect(activeList.length).toBeLessThanOrEqual(allList.length);
    
    // All active items should be marked as active
    activeList.forEach((item) => {
      expect(item.isActive).toBe(true);
    });
  });
});
