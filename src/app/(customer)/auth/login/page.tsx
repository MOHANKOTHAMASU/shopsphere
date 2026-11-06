'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { sendCustomerEmailOtpAction, verifyCustomerEmailOtpAction } from '@/lib/auth/email-otp-actions';
import { signInAction } from '@/lib/auth/actions';
import { useAuth } from '@/context/AuthContext';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const authErrorCode = searchParams.get('error');
  const isEmailJustVerified = searchParams.get('verified') === 'true';
  const isLoggedOut = searchParams.get('logout') === 'success';

  const { refreshUser } = useAuth();

  // Mode: 'email_otp' (Default fast passwordless login) OR 'password' (Email + Password)
  const [loginMode, setLoginMode] = useState<'email_otp' | 'password'>('email_otp');

  // OTP Step: 'request_otp' -> 'verify_otp'
  const [otpStep, setOtpStep] = useState<'request_otp' | 'verify_otp'>('request_otp');

  // Fields
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(
    isEmailJustVerified
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
    if (!cleanEmail || !cleanEmail.includes('@')) {
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

  // Alternate: Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const fd = new FormData();
      fd.append('email', email.trim().toLowerCase());
      fd.append('password', password);
      fd.append('redirect', redirectUrl);
      const res = await signInAction(fd);

      if (res.success) {
        setStatusMessage('Signed in successfully! Loading store...');
        await refreshUser();
        router.push(redirectUrl);
        router.refresh();
      } else {
        setIsLoading(false);
        setErrorMessage(res.message || 'Invalid email or password.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected error occurred during sign in.');
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
            Sign in to access your orders, saved wishlist, and fast checkout
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setLoginMode('email_otp');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              loginMode === 'email_otp'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Passwordless Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode('password');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              loginMode === 'password'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Password Sign In
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {devOtpHint && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-center font-mono">
            <strong>Local Dev Code:</strong> <span className="font-black text-sm text-indigo-600 tracking-widest">{devOtpHint}</span>
          </div>
        )}

        {/* MODE 1: PASSWORDLESS EMAIL OTP */}
        {loginMode === 'email_otp' && (
          <>
            {otpStep === 'request_otp' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Your Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    We will send a secure 6-digit login code directly to your email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || countdown > 0}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send 6-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">OTP Sent To</span>
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
                    Enter 6-Digit Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono font-black text-lg tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {countdown > 0 ? (
                      `Resend code in ${countdown}s`
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400">Valid for 10 minutes</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>
              </form>
            )}
          </>
        )}

        {/* MODE 2: EMAIL + PASSWORD LOGIN */}
        {loginMode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-indigo-600 hover:underline font-bold"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>Sign In with Password</span>
              )}
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-3">
          <p className="text-xs text-slate-500">
            Don&apos;t have a ShopSphere account?{' '}
            <Link
              href="/auth/register"
              className="font-bold text-indigo-600 hover:underline"
            >
              Create Account
            </Link>
          </p>

          <p className="text-[11px] text-slate-400">
            Store Manager or Administrator?{' '}
            <Link
              href="/admin/login"
              className="font-bold text-amber-600 hover:underline"
            >
              Access Admin Console &rarr;
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
