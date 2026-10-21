// -----------------------------------------------------------------------------
// src/app/admin/pricing/page.tsx
// ShopSphere Admin Pricing Management & Indian Competitor Intelligence
// -----------------------------------------------------------------------------

import React from 'react';
import { getAdminPricingDashboardAction } from '@/lib/pricing/actions';
import { PricingDashboardClient } from './PricingDashboardClient';
import { redirect } from 'next/navigation';
import { assertAdmin } from '@/lib/auth/admin-guard';

export const metadata = {
  title: 'Pricing Intelligence & Profitability Guardrails | ShopSphere Admin',
  description: 'Manage Indian competitor benchmarks, cost floors, and price approval queue',
};

export default async function AdminPricingPage() {
  // Enforce admin privileges on server side
  try {
    await assertAdmin();
  } catch {
    redirect('/admin/login?redirect=/admin/pricing');
  }

  const result = await getAdminPricingDashboardAction();

  if (!result.success) {
    return (
      <div className="p-8 bg-rose-950/40 border border-rose-800 rounded-3xl text-rose-300">
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p className="text-sm">
          {result.error || 'Failed to authenticate administrative access to pricing intelligence.'}
        </p>
      </div>
    );
  }

  return (
    <PricingDashboardClient
      initialItems={result.items}
      summary={result.summary}
      auditTrail={result.auditTrail}
      adminEmail={result.adminEmail || 'admin@shopsphere.in'}
    />
  );
}
