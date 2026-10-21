import { Category } from '@/types/ecommerce';

/**
 * -----------------------------------------------------------------------------
 * DEVELOPMENT SEED DATA: CATEGORIES
 * -----------------------------------------------------------------------------
 * 8 Major Categories for ShopSphere Marketplace:
 * 1. Electronics
 * 2. Fashion & Clothing
 * 3. Home & Kitchen
 * 4. Beauty & Personal Care
 * 5. Books & Stationery
 * 6. Sports & Fitness
 * 7. Grocery & Daily Essentials
 * 8. Accessories
 * -----------------------------------------------------------------------------
 */

export const DEVELOPMENT_SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Flagship headphones, smartwatches, laptops, audio systems, and smart gadgets.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'Headphones',
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Clothing',
    slug: 'fashion',
    description: 'Designer shirts, denim, outerwear, formal attire, and everyday comfort wear.',
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'Shirt',
  },
  {
    id: 'cat-home-kitchen',
    name: 'Home & Kitchen',
    slug: 'home-kitchen',
    description: 'Artisanal cookware, appliances, dinnerware, espresso makers, and living decor.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'Home',
  },
  {
    id: 'cat-beauty',
    name: 'Beauty & Personal Care',
    slug: 'beauty',
    description: 'Dermatological skincare, nourishing serums, grooming kits, and organic wellness.',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'Sparkles',
  },
  {
    id: 'cat-books',
    name: 'Books & Stationery',
    slug: 'books',
    description: 'Bestselling non-fiction, programming manuals, executive notebooks, and fine pens.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'BookOpen',
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness',
    slug: 'sports',
    description: 'Weights, yoga accessories, endurance athletic gear, and home gym equipment.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'Dumbbell',
  },
  {
    id: 'cat-grocery',
    name: 'Grocery & Daily Essentials',
    slug: 'grocery',
    description: 'Farm-fresh organic pantry essentials, single-origin coffees, and dry fruits.',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'ShoppingBag',
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Polarized sunglasses, genuine leather wallets, chronographs, and urban travel bags.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    itemCount: 52,
    featured: true,
    iconName: 'Watch',
  },
];
