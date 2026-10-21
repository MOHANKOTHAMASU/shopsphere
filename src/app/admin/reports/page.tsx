'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, TrendingUp, CreditCard } from 'lucide-react';
import { getAdminDashboardMetricsAction, getAdminAuditLogsAction } from '@/lib/admin/actions';
import { AdminDashboardMetrics, AdminAuditLog } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminReportsPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminDashboardMetricsAction(),
      getAdminAuditLogsAction(50),
    ]).then(([mRes, lRes]) => {
      if (mRes.success && mRes.metrics) setMetrics(mRes.metrics);
      if (lRes.success) setLogs(lRes.logs);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Aggregating business analytics & audit trails...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Sales Reports & Administrative Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Historical transaction breakdowns, revenue channels, and immutable security audit trails
        </p>
      </div>

      {/* Financial Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Revenue by Category</span>
            </h2>
            <span className="text-xs font-mono text-amber-400">
              {formatCurrency(metrics.totalRevenue)}
            </span>
          </div>

          <div className="space-y-3">
            {metrics.salesByCategory.map((cat) => {
              const pct = metrics.totalRevenue > 0
                ? Math.round((cat.sales / metrics.totalRevenue) * 100)
                : 0;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{cat.category}</span>
                    <span className="font-bold text-white">
                      {formatCurrency(cat.sales)} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales by Payment Method */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Payment Gateway Distribution</span>
          </h2>

          <div className="space-y-3">
            {metrics.salesByPaymentMethod.map((pm) => {
              const pct = metrics.totalRevenue > 0
                ? Math.round((pm.total / metrics.totalRevenue) * 100)
                : 0;

              return (
                <div key={pm.method} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-300">{pm.method}</span>
                    <span className="font-bold text-white">
                      {formatCurrency(pm.total)} ({pm.count} orders)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Admin Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">
                Immutable Administrative Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Logged operational actions, inventory mutations, and security events
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-0.5 rounded-full">
            AUDIT ACTIVE ({logs.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Administrator</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Resource</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-200">{log.adminEmail}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {log.resourceType} {log.resourceId ? `#${log.resourceId}` : ''}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
