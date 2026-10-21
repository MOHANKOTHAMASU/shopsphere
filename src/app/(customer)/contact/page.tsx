'use client';

// -----------------------------------------------------------------------------
// src/app/(customer)/contact/page.tsx
// ShopSphere Help Center, Customer Support & Interactive Ticket Form
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MessageCircle,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  FileQuestion,
} from 'lucide-react';
import { submitSupportInquiryAction } from '@/lib/contact/actions';

const FAQ_ITEMS = [
  {
    question: 'How do I track my order status in real time?',
    answer:
      'You can track your package anytime by visiting our Order Tracking page (/track) and entering your Order Number (e.g., ORD-20261020-0001). We update shipping milestones instantly upon dispatch and handover to Blue Dart or Delhivery.',
  },
  {
    question: 'What is the ShopSphere 7-Day Return & Replacement policy?',
    answer:
      'We offer a 7-day hassle-free replacement or return window on all eligible electronics, fashion, and lifestyle items. If your item arrived damaged, defective, or incorrect, request a return from your Account > Orders page for doorstep inspection and free pickup.',
  },
  {
    question: 'How long do refunds take to reflect in my bank account?',
    answer:
      'For prepaid orders via Razorpay (UPI, Credit/Debit card, Netbanking), refunds are initiated instantly and credited within 3-5 business days. For Cash on Delivery (COD) orders, our team transfers the refund directly to your verified UPI ID or bank account within 48 hours of item receipt.',
  },
  {
    question: 'Are all products 100% genuine and covered by warranty?',
    answer:
      'Yes, absolutely. ShopSphere sources products directly from authorized brand distributors and OEM partners. Every product arrives with an authentic manufacturer seal and official brand warranty support across India.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We support all major payment options powered by Razorpay: UPI (Google Pay, PhonePe, Paytm), Visa, Mastercard, RuPay cards, Netbanking across 50+ banks, and Cash on Delivery (COD) for eligible pin codes.',
  },
];

export default function ContactSupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFieldErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await submitSupportInquiryAction(formData);

    setIsSubmitting(false);

    if (result.success) {
      setTicketNumber(result.ticketNumber || null);
      setSuccessMessage(result.message || 'Inquiry registered successfully!');
      form.reset();
    } else {
      setErrorMessage(result.message || 'Please fix the errors below.');
      if (result.errors) {
        setFieldErrors(result.errors);
      }
    }
  };

  return (
    <div className="py-6 space-y-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
          24/7 Customer Care & Helpdesk
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          We&rsquo;re Here to Help You
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Have an inquiry regarding your shipment, payment, or product warranty? Reach out to our
          dedicated support team via call, WhatsApp, or open a priority ticket below.
        </p>
      </div>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Phone */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Toll-Free Helpline</h3>
          <p className="text-xs text-slate-500">Instant assistance with our executives</p>
          <a
            href="tel:18002007467"
            className="text-xs font-bold text-indigo-600 hover:underline block pt-1 font-mono"
          >
            1800-200-SHOP (Toll-Free)
          </a>
        </div>

        {/* WhatsApp */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">WhatsApp Chat</h3>
          <p className="text-xs text-slate-500">Quick updates and courier queries</p>
          <a
            href="https://wa.me/919876543210?text=Hi%20ShopSphere,%20I%20need%20help%20with%20my%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-emerald-600 hover:underline block pt-1 font-mono"
          >
            +91 98765 43210 (Chat Now)
          </a>
        </div>

        {/* Email */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Email Helpdesk</h3>
          <p className="text-xs text-slate-500">Expect a response within 4 hours</p>
          <a
            href="mailto:support@shopsphere.in"
            className="text-xs font-bold text-purple-600 hover:underline block pt-1 font-mono"
          >
            support@shopsphere.in
          </a>
        </div>

        {/* Working Hours */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Operating Hours</h3>
          <p className="text-xs text-slate-500">Monday &ndash; Saturday</p>
          <span className="text-xs font-bold text-slate-800 block pt-1">
            9:00 AM &ndash; 8:00 PM IST
          </span>
        </div>
      </div>

      {/* Main Grid: Ticket Form & Help Center FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Support Ticket Submission Form (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Submit a Support Ticket</h2>
            <p className="text-xs text-slate-500">
              Provide your order details and query for rapid resolution from our customer team.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ticket Logged Successfully</span>
              </div>
              <p>{successMessage}</p>
              {ticketNumber && (
                <p className="font-mono font-bold text-emerald-900 pt-1">
                  Reference Ticket ID: {ticketNumber}
                </p>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className={`w-full h-11 px-3.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                    fieldErrors.fullName ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. customer@example.com"
                  className={`w-full h-11 px-3.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                    fieldErrors.email ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Order Number (Optional)
                </label>
                <input
                  type="text"
                  name="orderNumber"
                  placeholder="e.g. ORD-20261020-0001"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category *
                </label>
                <select
                  name="category"
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Order Tracking & Logistics">Order Tracking & Logistics</option>
                  <option value="Returns & Replacement">Returns & Replacement</option>
                  <option value="Payment & Refund Query">Payment & Refund Query</option>
                  <option value="Product & Warranty Details">Product & Warranty Details</option>
                  <option value="Other Account Assistance">Other Account Assistance</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject Headline *
              </label>
              <input
                type="text"
                name="subject"
                required
                placeholder="Brief summary of your inquiry"
                className={`w-full h-11 px-3.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white ${
                  fieldErrors.subject ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
              {fieldErrors.subject && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Detailed Message *
              </label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Describe what happened or how we can assist you..."
                className={`w-full p-3.5 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y ${
                  fieldErrors.message ? 'border-rose-300 bg-rose-50/50' : 'border-slate-300'
                }`}
              />
              {fieldErrors.message && (
                <p className="text-[11px] text-rose-600 mt-1">{fieldErrors.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Inquiry</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* FAQ Accordion (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileQuestion className="w-5 h-5 text-indigo-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-xs text-slate-500">
              Immediate answers to common questions about orders, payments, and shipping.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-bold text-slate-900">{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Office Address Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Registered Corporate Office</span>
            </div>
            <p className="text-slate-600">
              ShopSphere Marketplace India Pvt Ltd
              <br />
              Tower B, Tech Park Boulevard, Outer Ring Road
              <br />
              Bengaluru, Karnataka 560103, India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
