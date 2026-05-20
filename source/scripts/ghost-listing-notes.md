# Ghost Listing Investigation

## Finding 1: Item 30032 EXISTS in DB
- It's active, has pricing, brand (Hany AG), model (2624-EA)
- NOT a ghost listing in the traditional sense

## Finding 2: Product page redirects to LOGIN
- /product/30032 on www.equip.hk redirects to Manus OAuth login
- This means the product detail page requires authentication
- Root cause: the `trpc.favourites.check` query uses protectedProcedure
- When unauthenticated, the query fails with UNAUTHED error
- The global error handler in main.tsx redirects to login on any UNAUTHED error

## Finding 3: Pricing mismatch
- ProductDetail.tsx calculates weekly/monthly from dailyRate (lines 101-102):
  - weeklyRate = dailyRate * 7 * 0.9
  - monthlyRate = dailyRate * 30 * 0.8
- But the DB has actual weeklyRate and monthlyRate columns with audited values
- The page ignores the DB weekly/monthly rates and recalculates them!

## Fixes needed:
1. Make favourites.check graceful for unauthenticated users (return {favourited: false})
2. Use actual DB weeklyRate/monthlyRate instead of recalculating
3. Ensure equipment.getById is a publicProcedure
