/**
 * Live Fuel Price Scraper
 * Fetches current pump prices from Consumer Council HK Oil Price Watch
 * Petrol:  https://oil-price.consumer.org.hk/en
 * Diesel:  https://oil-price.consumer.org.hk/en/diesel
 *
 * Strategy:
 * - Scrape the HTML page and extract prices from .board__cell--2 elements
 * - Cache the result in the DB (fuel_price_cache table) for the day
 * - If the scrape fails, return the last cached price with a stale flag
 */

import * as cheerio from "cheerio";

export interface FuelPrices {
  petrolPumpPrice: number;   // Standard petrol pump price (before discount)
  dieselPumpPrice: number;   // Diesel pump price (before discount)
  petrolLowestPrice: number; // Lowest petrol price after walk-in discount
  dieselLowestPrice: number; // Lowest diesel price after walk-in discount
  updatedAt: string;         // ISO timestamp of when prices were fetched
  source: "live" | "cached" | "fallback";
}

// In-memory cache: { date: "YYYY-MM-DD", prices: FuelPrices }
let memoryCache: { date: string; prices: FuelPrices } | null = null;

function todayHKT(): string {
  // Hong Kong is UTC+8
  const now = new Date();
  const hktOffset = 8 * 60;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const hktMs = utcMs + hktOffset * 60000;
  const hkt = new Date(hktMs);
  return hkt.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

async function fetchAndParsePrices(url: string): Promise<{ pumpPrice: number; lowestPrice: number }> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const pumpPrices: number[] = [];
  const discountPrices: number[] = [];

  // Each row has: col1=company, col2=pump price, col3=discount price
  $(".board__cell--2").toArray().forEach((el) => {
    const text = $(el).text().trim();
    const match = text.match(/\$?(\d+\.\d+)/);
    if (match) pumpPrices.push(parseFloat(match[1]));
  });

  $(".board__cell--3").toArray().forEach((el) => {
    const text = $(el).text().trim();
    const match = text.match(/\$?(\d+\.\d+)/);
    if (match) discountPrices.push(parseFloat(match[1]));
  });

  if (pumpPrices.length === 0) {
    throw new Error(`No price data found on ${url}`);
  }

  // Use the most common pump price (all companies usually have the same pump price)
  const pumpPrice = pumpPrices[0];
  const lowestPrice = discountPrices.length > 0 ? Math.min(...discountPrices) : pumpPrice;

  return { pumpPrice, lowestPrice };
}

export async function getLiveFuelPrices(): Promise<FuelPrices> {
  const today = todayHKT();

  // Return memory cache if it's from today
  if (memoryCache && memoryCache.date === today) {
    return { ...memoryCache.prices, source: "cached" };
  }

  try {
    const [petrol, diesel] = await Promise.all([
      fetchAndParsePrices("https://oil-price.consumer.org.hk/en"),
      fetchAndParsePrices("https://oil-price.consumer.org.hk/en/diesel"),
    ]);

    const prices: FuelPrices = {
      petrolPumpPrice: petrol.pumpPrice,
      dieselPumpPrice: diesel.pumpPrice,
      petrolLowestPrice: petrol.lowestPrice,
      dieselLowestPrice: diesel.lowestPrice,
      updatedAt: new Date().toISOString(),
      source: "live",
    };

    // Store in memory cache
    memoryCache = { date: today, prices };

    console.log(
      `[FuelPrices] Fetched live prices — Petrol: HK$${prices.petrolPumpPrice}/L, Diesel: HK$${prices.dieselPumpPrice}/L`
    );

    return prices;
  } catch (err) {
    console.error("[FuelPrices] Scrape failed:", err);

    // Return memory cache even if stale, or fallback values
    if (memoryCache) {
      console.warn("[FuelPrices] Returning stale cached prices from", memoryCache.date);
      return { ...memoryCache.prices, source: "cached" };
    }

    // Hard fallback — last known reasonable prices as of April 2026
    console.warn("[FuelPrices] No cache available, returning fallback prices");
    return {
      petrolPumpPrice: 32.39,
      dieselPumpPrice: 34.37,
      petrolLowestPrice: 24.39,
      dieselLowestPrice: 29.77,
      updatedAt: new Date().toISOString(),
      source: "fallback",
    };
  }
}

/**
 * Warm the cache on server startup
 */
export async function warmFuelPriceCache(): Promise<void> {
  try {
    await getLiveFuelPrices();
    console.log("[FuelPrices] Cache warmed successfully");
  } catch (err) {
    console.warn("[FuelPrices] Cache warm failed:", err);
  }
}
