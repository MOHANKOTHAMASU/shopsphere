'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  requestPasswordResetOtpAction,
  verifyOtpAndResetPasswordAction,
} from '@/lib/auth/actions';

export default function ForgotPasswordPage() {
  const router = useRouter();

  // Step state: 1 = Enter Email, 2 = Enter OTP + New Password
  const [step, setStep] = useState<1 | 2>(1);

  // Form fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.set('email', email);

    const result = await requestPasswordResetOtpAction(formData);

    setIsLoading(false);
    if (result.success) {
      if (result.otp) {
        setGeneratedOtp(result.otp);
      }
      setFeedback({
        type: 'success',
        message:
          result.message ||
          'A 6-digit verification code has been dispatched. Enter it below with your new password.',
      });
      setStep(2);
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Failed to dispatch verification code. Please try again.',
      });
    }
  };

  // Step 2: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.set('email', email);
    formData.set('otp', otp);
    formData.set('password', password);
    formData.set('confirmPassword', confirmPassword);

    const result = await verifyOtpAndResetPasswordAction(formData);

    setIsLoading(false);
    if (result.success) {
      setFeedback({
        type: 'success',
        message: result.message || 'Your password has been successfully reset! Redirecting to login...',
      });
      setTimeout(() => {
        router.push(result.redirectTo || '/auth/login');
      }, 1500);
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Failed to update password. Please verify the code and requirements.',
      });
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.set('email', email);

    const result = await requestPasswordResetOtpAction(formData);
    setIsLoading(false);

    if (result.success) {
      if (result.otp) {
        setGeneratedOtp(result.otp);
      }
      setFeedback({
        type: 'info',
        message: `New verification code generated! ${result.otp ? `Code: ${result.otp}` : 'Check your inbox.'}`,
      });
    } else {
      setFeedback({
        type: 'error',
        message: result.message || 'Failed to generate new code.',
      });
    }
  };

  return (
    <div className="py-8 sm:py-16 flex justify-center px-4">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center shadow-inner mb-1">
            {step === 1 ? <KeyRound className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 1 ? 'Reset Your Password' : 'Enter Verification Code'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {step === 1
              ? 'Enter your registered email address to receive a 6-digit OTP verification code.'
              : `Enter the 6-digit OTP sent to ${email} and choose your new password.`}
          </p>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : feedback.type === 'info'
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : feedback.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Development / Testing OTP Banner */}
        {generatedOtp && step === 2 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Active Verification Code (OTP)
              </span>
              <span className="text-[10px] bg-amber-200/80 px-2 py-0.5 rounded-full font-mono">
                Valid 10 mins
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-2xl font-black font-mono tracking-widest text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-amber-300">
                {generatedOtp}
              </span>
              <button
                type="button"
                onClick={() => setOtp(generatedOtp)}
                className="text-xs font-bold text-amber-800 bg-amber-200 hover:bg-amber-300 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Auto-Fill Code
              </button>
            </div>
            <p className="text-[11px] text-amber-700 leading-tight">
              Provided directly for seamless testing and when external email delivery is delayed by provider limits.
            </p>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Email
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
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Generating OTP...</span>
              ) : (
                <>
                  <span>Send Verification Code (OTP)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  Change Email
                </button>
              </div>
              <input
                type="text"
                name="otp"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full h-12 text-center font-mono text-lg font-bold tracking-widest bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  minLength={8}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <span>Resetting password...</span>
              ) : (
                <>
                  <span>Save New Password & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Didn&apos;t receive code? Resend OTP</span>
              </button>
            </div>
          </form>
        )}

        {/* Back Link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
