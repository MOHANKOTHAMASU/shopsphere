// -----------------------------------------------------------------------------
// src/types/pricing.ts
// ShopSphere Competitive Pricing, Budget Tiers & Profitability Definitions
// -----------------------------------------------------------------------------

export type CompetitorName =
  | 'Amazon India'
  | 'Flipkart'
  | 'Official Brand Store'
  | 'Authorized Retailer';

export type VerificationStatus =
  | 'verified'
  | 'manual_benchmark'
  | 'unavailable'
  | 'api_feed';

export type PriceTier = 'budget' | 'mid-range' | 'premium';

export interface CompetitorComparison {
  competitorName: CompetitorName;
  productUrl?: string;
  sellingPrice: number;
  referencePrice?: number;
  deliveryCharges?: number;
  inStock: boolean;
  lastChecked: string;
  verificationStatus: VerificationStatus;
  sourceLabel: string;
  modelOrSkuMatch: string;
  notes?: string;
}

export interface CategoryPriceThresholds {
  categorySlug: string;
  categoryName: string;
  budgetMax: number;     // Products <= budgetMax are 'budget'
  midRangeMax: number;   // Products > budgetMax and <= midRangeMax are 'mid-range'
  // Products > midRangeMax are 'premium'
  currency: string;
  budgetLabel: string;
  midRangeLabel: string;
  premiumLabel: string;
}

export interface ProductPricingMeta {
  supplierCost: number;             // Private admin cost from manufacturer/distributor
  minPermittedPrice: number;        // Absolute floor: cost + minimum required margin
  targetMarginPercent: number;      // Desired gross margin percentage (e.g., 20%)
  suggestedPrice?: number;          // System suggested price based on competitor benchmarks
  priceReviewRequired: boolean;     // Flagged if current price > competitor or < min floor
  priceReviewReason?: string;       // Explanation of review flag
  competitors: CompetitorComparison[];
  lastPriceChangeAt?: string;
  lastPriceChangedBy?: string;
}

export interface PriceChangeAuditEntry {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  oldPrice: number;
  newPrice: number;
  supplierCost: number;
  marginPercent: number;
  adminEmail: string;
  reason: string;
  timestamp: string;
  competitorBenchmark?: number;
}

export interface ProductAlternativeComparison {
  currentProduct: {
    id: string;
    title: string;
    brand: string;
    price: number;
    priceTier: PriceTier;
    rating: number;
    stockQuantity: number;
    thumbnail: string;
    keySpecs: Record<string, string>;
  };
  alternatives: Array<{
    id: string;
    slug: string;
    title: string;
    brand: string;
    price: number;
    priceTier: PriceTier;
    priceDifference: number; // current - alternative (positive = savings)
    priceDifferencePercent: number;
    isBestBudgetOption: boolean;
    recommendationReason: string;
    rating: number;
    stockQuantity: number;
    thumbnail: string;
    warranty: string;
    keySpecs: Record<string, string>;
    competitorBenchmark?: {
      competitor: string;
      price: number;
    };
  }>;
}
