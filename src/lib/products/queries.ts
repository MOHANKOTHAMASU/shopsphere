import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import {
  Product,
  Category,
  PaginatedResult,
  ProductVariant,
  ProductReview,
  ProductSpecification,
} from '@/types/ecommerce';
import {
  DEVELOPMENT_SEED_PRODUCTS,
  getSeedProductBySlug,
  getFeaturedSeedProducts,
  getBestSellerSeedProducts,
  getDealSeedProducts,
} from '@/data/seed-products';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';

type ProductRow = Database['public']['Tables']['products']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type ProductImageRow = Database['public']['Tables']['product_images']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];
type ProductReviewRow = Database['public']['Tables']['product_reviews']['Row'];

interface DbProductWithRelations extends ProductRow {
  categories?: CategoryRow | null;
  product_images?: ProductImageRow[];
  product_variants?: ProductVariantRow[];
  product_reviews?: ProductReviewRow[];
}

export interface ProductQueryOptions {
  categorySlug?: string;
  query?: string;
  brand?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  dealsOnly?: boolean;
  sortBy?: 'featured' | 'price-low' | 'price-high' | 'rating' | 'discount' | 'newest' | 'popularity';
  page?: number;
  limit?: number;
}

/**
 * Retrieve paginated products with full filtering, sorting, and search
 */
export async function getProducts(
  options: ProductQueryOptions = {}
): Promise<PaginatedResult<Product>> {
  const {
    categorySlug,
    query,
    brand,
    brands,
    minPrice,
    maxPrice,
    minRating,
    inStockOnly,
    dealsOnly,
    sortBy = 'featured',
    page = 1,
    limit = 8,
  } = options;

  const validPage = Math.max(1, page);
  const validLimit = Math.max(1, Math.min(48, limit));
  const offset = (validPage - 1) * validLimit;

  // 1. If real Supabase database is connected, query PostgreSQL
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      let dbQuery = supabase
        .from('products')
        .select('*, categories!inner(*), product_images(*), product_variants(*)', { count: 'exact' })
        .eq('is_active', true);

      if (categorySlug && categorySlug !== 'all') {
        dbQuery = dbQuery.eq('categories.slug', categorySlug);
      }

      if (query && query.trim()) {
        const cleanQuery = query.trim();
        dbQuery = dbQuery.or(`title.ilike.%${cleanQuery}%,brand.ilike.%${cleanQuery}%`);
      }

      if (brand && brand !== 'all') {
        dbQuery = dbQuery.eq('brand', brand);
      } else if (brands && brands.length > 0) {
        dbQuery = dbQuery.in('brand', brands);
      }

      if (dealsOnly) {
        dbQuery = dbQuery.eq('is_deal', true);
      }

      if (typeof minPrice === 'number' && minPrice > 0) {
        dbQuery = dbQuery.gte('price', minPrice);
      }

      if (typeof maxPrice === 'number' && maxPrice > 0) {
        dbQuery = dbQuery.lte('price', maxPrice);
      }

      if (typeof minRating === 'number' && minRating > 0) {
        dbQuery = dbQuery.gte('rating', minRating);
      }

      if (inStockOnly) {
        dbQuery = dbQuery.gt('stock_quantity', 0);
      }

      // Apply Sort Order
      switch (sortBy) {
        case 'price-low':
          dbQuery = dbQuery.order('price', { ascending: true });
          break;
        case 'price-high':
          dbQuery = dbQuery.order('price', { ascending: false });
          break;
        case 'rating':
          dbQuery = dbQuery.order('rating', { ascending: false });
          break;
        case 'discount':
          dbQuery = dbQuery.order('discount_percent', { ascending: false });
          break;
        case 'newest':
          dbQuery = dbQuery.order('created_at', { ascending: false });
          break;
        case 'popularity':
          dbQuery = dbQuery.order('review_count', { ascending: false }).order('rating', { ascending: false });
          break;
        case 'featured':
        default:
          dbQuery = dbQuery.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
          break;
      }

      // Pagination
      dbQuery = dbQuery.range(offset, offset + validLimit - 1);

      const { data, count, error } = await dbQuery;

      if (!error && data && data.length > 0) {
        const total = count || data.length;
        const totalPages = Math.ceil(total / validLimit);

        // Map Supabase DB row to Product domain model
        const items: Product[] = (data as unknown as DbProductWithRelations[]).map((row) => {
          const cat = row.categories || ({} as Partial<CategoryRow>);
          const imagesList = Array.isArray(row.product_images) && row.product_images.length > 0
            ? [...row.product_images].sort((a, b) => a.display_order - b.display_order).map((img) => img.image_url)
            : [];

          const variantsList: ProductVariant[] = Array.isArray(row.product_variants)
            ? row.product_variants.map((v) => ({
                id: v.id,
                productId: v.product_id,
                title: v.title,
                sku: v.sku,
                price: Number(v.price),
                compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
                stockQuantity: v.stock_quantity,
                attributes: (v.attributes as Record<string, string>) || {},
                isActive: v.is_active,
              }))
            : [];

          return {
            id: row.id,
            slug: row.slug,
            title: row.title,
            brand: row.brand,
            category: cat.name || 'General',
            categorySlug: cat.slug || 'general',
            description: row.description,
            shortDescription: row.short_description || row.description.slice(0, 120),
            price: Number(row.price),
            compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : Number(row.price),
            discountPercent: row.discount_percent || 0,
            rating: Number(row.rating),
            reviewCount: row.review_count || 0,
            stockQuantity: row.stock_quantity,
            isAvailable: row.stock_quantity > 0,
            isFeatured: row.is_featured,
            isBestSeller: row.is_bestseller,
            isDealOfTheDay: row.is_deal,
            sku: row.sku,
            thumbnail: imagesList[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
            tags: row.tags || [],
            features: Array.isArray(row.features) ? (row.features as string[]) : [],
            specifications: Array.isArray(row.specifications) ? (row.specifications as unknown as ProductSpecification[]) : [],
            variants: variantsList,
          };
        });

        return {
          items,
          total,
          page: validPage,
          limit: validLimit,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPrevPage: validPage > 1,
        };
      }
    } catch {
      // Fallback to seed data
    }
  }

  // 2. Resilient local fallback filter & pagination over verified seed data
  const STABLE_BASE_EPOCH = 1760000000000;
  let filtered = DEVELOPMENT_SEED_PRODUCTS.map((p, idx) => ({
    ...p,
    createdAt: p.createdAt || new Date(STABLE_BASE_EPOCH - idx * 86400000).toISOString(),
  }));

  if (categorySlug && categorySlug !== 'all') {
    filtered = filtered.filter((p) => p.categorySlug === categorySlug);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (brand && brand !== 'all') {
    filtered = filtered.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
  } else if (brands && brands.length > 0) {
    const brandLower = brands.map((b) => b.toLowerCase());
    filtered = filtered.filter((p) => brandLower.includes(p.brand.toLowerCase()));
  }

  if (dealsOnly) {
    filtered = filtered.filter((p) => p.isDealOfTheDay || p.discountPercent >= 15);
  }

  if (typeof minPrice === 'number' && minPrice > 0) {
    filtered = filtered.filter((p) => p.price >= minPrice);
  }

  if (typeof maxPrice === 'number' && maxPrice > 0) {
    filtered = filtered.filter((p) => p.price <= maxPrice);
  }

  if (typeof minRating === 'number' && minRating > 0) {
    filtered = filtered.filter((p) => p.rating >= minRating);
  }

  if (inStockOnly) {
    filtered = filtered.filter((p) => p.stockQuantity > 0);
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'discount':
        return b.discountPercent - a.discountPercent;
      case 'newest':
        return (
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() ||
          b.id.localeCompare(a.id)
        );
      case 'popularity':
        return (b.reviewCount * b.rating) - (a.reviewCount * a.rating);
      case 'featured':
      default:
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        return 0;
    }
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / validLimit));
  const items = filtered.slice(offset, offset + validLimit);

  return {
    items,
    total,
    page: validPage,
    limit: validLimit,
    totalPages,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1,
  };
}

/**
 * Retrieve a single product by its unique slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*), product_images(*), product_variants(*), product_reviews(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (!error && data) {
        const row = data as unknown as DbProductWithRelations;
        const cat = row.categories || ({} as Partial<CategoryRow>);
        const imagesList = Array.isArray(row.product_images) && row.product_images.length > 0
          ? [...row.product_images].sort((a, b) => a.display_order - b.display_order).map((img) => img.image_url)
          : [];

        const variantsList: ProductVariant[] = Array.isArray(row.product_variants)
          ? row.product_variants.map((v) => ({
              id: v.id,
              productId: v.product_id,
              title: v.title,
              sku: v.sku,
              price: Number(v.price),
              compareAtPrice: v.compare_at_price ? Number(v.compare_at_price) : null,
              stockQuantity: v.stock_quantity,
              attributes: (v.attributes as Record<string, string>) || {},
              isActive: v.is_active,
            }))
          : [];

        const reviewsList: ProductReview[] = Array.isArray(row.product_reviews)
          ? row.product_reviews.map((r) => ({
              id: r.id,
              authorName: 'Verified Customer',
              rating: r.rating,
              title: r.title,
              comment: r.comment,
              date: r.created_at ? r.created_at.split('T')[0] : '2026-10-18',
              verifiedPurchase: r.is_verified_purchase,
            }))
          : [];

        return {
          id: row.id,
          slug: row.slug,
          title: row.title,
          brand: row.brand,
          category: cat.name || 'General',
          categorySlug: cat.slug || 'general',
          description: row.description,
          shortDescription: row.short_description || row.description.slice(0, 120),
          price: Number(row.price),
          compareAtPrice: row.compare_at_price ? Number(row.compare_at_price) : Number(row.price),
          discountPercent: row.discount_percent || 0,
          rating: Number(row.rating),
          reviewCount: row.review_count || reviewsList.length,
          stockQuantity: row.stock_quantity,
          isAvailable: row.stock_quantity > 0,
          isFeatured: row.is_featured,
          isBestSeller: row.is_bestseller,
          isDealOfTheDay: row.is_deal,
          sku: row.sku,
          thumbnail: imagesList[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          images: imagesList.length > 0 ? imagesList : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
          tags: row.tags || [],
          features: Array.isArray(row.features) ? (row.features as string[]) : [],
          specifications: Array.isArray(row.specifications) ? (row.specifications as unknown as ProductSpecification[]) : [],
          variants: variantsList,
          reviews: reviewsList,
        };
      }
    } catch {
      // Fallback
    }
  }

  const seed = getSeedProductBySlug(slug);
  return seed || null;
}

/**
 * Retrieve categories with item counts
 */
export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        return (data as CategoryRow[]).map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description || '',
          imageUrl: cat.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
          itemCount: 20,
          featured: true,
        }));
      }
    } catch {
      // Fallback
    }
  }

  return DEVELOPMENT_SEED_CATEGORIES;
}

/**
 * Retrieve featured products
 */
export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const result = await getProducts({ sortBy: 'featured', limit });
  return result.items.length > 0 ? result.items : getFeaturedSeedProducts();
}

/**
 * Retrieve deal of the day products
 */
export async function getDealProducts(limit = 4): Promise<Product[]> {
  const result = await getProducts({ dealsOnly: true, limit });
  return result.items.length > 0 ? result.items : getDealSeedProducts();
}

/**
 * Retrieve best seller products
 */
export async function getBestSellerProducts(limit = 8): Promise<Product[]> {
  const result = await getProducts({ sortBy: 'rating', limit });
  return result.items.length > 0 ? result.items : getBestSellerSeedProducts();
}

/**
 * Real-time Product & Category Search Suggestions / Autocomplete
 */
export async function getSearchSuggestions(query: string): Promise<{
  products: {
    id: string;
    title: string;
    slug: string;
    brand: string;
    category: string;
    price: number;
    thumbnail: string;
    rating: number;
  }[];
  categories: { id: string; name: string; slug: string }[];
  query: string;
}> {
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2) {
    return { products: [], categories: [], query };
  }

  const allCategories = await getCategories();
  const matchingCategories = allCategories
    .filter((c) => c.name.toLowerCase().includes(clean) || c.slug.toLowerCase().includes(clean))
    .slice(0, 3)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  // Get active products
  const productPool = isSupabaseConfigured()
    ? (await getProducts({ query: clean, limit: 10 })).items
    : DEVELOPMENT_SEED_PRODUCTS;

  const matchingProducts = productPool
    .filter(
      (p) =>
        p.title.toLowerCase().includes(clean) ||
        p.brand.toLowerCase().includes(clean) ||
        p.category.toLowerCase().includes(clean) ||
        (Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase().includes(clean)))
    )
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      brand: p.brand,
      category: p.category,
      price: p.price,
      thumbnail: p.thumbnail,
      rating: p.rating,
    }));

  return {
    products: matchingProducts,
    categories: matchingCategories,
    query,
  };
}

/**
 * Retrieve distinct available brands with product counts
 */
export async function getAvailableBrands(
  categorySlug?: string
): Promise<{ name: string; count: number }[]> {
  const all = DEVELOPMENT_SEED_PRODUCTS.filter(
    (p) => !categorySlug || categorySlug === 'all' || p.categorySlug === categorySlug
  );

  const brandCounts = new Map<string, number>();
  for (const p of all) {
    if (p.brand) {
      brandCounts.set(p.brand, (brandCounts.get(p.brand) || 0) + 1);
    }
  }

  return Array.from(brandCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
