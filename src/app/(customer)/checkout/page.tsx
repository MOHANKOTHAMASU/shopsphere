'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShoppingBag,
  Plus,
  Tag,
  AlertCircle,
  Banknote,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/utils';
import { Address, PaymentMethod, CouponValidation, Order } from '@/types/ecommerce';
import { getAddressesAction, saveAddressAction } from '@/lib/addresses/actions';
import { validateCouponAction, createOrderAction } from '@/lib/orders/actions';
import {
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction,
  recordPaymentFailureAction,
} from '@/lib/payments/razorpay';
import { openRazorpayModal } from '@/lib/payments/checkout-client';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();

  // Address state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingAddress, setIsAddingAddress] = useState<boolean>(false);
  const [newFullName, setNewFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [newPhone, setNewPhone] = useState(profile?.phone || '');
  const [newStreet, setNewStreet] = useState('');
  const [newApartment, setNewApartment] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Karnataka');
  const [newPin, setNewPin] = useState('');
  const [newAddressType, setNewAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [idempotencyKey] = useState(
    () => `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  );

  // Load saved addresses on mount
  useEffect(() => {
    async function loadAddresses() {
      const res = await getAddressesAction();
      if (res.success && res.addresses.length > 0) {
        setAddresses(res.addresses);
        const defaultAddr = res.addresses.find((a) => a.isDefault) || res.addresses[0];
        setSelectedAddressId(defaultAddr.id);
      }
    }
    loadAddresses();
  }, []);

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet || !newCity || !newPin || !newPhone) return;

    const res = await saveAddressAction({
      fullName: newFullName || profile?.full_name || 'Customer',
      phone: newPhone,
      street: newStreet,
      apartment: newApartment,
      city: newCity,
      state: newState,
      postalCode: newPin,
      country: 'India',
      isDefault: addresses.length === 0,
      type: newAddressType,
    });

    if (res.success && res.address) {
      setAddresses((prev) => [res.address!, ...prev]);
      setSelectedAddressId(res.address.id);
      setIsAddingAddress(false);
      setNewStreet('');
      setNewApartment('');
      setNewCity('');
      setNewPin('');
    }
  };

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await validateCouponAction(code, subtotal);
      if (res.valid) {
        setAppliedCoupon(res);
        setCouponCode(code);
      } else {
        setAppliedCoupon(null);
        setCouponError(res.message);
      }
    } finally {
      setCouponLoading(false);
    }
  };

  // Calculations
  const discountAmount = appliedCoupon?.valid ? appliedCoupon.discount : 0;
  const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];

  const triggerRazorpayPayment = async (order: Order, address: Address) => {
    setIsSubmitting(true);
    setOrderError(null);

    const rzpRes = await createRazorpayOrderAction(order.id);
    if (!rzpRes.success || !rzpRes.razorpayOrderId || !rzpRes.keyId) {
      setIsSubmitting(false);
      setOrderError(
        rzpRes.error ||
          'Could not initiate Razorpay transaction. Test mode keys may not be configured. You may choose Cash on Delivery to place your order now.'
      );
      return;
    }

    await openRazorpayModal({
      keyId: rzpRes.keyId,
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpRes.razorpayOrderId,
      amountInPaise: rzpRes.amount || Math.round(order.totalAmount * 100),
      customerName: address.fullName,
      customerEmail: user?.email || undefined,
      customerPhone: address.phone,
      onSuccess: async (payload) => {
        setIsVerifyingPayment(true);
        try {
          const verifyRes = await verifyRazorpayPaymentAction(payload);
          if (verifyRes.success) {
            clearCart();
            router.push(`/checkout/success?orderNumber=${order.orderNumber}`);
          } else {
            setOrderError(verifyRes.error || 'Payment signature verification failed.');
            setIsSubmitting(false);
            setIsVerifyingPayment(false);
          }
        } catch {
          setOrderError('Cryptographic payment verification error. Please contact support.');
          setIsSubmitting(false);
          setIsVerifyingPayment(false);
        }
      },
      onDismiss: () => {
        recordPaymentFailureAction(
          order.id,
          'MODAL_DISMISSED',
          'Customer closed Razorpay modal before completing payment'
        );
        setIsSubmitting(false);
        setOrderError(
          'Payment window was closed before completion. Your order has been registered as pending. Click "Retry Payment" to resume.'
        );
      },
      onError: (errMsg) => {
        recordPaymentFailureAction(order.id, 'PAYMENT_DECLINED', errMsg);
        setIsSubmitting(false);
        setOrderError(`Payment was declined: ${errMsg}. Click "Retry Payment" to try again.`);
      },
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setOrderError('Please select or add a delivery address.');
      return;
    }

    if (items.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setOrderError(null);

    try {
      const res = await createOrderAction({
        idempotencyKey,
        shippingAddress: selectedAddress,
        paymentMethod,
        couponCode: appliedCoupon?.valid ? appliedCoupon.code : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      });

      if (!res.success || !res.order) {
        setOrderError(res.error || 'Failed to place order. Please review your cart.');
        setIsSubmitting(false);
        return;
      }

      if (paymentMethod === 'cod') {
        clearCart();
        router.push(`/checkout/success?orderNumber=${res.order.orderNumber}`);
        return;
      }

      // Online Razorpay Flow
      setPendingOrder(res.order);
      await triggerRazorpayPayment(res.order, selectedAddress);
    } catch (err) {
      setOrderError((err as Error).message || 'Server error placing order. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">Your Cart is Empty</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Add items to your cart before proceeding to checkout.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <span>Browse Products</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
            Protected Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            Complete Your Order
          </h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-bold self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-Bit SSL Encrypted & Verified</span>
        </div>
      </div>

      {isVerifyingPayment && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>Verifying cryptographic payment signature with Razorpay & Bank... Please do not close this window.</span>
        </div>
      )}

      {orderError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{orderError}</span>
          </div>

          {pendingOrder && (
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => triggerRazorpayPayment(pendingOrder, selectedAddress)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Payment</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cod');
                  setOrderError(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Switch to COD
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Address, Payment & Items (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer & Delivery Address */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>1. Select Delivery Address</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form
                onSubmit={handleSaveNewAddress}
                className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-4 text-xs animate-in fade-in duration-200"
              >
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                  New Doorstep Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Receiver name"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      10-Digit Mobile Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">
                      Street Address & House No.
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 42, Brigade Metropolis, Whitefield"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Apartment / Suite (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Tower B, Flat 804"
                      value={newApartment}
                      onChange={(e) => setNewApartment(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      required
                      placeholder="Bengaluru"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">State</label>
                    <select
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="West Bengal">West Bengal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      placeholder="560048"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Address Type</label>
                    <div className="flex gap-2">
                      {(['Home', 'Work', 'Other'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNewAddressType(t)}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                            newAddressType === t
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-300 bg-white text-slate-600'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xs"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}

            {/* Saved Addresses List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {addresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">
                          {addr.fullName}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          {addr.type || 'Home'}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {addr.street} {addr.apartment ? `, ${addr.apartment}` : ''}, {addr.city},{' '}
                      {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">Phone: {addr.phone}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Payment Method Selection */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>2. Select Payment Method</span>
              </div>
              <span className="text-xs text-slate-400">Guaranteed Safe</span>
            </div>

            <div className="space-y-3">
              {/* Option A: Cash on Delivery (COD) */}
              <label
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'cod'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-1 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>Cash on Delivery (COD)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                      Popular
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Pay with cash or UPI on delivery at your doorstep. Order status is marked
                    confirmed immediately.
                  </p>
                </div>
              </label>

              {/* Option B: Razorpay Online Payment */}
              <label
                onClick={() => setPaymentMethod('razorpay')}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === 'razorpay'
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-1 flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <span>Cards / UPI / NetBanking (Razorpay)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      Zero Surcharge
                    </span>
                  </div>
                  <p className="text-slate-500">
                    Instant payment via GPay, PhonePe, Paytm, Credit/Debit cards, or NetBanking.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Ordered Items Review */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>3. Review Items ({items.length})</span>
              <Link href="/cart" className="text-xs font-bold text-indigo-600 hover:underline">
                Edit Cart
              </Link>
            </h3>

            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.thumbnail}
                      alt={item.product.title}
                      className="w-14 h-14 rounded-xl object-cover bg-slate-50 border border-slate-100"
                    />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                        {item.product.title}
                      </h4>
                      {item.variantTitle && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-indigo-600" />
                          <span>{item.variantTitle}</span>
                        </span>
                      )}
                      <span className="text-xs text-slate-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-xs sm:text-sm text-slate-900">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            {/* Coupons Card */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Coupon & Offers</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SHOPSPHERE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 h-10 px-3 text-xs uppercase bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:border-indigo-600 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={couponLoading || !couponCode.trim()}
                  className="px-4 h-10 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>

              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}

              {appliedCoupon && appliedCoupon.valid && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <span>{appliedCoupon.message}</span>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode('');
                    }}
                    className="text-[11px] text-emerald-700 underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Coupon Shortcut Badges */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Available Offers:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['SHOPSPHERE10', 'WELCOME500', 'FESTIVE20'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleApplyCoupon(c)}
                      className="px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[10px] font-mono font-bold text-indigo-700 transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Promo Discount</span>
                  <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doorstep Shipping</span>
                </span>
                <span className="font-semibold text-slate-900 font-mono">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-xs">FREE</span>
                  ) : (
                    formatCurrency(shippingFee)
                  )}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-black text-slate-900">Total Payable</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || items.length === 0}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {isVerifyingPayment
                      ? 'Verifying Payment...'
                      : paymentMethod === 'razorpay'
                      ? 'Launching Razorpay Gateway...'
                      : 'Placing Your Order...'}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'razorpay'
                      ? `Pay ${formatCurrency(finalTotal)} Online`
                      : 'Confirm & Place COD Order'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Trust Assurances */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Authentic Products</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Fast 2-4 Day Express Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
