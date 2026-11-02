import { getSupabaseClient } from '../lib/supabase';
import { INITIAL_ORDERS } from '../data/orders';
import { formatRupiah } from '../lib/format';
import { productService } from './productService';
import type {
  TransactionDTO,
  TransactionItemDTO,
  CreateTransactionPayload,
  PaymentOrderSummary,
  ServiceResult,
} from '../types/database';

const DEFAULT_PAYMENT_SUMMARY: PaymentOrderSummary = {
  orderId: 'INV-20261021-0042',
  items: [
    {
      id: 'item-faril',
      name: 'Faril',
      subtitle: 'Muse of Melpomene',
      quantity: 1,
      price: 80000,
    },
    {
      id: 'item-mine',
      name: 'Mine',
      subtitle: 'Muse of Terpsichore',
      quantity: 1,
      price: 80000,
    },
  ],
  subtotal: 160000,
  shippingFee: 10000,
  platformFee: 5000,
  total: 175000,
  deadline: '23:59:59',
};

function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

function generatePickupCode(): string {
  return `PKP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function normalizeTransaction(raw: any): TransactionDTO {
  const numericTotal =
    typeof raw.totalPrice === 'number'
      ? raw.totalPrice
      : typeof raw.total_price === 'number'
      ? raw.total_price
      : typeof raw.numericPrice === 'number'
      ? raw.numericPrice
      : typeof raw.total === 'number'
      ? raw.total
      : parseInt(String(raw.price || raw.totalPrice || raw.numericPrice || '0').replace(/\D/g, ''), 10) || 0;

  const rawStatus = String(raw.status || 'unpaid').toLowerCase();
  let status: TransactionDTO['status'] = 'unpaid';
  if (rawStatus === 'paid' || rawStatus === 'processing') {
    status = 'processing';
  } else if (rawStatus === 'completed') {
    status = 'completed';
  } else if (rawStatus === 'cancelled') {
    status = 'cancelled';
  }

  const rawActionType =
    raw.actionType ||
    raw.action_type ||
    (status === 'unpaid'
      ? 'unpaid'
      : status === 'completed'
      ? 'completed'
      : raw.pickupCode || raw.pickup_code
      ? 'pickup'
      : 'shipping');

  const rawItemsSource = raw.items || raw.transaction_items;
  const rawItems: TransactionItemDTO[] = Array.isArray(rawItemsSource)
    ? rawItemsSource.map((it: any, idx: number) => {
        const itemPrice =
          typeof it.price === 'number'
            ? it.price
            : parseInt(String(it.price || '0').replace(/\D/g, ''), 10) || 0;
        return {
          id: it.id || `item-${idx}`,
          name: it.name || 'Official Merchandise',
          variant: it.variant || it.role || it.subtitle || 'Official Merchandise',
          image: it.image || '/images/members/faril.webp',
          quantity: it.quantity || it.qty || 1,
          price: itemPrice,
        };
      })
    : [];

  return {
    id: String(raw.id || raw.order_code || raw.orderCode || `MSE-${Date.now().toString().slice(-6)}`),
    orderCode: raw.order_code || raw.orderCode || raw.id,
    date:
      raw.date ||
      (raw.created_at
        ? new Date(raw.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })),
    status,
    statusLabel:
      raw.statusLabel ||
      raw.status_label ||
      (status === 'unpaid' ? 'Menunggu pembayaran' : status === 'completed' ? 'Selesai' : 'Sedang diproses'),
    eventTag: raw.eventTag || raw.event_tag || 'OFFICIAL STORE',
    items:
      rawItems.length > 0
        ? rawItems
        : [
            {
              name: raw.title || 'Official Merchandise',
              variant: 'Standard',
              image: '/images/members/faril.webp',
              quantity: 1,
              price: numericTotal,
            },
          ],
    deliveryInfo: raw.deliveryInfo || raw.delivery_info || raw.location || 'Pengiriman Kurir JNE Regular',
    totalPrice: numericTotal,
    actionType: rawActionType,
    initialCountdownSeconds:
      typeof raw.initialCountdownSeconds === 'number' ? raw.initialCountdownSeconds : 180,
    pickupLocation: raw.pickupLocation || raw.pickup_location || raw.location,
    pickupDate: raw.pickupDate || raw.pickup_date,
    pickupCode: raw.pickupCode || raw.pickup_code,
    shippingCourier: raw.shippingCourier || raw.shipping_courier || 'JNE Regular',
    trackingNumber: raw.trackingNumber || raw.tracking_number || 'JNE8829104829',
    estimatedArrival: raw.estimatedArrival || raw.estimated_arrival || '2 - 3 hari kerja',
    stepper:
      Array.isArray(raw.stepper) && raw.stepper.length > 0
        ? raw.stepper
        : raw.pickup_code || raw.pickupCode
          ? [
              { label: 'Dibayar', completed: status !== 'unpaid' },
              { label: 'Disiapkan Management', completed: status === 'processing' || status === 'completed' },
              { label: 'Diambil di Event', completed: status === 'completed' },
              { label: 'Selesai', completed: status === 'completed' },
            ]
          : [
              { label: 'Dibayar', completed: status !== 'unpaid' },
              { label: 'Disiapkan Management', completed: status === 'processing' || status === 'completed' },
              { label: 'Dalam Pengiriman (JNE)', completed: status === 'processing' || status === 'completed' },
              { label: 'Selesai', completed: status === 'completed' },
            ],
    isStepperExpanded: Boolean(raw.isStepperExpanded),
  };
}

export const transactionService = {
  getInitialTransactions(): TransactionDTO[] {
    return INITIAL_ORDERS;
  },

  getDefaultPaymentOrder(): PaymentOrderSummary {
    return DEFAULT_PAYMENT_SUMMARY;
  },

  getActivePaymentOrder(): PaymentOrderSummary {
    if (typeof window === 'undefined') return DEFAULT_PAYMENT_SUMMARY;
    try {
      const stored =
        sessionStorage.getItem('muse_active_payment') ||
        localStorage.getItem('muse_active_payment');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          return {
            orderId: parsed.orderId || DEFAULT_PAYMENT_SUMMARY.orderId,
            items:
              parsed.items && parsed.items.length > 0
                ? parsed.items.map((i: any, idx: number) => ({
                    id: i.id || `item-${idx}`,
                    name: i.name || 'Member Cheki',
                    subtitle: i.subtitle || 'Official Merch',
                    quantity: i.quantity || 1,
                    price: i.price || 80000,
                  }))
                : DEFAULT_PAYMENT_SUMMARY.items,
            subtotal: parsed.subtotalRupiah ?? parsed.subtotal ?? DEFAULT_PAYMENT_SUMMARY.subtotal,
            shippingFee: parsed.shippingFee ?? DEFAULT_PAYMENT_SUMMARY.shippingFee,
            platformFee: parsed.platformFee ?? DEFAULT_PAYMENT_SUMMARY.platformFee,
            total: parsed.totalRupiah ?? parsed.total ?? DEFAULT_PAYMENT_SUMMARY.total,
            deadline: parsed.deadline || '23:59:59',
            address: parsed.address || undefined,
            fulfillment: parsed.fulfillment || undefined,
          };
        }
      }
    } catch (e) {
      console.error('Failed to read active payment order', e);
    }
    return DEFAULT_PAYMENT_SUMMARY;
  },

  async getTransactions(userId?: string): Promise<ServiceResult<TransactionDTO[]>> {
    const sb = getSupabaseClient();
    if (sb) {
      try {
        let query = sb
          .from('transactions')
          .select('*, transaction_items(*)')
          .order('created_at', { ascending: false });

        if (userId && !userId.startsWith('user_') && !userId.startsWith('muses_')) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return { success: true, data: data.map(normalizeTransaction) };
        }
      } catch (err) {
        console.error('Failed to fetch transactions from Supabase, using local fallback:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('muses_user_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalized = parsed
              .map((item) => {
                try {
                  return normalizeTransaction(item);
                } catch {
                  return null;
                }
              })
              .filter(Boolean) as TransactionDTO[];
            return { success: true, data: [...normalized, ...INITIAL_ORDERS] };
          }
        }
      } catch {}
    }

    return { success: true, data: INITIAL_ORDERS };
  },

  async createTransaction(
    payload: CreateTransactionPayload
  ): Promise<ServiceResult<{ orderId: string; transaction: TransactionDTO }>> {
    const method = payload.fulfillment?.method === 'pickup' ? 'pickup' : 'delivery';

    // Hitung ulang dari katalog (satu-satunya sumber harga & stok yang sah).
    // Angka dari client hanya dipakai kalau produknya tidak ada di katalog
    // (item demo / fallback), jadi mengubah total di browser tidak berpengaruh.
    let catalog: { id: string; name: string; price: number; stock: number }[] = [];
    try {
      const res = await productService.getCatalogItems();
      if (res.success && res.data) catalog = res.data;
    } catch {}
    if (catalog.length === 0) catalog = productService.getInitialCatalogItems();

    const findCatalog = (item: { id: string; name: string }) => {
      const byId = catalog.find((c) => c.id === item.id);
      if (byId) return byId;
      const bareName = item.name.replace(/^(Cheki|Videocall)\s+/i, '').trim().toLowerCase();
      return catalog.find((c) => c.name.toLowerCase() === bareName);
    };

    const pricedItems: (typeof payload.items[number] & { stock: number })[] = [];
    for (const i of payload.items) {
      const match = findCatalog(i);
      if (!match) {
        return { success: false, error: 'UNKNOWN_PRODUCT' };
      }
      pricedItems.push({ ...i, price: match.price, stock: match.stock });
    }
    if (pricedItems.some((i) => i.quantity > i.stock)) {
      return { success: false, error: 'STOCK_INSUFFICIENT' };
    }

    const subtotal = pricedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Ongkir tidak lagi dibebankan di checkout; diatur lewat WhatsApp dengan Dania.
    const shippingFee = 0;
    const platformFee = 0;
    const total = subtotal + shippingFee + platformFee;

    const orderNumber = generateOrderNumber();
    const transactionId = `MSE-${orderNumber}`;
    const pickupCode = method === 'pickup' ? generatePickupCode() : undefined;
    const pickupEventTitle = payload.fulfillment?.pickupEventTitle || '';
    const pickupLocation = payload.fulfillment?.pickupLocation || '';
    const pickupDate = payload.fulfillment?.pickupDate || '';
    const deliveryCity = payload.address?.city || 'Bandung';
    const deliveryInfo =
      method === 'pickup'
        ? `${pickupEventTitle} • ${pickupLocation}`.replace(/^ • | • $/g, '').trim()
        : deliveryCity;
    const eventTag =
      method === 'pickup' && pickupEventTitle ? pickupEventTitle : 'OFFICIAL STORE • MERCH';

    const stepper =
      method === 'pickup'
        ? [
            { label: 'Menunggu Pembayaran', completed: false },
            { label: 'Dibayar', completed: false },
            { label: 'Disiapkan Management', completed: false },
            { label: 'Diambil di Event', completed: false },
            { label: 'Selesai', completed: false },
          ]
        : [
            { label: 'Menunggu Pembayaran', completed: false },
            { label: 'Dibayar', completed: false },
            { label: 'Disiapkan Management', completed: false },
            { label: 'Dikirim', completed: false },
            { label: 'Selesai', completed: false },
          ];

    const orderPaymentSummary = {
      orderId: orderNumber,
      date: new Date().toLocaleString('id-ID'),
      items: pricedItems.map((i) => ({
        id: i.id,
        name: i.name,
        subtitle: i.subtitle,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
      })),
      subtotalRupiah: subtotal,
      shippingFee,
      platformFee,
      totalRupiah: total,
      notes: payload.notes || '',
      address: method === 'delivery' ? payload.address : undefined,
      paymentMethod: payload.paymentMethod || 'qris',
      fulfillment: {
        method,
        pickupEventId: payload.fulfillment?.pickupEventId,
        pickupEventTitle: pickupEventTitle || undefined,
        pickupDate: pickupDate || undefined,
        pickupLocation: pickupLocation || undefined,
        pickupContactName: payload.fulfillment?.pickupContactName,
        pickupContactPhone: payload.fulfillment?.pickupContactPhone,
        pickupCode,
      },
    };

    const newOrderEntry: TransactionDTO = {
      id: transactionId,
      orderCode: transactionId,
      date: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: 'unpaid',
      statusLabel: 'Menunggu pembayaran',
      eventTag,
      deliveryInfo,
      subtotal,
      shippingFee,
      platformFee,
      totalPrice: total,
      actionType: 'unpaid',
      initialCountdownSeconds: 180,
      pickupLocation: method === 'pickup' ? pickupLocation : 'Ambil cheki di venue event',
      pickupDate: method === 'pickup' ? pickupDate : undefined,
      pickupCode,
      pickupContactName: payload.fulfillment?.pickupContactName,
      pickupContactPhone: payload.fulfillment?.pickupContactPhone,
      items: pricedItems.map((i) => ({
        id: i.id,
        name: i.name,
        variant: i.subtitle || 'Official Merchandise',
        quantity: i.quantity,
        price: i.price,
        image: i.image || '/images/members/faril.webp',
      })),
      stepper,
      isStepperExpanded: true,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('muse_active_payment', JSON.stringify(orderPaymentSummary));
        localStorage.setItem('muse_active_payment', JSON.stringify(orderPaymentSummary));

        const existingOrdersRaw = localStorage.getItem('muses_user_orders');
        const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];

        existingOrders.unshift({
          ...newOrderEntry,
          title: pricedItems.map((i) => `${i.name} (${i.quantity}x)`).join(', '),
          pickupTime: '23:59:59',
          price: formatRupiah(total),
          numericPrice: total,
          badgeColor: 'border-[#DFC478] bg-[#FDF6E2] text-[#8C6A1C]',
          location: deliveryInfo,
        });

        localStorage.setItem('muses_user_orders', JSON.stringify(existingOrders));
      } catch (err) {
        console.error('Failed to save local order:', err);
      }
    }

    const sb = getSupabaseClient();
    if (sb) {
      try {
        const isUuidUser =
          payload.userId &&
          !payload.userId.startsWith('user_') &&
          !payload.userId.startsWith('muses_') &&
          !payload.userId.startsWith('guest_');

        await sb.from('transactions').upsert({
          id: transactionId,
          order_code: transactionId,
          user_id: isUuidUser ? payload.userId : null,
          status: 'unpaid',
          status_label: 'Menunggu pembayaran',
          event_tag: eventTag,
          delivery_info: deliveryInfo,
          subtotal,
          shipping_fee: shippingFee,
          platform_fee: platformFee,
          total_price: total,
          payment_method: payload.paymentMethod || 'qris',
          notes: payload.notes || '',
          action_type: 'unpaid',
          pickup_location: method === 'pickup' ? pickupLocation : null,
          pickup_date: method === 'pickup' ? pickupDate : null,
          pickup_code: pickupCode || null,
          shipping_address: method === 'delivery' ? payload.address || null : null,
          stepper,
        });

        const itemRows = pricedItems.map((i) => ({
          transaction_id: transactionId,
          product_id: i.id,
          name: i.name,
          variant: i.subtitle || 'Official Merchandise',
          image: i.image || '/images/members/faril.webp',
          quantity: i.quantity,
          price: i.price,
        }));

        await sb.from('transaction_items').insert(itemRows);
      } catch (err) {
        console.error('Failed to sync transaction to Supabase:', err);
      }
    }

    return {
      success: true,
      data: {
        orderId: orderNumber,
        transaction: newOrderEntry,
      },
    };
  },

  async verifyPayment(
    orderId: string,
    opts?: { isPickup?: boolean }
  ): Promise<ServiceResult<boolean>> {
    const paidStepper = [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Dikirim', completed: false },
      { label: 'Selesai', completed: false },
    ];
    const paidPickupStepper = [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Diambil di Event', completed: false },
      { label: 'Selesai', completed: false },
    ];

    if (typeof window !== 'undefined') {
      try {
        const storedOrders = localStorage.getItem('muses_user_orders');
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders);
          const updated = parsed.map((o: any) => {
            if (
              o.id === `MSE-${orderId}` ||
              o.id === orderId ||
              String(o.id).includes(orderId) ||
              o.orderCode?.includes(orderId)
            ) {
              const isPickupOrder = Boolean(o.pickupCode) || opts?.isPickup;
              return {
                ...o,
                status: 'processing',
                statusLabel: 'Sedang diproses',
                actionType: isPickupOrder ? 'pickup' : 'shipping',
                badgeColor: 'border-[#DFC478] bg-[#FDF6E2] text-[#8C6A1C]',
                stepper: isPickupOrder ? paidPickupStepper : paidStepper,
              };
            }
            return o;
          });
          localStorage.setItem('muses_user_orders', JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Failed to update local order payment status:', e);
      }
    }

    const sb = getSupabaseClient();
    if (sb) {
      try {
        const targetId = orderId.startsWith('MSE-') ? orderId : `MSE-${orderId}`;
        await sb
          .from('transactions')
          .update({
            status: 'processing',
            status_label: 'Sedang diproses',
            action_type: opts?.isPickup ? 'pickup' : 'shipping',
            stepper: opts?.isPickup ? paidPickupStepper : paidStepper,
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${targetId},order_code.eq.${orderId}`);
      } catch (err) {
        console.error('Failed to update payment status on Supabase:', err);
      }
    }

    return { success: true, data: true };
  },
};

