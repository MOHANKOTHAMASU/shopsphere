import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
  className,
}: RatingStarsProps) {
  const roundedRating = Math.round(rating * 10) / 10;
  
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn('inline-flex items-center gap-1.5', className)}
      aria-label={`Rated ${roundedRating} out of 5 stars based on ${reviewCount ?? 0} reviews`}
    >
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(roundedRating);
          const isHalf = !isFilled && star === Math.ceil(roundedRating) && roundedRating % 1 >= 0.3;

          return (
            <span key={star} className="relative inline-block">
              <Star
                className={cn(
                  iconSizes[size],
                  'text-slate-200 fill-slate-200'
                )}
              />
              {(isFilled || isHalf) && (
                <span
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: isFilled ? '100%' : `${(roundedRating % 1) * 100}%` }}
                >
                  <Star
                    className={cn(
                      iconSizes[size],
                      'text-amber-400 fill-amber-400'
                    )}
                  />
                </span>
              )}
            </span>
          );
        })}
      </div>

      <span className={cn('font-semibold text-slate-800', textSizes[size])}>
        {roundedRating.toFixed(1)}
      </span>

      {showCount && typeof reviewCount === 'number' && (
        <span className={cn('text-slate-500 font-normal', textSizes[size])}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
