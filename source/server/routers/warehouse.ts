/**
 * Warehouse Router
 * Procedures for warehouse staff to view active orders, log equipment returns,
 * and record damage/repair/cleaning charges.
 */
import { z } from "zod";
import { router } from "../_core/trpc";
import { warehouseProcedure, managerProcedure } from "../_core/trpc";
import {
  getWarehouseOrders,
  getWarehouseOrderDetail,
  createReturnLog,
  getReturnLogByOrderId,
  markChargeSentToCustomer,
} from "../db";
import { sendReturnChargeEmail } from "../_core/orderStatusEmail";

export const warehouseRouter = router({
  /**
   * Count of orders in pending/confirmed/active status — used for the dashboard badge.
   */
  activeOrderCount: warehouseProcedure.query(async () => {
    const orders = await getWarehouseOrders();
    return orders.length;
  }),

  /**
   * Get all active/upcoming orders (Pending, Confirmed, Active).
   * Read-only for warehouse staff.
   */
  getActiveOrders: warehouseProcedure.query(async () => {
    return getWarehouseOrders();
  }),

  /**
   * Get full detail for a single order (read-only for warehouse).
   */
  getOrderDetail: warehouseProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return getWarehouseOrderDetail(input.orderId);
    }),

  /**
   * Log equipment return with condition assessment and optional charges.
   * This marks the order as Completed and optionally emails the customer.
   */
  logReturn: warehouseProcedure
    .input(
      z.object({
        orderId: z.number(),
        condition: z.enum(["excellent", "good", "fair", "damaged", "missing_items"]),
        overallNotes: z.string().optional(),
        charges: z
          .array(
            z.object({
              chargeType: z.enum(["damage", "repair", "cleaning", "missing_item", "other"]),
              description: z.string().min(1, "Description is required"),
              amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
              photoUrl: z.string().url().optional(),
            })
          )
          .default([]),
        sendChargeEmail: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Create return log and mark order as completed
      const { returnLogId, totalCharges } = await createReturnLog({
        orderId: input.orderId,
        condition: input.condition,
        overallNotes: input.overallNotes,
        completedByUserId: ctx.user.id,
        charges: input.charges,
      });

      // Get order details to send email
      const orderDetail = await getWarehouseOrderDetail(input.orderId);
      if (!orderDetail) {
        return { success: true, returnLogId, totalCharges, emailSent: false };
      }

      // Send email to customer
      let emailSent = false;
      if (input.sendChargeEmail && orderDetail.customerEmail) {
        try {
          await sendReturnChargeEmail({
            orderId: input.orderId,
            customerEmail: orderDetail.customerEmail,
            customerName: orderDetail.customerName,
            orderItems: (orderDetail.items ?? []).map((i: any) => ({
              equipmentName: i.equipmentName,
              quantity: i.quantity,
              rentalDays: i.rentalDays,
            })),
            condition: input.condition,
            overallNotes: input.overallNotes,
            charges: input.charges.map(c => ({
              chargeType: c.chargeType,
              description: c.description,
              amount: parseFloat(c.amount),
            })),
            totalCharges: parseFloat(totalCharges),
            rentalStartDate: orderDetail.rentalStartDate
              ? new Date(orderDetail.rentalStartDate).toLocaleDateString("en-HK")
              : undefined,
            rentalEndDate: orderDetail.rentalEndDate
              ? new Date(orderDetail.rentalEndDate).toLocaleDateString("en-HK")
              : undefined,
          });
          await markChargeSentToCustomer(returnLogId);
          emailSent = true;
        } catch (err) {
          console.error("[Warehouse] Failed to send charge email:", err);
        }
      }

      return { success: true, returnLogId, totalCharges, emailSent };
    }),

  /**
   * Get the return log + charges for an order (warehouse and admin).
   */
  getReturnLog: warehouseProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return getReturnLogByOrderId(input.orderId);
    }),

  /**
   * List orders with optional status filter — used by WarehouseOrders page.
   */
  listOrders: warehouseProcedure
    .input(z.object({ statusFilter: z.enum(["active", "confirmed", "all"]).default("active") }))
    .query(async ({ input }) => {
      const orders = await getWarehouseOrders();
      if (input.statusFilter === "all") return orders;
      return orders.filter((o: { status: string }) => o.status === input.statusFilter);
    }),

  /**
   * Complete return with number amounts — used by WarehouseOrders page.
   */
  completeReturn: warehouseProcedure
    .input(
      z.object({
        orderId: z.number(),
        condition: z.enum(["excellent", "good", "fair", "damaged", "missing_items"]),
        overallNotes: z.string().optional(),
        charges: z
          .array(
            z.object({
              chargeType: z.enum(["damage", "repair", "cleaning", "missing_item", "other"]),
              description: z.string().min(1),
              amount: z.number().positive(),
              photoUrl: z.string().url().optional(),
              photoUrls: z.array(z.string().url()).optional(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const chargesForLog = input.charges.map(c => ({
        chargeType: c.chargeType,
        description: c.description,
        amount: String(c.amount),
        photoUrl: c.photoUrl ?? (c.photoUrls?.[0] ?? undefined),
        photoUrls: c.photoUrls ?? (c.photoUrl ? [c.photoUrl] : []),
      }));
      const { returnLogId, totalCharges } = await createReturnLog({
        orderId: input.orderId,
        condition: input.condition,
        overallNotes: input.overallNotes,
        completedByUserId: ctx.user.id,
        charges: chargesForLog,
      });
      const orderDetail = await getWarehouseOrderDetail(input.orderId);
      if (!orderDetail) return { success: true, returnLogId, totalCharges, emailSent: false };
      let emailSent = false;
      if (orderDetail.customerEmail) {
        try {
          await sendReturnChargeEmail({
            orderId: input.orderId,
            customerEmail: orderDetail.customerEmail,
            customerName: orderDetail.customerName,
            orderItems: (orderDetail.items ?? []).map((i: { equipmentName: string; rentalDays: number }) => ({
              equipmentName: i.equipmentName,
              rentalDays: i.rentalDays,
            })),
            condition: input.condition,
            overallNotes: input.overallNotes,
            charges: input.charges.map(c => ({
              chargeType: c.chargeType,
              description: c.description,
              amount: c.amount,
              photoUrls: c.photoUrls ?? (c.photoUrl ? [c.photoUrl] : []),
            })),
            totalCharges: input.charges.reduce((sum, c) => sum + c.amount, 0),
            rentalStartDate: orderDetail.rentalStartDate
              ? new Date(orderDetail.rentalStartDate).toLocaleDateString("en-HK")
              : undefined,
            rentalEndDate: orderDetail.rentalEndDate
              ? new Date(orderDetail.rentalEndDate).toLocaleDateString("en-HK")
              : undefined,
          });
          await markChargeSentToCustomer(returnLogId);
          emailSent = true;
        } catch (err) {
          console.error("[Warehouse] Failed to send charge email:", err);
        }
      }
      return { success: true, returnLogId, totalCharges, emailSent };
    }),
});
