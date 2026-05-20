/*
 * EquipHK Server-Sent Events (SSE) Broadcaster
 * Manages connected clients and broadcasts real-time events
 * Events: new_equipment, new_promotion, new_announcement, new_notification
 */
import type { Request, Response } from "express";

export interface SSEEvent {
  type: "new_equipment" | "new_promotion" | "new_announcement" | "new_notification";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface SSEClient {
  id: string;
  res: Response;
  connectedAt: number;
}

// ─── Client Registry ────────────────────────────────────────────────
const clients: Map<string, SSEClient> = new Map();
let clientIdCounter = 0;

/**
 * Get the current number of connected SSE clients
 */
export function getClientCount(): number {
  return clients.size;
}

/**
 * Register a new SSE client connection
 */
export function registerClient(req: Request, res: Response): string {
  const clientId = `sse-${++clientIdCounter}-${Date.now()}`;

  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Send initial connection event
  res.write(
    `data: ${JSON.stringify({
      type: "connected",
      clientId,
      timestamp: Date.now(),
    })}\n\n`
  );

  // Register client
  clients.set(clientId, {
    id: clientId,
    res,
    connectedAt: Date.now(),
  });

  console.log(`[SSE] Client connected: ${clientId} (total: ${clients.size})`);

  // Clean up on disconnect
  req.on("close", () => {
    clients.delete(clientId);
    console.log(`[SSE] Client disconnected: ${clientId} (total: ${clients.size})`);
  });

  // Keep-alive heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    if (clients.has(clientId)) {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
        clients.delete(clientId);
      }
    } else {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on("close", () => clearInterval(heartbeat));

  return clientId;
}

/**
 * Broadcast an event to all connected SSE clients
 */
export function broadcast(event: SSEEvent): void {
  const payload = JSON.stringify(event);
  const message = `event: ${event.type}\ndata: ${payload}\n\n`;

  let sent = 0;
  let failed = 0;

  clients.forEach((client, clientId) => {
    try {
      client.res.write(message);
      sent++;
    } catch {
      // Client disconnected, remove it
      clients.delete(clientId);
      failed++;
    }
  });

  console.log(
    `[SSE] Broadcast "${event.type}": ${sent} sent, ${failed} failed, ${clients.size} total`
  );
}

// ─── Convenience Emitters ───────────────────────────────────────────

export function emitNewEquipment(name: string, brand?: string, dailyRate?: string): void {
  broadcast({
    type: "new_equipment",
    title: "New Equipment Available",
    message: brand
      ? `${brand} ${name} is now available${dailyRate ? ` from HK$${dailyRate}/day` : ""}`
      : `${name} is now available for rent`,
    data: { name, brand, dailyRate },
    timestamp: Date.now(),
  });
}

export function emitNewPromotion(title: string, message: string, type?: string): void {
  broadcast({
    type: "new_promotion",
    title,
    message,
    data: { promotionType: type },
    timestamp: Date.now(),
  });
}

export function emitNewAnnouncement(title: string, message: string, type?: string): void {
  broadcast({
    type: "new_announcement",
    title,
    message,
    data: { announcementType: type },
    timestamp: Date.now(),
  });
}

export function emitNewNotification(title: string, message: string, type?: string): void {
  broadcast({
    type: "new_notification",
    title,
    message,
    data: { notificationType: type },
    timestamp: Date.now(),
  });
}
