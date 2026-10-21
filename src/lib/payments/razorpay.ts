'use server';

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  PaymentMethod,
  PaymentRecord,
  RazorpayOrderResponse,
  RazorpayVerificationPayload,
} from '@/types/ecommerce';
import { getOrderDetailsAction } from '@/lib/orders/actions';
import { clearServerCartAction } from '@/lib/cart/actions';

// Local memory store for payment records (for test/resilient fallback)
const inMemoryPayments: PaymentRecord[] = [];

/**
 * Checks if Razorpay credentials are fully configured in server environment
 */
export async function isRazorpayConfigured(): Promise<boolean> {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return Boolean(keyId && keySecret && !keyId.includes('yourKeyId') && !keySecret.includes('your_razorpay'));
}

/**
 * Get configured Razorpay SDK instance
 */
function getRazorpayInstance(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id.includes('yourKeyId') || key_secret.includes('your_razorpay')) {
    return null;
  }

  return new Razorpay({ key_id, key_secret });
}

/**
 * 1. Create a Razorpay Payment Order on the Server
 * Zero-trust: The order amount is computed strictly on the server from verified order records.
 */
export async function createRazorpayOrderAction(
  orderIdOrNumber: string
): Promise<RazorpayOrderResponse> {
  try {
    const { order, success } = await getOrderDetailsAction(orderIdOrNumber);

    if (!success || !order) {
      return { success: false, error: 'Order not found. Cannot initiate payment.' };
    }

    if (order.paymentStatus === 'paid') {
      return { success: false, error: 'This order has already been paid.' };
    }

    if (order.status === 'cancelled') {
      return { success: false, error: 'Cannot pay for a cancelled order.' };
    }

    // Convert INR rupees to paise (e.g. ₹2,499.00 -> 249900 paise)
    const amountInPaise = Math.round(order.totalAmount * 100);

    if (amountInPaise <= 0) {
      return { success: false, error: 'Order total amount is invalid.' };
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const razorpay = getRazorpayInstance();

    // If real credentials are not configured, report clearly
    if (!razorpay || !keyId) {
      return {
        success: false,
        error:
          'Razorpay test credentials are not configured. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local to open the live test gateway.',
      };
    }

    // Call Razorpay API to generate an authoritative payment order
    const rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
    });

    // Update order with razorpay_order_id in database and memory
    order.razorpayOrderId = rzpOrder.id;

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase
          .from('orders')
          .update({
            razorpay_order_id: rzpOrder.id,
            payment_provider: 'razorpay',
            payment_method: 'razorpay',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        // Record pending payment transaction
        await supabase.from('payments').insert({
          order_id: order.id,
          user_id: order.userId !== 'guest-customer' ? order.userId : null,
          amount: order.totalAmount,
          currency: 'INR',
          status: 'pending',
          payment_method: 'razorpay',
          razorpay_order_id: rzpOrder.id,
          metadata: {
            receipt: order.orderNumber,
            amount_in_paise: amountInPaise,
          },
        });
      } catch (dbErr) {
        console.warn('Database notice while saving razorpay_order_id:', dbErr);
      }
    }

    // Record in memory store
    const memPayment: PaymentRecord = {
      id: `pay-rec-${Date.now()}`,
      orderId: order.id,
      userId: order.userId,
      amount: order.totalAmount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'razorpay',
      razorpayOrderId: rzpOrder.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    inMemoryPayments.unshift(memPayment);

    return {
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId,
      orderId: order.id,
      orderNumber: order.orderNumber,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to create payment order.';
    return { success: false, error: errorMsg };
  }
}

/**
 * 2. Cryptographic HMAC-SHA256 Signature Verification
 * Server-only verification. Compares expected HMAC digest against submitted Razorpay signature.
 */
export async function verifyRazorpayPaymentAction(
  payload: RazorpayVerificationPayload
): Promise<{
  success: boolean;
  orderNumber?: string;
  error?: string;
}> {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return { success: false, error: 'Missing required payment verification parameters.' };
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return {
      success: false,
      error: 'Server error: RAZORPAY_KEY_SECRET is not configured on the server.',
    };
  }

  // 1. Generate expected signature: HMAC-SHA256 of `order_id|payment_id`
  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generatedSignature = crypto.createHmac('sha256', keySecret).update(text).digest('hex');

  // 2. Perform constant-time comparison to prevent timing attacks
  const isSignatureValid =
    generatedSignature.length === razorpaySignature.length &&
    crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpaySignature));

  if (!isSignatureValid) {
    // Record failure in audit log
    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        await supabase.from('payments').insert({
          order_id: orderId,
          amount: 0,
          currency: 'INR',
          status: 'failed',
          payment_method: 'razorpay',
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: razorpaySignature,
          error_code: 'SIGNATURE_MISMATCH',
          error_description: 'Tampered or invalid cryptographic payment signature detected.',
        });
      } catch {
        // ignore
      }
    }

    return {
      success: false,
      error: 'Payment verification failed: Invalid cryptographic signature. Transaction rejected.',
    };
  }

  // 3. Signature is authentic: Commit paid status in database
  const { order } = await getOrderDetailsAction(orderId);
  const orderNumber = order?.orderNumber || 'ORD-COMPLETED';

  if (order) {
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.razorpayPaymentId = razorpayPaymentId;
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();

      // Update orders table
      await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          razorpay_payment_id: razorpayPaymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      // Record captured payment
      await supabase.from('payments').insert({
        order_id: orderId,
        user_id: order?.userId !== 'guest-customer' ? order?.userId : null,
        amount: order?.totalAmount || 0,
        currency: 'INR',
        status: 'captured',
        payment_method: 'razorpay',
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      });
    } catch (err) {
      console.warn('Database notice while saving payment verification:', err);
    }
  }

  // Update in-memory payment record
  const memPayment = inMemoryPayments.find((p) => p.razorpayOrderId === razorpayOrderId);
  if (memPayment) {
    memPayment.status = 'captured';
    memPayment.razorpayPaymentId = razorpayPaymentId;
    memPayment.razorpaySignature = razorpaySignature;
    memPayment.updatedAt = new Date().toISOString();
  }

  // Clear customer cart
  await clearServerCartAction();

  return { success: true, orderNumber };
}

/**
 * 3. Record Payment Failure Action
 * Used when a payment gateway attempt fails or customer cancels payment
 */
export async function recordPaymentFailureAction(
  orderId: string,
  errorCode?: string,
  errorDescription?: string
): Promise<{ success: boolean; message?: string }> {
  const { order } = await getOrderDetailsAction(orderId);
  if (order && order.paymentStatus !== 'paid') {
    order.paymentStatus = 'failed';
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      await supabase.from('payments').insert({
        order_id: orderId,
        amount: order?.totalAmount || 0,
        currency: 'INR',
        status: 'failed',
        payment_method: 'razorpay',
        error_code: errorCode || 'PAYMENT_FAILED',
        error_description: errorDescription || 'Transaction failed or was dismissed by customer.',
      });
    } catch {
      // ignore
    }
  }

  return { success: true, message: 'Payment failure recorded. Customer may retry payment.' };
}

/**
 * 4. Helper for Webhook Signature Verification
 * Uses raw body buffer string and webhook secret
 */
export async function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!rawBody || !signature || !secret) {
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  return (
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  );
}

/**
 * 5. Retrieve Payment Audit Records for an Order
 */
export async function getOrderPaymentsAction(orderId: string): Promise<{
  success: boolean;
  payments: PaymentRecord[];
}> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const payments: PaymentRecord[] = data.map((row) => ({
          id: row.id,
          orderId: row.order_id,
          userId: row.user_id || undefined,
          amount: Number(row.amount),
          currency: row.currency,
          status: row.status,
          paymentMethod: (row.payment_method as PaymentMethod) || 'razorpay',
          razorpayOrderId: row.razorpay_order_id || undefined,
          razorpayPaymentId: row.razorpay_payment_id || undefined,
          razorpaySignature: row.razorpay_signature || undefined,
          errorCode: row.error_code || undefined,
          errorDescription: row.error_description || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        return { success: true, payments };
      }
    } catch {
      // fallback
    }
  }

  const filtered = inMemoryPayments.filter((p) => p.orderId === orderId);
  return { success: true, payments: filtered };
}
