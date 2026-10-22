'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/rewards/page.tsx
// ShopSphere Rewards Club & Loyalty Program Dashboard
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Award,
  Gift,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getRewardsSummaryAction,
  redeemRewardPointsAction,
  RewardsSummary,
} from '@/lib/rewards/actions';
import { formatCurrency } from '@/lib/utils';

export default function RewardsPage() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadRewards() {
      setIsLoading(true);
      try {
        const res = await getRewardsSummaryAction();
        if (res.success && res.rewards) {
          setRewards(res.rewards);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadRewards();
  }, []);

  const handleRedeem = async (points: number) => {
    setIsRedeeming(true);
    setRedeemSuccess(null);
    setRedeemError(null);
    setVoucherCode(null);

    try {
      const res = await redeemRewardPointsAction(points);
      if (res.success) {
        setRedeemSuccess(res.message);
        setVoucherCode(res.voucherCode || null);
        // Refresh summary
        const updated = await getRewardsSummaryAction();
        if (updated.success && updated.rewards) {
          setRewards(updated.rewards);
        }
      } else {
        setRedeemError(res.message);
      }
    } catch {
      setRedeemError('Redemption failed. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleCopyVoucher = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="py-6 space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>ShopSphere SuperCoins & Rewards Club</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Earn Points Every Time You Shop
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
            Get 1 Reward Point for every ₹100 spent. Redeem points directly for checkout discounts,
            exclusive gifts, and free express delivery.
          </p>
          {!user && (
            <div className="pt-2">
              <Link
                href="/auth/login?redirect=/rewards"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-amber-50 transition-colors shadow-md"
              >
                <span>Sign In to View Your Balance</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Rewards Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Points */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Available Points</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {isLoading ? '...' : rewards?.availablePoints || 0}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              = {formatCurrency(rewards?.availablePoints || 0)} Value
            </span>
          </div>
          <p className="text-[11px] text-slate-400">1 Reward Point = ₹1 discount</p>
        </div>

        {/* Card 2: Tier Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Membership Tier</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">
              {rewards?.tier || 'Silver'} Member
            </span>
          </div>
          {/* Progress to next tier */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full"
                style={{ width: `${rewards?.tierProgress || 20}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              {rewards?.nextTierPoints
                ? `${rewards.nextTierPoints} points to ${rewards.tier === 'Silver' ? 'Gold' : 'Platinum'}`
                : 'Highest tier unlocked!'}
            </p>
          </div>
        </div>

        {/* Card 3: Total Points Earned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Lifetime Earned</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {isLoading ? '...' : rewards?.pointsEarned || 0}
          </p>
          <p className="text-[11px] text-slate-400">From verified orders & bonuses</p>
        </div>

        {/* Card 4: Total Redeemed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Redeemed</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900">
            {isLoading ? '...' : rewards?.pointsRedeemed || 0}
          </p>
          <p className="text-[11px] text-slate-400">Used for checkout savings</p>
        </div>
      </div>

      {/* Instant Redemption Vouchers */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-600" />
            <span>Redeem Your Points for Vouchers</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Convert your available points into instant discount vouchers applicable at checkout.
          </p>
        </div>

        {/* Feedback Alerts */}
        {redeemSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{redeemSuccess}</span>
            </div>
            {voucherCode && (
              <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-emerald-200 w-fit">
                <span className="font-mono font-bold text-sm text-emerald-900">{voucherCode}</span>
                <button
                  onClick={handleCopyVoucher}
                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {redeemError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{redeemError}</span>
          </div>
        )}

        {/* Voucher Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { points: 50, discount: '₹50 OFF', desc: 'Min cart ₹500' },
            { points: 100, discount: '₹100 OFF', desc: 'Min cart ₹999' },
            { points: 250, discount: '₹250 OFF', desc: 'Min cart ₹1,999' },
          ].map((v) => {
            const canAfford = (rewards?.availablePoints || 0) >= v.points;

            return (
              <div
                key={v.points}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-indigo-700">{v.discount}</span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {v.points} Points
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{v.desc}</p>
                </div>
                <button
                  type="button"
                  disabled={!canAfford || isRedeeming}
                  onClick={() => handleRedeem(v.points)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    canAfford
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Redeem Voucher' : `Need ${v.points - (rewards?.availablePoints || 0)} more pts`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rewards Transaction History */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Reward Points Activity</span>
        </h2>

        {!rewards?.transactions || rewards.transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <p>No reward transactions recorded yet. Complete an order to earn points!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rewards.transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">{tx.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div
                  className={`font-black text-sm ${
                    tx.points > 0 ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                >
                  {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
