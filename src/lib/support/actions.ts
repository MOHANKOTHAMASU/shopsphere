'use server';

// -----------------------------------------------------------------------------
// src/lib/support/actions.ts
// ShopSphere 24/7 Customer Support Ticket & Helpdesk Actions
// -----------------------------------------------------------------------------

import { getDemoUserAction } from '@/lib/auth/actions';

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  category: 'Orders & Tracking' | 'Returns & Refunds' | 'Payment Issues' | 'Product & Warranty' | 'General Inquiry';
  orderNumber?: string;
  subject: string;
  message: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  responseEstimate: string;
  agentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory support tickets store
const memoryTickets: SupportTicket[] = [
  {
    id: 'tkt-001',
    ticketNumber: 'TKT-20261020-8472',
    userId: 'usr-demo-customer',
    customerName: 'Rahul Sharma',
    customerEmail: 'customer@shopsphere.dev',
    customerPhone: '+91 98765 43210',
    category: 'Orders & Tracking',
    orderNumber: 'ORD-20261018-001',
    subject: 'Request for scheduled evening delivery',
    message: 'Please arrange courier delivery after 6 PM as I am at work during the day.',
    priority: 'normal',
    status: 'in_progress',
    responseEstimate: 'Within 15 minutes',
    agentNotes: 'Blue Dart courier team informed to schedule delivery between 6 PM - 8 PM.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

/**
 * Submit a customer support ticket
 */
export async function createSupportTicketAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
  ticketNumber?: string;
  ticket?: SupportTicket;
  errors?: Record<string, string>;
}> {
  const user = await getDemoUserAction();

  const name = ((formData.get('name') as string) || user?.full_name || '').trim();
  const email = ((formData.get('email') as string) || user?.email || '').trim().toLowerCase();
  const phone = ((formData.get('phone') as string) || user?.phone || '').trim();
  const category = (formData.get('category') as SupportTicket['category']) || 'General Inquiry';
  const orderNumber = ((formData.get('orderNumber') as string) || '').trim();
  const subject = ((formData.get('subject') as string) || '').trim();
  const message = ((formData.get('message') as string) || '').trim();
  const priority = (formData.get('priority') as SupportTicket['priority']) || 'normal';

  const errors: Record<string, string> = {};

  if (!name || name.length < 2) {
    errors.name = 'Please enter your name.';
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!subject || subject.length < 5) {
    errors.subject = 'Please enter a descriptive subject (at least 5 characters).';
  }

  if (!message || message.length < 15) {
    errors.message = 'Please describe your inquiry in detail (at least 15 characters).';
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please resolve the highlighted errors.',
      errors,
    };
  }

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
  const ticketNumber = `TKT-${dateStr}-${randomSuffix}`;

  const newTicket: SupportTicket = {
    id: `tkt-${Date.now()}`,
    ticketNumber,
    userId: user?.id,
    customerName: name,
    customerEmail: email,
    customerPhone: phone || undefined,
    category,
    orderNumber: orderNumber || undefined,
    subject,
    message,
    priority,
    status: 'open',
    responseEstimate: priority === 'urgent' ? 'Within 10 minutes' : 'Within 25 minutes',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryTickets.unshift(newTicket);

  return {
    success: true,
    message: `Support ticket ${ticketNumber} created successfully! Our 24/7 support desk will respond shortly.`,
    ticketNumber,
    ticket: newTicket,
  };
}

/**
 * Retrieve support tickets submitted by the authenticated customer
 */
export async function getCustomerSupportTicketsAction(): Promise<{
  success: boolean;
  tickets: SupportTicket[];
}> {
  const user = await getDemoUserAction();
  if (!user) {
    return { success: true, tickets: [] };
  }

  const userTickets = memoryTickets.filter(
    (t) => t.userId === user.id || t.customerEmail.toLowerCase() === user.email.toLowerCase()
  );

  return {
    success: true,
    tickets: userTickets,
  };
}
