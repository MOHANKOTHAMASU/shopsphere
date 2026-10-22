'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  User,
  Phone,
  Home,
  MapPin,
  Building2,
  Globe,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { signUpAction } from '@/lib/auth/actions';
import { registerPhoneVerifiedCustomerAction } from '@/lib/auth/phone-actions';
import { useAuth } from '@/context/AuthContext';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Haryana',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
  'Other / International',
];

const GENDER_OPTIONS = [
  'Prefer not to say',
  'Male',
  'Female',
  'Other',
];

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const queryPhone = searchParams.get('phone');
  const isPhonePreVerified = Boolean(queryPhone);

  const { refreshUser } = useAuth();

  // Personal Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState(queryPhone || '');
  const [gender, setGender] = useState('Prefer not to say');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Delivery Address
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('India');

  // Terms and Submission
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Real-time password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    switch (score) {
      case 1:
        return { score, label: 'Weak (min 8 chars, mix letters & numbers)', color: 'bg-rose-500' };
      case 2:
        return { score, label: 'Fair (add letters & symbols)', color: 'bg-amber-500' };
      case 3:
        return { score, label: 'Good (strong password)', color: 'bg-indigo-500' };
      case 4:
        return { score, label: 'Very Strong (excellent protection)', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setErrorMessage('Please accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setValidationErrors({});
    setSuccessMessage(null);

    const fullPhone = isPhonePreVerified
      ? phoneNumber
      : `${countryCode} ${phoneNumber}`.trim();

    const formData = new FormData();
    formData.set('fullName', fullName);
    formData.set('email', email);
    formData.set('phone', fullPhone);
    formData.set('gender', gender);
    formData.set('dateOfBirth', dateOfBirth);
    formData.set('password', password);
    formData.set('confirmPassword', confirmPassword);
    formData.set('street', street);
    formData.set('apartment', apartment);
    formData.set('landmark', landmark);
    formData.set('city', city);
    formData.set('state', state);
    formData.set('postalCode', postalCode);
    formData.set('country', country);
    formData.set('redirect', redirectUrl);
    formData.set('agreedToTerms', 'true');

    try {
      let result;
      if (isPhonePreVerified) {
        result = await registerPhoneVerifiedCustomerAction(formData);
      } else {
        result = await signUpAction(formData);
      }

      setIsLoading(false);

      if (result.success) {
        setSuccessMessage(
          result.message || 'Account created successfully! Welcome to ShopSphere.'
        );
        await refreshUser();
        if (result.redirectTo) {
          setTimeout(() => {
            router.push(result.redirectTo || redirectUrl);
            router.refresh();
          }, 1200);
        }
      } else {
        if (result.errors) {
          setValidationErrors(result.errors);
        }
        setErrorMessage(
          result.message || 'Unable to complete registration. Please check the highlighted fields.'
        );
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred during registration. Please try again.');
    }
  };

  return (
    <div className="py-8 sm:py-12 flex justify-center px-4 sm:px-6">
      <div className="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-md shadow-indigo-200 mb-1">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Create Your Customer Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Join ShopSphere for verified member pricing, fast checkout, reward points, and order tracking.
          </p>
        </div>

        {/* Verified Phone Banner */}
        {isPhonePreVerified && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Mobile Number Verified: <strong className="font-mono">{phoneNumber}</strong>
              </span>
            </div>
            <Link
              href="/auth/login"
              className="text-xs text-indigo-600 hover:text-indigo-800 underline font-bold"
            >
              Change
            </Link>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-emerald-800 font-semibold leading-relaxed animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">{successMessage}</p>
              <p className="text-xs text-emerald-700 font-normal mt-0.5">
                Redirecting you to your account dashboard in a moment...
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-800 font-semibold animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <span>1. Personal Information</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                      validationErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                      validationErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {validationErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                {isPhonePreVerified && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified via OTP</span>
                  </span>
                )}
              </div>
              {isPhonePreVerified ? (
                <div className="relative">
                  <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    readOnly
                    value={phoneNumber}
                    className="w-full h-11 pl-10 pr-4 bg-emerald-50/40 border border-emerald-300 rounded-xl text-xs sm:text-sm text-emerald-950 font-bold focus:outline-hidden cursor-not-allowed"
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                  >
                    <option value="+91">🇮🇳 +91 (IN)</option>
                    <option value="+1">🇺🇸 +1 (US)</option>
                    <option value="+44">🇬🇧 +44 (UK)</option>
                    <option value="+971">🇦🇪 +971 (UAE)</option>
                    <option value="+65">🇸🇬 +65 (SG)</option>
                    <option value="+61">🇦🇺 +61 (AU)</option>
                  </select>

                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                        validationErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                  </div>
                </div>
              )}
              {validationErrors.phone && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {validationErrors.phone}
                </p>
              )}
            </div>

            {/* Gender and Date of Birth */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Date of Birth <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password (Optional if Phone verified) */}
            {!isPhonePreVerified && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      minLength={8}
                      placeholder="Min 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full h-11 pl-10 pr-10 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                        validationErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 transition-all ${
                              step <= strength.score ? strength.color : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">{strength.label}</p>
                    </div>
                  )}
                  {validationErrors.password && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {validationErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                        validationErrors.confirmPassword
                          ? 'border-rose-400 bg-rose-50/20'
                          : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Delivery Address */}
          <div className="space-y-4 pt-2">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                <span>2. Default Delivery Address</span>
              </h2>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Address Line 1 (House No., Building, Street) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="street"
                  required
                  placeholder="e.g. 42, Brigade Road"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                    validationErrors.street ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
              </div>
              {validationErrors.street && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">
                  {validationErrors.street}
                </p>
              )}
            </div>

            {/* Address Line 2 & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Address Line 2 <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="apartment"
                  placeholder="Flat, Floor, Building Name"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="landmark"
                  placeholder="Near Metro, Temple, Park"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* City, State, PIN Code, Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  City / District <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                      validationErrors.city ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                </div>
                {validationErrors.city && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {validationErrors.city}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  State <span className="text-rose-500">*</span>
                </label>
                <select
                  name="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  PIN Code / Postal Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  placeholder="e.g. 560001 (6 digits)"
                  maxLength={6}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                  className={`w-full h-11 px-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all ${
                    validationErrors.postalCode
                      ? 'border-rose-400 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
                {validationErrors.postalCode && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">
                    {validationErrors.postalCode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Country</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    name="country"
                    readOnly
                    value={country}
                    className="w-full h-11 pl-10 pr-4 bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-700 font-bold focus:outline-hidden cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to the ShopSphere{' '}
                <Link href="/terms" className="text-indigo-600 underline font-semibold">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-600 underline font-semibold">
                  Privacy Policy
                </Link>
                , and consent to receiving order updates on my mobile number and email.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !agreedToTerms}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Your Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Existing Member Footer */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have a ShopSphere account?{' '}
            <Link
              href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              Sign In Instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
