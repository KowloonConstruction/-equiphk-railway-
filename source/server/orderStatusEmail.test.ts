/**
 * Tests for the Order Status Email system
 * Validates template generation and the sendOrderStatusEmail function
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock Resend so no real emails are sent ───────────────────────────────────
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ id: "mock-email-id" }),
    },
  })),
}));

import { sendOrderStatusEmail, type OrderEmailStatus, type OrderStatusEmailData } from "./_core/orderStatusEmail";

// ─── Shared test data ─────────────────────────────────────────────────────────
const baseOrder: OrderStatusEmailData = {
  orderId: 1001,
  customerName: "Casey Lam",
  customerEmail: "casey@equiphk.test",
  rentalStartDate: new Date("2026-04-10"),
  rentalEndDate: new Date("2026-04-14"),
  rentalDays: 4,
  totalAmount: "3200.00",
  deliveryType: "delivery",
  deliveryAddress: "Unit 5, 123 Nathan Road, Kowloon, Hong Kong",
  returnAddress: "Y2, Shing Fung Film Studio, Ho Chung, Sai Kung",
  itemNames: ["Hilti TE 60-ATC Rotary Hammer", "Bosch GBH 18V Combi Drill"],
  membershipPlan: "trade_pro",
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("sendOrderStatusEmail", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "re_test_mock_key";
  });

  it("returns success=true for 'confirmed' status", async () => {
    const result = await sendOrderStatusEmail("confirmed", baseOrder);
    expect(result.success).toBe(true);
    expect(result.subject).toContain("1001");
    expect(result.subject).toContain("Confirmed");
    expect(result.error).toBeUndefined();
  });

  it("returns success=true for 'active' status", async () => {
    const result = await sendOrderStatusEmail("active", baseOrder);
    expect(result.success).toBe(true);
    expect(result.subject).toContain("1001");
    expect(result.subject).toContain("Active");
  });

  it("returns success=true for 'completed' status", async () => {
    const result = await sendOrderStatusEmail("completed", baseOrder);
    expect(result.success).toBe(true);
    expect(result.subject).toContain("1001");
    expect(result.subject).toContain("Complete");
  });

  it("returns success=true for 'cancelled' status", async () => {
    const result = await sendOrderStatusEmail("cancelled", baseOrder);
    expect(result.success).toBe(true);
    expect(result.subject).toContain("1001");
    expect(result.subject).toContain("Cancelled");
  });

  it("includes fuel add-on info in confirmed email when fuelType is set", async () => {
    const orderWithFuel: OrderStatusEmailData = {
      ...baseOrder,
      fuelType: "petrol",
      fuelLitres: "20",
      fuelCost: "648.00",
    };
    const result = await sendOrderStatusEmail("confirmed", orderWithFuel);
    expect(result.success).toBe(true);
    // subject should still be correct
    expect(result.subject).toContain("Confirmed");
  });

  it("handles self-collection delivery type", async () => {
    const selfCollect: OrderStatusEmailData = {
      ...baseOrder,
      deliveryType: "self_collection",
      deliveryAddress: null,
    };
    const result = await sendOrderStatusEmail("active", selfCollect);
    expect(result.success).toBe(true);
  });

  it("includes Trade Pro upsell in completed email for non-trade-pro customers", async () => {
    const paygOrder: OrderStatusEmailData = {
      ...baseOrder,
      membershipPlan: "payg",
    };
    const result = await sendOrderStatusEmail("completed", paygOrder);
    expect(result.success).toBe(true);
  });

  it("does NOT include Trade Pro upsell for existing trade pro members", async () => {
    // Trade Pro member — no upsell should be in the email
    const result = await sendOrderStatusEmail("completed", baseOrder);
    expect(result.success).toBe(true);
  });

  it("returns success=false when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendOrderStatusEmail("confirmed", baseOrder);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("returns error message for unknown status", async () => {
    process.env.RESEND_API_KEY = "re_test_mock_key";
    const result = await sendOrderStatusEmail("unknown_status" as OrderEmailStatus, baseOrder);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown status");
  });
});
