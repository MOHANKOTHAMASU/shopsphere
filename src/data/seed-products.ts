import { Product } from '@/types/ecommerce';
import { COMPLETE_SEED_PRODUCTS_400 } from './seed-products-data';

/**
 * -----------------------------------------------------------------------------
 * SHOPSPHERE EXPANDED CATALOG (416 DISTINCT PRODUCTS)
 * -----------------------------------------------------------------------------
 * 8 Categories with at least 50 products each:
 * 1. Electronics (52 products)
 * 2. Fashion & Clothing (52 products)
 * 3. Home & Kitchen (52 products)
 * 4. Beauty & Personal Care (52 products)
 * 5. Books & Stationery (52 products)
 * 6. Sports & Fitness (52 products)
 * 7. Grocery & Daily Essentials (52 products)
 * 8. Accessories (52 products)
 * -----------------------------------------------------------------------------
 */

export const DEVELOPMENT_SEED_PRODUCTS: Product[] = COMPLETE_SEED_PRODUCTS_400;

export function getDealSeedProducts(limit = 4): Product[] {
  return DEVELOPMENT_SEED_PRODUCTS.filter((p) => p.isDealOfTheDay || p.discountPercent >= 20).slice(0, limit);
}

export function getFeaturedSeedProducts(limit = 8): Product[] {
  return DEVELOPMENT_SEED_PRODUCTS.filter((p) => p.isFeatured).slice(0, limit);
}

export function getBestSellerSeedProducts(limit = 8): Product[] {
  return DEVELOPMENT_SEED_PRODUCTS.filter((p) => p.isBestSeller).slice(0, limit);
}

export function getSeedProductBySlug(slug: string): Product | undefined {
  return DEVELOPMENT_SEED_PRODUCTS.find((p) => p.slug === slug || p.id === slug);
}
