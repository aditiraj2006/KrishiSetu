import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind CSS class names safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date or ISO string into a human-readable date string.
 * @example formatDate("2024-01-15") → "January 15, 2024"
 */
export function formatDate(date: Date | string, locale = "en-IN"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Formats a number as Indian Rupee currency.
 * @example formatCurrency(12500) → "₹12,500.00"
 */
export function formatCurrency(amount: number, locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Truncates a string to the given max length, appending an ellipsis if needed.
 * @example truncateText("Hello World", 7) → "Hello W..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
