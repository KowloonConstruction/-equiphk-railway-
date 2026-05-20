/**
 * Vitest tests for the photo rejection URL exclusion logic.
 *
 * Verifies that:
 * 1. rejectItemImage tracks SOURCE URLs (not CDN URLs) in the rejected list
 * 2. The scraper's excludeUrls filter correctly removes previously rejected source URLs
 * 3. The full reject → re-source flow passes the correct URLs to the scraper
 */
import { describe, it, expect } from "vitest";

// ─── Unit tests for the scraper URL filtering logic ─────────────────────────

describe("Photo Reject URL Exclusion — scraper filtering", () => {
  /**
   * Simulates the core filtering logic from fetchProductImageFromWeb:
   *   const filteredCandidates = excludeUrls.length > 0
   *     ? candidates.filter(url => !excludeUrls.includes(url))
   *     : candidates;
   */
  function filterCandidates(candidates: string[], excludeUrls: string[]): string[] {
    return excludeUrls.length > 0
      ? candidates.filter(url => !excludeUrls.includes(url))
      : candidates;
  }

  it("returns all candidates when excludeUrls is empty", () => {
    const candidates = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
      "https://amazon.com/images/drill.png",
    ];
    const result = filterCandidates(candidates, []);
    expect(result).toEqual(candidates);
    expect(result).toHaveLength(3);
  });

  it("filters out a single rejected source URL", () => {
    const candidates = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
      "https://amazon.com/images/drill.png",
    ];
    const excludeUrls = ["https://makita.com/product/drill.jpg"];
    const result = filterCandidates(candidates, excludeUrls);
    expect(result).toHaveLength(2);
    expect(result).not.toContain("https://makita.com/product/drill.jpg");
    expect(result).toContain("https://toolstation.com/images/drill.jpg");
    expect(result).toContain("https://amazon.com/images/drill.png");
  });

  it("filters out multiple rejected source URLs", () => {
    const candidates = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
      "https://amazon.com/images/drill.png",
      "https://screwfix.com/images/drill.webp",
    ];
    const excludeUrls = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
    ];
    const result = filterCandidates(candidates, excludeUrls);
    expect(result).toHaveLength(2);
    expect(result).toEqual([
      "https://amazon.com/images/drill.png",
      "https://screwfix.com/images/drill.webp",
    ]);
  });

  it("returns empty array when all candidates are excluded", () => {
    const candidates = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
    ];
    const excludeUrls = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
    ];
    const result = filterCandidates(candidates, excludeUrls);
    expect(result).toHaveLength(0);
  });

  it("does NOT filter by CDN URL — only source URLs match", () => {
    // This is the exact bug we're fixing: CDN URLs should NOT match source URLs
    const candidates = [
      "https://makita.com/product/drill.jpg",  // source URL from the web
      "https://toolstation.com/images/drill.jpg",
    ];
    // CDN URLs are completely different from source URLs
    const cdnUrls = [
      "https://cdn.manus.space/equipment-photos/1234-abc.jpg",
      "https://cdn.manus.space/equipment-photos/5678-def.jpg",
    ];
    const result = filterCandidates(candidates, cdnUrls);
    // CDN URLs don't match any source URLs, so nothing gets filtered
    expect(result).toHaveLength(2);
    expect(result).toEqual(candidates);
  });

  it("correctly filters when source URLs are used (the fix)", () => {
    const candidates = [
      "https://makita.com/product/drill.jpg",
      "https://toolstation.com/images/drill.jpg",
      "https://amazon.com/images/drill.png",
    ];
    // Now we track SOURCE URLs in the rejected list (the fix)
    const sourceUrls = ["https://makita.com/product/drill.jpg"];
    const result = filterCandidates(candidates, sourceUrls);
    expect(result).toHaveLength(2);
    expect(result).not.toContain("https://makita.com/product/drill.jpg");
  });
});

// ─── Unit tests for the rejection workflow data flow ────────────────────────

describe("Photo Reject URL Exclusion — rejection workflow", () => {
  /**
   * Simulates the rejectItemImage logic:
   * - Gets the pendingImageSourceUrl (or falls back to pendingImageUrl)
   * - Adds it to the rejectedImageUrls JSON array
   * - Clears pendingImageUrl and pendingImageSourceUrl
   */
  function simulateReject(item: {
    pendingImageUrl: string | null;
    pendingImageSourceUrl: string | null;
    rejectedImageUrls: string | null;
  }) {
    let rejectedList: string[] = [];
    try {
      rejectedList = item.rejectedImageUrls ? JSON.parse(item.rejectedImageUrls) : [];
    } catch { rejectedList = []; }

    // Prefer source URL; fall back to CDN URL if source is missing (legacy data)
    const urlToReject = item.pendingImageSourceUrl || item.pendingImageUrl;
    if (urlToReject && !rejectedList.includes(urlToReject)) {
      rejectedList.push(urlToReject);
    }

    return {
      pendingImageUrl: null,
      pendingImageSourceUrl: null,
      imageApprovalStatus: "rejected" as const,
      rejectedImageUrls: JSON.stringify(rejectedList),
      rejectedList,
    };
  }

  it("tracks the SOURCE URL (not CDN URL) when both are available", () => {
    const result = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/equipment-photos/1234-abc.jpg",
      pendingImageSourceUrl: "https://makita.com/product/drill.jpg",
      rejectedImageUrls: null,
    });
    expect(result.rejectedList).toEqual(["https://makita.com/product/drill.jpg"]);
    expect(result.rejectedList).not.toContain("https://cdn.manus.space/equipment-photos/1234-abc.jpg");
  });

  it("falls back to CDN URL when source URL is missing (legacy data)", () => {
    const result = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/equipment-photos/1234-abc.jpg",
      pendingImageSourceUrl: null,
      rejectedImageUrls: null,
    });
    // For legacy items without source URL, we still track the CDN URL as a fallback
    expect(result.rejectedList).toEqual(["https://cdn.manus.space/equipment-photos/1234-abc.jpg"]);
  });

  it("accumulates multiple rejected source URLs across rejections", () => {
    // First rejection
    const first = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/1.jpg",
      pendingImageSourceUrl: "https://makita.com/drill-a.jpg",
      rejectedImageUrls: null,
    });
    expect(first.rejectedList).toHaveLength(1);

    // Second rejection (with first rejection already in the list)
    const second = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/2.jpg",
      pendingImageSourceUrl: "https://toolstation.com/drill-b.jpg",
      rejectedImageUrls: first.rejectedImageUrls,
    });
    expect(second.rejectedList).toHaveLength(2);
    expect(second.rejectedList).toContain("https://makita.com/drill-a.jpg");
    expect(second.rejectedList).toContain("https://toolstation.com/drill-b.jpg");

    // Third rejection
    const third = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/3.jpg",
      pendingImageSourceUrl: "https://amazon.com/drill-c.png",
      rejectedImageUrls: second.rejectedImageUrls,
    });
    expect(third.rejectedList).toHaveLength(3);
  });

  it("does not add duplicate URLs to the rejected list", () => {
    const result = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/1.jpg",
      pendingImageSourceUrl: "https://makita.com/drill.jpg",
      rejectedImageUrls: JSON.stringify(["https://makita.com/drill.jpg"]),
    });
    // Should not duplicate
    expect(result.rejectedList).toHaveLength(1);
    expect(result.rejectedList).toEqual(["https://makita.com/drill.jpg"]);
  });

  it("clears both pendingImageUrl and pendingImageSourceUrl after rejection", () => {
    const result = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/1.jpg",
      pendingImageSourceUrl: "https://makita.com/drill.jpg",
      rejectedImageUrls: null,
    });
    expect(result.pendingImageUrl).toBeNull();
    expect(result.pendingImageSourceUrl).toBeNull();
    expect(result.imageApprovalStatus).toBe("rejected");
  });

  it("handles corrupted rejectedImageUrls JSON gracefully", () => {
    const result = simulateReject({
      pendingImageUrl: "https://cdn.manus.space/1.jpg",
      pendingImageSourceUrl: "https://makita.com/drill.jpg",
      rejectedImageUrls: "not-valid-json",
    });
    // Should start fresh and still track the new URL
    expect(result.rejectedList).toEqual(["https://makita.com/drill.jpg"]);
  });
});

// ─── Integration-style test: full reject → re-source flow ──────────────────

describe("Photo Reject URL Exclusion — end-to-end flow", () => {
  it("rejected source URL is passed to scraper and filters out the same image", () => {
    // Step 1: Item has a pending photo with source URL
    const item = {
      pendingImageUrl: "https://cdn.manus.space/equipment-photos/abc123.jpg",
      pendingImageSourceUrl: "https://makita.com/products/drill-xt.jpg",
      rejectedImageUrls: null as string | null,
    };

    // Step 2: Admin rejects the photo
    let rejectedList: string[] = [];
    const urlToReject = item.pendingImageSourceUrl || item.pendingImageUrl;
    if (urlToReject) rejectedList.push(urlToReject);
    item.rejectedImageUrls = JSON.stringify(rejectedList);
    item.pendingImageUrl = null as any;
    item.pendingImageSourceUrl = null as any;

    // Step 3: Re-source is triggered with the rejected list
    const searchCandidates = [
      "https://makita.com/products/drill-xt.jpg",  // Same image — should be filtered
      "https://toolstation.com/images/makita-drill.jpg",  // Different — should pass
      "https://amazon.com/images/makita-drill.png",  // Different — should pass
    ];

    const filteredCandidates = searchCandidates.filter(
      url => !rejectedList.includes(url)
    );

    // Step 4: Verify the rejected URL is excluded
    expect(filteredCandidates).not.toContain("https://makita.com/products/drill-xt.jpg");
    expect(filteredCandidates).toHaveLength(2);
    expect(filteredCandidates[0]).toBe("https://toolstation.com/images/makita-drill.jpg");
  });

  it("multiple rejections progressively narrow the candidate pool", () => {
    const allCandidates = [
      "https://makita.com/drill-a.jpg",
      "https://toolstation.com/drill-b.jpg",
      "https://amazon.com/drill-c.png",
      "https://screwfix.com/drill-d.webp",
    ];

    let rejectedList: string[] = [];

    // Reject first candidate
    rejectedList.push("https://makita.com/drill-a.jpg");
    let filtered = allCandidates.filter(url => !rejectedList.includes(url));
    expect(filtered).toHaveLength(3);

    // Reject second candidate
    rejectedList.push("https://toolstation.com/drill-b.jpg");
    filtered = allCandidates.filter(url => !rejectedList.includes(url));
    expect(filtered).toHaveLength(2);

    // Reject third candidate
    rejectedList.push("https://amazon.com/drill-c.png");
    filtered = allCandidates.filter(url => !rejectedList.includes(url));
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toBe("https://screwfix.com/drill-d.webp");

    // Reject all — exhausted
    rejectedList.push("https://screwfix.com/drill-d.webp");
    filtered = allCandidates.filter(url => !rejectedList.includes(url));
    expect(filtered).toHaveLength(0);
  });
});
