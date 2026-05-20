import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", () => ({
  // Existing inventory mocks
  listCategories: vi.fn().mockResolvedValue([]),
  getCategoryById: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue({ id: 1 }),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  listEquipmentItems: vi.fn().mockResolvedValue([]),
  getEquipmentItemById: vi.fn().mockResolvedValue(null),
  createEquipmentItem: vi.fn().mockResolvedValue({ id: 1 }),
  updateEquipmentItem: vi.fn().mockResolvedValue(undefined),
  deleteEquipmentItem: vi.fn().mockResolvedValue(undefined),
  getInventoryStats: vi.fn().mockResolvedValue({ totalItems: 0, totalCategories: 0, availableItems: 0, rentedItems: 0 }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),

  // Contact submissions
  createContactSubmission: vi.fn().mockResolvedValue({ id: 1 }),
  listContactSubmissions: vi.fn().mockResolvedValue([
    {
      id: 1, name: "John Doe", email: "john@example.com", phone: "+852 1234 5678",
      company: "ABC Ltd", subject: "Quote Request", message: "Need 5 excavators",
      formType: "quote", isRead: false, createdAt: new Date(),
    },
    {
      id: 2, name: "Jane Smith", email: "jane@example.com", phone: null,
      company: null, subject: "General Inquiry", message: "Do you deliver to NT?",
      formType: "contact", isRead: true, createdAt: new Date(),
    },
  ]),
  markSubmissionRead: vi.fn().mockResolvedValue(undefined),
  deleteContactSubmission: vi.fn().mockResolvedValue(undefined),
  getUnreadSubmissionCount: vi.fn().mockResolvedValue(1),

  // Announcements
  createAnnouncement: vi.fn().mockResolvedValue({ id: 1 }),
  listAnnouncements: vi.fn().mockResolvedValue([
    {
      id: 1, title: "Holiday Hours", message: "We're closed on public holidays",
      type: "info", isActive: true, createdAt: new Date(),
    },
  ]),
  getActiveAnnouncements: vi.fn().mockResolvedValue([
    {
      id: 1, title: "Holiday Hours", message: "We're closed on public holidays",
      type: "info", isActive: true, createdAt: new Date(),
    },
  ]),
  updateAnnouncement: vi.fn().mockResolvedValue(undefined),
  deleteAnnouncement: vi.fn().mockResolvedValue(undefined),

  // Site notifications
  createSiteNotification: vi.fn().mockResolvedValue({ id: 1 }),
  listSiteNotifications: vi.fn().mockResolvedValue([
    {
      id: 1, title: "New Excavators", message: "CAT 320 now available",
      type: "new_equipment", isActive: true, createdAt: new Date(),
    },
  ]),
  getActiveSiteNotifications: vi.fn().mockResolvedValue([
    {
      id: 1, title: "New Excavators", message: "CAT 320 now available",
      type: "new_equipment", isActive: true, createdAt: new Date(),
    },
  ]),
  updateSiteNotification: vi.fn().mockResolvedValue(undefined),
  deleteSiteNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock notifyOwner
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
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

// ─── Contact Submissions ────────────────────────────────────────────
describe("contact submissions", () => {
  describe("submit (public)", () => {
    it("submits a contact form without auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.contact.submit({
        name: "Test User",
        email: "test@example.com",
        subject: "Test Subject",
        message: "Test message content",
        formType: "contact",
      });
      expect(result.success).toBe(true);
      expect(result.id).toBe(1);
    });

    it("submits a quote request", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.contact.submit({
        name: "Builder Co",
        email: "info@builder.com",
        phone: "+852 9876 5432",
        company: "Builder Co Ltd",
        subject: "Excavator Quote",
        message: "Need 3 excavators for 2 months",
        formType: "quote",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("list (admin only)", () => {
    it("lists submissions as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.contact.list();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("John Doe");
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.contact.list()).rejects.toThrow();
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(caller.contact.list()).rejects.toThrow();
    });
  });

  describe("unreadCount (admin only)", () => {
    it("returns unread count as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.contact.unreadCount();
      expect(result).toBe(1);
    });
  });

  describe("markRead (admin only)", () => {
    it("marks a submission as read", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.contact.markRead({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });

  describe("delete (admin only)", () => {
    it("deletes a submission as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.contact.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });
});

// ─── Announcements ──────────────────────────────────────────────────
describe("announcements", () => {
  describe("active (public)", () => {
    it("returns active announcements without auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.announcements.active();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Holiday Hours");
    });
  });

  describe("list (admin only)", () => {
    it("lists all announcements as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.announcements.list();
      expect(result).toHaveLength(1);
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.announcements.list()).rejects.toThrow();
    });
  });

  describe("create (admin only)", () => {
    it("creates an announcement as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.announcements.create({
        title: "New Promo",
        message: "20% off all rentals this week",
        type: "promo",
        isActive: true,
      });
      expect(result).toEqual({ id: 1 });
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(
        caller.announcements.create({ title: "Test", message: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("update (admin only)", () => {
    it("updates an announcement as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.announcements.update({ id: 1, title: "Updated Title" });
      expect(result).toEqual({ success: true });
    });
  });

  describe("delete (admin only)", () => {
    it("deletes an announcement as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.announcements.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });
});

// ─── Site Notifications ─────────────────────────────────────────────
describe("site notifications", () => {
  describe("active (public)", () => {
    it("returns active notifications without auth", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      const result = await caller.notifications.active();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New Excavators");
    });
  });

  describe("list (admin only)", () => {
    it("lists all notifications as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.notifications.list();
      expect(result).toHaveLength(1);
    });

    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createPublicContext());
      await expect(caller.notifications.list()).rejects.toThrow();
    });
  });

  describe("create (admin only)", () => {
    it("creates a notification as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.notifications.create({
        title: "New Drill Available",
        message: "Hilti TE 60 now in stock",
        type: "new_equipment",
        isActive: true,
      });
      expect(result).toEqual({ id: 1 });
    });

    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createRegularUserContext());
      await expect(
        caller.notifications.create({ title: "Test", message: "Test" })
      ).rejects.toThrow();
    });
  });

  describe("update (admin only)", () => {
    it("updates a notification as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.notifications.update({ id: 1, title: "Updated Notification" });
      expect(result).toEqual({ success: true });
    });
  });

  describe("delete (admin only)", () => {
    it("deletes a notification as admin", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.notifications.delete({ id: 1 });
      expect(result).toEqual({ success: true });
    });
  });
});
