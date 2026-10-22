'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  Phone,
  Shield,
  Smartphone,
  KeyRound,
} from 'lucide-react';
import { signInAction, resendVerificationEmailAction } from '@/lib/auth/actions';
import {
  sendPhoneOtpAction,
  verifyPhoneOtpAction,
} from '@/lib/auth/phone-actions';
import { DEVELOPMENT_TEST_OTP } from '@/lib/auth/phone-utils';

import { validateLoginData } from '@/lib/auth/validation';
import { useAuth } from '@/context/AuthContext';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/account';
  const authErrorCode = searchParams.get('error');

  const { refreshUser } = useAuth();

  // Authentication mode: Phone Number (default) or Email/Password
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');

  // Phone OTP Flow State
  const [phoneStep, setPhoneStep] = useState<'enter_phone' | 'verify_otp'>('enter_phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [countdown, setCountdown] = useState(30);
  const canResend = countdown === 0;
  const [devTestOtp, setDevTestOtp] = useState<string | null>(null);

  // Email Flow State
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

  // Countdown timer for Phone OTP resend
  useEffect(() => {
    if (phoneStep !== 'verify_otp' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [phoneStep, countdown]);

  // Handle Phone OTP Step 1: Send OTP
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await sendPhoneOtpAction(countryCode, phoneNumber);
      if (res.success) {
        setMaskedPhone(res.maskedPhone || `${countryCode} ${phoneNumber}`);
        setDevTestOtp(res.testOtp || DEVELOPMENT_TEST_OTP);
        setPhoneStep('verify_otp');
        setCountdown(30);
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message || 'Unable to send OTP. Please check your mobile number.');
      }
    } catch {
      setErrorMessage('Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Phone OTP Step 2: Verify OTP
  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await verifyPhoneOtpAction(countryCode, phoneNumber, otpCode, redirectUrl);
      if (res.success) {
        setSuccessMessage(res.message);
        await refreshUser();
        setTimeout(() => {
          router.push(res.redirectTo || redirectUrl);
          router.refresh();
        }, 600);
      } else {
        setErrorMessage(res.message || 'Invalid OTP code. Please verify and re-enter.');
      }
    } catch {
      setErrorMessage('OTP verification encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Phone OTP
  const handleResendPhoneOtp = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await sendPhoneOtpAction(countryCode, phoneNumber);
      if (res.success) {
        setCountdown(30);
        setSuccessMessage('A new verification code has been dispatched.');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Email Verification Resend
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

  // Handle Email/Password Submit
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
            Sign in to access your orders, rewards, wishlist, and customer benefits
          </p>
        </div>

        {/* Auth Mode Toggle Tabs (Mobile OTP vs Email/Password) */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('phone');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'phone'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('email');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'email'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
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

        {/* ------------------------------------------------------------- */}
        {/* MODE A: MOBILE NUMBER & OTP LOGIN                             */}
        {/* ------------------------------------------------------------- */}
        <div className={authMode === 'phone' ? 'block' : 'hidden'}>
          <div>
            {phoneStep === 'enter_phone' ? (
              /* Step 1: Enter Phone Number */
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Selector */}
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shrink-0"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>

                    {/* Mobile Input */}
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ''))}
                        placeholder="10-digit mobile number"
                        maxLength={11}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    We will send a 6-digit verification code (OTP) via SMS to verify your identity.
                  </p>
                </div>

                {/* Development Mode OTP Notice */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong className="font-bold">Test Mode:</strong> Use test code{' '}
                      <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">
                        123456
                      </code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoneNumber('9876543210')}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Demo #
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Sending OTP...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  By continuing, you agree to ShopSphere&apos;s{' '}
                  <Link href="/terms" className="text-indigo-600 underline">
                    Conditions of Use
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-indigo-600 underline">
                    Privacy Notice
                  </Link>
                  .
                </p>
              </form>
            ) : (
              /* Step 2: Verify 6-digit OTP */
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      OTP Sent To
                    </span>
                    <p className="text-xs font-bold text-slate-800">{maskedPhone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep('enter_phone');
                      setOtpCode('');
                      setErrorMessage(null);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Development OTP Banner */}
                {devTestOtp && (
                  <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Development Test Code:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devTestOtp)}
                      className="bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded text-xs hover:bg-indigo-700 cursor-pointer"
                    >
                      Autofill {devTestOtp}
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    maxLength={6}
                    autoFocus
                    className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendPhoneOtp}
                      disabled={isLoading}
                      className="font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-slate-400">
                      Resend code in <strong className="text-slate-600">{countdown}s</strong>
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">Attempts: 5 max</span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isLoading ? <span>Verifying OTP...</span> : <span>Verify & Continue</span>}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODE B: EMAIL & PASSWORD LOGIN (PRESERVES EXISTING REGRESSION) */}
        {/* ------------------------------------------------------------- */}
        <div className={authMode === 'email' ? 'block' : 'hidden'}>
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${
                    fieldErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.email}
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
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border ${
                    fieldErrors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-300'
                  } text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-600">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link to Registration */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have a ShopSphere account?{' '}
            <Link
              href={`/auth/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-indigo-600 hover:text-indigo-800"
            >
              Create Account
            </Link>
          </p>
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
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
