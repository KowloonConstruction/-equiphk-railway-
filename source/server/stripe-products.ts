/**
 * EquipHK Stripe Products & Prices
 * Centralised product/price definitions for membership and rental payments
 */

export const STRIPE_PRODUCTS = {
  TRADE_PRO_MONTHLY: {
    name: "EquipHK Trade Pro Membership",
    description: "Monthly Trade Pro membership — 10–15% off all rental rates, priority booking, waived deposits, free delivery on orders over HK$500",
    // Price in HKD cents (HK$499 = 49900 cents)
    amount: 49900,
    currency: "hkd",
    interval: "month" as const,
    // Stripe sandbox IDs (created via scripts/setup-stripe.mjs)
    productId: "prod_UHLuKDFkxEFUyp",
    priceId: "price_1TInCMBC4RGIaRPLrLMVSLvz",
  },
  RENTAL_PAYMENT: {
    name: "EquipHK Equipment Rental",
    description: "Equipment rental payment — charged upfront for the full rental period",
    // Stripe sandbox IDs (created via scripts/setup-stripe.mjs)
    productId: "prod_UHLuUvSDcHCSE2",
  },
} as const;

export const DELIVERY_FEE_HKD = 150; // HK$150 flat delivery fee
export const FREE_DELIVERY_THRESHOLD_HKD = 500; // Trade Pro free delivery above this
export const DEPOSIT_WAIVER_THRESHOLD_HKD = 5000; // Trade Pro deposit waived below this
export const TRADE_PRO_DISCOUNT_STANDARD = 10; // 10% for daily/weekly
export const TRADE_PRO_DISCOUNT_MONTHLY = 15; // 15% for monthly rentals
export const MONTHLY_RENTAL_THRESHOLD_DAYS = 28; // 28+ days = monthly rate applies

export const RETURN_ADDRESS = "Y2, Shing Fung Film Studio, Ho Chung, Sai Kung, Hong Kong";
export const ADMIN_WHATSAPP = "+85298325789";
export const ADMIN_EMAIL = "Bookings@Equip.hk";
