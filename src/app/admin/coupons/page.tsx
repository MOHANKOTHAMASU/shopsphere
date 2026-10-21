'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle, AlertCircle, Save } from 'lucide-react';
import {
  getAdminCouponsAction,
  createCouponAction,
  toggleCouponStatusAction,
  deleteCouponAction,
} from '@/lib/admin/actions';
import { CouponRecord, CreateCouponInput } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState<number | ''>(999);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | ''>(500);
  const [usageLimit, setUsageLimit] = useState<number | ''>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCoupons = () => {
    getAdminCouponsAction().then((res) => {
      if (res.success) setCoupons(res.coupons);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    getAdminCouponsAction().then((res) => {
      if (isMounted) {
        if (res.success) setCoupons(res.coupons);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const input: CreateCouponInput = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      isActive: true,
    };

    const res = await createCouponAction(input);
    setIsSubmitting(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: `Coupon "${input.code}" created successfully!` });
      setCode('');
      setDiscountValue('');
      setShowAddForm(false);
      loadCoupons();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to create coupon.' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleToggle = async (couponId: string, currentActive: boolean) => {
    const res = await toggleCouponStatusAction(couponId, !currentActive);
    if (res.success) {
      loadCoupons();
    }
  };

  const handleDelete = async (couponId: string, couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) return;

    const res = await deleteCouponAction(couponId);
    if (res.success) {
      setStatusMessage({ type: 'success', text: `Coupon "${couponCode}" deleted.` });
      loadCoupons();
    }
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Promotion & Coupon Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure promotional discount codes, spend thresholds, and campaign validity
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Close Form' : 'Create Coupon'}</span>
        </button>
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

      {/* Create Coupon Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            Create Promotional Coupon
          </h2>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Discount Type *
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="fixed">Flat Amount Discount (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Discount Value *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder={discountType === 'percentage' ? 'e.g. 15' : 'e.g. 300'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Min Order Subtotal (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 999"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Max Cap Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Optional max cap"
                  value={maxDiscountAmount}
                  onChange={(e) => setMaxDiscountAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Publish Coupon'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Tag className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No active coupons configured</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-3">Benefit</th>
                  <th className="py-3.5 px-3">Min Order</th>
                  <th className="py-3.5 px-3">Redemptions</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-amber-400 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded text-xs">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">
                      {c.discountType === 'percentage'
                        ? `${c.discountValue}% OFF`
                        : `₹${c.discountValue} FLAT OFF`}
                      {c.maxDiscountAmount && (
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Max cap: ₹{c.maxDiscountAmount}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-slate-300">
                      {c.minOrderAmount > 0 ? formatCurrency(c.minOrderAmount) : 'No Minimum'}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400">
                      {c.usedCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'times'}
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(c.id, c.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          c.isActive
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.isActive ? <ToggleRight className="w-3.5 h-3.5 text-emerald-400" /> : <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{c.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.code)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
