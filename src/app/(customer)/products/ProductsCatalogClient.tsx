'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Product, Category, PaginatedResult } from '@/types/ecommerce';
import { ProductCard } from '@/components/product/ProductCard';
import {
  Filter,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  Search,
  Sparkles,
  Layers,
  Tag,
} from 'lucide-react';
import { getBudgetFilterRanges } from '@/data/category-thresholds';
import { PriceTier } from '@/types/pricing';

interface ProductsCatalogClientProps {
  result: PaginatedResult<Product>;
  categories: Category[];
  availableBrands?: { name: string; count: number }[];
  searchParams: {
    cat?: string;
    q?: string;
    brand?: string;
    sort?: string;
    tier?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    deals?: string;
  };
}

export function ProductsCatalogClient({
  result,
  categories,
  availableBrands = [],
  searchParams,
}: ProductsCatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const activeCategory = searchParams.cat || 'all';
  const activeQuery = searchParams.q || '';
  const activeBrand = searchParams.brand || 'all';
  const activeSort = searchParams.sort || 'featured';
  const activeTier = (searchParams.tier && ['budget', 'mid-range', 'premium'].includes(searchParams.tier)
    ? searchParams.tier
    : 'all') as PriceTier | 'all';
  const activePage = Number(searchParams.page) || 1;
  const activeMinRating = searchParams.minRating ? Number(searchParams.minRating) : 0;
  const activeDealsOnly = searchParams.deals === 'true';
  const activeInStockOnly = searchParams.inStock === 'true';
  const activeMinPrice = searchParams.minPrice ? Number(searchParams.minPrice) : 0;
  const activeMaxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : 200000;

  // Local state for interactive slider and manual inputs
  const [localMaxPrice, setLocalMaxPrice] = useState<number>(activeMaxPrice);
  const [inputMinPrice, setInputMinPrice] = useState<string>(activeMinPrice > 0 ? String(activeMinPrice) : '');
  const [inputMaxPrice, setInputMaxPrice] = useState<string>(activeMaxPrice < 200000 ? String(activeMaxPrice) : '');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const budgetFilterRanges = getBudgetFilterRanges(activeCategory);

  // Helper to build URL with updated search params
  const updateParams = (newParams: Record<string, string | number | boolean | null | undefined>) => {
    const params = new URLSearchParams();

    // Preserve existing unless overridden
    if (activeCategory && activeCategory !== 'all') params.set('cat', activeCategory);
    if (activeQuery) params.set('q', activeQuery);
    if (activeBrand && activeBrand !== 'all') params.set('brand', activeBrand);
    if (activeSort && activeSort !== 'featured') params.set('sort', activeSort);
    if (activeTier && activeTier !== 'all') params.set('tier', activeTier);
    if (activeMinRating > 0) params.set('minRating', String(activeMinRating));
    if (activeDealsOnly) params.set('deals', 'true');
    if (activeInStockOnly) params.set('inStock', 'true');
    if (activeMinPrice > 0) params.set('minPrice', String(activeMinPrice));
    if (activeMaxPrice < 200000) params.set('maxPrice', String(activeMaxPrice));
    if (activePage > 1) params.set('page', String(activePage));

    // Apply updates
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === false) {
        params.delete(key);
      } else if (key === 'cat' && val === 'all') {
        params.delete('cat');
      } else if (key === 'brand' && val === 'all') {
        params.delete('brand');
      } else if (key === 'tier' && val === 'all') {
        params.delete('tier');
      } else if (key === 'sort' && val === 'featured') {
        params.delete('sort');
      } else if (key === 'minPrice' && (Number(val) <= 0 || !val)) {
        params.delete('minPrice');
      } else if (key === 'maxPrice' && Number(val) >= 200000) {
        params.delete('maxPrice');
      } else if (key === 'minRating' && Number(val) <= 0) {
        params.delete('minRating');
      } else if (key === 'page' && Number(val) <= 1) {
        params.delete('page');
      } else {
        params.set(key, String(val));
      }
    });

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(targetUrl);
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > result.totalPages || newPage === activePage) return;
    updateParams({ page: newPage });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePriceCommit = () => {
    updateParams({ maxPrice: localMaxPrice, page: 1 });
  };

  const resetAllFilters = () => {
    setLocalMaxPrice(200000);
    setIsMobileFilterOpen(false);
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters =
    activeCategory !== 'all' ||
    (activeBrand !== 'all' && activeBrand !== '') ||
    activeTier !== 'all' ||
    activeQuery.length > 0 ||
    activeDealsOnly ||
    activeInStockOnly ||
    activeMinRating > 0 ||
    activeMaxPrice < 200000 ||
    activeSort !== 'featured';

  // Calculate items range
  const startItem = result.total > 0 ? (result.page - 1) * result.limit + 1 : 0;
  const endItem = Math.min(result.page * result.limit, result.total);

  // Active category object
  const currentCategoryObj = categories.find((c) => c.slug === activeCategory);

  return (
    <div className="py-2 space-y-6">
      {/* Header Banner & Breadcrumb / Search Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/" className="hover:text-indigo-600 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Catalog</span>
            {currentCategoryObj && (
              <>
                <span>/</span>
                <span className="text-indigo-600 font-semibold">{currentCategoryObj.name}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {activeQuery ? (
              <>
                <Search className="w-6 h-6 text-indigo-600" />
                <span>Search results for &ldquo;{activeQuery}&rdquo;</span>
              </>
            ) : currentCategoryObj ? (
              <span>{currentCategoryObj.name}</span>
            ) : activeDealsOnly ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                <span>Flash Deals & Discounts</span>
              </span>
            ) : (
              <span>Explore All Products</span>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Showing <strong className="text-slate-800 font-bold">{startItem}–{endItem}</strong> of{' '}
            <strong className="text-slate-800 font-bold">{result.total}</strong> premium products
            {isPending && <span className="ml-2 text-indigo-600 font-medium animate-pulse">(Updating...)</span>}
          </p>
        </div>

        {/* Top Controls: Mobile Filter Button & Sort Selector */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Filters {hasActiveFilters && '•'}</span>
          </button>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 hidden sm:inline font-medium">Sort by:</span>
            <div className="relative">
              <select
                value={activeSort}
                onChange={(e) => updateParams({ sort: e.target.value, page: 1 })}
                className="h-10 pl-3 pr-8 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-xs cursor-pointer"
              >
                <option value="featured">Featured / Best Match</option>
                <option value="best-value">Best Value (Top Rating & Savings)</option>
                <option value="popularity">Most Popular (Reviews & Rating)</option>
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Customer Rating</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Budget Tier Selector: Customer Budget Selection Before/While Browsing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold tracking-wide uppercase">Shop by Budget:</span>
          <span className="text-xs text-slate-400 hidden md:inline">
            Calibrated for {currentCategoryObj?.name || 'All Categories'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateParams({ tier: 'all', page: 1 })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTier === 'all'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Budgets
          </button>
          {budgetFilterRanges.map((range) => {
            const isSelected = activeTier === range.tier;
            return (
              <button
                key={range.tier}
                type="button"
                onClick={() => updateParams({ tier: isSelected ? 'all' : range.tier, page: 1 })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-xs font-black'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <span>{range.label}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-800' : 'text-slate-400'}`}>
                  ({range.rangeText})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filter Badges Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
          <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
            Active Filters:
          </span>

          {activeCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              <span>Category: {currentCategoryObj?.name || activeCategory}</span>
              <button
                type="button"
                onClick={() => updateParams({ cat: 'all', page: 1 })}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeTier !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-300">
              <Tag className="w-3 h-3 text-amber-600" />
              <span className="capitalize">Tier: {activeTier}</span>
              <button
                type="button"
                onClick={() => updateParams({ tier: 'all', page: 1 })}
                className="hover:text-amber-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeBrand !== 'all' && activeBrand && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              <span>Brand: {activeBrand}</span>
              <button
                type="button"
                onClick={() => updateParams({ brand: null, page: 1 })}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              <span>Query: &ldquo;{activeQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => updateParams({ q: null, page: 1 })}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeMaxPrice < 200000 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 font-semibold">
              <span>Under ₹{activeMaxPrice.toLocaleString('en-IN')}</span>
              <button
                type="button"
                onClick={() => {
                  setLocalMaxPrice(200000);
                  updateParams({ maxPrice: null, page: 1 });
                }}
                className="hover:text-slate-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeMinRating > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
              <span>{activeMinRating}★ & above</span>
              <button
                type="button"
                onClick={() => updateParams({ minRating: null, page: 1 })}
                className="hover:text-amber-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeDealsOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
              <span>Flash Deals</span>
              <button
                type="button"
                onClick={() => updateParams({ deals: null, page: 1 })}
                className="hover:text-rose-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {activeInStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              <span>In Stock Only</span>
              <button
                type="button"
                onClick={() => updateParams({ inStock: null, page: 1 })}
                className="hover:text-emerald-950 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={resetAllFilters}
            className="ml-auto text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      )}

      {/* Main Layout: Desktop Sidebar Filters + Product Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs h-fit sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Filter className="w-4 h-4 text-indigo-600" />
              <span>Catalog Filters</span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Categories List */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Categories</span>
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => updateParams({ cat: 'all', page: 1 })}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className={`text-[10px] ${activeCategory === 'all' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {result.total}
                </span>
              </button>

              {categories.map((cat) => {
                const isSelected = activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => updateParams({ cat: cat.slug, page: 1 })}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {cat.itemCount || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brands Filter List */}
          {availableBrands && availableBrands.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Brands
                </h4>
                {activeBrand !== 'all' && (
                  <button
                    type="button"
                    onClick={() => updateParams({ brand: null, page: 1 })}
                    className="text-[10px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => updateParams({ brand: 'all', page: 1 })}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    activeBrand === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>All Brands</span>
                </button>
                {availableBrands.map(({ name, count }) => {
                  const isSelected = activeBrand === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() =>
                        updateParams({ brand: isSelected ? 'all' : name, page: 1 })
                      }
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      <span
                        className={`text-[10px] font-mono ${
                          isSelected ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                      >
                        ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Tiers (Category-Calibrated) */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Price Tiers</span>
            </h4>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => updateParams({ tier: 'all', page: 1 })}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeTier === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Tiers</span>
              </button>
              {budgetFilterRanges.map((range) => {
                const isSelected = activeTier === range.tier;
                return (
                  <button
                    key={range.tier}
                    type="button"
                    onClick={() => updateParams({ tier: isSelected ? 'all' : range.tier, page: 1 })}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span>{range.label}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {range.rangeText}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Working Price Filter (Min Price, Max Price & Slider) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Price Filter
              </h4>
              {(activeMinPrice > 0 || activeMaxPrice < 200000) && (
                <button
                  type="button"
                  onClick={() => {
                    setInputMinPrice('');
                    setInputMaxPrice('');
                    setLocalMaxPrice(200000);
                    updateParams({ minPrice: null, maxPrice: null, page: 1 });
                  }}
                  className="text-[10px] text-indigo-600 font-semibold hover:underline cursor-pointer"
                >
                  Clear Price
                </button>
              )}
            </div>

            {/* Quick Price Presets */}
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => updateParams({ minPrice: null, maxPrice: 500, page: 1 })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-left border border-slate-200/80 transition-colors cursor-pointer"
              >
                Under ₹500
              </button>
              <button
                type="button"
                onClick={() => updateParams({ minPrice: null, maxPrice: 1000, page: 1 })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-left border border-slate-200/80 transition-colors cursor-pointer"
              >
                Under ₹1,000
              </button>
              <button
                type="button"
                onClick={() => updateParams({ minPrice: null, maxPrice: 5000, page: 1 })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-left border border-slate-200/80 transition-colors cursor-pointer"
              >
                Under ₹5,000
              </button>
              <button
                type="button"
                onClick={() => updateParams({ minPrice: 5000, maxPrice: 15000, page: 1 })}
                className="px-2 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-left border border-slate-200/80 transition-colors cursor-pointer"
              >
                ₹5K – ₹15K
              </button>
            </div>

            {/* Min / Max Inputs */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const min = inputMinPrice ? Number(inputMinPrice) : undefined;
                const max = inputMaxPrice ? Number(inputMaxPrice) : undefined;
                updateParams({ minPrice: min, maxPrice: max, page: 1 });
              }}
              className="flex items-center gap-1.5 pt-1"
            >
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={inputMinPrice}
                  onChange={(e) => setInputMinPrice(e.target.value)}
                  className="w-full h-8 pl-5 pr-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <span className="text-slate-400 text-xs">to</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={inputMaxPrice}
                  onChange={(e) => setInputMaxPrice(e.target.value)}
                  className="w-full h-8 pl-5 pr-1 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="h-8 px-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                Go
              </button>
            </form>

            {/* Price Slider */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Max Slider:</span>
                <span className="font-bold text-indigo-600 font-mono">
                  ₹{localMaxPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="500"
                max="200000"
                step="2500"
                value={localMaxPrice}
                onChange={(e) => {
                  setLocalMaxPrice(Number(e.target.value));
                  setInputMaxPrice(String(e.target.value));
                }}
                onMouseUp={() => updateParams({ maxPrice: localMaxPrice, page: 1 })}
                onTouchEnd={() => updateParams({ maxPrice: localMaxPrice, page: 1 })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>₹500</span>
                <span>₹2,00,000</span>
              </div>
            </div>
          </div>

          {/* Customer Rating Filter */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Customer Rating
            </h4>
            <div className="space-y-1.5">
              {[4, 3, 2].map((stars) => {
                const isSelected = activeMinRating === stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => updateParams({ minRating: isSelected ? null : stars, page: 1 })}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-600">
                      <span>{stars}★ & above</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checkboxes: Deals and In-stock */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={activeDealsOnly}
                onChange={(e) => updateParams({ deals: e.target.checked ? 'true' : null, page: 1 })}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Flash Deals & Discounts</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={activeInStockOnly}
                onChange={(e) =>
                  updateParams({ inStock: e.target.checked ? 'true' : null, page: 1 })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>In Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid and Results Section */}
        <section className="lg:col-span-3 space-y-8">
          {result.items.length === 0 ? (
            /* Useful Empty State */
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
                <PackageOpen className="w-10 h-10 stroke-[1.5]" />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  No matching products found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  We couldn&apos;t find any products matching your current search or active filters.
                  Try loosening your filter criteria or explore our popular categories below.
                </p>
              </div>

              {/* Suggestions / Quick Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm cursor-pointer transition-colors"
                >
                  Clear All Filters
                </button>
                <Link
                  href="/products"
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Browse Full Catalog
                </Link>
              </div>

              {/* Quick Category Badges */}
              <div className="pt-6 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Popular Categories to explore:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => updateParams({ cat: c.slug, q: null, page: 1 })}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {result.items.map((prod, idx) => (
                  <ProductCard key={prod.id} product={prod} priority={idx < 3} />
                ))}
              </div>

              {/* Pagination Controls */}
              {result.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-800">{startItem}–{endItem}</span> of{' '}
                    <span className="font-bold text-slate-800">{result.total}</span> items
                  </div>

                  {/* Page Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePageChange(result.page - 1)}
                      disabled={!result.hasPrevPage}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                      aria-label="Previous Page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Prev</span>
                    </button>

                    {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isActive = pageNum === result.page;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                          }`}
                          aria-label={`Page ${pageNum}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handlePageChange(result.page + 1)}
                      disabled={!result.hasNextPage}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Mobile Drawer Filter */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-5 flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Filter Products</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 py-4 flex-1">
              {/* Category Select */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Category</h4>
                <select
                  value={activeCategory}
                  onChange={(e) => updateParams({ cat: e.target.value, page: 1 })}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="all">All Categories ({result.total})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand Select */}
              {availableBrands && availableBrands.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-2">Brand</h4>
                  <select
                    value={activeBrand}
                    onChange={(e) => updateParams({ brand: e.target.value, page: 1 })}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="all">All Brands</option>
                    {availableBrands.map(({ name, count }) => (
                      <option key={name} value={name}>
                        {name} ({count})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Price Tier Selection */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Price Tier</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateParams({ tier: 'all', page: 1 })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      activeTier === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600 border border-slate-200'
                    }`}
                  >
                    All Tiers
                  </button>
                  {budgetFilterRanges.map((range) => {
                    const isSelected = activeTier === range.tier;
                    return (
                      <button
                        key={range.tier}
                        type="button"
                        onClick={() => updateParams({ tier: isSelected ? 'all' : range.tier, page: 1 })}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Slider */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Max Price:</span>
                  <span className="text-indigo-600 font-mono">
                    ₹{localMaxPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="200000"
                  step="2500"
                  value={localMaxPrice}
                  onChange={(e) => setLocalMaxPrice(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Rating */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Minimum Rating</h4>
                <div className="space-y-1">
                  {[4, 3, 2].map((stars) => (
                    <button
                      key={stars}
                      type="button"
                      onClick={() =>
                        updateParams({ minRating: activeMinRating === stars ? null : stars, page: 1 })
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${
                        activeMinRating === stars
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'text-slate-600 bg-slate-50'
                      }`}
                    >
                      {stars}★ & above
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeDealsOnly}
                    onChange={(e) =>
                      updateParams({ deals: e.target.checked ? 'true' : null, page: 1 })
                    }
                  />
                  <span>Flash Deals & Discounts</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeInStockOnly}
                    onChange={(e) =>
                      updateParams({ inStock: e.target.checked ? 'true' : null, page: 1 })
                    }
                  />
                  <span>In Stock items only</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex-1 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePriceCommit();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
