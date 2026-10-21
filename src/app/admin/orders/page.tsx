'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Eye, Clock } from 'lucide-react';
import { getAdminOrdersAction, updateOrderStatusAction } from '@/lib/admin/actions';
import { Order, OrderStatus, PaymentStatus } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadOrders = (st: string, pay: string, q: string) => {
    const filters: { status?: OrderStatus; paymentStatus?: PaymentStatus; search?: string } = {};
    if (st !== 'all') filters.status = st as OrderStatus;
    if (pay !== 'all') filters.paymentStatus = pay as PaymentStatus;
    if (q.trim()) filters.search = q.trim();

    getAdminOrdersAction(filters).then((res) => {
      if (res.success) setOrders(res.orders);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    const filters: { status?: OrderStatus; paymentStatus?: PaymentStatus } = {};
    if (statusFilter !== 'all') filters.status = statusFilter as OrderStatus;
    if (paymentFilter !== 'all') filters.paymentStatus = paymentFilter as PaymentStatus;

    getAdminOrdersAction(filters).then((res) => {
      if (isMounted) {
        if (res.success) setOrders(res.orders);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [statusFilter, paymentFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    loadOrders(statusFilter, paymentFilter, searchQuery);
  };

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const res = await updateOrderStatusAction(orderId, newStatus);
    if (res.success) {
      setStatusMessage(`Order status updated to ${newStatus}.`);
      loadOrders(statusFilter, paymentFilter, searchQuery);
    } else {
      setStatusMessage(res.error || 'Failed to update order status.');
    }
    setUpdatingId(null);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Order Fulfillment & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real database customer transactions, payment verification, and delivery dispatch
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-slate-900 border border-amber-500/40 rounded-2xl text-xs font-semibold text-amber-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(
            (s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors capitalize cursor-pointer ${
                  statusFilter === s
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>

        {/* Payment & Search Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Payment Pending</option>
            <option value="failed">Payment Failed</option>
          </select>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Order #, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </form>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No matching orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Items</th>
                  <th className="py-3.5 px-3">Total Amount</th>
                  <th className="py-3.5 px-3">Payment</th>
                  <th className="py-3.5 px-3">Order Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-white">{o.orderNumber}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(o.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-slate-200">{o.shippingAddress.fullName}</p>
                      <p className="text-[10px] text-slate-400">{o.shippingAddress.phone}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-slate-300">
                        {o.items.reduce((s, i) => s + i.quantity, 0)} items
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {o.paymentMethod}
                        </span>
                        <span
                          className={`block text-[10px] font-bold ${
                            o.paymentStatus === 'paid'
                              ? 'text-emerald-400'
                              : o.paymentStatus === 'failed'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {o.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <select
                        disabled={updatingId === o.id || o.status === 'delivered' || o.status === 'cancelled'}
                        value={o.status}
                        onChange={(e) => handleQuickStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`h-8 px-2 rounded-lg text-xs font-bold border capitalize focus:outline-none cursor-pointer disabled:cursor-not-allowed ${
                          o.status === 'delivered'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : o.status === 'shipped'
                            ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                            : o.status === 'confirmed' || o.status === 'processing'
                            ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
