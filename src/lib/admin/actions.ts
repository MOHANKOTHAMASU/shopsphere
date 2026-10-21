'use server';

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { assertAdmin, logAdminAuditAction, memoryAuditLogs } from '@/lib/auth/admin-guard';
import { validateImageUrl } from '@/lib/security/upload-validator';
import { inMemoryOrders } from '@/lib/orders/store';
import { memoryReviews } from '@/lib/reviews/store';
import {
  memoryProducts,
  memoryCategories,
  memoryCoupons,
  memoryCustomers,
} from './store';
import {
  AdminDashboardMetrics,
  Product,
  Category,
  Order,
  OrderStatus,
  PaymentStatus,
  CouponRecord,
  CreateCouponInput,
  CustomerSummary,
  ReviewRecord,
  AdminAuditLog,
  CreateProductInput,
  CreateCategoryInput,
} from '@/types/ecommerce';

function safeRevalidate(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Safe when invoked in non-HTTP scripts / test runners
  }
}


// Helper to mask emails for restricted privacy display
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [user, domain] = parts;
  if (user.length <= 2) {
    return `${user[0]}*@${domain}`;
  }
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

// -----------------------------------------------------------------------------
// 1. ADMIN DASHBOARD METRICS (Real Database / Active Store)
// -----------------------------------------------------------------------------

export async function getAdminDashboardMetricsAction(): Promise<{
  success: boolean;
  metrics?: AdminDashboardMetrics;
  error?: string;
}> {
  try {
    await assertAdmin();

    const orders = inMemoryOrders;
    const products = memoryProducts;
    const customers = memoryCustomers;

    // Calculate real sales metrics
    const nonCancelledOrders = orders.filter((o) => o.status !== 'cancelled');
    const totalRevenue = nonCancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = customers.length;
    const totalProducts = products.length;

    const lowStockProducts = products.filter((p) => p.stockQuantity <= 10 && p.stockQuantity > 0);
    const outOfStockProducts = products.filter((p) => p.stockQuantity === 0);

    const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
    const deliveredOrdersCount = orders.filter((o) => o.status === 'delivered').length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Sales by Category
    const categorySalesMap = new Map<string, { sales: number; count: number }>();
    for (const order of nonCancelledOrders) {
      for (const item of order.items) {
        const prod = products.find((p) => p.id === item.productId);
        const catName = prod?.category || 'General';
        const current = categorySalesMap.get(catName) || { sales: 0, count: 0 };
        current.sales += item.subtotal;
        current.count += item.quantity;
        categorySalesMap.set(catName, current);
      }
    }
    const salesByCategory = Array.from(categorySalesMap.entries()).map(([category, val]) => ({
      category,
      sales: val.sales,
      count: val.count,
    }));

    // Sales by Payment Method
    const paymentMethodMap = new Map<string, { total: number; count: number }>();
    for (const order of nonCancelledOrders) {
      const method = order.paymentMethod.toUpperCase();
      const current = paymentMethodMap.get(method) || { total: 0, count: 0 };
      current.total += order.totalAmount;
      current.count += 1;
      paymentMethodMap.set(method, current);
    }
    const salesByPaymentMethod = Array.from(paymentMethodMap.entries()).map(([method, val]) => ({
      method,
      total: val.total,
      count: val.count,
    }));

    // Sales by Status
    const salesByStatus: Record<string, number> = {};
    for (const order of orders) {
      salesByStatus[order.status] = (salesByStatus[order.status] || 0) + 1;
    }

    const metrics: AdminDashboardMetrics = {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      pendingOrdersCount,
      deliveredOrdersCount,
      averageOrderValue,
      recentOrders: orders.slice(0, 5),
      lowStockProducts,
      salesByCategory,
      salesByPaymentMethod,
      salesByStatus,
    };

    return { success: true, metrics };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 2. PRODUCT MANAGEMENT ACTIONS
// -----------------------------------------------------------------------------

export async function getAdminProductsAction(query?: string, categorySlug?: string): Promise<{
  success: boolean;
  products: Product[];
  error?: string;
}> {
  try {
    await assertAdmin();

    let filtered = [...memoryProducts];
    if (categorySlug && categorySlug !== 'all') {
      filtered = filtered.filter((p) => p.categorySlug === categorySlug);
    }
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }

    return { success: true, products: filtered };
  } catch (err: unknown) {
    return { success: false, products: [], error: (err as Error).message };
  }
}

export async function getAdminProductByIdAction(id: string): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  try {
    await assertAdmin();
    const product = memoryProducts.find((p) => p.id === id);
    if (!product) {
      return { success: false, error: `Product with ID ${id} not found.` };
    }
    return { success: true, product };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function createProductAction(input: CreateProductInput): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    // Validation
    if (!input.title || input.title.trim().length < 3) {
      return { success: false, error: 'Product title must be at least 3 characters.' };
    }
    if (!input.price || input.price <= 0) {
      return { success: false, error: 'Product price must be greater than zero.' };
    }
    if (!input.sku || input.sku.trim().length < 3) {
      return { success: false, error: 'SKU must be at least 3 characters.' };
    }

    const cleanSku = input.sku.trim().toUpperCase();
    if (memoryProducts.some((p) => p.sku === cleanSku)) {
      return { success: false, error: `SKU "${cleanSku}" already exists. SKU must be globally unique.` };
    }

    // Image URL safety validation
    if (input.images && input.images.length > 0) {
      for (const imgUrl of input.images) {
        const check = validateImageUrl(imgUrl);
        if (!check.valid) {
          return { success: false, error: `Invalid image URL: ${check.error}` };
        }
      }
    }
    if (input.thumbnail) {
      const check = validateImageUrl(input.thumbnail);
      if (!check.valid) {
        return { success: false, error: `Invalid thumbnail URL: ${check.error}` };
      }
    }

    const slug =
      input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      slug,
      title: input.title.trim(),
      brand: input.brand?.trim() || 'ShopSphere Brand',
      category: input.category,
      categorySlug: input.categorySlug || 'electronics',
      description: input.description.trim(),
      shortDescription: input.shortDescription?.trim() || input.description.slice(0, 120),
      price: Number(input.price),
      compareAtPrice: input.compareAtPrice ? Number(input.compareAtPrice) : Number(input.price),
      discountPercent: input.discountPercent || 0,
      rating: 5.0,
      reviewCount: 0,
      stockQuantity: Number(input.stockQuantity || 0),
      isAvailable: input.stockQuantity > 0,
      isFeatured: Boolean(input.isFeatured),
      isBestSeller: Boolean(input.isBestSeller),
      isDealOfTheDay: Boolean(input.isDealOfTheDay),
      sku: cleanSku,
      thumbnail: input.thumbnail || input.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      images: input.images && input.images.length > 0 ? input.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
      tags: input.tags || ['new', 'marketplace'],
      features: input.features || ['Premium Genuine Quality', 'Fast Dispatch'],
      specifications: [],
    };

    memoryProducts.unshift(newProduct);

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from('products').insert({
          slug: newProduct.slug,
          title: newProduct.title,
          brand: newProduct.brand,
          description: newProduct.description,
          short_description: newProduct.shortDescription,
          price: newProduct.price,
          compare_at_price: newProduct.compareAtPrice,
          discount_percent: newProduct.discountPercent,
          sku: newProduct.sku,
          stock_quantity: newProduct.stockQuantity,
          is_active: newProduct.isAvailable,
          is_featured: newProduct.isFeatured || false,
          is_bestseller: newProduct.isBestSeller || false,
          is_deal: newProduct.isDealOfTheDay || false,
        });
      } catch {
        // Safe database fallback
      }
    }

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'PRODUCT_CREATE',
      resourceType: 'product',
      resourceId: newProduct.id,
      details: { title: newProduct.title, sku: newProduct.sku, price: newProduct.price },
    });

    safeRevalidate('/admin/products');
    safeRevalidate('/admin/inventory');
    safeRevalidate('/admin/dashboard');
    safeRevalidate('/products');

    return { success: true, product: newProduct };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateProductAction(
  productId: string,
  input: Partial<CreateProductInput>
): Promise<{
  success: boolean;
  product?: Product;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const index = memoryProducts.findIndex((p) => p.id === productId);
    if (index === -1) {
      return { success: false, error: `Product with ID ${productId} not found.` };
    }

    const existing = memoryProducts[index];

    // Check SKU conflict
    if (input.sku && input.sku.toUpperCase() !== existing.sku) {
      const conflict = memoryProducts.find((p) => p.sku === input.sku!.toUpperCase() && p.id !== productId);
      if (conflict) {
        return { success: false, error: `SKU "${input.sku}" is already assigned to another product.` };
      }
    }

    // Image URL safety validation
    if (input.images && input.images.length > 0) {
      for (const imgUrl of input.images) {
        const check = validateImageUrl(imgUrl);
        if (!check.valid) {
          return { success: false, error: `Invalid image URL: ${check.error}` };
        }
      }
    }
    if (input.thumbnail) {
      const check = validateImageUrl(input.thumbnail);
      if (!check.valid) {
        return { success: false, error: `Invalid thumbnail URL: ${check.error}` };
      }
    }

    const updatedProduct: Product = {
      ...existing,
      title: input.title !== undefined ? input.title.trim() : existing.title,
      brand: input.brand !== undefined ? input.brand.trim() : existing.brand,
      category: input.category !== undefined ? input.category : existing.category,
      categorySlug: input.categorySlug !== undefined ? input.categorySlug : existing.categorySlug,
      description: input.description !== undefined ? input.description.trim() : existing.description,
      shortDescription: input.shortDescription !== undefined ? input.shortDescription.trim() : existing.shortDescription,
      price: input.price !== undefined ? Number(input.price) : existing.price,
      compareAtPrice: input.compareAtPrice !== undefined ? Number(input.compareAtPrice) : existing.compareAtPrice,
      discountPercent: input.discountPercent !== undefined ? Number(input.discountPercent) : existing.discountPercent,
      sku: input.sku !== undefined ? input.sku.trim().toUpperCase() : existing.sku,
      stockQuantity: input.stockQuantity !== undefined ? Number(input.stockQuantity) : existing.stockQuantity,
      isAvailable: input.stockQuantity !== undefined ? Number(input.stockQuantity) > 0 : existing.isAvailable,
      isFeatured: input.isFeatured !== undefined ? Boolean(input.isFeatured) : existing.isFeatured,
      isBestSeller: input.isBestSeller !== undefined ? Boolean(input.isBestSeller) : existing.isBestSeller,
      isDealOfTheDay: input.isDealOfTheDay !== undefined ? Boolean(input.isDealOfTheDay) : existing.isDealOfTheDay,
      images: input.images && input.images.length > 0 ? input.images : existing.images,
      thumbnail: input.thumbnail || (input.images && input.images[0]) || existing.thumbnail,
    };

    memoryProducts[index] = updatedProduct;

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'PRODUCT_UPDATE',
      resourceType: 'product',
      resourceId: productId,
      details: { updatedFields: Object.keys(input) },
    });

    safeRevalidate('/admin/products');
    safeRevalidate('/admin/inventory');
    safeRevalidate('/admin/dashboard');
    safeRevalidate('/products');
    safeRevalidate(`/products/${updatedProduct.slug}`);

    return { success: true, product: updatedProduct };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteProductAction(productId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const index = memoryProducts.findIndex((p) => p.id === productId);
    if (index === -1) {
      return { success: false, error: `Product with ID ${productId} not found.` };
    }

    const removed = memoryProducts.splice(index, 1)[0];

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'PRODUCT_DELETE',
      resourceType: 'product',
      resourceId: productId,
      details: { title: removed.title, sku: removed.sku },
    });

    safeRevalidate('/admin/products');
    safeRevalidate('/admin/inventory');
    safeRevalidate('/admin/dashboard');
    safeRevalidate('/products');

    return { success: true, message: `Product "${removed.title}" has been successfully removed.` };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateInventoryAction(
  productId: string,
  newStock: number
): Promise<{
  success: boolean;
  stock?: number;
  newStock?: number;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    if (newStock < 0) {
      return { success: false, error: 'Stock quantity cannot be negative.' };
    }

    const product = memoryProducts.find((p) => p.id === productId);
    if (!product) {
      return { success: false, error: `Product ${productId} not found.` };
    }

    const previousStock = product.stockQuantity;
    product.stockQuantity = newStock;
    product.isAvailable = newStock > 0;

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'INVENTORY_UPDATE',
      resourceType: 'product',
      resourceId: productId,
      details: { previousStock, newStock, sku: product.sku },
    });

    safeRevalidate('/admin/inventory');
    safeRevalidate('/admin/products');
    safeRevalidate('/admin/dashboard');

    return { success: true, stock: newStock, newStock };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 3. CATEGORY MANAGEMENT ACTIONS
// -----------------------------------------------------------------------------

export async function getAdminCategoriesAction(): Promise<{
  success: boolean;
  categories: Category[];
  error?: string;
}> {
  try {
    await assertAdmin();
    return { success: true, categories: memoryCategories };
  } catch (err: unknown) {
    return { success: false, categories: [], error: (err as Error).message };
  }
}

export async function createCategoryAction(input: CreateCategoryInput): Promise<{
  success: boolean;
  category?: Category;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    if (!input.name || input.name.trim().length < 2) {
      return { success: false, error: 'Category name must be at least 2 characters.' };
    }

    const slug =
      (input.slug || input.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

    if (memoryCategories.some((c) => c.slug === slug)) {
      return { success: false, error: `Category slug "${slug}" already exists.` };
    }

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || `Shop the latest in ${input.name}`,
      imageUrl: input.imageUrl || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80',
      itemCount: 0,
      featured: true,
    };

    memoryCategories.push(newCategory);

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'CATEGORY_CREATE',
      resourceType: 'category',
      resourceId: newCategory.id,
      details: { name: newCategory.name, slug: newCategory.slug },
    });

    safeRevalidate('/admin/categories');
    safeRevalidate('/admin/products');
    safeRevalidate('/');

    return { success: true, category: newCategory };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: Partial<CreateCategoryInput>
): Promise<{
  success: boolean;
  category?: Category;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const category = memoryCategories.find((c) => c.id === categoryId);
    if (!category) {
      return { success: false, error: `Category ${categoryId} not found.` };
    }

    if (input.name) category.name = input.name.trim();
    if (input.description) category.description = input.description.trim();
    if (input.imageUrl) category.imageUrl = input.imageUrl.trim();

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'CATEGORY_UPDATE',
      resourceType: 'category',
      resourceId: categoryId,
      details: { updatedName: category.name },
    });

    safeRevalidate('/admin/categories');
    safeRevalidate('/');

    return { success: true, category };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteCategoryAction(categoryId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const index = memoryCategories.findIndex((c) => c.id === categoryId);
    if (index === -1) {
      return { success: false, error: `Category with ID ${categoryId} not found.` };
    }

    const cat = memoryCategories[index];

    // Check if products are currently assigned to this category
    const assignedProducts = memoryProducts.filter((p) => p.categorySlug === cat.slug);
    if (assignedProducts.length > 0) {
      return {
        success: false,
        error: `Cannot delete category "${cat.name}". ${assignedProducts.length} product(s) are currently assigned to it. Please reassign products first.`,
      };
    }

    memoryCategories.splice(index, 1);

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'CATEGORY_DELETE',
      resourceType: 'category',
      resourceId: categoryId,
      details: { name: cat.name },
    });

    safeRevalidate('/admin/categories');
    safeRevalidate('/');

    return { success: true, message: `Category "${cat.name}" has been deleted.` };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 4. ORDER MANAGEMENT ACTIONS
// -----------------------------------------------------------------------------

export async function getAdminOrdersAction(filters?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
}): Promise<{
  success: boolean;
  orders: Order[];
  error?: string;
}> {
  try {
    await assertAdmin();

    let list = [...inMemoryOrders];

    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    if (filters?.paymentStatus) {
      list = list.filter((o) => o.paymentStatus === filters.paymentStatus);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.shippingAddress.fullName.toLowerCase().includes(q) ||
          o.shippingAddress.phone.includes(q)
      );
    }

    return { success: true, orders: list };
  } catch (err: unknown) {
    return { success: false, orders: [], error: (err as Error).message };
  }
}

export async function getAdminOrderDetailsAction(orderIdOrNumber: string): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  try {
    await assertAdmin();

    const order = inMemoryOrders.find(
      (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
    );

    if (!order) {
      return { success: false, error: `Order "${orderIdOrNumber}" not found.` };
    }

    return { success: true, order };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Validates and transitions an order to a new status.
 * Automatically restores stock when an order is cancelled.
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  trackingNumber?: string,
  notes?: string
): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const order = inMemoryOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      return { success: false, error: `Order ${orderId} not found.` };
    }

    const previousStatus = order.status;

    // Transition Validation Rules
    if (previousStatus === 'delivered' && newStatus !== 'delivered') {
      return { success: false, error: 'Cannot change status of a delivered order.' };
    }
    if (previousStatus === 'cancelled') {
      return { success: false, error: 'Cannot modify a cancelled order.' };
    }

    // Update order
    order.status = newStatus;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber.trim();
    if (notes !== undefined) order.notes = notes.trim();
    order.updatedAt = new Date().toISOString();

    // If marked delivered and was COD, mark paymentStatus as paid
    if (newStatus === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    // If order was cancelled, automatically restore product inventory
    if (newStatus === 'cancelled') {
      for (const item of order.items) {
        const prod = memoryProducts.find((p) => p.id === item.productId);
        if (prod) {
          prod.stockQuantity += item.quantity;
          prod.isAvailable = true;
        }
      }
    }

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'ORDER_STATUS_UPDATE',
      resourceType: 'order',
      resourceId: order.orderNumber,
      details: { previousStatus, newStatus, trackingNumber },
    });

    safeRevalidate('/admin/orders');
    safeRevalidate(`/admin/orders/${order.id}`);
    safeRevalidate('/admin/dashboard');
    safeRevalidate('/account/orders');
    safeRevalidate(`/account/orders/${order.id}`);

    return { success: true, order };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 5. CUSTOMER LISTING ACTIONS (With Masked / Restricted PII)
// -----------------------------------------------------------------------------

export async function getAdminCustomersAction(search?: string): Promise<{
  success: boolean;
  customers: CustomerSummary[];
  error?: string;
}> {
  try {
    await assertAdmin();

    let list = memoryCustomers.map((c) => ({
      ...c,
      email: maskEmail(c.email),
      maskedEmail: maskEmail(c.email),
    }));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    return { success: true, customers: list };
  } catch (err: unknown) {
    return { success: false, customers: [], error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 6. COUPON MANAGEMENT ACTIONS
// -----------------------------------------------------------------------------

export async function getAdminCouponsAction(): Promise<{
  success: boolean;
  coupons: CouponRecord[];
  error?: string;
}> {
  try {
    await assertAdmin();
    return { success: true, coupons: memoryCoupons };
  } catch (err: unknown) {
    return { success: false, coupons: [], error: (err as Error).message };
  }
}

export async function createCouponAction(input: CreateCouponInput): Promise<{
  success: boolean;
  coupon?: CouponRecord;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    if (!input.code || input.code.trim().length < 3) {
      return { success: false, error: 'Coupon code must be at least 3 characters.' };
    }
    if (!input.discountValue || input.discountValue <= 0) {
      return { success: false, error: 'Discount value must be greater than zero.' };
    }

    const cleanCode = input.code.trim().toUpperCase();
    if (memoryCoupons.some((c) => c.code === cleanCode)) {
      return { success: false, error: `Coupon code "${cleanCode}" already exists.` };
    }

    const newCoupon: CouponRecord = {
      id: `coup-${Date.now()}`,
      code: cleanCode,
      discountType: input.discountType,
      discountValue: Number(input.discountValue),
      minOrderAmount: Number(input.minOrderAmount || 0),
      maxDiscountAmount: input.maxDiscountAmount ? Number(input.maxDiscountAmount) : undefined,
      usageLimit: input.usageLimit ? Number(input.usageLimit) : undefined,
      usedCount: 0,
      isActive: input.isActive ?? true,
      startsAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      createdAt: new Date().toISOString(),
    };

    memoryCoupons.unshift(newCoupon);

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'COUPON_CREATE',
      resourceType: 'coupon',
      resourceId: newCoupon.code,
      details: { code: newCoupon.code, discountValue: newCoupon.discountValue, type: newCoupon.discountType },
    });

    safeRevalidate('/admin/coupons');

    return { success: true, coupon: newCoupon };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function toggleCouponStatusAction(
  couponId: string,
  isActive: boolean
): Promise<{
  success: boolean;
  isActive?: boolean;
  coupon?: CouponRecord;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const coupon = memoryCoupons.find((c) => c.id === couponId || c.code === couponId);
    if (!coupon) {
      return { success: false, error: `Coupon ${couponId} not found.` };
    }

    coupon.isActive = isActive;

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'COUPON_TOGGLE',
      resourceType: 'coupon',
      resourceId: coupon.code,
      details: { isActive },
    });

    safeRevalidate('/admin/coupons');

    return { success: true, isActive, coupon };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

export async function deleteCouponAction(couponId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const index = memoryCoupons.findIndex((c) => c.id === couponId || c.code === couponId);
    if (index === -1) {
      return { success: false, error: `Coupon with ID ${couponId} not found.` };
    }

    const removed = memoryCoupons.splice(index, 1)[0];

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'COUPON_DELETE',
      resourceType: 'coupon',
      resourceId: removed.code,
      details: { code: removed.code },
    });

    safeRevalidate('/admin/coupons');

    return { success: true, message: `Coupon "${removed.code}" has been deleted.` };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 7. REVIEW MODERATION ACTIONS
// -----------------------------------------------------------------------------

export async function getAdminReviewsAction(status?: 'all' | 'pending' | 'approved' | 'rejected'): Promise<{
  success: boolean;
  reviews: ReviewRecord[];
  error?: string;
}> {
  try {
    await assertAdmin();

    let list = [...memoryReviews];
    if (status && status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    return { success: true, reviews: list };
  } catch (err: unknown) {
    return { success: false, reviews: [], error: (err as Error).message };
  }
}

export async function moderateReviewAction(
  reviewId: string,
  newStatus: 'approved' | 'rejected'
): Promise<{
  success: boolean;
  status?: string;
  review?: ReviewRecord;
  error?: string;
}> {
  try {
    const admin = await assertAdmin();

    const review = memoryReviews.find((r) => r.id === reviewId);
    if (!review) {
      return { success: false, error: `Review ${reviewId} not found.` };
    }

    review.status = newStatus;

    await logAdminAuditAction({
      adminEmail: admin.adminEmail,
      action: 'REVIEW_MODERATE',
      resourceType: 'review',
      resourceId: reviewId,
      details: { newStatus, productTitle: review.productTitle },
    });

    safeRevalidate('/admin/reviews');

    return { success: true, status: newStatus, review };
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message };
  }
}

// -----------------------------------------------------------------------------
// 8. AUDIT LOGS & REPORTS ACTIONS
// -----------------------------------------------------------------------------

export async function getAdminAuditLogsAction(limit: number = 50): Promise<{
  success: boolean;
  logs: AdminAuditLog[];
  error?: string;
}> {
  try {
    await assertAdmin();
    return { success: true, logs: memoryAuditLogs.slice(0, limit) };
  } catch (err: unknown) {
    return { success: false, logs: [], error: (err as Error).message };
  }
}
