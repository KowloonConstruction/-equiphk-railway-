import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock drizzle
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockInnerJoin = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockInsert = vi.fn();
const mockValues = vi.fn();

const chainable = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  innerJoin: mockInnerJoin,
  orderBy: mockOrderBy,
  limit: mockLimit,
  insert: mockInsert,
  values: mockValues,
};

// Each method returns the chainable object for chaining
Object.values(chainable).forEach((fn) => fn.mockReturnValue(chainable));

vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => chainable),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ type: "eq", a, b })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  like: vi.fn((a, b) => ({ type: "like", a, b })),
  or: vi.fn((...args: any[]) => ({ type: "or", args })),
  desc: vi.fn((a) => ({ type: "desc", a })),
  sql: vi.fn(),
  inArray: vi.fn((a, b) => ({ type: "inArray", a, b })),
}));

// Mock env
vi.mock("./_core/env", () => ({
  ENV: { ownerOpenId: "test-owner" },
}));

// Set DATABASE_URL before importing db module
process.env.DATABASE_URL = "mysql://test:test@localhost:3306/test";

describe("Consumables Database Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain returns
    Object.values(chainable).forEach((fn) => fn.mockReturnValue(chainable));
  });

  describe("listConsumables", () => {
    it("should return all active consumables when no category tag is provided", async () => {
      const mockConsumables = [
        { id: 1, name: "PU Resin", brand: "SealBoss", categoryTag: "waterproofing", isActive: true },
        { id: 2, name: "Epoxy Resin", brand: "Sika", categoryTag: "waterproofing", isActive: true },
      ];
      mockOrderBy.mockResolvedValueOnce(mockConsumables);

      const { listConsumables } = await import("./db");
      const result = await listConsumables();

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toEqual(mockConsumables);
    });

    it("should filter by category tag when provided", async () => {
      const mockConsumables = [
        { id: 1, name: "PU Resin", categoryTag: "waterproofing" },
      ];
      mockOrderBy.mockResolvedValueOnce(mockConsumables);

      const { listConsumables } = await import("./db");
      const result = await listConsumables("waterproofing");

      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(mockConsumables);
    });
  });

  describe("getConsumablesForEquipment", () => {
    it("should return consumables linked to a specific equipment item", async () => {
      const mockLinkedConsumables = [
        { id: 1, name: "PU Resin", brand: "SealBoss", price: "380.00", unit: "kg", note: "Standard resin" },
        { id: 2, name: "Grease Coupler", brand: "SealBoss", price: "180.00", unit: "set", note: "Required for packers" },
      ];
      mockOrderBy.mockResolvedValueOnce(mockLinkedConsumables);

      const { getConsumablesForEquipment } = await import("./db");
      const result = await getConsumablesForEquipment(49);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toEqual(mockLinkedConsumables);
    });

    it("should return empty array when no consumables are linked", async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const { getConsumablesForEquipment } = await import("./db");
      const result = await getConsumablesForEquipment(99999);

      expect(result).toEqual([]);
    });
  });

  describe("getConsumableById", () => {
    it("should return a single consumable by ID", async () => {
      const mockConsumable = { id: 1, name: "PU Resin", brand: "SealBoss" };
      mockLimit.mockResolvedValueOnce([mockConsumable]);

      const { getConsumableById } = await import("./db");
      const result = await getConsumableById(1);

      expect(mockSelect).toHaveBeenCalled();
      expect(result).toEqual(mockConsumable);
    });

    it("should return undefined when consumable not found", async () => {
      mockLimit.mockResolvedValueOnce([]);

      const { getConsumableById } = await import("./db");
      const result = await getConsumableById(99999);

      expect(result).toBeUndefined();
    });
  });

  describe("createConsumable", () => {
    it("should insert a new consumable and return its ID", async () => {
      mockValues.mockResolvedValueOnce([{ insertId: 42 }]);

      const { createConsumable } = await import("./db");
      const result = await createConsumable({
        name: "Test Resin",
        brand: "TestBrand",
        unit: "kg",
        categoryTag: "waterproofing",
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(result).toEqual({ id: 42 });
    });
  });

  describe("getEquipmentForConsumable", () => {
    it("should return equipment items linked to a specific consumable", async () => {
      const mockEquipment = [
        { id: 49, name: "PU Pump", brand: "SealBoss", dailyRate: "350.00", note: "Standard pump" },
        { id: 19, name: "PU Pump Large", brand: "SealBoss", dailyRate: "500.00", note: "For large jobs" },
      ];
      mockOrderBy.mockResolvedValueOnce(mockEquipment);

      const { getEquipmentForConsumable } = await import("./db");
      const result = await getEquipmentForConsumable(1);

      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toEqual(mockEquipment);
    });

    it("should return empty array when no equipment is linked", async () => {
      mockOrderBy.mockResolvedValueOnce([]);

      const { getEquipmentForConsumable } = await import("./db");
      const result = await getEquipmentForConsumable(99999);

      expect(result).toEqual([]);
    });
  });

  describe("linkConsumableToEquipment", () => {
    it("should create a link between equipment and consumable", async () => {
      mockValues.mockResolvedValueOnce([{ insertId: 1 }]);

      const { linkConsumableToEquipment } = await import("./db");
      await linkConsumableToEquipment({
        equipmentItemId: 49,
        consumableId: 1,
        note: "Standard PU resin",
      });

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
    });
  });
});
