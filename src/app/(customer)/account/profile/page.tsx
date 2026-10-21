'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/account/profile/page.tsx
// Customer Profile Editing, Contact Details & Security Settings
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  KeyRound,
  ShieldCheck,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateProfileAction, updatePasswordAction } from '@/lib/auth/actions';

export default function ProfileSettingsPage() {
  const { user, profile, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(
    profile?.full_name || user?.user_metadata?.full_name || ''
  );
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    setProfileFeedback(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfileAction(formData);

    setIsLoadingProfile(false);

    if (result.success) {
      setProfileFeedback({
        type: 'success',
        message: result.message || 'Profile information updated successfully!',
      });
      await refreshUser();
    } else {
      setProfileFeedback({
        type: 'error',
        message: result.message || 'Failed to update profile.',
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'Password confirmation does not match.',
      });
      return;
    }

    setIsLoadingPassword(true);
    const formData = new FormData(e.currentTarget);
    const result = await updatePasswordAction(formData);
    setIsLoadingPassword(false);

    if (result.success) {
      setPasswordFeedback({
        type: 'success',
        message: result.message || 'Password updated successfully!',
      });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordFeedback({
        type: 'error',
        message: result.message || 'Failed to update password.',
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Personal Information Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Personal Profile Settings</h1>
            <p className="text-xs text-slate-500">
              Update your public name and mobile contact number for express delivery updates
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Profile
          </span>
        </div>

        {/* Profile Feedback Alert */}
        {profileFeedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              profileFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {profileFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{profileFeedback.message}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Used for OTP and courier tracking SMS</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Verified Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                disabled
                value={user?.email || 'customer@shopsphere.in'}
                className="w-full h-11 pl-10 pr-4 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 font-mono cursor-not-allowed select-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Primary login identifier bound to your authenticated account.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoadingProfile}
            className="py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoadingProfile ? (
              <span>Saving changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 2. Security & Password Update Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>Security & Password</span>
          </h2>
          <p className="text-xs text-slate-500">
            Ensure your account is protected with a strong, distinct password
          </p>
        </div>

        {/* Password Feedback Alert */}
        {passwordFeedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {passwordFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                name="newPassword"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full h-11 pl-10 pr-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingPassword}
            className="py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoadingPassword ? (
              <span>Updating password...</span>
            ) : (
              <>
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 3. Address Book Quick Card */}
      <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>Saved Delivery Addresses</span>
          </div>
          <p className="text-xs text-slate-500">
            Manage your home, office, and express delivery addresses in your personal address book
          </p>
        </div>

        <Link
          href="/account/addresses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-xs shrink-0"
        >
          <span>Manage Address Book</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
