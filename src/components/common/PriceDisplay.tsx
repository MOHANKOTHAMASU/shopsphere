import React from 'react';
import { formatCurrency, calculateSavings, cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscountBadge?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  showDiscountBadge = true,
  className,
}: PriceDisplayProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const { savingsPercentage } = hasDiscount
    ? calculateSavings(compareAtPrice, price)
    : { savingsPercentage: 0 };

  const priceSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-extrabold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl font-black',
  };

  const compareSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={cn('flex items-baseline flex-wrap gap-2', className)}>
      <span className={cn('text-slate-900 tracking-tight', priceSizes[size])}>
        {formatCurrency(price)}
      </span>

      {hasDiscount && (
        <>
          <span
            className={cn('text-slate-400 line-through font-normal', compareSizes[size])}
            aria-label={`Original price ${formatCurrency(compareAtPrice)}`}
          >
            {formatCurrency(compareAtPrice)}
          </span>

          {showDiscountBadge && savingsPercentage > 0 && (
            <Badge variant="discount" size="sm" className="ml-0.5">
              {savingsPercentage}% OFF
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
