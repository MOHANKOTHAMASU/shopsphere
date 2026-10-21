'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/track/page.tsx
// Public Order Tracking & Live Milestone Tracker
// -----------------------------------------------------------------------------

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Truck,
  CheckCircle2,
  Search,
  MapPin,
  ArrowRight,
  AlertCircle,
  Headphones,
} from 'lucide-react';
import { getOrderDetailsAction } from '@/lib/orders/actions';
import { Order, OrderStatus } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

const ORDER_STAGES: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'pending', label: 'Order Placed', desc: 'Received and awaiting payment/confirmation' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Order verified by seller and inventory allocated' },
  { key: 'processing', label: 'Packed', desc: 'Securely packaged at fulfillment hub' },
  { key: 'shipped', label: 'In Transit', desc: 'Dispatched via express courier partner' },
  { key: 'delivered', label: 'Delivered', desc: 'Successfully handed over at destination' },
];

function OrderTrackerContent() {
  const searchParams = useSearchParams();
  const initialQuery =
    searchParams.get('orderNumber') || searchParams.get('orderId') || searchParams.get('q') || '';

  const [orderQuery, setOrderQuery] = useState(initialQuery);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTracking = async (q: string) => {
    const clean = q.trim();
    if (!clean) {
      setErrorMessage('Please enter a valid order number or order ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await getOrderDetailsAction(clean);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setOrder(null);
        setErrorMessage(
          `No order found matching "${clean}". Please verify your order confirmation SMS/email or try "ORD-20261020-0001".`
        );
      }
    } catch {
      setOrder(null);
      setErrorMessage('Could not track order at this moment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (!initialQuery) return;

    const timer = setTimeout(() => {
      setIsLoading(true);
      getOrderDetailsAction(initialQuery)
        .then((res) => {
          if (!ignore) {
            if (res.success && res.order) {
              setOrder(res.order);
              setErrorMessage(null);
            } else {
              setOrder(null);
              setErrorMessage(res.error || 'No matching order found.');
            }
          }
        })
        .catch(() => {
          if (!ignore) {
            setOrder(null);
            setErrorMessage('Could not track order at this moment. Please try again.');
          }
        })
        .finally(() => {
          if (!ignore) {
            setIsLoading(false);
          }
        });
    }, 0);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderQuery);
  };

  // Determine stage index
  const stageKeys = ORDER_STAGES.map((s) => s.key);
  const currentStageIndex = order ? stageKeys.indexOf(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
          <Truck className="w-3.5 h-3.5" />
          <span>Real-Time Shipment Tracking</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Track Your Package
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Enter your ShopSphere Order Number (e.g. ORD-20261020-0001) to view live courier milestones
          and delivery status.
        </p>
      </div>

      {/* Tracking Search Input Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="e.g. ORD-20261020-0001 or Order ID"
              className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase font-mono tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Package</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Pick */}
        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
          <span>Try sample order:</span>
          <button
            type="button"
            onClick={() => {
              setOrderQuery('ORD-20261020-0001');
              fetchTracking('ORD-20261020-0001');
            }}
            className="font-mono font-bold text-indigo-600 hover:underline bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
          >
            ORD-20261020-0001
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Order Tracking Result Showcase */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Order Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Shipment Reference
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {order.orderNumber}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ordered on{' '}
                <strong className="text-slate-700">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Current Status
              </span>
              <span
                className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  order.status === 'delivered'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.status === 'shipped'
                    ? 'bg-indigo-100 text-indigo-800'
                    : order.status === 'cancelled'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          {/* Stepper Milestone Visualization */}
          {order.status === 'cancelled' ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <p className="font-bold">This shipment was cancelled.</p>
              <p className="text-rose-600 mt-0.5">
                Reason: {order.cancellationReason || 'Customer requested cancellation.'}
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Milestone Timeline
              </h3>
              <div className="grid grid-cols-5 gap-2 relative">
                {ORDER_STAGES.map((st, idx) => {
                  const isPassed = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;

                  return (
                    <div key={st.key} className="text-center space-y-2 relative">
                      <div
                        className={`w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isPassed
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-400'
                        } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                      >
                        {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`block text-[11px] font-bold line-clamp-1 ${
                          isPassed ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Courier & Destination Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            {/* Courier Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Truck className="w-4 h-4 text-indigo-600" />
                <span>Courier & Logistics Details</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="text-slate-400">Logistics Partner:</span>{' '}
                  <strong className="text-slate-800">Delhivery Express / Blue Dart</strong>
                </p>
                <p>
                  <span className="text-slate-400">Tracking AWB:</span>{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {order.trackingNumber || `AWB-${order.id.slice(-8).toUpperCase()}`}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">Payment:</span>{' '}
                  <span className="uppercase font-bold text-slate-800">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid (Razorpay)'}
                  </span>{' '}
                  ({order.paymentStatus})
                </p>
              </div>
            </div>

            {/* Destination Address */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>Delivery Destination</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  Contact: {order.shippingAddress.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Ordered Products Preview */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Package Items ({order.items.length})
            </h4>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 overflow-hidden relative shrink-0">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="36px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 truncate max-w-xs">{item.title}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-3">
            <Link
              href={`/account/orders/${order.id}`}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>View Full Order Invoice & Receipt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/contact"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Need Help with Delivery?</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-2">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading Order Tracking Portal...</p>
        </div>
      }
    >
      <OrderTrackerContent />
    </Suspense>
  );
}
