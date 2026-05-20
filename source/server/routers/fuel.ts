/**
 * Fuel Router
 * Handles live fuel price fetching and equipment fuel type management
 */

import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { getLiveFuelPrices } from "../fuelPriceScraper";
import { getDb } from "../db";
import { equipmentItems } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const fuelRouter = router({
  /**
   * Get live fuel prices from Consumer Council HK
   * Cached in memory for the day — fresh fetch on first call each day
   */
  getLivePrices: publicProcedure.query(async () => {
    const prices = await getLiveFuelPrices();
    return prices;
  }),

  /**
   * Get the fuel type for a specific equipment item
   * Used by product detail page to decide whether to show the fuel add-on
   */
  getItemFuelType: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { fuelType: "none" as const };
      const [item] = await db
        .select({ fuelType: equipmentItems.fuelType })
        .from(equipmentItems)
        .where(eq(equipmentItems.id, input.itemId))
        .limit(1);
      return { fuelType: item?.fuelType ?? "none" };
    }),

  /**
   * Admin: set the fuel type for an equipment item
   */
  setItemFuelType: adminProcedure
    .input(
      z.object({
        itemId: z.number(),
        fuelType: z.enum(["none", "petrol", "diesel"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(equipmentItems)
        .set({ fuelType: input.fuelType })
        .where(eq(equipmentItems.id, input.itemId));
      return { success: true };
    }),

  /**
   * Admin: bulk set fuel type for multiple items
   */
  bulkSetFuelType: adminProcedure
    .input(
      z.object({
        itemIds: z.array(z.number()),
        fuelType: z.enum(["none", "petrol", "diesel"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      let updated = 0;
      for (const id of input.itemIds) {
        await db
          .update(equipmentItems)
          .set({ fuelType: input.fuelType })
          .where(eq(equipmentItems.id, id));
        updated++;
      }
      return { updated };
    }),
});
