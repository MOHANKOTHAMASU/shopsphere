import React from 'react';
import { Database } from 'lucide-react';

export function SeedDataNotice() {
  return (
    <aside aria-label="Development environment notice" className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-indigo-100 py-1.5 px-4 text-xs border-b border-indigo-800/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-white tracking-wide uppercase text-[11px] bg-indigo-800/80 px-2 py-0.5 rounded">
            Phase 1 Preview
          </span>
          <span className="hidden sm:inline text-indigo-200">
            Showcasing responsive layouts & UI components with development seed products.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-indigo-300">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Supabase Schema & Migrations Ready for Phase 2</span>
        </div>
      </div>
    </aside>
  );
}
