// -----------------------------------------------------------------------------
// src/app/admin/pricing/PricingDashboardClient.tsx
// ShopSphere Admin Pricing Intelligence, Profitability Guardrails & Approval Queue
// -----------------------------------------------------------------------------

'use client';

import React, { useState, useTransition } from 'react';
import {
  PricingDashboardItem,
} from '@/lib/pricing/store';
import { PriceChangeAuditEntry, PriceTier } from '@/types/pricing';
import {
  approvePriceChangeAction,
  rejectPriceChangeAction,
  updateSupplierCostAction,
} from '@/lib/pricing/actions';
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Search,
  History,
  ExternalLink,
  Tag,
  X,
} from 'lucide-react';

interface PricingDashboardClientProps {
  initialItems: PricingDashboardItem[];
  summary: {
    totalProducts: number;
    requiresReviewCount: number;
    shopSphereCheapestCount: number;
    averageMarginPercent: number;
  };
  auditTrail: PriceChangeAuditEntry[];
  adminEmail: string;
}

export function PricingDashboardClient({
  initialItems,
  summary,
  auditTrail: initialAuditTrail,
  adminEmail,
}: PricingDashboardClientProps) {
  const [items, setItems] = useState<PricingDashboardItem[]>(initialItems);
  const [auditTrail, setAuditTrail] = useState<PriceChangeAuditEntry[]>(initialAuditTrail);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState<PriceTier | 'all'>('all');
  const [onlyReviewRequired, setOnlyReviewRequired] = useState(false);
  const [onlyAboveCompetitor, setOnlyAboveCompetitor] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'audit'>('queue');

  // Modal / Inline edit state for supplier cost
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [costInput, setCostInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Filter items in memory for instant responsiveness
  const filteredItems = items.filter((item) => {
    if (categoryFilter !== 'all' && item.categorySlug !== categoryFilter) {
      return false;
    }
    if (tierFilter !== 'all' && item.priceTier !== tierFilter) {
      return false;
    }
    if (onlyReviewRequired && !item.priceReviewRequired) {
      return false;
    }
    if (onlyAboveCompetitor && (item.priceDifferenceFromLowestCompetitor ?? 0) <= 0) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matches =
        item.productTitle.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  // Handler: Approve suggested price
  const handleApprove = async (item: PricingDashboardItem) => {
    if (!item.suggestedPrice) return;
    startTransition(async () => {
      const res = await approvePriceChangeAction({
        productId: item.productId,
        newPrice: item.suggestedPrice!,
        reason: `Admin approved competitive adjustment matching benchmark with ${item.suggestedMarginPercent}% margin.`,
      });

      if (res.success) {
        showNotification(res.message, 'success');
        // Update local item
        setItems((prev) =>
          prev.map((it) => {
            if (it.productId === item.productId) {
              return {
                ...it,
                currentPrice: item.suggestedPrice!,
                currentMarginPercent: item.suggestedMarginPercent || it.currentMarginPercent,
                priceReviewRequired: false,
                priceReviewReason: 'Recently reviewed and verified by admin.',
                suggestedPrice: undefined,
                isShopSphereCheapest: true,
              };
            }
            return it;
          })
        );
        if (res.auditEntry) {
          setAuditTrail((prev) => [res.auditEntry!, ...prev]);
        }
      } else {
        showNotification(res.message || 'Approval failed.', 'error');
      }
    });
  };

  // Handler: Dismiss suggested change
  const handleReject = async (item: PricingDashboardItem) => {
    startTransition(async () => {
      const res = await rejectPriceChangeAction({
        productId: item.productId,
        reason: 'Admin maintained existing catalog price.',
      });
      if (res.success) {
        showNotification(res.message, 'success');
        setItems((prev) =>
          prev.map((it) =>
            it.productId === item.productId
              ? {
                  ...it,
                  priceReviewRequired: false,
                  priceReviewReason: 'Suggested adjustment dismissed by administrator.',
                  suggestedPrice: undefined,
                }
              : it
          )
        );
      } else {
        showNotification(res.message, 'error');
      }
    });
  };

  // Handler: Save Supplier Cost
  const handleSaveSupplierCost = async (productId: string) => {
    const cost = parseFloat(costInput);
    const margin = 22;
    if (isNaN(cost) || cost <= 0) {
      showNotification('Please enter a valid positive supplier cost in INR.', 'error');
      return;
    }

    startTransition(async () => {
      const res = await updateSupplierCostAction({
        productId,
        supplierCost: cost,
        targetMarginPercent: margin,
      });

      if (res.success) {
        showNotification(res.message, 'success');
        setEditingCostId(null);
        setCostInput('');
        // Update item in state
        setItems((prev) =>
          prev.map((it) => {
            if (it.productId === productId) {
              const newFloor = Math.ceil((cost * 1.12 + 120) / 10) * 10;
              const newMargin = Math.round(((it.currentPrice - cost) / it.currentPrice) * 1000) / 10;
              return {
                ...it,
                supplierCost: cost,
                minPermittedPrice: newFloor,
                currentMarginPercent: newMargin,
                priceReviewRequired: it.currentPrice < newFloor,
              };
            }
            return it;
          })
        );
      } else {
        showNotification(res.message, 'error');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Profitability & Competitor Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Competitive Pricing Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <p className="text-xs sm:text-sm text-slate-400">
              Indian market benchmarks, cost floors, and strict admin approval guardrails. Selling prices never change automatically.
            </p>
            {adminEmail && (
              <span className="text-[11px] text-amber-400/90 bg-amber-950/50 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0 font-mono">
                Admin: {adminEmail}
              </span>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'queue'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Price Approval Queue ({filteredItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit History ({auditTrail.length})</span>
          </button>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="hover:opacity-75 cursor-pointer ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Monitored Products */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Monitored SKUs</span>
            <Tag className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.totalProducts}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 8 major categories</div>
        </div>

        {/* KPI 2: Review Required */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Requires Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{summary.requiresReviewCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Priced above competitor or near floor</div>
        </div>

        {/* KPI 3: Best Price Count */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Lowest in India</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{summary.shopSphereCheapestCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Verified lower than Amazon & Flipkart</div>
        </div>

        {/* KPI 4: Average Gross Margin */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-medium">
            <span>Average Gross Margin</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300">
            {summary.averageMarginPercent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Above non-negotiable 12% safety floor</div>
        </div>
      </div>

      {activeTab === 'queue' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search SKU, Product, Category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="fashion">Fashion & Clothing</option>
                  <option value="home-kitchen">Home & Kitchen</option>
                  <option value="beauty">Beauty & Personal Care</option>
                  <option value="books">Books & Stationery</option>
                  <option value="sports">Sports & Fitness</option>
                  <option value="grocery">Grocery & Daily Essentials</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              {/* Price Tier Filter */}
              <div>
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value as PriceTier | 'all')}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">All Budget Tiers</option>
                  <option value="budget">Budget Tier</option>
                  <option value="mid-range">Mid-Range Tier</option>
                  <option value="premium">Premium Tier</option>
                </select>
              </div>

              {/* Quick Filter Toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyReviewRequired(!onlyReviewRequired)}
                  className={`flex-1 h-10 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    onlyReviewRequired
                      ? 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Review Only</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOnlyAboveCompetitor(!onlyAboveCompetitor)}
                  className={`flex-1 h-10 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    onlyAboveCompetitor
                      ? 'bg-purple-500 text-white font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <span>Above Market</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4">Product & SKU</th>
                    <th className="p-4">Current Price</th>
                    <th className="p-4">Cost Floor (Admin Only)</th>
                    <th className="p-4">Lowest Indian Benchmark</th>
                    <th className="p-4">Suggested Price</th>
                    <th className="p-4">Estimated Margin</th>
                    <th className="p-4 text-right">Approval Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No products match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isEditing = editingCostId === item.productId;
                      return (
                        <tr
                          key={item.productId}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            item.priceReviewRequired ? 'bg-amber-950/10' : ''
                          }`}
                        >
                          {/* Product & SKU */}
                          <td className="p-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.productTitle}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                                    IMG
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-white truncate" title={item.productTitle}>
                                  {item.productTitle}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  <span className="font-mono text-amber-400">{item.sku}</span>
                                  <span>•</span>
                                  <span className="capitalize">{item.priceTier}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Current Price */}
                          <td className="p-4 font-mono font-bold text-slate-200">
                            <div className="text-sm">₹{item.currentPrice.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-slate-500">
                              Stock: {item.stockQuantity} units
                            </div>
                          </td>

                          {/* Private Cost Floor */}
                          <td className="p-4 font-mono">
                            {isEditing ? (
                              <div className="space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-700">
                                <div className="text-[10px] text-slate-400 font-sans">Supplier Cost:</div>
                                <input
                                  type="number"
                                  placeholder="Cost in ₹"
                                  value={costInput}
                                  onChange={(e) => setCostInput(e.target.value)}
                                  className="w-24 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                                />
                                <div className="flex items-center gap-1 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSupplierCost(item.productId)}
                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingCostId(null)}
                                    className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1.5 text-slate-300">
                                  <span>Cost: ₹{item.supplierCost.toLocaleString('en-IN')}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCostId(item.productId);
                                      setCostInput(String(item.supplierCost));
                                    }}
                                    className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                </div>
                                <div className="text-[11px] text-rose-400 font-semibold">
                                  Floor: ₹{item.minPermittedPrice.toLocaleString('en-IN')}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Competitor Benchmark */}
                          <td className="p-4">
                            {item.lowestCompetitor ? (
                              <div>
                                <div className="font-bold text-slate-200 flex items-center gap-1">
                                  <span>{item.lowestCompetitor.competitorName}:</span>
                                  <span className="font-mono text-amber-300">
                                    ₹{item.lowestCompetitor.sellingPrice.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                  <span>Checked: {item.lowestCompetitor.lastChecked}</span>
                                  {item.lowestCompetitor.productUrl && (
                                    <a
                                      href={item.lowestCompetitor.productUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-indigo-400 hover:text-indigo-300"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5 inline" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">
                                Feed not connected
                              </span>
                            )}
                          </td>

                          {/* Suggested Price */}
                          <td className="p-4">
                            {item.suggestedPrice ? (
                              <div className="font-mono">
                                <div className="text-sm font-black text-amber-400">
                                  ₹{item.suggestedPrice.toLocaleString('en-IN')}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Diff: ₹{(item.suggestedPrice - item.currentPrice).toLocaleString('en-IN')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">—</span>
                            )}
                          </td>

                          {/* Estimated Margin */}
                          <td className="p-4 font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                item.currentMarginPercent >= 20
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : item.currentMarginPercent >= 12
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {item.currentMarginPercent}%
                            </span>
                            {item.suggestedMarginPercent !== undefined && (
                              <div className="text-[10px] text-slate-400 mt-1">
                                Projected: {item.suggestedMarginPercent}%
                              </div>
                            )}
                          </td>

                          {/* Approval Actions */}
                          <td className="p-4 text-right">
                            {item.suggestedPrice ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApprove(item)}
                                  disabled={isPending}
                                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Approve and update live selling price"
                                >
                                  Approve ₹{item.suggestedPrice.toLocaleString('en-IN')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(item)}
                                  disabled={isPending}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
                                  title="Dismiss suggestion"
                                >
                                  Dismiss
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">Priced Stably</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <span>Immutable Price Change Audit Log</span>
              </h2>
              <p className="text-xs text-slate-400">
                Full chronological history of administrator price approvals, margin evaluations, and reasoning.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {auditTrail.map((entry) => (
              <div key={entry.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm">{entry.productTitle}</div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="font-mono text-amber-400">{entry.sku}</span>
                    <span>•</span>
                    <span>Approved by: {entry.adminEmail}</span>
                    <span>•</span>
                    <span className="text-slate-500">{new Date(entry.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-slate-300 font-medium pt-1">
                    {entry.reason}
                  </div>
                </div>

                <div className="sm:text-right shrink-0 font-mono">
                  <div className="text-sm font-black text-slate-200">
                    <span className="line-through text-slate-500 mr-2">
                      ₹{entry.oldPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-amber-400">
                      ₹{entry.newPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">
                    Realized Gross Margin: {entry.marginPercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
