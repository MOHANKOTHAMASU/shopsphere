import React from 'react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryStrip } from '@/components/home/CategoryStrip';
import { DealsSection } from '@/components/home/DealsSection';
import { FeaturedSection } from '@/components/home/FeaturedSection';
import { TrustSection } from '@/components/home/TrustSection';
import {
  getCategories,
  getDealProducts,
  getFeaturedProducts,
  getBestSellerProducts,
} from '@/lib/products/queries';

export const metadata = {
  title: 'ShopSphere | India’s Premier Online Marketplace',
  description:
    'Discover unbeatable deals on flagship electronics, latest fashion drops, and luxury home decor at ShopSphere with free shipping and easy returns.',
};

export default async function HomePage() {
  const [categories, dealProducts, featuredProducts, bestSellerProducts] = await Promise.all([
    getCategories(),
    getDealProducts(4),
    getFeaturedProducts(8),
    getBestSellerProducts(8),
  ]);

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Dynamic Hero Banner Carousel */}
      <HeroBanner />

      {/* Category Navigation Strip */}
      <CategoryStrip categories={categories} />

      {/* Deal of the Day with Countdown */}
      <DealsSection products={dealProducts} />

      {/* Trending & Best Sellers Showcase */}
      <FeaturedSection featured={featuredProducts} bestsellers={bestSellerProducts} />

      {/* Trust & Guarantee Section */}
      <TrustSection />
    </div>
  );
}
