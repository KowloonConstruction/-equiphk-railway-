/**
 * useRecentlyViewed — tracks equipment items the user has viewed
 * Stores up to 8 items in localStorage, newest first.
 * Each entry contains enough data to render a card without a network call.
 */
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "equiphk_recently_viewed";
const MAX_ITEMS = 8;

export interface RecentlyViewedItem {
  id: number;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  dailyRate: number | null;
  weeklyRate: number | null;
  availableQty: number;
  viewedAt: number; // UTC timestamp ms
}

function load(): RecentlyViewedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

function save(items: RecentlyViewedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage quota exceeded — silently ignore
  }
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => load());

  // Keep state in sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setItems(load());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const track = useCallback((item: Omit<RecentlyViewedItem, "viewedAt">) => {
    setItems((prev) => {
      // Remove existing entry for this item (dedup)
      const filtered = prev.filter((i) => i.id !== item.id);
      // Prepend new entry, cap at MAX_ITEMS
      const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      save(updated);
      return updated;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { items, track, clear };
}
