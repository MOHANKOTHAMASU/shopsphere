'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Warehouse, AlertTriangle, CheckCircle, Search, Save } from 'lucide-react';
import { getAdminProductsAction, updateInventoryAction } from '@/lib/admin/actions';
import { Product } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [filterType, setFilterType] = useState<'all' | 'low' | 'out' | 'in'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadProducts = () => {
    getAdminProductsAction().then((res) => {
      if (res.success) {
        setProducts(res.products);
        const inputs: Record<string, number> = {};
        res.products.forEach((p) => {
          inputs[p.id] = p.stockQuantity;
        });
        setStockInputs(inputs);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    getAdminProductsAction().then((res) => {
      if (isMounted) {
        if (res.success) {
          setProducts(res.products);
          const inputs: Record<string, number> = {};
          res.products.forEach((p) => {
            inputs[p.id] = p.stockQuantity;
          });
          setStockInputs(inputs);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleStockInputChange = (productId: string, val: number) => {
    setStockInputs({ ...stockInputs, [productId]: Math.max(0, val) });
  };

  const handleQuickAdd = (productId: string, delta: number) => {
    const current = stockInputs[productId] ?? 0;
    setStockInputs({ ...stockInputs, [productId]: Math.max(0, current + delta) });
  };

  const handleSaveStock = async (productId: string) => {
    const newStock = stockInputs[productId];
    if (newStock === undefined) return;
    setUpdatingId(productId);

    const res = await updateInventoryAction(productId, newStock);
    if (res.success) {
      setStatusMessage(`Stock updated to ${newStock} units.`);
      loadProducts();
    }
    setUpdatingId(null);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const lowStockCount = products.filter((p) => p.stockQuantity <= 10 && p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  const filteredProducts = products.filter((p) => {
    if (filterType === 'low') return p.stockQuantity <= 10 && p.stockQuantity > 0;
    if (filterType === 'out') return p.stockQuantity === 0;
    if (filterType === 'in') return p.stockQuantity > 10;
    return true;
  }).filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Inventory & Stock Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor safety thresholds, restock inventory levels, and avoid overselling
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tracked SKUs</span>
            <p className="text-2xl font-black text-white mt-1">{products.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Warehouse className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-amber-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Low Stock Alert (&le;10)</span>
            <p className="text-2xl font-black text-amber-300 mt-1">{lowStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-rose-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Out of Stock (0)</span>
            <p className="text-2xl font-black text-rose-300 mt-1">{outOfStockCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter Tabs and Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterType('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'low'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950 text-amber-400 hover:bg-slate-800'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterType('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'out'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950 text-rose-400 hover:bg-slate-800'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
          <button
            onClick={() => setFilterType('in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterType === 'in'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            In Stock
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search SKU or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading stock records...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Warehouse className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No inventory matches found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-3">SKU</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Current Stock</th>
                  <th className="py-3.5 px-3">Quick Adjust</th>
                  <th className="py-3.5 px-4 text-right">Commit Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= 10 && p.stockQuantity > 0;
                  const isOut = p.stockQuantity === 0;
                  const currentVal = stockInputs[p.id] ?? p.stockQuantity;
                  const hasChanged = currentVal !== p.stockQuantity;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden relative shrink-0">
                            <Image
                              src={p.thumbnail || p.images[0]}
                              alt={p.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-white truncate">{p.title}</p>
                            <p className="text-[10px] text-slate-400">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{p.sku}</td>
                      <td className="py-3 px-3 font-bold text-white">{formatCurrency(p.price)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                                : isLow
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {p.stockQuantity} units
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={currentVal}
                            onChange={(e) => handleStockInputChange(p.id, Number(e.target.value))}
                            className="w-16 h-8 px-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white font-mono text-center focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p.id, 10)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdd(p.id, 25)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Add 25 units"
                          >
                            +25
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={updatingId === p.id || !hasChanged}
                          onClick={() => handleSaveStock(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-30 ${
                            hasChanged
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{updatingId === p.id ? 'Saving...' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
