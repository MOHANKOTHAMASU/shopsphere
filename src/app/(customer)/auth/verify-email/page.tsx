'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import { resendVerificationEmailAction } from '@/lib/auth/actions';
import { verifyEmailOtpToken } from '@/lib/auth/email-service';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialError = searchParams.get('error');

  const [email, setEmail] = useState(initialEmail);
  const [tokenInput, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    initialError === 'invalid-or-expired'
      ? 'The verification link has expired or is invalid. Please request a new verification email.'
      : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

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
      const res = await resendVerificationEmailAction(email);
      if (res.success) {
        setStatusMessage(res.message || 'Verification email dispatched!');
        setCountdown(60);
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
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Failed to verify token. Please check the code and try again.');
    } finally {
      setIsLoading(false);
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
              ? 'Your email address has been confirmed. You may now continue to log in with your credentials.'
              : 'A genuine verification link has been dispatched to your email address.'}
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

        {isVerifiedSuccess ? (
          <div className="pt-4">
            <Link
              href="/auth/login"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all"
            >
              <span>Continue to Customer Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Optional Code Input */}
            <form onSubmit={handleVerifyCode} className="space-y-4 pt-2 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Have an email verification code?
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Enter 6-digit code or token"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !tokenInput.trim()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all"
              >
                {isLoading ? 'Verifying Code...' : 'Verify Code'}
              </button>
            </form>

            {/* Resend Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500">Didn&apos;t receive the email? Check your spam folder or resend.</p>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
                </span>
              </button>
            </div>

            <div className="pt-2">
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
