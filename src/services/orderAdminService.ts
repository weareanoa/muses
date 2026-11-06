import { getSupabaseClient } from '../lib/supabase';
import { normalizeTransaction, rpcErrorCode } from './transactionService';
import type { ServiceResult, TransactionDTO } from '../types/database';

export interface AdminOrderDTO extends TransactionDTO {
  createdAt: string;
  updatedAt?: string;
  paidAt?: string;
  proofSubmittedAt?: string;
  paymentReference?: string;
  adminNote?: string;
  customerName: string;
  customerEmail: string;
  contactName: string;
  contactPhone: string;
  shippingAddress?: {
    recipientName: string;
    phone: string;
    street: string;
    district?: string;
    city: string;
    province: string;
    postalCode: string;
    detail?: string;
  };
}

export interface OrderEventDTO {
  id: number;
  event: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  actorRole: string;
  createdAt: string;
}

function normalizeAdminOrder(raw: any): AdminOrderDTO {
  const base = normalizeTransaction(raw);
  const profile = raw.profiles || {};
  const address = raw.shipping_address || undefined;
  return {
    ...base,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at || undefined,
    paidAt: raw.paid_at || undefined,
    proofSubmittedAt: raw.proof_submitted_at || undefined,
    paymentReference: raw.payment_reference || undefined,
    adminNote: raw.admin_note || undefined,
    customerName: profile.name || '-',
    customerEmail: profile.email || '',
    contactName: raw.pickup_contact_name || address?.recipientName || profile.name || '-',
    contactPhone: raw.pickup_contact_phone || address?.phone || profile.phone || '',
    shippingAddress: address,
  };
}

async function callRpc(
  fn: string,
  args: Record<string, unknown>
): Promise<ServiceResult<true>> {
  const sb = getSupabaseClient();
  if (!sb) return { success: false, error: 'UNAVAILABLE' };
  const { error } = await sb.rpc(fn, args);
  if (error) return { success: false, error: rpcErrorCode(error.message) };
  return { success: true, data: true };
}

export const orderAdminService = {
  async listOrders(limit = 300): Promise<ServiceResult<AdminOrderDTO[]>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    try {
      void sb.rpc('expire_stale_orders');
    } catch {}

    const { data, error } = await sb
      .from('transactions')
      .select('*, transaction_items(*), order_reviews(*), profiles:profiles!transactions_user_id_fkey(name, email, phone)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[orderAdminService.listOrders] Error fetching transactions:', error);
      return { success: false, error: error.message || 'UNKNOWN' };
    }
    return { success: true, data: (data || []).map(normalizeAdminOrder) };
  },

  async listEvents(orderId: string): Promise<ServiceResult<OrderEventDTO[]>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    const { data, error } = await sb
      .from('order_events')
      .select('*')
      .eq('transaction_id', orderId)
      .order('created_at', { ascending: true });

    if (error) return { success: false, error: 'UNKNOWN' };
    return {
      success: true,
      data: (data || []).map((row: any) => ({
        id: row.id,
        event: row.event,
        fromStatus: row.from_status || undefined,
        toStatus: row.to_status || undefined,
        note: row.note || undefined,
        actorRole: row.actor_role,
        createdAt: row.created_at,
      })),
    };
  },

  verifyPayment(orderId: string, reference: string) {
    return callRpc('admin_verify_payment', { p_order_id: orderId, p_reference: reference });
  },

  rejectPayment(orderId: string, reason: string, allowRetry: boolean) {
    return callRpc('admin_reject_payment', {
      p_order_id: orderId,
      p_reason: reason,
      p_allow_retry: allowRetry,
    });
  },

  advanceOrder(
    orderId: string,
    to: 'ready' | 'completed',
    opts: { note?: string; tracking?: string; pickupCode?: string } = {}
  ) {
    return callRpc('admin_advance_order', {
      p_order_id: orderId,
      p_to: to,
      p_note: opts.note || null,
      p_tracking: opts.tracking || null,
      p_pickup_code: opts.pickupCode || null,
    });
  },

  cancelOrder(orderId: string, reason: string) {
    return callRpc('admin_cancel_order', { p_order_id: orderId, p_reason: reason });
  },

  reopenOrder(orderId: string, reason: string) {
    return callRpc('admin_reopen_order', { p_order_id: orderId, p_reason: reason });
  },
};
