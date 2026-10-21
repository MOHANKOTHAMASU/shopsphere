import React from 'react';
import Link from 'next/link';
import { Category } from '@/types/ecommerce';
import { ChevronRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/products?cat=${category.slug}`}
      className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-end aspect-4/5 sm:aspect-square"
    >
      {/* Background Image */}
      <img
        src={category.imageUrl}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

      {/* Content */}
      <div className="relative p-5 text-white z-10">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
          {category.itemCount}+ Products
        </span>
        <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 leading-snug group-hover:text-indigo-300 transition-colors">
          {category.name}
        </h3>
        <p className="text-xs text-slate-300 line-clamp-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
          {category.description}
        </p>

        <div className="mt-2 flex items-center text-xs font-semibold text-white/90 group-hover:text-indigo-300 gap-1">
          <span>Explore Category</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
