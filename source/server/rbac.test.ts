/**
 * RBAC Tests — Role-Based Access Control
 * Tests that admin, manager, warehouse, and user roles have correct access
 */
import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import { TRPCError } from "@trpc/server";

// ─── Context factories ────────────────────────────────────────────────────────

function createContext(role: "admin" | "manager" | "warehouse" | "user") {
  return {
    user: {
      id: role === "admin" ? 1 : role === "manager" ? 2 : role === "warehouse" ? 3 : 4,
      openId: `test-${role}`,
      name: `Test ${role}`,
      email: `${role}@equiphk.test`,
      role,
      loginMethod: "test",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };
}

// ─── Team Router Tests ────────────────────────────────────────────────────────

describe("RBAC: team.listAll", () => {
  it("admin can list all users", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    // Should not throw (may return empty array in test env)
    const result = await caller.team.listAll({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("manager cannot list all users", async () => {
    const caller = appRouter.createCaller(createContext("manager"));
    await expect(caller.team.listAll({})).rejects.toThrow();
  });

  it("warehouse cannot list all users", async () => {
    const caller = appRouter.createCaller(createContext("warehouse"));
    await expect(caller.team.listAll({})).rejects.toThrow();
  });

  it("user cannot list all users", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.team.listAll({})).rejects.toThrow();
  });
});

describe("RBAC: team.updateRole", () => {
  it("admin can update a user's role", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    // Updating a different user (id 99 won't exist but the procedure should pass auth check)
    // We just check it doesn't throw FORBIDDEN
    try {
      await caller.team.updateRole({ userId: 99, role: "manager" });
    } catch (err: any) {
      // Acceptable: DB error (user not found) but NOT a FORBIDDEN error
      expect(err?.code).not.toBe("FORBIDDEN");
    }
  });

  it("manager cannot update roles", async () => {
    const caller = appRouter.createCaller(createContext("manager"));
    await expect(caller.team.updateRole({ userId: 99, role: "warehouse" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("warehouse cannot update roles", async () => {
    const caller = appRouter.createCaller(createContext("warehouse"));
    await expect(caller.team.updateRole({ userId: 99, role: "manager" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("admin cannot change their own role away from admin", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    // Admin id is 1 in our test context
    await expect(caller.team.updateRole({ userId: 1, role: "manager" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});

// ─── Membership / Orders access ──────────────────────────────────────────────

describe("RBAC: membership.adminListOrders", () => {
  it("admin can list orders", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.membership.adminListOrders({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("manager can list orders", async () => {
    const caller = appRouter.createCaller(createContext("manager"));
    const result = await caller.membership.adminListOrders({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("warehouse cannot list orders", async () => {
    const caller = appRouter.createCaller(createContext("warehouse"));
    await expect(caller.membership.adminListOrders({ limit: 10, offset: 0 })).rejects.toThrow();
  });

  it("user cannot list orders", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.membership.adminListOrders({ limit: 10, offset: 0 })).rejects.toThrow();
  });
});

describe("RBAC: membership.adminListMembers", () => {
  it("admin can list members", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    const result = await caller.membership.adminListMembers({ plan: "all", limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("manager can list members", async () => {
    const caller = appRouter.createCaller(createContext("manager"));
    const result = await caller.membership.adminListMembers({ plan: "all", limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("warehouse cannot list members", async () => {
    const caller = appRouter.createCaller(createContext("warehouse"));
    await expect(caller.membership.adminListMembers({ plan: "all", limit: 10, offset: 0 })).rejects.toThrow();
  });
});

// ─── Category management (admin + warehouse) ─────────────────────────────────

describe("RBAC: categories.create (admin only)", () => {
  it("admin can create a category", async () => {
    const caller = appRouter.createCaller(createContext("admin"));
    try {
      await caller.categories.create({
        name: "Test Category",
        slug: "test-category-rbac",
        segment: "both",
        sortOrder: 0,
        isActive: true,
      });
    } catch (err: any) {
      // DB errors are fine, just not FORBIDDEN
      expect(err?.code).not.toBe("FORBIDDEN");
    }
  });

  it("manager cannot create a category", async () => {
    const caller = appRouter.createCaller(createContext("manager"));
    await expect(
      caller.categories.create({
        name: "Test",
        slug: "test-slug-rbac",
        segment: "both",
        sortOrder: 0,
        isActive: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("warehouse cannot create a category (admin only)", async () => {
    const caller = appRouter.createCaller(createContext("warehouse"));
    await expect(
      caller.categories.create({
        name: "Test",
        slug: "test-slug-rbac-wh",
        segment: "both",
        sortOrder: 0,
        isActive: true,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
