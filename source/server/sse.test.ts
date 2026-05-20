import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  broadcast,
  emitNewEquipment,
  emitNewAnnouncement,
  emitNewNotification,
  emitNewPromotion,
  registerClient,
  getClientCount,
  type SSEEvent,
} from "./sse";
import type { Request, Response } from "express";

function createMockReqRes() {
  const written: string[] = [];
  const req = {
    on: vi.fn(),
  } as unknown as Request;
  const res = {
    writeHead: vi.fn(),
    write: vi.fn((data: string) => {
      written.push(data);
      return true;
    }),
  } as unknown as Response;
  return { req, res, written };
}

describe("SSE broadcaster", () => {
  describe("registerClient", () => {
    it("returns a client ID and sends initial connection event", () => {
      const { req, res, written } = createMockReqRes();
      const clientId = registerClient(req, res);

      expect(clientId).toMatch(/^sse-\d+-\d+$/);
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      // Should have sent a connection event
      expect(written.length).toBeGreaterThanOrEqual(1);
      expect(written[0]).toContain('"type":"connected"');
    });

    it("increments client count", () => {
      const initialCount = getClientCount();
      const { req, res } = createMockReqRes();
      registerClient(req, res);
      expect(getClientCount()).toBe(initialCount + 1);
    });

    it("registers close handler for cleanup", () => {
      const { req, res } = createMockReqRes();
      registerClient(req, res);
      // req.on should be called with "close" at least once
      expect(req.on).toHaveBeenCalledWith("close", expect.any(Function));
    });
  });

  describe("broadcast", () => {
    it("sends event to connected clients", () => {
      const { req, res, written } = createMockReqRes();
      registerClient(req, res);

      const event: SSEEvent = {
        type: "new_equipment",
        title: "New Drill",
        message: "Hilti TE 60 now available",
        timestamp: Date.now(),
      };

      broadcast(event);

      // Should have the connection event + the broadcast event
      const broadcastMessage = written.find(
        (w) => w.includes("new_equipment") && w.includes("New Drill")
      );
      expect(broadcastMessage).toBeDefined();
      expect(broadcastMessage).toContain("event: new_equipment");
      expect(broadcastMessage).toContain('"title":"New Drill"');
    });
  });

  describe("convenience emitters", () => {
    it("emitNewEquipment broadcasts with correct type", () => {
      const { req, res, written } = createMockReqRes();
      registerClient(req, res);

      emitNewEquipment("CAT 320", "Caterpillar", "2500.00");

      const msg = written.find((w) => w.includes("new_equipment"));
      expect(msg).toBeDefined();
      expect(msg).toContain("New Equipment Available");
      expect(msg).toContain("Caterpillar CAT 320");
      expect(msg).toContain("HK$2500.00/day");
    });

    it("emitNewEquipment works without brand/rate", () => {
      const { req, res, written } = createMockReqRes();
      registerClient(req, res);

      emitNewEquipment("Scaffolding Set");

      const msg = written.find(
        (w) => w.includes("new_equipment") && w.includes("Scaffolding Set")
      );
      expect(msg).toBeDefined();
      expect(msg).toContain("now available for rent");
    });

    it("emitNewAnnouncement broadcasts with correct type", () => {
      const { req, res, written } = createMockReqRes();
      registerClient(req, res);

      emitNewAnnouncement("Holiday Hours", "Closed on public holidays", "info");

      const msg = written.find((w) => w.includes("new_announcement"));
      expect(msg).toBeDefined();
      expect(msg).toContain("Holiday Hours");
    });

    it("emitNewPromotion broadcasts with correct type", () => {
      const { req, res, written } = createMockReqRes();
      registerClient(req, res);

      emitNewPromotion("20% Off", "All rentals this week", "promo");

      const msg = written.find((w) => w.includes("new_promotion"));
      expect(msg).toBeDefined();
      expect(msg).toContain("20% Off");
    });

    it("emitNewNotification broadcasts with correct type", () => {
      const { req, res, written } = createMockReqRes();
      registerClient(req, res);

      emitNewNotification("Stock Update", "New drills in stock", "new_equipment");

      const msg = written.find(
        (w) => w.includes("new_notification") && w.includes("Stock Update")
      );
      expect(msg).toBeDefined();
      expect(msg).toContain("Stock Update");
    });
  });
});
