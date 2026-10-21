'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { getAdminReviewsAction, moderateReviewAction } from '@/lib/admin/actions';
import { ReviewRecord } from '@/types/ecommerce';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadReviews = (flt: 'all' | 'pending' | 'approved' | 'rejected') => {
    getAdminReviewsAction(flt).then((res) => {
      if (res.success) setReviews(res.reviews);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    getAdminReviewsAction(statusFilter).then((res) => {
      if (isMounted) {
        if (res.success) setReviews(res.reviews);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const handleModerate = async (reviewId: string, newStatus: 'approved' | 'rejected') => {
    setModeratingId(reviewId);
    const res = await moderateReviewAction(reviewId, newStatus);
    if (res.success) {
      setStatusMessage(`Review marked as ${newStatus}.`);
      loadReviews(statusFilter);
    }
    setModeratingId(null);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Review Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit user testimonials, enforce community guidelines, and verify authentic reviews
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Reviews Queue */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-slate-900 border border-slate-800 rounded-3xl">
            <Star className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No reviews found in this view</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-sm">{rev.title}</h3>
                  <p className="text-xs text-amber-400 font-medium">{rev.productTitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      rev.status === 'approved'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : rev.status === 'rejected'
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                    }`}
                  >
                    {rev.status}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                &ldquo;{rev.comment}&rdquo;
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="font-bold text-slate-200">{rev.authorName}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                  <span>•</span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={moderatingId === rev.id || rev.status === 'approved'}
                    onClick={() => handleModerate(rev.id, 'approved')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    disabled={moderatingId === rev.id || rev.status === 'rejected'}
                    onClick={() => handleModerate(rev.id, 'rejected')}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
