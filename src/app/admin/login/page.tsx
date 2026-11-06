'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { signInAction } from '@/lib/auth/actions';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'unauthorized-admin' || err === 'admin-required') {
        setError(
          'Access Denied: Administrative privileges required. Only the authorized store owner can access this console.'
        );
      }
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both your admin email and master password.');
      setIsLoading(false);
      return;
    }

    try {
      let adminEmail = cleanEmail;
      if (adminEmail === 'admin') {
        adminEmail = 'admin@shopsphere.dev';
      }

      // Restrict access strictly to authorized store owner / admin
      const authorizedEmails = ['kmvsubbarao28@gmail.com', 'admin@shopsphere.dev'];
      if (!authorizedEmails.includes(adminEmail)) {
        setError(
          'Access Denied: Only the authorized store owner (kmvsubbarao28@gmail.com) is permitted to access the ShopSphere Admin Console.'
        );
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('email', adminEmail);
      formData.append('password', cleanPassword);
      formData.append('redirect', '/admin/dashboard');
      formData.append('role', 'admin');

      const result = await signInAction(formData);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.replace(result.redirectTo || '/admin/dashboard');
        }, 300);
      } else {
        setError(result.message || 'Invalid admin credentials. Access Denied.');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top back link to customer store */}
      <div className="w-full max-w-md mb-6 flex justify-between items-center text-xs">
        <Link
          href="/"
          className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customer Store</span>
        </Link>
        <span className="text-amber-400 font-mono text-[11px] bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
          SECURE PROTOCOL v2.4
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-2 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            ShopSphere Admin Console
          </h1>
          <p className="text-xs text-slate-400">
            Authorized store staff & system administrators only.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl flex items-start gap-2 text-xs text-rose-300 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Admin credentials verified. Opening dashboard...</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
          {/* Browser autofill decoy trap to prevent Chrome/Edge pre-filling */}
          <div className="sr-only" aria-hidden="true" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}>
            <input type="text" name="chrome_decoy_user" tabIndex={-1} autoComplete="off" />
            <input type="password" name="chrome_decoy_pass" tabIndex={-1} autoComplete="new-password" />
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900/90 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Master Admin Authentication
            </span>
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                readOnly={isReadOnly}
                onFocus={() => setIsReadOnly(false)}
                name="admin_master_identity_key"
                autoComplete="off"
                data-lpignore="true"
                autoCapitalize="none"
                autoCorrect="off"
                placeholder="Enter administrator email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Master Password with Eye Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Master Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                readOnly={isReadOnly}
                onFocus={() => setIsReadOnly(false)}
                name="admin_master_secure_token"
                autoComplete="new-password"
                data-lpignore="true"
                placeholder="Enter master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Administrator Access...</span>
              </>
            ) : (
              <>
                <span>Access Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 pt-2 border-t border-slate-800">
          This system is restricted to authorized store personnel only. All access attempts are cryptographically signed and audited.
        </p>
      </div>
    </div>
  );
}
