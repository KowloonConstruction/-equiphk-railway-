import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure, managerProcedure, warehouseProcedure, staffProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "./_core/notification";
import { z } from "zod";
import {
  listStaffUsers,
  listAllUsers,
  updateUserRole,
  getUserById,
  searchUsers,
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  listSubCategories,
  listCategoriesWithSubCategories,
  listAllSubCategories,
  listAllCategoriesWithSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  reorderSubCategories,
  listEquipmentItems,
  getDistinctBrands,
  getEquipmentItemById,
  createEquipmentItem,
  updateEquipmentItem,
  deleteEquipmentItem,
  bulkDeleteEquipmentItems,
  bulkUpdateEquipmentCategory,
  bulkUpdateEquipmentStatus,
  searchEquipmentItems,
  getInventoryStats,
  createContactSubmission,
  listContactSubmissions,
  listPendingImageApprovals,
  listRejectedImageApprovals,
  approveItemImage,
  rejectItemImage,
  countPendingImageApprovals,
  markSubmissionRead,
  deleteContactSubmission,
  getUnreadSubmissionCount,
  createAnnouncement,
  listAnnouncements,
  getActiveAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  createSiteNotification,
  listSiteNotifications,
  getActiveSiteNotifications,
  updateSiteNotification,
  deleteSiteNotification,
  getManualsByItem,
  createManual,
  deleteManual,
  createSupportTicket,
  listSupportTickets,
  updateSupportTicketStatus,
  addFavourite,
  removeFavourite,
  listFavourites,
  getFavouriteIds,
  isFavourite,
  getConsumablesForEquipment,
  listConsumables,
  getConsumableById,
  getEquipmentForConsumable,
  listBundles,
  getBundleById,
  getFeaturedBundles,
  createBundle,
  updateBundle,
  deleteBundle,
  addBundleItem,
  removeBundleItem,
  updateConsumable,
  deleteConsumable,
  unlinkConsumableFromEquipment,
  listAllConsumables,
  listAllBundles,
  getConsumableLinks,
  createConsumable,
  linkConsumableToEquipment,
  logActivity,
  listActivityLog,
  countActivityLog,
  createEnquiryLead,
  listEnquiryLeads,
  updateEnquiryLeadStatus,
  countEnquiryLeadsByStatus,
  createRentalBooking,
  listRentalBookings,
  getRentalBookingById,
  listActiveRentals,
  listUpcomingRentals,
  updateRentalBooking,
  deleteRentalBooking,
  listSavedCarts,
  createSavedCart,
  updateSavedCart,
  deleteSavedCart,
  getReferralCodeByUserId,
  getReferralCodeByCode,
  createReferralCode,
  recordReferralEvent,
  listReferralEvents,
  getReferralCredits,
  getStaffPermissions,
  upsertStaffPermissions,
  getStaffPermissionsBulk,
  createLeadReply,
  getLeadReplies,
  deleteEnquiryLead,
} from "./db";
import {
  emitNewEquipment,
  emitNewAnnouncement,
  emitNewNotification,
  emitNewPromotion,
} from "./sse";
import { parseExcelBuffer, bulkImportEquipmentWithImages } from "./bulk-import";
import { membershipRouter } from "./routers/membership";
import { fuelRouter } from "./routers/fuel";
import { warehouseRouter } from "./routers/warehouse";
import { regenerateAllDescriptions } from "./regenerate-descriptions";
import { scheduleTranslation } from "./translation";

export const appRouter = router({
  system: systemRouter,
  membership: membershipRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Equipment Categories ──────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      return listCategories();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getCategoryById(input.id);
      }),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          description: z.string().optional(),
          icon: z.string().optional(),
          segment: z.enum(["b2c", "b2b", "both"]).default("both"),
          sortOrder: z.number().default(0),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        return createCategory(input);
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          description: z.string().optional(),
          icon: z.string().optional(),
          segment: z.enum(["b2c", "b2b", "both"]).optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCategory(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      }),
  }),
  // ─── Sub-Categories ─────────────────────────────────────────────────
  subCategories: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return listSubCategories(input?.categoryId);
      }),

    listWithCategories: publicProcedure.query(async () => {
      return listCategoriesWithSubCategories();
    }),

    // ─── Admin procedures ───────────────────────────────────────────
    adminListAll: adminProcedure
      .input(z.object({ categoryId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return listAllSubCategories(input?.categoryId);
      }),

    adminListWithCategories: adminProcedure.query(async () => {
      return listAllCategoriesWithSubCategories();
    }),

    create: adminProcedure
      .input(
        z.object({
          categoryId: z.number(),
          name: z.string().min(1).max(255),
          slug: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          sortOrder: z.number().default(0),
        })
      )
      .mutation(async ({ input }) => {
        // Auto-generate slug from name if not provided
        const slug = input.slug ??
          input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return createSubCategory({
          categoryId: input.categoryId,
          name: input.name,
          slug,
          description: input.description ?? null,
          sortOrder: input.sortOrder,
          isActive: true,
        });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          slug: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          sortOrder: z.number().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateSubCategory(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSubCategory(input.id);
        return { success: true };
      }),

    reorder: adminProcedure
      .input(
        z.array(
          z.object({
            id: z.number(),
            sortOrder: z.number(),
          })
        )
      )
      .mutation(async ({ input }) => {
        return reorderSubCategories(input);
      }),
  }),

  // ─── Equipment Items ─────────────────────────────────────────────────
  equipment: router({
    list: publicProcedure
      .input(
        z
          .object({
            categoryId: z.number().optional(),
            subCategoryId: z.number().optional(),
            availability: z.string().optional(),
            search: z.string().optional(),
            activeOnly: z.boolean().optional(),
            brand: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return listEquipmentItems(input ?? undefined);
      }),

    brands: publicProcedure.query(async () => {
      return getDistinctBrands();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getEquipmentItemById(input.id);
      }),

    search: publicProcedure
      .input(z.object({ query: z.string().min(1), limit: z.number().default(8) }))
      .query(async ({ input }) => {
        return searchEquipmentItems(input.query, input.limit);
      }),

    create: adminProcedure
      .input(
        z.object({
          categoryId: z.number(),
          name: z.string().min(1),
          description: z.string().optional(),
          brand: z.string().optional(),
          model: z.string().optional(),
          dailyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
          weeklyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
          monthlyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
          pricingType: z.enum(["fixed", "negotiated"]).default("fixed"),
          imageUrl: z.string().optional(),
          specs: z.string().optional(),
          condition: z.enum(["new", "excellent", "good", "fair"]).default("good"),
          availability: z.enum(["available", "rented", "maintenance", "retired"]).default("available"),
          quantity: z.number().default(1),
          availableQty: z.number().default(1),
          location: z.string().optional(),
          isActive: z.boolean().default(true),
          isFeatured: z.boolean().default(false),
          isReviewed: z.boolean().default(false),
          includes: z.string().optional(),
          fuelType: z.enum(["none", "petrol", "diesel"]).default("none"),
        })
      )
      .mutation(async ({ input }) => {
        // Auto-set includes note for battery-powered tools (if not already provided)
        const autoIncludes = (() => {
          if (input.includes) return input.includes; // respect manually set value
          const nameStr = (input.name || '').toLowerCase();
          const modelStr = (input.model || '').toLowerCase();
          const combined = nameStr + ' ' + modelStr;
          // Skip accessories
          if (nameStr.includes('battery') || nameStr.includes('charger')) return undefined;
          // Skip mains-powered (240V, 380V)
          if (/240[Vv]|380[Vv]/.test(combined)) return undefined;
          // 36V or 80V → 2 batteries
          if (/36[Vv]|80[Vv]/.test(combined)) return '2x Batteries, 1x Charger';
          // 18V specific label
          if (/18[Vv]/.test(combined)) return '1x 18V Battery, 1x Charger';
          // Other voltages (12V, 14V, 20V, 40V, 54V, 56V)
          if (/12[Vv]|14[Vv]|20[Vv]|40[Vv]|54[Vv]|56[Vv]/.test(combined)) return '1x Battery, 1x Charger';
          // Generic cordless
          if (nameStr.includes('cordless')) return '1x Battery, 1x Charger';
          return undefined;
        })();
        const inputWithIncludes = { ...input, includes: autoIncludes };
        const result = await createEquipmentItem(inputWithIncludes);

        // Broadcast real-time SSE event to all connected visitors
        if (input.isActive !== false) {
          emitNewEquipment(input.name, input.brand, input.dailyRate);
        }

        // Auto-source product photo if no imageUrl was provided
        if (!input.imageUrl && result.id) {
          const brand = input.brand || "";
          const model = input.model || "";
          const itemName = input.name || "";
          if (brand || model || itemName) {
            // Fire-and-forget: don't await so create returns fast
            (async () => {
              try {
                const { fetchProductImageFromWeb } = await import("./productImageScraper");
                const result2 = await fetchProductImageFromWeb(brand, model, itemName);
                if (result2) {
                  await updateEquipmentItem(result.id, { pendingImageUrl: result2.cdnUrl, pendingImageSourceUrl: result2.sourceUrl, imageApprovalStatus: "pending" } as any);
                  console.log(`[Auto Photo] Queued pending image for approval: ${itemName} (source: ${result2.sourceUrl})`);
                } else {
                  console.warn(`[Auto Photo] No image found for: ${itemName}`);
                }
              } catch (err) {
                console.warn(`[Auto Photo] Failed for new item "${itemName}":`, err);
              }
            })();
          }
        }

        // Auto-translate name and description to Traditional Chinese (zh-HK) in background
        if (result.id && input.name) {
          scheduleTranslation(
            input.name,
            input.description || "",
            async (zh) => {
              await updateEquipmentItem(result.id, { nameZh: zh.nameZh, descriptionZh: zh.descriptionZh } as any);
              console.log(`[Translation] zh-HK saved for equipment item ${result.id}: ${zh.nameZh}`);
            }
          );
        }

        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          categoryId: z.number().optional(),
          subCategoryId: z.number().nullable().optional(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          brand: z.string().optional(),
          model: z.string().optional(),
          dailyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
          weeklyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
          monthlyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
          pricingType: z.enum(["fixed", "negotiated"]).optional(),
          imageUrl: z.string().optional(),
          specs: z.string().optional(),
          condition: z.enum(["new", "excellent", "good", "fair"]).optional(),
          availability: z.enum(["available", "rented", "maintenance", "retired"]).optional(),
          quantity: z.number().optional(),
          availableQty: z.number().optional(),
          location: z.string().optional(),
          isActive: z.boolean().optional(),
          isFeatured: z.boolean().optional(),
          isReviewed: z.boolean().optional(),
          includes: z.string().optional(),
          fuelType: z.enum(["none", "petrol", "diesel"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Auto-set includes note for battery-powered tools when name or model is being updated
        if ((data.name !== undefined || data.model !== undefined) && !data.includes) {
          const nameStr = (data.name || '').toLowerCase();
          const modelStr = (data.model || '').toLowerCase();
          const combined = nameStr + ' ' + modelStr;
          if (!nameStr.includes('battery') && !nameStr.includes('charger') && !/240[Vv]|380[Vv]/.test(combined)) {
            if (/36[Vv]|80[Vv]/.test(combined)) {
              data.includes = '2x Batteries, 1x Charger';
            } else if (/18[Vv]/.test(combined)) {
              data.includes = '1x 18V Battery, 1x Charger';
            } else if (/12[Vv]|14[Vv]|20[Vv]|40[Vv]|54[Vv]|56[Vv]/.test(combined)) {
              data.includes = '1x Battery, 1x Charger';
            } else if (nameStr.includes('cordless')) {
              data.includes = '1x Battery, 1x Charger';
            }
          }
        }
        await updateEquipmentItem(id, data);

        // Re-translate if name or description changed
        if (data.name || data.description) {
          // Fetch current item to get the latest name/description for translation
          const currentItem = await getEquipmentItemById(id);
          if (currentItem) {
            scheduleTranslation(
              currentItem.name || "",
              currentItem.description || "",
              async (zh) => {
                await updateEquipmentItem(id, { nameZh: zh.nameZh, descriptionZh: zh.descriptionZh } as any);
                console.log(`[Translation] zh-HK updated for equipment item ${id}: ${zh.nameZh}`);
              }
            );
          }
        }

        return { success: true };
      }),

    toggleReviewed: adminProcedure
      .input(z.object({ id: z.number(), isReviewed: z.boolean() }))
      .mutation(async ({ input }) => {
        await updateEquipmentItem(input.id, { isReviewed: input.isReviewed });
        return { success: true, isReviewed: input.isReviewed };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteEquipmentItem(input.id);
        return { success: true };
      }),

    bulkDelete: adminProcedure
      .input(z.object({ ids: z.array(z.number()).min(1).max(500) }))
      .mutation(async ({ input }) => {
        const result = await bulkDeleteEquipmentItems(input.ids);
        return result;
      }),

    bulkUpdateCategory: adminProcedure
      .input(
        z.object({
          ids: z.array(z.number()).min(1).max(500),
          categoryId: z.number(),
          subCategoryId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await bulkUpdateEquipmentCategory(
          input.ids,
          input.categoryId,
          input.subCategoryId ?? null
        );
        return result;
      }),

    bulkUpdateStatus: adminProcedure
      .input(
        z.object({
          ids: z.array(z.number()).min(1).max(500),
          availability: z.enum(["available", "rented", "maintenance", "retired"]),
        })
      )
      .mutation(async ({ input }) => {
        const result = await bulkUpdateEquipmentStatus(input.ids, input.availability);
        return result;
      }),

    stats: publicProcedure.query(async () => {
      return getInventoryStats();
    }),

    sourceImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { fetchProductImageFromWeb } = await import("./productImageScraper");
        const item = await getEquipmentItemById(input.id);
        if (!item) throw new Error("Item not found");

        const brand = item.brand || "";
        const model = (item as any).modelNumber || item.model || "";
        const itemName = item.name || "";

         const imgResult = await fetchProductImageFromWeb(brand, model, itemName);
        if (!imgResult) throw new Error("No manufacturer image found for this item");
        await updateEquipmentItem(input.id, { pendingImageUrl: imgResult.cdnUrl, pendingImageSourceUrl: imgResult.sourceUrl, imageApprovalStatus: "pending" } as any);
        return { pendingImageUrl: imgResult.cdnUrl, status: "pending" };
      }),

    autoFillInfo: adminProcedure
      .input(
        z.object({
          brand: z.string().min(1),
          model: z.string().min(1),
          itemName: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        const prompt = `You are an expert equipment researcher for a Hong Kong construction and tool rental company.

Research the following equipment and return detailed, accurate information:
- Brand: ${input.brand}
- Model: ${input.model}
${input.itemName ? `- Item name: ${input.itemName}` : ""}

Provide a comprehensive product profile including:
1. A unique, professional product description (2-3 sentences, highlight key features and use cases for construction/rental context)
2. Key technical specifications (power, dimensions, weight, capacity, etc.)
3. Recommended rental pricing in HKD for the Hong Kong market (daily, weekly, monthly rates)

For rental pricing, base your recommendations on:
- Hong Kong construction equipment rental market rates
- Equipment category and size/power class
- Competitive pricing that is fair for both renter and customer

Return ONLY valid JSON in this exact format:
{
  "description": "Professional description here",
  "specifications": "Key specs formatted as: Power: X | Weight: X | Dimensions: X | etc.",
  "suggestedDailyRate": 150,
  "suggestedWeeklyRate": 750,
  "suggestedMonthlyRate": 2500,
  "categoryHint": "power-tools",
  "keyFeatures": ["feature 1", "feature 2", "feature 3"]
}

For categoryHint use one of: power-tools, heavy-plant, aerial-platforms, generators, scaffolding, safety-equipment, compressors, welding-equipment, concrete-equipment, lifting-equipment, surveying-equipment, marine-diving, general-tools

All rates should be in HKD as integers rounded to the nearest $10 (e.g. 150, 200, 350, 500, 1200). Be realistic and market-appropriate for Hong Kong.`;

        try {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are an equipment research assistant. Always respond with valid JSON only, no markdown fences." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "equipment_info",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    specifications: { type: "string" },
                    suggestedDailyRate: { type: "number" },
                    suggestedWeeklyRate: { type: "number" },
                    suggestedMonthlyRate: { type: "number" },
                    categoryHint: { type: "string" },
                    keyFeatures: { type: "array", items: { type: "string" } },
                  },
                  required: ["description", "specifications", "suggestedDailyRate", "suggestedWeeklyRate", "suggestedMonthlyRate", "categoryHint", "keyFeatures"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content) throw new Error("No response from AI");

          const data = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
          return { success: true, data };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          console.error("[autoFillInfo] Error:", err);
          return { success: false, error: msg, data: null };
        }
      }),

    bulkImport: adminProcedure
      .input(
        z.object({
          excelBase64: z.string(),
          categoryId: z.number().default(1),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const buffer = Buffer.from(input.excelBase64, "base64");
          const items = parseExcelBuffer(buffer);
          console.log(`[Bulk Import] Parsed ${items.length} unique equipment items`);
          const result = await bulkImportEquipmentWithImages(items, input.categoryId);
          console.log(`[Bulk Import] Complete: ${result.imported} imported, ${result.failed} failed`);
          return {
            success: true,
            imported: result.imported,
            failed: result.failed,
            errors: result.errors,
            message: `Successfully imported ${result.imported} items.`,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          console.error("[Bulk Import] Error:", error);
          return {
            success: false,
            imported: 0,
            failed: 0,
            errors: [errorMsg],
            message: `Import failed: ${errorMsg}`,
          };
        }
      }),
  }),

  // ─── Contact Submissions ──────────────────────────────────────────
  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          phone: z.string().optional(),
          company: z.string().optional(),
          subject: z.string().min(1),
          message: z.string().min(1),
          formType: z.enum(["contact", "quote", "enterprise"]).default("contact"),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createContactSubmission(input);

        // Notify admin (Casey) about new submission
        try {
          await notifyOwner({
            title: `New ${input.formType} form: ${input.subject}`,
            content: `From: ${input.name} (${input.email})\nCompany: ${input.company || "N/A"}\nPhone: ${input.phone || "N/A"}\n\n${input.message}`,
          });
        } catch (err) {
          console.warn("[Notification] Failed to notify owner:", err);
        }

        return { success: true, id: result.id };
      }),

    list: adminProcedure.query(async () => {
      return listContactSubmissions();
    }),

    unreadCount: adminProcedure.query(async () => {
      return getUnreadSubmissionCount();
    }),

    markRead: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markSubmissionRead(input.id);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContactSubmission(input.id);
        return { success: true };
      }),
  }),

  // ─── Announcements (site-wide banner) ─────────────────────────────
  announcements: router({
    active: publicProcedure.query(async () => {
      return getActiveAnnouncements();
    }),

    list: adminProcedure.query(async () => {
      return listAnnouncements();
    }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          message: z.string().min(1),
          type: z.enum(["info", "warning", "success", "promo"]).default("info"),
          linkText: z.string().optional(),
          linkUrl: z.string().optional(),
          isActive: z.boolean().default(true),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createAnnouncement(input);

        // Broadcast real-time SSE event
        if (input.isActive !== false) {
          if (input.type === "promo") {
            emitNewPromotion(input.title, input.message, input.type);
          } else {
            emitNewAnnouncement(input.title, input.message, input.type);
          }
        }

        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          message: z.string().min(1).optional(),
          type: z.enum(["info", "warning", "success", "promo"]).optional(),
          linkText: z.string().optional(),
          linkUrl: z.string().optional(),
          isActive: z.boolean().optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateAnnouncement(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAnnouncement(input.id);
        return { success: true };
      }),
  }),

  // ─── Site Notifications (visitor bell) ────────────────────────────
  notifications: router({
    active: publicProcedure.query(async () => {
      return getActiveSiteNotifications();
    }),

    list: adminProcedure.query(async () => {
      return listSiteNotifications();
    }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1),
          message: z.string().min(1),
          type: z.enum(["new_equipment", "deal", "update", "announcement"]).default("update"),
          linkUrl: z.string().optional(),
          isActive: z.boolean().default(true),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createSiteNotification(input);

        // Broadcast real-time SSE event
        if (input.isActive !== false) {
          emitNewNotification(input.title, input.message, input.type);
        }

        return result;
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).optional(),
          message: z.string().min(1).optional(),
          type: z.enum(["new_equipment", "deal", "update", "announcement"]).optional(),
          linkUrl: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateSiteNotification(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteSiteNotification(input.id);
        return { success: true };
      }),
  }),

  manuals: router({
    getByItem: publicProcedure
      .input(z.object({ equipmentItemId: z.number() }))
      .query(async ({ input }) => {
        return getManualsByItem(input.equipmentItemId);
      }),

    upload: adminProcedure
      .input(
        z.object({
          equipmentItemId: z.number(),
          fileName: z.string().min(1),
          fileBase64: z.string().min(1),
          fileSize: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import("./storage");
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `manuals/${input.equipmentItemId}/${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, "application/pdf");
        const manual = await createManual({
          equipmentItemId: input.equipmentItemId,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: key,
          fileSize: input.fileSize,
        });
        return { id: manual.id, url, fileName: input.fileName };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const manual = await deleteManual(input.id);
        return { success: true, fileKey: manual.fileKey };
      }),

    autoSource: adminProcedure
      .input(
        z.object({
          equipmentItemId: z.number(),
          brand: z.string(),
          model: z.string(),
          itemName: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { storagePut } = await import("./storage");

        // Step 1: Ask AI to find the official PDF manual URL
        const searchResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a technical documentation researcher. Your task is to find the official operation/user manual PDF URL for a specific piece of equipment. 

Search your knowledge for the official manufacturer PDF manual URL for this item. Return ONLY a JSON object with no other text.

If you know a direct PDF URL from the manufacturer's website, return: {"found": true, "url": "https://...", "fileName": "brand-model-manual.pdf"}
If you don't know a direct PDF URL, return: {"found": false, "reason": "brief explanation"}

IMPORTANT: Only return URLs you are highly confident are real manufacturer PDF links. Do not guess or fabricate URLs.`,
            },
            {
              role: "user",
              content: `Find the official operation manual PDF for: ${input.brand} ${input.model} (${input.itemName})`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "manual_search_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  found: { type: "boolean" },
                  url: { type: "string" },
                  fileName: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["found"],
                additionalProperties: false,
              },
            },
          },
        });

        let aiResult: { found: boolean; url?: string; fileName?: string; reason?: string };
        try {
          const raw = searchResult.choices[0]?.message?.content ?? "{}";
          aiResult = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
          return { success: false, reason: "AI response could not be parsed" };
        }

        if (!aiResult.found || !aiResult.url) {
          return { success: false, reason: aiResult.reason ?? "No manual found in AI knowledge base" };
        }

        // Step 2: Download the PDF
        let pdfBuffer: Buffer;
        try {
          const response = await fetch(aiResult.url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; EquipHK-ManualBot/1.0)" },
            signal: AbortSignal.timeout(15000),
          });
          if (!response.ok) {
            return { success: false, reason: `PDF download failed: HTTP ${response.status}` };
          }
          const contentType = response.headers.get("content-type") ?? "";
          if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
            return { success: false, reason: `URL does not point to a PDF (content-type: ${contentType})` };
          }
          pdfBuffer = Buffer.from(await response.arrayBuffer());
        } catch (err: any) {
          return { success: false, reason: `Could not download PDF: ${err.message}` };
        }

        // Step 3: Upload to S3
        const fileName = aiResult.fileName ?? `${input.brand}-${input.model}-manual.pdf`.replace(/\s+/g, "-").toLowerCase();
        const key = `manuals/${input.equipmentItemId}/${Date.now()}-${fileName}`;
        const { url: s3Url } = await storagePut(key, pdfBuffer, "application/pdf");

        // Step 4: Save to DB
        const manual = await createManual({
          equipmentItemId: input.equipmentItemId,
          fileName,
          fileUrl: s3Url,
          fileKey: key,
          fileSize: pdfBuffer.length,
        });

        return {
          success: true,
          manualId: manual.id,
          fileName,
          url: s3Url,
          sourceUrl: aiResult.url,
        };
      }),
  }),

  support: router({
    triageChat: publicProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["user", "assistant", "system"]),
              content: z.string(),
            })
          ),
          equipmentItemId: z.number().optional(),
          manualUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");

        const now = new Date();
        const hour = now.getHours();
        const isOutOfHours = hour < 7 || hour >= 22;

        const systemPrompt = `You are the EquipHK 24/7 AI Support Assistant — a friendly, professional triage agent for a Hong Kong equipment rental company.

Your job is to help customers through a structured triage flow:
1. Identify issue type: equipment breakdown, delivery issue, billing question, or rental enquiry
2. Gather key details relevant to their issue
3. For BREAKDOWNS: Ask 2-3 diagnostic questions, then walk them through the troubleshooting steps from the equipment manual (if available). Reference specific steps clearly in plain language.
4. For RENTAL ENQUIRIES: Answer questions about availability, pricing, and delivery
5. If you cannot resolve the issue after troubleshooting, collect the customer's name and phone number, then tell them you are escalating to the EquipHK team via WhatsApp and they will be contacted shortly.

${isOutOfHours ? "IMPORTANT: It is currently outside office hours (7am-10pm HKT). If escalation is needed, inform the customer that the team will follow up first thing in the morning." : ""}

Tone: Friendly, clear, and professional. Use plain English — no jargon. Keep responses concise.

EquipHK context: We rent power tools, heavy plant, aerial platforms, generators, scaffolding, safety equipment, compressors, welding equipment, and more across Hong Kong.

When you determine escalation is needed (customer requests human, issue unresolved after troubleshooting, or customer provides their name and phone), respond with a JSON block at the END of your message in this exact format:
<ESCALATE>{"name": "customer name", "phone": "customer phone", "issue": "brief issue summary", "equipment": "equipment name if known"}</ESCALATE>`;

        const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string | Array<{ type: "file_url"; file_url: { url: string; mime_type: "application/pdf" } }> }> = [
          { role: "system", content: systemPrompt },
          ...(input.manualUrl
            ? [{
                role: "system" as const,
                content: [{ type: "file_url" as const, file_url: { url: input.manualUrl, mime_type: "application/pdf" as const } }],
              }]
            : []),
          ...input.messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        const result = await invokeLLM({ messages: llmMessages, max_tokens: 1024 });
        const content = result.choices[0]?.message?.content ?? "";
        const text = typeof content === "string" ? content : JSON.stringify(content);

        const escalateMatch = text.match(/<ESCALATE>([\s\S]*?)<[/]ESCALATE>/);
        let escalationData: { name?: string; phone?: string; issue?: string; equipment?: string } | null = null;
        const cleanText = text.replace(/<ESCALATE>[\s\S]*?<[/]ESCALATE>/g, "").trim();

        if (escalateMatch) {
          try { escalationData = JSON.parse(escalateMatch[1]); } catch { /* ignore */ }
        }

        return { text: cleanText, escalation: escalationData };
      }),

    escalate: publicProcedure
      .input(
        z.object({
          customerName: z.string().optional(),
          customerPhone: z.string().optional(),
          issueType: z.string().optional(),
          equipmentName: z.string().optional(),
          summary: z.string(),
          conversationLog: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const ticket = await createSupportTicket({
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          issueType: input.issueType,
          equipmentName: input.equipmentName,
          summary: input.summary,
          conversationLog: input.conversationLog,
          whatsappSent: false,
        });

        const waMessage = encodeURIComponent(
          `🔧 EquipHK Support Escalation\n\nCustomer: ${input.customerName || "Unknown"}\nPhone: ${input.customerPhone || "Not provided"}\nEquipment: ${input.equipmentName || "Not specified"}\nIssue: ${input.summary}\n\nTicket #${ticket.id} — Reply to follow up.`
        );

        await notifyOwner({
          title: `Support Escalation: ${input.equipmentName || "Equipment Issue"}`,
          content: `Customer: ${input.customerName || "Unknown"} (${input.customerPhone || "no phone"})\nIssue: ${input.summary}`,
        });

        return {
          ticketId: ticket.id,
          whatsappUrl: `https://wa.me/85298325789?text=${waMessage}`,
          success: true,
        };
      }),

    listTickets: adminProcedure.query(async () => {
      return listSupportTickets();
    }),

    updateTicketStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["open", "in_progress", "resolved"]) }))
      .mutation(async ({ input }) => {
        await updateSupportTicketStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  admin: router({
    regenerateDescriptions: adminProcedure.mutation(async () => {
      return await regenerateAllDescriptions();
    }),

    bulkAutoFillInfo: adminProcedure
      .input(
        z.object({
          overwrite: z.boolean().default(false),
          fields: z.object({
            description: z.boolean().default(true),
            specs: z.boolean().default(true),
            dailyRate: z.boolean().default(true),
            weeklyRate: z.boolean().default(true),
            monthlyRate: z.boolean().default(true),
          }).default({ description: true, specs: true, dailyRate: true, weeklyRate: true, monthlyRate: true }),
          // Batching: process a slice of the full list per request to avoid gateway timeouts
          offset: z.number().int().min(0).default(0),
          batchSize: z.number().int().min(1).max(15).default(10),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const { fields } = input;
        const items = await listEquipmentItems({ activeOnly: true });
        // Filter to items that need filling for at least one selected field (unless overwrite)
        const allToFill = input.overwrite
          ? items
          : items.filter((item) => {
              if (fields.description && (!item.description || item.description.trim() === "")) return true;
              if (fields.specs && (!item.specs || item.specs.trim() === "")) return true;
              if (fields.dailyRate && !item.dailyRate) return true;
              if (fields.weeklyRate && !item.weeklyRate) return true;
              if (fields.monthlyRate && !item.monthlyRate) return true;
              return false;
            });
        // Slice to just this batch
        const totalToFill = allToFill.length;
        const toFill = allToFill.slice(input.offset, input.offset + input.batchSize);
        let succeeded = 0;
        let failed = 0;
        let skipped = 0;
        const errors: string[] = [];
        const results: Array<{ id: number; name: string; status: "ok" | "skip" | "error"; error?: string }> = [];
        for (const item of toFill) {
          const brand = item.brand || "";
          const model = item.model || "";
          const itemName = item.name || "";
          if (!brand && !model) {
            results.push({ id: item.id, name: itemName, status: "skip" });
            skipped++;
            continue;
          }
          try {
            const prompt = `You are an expert equipment researcher for a construction and tool rental company.
Research the following equipment and return detailed, accurate information:
- Brand: ${brand || "Unknown"}
- Model: ${model || "Unknown"}
- Item name: ${itemName}
Provide a comprehensive product profile including:
1. A unique, professional product description (2-3 sentences, highlight key features and use cases for construction/rental context). Do NOT mention any specific city or region.
2. Key technical specifications (power, dimensions, weight, capacity, etc.)
3. Recommended rental pricing in HKD (daily, weekly, monthly rates). Price at 40% above typical UK rental rates.
Return ONLY valid JSON in this exact format:
{
  "description": "Professional description here",
  "specifications": "Key specs formatted as: Power: X | Weight: X | Dimensions: X | etc.",
  "suggestedDailyRate": 150,
  "suggestedWeeklyRate": 750,
  "suggestedMonthlyRate": 2500,
  "keyFeatures": ["feature 1", "feature 2", "feature 3"]
}
All rates should be in HKD as integers rounded to the nearest $10 (e.g. 150, 200, 350, 500, 1200).`;
            const response = await invokeLLM({
              messages: [
                { role: "system", content: "You are an equipment research assistant. Always respond with valid JSON only, no markdown fences." },
                { role: "user", content: prompt },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "equipment_info",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      specifications: { type: "string" },
                      suggestedDailyRate: { type: "number" },
                      suggestedWeeklyRate: { type: "number" },
                      suggestedMonthlyRate: { type: "number" },
                      keyFeatures: { type: "array", items: { type: "string" } },
                    },
                    required: ["description", "specifications", "suggestedDailyRate", "suggestedWeeklyRate", "suggestedMonthlyRate", "keyFeatures"],
                    additionalProperties: false,
                  },
                },
              },
            });
            const content = response.choices[0]?.message?.content;
            if (!content) throw new Error("No response from AI");
            const data = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
            // Round a number to the nearest $10
            const roundTo10 = (n: number) => Math.round(n / 10) * 10;
            const updatePayload: Record<string, unknown> = {};
            // Only update fields that are selected AND (missing or overwrite=true)
            if (fields.description && (input.overwrite || !item.description || item.description.trim() === "")) {
              updatePayload.description = data.description;
            }
            if (fields.specs && (input.overwrite || !item.specs || item.specs.trim() === "")) {
              updatePayload.specs = data.specifications;
            }
            if (fields.dailyRate && (input.overwrite || !item.dailyRate)) {
              updatePayload.dailyRate = String(roundTo10(data.suggestedDailyRate));
            }
            if (fields.weeklyRate && (input.overwrite || !item.weeklyRate)) {
              updatePayload.weeklyRate = String(roundTo10(data.suggestedWeeklyRate));
            }
            if (fields.monthlyRate && (input.overwrite || !item.monthlyRate)) {
              updatePayload.monthlyRate = String(roundTo10(data.suggestedMonthlyRate));
            }
            if (Object.keys(updatePayload).length > 0) {
              await updateEquipmentItem(item.id, updatePayload as any);
            }
            results.push({ id: item.id, name: itemName, status: "ok" });
            succeeded++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`${itemName}: ${msg}`);
            results.push({ id: item.id, name: itemName, status: "error", error: msg });
            failed++;
          }
        }
        return {
          // total items in this batch
          batchCount: toFill.length,
          // total items in the full filtered list (so frontend knows when done)
          totalToFill,
          succeeded,
          failed,
          skipped,
          errors: errors.slice(0, 20),
          results,
        };
      }),

    // ─── Bulk AI Photo Sourcing ───────────────────────────────────────
    // ─── Photo Approval Queue ─────────────────────────────────────────
    listPendingImages: adminProcedure
      .query(async () => {
        return listPendingImageApprovals();
      }),

    pendingImageCount: adminProcedure
      .query(async () => {
        const count = await countPendingImageApprovals();
        return { count };
      }),

    approveImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await approveItemImage(input.id);
        return { success: true };
      }),

    /** Bulk approve multiple images at once */
    bulkApproveImages: adminProcedure
      .input(z.object({ ids: z.array(z.number()).min(1) }))
      .mutation(async ({ input }) => {
        let approved = 0;
        for (const id of input.ids) {
          try {
            await approveItemImage(id);
            approved++;
          } catch (err) {
            console.warn(`[Bulk Approve] Failed for item ${id}:`, err);
          }
        }
        return { success: true, approved, total: input.ids.length };
      }),

    /** Bulk reject multiple images at once */
    bulkRejectImages: adminProcedure
      .input(z.object({ ids: z.array(z.number()).min(1) }))
      .mutation(async ({ input }) => {
        let rejected = 0;
        for (const id of input.ids) {
          try {
            await rejectItemImage(id);
            rejected++;
          } catch (err) {
            console.warn(`[Bulk Reject] Failed for item ${id}:`, err);
          }
        }
        return { success: true, rejected, total: input.ids.length };
      }),

    rejectImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        // Reject and get updated rejected URLs list
        const rejectedList = await rejectItemImage(input.id) ?? [];
        // Auto re-source in the background with excluded URLs
        (async () => {
          try {
            const { fetchProductImageFromWeb } = await import("./productImageScraper");
            const item = await getEquipmentItemById(input.id);
            if (!item) return;
            const imgResult = await fetchProductImageFromWeb(
              item.brand ?? "",
              item.model ?? "",
              item.name ?? "",
              rejectedList
            );
            if (imgResult) {
              await updateEquipmentItem(input.id, {
                pendingImageUrl: imgResult.cdnUrl,
                pendingImageSourceUrl: imgResult.sourceUrl,
                imageApprovalStatus: "pending",
              } as any);
              console.log(`[Auto Re-source] New photo queued for: ${item.name} (source: ${imgResult.sourceUrl})`);
            } else {
              console.warn(`[Auto Re-source] No new photo found for: ${item.name} (all candidates exhausted)`);
            }
          } catch (err) {
            console.warn(`[Auto Re-source] Failed for item ${input.id}:`, err);
          }
        })();
        return { success: true, autoResourcing: true };
      }),

    listRejectedImages: adminProcedure
      .query(async () => {
        return listRejectedImageApprovals();
      }),

    reSourceImage: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { fetchProductImageFromWeb } = await import("./productImageScraper");
        // Fetch the item details — get full item to access rejectedImageUrls
        const fullItem = await getEquipmentItemById(input.id);
        if (!fullItem) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
        // Parse previously rejected URLs to exclude them
        let excludeUrls: string[] = [];
        try {
          excludeUrls = fullItem.rejectedImageUrls ? JSON.parse(fullItem.rejectedImageUrls as string) : [];
        } catch { excludeUrls = []; }
        const imgResult = await fetchProductImageFromWeb(
          fullItem.brand ?? "",
          fullItem.model ?? "",
          fullItem.name ?? "",
          excludeUrls
        );
        if (!imgResult) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No new image found (all candidates already rejected)" });
        }
        await updateEquipmentItem(input.id, {
          pendingImageUrl: imgResult.cdnUrl,
          pendingImageSourceUrl: imgResult.sourceUrl,
          imageApprovalStatus: "pending",
        } as any);
        return { success: true, pendingImageUrl: imgResult.cdnUrl };
      }),

    bulkSourceImages: adminProcedure
      .input(
        z.object({
          overwrite: z.boolean().default(false),
          offset: z.number().default(0),
          batchSize: z.number().default(5),
        })
      )
      .mutation(async ({ input }) => {
        const { fetchProductImageFromWeb } = await import("./productImageScraper");
        const allItems = await listEquipmentItems();
        const eligible = input.overwrite
          ? allItems
          : allItems.filter((item) => !item.imageUrl || item.imageUrl.includes("placeholder"));

        const totalToSource = eligible.length;
        const batch = eligible.slice(input.offset, input.offset + input.batchSize);

        let succeeded = 0;
        let failed = 0;
        let skipped = 0;
        const results: Array<{ id: number; name: string; status: "ok" | "skip" | "error"; imageUrl?: string; error?: string }> = [];
        const errors: string[] = [];

        for (const item of batch) {
          const brand = item.brand || "";
          const model = (item as any).modelNumber || item.model || "";
          const itemName = item.name || "";

          if (!brand && !model && !itemName) {
            results.push({ id: item.id, name: itemName, status: "skip" });
            skipped++;
            continue;
          }

          try {
            const imgResult = await fetchProductImageFromWeb(brand, model, itemName);
            if (imgResult) {
              await updateEquipmentItem(item.id, { pendingImageUrl: imgResult.cdnUrl, pendingImageSourceUrl: imgResult.sourceUrl, imageApprovalStatus: "pending" } as any);
              results.push({ id: item.id, name: itemName, status: "ok", imageUrl: imgResult.cdnUrl });
              succeeded++;
            } else {
              throw new Error("No manufacturer image found");
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`${itemName}: ${msg}`);
            results.push({ id: item.id, name: itemName, status: "error", error: msg });
            failed++;
          }
        }

        return {
          totalToSource,
          batchCount: batch.length,
          succeeded,
          failed,
          skipped,
          errors: errors.slice(0, 20),
          results,
        };
      }),

    // ─── Bulk zh-HK Translation Backfill ─────────────────────────────
    translateAll: adminProcedure
      .input(z.object({
        overwrite: z.boolean().default(false),
        offset: z.number().int().min(0).default(0),
        batchSize: z.number().int().min(1).max(10).default(5),
        target: z.enum(["equipment", "consumables", "bundles", "all"]).default("all"),
      }))
      .mutation(async ({ input }) => {
        const { translateToZhHK } = await import("./translation");
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

        const { equipmentItems: eqTable, consumables: cTable, equipmentBundles: bTable } = await import("../drizzle/schema");
        const { eq, isNull, or } = await import("drizzle-orm");

        type BatchItem = { id: number; name: string; description: string | null };
        let allItems: BatchItem[] = [];

        if (input.target === "equipment" || input.target === "all") {
          const rows = await db.select({ id: eqTable.id, name: eqTable.name, description: eqTable.description, nameZh: eqTable.nameZh }).from(eqTable);
          const filtered = input.overwrite ? rows : rows.filter(r => !r.nameZh);
          allItems = allItems.concat(filtered.map(r => ({ id: r.id, name: r.name || "", description: r.description || "", _table: "equipment" as const })));
        }
        if (input.target === "consumables" || input.target === "all") {
          const rows = await db.select({ id: cTable.id, name: cTable.name, description: cTable.description, nameZh: cTable.nameZh }).from(cTable);
          const filtered = input.overwrite ? rows : rows.filter(r => !r.nameZh);
          allItems = allItems.concat(filtered.map(r => ({ id: r.id, name: r.name || "", description: r.description || "", _table: "consumable" as const })));
        }
        if (input.target === "bundles" || input.target === "all") {
          const rows = await db.select({ id: bTable.id, name: bTable.name, description: bTable.description, nameZh: bTable.nameZh }).from(bTable);
          const filtered = input.overwrite ? rows : rows.filter(r => !r.nameZh);
          allItems = allItems.concat(filtered.map(r => ({ id: r.id, name: r.name || "", description: r.description || "", _table: "bundle" as const })));
        }

        const totalToFill = allItems.length;
        const batch = allItems.slice(input.offset, input.offset + input.batchSize);

        let succeeded = 0;
        let failed = 0;
        const errors: string[] = [];
        const results: Array<{ id: number; name: string; table: string; status: "ok" | "error"; nameZh?: string; error?: string }> = [];

        for (const item of batch as any[]) {
          try {
            const zh = await translateToZhHK(item.name, item.description || "");
            if (item._table === "equipment") {
              await db.update(eqTable).set({ nameZh: zh.nameZh, descriptionZh: zh.descriptionZh }).where(eq(eqTable.id, item.id));
            } else if (item._table === "consumable") {
              await db.update(cTable).set({ nameZh: zh.nameZh, descriptionZh: zh.descriptionZh }).where(eq(cTable.id, item.id));
            } else if (item._table === "bundle") {
              await db.update(bTable).set({ nameZh: zh.nameZh, descriptionZh: zh.descriptionZh }).where(eq(bTable.id, item.id));
            }
            results.push({ id: item.id, name: item.name, table: item._table, status: "ok", nameZh: zh.nameZh });
            succeeded++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            errors.push(`${item.name}: ${msg}`);
            results.push({ id: item.id, name: item.name, table: item._table, status: "error", error: msg });
            failed++;
          }
        }

        return {
          totalToFill,
          batchCount: batch.length,
          succeeded,
          failed,
          errors: errors.slice(0, 20),
          results,
        };
      }),

    // ─── Single item re-translate ─────────────────────────────────────
    runBackupNow: adminProcedure
      .input(z.object({
        target: z.enum(["drive", "github", "both"]).default("both"),
      }))
      .mutation(async ({ input }) => {
        const { runGoogleDriveBackup } = await import("./googleDriveBackup");
        const { runGitHubBackup } = await import("./githubBackup");
        const results: Record<string, unknown> = {};
        if (input.target === "drive" || input.target === "both") {
          const driveResult = await runGoogleDriveBackup();
          results.drive = driveResult;
        }
        if (input.target === "github" || input.target === "both") {
          const githubResult = await runGitHubBackup();
          results.github = githubResult;
        }
        const allSuccess = Object.values(results).every((r: any) => r.success);
        return { success: allSuccess, results };
      }),

    retranslateItem: adminProcedure
      .input(z.object({
        id: z.number(),
        table: z.enum(["equipment", "consumable", "bundle"]),
      }))
      .mutation(async ({ input }) => {
        const { translateToZhHK } = await import("./translation");
        const { getDb } = await import("./db");
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
        const { equipmentItems: eqTable, consumables: cTable, equipmentBundles: bTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        let name = "";
        let description = "";
        if (input.table === "equipment") {
          const [row] = await db.select({ name: eqTable.name, description: eqTable.description }).from(eqTable).where(eq(eqTable.id, input.id)).limit(1);
          if (!row) throw new TRPCError({ code: "NOT_FOUND" });
          name = row.name || "";
          description = row.description || "";
        } else if (input.table === "consumable") {
          const [row] = await db.select({ name: cTable.name, description: cTable.description }).from(cTable).where(eq(cTable.id, input.id)).limit(1);
          if (!row) throw new TRPCError({ code: "NOT_FOUND" });
          name = row.name || "";
          description = row.description || "";
        } else if (input.table === "bundle") {
          const [row] = await db.select({ name: bTable.name, description: bTable.description }).from(bTable).where(eq(bTable.id, input.id)).limit(1);
          if (!row) throw new TRPCError({ code: "NOT_FOUND" });
          name = row.name || "";
          description = row.description || "";
        }

        const zh = await translateToZhHK(name, description);
        if (input.table === "equipment") {
          await db.update(eqTable).set({ nameZh: zh.nameZh, descriptionZh: zh.descriptionZh }).where(eq(eqTable.id, input.id));
        } else if (input.table === "consumable") {
          await db.update(cTable).set({ nameZh: zh.nameZh, descriptionZh: zh.descriptionZh }).where(eq(cTable.id, input.id));
        } else if (input.table === "bundle") {
          await db.update(bTable).set({ nameZh: zh.nameZh, descriptionZh: zh.descriptionZh }).where(eq(bTable.id, input.id));
        }
        return { success: true, nameZh: zh.nameZh, descriptionZh: zh.descriptionZh };
      }),
  }),
  // ─── Favourites ──────────────────────────────────────────────────────
  favourites: router({
    // Toggle favourite — add if not saved, remove if already saved
    toggle: publicProcedure
      .input(z.object({ equipmentItemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) return { favourited: false, requiresLogin: true };
        const already = await isFavourite(ctx.user.id, input.equipmentItemId);
        if (already) {
          await removeFavourite(ctx.user.id, input.equipmentItemId);
          return { favourited: false, requiresLogin: false };
        } else {
          await addFavourite(ctx.user.id, input.equipmentItemId);
          return { favourited: true, requiresLogin: false };
        }
      }),

    // List all favourited items for the current user
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return listFavourites(ctx.user.id);
    }),

    // Get all favourited item IDs for the current user (for heart state)
    ids: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return getFavouriteIds(ctx.user.id);
    }),

    // Check if a single item is favourited
    check: publicProcedure
      .input(z.object({ equipmentItemId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) return { favourited: false };
        const favourited = await isFavourite(ctx.user.id, input.equipmentItemId);
        return { favourited };
      }),
  }),

  // ─── Consumables (for sale, not rental) ──────────────────────────
  consumables: router({
    /** Get related consumables for a specific equipment item */
    forEquipment: publicProcedure
      .input(z.object({ equipmentItemId: z.number() }))
      .query(async ({ input }) => {
        return getConsumablesForEquipment(input.equipmentItemId);
      }),

    /** List all consumables, optionally filtered by category tag */
    list: publicProcedure
      .input(z.object({ categoryTag: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return listConsumables(input?.categoryTag);
      }),

    /** Get a single consumable by ID */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const item = await getConsumableById(input.id);
        if (!item) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consumable not found' });
        return item;
      }),

    /** Get equipment items that use a specific consumable */
    relatedEquipment: publicProcedure
      .input(z.object({ consumableId: z.number() }))
      .query(async ({ input }) => {
        return getEquipmentForConsumable(input.consumableId);
      }),

    /** Admin: list ALL consumables (including inactive) */
    adminList: adminProcedure.query(async () => {
      return listAllConsumables();
    }),

    /** Admin: create a new consumable */
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        unit: z.string().default("each"),
        price: z.string().optional().transform(v => v?.replace(/,/g, '')),
        imageUrl: z.string().optional(),
        specs: z.string().optional(),
        categoryTag: z.string().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const result = await createConsumable(input);
        // Auto-translate to Traditional Chinese (zh-HK) in background
        if (result.id && input.name) {
          scheduleTranslation(
            input.name,
            input.description || "",
            async (zh) => {
              await updateConsumable(result.id, { nameZh: zh.nameZh, descriptionZh: zh.descriptionZh } as any);
              console.log(`[Translation] zh-HK saved for consumable ${result.id}: ${zh.nameZh}`);
            }
          );
        }
        return result;
      }),

    /** Admin: update an existing consumable */
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        unit: z.string().optional(),
        price: z.string().optional().transform(v => v?.replace(/,/g, '')),
        imageUrl: z.string().optional(),
        specs: z.string().optional(),
        categoryTag: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateConsumable(id, data);
        // Re-translate if name or description changed
        if (data.name || data.description) {
          const current = await getConsumableById(id);
          if (current) {
            scheduleTranslation(
              current.name || "",
              current.description || "",
              async (zh) => {
                await updateConsumable(id, { nameZh: zh.nameZh, descriptionZh: zh.descriptionZh } as any);
                console.log(`[Translation] zh-HK updated for consumable ${id}: ${zh.nameZh}`);
              }
            );
          }
        }
        return { success: true };
      }),

    /** Admin: delete a consumable */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteConsumable(input.id);
      }),

    /** Admin: get equipment links for a consumable */
    getLinks: adminProcedure
      .input(z.object({ consumableId: z.number() }))
      .query(async ({ input }) => {
        return getConsumableLinks(input.consumableId);
      }),

    /** Admin: link consumable to equipment */
    link: adminProcedure
      .input(z.object({
        consumableId: z.number(),
        equipmentItemId: z.number(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return linkConsumableToEquipment(input);
      }),

    /** Admin: unlink consumable from equipment */
    unlink: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return unlinkConsumableFromEquipment(input.id);
      }),
  }),

  // ─── Equipment Bundles / Kits ──────────────────────────────────
  bundles: router({
    /** Admin: list ALL bundles (including inactive) */
    adminList: adminProcedure.query(async () => {
      return listAllBundles();
    }),

    /** List all active bundles, optionally filtered by category tag */
    list: publicProcedure
      .input(z.object({ categoryTag: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return listBundles(input?.categoryTag);
      }),

    /** Get a single bundle by ID with included items */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const bundle = await getBundleById(input.id);
        if (!bundle) throw new TRPCError({ code: 'NOT_FOUND', message: 'Bundle not found' });
        return bundle;
      }),

    /** Get featured bundles for homepage */
    featured: publicProcedure.query(async () => {
      return getFeaturedBundles();
    }),

    /** Admin: create a new bundle */
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        dailyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
        weeklyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
        monthlyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
        savingsPercent: z.number().optional(),
        categoryTag: z.string().optional(),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input }) => {
        const result = await createBundle(input);
        // Auto-translate to Traditional Chinese (zh-HK) in background
        if (result.id && input.name) {
          scheduleTranslation(
            input.name,
            input.description || "",
            async (zh) => {
              await updateBundle(result.id, { nameZh: zh.nameZh, descriptionZh: zh.descriptionZh } as any);
              console.log(`[Translation] zh-HK saved for bundle ${result.id}: ${zh.nameZh}`);
            }
          );
        }
        return result;
      }),

    /** Admin: update an existing bundle */
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
        dailyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
        weeklyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
        monthlyRate: z.string().optional().transform(v => v?.replace(/,/g, '')),
        savingsPercent: z.number().optional(),
        categoryTag: z.string().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateBundle(id, data);
        // Re-translate if name or description changed
        if (data.name || data.description) {
          const current = await getBundleById(id);
          if (current) {
            scheduleTranslation(
              current.name || "",
              current.description || "",
              async (zh) => {
                await updateBundle(id, { nameZh: zh.nameZh, descriptionZh: zh.descriptionZh } as any);
                console.log(`[Translation] zh-HK updated for bundle ${id}: ${zh.nameZh}`);
              }
            );
          }
        }
        return { success: true };
      }),

    /** Admin: delete a bundle */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBundle(input.id);
      }),

    /** Admin: add item to bundle */
    addItem: adminProcedure
      .input(z.object({
        bundleId: z.number(),
        equipmentItemId: z.number(),
        quantity: z.number().default(1),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return addBundleItem(input);
      }),

    /** Admin: remove item from bundle */
    removeItem: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return removeBundleItem(input.id);
      }),
  }),

  // ─── Activity Log ──────────────────────────────────────────────
  activityLog: router({
    /** List recent activity log entries */
    list: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return listActivityLog(input?.limit ?? 100, input?.offset ?? 0);
      }),

    /** Count total activity log entries */
    count: adminProcedure.query(async () => {
      return countActivityLog();
    }),

    /** Manually log an action (for client-side tracking) */
    log: adminProcedure
      .input(z.object({
        action: z.string(),
        entityType: z.string(),
        entityId: z.number().optional(),
        entityName: z.string().optional(),
        details: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? ctx.user.email ?? 'Admin',
          ...input,
        });
        return { success: true };
      }),
  }),

  // ─── Enquiry Leads ────────────────────────────────────────────
  enquiryLeads: router({
    /** Public: log a lead event (WhatsApp click, quote request, etc.) */
    track: publicProcedure
      .input(z.object({
        type: z.enum(["quote_request", "whatsapp_click", "phone_call", "email_click", "cart_enquiry"]),
        equipmentItemId: z.number().optional(),
        equipmentName: z.string().optional(),
        customerName: z.string().optional(),
        customerEmail: z.string().optional(),
        customerPhone: z.string().optional(),
        company: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const lead = await createEnquiryLead(input);
        // Only notify owner for high-intent leads (quote requests and cart enquiries).
        // Passive link clicks (WhatsApp, phone, email) are still logged in the DB
        // but do NOT trigger a push notification to avoid inbox spam.
        const HIGH_INTENT_TYPES = ['quote_request', 'cart_enquiry'] as const;
        if ((HIGH_INTENT_TYPES as readonly string[]).includes(input.type)) {
          const leadType = input.type === 'quote_request' ? 'Quote Request' : 'Cart Enquiry';
          const itemInfo = input.equipmentName ? ` for ${input.equipmentName}` : '';
          await notifyOwner({
            title: `New Lead: ${leadType}${itemInfo}`,
            content: `${input.customerName || 'Customer'} ${input.customerEmail ? `(${input.customerEmail})` : ''} - Source: ${input.source || 'Direct'}`
          });
        }
        return { success: true };
      }),

    /** Admin: list all leads */
    list: adminProcedure
      .input(z.object({ limit: z.number().default(200), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return listEnquiryLeads(input?.limit ?? 200, input?.offset ?? 0);
      }),

    /** Admin: update lead status */
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "quoted", "won", "lost"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateEnquiryLeadStatus(input.id, input.status, input.notes);
        return { success: true };
      }),

    /** Admin: get lead counts by status */
    statusCounts: adminProcedure.query(async () => {
      return countEnquiryLeadsByStatus();
    }),
    /** Admin: delete a lead and its replies */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteEnquiryLead(input.id);
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? 'Admin',
          action: 'delete',
          entityType: 'enquiry_lead',
          entityId: input.id,
          details: 'Lead deleted',
        });
        return { success: true };
      }),
    /** Admin: send a reply email to a lead and log it */
    reply: adminProcedure
      .input(z.object({
        leadId: z.number(),
        toEmail: z.string().email(),
        subject: z.string().min(1).max(500),
        body: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Send email via Resend
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
          await resend.emails.send({
            from: 'EquipHK <noreply@equip.hk>',
            to: input.toEmail,
            subject: input.subject,
            html: input.body.replace(/\n/g, '<br>'),
          });
        } catch (emailErr) {
          console.error('[Lead Reply] Email send failed:', emailErr);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send email. Please check your email configuration.' });
        }
        // Log the reply
        await createLeadReply({
          leadId: input.leadId,
          sentBy: ctx.user.id,
          sentByName: ctx.user.name ?? 'Admin',
          subject: input.subject,
          body: input.body,
          toEmail: input.toEmail,
        });
        // Update lead status to contacted if it's still new
        await updateEnquiryLeadStatus(input.leadId, 'contacted');
        return { success: true };
      }),
    /** Admin: get replies for a lead */
    getReplies: adminProcedure
      .input(z.object({ leadId: z.number() }))
      .query(async ({ input }) => {
        return getLeadReplies(input.leadId);
      }),
  }),

  // ─── Export ────────────────────────────────────────────────────
  export: router({
    /** Export full inventory as JSON (frontend converts to CSV) */
    inventory: adminProcedure
      .input(z.object({
        activeOnly: z.boolean().optional().default(false),
        categoryId: z.number().optional(),
        availabilityFilter: z.enum(['all', 'available', 'unavailable']).optional().default('all'),
      }))
      .query(async ({ input }) => {
        const { listEquipmentItems, listCategories, listAllSubCategories } = await import('./db');
        const [items, categories, subCategories] = await Promise.all([
          listEquipmentItems(),
          listCategories(),
          listAllSubCategories(),
        ]);
        const catMap: Record<number, string> = {};
        categories.forEach((c: any) => catMap[c.id] = c.name);
        const subCatMap: Record<number, string> = {};
        subCategories.forEach((sc: any) => subCatMap[sc.id] = sc.name);

        let filtered = items as any[];
        if (input.activeOnly) filtered = filtered.filter((i: any) => i.isActive);
        if (input.categoryId) filtered = filtered.filter((i: any) => i.categoryId === input.categoryId);
        if (input.availabilityFilter === 'available') filtered = filtered.filter((i: any) => i.availability === 'available');
        if (input.availabilityFilter === 'unavailable') filtered = filtered.filter((i: any) => i.availability !== 'available');

        return filtered.map((item: any) => ({
          id: item.id,
          name: item.name,
          brand: item.brand ?? '',
          model: item.model ?? '',
          category: catMap[item.categoryId] ?? '',
          subCategory: subCatMap[item.subCategoryId] ?? '',
          dailyRate: item.dailyRate ?? '',
          weeklyRate: item.weeklyRate ?? '',
          monthlyRate: item.monthlyRate ?? '',
          availability: item.availability,
          condition: item.condition ?? '',
          quantity: item.quantity ?? '',
          availableQty: item.availableQty ?? '',
          includes: item.includes ?? '',
          description: item.description ?? '',
          specs: item.specs ?? '',
          isActive: item.isActive ? 'Yes' : 'No',
          isReviewed: item.isReviewed ? 'Yes' : 'No',
          imageUrl: item.imageUrl ?? '',
        }));
      }),

    /** Export all bundles as JSON */
    bundles: adminProcedure.query(async () => {
      const { listAllBundles } = await import('./db');
      const bundles = await listAllBundles();
      return (bundles as any[]).map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description ?? '',
        dailyRate: b.dailyRate ?? '',
        weeklyRate: b.weeklyRate ?? '',
        monthlyRate: b.monthlyRate ?? '',
        categoryTag: b.categoryTag ?? '',
        isActive: b.isActive ? 'Yes' : 'No',
        isFeatured: b.isFeatured ? 'Yes' : 'No',
        imageUrl: b.imageUrl ?? '',
      }));
    }),

    /** Export all consumables as JSON */
    consumables: adminProcedure.query(async () => {
      const { listAllConsumables } = await import('./db');
      const consumables = await listAllConsumables();
      return (consumables as any[]).map((c: any) => ({
        id: c.id,
        name: c.name,
        brand: c.brand ?? '',
        description: c.description ?? '',
        unitPrice: c.unitPrice ?? '',
        unit: c.unit ?? '',
        categoryTag: c.categoryTag ?? '',
        stockQty: c.stockQty ?? '',
        isActive: c.isActive ? 'Yes' : 'No',
        imageUrl: c.imageUrl ?? '',
      }));
    }),
  }),

  // ─── Rental Bookings ──────────────────────────────────────────
  rentalBookings: router({
    /** Create a new rental booking */
    create: adminProcedure
      .input(z.object({
        equipmentItemId: z.number(),
        customerName: z.string().min(1),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        company: z.string().optional(),
        rentalStartDate: z.date(),
        rentalEndDate: z.date(),
        rentalDays: z.number(),
        dailyRate: z.string().optional(),
        totalCost: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const booking = await createRentalBooking(input as any);
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? 'Admin',
          action: 'create',
          entityType: 'rental_booking',
          entityId: booking.id,
          entityName: `Booking for ${input.customerName}`,
        });
        return booking;
      }),

    /** List all rental bookings */
    list: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        return listRentalBookings(input?.limit ?? 100, input?.offset ?? 0);
      }),

    /** Get active rentals (currently rented out) */
    active: adminProcedure.query(async () => {
      return listActiveRentals();
    }),

    /** Get upcoming rentals (pending, starting soon) */
    upcoming: adminProcedure
      .input(z.object({ daysAhead: z.number().default(7) }).optional())
      .query(async ({ input }) => {
        return listUpcomingRentals(input?.daysAhead ?? 7);
      }),

    /** Get a specific rental booking */
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getRentalBookingById(input.id);
      }),

    /** Update rental booking status */
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'active', 'completed', 'cancelled']),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateRentalBooking(input.id, { status: input.status, notes: input.notes });
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? 'Admin',
          action: 'update_status',
          entityType: 'rental_booking',
          entityId: input.id,
          details: `Status changed to ${input.status}`,
        });
        return { success: true };
      }),

    /** Delete a rental booking */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteRentalBooking(input.id);
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? 'Admin',
          action: 'delete',
          entityType: 'rental_booking',
          entityId: input.id,
        });
        return { success: true };
      }),
  }),

  // ─── Team Management ──────────────────────────────────────────────────────
  team: router({
    /** List all staff members (admin, manager, warehouse) */
    listStaff: adminProcedure.query(async () => {
      return listStaffUsers();
    }),

    /** List all users with optional search */
    listAll: adminProcedure
      .input(z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.search && input.search.trim().length > 0) {
          return searchUsers(input.search.trim(), input.limit ?? 100);
        }
        return listAllUsers(input?.limit ?? 100, input?.offset ?? 0);
      }),

    /** Update a user's role (admin only) */
    updateRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin', 'manager', 'warehouse']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Prevent self-demotion
        if (input.userId === ctx.user.id && input.role !== 'admin') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot change your own role.',
          });
        }
        await updateUserRole(input.userId, input.role);
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? 'Admin',
          action: 'update_role',
          entityType: 'user',
          entityId: input.userId,
          details: `Role changed to ${input.role}`,
        });
        return { success: true };
      }),

    /** Get a specific user by ID */
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getUserById(input.id);
      }),
    /** Get custom permissions for a staff user */
    getPermissions: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const row = await getStaffPermissions(input.userId);
        const perms: string[] = row?.permissions ? JSON.parse(row.permissions) : [];
        return { userId: input.userId, permissions: perms };
      }),
    /** Get permissions for all staff users at once */
    getPermissionsBulk: adminProcedure
      .input(z.object({ userIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        const rows = await getStaffPermissionsBulk(input.userIds);
        return rows.map(r => ({
          userId: r.userId,
          permissions: r.permissions ? JSON.parse(r.permissions) : [],
        }));
      }),
    /** Set custom permissions for a staff user */
    setPermissions: adminProcedure
      .input(z.object({
        userId: z.number(),
        permissions: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertStaffPermissions(input.userId, input.permissions);
        await logActivity({
          userId: ctx.user.id,
          userName: ctx.user.name ?? 'Admin',
          action: 'update_permissions',
          entityType: 'user',
          entityId: input.userId,
          details: `Permissions updated: ${input.permissions.join(', ')}`,
        });
        return { success: true };
      }),
  }),

  // ─── Saved Carts (Job Kits) ──────────────────────────────────────────
  savedCarts: router({
    list: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return listSavedCarts(ctx.user.id);
    }),
    save: publicProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        items: z.string(), // JSON string
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        return createSavedCart({ userId: ctx.user.id, name: input.name, items: input.items });
      }),
    rename: publicProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1).max(100) }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        await updateSavedCart(input.id, ctx.user.id, { name: input.name });
        return { success: true };
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        await deleteSavedCart(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ─── Referral Programme ──────────────────────────────────────────────
  referral: router({
    /** Get or auto-create the current user's referral code */
    getMyCode: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      let code = await getReferralCodeByUserId(ctx.user.id);
      if (!code) {
        // Auto-generate a unique code from name + random suffix
        const base = (ctx.user.name ?? 'USER').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newCode = `${base}${suffix}`;
        await createReferralCode(ctx.user.id, newCode);
        code = await getReferralCodeByUserId(ctx.user.id);
      }
      return code;
    }),
    /** Get referral credits balance for current user */
    getCredits: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return getReferralCredits(ctx.user.id);
    }),
    /** List referral events for current user */
    listEvents: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      return listReferralEvents(ctx.user.id);
    }),
    /** Validate a referral code (used at sign-up) */
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const code = await getReferralCodeByCode(input.code.toUpperCase());
        if (!code) return { valid: false };
        return { valid: true, referrerId: code.userId };
      }),
    /** Record a referral event when a referred user completes their first order */
    recordEvent: publicProcedure
      .input(z.object({
        referralCode: z.string(),
        creditAwarded: z.string().default('250'),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const code = await getReferralCodeByCode(input.referralCode.toUpperCase());
        if (!code) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid referral code' });
        if (code.userId === ctx.user.id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot use your own referral code' });
        await recordReferralEvent(code.userId, code.id, ctx.user.id, input.creditAwarded);
        return { success: true, creditAwarded: input.creditAwarded };
      }),
  }),

  // ─── Fuel Pricing ─────────────────────────────────────────────────────
  fuel: fuelRouter,
  // ─── Warehouse Workflow ────────────────────────────────────────────────
  warehouse: warehouseRouter,
});
export type AppRouter = typeof appRouter;
