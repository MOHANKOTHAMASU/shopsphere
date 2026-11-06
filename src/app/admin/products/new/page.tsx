'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { createProductAction, getAdminCategoriesAction } from '@/lib/admin/actions';
import { Category, CreateProductInput } from '@/types/ecommerce';

const DRAFT_STORAGE_KEY = 'shopsphere_admin_new_product_draft_v1';

const SAMPLE_IMAGE_PRESETS = [
  {
    name: 'Earbuds',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Smartwatch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Sneakers',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Backpack',
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Coffee Maker',
    url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
  },
];

export default function AdminNewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [categorySlug, setCategorySlug] = useState('electronics');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(25);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isDealOfTheDay, setIsDealOfTheDay] = useState(false);
  const [status, setStatus] = useState<'active' | 'draft' | 'inactive'>('active');
  const [visibility, setVisibility] = useState<'published' | 'unpublished'>('published');

  // Auto-calculate discount %
  const handlePriceChange = (val: number | '') => {
    setPrice(val);
    if (typeof val === 'number' && typeof compareAtPrice === 'number' && compareAtPrice > val) {
      setDiscountPercent(Math.round(((compareAtPrice - val) / compareAtPrice) * 100));
    }
  };

  const handleCompareAtPriceChange = (val: number | '') => {
    setCompareAtPrice(val);
    if (typeof val === 'number' && typeof price === 'number' && val > price) {
      setDiscountPercent(Math.round(((val - price) / val) * 100));
    }
  };

  // 1. Fetch categories
  useEffect(() => {
    getAdminCategoriesAction().then((res) => {
      if (res.success) setCategories(res.categories);
    });
  }, []);

  // 2. Restore Draft from localStorage (Prevents "compiling erasing all")
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        if (d.title || d.brand || d.price || d.sku) {
          if (d.title) setTitle(d.title);
          if (d.brand) setBrand(d.brand);
          if (d.categorySlug) setCategorySlug(d.categorySlug);
          if (d.sku) setSku(d.sku);
          if (d.price !== undefined) setPrice(d.price);
          if (d.compareAtPrice !== undefined) setCompareAtPrice(d.compareAtPrice);
          if (d.discountPercent !== undefined) setDiscountPercent(d.discountPercent);
          if (d.stockQuantity !== undefined) setStockQuantity(d.stockQuantity);
          if (d.description) setDescription(d.description);
          if (d.shortDescription) setShortDescription(d.shortDescription);
          if (d.imageUrls && Array.isArray(d.imageUrls) && d.imageUrls.length > 0) {
            setImageUrls(d.imageUrls);
          }
          if (d.isFeatured !== undefined) setIsFeatured(d.isFeatured);
          if (d.isBestSeller !== undefined) setIsBestSeller(d.isBestSeller);
          if (d.isDealOfTheDay !== undefined) setIsDealOfTheDay(d.isDealOfTheDay);
          setHasRestoredDraft(true);
        }
      }
    } catch {
      // Non-fatal
    }
  }, []);

  // 3. Auto-Save Draft to localStorage whenever user modifies form fields
  useEffect(() => {
    if (!title && !brand && !price && !sku) return;
    const draftPayload = {
      title,
      brand,
      categorySlug,
      sku,
      price,
      compareAtPrice,
      discountPercent,
      stockQuantity,
      description,
      shortDescription,
      imageUrls,
      isFeatured,
      isBestSeller,
      isDealOfTheDay,
      updatedAt: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    } catch {
      // Non-fatal
    }
  }, [
    title,
    brand,
    categorySlug,
    sku,
    price,
    compareAtPrice,
    discountPercent,
    stockQuantity,
    description,
    shortDescription,
    imageUrls,
    isFeatured,
    isBestSeller,
    isDealOfTheDay,
  ]);

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Non-fatal
    }
    setTitle('');
    setBrand('');
    setCategorySlug('electronics');
    setSku('');
    setPrice('');
    setCompareAtPrice('');
    setDiscountPercent(0);
    setStockQuantity(25);
    setDescription('');
    setShortDescription('');
    setImageUrls(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80']);
    setNewImageUrl('');
    setIsFeatured(false);
    setIsBestSeller(false);
    setIsDealOfTheDay(false);
    setHasRestoredDraft(false);
    setErrorMessage(null);
  };

  const handleFillSample = () => {
    const randomSkuSuffix = Math.floor(100 + Math.random() * 900);
    setTitle('Boat Rockerz 450 Bluetooth Wireless On-Ear Headphones');
    setBrand('Boat');
    setCategorySlug('electronics');
    setSku(`ELC-BOAT-450-${randomSkuSuffix}`);
    setPrice(1499);
    setCompareAtPrice(3990);
    setDiscountPercent(62);
    setStockQuantity(50);
    setShortDescription('Up to 15 hours non-stop playback with 40mm dynamic drivers and plush ear cushions.');
    setDescription(
      'Immerse in your favorite tracks with Boat Rockerz 450. Equipped with 40mm dynamic audio drivers, ergonomic lightweight design, Bluetooth v5.0 connectivity, and adaptive earcups for comfortable all-day listening. 1-Year manufacturer warranty included.'
    );
    setImageUrls([
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
    ]);
    setIsFeatured(true);
    setIsBestSeller(true);
    setErrorMessage(null);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const clean = newImageUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      setErrorMessage('Image URL must start with http:// or https://');
      return;
    }
    setImageUrls([...imageUrls, clean]);
    setNewImageUrl('');
    setErrorMessage(null);
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent, overrideStatus?: 'active' | 'draft', overrideVisibility?: 'published' | 'unpublished') => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Please enter a product title (at least 3 characters).');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMessage('Please enter a valid selling price greater than 0.');
      return;
    }
    if (!sku.trim() || sku.trim().length < 3) {
      setErrorMessage('Please provide a unique SKU (at least 3 characters).');
      return;
    }
    if (imageUrls.length === 0) {
      setErrorMessage('Please provide at least one product image URL.');
      return;
    }

    setIsSubmitting(true);

    const targetStatus = overrideStatus || status;
    const targetVisibility = overrideVisibility || visibility;

    const selectedCat = categories.find((c) => c.slug === categorySlug);
    const categoryName = selectedCat ? selectedCat.name : 'Electronics & Gadgets';

    const input: CreateProductInput = {
      title: title.trim(),
      brand: brand.trim() || 'ShopSphere Brand',
      category: categoryName,
      categorySlug,
      sku: sku.trim().toUpperCase(),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      discountPercent: Number(discountPercent),
      stockQuantity: Number(stockQuantity),
      description: description.trim() || title.trim(),
      shortDescription: shortDescription.trim() || description.slice(0, 120),
      images: imageUrls,
      thumbnail: imageUrls[0],
      isAvailable: Number(stockQuantity) > 0,
      isFeatured,
      isBestSeller,
      isDealOfTheDay,
      status: targetStatus,
      visibility: targetVisibility,
      isDeleted: false,
    };

    const res = await createProductAction(input);
    setIsSubmitting(false);

    if (res.success) {
      // Clear draft on successful creation
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Non-fatal
      }
      router.push('/admin/products');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Failed to create product.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Back Link & Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/products"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFillSample}
            className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            title="Auto-fill with sample product data"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Fill Sample Product</span>
          </button>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-[11px] text-slate-400 hover:text-rose-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            title="Clear all fields and discard draft"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Create New Product
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Add a verified marketplace product to your ShopSphere catalog with automatic draft preservation
        </p>
      </div>

      {hasRestoredDraft && (
        <div className="p-3 bg-indigo-950/60 border border-indigo-800 rounded-2xl text-xs text-indigo-300 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Draft restored from your last session. Your typed fields were preserved.</span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-[11px] font-bold underline hover:text-white cursor-pointer ml-2"
          >
            Start Fresh
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-950/80 border border-rose-800 rounded-2xl text-xs text-rose-300 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Product Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apple AirPods Pro (2nd Generation) with MagSafe Case"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The primary title shown in catalog search and on the product page.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apple, Sony, Nike, Boat"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            2. Pricing & Stock Inventory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 19999"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Actual price customer pays</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                MRP / Strike Price (₹)
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 24999"
                value={compareAtPrice}
                onChange={(e) => handleCompareAtPriceChange(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Crossed-out original price</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 20"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Shown on deal badges</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 50"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Available warehouse units</p>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. APL-APP2-MAG-WHT"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Unique identifier code for warehouse inventory tracking (e.g. CAT-BRAND-MODEL).
              </p>
            </div>
          </div>
        </div>

        {/* Descriptions & Media */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            3. Product Description & Images
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Short Tagline / Overview
              </label>
              <input
                type="text"
                placeholder="e.g. Next-generation active noise cancellation with personalized spatial audio."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Detailed Product Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe key benefits, specifications, box contents, and warranty details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 leading-relaxed"
              />
            </div>

            {/* Image URLs management */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Product Image URLs (HTTPS)
                </label>
                <span className="text-[11px] text-slate-500">
                  {imageUrls.length} image(s) attached
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Paste direct image link: https://images.unsplash.com/... or your CDN URL"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  className="flex-1 h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add URL</span>
                </button>
              </div>

              {/* Quick Image Presets */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px]">
                <span className="text-slate-500 font-semibold mr-1">Quick Presets:</span>
                {SAMPLE_IMAGE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      if (!imageUrls.includes(p.url)) {
                        setImageUrls([...imageUrls, p.url]);
                      }
                    }}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>

              {/* Image previews */}
              <div className="flex flex-wrap gap-3 mt-4">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner"
                  >
                    <Image
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-950/90 border border-rose-800 text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-rose-900"
                      title="Remove image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-md shadow">
                        COVER
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visibility Flags */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            4. Merchandising Badges
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-amber-400/40 transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-slate-200">Featured on Homepage</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-amber-400/40 transition-colors">
              <input
                type="checkbox"
                checked={isBestSeller}
                onChange={(e) => setIsBestSeller(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-slate-200">Bestseller Badge</span>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-amber-400/40 transition-colors">
              <input
                type="checkbox"
                checked={isDealOfTheDay}
                onChange={(e) => setIsDealOfTheDay(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 focus:ring-amber-400"
              />
              <span className="text-xs font-bold text-slate-200">Deal of the Day</span>
            </label>
          </div>
        </div>

        {/* Section 5: Status & Catalog Visibility */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            5. Status & Customer Catalog Visibility
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Product Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'draft' | 'inactive')}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="active">Active (Ready for Sale)</option>
                <option value="draft">Draft (Work in Progress)</option>
                <option value="inactive">Inactive (Archived)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Draft products are never visible on the public website.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Customer Website Visibility *
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'published' | 'unpublished')}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="published">Published (Visible on Customer Website)</option>
                <option value="unpublished">Unpublished (Hidden from Store & Search)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Only published products can be seen by customers.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/products"
            className="py-3 px-5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(undefined, 'draft', 'unpublished')}
            className="py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(undefined, 'active', 'published')}
            className="py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Product...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Publish Product to Store</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
