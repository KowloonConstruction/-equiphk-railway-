import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

// vi.mock is hoisted — item constants must be defined INSIDE the factory
// We use a factory function and re-export via vi.mocked() in tests.
vi.mock("./db", () => ({
  listEquipmentItems: vi.fn().mockResolvedValue([
    {
      id: 1, name: "Hilti TE 60", brand: "Hilti", model: "TE 60",
      description: "Existing description", specs: "Existing specs",
      dailyRate: "350.00", weeklyRate: "1200.00", monthlyRate: "3500.00",
      categoryId: 1, subCategoryId: null, pricingType: "fixed",
      imageUrl: null, condition: "good", availability: "available",
      quantity: 1, availableQty: 1, location: null, isActive: true, isFeatured: false,
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 2, name: "Bosch GBH 2-26", brand: "Bosch", model: "GBH 2-26",
      description: null, specs: null, dailyRate: null, weeklyRate: null, monthlyRate: null,
      categoryId: 1, subCategoryId: null, pricingType: "fixed",
      imageUrl: null, condition: "good", availability: "available",
      quantity: 1, availableQty: 1, location: null, isActive: true, isFeatured: false,
      createdAt: new Date(), updatedAt: new Date(),
    },
    {
      id: 3, name: "Generic Drill", brand: null, model: null,
      description: null, specs: null, dailyRate: null, weeklyRate: null, monthlyRate: null,
      categoryId: 1, subCategoryId: null, pricingType: "fixed",
      imageUrl: null, condition: "good", availability: "available",
      quantity: 1, availableQty: 1, location: null, isActive: true, isFeatured: false,
      createdAt: new Date(), updatedAt: new Date(),
    },
  ]),
  updateEquipmentItem: vi.fn().mockResolvedValue(undefined),
  // Other required db exports
  listCategories: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  listSubCategories: vi.fn().mockResolvedValue([]),
  listAllSubCategories: vi.fn().mockResolvedValue([]),
  listCategoriesWithSubCategories: vi.fn().mockResolvedValue([]),
  listAllCategoriesWithSubCategories: vi.fn().mockResolvedValue([]),
  createSubCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateSubCategory: vi.fn().mockResolvedValue(undefined),
  deleteSubCategory: vi.fn().mockResolvedValue(undefined),
  reorderSubCategories: vi.fn().mockResolvedValue({ updated: 0 }),
  getEquipmentItemById: vi.fn().mockResolvedValue(undefined),
  createEquipmentItem: vi.fn().mockResolvedValue({ id: 1 }),
  deleteEquipmentItem: vi.fn().mockResolvedValue(undefined),
  bulkUpdateEquipmentCategory: vi.fn().mockResolvedValue({ updated: 0 }),
  searchEquipmentItems: vi.fn().mockResolvedValue([]),
  getInventoryStats: vi.fn().mockResolvedValue({ totalItems: 3, totalCategories: 1, availableItems: 3, rentedItems: 0 }),
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

// Mock the LLM to return a predictable response
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          description: "AI-generated description",
          specifications: "Power: 800W | Weight: 3.2kg",
          suggestedDailyRate: 200,
          suggestedWeeklyRate: 800,
          suggestedMonthlyRate: 2500,
          keyFeatures: ["Feature 1", "Feature 2"],
        }),
      },
    }],
  }),
}));

// ─── Context helpers ─────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1, openId: "admin-user", email: "admin@equiphk.com",
    name: "Casey Admin", loginMethod: "manus", role: "admin",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
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
    id: 2, openId: "regular-user", email: "user@example.com",
    name: "Regular User", loginMethod: "manus", role: "user",
    createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ───────────────────────────────────────────────────────────
describe("Bulk AI Auto-Fill", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to defaults after clearAllMocks
    vi.mocked(db.listEquipmentItems).mockResolvedValue([
      {
        id: 1, name: "Hilti TE 60", brand: "Hilti", model: "TE 60",
        description: "Existing description", specs: "Existing specs",
        dailyRate: "350.00", weeklyRate: "1200.00", monthlyRate: "3500.00",
        categoryId: 1, subCategoryId: null, pricingType: "fixed",
        imageUrl: null, condition: "good", availability: "available",
        quantity: 1, availableQty: 1, location: null, isActive: true, isFeatured: false,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 2, name: "Bosch GBH 2-26", brand: "Bosch", model: "GBH 2-26",
        description: null, specs: null, dailyRate: null, weeklyRate: null, monthlyRate: null,
        categoryId: 1, subCategoryId: null, pricingType: "fixed",
        imageUrl: null, condition: "good", availability: "available",
        quantity: 1, availableQty: 1, location: null, isActive: true, isFeatured: false,
        createdAt: new Date(), updatedAt: new Date(),
      },
      {
        id: 3, name: "Generic Drill", brand: null, model: null,
        description: null, specs: null, dailyRate: null, weeklyRate: null, monthlyRate: null,
        categoryId: 1, subCategoryId: null, pricingType: "fixed",
        imageUrl: null, condition: "good", availability: "available",
        quantity: 1, availableQty: 1, location: null, isActive: true, isFeatured: false,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ] as any);
    vi.mocked(db.updateEquipmentItem).mockResolvedValue(undefined);
  });

  describe("admin.bulkAutoFillInfo", () => {
    it("only fills items missing data by default (overwrite=false)", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.admin.bulkAutoFillInfo({ overwrite: false, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      // itemWithData has all data → not in toFill list (overwrite=false)
      // itemMissingAll has brand+model → filled
      // itemNoBrandModel has no brand/model → skipped
      expect(result.batchCount).toBe(2); // only 2 items need filling
      expect(result.succeeded).toBe(1); // itemMissingAll
      expect(result.skipped).toBe(1);   // itemNoBrandModel
      expect(result.failed).toBe(0);
    });

    it("fills all items when overwrite=true", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.admin.bulkAutoFillInfo({ overwrite: true, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      // All 3 items processed; itemNoBrandModel still skipped (no brand/model)
      expect(result.batchCount).toBe(3);
      expect(result.succeeded).toBe(2); // itemWithData + itemMissingAll
      expect(result.skipped).toBe(1);   // itemNoBrandModel
      expect(result.failed).toBe(0);
    });

    it("calls updateEquipmentItem for items that need filling", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await caller.admin.bulkAutoFillInfo({ overwrite: false, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      // Only itemMissingAll should trigger an update
      expect(vi.mocked(db.updateEquipmentItem)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(db.updateEquipmentItem)).toHaveBeenCalledWith(
        2, // itemMissingAll.id
        expect.objectContaining({
          description: "AI-generated description",
          specs: "Power: 800W | Weight: 3.2kg",
          dailyRate: "200",
        })
      );
    });

    it("does not overwrite existing fields when overwrite=false", async () => {
      // itemWithData has all fields filled — should not be in toFill
      const caller = appRouter.createCaller(createAdminContext());
      await caller.admin.bulkAutoFillInfo({ overwrite: false, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      const calls = vi.mocked(db.updateEquipmentItem).mock.calls;
      const updatedIds = calls.map((c) => c[0]);
      expect(updatedIds).not.toContain(1); // itemWithData.id = 1
    });

    it("overwrites existing fields when overwrite=true", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await caller.admin.bulkAutoFillInfo({ overwrite: true, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      const calls = vi.mocked(db.updateEquipmentItem).mock.calls;
      const updatedIds = calls.map((c) => c[0]);
      expect(updatedIds).toContain(1); // itemWithData.id = 1
    });

    it("skips items with no brand and no model", async () => {
      const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.bulkAutoFillInfo({ overwrite: true, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      const skippedItem = result.results.find((r) => r.id === 3); // itemNoBrandModel.id = 3
      expect(skippedItem?.status).toBe("skip");
    });

    it("returns error status when AI call fails", async () => {
      const { invokeLLM } = await import("./_core/llm");
      vi.mocked(invokeLLM).mockRejectedValueOnce(new Error("LLM timeout"));
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.admin.bulkAutoFillInfo({ overwrite: false, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      const failedItem = result.results.find((r) => r.id === 2); // itemMissingAll.id = 2
      expect(failedItem?.status).toBe("error");
      expect(result.failed).toBe(1);
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.admin.bulkAutoFillInfo({ overwrite: false })).rejects.toThrow();
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(caller.admin.bulkAutoFillInfo({ overwrite: false })).rejects.toThrow();
    });

    it("returns structured result with total, succeeded, failed, skipped counts", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.admin.bulkAutoFillInfo({ overwrite: false, fields: { description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true } });
      expect(result).toHaveProperty("batchCount");
      expect(result).toHaveProperty("succeeded");
      expect(result).toHaveProperty("failed");
      expect(result).toHaveProperty("skipped");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("results");
      expect(Array.isArray(result.results)).toBe(true);
    });
  });
});
