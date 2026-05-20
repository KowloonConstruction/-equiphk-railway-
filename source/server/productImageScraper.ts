/**
 * productImageScraper.ts
 *
 * Fetches a real manufacturer product photo using a tiered search strategy:
 *
 * Tier 1 — Official manufacturer site (e.g. hilti.com, makita.com)
 *   Searches DuckDuckGo with "site:brand.com brand model product"
 *
 * Tier 2 — Known professional distributor / e-commerce sites
 *   Searches DuckDuckGo with "site:toolstation.com OR site:screwfix.com ..."
 *
 * Tier 3 — General image search (DDG then Bing)
 *   Falls back to broad queries if the above yield nothing
 *
 * For each tier, the first downloadable JPG/PNG/WEBP is uploaded to S3
 * and its CDN URL is returned.
 */

import axios from "axios";
import { storagePut } from "./storage";

// ─── Brand → official domain map ─────────────────────────────────────────────
const BRAND_DOMAINS: Record<string, string> = {
  hilti: "hilti.com",
  makita: "makita.com",
  bosch: "bosch-professional.com",
  dewalt: "dewalt.com",
  "de walt": "dewalt.com",
  milwaukee: "milwaukeetool.com",
  "milwaukee tool": "milwaukeetool.com",
  stanley: "stanleytools.com",
  "stanley fatmax": "stanleytools.com",
  ridgid: "ridgid.com",
  metabo: "metabo.com",
  festool: "festool.com",
  hitachi: "hikoki.com",
  hikoki: "hikoki.com",
  kango: "kangohammers.com",
  husqvarna: "husqvarna.com",
  stihl: "stihl.com",
  honda: "honda.com",
  yamaha: "yamaha-motor.com",
  ingersoll: "ingersollrand.com",
  "ingersoll rand": "ingersollrand.com",
  atlas: "atlascopco.com",
  "atlas copco": "atlascopco.com",
  graco: "graco.com",
  wagner: "wagnerspraytech.com",
  karcher: "karcher.com",
  nilfisk: "nilfisk.com",
  wacker: "wackerneuson.com",
  "wacker neuson": "wackerneuson.com",
  dynapac: "dynapac.com",
  bomag: "bomag.com",
  ammann: "ammann.com",
  weber: "weber-mt.com",
  mikasa: "mikasatrading.com",
  multiquip: "multiquip.com",
  generac: "generac.com",
  kipor: "kipor.com",
  briggs: "briggsandstratton.com",
  "briggs & stratton": "briggsandstratton.com",
  kohler: "kohlerpower.com",
  "caterpillar": "cat.com",
  cat: "cat.com",
  jcb: "jcb.com",
  komatsu: "komatsu.com",
  liebherr: "liebherr.com",
  manitowoc: "manitowoc.com",
  terex: "terex.com",
  genie: "genielift.com",
  jlg: "jlg.com",
  skyjack: "skyjack.com",
  haulotte: "haulotte.com",
  snorkel: "snorkellifts.com",
  doka: "doka.com",
  peri: "peri.com",
  layher: "layher.com",
  harsco: "harsco.com",
  safway: "safway.com",
  ringlock: "ringlock.com",
  fluke: "fluke.com",
  megger: "megger.com",
  kyoritsu: "kyoritsu-test.co.jp",
  hioki: "hioki.com",
  leica: "leica-geosystems.com",
  trimble: "trimble.com",
  topcon: "topcon.com",
  spectra: "spectraprecision.com",
  sola: "sola.at",
  stabila: "stabila.com",
  irwin: "irwin.com",
  knipex: "knipex.com",
  gedore: "gedore.com",
  facom: "facom.com",
  snap: "snapon.com",
  "snap-on": "snapon.com",
};

// ─── Professional distributor / trade sites ───────────────────────────────────
const DISTRIBUTOR_SITES = [
  "toolstation.com",
  "screwfix.com",
  "machinemart.co.uk",
  "toolstoday.com",
  "acmetools.com",
  "toolbarn.com",
  "amazon.com",
  "grainger.com",
  "zoro.com",
  "reece.com.au",
  "bunnings.com.au",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a brand name for domain lookup */
function normaliseBrand(brand: string): string {
  return brand.toLowerCase().trim();
}

/** Get the official domain for a brand, if known */
function getOfficialDomain(brand: string): string | null {
  const key = normaliseBrand(brand);
  return BRAND_DOMAINS[key] ?? null;
}

/** Perform a DuckDuckGo image search and return candidate image URLs */
async function searchDDGImages(query: string): Promise<string[]> {
  try {
    const initResp = await axios.get(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        timeout: 12_000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
      }
    );
    const vqdMatch = initResp.data.match(/vqd=['"]([^'"]+)['"]/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const imgResp = await axios.get("https://duckduckgo.com/i.js", {
      params: { q: query, o: "json", vqd, f: ",,,,,", p: "1" },
      timeout: 12_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Referer: "https://duckduckgo.com/",
      },
    });

    const results: Array<{ image: string; url: string }> =
      imgResp.data?.results ?? [];
    return results
      .map((r) => r.image)
      .filter((url) => isUsableImageUrl(url));
  } catch {
    return [];
  }
}

/** Try Bing image search */
async function searchBingImages(query: string): Promise<string[]> {
  try {
    const resp = await axios.get(
      `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2&first=1`,
      {
        timeout: 12_000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
      }
    );
    const matches = [...resp.data.matchAll(/murl&quot;:&quot;([^&]+)&quot;/g)];
    return matches
      .map((m) => decodeURIComponent(m[1]))
      .filter((url) => isUsableImageUrl(url));
  } catch {
    return [];
  }
}

/** Check if a URL looks like a usable product image */
function isUsableImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const ext = u.pathname.split(".").pop()?.toLowerCase() ?? "";
    // Accept standard image formats
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return false;
    // Reject known junk / icon / logo-only paths
    const path = u.pathname.toLowerCase();
    if (path.includes("/icon") || path.includes("/logo") || path.includes("/favicon")) return false;
    if (path.includes("placeholder") || path.includes("no-image")) return false;
    return true;
  } catch {
    return false;
  }
}

/** Score a candidate URL — higher = more likely to be an official manufacturer photo */
function scoreUrl(url: string, brand: string): number {
  let score = 0;
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    const officialDomain = getOfficialDomain(brand);

    // Tier 1: official manufacturer domain
    if (officialDomain && hostname.includes(officialDomain.replace("www.", ""))) {
      score += 100;
    }
    // Tier 2: known professional distributor
    for (const dist of DISTRIBUTOR_SITES) {
      if (hostname.includes(dist.replace("www.", ""))) {
        score += 50;
        break;
      }
    }
    // Prefer larger images (longer paths often = product detail pages)
    if (u.pathname.length > 30) score += 5;
    // Prefer paths with "product" or "item" in them
    const path = u.pathname.toLowerCase();
    if (path.includes("product") || path.includes("item") || path.includes("catalog")) score += 10;
    // Avoid thumbnails
    if (path.includes("thumb") || path.includes("small") || path.includes("_s.")) score -= 20;
  } catch {
    // ignore
  }
  return score;
}

/** Try to download an image URL and return its buffer + content-type */
async function downloadImage(
  url: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const resp = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 12_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.google.com/",
      },
      maxRedirects: 5,
    });
    const ct: string = resp.headers["content-type"] ?? "image/jpeg";
    if (!ct.startsWith("image/")) return null;
    // Reject suspiciously small files (likely placeholder icons < 5 KB)
    if (resp.data.byteLength < 5_000) return null;
    return { buffer: Buffer.from(resp.data), contentType: ct };
  } catch {
    return null;
  }
}

/**
 * Build a ranked list of candidate image URLs using a tiered search strategy.
 * Tier 1: official manufacturer site search
 * Tier 2: professional distributor site search
 * Tier 3: general DDG + Bing fallback
 */
async function gatherCandidates(
  brand: string,
  model: string,
  itemName: string
): Promise<string[]> {
  const allCandidates: Array<{ url: string; score: number }> = [];

  const addCandidates = (urls: string[]) => {
    for (const url of urls) {
      allCandidates.push({ url, score: scoreUrl(url, brand) });
    }
  };

  // ── Tier 1: Official manufacturer site ──────────────────────────────────────
  const officialDomain = getOfficialDomain(brand);
  if (officialDomain && model) {
    const q1 = `site:${officialDomain} ${brand} ${model}`;
    const t1 = await searchDDGImages(q1);
    addCandidates(t1);
  }

  // ── Tier 2: Distributor sites ────────────────────────────────────────────────
  if (model) {
    const distQuery = `${brand} ${model} product site:toolstation.com OR site:screwfix.com OR site:machinemart.co.uk OR site:grainger.com OR site:amazon.com`;
    const t2 = await searchDDGImages(distQuery);
    addCandidates(t2);
  }

  // ── Tier 3: General image search ─────────────────────────────────────────────
  const generalQuery = `${brand} ${model || itemName} official product photo white background`;
  const t3a = await searchDDGImages(generalQuery);
  addCandidates(t3a);

  if (allCandidates.length < 5) {
    const t3b = await searchBingImages(`${brand} ${model || itemName} product image`);
    addCandidates(t3b);
  }

  // ── Fallback: item name only ─────────────────────────────────────────────────
  if (allCandidates.length === 0) {
    const fallback = await searchDDGImages(`${itemName} equipment tool product photo`);
    addCandidates(fallback);
    if (allCandidates.length === 0) {
      const fallback2 = await searchBingImages(`${itemName} equipment product image`);
      addCandidates(fallback2);
    }
  }

  // Sort by score descending, deduplicate
  const seen = new Set<string>();
  return allCandidates
    .sort((a, b) => b.score - a.score)
    .map((c) => c.url)
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

/**
 * Main entry point.
 * Searches for a real manufacturer product photo and uploads it to S3.
 * Returns the CDN URL or null if no suitable image was found.
 */
export async function fetchProductImageFromWeb(
  brand: string | null | undefined,
  model: string | null | undefined,
  itemName: string,
  excludeUrls: string[] = []
): Promise<{ cdnUrl: string; sourceUrl: string } | null> {
  const safeBrand = brand?.trim() ?? "";
  const safeModel = model?.trim() ?? "";

  const candidates = await gatherCandidates(safeBrand, safeModel, itemName);

  // Filter out previously rejected URLs (compare by origin image URL)
  const filteredCandidates = excludeUrls.length > 0
    ? candidates.filter(url => !excludeUrls.includes(url))
    : candidates;

  // Try the top-ranked candidates (up to 8)
  for (const url of filteredCandidates.slice(0, 8)) {
    const downloaded = await downloadImage(url);
    if (!downloaded) continue;

    const ext =
      downloaded.contentType === "image/webp"
        ? "webp"
        : downloaded.contentType === "image/png"
          ? "png"
          : "jpg";
    const fileKey = `equipment-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    try {
      const { url: cdnUrl } = await storagePut(
        fileKey,
        downloaded.buffer,
        downloaded.contentType
      );
      return { cdnUrl, sourceUrl: url };
    } catch {
      continue;
    }
  }

  return null;
}
