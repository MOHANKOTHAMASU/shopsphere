'use client';

// -----------------------------------------------------------------------------
// src/components/product/ProductReviewsSection.tsx
// Verified Customer Reviews & Ratings with Strict Purchase Eligibility
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Edit3,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ReviewRecord, ReviewEligibility } from '@/types/ecommerce';
import {
  getProductReviewsAction,
  checkReviewEligibilityAction,
  submitCustomerReviewAction,
  deleteCustomerReviewAction,
} from '@/lib/reviews/customer-actions';

interface ProductReviewsSectionProps {
  productId: string;
  productTitle: string;
  initialRating?: number;
  initialReviewCount?: number;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor - Not recommended',
  2: 'Fair - Below expectations',
  3: 'Average - Met basic needs',
  4: 'Good - Highly recommended',
  5: 'Outstanding - Exceeded expectations',
};

export function ProductReviewsSection({
  productId,
  productTitle,
  initialRating = 0,
  initialReviewCount = 0,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [stats, setStats] = useState({
    averageRating: initialRating,
    reviewCount: initialReviewCount,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
  });
  const [eligibility, setEligibility] = useState<ReviewEligibility>({
    eligible: false,
    hasReviewed: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [titleInput, setTitleInput] = useState<string>('');
  const [commentInput, setCommentInput] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load reviews and stats
  const refreshReviews = async () => {
    const res = await getProductReviewsAction(productId);
    if (res.success) {
      setReviews(res.reviews);
      setStats(res.stats);
    }
  };

  // Load reviews & eligibility on mount or auth change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [reviewsRes, eligRes] = await Promise.all([
          getProductReviewsAction(productId),
          checkReviewEligibilityAction(productId),
        ]);
        if (isMounted) {
          if (reviewsRes.success) {
            setReviews(reviewsRes.reviews);
            setStats(reviewsRes.stats);
          }
          setEligibility(eligRes);
          // If customer has already reviewed, prefill form
          if (eligRes.existingReview) {
            setRatingInput(eligRes.existingReview.rating);
            setTitleInput(eligRes.existingReview.title);
            setCommentInput(eligRes.existingReview.comment);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [productId, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (ratingInput < 1 || ratingInput > 5) {
      setFormError('Please select a star rating between 1 and 5.');
      return;
    }
    if (!titleInput.trim() || titleInput.trim().length < 3) {
      setFormError('Please provide a descriptive headline (at least 3 characters).');
      return;
    }
    if (!commentInput.trim() || commentInput.trim().length < 10) {
      setFormError('Please share details about your experience (at least 10 characters).');
      return;
    }

    setIsSubmitting(true);
    const res = await submitCustomerReviewAction({
      productId,
      productTitle,
      rating: ratingInput,
      title: titleInput.trim(),
      comment: commentInput.trim(),
    });
    setIsSubmitting(false);

    if (res.success) {
      setFormSuccess(res.message || 'Your review has been published!');
      setIsFormOpen(false);
      await refreshReviews();
      const updatedElig = await checkReviewEligibilityAction(productId);
      setEligibility(updatedElig);
    } else {
      setFormError(res.error || 'Failed to submit review.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete your review?')) return;
    setDeletingId(reviewId);
    const res = await deleteCustomerReviewAction(reviewId, productId);
    setDeletingId(null);

    if (res.success) {
      setTitleInput('');
      setCommentInput('');
      setRatingInput(5);
      await refreshReviews();
      const updatedElig = await checkReviewEligibilityAction(productId);
      setEligibility(updatedElig);
    } else {
      alert(res.error || 'Failed to delete review.');
    }
  };

  return (
    <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Ratings & Reviews
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Verified Purchases Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real feedback exclusively from customers with confirmed and delivered orders.
          </p>
        </div>

        {/* Action Button: Write / Edit Review */}
        <div>
          {user ? (
            eligibility.eligible ? (
              <button
                type="button"
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer"
              >
                {eligibility.hasReviewed ? (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit My Review</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Write a Verified Review</span>
                  </>
                )}
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Verified buyers only</span>
              </div>
            )
          ) : (
            <Link
              href={`/auth/login?redirect=/products`}
              className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors inline-flex items-center gap-1.5"
            >
              <span>Sign In to Review</span>
            </Link>
          )}
        </div>
      </div>

      {/* Ratings Summary & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
        {/* Overall Score */}
        <div className="md:col-span-4 text-center md:text-left space-y-2 md:border-r md:border-slate-200/80 md:pr-8">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
              {stats.reviewCount > 0 ? stats.averageRating.toFixed(1) : '—'}
            </span>
            <span className="text-slate-400 font-bold text-sm">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const filled = stats.reviewCount > 0 && star <= Math.round(stats.averageRating);
              return (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    filled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                  }`}
                />
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            Based on <strong className="text-slate-800">{stats.reviewCount}</strong> verified{' '}
            {stats.reviewCount === 1 ? 'buyer' : 'buyers'}
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star] || 0;
            const pct = stats.reviewCount > 0 ? Math.round((count / stats.reviewCount) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-slate-600 font-bold flex items-center justify-end gap-1">
                  <span>{star}</span>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </span>
                <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-slate-400 font-mono text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Form Modal/Drawer Area */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitReview}
          className="p-6 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {eligibility.hasReviewed ? 'Update Your Review' : 'Share Your Verified Experience'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Your feedback helps fellow customers make informed choices
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {/* Star Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rating
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || ratingInput) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingInput(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      aria-label={`${star} Star`}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          active ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-slate-600 ml-2">
                {RATING_LABELS[hoverRating || ratingInput]}
              </span>
            </div>
          </div>

          {/* Headline Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Review Headline
            </label>
            <input
              type="text"
              required
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="e.g. Exceptional sound clarity & comfortable padding"
              className="w-full h-10 px-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Comments
            </label>
            <textarea
              required
              rows={4}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Tell other shoppers what you liked or disliked about this product, build quality, performance, and battery life..."
              className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner resize-y"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Publish Verified Review</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500">Loading authentic verified customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No customer reviews yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Be the first verified customer to share an authentic review after purchasing this item!
            </p>
          </div>
        ) : (
          reviews.map((rev) => {
            const isAuthor = user?.id === rev.userId;

            return (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Review Header: Author, Date & Verified Badge */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-bold text-xs flex items-center justify-center uppercase">
                      {rev.authorName ? rev.authorName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {rev.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Purchase
                      </span>
                    )}

                    {/* Author Controls (Edit / Delete) */}
                    {isAuthor && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRatingInput(rev.rating);
                            setTitleInput(rev.title);
                            setCommentInput(rev.comment);
                            setIsFormOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors cursor-pointer"
                          title="Edit review"
                          aria-label="Edit your review"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === rev.id}
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer disabled:opacity-50"
                          title="Delete review"
                          aria-label="Delete your review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating Stars & Title */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-slate-700 ml-1.5 font-mono">
                      {rev.rating}.0
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{rev.title}</h4>
                </div>

                {/* Review Text */}
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
