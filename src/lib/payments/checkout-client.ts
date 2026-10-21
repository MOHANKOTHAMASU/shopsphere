'use client';

import { RazorpayVerificationPayload } from '@/types/ecommerce';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
  close: () => void;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  name: string;
  description: string;
  order_id: string; // Razorpay Order ID (rzp_order_...)
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    backdrop_color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

/**
 * Dynamically loads the official Razorpay Checkout script if not already present
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById('razorpay-checkout-js');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-js';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
}

/**
 * Opens the interactive Razorpay Checkout Modal for the customer
 */
export async function openRazorpayModal(params: {
  keyId: string;
  orderId: string; // ShopSphere internal order ID
  orderNumber: string;
  razorpayOrderId: string; // rzp_order_...
  amountInPaise: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: (payload: RazorpayVerificationPayload) => Promise<void> | void;
  onDismiss?: () => void;
  onError?: (error: string) => void;
}): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || !window.Razorpay) {
    params.onError?.('Failed to load Razorpay checkout SDK. Please check your internet connection.');
    return;
  }

  const options: RazorpayCheckoutOptions = {
    key: params.keyId,
    amount: params.amountInPaise,
    currency: 'INR',
    name: 'ShopSphere',
    description: `Order #${params.orderNumber}`,
    order_id: params.razorpayOrderId,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=128&q=80',
    prefill: {
      name: params.customerName || '',
      email: params.customerEmail || '',
      contact: params.customerPhone || '',
    },
    notes: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
    },
    theme: {
      color: '#4f46e5', // ShopSphere primary indigo
    },
    modal: {
      ondismiss: () => {
        params.onDismiss?.();
      },
    },
    handler: (response) => {
      params.onSuccess({
        orderId: params.orderId,
        razorpayOrderId: response.razorpay_order_id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature,
      });
    },
  };

  const rzp = new window.Razorpay(options);

  rzp.on('payment.failed', (response: unknown) => {
    const errorObj = (response as { error?: { description?: string } })?.error;
    const msg = errorObj?.description || 'Payment was declined by the issuer.';
    params.onError?.(msg);
  });

  rzp.open();
}
