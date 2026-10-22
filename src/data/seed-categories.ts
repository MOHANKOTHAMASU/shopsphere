import { Category } from '@/types/ecommerce';

/**
 * -----------------------------------------------------------------------------
 * SHOPSPHERE 10 OFFICIAL CATEGORIES
 * -----------------------------------------------------------------------------
 * 1. Fashion
 * 2. Mobiles
 * 3. Electronics
 * 4. Beauty
 * 5. Home Appliances
 * 6. Food & Health
 * 7. Automotive Accessories
 * 8. Sports & Fitness
 * 9. Furniture
 * 10. Books
 * -----------------------------------------------------------------------------
 */

export const DEVELOPMENT_SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-fashion',
    name: 'Fashion',
    slug: 'fashion',
    description: "Men's and women's designer clothing, footwear, formal wear, and accessories.",
    imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80',
    itemCount: 65,
    featured: true,
    iconName: 'Shirt',
  },
  {
    id: 'cat-mobiles',
    name: 'Mobiles',
    slug: 'mobiles',
    description: 'Flagship 5G smartphones, iPhones, Samsung Galaxy, OnePlus, and mobile accessories.',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
    itemCount: 48,
    featured: true,
    iconName: 'Smartphone',
  },
  {
    id: 'cat-electronics',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Wireless noise-cancelling headphones, laptops, 4K monitors, soundbars, and smart gadgets.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    itemCount: 56,
    featured: true,
    iconName: 'Headphones',
  },
  {
    id: 'cat-beauty',
    name: 'Beauty',
    slug: 'beauty',
    description: 'Dermatological face washes, vitamin C serums, organic skincare, and grooming kits.',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    itemCount: 42,
    featured: true,
    iconName: 'Sparkles',
  },
  {
    id: 'cat-home-appliances',
    name: 'Home Appliances',
    slug: 'home-appliances',
    description: 'Inverter refrigerators, digital air fryers, espresso machines, and smart appliances.',
    imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    itemCount: 50,
    featured: true,
    iconName: 'Home',
  },
  {
    id: 'cat-food-health',
    name: 'Food & Health',
    slug: 'food-health',
    description: 'Organic raw honey, cold-pressed olive oil, California almonds, whey protein, and vitamins.',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    itemCount: 45,
    featured: true,
    iconName: 'ShoppingBag',
  },
  {
    id: 'cat-automotive',
    name: 'Automotive Accessories',
    slug: 'automotive',
    description: '4K dual dashcams, portable tire inflators, car vacuum cleaners, and phone mounts.',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    itemCount: 38,
    featured: true,
    iconName: 'Car',
  },
  {
    id: 'cat-sports',
    name: 'Sports & Fitness',
    slug: 'sports',
    description: 'Adjustable dumbbells, high-density yoga mats, endurance athletic gear, and gym wear.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    itemCount: 44,
    featured: true,
    iconName: 'Dumbbell',
  },
  {
    id: 'cat-furniture',
    name: 'Furniture',
    slug: 'furniture',
    description: 'Ergonomic high-back mesh office chairs, electric standing desks, and wooden bookshelves.',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    itemCount: 36,
    featured: true,
    iconName: 'Armchair',
  },
  {
    id: 'cat-books',
    name: 'Books',
    slug: 'books',
    description: 'Python programming guides, computer science manuals, career bestsellers, and literature.',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    itemCount: 40,
    featured: true,
    iconName: 'BookOpen',
  },
];
