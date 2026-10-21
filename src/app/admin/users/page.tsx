'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  UserPlus,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { getAdminCustomersAction } from '@/lib/admin/actions';
import { CustomerSummary, AdminUserMetrics } from '@/types/ecommerce';
import { formatCurrency } from '@/lib/utils';

export default function AdminUsersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [metrics, setMetrics] = useState<AdminUserMetrics>({
    totalCustomers: 0,
    newToday: 0,
    newLast7Days: 0,
    verifiedCount: 0,
    unverifiedCount: 0,
    activeCount: 0,
    suspendedCount: 0,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = (page: number, q: string, status: string) => {
    setIsLoading(true);
    getAdminCustomersAction(q, { page, limit: 8, status }).then((res) => {
      if (res.success) {
        setCustomers(res.customers);
        setMetrics(res.metrics);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let isMounted = true;
    getAdminCustomersAction('', { page: 1, limit: 8, status: 'all' }).then((res) => {
      if (isMounted && res.success) {
        setCustomers(res.customers);
        setMetrics(res.metrics);
        setTotalPages(res.totalPages);
        setTotalCount(res.total);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers(1, searchQuery, statusFilter);
  };

  const handleStatusChange = (newStatus: 'all' | 'active' | 'suspended') => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    fetchUsers(1, searchQuery, newStatus);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchUsers(newPage, searchQuery, statusFilter);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Customer Account & User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered customer accounts, authentication verification, and access controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(currentPage, searchQuery, statusFilter)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Refresh accounts"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 p-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PII Masking Active</span>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Customers */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.totalCustomers}</p>
          <p className="text-[10px] text-slate-500">Registered marketplace accounts</p>
        </div>

        {/* New Registrations Today */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Joined Today</span>
            <UserPlus className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">+{metrics.newToday}</p>
          <p className="text-[10px] text-slate-500">New signups since 00:00 UTC</p>
        </div>

        {/* New in Last 7 Days */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Last 7 Days</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400">+{metrics.newLast7Days}</p>
          <p className="text-[10px] text-slate-500">Weekly customer acquisition</p>
        </div>

        {/* Verification Status */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verification</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{metrics.verifiedCount}</p>
          <p className="text-[10px] text-slate-500">
            {metrics.unverifiedCount} unverified / pending
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by customer name, masked email, phone, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-400 mr-1">Status:</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['all', 'active', 'suspended'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusChange(st)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Loading user directory from database...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <Users className="w-12 h-12 text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-300">No matching customer records</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or resetting filters
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold uppercase text-slate-400 bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Customer ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-3">Protected Email</th>
                  <th className="py-3.5 px-3">Phone</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">Verified</th>
                  <th className="py-3.5 px-3">Orders</th>
                  <th className="py-3.5 px-3">Total Spend</th>
                  <th className="py-3.5 px-4 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-amber-400/90 font-bold">
                      {c.id.slice(0, 16)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center uppercase">
                        {c.fullName[0] || 'C'}
                      </div>
                      <span>{c.fullName}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-400">{c.maskedEmail}</td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono">
                      {c.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          c.status === 'suspended'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      {c.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-200">{c.ordersCount}</td>
                    <td className="py-3.5 px-3 font-mono text-emerald-400 font-bold">
                      {formatCurrency(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination & Summary Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>
            Showing <span className="font-bold text-white">{customers.length}</span> of{' '}
            <span className="font-bold text-white">{totalCount}</span> customer accounts
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1 font-mono font-bold text-white bg-slate-900 border border-slate-800 rounded-lg">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Security & Audit Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-200">Zero-Trust Administrative Compliance & Audit</p>
          <p className="mt-0.5 text-slate-400">
            Customer passwords, reset tokens, full credit card numbers, and secret hashes are never stored in customer tables or exposed to the dashboard. All administrative searches and directory views are logged to <code>admin_audit_logs</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
