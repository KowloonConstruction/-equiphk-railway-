
## Real-Time Notifications (SSE)

### Server-Side
- [x] Create SSE endpoint (/api/events) for real-time event streaming
- [x] Build event broadcaster module to manage connected clients
- [x] Emit events when new equipment is added via admin
- [x] Emit events when new promotions/announcements are created
- [x] Emit events when new site notifications are created

### Client-Side
- [x] Create useSSE hook for connecting to the event stream
- [x] Build real-time toast notification component (animated, branded)
- [x] Auto-refresh notification bell count on new events
- [x] Auto-refresh announcement banner on new announcements
- [x] Handle reconnection on connection drop

### Testing
- [x] Write vitest tests for SSE event broadcasting (9 tests)
- [x] Verify all 4 test files pass (47 total tests)


## Excel Equipment Register Import

- [ ] Build Excel import API endpoint (parse file, extract data, search for images)
- [ ] Create admin UI for Excel upload
- [ ] Auto-search for product images using tool name + brand
- [ ] Stack identical items by quantity
- [ ] Bulk import 186 items into database
- [ ] Test import with Casey's equipment register
- [ ] Save checkpoint


## Bulk Excel Import with AI Image Sourcing

- [x] Create backend API endpoint for Excel upload (POST /api/trpc/equipment.bulkImport)
- [x] Integrate AI image generation for each equipment item
- [x] Build admin UI for file upload with progress tracking
- [ ] Test import with all 186 equipment items
- [ ] Verify images are sourced and items appear on public site
- [ ] Save checkpoint with all inventory live


## AI-Powered Equipment Categorization

- [x] Analyze all 186 equipment items with AI
- [x] Generate 13 smart categories (Power Tools, Scaffolding, Safety, etc.)
- [x] Create categories in database via seed script
- [x] Verify categories are live on the site


## New Arrivals Section

- [x] Create NewArrivals carousel component
- [x] Add tRPC query for latest 20 equipment items
- [x] Integrate into homepage between Hero and Equipment sections
- [x] Test with real data after bulk import
- [x] Save checkpoint


## Equipment Comparison Feature

- [x] Create comparison context/state management
- [x] Build ComparisonModal component with side-by-side layout
- [x] Add "Compare" button to equipment cards
- [x] Implement comparison table with specs, pricing, availability
- [x] Add "Clear Comparison" and "Add to Comparison" actions
- [x] Floating comparison button with item count
- [x] Test with real data
- [x] Save checkpoint


## AI Product Information Generation

- [x] Update bulk import API to generate descriptions via AI
- [x] Generate product specifications for each item
- [x] Integrated with bulk import workflow
- [x] Save checkpoint


## Homepage Search Feature

- [x] Create search component with real-time filtering
- [x] Add search API endpoint (equipment.search)
- [x] Integrate search bar into hero section
- [x] Display search results with category filters
- [x] Test search functionality
- [x] Save checkpoint


## Sample Equipment Data

- [x] Create seed script with 29 sample equipment items
- [x] Include daily, weekly, and monthly rates for each
- [x] Populate across all 13 categories
- [x] Verify items appear on public site
- [x] Test search, comparison, and notifications
- [x] Save checkpoint


## Search Bar Repositioning

- [x] Remove search bar from HeroSection
- [x] Add search bar to Navbar between logo and menu
- [x] Adjust navbar layout for responsive design
- [x] Test on mobile and desktop
- [x] Save checkpoint


## Product Detail Pages & Rental Cart

- [x] Create product detail page component (/product/:id)
- [x] Display item image, description, specs, daily/weekly/monthly pricing
- [x] Build rental cart context for state management
- [x] Add "Add to Rental Cart" button with date picker
- [x] Create rental cart page showing selected items
- [x] Make all equipment cards clickable and link to detail pages
- [x] Add related equipment suggestions on detail page
- [x] Update search results to link to product pages
- [x] Add cart button to navbar with item count badge
- [x] Write comprehensive vitest tests (21 new tests for product detail/cart)
- [x] All 78 vitest tests passing
- [ ] Save checkpoint

## Unique Item Descriptions (AI-Generated, Mixed Tone)

- [x] Create regenerate-descriptions.ts with AI prompt templates
- [x] Add tone templates for different equipment categories (B2C vs B2B)
- [x] Add admin.regenerateDescriptions tRPC procedure
- [x] Create AdminDescriptionRegeneration page (/admin/regenerate-descriptions)
- [x] Add route to App.tsx
- [x] Fix React hooks error in ProductDetail page
- [x] All 78 vitest tests passing
- [x] Product detail pages fully functional
- [ ] Save checkpoint

## Product Detail Page Redesign (Sunbelt-style)

- [x] Breadcrumb navigation (Home > Category > Product)
- [x] Large product image left, sticky pricing panel right
- [x] Key Specs bullet points (3 top specs above fold)
- [x] 3-column pricing: Daily | Weekly | Monthly
- [x] Tab navigation: Overview | Specifications | Safety
- [x] Overview tab: full description + key features list
- [x] Specifications tab: table format (Make, Model, Weight, etc.)
- [x] Safety tab: PPE requirements and safety notes
- [x] Related equipment section at bottom
- [ ] Save checkpoint

## Logo Placement Improvement

- [x] Fix logo size and top-left alignment in Navbar
- [x] Create transparent background version of logo PNG
- [x] Switch to inline SVG pill logo for crisp rendering on dark backgrounds
- [x] Add tagline "Rent Anything · Build Everything" below pill mark
- [x] Ensure logo is prominent and well-spaced
- [x] All 78 vitest tests passing
- [ ] Save checkpoint

## Bug Fix — Regenerate Descriptions Error

- [x] Fix "Cannot read properties of undefined (reading 'findMany')" in admin regenerate descriptions
- [x] Replaced db.query.findMany (relational) with standard db.select().leftJoin() query
- [x] Added missing equipmentCategories import
- [x] All 78 vitest tests passing
- [ ] Save checkpoint

## AI Description Regeneration (All Items)

- [x] Run regeneration script for all 214 equipment items
- [x] 214 updated, 0 failed
- [x] Mixed tone: casual/DIY for power tools, technical/B2B for heavy plant
- [x] Hong Kong context included in all descriptions
- [ ] Save checkpoint

## Logo & Search Bar on Item Pages

- [x] Add EquipHK logo to product detail page header
- [x] Add search bar to product detail page header
- [x] Navbar now renders on product detail pages (loading, error, and main states)
- [x] All 78 vitest tests passing
- [ ] Save checkpoint

## Navbar on Cart Page

- [x] Add Navbar to RentalCart page (logo, search bar, cart button)
- [x] Fixed JSX div nesting for both empty and filled cart states
- [x] All 78 vitest tests passing
- [ ] Save checkpoint

## Navbar Cleanup

- [x] Remove phone number from navbar (desktop and mobile)
- [x] Made search bar wider (max-w-sm → max-w-xl)
- [x] All 78 vitest tests passing
- [ ] Save checkpoint

## Equipment Sub-Categories

- [x] Add subCategoryId column to equipment_items table in schema
- [x] Create equipment_sub_categories table in schema
- [x] Run db:push to migrate schema
- [x] Seed sub-categories (13 main × 4 subs each = 52 total)
- [x] Assign sub-categories to all 214 items
- [x] Add tRPC procedures for sub-category queries and filtering
- [x] Build mega-dropdown navbar component under Equipment
- [x] Add sub-category filter chips to catalog section
- [x] Test filtering works end-to-end (88 tests passing)
- [x] Save checkpoint

## Admin Sub-Category Management

- [x] Add tRPC CRUD procedures: createSubCategory, updateSubCategory, deleteSubCategory, reorderSubCategories
- [x] Build AdminSubCategories page with category accordion + sub-category list
- [x] Drag-and-drop reordering (dnd-kit) with optimistic updates
- [x] Inline rename with optimistic update
- [x] Create new sub-category form per category
- [x] Toggle active/inactive per sub-category
- [x] Delete with confirmation dialog (unassigns items, does not delete them)
- [x] Add route /admin/sub-categories to App.tsx
- [x] Add link in admin sidebar/nav (header button + tab bar link)
- [x] 88 vitest tests still passing
- [x] Save checkpoint

## Model Numbers for All Equipment Items

- [ ] Audit how many items are missing model numbers
- [ ] Generate realistic model numbers via AI for all missing items
- [ ] Apply model numbers to database
- [x] Verify model coverage: 93 items have model numbers, 213 have brands (121 genuinely N/A in source Excel)
- [ ] Save checkpoint

## Model Numbers from Excel Register

- [x] Apply 102 real model numbers and brands from Equipment_Register_20260326163622.xlsx to DB
- [x] Verify model coverage: 93 items have model numbers, 213 have brands (121 genuinely N/A in source Excel)
- [ ] Save checkpoint

## Operation Manual Attachments

- [ ] Add equipment_manuals table to schema (id, equipmentItemId, fileName, fileUrl, fileKey, uploadedAt)
- [ ] Run db:push to migrate schema
- [ ] Add S3 upload + tRPC procedures (uploadManual, deleteManual, getManualsByItem)
- [ ] Build admin UI: upload PDF per item in AdminInventory edit panel
- [ ] Show "Download Manual" button on public product detail page
- [ ] Write vitest tests for manual procedures
- [ ] Save checkpoint

## Navbar Bug Fix

- [x] Fix navbar navigation links not working from inside item detail pages (hash-based scroll on arrival)

## Search Bar Text

- [x] Change search bar placeholder text to "Find Your Tool"

## New Arrivals Fix

- [x] Make New Arrivals cards clickable and link to individual product detail pages

## UI Cleanup

- [x] Remove emojis from equipment mega-dropdown category list

## Reconciliation Fixes (from Excel audit)

- [ ] Fix 10 brand discrepancies from reconciliation report
- [ ] Fix 20 model number discrepancies from reconciliation report
- [ ] Save checkpoint

## Reconciliation Action Items 3 & 4

- [ ] Add 88 missing items from Excel register to the database
- [ ] Review and clean up 115 DB-only items (keep real products, remove pure placeholders)
- [ ] Assign correct categories and sub-categories to new items
- [ ] Save checkpoint

## Site Audit

- [ ] Audit all public-facing pages (homepage, catalog, product detail, contact, pricing, etc.)
- [ ] Audit admin panel pages
- [ ] Check data integrity (items without images, missing prices, broken links)
- [ ] Compile and deliver prioritised repair report

## Site Audit Repairs (Repair-As-You-Go)

- [ ] Fix hero stat "500+ Equipment Units" → use real DB count dynamically
- [ ] Fix category filter tabs on homepage — hardcoded slugs don't match DB slugs
- [ ] Fix placeholder phone numbers (+852 9876 5432 / +852 1234 5678)
- [ ] Fix Milwaukee M18 Vacuum wrongly in "Chainsaws & Outdoor" → Power Tools
- [ ] Fix Makita 18V Cordless Vacuum wrongly in "Chainsaws & Outdoor" → Power Tools
- [ ] Fix other category misassignments (Graco Paint Gun, IMC Sprayer, Bosch Vacuum, Sanco Washer, etc.)
- [ ] Fix product detail page: pricing shows "—" for all tiers (no rates set on most items)
- [ ] Fix product detail page: "Currently unavailable" shown even for Available items
- [ ] Add /admin redirect to /admin/inventory
- [ ] Fix "Categories" stat on admin dashboard showing "—" instead of 13
- [ ] Fix New Arrivals to show only genuinely new items (added in last 30 days)
- [ ] Save checkpoint

## AI Triage Chat + WhatsApp Escalation

- [x] Build floating AI triage chat widget (bottom-right, all pages)
- [x] Implement 5-step triage flow: issue type → details → diagnostics → manual reference → escalation
- [x] WhatsApp escalation to +85298325789 with full conversation summary
- [x] Out-of-hours message (10pm–7am)
- [x] Add tRPC procedure for AI triage conversation (server-side LLM)
- [x] Save support ticket to DB on escalation
- [x] Notify owner via existing notification system on escalation

## Operation Manual Attachments

- [ ] Add equipment_manuals table to schema
- [ ] Run db:push to migrate schema
- [ ] Add S3 upload + tRPC procedures (uploadManual, deleteManual, getManualsByItem)
- [ ] Build admin UI: upload PDF per item in AdminInventory edit panel
- [ ] Show "Download Manual" button on public product detail page
- [ ] Wire manual lookup into AI triage breakdown path
- [ ] Write vitest tests for manual procedures

## AI Manual Auto-Sourcing

- [x] Add tRPC procedure: manuals.autoSource — uses AI to find official PDF manual URL by brand+model, downloads and uploads to S3
- [x] Add "Auto-Source Manual" button to ManualUploadDialog with loading/result state
- [x] Wire auto-source trigger into equipment add/edit form (runs after save if brand+model present)
- [x] Show sourcing result (found/not found) with manual preview link
- [ ] Save checkpoint

## AI Auto-Source Product Info

- [x] Add tRPC procedure: equipment.autoFillInfo — uses AI to source description, specs, and recommended rental pricing by brand + model
- [x] Return structured JSON: description, specifications, suggestedDailyRate, suggestedWeeklyRate, suggestedMonthlyRate, category hint
- [x] Add "Auto-Fill with AI" button in admin equipment add/edit form
- [x] Show preview of AI-sourced data before applying (user can accept/reject each field)
- [x] Apply accepted fields to the form inputs
- [ ] Save checkpoint

## Category & Sub-Category Audit

- [ ] Export all 274 items with categories and sub-categories
- [ ] Identify all misplaced items
- [ ] Apply all corrections
- [ ] Save checkpoint

## Sub-Category Field in Inventory Manager

- [x] Add Category + Sub-Category dropdowns to each item's edit form in AdminInventory
- [x] Sub-category list filters dynamically based on selected category
- [x] Update tRPC equipment.update procedure to accept categoryId and subCategoryId
- [x] Save checkpoint

## Bulk Re-Categorise in Inventory Manager

- [x] Add equipment.bulkUpdateCategory tRPC procedure (accepts array of IDs + categoryId + subCategoryId)
- [x] Add row checkboxes to inventory table
- [x] Add select-all checkbox in table header
- [x] Add floating selection toolbar showing count + action buttons
- [x] Build BulkRecategoriseDialog with category + sub-category dropdowns
- [x] Apply bulk update with optimistic invalidation
- [x] Write vitest tests for bulkUpdateCategory procedure
- [x] Save checkpoint

## Bulk AI Auto-Fill for All Products

- [x] Add bulkAutoFillInfo tRPC procedure (admin only) — iterates all items missing description/specs/pricing, calls AI per item
- [x] Build AdminAutoFill page with start button, overwrite toggle, item-by-item log, and final summary
- [x] Add route /admin/auto-fill to App.tsx
- [x] Add AI Auto-Fill button to AdminInventory header nav
- [x] Write vitest tests for bulkAutoFillInfo procedure (10 tests)
- [x] Save checkpoint

## AI Auto-Fill Per-Field Selection

- [ ] Update bulkAutoFillInfo tRPC procedure to accept a `fields` object (description, specs, dailyRate, weeklyRate, monthlyRate)
- [ ] Update AdminAutoFill UI with per-field checkboxes, select-all toggle, and smart "only fill missing" default per field
- [ ] Update vitest tests to cover field-selective behaviour
- [ ] Save checkpoint

## AI Pricing Rounding

- [ ] Round all AI-suggested daily/weekly/monthly rates to nearest $10 HKD in bulkAutoFillInfo
- [ ] Update AI prompt to instruct nearest-$10 rounding
- [ ] Apply same rounding to the single-item autoFillInfo procedure
- [ ] Save checkpoint

## Sub-Category Column in Inventory Table

- [x] Add sub-category name to the equipment list query response
- [x] Add Sub-Category badge column to inventory table (between Category and Availability)
- [x] Save checkpoint

## AI Photo Sourcing for Equipment Items

- [ ] Add admin.bulkSourceImages tRPC procedure — fetches all DB items, generates photo per item using brand+model, saves to S3, updates imageUrl
- [ ] Add equipment.sourceImage tRPC procedure for per-item re-source
- [ ] Auto-trigger sourceImage after item create
- [ ] Build AdminPhotoSource page with progress log and results summary
- [ ] Add Re-source Photo button to item edit form
- [ ] Add AI Source Photos button to inventory header nav
- [ ] Write vitest tests
- [ ] Save checkpoint

## Favourites Feature

- [x] Add userFavourites table to drizzle schema (userId, equipmentItemId, createdAt)
- [x] Run pnpm db:push to migrate
- [x] Add DB helpers: addFavourite, removeFavourite, listFavourites, isFavourite, getFavouriteIds
- [x] Add tRPC procedures: favourites.toggle, favourites.list, favourites.ids, favourites.check
- [x] Add heart button to equipment cards in EquipmentSection (optimistic toggle)
- [x] Build Favourites page (/favourites) showing saved items as product cards
- [x] Add heart icon with count badge to navbar (desktop + mobile)
- [x] Add heart button to ProductDetail page (next to Add to Cart)
- [x] Write vitest tests for favourites procedures (10 tests)
- [x] Save checkpoint

## Fix Auto-Fill 504 Gateway Timeout

- [ ] Split bulkAutoFillInfo into batched chunks (e.g. 10 items per request)
- [ ] Frontend calls batches sequentially, accumulating progress
- [ ] Save checkpoint

## Real Manufacturer Photo Sourcing (Web Scraping)

- [ ] Build fetchProductImageFromWeb helper — searches web for brand+model product image, downloads best result, uploads to S3
- [ ] Replace generateImage in equipment.sourceImage with web scraper
- [ ] Replace generateImage in admin.bulkSourceImages with web scraper
- [ ] Replace generateImage in equipment.create auto-trigger with web scraper
- [ ] Replace generateImage in bulk-import.ts if used there
- [ ] Run tests and verify
- [ ] Save checkpoint

## Photo Approval Queue

- [x] Add `pendingImageUrl` and `imageApprovalStatus` (pending/approved/rejected/none) columns to equipmentItems schema
- [x] Run pnpm db:push to migrate
- [x] Update productImageScraper to save sourced URL to `pendingImageUrl` instead of `imageUrl`, set status to "pending"
- [x] Add DB helpers: listPendingImageApprovals, approveImage, rejectImage, countPendingImageApprovals
- [x] Add tRPC procedures: admin.listPendingImages, admin.approveImage, admin.rejectImage, admin.pendingImageCount
- [x] Build AdminPhotoApproval page with side-by-side current vs pending image comparison, approve/reject buttons, item name/brand/model context
- [x] Add nav link to photo approval page in admin header (with live pending count badge)
- [x] Write vitest tests for approval procedures (17 tests, 133 total passing)
- [x] Save checkpoint

## Fix Photo Source 504 Timeout (Batching)

- [x] Add offset + batchSize params to admin.bulkSourceImages tRPC procedure
- [x] Return totalToSource + batchCount from each batch call
- [x] Update AdminPhotoSource frontend to loop through batches sequentially
- [x] Add live progress bar, per-item log, and stop button (matching auto-fill UX)
- [x] Run tests and save checkpoint

## Improved Photo Sourcing — Manufacturer Sites + Re-source After Reject

- [x] Rewrite productImageScraper to prioritise official manufacturer/distributor sites (Hilti, Makita, Bosch, DeWalt, 60+ brands mapped)
- [x] Add site-specific search targets: brand official site first, then distributor sites, then general image search as fallback
- [x] Add admin.reSourceImage tRPC procedure (re-runs scraper for a single item, sets status back to pending)
- [x] Add "Re-source Photo" button to rejected items on the Photo Approval page
- [x] Show rejected items in a separate section on the approval page so they are easy to find
- [x] Run tests and save checkpoint (133 passing)

## Reviewed Checkbox for Inventory Items

- [x] Add `isReviewed` boolean column to equipmentItems schema (default false)
- [x] Run pnpm db:push to migrate
- [x] Add isReviewed to listEquipmentItems select projection in db.ts
- [x] Add isReviewed to equipment.create and equipment.update procedures
- [x] Add dedicated equipment.toggleReviewed procedure with optimistic update
- [x] Show Reviewed toggle button in AdminInventory item rows (green when reviewed, grey when not)
- [x] Add "Reviewed" filter dropdown to AdminInventory toolbar (All / ✓ Reviewed / Not Reviewed)
- [x] Add Reviewed toggle to EquipmentFormDialog edit form
- [x] Write vitest tests for toggleReviewed procedure (7 tests, 140 total passing)
- [x] Save checkpoint

## Remove Bulk Re-Categorise from Inventory Manager

- [x] Remove floating selection toolbar (Re-Categorise button, count pill, clear button)
- [x] Remove row checkboxes from inventory table
- [x] Remove BulkRecategoriseDialog component definition and all usage
- [x] Remove related state (selectedIds, showBulkRecategorise) and helpers (toggleItem, toggleAll, clearSelection)
- [x] Remove unused FolderInput and X icon imports
- [x] Save checkpoint

## Data Quality Audit — Brands, Models, Descriptions & Pricing

- [x] Export all 271 equipment items from database for analysis
- [x] Build LLM-powered audit script to review each item: brand accuracy, model number vs description match, voltage correctness
- [x] Apply tiered category markups above UK rates: 40% standard, 35% pneumatic/hydraulic/pumps, 30% generators, 50% specialist/marine
- [x] Apply corrections to database: 90 brand fixes, 85 model fixes, 270 rate updates, 0 errors
- [x] Verify corrections applied correctly — 140 tests passing
- [x] Save checkpoint

## Remove Hong Kong from Product Descriptions

- [x] Identified 196 items with "Hong Kong" in descriptions
- [x] Ran SQL REPLACE to remove all references + cleaned up double spaces
- [x] Verified 0 remaining references

## Fix Duplicate Key Errors on Auto-Fill Page

- [x] Investigated — no duplicate IDs in DB; issue is same item appearing across batches in the results log
- [x] Fixed React key to use `${item.id}-${idx}` for unique keys in item log
- [x] Also removed Hong Kong references from the LLM prompt in bulkAutoFillInfo, updated to 40% above UK rates
- [x] 140 tests passing
- [x] Save checkpoint

## Fix Ghost Listings & Pricing Mismatch

- [x] Investigated — item 30032 exists in DB, not a ghost. Login redirect caused by auth error handler
- [x] Investigated — ProductDetail recalculates weekly/monthly from daily instead of using DB values
- [x] Fix ProductDetail to use actual DB weeklyRate and monthlyRate instead of recalculating
- [x] Fixed — all procedures (equipment.getById, favourites.check, etc.) already use publicProcedure
- [x] Verified — homepage cards, ComparisonModal, NewArrivals, SearchBar all pull DB values directly
- [x] Verified — getEquipmentItemById does SELECT * which includes all rate columns
- [x] Removed hardcoded "Hong Kong" from product detail feature list
- [x] Added smart rental price calculator using actual DB weekly/monthly rates for duration estimates
- [x] 140 tests passing
- [x] Save checkpoint

## Sortable Inventory Columns

- [x] Add sort state (sortField, sortDirection) with 3-click cycle: asc → desc → clear
- [x] Make Items (name), Status (availability), and Reviewed columns clickable with orange arrow indicators
- [x] Apply sorting to filteredEquipment useMemo (localeCompare for strings, boolean compare for reviewed)
- [x] 140 tests passing
- [x] Save checkpoint

## Auto Re-source After Reject — No Duplicate Photos

- [x] Add `rejectedImageUrls` JSON text column to equipmentItems schema
- [x] Run pnpm db:push to migrate
- [x] Update rejectItemImage DB helper to append rejected URL to the JSON array
- [x] Update productImageScraper to accept excludeUrls param and filter them from candidates
- [x] Return {cdnUrl, sourceUrl} from scraper so source URLs can be tracked
- [x] Update admin.rejectImage procedure to auto-trigger re-source in background with excluded URLs
- [x] Update AdminPhotoApproval reject toast to inform user + auto-refresh after 15s
- [x] Update all callers (routers.ts, bulk-import.ts) to handle new return type
- [x] 140 tests passing, 0 real TypeScript errors
- [x] Save checkpoint

## Bug Fix: Rejected photos being re-proposed
- [x] Fix: rejected photo URLs are not being properly excluded when re-sourcing after rejection
- [x] Trace full reject → save rejected URL → re-source with exclusions → verify different photo
- [x] Add/update tests to verify URL exclusion works (14 new tests, 154 total)
- [x] Save checkpoint

## Round all prices to nearest 10
- [x] Inspect current pricing data (dailyRate, weeklyRate, monthlyRate)
- [x] Execute SQL to round all prices to nearest 10
- [x] Verify results — 0 items remaining with non-rounded prices
- [x] Save checkpoint

## Stack duplicate items by model number
- [x] Analyse duplicate model numbers across inventory
- [x] Match on brand + model + name (not just model) to avoid false merges
- [x] Merge quantities (quantity + availableQty) into the keeper row
- [x] Delete 7 duplicate rows after merging (267 → 260 items)
- [x] Verify results — 0 remaining duplicates
- [x] Save checkpoint

## Create Waterproofing category
- [x] Audit inventory for waterproofing-related items (PU pumps, injection, sealant, etc.)
- [x] Create Waterproofing category with 4 sub-categories
- [x] Move 12 items into the new category
- [x] Verify results — 12 items across 4 sub-categories
- [x] Save checkpoint

## Fix photo fitting across the site
- [x] Audit all components that display equipment photos (8 components found)
- [x] Fix object-fit/sizing: changed object-cover to object-contain with white bg across all 8 components
- [x] Verify fixes across equipment grid, detail pages, and admin views
- [x] Save checkpoint

## Add injection packers and waterproof membranes to Waterproofing category
- [x] Research common injection packer and waterproof membrane products for HK rental market
- [x] Create 2 new sub-categories (Injection Packers, Waterproof Membranes & Coatings)
- [x] Insert 10 equipment items (5 packers + 5 membrane tools) with brands, specs, and pricing
- [ ] Photos will auto-source via the existing scraper pipeline
- [x] Verify results — 268 total items, 22 in Waterproofing category across 6 sub-categories
- [x] Save checkpoint

## Create consumables-for-sale system with Related Consumables links
- [x] Design and create consumables table in database schema
- [x] Create consumable-to-equipment linking table (many-to-many)
- [x] Add tRPC procedures for consumables (list, getByEquipmentId, create, link)
- [x] Add 10 waterproofing consumable products (PU resin, epoxy, membrane, primer, sealant, couplers, mesh)
- [x] Link 60 equipment-consumable relationships across all 22 waterproofing tools
- [x] Build "Related Consumables" UI section on product detail page with WhatsApp CTA
- [x] Photos for consumable products — 10 real manufacturer images sourced and uploaded to CDN
- [x] Write 8 vitest tests for consumables (162 total tests passing)
- [x] Save checkpoint

## Fix consumables issues
- [x] Fix pricing display: show flat purchase price per unit (HK$180 per set, HK$520 per kg, etc.)
- [x] Make consumable cards clickable (link to /consumable/:id)
- [x] Create consumable detail page with product info, specs, purchase price, WhatsApp CTA, and linked equipment
- [x] Source 10 real manufacturer product photos (SealBoss, Sika, Fosroc) uploaded to CDN
- [x] Save checkpoint

## Add Pressure Washer sub-category
- [x] Find appropriate parent category: Pumps & Fluid Handling
- [x] Create Pressure Washers sub-category (id: 30007)
- [x] Move 5 items: Makita, IMC 4000, Lifan Hydropro 3600, Lavor Electric, Floor Washer Attachment
- [x] Save checkpoint

## Add Surface Preparation Tools section
- [x] Audit inventory — found 10 existing items (SPE/Von Arx grinders, Cadillac sandblasters, Blue Planet/Innovatech polishers)
- [x] Create Surface Preparation category with 4 sub-categories (Floor Grinders, Sandblasters, Sanders & Polishers, Scarifiers & Planers)
- [x] Add 10 new items (Husqvarna, Edco, Clemco, Schmidt, Von Arx, Bartell, HTC, National Flooring)
- [x] Move 10 existing items into the new category
- [x] Total: 20 items across 4 sub-categories
- [x] Save checkpoint

## Batch improvements
- [x] 4. Remove brand names from front of all item names (179 items renamed + typo fixes)
- [x] 3. Add needle guns / scalers to Surface Preparation (6 items in new sub-category)
- [x] 7. Add Concrete & Formwork category with 6 sub-categories, 19 items (9 new + 10 moved)
- [x] 5. Build dedicated Consumables browse page (/consumables) with search, category filters, nav link
- [x] 6. Build Equipment Bundles / Kits feature (6 bundles, browse page, detail page, nav link)
- [x] 8. Add SEO intro paragraphs for all 16 categories (displayed when category is selected)
- [ ] 1. Process pending photo approval queue (user to review at /admin/photo-approval)
- [x] Save checkpoint — batch improvements (v2ef24a29)

## Add search and filter to Equipment Bundles page
- [x] Add search bar to filter bundles by name/description/category
- [x] Add category filter chips with counts (All, Concrete & Formwork, Surface Preparation, Waterproofing)
- [x] Add sort dropdown (Name A-Z/Z-A, Price Low-High/High-Low, Biggest Savings, Most Items)
- [x] Add results count, clear all filters button, item count badges on cards
- [x] Responsive design on mobile (stacked search + sort, wrapping filter chips)
- [x] Save checkpoint

## Bug Fix: Admin inventory update fails with comma-formatted prices
- [x] Fix: monthlyRate "10,000.00" has comma causing SQL error
- [x] Strip commas from all price inputs (dailyRate, weeklyRate, monthlyRate) before sending to backend
- [x] Save checkpoint

## Apply comma-stripping to Equipment Bundles pricing
- [x] Added z.transform comma-stripping to equipment create & update procedures (server-side defence)
- [x] Added z.transform comma-stripping to bundle create & update procedures (server-side defence)
- [x] Added full bundle admin CRUD procedures (create, update, delete, addItem, removeItem)
- [x] 164 tests passing, no TypeScript errors
- [x] Save checkpoint

## Admin Improvements — Full Build
- [x] 1. Admin Dashboard — stats overview, quick links, pending actions (/admin)
- [x] 2. Bundle Management page (/admin/bundles) — create, edit, delete bundles with item management
- [x] 3. Consumables Management page (/admin/consumables) — CRUD with equipment linking
- [x] 4. Bulk Photo Approve/Reject — multi-select and batch actions
- [x] 5. Category & Sub-Category Management — reorder, rename, merge, delete (already built at /admin/sub-categories)
- [x] 6. Activity Log — track all admin changes with timestamps (/admin/activity-log)
- [x] 7. Low Stock Alerts — highlight items at 0 available qty (row highlighting + filter)
- [x] 8. Admin Inventory Search & Filter — filter by category, status, photos, stock, reviewed
- [x] 9. Export to Excel — download full inventory as CSV spreadsheet (/admin/export)
- [x] 10. Enquiry/Lead Tracking — log quote requests and WhatsApp clicks (/admin/enquiry-tracking)
- [x] 11. Pricing Calculator — auto-suggest weekly/monthly from daily rate (in equipment form)
- [x] 12. Duplicate Detection — flag similar items before save (in equipment form)
- [x] 13. Image Crop/Resize Tool — deferred (browser-native cropping not practical; photos auto-resized on upload)
- [x] Save checkpoint

## PWA — Make admin section installable as mobile app
- [x] Add web app manifest with EquipHK branding (name, icons, theme color, start_url: /admin)
- [x] Add service worker for offline caching (network-first API, cache-first static)
- [x] Add Apple mobile web app meta tags for iOS install
- [x] Service worker auto-registers on page load
- [ ] Ensure admin pages are mobile-responsive (ongoing with each admin page)
- [ ] Save checkpoint

## Feature: Wire Lead Tracking on Public Site
- [x] Add trpc.enquiryLeads.track calls to WhatsApp buttons across all pages
- [x] Add tracking to quote/contact form submissions
- [x] Add tracking to cart enquiry submissions
- [x] Add tracking to phone call links
- [x] Add tracking to email links

## Feature: Push Notifications for New Enquiries
- [x] Send owner notification when new contact form is submitted
- [x] Send owner notification when new quote request comes in
- [x] Send owner notification when cart enquiry is submitted
- [x] Include customer name, equipment, and contact details in notification

## Feature: Rental Booking/Calendar System
- [x] Create rentals table in schema (equipmentId, customerName, startDate, endDate, status, etc.)
- [x] Create rental db helpers (create, list, update status, get by equipment)
- [x] Create rental tRPC procedures (admin CRUD + public availability check)
- [x] Build Admin Rental Calendar page with month view and booking management
- [x] Build rental creation form with equipment picker and date range
- [x] Show active and upcoming rentals in sidebar widgets
- [x] Track rental status (pending, active, completed, cancelled)
- [x] Add rental routes to App.tsx and admin dashboard
- [x] All 182 vitest tests passing
- [x] Save checkpoint

## Feature: Brand Filter
- [x] Add getBrands procedure to return distinct brands from equipment items
- [x] Update equipment list query to accept optional brand filter
- [x] Add brand filter dropdown to EquipmentSection UI (top-right of category tabs)
- [x] Brand filter works alongside category and sub-category filters with removable badges
- [x] Save checkpoint

## Feature: Rigging Category
- [x] Create Rigging equipment category in database (id: 90001)
- [x] Create Rigging sub-categories (Chain Blocks & Hoists, Shackles & Hardware, Slings & Straps, Spreader Bars & Lifting Beams, Rigging Accessories)
- [x] Seed 21 rigging equipment items with descriptions, specs, and HK market rental rates
- [x] Auto-source product images for all rigging items (20/21 found, 1 pending manual upload)
- [x] Save checkpoint

## Feature: Complete Rigging Kit Bundle
- [x] Seed bundle with chain block, shackles, and slings items (6 items, 9 pieces total)
- [x] Set bundle pricing with 15% discount vs individual rates (HK$429/day, HK$1,743/wk, HK$5,126/mo)
- [x] Save checkpoint

## Feature: Request a Quote CTA
- [x] Add Request a Quote button to navbar (desktop + mobile) — links to /get-a-quote
- [x] Replace hero "Enterprise Solutions" button with prominent "Request a Quote" in orange
- [x] Build dedicated /get-a-quote page with 4-step form (contact, equipment, hire details, notes)
- [x] Wire form to send notification to admin + WhatsApp option
- [x] Lead tracking on all quote form submissions and WhatsApp clicks
- [x] Save checkpoint

## Feature: Request a Quote on Product Pages
- [x] Add Request a Quote button to ProductDetail page (below Add to Cart, shown for days 1-30)
- [x] Add Request a Quote button to ConsumableDetail page (Bulk/Custom Quote)
- [x] Add Request a Quote button to BundleDetail page (Long-Term Hire)
- [x] Pre-fill the quote page with the product name when navigating from a product page (?equipment= param)
- [x] Save checkpoint

## Feature: Recently Viewed Items
- [x] Build useRecentlyViewed hook using localStorage (max 8 items, newest first, cross-tab sync)
- [x] Track equipment view on ProductDetail page mount via useEffect
- [x] Build RecentlyViewedSection component with horizontal scroll card grid + Clear button
- [x] Add Recently Viewed section to homepage (below Equipment section, only shown if history exists)
- [x] Add Recently Viewed section to ProductDetail page (above Related Consumables)
- [x] Save checkpoint

## Feature: Recently Viewed on Equipment Catalogue Page
- [x] Create full /equipment catalogue page with search, category tabs, brand filter, sort, and availability filter
- [x] Add RecentlyViewedSection to the Equipment Catalogue page (below the grid)
- [x] Add Equipment link to Navbar (first position)
- [x] Save checkpoint

## Feature: Equipment Compare
- [x] Review existing ComparisonContext and ComparisonModal
- [x] Enhance ComparisonModal with full-screen view, spec parsing, pricing tiers, add-to-cart, and navigation
- [x] Build global sticky ComparisonBar at bottom of screen with thumbnails and Compare button
- [x] Compare button on homepage cards, catalogue cards, and product detail page
- [x] Fixed missing leading slash on /admin/enquiry-tracking and /admin/rental-calendar routes
- [x] Save checkpoint

## Fix: Price Comma Formatting
- [x] Create shared formatPrice utility (toLocaleString with comma separators)
- [x] Apply to all product cards, product detail, comparison modal, cart, bundles, and admin pages
- [x] Save checkpoint

## Fix: Homepage Category Filter Tabs
- [ ] Audit actual category slugs in the database
- [ ] Replace hardcoded category slugs in EquipmentSection with dynamic DB-driven tabs
- [ ] Verify all category tabs filter correctly on homepage
- [ ] Save checkpoint

## Feature: 18V Product Battery & Charger Note
- [x] Identify all 18V products in the database (name or description contains "18V" or "18v")
- [x] Add note "Includes 1x Battery and 1x Charger" to each 18V product
- [x] Verify note displays correctly on product detail pages
- [x] Save checkpoint

## Feature: Auto-Apply Battery & Charger Note on 18V Tools
- [x] Auto-set includes = "1x 18V Battery, 1x Charger" on server when creating/updating any item with "18V" in name or model
- [x] Auto-fill includes field in AdminInventory form when name/model contains "18V"
- [x] Save checkpoint

## Feature: Battery Note for All Cordless Tools (Multi-Voltage)
- [x] Audit all battery-powered tools in DB (12V, 18V, 20V, 36V, 40V, 54V, 80V, cordless, etc.)
- [x] Apply "1x Battery, 1x Charger" to standard voltage tools (12V, 18V, 20V, 40V, 54V)
- [x] Apply "2x Batteries, 1x Charger" to high-voltage tools (36V, 80V)
- [x] Update server auto-logic to cover all voltages with correct battery count
- [x] Update admin form auto-fill hint for all voltages
- [x] Save checkpoint

## Feature: SEO Meta Tags
- [x] Create reusable useSEO hook / SEOHead component using react-helmet-async
- [x] Apply dynamic title + description to ProductDetail page
- [x] Apply dynamic title + description to EquipmentCatalogue page
- [x] Apply dynamic title + description to Bundles and BundleDetail pages
- [x] Apply dynamic title + description to Consumables and ConsumableDetail pages
- [x] Apply static optimised meta tags to Home, Get a Quote, Favourites, Cart pages
- [x] Add Open Graph tags (og:title, og:description, og:image) for social sharing
- [x] Save checkpoint

## Feature: Dynamic Sitemap.xml
- [x] Create /sitemap.xml server endpoint that queries all equipment, bundles, and consumables from DB
- [x] Include static pages (home, equipment, bundles, consumables, get-a-quote)
- [x] Add robots.txt pointing to sitemap URL
- [x] Save checkpoint

## Feature: Improved Filters
- [ ] Audit current filter state on EquipmentCatalogue, Bundles, Consumables
- [ ] EquipmentCatalogue: fix category tab filtering, add price range slider, add battery-included toggle, add availability filter, improve brand filter with counts
- [ ] Bundles: improve tag/category filters with counts
- [ ] Consumables: improve tag filters with counts
- [ ] Add active filter chips/pills showing what's currently filtered with X to clear each
- [ ] Add "Clear all filters" button when any filter is active
- [ ] Save checkpoint

## Feature: Power Supply Filter on Equipment Catalogue
- [x] Add power supply filter chips: 18V, 36V, 40V, 80V, 110V, 220V, 380V, Battery (all cordless)
- [x] Detect power supply from item name/model/specs fields
- [x] Show count of matching items per voltage option
- [x] Integrate into existing filter panel with clear/reset
- [x] Save checkpoint

## Fix: Homepage Equipment Section — New Arrivals Only
- [x] Replace full equipment grid on homepage with "New Arrivals" section (latest 8 items)
- [x] Add "View All Equipment" CTA button linking to /equipment
- [x] Keep the section visually consistent with existing design
- [x] Save checkpoint

## Bug: Admin Panel Not Accessible
- [x] Check admin route in App.tsx
- [x] Check admin role guard logic
- [x] Verified Casey's user account has role = 'admin' in DB
- [x] Root cause: No Sign In button existed in Navbar — users couldn't log in at all
- [x] Fix: Added Sign In button to Navbar desktop and mobile menus
- [x] Fix: Added Admin Panel link in account dropdown for admin users
- [x] Save checkpoint

## Reconciliation Backlog (Full Inventory Sync)
- [x] Locate Excel register file and re-run comparison against current DB
- [x] Confirmed: only 9 items appeared missing — all were intentionally deleted
- [x] DB is correct as-is — no restoration needed
- [x] 99 DB-only items confirmed as legitimate products added via bulk import

## Bug: Admin Panel Still Inaccessible (Round 2)
- [x] Check AdminDashboard role guard logic
- [x] Check auth.me returns correct role from DB
- [x] Check upsertUser doesn't overwrite role on login
- [x] Resolved: Sign In button was missing — adding it fixed the issue

## Feature: Admin PWA (Installable on iPhone & iPad)
- [x] Add PWA manifest.json with EquipHK branding and icons
- [x] Add service worker for offline shell caching
- [x] Add Apple touch icons and meta tags for iOS home screen
- [x] Build mobile-first admin layout: bottom tab bar on phone, sidebar on tablet
- [x] Add "Add to Home Screen" install prompt banner
- [x] Fix admin access issue (Sign In button added to Navbar)
- [x] Save checkpoint

## Feature: CSV Inventory Export
- [x] Add server-side CSV export tRPC procedure (equipment, bundles, consumables)
- [x] Column selection: choose which fields to include in export
- [x] Filter options: active only, category, availability
- [x] Download button triggers CSV file download in browser
- [x] Include all key fields: name, brand, model, category, daily/weekly/monthly rate, qty, status, includes
- [x] Save checkpoint

## Feature: Membership Registration & Automated Rental System
- [x] Extend DB schema: user_memberships, rental_orders, rental_order_items tables
- [x] tRPC: register/upgrade membership procedure (Pay-As-You-Go, Trade Pro)
- [x] tRPC: create rental order procedure with tier-based discount logic
- [x] tRPC: admin notification (WhatsApp + email) on new booking and registration
- [x] Registration page: /register — 3-step: plan select, details + HKID upload, review & pay
- [x] Trade Pro Stripe subscription checkout (HK$499/month)
- [x] Member dashboard: /account — view tier, active rentals, upgrade CTA
- [x] Cart: Stripe Pay Now button, pricing breakdown, delivery selector
- [x] Apply 10-15% Trade Pro discount automatically on cart
- [x] Waive deposit for Trade Pro on items under HK$5,000
- [x] Free delivery for Trade Pro orders over HK$500
- [x] Admin panel: Members page + Rental Orders page
- [x] HKID photo upload to S3 + admin verify toggle
- [x] Stripe webhook: mark order paid on checkout.session.completed
- [x] Booking confirmation page: /booking-confirmation
- [x] Return address: Y2, Shing Fung Film Studio, Ho Chung, Sai Kung
- [x] Save checkpoint

## Feature: Terms & Conditions
- [x] Draft full HK SAR-compliant T&C (12 sections, legally binding)
- [x] Late return charges: full daily rate, discounts voided, charged daily
- [x] Return Deadline: 17:00 HKT on agreed return date
- [x] Liability exclusion: EquipHK and all associates void of responsibility for operator injury/damage
- [x] Full indemnity clause protecting EquipHK from third-party claims
- [x] HKID data privacy clause (PDPO Cap. 486 compliant)
- [x] Governing law: Hong Kong SAR, HKIAC arbitration
- [x] T&C page live at /terms with table of contents
- [x] Mandatory acknowledgement checkbox on Step 3 of registration
- [x] Submit button disabled until T&C checkbox is ticked
- [x] T&C link opens in new tab from registration form
- [x] Save checkpoint

## Feature: Footer T&C Link
- [x] Add Terms & Conditions link to Footer component

## Feature: Cart Checkout T&C Checkbox
- [x] Add mandatory T&C acceptance checkbox to RentalCart checkout
- [x] Gate Pay Now button — disabled until checkbox is ticked

## Change: Return Deadline Update
- [x] Update return deadline from 17:00 to 15:00 HKT across all files

## Bug Fix: Cart Empty Image URL
- [x] Fix empty string src on cart item images — add fallback placeholder

## Feature: Stripe Sandbox Integration
- [x] Verify Stripe secret key is active and client initialises correctly
- [x] Register webhook endpoint URL with Stripe dashboard
- [x] Write and run Vitest test for Stripe checkout session creation
- [x] Write and run Vitest test for webhook handler (order paid, membership upgrade)

## Bug Fix: Stripe ESM/CJS Import Error
- [x] Fix "Dynamic require of stripe is not supported" error in server

## Bug Fix: Stripe Checkout Redirect Hanging
- [x] Fix "Redirecting to a secure page..." that never completes on cart checkout

## Bug Fix: Deposit & HKID in Checkout
- [x] Fix deposit not being charged in Stripe checkout session (confirmed working — was a display issue)
- [x] Add HKID collection field to cart checkout flow (HKID number + photo upload)

## Feature: HKID Stored on Orders + Admin View
- [x] Add hkidNumber and hkidPhotoUrl columns to rental_orders schema
- [x] Pass HKID data from cart through createOrder procedure to DB
- [x] Show HKID number and photo link in Admin Orders page
- [x] Save checkpoint and publish

## Feature: Admin HKID Search + Customer Email + Pricing CTA
- [x] Add HKID number search/filter to Admin Orders page
- [x] Send customer confirmation email after successful order (with return deadline 15:00 HKT) via Resend
- [x] Wire Pricing page "Get Started" buttons to /register?plan=payg and /register?plan=trade_pro

## Feature: Role-Based Access Control (RBAC)
- [x] Extend user role enum: add 'manager' and 'warehouse' values to schema
- [x] Run db:push to migrate role enum
- [x] Add server procedures: team.listAll, team.updateRole (admin-only)
- [x] Add managerProcedure for orders/members, warehouseProcedure for inventory
- [x] Add role guards to AdminDashboard (all staff; filtered quick links by role)
- [x] Add role guards to AdminInventory (admin + warehouse)
- [x] Add role guards to AdminOrders (admin + manager)
- [x] Add role guards to AdminMembers (admin + manager)
- [x] Build Team Management page (/admin/team) — list users, change roles
- [x] Add route /admin/team to App.tsx
- [x] Add Team Management link to admin dashboard quick links (admin only)
- [x] Add role badge to navbar account dropdown (admin/manager/warehouse)
- [x] Update membership router to use managerProcedure for orders/members endpoints
- [x] Write vitest tests for RBAC procedures (18 new tests, all passing)
- [x] Save checkpoint

## Feature: Delivery & Collection Scheduling (Feature 4)
- [ ] Add deliverySlotDate and deliverySlotTime fields to rentalOrders schema
- [ ] Add collectionSlotDate and collectionSlotTime fields to rentalOrders schema
- [ ] Run db:push to migrate schema
- [ ] Add delivery slot picker to RentalCart checkout form (date + AM/PM/specific time)
- [ ] Show delivery/collection slots in AdminOrders expanded order view
- [ ] Add delivery calendar view page (/admin/delivery-calendar)
- [ ] Add route and link to AdminDashboard
- [ ] Write vitest tests for delivery slot procedures

## Feature: Damage Deposit Management (Feature 5)
- [ ] Add depositStatus enum to rentalOrders: held / partially_returned / fully_returned / forfeited
- [ ] Add depositReturnedAmount and depositDeductionReason fields to rentalOrders
- [ ] Run db:push to migrate schema
- [ ] Add deposit management panel to AdminOrders expanded order view
- [ ] Manager can log deposit return (full/partial) with deduction reason
- [ ] Customer sees deposit status in their order history page
- [ ] Write vitest tests for deposit management procedures

## Feature: Repeat Hire / Saved Carts (Feature 6)
- [ ] Create saved_carts table (id, userId, name, items JSON, createdAt, updatedAt)
- [ ] Run db:push to migrate schema
- [ ] Add savedCarts tRPC procedures: saveCart, listSavedCarts, deleteSavedCart, loadCart
- [ ] Add "Save as Job Kit" button in RentalCart page
- [ ] Create /account/saved-carts page showing all saved kits
- [ ] "Re-hire" button loads kit back into cart with one click
- [ ] Add link to saved carts from account dropdown
- [ ] Write vitest tests for saved cart procedures

## Feature: Bulk Order Status Updates (Feature 12)
- [ ] Add bulkUpdateOrderStatus tRPC procedure (managerProcedure)
- [ ] Add checkbox column to AdminOrders table rows
- [ ] Add "Select All" checkbox in table header
- [ ] Add bulk action toolbar (appears when ≥1 row selected): status dropdown + Apply button
- [ ] Show confirmation dialog before applying bulk update
- [ ] Write vitest tests for bulk update procedure

## Feature: CSV Export of Orders (Feature 13)
- [ ] Add exportOrdersCsv tRPC procedure (managerProcedure) — returns JSON for client-side CSV
- [ ] Add "Export CSV" button to AdminOrders page header
- [ ] Support current filters (date range, status) in export
- [ ] Client-side CSV generation and download trigger
- [ ] Write vitest tests for export procedure

## Feature 7: Delivery & Collection Scheduling (Frontend Completion)
- [x] Add delivery slot date picker + AM/Afternoon/Evening selector to RentalCart checkout
- [x] Pass deliverySlotDate/Time and collectionSlotDate/Time to createOrder mutation
- [x] Show delivery/collection slots in AdminOrders expanded order view
- [x] Build /admin/delivery-calendar page with day/week grid view
- [x] Add route and nav link for delivery calendar

## Feature 8: Damage Deposit Management (Frontend Completion)
- [x] Add deposit settlement panel to AdminOrders expanded view (status dropdown, returned amount, deduction reason)
- [x] Wire adminSettleDeposit mutation to the panel
- [x] Show deposit status badge in AdminOrders order list

## Feature 9: Repeat Hire / Saved Carts (Full Implementation)
- [x] Add savedCarts router to routers.ts (saveCart, listSavedCarts, deleteSavedCart)
- [x] Add "Save as Job Kit" button in RentalCart page
- [x] Create /account/saved-carts page listing all saved kits
- [x] Add "Re-hire" button to load kit back into cart
- [x] Add Saved Job Kits quick link on Account page

## Feature 10: Bulk Order Status Updates + CSV Export (Frontend Completion)
- [x] Add checkbox column to AdminOrders table rows
- [x] Add "Select All" checkbox in table header
- [x] Add bulk action toolbar (appears when ≥1 selected): status dropdown + Apply button
- [x] Add "Export CSV" button to AdminOrders header with filter support
- [x] Client-side CSV generation and download trigger

## Feature 11: Referral Programme
- [x] Add referral tables to schema (referral_codes, referral_events, referral_credits)
- [x] Run db:push
- [x] Build referral router: getMyCode, generateCode, getMyCredits, getReferralHistory
- [x] Show referral code + share link on Account page (/account/referral)
- [x] Quick link to Refer & Earn on Account page

## Feature 13: Trade Pro Upgrade Prompt on Large Carts
- [x] Add upgrade prompt banner in RentalCart when PAYG cart total > HK$2000
- [x] Calculate and show savings amount if they were Trade Pro
- [x] Add "Upgrade to Trade Pro" CTA button linking to /membership

## New Feature Tests
- [x] 14 new vitest tests for Saved Carts and Referral Programme (all passing)
- [x] Total: 225 passing, 1 pre-existing failure (subcategories — unrelated)

## Feature: Live Fuel Add-On (Petrol & Diesel)
- [x] Add fuelType column to equipment_items (enum: none, petrol, diesel)
- [x] Add fuelLitres, fuelPricePerLitre, fuelCost columns to rental_orders
- [x] Run db:push to migrate schema
- [x] Build server-side fuel price scraper (Consumer Council HK) with daily in-memory cache
- [x] Petrol: scrape https://oil-price.consumer.org.hk/en
- [x] Diesel: scrape https://oil-price.consumer.org.hk/en/diesel
- [x] tRPC fuel router: getLivePrices, getItemFuelType, setItemFuelType, getOrderFuelSummary
- [x] Add fuelType to equipment.create and equipment.update procedures
- [x] Fuel add-on UI on product detail page (litres input, live price display, cost breakdown)
- [x] Fuel breakdown line in RentalCart cart item display
- [x] Fuel fields passed from cart to createOrder mutation and stored on order
- [x] Admin: fuel type selector (No Fuel / Petrol / Diesel) in AdminInventory edit form
- [x] Add fuelType to CartItem interface in CartContext
- [x] 4 vitest tests for fuel price scraper — all passing (live HTTP, cache, sanity range)
- [x] TypeScript: 0 errors
- [x] Save checkpoint

## Feature: Order Status Email Notifications
- [x] Add order_email_logs table to schema (orderId, customerEmail, status, subject, sentAt, error)
- [x] Run db:push to migrate schema (migration 0022)
- [x] Build branded HTML email templates for 4 statuses:
  - [x] CONFIRMED — green badge, equipment list, rental period, delivery slot, payment total, fuel add-on
  - [x] ACTIVE — blue badge, return deadline warning (15:00 HKT), collection slot
  - [x] COMPLETED — purple badge, summary, Browse Equipment CTA, Trade Pro upsell (PAYG only)
  - [x] CANCELLED — red badge, refund information
- [x] Build sendOrderStatusEmail() helper in server/_core/orderStatusEmail.ts using Resend
- [x] BCC admin email (Bookings@Equip.hk) on every outbound customer email
- [x] Wire email trigger into adminUpdateOrderStatus mutation (auto-fires on status change)
- [x] Fetch order items with equipment names for email body
- [x] Log every email attempt to order_email_logs (success + errors stored)
- [x] Add adminGetOrderEmailLogs tRPC procedure (managerProcedure)
- [x] Add EmailLogPanel component to AdminOrders expanded order view (shows sent/failed per order)
- [x] 10 vitest tests for email system — all passing (mocked Resend, no real emails sent in tests)
- [x] TypeScript: 0 errors
- [x] Save checkpoint

## Feature: Warehouse Workflow (Return Logging, Charges & Alerts)
- [x] Add equipment_return_logs table (orderId, returnedAt, condition, overallNotes, completedByUserId)
- [x] Add return_charges table (returnLogId, chargeType: damage/repair/cleaning/other, description, amount, photoUrl)
- [x] Run db:push to migrate schema (27 tables total)
- [x] tRPC: warehouse.getActiveOrders — read-only list of Confirmed/Active/Pending orders
- [x] tRPC: warehouse.listOrders — filterable order list for warehouse (status filter)
- [x] tRPC: warehouse.getOrderDetail — full order detail for warehouse (read-only)
- [x] tRPC: warehouse.logReturn — create return log + charges, set order to Completed
- [x] tRPC: warehouse.completeReturn — complete return with charges
- [x] tRPC: warehouse.getReturnLog — fetch return log + charges for an order
- [x] Build /warehouse/orders page — active/upcoming order list for warehouse staff
- [x] Return completion form: condition selector, notes, add damage/repair/cleaning charge line items
- [x] Build sendReturnChargeEmail template (branded, itemised charge list, total owed)
- [x] Build sendWarehouseAlertEmail template (Confirmed = prep alert, Active = dispatch alert)
- [x] Auto-send charge summary email to customer when warehouse completes order
- [x] Automated warehouse email alert: when order → Confirmed (prep equipment for dispatch)
- [x] Automated warehouse email alert: when order → Active (equipment dispatched, expect return)
- [x] Add Warehouse Orders quick link to AdminDashboard for warehouse + admin roles
- [x] Add /warehouse/orders route to App.tsx
- [x] TypeScript: 0 errors
- [x] 18 vitest tests for warehouse procedures — all passing (257 total)
- [x] Save checkpoint

## Change: Referral Reward Credit Update
- [ ] Update referral reward from HK$200 to HK$250 in server procedures
- [ ] Update referral reward amount in ReferralPage.tsx UI
- [ ] Update referral reward amount in email templates
- [ ] TypeScript check
- [ ] Save checkpoint

## Referral Reward Update & Notification Spam Fix

- [x] Update referral credit reward from HK$50 to HK$250 in server/routers.ts (creditAwarded default)
- [x] Update referral credit display in client/src/pages/Account.tsx
- [x] Update all HK$50 references in client/src/pages/ReferralPage.tsx (share text, description, step card)
- [x] Fix enquiryLeads.track to only notifyOwner for high-intent leads (quote_request, cart_enquiry)
- [x] Suppress owner push notifications for passive link clicks (whatsapp_click, phone_call, email_click)
- [x] All 257 tests passing (1 pre-existing subcategories failure unrelated to these changes)
- [x] Save checkpoint

## ## Team Management — Info Tooltips & Granular Per-App Permissions
- [x] Add staff_permissions table to schema (userId, permissions JSON column)
- [x] Run db:push to migrate schema
- [x] Add getPermissions and updatePermissions tRPC procedures to team router
- [x] Add db helper functions for staff permissions
- [x] Redesign AdminTeam.tsx: replace role dropdown with per-app checkbox grid
- [x] Add info (i) bubble tooltip next to each permission explaining what it grants
- [x] Keep role badge as display-only label derived from permission set
- [x] Write vitest tests for permissions procedures
- [x] Save checkpoint
## Lead Tracking — Sort, Delete, and Reply/Follow-Up
- [x] Add deleteLead tRPC procedure (admin only)
- [x] Add replyToLead tRPC procedure (sends email via Resend to customer)
- [x] Add sort controls to lead table (by date, type, status)
- [x] Add delete button per lead with confirmation
- [x] Add Reply/Follow-Up button that opens compose dialog with pre-filled customer email
- [x] Show last reply date in lead table
- [x] Write vitest tests for delete and reply procedures
- [x] Save checkpoint

## Pre-Launch Fixes (April 2026)
- [x] Verify Resend DNS is working for equip.hk — DKIM + SPF confirmed live
- [x] Fix footer email from info@equiphk.com to info@equip.hk
- [x] Generate EquipHK favicon.ico from logo
- [x] Generate OG social share image and upload to CDN
- [x] Generate sitemap.xml
- [x] Build Privacy Policy page (/privacy) — PDPO Cap. 592 compliant
- [x] Build About EquipHK page (/about)
- [x] Build FAQ page (/faq)
- [x] Build Delivery Info page (/delivery-info)
- [x] Build Careers page (/careers)
- [x] Wire all footer links to real pages (remove # placeholders)
- [x] Fix failing tests — subcategories.test.ts + new-features.test.ts (270/270 passing)
- [x] Confirm Stripe PAYG (casual) checkout works — publicProcedure, no login required
- [ ] CASEY ACTION: Switch Stripe to live mode (Settings → Payment in Manus UI)

## Credit Card Pre-Authorisation (Deposit Hold)

- [x] Add stripeDepositIntentId, stripeDepositClientSecret, depositHoldExpiresAt fields to rentalOrders schema
- [x] Run db:push to migrate schema (applied via direct SQL, drizzle-kit migrate had a non-fatal issue)
- [x] Deposit is NOT charged at checkout — removed from Stripe line items
- [x] Webhook creates Stripe PaymentIntent (capture_method: manual) after payment succeeds
- [x] adminSettleDeposit updated: capture full, partial_capture, or release via Stripe API
- [x] adminCreateDepositHold added: manually create hold if webhook missed it
- [x] AdminOrders panel updated: Manage Hold / Create Hold buttons, status badges, expiry warning
- [x] 270/270 tests passing
- [ ] CASEY ACTION: Switch Stripe to live mode (Settings → Payment in Manus UI)

## Hold Expiry Display + Auto-Reminder + Customer Confirmation Page

- [x] Add hold expiry date section to each order card in Admin Orders panel
- [x] Colour-coded urgency: green (4+ days), yellow (2-4 days), orange (1-2 days), red (today), grey (expired)
- [x] "ACTION REQUIRED" pulsing badge when hold expires within 48 hours
- [x] "Hold lapsed" message when hold has already expired
- [x] Expiring Holds Alert Banner at top of Admin Orders (links directly to affected orders)
- [x] Daily scheduler (09:00 HKT) sends admin email listing all holds expiring within 48 hours
- [x] Build customer-facing /deposit-info page (step-by-step, damage policy, FAQ, contact)
- [x] Add card hold explainer card to booking confirmation page
- [x] Updated booking confirmation deposit wording to "Card Hold (not charged)"
- [x] "What's this?" link on booking confirmation links to /deposit-info
- [x] 270/270 tests passing

## Re-Authorise Hold + Damage Report + Release Notification (April 2026)

### Re-Authorise Hold (long rentals > 7 days)
- [ ] Add adminReauthoriseDepositHold tRPC procedure (cancel old intent, create new one)
- [ ] Add "Re-authorise Hold" button in Admin Orders deposit section
- [ ] Show re-auth button only when hold is active and within 2 days of expiry
- [ ] Update depositHoldExpiresAt to new expiry date after re-auth

### Warehouse Damage / Cleaning Report
- [ ] Add equipment_damage_reports table to schema (orderId, reportedBy, items[], photos[], totalCharge, notes, sentAt)
- [ ] Run db:push to migrate schema
- [ ] Add tRPC procedures: createDamageReport, getDamageReport, sendDamageReportToClient
- [ ] Build damage report form in WarehouseOrders page (item checklist, charge per item, notes, photo upload)
- [ ] S3 photo upload for damage evidence (multiple photos per report)
- [ ] Build branded damage report email template (itemised charge list, photos, total, payment link)
- [ ] Send damage report email to customer on submit
- [ ] Trigger deposit capture from damage report (auto-capture amount = total charges)
- [ ] Show damage report status in Admin Orders panel

### Customer Hold Release Notification Email
- [ ] Add sendDepositReleasedEmail helper to email.ts
- [ ] Call sendDepositReleasedEmail when adminSettleDeposit action = "release"
- [ ] Email confirms hold released, expected clearance time (3-5 business days), support contact

### Tests & Checkpoint
- [ ] Write vitest tests for reauthorise, damage report, and release email procedures
- [ ] Save checkpoint

## Auto Hold Renewal + Photo Upload for Damage Reports (April 2026)

- [x] Fix TypeScript syntax error in membership.ts (missing closing brace)
- [x] Build daily scheduler (02:00 HKT): auto-renews holds expiring within 48h for active/confirmed orders
- [x] Scheduler silently cancels old intent and creates fresh 7-day Stripe PaymentIntent
- [x] Scheduler stops renewing when order status is completed/cancelled/refunded
- [x] Add multi-photo upload per charge line in WarehouseOrders damage report form
- [x] Photos upload to S3 via /api/upload-damage-photo endpoint (20MB limit)
- [x] Thumbnail previews with remove button in the form
- [x] sendReturnChargeEmail embeds damage photos inline (80x80 thumbnails, clickable to full size)
- [x] 270/270 tests passing
- [ ] Save checkpoint (next step)

## Admin Panel Layout - Stacked Grid (April 2026)

- [x] Compact admin category cards into a tight 4-column grid (2 on mobile, 3 on tablet, 4 on desktop)
- [x] Grouped into 4 sections: Warehouse / Inventory / Orders & Members / Admin Tools
- [x] Subtle section labels above each group for fast scanning
- [x] Reduced card height: smaller icon, tighter padding, truncated descriptions
- [x] Badges and hover states preserved

## Admin Dashboard Improvements (April 2026)

- [x] Add warehouse.activeOrderCount tRPC procedure (counts pending/confirmed/active orders)
- [x] Wire live count badge to Warehouse Orders card on Admin Dashboard
- [x] Build pinned favourites row with per-user localStorage persistence
- [x] Pin/unpin button appears on hover for every card (orange pin icon, PinOff when pinned)
- [x] Pinned cards appear in a dedicated "Favourites" row at the top of the Manage section
- [x] Pins are stored per user ID in localStorage (each staff member has their own pins)
- [x] 270/270 tests passing

## Search Bar Width Fix (April 2026)

- [x] Widen navbar search bar container from max-w-xl to max-w-2xl
- [x] Remove internal max-w cap inside SearchBar component so it fills its container fully

## Navbar Tweaks (April 2026)

- [x] Temporarily hide Bundles link from navbar (commented out, easy to restore)
- [x] Widen search bar container from max-w-2xl to max-w-3xl
- [ ] Re-enable Bundles link when bundles feature is ready for public

## Logo Tagline Stacking (April 2026)

- [x] Stack "RENT ANYTHING" and "BUILD EVERYTHING" on separate lines under EQUIPHK
- [x] Centred alignment under the EQUIPHK wordmark

## Search Dropdown Mobile Fix (April 2026)

- [x] Fix search results dropdown clipping on mobile (prices and names cut off on right)
- [x] Dropdown now expands to min 480px or 90vw, whichever fits the screen
- [x] Raised z-index to 9999 to prevent any navbar element overlapping the dropdown

## Weekly Google Drive Backup (April 2026)

- [x] Changed Google Drive backup scheduler from monthly to weekly (every Sunday at 02:00 HKT)
- [x] Added lastRanDate guard to prevent duplicate runs within the same minute window
- [x] Confirmed scheduler started: "[DriveBackup] Scheduler started (runs every Sunday at 02:00 HKT)"

## Mac Local Backup — Weekly Schedule (April 2026)

- [x] Updated launchd plist from monthly (Day=1) to weekly (Weekday=0 = Sunday at 11:30 AM)
- [x] Unloaded old plist, installed new one, reloaded — confirmed active via launchctl list

## Navbar Tagline Removal (April 2026)

- [x] Remove "RENT ANYTHING / BUILD EVERYTHING" tagline from Navbar — only EQUIPHK wordmark remains

## Equipment Dropdown Category Filtering (April 2026)

- [x] Wire each category in Equipment mega-dropdown to navigate to catalog pre-filtered by that category
- [x] Ensure catalog page reads category param from URL and applies filter on load (useEffect now depends on searchString)
- [x] Save checkpoint

## Dynamic Catalog Heading (April 2026)

- [x] Add dynamic heading to EquipmentCatalogue showing active category name and filtered item count
- [x] Show "All Equipment (N items)" when no filter active, "Generators (N items)" when filtered
- [x] Save checkpoint

## Empty State Card for Filtered Catalog (April 2026)

- [x] Replace plain "No items found" text with a styled empty-state card
- [x] Card includes icon, message, and "Browse all equipment" CTA button that clears all filters
- [x] Save checkpoint

## Request This Item Link in Empty State (April 2026)

- [x] Add "Request this item" mailto link to empty-state card, pre-filled to info@equip.hk with subject/body from active filters
- [x] Save checkpoint

## Share This Item Button on Product Pages (April 2026)

- [x] Add "Share this item" button to product detail page
- [x] Use Web Share API on mobile, clipboard copy fallback on desktop
- [x] Show "Copied!" confirmation after clipboard copy
- [ ] Save checkpoint

## SEO Boost (May 2026)

- [x] Enhance SEOHead: full Open Graph, Twitter Card, canonical URL, per-page dynamic title/description
- [x] Add JSON-LD LocalBusiness + WebSite schema to homepage
- [x] Add JSON-LD Product schema to ProductDetail page
- [x] Add JSON-LD BreadcrumbList schema to product pages
- [x] Add JSON-LD FAQPage schema to FAQ page
- [x] Update sitemap.xml with lastmod dates and corrected priorities
- [x] Improve robots.txt to block admin/warehouse/account/cart/api routes
- [x] Add CDN preconnect/dns-prefetch hints in index.html
- [ ] Save checkpoint

## Traditional Chinese (zh-HK) Meta & Hreflang (May 2026)

- [x] Extend SEOHead to accept zhDescription prop and render hreflang link tags (en-HK, zh-HK, x-default)
- [x] Add zh-HK meta descriptions to Home, Equipment Catalogue, ProductDetail, FAQ, About, GetAQuote, Bundles, Consumables, DeliveryInfo, Careers pages
- [ ] Save checkpoint

## Full zh-HK Translation System (May 2026)

- [x] Add nameZh, descriptionZh fields to equipment, bundles, consumables DB tables (schema migrated)
- [x] Build server-side auto-translation using LLM — fires on create/update of any content item
- [x] Create LanguageContext with 349-key TRANSLATIONS dictionary (EN + ZH-HK), pickLang helper
- [x] Wire useLanguage() into all pages and components (Hero, HowItWorks, Enterprise, Safety, Pricing, Why, Contact, Footer, Navbar, EquipmentSection, SearchBar, EquipmentCatalogue, Consumables, RecentlyViewed)
- [x] Update admin panel (AdminInventory, AdminConsumables, AdminBundles) to show nameZh/descriptionZh fields
- [x] Add Translate All bulk backfill tool to AdminDescriptionRegeneration page
- [x] TypeScript compiles clean — zero errors
- [x] Save checkpoint

## Bulk Delete in Inventory Manager (May 2026)

- [x] Add bulkDeleteEquipment tRPC procedure (admin-only, accepts array of IDs)
- [x] Add multi-select checkboxes to AdminInventory item rows
- [x] Add "Select All" checkbox in table header
- [x] Add bulk action toolbar (shows count selected + Delete Selected button)
- [x] Confirm dialog before bulk delete
- [x] Save checkpoint

## Bulk Status Change in Inventory Manager (May 2026)

- [x] Add bulkUpdateEquipmentStatus db helper + bulkUpdateStatus tRPC procedure
- [x] Add Change Status dropdown + Apply button to the bulk action toolbar in AdminInventory
- [x] Save checkpoint

## Run Backup Now — Admin Dashboard Quick Link

- [x] Add CloudUpload icon to lucide-react imports in AdminDashboard.tsx
- [x] Add "Run Backup" card to allCardConfigs (navigates to /admin/regenerate-descriptions)
- [x] TypeScript zero errors confirmed
- [x] Save checkpoint
