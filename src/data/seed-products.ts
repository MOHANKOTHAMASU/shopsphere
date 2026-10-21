import { Product } from '@/types/ecommerce';

/**
 * -----------------------------------------------------------------------------
 * DEVELOPMENT SEED DATA: PRODUCTS
 * -----------------------------------------------------------------------------
 * Clearly labelled seed products for Phase 1 UI/UX preview, responsive layout testing,
 * and component validation.
 *
 * NOTE: These are local seed items for preview only. Production data will be fetched
 * via Supabase PostgreSQL tables in subsequent phases.
 * -----------------------------------------------------------------------------
 */

export const DEVELOPMENT_SEED_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    slug: 'sony-wh-1000xm5-noise-cancelling-headphones',
    title: 'Sony WH-1000XM5 Wireless Industry Leading Noise Canceling Headphones',
    brand: 'Sony',
    category: 'Electronics & Gadgets',
    categorySlug: 'electronics',
    description:
      'The Sony WH-1000XM5 headphones rewrite the rules for distraction-free listening. Two processors control 8 microphones for unprecedented noise cancellation and exceptional call quality. With a newly developed driver, DSEE - Extreme and Hi-Res audio support, the WH-1000XM5 provides awe-inspiring audio quality.',
    shortDescription: 'Industry-leading noise cancellation with two processors and 8 microphones.',
    price: 26990,
    compareAtPrice: 34990,
    discountPercent: 23,
    rating: 4.8,
    reviewCount: 1420,
    stockQuantity: 18,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    isDealOfTheDay: true,
    dealEndsAt: '2026-10-25T23:59:59Z',
    sku: 'SNY-WH-1000XM5-BLK',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['headphones', 'wireless', 'noise-cancelling', 'sony', 'audio'],
    features: [
      'Industry-leading active noise cancellation with 8 microphones',
      'Magnificent sound engineered with Integrated Processor V1',
      'Crystal clear hands-free calling with 4 beamforming microphones',
      'Up to 30-hour battery life with quick charging (3 min charge = 3 hrs playback)',
      'Ultra-comfortable, lightweight design with soft fit leather',
    ],
    specifications: [
      {
        group: 'General',
        attributes: [
          { name: 'Model Name', value: 'WH-1000XM5' },
          { name: 'Color', value: 'Midnight Black' },
          { name: 'Headphone Type', value: 'Over Ear' },
          { name: 'Connectivity', value: 'Bluetooth 5.2 / 3.5mm Aux' },
        ],
      },
      {
        group: 'Audio & Battery',
        attributes: [
          { name: 'Driver Unit', value: '30 mm Carbon Fiber composite' },
          { name: 'Battery Life', value: 'Up to 30 hours with ANC On' },
          { name: 'Charging Port', value: 'USB Type-C' },
          { name: 'Hi-Res Audio', value: 'Supported (LDAC / DSEE Extreme)' },
        ],
      },
    ],
    reviews: [
      {
        id: 'rev-01',
        authorName: 'Arjun Sharma',
        rating: 5,
        title: 'Unbelievable noise cancellation',
        comment:
          'Used these during a 9-hour flight. Completely eliminated engine roar and baby cries. Worth every single rupee.',
        date: '2026-10-12',
        verifiedPurchase: true,
      },
      {
        id: 'rev-02',
        authorName: 'Priya Mehta',
        rating: 5,
        title: 'Best mic quality for remote meetings',
        comment: 'Crystal clear voice even when sitting in a noisy cafe. Battery lasts practically all week!',
        date: '2026-10-08',
        verifiedPurchase: true,
      },
    ],
    variants: [
      {
        id: 'v1111111-1111-1111-1111-111111111111',
        productId: 'prod-001',
        title: 'Midnight Black',
        sku: 'SNY-WH-1000XM5-BLK',
        price: 26990,
        compareAtPrice: 34990,
        stockQuantity: 10,
        attributes: { color: 'Midnight Black' },
        isActive: true,
      },
      {
        id: 'v1111111-1111-1111-1111-111111111112',
        productId: 'prod-001',
        title: 'Silver White',
        sku: 'SNY-WH-1000XM5-SLV',
        price: 26990,
        compareAtPrice: 34990,
        stockQuantity: 8,
        attributes: { color: 'Silver White' },
        isActive: true,
      },
    ],
  },
  {
    id: 'prod-002',
    slug: 'apple-watch-series-9-gps-45mm',
    title: 'Apple Watch Series 9 GPS 45mm Midnight Aluminum Case with Sport Band',
    brand: 'Apple',
    category: 'Electronics & Gadgets',
    categorySlug: 'electronics',
    description:
      'Apple Watch Series 9 helps you stay connected, active, healthy, and safe. Featuring the S9 SiP with 64-bit dual-core processor, double tap gesture, a brighter display, and Precision Finding for iPhone.',
    shortDescription: 'Powerful S9 chip, magical Double Tap gesture, and 2000 nits edge-to-edge display.',
    price: 41900,
    compareAtPrice: 44900,
    discountPercent: 7,
    rating: 4.9,
    reviewCount: 890,
    stockQuantity: 12,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    sku: 'APL-WCH-S9-45-MID',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['smartwatch', 'apple', 'fitness', 'health', 'wearable'],
    features: [
      'S9 SiP enables a supersilky display and new double tap gesture',
      'Advanced health sensors for Blood Oxygen, ECG, and Temperature sensing',
      'Crash Detection and Fall Detection can automatically connect you to emergency services',
      'Water resistant to 50 meters',
    ],
    specifications: [
      {
        group: 'Display & Design',
        attributes: [
          { name: 'Case Size', value: '45 mm' },
          { name: 'Display', value: 'Always-On Retina LTPO OLED (2000 nits)' },
          { name: 'Case Material', value: '100% Recycled Aluminum' },
        ],
      },
    ],
    variants: [
      {
        id: 'v2222222-2222-2222-2222-222222222221',
        productId: 'prod-002',
        title: '41mm Midnight Aluminum',
        sku: 'APL-WCH-S9-41-MID',
        price: 38900,
        compareAtPrice: 41900,
        stockQuantity: 8,
        attributes: { caseSize: '41mm', color: 'Midnight' },
        isActive: true,
      },
      {
        id: 'v2222222-2222-2222-2222-222222222222',
        productId: 'prod-002',
        title: '45mm Midnight Aluminum',
        sku: 'APL-WCH-S9-45-MID',
        price: 41900,
        compareAtPrice: 44900,
        stockQuantity: 4,
        attributes: { caseSize: '45mm', color: 'Midnight' },
        isActive: true,
      },
    ],
  },
  {
    id: 'prod-003',
    slug: 'nike-air-zoom-pegasus-40-running-shoes',
    title: 'Nike Air Zoom Pegasus 40 Men Road Running Shoes',
    brand: 'Nike',
    category: 'Footwear & Sneakers',
    categorySlug: 'footwear',
    description:
      'A springy ride for every run, the Pegs familiar, just-for-you feel returns to help you accomplish your goals. This milestone version has the same responsiveness you love, but with improved comfort in those sensitive areas of your foot, like the arch and toes.',
    shortDescription: 'Responsive React foam with dual Zoom Air units for daily distance running.',
    price: 8495,
    compareAtPrice: 11895,
    discountPercent: 29,
    rating: 4.6,
    reviewCount: 654,
    stockQuantity: 25,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: false,
    isDealOfTheDay: true,
    dealEndsAt: '2026-10-24T18:00:00Z',
    sku: 'NKE-PEG-40-BLK',
    thumbnail: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['shoes', 'sneakers', 'running', 'nike', 'footwear'],
    features: [
      'Nike React technology is a lightweight, durable foam that delivers a smooth ride',
      '2 Zoom Air units (1 in forefoot and 1 in heel) give an energised, bouncy feel',
      'Engineered mesh upper for high breathability and lightweight feel',
      'Waffle-inspired traction pattern provides grip on road surfaces',
    ],
    specifications: [
      {
        group: 'Product Details',
        attributes: [
          { name: 'Shoe Weight', value: '288g (Men size 9)' },
          { name: 'Heel-to-Toe Drop', value: '10 mm' },
          { name: 'Fastening', value: 'Lace-Up' },
        ],
      },
    ],
    variants: [
      {
        id: 'v3333333-3333-3333-3333-333333333331',
        productId: 'prod-003',
        title: 'UK 8 / EU 42',
        sku: 'NKE-PEG-40-UK8',
        price: 8495,
        compareAtPrice: 11895,
        stockQuantity: 12,
        attributes: { size: 'UK 8' },
        isActive: true,
      },
      {
        id: 'v3333333-3333-3333-3333-333333333332',
        productId: 'prod-003',
        title: 'UK 9 / EU 43',
        sku: 'NKE-PEG-40-UK9',
        price: 8495,
        compareAtPrice: 11895,
        stockQuantity: 13,
        attributes: { size: 'UK 9' },
        isActive: true,
      },
    ],
  },
  {
    id: 'prod-004',
    slug: 'macbook-pro-14-m3-pro-space-black',
    title: 'Apple MacBook Pro 14" M3 Pro Chip 18GB Unified Memory 512GB SSD',
    brand: 'Apple',
    category: 'Electronics & Gadgets',
    categorySlug: 'electronics',
    description:
      'With the M3 Pro chip, the 14-inch MacBook Pro takes its power and efficiency further than ever. Delivering exceptional performance whether plugged in or on battery, and an even longer battery life, along with a stunning Liquid Retina XDR display.',
    shortDescription: 'Next-gen M3 Pro silicon with 18-hour battery and Liquid Retina XDR display.',
    price: 189900,
    compareAtPrice: 199900,
    discountPercent: 5,
    rating: 4.9,
    reviewCount: 312,
    stockQuantity: 6,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: true,
    sku: 'APL-MBP-14-M3P',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['laptop', 'macbook', 'apple', 'computer', 'pro'],
    features: [
      'Supercharged by M3 Pro with 11-core CPU and 14-core GPU',
      'Up to 18 hours of battery life with all-day power efficiency',
      'Brilliant 14.2-inch Liquid Retina XDR display with 1600 nits peak brightness',
      '1080p FaceTime HD camera, studio-quality three-mic array, six-speaker sound system',
    ],
    specifications: [
      {
        group: 'Processor & Memory',
        attributes: [
          { name: 'Chip', value: 'Apple M3 Pro' },
          { name: 'Memory', value: '18GB Unified Memory' },
          { name: 'Storage', value: '512GB NVMe SSD' },
        ],
      },
    ],
  },
  {
    id: 'prod-005',
    slug: 'minimalist-ceramic-table-lamp',
    title: 'Aura Minimalist Scandinavian Ceramic Table Lamp with Linen Shade',
    brand: 'Aura Living',
    category: 'Home & Living',
    categorySlug: 'home-living',
    description:
      'Add warm, inviting ambiance to your bedside or living room table. Hand-molded matte terracotta ceramic base paired with an unbleached organic linen cylindrical shade.',
    shortDescription: 'Handcrafted ceramic base with organic linen shade and warm dimmable LED bulb.',
    price: 3499,
    compareAtPrice: 5999,
    discountPercent: 42,
    rating: 4.7,
    reviewCount: 218,
    stockQuantity: 34,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: true,
    sku: 'AUR-LMP-MIN-01',
    thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['home', 'lamp', 'decor', 'lighting', 'scandinavian'],
    features: [
      'Hand-thrown textured matte ceramic base',
      'Natural textured linen drum shade',
      'In-line rotary switch with 3-step brightness dimmer',
      'Includes 9W Warm White 2700K LED bulb',
    ],
    specifications: [
      {
        group: 'Dimensions',
        attributes: [
          { name: 'Height', value: '45 cm' },
          { name: 'Base Diameter', value: '18 cm' },
          { name: 'Cord Length', value: '1.8 meters braided fabric' },
        ],
      },
    ],
  },
  {
    id: 'prod-006',
    slug: 'pure-cashmere-overcoat-camel',
    title: 'Atelier Sartorial Men 100% Mongolian Cashmere Tailored Overcoat',
    brand: 'Atelier',
    category: 'Fashion & Apparel',
    categorySlug: 'fashion',
    description:
      'Impeccably tailored from dense, buttery soft Grade-A Mongolian cashmere. Features horn buttons, a structured peak lapel, and cupro silk lining for supreme warmth and timeless elegance.',
    shortDescription: 'Grade-A 100% pure cashmere overcoat with peak lapels and Italian cupro lining.',
    price: 18499,
    compareAtPrice: 28999,
    discountPercent: 36,
    rating: 4.9,
    reviewCount: 94,
    stockQuantity: 8,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: false,
    sku: 'ATL-CSH-CT-CML',
    thumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['fashion', 'coat', 'cashmere', 'luxury', 'outerwear'],
    features: [
      '100% Grade-A Mongolian raw cashmere (520 GSM heavy weight)',
      'Natural horn buttons crafted in Florence, Italy',
      'Breathable anti-static Japanese cupro lining',
      'Twin welt front pockets with interior passport security pocket',
    ],
    specifications: [
      {
        group: 'Materials & Care',
        attributes: [
          { name: 'Fabric', value: '100% Pure Cashmere' },
          { name: 'Lining', value: '100% Cupro' },
          { name: 'Care', value: 'Specialist Dry Clean Only' },
        ],
      },
    ],
  },
  {
    id: 'prod-007',
    slug: 'botanical-glow-vitamin-c-serum',
    title: 'Lumiere Botanics 15% Ethyl Ascorbic Acid Vitamin C Radiance Serum',
    brand: 'Lumiere Botanics',
    category: 'Beauty & Wellness',
    categorySlug: 'beauty-wellness',
    description:
      'An ultra-stable, dermatologically tested brightening serum infused with 15% Ethyl Ascorbic Acid, Ferulic Acid, and Hyaluronic Acid to fade dark spots, boost collagen, and protect against free-radical damage.',
    shortDescription: 'Clinically tested 15% Vitamin C complex for luminous, even-toned skin.',
    price: 1299,
    compareAtPrice: 1999,
    discountPercent: 35,
    rating: 4.7,
    reviewCount: 489,
    stockQuantity: 45,
    isAvailable: true,
    isFeatured: false,
    isBestSeller: true,
    sku: 'LUM-VITC-30ML',
    thumbnail: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['skincare', 'serum', 'beauty', 'vitamin-c', 'glow'],
    features: [
      'Stabilized 15% Ethyl Ascorbic Acid does not oxidize quickly',
      'Ferulic acid boosts antioxidant photoprotection by 8x',
      'Triple molecular weight Hyaluronic Acid deeply hydrates',
      'Fragrance-free, paraben-free, cruelty-free vegan formula',
    ],
    specifications: [
      {
        group: 'Attributes',
        attributes: [
          { name: 'Volume', value: '30 ml / 1.0 fl oz' },
          { name: 'Skin Type', value: 'All Skin Types (including sensitive)' },
          { name: 'Origin', value: 'Made in India' },
        ],
      },
    ],
  },
  {
    id: 'prod-008',
    slug: 'titanium-smart-fitness-kettlebell',
    title: 'Apex Fit Pro Adjustable Smart Kettlebell with Digital Tracking',
    brand: 'Apex Fit',
    category: 'Sports & Outdoors',
    categorySlug: 'sports-fitness',
    description:
      'Replaces 7 kettlebells in one compact, ergonomic package. Quick-adjust mechanism shifts between 4.5kg to 18kg in 3 seconds. Built-in Bluetooth accelerometer logs your reps, power output, and calories to Apple Health and Google Fit.',
    shortDescription: 'Adjustable 4.5kg - 18kg kettlebell with real-time Bluetooth rep tracking.',
    price: 11999,
    compareAtPrice: 16999,
    discountPercent: 29,
    rating: 4.8,
    reviewCount: 165,
    stockQuantity: 14,
    isAvailable: true,
    isFeatured: true,
    isBestSeller: false,
    sku: 'APX-KTB-SMT-18',
    thumbnail: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1000&q=80',
    ],
    tags: ['fitness', 'workout', 'kettlebell', 'gym', 'sports'],
    features: [
      '7 selectable weight increments: 4.5kg, 7kg, 9kg, 11kg, 13.5kg, 16kg, 18kg',
      'Patented rapid-twist dial selector with safety mechanical interlock',
      'Cast iron core plates with matte rubber dampening protective coating',
      'Rechargeable Bluetooth sensor lasts 90 days per USB-C charge',
    ],
    specifications: [
      {
        group: 'Dimensions & Weights',
        attributes: [
          { name: 'Weight Range', value: '4.5 kg to 18 kg' },
          { name: 'Handle Grip', value: '35 mm textured powder-coated steel' },
          { name: 'Connectivity', value: 'Bluetooth 5.0 BLE' },
        ],
      },
    ],
  },
];

/**
 * Helper to query seed products
 */
export function getSeedProductBySlug(slug: string): Product | undefined {
  return DEVELOPMENT_SEED_PRODUCTS.find((p) => p.slug === slug);
}

export function getFeaturedSeedProducts(): Product[] {
  return DEVELOPMENT_SEED_PRODUCTS.filter((p) => p.isFeatured);
}

export function getBestSellerSeedProducts(): Product[] {
  return DEVELOPMENT_SEED_PRODUCTS.filter((p) => p.isBestSeller);
}

export function getDealSeedProducts(): Product[] {
  return DEVELOPMENT_SEED_PRODUCTS.filter((p) => p.isDealOfTheDay);
}
