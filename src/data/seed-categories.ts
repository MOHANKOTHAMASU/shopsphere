import { Category } from '@/types/ecommerce';

/**
 * -----------------------------------------------------------------------------
 * DEVELOPMENT SEED DATA: CATEGORIES
 * -----------------------------------------------------------------------------
 * Clearly labelled seed categories for Phase 1 UI/UX preview and prototyping.
 * These match the database schema defined in supabase/migrations/20261020000000_init_schema.sql
 * and will be loaded dynamically from Supabase in subsequent phases.
 * -----------------------------------------------------------------------------
 */

export const DEVELOPMENT_SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-electronics',
    name: 'Electronics & Gadgets',
    slug: 'electronics',
    description: 'Smartphones, premium headphones, laptops, and smart home tech.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    itemCount: 42,
    featured: true,
    iconName: 'Headphones',
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Apparel',
    slug: 'fashion',
    description: 'Trendy clothing, street wear, premium footwear, and accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80',
    itemCount: 88,
    featured: true,
    iconName: 'Shirt',
  },
  {
    id: 'cat-home-living',
    name: 'Home & Living',
    slug: 'home-living',
    description: 'Modern furniture, ambient lighting, kitchenware, and luxury decor.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    itemCount: 35,
    featured: true,
    iconName: 'Home',
  },
  {
    id: 'cat-beauty-wellness',
    name: 'Beauty & Wellness',
    slug: 'beauty-wellness',
    description: 'Organic skincare, luxury fragrances, grooming, and personal care.',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    itemCount: 29,
    featured: true,
    iconName: 'Sparkles',
  },
  {
    id: 'cat-sports-fitness',
    name: 'Sports & Outdoors',
    slug: 'sports-fitness',
    description: 'Gym equipment, outdoor gear, fitness trackers, and athletic shoes.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
    itemCount: 24,
    featured: true,
    iconName: 'Dumbbell',
  },
  {
    id: 'cat-footwear',
    name: 'Footwear & Sneakers',
    slug: 'footwear',
    description: 'Running shoes, casual sneakers, formal shoes, and luxury boots.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    itemCount: 31,
    featured: true,
    iconName: 'Footprints',
  },
];
