'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { signInAction } from '@/lib/auth/actions';
import { useAuth } from '@/context/AuthContext';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const authErrorCode = searchParams.get('error');

  const { refreshUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authErrorCode === 'auth-code-error'
      ? 'Email confirmation or authorization code expired. Please sign in again.'
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set('redirect', redirectUrl);

    const result = await signInAction(formData);

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Signed in successfully! Redirecting...');
      await refreshUser();
      setTimeout(() => {
        router.push(result.redirectTo || redirectUrl);
        router.refresh();
      }, 700);
    } else {
      setErrorMessage(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="py-8 sm:py-12 flex justify-center">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center shadow-md shadow-indigo-200 mb-1">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome to ShopSphere
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in to access your orders, wishlist, and exclusive member discounts
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2 text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('verify') && (
              <div className="text-[11px] text-rose-700 bg-rose-100/60 p-2.5 rounded-lg font-normal leading-relaxed space-y-1.5">
                <p>
                  💡 <strong>Delivery Notice:</strong> If email verification is delayed by provider quota limits, you can verify your account and set a new password instantly using our 6-digit OTP code.
                </p>
                <Link
                  href="/auth/forgot-password"
                  className="text-indigo-700 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Verify and reset via 6-digit OTP</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
              <span>Remember me on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              href={
                redirectUrl && redirectUrl !== '/account'
                  ? `/auth/register?redirect=${encodeURIComponent(redirectUrl)}`
                  : '/auth/register'
              }
              className="font-bold text-indigo-600 hover:underline"
            >
              Register here
            </Link>
          </p>

          <div className="pt-2">
            <Link
              href="/admin/login"
              className="text-[11px] text-amber-700 font-semibold bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-200/60 inline-flex items-center gap-1.5"
            >
              <span>Store Manager or Staff?</span>
              <span className="underline">Access Admin Portal &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-slate-500">Loading Sign In Form...</div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
