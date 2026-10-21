'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Package,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { getOrderDetailsAction, cancelOrderAction } from '@/lib/orders/actions';
import {
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction,
  recordPaymentFailureAction,
} from '@/lib/payments/razorpay';
import { openRazorpayModal } from '@/lib/payments/checkout-client';
import { Order, OrderStatus } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('Changed my mind');
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      try {
        const res = await getOrderDetailsAction(orderId);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } finally {
        setIsLoading(false);
      }
    }
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await cancelOrderAction(order.id, cancelReason);
      if (res.success) {
        setCancelMessage(res.message || 'Order cancelled and item stock restored.');
        setShowCancelModal(false);
        // Refresh local order state
        setOrder((prev) =>
          prev ? { ...prev, status: 'cancelled', cancellationReason: cancelReason } : null
        );
      } else {
        setCancelError(res.error || 'Failed to cancel order.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const [isRetryingPayment, setIsRetryingPayment] = useState<boolean>(false);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleRetryPayment = async () => {
    if (!order) return;
    setIsRetryingPayment(true);
    setPaymentNotice(null);
    setPaymentError(null);

    try {
      const rzpRes = await createRazorpayOrderAction(order.id);
      if (!rzpRes.success || !rzpRes.razorpayOrderId || !rzpRes.keyId) {
        setIsRetryingPayment(false);
        setPaymentError(
          rzpRes.error ||
            'Could not initiate Razorpay payment. Razorpay test credentials may not be configured in the environment.'
        );
        return;
      }

      await openRazorpayModal({
        keyId: rzpRes.keyId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: rzpRes.razorpayOrderId,
        amountInPaise: rzpRes.amount || Math.round(order.totalAmount * 100),
        customerName: order.shippingAddress.fullName,
        customerPhone: order.shippingAddress.phone,
        onSuccess: async (payload) => {
          try {
            const verifyRes = await verifyRazorpayPaymentAction(payload);
            if (verifyRes.success) {
              setPaymentNotice('Payment verified and captured successfully!');
              setOrder((prev) =>
                prev
                  ? {
                      ...prev,
                      paymentStatus: 'paid',
                      status: 'confirmed',
                      razorpayPaymentId: payload.razorpayPaymentId,
                    }
                  : null
              );
            } else {
              setPaymentError(verifyRes.error || 'Payment signature verification failed.');
            }
          } catch {
            setPaymentError('Cryptographic payment verification failed.');
          } finally {
            setIsRetryingPayment(false);
          }
        },
        onDismiss: () => {
          recordPaymentFailureAction(order.id, 'DISMISSED', 'Customer closed payment window');
          setIsRetryingPayment(false);
          setPaymentNotice('Payment window was closed. You can retry at any time.');
        },
        onError: (errMsg) => {
          recordPaymentFailureAction(order.id, 'DECLINED', errMsg);
          setIsRetryingPayment(false);
          setPaymentError(`Payment was declined: ${errMsg}`);
        },
      });
    } catch (err) {
      setIsRetryingPayment(false);
      setPaymentError((err as Error).message || 'Failed to open payment gateway.');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Loading Order Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested order could not be located in your account.
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Orders</span>
        </Link>
      </div>
    );
  }

  // Delivery Stages
  const stages: Array<{ key: OrderStatus; label: string }> = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const stageOrder: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 1,
    processing: 2,
    shipped: 3,
    delivered: 4,
    cancelled: -1,
  };

  const currentStageIndex = stageOrder[order.status] ?? 0;
  const isCancellable = order.status === 'pending' || order.status === 'confirmed';

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Order History</span>
        </Link>

        {isCancellable && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel Order
          </button>
        )}
      </div>

      {cancelMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{cancelMessage}</span>
        </div>
      )}

      {paymentNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{paymentNotice}</span>
        </div>
      )}

      {paymentError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* Main Order Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Placed on:</span>
              <strong className="text-slate-900 font-mono">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-mono">
              {order.orderNumber}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-500 block">Total Amount</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Progress Tracker (or Cancelled Banner) */}
        {order.status === 'cancelled' ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>This Order Was Cancelled</span>
            </div>
            <p className="text-rose-700">
              Reason: {order.cancellationReason || 'Customer requested cancellation.'}
            </p>
            <p className="text-[11px] text-rose-600">
              Item stock has been restored to the active catalog.
            </p>
          </div>
        ) : (
          <div className="py-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
              Delivery Tracker
            </h3>
            <div className="grid grid-cols-5 gap-2 relative">
              {stages.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stage.key} className="text-center space-y-2 relative">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400'
                      } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`block text-[10px] sm:text-xs font-bold line-clamp-1 ${
                        isPassed ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery Destination & Payment Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Delivery Address</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-slate-600">
              <p className="font-bold text-slate-900">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-slate-500 font-mono text-xs pt-1">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Payment Details</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-bold text-slate-900 uppercase">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {order.paymentStatus.toUpperCase()}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Total Amount</span>
                <span className="font-mono text-base">{formatCurrency(order.totalAmount)}</span>
              </div>

              {order.paymentStatus !== 'paid' && order.status !== 'cancelled' && (
                <div className="pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    disabled={isRetryingPayment}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRetryingPayment ? 'Launching Razorpay...' : 'Complete Payment Online'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Line Items List */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">
            Ordered Items ({order.items.length})
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-indigo-600">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                      {item.title}
                    </h4>
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
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Cancel This Order?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel order #{order.orderNumber}? Once cancelled, reserved
                quantities will be restored to warehouse inventory.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Found cheaper price elsewhere">Found cheaper price elsewhere</option>
                <option value="Delivery time is too long">Delivery time is too long</option>
                <option value="Incorrect shipping address selected">Incorrect shipping address selected</option>
              </select>
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 font-medium">{cancelError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
