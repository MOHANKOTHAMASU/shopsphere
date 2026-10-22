import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shopsphere.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ShopSphere | Next-Gen E-Commerce Experience',
    template: '%s | ShopSphere',
  },
  description:
    'ShopSphere is India’s premier e-commerce destination for curated electronics, designer fashion, luxury home decor, and authentic lifestyle goods with lightning-fast delivery.',
  keywords: [
    'e-commerce',
    'online shopping',
    'electronics',
    'fashion',
    'home decor',
    'deals',
    'ShopSphere',
  ],
  authors: [{ name: 'ShopSphere Engineering Team' }],
  openGraph: {
    title: 'ShopSphere | Next-Gen E-Commerce Experience',
    description:
      'ShopSphere is India’s premier e-commerce destination for curated electronics, designer fashion, luxury home decor, and authentic lifestyle goods.',
    url: siteUrl,
    siteName: 'ShopSphere',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopSphere | Next-Gen E-Commerce Experience',
    description:
      'Discover millions of curated products with authentic warranty and fast delivery on ShopSphere.',
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
