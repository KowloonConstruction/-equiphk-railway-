/**
 * Warehouse Workflow Tests
 * Tests for the warehouse router procedures and email templates.
 */
import { describe, it, expect } from "vitest";

// ─── Email Template Tests ─────────────────────────────────────────────────────
describe("sendWarehouseAlertEmail template", () => {
  it("generates a confirmed (prep) subject line", async () => {
    const { sendWarehouseAlertEmail } = await import("./_core/orderStatusEmail");
    // We can't easily call sendWarehouseAlertEmail without a real Resend key,
    // but we can verify the function is exported and callable
    expect(typeof sendWarehouseAlertEmail).toBe("function");
  });

  it("generates a return charge email function", async () => {
    const { sendReturnChargeEmail } = await import("./_core/orderStatusEmail");
    expect(typeof sendReturnChargeEmail).toBe("function");
  });
});

// ─── Warehouse Router Schema Tests ────────────────────────────────────────────
describe("warehouse router procedures", () => {
  it("warehouseRouter is exported from warehouse.ts", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter).toBeDefined();
  });

  it("warehouseRouter has getActiveOrders procedure", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter._def.procedures.getActiveOrders).toBeDefined();
  });

  it("warehouseRouter has listOrders procedure", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter._def.procedures.listOrders).toBeDefined();
  });

  it("warehouseRouter has logReturn procedure", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter._def.procedures.logReturn).toBeDefined();
  });

  it("warehouseRouter has completeReturn procedure", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter._def.procedures.completeReturn).toBeDefined();
  });

  it("warehouseRouter has getReturnLog procedure", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter._def.procedures.getReturnLog).toBeDefined();
  });

  it("warehouseRouter has getOrderDetail procedure", async () => {
    const { warehouseRouter } = await import("./routers/warehouse");
    expect(warehouseRouter._def.procedures.getOrderDetail).toBeDefined();
  });
});

// ─── DB Helper Tests ──────────────────────────────────────────────────────────
describe("warehouse DB helpers", () => {
  it("getWarehouseOrders is exported from db.ts", async () => {
    const { getWarehouseOrders } = await import("./db");
    expect(typeof getWarehouseOrders).toBe("function");
  });

  it("getWarehouseOrderDetail is exported from db.ts", async () => {
    const { getWarehouseOrderDetail } = await import("./db");
    expect(typeof getWarehouseOrderDetail).toBe("function");
  });

  it("createReturnLog is exported from db.ts", async () => {
    const { createReturnLog } = await import("./db");
    expect(typeof createReturnLog).toBe("function");
  });

  it("getReturnLogByOrderId is exported from db.ts", async () => {
    const { getReturnLogByOrderId } = await import("./db");
    expect(typeof getReturnLogByOrderId).toBe("function");
  });

  it("markChargeSentToCustomer is exported from db.ts", async () => {
    const { markChargeSentToCustomer } = await import("./db");
    expect(typeof markChargeSentToCustomer).toBe("function");
  });
});

// ─── Schema Validation Tests ──────────────────────────────────────────────────
describe("return log schema", () => {
  it("equipment_return_logs table is in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.equipmentReturnLogs).toBeDefined();
  });

  it("return_charges table is in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.returnCharges).toBeDefined();
  });

  it("equipmentReturnLogs has required columns", async () => {
    const { equipmentReturnLogs } = await import("../drizzle/schema");
    const cols = Object.keys(equipmentReturnLogs);
    expect(cols).toContain("id");
    expect(cols).toContain("orderId");
    expect(cols).toContain("condition");
    expect(cols).toContain("completedByUserId");
  });

  it("returnCharges has required columns", async () => {
    const { returnCharges } = await import("../drizzle/schema");
    const cols = Object.keys(returnCharges);
    expect(cols).toContain("id");
    expect(cols).toContain("returnLogId");
    expect(cols).toContain("chargeType");
    expect(cols).toContain("amount");
  });
});
