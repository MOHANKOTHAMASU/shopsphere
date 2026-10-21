'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import { CartItem, CartValidationResult, OrderSummary, Product } from '@/types/ecommerce';
import { DEVELOPMENT_SEED_PRODUCTS } from '@/data/seed-products';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductVariantRow = Database['public']['Tables']['product_variants']['Row'];
type CartItemRow = Database['public']['Tables']['cart_items']['Row'];
type WishlistRow = Database['public']['Tables']['wishlists']['Row'];

interface RawCartRow extends CartItemRow {
  products: ProductRow | null;
  product_variants: ProductVariantRow | null;
}

/**
 * Helper to fetch database-backed product and variant with accurate price and stock
 */
async function getVerifiedProductAndVariant(
  productId: string,
  variantId?: string | null
): Promise<{
  product: Product | null;
  variant: ProductVariantRow | null;
  unitPrice: number;
  compareAtPrice: number;
  maxStock: number;
  variantTitle?: string;
  variantAttributes?: Record<string, string>;
  isAvailable: boolean;
}> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(*), product_images(*)')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (prodData) {
        const p = prodData as unknown as ProductRow & {
          categories?: { name: string; slug: string } | null;
          product_images?: Array<{ image_url: string; display_order: number }>;
        };

        let variantData: ProductVariantRow | null = null;
        if (variantId) {
          const { data: vData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('id', variantId)
            .eq('product_id', productId)
            .eq('is_active', true)
            .single();

          if (vData) {
            variantData = vData as ProductVariantRow;
          }
        }

        const images = Array.isArray(p.product_images) && p.product_images.length > 0
          ? [...p.product_images].sort((a, b) => a.display_order - b.display_order).map((i) => i.image_url)
          : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'];

        const productDomain: Product = {
          id: p.id,
          slug: p.slug,
          title: p.title,
          brand: p.brand,
          category: p.categories?.name || 'General',
          categorySlug: p.categories?.slug || 'general',
          description: p.description,
          shortDescription: p.short_description || p.description.slice(0, 120),
          price: Number(p.price),
          compareAtPrice: p.compare_at_price ? Number(p.compare_at_price) : Number(p.price),
          discountPercent: p.discount_percent || 0,
          rating: Number(p.rating),
          reviewCount: p.review_count || 0,
          stockQuantity: p.stock_quantity,
          isAvailable: p.stock_quantity > 0,
          sku: p.sku,
          images,
          thumbnail: images[0],
          tags: p.tags || [],
          features: Array.isArray(p.features) ? (p.features as string[]) : [],
          specifications: [],
        };

        const unitPrice = variantData ? Number(variantData.price) : Number(p.price);
        const compareAtPrice = variantData?.compare_at_price
          ? Number(variantData.compare_at_price)
          : p.compare_at_price
          ? Number(p.compare_at_price)
          : unitPrice;
        const maxStock = variantData ? variantData.stock_quantity : p.stock_quantity;

        return {
          product: productDomain,
          variant: variantData,
          unitPrice,
          compareAtPrice,
          maxStock,
          variantTitle: variantData?.title,
          variantAttributes: (variantData?.attributes as Record<string, string>) || undefined,
          isAvailable: maxStock > 0,
        };
      }
    } catch {
      // Fallback to local verified seed items
    }
  }

  // Resilient fallback over local seed products
  const seed = DEVELOPMENT_SEED_PRODUCTS.find((p) => p.id === productId || p.slug === productId);
  if (!seed) {
    return {
      product: null,
      variant: null,
      unitPrice: 0,
      compareAtPrice: 0,
      maxStock: 0,
      isAvailable: false,
    };
  }

  const v = seed.variants?.find((item) => item.id === variantId);
  const unitPrice = v ? v.price : seed.price;
  const compareAtPrice = v?.compareAtPrice ? v.compareAtPrice : seed.compareAtPrice || unitPrice;
  const maxStock = v ? v.stockQuantity : seed.stockQuantity;

  return {
    product: seed,
    variant: null,
    unitPrice,
    compareAtPrice,
    maxStock,
    variantTitle: v?.title,
    variantAttributes: v?.attributes,
    isAvailable: maxStock > 0,
  };
}

/**
 * 1. Fetch server-persisted cart for authenticated customer
 */
export async function getServerCartAction(): Promise<{
  success: boolean;
  items: CartItem[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  if (!isSupabaseConfigured()) {
    return { success: true, items: [], warnings };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, items: [], warnings };
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(*, categories(*), product_images(*)), product_variants(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error || !data) {
      return { success: false, items: [], warnings: ['Unable to load server cart.'] };
    }

    const rawRows = data as unknown as RawCartRow[];
    const items: CartItem[] = [];

    for (const row of rawRows) {
      const verified = await getVerifiedProductAndVariant(row.product_id, row.variant_id);

      if (!verified.product) {
        // Product no longer exists or inactive
        warnings.push('An unavailable item was removed from your cart.');
        await supabase.from('cart_items').delete().eq('id', row.id);
        continue;
      }

      if (verified.maxStock <= 0) {
        warnings.push(`"${verified.product.title}" is out of stock and was removed from your cart.`);
        await supabase.from('cart_items').delete().eq('id', row.id);
        continue;
      }

      // Quantity clamping to live stock
      let quantity = row.quantity;
      if (quantity > verified.maxStock) {
        quantity = verified.maxStock;
        warnings.push(
          `Quantity for "${verified.product.title}" adjusted to ${quantity} due to stock limits.`
        );
        await supabase.from('cart_items').update({ quantity }).eq('id', row.id);
      }

      items.push({
        id: row.id,
        productId: verified.product.id,
        variantId: row.variant_id || undefined,
        variantTitle: verified.variantTitle,
        variantAttributes: verified.variantAttributes,
        product: verified.product,
        quantity,
        unitPrice: verified.unitPrice,
        compareAtPrice: verified.compareAtPrice,
        maxStock: verified.maxStock,
      });
    }

    return { success: true, items, warnings };
  } catch (err) {
    return {
      success: false,
      items: [],
      warnings: [(err as Error).message || 'Server cart error'],
    };
  }
}

/**
 * 2. Add or update item in server cart
 */
export async function syncCartItemAction(payload: {
  productId: string;
  variantId?: string;
  quantity: number;
}): Promise<{
  success: boolean;
  item?: CartItem;
  error?: string;
  warnings?: string[];
}> {
  const { productId, variantId, quantity } = payload;
  const warnings: string[] = [];

  const verified = await getVerifiedProductAndVariant(productId, variantId);
  if (!verified.product || !verified.isAvailable) {
    return { success: false, error: 'Product is currently out of stock or unavailable.' };
  }

  if (quantity <= 0) {
    return { success: false, error: 'Invalid quantity.' };
  }

  const clampedQuantity = Math.min(quantity, verified.maxStock);
  if (clampedQuantity < quantity) {
    warnings.push(`Requested quantity exceeded available stock. Clamped to ${clampedQuantity}.`);
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let existingQuery = supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', productId);

        if (variantId) {
          existingQuery = existingQuery.eq('variant_id', variantId);
        } else {
          existingQuery = existingQuery.is('variant_id', null);
        }

        const { data: existingRows } = await existingQuery;

        if (existingRows && existingRows.length > 0) {
          // Update existing item
          await supabase
            .from('cart_items')
            .update({ quantity: clampedQuantity })
            .eq('id', existingRows[0].id);
        } else {
          // Insert new row
          await supabase.from('cart_items').insert({
            user_id: user.id,
            product_id: productId,
            variant_id: variantId || null,
            quantity: clampedQuantity,
          });
        }
      }
    } catch {
      // ignore
    }
  }

  const item: CartItem = {
    id: `cart-${productId}${variantId ? '-' + variantId : ''}`,
    productId,
    variantId: variantId || undefined,
    variantTitle: verified.variantTitle,
    variantAttributes: verified.variantAttributes,
    product: verified.product,
    quantity: clampedQuantity,
    unitPrice: verified.unitPrice,
    compareAtPrice: verified.compareAtPrice,
    maxStock: verified.maxStock,
  };

  return { success: true, item, warnings };
}

/**
 * 3. Remove item from server cart
 */
export async function removeCartItemAction(payload: {
  productId: string;
  variantId?: string;
}): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let query = supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', payload.productId);

        if (payload.variantId) {
          query = query.eq('variant_id', payload.variantId);
        } else {
          query = query.is('variant_id', null);
        }

        await query;
      }
    } catch {
      // ignore
    }
  }

  return { success: true };
}

/**
 * 4. Clear server cart
 */
export async function clearServerCartAction(): Promise<{ success: boolean }> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      }
    } catch {
      // ignore
    }
  }

  return { success: true };
}

/**
 * 5. Merge anonymous local cart with database cart after login
 * Prevents duplicate rows: matching (product_id, variant_id) adds quantities and clamps to available stock.
 */
export async function mergeCartAction(
  anonymousItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>
): Promise<{
  success: boolean;
  items: CartItem[];
  warnings: string[];
}> {
  const warnings: string[] = [];

  if (!isSupabaseConfigured() || anonymousItems.length === 0) {
    return getServerCartAction();
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, items: [], warnings: ['User not logged in'] };
    }

    // Process each anonymous item
    for (const anon of anonymousItems) {
      const verified = await getVerifiedProductAndVariant(anon.productId, anon.variantId);
      if (!verified.product || verified.maxStock <= 0) {
        warnings.push(`"${anon.productId}" is out of stock and was not added.`);
        continue;
      }

      // Check if user already has this exact product & variant in DB
      let query = supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', anon.productId);

      if (anon.variantId) {
        query = query.eq('variant_id', anon.variantId);
      } else {
        query = query.is('variant_id', null);
      }

      const { data: existing } = await query;

      if (existing && existing.length > 0) {
        // Item already in user's DB cart -> Combine quantities without duplicating rows
        const currentQty = existing[0].quantity;
        const combinedQty = Math.min(currentQty + anon.quantity, verified.maxStock);

        await supabase
          .from('cart_items')
          .update({ quantity: combinedQty })
          .eq('id', existing[0].id);
      } else {
        // Not in DB cart -> Insert new row
        const initialQty = Math.min(anon.quantity, verified.maxStock);
        await supabase.from('cart_items').insert({
          user_id: user.id,
          product_id: anon.productId,
          variant_id: anon.variantId || null,
          quantity: initialQty,
        });
      }
    }

    // Return the fresh merged cart
    return await getServerCartAction();
  } catch (err) {
    return {
      success: false,
      items: [],
      warnings: [(err as Error).message || 'Failed to merge cart.'],
    };
  }
}

/**
 * 6. Server-side Checkout Revalidation
 * Revalidates prices and stock directly from the database.
 * Does NOT trust prices or totals submitted by the client.
 */
export async function revalidateCartAction(
  clientItems: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>,
  couponCode?: string
): Promise<CartValidationResult> {
  const warnings: string[] = [];
  let hasChanges = false;
  const verifiedItems: CartItem[] = [];

  for (const clientItem of clientItems) {
    const verified = await getVerifiedProductAndVariant(clientItem.productId, clientItem.variantId);

    // 1. Missing or inactive product
    if (!verified.product) {
      warnings.push(`One of the items in your cart is no longer available.`);
      hasChanges = true;
      continue;
    }

    // 2. Out of stock check
    if (verified.maxStock <= 0) {
      warnings.push(`"${verified.product.title}" is currently out of stock.`);
      hasChanges = true;
      continue;
    }

    // 3. Stock limit clamping
    let finalQty = clientItem.quantity;
    if (finalQty > verified.maxStock) {
      finalQty = verified.maxStock;
      warnings.push(
        `Quantity for "${verified.product.title}" adjusted to ${finalQty} (maximum available in stock).`
      );
      hasChanges = true;
    }

    verifiedItems.push({
      id: `cart-${verified.product.id}${clientItem.variantId ? '-' + clientItem.variantId : ''}`,
      productId: verified.product.id,
      variantId: clientItem.variantId,
      variantTitle: verified.variantTitle,
      variantAttributes: verified.variantAttributes,
      product: verified.product,
      quantity: finalQty,
      unitPrice: verified.unitPrice,
      compareAtPrice: verified.compareAtPrice,
      maxStock: verified.maxStock,
    });
  }

  // Server-computed Order Summary (never trusting browser calculations)
  const subtotal = verifiedItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  let discount = 0;
  if (couponCode) {
    const cleanCoupon = couponCode.trim().toUpperCase();
    if (cleanCoupon === 'SHOPSPHERE10' && subtotal >= 500) {
      discount = Math.min(2000, Math.round(subtotal * 0.1));
    } else if (cleanCoupon === 'WELCOME500' && subtotal >= 2500) {
      discount = 500;
    } else if (cleanCoupon === 'FESTIVE20' && subtotal >= 5000) {
      discount = Math.min(5000, Math.round(subtotal * 0.2));
    }
  }

  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const estimatedTax = 0; // Inclusive in India
  const total = Math.max(0, subtotal - discount + shipping);

  const totalOriginalPrice = verifiedItems.reduce(
    (acc, item) => acc + (item.compareAtPrice || item.unitPrice) * item.quantity,
    0
  );
  const savings = Math.max(0, totalOriginalPrice - subtotal + discount);

  const summary: OrderSummary = {
    subtotal,
    discount,
    shipping,
    estimatedTax,
    total,
    savings,
  };

  return {
    isValid: verifiedItems.length > 0 && warnings.length === 0,
    hasChanges,
    warnings,
    items: verifiedItems,
    summary,
  };
}

/**
 * 7. Wishlist Server Actions
 */
export async function getServerWishlistAction(): Promise<{
  success: boolean;
  products: Product[];
}> {
  if (!isSupabaseConfigured()) {
    return { success: true, products: [] };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, products: [] };
    }

    const { data } = await supabase
      .from('wishlists')
      .select('*, products(*, categories(*), product_images(*))')
      .eq('user_id', user.id);

    if (!data) return { success: true, products: [] };

    const rawRows = data as unknown as Array<WishlistRow & { products: ProductRow & { categories?: { name: string; slug: string }; product_images?: Array<{ image_url: string }> } }>;
    const products: Product[] = [];

    for (const r of rawRows) {
      if (r.products) {
        const verified = await getVerifiedProductAndVariant(r.products.id);
        if (verified.product) {
          products.push(verified.product);
        }
      }
    }

    return { success: true, products };
  } catch {
    return { success: false, products: [] };
  }
}

export async function toggleWishlistItemAction(productId: string): Promise<{
  success: boolean;
  inWishlist: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return { success: true, inWishlist: true };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: true, inWishlist: false };
    }

    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle();

    if (existing) {
      await supabase.from('wishlists').delete().eq('id', existing.id);
      return { success: true, inWishlist: false };
    } else {
      await supabase.from('wishlists').insert({
        user_id: user.id,
        product_id: productId,
      });
      return { success: true, inWishlist: true };
    }
  } catch {
    return { success: false, inWishlist: false };
  }
}
