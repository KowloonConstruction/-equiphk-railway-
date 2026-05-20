import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// vi.mock is hoisted — define all mocks inside the factory using vi.fn()
vi.mock("./db", () => ({
  listCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Power Tools", slug: "power-tools", segment: "both", sortOrder: 0, isActive: true },
    { id: 2, name: "Scaffolding & Access", slug: "scaffolding-access", segment: "b2b", sortOrder: 1, isActive: true },
  ]),
  getCategoryById: vi.fn().mockResolvedValue({ id: 1, name: "Power Tools" }),
  createCategory: vi.fn().mockResolvedValue({ id: 3 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  listSubCategories: vi.fn().mockResolvedValue([]),
  listAllSubCategories: vi.fn().mockResolvedValue([]),
  listCategoriesWithSubCategories: vi.fn().mockResolvedValue([]),
  listAllCategoriesWithSubCategories: vi.fn().mockResolvedValue([]),
  createSubCategory: vi.fn().mockResolvedValue({ id: 10 }),
  updateSubCategory: vi.fn().mockResolvedValue(undefined),
  deleteSubCategory: vi.fn().mockResolvedValue(undefined),
  reorderSubCategories: vi.fn().mockResolvedValue({ updated: 2 }),
  listEquipmentItems: vi.fn().mockResolvedValue([]),
  getEquipmentItemById: vi.fn().mockResolvedValue(undefined),
  createEquipmentItem: vi.fn().mockResolvedValue({ id: 1 }),
  updateEquipmentItem: vi.fn().mockResolvedValue(undefined),
  deleteEquipmentItem: vi.fn().mockResolvedValue(undefined),
  bulkUpdateEquipmentCategory: vi.fn().mockResolvedValue({ updated: 3 }),
  searchEquipmentItems: vi.fn().mockResolvedValue([]),
  getInventoryStats: vi.fn().mockResolvedValue({ totalItems: 5, totalCategories: 2, availableItems: 3, rentedItems: 2 }),
  createContactSubmission: vi.fn().mockResolvedValue({ id: 1 }),
  listContactSubmissions: vi.fn().mockResolvedValue([]),
  markSubmissionRead: vi.fn().mockResolvedValue(undefined),
  deleteContactSubmission: vi.fn().mockResolvedValue(undefined),
  getUnreadSubmissionCount: vi.fn().mockResolvedValue(0),
  createAnnouncement: vi.fn().mockResolvedValue({ id: 1 }),
  listAnnouncements: vi.fn().mockResolvedValue([]),
  getActiveAnnouncements: vi.fn().mockResolvedValue([]),
  updateAnnouncement: vi.fn().mockResolvedValue(undefined),
  deleteAnnouncement: vi.fn().mockResolvedValue(undefined),
  createSiteNotification: vi.fn().mockResolvedValue({ id: 1 }),
  listSiteNotifications: vi.fn().mockResolvedValue([]),
  getActiveSiteNotifications: vi.fn().mockResolvedValue([]),
  updateSiteNotification: vi.fn().mockResolvedValue(undefined),
  deleteSiteNotification: vi.fn().mockResolvedValue(undefined),
  getManualsByItem: vi.fn().mockResolvedValue([]),
  createManual: vi.fn().mockResolvedValue({ id: 1 }),
  deleteManual: vi.fn().mockResolvedValue(undefined),
  createSupportTicket: vi.fn().mockResolvedValue({ id: 1 }),
  listSupportTickets: vi.fn().mockResolvedValue([]),
  updateSupportTicketStatus: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./sse", () => ({
  emitNewEquipment: vi.fn(),
  emitNewAnnouncement: vi.fn(),
  emitNewNotification: vi.fn(),
  emitNewPromotion: vi.fn(),
}));

vi.mock("./bulk-import", () => ({
  parseExcelBuffer: vi.fn(),
  bulkImportEquipmentWithImages: vi.fn(),
}));

vi.mock("./regenerate-descriptions", () => ({
  regenerateAllDescriptions: vi.fn(),
}));

// ─── Context helpers ─────────────────────────────────────────────────
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

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────
describe("Bulk Re-Categorise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock to default return value after clearAllMocks
    vi.mocked(db.bulkUpdateEquipmentCategory).mockResolvedValue({ updated: 3 });
  });

  describe("equipment.bulkUpdateCategory", () => {
    it("moves multiple items to a new category as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.bulkUpdateCategory({
        ids: [1, 2, 3],
        categoryId: 2,
        subCategoryId: null,
      });
      expect(result).toEqual({ updated: 3 });
      expect(vi.mocked(db.bulkUpdateEquipmentCategory)).toHaveBeenCalledWith([1, 2, 3], 2, null);
    });

    it("moves items to a new category with a sub-category", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.bulkUpdateCategory({
        ids: [5, 10, 15],
        categoryId: 1,
        subCategoryId: 7,
      });
      expect(result).toEqual({ updated: 3 });
      expect(vi.mocked(db.bulkUpdateEquipmentCategory)).toHaveBeenCalledWith([5, 10, 15], 1, 7);
    });

    it("passes null when subCategoryId is omitted", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await caller.equipment.bulkUpdateCategory({
        ids: [1],
        categoryId: 2,
      });
      expect(vi.mocked(db.bulkUpdateEquipmentCategory)).toHaveBeenCalledWith([1], 2, null);
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(
        caller.equipment.bulkUpdateCategory({ ids: [1, 2], categoryId: 1 })
      ).rejects.toThrow();
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(
        caller.equipment.bulkUpdateCategory({ ids: [1, 2], categoryId: 1 })
      ).rejects.toThrow();
    });

    it("rejects empty ids array", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.equipment.bulkUpdateCategory({ ids: [], categoryId: 1 })
      ).rejects.toThrow();
    });

    it("rejects arrays exceeding 500 items", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const tooMany = Array.from({ length: 501 }, (_, i) => i + 1);
      await expect(
        caller.equipment.bulkUpdateCategory({ ids: tooMany, categoryId: 1 })
      ).rejects.toThrow();
    });

    it("handles single item bulk update", async () => {
      vi.mocked(db.bulkUpdateEquipmentCategory).mockResolvedValueOnce({ updated: 1 });
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.equipment.bulkUpdateCategory({
        ids: [42],
        categoryId: 2,
        subCategoryId: 5,
      });
      expect(result).toEqual({ updated: 1 });
    });
  });
});
