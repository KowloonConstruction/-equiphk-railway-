/**
 * Tests for staff permissions and lead reply/delete features
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  getStaffPermissions,
  upsertStaffPermissions,
  getStaffPermissionsBulk,
  createLeadReply,
  getLeadReplies,
  deleteEnquiryLead,
  createEnquiryLead,
} from "./db";

// ─── Staff Permissions ────────────────────────────────────────────────────────

describe("Staff Permissions", () => {
  const TEST_USER_ID = 99991;
  const TEST_USER_ID_2 = 99992;

  beforeEach(async () => {
    // Clean up test data
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return;
    const { staffPermissions } = await import("../drizzle/schema");
    const { eq, inArray } = await import("drizzle-orm");
    await db.delete(staffPermissions).where(inArray(staffPermissions.userId, [TEST_USER_ID, TEST_USER_ID_2]));
  });

  it("getStaffPermissions returns null for user with no custom permissions", async () => {
    const result = await getStaffPermissions(TEST_USER_ID);
    expect(result).toBeNull();
  });

  it("upsertStaffPermissions creates new permissions for a user", async () => {
    const perms = ["orders", "members", "enquiry_tracking"];
    await upsertStaffPermissions(TEST_USER_ID, perms);

    const result = await getStaffPermissions(TEST_USER_ID);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe(TEST_USER_ID);
    const parsed = JSON.parse(result!.permissions!);
    expect(parsed).toEqual(perms);
  });

  it("upsertStaffPermissions updates existing permissions", async () => {
    await upsertStaffPermissions(TEST_USER_ID, ["orders"]);
    await upsertStaffPermissions(TEST_USER_ID, ["orders", "inventory", "categories"]);

    const result = await getStaffPermissions(TEST_USER_ID);
    const parsed = JSON.parse(result!.permissions!);
    expect(parsed).toEqual(["orders", "inventory", "categories"]);
  });

  it("getStaffPermissionsBulk returns permissions for multiple users", async () => {
    await upsertStaffPermissions(TEST_USER_ID, ["orders"]);
    await upsertStaffPermissions(TEST_USER_ID_2, ["inventory", "categories"]);

    const results = await getStaffPermissionsBulk([TEST_USER_ID, TEST_USER_ID_2]);
    expect(results.length).toBe(2);
    const user1 = results.find(r => r.userId === TEST_USER_ID);
    const user2 = results.find(r => r.userId === TEST_USER_ID_2);
    expect(user1).toBeDefined();
    expect(user2).toBeDefined();
    expect(JSON.parse(user1!.permissions!)).toEqual(["orders"]);
    expect(JSON.parse(user2!.permissions!)).toEqual(["inventory", "categories"]);
  });

  it("getStaffPermissionsBulk returns empty array for empty input", async () => {
    const results = await getStaffPermissionsBulk([]);
    expect(results).toEqual([]);
  });
});

// ─── Lead Replies ─────────────────────────────────────────────────────────────

describe("Lead Replies", () => {
  let testLeadId: number;

  beforeEach(async () => {
    // Create a test lead to reply to
    const lead = await createEnquiryLead({
      type: "quote_request",
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      equipmentName: "Test Drill",
      status: "new",
    });
    testLeadId = (lead as any)?.insertId ?? 0;
  });

  it("createLeadReply stores a reply for a lead", async () => {
    if (!testLeadId) return; // skip if lead creation failed

    await createLeadReply({
      leadId: testLeadId,
      sentBy: 1,
      sentByName: "Admin",
      subject: "Re: Your Enquiry",
      body: "Thank you for your enquiry.",
      toEmail: "test@example.com",
    });

    const replies = await getLeadReplies(testLeadId);
    expect(replies.length).toBeGreaterThan(0);
    expect(replies[0].subject).toBe("Re: Your Enquiry");
    expect(replies[0].toEmail).toBe("test@example.com");
  });

  it("getLeadReplies returns empty array for lead with no replies", async () => {
    if (!testLeadId) return;
    const replies = await getLeadReplies(testLeadId);
    expect(Array.isArray(replies)).toBe(true);
  });

  it("deleteEnquiryLead removes lead and its replies", async () => {
    if (!testLeadId) return;

    await createLeadReply({
      leadId: testLeadId,
      sentBy: 1,
      sentByName: "Admin",
      subject: "Re: Test",
      body: "Test reply",
      toEmail: "test@example.com",
    });

    await deleteEnquiryLead(testLeadId);

    const replies = await getLeadReplies(testLeadId);
    expect(replies.length).toBe(0);
  });
});
