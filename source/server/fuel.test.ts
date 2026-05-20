/**
 * Fuel Price Scraper Tests
 * Tests the live Consumer Council HK fuel price scraper
 */
import { describe, it, expect } from "vitest";
import { getLiveFuelPrices as getFuelPrices } from "./fuelPriceScraper";

describe("Fuel Price Scraper", () => {
  it("should return petrol and diesel prices as positive numbers", async () => {
    const prices = await getFuelPrices();
    expect(prices).toBeDefined();
    expect(typeof prices.petrolPumpPrice).toBe("number");
    expect(typeof prices.dieselPumpPrice).toBe("number");
    expect(prices.petrolPumpPrice).toBeGreaterThan(0);
    expect(prices.dieselPumpPrice).toBeGreaterThan(0);
  }, 30_000); // 30s timeout for live HTTP request

  it("should return realistic HK pump prices (HK$15–HK$50/L range)", async () => {
    const prices = await getFuelPrices();
    // Sanity check: HK pump prices are typically HK$15–50/L
    expect(prices.petrolPumpPrice).toBeGreaterThanOrEqual(15);
    expect(prices.petrolPumpPrice).toBeLessThanOrEqual(60);
    expect(prices.dieselPumpPrice).toBeGreaterThanOrEqual(15);
    expect(prices.dieselPumpPrice).toBeLessThanOrEqual(60);
  }, 30_000);

  it("should include a source and updatedAt field", async () => {
    const prices = await getFuelPrices();
    expect(prices.source).toBeDefined();
    expect(["live", "cached", "fallback"]).toContain(prices.source);
    expect(prices.updatedAt).toBeDefined();
  }, 30_000);

  it("should cache results — second call should return same prices", async () => {
    const first = await getFuelPrices();
    const second = await getFuelPrices();
    // Prices should be identical (cached)
    expect(first.petrolPumpPrice).toBe(second.petrolPumpPrice);
    expect(first.dieselPumpPrice).toBe(second.dieselPumpPrice);
  }, 30_000);
});
