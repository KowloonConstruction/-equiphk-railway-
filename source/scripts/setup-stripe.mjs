/**
 * EquipHK Stripe Setup Script
 * Creates products, prices, and registers the webhook endpoint in Stripe sandbox.
 * Run: node scripts/setup-stripe.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

const WEBHOOK_URL = "https://equiprental-eqjqhhxw.manus.space/api/stripe/webhook";

async function run() {
  console.log("=== EquipHK Stripe Sandbox Setup ===\n");

  // ─── 1. Create Trade Pro Monthly Product & Price ─────────────────────────
  console.log("1. Setting up Trade Pro Monthly subscription product...");
  let tradeProProduct;
  let tradeProPrice;

  // Check if product already exists
  const existingProducts = await stripe.products.list({ limit: 100 });
  tradeProProduct = existingProducts.data.find(
    (p) => p.metadata?.equiphk_id === "trade_pro_monthly"
  );

  if (!tradeProProduct) {
    tradeProProduct = await stripe.products.create({
      name: "EquipHK Trade Pro Membership",
      description:
        "Monthly Trade Pro membership — 10–15% off all rental rates, priority booking, waived deposits on tools under HK$5,000, free delivery on orders over HK$500",
      metadata: { equiphk_id: "trade_pro_monthly" },
    });
    console.log(`   ✓ Product created: ${tradeProProduct.id}`);
  } else {
    console.log(`   ✓ Product already exists: ${tradeProProduct.id}`);
  }

  // Check if price already exists for this product
  const existingPrices = await stripe.prices.list({
    product: tradeProProduct.id,
    active: true,
    limit: 10,
  });
  tradeProPrice = existingPrices.data.find(
    (p) => p.unit_amount === 49900 && p.recurring?.interval === "month"
  );

  if (!tradeProPrice) {
    tradeProPrice = await stripe.prices.create({
      product: tradeProProduct.id,
      unit_amount: 49900, // HK$499.00
      currency: "hkd",
      recurring: { interval: "month" },
      metadata: { equiphk_id: "trade_pro_monthly_price" },
    });
    console.log(`   ✓ Price created: ${tradeProPrice.id} (HK$499/month)`);
  } else {
    console.log(`   ✓ Price already exists: ${tradeProPrice.id} (HK$499/month)`);
  }

  // ─── 2. Create Rental Payment Product (one-time) ──────────────────────────
  console.log("\n2. Setting up Rental Payment product...");
  let rentalProduct;

  rentalProduct = existingProducts.data.find(
    (p) => p.metadata?.equiphk_id === "rental_payment"
  );

  if (!rentalProduct) {
    rentalProduct = await stripe.products.create({
      name: "EquipHK Equipment Rental",
      description: "Equipment rental payment — charged upfront for the full rental period",
      metadata: { equiphk_id: "rental_payment" },
    });
    console.log(`   ✓ Product created: ${rentalProduct.id}`);
  } else {
    console.log(`   ✓ Product already exists: ${rentalProduct.id}`);
  }

  // ─── 3. Register Webhook Endpoint ─────────────────────────────────────────
  console.log("\n3. Registering webhook endpoint...");
  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 20 });
  const existingWebhook = existingWebhooks.data.find(
    (w) => w.url === WEBHOOK_URL
  );

  if (!existingWebhook) {
    const webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
        "invoice.paid",
        "invoice.payment_failed",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
      ],
      description: "EquipHK production webhook",
    });
    console.log(`   ✓ Webhook registered: ${webhook.id}`);
    console.log(`   ✓ Webhook URL: ${webhook.url}`);
    console.log(`   ⚠  New webhook secret: ${webhook.secret}`);
    console.log(
      "   ⚠  Update STRIPE_WEBHOOK_SECRET in Settings → Payment with this value!"
    );
  } else {
    console.log(`   ✓ Webhook already registered: ${existingWebhook.id}`);
    console.log(`   ✓ URL: ${existingWebhook.url}`);
    console.log(`   ✓ Status: ${existingWebhook.status}`);
  }

  // ─── 4. Output summary ────────────────────────────────────────────────────
  console.log("\n=== Setup Complete ===");
  console.log(`Trade Pro Product ID : ${tradeProProduct.id}`);
  console.log(`Trade Pro Price ID   : ${tradeProPrice.id}`);
  console.log(`Rental Product ID    : ${rentalProduct.id}`);
  console.log("\nUpdate server/stripe-products.ts with these IDs if needed.");
  console.log("\nTest card: 4242 4242 4242 4242 | Any future expiry | Any CVC");
}

run().catch((err) => {
  console.error("Setup failed:", err.message);
  process.exit(1);
});
