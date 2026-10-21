import React from 'react';
import { AdminShell } from '@/components/admin/AdminShell';

export const metadata = {
  title: 'ShopSphere Admin Portal',
  description: 'Manage products, categories, orders, customers, and platform settings',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
