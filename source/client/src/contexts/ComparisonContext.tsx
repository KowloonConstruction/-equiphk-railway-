/*
 * Equipment Comparison Context
 * Manages the state of equipment items selected for side-by-side comparison
 */
import { createContext, useContext, useState, ReactNode } from "react";

export interface ComparisonItem {
  id: number;
  name: string;
  brand?: string;
  dailyRate?: string;
  weeklyRate?: string;
  monthlyRate?: string;
  imageUrl?: string;
  description?: string;
  specs?: string;
  condition?: string;
  availability?: string;
  quantity?: number;
}

interface ComparisonContextType {
  items: ComparisonItem[];
  addItem: (item: ComparisonItem) => void;
  removeItem: (itemId: number) => void;
  clearAll: () => void;
  isInComparison: (itemId: number) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ComparisonItem[]>([]);

  const addItem = (item: ComparisonItem) => {
    setItems((prev) => {
      // Check if item already exists
      if (prev.some((i) => i.id === item.id)) {
        return prev;
      }
      // Limit to 4 items for comparison
      if (prev.length >= 4) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeItem = (itemId: number) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const clearAll = () => {
    setItems([]);
  };

  const isInComparison = (itemId: number) => {
    return items.some((i) => i.id === itemId);
  };

  return (
    <ComparisonContext.Provider value={{ items, addItem, removeItem, clearAll, isInComparison }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within ComparisonProvider");
  }
  return context;
}
