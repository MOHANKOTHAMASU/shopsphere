'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
  UserPlus,
} from 'lucide-react';
import {
  sendCustomerEmailOtpAction,
  verifyCustomerEmailOtpAction,
} from '@/lib/auth/email-otp-actions';
import { useAuth } from '@/context/AuthContext';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const authErrorCode = searchParams.get('error');
  const isEmailJustVerified = searchParams.get('verified') === 'true';
  const isLoggedOut = searchParams.get('logout') === 'success';
  const isSwitching = searchParams.get('switch') === 'true';

  const { user, profile, signOut, refreshUser } = useAuth();

  // Step: 'request_otp' -> 'verify_otp'
  const [otpStep, setOtpStep] = useState<'request_otp' | 'verify_otp'>('request_otp');

  // Input states
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    isSwitching
      ? 'Previous account signed out. Enter your email below to sign in or register.'
      : isEmailJustVerified
      ? 'Your email address has been verified! You can now sign in.'
      : isLoggedOut
      ? 'You have been signed out successfully.'
      : null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(
    authErrorCode === 'account-suspended'
      ? 'Your account has been suspended. Please contact customer support.'
      : authErrorCode === 'session-expired'
      ? 'Your session has expired. Please sign in again.'
      : null
  );

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send 6-Digit Email OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setDevOtpHint(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendCustomerEmailOtpAction(cleanEmail);
      setIsLoading(false);

      if (res.success) {
        setOtpStep('verify_otp');
        setCountdown(res.cooldownSeconds || 45);
        setStatusMessage(res.message);
        if (res.devOtpPreview) {
          setDevOtpHint(res.devOtpPreview);
        }
      } else {
        setErrorMessage(res.message);
        if (res.cooldownSeconds) {
          setCountdown(res.cooldownSeconds);
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to dispatch verification email. Please try again.');
    }
  };

  // Step 2: Verify 6-Digit Email OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanToken = otpCode.trim();
    if (!cleanToken || cleanToken.length !== 6) {
      setErrorMessage('Please enter the 6-digit code sent to your email.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyCustomerEmailOtpAction(email.trim(), cleanToken, redirectUrl);
      if (res.success) {
        setStatusMessage('Authentication successful! Loading your account...');
        await refreshUser();
        router.push(res.redirectTo || redirectUrl);
        router.refresh();
      } else {
        setIsLoading(false);
        setErrorMessage(res.message);
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Verification failed. Please check the code and try again.');
    }
  };

  return (
    <div className="py-12 sm:py-16 flex justify-center px-4 sm:px-6">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Customer Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Sign in with your email address using a secure 6-digit verification code
          </p>
        </div>

        {/* Active Session Detected Banner */}
        {user && !isSwitching && !isLoggedOut && (
          <div className="p-5 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl text-center space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-100 px-2.5 py-0.5 rounded-full">
                Active Session Detected
              </span>
              <h3 className="text-sm font-black text-slate-900 pt-1">
                You are currently signed in as
              </h3>
              <p className="text-xs font-mono font-bold text-indigo-600 truncate px-2">
                {user.email || profile?.full_name || 'Verified Customer'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <Link
                href={redirectUrl || '/account'}
                className="w-full sm:flex-1 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
              >
                <span>Go to Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await signOut('/auth/login?switch=true');
                }}
                className="w-full sm:flex-1 h-10 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-300 transition-colors flex items-center justify-center cursor-pointer"
              >
                <span>Switch Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <p>{errorMessage}</p>
              {errorMessage.includes('register') && (
                <Link
                  href="/auth/register"
                  className="mt-1.5 inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account Now</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {/* Offline / Dev Simulated OTP Banner */}
        {devOtpHint && (
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-left space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                Active Verification OTP
              </span>
              <span className="text-[10px] bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                Valid 10m
              </span>
            </div>
            <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-amber-200 shadow-sm">
              <span className="font-mono text-xl font-black text-amber-700 tracking-widest">
                {devOtpHint}
              </span>
              <button
                type="button"
                onClick={() => setOtpCode(devOtpHint)}
                className="text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Autofill
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {otpStep === 'request_otp' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                We will send a confidential 6-digit login code to this email.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || countdown > 0}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Account & Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: VERIFY OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                  OTP Sent To
                </span>
                <span className="font-bold text-slate-900">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOtpStep('request_otp');
                  setOtpCode('');
                  setErrorMessage(null);
                }}
                className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Change
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono font-bold tracking-[0.5em] text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify OTP & Sign In</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <span className="text-slate-500">Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={countdown > 0 || isLoading}
                className="text-indigo-600 hover:underline font-bold disabled:text-slate-400 cursor-pointer"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        )}

        {/* Footer Guidance */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <Link
              href={`/auth/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="text-indigo-600 hover:underline font-bold"
            >
              Create Account
            </Link>
          </p>

          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Store Administrator Console</span>
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
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading sign in portal...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
