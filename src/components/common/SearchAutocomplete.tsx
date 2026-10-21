'use client';

// -----------------------------------------------------------------------------
// src/components/common/SearchAutocomplete.tsx
// Omnipresent Search Autocomplete with Product Previews & Category Suggestions
// -----------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Layers, ArrowRight, Sparkles } from 'lucide-react';
import { fetchSearchSuggestionsAction } from '@/lib/products/search-actions';
import { SearchSuggestionResult } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';

interface SearchAutocompleteProps {
  placeholder?: string;
  initialQuery?: string;
  className?: string;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  showCategoryDropdown?: boolean;
  onCloseMobile?: () => void;
}

export function SearchAutocomplete({
  placeholder = 'Search for laptops, headphones, sneakers, audio...',
  initialQuery = '',
  className = '',
  selectedCategory = 'all',
  onCategoryChange,
  showCategoryDropdown = true,
  onCloseMobile,
}: SearchAutocompleteProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionResult>({
    products: [],
    categories: [],
    query: '',
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search suggestions fetch
  useEffect(() => {
    const trimmed = query.trim();
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setSuggestions({ products: [], categories: [], query: '' });
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchSearchSuggestionsAction(trimmed);
        setSuggestions(data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch {
        // Fallback or ignore
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const executeSearch = (targetQuery?: string, targetCat?: string) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    const cat = targetCat !== undefined ? targetCat : selectedCategory;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat && cat !== 'all') params.set('cat', cat);

    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();

    router.push(`/products?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = suggestions.products.length + suggestions.categories.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && query.trim().length >= 2) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.products.length) {
        // Navigate directly to product
        const prod = suggestions.products[selectedIndex];
        setIsOpen(false);
        if (onCloseMobile) onCloseMobile();
        router.push(`/products/${prod.slug}`);
      } else if (
        selectedIndex >= suggestions.products.length &&
        selectedIndex < totalItems
      ) {
        // Navigate to category search
        const catIdx = selectedIndex - suggestions.products.length;
        const cat = suggestions.categories[catIdx];
        executeSearch(query, cat.slug);
      } else {
        executeSearch();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions({ products: [], categories: [], query: '' });
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const hasSuggestions =
    suggestions.products.length > 0 || suggestions.categories.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          executeSearch();
        }}
        className="flex w-full items-center rounded-xl border border-slate-300 bg-slate-50 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:bg-white transition-all shadow-inner"
      >
        {/* Category Selector Dropdown (Optional / Desktop) */}
        {showCategoryDropdown && (
          <div className="relative shrink-0 border-r border-slate-200 hidden sm:block">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
              className="h-11 pl-3 pr-7 bg-transparent text-xs font-semibold text-slate-600 cursor-pointer focus:outline-none appearance-none"
              aria-label="Select Category"
            >
              <option value="all">All Categories</option>
              {DEVELOPMENT_SEED_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        )}

        {/* Input Text Box */}
        <div className="relative flex-1 flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim().length >= 2) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-11 px-4 text-xs sm:text-sm bg-transparent placeholder-slate-400 text-slate-800 focus:outline-none"
            aria-label="Search products"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 mr-2 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isLoading && (
            <div className="mr-3">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Submit Search Button */}
        <button
          type="submit"
          className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-xl flex items-center justify-center transition-colors cursor-pointer shrink-0"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>
      </form>

      {/* Autocomplete Suggestions Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {hasSuggestions ? (
            <div className="divide-y divide-slate-100">
              {/* Category Suggestions */}
              {suggestions.categories.length > 0 && (
                <div className="p-3 bg-slate-50/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-1">
                    Matching Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.categories.map((cat, idx) => {
                      const isSelected = selectedIndex === suggestions.products.length + idx;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => executeSearch(query, cat.slug)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                          }`}
                        >
                          <Layers className="w-3 h-3 text-indigo-500" />
                          <span>{cat.name}</span>
                          <span className="text-[10px] opacity-70">in Catalog</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Suggestions */}
              {suggestions.products.length > 0 && (
                <div className="py-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-4 py-1">
                    Product Suggestions
                  </span>
                  <div className="space-y-0.5">
                    {suggestions.products.map((prod, idx) => {
                      const isSelected = selectedIndex === idx;

                      return (
                        <Link
                          key={prod.id}
                          href={`/products/${prod.slug}`}
                          onClick={() => {
                            setIsOpen(false);
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50/80 text-indigo-900'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 relative">
                            {prod.thumbnail ? (
                              <Image
                                src={prod.thumbnail}
                                alt={prod.title}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Search className="w-4 h-4" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {prod.brand}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate">
                                {prod.category}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                              {prod.title}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-900 font-mono">
                              {formatCurrency(prod.price)}
                            </span>
                            <div className="flex items-center justify-end gap-1 text-[10px] text-amber-500 font-bold">
                              <span>★ {prod.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* View All Matches Footer */}
              <div className="p-3 bg-slate-50 flex items-center justify-between text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>See all matching results for &ldquo;{query}&rdquo;</span>
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center space-y-2">
              <Search className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">
                No products found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-[11px] text-slate-400">
                Try searching with different keywords like brand names or product categories.
              </p>
              <button
                type="button"
                onClick={() => executeSearch()}
                className="mt-2 text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
              >
                <span>Browse All Products in Catalog &rarr;</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
