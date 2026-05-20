import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions — declare via vi.hoisted so the reference is available inside vi.mock
const { mockUpdateEquipmentItem } = vi.hoisted(() => ({
  mockUpdateEquipmentItem: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => ({
  updateEquipmentItem: mockUpdateEquipmentItem,
  listEquipmentItems: vi.fn().mockResolvedValue([]),
  getEquipmentItemById: vi.fn().mockResolvedValue({
    id: 1, categoryId: 1, name: "Hilti TE 60", brand: "Hilti", model: "TE 60",
    dailyRate: "350.00", condition: "good", availability: "available",
    quantity: 3, availableQty: 2, isActive: true, isFeatured: false, isReviewed: false,
  }),
  createEquipmentItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteEquipmentItem: vi.fn().mockResolvedValue(undefined),
  bulkUpdateEquipmentCategory: vi.fn().mockResolvedValue({ updated: 0 }),
  getInventoryStats: vi.fn().mockResolvedValue({ totalItems: 0, totalCategories: 0, availableItems: 0, rentedItems: 0 }),
  searchEquipmentItems: vi.fn().mockResolvedValue([]),
  listCategories: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
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

describe("equipment.toggleReviewed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should mark an item as reviewed when admin passes isReviewed: true", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.equipment.toggleReviewed({ id: 1, isReviewed: true });
    expect(result.success).toBe(true);
    expect(result.isReviewed).toBe(true);
    expect(mockUpdateEquipmentItem).toHaveBeenCalledWith(1, { isReviewed: true });
  });

  it("should unmark an item as reviewed when admin passes isReviewed: false", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.equipment.toggleReviewed({ id: 5, isReviewed: false });
    expect(result.success).toBe(true);
    expect(result.isReviewed).toBe(false);
    expect(mockUpdateEquipmentItem).toHaveBeenCalledWith(5, { isReviewed: false });
  });

  it("should call updateEquipmentItem exactly once per toggle", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.equipment.toggleReviewed({ id: 3, isReviewed: true });
    expect(mockUpdateEquipmentItem).toHaveBeenCalledTimes(1);
  });

  it("should reject unauthenticated (public) access", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.equipment.toggleReviewed({ id: 1, isReviewed: true })).rejects.toThrow();
  });

  it("should reject regular user access (non-admin)", async () => {
    const caller = appRouter.createCaller(createRegularUserContext());
    await expect(caller.equipment.toggleReviewed({ id: 1, isReviewed: true })).rejects.toThrow();
  });

  it("should pass the correct item id to the DB helper", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.equipment.toggleReviewed({ id: 42, isReviewed: true });
    expect(mockUpdateEquipmentItem).toHaveBeenCalledWith(42, expect.objectContaining({ isReviewed: true }));
  });

  it("should handle multiple sequential toggles correctly", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await caller.equipment.toggleReviewed({ id: 1, isReviewed: true });
    await caller.equipment.toggleReviewed({ id: 1, isReviewed: false });
    expect(mockUpdateEquipmentItem).toHaveBeenCalledTimes(2);
    expect(mockUpdateEquipmentItem).toHaveBeenNthCalledWith(1, 1, { isReviewed: true });
    expect(mockUpdateEquipmentItem).toHaveBeenNthCalledWith(2, 1, { isReviewed: false });
  });
});
