'use server';

// -----------------------------------------------------------------------------
// src/lib/reviews/customer-actions.ts
// Customer Review Server Actions: Eligibility, Creation, Deletion & Fetching
// -----------------------------------------------------------------------------

import { revalidatePath } from 'next/cache';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import {
  getApprovedReviewsForProduct,
  calculateProductReviewStats,
  checkUserReviewEligibility,
  saveCustomerReview,
  removeCustomerReview,
} from './store';
import { ReviewRecord, ReviewEligibility } from '@/types/ecommerce';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Non-HTTP contexts
  }
}

/**
 * Retrieves the currently authenticated customer from Supabase or fallback cookie
 */
async function getCurrentCustomer(): Promise<{ id: string; email: string; name: string } | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        return {
          id: user.id,
          email: user.email || '',
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'ShopSphere Customer',
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback dev mode check via cookies
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const fallbackUserCookie = cookieStore.get('sb-fallback-user');
    if (fallbackUserCookie?.value) {
      const parsed = JSON.parse(fallbackUserCookie.value);
      if (parsed?.id) {
        return {
          id: parsed.id,
          email: parsed.email || '',
          name: parsed.fullName || parsed.email?.split('@')[0] || 'Demo Customer',
        };
      }
    }
  } catch {
    // Ignore cookie read failures in scripts
  }

  return null;
}

/**
 * Fetch all approved customer reviews and computed real rating statistics for a product
 */
export async function getProductReviewsAction(productId: string): Promise<{
  success: boolean;
  reviews: ReviewRecord[];
  stats: {
    averageRating: number;
    reviewCount: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  };
}> {
  const reviews = getApprovedReviewsForProduct(productId);
  const stats = calculateProductReviewStats(productId);
  return {
    success: true,
    reviews,
    stats,
  };
}

/**
 * Checks if the current authenticated user has purchased this product and is eligible to review
 */
export async function checkReviewEligibilityAction(productId: string): Promise<ReviewEligibility> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return {
      eligible: false,
      hasReviewed: false,
      reason: 'Please sign in to submit a verified product review.',
    };
  }

  return checkUserReviewEligibility(customer.id, customer.email, productId);
}

/**
 * Customer submits a new review or updates their existing review.
 * Prevents modifying another user's review and rejects unverified buyers.
 */
export async function submitCustomerReviewAction(data: {
  productId: string;
  productTitle: string;
  rating: number;
  title: string;
  comment: string;
}): Promise<{
  success: boolean;
  review?: ReviewRecord;
  error?: string;
  message?: string;
}> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return {
      success: false,
      error: 'You must be signed in to submit a review.',
    };
  }

  const result = saveCustomerReview({
    userId: customer.id,
    authorName: customer.name,
    userEmail: customer.email,
    productId: data.productId,
    productTitle: data.productTitle,
    rating: data.rating,
    title: data.title,
    comment: data.comment,
  });

  if (result.success) {
    safeRevalidate(`/products`);
    safeRevalidate(`/products/${data.productId}`);
    return {
      success: true,
      review: result.review,
      message: 'Thank you! Your verified purchase review has been published.',
    };
  }

  return {
    success: false,
    error: result.error || 'Failed to submit review.',
  };
}

/**
 * Deletes a customer's own review.
 * Prevents customers from deleting other people's reviews.
 */
export async function deleteCustomerReviewAction(
  reviewId: string,
  productId: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { success: false, error: 'Authentication required.' };
  }

  const result = removeCustomerReview(customer.id, reviewId);
  if (result.success) {
    safeRevalidate(`/products`);
    safeRevalidate(`/products/${productId}`);
    return { success: true, message: 'Your review was deleted successfully.' };
  }

  return {
    success: false,
    error: result.error || 'Failed to delete review.',
  };
}
