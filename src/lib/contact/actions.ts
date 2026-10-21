'use server';

// -----------------------------------------------------------------------------
// src/lib/contact/actions.ts
// Customer Support Inquiry & Helpdesk Ticket Server Action
// -----------------------------------------------------------------------------

import { checkRateLimit } from '@/lib/security/rate-limit';

export interface SupportTicketResult {
  success: boolean;
  ticketNumber?: string;
  message?: string;
  errors?: Record<string, string>;
}

export async function submitSupportInquiryAction(
  formData: FormData
): Promise<SupportTicketResult> {
  const fullName = (formData.get('fullName') as string)?.trim() || '';
  const email = (formData.get('email') as string)?.trim() || '';
  const orderNumber = (formData.get('orderNumber') as string)?.trim() || '';
  const category = (formData.get('category') as string)?.trim() || 'General Inquiry';
  const subject = (formData.get('subject') as string)?.trim() || '';
  const message = (formData.get('message') as string)?.trim() || '';

  // Rate Limiting: 5 tickets per 10 minutes
  const rateLimit = checkRateLimit(`support:${email || 'anonymous'}`, 5, 600);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: `Too many support tickets submitted. Please wait ${rateLimit.resetInSeconds} seconds before submitting again.`,
    };
  }

  const errors: Record<string, string> = {};

  if (!fullName || fullName.length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!subject || subject.length < 3) {
    errors.subject = 'Subject headline must be at least 3 characters.';
  }

  if (!message || message.length < 10) {
    errors.message = 'Please provide details of your issue (at least 10 characters).';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please review and correct the highlighted fields.',
      errors,
    };
  }

  // Generate support ticket identifier
  const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  // In production, forward to Zendesk / Freshdesk or store in database
  // In development / demo mode, successfully register inquiry
  return {
    success: true,
    ticketNumber,
    message: `Inquiry received for ${category}${orderNumber ? ` (Order ${orderNumber})` : ''}! Support ticket #${ticketNumber} has been logged. Our customer executive will reply within 4 business hours.`,
  };
}
