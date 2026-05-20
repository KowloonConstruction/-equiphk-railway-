import { createContext, useContext, useState, ReactNode } from "react";

export interface CartItem {
  equipmentId: number;
  name: string;
  dailyRate: number;
  rentalDays: number;
  startDate: string;
  totalPrice: number;
  imageUrl: string;
  // Fuel add-on (optional — only for petrol/diesel equipment)
  fuelType?: "none" | "petrol" | "diesel";
  fuelLitres?: number;
  fuelPricePerLitre?: number;
  fuelCost?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (equipmentId: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      // Check if item already in cart
      const existingIndex = prev.findIndex(
        (i) => i.equipmentId === item.equipmentId
      );
      if (existingIndex > -1) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      }
      // Add new item
      return [...prev, item];
    });
  };

  const removeFromCart = (equipmentId: number) => {
    setItems((prev) => prev.filter((i) => i.equipmentId !== equipmentId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalPrice = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, clearCart, getTotalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
