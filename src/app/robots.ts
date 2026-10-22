import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shopsphere.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/*',
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
        ],
        disallow: [
          '/admin/',
          '/account/',
          '/cart',
          '/checkout/',
          '/api/',
          '/auth/reset-password',
          '/auth/callback',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
