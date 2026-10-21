import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getProducts } from '@/lib/products/queries';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductDetailsActions } from './ProductDetailsActions';
import { PriceDisplay } from '@/components/common/PriceDisplay';
import { RatingStars } from '@/components/common/RatingStars';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductReviewsSection } from '@/components/product/ProductReviewsSection';
import { ProductAlternativesSection } from '@/components/product/ProductAlternativesSection';
import { getProductAlternativeComparisonAction } from '@/lib/pricing/actions';
import { generateRealisticCompetitorBenchmarks } from '@/lib/pricing/pricing-engine';
import {
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Product Not Found | ShopSphere' };
  }

  return {
    title: `${product.title} | ShopSphere`,
    description: product.shortDescription,
  };
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Related products & in-stock alternatives from the same category
  const [relatedResult, alternativesResult, comparisonResult] = await Promise.all([
    getProducts({
      categorySlug: product.categorySlug,
      limit: 8,
    }),
    getProducts({
      categorySlug: product.categorySlug,
      inStockOnly: true,
      limit: 8,
    }),
    getProductAlternativeComparisonAction(product.slug),
  ]);

  const competitorBenchmarks = generateRealisticCompetitorBenchmarks(product);

  const relatedProducts = relatedResult.items
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const inStockAlternatives = alternativesResult.items
    .filter((p) => p.id !== product.id && p.stockQuantity > 0)
    .slice(0, 4);

  const isUnavailable = product.stockQuantity <= 0;

  return (
    <div className="py-2 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <Link href="/products" className="hover:text-indigo-600 transition-colors">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <Link
          href={`/products?cat=${product.categorySlug}`}
          className="hover:text-indigo-600 transition-colors"
        >
          {product.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-md">
          {product.title}
        </span>
      </nav>

      {/* Main Product Showcase Grid (Gallery + Details Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Left Column: Image Gallery (5 cols on lg) */}
        <div className="lg:col-span-6">
          <ProductGallery images={product.images} title={product.title} />
        </div>

        {/* Right Column: Information, Pricing & Purchase Actions (7 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & Badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {product.brand}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              {product.title}
            </h1>

            {/* Rating & Reviews Count */}
            <div className="flex items-center gap-3">
              <RatingStars
                rating={product.rating}
                reviewCount={product.reviewCount}
                size="md"
              />
              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                Verified Seller
              </span>
            </div>

            {/* Pricing Section */}
            <div className="pt-3 pb-4 border-y border-slate-100">
              <PriceDisplay
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                size="xl"
              />
              <p className="text-xs text-slate-400 mt-1">
                Inclusive of all taxes. Free delivery on this item.
              </p>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-2">
              {product.stockQuantity > 0 ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700">
                    In Stock ({product.stockQuantity} units available)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-rose-600">Currently Out of Stock</span>
                </>
              )}
            </div>

            {/* Short Description */}
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Key Features List */}
            {product.features && product.features.length > 0 && (
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Key Highlights
                </h3>
                <ul className="space-y-1.5">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Interactive Actions (Quantity, Add to Cart, Buy Now, Wishlist) */}
          <ProductDetailsActions product={product} />

          {/* Value Props Strip */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Fast 2-3 Day Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
              <span>7-Day Replacement</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1 Year Warranty</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Competitor Benchmarks & Compare Alternatives Section */}
      {comparisonResult.success && comparisonResult.comparison && (
        <ProductAlternativesSection
          comparison={comparisonResult.comparison}
          competitors={competitorBenchmarks}
        />
      )}

      {/* Specifications & Customer Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Specifications Table (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <span>Technical Specifications</span>
          </h2>

          <div className="space-y-6">
            {product.specifications.map((specGroup, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">
                  {specGroup.group}
                </h3>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {specGroup.attributes.map((attr, aIdx) => (
                    <div
                      key={aIdx}
                      className="grid grid-cols-3 p-3 text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-medium text-slate-500">{attr.name}</span>
                      <span className="col-span-2 font-semibold text-slate-800">{attr.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews & Feedback */}
        <div className="lg:col-span-5">
          <ProductReviewsSection
            productId={product.id}
            productTitle={product.title}
            initialRating={product.rating}
            initialReviewCount={product.reviewCount}
          />
        </div>
      </div>

      {/* Unavailable / In-Stock Alternatives Section */}
      {isUnavailable && inStockAlternatives.length > 0 && (
        <div className="my-10 p-6 sm:p-8 bg-amber-50/70 border border-amber-200/80 rounded-3xl space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded-md">
              In-Stock Alternatives
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
              Recommended Alternatives Available Now
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              This product is currently out of stock. Customers exploring this item also purchase these available {product.category} alternatives:
            </p>
          </div>
          <ProductGrid products={inStockAlternatives} />
        </div>
      )}

      {/* Recommended Related Products */}
      {relatedProducts.length > 0 && (
        <div className="my-10">
          <div className="mb-6">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Similar Items
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              You Might Also Like
            </h2>
          </div>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
}
