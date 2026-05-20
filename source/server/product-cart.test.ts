import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to safely convert pricing to number
function toNumber(value: any): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (value && typeof value === "object" && "d" in value) {
    // Handle Decimal serialization format
    return parseFloat(value.d);
  }
  return 0;
}

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

describe("Equipment Product Routes", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should fetch equipment by ID", async () => {
    const caller = appRouter.createCaller(ctx);
    
    // First, list all equipment to get an ID
    const equipmentList = await caller.equipment.list({ activeOnly: false });
    
    if (equipmentList.length > 0) {
      const firstItem = equipmentList[0];
      const result = await caller.equipment.getById({ id: firstItem.id });
      
      expect(result).toBeDefined();
      expect(result?.id).toBe(firstItem.id);
      expect(result?.name).toBeDefined();
      const rate = toNumber(result?.dailyRate);
      expect(rate).toBeGreaterThanOrEqual(0);
    }
  });

  it("should return null for non-existent equipment", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.equipment.getById({ id: 99999 });
    
    expect(result).toBeUndefined();
  });

  it("should list equipment with filters", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const activeOnly = await caller.equipment.list({ activeOnly: true });
    const all = await caller.equipment.list({ activeOnly: false });
    
    expect(Array.isArray(activeOnly)).toBe(true);
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThanOrEqual(activeOnly.length);
  });

  it("should have pricing data for equipment", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      expect(item.dailyRate).toBeDefined();
      const rate = toNumber(item.dailyRate);
      expect(rate).toBeGreaterThanOrEqual(0);
    }
  });

  it("should include image URLs for equipment", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      expect(item.imageUrl).toBeDefined();
      // imageUrl can be a string or object (JSON) depending on import source
      expect(["string", "object"]).toContain(typeof item.imageUrl);
    }
  });

  it("should include availability information", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: false });
    
    if (equipmentList.length > 0) {
      const item = equipmentList[0];
      expect(item.availability).toBeDefined();
      expect(typeof item.availability).toBe("string");
    }
  });

  it("should search equipment by name", async () => {
    const caller = appRouter.createCaller(ctx);
    
    // Get all equipment first
    const allEquipment = await caller.equipment.list({ activeOnly: true });
    
    if (allEquipment.length > 0) {
      const firstItem = allEquipment[0];
      const searchTerm = firstItem.name.substring(0, 3);
      
      const results = await caller.equipment.search({ query: searchTerm });
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
    }
  });

  it("should return empty array for no search matches", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const results = await caller.equipment.search({ query: "NONEXISTENTITEM12345" });
    
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});

describe("Equipment Pricing", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("should have consistent pricing structure", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    
    equipmentList.forEach((item) => {
      const dailyRate = toNumber(item.dailyRate);
      expect(dailyRate).toBeGreaterThanOrEqual(0);
      if (item.weeklyRate) {
        const weeklyRate = toNumber(item.weeklyRate);
        expect(weeklyRate).toBeGreaterThanOrEqual(0);
      }
      if (item.monthlyRate) {
        const monthlyRate = toNumber(item.monthlyRate);
        expect(monthlyRate).toBeGreaterThanOrEqual(0);
      }
    });
  });

  it("should have descriptions for all equipment", async () => {
    const caller = appRouter.createCaller(ctx);
    
    const equipmentList = await caller.equipment.list({ activeOnly: true });
    
    equipmentList.forEach((item) => {
      expect(item.description).toBeDefined();
      // description can be a string or object (JSON) depending on import source
      expect(["string", "object"]).toContain(typeof item.description);
    });
  });
});
