'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  getAdminProductsAction,
  updateProductAction,
  deleteProductAction,
  getAdminCategoriesAction,
  toggleProductVisibilityAction,
} from '@/lib/admin/actions';
import { Product, Category, CreateProductInput } from '@/types/ecommerce';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminEditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [categorySlug, setCategorySlug] = useState('electronics');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [compareAtPrice, setCompareAtPrice] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isDealOfTheDay, setIsDealOfTheDay] = useState(false);
  const [status, setStatus] = useState<'active' | 'draft' | 'inactive'>('active');
  const [visibility, setVisibility] = useState<'published' | 'unpublished'>('published');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAdminProductsAction(),
      getAdminCategoriesAction(),
    ]).then(([prodRes, catRes]) => {
      if (!isMounted) return;
      if (catRes.success) setCategories(catRes.categories);

      if (prodRes.success) {
        const found = prodRes.products.find((p) => p.id === productId || p.slug === productId);
        if (found) {
          setProduct(found);
          setTitle(found.title);
          setBrand(found.brand);
          setCategorySlug(found.categorySlug);
          setSku(found.sku);
          setPrice(found.price);
          setCompareAtPrice(found.compareAtPrice || '');
          setDiscountPercent(found.discountPercent || 0);
          setStockQuantity(found.stockQuantity);
          setDescription(found.description);
          setShortDescription(found.shortDescription || found.description.slice(0, 120));
          setImageUrls(found.images && found.images.length > 0 ? found.images : [found.thumbnail]);
          setIsFeatured(Boolean(found.isFeatured));
          setIsBestSeller(Boolean(found.isBestSeller));
          setIsDealOfTheDay(Boolean(found.isDealOfTheDay));
          setStatus(found.status || 'active');
          setVisibility(found.visibility || 'published');
        } else {
          setErrorMessage('Product not found in store catalog.');
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [productId]);

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

  const handleSave = async (
    e?: React.FormEvent,
    overrideStatus?: 'active' | 'draft',
    overrideVisibility?: 'published' | 'unpublished'
  ) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Please enter a product title (at least 3 characters).');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMessage('Please enter a valid price greater than 0.');
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

    const input: Partial<CreateProductInput> = {
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
    };

    const res = await updateProductAction(productId, input);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Product updated successfully!');
      if (overrideStatus) setStatus(overrideStatus);
      if (overrideVisibility) setVisibility(overrideVisibility);
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(res.error || 'Failed to update product.');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Are you sure you want to permanently delete "${product.title}"?`)) {
      return;
    }

    setIsDeleting(true);
    const res = await deleteProductAction(productId);
    setIsDeleting(false);

    if (res.success) {
      router.push('/admin/products');
      router.refresh();
    } else {
      setErrorMessage(res.error || 'Failed to delete product.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">Loading product details...</p>
      </div>
    );
  }

  if (!product && !isLoading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested product ID does not exist or may have been deleted.
        </p>
        <Link
          href="/admin/products"
          className="inline-block py-2.5 px-4 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

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
          {product && (
            <Link
              href={`/products/${product.slug}`}
              target="_blank"
              className="text-[11px] font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview on Store</span>
            </Link>
          )}

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="text-[11px] font-bold text-rose-400 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Edit Product
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Modify pricing, description, stock inventory, status, and store visibility
        </p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSave(e)} className="space-y-6">
        {/* Section 1: Basic Info */}
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
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

        {/* Section 2: Pricing & Stock */}
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
                value={price}
                onChange={(e) => handlePriceChange(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                MRP / Strike Price (₹)
              </label>
              <input
                type="number"
                min="1"
                value={compareAtPrice}
                onChange={(e) => handleCompareAtPriceChange(e.target.value ? Number(e.target.value) : '')}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Current Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                SKU (Stock Keeping Unit) *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Images */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-400">
            3. Product Images
          </h2>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Image</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative group w-24 h-24 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner"
                >
                  <Image
                    src={url}
                    alt={`Product image ${idx + 1}`}
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

        {/* Section 4: Merchandising */}
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
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            onClick={() => handleSave(undefined, 'draft', 'unpublished')}
            className="py-3.5 px-5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            Save as Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave(undefined, 'active', 'published')}
            className="py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Publish Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
