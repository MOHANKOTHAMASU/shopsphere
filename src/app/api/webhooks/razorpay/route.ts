import { NextRequest, NextResponse } from 'next/server';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { getOrderDetailsAction } from '@/lib/orders/actions';
import { checkRateLimit } from '@/lib/security/rate-limit';

// In-memory processed event tracker for idempotency during tests / local runs
const processedEventIds = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting check (max 120 webhooks per minute)
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'gateway';
    const rateLimit = checkRateLimit(`webhook:${clientIp}`, 120, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for webhook ingestion.' },
        { status: 429 }
      );
    }

    // 1. Extract raw body text and signature header
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header.' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret && process.env.NODE_ENV === 'production') {
      console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is not configured in production.');
      return NextResponse.json(
        { error: 'Webhook secret is not configured on the server.' },
        { status: 500 }
      );
    }
    const effectiveSecret = webhookSecret || 'whsec_test_secret_998877';

    // 2. Cryptographically verify signature using raw body and secret
    const isValid = await verifyRazorpayWebhookSignature(rawBody, signature, effectiveSecret);
    if (!isValid) {
      console.error('Invalid Razorpay webhook signature detected.');
      return NextResponse.json(
        { error: 'Invalid cryptographic webhook signature.' },
        { status: 400 }
      );
    }

    // 3. Parse JSON event payload safely
    const event = JSON.parse(rawBody);
    const eventId = event.id || req.headers.get('x-razorpay-event-id') || `event-${Date.now()}`;
    const eventType = event.event as string;

    // 4. Idempotency Check: Prevent duplicate webhook processing
    if (processedEventIds.has(eventId)) {
      return NextResponse.json(
        { received: true, status: 'duplicate_event_already_processed' },
        { status: 200 }
      );
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = await createClient();
        const { data: existingEvent } = await supabase
          .from('payment_events')
          .select('id')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvent) {
          processedEventIds.add(eventId);
          return NextResponse.json(
            { received: true, status: 'duplicate_event_already_processed' },
            { status: 200 }
          );
        }

        // Register event in payment_events table
        await supabase.from('payment_events').insert({
          event_id: eventId,
          event_type: eventType,
          payload: event,
        });
      } catch (dbErr) {
        console.warn('Database notice checking webhook event idempotency:', dbErr);
      }
    }

    processedEventIds.add(eventId);

    // 5. Handle Razorpay Payment Events
    const paymentEntity = event.payload?.payment?.entity;
    const orderEntity = event.payload?.order?.entity;

    const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
    const rzpPaymentId = paymentEntity?.id;
    const internalOrderId =
      paymentEntity?.notes?.orderId || orderEntity?.notes?.orderId;

    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        if (rzpOrderId || internalOrderId) {
          // Look up order in ShopSphere
          const lookupKey = internalOrderId || rzpOrderId;
          const { order } = await getOrderDetailsAction(lookupKey);

          if (order) {
            order.paymentStatus = 'paid';
            order.status = 'confirmed';
            order.razorpayPaymentId = rzpPaymentId;

            if (isSupabaseConfigured()) {
              try {
                const supabase = await createClient();
                await supabase
                  .from('orders')
                  .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    razorpay_payment_id: rzpPaymentId || null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', order.id);

                await supabase.from('payments').insert({
                  order_id: order.id,
                  user_id: order.userId !== 'guest-customer' ? order.userId : null,
                  amount: order.totalAmount,
                  currency: 'INR',
                  status: 'captured',
                  payment_method: 'razorpay',
                  razorpay_order_id: rzpOrderId || null,
                  razorpay_payment_id: rzpPaymentId || null,
                  metadata: {
                    webhook_event: eventType,
                    eventId,
                  },
                });
              } catch (dbErr) {
                console.warn('Database error updating order on payment.captured:', dbErr);
              }
            }
          }
        }
        break;
      }

      case 'payment.failed': {
        if (rzpOrderId || internalOrderId) {
          const lookupKey = internalOrderId || rzpOrderId;
          const { order } = await getOrderDetailsAction(lookupKey);

          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'failed';

            if (isSupabaseConfigured()) {
              try {
                const supabase = await createClient();
                await supabase
                  .from('orders')
                  .update({
                    payment_status: 'failed',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', order.id);

                await supabase.from('payments').insert({
                  order_id: order.id,
                  amount: order.totalAmount,
                  currency: 'INR',
                  status: 'failed',
                  payment_method: 'razorpay',
                  razorpay_order_id: rzpOrderId || null,
                  razorpay_payment_id: rzpPaymentId || null,
                  error_code: paymentEntity?.error_code || 'PAYMENT_FAILED',
                  error_description:
                    paymentEntity?.error_description || 'Payment failed during gateway processing.',
                  metadata: {
                    webhook_event: eventType,
                    eventId,
                  },
                });
              } catch (dbErr) {
                console.warn('Database error updating order on payment.failed:', dbErr);
              }
            }
          }
        }
        break;
      }

      case 'refund.processed':
      case 'refund.created': {
        if (rzpOrderId || internalOrderId) {
          const lookupKey = internalOrderId || rzpOrderId;
          const { order } = await getOrderDetailsAction(lookupKey);

          if (order) {
            order.paymentStatus = 'refunded';

            if (isSupabaseConfigured()) {
              try {
                const supabase = await createClient();
                await supabase
                  .from('orders')
                  .update({
                    payment_status: 'refunded',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', order.id);

                await supabase.from('payments').insert({
                  order_id: order.id,
                  amount: order.totalAmount,
                  currency: 'INR',
                  status: 'refunded',
                  payment_method: 'razorpay',
                  razorpay_order_id: rzpOrderId || null,
                  razorpay_payment_id: rzpPaymentId || null,
                  metadata: {
                    webhook_event: eventType,
                    eventId,
                  },
                });
              } catch (dbErr) {
                console.warn('Database error updating order on refund.processed:', dbErr);
              }
            }
          }
        }
        break;
      }

      default:
        // Other non-critical event types acknowledged safely
        break;
    }

    return NextResponse.json({ received: true, event: eventType }, { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error processing webhook.';
    console.error('Webhook error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
