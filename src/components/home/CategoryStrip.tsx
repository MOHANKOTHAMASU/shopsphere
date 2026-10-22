import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/ecommerce';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';
import { CategoryCard } from '@/components/product/CategoryCard';
import { ArrowRight } from 'lucide-react';

interface CategoryStripProps {
  categories?: Category[];
}

export function CategoryStrip({ categories = DEVELOPMENT_SEED_CATEGORIES }: CategoryStripProps) {
  const displayCategories = categories && categories.length > 0 ? categories : DEVELOPMENT_SEED_CATEGORIES;

  return (
    <section className="my-8 sm:my-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Curated Collections
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Explore Categories
          </h2>
        </div>
        <Link
          href="/products"
          className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group"
        >
          <span>View All Categories</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {displayCategories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
}
