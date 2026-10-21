'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Plus,
  ExternalLink,
  Users,
  Package,
  ArrowRight,
  Warehouse,
  Tag,
  Star,
  RefreshCw,
} from 'lucide-react';
import { getAdminDashboardMetricsAction } from '@/lib/admin/actions';
import { AdminDashboardMetrics } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadMetrics = () => {
    getAdminDashboardMetricsAction().then((res) => {
      if (res.success && res.metrics) {
        setMetrics(res.metrics);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    getAdminDashboardMetricsAction().then((res) => {
      if (isMounted) {
        if (res.success && res.metrics) {
          setMetrics(res.metrics);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Loading real-time marketplace metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Store Performance & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics, inventory management, and fulfillment operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadMetrics}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/products"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <span>Customer Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>


      {/* Low Stock Alert Banner */}
      {metrics.lowStockProducts.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-amber-300">
                Low Stock Warning: {metrics.lowStockCount} Product(s) Below Safety Threshold
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {metrics.lowStockProducts.map((p) => `${p.title} (${p.stockQuantity} left)`).join(' • ')}
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-colors shrink-0 text-center"
          >
            Manage Stock &rarr;
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <span className="flex items-center text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" /> Live Verified
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(metrics.totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-500">
            Across {metrics.totalOrders} total platform transactions
          </p>
        </div>

        {/* Metric 2: Orders */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Orders Placed
            </span>
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.totalOrders}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-amber-400 font-bold">{metrics.pendingOrdersCount} Pending</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{metrics.deliveredOrdersCount} Delivered</span>
          </div>
        </div>

        {/* Metric 3: Products & Stock */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Catalog Products
            </span>
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{metrics.totalProducts}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="text-amber-400 font-bold">{metrics.lowStockCount} Low Stock</span>
            <span>•</span>
            <span className="text-rose-400 font-bold">{metrics.outOfStockCount} Out of Stock</span>
          </div>
        </div>

        {/* Metric 4: Average Order Value & Customers */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Average Order Value
            </span>
            <span className="p-1 rounded-lg bg-purple-500/10 text-purple-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">
            {formatCurrency(metrics.averageOrderValue)}
          </p>
          <p className="text-[11px] text-slate-500">
            {metrics.totalCustomers} registered customer accounts
          </p>
        </div>
      </div>

      {/* Main Operational Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Recent Real Orders */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Recent Orders</h2>
              <p className="text-xs text-slate-400">Latest customer transactions from database</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>View All Orders ({metrics.totalOrders})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {metrics.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 font-mono font-bold text-white">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5">{order.shippingAddress.fullName}</td>
                    <td className="py-3.5 text-slate-400">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} pcs
                    </td>
                    <td className="py-3.5 font-bold text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
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
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                      >
                        Details &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Category Sales & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Category Sales Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-base font-black text-white tracking-tight">Sales by Category</h2>
            <div className="space-y-3">
              {metrics.salesByCategory.map((cat) => {
                const percent = metrics.totalRevenue > 0
                  ? Math.round((cat.sales / metrics.totalRevenue) * 100)
                  : 0;

                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-300">{cat.category}</span>
                      <span className="font-bold text-white">{formatCurrency(cat.sales)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Operations Links */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3">
            <h2 className="text-base font-black text-white tracking-tight">Operations Center</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/admin/inventory"
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-400/40 transition-colors flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                <Warehouse className="w-4 h-4 text-amber-400" />
                <span>Stock Control</span>
              </Link>
              <Link
                href="/admin/coupons"
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-400/40 transition-colors flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Coupons</span>
              </Link>
              <Link
                href="/admin/reviews"
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-400/40 transition-colors flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                <Star className="w-4 h-4 text-amber-400" />
                <span>Reviews</span>
              </Link>
              <Link
                href="/admin/customers"
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-400/40 transition-colors flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Customers</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
