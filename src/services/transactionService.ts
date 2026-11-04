import { getSupabaseClient } from '../lib/supabase';
import type {
  TransactionDTO,
  TransactionItemDTO,
  TransactionStatus,
  CreateTransactionPayload,
  PaymentSettings,
  ServiceResult,
} from '../types/database';

const STATUSES: TransactionStatus[] = [
  'unpaid',
  'awaiting_verification',
  'processing',
  'ready',
  'completed',
  'cancelled',
  'rejected',
  'expired',
];

const KNOWN_RPC_ERRORS = [
  'AUTH_REQUIRED',
  'INVALID_ITEMS',
  'INVALID_FULFILLMENT',
  'INVALID_ADDRESS',
  'INVALID_CONTACT',
  'INVALID_EVENT',
  'EVENT_PASSED',
  'UNKNOWN_PRODUCT',
  'STOCK_INSUFFICIENT',
  'QTY_LIMIT',
  'TOO_MANY_OPEN_ORDERS',
  'ORDER_COOLDOWN',
  'GATEWAY_NOT_READY',
  'ORDER_NOT_FOUND',
  'ORDER_EXPIRED',
  'INVALID_STATE',
  'FORBIDDEN',
  'REFERENCE_REQUIRED',
  'REASON_REQUIRED',
  'INVALID_TRANSITION',
  'PICKUP_CODE_MISMATCH',
  'AMOUNT_CONFLICT',
  'INVALID_SETTINGS',
];

export function rpcErrorCode(message: string | undefined): string {
  const found = KNOWN_RPC_ERRORS.find((code) => message?.includes(code));
  return found || 'UNKNOWN';
}

export function normalizeTransaction(raw: any): TransactionDTO {
  const status: TransactionStatus = STATUSES.includes(raw.status) ? raw.status : 'unpaid';

  const rawItems: TransactionItemDTO[] = Array.isArray(raw.transaction_items)
    ? raw.transaction_items.map((it: any, idx: number) => ({
        id: it.id || `item-${idx}`,
        name: it.name || 'Official Merchandise',
        variant: it.variant || 'Official Merchandise',
        image: it.image || '/images/members/faril.webp',
        quantity: it.quantity || 1,
        price: Number(it.price) || 0,
      }))
    : [];

  return {
    id: String(raw.id),
    orderCode: raw.order_code || raw.id,
    date: new Date(raw.created_at || Date.now()).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    status,
    statusLabel: raw.status_label || status,
    eventTag: raw.event_tag || 'OFFICIAL STORE',
    items: rawItems,
    deliveryInfo: raw.delivery_info || '',
    subtotal: Number(raw.subtotal) || 0,
    shippingFee: Number(raw.shipping_fee) || 0,
    platformFee: Number(raw.platform_fee) || 0,
    totalPrice: Number(raw.total_price) || 0,
    payableAmount: Number(raw.payable_amount ?? raw.total_price) || 0,
    uniqueCode: Number(raw.unique_code) || 0,
    paymentDeadline: raw.payment_deadline || undefined,
    rejectReason: raw.reject_reason || undefined,
    actionType: raw.action_type || 'none',
    fulfillmentMethod: raw.fulfillment_method === 'pickup' ? 'pickup' : 'delivery',
    pickupLocation: raw.pickup_location || undefined,
    pickupDate: raw.pickup_date || undefined,
    pickupCode: raw.pickup_code || undefined,
    pickupContactName: raw.pickup_contact_name || undefined,
    pickupContactPhone: raw.pickup_contact_phone || undefined,
    trackingNumber: raw.tracking_number || undefined,
    stepper: Array.isArray(raw.stepper) ? raw.stepper : [],
    isStepperExpanded: status === 'unpaid' || status === 'awaiting_verification',
  };
}

export const transactionService = {
  async getTransactions(): Promise<ServiceResult<TransactionDTO[]>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: true, data: [] };

    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return { success: true, data: [] };

    await sb.rpc('expire_stale_orders');
    const { data, error } = await sb
      .from('transactions')
      .select('*, transaction_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getTransactions failed:', error.message);
      return { success: false, error: 'UNKNOWN' };
    }
    return { success: true, data: (data || []).map(normalizeTransaction) };
  },

  async getTransaction(orderId: string): Promise<ServiceResult<TransactionDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    await sb.rpc('expire_stale_orders');
    const { data, error } = await sb
      .from('transactions')
      .select('*, transaction_items(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (error || !data) return { success: false, error: 'ORDER_NOT_FOUND' };
    return { success: true, data: normalizeTransaction(data) };
  },

  async getLatestOpenTransaction(): Promise<ServiceResult<TransactionDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    await sb.rpc('expire_stale_orders');
    const { data, error } = await sb
      .from('transactions')
      .select('*, transaction_items(*)')
      .in('status', ['unpaid', 'awaiting_verification'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return { success: false, error: 'ORDER_NOT_FOUND' };
    return { success: true, data: normalizeTransaction(data) };
  },

  async getPaymentSettings(): Promise<PaymentSettings> {
    const fallback: PaymentSettings = { qrisImageUrl: '', gatewayEnabled: false };
    const sb = getSupabaseClient();
    if (!sb) return fallback;

    const { data } = await sb
      .from('app_settings')
      .select('key, value')
      .in('key', ['qris_image_url', 'payment_gateway_enabled']);

    const byKey = new Map((data || []).map((row: any) => [row.key, row.value]));
    return {
      qrisImageUrl: String(byKey.get('qris_image_url') ?? ''),
      gatewayEnabled: byKey.get('payment_gateway_enabled') === true,
    };
  },

  async createTransaction(
    payload: CreateTransactionPayload
  ): Promise<ServiceResult<TransactionDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData.session) return { success: false, error: 'AUTH_REQUIRED' };

    const { fulfillment, address } = payload;
    const { data, error } = await sb.rpc('create_order', {
      p_items: payload.items,
      p_fulfillment: {
        method: fulfillment.method,
        pickupEventId: fulfillment.pickupEventId,
        pickupContactName: fulfillment.pickupContactName,
        pickupContactPhone: fulfillment.pickupContactPhone,
      },
      p_address: address || null,
      p_notes: payload.notes || null,
    });

    if (error || !data) return { success: false, error: rpcErrorCode(error?.message) };
    return { success: true, data: normalizeTransaction(data) };
  },

  async claimPayment(orderId: string): Promise<ServiceResult<TransactionDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    const { data, error } = await sb.rpc('claim_payment', { p_order_id: orderId });
    if (error || !data) return { success: false, error: rpcErrorCode(error?.message) };
    return { success: true, data: normalizeTransaction(data) };
  },

  async cancelOrder(orderId: string): Promise<ServiceResult<TransactionDTO>> {
    const sb = getSupabaseClient();
    if (!sb) return { success: false, error: 'UNAVAILABLE' };

    const { data, error } = await sb.rpc('cancel_order', { p_order_id: orderId });
    if (error || !data) return { success: false, error: rpcErrorCode(error?.message) };
    return { success: true, data: normalizeTransaction(data) };
  },
};
