import React from 'react';
import { SeedDataNotice } from '@/components/common/SeedDataNotice';
import { TopNoticeBar } from '@/components/layout/TopNoticeBar';
import { Header } from '@/components/layout/Header';
import { NavigationRibbon } from '@/components/layout/NavigationRibbon';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SeedDataNotice />
      <TopNoticeBar />
      <Header />
      <NavigationRibbon />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {children}
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
