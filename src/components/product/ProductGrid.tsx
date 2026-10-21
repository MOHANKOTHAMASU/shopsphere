import React from 'react';
import { Product } from '@/types/ecommerce';
import { ProductCard } from './ProductCard';
import { PackageOpen } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
  columns?: 'three' | 'four';
}

export function ProductGrid({
  products,
  emptyMessage = 'No products found matching your criteria.',
  columns = 'four',
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 my-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center mb-4">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">No Products Found</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  const colClasses =
    columns === 'three'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className={`grid ${colClasses} gap-4 sm:gap-6`}>
      {products.map((product, idx) => (
        <ProductCard key={product.id} product={product} priority={idx < 4} />
      ))}
    </div>
  );
}
