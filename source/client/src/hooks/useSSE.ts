/*
 * useSSE — React hook for Server-Sent Events
 * Connects to /api/events and dispatches incoming events to callbacks.
 * Auto-reconnects on connection drop with exponential backoff.
 */
import { useEffect, useRef, useCallback } from "react";

export interface SSEEvent {
  type: "new_equipment" | "new_promotion" | "new_announcement" | "new_notification";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

type SSEEventHandler = (event: SSEEvent) => void;

interface UseSSEOptions {
  /** Called for every event type */
  onEvent?: SSEEventHandler;
  /** Called specifically for new_equipment events */
  onNewEquipment?: SSEEventHandler;
  /** Called specifically for new_promotion events */
  onNewPromotion?: SSEEventHandler;
  /** Called specifically for new_announcement events */
  onNewAnnouncement?: SSEEventHandler;
  /** Called specifically for new_notification events */
  onNewNotification?: SSEEventHandler;
  /** Whether to connect (default: true) */
  enabled?: boolean;
}

const EVENT_TYPES = [
  "new_equipment",
  "new_promotion",
  "new_announcement",
  "new_notification",
] as const;

export function useSSE(options: UseSSEOptions = {}) {
  const {
    onEvent,
    onNewEquipment,
    onNewPromotion,
    onNewAnnouncement,
    onNewNotification,
    enabled = true,
  } = options;

  // Store callbacks in refs to avoid reconnecting when they change
  const callbacksRef = useRef({
    onEvent,
    onNewEquipment,
    onNewPromotion,
    onNewAnnouncement,
    onNewNotification,
  });

  callbacksRef.current = {
    onEvent,
    onNewEquipment,
    onNewPromotion,
    onNewAnnouncement,
    onNewNotification,
  };

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource("/api/events");
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0; // Reset retry count on successful connection
      };

      // Listen for each event type
      EVENT_TYPES.forEach((eventType) => {
        es.addEventListener(eventType, (e: MessageEvent) => {
          try {
            const parsed: SSEEvent = JSON.parse(e.data);

            // Fire generic handler
            callbacksRef.current.onEvent?.(parsed);

            // Fire type-specific handler
            switch (eventType) {
              case "new_equipment":
                callbacksRef.current.onNewEquipment?.(parsed);
                break;
              case "new_promotion":
                callbacksRef.current.onNewPromotion?.(parsed);
                break;
              case "new_announcement":
                callbacksRef.current.onNewAnnouncement?.(parsed);
                break;
              case "new_notification":
                callbacksRef.current.onNewNotification?.(parsed);
                break;
            }
          } catch (err) {
            console.warn("[SSE] Failed to parse event:", err);
          }
        });
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current++;

        retryTimerRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.warn("[SSE] Failed to create EventSource:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [enabled, connect]);
}
