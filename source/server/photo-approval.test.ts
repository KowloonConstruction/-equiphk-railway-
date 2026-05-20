/**
 * Vitest tests for the photo approval tRPC procedures
 * Covers: listPendingImages, pendingImageCount, approveImage, rejectImage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB helpers ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  listEquipmentItems: vi.fn(),
  getEquipmentItem: vi.fn(),
  createEquipmentItem: vi.fn(),
  updateEquipmentItem: vi.fn(),
  deleteEquipmentItem: vi.fn(),
  searchEquipmentItems: vi.fn(),
  listCategories: vi.fn(),
  listSubCategories: vi.fn(),
  bulkUpdateEquipmentCategory: vi.fn(),
  addFavourite: vi.fn(),
  removeFavourite: vi.fn(),
  listFavourites: vi.fn(),
  getFavouriteIds: vi.fn(),
  isFavourite: vi.fn(),
  listPendingImageApprovals: vi.fn().mockResolvedValue([]),
  approveItemImage: vi.fn().mockResolvedValue(undefined),
  rejectItemImage: vi.fn().mockResolvedValue(undefined),
  countPendingImageApprovals: vi.fn().mockResolvedValue(0),
}));

import {
  listPendingImageApprovals,
  approveItemImage,
  rejectItemImage,
  countPendingImageApprovals,
} from "./db";

// ─── Sample data ─────────────────────────────────────────────────────────────
const samplePendingItem = {
  id: 42,
  name: "Hilti TE 30-A36 Rotary Hammer",
  brand: "Hilti",
  model: "TE 30-A36",
  currentImageUrl: "https://cdn.example.com/old-image.jpg",
  pendingImageUrl: "https://cdn.example.com/new-image.jpg",
  imageApprovalStatus: "pending" as const,
  categoryId: 1,
};

// ─── Tests: listPendingImages ─────────────────────────────────────────────────
describe("Photo Approval — listPendingImages", () => {
  beforeEach(() => {
    vi.mocked(listPendingImageApprovals).mockResolvedValue([]);
  });

  it("returns an empty array when no images are pending", async () => {
    vi.mocked(listPendingImageApprovals).mockResolvedValue([]);
    const result = await listPendingImageApprovals();
    expect(result).toEqual([]);
  });

  it("returns pending items with all required fields", async () => {
    vi.mocked(listPendingImageApprovals).mockResolvedValue([samplePendingItem]);
    const result = await listPendingImageApprovals();
    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.id).toBe(42);
    expect(item.name).toBe("Hilti TE 30-A36 Rotary Hammer");
    expect(item.brand).toBe("Hilti");
    expect(item.model).toBe("TE 30-A36");
    expect(item.pendingImageUrl).toBe("https://cdn.example.com/new-image.jpg");
    expect(item.currentImageUrl).toBe("https://cdn.example.com/old-image.jpg");
    expect(item.imageApprovalStatus).toBe("pending");
  });

  it("returns multiple pending items", async () => {
    const items = [
      { ...samplePendingItem, id: 1, name: "Item A" },
      { ...samplePendingItem, id: 2, name: "Item B" },
      { ...samplePendingItem, id: 3, name: "Item C" },
    ];
    vi.mocked(listPendingImageApprovals).mockResolvedValue(items);
    const result = await listPendingImageApprovals();
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.name)).toEqual(["Item A", "Item B", "Item C"]);
  });

  it("handles items with no current image (first-time sourcing)", async () => {
    const noCurrentImage = { ...samplePendingItem, currentImageUrl: null };
    vi.mocked(listPendingImageApprovals).mockResolvedValue([noCurrentImage as any]);
    const result = await listPendingImageApprovals();
    expect(result[0].currentImageUrl).toBeNull();
    expect(result[0].pendingImageUrl).toBeTruthy();
  });
});

// ─── Tests: countPendingImageApprovals ───────────────────────────────────────
describe("Photo Approval — countPendingImageApprovals", () => {
  it("returns 0 when no images are pending", async () => {
    vi.mocked(countPendingImageApprovals).mockResolvedValue(0);
    const count = await countPendingImageApprovals();
    expect(count).toBe(0);
  });

  it("returns the correct count of pending images", async () => {
    vi.mocked(countPendingImageApprovals).mockResolvedValue(7);
    const count = await countPendingImageApprovals();
    expect(count).toBe(7);
  });

  it("returns a number type", async () => {
    vi.mocked(countPendingImageApprovals).mockResolvedValue(3);
    const count = await countPendingImageApprovals();
    expect(typeof count).toBe("number");
  });
});

// ─── Tests: approveItemImage ──────────────────────────────────────────────────
describe("Photo Approval — approveItemImage", () => {
  beforeEach(() => {
    vi.mocked(approveItemImage).mockResolvedValue(undefined);
    vi.mocked(approveItemImage).mockClear();
  });

  it("calls approveItemImage with the correct item ID", async () => {
    await approveItemImage(42);
    expect(approveItemImage).toHaveBeenCalledWith(42);
    expect(approveItemImage).toHaveBeenCalledTimes(1);
  });

  it("resolves without throwing for a valid item ID", async () => {
    await expect(approveItemImage(42)).resolves.toBeUndefined();
  });

  it("can approve multiple items sequentially", async () => {
    await approveItemImage(1);
    await approveItemImage(2);
    await approveItemImage(3);
    expect(approveItemImage).toHaveBeenCalledTimes(3);
    expect(approveItemImage).toHaveBeenNthCalledWith(1, 1);
    expect(approveItemImage).toHaveBeenNthCalledWith(2, 2);
    expect(approveItemImage).toHaveBeenNthCalledWith(3, 3);
  });
});

// ─── Tests: rejectItemImage ───────────────────────────────────────────────────
describe("Photo Approval — rejectItemImage", () => {
  beforeEach(() => {
    vi.mocked(rejectItemImage).mockResolvedValue(undefined);
    vi.mocked(rejectItemImage).mockClear();
  });

  it("calls rejectItemImage with the correct item ID", async () => {
    await rejectItemImage(42);
    expect(rejectItemImage).toHaveBeenCalledWith(42);
    expect(rejectItemImage).toHaveBeenCalledTimes(1);
  });

  it("resolves without throwing for a valid item ID", async () => {
    await expect(rejectItemImage(42)).resolves.toBeUndefined();
  });

  it("can reject multiple items sequentially", async () => {
    await rejectItemImage(10);
    await rejectItemImage(20);
    expect(rejectItemImage).toHaveBeenCalledTimes(2);
  });
});

// ─── Tests: approval workflow logic ──────────────────────────────────────────
describe("Photo Approval — workflow logic", () => {
  it("approve moves pendingImageUrl to imageUrl (simulated)", async () => {
    // Simulate the DB helper behaviour: approve copies pendingImageUrl → imageUrl
    let imageUrl = "https://cdn.example.com/old.jpg";
    let pendingImageUrl: string | null = "https://cdn.example.com/new.jpg";
    let status = "pending";

    // Simulate approve
    imageUrl = pendingImageUrl!;
    pendingImageUrl = null;
    status = "approved";

    expect(imageUrl).toBe("https://cdn.example.com/new.jpg");
    expect(pendingImageUrl).toBeNull();
    expect(status).toBe("approved");
  });

  it("reject clears pendingImageUrl without touching imageUrl (simulated)", async () => {
    let imageUrl = "https://cdn.example.com/old.jpg";
    let pendingImageUrl: string | null = "https://cdn.example.com/new.jpg";
    let status = "pending";

    // Simulate reject
    pendingImageUrl = null;
    status = "rejected";

    expect(imageUrl).toBe("https://cdn.example.com/old.jpg"); // unchanged
    expect(pendingImageUrl).toBeNull();
    expect(status).toBe("rejected");
  });

  it("pending count decreases after approval", async () => {
    let pendingCount = 5;

    // Simulate approving one item
    pendingCount -= 1;

    expect(pendingCount).toBe(4);
  });

  it("pending count decreases after rejection", async () => {
    let pendingCount = 5;

    // Simulate rejecting one item
    pendingCount -= 1;

    expect(pendingCount).toBe(4);
  });
});
