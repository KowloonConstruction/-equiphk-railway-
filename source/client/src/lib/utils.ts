import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number with comma separators, no decimals.
 * e.g. 1000 → "1,000", 12500 → "12,500"
 */
export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "0";
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "0";
  return Math.round(num).toLocaleString("en-HK");
}

/**
 * Format a price with HK$ prefix and comma separators.
 * e.g. 1000 → "HK$1,000"
 */
export function formatHKD(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "POA";
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num) || num <= 0) return "POA";
  return `HK$${Math.round(num).toLocaleString("en-HK")}`;
}
