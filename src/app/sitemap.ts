import type { MetadataRoute } from 'next';
import { DEVELOPMENT_SEED_PRODUCTS } from '@/data/seed-products';
import { DEVELOPMENT_SEED_CATEGORIES } from '@/data/seed-categories';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shopsphere.in';
  const now = new Date();

  // Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/products',
    '/offers',
    '/rewards',
    '/support',
    '/contact',
    '/privacy',
    '/terms',
    '/returns',
    '/shipping',
    '/refunds',
    '/track',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === '' || route === '/products' ? 'daily' : 'weekly') as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: route === '' ? 1.0 : route === '/products' ? 0.9 : 0.6,
  }));

  // Category listing pages
  const categoryRoutes: MetadataRoute.Sitemap = DEVELOPMENT_SEED_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/products?cat=${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // Public product detail pages
  const productRoutes: MetadataRoute.Sitemap = DEVELOPMENT_SEED_PRODUCTS.map((prod) => ({
    url: `${baseUrl}/products/${prod.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
