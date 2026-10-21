import React, { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  CreditCard,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { getOrderDetailsAction } from '@/lib/orders/actions';
import { formatCurrency } from '@/lib/utils';

interface SuccessPageProps {
  searchParams: Promise<{ orderNumber?: string }>;
}

export const metadata = {
  title: 'Order Confirmed | ShopSphere',
  description: 'Your order has been confirmed. Thank you for shopping with ShopSphere.',
};

async function OrderSuccessContent({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const orderNumber = params.orderNumber;

  if (!orderNumber) {
    notFound();
  }

  const { order } = await getOrderDetailsAction(orderNumber);

  if (!order) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <Package className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Order Lookup</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          We could not locate order &ldquo;{orderNumber}&rdquo;. Please verify the order number in your account.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase"
        >
          <span>View My Orders</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Estimated delivery date (3 business days ahead from order creation)
  const orderDate = new Date(order.createdAt);
  const deliveryDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      {/* Success Hero Banner */}
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Status: {order.status.toUpperCase()}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight pt-2">
            Thank You! Your Order is Confirmed
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            We have received your order and our fulfilment warehouse has begun processing it for express shipment.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs font-semibold">
          <div className="text-slate-600">
            Order Number: <strong className="text-slate-900 font-mono font-bold">{order.orderNumber}</strong>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <div className="text-slate-600 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>Est. Delivery: <strong className="text-slate-900">{formattedDeliveryDate}</strong></span>
          </div>
        </div>
      </div>

      {/* Grid: Delivery Details + Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Delivery Address Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Shipping Destination</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-600 space-y-1">
            <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.street}</p>
            {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
            </p>
            <p className="text-slate-500 font-mono text-xs pt-1">Phone: {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Payment Summary</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-600 space-y-2">
            <div className="flex justify-between">
              <span>Payment Mode</span>
              <span className="font-bold text-slate-900 uppercase">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">
                {order.paymentStatus.toUpperCase()} (Pay on delivery)
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
              <span>Total Payable</span>
              <span className="text-base font-black font-mono">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ordered Items Breakdown */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h2 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center justify-between">
          <span>Items in this Shipment ({order.items.length})</span>
          <span className="text-xs text-slate-400 font-normal">Standard Ground Shipping</span>
        </h2>

        <div className="divide-y divide-slate-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-14 h-14 rounded-2xl object-cover bg-slate-50 border border-slate-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    SSP
                  </div>
                )}
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">SKU: {item.sku}</span>
                    <span>•</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                </div>
              </div>

              <div className="text-right font-mono font-bold text-xs sm:text-sm text-slate-900">
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href={`/account/orders/${order.id}`}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
        >
          <Package className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>
        <Link
          href="/products"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-200"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600">Retrieving Order Details...</p>
        </div>
      }
    >
      <OrderSuccessContent searchParams={searchParams} />
    </Suspense>
  );
}
