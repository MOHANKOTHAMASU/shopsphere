// -----------------------------------------------------------------------------
// src/app/admin/products/import/page.tsx
// ShopSphere Admin Bulk Product CSV Importer & Validator
// -----------------------------------------------------------------------------

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';
import { bulkImportProductsCsvAction } from '@/lib/admin/actions';

const SAMPLE_CSV = `title,brand,categorySlug,price,compareAtPrice,stockQuantity,sku,description,thumbnail
HyperSonic ANC Wireless Earbuds,SoundWave,electronics,2999,4999,25,ELEC-SW-901,High fidelity active noise cancellation earbuds with 36hr battery,https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80
Organic Bamboo Casual T-Shirt,EcoWear,fashion,999,1499,50,FASH-ECO-902,Ultra soft breathable 100% organic bamboo fabric casual crewneck tee,https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80
Cast Iron Dutch Oven 5L,MasterChef,home-kitchen,3499,4999,15,HOME-MC-903,Enamelled heavy duty cast iron casserole dish for artisanal baking and braising,https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=800&q=80`;

export default function AdminProductImportPage() {
  const router = useRouter();
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'shopsphere_product_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCsvText(content);
        setValidationErrors([]);
        setSuccessMessage(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setValidationErrors([]);
    setSuccessMessage(null);

    startTransition(async () => {
      const res = await bulkImportProductsCsvAction(csvText);
      if (res.success) {
        setSuccessMessage(res.message || 'Products imported successfully!');
        setTimeout(() => {
          router.push('/admin/products');
        }, 2000);
      } else {
        setValidationErrors(res.errors || [res.message || 'Validation failed.']);
      }
    });
  };

  // Quick stats from textarea
  const linesCount = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0).length;
  const estimatedRows = Math.max(0, linesCount - 1);

  return (
    <div className="max-w-5xl space-y-6">
      {/* Top Breadcrumb & Header */}
      <div>
        <Link
          href="/admin/products"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Catalog</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-amber-400" />
              <span>Bulk CSV Product Import</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Add multiple catalog items safely. Rejects duplicate SKUs and validates category thresholds.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div>{successMessage}</div>
            <div className="text-[11px] text-emerald-400/80">Redirecting to product catalog...</div>
          </div>
        </div>
      )}

      {/* Validation Errors Box */}
      {validationErrors.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>CSV Validation Failed ({validationErrors.length} issues found)</span>
          </div>
          <p className="text-xs text-rose-300">
            Please fix the following rows before importing. Existing products were not modified.
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs font-mono max-h-48 overflow-y-auto pt-2 border-t border-rose-900">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Upload & Text Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Upload Drop Area */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Upload .csv File</div>
              <div className="text-[11px] text-slate-400">Select file from your local computer</div>
            </div>
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileUpload}
            className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-950 hover:file:bg-amber-300 cursor-pointer"
          />
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Or Paste Raw CSV Data:</span>
            <span className="font-mono text-amber-400">{estimatedRows} product rows detected</span>
          </div>
          <textarea
            rows={12}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
            placeholder="title,brand,categorySlug,price,compareAtPrice,stockQuantity,sku,description,thumbnail"
          />
        </div>

        {/* Category Slugs Legend */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1.5">
          <div className="font-bold text-slate-300">Supported Category Slugs:</div>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {['electronics', 'fashion', 'home-kitchen', 'beauty', 'books', 'sports', 'grocery', 'accessories'].map(
              (cat) => (
                <span key={cat} className="px-2 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
                  {cat}
                </span>
              )
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending || estimatedRows === 0}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {isPending ? (
              <span>Validating & Importing...</span>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                <span>Validate & Import {estimatedRows} Products</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
