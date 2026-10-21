// -----------------------------------------------------------------------------
// src/data/category-thresholds.ts
// ShopSphere Category-Calibrated Price Tiers for the Indian E-Commerce Market
// -----------------------------------------------------------------------------

import { CategoryPriceThresholds, PriceTier } from '@/types/pricing';

export const CATEGORY_PRICE_THRESHOLDS: Record<string, CategoryPriceThresholds> = {
  electronics: {
    categorySlug: 'electronics',
    categoryName: 'Electronics',
    budgetMax: 4999,
    midRangeMax: 24999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹5,000)',
    midRangeLabel: 'Mid-Range (₹5,000 – ₹25,000)',
    premiumLabel: 'Premium (Above ₹25,000)',
  },
  fashion: {
    categorySlug: 'fashion',
    categoryName: 'Fashion & Clothing',
    budgetMax: 1499,
    midRangeMax: 4999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹1,500)',
    midRangeLabel: 'Mid-Range (₹1,500 – ₹5,000)',
    premiumLabel: 'Premium (Above ₹5,000)',
  },
  'home-kitchen': {
    categorySlug: 'home-kitchen',
    categoryName: 'Home & Kitchen',
    budgetMax: 1999,
    midRangeMax: 9999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹2,000)',
    midRangeLabel: 'Mid-Range (₹2,000 – ₹10,000)',
    premiumLabel: 'Premium (Above ₹10,000)',
  },
  beauty: {
    categorySlug: 'beauty',
    categoryName: 'Beauty & Personal Care',
    budgetMax: 999,
    midRangeMax: 3499,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹1,000)',
    midRangeLabel: 'Mid-Range (₹1,000 – ₹3,500)',
    premiumLabel: 'Premium (Above ₹3,500)',
  },
  books: {
    categorySlug: 'books',
    categoryName: 'Books & Stationery',
    budgetMax: 499,
    midRangeMax: 1999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹500)',
    midRangeLabel: 'Mid-Range (₹500 – ₹2,000)',
    premiumLabel: 'Premium (Above ₹2,000)',
  },
  sports: {
    categorySlug: 'sports',
    categoryName: 'Sports & Fitness',
    budgetMax: 1999,
    midRangeMax: 9999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹2,000)',
    midRangeLabel: 'Mid-Range (₹2,000 – ₹10,000)',
    premiumLabel: 'Premium (Above ₹10,000)',
  },
  grocery: {
    categorySlug: 'grocery',
    categoryName: 'Grocery & Daily Essentials',
    budgetMax: 399,
    midRangeMax: 999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹400)',
    midRangeLabel: 'Mid-Range (₹400 – ₹1,000)',
    premiumLabel: 'Premium (Above ₹1,000)',
  },
  accessories: {
    categorySlug: 'accessories',
    categoryName: 'Accessories',
    budgetMax: 1499,
    midRangeMax: 6999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹1,500)',
    midRangeLabel: 'Mid-Range (₹1,500 – ₹7,000)',
    premiumLabel: 'Premium (Above ₹7,000)',
  },
};

const DEFAULT_THRESHOLDS: CategoryPriceThresholds = {
  categorySlug: 'default',
  categoryName: 'All Categories',
  budgetMax: 1999,
  midRangeMax: 9999,
  currency: 'INR',
  budgetLabel: 'Budget (Under ₹2,000)',
  midRangeLabel: 'Mid-Range (₹2,000 – ₹10,000)',
  premiumLabel: 'Premium (Above ₹10,000)',
};

/**
 * Returns the calibrated thresholds for a given category slug
 */
export function getCategoryThresholds(categorySlug?: string): CategoryPriceThresholds {
  if (!categorySlug) return DEFAULT_THRESHOLDS;
  const normalized = categorySlug.toLowerCase().trim();
  return CATEGORY_PRICE_THRESHOLDS[normalized] || DEFAULT_THRESHOLDS;
}

/**
 * Determines whether a product's price falls into budget, mid-range, or premium
 */
export function getPriceTier(price: number, categorySlug?: string): PriceTier {
  const thresholds = getCategoryThresholds(categorySlug);
  if (price <= thresholds.budgetMax) {
    return 'budget';
  }
  if (price <= thresholds.midRangeMax) {
    return 'mid-range';
  }
  return 'premium';
}

/**
 * Returns formatted filter options for the UI
 */
export function getBudgetFilterRanges(categorySlug?: string) {
  const t = getCategoryThresholds(categorySlug);
  return [
    {
      tier: 'budget' as PriceTier,
      label: 'Budget',
      rangeText: `≤ ₹${t.budgetMax.toLocaleString('en-IN')}`,
      min: 0,
      max: t.budgetMax,
    },
    {
      tier: 'mid-range' as PriceTier,
      label: 'Mid-Range',
      rangeText: `₹${(t.budgetMax + 1).toLocaleString('en-IN')} – ₹${t.midRangeMax.toLocaleString('en-IN')}`,
      min: t.budgetMax + 1,
      max: t.midRangeMax,
    },
    {
      tier: 'premium' as PriceTier,
      label: 'Premium',
      rangeText: `> ₹${t.midRangeMax.toLocaleString('en-IN')}`,
      min: t.midRangeMax + 1,
      max: undefined,
    },
  ];
}

/**
 * List all available category thresholds
 */
export function getAllCategoryThresholds(): CategoryPriceThresholds[] {
  return Object.values(CATEGORY_PRICE_THRESHOLDS);
}
