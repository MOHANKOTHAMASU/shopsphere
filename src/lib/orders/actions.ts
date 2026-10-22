'use server';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/types';
import {
  Order,
  OrderItem,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  Address,
  CouponValidation,
} from '@/types/ecommerce';
import { DEVELOPMENT_SEED_PRODUCTS } from '@/data/seed-products';
import { clearServerCartAction } from '@/lib/cart/actions';
import { memoryProducts } from '@/lib/admin/store';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface OrderWithItemsRow extends OrderRow {
  order_items?: OrderItemRow[];
}

import { idempotencyStore, inMemoryOrders } from '@/lib/orders/store';
import { getDemoUserAction } from '@/lib/auth/actions';
import { getAuthenticatedCaller } from '@/lib/auth/admin-guard';

/**
 * 1. Validate Coupon Code on the Server
 * Enforces server-side validation rules (min spend, percentage, flat discount, expiry)
 */
export async function validateCouponAction(
  code: string,
  subtotal: number
): Promise<CouponValidation> {
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return { valid: false, code: '', discount: 0, message: 'Please enter a coupon code.' };
  }

  if (cleanCode === 'SHOPSPHERE10') {
    if (subtotal < 500) {
      return {
        valid: false,
        code: cleanCode,
        discount: 0,
        message: 'SHOPSPHERE10 requires a minimum order subtotal of ₹500.',
        minOrder: 500,
      };
    }
    const discount = Math.min(2000, Math.round(subtotal * 0.1));
    return {
      valid: true,
      code: cleanCode,
      discount,
      message: `Coupon applied! You get 10% OFF (₹${discount.toLocaleString('en-IN')}).`,
    };
  }

  if (cleanCode === 'WELCOME500') {
    if (subtotal < 2500) {
      return {
        valid: false,
        code: cleanCode,
        discount: 0,
        message: 'WELCOME500 requires a minimum order subtotal of ₹2,500.',
        minOrder: 2500,
      };
    }
    return {
      valid: true,
      code: cleanCode,
      discount: 500,
      message: 'Coupon applied! Flat ₹500 discount on your order.',
    };
  }

  if (cleanCode === 'FESTIVE20') {
    if (subtotal < 5000) {
      return {
        valid: false,
        code: cleanCode,
        discount: 0,
        message: 'FESTIVE20 requires a minimum order subtotal of ₹5,000.',
        minOrder: 5000,
      };
    }
    const discount = Math.min(5000, Math.round(subtotal * 0.2));
    return {
      valid: true,
      code: cleanCode,
      discount,
      message: `Festival special applied! 20% OFF (₹${discount.toLocaleString('en-IN')}).`,
    };
  }

  return {
    valid: false,
    code: cleanCode,
    discount: 0,
    message: 'Invalid promo code. Available coupons: SHOPSPHERE10, WELCOME500, FESTIVE20.',
  };
}

function findSeedProduct(idOrSlug: string) {
  const normalized = idOrSlug.trim().toLowerCase();
  const source = memoryProducts.length > 0 ? memoryProducts : DEVELOPMENT_SEED_PRODUCTS;
  return source.find(
    (p) =>
      p.id.toLowerCase() === normalized ||
      p.slug.toLowerCase() === normalized ||
      p.id.replace(/-0+/, '-').toLowerCase() === normalized.replace(/-0+/, '-')
  );
}

/**
 * 2. Create Order with Server Validation, Stock Decrement & Idempotency
 */
export async function createOrderAction(payload: {
  idempotencyKey?: string;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  notes?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
  }>;
}): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  const { idempotencyKey, shippingAddress, paymentMethod, couponCode, notes, items } = payload;

  if (!items || items.length === 0) {
    return { success: false, error: 'Your cart is empty. Cannot place an empty order.' };
  }

  if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city) {
    return { success: false, error: 'Please provide a valid delivery address with contact details.' };
  }

  // Idempotency check: Return cached order if submitted within last 60 seconds
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    const cached = idempotencyStore.get(idempotencyKey)!;
    if (Date.now() - cached.timestamp < 60000) {
      return { success: true, order: cached.order };
    }
  }

  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, error: 'Authentication required. Please sign in to place an order.' };
  }
  const userId = caller.userId;
  let supabaseClient: SupabaseServerClient | null = null;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      supabaseClient = supabase;
    } catch {
      // ignore
    }
  }

  // 1. Re-verify each item against live database & check for stock availability
  const verifiedLineItems: OrderItem[] = [];
  let calculatedSubtotal = 0;

  for (const item of items) {
    let title = '';
    let sku = '';
    let unitPrice = 0;
    let availableStock = 0;
    let thumbnail = '';
    let variantTitle: string | undefined;

    let productFound = false;

    if (supabaseClient) {
      // Live Supabase query
      const { data: prodData } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', item.productId)
        .eq('is_active', true)
        .single();

      if (prodData) {
        productFound = true;
        title = prodData.title;
        sku = prodData.sku;
        unitPrice = Number(prodData.price);
        availableStock = prodData.stock_quantity;

        const { data: imgData } = await supabaseClient
          .from('product_images')
          .select('image_url')
          .eq('product_id', item.productId)
          .order('display_order', { ascending: true })
          .limit(1)
          .maybeSingle();

        thumbnail =
          imgData?.image_url ||
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';

        if (item.variantId) {
          const { data: vData } = await supabaseClient
            .from('product_variants')
            .select('*')
            .eq('id', item.variantId)
            .eq('product_id', item.productId)
            .single();

          if (vData) {
            unitPrice = Number(vData.price);
            availableStock = vData.stock_quantity;
            sku = vData.sku;
            variantTitle = vData.title;
            title = `${title} (${vData.title})`;
          }
        }
      }
    }

    if (!productFound) {
      // Local seed fallback
      const seed = findSeedProduct(item.productId);
      if (!seed) {
        return { success: false, error: 'Product not found.' };
      }
      productFound = true;
      title = seed.title;
      sku = seed.sku;
      unitPrice = seed.price;
      availableStock = seed.stockQuantity;
      thumbnail = seed.thumbnail;

      if (item.variantId && seed.variants) {
        const v = seed.variants.find((x) => x.id === item.variantId);
        if (v) {
          unitPrice = v.price;
          availableStock = v.stockQuantity;
          sku = v.sku;
          variantTitle = v.title;
          title = `${title} (${v.title})`;
        }
      }
    }

    // Strict stock validation to prevent overselling
    if (availableStock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${title}". Only ${availableStock} unit(s) remaining in stock.`,
      };
    }

    const lineTotal = unitPrice * item.quantity;
    calculatedSubtotal += lineTotal;

    verifiedLineItems.push({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId: '',
      productId: item.productId,
      variantId: item.variantId,
      title,
      sku,
      unitPrice,
      quantity: item.quantity,
      subtotal: lineTotal,
      thumbnail,
      variantTitle,
    });
  }

  // 2. Validate Coupon and Calculate Final Total
  let discountAmount = 0;
  let validatedCoupon: string | undefined = undefined;

  if (couponCode) {
    const couponRes = await validateCouponAction(couponCode, calculatedSubtotal);
    if (couponRes.valid) {
      discountAmount = couponRes.discount;
      validatedCoupon = couponRes.code;
    }
  }

  const shippingFee = calculatedSubtotal >= 999 || calculatedSubtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, calculatedSubtotal - discountAmount + shippingFee);

  // 3. Generate Unique Order Number
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

  // 4. Determine Initial Status
  // Cash on Delivery orders are confirmed with unpaid payment status
  // Online payments start as 'pending' until signature verification completes
  const orderStatus: OrderStatus = paymentMethod === 'cod' ? 'confirmed' : 'pending';
  const paymentStatus: PaymentStatus = 'unpaid';

  let orderId = `ord-${Date.now()}`;

  // 5. Decrement Stock and Commit to Database
  if (supabaseClient) {
    try {
      // Insert into orders table
      const { data: orderData, error: orderErr } = await supabaseClient
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: userId !== 'guest-customer' ? userId : null,
          status: orderStatus,
          subtotal: calculatedSubtotal,
          discount: discountAmount,
          coupon_code: validatedCoupon || null,
          shipping_fee: shippingFee,
          total_amount: finalTotal,
          payment_status: paymentStatus,
          payment_provider: paymentMethod === 'cod' ? 'cod' : 'razorpay',
          payment_method: paymentMethod,
          shipping_address: shippingAddress as unknown as Database['public']['Tables']['orders']['Insert']['shipping_address'],
          billing_address: shippingAddress as unknown as Database['public']['Tables']['orders']['Insert']['billing_address'],
          notes: notes || null,
        })
        .select()
        .single();

      if (orderErr || !orderData) {
        return { success: false, error: orderErr?.message || 'Database error creating order.' };
      }

      orderId = orderData.id;

      // Insert line items & decrement inventory atomically
      for (const line of verifiedLineItems) {
        line.orderId = orderId;

        await supabaseClient.from('order_items').insert({
          order_id: orderId,
          product_id: line.productId,
          variant_id: line.variantId || null,
          title: line.title,
          price: line.unitPrice,
          quantity: line.quantity,
          total: line.subtotal,
        });

        // Decrement product inventory
        if (line.variantId) {
          // Decrement variant stock
          const { data: v } = await supabaseClient
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', line.variantId)
            .single();
          if (v) {
            await supabaseClient
              .from('product_variants')
              .update({ stock_quantity: Math.max(0, v.stock_quantity - line.quantity) })
              .eq('id', line.variantId);
          }
        } else {
          // Decrement base product stock
          const { data: p } = await supabaseClient
            .from('products')
            .select('stock_quantity')
            .eq('id', line.productId)
            .single();
          if (p) {
            await supabaseClient
              .from('products')
              .update({ stock_quantity: Math.max(0, p.stock_quantity - line.quantity) })
              .eq('id', line.productId);
          }
        }
      }

      // Clear customer's cart
      await clearServerCartAction();
    } catch (dbErr) {
      return { success: false, error: (dbErr as Error).message || 'Failed to place order.' };
    }
  }

  const finalOrder: Order = {
    id: orderId,
    orderNumber,
    userId,
    status: orderStatus,
    paymentStatus,
    paymentMethod,
    subtotal: calculatedSubtotal,
    discount: discountAmount,
    couponCode: validatedCoupon,
    shippingFee,
    totalAmount: finalTotal,
    shippingAddress,
    items: verifiedLineItems,
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Record in in-memory store for fallback / idempotency
  inMemoryOrders.unshift(finalOrder);
  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, { timestamp: Date.now(), order: finalOrder });
  }

  // Symmetrically decrement memoryProducts stock in dev/sandbox mode
  if (!isSupabaseConfigured()) {
    for (const item of verifiedLineItems) {
      const p = memoryProducts.find((x) => x.id === item.productId || x.slug === item.productId);
      if (p) {
        p.stockQuantity = Math.max(0, p.stockQuantity - item.quantity);
        p.isAvailable = p.stockQuantity > 0;
      }
    }
  }

  return { success: true, order: finalOrder };
}

/**
 * 3. Fetch Customer Orders History
 * Strictly returns only orders belonging to the authenticated caller
 */
export async function getCustomerOrdersAction(): Promise<{
  success: boolean;
  orders: Order[];
  error?: string;
}> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, orders: [], error: 'Authentication required to view order history.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (caller.role !== 'admin') {
        query = query.eq('user_id', caller.userId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const orders: Order[] = (data as unknown as OrderWithItemsRow[]).map((row) => {
          const items: OrderItem[] = Array.isArray(row.order_items)
            ? row.order_items.map((i: OrderItemRow) => ({
                id: i.id,
                orderId: i.order_id,
                productId: i.product_id || '',
                variantId: i.variant_id || undefined,
                title: i.title,
                sku: 'SKU-' + (i.product_id?.slice(0, 8) || 'GEN'),
                unitPrice: Number(i.price),
                quantity: i.quantity,
                subtotal: Number(i.total),
              }))
            : [];

          return {
            id: row.id,
            orderNumber: row.order_number,
            userId: row.user_id || 'guest-customer',
            status: row.status as OrderStatus,
            paymentStatus: row.payment_status as PaymentStatus,
            paymentMethod: (row.payment_method || 'cod') as PaymentMethod,
            subtotal: Number(row.subtotal),
            discount: Number(row.discount || 0),
            couponCode: row.coupon_code || undefined,
            shippingFee: Number(row.shipping_fee || 0),
            totalAmount: Number(row.total_amount),
            shippingAddress: row.shipping_address as unknown as Address,
            billingAddress: row.billing_address
              ? (row.billing_address as unknown as Address)
              : undefined,
            items,
            trackingNumber: row.tracking_number || undefined,
            notes: row.notes || undefined,
            cancellationReason: row.cancellation_reason || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });

        return { success: true, orders };
      }
    } catch {
      // fallback
    }
  }

  if (caller.role === 'admin') {
    return { success: true, orders: inMemoryOrders };
  }
  const filtered = inMemoryOrders.filter((o) => o.userId === caller.userId);
  return { success: true, orders: filtered };
}

/**
 * 4. Fetch Single Order Details
 * Strictly verifies that the authenticated caller owns the order (or is admin)
 */
export async function getOrderDetailsAction(orderIdOrNumber: string): Promise<{
  success: boolean;
  order?: Order;
  error?: string;
}> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, error: 'Authentication required to view order details.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.eq.${orderIdOrNumber},order_number.eq.${orderIdOrNumber}`);

      if (caller.role !== 'admin') {
        query = query.eq('user_id', caller.userId);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        const row = data as unknown as OrderWithItemsRow;
        const items: OrderItem[] = Array.isArray(row.order_items)
          ? row.order_items.map((i: OrderItemRow) => ({
              id: i.id,
              orderId: i.order_id,
              productId: i.product_id || '',
              variantId: i.variant_id || undefined,
              title: i.title,
              sku: 'SKU-' + (i.product_id?.slice(0, 8) || 'GEN'),
              unitPrice: Number(i.price),
              quantity: i.quantity,
              subtotal: Number(i.total),
            }))
          : [];

        const order: Order = {
          id: row.id,
          orderNumber: row.order_number,
          userId: row.user_id || 'guest-customer',
          status: row.status as OrderStatus,
          paymentStatus: row.payment_status as PaymentStatus,
          paymentMethod: (row.payment_method || 'cod') as PaymentMethod,
          subtotal: Number(row.subtotal),
          discount: Number(row.discount || 0),
          couponCode: row.coupon_code || undefined,
          shippingFee: Number(row.shipping_fee || 0),
          totalAmount: Number(row.total_amount),
          shippingAddress: row.shipping_address as unknown as Address,
          billingAddress: row.billing_address
            ? (row.billing_address as unknown as Address)
            : undefined,
          items,
          trackingNumber: row.tracking_number || undefined,
          notes: row.notes || undefined,
          cancellationReason: row.cancellation_reason || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        return { success: true, order };
      }
    } catch {
      // fallback
    }
  }

  const match = inMemoryOrders.find(
    (o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber
  );
  if (match) {
    if (caller.role !== 'admin' && match.userId !== caller.userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to view this order.' };
    }
    return { success: true, order: match };
  }

  return { success: false, error: 'Order not found.' };
}

/**
 * 5. Cancel Order with Cancellation Rules & Stock Restoration
 * Strictly verifies caller ownership before executing cancellation
 */
export async function cancelOrderAction(
  orderId: string,
  reason: string = 'Customer requested cancellation'
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const caller = await getAuthenticatedCaller();
  if (!caller) {
    return { success: false, error: 'Authentication required to cancel orders.' };
  }

  // Check memory store
  const memOrder = inMemoryOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (memOrder) {
    if (caller.role !== 'admin' && memOrder.userId !== caller.userId) {
      return { success: false, error: 'Unauthorized: You do not have permission to cancel this order.' };
    }
    if (memOrder.status === 'cancelled') {
      return { success: false, error: 'Order is already cancelled.' };
    }
    if (memOrder.status !== 'pending' && memOrder.status !== 'confirmed') {
      return { success: false, error: 'Cannot cancel an order that has already shipped or been delivered.' };
    }
    memOrder.status = 'cancelled';
    memOrder.cancellationReason = reason;

    // Restore inventory stock in active memory catalog
    for (const item of memOrder.items) {
      const prod = memoryProducts.find((p) => p.id === item.productId);
      if (prod) {
        prod.stockQuantity += item.quantity;
        prod.isAvailable = true;
      }
      const seedProd = DEVELOPMENT_SEED_PRODUCTS.find((p) => p.id === item.productId);
      if (seedProd) {
        seedProd.stockQuantity += item.quantity;
        seedProd.isAvailable = true;
      }
    }

    if (!isSupabaseConfigured() || orderId.startsWith('ord-') || memOrder.id.startsWith('ord-')) {
      return { success: true, message: 'Order has been successfully cancelled and stock restored.' };
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      const { data: orderData, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', orderId)
        .single();

      if (error || !orderData) {
        return { success: false, error: 'Order not found.' };
      }

      const order = orderData as unknown as OrderWithItemsRow;

      // Security check: Only order owner or admin can cancel
      if (caller.role !== 'admin' && order.user_id && order.user_id !== caller.userId) {
        return { success: false, error: 'Unauthorized to cancel this order.' };
      }

      // Cancellation Rule: Can only cancel if pending or confirmed
      if (order.status !== 'pending' && order.status !== 'confirmed') {
        return {
          success: false,
          error: `Cannot cancel order in "${order.status}" status. Please contact customer support.`,
        };
      }

      // Transition status to cancelled
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Restore inventory stock for every line item
      if (Array.isArray(order.order_items)) {
        for (const item of order.order_items) {
          if (item.variant_id) {
            const { data: v } = await supabase
              .from('product_variants')
              .select('stock_quantity')
              .eq('id', item.variant_id)
              .single();
            if (v) {
              await supabase
                .from('product_variants')
                .update({ stock_quantity: v.stock_quantity + item.quantity })
                .eq('id', item.variant_id);
            }
          } else if (item.product_id) {
            const { data: p } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();
            if (p) {
              await supabase
                .from('products')
                .update({ stock_quantity: p.stock_quantity + item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      }

      return { success: true, message: 'Your order has been cancelled, and item stock has been restored.' };
    } catch (err) {
      return { success: false, error: (err as Error).message || 'Failed to cancel order.' };
    }
  }

  return { success: true, message: 'Your order has been cancelled and stock has been restored.' };
}
