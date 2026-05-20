import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  listCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Power Tools", slug: "power-tools", segment: "both", sortOrder: 0, isActive: true },
    { id: 2, name: "Heavy Plant", slug: "heavy-plant", segment: "b2b", sortOrder: 1, isActive: true },
  ]),
  getCategoryById: vi.fn().mockResolvedValue({
    id: 1, name: "Power Tools", slug: "power-tools", segment: "both", sortOrder: 0, isActive: true,
  }),
  createCategory: vi.fn().mockResolvedValue({ id: 3 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  listEquipmentItems: vi.fn().mockResolvedValue([
    {
      id: 1, categoryId: 1, name: "Hilti TE 60", brand: "Hilti", model: "TE 60",
      dailyRate: "350.00", condition: "good", availability: "available",
      quantity: 3, availableQty: 2, isActive: true, isFeatured: false,
    },
  ]),
  getEquipmentItemById: vi.fn().mockResolvedValue({
    id: 1, categoryId: 1, name: "Hilti TE 60", brand: "Hilti", model: "TE 60",
    dailyRate: "350.00", condition: "good", availability: "available",
    quantity: 3, availableQty: 2, isActive: true, isFeatured: false,
  }),
  createEquipmentItem: vi.fn().mockResolvedValue({ id: 2 }),
  updateEquipmentItem: vi.fn().mockResolvedValue(undefined),
  deleteEquipmentItem: vi.fn().mockResolvedValue(undefined),
  getInventoryStats: vi.fn().mockResolvedValue({
    totalItems: 5, totalCategories: 3, availableItems: 3, rentedItems: 2,
  }),
  // Keep existing db exports
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@equiphk.com",
    name: "Casey Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createRegularUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("categories", () => {
  describe("list (public)", () => {
    it("returns all categories without auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.categories.list();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Power Tools");
    });
  });

  describe("getById (public)", () => {
    it("returns a single category", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.categories.getById({ id: 1 });
      expect(result?.name).toBe("Power Tools");
    });
  });

  describe("create (admin only)", () => {
    it("creates a category as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.categories.create({
        name: "Scaffolding",
        slug: "scaffolding",
        segment: "b2b",
      });
      expect(result).toEqual({ id: 3 });
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(
        caller.categories.create({ name: "Test", slug: "test" })
      ).rejects.toThrow();
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.categories.create({ name: "Test", slug: "test" })
      ).rejects.toThrow();
    });
  });

  describe("update (admin only)", () => {
    it("updates a category as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.categories.update({ id: 1, name: "Updated Tools" });
      expect(result).toEqual({ success: true });
    });
  });

  describe("delete (admin only)", () => {
    it("deletes a category as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.categories.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });
});

describe("equipment", () => {
  describe("list (public)", () => {
    it("returns equipment items without auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.equipment.list();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Hilti TE 60");
    });
  });

  describe("getById (public)", () => {
    it("returns a single equipment item", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.equipment.getById({ id: 1 });
      expect(result?.name).toBe("Hilti TE 60");
    });
  });

  describe("create (admin only)", () => {
    it("creates equipment as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.create({
        categoryId: 1,
        name: "Makita Drill",
        brand: "Makita",
        dailyRate: "200.00",
        condition: "new",
        availability: "available",
        quantity: 5,
        availableQty: 5,
      });
      expect(result).toEqual({ id: 2 });
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(
        caller.equipment.create({ categoryId: 1, name: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("update (admin only)", () => {
    it("updates equipment as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.update({
        id: 1,
        name: "Hilti TE 60 Updated",
        dailyRate: "400.00",
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("delete (admin only)", () => {
    it("deletes equipment as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  describe("stats (admin only)", () => {
    it("returns inventory stats as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.stats();
      expect(result.totalItems).toBe(5);
      expect(result.totalCategories).toBe(3);
      expect(result.availableItems).toBe(3);
      expect(result.rentedItems).toBe(2);
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.equipment.stats()).rejects.toThrow();
    });
  });
});
