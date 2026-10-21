'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  CreditCard,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { getAdminOrderDetailsAction, updateOrderStatusAction } from '@/lib/admin/actions';
import { Order, OrderStatus } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('confirmed');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAdminOrderDetailsAction(resolvedParams.id).then((res) => {
      if (isMounted) {
        if (res.success && res.order) {
          setOrder(res.order);
          setStatus(res.order.status);
          setTrackingNumber(res.order.trackingNumber || '');
          setAdminNotes(res.order.notes || '');
        } else {
          setStatusMessage({ type: 'error', text: res.error || 'Order not found.' });
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsUpdating(true);
    setStatusMessage(null);

    const res = await updateOrderStatusAction(order.id, status, trackingNumber, adminNotes);
    setIsUpdating(false);

    if (res.success && res.order) {
      setOrder(res.order);
      setStatus(res.order.status);
      setStatusMessage({ type: 'success', text: `Order status updated to ${status} successfully.` });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update order status.' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading order records...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h1 className="text-xl font-bold text-white">Order Not Found</h1>
        <p className="text-xs text-slate-400">Order ID {resolvedParams.id} does not exist.</p>
        <Link href="/admin/orders" className="text-xs font-bold text-amber-400 hover:underline">
          &larr; Return to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/orders"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>
        <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
          FULFILLMENT PROTOCOL
        </span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white font-mono">{order.orderNumber}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                order.status === 'delivered'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  : order.status === 'shipped'
                  ? 'bg-blue-950/80 text-blue-400 border border-blue-800'
                  : order.status === 'confirmed' || order.status === 'processing'
                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-800'
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        <div className="text-right sm:text-right">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Order Total
          </span>
          <p className="text-2xl font-black text-amber-400">{formatCurrency(order.totalAmount)}</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-800 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: Left Items & Financials | Right Status Workflow & Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Line Items & Financial Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Purchased Line Items ({order.items.length})</span>
            </h2>

            <div className="divide-y divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between text-xs gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-bold text-white truncate">{item.title}</p>
                    <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>
                    <p className="text-slate-400">
                      {formatCurrency(item.unitPrice)} &times; {item.quantity} unit(s)
                    </p>
                  </div>
                  <span className="font-bold text-white shrink-0">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Coupon Discount ({order.couponCode || 'PROMO'})</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Shipping Charges</span>
                <span>{order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-white pt-2 border-t border-slate-800">
                <span>Grand Total</span>
                <span className="text-amber-400">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Payment Details</span>
            </h2>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Payment Method</span>
                <span className="font-bold text-white uppercase">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Payment Status</span>
                <span
                  className={`font-bold uppercase ${
                    order.paymentStatus === 'paid'
                      ? 'text-emerald-400'
                      : order.paymentStatus === 'failed'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.razorpayPaymentId && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">Razorpay Payment ID</span>
                  <span className="font-mono text-xs text-amber-300">{order.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Status Transition & Shipping Details */}
        <div className="space-y-6">
          {/* Order Status & Tracking Update Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>Fulfillment & Dispatch</span>
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Update Order Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400 capitalize"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled (Restores Stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tracking Number (Courier AWB)
                </label>
                <input
                  type="text"
                  placeholder="e.g. BLUEDART-89124791"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Internal Operations Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Fulfillment warehouse remarks..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isUpdating ? 'Updating...' : 'Save Fulfillment Status'}</span>
              </button>
            </form>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Delivery Address</span>
            </h2>

            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-slate-400 font-mono pt-1">Phone: {order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
