/**
 * Membership & Rental Orders Router
 * Handles: registration, HKID upload, Stripe checkout, order creation,
 * discount logic, WhatsApp + email notifications to admin
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router, adminProcedure, managerProcedure } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { storagePut } from "../storage";
import { getDb } from "../db";
import {
  userMemberships,
  rentalOrders,
  rentalOrderItems,
  users,
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import Stripe from "stripe";
import {
  DELIVERY_FEE_HKD,
  FREE_DELIVERY_THRESHOLD_HKD,
  DEPOSIT_WAIVER_THRESHOLD_HKD,
  TRADE_PRO_DISCOUNT_STANDARD,
  TRADE_PRO_DISCOUNT_MONTHLY,
  MONTHLY_RENTAL_THRESHOLD_DAYS,
  RETURN_ADDRESS,
  ADMIN_WHATSAPP,
} from "../stripe-products";
import { sendOrderStatusEmail, sendWarehouseAlertEmail, type OrderEmailStatus } from "../_core/orderStatusEmail";
import { sendDepositReleasedEmail } from "../_core/email";
import { orderEmailLogs, rentalOrderItems as _rentalOrderItemsAlias, equipmentItems } from "../../drizzle/schema";

// ─── Stripe client (lazy init) ────────────────────────────────────────────────
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
    apiVersion: "2025-03-31.basil",
  });
}

// ─── Email helper via notifyOwner ─────────────────────────────────────────────
async function sendAdminNotification(subject: string, body: string) {
  try {
    await notifyOwner({ title: subject, content: body.slice(0, 500) });
  } catch (err) {
    console.warn("[Notification] Failed:", err);
  }
}

// ─── WhatsApp URL builder ─────────────────────────────────────────────────────
function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${ADMIN_WHATSAPP.replace(/\+/g, "")}?text=${encodeURIComponent(message)}`;
}

// ─── Discount calculator ──────────────────────────────────────────────────────
export function calculateDiscount(plan: "payg" | "trade_pro", rentalDays: number): number {
  if (plan !== "trade_pro") return 0;
  return rentalDays >= MONTHLY_RENTAL_THRESHOLD_DAYS
    ? TRADE_PRO_DISCOUNT_MONTHLY
    : TRADE_PRO_DISCOUNT_STANDARD;
}

// ─── DB helper that throws on unavailable ────────────────────────────────────
async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

export const membershipRouter = router({
  // ─── Get current user's membership ────────────────────────────────────────
  getMyMembership: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = await requireDb();
    const [membership] = await db
      .select()
      .from(userMemberships)
      .where(eq(userMemberships.userId, ctx.user.id))
      .limit(1);
    return membership ?? null;
  }),

  // ─── Register / create membership ─────────────────────────────────────────
  register: publicProcedure
    .input(
      z.object({
        plan: z.enum(["payg", "trade_pro"]),
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(8),
        companyName: z.string().optional(),
        businessRegNo: z.string().optional(),
        monthlyBudget: z.string().optional(),
        hkidNumber: z.string().optional(),
        hkidPhotoBase64: z.string().optional(),
        hkidPhotoMime: z.string().optional(),
        customerNotes: z.string().optional(),
        origin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Please log in to register" });
      }

      const db = await requireDb();

      // Check if membership already exists
      const [existing] = await db
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have a membership" });
      }

      // Upload HKID photo if provided
      let hkidPhotoUrl: string | undefined;
      let hkidPhotoKey: string | undefined;

      if (input.hkidPhotoBase64 && input.hkidPhotoMime) {
        try {
          const buffer = Buffer.from(input.hkidPhotoBase64, "base64");
          const ext = input.hkidPhotoMime.split("/")[1] ?? "jpg";
          const key = `hkid/${ctx.user.id}-${Date.now()}.${ext}`;
          const { url, key: savedKey } = await storagePut(key, buffer, input.hkidPhotoMime);
          hkidPhotoUrl = url;
          hkidPhotoKey = savedKey;
        } catch (err) {
          console.warn("[HKID Upload] Failed:", err);
        }
      }

      // Create Stripe customer
      let stripeCustomerId: string | undefined;
      try {
        const stripe = getStripe();
        const customer = await stripe.customers.create({
          name: input.fullName,
          email: input.email,
          phone: input.phone,
          metadata: {
            userId: String(ctx.user.id),
            plan: input.plan,
            companyName: input.companyName ?? "",
          },
        });
        stripeCustomerId = customer.id;
      } catch (err) {
        console.warn("[Stripe] Customer creation failed:", err);
      }

      // Insert membership record
      const [newMembership] = await db
        .insert(userMemberships)
        .values({
          userId: ctx.user.id,
          plan: input.plan,
          status: "active",
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          companyName: input.companyName,
          businessRegNo: input.businessRegNo,
          monthlyBudget: input.monthlyBudget,
          hkidNumber: input.hkidNumber,
          hkidPhotoUrl,
          hkidPhotoKey,
          hkidVerified: false,
          stripeCustomerId,
          membershipFee: input.plan === "trade_pro" ? "499.00" : "0.00",
          returnAddress: RETURN_ADDRESS,
        })
        .$returningId();

      // Notify admin
      const planLabel = input.plan === "trade_pro" ? "Trade Pro" : "Pay-As-You-Go";
      const waMsg = `🎉 New EquipHK Registration\n\nPlan: ${planLabel}\nName: ${input.fullName}\nEmail: ${input.email}\nPhone: ${input.phone}${input.companyName ? `\nCompany: ${input.companyName}` : ""}\n\nHKID: ${input.hkidNumber ? "✅ Provided" : "❌ Not provided"}\nHKID Photo: ${hkidPhotoUrl ? "✅ Uploaded" : "❌ Not uploaded"}\n\nView in Admin: ${input.origin ?? "equip.hk"}/admin/members`;

      await sendAdminNotification(
        `New ${planLabel} Registration — ${input.fullName}`,
        `Plan: ${planLabel} | Name: ${input.fullName} | Email: ${input.email} | Phone: ${input.phone}${input.companyName ? ` | Company: ${input.companyName}` : ""} | HKID: ${input.hkidNumber ?? "Not provided"}`
      );

      return {
        success: true,
        membershipId: newMembership.id,
        plan: input.plan,
        whatsappAdminUrl: buildWhatsAppUrl(waMsg),
      };
    }),

  // ─── Upgrade to Trade Pro ──────────────────────────────────────────────────
  upgradeToPro: publicProcedure
    .input(z.object({ origin: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const db = await requireDb();

      const [membership] = await db
        .select()
        .from(userMemberships)
        .where(eq(userMemberships.userId, ctx.user.id))
        .limit(1);

      if (!membership) throw new TRPCError({ code: "NOT_FOUND", message: "No membership found" });
      if (membership.plan === "trade_pro") throw new TRPCError({ code: "CONFLICT", message: "Already on Trade Pro" });

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: membership.stripeCustomerId ?? undefined,
        customer_email: membership.stripeCustomerId ? undefined : membership.email,
        line_items: [
          {
            price_data: {
              currency: "hkd",
              product_data: {
                name: "EquipHK Trade Pro Membership",
                description: "10–15% off all rental rates, priority booking, waived deposits, free delivery on orders over HK$500",
              },
              unit_amount: 49900,
              recurring: { interval: "month" },
            },
            quantity: 1,
          },
        ],
        success_url: `${input.origin ?? "https://equip.hk"}/account?upgrade=success`,
        cancel_url: `${input.origin ?? "https://equip.hk"}/account?upgrade=cancelled`,
        allow_promotion_codes: true,
        client_reference_id: String(ctx.user.id),
        metadata: {
          user_id: String(ctx.user.id),
          membership_id: String(membership.id),
          action: "upgrade_to_trade_pro",
        },
      });

      return { checkoutUrl: session.url };
    }),

  // ─── Calculate order pricing ───────────────────────────────────────────────
  calculatePricing: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            equipmentItemId: z.number(),
            name: z.string(),
            brand: z.string().optional(),
            dailyRate: z.number(),
            rentalDays: z.number(),
          })
        ),
        deliveryType: z.enum(["delivery", "self_collection"]),
        plan: z.enum(["payg", "trade_pro"]).default("payg"),
      })
    )
    .query(({ input }) => {
      let subtotal = 0;
      const lineItems = input.items.map((item) => {
        const lineTotal = item.dailyRate * item.rentalDays;
        const discountPct = calculateDiscount(input.plan, item.rentalDays);
        const discountedTotal = lineTotal * (1 - discountPct / 100);
        subtotal += lineTotal;
        return { ...item, lineTotal, discountPct, discountedTotal };
      });

      const maxDiscount = lineItems.length > 0 ? Math.max(...lineItems.map((i) => i.discountPct)) : 0;
      const discountAmount = subtotal * (maxDiscount / 100);
      const discountedSubtotal = subtotal - discountAmount;

      const deliveryFee =
        input.deliveryType === "delivery"
          ? input.plan === "trade_pro" && discountedSubtotal >= FREE_DELIVERY_THRESHOLD_HKD
            ? 0
            : DELIVERY_FEE_HKD
          : 0;

      const allUnderThreshold = input.items.every(
        (item) => item.dailyRate * item.rentalDays < DEPOSIT_WAIVER_THRESHOLD_HKD
      );
      const depositWaived = input.plan === "trade_pro" && allUnderThreshold;
      const depositAmount = depositWaived ? 0 : subtotal * 0.2;

      const totalAmount = discountedSubtotal + deliveryFee + depositAmount;

      return {
        subtotal,
        discountPercent: maxDiscount,
        discountAmount,
        discountedSubtotal,
        deliveryFee,
        depositAmount,
        depositWaived,
        totalAmount,
        lineItems,
        freeDelivery: input.plan === "trade_pro" && discountedSubtotal >= FREE_DELIVERY_THRESHOLD_HKD,
      };
    }),

  // ─── Create rental order + Stripe checkout ────────────────────────────────
  createOrder: publicProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            equipmentItemId: z.number(),
            name: z.string(),
            brand: z.string().optional(),
            dailyRate: z.number(),
            rentalDays: z.number(),
          })
        ),
        rentalStartDate: z.string(),
        rentalEndDate: z.string(),
        deliveryType: z.enum(["delivery", "self_collection"]),
        deliveryAddress: z.string().optional(),
        customerName: z.string().min(2),
        customerEmail: z.string().email(),
        customerPhone: z.string().min(8),
        companyName: z.string().optional(),
        hkidNumber: z.string().optional(),
        hkidPhotoUrl: z.string().optional(),
        customerNotes: z.string().optional(),
        // Delivery / collection scheduling
        deliverySlotDate: z.string().optional(),  // ISO date string
        deliverySlotTime: z.enum(["morning", "afternoon", "evening"]).optional(),
        collectionSlotDate: z.string().optional(),
        collectionSlotTime: z.enum(["morning", "afternoon", "evening"]).optional(),
        // Fuel add-on
        fuelType: z.enum(["none", "petrol", "diesel"]).optional(),
        fuelLitres: z.number().min(0).optional(),
        fuelPricePerLitre: z.number().min(0).optional(),
        fuelCost: z.number().min(0).optional(),
        origin: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();

      // Determine plan
      let plan: "payg" | "trade_pro" = "payg";
      let membershipId: number | undefined;
      if (ctx.user) {
        const [membership] = await db
          .select()
          .from(userMemberships)
          .where(and(eq(userMemberships.userId, ctx.user.id), eq(userMemberships.status, "active")))
          .limit(1);
        if (membership) {
          plan = membership.plan;
          membershipId = membership.id;
        }
      }

      // Calculate pricing
      let subtotal = 0;
      const maxRentalDays = Math.max(...input.items.map((i) => i.rentalDays));
      const discountPct = calculateDiscount(plan, maxRentalDays);
      const lineItems = input.items.map((item) => {
        const lineTotal = item.dailyRate * item.rentalDays;
        const discountedTotal = lineTotal * (1 - discountPct / 100);
        subtotal += lineTotal;
        return { ...item, lineTotal, discountedTotal };
      });

      const discountAmount = subtotal * (discountPct / 100);
      const discountedSubtotal = subtotal - discountAmount;

      const allUnderThreshold = input.items.every(
        (i) => i.dailyRate * i.rentalDays < DEPOSIT_WAIVER_THRESHOLD_HKD
      );
      const depositWaived = plan === "trade_pro" && allUnderThreshold;
      const depositAmount = depositWaived ? 0 : subtotal * 0.2;

      const deliveryFee =
        input.deliveryType === "delivery"
          ? plan === "trade_pro" && discountedSubtotal >= FREE_DELIVERY_THRESHOLD_HKD
            ? 0
            : DELIVERY_FEE_HKD
          : 0;

      // Deposit is handled via pre-auth (card hold) — NOT included in checkout total
      const totalAmount = discountedSubtotal + deliveryFee;
      const rentalDays = maxRentalDays;

      // Insert order record
      const [newOrder] = await db
        .insert(rentalOrders)
        .values({
          userId: ctx.user?.id,
          membershipId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          companyName: input.companyName,
          membershipPlan: plan,
          rentalStartDate: new Date(input.rentalStartDate),
          rentalEndDate: new Date(input.rentalEndDate),
          rentalDays,
          subtotal: String(subtotal.toFixed(2)),
          discountPercent: String(discountPct),
          discountAmount: String(discountAmount.toFixed(2)),
          deliveryFee: String(deliveryFee.toFixed(2)),
          depositAmount: String(depositAmount.toFixed(2)),
          depositWaived,
          // depositStatus starts as 'none' — will be set to 'pending' after checkout completes
          depositStatus: depositWaived ? "none" : "pending",
          totalAmount: String((totalAmount + (input.fuelCost ?? 0)).toFixed(2)),
          deliveryType: input.deliveryType,
          deliveryAddress: input.deliveryAddress,
          returnAddress: RETURN_ADDRESS,
          status: "pending_payment",
          hkidNumber: input.hkidNumber,
          hkidPhotoUrl: input.hkidPhotoUrl,
          customerNotes: input.customerNotes,
          // Delivery scheduling
          deliverySlotDate: input.deliverySlotDate ? new Date(input.deliverySlotDate) : undefined,
          deliverySlotTime: input.deliverySlotTime,
          collectionSlotDate: input.collectionSlotDate ? new Date(input.collectionSlotDate) : undefined,
          collectionSlotTime: input.collectionSlotTime,
          // Fuel add-on
          fuelType: input.fuelType ?? "none",
          fuelLitres: input.fuelLitres ? String(input.fuelLitres.toFixed(2)) : undefined,
          fuelPricePerLitre: input.fuelPricePerLitre ? String(input.fuelPricePerLitre.toFixed(2)) : undefined,
          fuelCost: input.fuelCost ? String(input.fuelCost.toFixed(2)) : "0",
        })
        .$returningId();

      const orderId = newOrder.id;

      // Insert line items
      await db.insert(rentalOrderItems).values(
        lineItems.map((li) => ({
          orderId,
          equipmentItemId: li.equipmentItemId,
          equipmentName: li.name,
          equipmentBrand: li.brand,
          rentalDays: li.rentalDays,
          dailyRate: String(li.dailyRate.toFixed(2)),
          lineTotal: String(li.lineTotal.toFixed(2)),
          discountedTotal: String(li.discountedTotal.toFixed(2)),
        }))
      );

      // Build Stripe line items
      const stripeLineItems: Array<{
        price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number };
        quantity: number;
      }> = lineItems.map((li) => ({
        price_data: {
          currency: "hkd",
          product_data: {
            name: `${li.name} — ${li.rentalDays} day${li.rentalDays > 1 ? "s" : ""} rental`,
            description: li.brand ?? undefined,
          },
          unit_amount: Math.round(li.discountedTotal * 100),
        },
        quantity: 1,
      }));

      if (deliveryFee > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "hkd",
            product_data: { name: "Delivery Fee" },
            unit_amount: deliveryFee * 100,
          },
          quantity: 1,
        });
      }

      // NOTE: Deposit is handled via a separate Stripe pre-auth (card hold) — NOT charged at checkout.
      // A PaymentIntent with capture_method: manual is created after payment succeeds (see webhook).

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: stripeLineItems,
        customer_email: input.customerEmail,
        success_url: `${input.origin}/booking-confirmation?orderId=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/cart?cancelled=1`,
        allow_promotion_codes: true,
        client_reference_id: String(orderId),
        metadata: {
          order_id: String(orderId),
          user_id: ctx.user ? String(ctx.user.id) : "",
          customer_email: input.customerEmail,
          customer_name: input.customerName,
          plan,
        },
        invoice_creation: { enabled: true },
      });

      // Update order with Stripe session ID
      await db
        .update(rentalOrders)
        .set({ stripeCheckoutSessionId: session.id })
        .where(eq(rentalOrders.id, orderId));

      // Notify admin of new booking
      const itemList = lineItems.map((li) => `• ${li.name} (${li.rentalDays} days)`).join("\n");
      const waMsg = `📦 New EquipHK Booking\n\nOrder #${orderId}\nCustomer: ${input.customerName}\nEmail: ${input.customerEmail}\nPhone: ${input.customerPhone}\nPlan: ${plan === "trade_pro" ? "Trade Pro" : "Pay-As-You-Go"}\n\nItems:\n${itemList}\n\nTotal: HK$${totalAmount.toFixed(2)}\nDelivery: ${input.deliveryType === "delivery" ? "Delivery" : "Self-Collection"}\nStart: ${input.rentalStartDate}\nEnd: ${input.rentalEndDate}\n\nStatus: Awaiting Payment`;

      await sendAdminNotification(
        `New Rental Order #${orderId} — ${input.customerName}`,
        `Order #${orderId} | Customer: ${input.customerName} (${input.customerEmail}) | Plan: ${plan} | Total: HK$${totalAmount.toFixed(2)} | Items: ${lineItems.map((li) => li.name).join(", ")}`
      );

      return { checkoutUrl: session.url, orderId, whatsappAdminUrl: buildWhatsAppUrl(waMsg) };
    }),

  // ─── Get order by ID ───────────────────────────────────────────────────────
  getOrder: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const [order] = await db
        .select()
        .from(rentalOrders)
        .where(eq(rentalOrders.id, input.orderId))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      if (ctx.user?.role !== "admin" && order.userId !== ctx.user?.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const items = await db
        .select()
        .from(rentalOrderItems)
        .where(eq(rentalOrderItems.orderId, input.orderId));

      return { ...order, items };
    }),

  // ─── Get my orders ─────────────────────────────────────────────────────────
  getMyOrders: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return [];
    const db = await requireDb();
    return db
      .select()
      .from(rentalOrders)
      .where(eq(rentalOrders.userId, ctx.user.id))
      .orderBy(desc(rentalOrders.createdAt));
  }),

  // ─── Admin: list all members ───────────────────────────────────────────────
  adminListMembers: managerProcedure
    .input(
      z.object({
        plan: z.enum(["payg", "trade_pro", "all"]).default("all"),
        limit: z.number().default(100),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select({
          membership: userMemberships,
          user: { id: users.id, email: users.email, role: users.role, createdAt: users.createdAt },
        })
        .from(userMemberships)
        .leftJoin(users, eq(userMemberships.userId, users.id))
        .orderBy(desc(userMemberships.createdAt))
        .limit(input?.limit ?? 100)
        .offset(input?.offset ?? 0);
    }),

  // ─── Admin: list all rental orders ────────────────────────────────────────
  adminListOrders: managerProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(rentalOrders)
        .orderBy(desc(rentalOrders.createdAt))
        .limit(input?.limit ?? 100)
        .offset(input?.offset ?? 0);
    }),

  // ─── Admin: update order status ────────────────────────────────────────────
  adminUpdateOrderStatus: managerProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending_payment", "paid", "confirmed", "active", "completed", "cancelled", "refunded"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      // 1. Update the order status
      await db
        .update(rentalOrders)
        .set({ status: input.status, adminNotes: input.adminNotes })
        .where(eq(rentalOrders.id, input.orderId));

      // 2. Send email notification for customer-facing status changes
      const emailStatuses: OrderEmailStatus[] = ["confirmed", "active", "completed", "cancelled"];
      if (emailStatuses.includes(input.status as OrderEmailStatus)) {
        // Fetch full order details
        const [order] = await db
          .select()
          .from(rentalOrders)
          .where(eq(rentalOrders.id, input.orderId))
          .limit(1);

        if (order) {
          // Fetch order items with equipment names
          const items = await db
            .select({ name: equipmentItems.name })
            .from(_rentalOrderItemsAlias)
            .leftJoin(equipmentItems, eq(_rentalOrderItemsAlias.equipmentItemId, equipmentItems.id))
            .where(eq(_rentalOrderItemsAlias.orderId, input.orderId));

          const itemNames = items.map((i) => i.name ?? "Unknown Item");

          // Send the status email (non-blocking — don't fail the mutation if email fails)
          const emailResult = await sendOrderStatusEmail(input.status as OrderEmailStatus, {
            orderId: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            rentalStartDate: order.rentalStartDate,
            rentalEndDate: order.rentalEndDate,
            rentalDays: order.rentalDays,
            totalAmount: order.totalAmount,
            deliveryType: order.deliveryType,
            deliveryAddress: order.deliveryAddress,
            returnAddress: order.returnAddress ?? RETURN_ADDRESS,
            itemNames,
            membershipPlan: order.membershipPlan,
            fuelType: order.fuelType,
            fuelLitres: order.fuelLitres,
            fuelCost: order.fuelCost,
            deliverySlotDate: order.deliverySlotDate,
            deliverySlotTime: order.deliverySlotTime,
            collectionSlotDate: order.collectionSlotDate,
            collectionSlotTime: order.collectionSlotTime,
          });

          // 3. Log the email attempt (success or failure)
          await db.insert(orderEmailLogs).values({
            orderId: input.orderId,
            customerEmail: order.customerEmail,
            status: input.status as OrderEmailStatus,
            subject: emailResult.subject,
            error: emailResult.error ?? null,
          });

          // 4. Send warehouse alert for Confirmed (prep) and Active (dispatch)
          if (input.status === "confirmed" || input.status === "active") {
            const orderItemsForWarehouse = items.map(i => ({
              equipmentName: i.name ?? "Unknown Item",
              rentalDays: order.rentalDays ?? 1,
            }));
            try {
              await sendWarehouseAlertEmail(input.status as "confirmed" | "active", {
                orderId: order.id,
                customerName: order.customerName,
                customerPhone: order.customerPhone ?? undefined,
                orderItems: orderItemsForWarehouse,
                rentalStartDate: order.rentalStartDate
                  ? new Date(order.rentalStartDate).toLocaleDateString("en-HK")
                  : undefined,
                rentalEndDate: order.rentalEndDate
                  ? new Date(order.rentalEndDate).toLocaleDateString("en-HK")
                  : undefined,
                deliveryType: order.deliveryType ?? undefined,
                deliveryAddress: order.deliveryAddress ?? undefined,
                deliverySlotDate: order.deliverySlotDate
                  ? new Date(order.deliverySlotDate).toLocaleDateString("en-HK")
                  : undefined,
                deliverySlotTime: order.deliverySlotTime ?? undefined,
                collectionSlotDate: order.collectionSlotDate
                  ? new Date(order.collectionSlotDate).toLocaleDateString("en-HK")
                  : undefined,
                collectionSlotTime: order.collectionSlotTime ?? undefined,
              });
            } catch (warehouseEmailErr) {
              console.error("[Warehouse Alert] Failed to send warehouse email:", warehouseEmailErr);
            }
          }
        }
      }

      return { success: true };
    }),

  // ─── Admin: verify HKID ────────────────────────────────────────────────────
  adminVerifyHkid: managerProcedure
    .input(z.object({ membershipId: z.number(), verified: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      await db
        .update(userMemberships)
        .set({
          hkidVerified: input.verified,
          hkidVerifiedAt: input.verified ? new Date() : null,
        })
        .where(eq(userMemberships.id, input.membershipId));
      return { success: true };
    }),

  // ─── Admin: get order with items ───────────────────────────────────────────
  adminGetOrder: managerProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const [order] = await db
        .select()
        .from(rentalOrders)
        .where(eq(rentalOrders.id, input.orderId))
        .limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      const items = await db
        .select()
        .from(rentalOrderItems)
        .where(eq(rentalOrderItems.orderId, input.orderId));
      return { ...order, items };
    }),

  // ─── Admin: settle deposit via Stripe pre-auth capture or release ────────────
  adminSettleDeposit: managerProcedure
    .input(
      z.object({
        orderId: z.number(),
        action: z.enum(["capture", "partial_capture", "release"]),
        captureAmount: z.number().min(0).optional(),  // For partial_capture — amount in HKD
        depositDeductionReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();

      // Fetch the order to get the Stripe PaymentIntent ID
      const [order] = await db
        .select()
        .from(rentalOrders)
        .where(eq(rentalOrders.id, input.orderId))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });

      const stripe = getStripe();
      const intentId = order.stripeDepositIntentId;

      if (!intentId) {
        // No pre-auth on file — just update DB status (legacy orders or waived deposits)
        await db
          .update(rentalOrders)
          .set({
            depositStatus: input.action === "release" ? "released" : "captured",
            depositDeductionReason: input.depositDeductionReason,
            depositSettledAt: new Date(),
          })
          .where(eq(rentalOrders.id, input.orderId));
        return { success: true, method: "db_only" };
      }

      try {
        if (input.action === "release") {
          // Cancel the hold — no money taken
          await stripe.paymentIntents.cancel(intentId);
          await db
            .update(rentalOrders)
            .set({
              depositStatus: "released",
              depositSettledAt: new Date(),
            })
            .where(eq(rentalOrders.id, input.orderId));
          // Send customer notification email
          if (order.customerEmail && order.depositAmount) {
            try {
              await sendDepositReleasedEmail({
                orderId: order.id,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                depositAmount: order.depositAmount,
              });
            } catch (emailErr) {
              console.error("[DepositRelease] Failed to send release email:", emailErr);
            }
          }
          return { success: true, action: "released" };
        }

        if (input.action === "partial_capture" && input.captureAmount !== undefined) {
          // Capture only a portion of the hold
          const amountCents = Math.round(input.captureAmount * 100);
          await stripe.paymentIntents.capture(intentId, { amount_to_capture: amountCents });
          await db
            .update(rentalOrders)
            .set({
              depositStatus: "partially_captured",
              depositReturnedAmount: String((Number(order.depositAmount) - input.captureAmount).toFixed(2)),
              depositDeductionReason: input.depositDeductionReason,
              depositSettledAt: new Date(),
            })
            .where(eq(rentalOrders.id, input.orderId));
          return { success: true, action: "partially_captured", capturedAmount: input.captureAmount };
        }

        // Full capture — take the full deposit amount
        await stripe.paymentIntents.capture(intentId);
        await db
          .update(rentalOrders)
          .set({
            depositStatus: "captured",
            depositDeductionReason: input.depositDeductionReason,
            depositSettledAt: new Date(),
          })
          .where(eq(rentalOrders.id, input.orderId));
        return { success: true, action: "captured" };

      } catch (err: any) {
        console.error("[DepositSettle] Stripe error:", err.message);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Stripe error: ${err.message}`,
        });
      }
    }),

  // ─── Admin: create deposit pre-auth hold manually (if webhook missed it) ─────
  adminCreateDepositHold: managerProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [order] = await db
        .select()
        .from(rentalOrders)
        .where(eq(rentalOrders.id, input.orderId))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.depositWaived || Number(order.depositAmount) <= 0) {
        return { success: false, reason: "Deposit waived or zero" };
      }
      if (order.stripeDepositIntentId) {
        return { success: false, reason: "Hold already exists" };
      }

      const stripe = getStripe();
      // 7-day hold expiry from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const intent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.depositAmount) * 100),
        currency: "hkd",
        capture_method: "manual",
        customer: undefined,  // Will be linked via customer_email if needed
        receipt_email: order.customerEmail,
        description: `Security deposit hold — EquipHK Order #${order.id}`,
        metadata: {
          order_id: String(order.id),
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          type: "deposit_hold",
        },
        payment_method_types: ["card"],
      });

      await db
        .update(rentalOrders)
        .set({
          stripeDepositIntentId: intent.id,
          stripeDepositClientSecret: intent.client_secret ?? undefined,
          depositStatus: "pending",
          depositHoldExpiresAt: expiresAt,
        })
        .where(eq(rentalOrders.id, input.orderId));

      return { success: true, clientSecret: intent.client_secret, intentId: intent.id };
    }),

  // ─── Admin: re-authorise deposit hold (cancel old + create new 7-day hold) ────────────────
  adminReauthoriseDepositHold: managerProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [order] = await db
        .select()
        .from(rentalOrders)
        .where(eq(rentalOrders.id, input.orderId))
        .limit(1);

      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (!order.stripeDepositIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No existing hold to re-authorise" });
      }

      const stripe = getStripe();

      // Cancel the old hold
      try {
        await stripe.paymentIntents.cancel(order.stripeDepositIntentId);
      } catch (err: any) {
        // If already cancelled/expired, continue
        if (!err.message?.includes("already canceled")) {
          console.error("[ReAuth] Could not cancel old intent:", err.message);
        }
      }

      // Create a fresh 7-day hold
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(Number(order.depositAmount) * 100),
        currency: "hkd",
        capture_method: "manual",
        receipt_email: order.customerEmail,
        description: `Security deposit hold (re-authorised) — EquipHK Order #${order.id}`,
        metadata: {
          order_id: String(order.id),
          customer_name: order.customerName,
          customer_email: order.customerEmail,
          type: "deposit_hold_reauth",
        },
        payment_method_types: ["card"],
      });

      await db
        .update(rentalOrders)
        .set({
          stripeDepositIntentId: intent.id,
          stripeDepositClientSecret: intent.client_secret ?? undefined,
          depositStatus: "pending",
          depositHoldExpiresAt: expiresAt,
        })
        .where(eq(rentalOrders.id, input.orderId));

      return { success: true, intentId: intent.id, newExpiresAt: expiresAt };
    }),

  // ─── Admin: bulk update order status ──────────────────────────────────────────────────
  adminBulkUpdateOrderStatus: managerProcedure
    .input(
      z.object({
        orderIds: z.array(z.number()).min(1).max(100),
        status: z.enum(["pending_payment", "paid", "confirmed", "active", "completed", "cancelled", "refunded"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const { inArray } = await import("drizzle-orm");
      await db
        .update(rentalOrders)
        .set({
          status: input.status,
          ...(input.adminNotes ? { adminNotes: input.adminNotes } : {}),
        })
        .where(inArray(rentalOrders.id, input.orderIds));
      return { updated: input.orderIds.length };
    }),

  // ─── Admin: export orders as JSON (client converts to CSV) ────────────────
  adminExportOrders: managerProcedure
    .input(
      z.object({
        status: z.enum(["all", "pending_payment", "paid", "confirmed", "active", "completed", "cancelled", "refunded"]).optional().default("all"),
        fromDate: z.string().optional(),  // ISO date
        toDate: z.string().optional(),
        limit: z.number().min(1).max(5000).optional().default(1000),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const { gte, lte, and: andOp } = await import("drizzle-orm");
      const conditions = [];
      if (input?.status && input.status !== "all") {
        conditions.push(eq(rentalOrders.status, input.status));
      }
      if (input?.fromDate) {
        conditions.push(gte(rentalOrders.createdAt, new Date(input.fromDate)));
      }
      if (input?.toDate) {
        const toDate = new Date(input.toDate);
        toDate.setHours(23, 59, 59, 999);
        conditions.push(lte(rentalOrders.createdAt, toDate));
      }
      const orders = await db
        .select()
        .from(rentalOrders)
        .where(conditions.length > 0 ? andOp(...conditions) : undefined)
        .orderBy(desc(rentalOrders.createdAt))
        .limit(input?.limit ?? 1000);

      // Fetch items for each order
      const { inArray } = await import("drizzle-orm");
      const orderIds = orders.map((o) => o.id);
      const allItems = orderIds.length > 0
        ? await db.select().from(rentalOrderItems).where(inArray(rentalOrderItems.orderId, orderIds))
        : [];

      return orders.map((order) => ({
        ...order,
        items: allItems.filter((i) => i.orderId === order.id),
      }));
    }),

  // ─── Admin: get email notification logs for an order ─────────────────
  adminGetOrderEmailLogs: managerProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await requireDb();
      return db
        .select()
        .from(orderEmailLogs)
        .where(eq(orderEmailLogs.orderId, input.orderId))
        .orderBy(desc(orderEmailLogs.sentAt));
    }),

  // ─── Admin: list orders for delivery calendar ───────────────────────────
  adminDeliveryCalendar: managerProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      const db = await requireDb();
      const { gte, lte, and: andOp, or } = await import("drizzle-orm");
      const startOfMonth = new Date(input.year, input.month - 1, 1);
      const endOfMonth = new Date(input.year, input.month, 0, 23, 59, 59);
      // Get all orders that have delivery slots in this month OR rental period overlaps
      const orders = await db
        .select()
        .from(rentalOrders)
        .where(
          andOp(
            // Only delivery orders or orders with slots
            or(
              eq(rentalOrders.deliveryType, "delivery"),
              // Self-collection orders with a slot date set
              gte(rentalOrders.deliverySlotDate, startOfMonth)
            ),
            lte(rentalOrders.rentalStartDate, endOfMonth),
            gte(rentalOrders.rentalEndDate, startOfMonth)
          )
        )
        .orderBy(rentalOrders.rentalStartDate);
      return orders;
    }),
});
