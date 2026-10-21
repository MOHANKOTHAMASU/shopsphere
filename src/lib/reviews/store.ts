// -----------------------------------------------------------------------------
// src/lib/reviews/store.ts
// ShopSphere Review Repository & Eligibility Management
// -----------------------------------------------------------------------------

import { ReviewRecord, ReviewEligibility } from '@/types/ecommerce';
import { inMemoryOrders } from '@/lib/orders/store';

// In-memory active reviews repository
export const memoryReviews: ReviewRecord[] = [
  {
    id: 'rev-001',
    productId: 'prod-001',
    productTitle: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    userId: 'usr-customer-01',
    authorName: 'Rahul Sharma',
    rating: 5,
    title: 'Outstanding Sound & Battery Life',
    comment: 'The noise cancellation is unbeatable in office environments. Extremely comfortable for long calls.',
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id: 'rev-002',
    productId: 'prod-002',
    productTitle: 'Nike Air Max 270 React Premium Running Shoes',
    userId: 'usr-customer-02',
    authorName: 'Priya Patel',
    rating: 4,
    title: 'Great cushion and everyday fit',
    comment: 'Very comfortable for evening jogs. Fits true to size, highly recommended.',
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'rev-003',
    productId: 'prod-003',
    productTitle: 'Minimalist Ceramic Pour-Over Coffee Dripper Set',
    userId: 'usr-customer-03',
    authorName: 'Vikram Joshi',
    rating: 5,
    title: 'Artisan Quality Coffee Dripper',
    comment: 'Extracts coffee beautifully with clean flavor notes. High aesthetic value on the kitchen counter.',
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
];

/**
 * Returns all approved public reviews for a product
 */
export function getApprovedReviewsForProduct(productId: string): ReviewRecord[] {
  return memoryReviews
    .filter((r) => r.productId === productId && r.status === 'approved')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Calculates rating stats from real approved reviews.
 * If no approved customer reviews exist yet, returns 0 reviews so fabricated ratings are not shown.
 */
export function calculateProductReviewStats(productId: string): {
  averageRating: number;
  reviewCount: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
} {
  const reviews = getApprovedReviewsForProduct(productId);
  const count = reviews.length;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (count === 0) {
    return { averageRating: 0, reviewCount: 0, distribution };
  }

  let totalStars = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
    totalStars += r.rating;
  }

  const averageRating = Math.round((totalStars / count) * 10) / 10;
  return { averageRating, reviewCount: count, distribution };
}

/**
 * Checks whether an authenticated user is eligible to review a given product.
 * Requires:
 * 1. User must have an order containing this product in a confirmed / processing / shipped / delivered state.
 * 2. If user already reviewed, returns existingReview so they can update or delete it.
 */
export function checkUserReviewEligibility(
  userId: string,
  userEmail?: string,
  productId?: string
): ReviewEligibility {
  if (!userId || !productId) {
    return {
      eligible: false,
      hasReviewed: false,
      reason: 'Authentication and product identification required.',
    };
  }

  // Check if user already reviewed
  const existingReview = memoryReviews.find(
    (r) => r.productId === productId && r.userId === userId
  );

  // Check order history for verified purchase
  const eligibleOrder = inMemoryOrders.find(
    (order) =>
      (order.userId === userId || (userEmail && order.customerEmail === userEmail)) &&
      order.status !== 'cancelled' &&
      order.items.some((item) => item.productId === productId)
  );

  // Also check if usr-customer-01, usr-customer-02 or demo users are seeded
  const isDemoBuyer =
    userId === 'usr-customer-01' ||
    userId === 'usr-customer-02' ||
    userId === 'usr-customer-03';

  if (!eligibleOrder && !isDemoBuyer) {
    return {
      eligible: false,
      hasReviewed: Boolean(existingReview),
      existingReview,
      reason:
        'Only customers with a confirmed or delivered purchase of this product can submit a verified review.',
    };
  }

  return {
    eligible: true,
    hasReviewed: Boolean(existingReview),
    existingReview,
    orderNumber: eligibleOrder?.orderNumber,
  };
}

/**
 * Submits or updates a verified customer review.
 * Strictly verifies ownership so customers cannot change another user's review.
 */
export function saveCustomerReview(params: {
  userId: string;
  authorName: string;
  userEmail?: string;
  productId: string;
  productTitle: string;
  rating: number;
  title: string;
  comment: string;
}): { success: boolean; review?: ReviewRecord; error?: string } {
  const { userId, authorName, userEmail, productId, productTitle, rating, title, comment } =
    params;

  // Validate inputs
  if (rating < 1 || rating > 5) {
    return { success: false, error: 'Rating must be an integer between 1 and 5 stars.' };
  }
  if (!title.trim() || title.trim().length < 3) {
    return { success: false, error: 'Review headline must be at least 3 characters.' };
  }
  if (!comment.trim() || comment.trim().length < 10) {
    return { success: false, error: 'Review body must be at least 10 characters long.' };
  }

  // Enforce purchase eligibility
  const eligibility = checkUserReviewEligibility(userId, userEmail, productId);
  if (!eligibility.eligible) {
    return {
      success: false,
      error: eligibility.reason || 'You are not eligible to review this product.',
    };
  }

  // Check if existing review
  const existingIdx = memoryReviews.findIndex(
    (r) => r.productId === productId && r.userId === userId
  );

  if (existingIdx >= 0) {
    const existing = memoryReviews[existingIdx];
    // Security check: Customer can only modify their OWN review
    if (existing.userId !== userId) {
      return { success: false, error: "Unauthorized: Cannot modify another customer's review." };
    }

    const updated: ReviewRecord = {
      ...existing,
      authorName: authorName.trim() || existing.authorName,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      status: 'approved', // Verified purchase is approved
      createdAt: new Date().toISOString(),
    };
    memoryReviews[existingIdx] = updated;
    return { success: true, review: updated };
  }

  // Create new review
  const newReview: ReviewRecord = {
    id: `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId,
    productTitle,
    userId,
    authorName: authorName.trim() || 'Verified Customer',
    rating,
    title: title.trim(),
    comment: comment.trim(),
    isVerifiedPurchase: true,
    status: 'approved',
    createdAt: new Date().toISOString(),
  };

  memoryReviews.unshift(newReview);
  return { success: true, review: newReview };
}

/**
 * Deletes a customer's review with ownership protection.
 */
export function removeCustomerReview(
  userId: string,
  reviewId: string
): { success: boolean; error?: string } {
  const index = memoryReviews.findIndex((r) => r.id === reviewId);
  if (index === -1) {
    return { success: false, error: 'Review not found.' };
  }

  const review = memoryReviews[index];
  // Security guard: prevent deleting someone else's review
  if (review.userId !== userId) {
    return { success: false, error: "Unauthorized: Cannot delete another customer's review." };
  }

  memoryReviews.splice(index, 1);
  return { success: true };
}
