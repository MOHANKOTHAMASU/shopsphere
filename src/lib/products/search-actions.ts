'use server';

import { getSearchSuggestions, getAvailableBrands } from '@/lib/products/queries';
import { SearchSuggestionResult } from '@/types/ecommerce';

/**
 * Server Action: Search autocomplete and suggestions
 */
export async function fetchSearchSuggestionsAction(query: string): Promise<SearchSuggestionResult> {
  try {
    return await getSearchSuggestions(query);
  } catch {
    return { products: [], categories: [], query };
  }
}

/**
 * Server Action: Fetch available brands with product counts
 */
export async function fetchAvailableBrandsAction(
  categorySlug?: string
): Promise<{ name: string; count: number }[]> {
  try {
    return await getAvailableBrands(categorySlug);
  } catch {
    return [];
  }
}
