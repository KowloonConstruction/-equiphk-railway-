import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "manager", "warehouse"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Equipment categories (e.g., Power Tools, Heavy Plant, Aerial Platforms)
 */
export const equipmentCategories = mysqlTable("equipment_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  segment: mysqlEnum("segment", ["b2c", "b2b", "both"]).default("both").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EquipmentCategory = typeof equipmentCategories.$inferSelect;
export type InsertEquipmentCategory = typeof equipmentCategories.$inferInsert;

/**
 * Equipment sub-categories (e.g., Drills & Hammers under Power Tools)
 */
export const equipmentSubCategories = mysqlTable("equipment_sub_categories", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EquipmentSubCategory = typeof equipmentSubCategories.$inferSelect;
export type InsertEquipmentSubCategory = typeof equipmentSubCategories.$inferInsert;

/**
 * Equipment items — individual pieces of equipment available for rent
 */
export const equipmentItems = mysqlTable("equipment_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  subCategoryId: int("subCategoryId"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  brand: varchar("brand", { length: 128 }),
  model: varchar("model", { length: 128 }),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }),
  weeklyRate: decimal("weeklyRate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthlyRate", { precision: 10, scale: 2 }),
  pricingType: mysqlEnum("pricingType", ["fixed", "negotiated"]).default("fixed").notNull(),
  imageUrl: text("imageUrl"),
  pendingImageUrl: text("pendingImageUrl"),
  pendingImageSourceUrl: text("pendingImageSourceUrl"),  // Original web URL before S3 upload
  imageApprovalStatus: mysqlEnum("imageApprovalStatus", ["none", "pending", "approved", "rejected"]).default("none").notNull(),
  rejectedImageUrls: text("rejectedImageUrls"),  // JSON array of previously rejected SOURCE URLs (not CDN URLs)
  nameZh: varchar("nameZh", { length: 255 }),          // Traditional Chinese name (auto-translated)
  descriptionZh: text("descriptionZh"),                  // Traditional Chinese description (auto-translated)
  specs: text("specs"),
  condition: mysqlEnum("condition", ["new", "excellent", "good", "fair"]).default("good").notNull(),
  availability: mysqlEnum("availability", ["available", "rented", "maintenance", "retired"]).default("available").notNull(),
  quantity: int("quantity").default(1).notNull(),
  availableQty: int("availableQty").default(1).notNull(),
  location: varchar("location", { length: 255 }),
  includes: varchar("includes", { length: 512 }),  // e.g. "1x Battery, 1x Charger"
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  isReviewed: boolean("isReviewed").default(false).notNull(),
  // Fuel type — determines if a fuel add-on is offered at checkout
  fuelType: mysqlEnum("fuelType", ["none", "petrol", "diesel"]).default("none").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EquipmentItem = typeof equipmentItems.$inferSelect;
export type InsertEquipmentItem = typeof equipmentItems.$inferInsert;

/**
 * Contact / quote form submissions
 */
export const contactSubmissions = mysqlTable("contact_submissions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  company: varchar("company", { length: 255 }),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  formType: mysqlEnum("formType", ["contact", "quote", "enterprise"]).default("contact").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = typeof contactSubmissions.$inferInsert;

/**
 * Site-wide announcement banners (managed by admin)
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "warning", "success", "promo"]).default("info").notNull(),
  linkText: varchar("linkText", { length: 128 }),
  linkUrl: varchar("linkUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Site notifications for visitors (new equipment, deals, updates)
 */
export const siteNotifications = mysqlTable("site_notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["new_equipment", "deal", "update", "announcement"]).default("update").notNull(),
  linkUrl: varchar("linkUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SiteNotification = typeof siteNotifications.$inferSelect;
export type InsertSiteNotification = typeof siteNotifications.$inferInsert;

/**
 * Operation manuals — PDF manuals attached to equipment items
 */
export const equipmentManuals = mysqlTable("equipment_manuals", {
  id: int("id").autoincrement().primaryKey(),
  equipmentItemId: int("equipmentItemId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileSize: int("fileSize"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type EquipmentManual = typeof equipmentManuals.$inferSelect;
export type InsertEquipmentManual = typeof equipmentManuals.$inferInsert;

/**
 * AI triage support tickets — created when AI chat escalates to human
 */
export const supportTickets = mysqlTable("support_tickets", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 255 }),
  customerPhone: varchar("customerPhone", { length: 64 }),
  issueType: varchar("issueType", { length: 64 }),
  equipmentName: varchar("equipmentName", { length: 255 }),
  summary: text("summary"),
  conversationLog: text("conversationLog"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open").notNull(),
  whatsappSent: boolean("whatsappSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * User favourites — equipment items saved by logged-in users
 */
export const userFavourites = mysqlTable("user_favourites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  equipmentItemId: int("equipmentItemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserFavourite = typeof userFavourites.$inferSelect;
export type InsertUserFavourite = typeof userFavourites.$inferInsert;

/**
 * Consumable products for sale (not rental) — e.g. PU resin, epoxy, membrane liquid
 */
export const consumables = mysqlTable("consumables", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameZh: varchar("nameZh", { length: 255 }),            // Traditional Chinese name (auto-translated)
  description: text("description"),
  descriptionZh: text("descriptionZh"),                  // Traditional Chinese description (auto-translated)
  brand: varchar("brand", { length: 128 }),
  model: varchar("model", { length: 128 }),
  unit: varchar("unit", { length: 64 }).default("each").notNull(),  // e.g. "kg", "litre", "set", "each"
  price: decimal("price", { precision: 10, scale: 2 }),
  imageUrl: text("imageUrl"),
  specs: text("specs"),
  categoryTag: varchar("categoryTag", { length: 128 }),  // e.g. "waterproofing", "adhesives"
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consumable = typeof consumables.$inferSelect;
export type InsertConsumable = typeof consumables.$inferInsert;

/**
 * Many-to-many link between equipment items and related consumables
 */
export const equipmentConsumables = mysqlTable("equipment_consumables", {
  id: int("id").autoincrement().primaryKey(),
  equipmentItemId: int("equipmentItemId").notNull(),
  consumableId: int("consumableId").notNull(),
  note: varchar("note", { length: 255 }),  // e.g. "Required for injection", "Recommended primer"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EquipmentConsumable = typeof equipmentConsumables.$inferSelect;
export type InsertEquipmentConsumable = typeof equipmentConsumables.$inferInsert;

/**
 * Equipment bundles / kits — pre-packaged rental packages
 */
export const equipmentBundles = mysqlTable("equipment_bundles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameZh: varchar("nameZh", { length: 255 }),            // Traditional Chinese name (auto-translated)
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  descriptionZh: text("descriptionZh"),                  // Traditional Chinese description (auto-translated)
  imageUrl: text("imageUrl"),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }),
  weeklyRate: decimal("weeklyRate", { precision: 10, scale: 2 }),
  monthlyRate: decimal("monthlyRate", { precision: 10, scale: 2 }),
  savingsPercent: int("savingsPercent"),  // e.g. 15 = "Save 15%"
  categoryTag: varchar("categoryTag", { length: 64 }),  // e.g. "waterproofing", "surface_prep"
  isActive: boolean("isActive").default(true).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EquipmentBundle = typeof equipmentBundles.$inferSelect;
export type InsertEquipmentBundle = typeof equipmentBundles.$inferInsert;

/**
 * Items included in a bundle
 */
export const bundleItems = mysqlTable("bundle_items", {
  id: int("id").autoincrement().primaryKey(),
  bundleId: int("bundleId").notNull(),
  equipmentItemId: int("equipmentItemId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  note: varchar("note", { length: 255 }),  // e.g. "Includes 2 batteries"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BundleItem = typeof bundleItems.$inferSelect;
export type InsertBundleItem = typeof bundleItems.$inferInsert;


/**
 * Activity log — tracks all admin changes for audit trail
 */
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 64 }).notNull(), // e.g. "create", "update", "delete", "approve", "reject", "import"
  entityType: varchar("entityType", { length: 64 }).notNull(), // e.g. "equipment", "category", "bundle", "consumable", "photo"
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 255 }),
  details: text("details"), // JSON string with extra context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type InsertActivityLogEntry = typeof activityLog.$inferInsert;


/**
 * Enquiry/Lead tracking — logs quote requests, WhatsApp clicks, and other lead events
 */
export const enquiryLeads = mysqlTable("enquiry_leads", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["quote_request", "whatsapp_click", "phone_call", "email_click", "cart_enquiry"]).default("quote_request").notNull(),
  equipmentItemId: int("equipmentItemId"),
  equipmentName: varchar("equipmentName", { length: 255 }),
  customerName: varchar("customerName", { length: 255 }),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 64 }),
  company: varchar("company", { length: 255 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "contacted", "quoted", "won", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 128 }), // e.g. "product_page", "bundle_page", "homepage"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EnquiryLead = typeof enquiryLeads.$inferSelect;
export type InsertEnquiryLead = typeof enquiryLeads.$inferInsert;


/**
 * Rental Bookings — tracks equipment rentals with start/end dates
 */
export const rentalBookings = mysqlTable("rental_bookings", {
  id: int("id").autoincrement().primaryKey(),
  equipmentItemId: int("equipmentItemId").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerPhone: varchar("customerPhone", { length: 64 }),
  company: varchar("company", { length: 255 }),
  rentalStartDate: timestamp("rentalStartDate").notNull(),
  rentalEndDate: timestamp("rentalEndDate").notNull(),
  rentalDays: int("rentalDays").notNull(), // calculated from start/end
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }),
  totalCost: decimal("totalCost", { precision: 12, scale: 2 }),
  status: mysqlEnum("status", ["pending", "active", "completed", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalBooking = typeof rentalBookings.$inferSelect;
export type InsertRentalBooking = typeof rentalBookings.$inferInsert;

/**
 * User memberships — Pay-As-You-Go or Trade Pro accounts
 */
export const userMemberships = mysqlTable("user_memberships", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  plan: mysqlEnum("plan", ["payg", "trade_pro"]).default("payg").notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended", "cancelled"]).default("pending").notNull(),
  // Profile fields
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  businessRegNo: varchar("businessRegNo", { length: 128 }),
  monthlyBudget: varchar("monthlyBudget", { length: 64 }),
  // HKID verification
  hkidNumber: varchar("hkidNumber", { length: 32 }),
  hkidPhotoUrl: text("hkidPhotoUrl"),
  hkidPhotoKey: varchar("hkidPhotoKey", { length: 512 }),
  hkidVerified: boolean("hkidVerified").default(false).notNull(),
  hkidVerifiedAt: timestamp("hkidVerifiedAt"),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  // Trade Pro membership billing
  membershipFee: decimal("membershipFee", { precision: 10, scale: 2 }),
  nextBillingDate: timestamp("nextBillingDate"),
  // Return address
  returnAddress: text("returnAddress"),
  // Notes
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserMembership = typeof userMemberships.$inferSelect;
export type InsertUserMembership = typeof userMemberships.$inferInsert;

/**
 * Enhanced rental orders — multi-item bookings with payment tracking
 */
export const rentalOrders = mysqlTable("rental_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  membershipId: int("membershipId"),
  // Customer info (captured at time of booking)
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 64 }).notNull(),
  companyName: varchar("companyName", { length: 255 }),
  // Identity verification
  hkidNumber: varchar("hkidNumber", { length: 32 }),
  hkidPhotoUrl: text("hkidPhotoUrl"),
  membershipPlan: mysqlEnum("membershipPlan", ["payg", "trade_pro"]).default("payg").notNull(),
  // Dates
  rentalStartDate: timestamp("rentalStartDate").notNull(),
  rentalEndDate: timestamp("rentalEndDate").notNull(),
  rentalDays: int("rentalDays").notNull(),
  // Pricing
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discountAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0").notNull(),
  depositAmount: decimal("depositAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  depositWaived: boolean("depositWaived").default(false).notNull(),
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  // Delivery
  deliveryType: mysqlEnum("deliveryType", ["delivery", "self_collection"]).default("self_collection").notNull(),
  deliveryAddress: text("deliveryAddress"),
  returnAddress: text("returnAddress"),
  // Status
  status: mysqlEnum("status", ["pending_payment", "paid", "confirmed", "active", "completed", "cancelled", "refunded"]).default("pending_payment").notNull(),
  // Stripe
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 128 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 128 }),
  paidAt: timestamp("paidAt"),
  // Notifications
  adminNotifiedAt: timestamp("adminNotifiedAt"),
  customerEmailSentAt: timestamp("customerEmailSentAt"),
  // Delivery scheduling
  deliverySlotDate: timestamp("deliverySlotDate"),  // Requested delivery date
  deliverySlotTime: mysqlEnum("deliverySlotTime", ["morning", "afternoon", "evening"]),  // AM/PM/Evening slot
  collectionSlotDate: timestamp("collectionSlotDate"),  // Requested collection date
  collectionSlotTime: mysqlEnum("collectionSlotTime", ["morning", "afternoon", "evening"]),
  // Deposit management (pre-authorisation via Stripe)
  depositStatus: mysqlEnum("depositStatus", ["none", "pending", "held", "captured", "partially_captured", "released", "expired"]).default("none"),
  depositReturnedAmount: decimal("depositReturnedAmount", { precision: 12, scale: 2 }).default("0"),
  depositDeductionReason: text("depositDeductionReason"),
  depositSettledAt: timestamp("depositSettledAt"),
  // Stripe pre-auth (card hold) — separate PaymentIntent with capture_method: manual
  stripeDepositIntentId: varchar("stripeDepositIntentId", { length: 128 }),  // PaymentIntent ID for the hold
  stripeDepositClientSecret: varchar("stripeDepositClientSecret", { length: 256 }),  // For frontend confirmation
  depositHoldExpiresAt: timestamp("depositHoldExpiresAt"),  // Holds expire after 7 days on most cards
  // Fuel add-on (for petrol/diesel powered equipment)
  fuelLitres: decimal("fuelLitres", { precision: 8, scale: 2 }),  // Litres requested by customer
  fuelPricePerLitre: decimal("fuelPricePerLitre", { precision: 8, scale: 2 }),  // Live pump price at time of order
  fuelType: mysqlEnum("fuelType", ["none", "petrol", "diesel"]).default("none"),  // Fuel type for this order
  fuelCost: decimal("fuelCost", { precision: 10, scale: 2 }).default("0"),  // fuelLitres × fuelPricePerLitre
  // Notes
  customerNotes: text("customerNotes"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalOrder = typeof rentalOrders.$inferSelect;
export type InsertRentalOrder = typeof rentalOrders.$inferInsert;

/**
 * Line items within a rental order
 */
export const rentalOrderItems = mysqlTable("rental_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  equipmentItemId: int("equipmentItemId").notNull(),
  equipmentName: varchar("equipmentName", { length: 255 }).notNull(),
  equipmentBrand: varchar("equipmentBrand", { length: 128 }),
  rentalDays: int("rentalDays").notNull(),
  dailyRate: decimal("dailyRate", { precision: 10, scale: 2 }).notNull(),
  lineTotal: decimal("lineTotal", { precision: 12, scale: 2 }).notNull(),
  discountedTotal: decimal("discountedTotal", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RentalOrderItem = typeof rentalOrderItems.$inferSelect;
export type InsertRentalOrderItem = typeof rentalOrderItems.$inferInsert;

/**
 * Saved carts (Job Kits) — customers can save a cart and re-hire with one click
 */
export const savedCarts = mysqlTable("saved_carts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),  // e.g. "Waterproofing Kit"
  items: text("items").notNull(),  // JSON: [{equipmentItemId, equipmentName, dailyRate, rentalDays}]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedCart = typeof savedCarts.$inferSelect;
export type InsertSavedCart = typeof savedCarts.$inferInsert;

/**
 * Referral codes — each user gets one unique code they can share
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),  // owner of the code
  code: varchar("code", { length: 16 }).notNull().unique(),  // e.g. "CASEY2024"
  totalReferrals: int("totalReferrals").default(0).notNull(),
  totalCreditsEarned: decimal("totalCreditsEarned", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

/**
 * Referral events — tracks when a referred user completes their first order
 */
export const referralEvents = mysqlTable("referral_events", {
  id: int("id").autoincrement().primaryKey(),
  referralCodeId: int("referralCodeId").notNull(),
  referrerId: int("referrerId").notNull(),   // user who owns the code
  referredUserId: int("referredUserId").notNull(),  // new user who used the code
  referredEmail: varchar("referredEmail", { length: 320 }),
  orderId: int("orderId"),  // the qualifying order that triggered the reward
  orderAmount: decimal("orderAmount", { precision: 12, scale: 2 }),
  creditAwarded: decimal("creditAwarded", { precision: 10, scale: 2 }).default("0").notNull(),
  status: mysqlEnum("status", ["pending", "awarded", "expired", "reversed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  awardedAt: timestamp("awardedAt"),
});

export type ReferralEvent = typeof referralEvents.$inferSelect;
export type InsertReferralEvent = typeof referralEvents.$inferInsert;

/**
 * Referral credits — balance per user, redeemable at checkout
 */
export const referralCredits = mysqlTable("referral_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  balance: decimal("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  lifetimeEarned: decimal("lifetimeEarned", { precision: 10, scale: 2 }).default("0").notNull(),
  lifetimeRedeemed: decimal("lifetimeRedeemed", { precision: 10, scale: 2 }).default("0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralCredit = typeof referralCredits.$inferSelect;
export type InsertReferralCredit = typeof referralCredits.$inferInsert;

/**
 * Order status email notification log
 * Tracks every status-change email sent to a customer, preventing duplicates
 */
export const orderEmailLogs = mysqlTable("order_email_logs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["confirmed", "active", "completed", "cancelled"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  error: text("error"),  // null = success, populated = failed
});
export type OrderEmailLog = typeof orderEmailLogs.$inferSelect;
export type InsertOrderEmailLog = typeof orderEmailLogs.$inferInsert;

// ─── Warehouse Return Logging ──────────────────────────────────────────────────

/**
 * Equipment return log — created by warehouse staff when equipment is returned.
 * One log per order. Completing this log marks the order as Completed.
 */
export const equipmentReturnLogs = mysqlTable("equipment_return_logs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(), // one return log per order
  returnedAt: timestamp("returnedAt").defaultNow().notNull(),
  condition: mysqlEnum("condition", ["excellent", "good", "fair", "damaged", "missing_items"]).notNull(),
  overallNotes: text("overallNotes"), // general notes from warehouse staff
  completedByUserId: int("completedByUserId").notNull(), // warehouse staff user ID
  totalCharges: decimal("totalCharges", { precision: 10, scale: 2 }).default("0").notNull(),
  chargeSentToCustomer: boolean("chargeSentToCustomer").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EquipmentReturnLog = typeof equipmentReturnLogs.$inferSelect;
export type InsertEquipmentReturnLog = typeof equipmentReturnLogs.$inferInsert;

/**
 * Return charges — individual charge line items logged against a return.
 * Types: damage, repair, cleaning, missing_item, other
 */
export const returnCharges = mysqlTable("return_charges", {
  id: int("id").autoincrement().primaryKey(),
  returnLogId: int("returnLogId").notNull(),
  chargeType: mysqlEnum("chargeType", ["damage", "repair", "cleaning", "missing_item", "other"]).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  photoUrl: text("photoUrl"), // optional S3 URL for damage photo evidence
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReturnCharge = typeof returnCharges.$inferSelect;
export type InsertReturnCharge = typeof returnCharges.$inferInsert;

/**
 * Staff permissions — granular per-app access control for manager/warehouse staff.
 * Stored as a JSON string of permission keys (e.g. ["orders","members","inventory"]).
 * When null, falls back to role-based defaults.
 */
export const staffPermissions = mysqlTable("staff_permissions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  permissions: text("permissions"), // JSON array of permission keys (nullable, null = use role defaults)
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StaffPermission = typeof staffPermissions.$inferSelect;
export type InsertStaffPermission = typeof staffPermissions.$inferInsert;

/**
 * Lead replies — tracks follow-up emails sent to enquiry leads from the admin panel.
 */
export const leadReplies = mysqlTable("lead_replies", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  sentBy: int("sentBy").notNull(),
  sentByName: varchar("sentByName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});
export type LeadReply = typeof leadReplies.$inferSelect;
export type InsertLeadReply = typeof leadReplies.$inferInsert;
