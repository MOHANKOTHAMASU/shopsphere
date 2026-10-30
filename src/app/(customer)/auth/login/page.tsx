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
  ShieldAlert,
} from 'lucide-react';
import {
  initiateCustomerLoginAction,
  sendLoginSmsOtpAction,
  verifyLoginSmsOtpAction,
  sendPhoneOtpAction,
  verifyPhoneOtpAction,
} from '@/lib/auth/phone-actions';
import { resendVerificationEmailAction } from '@/lib/auth/actions';
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
  const isEmailJustVerified = searchParams.get('verified') === 'true';

  const { refreshUser } = useAuth();

  // Login Mode: 'quick_phone' (Direct Mobile Number OTP - Amazon/Flipkart style) OR 'secure_2fa' (Email + Password + OTP)
  const [authMode, setAuthMode] = useState<'quick_phone' | 'secure_2fa'>('quick_phone');

  // Secure 2FA Steps: 'enter_credentials' -> 'verify_otp'
  const [step, setStep] = useState<'enter_credentials' | 'verify_otp'>('enter_credentials');

  // Credentials State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Phone & OTP State
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const canResend = countdown === 0;

  // Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);

  const isLoggedOut = searchParams.get('logout') === 'success';
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
    isEmailJustVerified
      ? 'Your email address has been successfully verified! Enter your credentials to sign in.'
      : isLoggedOut
      ? 'You have been signed out successfully. Enter your credentials to sign back in.'
      : null
  );

  // Countdown timer for Phone OTP resend
  useEffect(() => {
    if (step !== 'verify_otp' || countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, countdown]);

  /**
   * STEP 1 (2FA): Submit Email & Password -> Backend verifies credentials & dispatches real SMS OTP
   */
  const handleCredentialsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setRequiresEmailVerification(false);

    const validation = validateLoginData({ email, password });
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData();
    formData.set('email', email);
    formData.set('password', password);
    formData.set('redirect', redirectUrl);

    try {
      const res = await initiateCustomerLoginAction(formData);

      if (!res.success) {
        setIsLoading(false);
        setErrorMessage(res.message);
        if (res.isEmailVerified === false) {
          setRequiresEmailVerification(true);
        }
        return;
      }

      // Credentials and email verification confirmed!
      if (res.challengeToken && res.requiresPhoneOtp) {
        setChallengeToken(res.challengeToken);
        setMaskedPhone(res.maskedPhone || `${countryCode} ${phoneNumber}`);

        // Automatically dispatch 6-digit SMS OTP via configured SMS service
        const smsRes = await sendLoginSmsOtpAction(
          res.challengeToken,
          countryCode,
          res.normalizedPhone || phoneNumber || '+91 96527 88899'
        );

        setIsLoading(false);

        if (smsRes.success) {
          setMaskedPhone(smsRes.maskedPhone || res.maskedPhone || 'your mobile');
          setStep('verify_otp');
          setCountdown(smsRes.cooldownSeconds || 30);
          setSuccessMessage(smsRes.message || 'A new verification code has been dispatched.');
        } else {
          setErrorMessage(smsRes.message || 'Failed to dispatch verification code via SMS.');
        }
      } else {
        setIsLoading(false);
        setErrorMessage('Unexpected login response. Please try again.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Failed to connect to authentication server. Please try again.');
    }
  };

  /**
   * STEP 2 (2FA): Verify 6-Digit SMS OTP Code
   */
  const handleVerify2FaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeToken) {
      setErrorMessage('Login session expired. Please sign in again.');
      setStep('enter_credentials');
      return;
    }

    const cleanOtp = otpCode.replace(/\D/g, '').trim();
    if (cleanOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyLoginSmsOtpAction(
        challengeToken,
        cleanOtp,
        redirectUrl,
        rememberMe
      );

      if (res.success) {
        setSuccessMessage(res.message);
        await refreshUser();
        setTimeout(() => {
          router.push(res.redirectTo || redirectUrl);
          router.refresh();
        }, 600);
      } else {
        setErrorMessage(res.message || 'Invalid verification code. Please re-enter.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during OTP verification.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend 2FA SMS OTP
   */
  const handleResend2FaOtp = async () => {
    if (!canResend || !challengeToken) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await sendLoginSmsOtpAction(challengeToken, countryCode, phoneNumber);
      if (res.success) {
        setCountdown(res.cooldownSeconds || 30);
        setSuccessMessage('A new verification code has been dispatched.');
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * QUICK PHONE LOGIN (Alternative Fast Path)
   */
  const handleSendQuickPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await sendPhoneOtpAction(countryCode, phoneNumber);
      if (res.success) {
        setMaskedPhone(res.maskedPhone || `${countryCode} ${phoneNumber}`);
        setStep('verify_otp');
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

  const handleVerifyQuickPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
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
        setErrorMessage(res.message || 'Invalid verification code.');
      }
    } catch {
      setErrorMessage('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (!email) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await resendVerificationEmailAction(email);
      setResendStatus(res.message || 'Verification email resent! Please check your inbox.');
    } finally {
      setIsResending(false);
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
            Customer Sign In
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sign in with verified credentials and 2-factor mobile SMS verification
          </p>
        </div>

        {/* Tab Selection (Amazon/Flipkart Style: Mobile Number First) */}
        {step === 'enter_credentials' && (
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('quick_phone');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'quick_phone'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span>Mobile OTP Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('secure_2fa');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                authMode === 'secure_2fa'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Email & Password</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span>{errorMessage}</span>
              {requiresEmailVerification && (
                <div className="pt-1.5 flex items-center gap-2">
                  <Link
                    href={`/auth/verify-email?email=${encodeURIComponent(email)}`}
                    className="font-bold underline text-indigo-700 hover:text-indigo-900"
                  >
                    Go to Email Verification Portal
                  </Link>
                  <button
                    type="button"
                    onClick={handleResendVerificationEmail}
                    disabled={isResending}
                    className="text-slate-600 hover:text-slate-900 underline"
                  >
                    {isResending ? 'Sending...' : 'Resend Email'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {resendStatus && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{resendStatus}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: ENTER CREDENTIALS (Email + Password) */}
        {/* ------------------------------------------------------------- */}
        {step === 'enter_credentials' && authMode === 'secure_2fa' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.email ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Account Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 ${
                    fieldErrors.password ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] text-rose-500">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-600 cursor-pointer">
                Remember this device for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials & Dispatches SMS...</span>
                </>
              ) : (
                <>
                  <span>Verify Credentials & Send SMS OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: DIRECT QUICK PHONE (Alternative Tab) */}
        {/* ------------------------------------------------------------- */}
        {step === 'enter_credentials' && authMode === 'quick_phone' && (
          <form onSubmit={handleSendQuickPhoneOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : (
                <>
                  <span>Request SMS Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: VERIFY 6-DIGIT SMS OTP (Matches User's UI Screenshot) */}
        {/* ------------------------------------------------------------- */}
        {step === 'verify_otp' && (
          <form
            onSubmit={authMode === 'secure_2fa' ? handleVerify2FaOtp : handleVerifyQuickPhoneOtp}
            className="space-y-5"
          >
            {/* Phone Info & Change Option */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  OTP Sent To
                </p>
                <p className="text-xs font-black text-slate-900 font-mono">
                  {maskedPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('enter_credentials');
                  setOtpCode('');
                  setErrorMessage(null);
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Change
              </button>
            </div>

            {/* OTP Entry */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                Enter 6-Digit OTP
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  required
                  autoFocus
                  className="w-full text-center py-3 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold tracking-[0.5em] text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono placeholder:tracking-normal placeholder:text-slate-300"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400 text-center">
                Sandbox Test Mode: Enter <span className="font-mono font-bold text-indigo-600">123456</span> to preview login
              </p>
            </div>

            {/* Resend Action & Limits */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={authMode === 'secure_2fa' ? handleResend2FaOtp : handleSendQuickPhoneOtp}
                disabled={!canResend || isLoading}
                className="font-bold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
              >
                {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
              </button>
              <span className="text-[11px] text-slate-400">Attempts: 5 max</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <span>Verify & Continue</span>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don&apos;t have a ShopSphere account?{' '}
            <Link
              href={`/auth/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-indigo-600 hover:text-indigo-800 ml-1"
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
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading ShopSphere secure authentication...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
