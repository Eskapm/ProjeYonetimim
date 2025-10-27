import { format, parseISO } from "date-fns";

/**
 * Format currency for Turkish Lira
 * Returns formatted number with TL suffix (e.g., "1.234,56 TL")
 */
export function formatCurrency(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount) + ' TL';
}

/**
 * Format currency for compact display (smaller font)
 * Returns JSX-like structure with number and TL in smaller font
 */
export function formatCurrencyCompact(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount) + ' TL';
}

/**
 * Format date in short Turkish format (e.g., "01.01.2025")
 * Accepts either Date object or ISO string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, "dd.MM.yyyy");
}
