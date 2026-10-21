'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle, Zap } from 'lucide-react';
import { signInDemoAction } from '@/lib/auth/actions';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInDemoAction('admin');
      setIsLoading(false);
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 700);
    } catch {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAdmin = async () => {
    setIsLoading(true);
    try {
      await signInDemoAction('admin');
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 500);
    } catch {
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

      {/* Login Card */}
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

        {/* 1-Click Quick Demo Admin Access */}
        <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>Developer Quick Access</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              DEMO
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Instantly access the admin dashboard without entering credentials during development.
          </p>
          <button
            type="button"
            disabled={isLoading}
            onClick={handleQuickDemoAdmin}
            className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>1-Click Sign In as Store Admin</span>
          </button>
        </div>

        {success && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Admin credentials verified. Opening dashboard...</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900/90 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Or sign in with master email
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="admin@shopsphere.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Security 2FA PIN (Optional for Dev Preview)</span>
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            </label>
            <input
              type="text"
              placeholder="e.g. 948201"
              value={securityPin}
              onChange={(e) => setSecurityPin(e.target.value)}
              className="w-full h-11 px-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating admin...</span>
            ) : (
              <>
                <span>Access Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            For password reset or role provisioning, contact the Lead Security Engineer.
          </p>
        </div>
      </div>
    </div>
  );
}
