// -----------------------------------------------------------------------------
// src/lib/pricing/actions.ts
// ShopSphere Pricing Server Actions (Admin Protected & Customer Comparison)
// -----------------------------------------------------------------------------

'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/auth/admin-guard';
import {
  getPricingDashboardData,
  approvePriceChange,
  rejectPriceChange,
  updateSupplierCost,
  PricingDashboardFilterOptions,
} from './store';
import { ProductAlternativeComparison } from '@/types/pricing';
import { getProducts, getProductBySlug } from '@/lib/products/queries';
import { getPriceTier } from '@/data/category-thresholds';
import { generateRealisticCompetitorBenchmarks } from './pricing-engine';

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Safe when invoked in non-HTTP contexts
  }
}

/**
 * ADMIN ONLY: Retrieve pricing intelligence dashboard
 */
export async function getAdminPricingDashboardAction(
  filters: PricingDashboardFilterOptions = {}
) {
  try {
    const admin = await assertAdmin();
    const data = await getPricingDashboardData(filters);
    return {
      success: true,
      adminEmail: admin.adminEmail,
      ...data,
    };
  } catch (err: unknown) {
    return {
      success: false,
      adminEmail: '',
      error: (err as Error).message,
      items: [],
      summary: {
        totalProducts: 0,
        requiresReviewCount: 0,
        shopSphereCheapestCount: 0,
        averageMarginPercent: 0,
      },
      auditTrail: [],
    };
  }
}

/**
 * ADMIN ONLY: Approve suggested price change or apply custom validated price
 */
export async function approvePriceChangeAction(params: {
  productId: string;
  newPrice: number;
  reason?: string;
}) {
  try {
    const admin = await assertAdmin();
    const result = await approvePriceChange({
      productId: params.productId,
      newPrice: params.newPrice,
      adminEmail: admin.adminEmail,
      reason: params.reason,
    });

    if (result.success) {
      safeRevalidate('/admin/pricing', 'page');
      safeRevalidate('/admin/products', 'page');
      safeRevalidate('/products', 'page');
      safeRevalidate('/', 'page');
    }

    return result;
  } catch (err: unknown) {
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}

/**
 * ADMIN ONLY: Dismiss/reject suggested price adjustment
 */
export async function rejectPriceChangeAction(params: {
  productId: string;
  reason: string;
}) {
  try {
    const admin = await assertAdmin();
    const result = await rejectPriceChange({
      productId: params.productId,
      adminEmail: admin.adminEmail,
      reason: params.reason,
    });

    safeRevalidate('/admin/pricing', 'page');
    return result;
  } catch (err: unknown) {
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}

/**
 * ADMIN ONLY: Update private wholesale supplier cost & target margin
 */
export async function updateSupplierCostAction(params: {
  productId: string;
  supplierCost: number;
  targetMarginPercent?: number;
}) {
  try {
    const admin = await assertAdmin();
    const result = await updateSupplierCost({
      productId: params.productId,
      supplierCost: params.supplierCost,
      targetMarginPercent: params.targetMarginPercent,
      adminEmail: admin.adminEmail,
    });

    safeRevalidate('/admin/pricing', 'page');
    return result;
  } catch (err: unknown) {
    return {
      success: false,
      message: (err as Error).message,
    };
  }
}

/**
 * PUBLIC / CUSTOMER-SAFE: Generate side-by-side alternative comparison
 * Computes price differences, verified competitor benchmarks, and data-backed "Best Budget Option"
 * NEVER leaks supplier cost or internal profit margins!
 */
export async function getProductAlternativeComparisonAction(
  productSlugOrId: string
): Promise<{
  success: boolean;
  comparison?: ProductAlternativeComparison;
  error?: string;
}> {
  try {
    const product = await getProductBySlug(productSlugOrId);
    if (!product) {
      return { success: false, error: 'Target product not found.' };
    }

    const categorySlug = product.categorySlug || 'electronics';
    const currentPriceTier = getPriceTier(product.price, categorySlug);

    // Fetch related products in the same category
    const categoryResult = await getProducts({
      categorySlug,
      limit: 12,
    });

    // Filter out the current product and pick up to 3 best alternatives
    const candidates = (categoryResult.items || [])
      .filter((p) => p.id !== product.id && p.slug !== product.slug)
      .slice(0, 3);

    // Extract key specifications helper
    const extractKeySpecs = (prod: typeof product): Record<string, string> => {
      const specs: Record<string, string> = {};
      if (prod.specifications && prod.specifications.length > 0) {
        for (const group of prod.specifications) {
          for (const attr of group.attributes) {
            if (['Brand', 'Model / Edition', 'Category', 'Warranty', 'Connectivity', 'Battery Life'].includes(attr.name)) {
              specs[attr.name] = attr.value;
            }
          }
        }
      }
      if (!specs['Brand']) specs['Brand'] = prod.brand || 'ShopSphere';
      if (!specs['Category']) specs['Category'] = prod.category;
      return specs;
    };

    // Determine Best Budget Option if an alternative offers >= 20% savings with >= 4.0 rating
    let bestBudgetIndex = -1;
    let maxSavingsPercent = 0;

    candidates.forEach((cand, idx) => {
      if (cand.price < product.price && cand.isAvailable && cand.stockQuantity > 0) {
        const savingsPercent = Math.round(((product.price - cand.price) / product.price) * 100);
        if (savingsPercent >= 20 && savingsPercent > maxSavingsPercent && (cand.rating || 0) >= 4.0) {
          maxSavingsPercent = savingsPercent;
          bestBudgetIndex = idx;
        }
      }
    });

    const alternatives = candidates.map((cand, idx) => {
      const priceDiff = product.price - cand.price;
      const priceDiffPercent = Math.round((Math.abs(priceDiff) / product.price) * 100);
      const isBestBudgetOption = idx === bestBudgetIndex;

      let recommendationReason = 'Equivalent category alternative with verified specifications.';
      if (isBestBudgetOption) {
        recommendationReason = `Save ₹${priceDiff.toLocaleString('en-IN')} (${priceDiffPercent}% lower) with reliable ${cand.rating}★ rating and verified manufacturer warranty.`;
      } else if (priceDiff > 0) {
        recommendationReason = `Affordable choice: ₹${priceDiff.toLocaleString('en-IN')} less expensive.`;
      } else if (priceDiff < 0) {
        recommendationReason = `Premium upgrade: +₹${Math.abs(priceDiff).toLocaleString('en-IN')} for advanced specifications.`;
      }

      // Competitor benchmark for candidate
      const candComps = generateRealisticCompetitorBenchmarks(cand);
      const lowestVerified = candComps.find(
        (c) => c.inStock && c.verificationStatus === 'verified' && c.sellingPrice > 0
      );

      return {
        id: cand.id,
        slug: cand.slug,
        title: cand.title,
        brand: cand.brand || 'ShopSphere',
        price: cand.price,
        priceTier: getPriceTier(cand.price, categorySlug),
        priceDifference: priceDiff,
        priceDifferencePercent: priceDiffPercent,
        isBestBudgetOption,
        recommendationReason,
        rating: cand.rating || 4.2,
        stockQuantity: cand.stockQuantity,
        thumbnail: cand.thumbnail || cand.images?.[0] || '',
        warranty: '1 Year Manufacturer Guarantee',
        keySpecs: extractKeySpecs(cand),
        competitorBenchmark: lowestVerified
          ? {
              competitor: lowestVerified.competitorName,
              price: lowestVerified.sellingPrice,
            }
          : undefined,
      };
    });

    const currentKeySpecs = extractKeySpecs(product);

    return {
      success: true,
      comparison: {
        currentProduct: {
          id: product.id,
          title: product.title,
          brand: product.brand || 'ShopSphere',
          price: product.price,
          priceTier: currentPriceTier,
          rating: product.rating || 4.3,
          stockQuantity: product.stockQuantity,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          keySpecs: currentKeySpecs,
        },
        alternatives,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}
