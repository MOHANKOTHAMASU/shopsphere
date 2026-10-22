// -----------------------------------------------------------------------------
// src/data/category-thresholds.ts
// ShopSphere Category-Calibrated Price Tiers for the Indian E-Commerce Market
// -----------------------------------------------------------------------------

import { CategoryPriceThresholds, PriceTier } from '@/types/pricing';

export const CATEGORY_PRICE_THRESHOLDS: Record<string, CategoryPriceThresholds> = {
  fashion: {
    categorySlug: 'fashion',
    categoryName: 'Fashion',
    budgetMax: 1499,
    midRangeMax: 4999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹1,500)',
    midRangeLabel: 'Mid-Range (₹1,500 – ₹5,000)',
    premiumLabel: 'Premium (Above ₹5,000)',
  },
  mobiles: {
    categorySlug: 'mobiles',
    categoryName: 'Mobiles',
    budgetMax: 14999,
    midRangeMax: 44999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹15,000)',
    midRangeLabel: 'Mid-Range (₹15,000 – ₹45,000)',
    premiumLabel: 'Premium (Above ₹45,000)',
  },
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
  beauty: {
    categorySlug: 'beauty',
    categoryName: 'Beauty',
    budgetMax: 999,
    midRangeMax: 3499,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹1,000)',
    midRangeLabel: 'Mid-Range (₹1,000 – ₹3,500)',
    premiumLabel: 'Premium (Above ₹3,500)',
  },
  'home-appliances': {
    categorySlug: 'home-appliances',
    categoryName: 'Home Appliances',
    budgetMax: 9999,
    midRangeMax: 29999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹10,000)',
    midRangeLabel: 'Mid-Range (₹10,000 – ₹30,000)',
    premiumLabel: 'Premium (Above ₹30,000)',
  },
  'home-kitchen': {
    categorySlug: 'home-kitchen',
    categoryName: 'Home Appliances',
    budgetMax: 9999,
    midRangeMax: 29999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹10,000)',
    midRangeLabel: 'Mid-Range (₹10,000 – ₹30,000)',
    premiumLabel: 'Premium (Above ₹30,000)',
  },
  'food-health': {
    categorySlug: 'food-health',
    categoryName: 'Food & Health',
    budgetMax: 499,
    midRangeMax: 1499,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹500)',
    midRangeLabel: 'Mid-Range (₹500 – ₹1,500)',
    premiumLabel: 'Premium (Above ₹1,500)',
  },
  grocery: {
    categorySlug: 'grocery',
    categoryName: 'Food & Health',
    budgetMax: 499,
    midRangeMax: 1499,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹500)',
    midRangeLabel: 'Mid-Range (₹500 – ₹1,500)',
    premiumLabel: 'Premium (Above ₹1,500)',
  },
  automotive: {
    categorySlug: 'automotive',
    categoryName: 'Automotive Accessories',
    budgetMax: 1499,
    midRangeMax: 4999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹1,500)',
    midRangeLabel: 'Mid-Range (₹1,500 – ₹5,000)',
    premiumLabel: 'Premium (Above ₹5,000)',
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
  furniture: {
    categorySlug: 'furniture',
    categoryName: 'Furniture',
    budgetMax: 4999,
    midRangeMax: 14999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹5,000)',
    midRangeLabel: 'Mid-Range (₹5,000 – ₹15,000)',
    premiumLabel: 'Premium (Above ₹15,000)',
  },
  books: {
    categorySlug: 'books',
    categoryName: 'Books',
    budgetMax: 499,
    midRangeMax: 1999,
    currency: 'INR',
    budgetLabel: 'Budget (Under ₹500)',
    midRangeLabel: 'Mid-Range (₹500 – ₹2,000)',
    premiumLabel: 'Premium (Above ₹2,000)',
  },
  accessories: {
    categorySlug: 'accessories',
    categoryName: 'Fashion Accessories',
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
