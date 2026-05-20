import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import Stripe from "stripe";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// import { registerOAuthRoutes } from "./oauth"; // Manus OAuth — disabled for Railway
import { registerLocalAuthRoutes } from "./auth-local";
import { registerSitemapRoute } from "../sitemap";
import { registerCodeExportRoute } from "../codeExport";
import { runGoogleDriveBackup } from "../googleDriveBackup";
import { runGitHubBackup } from "../githubBackup";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerClient } from "../sse";
import { getDb } from "../db";
import { rentalOrders, userMemberships } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./notification";
import { sendBookingConfirmationEmail, sendDepositHoldExpiryReminderEmail } from "./email";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Stripe Webhook (MUST be before express.json) ──────────────────────────
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

      let event: Stripe.Event;

      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-03-31.basil" });
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("[Webhook] Signature verification failed:", err);
        res.status(400).send("Webhook Error");
        return;
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        res.json({ verified: true });
        return;
      }

      console.log(`[Webhook] Event: ${event.type} (${event.id})`);

      try {
        const db = await getDb();
        if (!db) { res.json({ received: true }); return; }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as unknown as Record<string, unknown>;
          const orderId = session.metadata && typeof session.metadata === "object"
            ? Number((session.metadata as Record<string, string>).order_id)
            : null;
          const action = session.metadata && typeof session.metadata === "object"
            ? (session.metadata as Record<string, string>).action
            : null;

          if (orderId) {
            // Rental order payment completed
            await db
              .update(rentalOrders)
              .set({
                status: "paid",
                stripePaymentIntentId: session.payment_intent as string ?? null,
              })
              .where(eq(rentalOrders.id, orderId));

            console.log(`[Webhook] Order #${orderId} marked as paid`);

            // Fetch full order details to send confirmation email
            try {
              const [paidOrder] = await db
                .select()
                .from(rentalOrders)
                .where(eq(rentalOrders.id, orderId))
                .limit(1);

              if (paidOrder && paidOrder.customerEmail) {
                // Fetch order items
                const { rentalOrderItems } = await import("../../drizzle/schema");
                const items = await db
                  .select()
                  .from(rentalOrderItems)
                  .where(eq(rentalOrderItems.orderId, orderId));

                await sendBookingConfirmationEmail({
                  orderId: paidOrder.id,
                  customerName: paidOrder.customerName,
                  customerEmail: paidOrder.customerEmail,
                  customerPhone: paidOrder.customerPhone,
                  companyName: paidOrder.companyName,
                  membershipPlan: paidOrder.membershipPlan,
                  rentalStartDate: paidOrder.rentalStartDate instanceof Date ? paidOrder.rentalStartDate.toISOString() : String(paidOrder.rentalStartDate),
                  rentalEndDate: paidOrder.rentalEndDate instanceof Date ? paidOrder.rentalEndDate.toISOString() : String(paidOrder.rentalEndDate),
                  rentalDays: paidOrder.rentalDays,
                  subtotal: paidOrder.subtotal,
                  discountPercent: paidOrder.discountPercent,
                  discountAmount: paidOrder.discountAmount,
                  deliveryFee: paidOrder.deliveryFee,
                  depositAmount: paidOrder.depositAmount,
                  depositWaived: paidOrder.depositWaived ?? false,
                  totalAmount: paidOrder.totalAmount,
                  deliveryType: paidOrder.deliveryType,
                  deliveryAddress: paidOrder.deliveryAddress,
                  returnAddress: paidOrder.returnAddress ?? "Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong",
                  itemNames: items.map((i) => `${i.equipmentName} — ${i.rentalDays} day${i.rentalDays !== 1 ? "s" : ""}`),
                });
              }
            } catch (emailErr) {
              console.error("[Webhook] Failed to send confirmation email:", emailErr);
            }

            await notifyOwner({
              title: `Payment Received — Order #${orderId}`,
              content: `Customer: ${(session.metadata as Record<string, string>)?.customer_name ?? "Unknown"} | Email: ${(session.metadata as Record<string, string>)?.customer_email ?? ""} | Order #${orderId} is now PAID`,
            });

            // ─── Create deposit pre-auth (card hold) after payment ───────────────────────────────
            try {
              const [freshOrder] = await db
                .select()
                .from(rentalOrders)
                .where(eq(rentalOrders.id, orderId))
                .limit(1);

              if (
                freshOrder &&
                !freshOrder.depositWaived &&
                Number(freshOrder.depositAmount) > 0 &&
                !freshOrder.stripeDepositIntentId
              ) {
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2025-03-31.basil" });
                const depositCents = Math.round(Number(freshOrder.depositAmount) * 100);
                const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                const depositIntent = await stripe.paymentIntents.create({
                  amount: depositCents,
                  currency: "hkd",
                  capture_method: "manual",
                  receipt_email: freshOrder.customerEmail,
                  description: `Security deposit hold — EquipHK Order #${freshOrder.id}`,
                  metadata: {
                    order_id: String(freshOrder.id),
                    customer_name: freshOrder.customerName,
                    customer_email: freshOrder.customerEmail,
                    type: "deposit_hold",
                  },
                  payment_method_types: ["card"],
                });

                await db
                  .update(rentalOrders)
                  .set({
                    stripeDepositIntentId: depositIntent.id,
                    stripeDepositClientSecret: depositIntent.client_secret ?? undefined,
                    depositStatus: "pending",
                    depositHoldExpiresAt: expiresAt,
                  })
                  .where(eq(rentalOrders.id, orderId));

                console.log(`[Webhook] Deposit hold created for Order #${orderId}: ${depositIntent.id} (HK$${freshOrder.depositAmount})`);
              }
            } catch (depositErr) {
              console.error("[Webhook] Failed to create deposit hold:", depositErr);
              // Non-fatal — admin can create hold manually from Admin Orders panel
            }
          }

          if (action === "upgrade_to_trade_pro") {
            const userId = session.metadata && typeof session.metadata === "object"
              ? Number((session.metadata as Record<string, string>).user_id)
              : null;
            const membershipId = session.metadata && typeof session.metadata === "object"
              ? Number((session.metadata as Record<string, string>).membership_id)
              : null;

            if (membershipId) {
              await db
                .update(userMemberships)
                .set({ plan: "trade_pro", status: "active" })
                .where(eq(userMemberships.id, membershipId));
              console.log(`[Webhook] Membership #${membershipId} upgraded to Trade Pro`);
            }
          }
        }

        if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
          const subscription = event.data.object as unknown as Record<string, unknown>;
          const customerId = subscription.customer as string;
          if (customerId) {
            const [membership] = await db
              .select()
              .from(userMemberships)
              .where(eq(userMemberships.stripeCustomerId, customerId))
              .limit(1);
            if (membership) {
              await db
                .update(userMemberships)
                .set({
                  plan: "trade_pro",
                  status: subscription.status === "active" ? "active" : "suspended",
                  stripeSubscriptionId: subscription.id as string,
                })
                .where(eq(userMemberships.id, membership.id));
            }
          }
        }
      } catch (err) {
        console.error("[Webhook] Processing error:", err);
      }

      res.json({ received: true });
    }
  );

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── HKID Upload Endpoint ─────────────────────────────────────────────────
  app.post("/api/upload-hkid", async (req, res) => {
    try {
      // Parse multipart form data manually using busboy
      const busboy = (await import("busboy")).default;
      const bb = busboy({ headers: req.headers, limits: { fileSize: 10 * 1024 * 1024 } });
      let fileBuffer: Buffer | null = null;
      let mimeType = "image/jpeg";
      let fileName = "hkid.jpg";

      bb.on("file", (_fieldname: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        mimeType = info.mimeType;
        fileName = info.filename;
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => { fileBuffer = Buffer.concat(chunks); });
      });

      bb.on("finish", async () => {
        if (!fileBuffer) {
          res.status(400).json({ error: "No file received" });
          return;
        }
        const { storagePut } = await import("../storage");
        const suffix = Date.now().toString(36);
        const key = `hkid-docs/${suffix}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { url } = await storagePut(key, fileBuffer, mimeType);
        res.json({ url, key });
      });

      req.pipe(bb);
    } catch (err) {
      console.error("[HKID Upload] Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // ─── Damage Photo Upload Endpoint ─────────────────────────────────────────────────────────────────────────────────────────
  app.post("/api/upload-damage-photo", async (req, res) => {
    try {
      const busboy = (await import("busboy")).default;
      const bb = busboy({ headers: req.headers, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB
      let fileBuffer: Buffer | null = null;
      let mimeType = "image/jpeg";
      let fileName = "damage.jpg";

      bb.on("file", (_fieldname: string, stream: NodeJS.ReadableStream, info: { filename: string; mimeType: string }) => {
        mimeType = info.mimeType;
        fileName = info.filename;
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => { fileBuffer = Buffer.concat(chunks); });
      });

      bb.on("finish", async () => {
        if (!fileBuffer) {
          res.status(400).json({ error: "No file received" });
          return;
        }
        const { storagePut } = await import("../storage");
        const suffix = Date.now().toString(36);
        const key = `damage-photos/${suffix}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { url } = await storagePut(key, fileBuffer, mimeType);
        res.json({ url, key });
      });

      req.pipe(bb);
    } catch (err) {
      console.error("[DamagePhoto Upload] Error:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Code export for automated backups
  registerCodeExportRoute(app);
  // Local email/password auth routes (replaces Manus OAuth for Railway)
  registerLocalAuthRoutes(app);
  // Dynamic sitemap for SEO
  registerSitemapRoute(app);
  // SSE endpoint for real-time notifications
  app.get("/api/events", (req, res) => {
    registerClient(req, res);
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);

// ── Weekly Google Drive Backup (every Sunday at 02:00 HKT = 18:00 UTC Saturday) ──
function scheduleWeeklyDriveBackup() {
  let lastRanDate = "";
  const checkAndRun = () => {
    const now = new Date();
    // Sunday in HKT = UTC day 0 at 18:00 (02:00 HKT next day)
    const isSundayHKT = now.getUTCDay() === 0 && now.getUTCHours() === 18 && now.getUTCMinutes() === 0;
    const todayKey = now.toISOString().slice(0, 10);
    if (isSundayHKT && lastRanDate !== todayKey) {
      lastRanDate = todayKey;
      console.log("[DriveBackup] Weekly backup triggered");
      runGoogleDriveBackup().then((result) => {
        if (result.success) {
          console.log(`[DriveBackup] Complete — code: ${result.codeFileId}, db: ${result.dbFileId}`);
        } else {
          console.error(`[DriveBackup] Failed: ${result.error}`);
        }
      });
    }
  };
  setInterval(checkAndRun, 60 * 1000);
  console.log("[DriveBackup] Scheduler started (runs every Sunday at 02:00 HKT)");
}

scheduleWeeklyDriveBackup();

// ── Daily GitHub Backup (every day at 03:00 HKT = 19:00 UTC, 7-day rolling window) ──
function scheduleGitHubBackup() {
  let lastRanDate = "";
  const checkAndRun = () => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    // 03:00 HKT = 19:00 UTC
    const isDailyTime = now.getUTCHours() === 19 && now.getUTCMinutes() === 0;
    if (isDailyTime && lastRanDate !== todayKey) {
      lastRanDate = todayKey;
      console.log("[GitHubBackup] Daily backup triggered");
      runGitHubBackup().then((result) => {
        if (result.success) {
          console.log(`[GitHubBackup] Complete — commit: ${result.commitSha}`);
        } else {
          console.error(`[GitHubBackup] Failed: ${result.error}`);
        }
      });
    }
  };
  setInterval(checkAndRun, 60 * 1000);
  console.log("[GitHubBackup] Scheduler started (runs daily at 03:00 HKT, 7-day rolling window)");
}

scheduleGitHubBackup();

// ── Daily Deposit Hold Expiry Reminder (every day at 09:00 HKT = 01:00 UTC) ──
function scheduleDepositHoldReminder() {
  let lastRanDate = "";
  const checkAndRun = async () => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    // Run once per day at 01:00 UTC (09:00 HKT)
    if (now.getUTCHours() !== 1 || now.getUTCMinutes() !== 0) return;
    if (lastRanDate === todayKey) return;
    lastRanDate = todayKey;

    try {
      const db = await getDb();
      if (!db) { console.error("[DepositReminder] DB not available"); return; }
      const { and, isNotNull, lte, gt, notInArray } = await import("drizzle-orm");
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      const expiringOrders = await db
        .select({
          id: rentalOrders.id,
          customerName: rentalOrders.customerName,
          customerEmail: rentalOrders.customerEmail,
          depositAmount: rentalOrders.depositAmount,
          depositHoldExpiresAt: rentalOrders.depositHoldExpiresAt,
          rentalEndDate: rentalOrders.rentalEndDate,
        })
        .from(rentalOrders)
        .where(
          and(
            isNotNull(rentalOrders.depositHoldExpiresAt),
            lte(rentalOrders.depositHoldExpiresAt, twoDaysFromNow),
            gt(rentalOrders.depositHoldExpiresAt, new Date()),
            notInArray(rentalOrders.depositStatus, ["released", "captured", "partially_captured", "expired"] as any[])
          )
        );

      if (expiringOrders.length > 0) {
        await sendDepositHoldExpiryReminderEmail(
          expiringOrders.map((o: typeof expiringOrders[number]) => ({
            id: o.id,
            customerName: o.customerName,
            customerEmail: o.customerEmail,
            depositAmount: String(o.depositAmount ?? 0),
            depositHoldExpiresAt: o.depositHoldExpiresAt!,
            rentalEndDate: o.rentalEndDate,
          }))
        );
        console.log(`[DepositReminder] Sent reminder for ${expiringOrders.length} expiring hold(s)`);
      } else {
        console.log("[DepositReminder] No holds expiring within 48 hours today");
      }
    } catch (err) {
      console.error("[DepositReminder] Failed:", err);
    }
  };
  setInterval(checkAndRun, 60 * 1000);
  console.log("[DepositReminder] Scheduler started (runs daily at 09:00 HKT)");
}

scheduleDepositHoldReminder();

// ── Auto Hold Renewal Scheduler (every day at 02:00 HKT = 18:00 UTC prev day) ─
// Silently renews Stripe pre-auth holds expiring within 2 days for active orders.
// Runs until the order is completed, cancelled, or refunded.
function scheduleAutoHoldRenewal() {
  let lastRanDate = "";
  const checkAndRun = async () => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    // Run once per day at 18:00 UTC (02:00 HKT next day)
    if (now.getUTCHours() !== 18 || now.getUTCMinutes() !== 0) return;
    if (lastRanDate === todayKey) return;
    lastRanDate = todayKey;

    try {
      const db = await getDb();
      if (!db) { console.error("[AutoHoldRenewal] DB not available"); return; }
      const { and, isNotNull, lte, gt, notInArray } = await import("drizzle-orm");
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      // Find orders with holds expiring within 2 days that are still active
      const ordersToRenew = await db
        .select()
        .from(rentalOrders)
        .where(
          and(
            isNotNull(rentalOrders.stripeDepositIntentId),
            isNotNull(rentalOrders.depositHoldExpiresAt),
            lte(rentalOrders.depositHoldExpiresAt, twoDaysFromNow),
            gt(rentalOrders.depositHoldExpiresAt, new Date()),
            notInArray(rentalOrders.depositStatus, ["released", "captured", "partially_captured"] as any[]),
            notInArray(rentalOrders.status, ["completed", "cancelled", "refunded"] as any[])
          )
        );

      if (ordersToRenew.length === 0) {
        console.log("[AutoHoldRenewal] No holds require renewal today");
        return;
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
        apiVersion: "2025-04-30.basil" as any,
      });

      let renewed = 0;
      let failed = 0;

      for (const order of ordersToRenew) {
        try {
          // Cancel the expiring hold
          try {
            await stripe.paymentIntents.cancel(order.stripeDepositIntentId!);
          } catch (cancelErr: any) {
            if (!cancelErr.message?.includes("already canceled")) {
              console.error(`[AutoHoldRenewal] Could not cancel old intent for Order #${order.id}:`, cancelErr.message);
            }
          }

          // Create a fresh 7-day hold
          const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const intent = await stripe.paymentIntents.create({
            amount: Math.round(Number(order.depositAmount) * 100),
            currency: "hkd",
            capture_method: "manual",
            receipt_email: order.customerEmail,
            description: `Security deposit hold (auto-renewed) — EquipHK Order #${order.id}`,
            metadata: {
              order_id: String(order.id),
              customer_name: order.customerName,
              customer_email: order.customerEmail,
              type: "deposit_hold_autorenewal",
            },
            payment_method_types: ["card"],
          });

          // Update DB with new intent and expiry
          await db
            .update(rentalOrders)
            .set({
              stripeDepositIntentId: intent.id,
              stripeDepositClientSecret: intent.client_secret ?? undefined,
              depositStatus: "pending",
              depositHoldExpiresAt: expiresAt,
            })
            .where(eq(rentalOrders.id, order.id));

          renewed++;
          console.log(`[AutoHoldRenewal] Renewed hold for Order #${order.id} — new expiry: ${expiresAt.toISOString()}`);
        } catch (err: any) {
          failed++;
          console.error(`[AutoHoldRenewal] Failed to renew hold for Order #${order.id}:`, err.message);
        }
      }

      console.log(`[AutoHoldRenewal] Complete — renewed: ${renewed}, failed: ${failed}`);
    } catch (err) {
      console.error("[AutoHoldRenewal] Scheduler error:", err);
    }
  };
  setInterval(checkAndRun, 60 * 1000);
  console.log("[AutoHoldRenewal] Scheduler started (runs daily at 02:00 HKT — auto-renews holds expiring within 48h)");
}

scheduleAutoHoldRenewal();
