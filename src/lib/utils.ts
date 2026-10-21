/**
 * Combines CSS class names filtering out falsy values
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a number as Indian Rupee (INR) currency or standard format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate percentage savings
 */
export function calculateSavings(comparePrice: number, price: number): {
  savingsAmount: number;
  savingsPercentage: number;
} {
  const savingsAmount = Math.max(0, comparePrice - price);
  const savingsPercentage = comparePrice > 0 ? Math.round((savingsAmount / comparePrice) * 100) : 0;
  return { savingsAmount, savingsPercentage };
}

/**
 * Format date nicely
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Truncate long strings
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}
