/*
 * Database Query Helpers
 * Centralized data access layer for all database operations
 */
import { drizzle } from "drizzle-orm/mysql2";
import { eq, like, and, or, desc, asc, sql, inArray, lte, gte, isNotNull } from "drizzle-orm";
import {
  InsertUser,
  users,
  equipmentCategories,
  equipmentSubCategories,
  equipmentItems,
  InsertEquipmentCategory,
  InsertEquipmentSubCategory,
  InsertEquipmentItem,
  contactSubmissions,
  InsertContactSubmission,
  announcements,
  InsertAnnouncement,
  siteNotifications,
  InsertSiteNotification,
  equipmentManuals,
  InsertEquipmentManual,
  supportTickets,
  InsertSupportTicket,
  userFavourites,
  rentalBookings,
  InsertRentalBooking,
  savedCarts,
  InsertSavedCart,
  referralCodes,
  referralEvents,
  referralCredits,
  equipmentReturnLogs,
  InsertEquipmentReturnLog,
  returnCharges,
  InsertReturnCharge,
  staffPermissions,
  leadReplies,
  InsertLeadReply,
  enquiryLeads as enquiryLeadsTable,
  enquiryLeads,
  InsertEnquiryLead,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserPassword(openId: string, passwordHash: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash }).where(eq(users.openId, openId));
}

// ─── Equipment Categories ──────────────────────────────────────────

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(equipmentCategories).orderBy(equipmentCategories.sortOrder);
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(equipmentCategories).where(eq(equipmentCategories.id, id)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertEquipmentCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(equipmentCategories).values(data);
  return { id: result[0].insertId };
}

export async function updateCategory(id: number, data: Partial<InsertEquipmentCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(equipmentCategories).set(data).where(eq(equipmentCategories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(equipmentCategories).where(eq(equipmentCategories.id, id));
}

// ─── Equipment Sub-Categories ───────────────────────────────────────

// Admin: list ALL sub-categories (including inactive)
export async function listAllSubCategories(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (categoryId) {
    conditions.push(eq(equipmentSubCategories.categoryId, categoryId));
  }
  const query = db
    .select()
    .from(equipmentSubCategories)
    .orderBy(equipmentSubCategories.categoryId, equipmentSubCategories.sortOrder);
  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function listAllCategoriesWithSubCategories() {
  const db = await getDb();
  if (!db) return [];
  const cats = await db.select().from(equipmentCategories).orderBy(equipmentCategories.sortOrder);
  const subs = await db.select().from(equipmentSubCategories).orderBy(equipmentSubCategories.categoryId, equipmentSubCategories.sortOrder);
  return cats.map(cat => ({
    ...cat,
    subCategories: subs.filter(s => s.categoryId === cat.id),
  }));
}

export async function createSubCategory(data: InsertEquipmentSubCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(equipmentSubCategories).values(data);
  return { id: (result as any).insertId, ...data };
}

export async function updateSubCategory(id: number, data: Partial<InsertEquipmentSubCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(equipmentSubCategories).set(data).where(eq(equipmentSubCategories.id, id));
  return { id, ...data };
}

export async function deleteSubCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Unassign items that use this sub-category
  await db.update(equipmentItems).set({ subCategoryId: null }).where(eq(equipmentItems.subCategoryId, id));
  await db.delete(equipmentSubCategories).where(eq(equipmentSubCategories.id, id));
}

export async function reorderSubCategories(updates: { id: number; sortOrder: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  for (const { id, sortOrder } of updates) {
    await db.update(equipmentSubCategories).set({ sortOrder }).where(eq(equipmentSubCategories.id, id));
  }
  return { updated: updates.length };
}

export async function listSubCategories(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(equipmentSubCategories.isActive, true)];
  if (categoryId) {
    conditions.push(eq(equipmentSubCategories.categoryId, categoryId));
  }
  return db
    .select()
    .from(equipmentSubCategories)
    .where(and(...conditions))
    .orderBy(equipmentSubCategories.categoryId, equipmentSubCategories.sortOrder);
}

export async function listCategoriesWithSubCategories() {
  const db = await getDb();
  if (!db) return [];
  const cats = await db.select().from(equipmentCategories).where(eq(equipmentCategories.isActive, true)).orderBy(equipmentCategories.sortOrder);
  const subs = await db.select().from(equipmentSubCategories).where(eq(equipmentSubCategories.isActive, true)).orderBy(equipmentSubCategories.categoryId, equipmentSubCategories.sortOrder);
  return cats.map(cat => ({
    ...cat,
    subCategories: subs.filter(s => s.categoryId === cat.id),
  }));
}

// ─── Equipment Items ─────────────────────────────────────────────────

export async function getDistinctBrands() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .selectDistinct({ brand: equipmentItems.brand })
    .from(equipmentItems)
    .where(and(eq(equipmentItems.isActive, true), isNotNull(equipmentItems.brand)))
    .orderBy(asc(equipmentItems.brand));
  return rows
    .map(r => r.brand)
    .filter((b): b is string => !!b && b.trim().length > 0)
    .sort();
}

export async function listEquipmentItems(filters?: {
  categoryId?: number;
  subCategoryId?: number;
  availability?: string;
  search?: string;
  activeOnly?: boolean;
  brand?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];

  if (filters?.categoryId) {
    conditions.push(eq(equipmentItems.categoryId, filters.categoryId));
  }
  if (filters?.subCategoryId) {
    conditions.push(eq(equipmentItems.subCategoryId, filters.subCategoryId));
  }
  if (filters?.availability) {
    conditions.push(eq(equipmentItems.availability, filters.availability as any));
  }
  if (filters?.search) {
    conditions.push(like(equipmentItems.name, `%${filters.search}%`));
  }
  if (filters?.activeOnly) {
    conditions.push(eq(equipmentItems.isActive, true));
  }
  if (filters?.brand) {
    conditions.push(eq(equipmentItems.brand, filters.brand));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: equipmentItems.id,
      categoryId: equipmentItems.categoryId,
      subCategoryId: equipmentItems.subCategoryId,
      name: equipmentItems.name,
      description: equipmentItems.description,
      brand: equipmentItems.brand,
      model: equipmentItems.model,
      dailyRate: equipmentItems.dailyRate,
      weeklyRate: equipmentItems.weeklyRate,
      monthlyRate: equipmentItems.monthlyRate,
      pricingType: equipmentItems.pricingType,
      imageUrl: equipmentItems.imageUrl,
      specs: equipmentItems.specs,
      condition: equipmentItems.condition,
      availability: equipmentItems.availability,
      quantity: equipmentItems.quantity,
      availableQty: equipmentItems.availableQty,
      location: equipmentItems.location,
      includes: equipmentItems.includes,
      isActive: equipmentItems.isActive,
      isFeatured: equipmentItems.isFeatured,
      isReviewed: equipmentItems.isReviewed,
      nameZh: equipmentItems.nameZh,
      descriptionZh: equipmentItems.descriptionZh,
      createdAt: equipmentItems.createdAt,
      updatedAt: equipmentItems.updatedAt,
      subCategoryName: equipmentSubCategories.name,
    })
    .from(equipmentItems)
    .leftJoin(equipmentSubCategories, eq(equipmentItems.subCategoryId, equipmentSubCategories.id))
    .where(whereClause)
    .orderBy(desc(equipmentItems.updatedAt));
}

export async function getEquipmentItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(equipmentItems).where(eq(equipmentItems.id, id)).limit(1);
  return result[0];
}

export async function createEquipmentItem(data: InsertEquipmentItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(equipmentItems).values(data);
  return { id: result[0].insertId };
}

export async function updateEquipmentItem(id: number, data: Partial<InsertEquipmentItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(equipmentItems).set(data).where(eq(equipmentItems.id, id));
}

export async function deleteEquipmentItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
}

export async function bulkDeleteEquipmentItems(ids: number[]) {
  if (ids.length === 0) return { deleted: 0 };
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(equipmentItems).where(inArray(equipmentItems.id, ids));
  return { deleted: ids.length };
}

export async function bulkUpdateEquipmentCategory(
  ids: number[],
  categoryId: number,
  subCategoryId: number | null
) {
  if (ids.length === 0) return { updated: 0 };
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(equipmentItems)
    .set({ categoryId, subCategoryId })
    .where(inArray(equipmentItems.id, ids));
  return { updated: ids.length };
}

export async function bulkUpdateEquipmentStatus(
  ids: number[],
  availability: "available" | "rented" | "maintenance" | "retired"
) {
  if (ids.length === 0) return { updated: 0 };
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(equipmentItems)
    .set({ availability })
    .where(inArray(equipmentItems.id, ids));
  return { updated: ids.length };
}

export async function searchEquipmentItems(query: string, limit: number = 8) {
  const db = await getDb();
  if (!db) return [];

  const searchTerm = `%${query}%`;

  return db
    .select({
      id: equipmentItems.id,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
      dailyRate: equipmentItems.dailyRate,
      imageUrl: equipmentItems.imageUrl,
      categoryId: equipmentItems.categoryId,
    })
    .from(equipmentItems)
    .innerJoin(equipmentCategories, eq(equipmentItems.categoryId, equipmentCategories.id))
    .where(
      and(
        or(
          like(equipmentItems.name, searchTerm),
          like(equipmentItems.brand, searchTerm),
          like(equipmentItems.model, searchTerm),
          like(equipmentCategories.name, searchTerm)
        ),
        eq(equipmentItems.isActive, true),
        eq(equipmentItems.availability, "available")
      )
    )
    .limit(limit);
}

export async function getInventoryStats() {
  const db = await getDb();
  if (!db) return { totalItems: 0, totalCategories: 0, availableItems: 0, rentedItems: 0, maintenanceItems: 0 };

  const [stats] = await db
    .select({
      totalItems: sql<number>`count(*)`,
      availableItems: sql<number>`sum(case when availability = 'available' then 1 else 0 end)`,
      rentedItems: sql<number>`sum(case when availability = 'rented' then 1 else 0 end)`,
      maintenanceItems: sql<number>`sum(case when availability = 'maintenance' then 1 else 0 end)`,
    })
    .from(equipmentItems);

  const [catStats] = await db
    .select({ totalCategories: sql<number>`count(*)` })
    .from(equipmentCategories);

  return {
    ...(stats || { totalItems: 0, availableItems: 0, rentedItems: 0, maintenanceItems: 0 }),
    totalCategories: catStats?.totalCategories ?? 0,
  };
}

// ─── Contact Submissions ────────────────────────────────────────────

export async function createContactSubmission(data: InsertContactSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contactSubmissions).values(data);
  return { id: result[0].insertId };
}

export async function listContactSubmissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
}

export async function markSubmissionRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contactSubmissions).set({ isRead: true }).where(eq(contactSubmissions.id, id));
}

export async function deleteContactSubmission(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
}

export async function getUnreadSubmissionCount() {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(contactSubmissions)
    .where(eq(contactSubmissions.isRead, false));
  return result?.count ?? 0;
}

// ─── Announcements ──────────────────────────────────────────────────

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(data);
  return { id: result[0].insertId };
}

export async function listAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function getActiveAnnouncements() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(announcements)
    .where(eq(announcements.isActive, true))
    .orderBy(desc(announcements.createdAt));
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

// ─── Site Notifications ─────────────────────────────────────────────

export async function createSiteNotification(data: InsertSiteNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(siteNotifications).values(data);
  return { id: result[0].insertId };
}

export async function listSiteNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteNotifications).orderBy(desc(siteNotifications.createdAt));
}

export async function getActiveSiteNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(siteNotifications)
    .where(eq(siteNotifications.isActive, true))
    .orderBy(desc(siteNotifications.createdAt));
}

export async function updateSiteNotification(id: number, data: Partial<InsertSiteNotification>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(siteNotifications).set(data).where(eq(siteNotifications.id, id));
}

export async function deleteSiteNotification(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(siteNotifications).where(eq(siteNotifications.id, id));
}

// ─── Equipment Manuals ──────────────────────────────────────────────

export async function getManualsByItem(equipmentItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(equipmentManuals)
    .where(eq(equipmentManuals.equipmentItemId, equipmentItemId))
    .orderBy(desc(equipmentManuals.uploadedAt));
}

export async function createManual(data: InsertEquipmentManual) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(equipmentManuals).values(data);
  return { id: result[0].insertId };
}

export async function deleteManual(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [manual] = await db.select().from(equipmentManuals).where(eq(equipmentManuals.id, id));
  if (!manual) throw new Error("Manual not found");
  await db.delete(equipmentManuals).where(eq(equipmentManuals.id, id));
  return manual;
}

// ─── Support Tickets ────────────────────────────────────────────────

export async function createSupportTicket(data: InsertSupportTicket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(supportTickets).values(data);
  return { id: result[0].insertId };
}

export async function listSupportTickets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
}

export async function updateSupportTicketStatus(id: number, status: "open" | "in_progress" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(supportTickets).set({ status }).where(eq(supportTickets.id, id));
}

// ─── User Favourites ────────────────────────────────────────────────

export async function addFavourite(userId: number, equipmentItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Ignore duplicate (already favourited)
  await db.insert(userFavourites).values({ userId, equipmentItemId }).onDuplicateKeyUpdate({
    set: { userId },
  });
}

export async function removeFavourite(userId: number, equipmentItemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(userFavourites)
    .where(and(eq(userFavourites.userId, userId), eq(userFavourites.equipmentItemId, equipmentItemId)));
}

export async function listFavourites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: equipmentItems.id,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
      model: equipmentItems.model,
      dailyRate: equipmentItems.dailyRate,
      weeklyRate: equipmentItems.weeklyRate,
      monthlyRate: equipmentItems.monthlyRate,
      imageUrl: equipmentItems.imageUrl,
      availability: equipmentItems.availability,
      categoryId: equipmentItems.categoryId,
      subCategoryId: equipmentItems.subCategoryId,
      isActive: equipmentItems.isActive,
      favouritedAt: userFavourites.createdAt,
    })
    .from(userFavourites)
    .innerJoin(equipmentItems, eq(userFavourites.equipmentItemId, equipmentItems.id))
    .where(eq(userFavourites.userId, userId))
    .orderBy(desc(userFavourites.createdAt));
}

export async function getFavouriteIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ equipmentItemId: userFavourites.equipmentItemId })
    .from(userFavourites)
    .where(eq(userFavourites.userId, userId));
  return rows.map(r => r.equipmentItemId);
}

export async function isFavourite(userId: number, equipmentItemId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: userFavourites.id })
    .from(userFavourites)
    .where(and(eq(userFavourites.userId, userId), eq(userFavourites.equipmentItemId, equipmentItemId)))
    .limit(1);
  return result.length > 0;
}

// ─── Photo Approval Queue ─────────────────────────────────────────────────────

/** List all items with a pending image awaiting approval */
export async function listPendingImageApprovals() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: equipmentItems.id,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
      model: equipmentItems.model,
      currentImageUrl: equipmentItems.imageUrl,
      pendingImageUrl: equipmentItems.pendingImageUrl,
      pendingImageSourceUrl: equipmentItems.pendingImageSourceUrl,
      imageApprovalStatus: equipmentItems.imageApprovalStatus,
      categoryId: equipmentItems.categoryId,
    })
    .from(equipmentItems)
    .where(eq(equipmentItems.imageApprovalStatus, "pending"))
    .orderBy(desc(equipmentItems.updatedAt));
}

/** Approve a pending image — move pendingImageUrl → imageUrl, clear pending */
export async function approveItemImage(itemId: number) {
  const db = await getDb();
  if (!db) return;
  const [item] = await db
    .select({ pendingImageUrl: equipmentItems.pendingImageUrl })
    .from(equipmentItems)
    .where(eq(equipmentItems.id, itemId))
    .limit(1);
  if (!item?.pendingImageUrl) return;
  await db
    .update(equipmentItems)
    .set({
      imageUrl: item.pendingImageUrl,
      pendingImageUrl: null,
      pendingImageSourceUrl: null,
      imageApprovalStatus: "approved",
    })
    .where(eq(equipmentItems.id, itemId));
}

/** Reject a pending image — save URL to rejected list, discard pendingImageUrl, mark rejected */
export async function rejectItemImage(itemId: number) {
  const db = await getDb();
  if (!db) return;
  // Get the current pending SOURCE URL (original web URL) and existing rejected list
  const [item] = await db
    .select({
      pendingImageUrl: equipmentItems.pendingImageUrl,
      pendingImageSourceUrl: equipmentItems.pendingImageSourceUrl,
      rejectedImageUrls: equipmentItems.rejectedImageUrls,
    })
    .from(equipmentItems)
    .where(eq(equipmentItems.id, itemId))
    .limit(1);
  // Build updated rejected SOURCE URLs list
  // IMPORTANT: We track the original web source URL, not the CDN URL,
  // because the scraper filters by source URL to avoid re-downloading the same image
  let rejectedList: string[] = [];
  try {
    rejectedList = item?.rejectedImageUrls ? JSON.parse(item.rejectedImageUrls) : [];
  } catch { rejectedList = []; }
  // Prefer the source URL; fall back to CDN URL if source is missing (legacy data)
  const urlToReject = item?.pendingImageSourceUrl || item?.pendingImageUrl;
  if (urlToReject && !rejectedList.includes(urlToReject)) {
    rejectedList.push(urlToReject);
  }
  await db
    .update(equipmentItems)
    .set({
      pendingImageUrl: null,
      pendingImageSourceUrl: null,
      imageApprovalStatus: "rejected",
      rejectedImageUrls: JSON.stringify(rejectedList),
    })
    .where(eq(equipmentItems.id, itemId));
  return rejectedList;
}

/** List items whose last sourced image was rejected (so they can be re-sourced) */
export async function listRejectedImageApprovals() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: equipmentItems.id,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
      model: equipmentItems.model,
      currentImageUrl: equipmentItems.imageUrl,
      pendingImageUrl: equipmentItems.pendingImageUrl,
      imageApprovalStatus: equipmentItems.imageApprovalStatus,
      categoryId: equipmentItems.categoryId,
    })
    .from(equipmentItems)
    .where(eq(equipmentItems.imageApprovalStatus, "rejected"))
    .orderBy(desc(equipmentItems.updatedAt));
}

/** Count of items currently pending approval */
export async function countPendingImageApprovals(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(equipmentItems)
    .where(eq(equipmentItems.imageApprovalStatus, "pending"));
  return Number(row?.count ?? 0);
}

// ─── Consumables ─────────────────────────────────────────────────────

import {
  consumables,
  InsertConsumable,
  equipmentConsumables,
  InsertEquipmentConsumable,
} from "../drizzle/schema";

/** List all active consumables, optionally filtered by category tag */
export async function listConsumables(categoryTag?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(consumables.isActive, true)];
  if (categoryTag) {
    conditions.push(eq(consumables.categoryTag, categoryTag));
  }
  return db
    .select()
    .from(consumables)
    .where(and(...conditions))
    .orderBy(consumables.name);
}

/** Get a single consumable by ID */
export async function getConsumableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(consumables).where(eq(consumables.id, id)).limit(1);
  return result[0];
}

/** Get related consumables for an equipment item */
export async function getConsumablesForEquipment(equipmentItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: consumables.id,
      name: consumables.name,
      description: consumables.description,
      brand: consumables.brand,
      model: consumables.model,
      unit: consumables.unit,
      price: consumables.price,
      imageUrl: consumables.imageUrl,
      specs: consumables.specs,
      categoryTag: consumables.categoryTag,
      note: equipmentConsumables.note,
    })
    .from(equipmentConsumables)
    .innerJoin(consumables, eq(equipmentConsumables.consumableId, consumables.id))
    .where(
      and(
        eq(equipmentConsumables.equipmentItemId, equipmentItemId),
        eq(consumables.isActive, true)
      )
    )
    .orderBy(consumables.name);
}

/** Create a consumable product */
export async function createConsumable(data: InsertConsumable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(consumables).values(data);
  return { id: result[0].insertId };
}

/** Get equipment items that use a specific consumable */
export async function getEquipmentForConsumable(consumableId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: equipmentItems.id,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
      imageUrl: equipmentItems.imageUrl,
      dailyRate: equipmentItems.dailyRate,
      availability: equipmentItems.availability,
      note: equipmentConsumables.note,
    })
    .from(equipmentConsumables)
    .innerJoin(equipmentItems, eq(equipmentConsumables.equipmentItemId, equipmentItems.id))
    .where(
      and(
        eq(equipmentConsumables.consumableId, consumableId),
        eq(equipmentItems.isActive, true)
      )
    )
    .orderBy(equipmentItems.name);
}

/** Link a consumable to an equipment item */
export async function linkConsumableToEquipment(data: InsertEquipmentConsumable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(equipmentConsumables).values(data);
}

// ─── Equipment Bundles ──────────────────────────────────────────────

import { equipmentBundles, bundleItems } from "../drizzle/schema";

/** List all active bundles, optionally filtered by category tag */
export async function listBundles(categoryTag?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(equipmentBundles.isActive, true)];
  if (categoryTag) {
    conditions.push(eq(equipmentBundles.categoryTag, categoryTag));
  }
  return db
    .select()
    .from(equipmentBundles)
    .where(and(...conditions))
    .orderBy(equipmentBundles.sortOrder, equipmentBundles.name);
}

/** Get a single bundle by ID with its included items */
export async function getBundleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [bundle] = await db
    .select()
    .from(equipmentBundles)
    .where(eq(equipmentBundles.id, id))
    .limit(1);
  if (!bundle) return null;

  // Get included items with equipment details
  const items = await db
    .select({
      id: bundleItems.id,
      equipmentItemId: bundleItems.equipmentItemId,
      quantity: bundleItems.quantity,
      note: bundleItems.note,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
      model: equipmentItems.model,
      imageUrl: equipmentItems.imageUrl,
      dailyRate: equipmentItems.dailyRate,
    })
    .from(bundleItems)
    .innerJoin(equipmentItems, eq(bundleItems.equipmentItemId, equipmentItems.id))
    .where(eq(bundleItems.bundleId, id));

  return { ...bundle, items };
}

/** Get featured bundles for homepage display */
export async function getFeaturedBundles() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(equipmentBundles)
    .where(and(eq(equipmentBundles.isActive, true), eq(equipmentBundles.isFeatured, true)))
    .orderBy(equipmentBundles.sortOrder)
    .limit(6);
}

/** Create a new equipment bundle */
export async function createBundle(data: Omit<import("../drizzle/schema").InsertEquipmentBundle, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(equipmentBundles).values(data);
  return { id: result.insertId, ...data };
}

/** Update an existing bundle */
export async function updateBundle(id: number, data: Partial<Omit<import("../drizzle/schema").InsertEquipmentBundle, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(equipmentBundles).set(data).where(eq(equipmentBundles.id, id));
  return { success: true };
}

/** Delete a bundle and its items */
export async function deleteBundle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bundleItems).where(eq(bundleItems.bundleId, id));
  await db.delete(equipmentBundles).where(eq(equipmentBundles.id, id));
  return { success: true };
}

/** Add an item to a bundle */
export async function addBundleItem(data: Omit<import("../drizzle/schema").InsertBundleItem, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(bundleItems).values(data);
  return { id: result.insertId, ...data };
}

/** Remove an item from a bundle */
export async function removeBundleItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(bundleItems).where(eq(bundleItems.id, id));
  return { success: true };
}

// ─── Admin Consumable Helpers ───────────────────────────────────────

/** Update an existing consumable */
export async function updateConsumable(id: number, data: Partial<Omit<InsertConsumable, "id" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(consumables).set(data).where(eq(consumables.id, id));
  return { success: true };
}

/** Delete a consumable and its equipment links */
export async function deleteConsumable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(equipmentConsumables).where(eq(equipmentConsumables.consumableId, id));
  await db.delete(consumables).where(eq(consumables.id, id));
  return { success: true };
}

/** Unlink a consumable from an equipment item */
export async function unlinkConsumableFromEquipment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(equipmentConsumables).where(eq(equipmentConsumables.id, id));
  return { success: true };
}

/** List ALL consumables (including inactive) for admin */
export async function listAllConsumables() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consumables).orderBy(consumables.name);
}

/** List ALL bundles (including inactive) for admin */
export async function listAllBundles() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(equipmentBundles).orderBy(equipmentBundles.sortOrder, equipmentBundles.name);
}

/** Get consumable links for a specific consumable (admin view) */
export async function getConsumableLinks(consumableId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      linkId: equipmentConsumables.id,
      equipmentItemId: equipmentConsumables.equipmentItemId,
      note: equipmentConsumables.note,
      name: equipmentItems.name,
      brand: equipmentItems.brand,
    })
    .from(equipmentConsumables)
    .innerJoin(equipmentItems, eq(equipmentConsumables.equipmentItemId, equipmentItems.id))
    .where(eq(equipmentConsumables.consumableId, consumableId))
    .orderBy(equipmentItems.name);
}

// ─── Activity Log ───────────────────────────────────────────────────

import { activityLog } from "../drizzle/schema";
import type { InsertActivityLogEntry } from "../drizzle/schema";

/** Log an admin action */
export async function logActivity(entry: Omit<InsertActivityLogEntry, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(activityLog).values(entry);
  } catch (err) {
    console.warn("[Activity Log] Failed to log:", err);
  }
}

/** List recent activity log entries */
export async function listActivityLog(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Count total activity log entries */
export async function countActivityLog() {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(activityLog);
  return result?.count ?? 0;
}
// ─── Enquiry Leads ──────────────────────────────────────────────────────
// ─── Enquiry Leads ──────────────────────────────────────────────────────
/** Create a new enquiry lead */
export async function createEnquiryLead(data: Omit<InsertEnquiryLead, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(enquiryLeads).values(data);
  return result;
}

/** List all enquiry leads */
export async function listEnquiryLeads(limit = 200, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(enquiryLeads)
    .orderBy(desc(enquiryLeads.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Update enquiry lead status */
export async function updateEnquiryLeadStatus(id: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) return;
  const updates: any = { status };
  if (notes !== undefined) updates.notes = notes;
  await db.update(enquiryLeads).set(updates).where(eq(enquiryLeads.id, id));
}

/** Count enquiry leads by status */
export async function countEnquiryLeadsByStatus() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      status: enquiryLeads.status,
      count: sql<number>`count(*)`,
    })
    .from(enquiryLeads)
    .groupBy(enquiryLeads.status);
}


// ─── Rental Bookings ──────────────────────────────────────────────
export async function createRentalBooking(data: InsertRentalBooking) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rentalBookings).values(data);
  return { id: result[0].insertId };
}

export async function listRentalBookings(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(rentalBookings)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(rentalBookings.createdAt));
}

export async function getRentalBookingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rentalBookings).where(eq(rentalBookings.id, id)).limit(1);
  return result[0];
}

export async function listActiveRentals() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db
    .select()
    .from(rentalBookings)
    .where(and(
      eq(rentalBookings.status, 'active'),
      lte(rentalBookings.rentalStartDate, now),
      gte(rentalBookings.rentalEndDate, now)
    ))
    .orderBy(asc(rentalBookings.rentalEndDate));
}

export async function listUpcomingRentals(daysAhead = 7) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(rentalBookings)
    .where(and(
      eq(rentalBookings.status, 'pending'),
      gte(rentalBookings.rentalStartDate, now),
      lte(rentalBookings.rentalStartDate, future)
    ))
    .orderBy(asc(rentalBookings.rentalStartDate));
}

export async function updateRentalBooking(id: number, data: Partial<InsertRentalBooking>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(rentalBookings).set(data).where(eq(rentalBookings.id, id));
}

export async function deleteRentalBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(rentalBookings).where(eq(rentalBookings.id, id));
}

export async function countRentalBookings() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(rentalBookings);
  return result[0]?.count || 0;
}

// ─── Team / User Management ──────────────────────────────────────────────────

/** List all staff users (admin, manager, warehouse) */
export async function listStaffUsers() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(inArray(users.role, ['admin', 'manager', 'warehouse']))
    .orderBy(asc(users.createdAt));
}

/** List all users (for admin user management) */
export async function listAllUsers(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

/** Update a user's role */
export async function updateUserRole(userId: number, role: 'user' | 'admin' | 'manager' | 'warehouse') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  return { success: true };
}

/** Get user by ID */
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
}

/** Search users by name or email */
export async function searchUsers(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: users.id,
      openId: users.openId,
      name: users.name,
      email: users.email,
      role: users.role,
      loginMethod: users.loginMethod,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
    })
    .from(users)
    .where(
      or(
        like(users.name, `%${query}%`),
        like(users.email, `%${query}%`)
      )
    )
    .limit(limit);
}

// ─── Saved Carts (Job Kits) ──────────────────────────────────────────

export async function listSavedCarts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedCarts).where(eq(savedCarts.userId, userId)).orderBy(desc(savedCarts.updatedAt));
}

export async function getSavedCartById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(savedCarts).where(and(eq(savedCarts.id, id), eq(savedCarts.userId, userId))).limit(1);
  return result[0];
}

export async function createSavedCart(data: InsertSavedCart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(savedCarts).values(data);
  const insertId = (result[0] as any).insertId;
  const [row] = await db.select().from(savedCarts).where(eq(savedCarts.id, insertId));
  return row;
}

export async function updateSavedCart(id: number, userId: number, data: { name?: string; items?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(savedCarts).set(data).where(and(eq(savedCarts.id, id), eq(savedCarts.userId, userId)));
}

export async function deleteSavedCart(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(savedCarts).where(and(eq(savedCarts.id, id), eq(savedCarts.userId, userId)));
}

// ─── Referral Programme ──────────────────────────────────────────────

export async function getReferralCodeByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getReferralCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referralCodes).where(eq(referralCodes.code, code)).limit(1);
  return result[0] ?? null;
}

export async function createReferralCode(userId: number, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(referralCodes).values({ userId, code, totalReferrals: 0, totalCreditsEarned: '0' });
  return { code };
}
export async function recordReferralEvent(referrerId: number, referralCodeId: number, referredUserId: number, creditAwarded: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(referralEvents).values({ referrerId, referralCodeId, referredUserId, creditAwarded, status: 'pending' });
  // Increment totalReferrals and totalCreditsEarned on the referral code
  await db.update(referralCodes)
    .set({
      totalReferrals: sql`${referralCodes.totalReferrals} + 1`,
      totalCreditsEarned: sql`${referralCodes.totalCreditsEarned} + ${creditAwarded}`,
    })
    .where(eq(referralCodes.id, referralCodeId));
  // Add to referral credits balance
  const existing = await db.select().from(referralCredits).where(eq(referralCredits.userId, referrerId)).limit(1);
  if (existing.length > 0) {
    await db.update(referralCredits)
      .set({
        balance: sql`${referralCredits.balance} + ${creditAwarded}`,
        lifetimeEarned: sql`${referralCredits.lifetimeEarned} + ${creditAwarded}`,
      })
      .where(eq(referralCredits.userId, referrerId));
  } else {
    await db.insert(referralCredits).values({ userId: referrerId, balance: creditAwarded, lifetimeEarned: creditAwarded, lifetimeRedeemed: '0' });
  }
}
export async function listReferralEvents(referrerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(referralEvents).where(eq(referralEvents.referrerId, referrerId)).orderBy(desc(referralEvents.createdAt));
}
export async function getReferralCredits(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(referralCredits).where(eq(referralCredits.userId, userId)).limit(1);
  return result[0] ?? null;
}


// ─── Warehouse Return Logs ─────────────────────────────────────────────────────

/**
 * Get active/upcoming orders visible to warehouse staff.
 * Returns Pending, Confirmed, and Active orders with their items.
 */
export async function getWarehouseOrders() {
  const db = await getDb();
  if (!db) return [];
  const { rentalOrders, rentalOrderItems } = await import("../drizzle/schema");
  const orders = await db
    .select()
    .from(rentalOrders)
    .where(
      and(
        // Show pending, confirmed, and active orders
        sql`${rentalOrders.status} IN ('pending', 'confirmed', 'active')`
      )
    )
    .orderBy(asc(rentalOrders.rentalStartDate));
  // Fetch items for each order
  const orderIds = orders.map(o => o.id);
  if (orderIds.length === 0) return [];
  const items = await db
    .select({
      orderId: rentalOrderItems.orderId,
      equipmentName: rentalOrderItems.equipmentName,
      rentalDays: rentalOrderItems.rentalDays,
      lineTotal: rentalOrderItems.lineTotal,
    })
    .from(rentalOrderItems)
    .where(inArray(rentalOrderItems.orderId, orderIds));
  return orders.map(order => ({
    ...order,
    items: items.filter(i => i.orderId === order.id),
  }));
}

/**
 * Get a single order with full details for warehouse staff (read-only).
 */
export async function getWarehouseOrderDetail(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const { rentalOrders, rentalOrderItems } = await import("../drizzle/schema");
  const orders = await db.select().from(rentalOrders).where(eq(rentalOrders.id, orderId)).limit(1);
  if (!orders[0]) return null;
  const items = await db.select().from(rentalOrderItems).where(eq(rentalOrderItems.orderId, orderId));
  const returnLog = await db.select().from(equipmentReturnLogs).where(eq(equipmentReturnLogs.orderId, orderId)).limit(1);
  const charges = returnLog[0]
    ? await db.select().from(returnCharges).where(eq(returnCharges.returnLogId, returnLog[0].id)).orderBy(asc(returnCharges.createdAt))
    : [];
  return {
    ...orders[0],
    items,
    returnLog: returnLog[0] ?? null,
    charges,
  };
}

/**
 * Create a return log with charges and mark the order as Completed.
 * Returns the created return log with its charges.
 */
export async function createReturnLog(data: {
  orderId: number;
  condition: "excellent" | "good" | "fair" | "damaged" | "missing_items";
  overallNotes?: string;
  completedByUserId: number;
  charges: Array<{
    chargeType: "damage" | "repair" | "cleaning" | "missing_item" | "other";
    description: string;
    amount: string;
    photoUrl?: string;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { rentalOrders } = await import("../drizzle/schema");

  // Calculate total charges
  const totalCharges = data.charges
    .reduce((sum, c) => sum + parseFloat(c.amount), 0)
    .toFixed(2);

  // Insert return log
  const [logResult] = await db.insert(equipmentReturnLogs).values({
    orderId: data.orderId,
    condition: data.condition,
    overallNotes: data.overallNotes ?? null,
    completedByUserId: data.completedByUserId,
    totalCharges,
    chargeSentToCustomer: false,
  });
  const returnLogId = (logResult as any).insertId as number;

  // Insert charge line items
  if (data.charges.length > 0) {
    await db.insert(returnCharges).values(
      data.charges.map(c => ({
        returnLogId,
        chargeType: c.chargeType,
        description: c.description,
        amount: c.amount,
        photoUrl: c.photoUrl ?? null,
      }))
    );
  }

  // Mark order as Completed
  await db.update(rentalOrders).set({ status: "completed" }).where(eq(rentalOrders.id, data.orderId));

  return { returnLogId, totalCharges };
}

/**
 * Get return log + charges for an order (used by admin and warehouse).
 */
export async function getReturnLogByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return null;
  const logs = await db.select().from(equipmentReturnLogs).where(eq(equipmentReturnLogs.orderId, orderId)).limit(1);
  if (!logs[0]) return null;
  const charges = await db.select().from(returnCharges).where(eq(returnCharges.returnLogId, logs[0].id)).orderBy(asc(returnCharges.createdAt));
  return { ...logs[0], charges };
}

/**
 * Mark charge email as sent to customer.
 */
export async function markChargeSentToCustomer(returnLogId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(equipmentReturnLogs).set({ chargeSentToCustomer: true }).where(eq(equipmentReturnLogs.id, returnLogId));
}

/// ─── Staff Permissions ─────────────────────────────────────────────────────
/** Get custom permissions for a staff user (returns null if none set = use role defaults) */
export async function getStaffPermissions(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(staffPermissions).where(eq(staffPermissions.userId, userId)).limit(1);
  return row ?? null;
}

/** Set (upsert) custom permissions for a staff user */
export async function upsertStaffPermissions(userId: number, permissions: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const permJson = JSON.stringify(permissions);
  const existing = await getStaffPermissions(userId);
  if (existing) {
    await db.update(staffPermissions).set({ permissions: permJson }).where(eq(staffPermissions.userId, userId));
  } else {
    await db.insert(staffPermissions).values({ userId, permissions: permJson });
  }
}

/** Get permissions for multiple users at once */
export async function getStaffPermissionsBulk(userIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (userIds.length === 0) return [];
  return db.select().from(staffPermissions).where(inArray(staffPermissions.userId, userIds));
}

// ─── Lead Replies ─────────────────────────────────────────────────────────

/** Create a new lead reply record */
export async function createLeadReply(data: Omit<InsertLeadReply, 'id' | 'sentAt'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(leadReplies).values(data);
  return result;
}

/** List all replies for a lead */
export async function getLeadReplies(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadReplies).where(eq(leadReplies.leadId, leadId)).orderBy(asc(leadReplies.sentAt));
}

/** Delete an enquiry lead */
export async function deleteEnquiryLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(leadReplies).where(eq(leadReplies.leadId, id));
  await db.delete(enquiryLeadsTable).where(eq(enquiryLeadsTable.id, id));
}
