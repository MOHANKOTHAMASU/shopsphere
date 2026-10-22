'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/account/orders/[id]/invoice/page.tsx
// Official Printable Tax Invoice for Customer Orders
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import { getOrderDetailsAction } from '@/lib/orders/actions';
import { Order } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function OrderInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await getOrderDetailsAction(orderId);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } finally {
        setIsLoading(false);
      }
    }
    if (orderId) load();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Generating Tax Invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-16 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
        <Link
          href="/account/orders"
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          &larr; Back to Orders
        </Link>
      </div>
    );
  }

  const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
  const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const estimatedGst = Math.round(order.totalAmount * 0.18);
  const taxableAmount = order.totalAmount - estimatedGst;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Top Action Bar (Hidden during printing) */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.back()}
          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Order Details</span>
        </button>

        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Printable Invoice Sheet */}
      <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-lg space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                Shop<span className="text-indigo-600">Sphere</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                Tax Invoice
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">ShopSphere Retail Private Limited</p>
            <p className="text-xs text-slate-500">GSTIN: 29AABCS1429B1Z8 | PAN: AABCS1429B</p>
            <p className="text-xs text-slate-500">
              Plot 42, Brigade Tech Gardens, Whitefield, Bengaluru, KA - 560066
            </p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h1 className="text-xl font-black text-slate-900 font-mono">{invoiceNumber}</h1>
            <p className="text-xs text-slate-500">
              Order Ref: <strong className="font-mono text-slate-800">{order.orderNumber}</strong>
            </p>
            <p className="text-xs text-slate-500">Invoice Date: {invoiceDate}</p>
            <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Payment Confirmed ({order.paymentMethod.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Billing & Shipping Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Sold By (Seller)
            </h3>
            <p className="font-bold text-slate-800">ShopSphere Authorized Fulfillment Hub</p>
            <p className="text-slate-600">State: Karnataka (Code: 29)</p>
            <p className="text-slate-600">Country: India</p>
            <p className="text-slate-600">Authorized Signatory: ShopSphere Systems</p>
          </div>

          <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Billed & Shipped To (Customer)
            </h3>
            <p className="font-bold text-slate-800">{order.shippingAddress.fullName}</p>
            <p className="text-slate-600">{order.shippingAddress.street}</p>
            {order.shippingAddress.apartment && (
              <p className="text-slate-600">{order.shippingAddress.apartment}</p>
            )}
            <p className="text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
              {order.shippingAddress.postalCode}
            </p>
            <p className="text-slate-600">Contact: {order.shippingAddress.phone}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Order Items & Description of Goods
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={item.id} className="text-slate-800 font-medium">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold">{item.title}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{item.sku}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatCurrency(taxableAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (18% Integrated IGST):</span>
              <span className="font-mono">{formatCurrency(estimatedGst)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Promotional Discount:</span>
                <span className="font-mono">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Shipping & Logistics:</span>
              <span className="font-mono">
                {order.shippingFee === 0 ? 'FREE' : formatCurrency(order.shippingFee)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
              <span>Total Payable:</span>
              <span className="font-mono">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Terms and Sign-off */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end text-[11px] text-slate-500 gap-4">
          <div className="space-y-1">
            <p className="font-bold text-slate-700">Declaration & Terms:</p>
            <p>1. All products sold are genuine authorized merchandise covered by OEM warranty.</p>
            <p>2. Goods once sold are eligible for 7-day replacement as per ShopSphere policy.</p>
            <p>3. This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center gap-1 font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>ShopSphere Authenticated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
