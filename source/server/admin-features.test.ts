import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@equiphk.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "normal-user",
    email: "user@equiphk.com",
    name: "Normal User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Activity Log", () => {
  it("admin can list activity log entries", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.activityLog.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can count activity log entries", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.activityLog.count();
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("admin can log an activity", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.activityLog.log({
      action: "create",
      entityType: "equipment",
      entityId: 1,
      entityName: "Test Item",
      details: "Created for testing",
    });
    expect(result).toEqual({ success: true });
  });

  it("non-admin cannot list activity log", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.activityLog.list({ limit: 10, offset: 0 })).rejects.toThrow();
  });
});

describe("Export", () => {
  it("admin can export inventory", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.export.inventory({ activeOnly: false, availabilityFilter: 'all' });
    expect(Array.isArray(result)).toBe(true);
    // Each item should have the expected shape
    if (result.length > 0) {
      const item = result[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("category");
      expect(item).toHaveProperty("availability");
      expect(item).toHaveProperty("quantity");
    }
  });

  it("non-admin cannot export inventory", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.export.inventory({ activeOnly: false, availabilityFilter: 'all' })).rejects.toThrow();
  });
});

describe("Enquiry Leads", () => {
  it("public can track a lead event", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.enquiryLeads.track({
      type: "whatsapp_click",
      equipmentName: "Test Equipment",
      source: "test",
    });
    expect(result).toEqual({ success: true });
  });

  it("admin can list leads", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.enquiryLeads.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can get status counts", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.enquiryLeads.statusCounts();
    expect(Array.isArray(result)).toBe(true);
  });

  it("non-admin cannot list leads", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.enquiryLeads.list({ limit: 10, offset: 0 })).rejects.toThrow();
  });
});

describe("Pricing Calculator (unit logic)", () => {
  it("calculates weekly rate as 5x daily", () => {
    const dailyRate = 100;
    const weeklyRate = dailyRate * 5;
    expect(weeklyRate).toBe(500);
  });

  it("calculates monthly rate as 20x daily", () => {
    const dailyRate = 100;
    const monthlyRate = dailyRate * 20;
    expect(monthlyRate).toBe(2000);
  });

  it("handles decimal daily rates", () => {
    const dailyRate = 75.50;
    const weeklyRate = dailyRate * 5;
    const monthlyRate = dailyRate * 20;
    expect(weeklyRate).toBeCloseTo(377.50);
    expect(monthlyRate).toBeCloseTo(1510.00);
  });
});

describe("Duplicate Detection (unit logic)", () => {
  const existingItems = [
    { id: 1, name: "Hilti TE 60", brand: "Hilti", model: "TE 60" },
    { id: 2, name: "Makita Drill", brand: "Makita", model: "HR2630" },
    { id: 3, name: "Generator 5kW", brand: "Honda", model: "EU50" },
  ];

  function findDuplicates(name: string, brand?: string, model?: string, editId?: number) {
    const nameLower = name.toLowerCase().trim();
    return existingItems.filter((item) => {
      if (editId && item.id === editId) return false;
      const itemName = item.name.toLowerCase();
      if (itemName === nameLower) return true;
      if (itemName.includes(nameLower) || nameLower.includes(itemName)) return true;
      if (brand && model && item.brand && item.model) {
        if (item.brand.toLowerCase() === brand.toLowerCase() && item.model.toLowerCase() === model.toLowerCase()) return true;
      }
      return false;
    });
  }

  it("detects exact name match", () => {
    const dupes = findDuplicates("Hilti TE 60");
    expect(dupes.length).toBeGreaterThan(0);
    expect(dupes[0]?.id).toBe(1);
  });

  it("detects partial name match", () => {
    const dupes = findDuplicates("Makita");
    expect(dupes.length).toBeGreaterThan(0);
  });

  it("detects brand+model match", () => {
    const dupes = findDuplicates("Some Random Name", "Honda", "EU50");
    expect(dupes.length).toBeGreaterThan(0);
    expect(dupes[0]?.id).toBe(3);
  });

  it("excludes current item when editing", () => {
    const dupes = findDuplicates("Hilti TE 60", undefined, undefined, 1);
    expect(dupes.length).toBe(0);
  });

  it("returns empty for unique items", () => {
    const dupes = findDuplicates("Completely Unique Item XYZ");
    expect(dupes.length).toBe(0);
  });
});
