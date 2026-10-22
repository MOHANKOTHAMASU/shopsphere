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
  RefreshCw,
} from 'lucide-react';
import { signInAction, resendVerificationEmailAction } from '@/lib/auth/actions';
import { validateLoginData } from '@/lib/auth/validation';
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
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const isLoggedOut = searchParams.get('logout') === 'success';
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authErrorCode === 'account-suspended'
      ? 'Your account has been suspended. Please contact customer support for assistance.'
      : authErrorCode === 'auth-code-error'
      ? 'Email confirmation or authorization code expired. Please sign in again.'
      : authErrorCode === 'session-expired'
      ? 'Your session has expired. Please sign in again to continue.'
      : authErrorCode === 'admin-required'
      ? 'Administrative privileges are required to access that area. Please sign in with an admin account.'
      : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    isLoggedOut ? 'You have been signed out successfully. Enter your credentials to sign back in.' : null
  );

  const handleResendVerification = async () => {
    if (!email) {
      setResendStatus('Please enter your registered email address in the field below first.');
      return;
    }
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerificationEmailAction(email);
      setResendStatus(res.message || 'Verification email resent! Please check your inbox.');
    } catch {
      setResendStatus('Unable to resend verification email. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setResendStatus(null);

    // Client-side instant validation
    const validation = validateLoginData({ email, password });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('redirect', redirectUrl);
    formData.set('rememberMe', rememberMe ? 'true' : 'false');

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
      if (result.errors) {
        setFieldErrors(result.errors);
      }
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
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5">
            <div className="flex items-start gap-2 text-xs text-rose-800 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {errorMessage.toLowerCase().includes('verify') && (
              <div className="text-[11px] text-rose-700 bg-rose-100/60 p-3 rounded-xl font-normal leading-relaxed space-y-2.5">
                <p>
                  Please verify your email address to unlock account access and protected features.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                    <span>{isResending ? 'Resending...' : 'Resend Verification Email'}</span>
                  </button>
                  <Link
                    href="/auth/forgot-password"
                    className="px-3 py-1.5 bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                  >
                    <span>Verify with 6-Digit OTP</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {resendStatus && (
                  <p className="text-[11px] font-semibold text-slate-800 bg-white/80 p-2 rounded-lg border border-rose-200">
                    {resendStatus}
                  </p>
                )}
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
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }
                }}
                disabled={isLoading}
                className={`w-full h-11 pl-10 pr-4 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all disabled:opacity-50 ${
                  fieldErrors.email
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                disabled={isLoading}
                className={`w-full h-11 pl-10 pr-10 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all disabled:opacity-50 ${
                  fieldErrors.password
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Remember me on this browser</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </span>
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
