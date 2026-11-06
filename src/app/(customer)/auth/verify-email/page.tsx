'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Zap,
} from 'lucide-react';
import {
  sendEmailVerification,
  verifyEmailOtpToken,
  getPendingVerificationCodeAction,
  instantVerifyEmailAction,
} from '@/lib/auth/email-service';
import { useAuth } from '@/context/AuthContext';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialError = searchParams.get('error');

  const { refreshUser } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [tokenInput, setTokenInput] = useState('');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInstantVerifying, setIsInstantVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    initialError === 'invalid-or-expired'
      ? 'The verification link has expired or is invalid. Please request a new verification code.'
      : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  // Load any pending verification code on mount for testing & immediate access
  useEffect(() => {
    if (!email) return;
    async function loadCode() {
      try {
        const res = await getPendingVerificationCodeAction(email);
        if (res.success && res.code) {
          setActiveCode(res.code);
        }
      } catch {
        // Safe fallback
      }
    }
    loadCode();
  }, [email]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await sendEmailVerification(email);
      if (res.success) {
        setStatusMessage(res.message || 'Verification email dispatched!');
        setCountdown(res.cooldownSeconds || 60);
        if (res.verificationCode) {
          setActiveCode(res.verificationCode);
        }
      } else {
        setErrorMessage(res.message || 'Unable to resend verification email.');
      }
    } catch {
      setErrorMessage('Failed to connect to email service. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !tokenInput.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await verifyEmailOtpToken(email, tokenInput.trim());
      if (res.success) {
        setIsVerifiedSuccess(true);
        setStatusMessage(res.message);
        await refreshUser();
        setTimeout(() => {
          router.push('/account');
          router.refresh();
        }, 1500);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to verify token. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantActivate = async () => {
    if (!email || isInstantVerifying) return;
    setIsInstantVerifying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await instantVerifyEmailAction(email);
      if (res.success) {
        setIsVerifiedSuccess(true);
        setStatusMessage(res.message);
        await refreshUser();
        setTimeout(() => {
          router.push('/account');
          router.refresh();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Instant activation failed. Please try verifying with code.');
    } finally {
      setIsInstantVerifying(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 flex justify-center px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6 text-center">
        {/* Icon & Heading */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
          {isVerifiedSuccess ? (
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          ) : (
            <Mail className="w-7 h-7" />
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isVerifiedSuccess ? 'Email Verified Successfully!' : 'Verify Your Email Address'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {isVerifiedSuccess
              ? 'Your email address has been confirmed. Redirecting to your account dashboard...'
              : 'A 6-digit verification code has been dispatched to your email address.'}
          </p>
          {email && (
            <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
              {email}
            </div>
          )}
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 text-emerald-800 rounded-xl text-xs flex items-start gap-2 text-left">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 text-rose-800 rounded-xl text-xs flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Active Code / Instant Verify Card */}
        {activeCode && !isVerifiedSuccess && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                Active Verification OTP
              </span>
              <span className="text-[10px] bg-indigo-200/60 text-indigo-900 px-2 py-0.5 rounded-full font-semibold">
                Valid 10m
              </span>
            </div>
            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-indigo-100 shadow-sm">
              <span className="font-mono text-xl font-black text-indigo-700 tracking-widest">
                {activeCode}
              </span>
              <button
                type="button"
                onClick={() => setTokenInput(activeCode)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Autofill
              </button>
            </div>
            <button
              type="button"
              onClick={handleInstantActivate}
              disabled={isInstantVerifying}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isInstantVerifying ? 'Activating Account...' : 'Instant 1-Click Activate & Enter'}</span>
            </button>
          </div>
        )}

        {isVerifiedSuccess ? (
          <div className="pt-2">
            <Link
              href="/account"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all"
            >
              <span>Go to My Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* 6-Digit Code Input Form */}
            <form onSubmit={handleVerifyCode} className="space-y-4 pt-1 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 849201"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || tokenInput.length !== 6}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-slate-900/10 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify Code & Continue</span>
                )}
              </button>
            </form>

            {/* Resend Action */}
            <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-2.5">
              <p className="text-xs text-slate-500">Didn&apos;t receive the email? Check spam or resend code.</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Code'}
                </span>
              </button>
            </div>

            <div className="pt-1">
              <Link
                href="/auth/login"
                className="text-xs font-semibold text-slate-600 hover:text-indigo-600"
              >
                Return to Login
              </Link>
            </div>
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>ShopSphere Verified Security Infrastructure</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading verification portal...</p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
