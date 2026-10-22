'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/support/page.tsx
// ShopSphere 24/7 Customer Care, Support Ticket Desk & Help Center
// -----------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  createSupportTicketAction,
  getCustomerSupportTicketsAction,
  SupportTicket,
} from '@/lib/support/actions';

const FAQ_ITEMS = [
  {
    category: 'Orders & Tracking',
    q: 'How do I track my active order?',
    a: 'Visit our Track Order page (/track) and enter your Order Number (e.g., ORD-20261022-XXXX). You can view real-time shipping milestones from dispatch to doorstep delivery.',
  },
  {
    category: 'Returns & Replacement',
    q: 'What is the 7-Day Return & Replacement policy?',
    a: 'We offer a 7-day hassle-free replacement or return window on eligible electronics, fashion, and home products. Simply click "Request Return" on your order details page.',
  },
  {
    category: 'Payments & Refunds',
    q: 'How quickly are refunds processed?',
    a: 'Prepaid refunds (Razorpay UPI, Credit/Debit cards) are processed back to the original source in 24-48 hours. For COD orders, refund is transferred directly to your verified UPI ID.',
  },
  {
    category: 'Warranty & Authenticity',
    q: 'Are all products 100% genuine with manufacturer warranty?',
    a: 'Yes, 100%. ShopSphere sources directly from authorized Indian brand distributors. All products include original manufacturer seal and official brand warranty support.',
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'tickets' | 'faq'>('create');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Form State
  const [category, setCategory] = useState<SupportTicket['category']>('Orders & Tracking');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<SupportTicket['priority']>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);

  useEffect(() => {
    async function loadTickets() {
      setIsLoadingTickets(true);
      try {
        const res = await getCustomerSupportTicketsAction();
        if (res.success && res.tickets) {
          setTickets(res.tickets);
        }
      } finally {
        setIsLoadingTickets(false);
      }
    }
    loadTickets();
  }, [formSuccess]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormSuccess(null);
    setFormError(null);
    setTicketNumber(null);

    const formData = new FormData();
    formData.set('name', user?.user_metadata?.full_name || 'Customer');
    formData.set('email', user?.email || 'customer@shopsphere.dev');
    formData.set('category', category);
    formData.set('orderNumber', orderNumber);
    formData.set('subject', subject);
    formData.set('message', message);
    formData.set('priority', priority);

    try {
      const res = await createSupportTicketAction(formData);
      if (res.success) {
        setFormSuccess(res.message);
        setTicketNumber(res.ticketNumber || null);
        setSubject('');
        setMessage('');
        setOrderNumber('');
      } else {
        setFormError(res.message || 'Failed to submit support ticket.');
      }
    } catch {
      setFormError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 space-y-10 max-w-6xl mx-auto px-4 sm:px-6">
      {/* 24/7 Customer Care Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300">
          <LifeBuoy className="w-4 h-4 text-indigo-400" />
          <span>24/7 Dedicated Customer Support Desk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          How Can We Assist You Today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Our round-the-clock support engineers are available across India via toll-free phone, WhatsApp,
          and ticket support with an average response time of under 15 minutes.
        </p>

        {/* 3 Quick Contact Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Toll-Free Helpline</span>
              <p className="text-xs font-black text-white">1800-123-7743</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">WhatsApp Support</span>
              <p className="text-xs font-black text-white">+91 98765 43210</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Email Helpdesk</span>
              <p className="text-xs font-black text-white">support@shopsphere.dev</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Create Support Ticket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>My Support Tickets</span>
          {tickets.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
              {tickets.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`pb-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'faq'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Frequently Asked Questions
        </button>
      </div>

      {/* TAB 1: CREATE SUPPORT TICKET */}
      {activeTab === 'create' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>Submit a Priority Support Inquiry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide details about your query. A unique ticket ID will be generated for tracking.
            </p>
          </div>

          {formSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
              {ticketNumber && (
                <p className="text-xs text-emerald-700">
                  Your tracking number is <strong className="font-mono">{ticketNumber}</strong>. You can
                  view live agent updates in the &ldquo;My Support Tickets&rdquo; tab.
                </p>
              )}
            </div>
          )}

          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Issue Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="Orders & Tracking">Orders & Package Tracking</option>
                  <option value="Returns & Refunds">Returns & Refund Status</option>
                  <option value="Payment Issues">Payment & UPI Verification</option>
                  <option value="Product & Warranty">Product Quality & Warranty</option>
                  <option value="General Inquiry">General Account Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Order Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-20261022-0001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject / Summary <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your inquiry"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Urgency Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="normal">Normal (Response within 25 mins)</option>
                  <option value="high">High Priority (Response within 15 mins)</option>
                  <option value="urgent">Urgent / Delivery Issue (Response within 10 mins)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Message <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="Please describe the issue or inquiry in detail so our support agents can assist you promptly..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? <span>Submitting Ticket...</span> : <span>Submit Support Request</span>}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: MY SUPPORT TICKETS */}
      {activeTab === 'tickets' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Your Support History</h2>

          {isLoadingTickets ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading your tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No support tickets found</p>
              <p className="text-xs text-slate-400">
                You have not submitted any inquiries yet. Need help? Use the Create Ticket tab.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map((tkt) => (
                <div key={tkt.id} className="py-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                        {tkt.ticketNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{tkt.subject}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        tkt.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tkt.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{tkt.message}</p>

                  {tkt.agentNotes && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                      <strong className="text-indigo-700">Support Desk Response:</strong>{' '}
                      {tkt.agentNotes}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Category: {tkt.category}</span>
                    <span>Expected response: {tkt.responseEstimate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FAQ ACCORDION */}
      {activeTab === 'faq' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Help Center & FAQs</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
