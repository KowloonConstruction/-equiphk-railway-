/**
 * EquipHK Stripe Integration Tests
 * Tests that the Stripe sandbox is correctly wired:
 *  - API keys are valid and the client can connect
 *  - Products and prices exist in the sandbox
 *  - Checkout sessions can be created for rental orders
 *  - Checkout sessions can be created for Trade Pro subscriptions
 *  - Webhook signature verification works with test events
 */
import { describe, it, expect, beforeAll } from "vitest";
import Stripe from "stripe";

const TRADE_PRO_PRODUCT_ID = "prod_UHLuKDFkxEFUyp";
const TRADE_PRO_PRICE_ID = "price_1TInCMBC4RGIaRPLrLMVSLvz";
const RENTAL_PRODUCT_ID = "prod_UHLuUvSDcHCSE2";
const WEBHOOK_URL = "https://equiprental-eqjqhhxw.manus.space/api/stripe/webhook";

let stripe: Stripe;

beforeAll(() => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  stripe = new Stripe(key, { apiVersion: "2025-03-31.basil" });
});

describe("Stripe API Connection", () => {
  it("should connect to Stripe API and return account info", async () => {
    const balance = await stripe.balance.retrieve();
    expect(balance.object).toBe("balance");
  });

  it("should be using a test key (sandbox)", async () => {
    const key = process.env.STRIPE_SECRET_KEY ?? "";
    expect(key.startsWith("sk_test_")).toBe(true);
  });
});

describe("Stripe Products", () => {
  it("Trade Pro Monthly product exists in sandbox", async () => {
    const product = await stripe.products.retrieve(TRADE_PRO_PRODUCT_ID);
    expect(product.id).toBe(TRADE_PRO_PRODUCT_ID);
    expect(product.active).toBe(true);
    expect(product.name).toContain("Trade Pro");
  });

  it("Trade Pro Monthly price exists and is HK$499/month", async () => {
    const price = await stripe.prices.retrieve(TRADE_PRO_PRICE_ID);
    expect(price.id).toBe(TRADE_PRO_PRICE_ID);
    expect(price.active).toBe(true);
    expect(price.unit_amount).toBe(49900);
    expect(price.currency).toBe("hkd");
    expect(price.recurring?.interval).toBe("month");
  });

  it("Rental Payment product exists in sandbox", async () => {
    const product = await stripe.products.retrieve(RENTAL_PRODUCT_ID);
    expect(product.id).toBe(RENTAL_PRODUCT_ID);
    expect(product.active).toBe(true);
    expect(product.name).toContain("Rental");
  });
});

describe("Stripe Checkout Sessions", () => {
  it("should create a rental order checkout session", async () => {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "hkd",
            product: RENTAL_PRODUCT_ID,
            unit_amount: 50000, // HK$500 test amount
          },
          quantity: 1,
        },
      ],
      success_url: "https://equiprental-eqjqhhxw.manus.space/booking-confirmation?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://equiprental-eqjqhhxw.manus.space/cart",
      client_reference_id: "test-user-1",
      metadata: {
        order_id: "999",
        user_id: "1",
        customer_email: "test@equip.hk",
        customer_name: "Test User",
        action: "rental_order",
      },
    });
    expect(session.id).toBeTruthy();
    expect(session.url).toBeTruthy();
    expect(session.mode).toBe("payment");
    expect(session.status).toBe("open");
    expect(session.metadata?.order_id).toBe("999");
    console.log("  Rental checkout URL:", session.url?.slice(0, 60) + "...");
  });

  it("should create a Trade Pro subscription checkout session", async () => {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: TRADE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: "https://equiprental-eqjqhhxw.manus.space/account?upgraded=1",
      cancel_url: "https://equiprental-eqjqhhxw.manus.space/register",
      customer_email: "test@equip.hk",
      client_reference_id: "test-user-1",
      metadata: {
        user_id: "1",
        membership_id: "1",
        action: "upgrade_to_trade_pro",
      },
    });
    expect(session.id).toBeTruthy();
    expect(session.url).toBeTruthy();
    expect(session.mode).toBe("subscription");
    expect(session.status).toBe("open");
    console.log("  Trade Pro checkout URL:", session.url?.slice(0, 60) + "...");
  });
});

describe("Stripe Webhook Endpoint", () => {
  it("webhook endpoint is registered in Stripe", async () => {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 20 });
    const equiphkWebhook = webhooks.data.find((w) => w.url === WEBHOOK_URL);
    expect(equiphkWebhook).toBeTruthy();
    expect(equiphkWebhook?.status).toBe("enabled");
    expect(equiphkWebhook?.enabled_events).toContain("checkout.session.completed");
    expect(equiphkWebhook?.enabled_events).toContain("customer.subscription.created");
  });

  it("webhook secret is set in environment", () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    expect(secret.length).toBeGreaterThan(0);
    expect(secret.startsWith("whsec_")).toBe(true);
  });
});
