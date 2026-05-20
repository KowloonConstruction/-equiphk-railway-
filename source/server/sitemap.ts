/**
 * Dynamic Sitemap Generator
 * Serves /sitemap.xml with all public pages including every product, bundle, and consumable
 * Auto-updates from the database — no manual maintenance required
 */

import { getDb } from "./db";
import { equipmentItems, equipmentBundles, consumables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SITE_URL = "https://www.equip.hk";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, priority: string, changefreq: string, lastmod?: string): string {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${lastmodTag}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export function registerSitemapRoute(app: any) {
  // Sitemap
  (app as any).get("/sitemap.xml", async (_req: any, res: any) => {
    try {
      const db = await getDb();

      const today = new Date().toISOString().split("T")[0];

      // Static pages
      const staticUrls = [
        urlEntry(`${SITE_URL}/`, "1.0", "weekly", today),
        urlEntry(`${SITE_URL}/equipment`, "0.9", "daily", today),
        urlEntry(`${SITE_URL}/bundles`, "0.8", "weekly", today),
        urlEntry(`${SITE_URL}/consumables`, "0.8", "weekly", today),
        urlEntry(`${SITE_URL}/get-a-quote`, "0.7", "monthly", today),
      ];

      let dynamicUrls: string[] = [];

      if (db) {
        // Equipment items (active only)
        const items = await db
          .select({ id: equipmentItems.id, updatedAt: equipmentItems.updatedAt })
          .from(equipmentItems)
          .where(eq(equipmentItems.availability, "available"));

        for (const item of items) {
          const lastmod = item.updatedAt
            ? new Date(item.updatedAt).toISOString().split("T")[0]
            : today;
          dynamicUrls.push(urlEntry(`${SITE_URL}/equipment/${item.id}`, "0.8", "weekly", lastmod));
        }

        // Bundles
        const bundles = await db
          .select({ id: equipmentBundles.id, updatedAt: equipmentBundles.updatedAt })
          .from(equipmentBundles)
          .where(eq(equipmentBundles.isActive, true));

        for (const bundle of bundles) {
          const lastmod = bundle.updatedAt
            ? new Date(bundle.updatedAt).toISOString().split("T")[0]
            : today;
          dynamicUrls.push(urlEntry(`${SITE_URL}/bundles/${bundle.id}`, "0.7", "weekly", lastmod));
        }

        // Consumables
        const consumableList = await db
          .select({ id: consumables.id, updatedAt: consumables.updatedAt })
          .from(consumables);

        for (const c of consumableList) {
          const lastmod = c.updatedAt
            ? new Date(c.updatedAt).toISOString().split("T")[0]
            : today;
          dynamicUrls.push(urlEntry(`${SITE_URL}/consumables/${c.id}`, "0.6", "monthly", lastmod));
        }
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...dynamicUrls].join("\n")}
</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
      res.status(200).send(xml);
    } catch (err) {
      console.error("[Sitemap] Error generating sitemap:", err);
      res.status(500).send("Error generating sitemap");
    }
  });
}
