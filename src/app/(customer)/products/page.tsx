import React, { Suspense } from 'react';
import { getProducts, getCategories, getAvailableBrands } from '@/lib/products/queries';
import { ProductsCatalogClient } from './ProductsCatalogClient';
import { ProductSortOption } from '@/types/ecommerce';

interface ProductsPageProps {
  searchParams: Promise<{
    cat?: string;
    q?: string;
    brand?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    minRating?: string;
    inStock?: string;
    deals?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  if (params.q) {
    return {
      title: `Search: "${params.q}" | ShopSphere Marketplace`,
      description: `Explore products matching "${params.q}" on ShopSphere with guaranteed authentic products and fast delivery.`,
    };
  }

  if (params.brand) {
    return {
      title: `${params.brand} Products | ShopSphere`,
      description: `Browse 100% genuine ${params.brand} products with express delivery and official warranty at ShopSphere.`,
    };
  }

  if (params.cat && params.cat !== 'all') {
    const formattedCat = params.cat.replace('-', ' ').toUpperCase();
    return {
      title: `${formattedCat} Collection | ShopSphere`,
      description: `Shop the best deals and curated collection in ${formattedCat} at ShopSphere.`,
    };
  }

  return {
    title: 'Products Catalog | ShopSphere Marketplace',
    description:
      'Browse our entire curated catalog of smartphones, laptops, audio devices, luxury watches, fashion, and home lifestyle products.',
  };
}

async function CatalogServerLoader({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const categorySlug = params.cat && params.cat !== 'all' ? params.cat : undefined;
  const query = params.q ? params.q.trim() : undefined;
  const brand = params.brand && params.brand !== 'all' ? params.brand.trim() : undefined;
  const sortBy = (params.sort || 'featured') as ProductSortOption;
  const page = params.page ? parseInt(params.page, 10) || 1 : 1;
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const minRating = params.minRating ? Number(params.minRating) : undefined;
  const inStockOnly = params.inStock === 'true';
  const dealsOnly = params.deals === 'true';

  // Fetch real products from Supabase / Data Access Layer with full server-side pagination & filtering
  const [paginatedResult, categories, availableBrands] = await Promise.all([
    getProducts({
      categorySlug,
      query,
      brand,
      sortBy,
      page,
      limit: 6, // 6 items per page for clean pagination demonstration
      minPrice,
      maxPrice,
      minRating,
      inStockOnly,
      dealsOnly,
    }),
    getCategories(),
    getAvailableBrands(categorySlug),
  ]);

  return (
    <ProductsCatalogClient
      result={paginatedResult}
      categories={categories}
      availableBrands={availableBrands}
      searchParams={params}
    />
  );
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-4">
          <div className="inline-block w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading ShopSphere Catalog...</p>
          <p className="text-xs text-slate-400">Fetching latest products, prices, and inventory...</p>
        </div>
      }
    >
      <CatalogServerLoader searchParams={searchParams} />
    </Suspense>
  );
}
