import { Product } from '@/types/ecommerce';
import { COMPLETE_SEED_PRODUCTS_400 } from './seed-products-data';
import { SUPPLEMENTARY_SEED_PRODUCTS } from './seed-products-supplement';

/**
 * -----------------------------------------------------------------------------
 * SHOPSPHERE EXPANDED & CALIBRATED CATALOG
 * -----------------------------------------------------------------------------
 * Official 10 Categories with deep product coverage:
 * 1. Fashion
 * 2. Mobiles
 * 3. Electronics
 * 4. Beauty
 * 5. Home Appliances
 * 6. Food & Health
 * 7. Automotive Accessories
 * 8. Sports & Fitness
 * 9. Furniture
 * 10. Books
 * -----------------------------------------------------------------------------
 */

function normalizeProductCategory(p: Product): Product {
  const lowerTitle = p.title.toLowerCase();
  const lowerTags = (p.tags || []).map((t) => t.toLowerCase());

  // Move smartphones from electronics to mobiles
  if (
    p.categorySlug === 'electronics' &&
    (lowerTitle.includes('smartphone') ||
      lowerTitle.includes('galaxy s') ||
      lowerTitle.includes('iphone') ||
      lowerTitle.includes('mobile') ||
      lowerTags.includes('smartphone'))
  ) {
    return {
      ...p,
      category: 'Mobiles',
      categorySlug: 'mobiles',
      tags: Array.from(new Set([...(p.tags || []), 'mobile', 'mobiles', 'smartphone', 'phone', '5g'])),
    };
  }

  // Map grocery to Food & Health
  if (p.categorySlug === 'grocery' || p.categorySlug === 'grocery-daily-essentials') {
    return {
      ...p,
      category: 'Food & Health',
      categorySlug: 'food-health',
      tags: Array.from(new Set([...(p.tags || []), 'food-health', 'food & health', 'grocery'])),
    };
  }

  // Map home-kitchen to Home Appliances
  if (p.categorySlug === 'home-kitchen' || p.categorySlug === 'home-living') {
    return {
      ...p,
      category: 'Home Appliances',
      categorySlug: 'home-appliances',
      tags: Array.from(new Set([...(p.tags || []), 'home-appliances', 'home appliances', 'appliances', 'kitchen'])),
    };
  }

  // Map accessories to Fashion
  if (p.categorySlug === 'accessories') {
    return {
      ...p,
      category: 'Fashion',
      categorySlug: 'fashion',
      tags: Array.from(new Set([...(p.tags || []), 'fashion', 'accessories'])),
    };
  }

  return p;
}

const normalizedBase = COMPLETE_SEED_PRODUCTS_400.map(normalizeProductCategory);

// Dedup supplementary + base by id, slug, and verified unique image key
const seenIds = new Set<string>();
const seenImages = new Set<string>();
const unifiedProducts: Product[] = [];

for (const p of [...SUPPLEMENTARY_SEED_PRODUCTS, ...normalizedBase]) {
  // Discard any legacy product containing known mismatched/broken images
  if (
    p.thumbnail &&
    (p.thumbnail.includes('photo-1584269600464') ||
      p.thumbnail.includes('photo-1580481077195') ||
      (p.categorySlug === 'home-appliances' && p.thumbnail.includes('photo-1571175443880')))
  ) {
    continue;
  }

  const imgMatch = p.thumbnail ? p.thumbnail.match(/photo-([a-zA-Z0-9-]+)/) : null;
  const imgKey = imgMatch ? imgMatch[1] : (p.thumbnail || p.id);

  if (!seenIds.has(p.id) && !seenIds.has(p.slug) && !seenImages.has(imgKey)) {
    seenIds.add(p.id);
    seenIds.add(p.slug);
    seenImages.add(imgKey);
    unifiedProducts.push(p);
  }
}

export const DEVELOPMENT_SEED_PRODUCTS: Product[] = unifiedProducts;

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
