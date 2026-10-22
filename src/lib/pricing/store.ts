// -----------------------------------------------------------------------------
// src/lib/pricing/store.ts
// ShopSphere Admin Pricing Store & Audit Trail Manager
// -----------------------------------------------------------------------------

import {
  ProductPricingMeta,
  PriceChangeAuditEntry,
  PriceTier,
} from '@/types/pricing';
import {
  analyzeProductPricing,
  calculateMinPermittedPrice,
  PricingAnalysisResult,
} from './pricing-engine';
import { memoryProducts } from '@/lib/admin/store';
import { DEVELOPMENT_SEED_PRODUCTS } from '@/data/seed-products';
import { Product } from '@/types/ecommerce';

// Persistent in-memory storage for admin pricing overrides
const productPricingMetaMap = new Map<string, Partial<ProductPricingMeta>>();
const priceChangeAuditTrail: PriceChangeAuditEntry[] = [
  {
    id: 'audit-init-001',
    productId: 'prod-elec-001',
    productTitle: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    sku: 'ELEC-SON-001',
    oldPrice: 28990,
    newPrice: 26990,
    supplierCost: 19500,
    marginPercent: 27.8,
    adminEmail: 'kmvsubbarao28@gmail.com',
    reason: 'Approved competitive price drop matching festive promotional benchmark with 27.8% margin preserved.',
    timestamp: '2026-10-20T11:45:00Z',
    competitorBenchmark: 28990,
  },
];

/**
 * Retrieves all products currently in memory or seed
 */
function getActiveProducts(): Product[] {
  if (memoryProducts.length > 0) {
    return memoryProducts;
  }
  return DEVELOPMENT_SEED_PRODUCTS;
}

export interface PricingDashboardItem extends PricingAnalysisResult {
  productTitle: string;
  category: string;
  categorySlug: string;
  stockQuantity: number;
  thumbnail: string;
}

export interface PricingDashboardFilterOptions {
  categorySlug?: string;
  priceTier?: PriceTier;
  onlyReviewRequired?: boolean;
  onlyPricedAboveCompetitor?: boolean;
  searchQuery?: string;
}

/**
 * Returns complete pricing dashboard analysis for store administrators
 */
export async function getPricingDashboardData(
  filters: PricingDashboardFilterOptions = {}
): Promise<{
  items: PricingDashboardItem[];
  summary: {
    totalProducts: number;
    requiresReviewCount: number;
    shopSphereCheapestCount: number;
    averageMarginPercent: number;
  };
  auditTrail: PriceChangeAuditEntry[];
}> {
  const products = getActiveProducts();
  const items: PricingDashboardItem[] = [];

  let totalMargin = 0;
  let requiresReviewCount = 0;
  let shopSphereCheapestCount = 0;

  for (const product of products) {
    const meta = productPricingMetaMap.get(product.id);
    const analysis = analyzeProductPricing(product, meta);

    const item: PricingDashboardItem = {
      ...analysis,
      productTitle: product.title,
      category: product.category,
      categorySlug: product.categorySlug || 'general',
      stockQuantity: product.stockQuantity,
      thumbnail: product.thumbnail || product.images?.[0] || '',
    };

    if (item.priceReviewRequired) {
      requiresReviewCount++;
    }
    if (item.isShopSphereCheapest) {
      shopSphereCheapestCount++;
    }
    totalMargin += item.currentMarginPercent;

    // Apply filters
    if (filters.categorySlug && filters.categorySlug !== 'all' && item.categorySlug !== filters.categorySlug) {
      continue;
    }
    if (filters.priceTier && item.priceTier !== filters.priceTier) {
      continue;
    }
    if (filters.onlyReviewRequired && !item.priceReviewRequired) {
      continue;
    }
    if (filters.onlyPricedAboveCompetitor && (item.priceDifferenceFromLowestCompetitor ?? 0) <= 0) {
      continue;
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        item.productTitle.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      if (!match) continue;
    }

    items.push(item);
  }

  const averageMarginPercent = products.length > 0 ? Math.round((totalMargin / products.length) * 10) / 10 : 0;

  return {
    items,
    summary: {
      totalProducts: products.length,
      requiresReviewCount,
      shopSphereCheapestCount,
      averageMarginPercent,
    },
    auditTrail: [...priceChangeAuditTrail].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  };
}

/**
 * Approve a suggested price change or set a custom price with full safety checks
 */
export async function approvePriceChange(params: {
  productId: string;
  newPrice: number;
  adminEmail: string;
  reason?: string;
}): Promise<{
  success: boolean;
  message: string;
  auditEntry?: PriceChangeAuditEntry;
}> {
  const products = getActiveProducts();
  const productIndex = products.findIndex((p) => p.id === params.productId);

  if (productIndex === -1) {
    return { success: false, message: `Product ${params.productId} not found.` };
  }

  const product = products[productIndex];
  const oldPrice = product.price;
  const newPrice = Math.round(params.newPrice);

  const existingMeta = productPricingMetaMap.get(product.id);
  const supplierCost = existingMeta?.supplierCost || Math.round(newPrice * 0.68);
  const minFloor = existingMeta?.minPermittedPrice || calculateMinPermittedPrice(supplierCost);

  // Non-negotiable safety guardrail
  if (newPrice < minFloor) {
    return {
      success: false,
      message: `REJECTED BY SAFETY GUARDRAIL: Requested price ₹${newPrice.toLocaleString('en-IN')} is below the minimum permitted price floor ₹${minFloor.toLocaleString('en-IN')} (Supplier Cost ₹${supplierCost.toLocaleString('en-IN')}). Store policy forbids selling at an operational loss.`,
    };
  }

  // Update in-memory product price
  product.price = newPrice;
  if (memoryProducts.length > 0) {
    const memIdx = memoryProducts.findIndex((p) => p.id === params.productId);
    if (memIdx !== -1) {
      memoryProducts[memIdx].price = newPrice;
    }
  }

  const marginPercent = Math.round(((newPrice - supplierCost) / newPrice) * 1000) / 10;

  // Record in audit log
  const auditEntry: PriceChangeAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productTitle: product.title,
    sku: product.sku,
    oldPrice,
    newPrice,
    supplierCost,
    marginPercent,
    adminEmail: params.adminEmail || 'admin@shopsphere.in',
    reason: params.reason || `Price manually reviewed and approved by administrator.`,
    timestamp: new Date().toISOString(),
  };

  priceChangeAuditTrail.push(auditEntry);

  // Update metadata
  productPricingMetaMap.set(product.id, {
    ...existingMeta,
    supplierCost,
    minPermittedPrice: minFloor,
    priceReviewRequired: false,
    priceReviewReason: 'Recently reviewed and verified by admin.',
    lastPriceChangeAt: auditEntry.timestamp,
    lastPriceChangedBy: auditEntry.adminEmail,
  });

  return {
    success: true,
    message: `Price successfully updated from ₹${oldPrice.toLocaleString('en-IN')} to ₹${newPrice.toLocaleString('en-IN')} with ${marginPercent}% gross margin.`,
    auditEntry,
  };
}

/**
 * Reject a price suggestion and dismiss review flag
 */
export async function rejectPriceChange(params: {
  productId: string;
  adminEmail: string;
  reason: string;
}): Promise<{ success: boolean; message: string }> {
  const existingMeta = productPricingMetaMap.get(params.productId);
  productPricingMetaMap.set(params.productId, {
    ...existingMeta,
    supplierCost: existingMeta?.supplierCost || 0,
    minPermittedPrice: existingMeta?.minPermittedPrice || 0,
    targetMarginPercent: existingMeta?.targetMarginPercent || 22,
    competitors: existingMeta?.competitors || [],
    priceReviewRequired: false,
    priceReviewReason: `Suggested change rejected by ${params.adminEmail}: ${params.reason}`,
  });

  return {
    success: true,
    message: 'Suggested price change dismissed.',
  };
}

/**
 * Configure supplier cost and target margin (Admin-only private action)
 */
export async function updateSupplierCost(params: {
  productId: string;
  supplierCost: number;
  targetMarginPercent?: number;
  adminEmail: string;
}): Promise<{ success: boolean; message: string }> {
  if (params.supplierCost <= 0) {
    return { success: false, message: 'Supplier cost must be greater than zero.' };
  }

  const existingMeta = productPricingMetaMap.get(params.productId);
  const minFloor = calculateMinPermittedPrice(params.supplierCost);

  productPricingMetaMap.set(params.productId, {
    ...existingMeta,
    supplierCost: Math.round(params.supplierCost),
    minPermittedPrice: minFloor,
    targetMarginPercent: params.targetMarginPercent || 22,
    competitors: existingMeta?.competitors || [],
    priceReviewRequired: false,
  });

  return {
    success: true,
    message: `Supplier cost set to ₹${params.supplierCost.toLocaleString('en-IN')}. Minimum price floor calculated as ₹${minFloor.toLocaleString('en-IN')}.`,
  };
}
