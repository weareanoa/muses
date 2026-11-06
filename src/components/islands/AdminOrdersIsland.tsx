import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  RefreshCw,
  Search,
  Download,
  Truck,
  Ticket,
  CheckCircle2,
  Clock,
  Send,
  Package,
} from 'lucide-react';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import {
  orderAdminService,
  type AdminOrderDTO,
  type OrderEventDTO,
} from '../../services/orderAdminService';
import { formatRupiah } from '../../lib/format';
import { waLinkTo } from '../../lib/contact';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';
import type { ServiceResult } from '../../types/database';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { AdminStatusPill, AdminNotice } from '../admin/ui';
import { cn } from '../../lib/utils';

type FulfillmentFilter = 'all' | 'delivery' | 'pickup';
type StatusTab = 'verify' | 'processing' | 'completed' | 'all';

const STATUS_GROUPS: Record<StatusTab, string[]> = {
  verify: ['awaiting_verification', 'unpaid'],
  processing: ['processing', 'ready'],
  completed: ['completed'],
  all: [], // includes closed, cancelled, rejected
};

type AdminDict = ReturnType<typeof getDict>['adminOrders'];
type RunAction = (fn: () => Promise<ServiceResult<true>>) => Promise<string | null>;

function formatDateTime(value: string | undefined, locale: Locale): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-xs py-0.5">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-900 break-words">{value}</span>
    </div>
  );
}

function exportOrdersToExcel(orders: AdminOrderDTO[], filterName = 'semua') {
  const headers = [
    'No. Pesanan',
    'Tanggal Pesan',
    'Nama Pembeli',
    'No. WhatsApp',
    'Email Pembeli',
    'Tipe Pemenuhan',
    'Alamat / Lokasi Pickup',
    'Rincian Produk',
    'Total Pembayaran (IDR)',
    'Status Pesanan',
    'No. Resi / Kode Pickup',
    'Catatan / Referensi',
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = orders.map((o) => {
    const isPickup = o.fulfillmentMethod === 'pickup';
    const address = isPickup
      ? `${o.eventTag || 'Venue'} - ${o.pickupLocation || ''} (${o.pickupDate || ''})`
      : o.shippingAddress
        ? [
            o.shippingAddress.street,
            o.shippingAddress.district,
            o.shippingAddress.city,
            o.shippingAddress.province,
            o.shippingAddress.postalCode,
          ]
            .filter(Boolean)
            .join(', ')
        : '-';

    const itemsSummary = o.items
      .map((item) => `${item.name} (${item.variant}) x${item.quantity}`)
      .join('; ');

    const codeOrResi = isPickup ? o.pickupCode || '-' : o.trackingNumber || '-';

    return [
      escapeCsv(o.id),
      escapeCsv(new Date(o.createdAt).toLocaleString('id-ID')),
      escapeCsv(o.contactName || o.customerName),
      escapeCsv(o.contactPhone),
      escapeCsv(o.customerEmail),
      escapeCsv(isPickup ? 'Ambil di Venue (Pickup)' : 'Kirim Ekspedisi (Delivery)'),
      escapeCsv(address),
      escapeCsv(itemsSummary),
      escapeCsv(o.payableAmount || o.totalPrice),
      escapeCsv(o.statusLabel || o.status),
      escapeCsv(codeOrResi),
      escapeCsv(o.adminNote || o.paymentReference || ''),
    ].join(',');
  });

  // UTF-8 BOM (\uFEFF) ensures Excel reads Indonesian text & special characters properly
  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `rekap-pesanan-muses-${filterName}-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface OrderCardProps {
  order: AdminOrderDTO;
  locale: Locale;
  d: AdminDict;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  run: RunAction;
}

function OrderCard({ order, locale, d, expanded, busy, onToggle, run }: OrderCardProps) {
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [allowRetry, setAllowRetry] = useState(false);
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [localError, setLocalError] = useState('');
  const [events, setEvents] = useState<OrderEventDTO[]>([]);

  const isPickup = order.fulfillmentMethod === 'pickup';
  const isOpen = order.status === 'unpaid' || order.status === 'awaiting_verification';
  const amount = order.payableAmount ?? order.totalPrice;
  const eventKey = `${order.status}-${order.updatedAt || ''}`;

  useEffect(() => {
    if (!expanded) return;
    let alive = true;
    orderAdminService.listEvents(order.id).then((res) => {
      if (alive && res.success && res.data) setEvents(res.data);
    });
    return () => {
      alive = false;
    };
  }, [expanded, order.id, eventKey]);

  const submit = async (fn: () => Promise<ServiceResult<true>>) => {
    setLocalError('');
    const message = await run(fn);
    if (message) {
      setLocalError(message);
      return;
    }
    setReference('');
    setReason('');
    setAllowRetry(false);
    setTracking('');
    setNote('');
    setPickupCode('');
  };

  const requireReason = (): boolean => {
    if (reason.trim().length < 3) {
      setLocalError(d.errReason);
      return false;
    }
    return true;
  };

  const handleVerify = () => {
    if (reference.trim().length < 3) {
      setLocalError(d.errReference);
      return;
    }
    submit(() => orderAdminService.verifyPayment(order.id, reference.trim()));
  };

  const handleReject = () => {
    if (!requireReason()) return;
    submit(() => orderAdminService.rejectPayment(order.id, reason.trim(), allowRetry));
  };

  const handleCancel = () => {
    if (!requireReason()) return;
    submit(() => orderAdminService.cancelOrder(order.id, reason.trim()));
  };

  const handleReopen = () => {
    if (!requireReason()) return;
    submit(() => orderAdminService.reopenOrder(order.id, reason.trim()));
  };

  const invoiceCode = order.orderCode || order.id;

  // WhatsApp Message Helpers
  const waAskPaymentMessage = fmt(
    'Halo Kak {name}, kami dari admin MUSES Official mengenai pesanan {id} sebesar {amount}. Apakah sudah melakukan pembayaran? Silakan kirimkan bukti transfernya ya Kak. Terima kasih!',
    {
      name: order.contactName,
      id: invoiceCode,
      amount: formatRupiah(amount),
    }
  );

  const waVerifyMessage = fmt(
    'Halo Kak {name}, pembayaran untuk pesanan {id} sebesar {amount} sudah berhasil kami verifikasi dan diterima. Pesanan Kakak segera kami proses! Terima kasih :)',
    {
      name: order.contactName,
      id: invoiceCode,
      amount: formatRupiah(amount),
    }
  );

  const waResiMessage = fmt(
    'Halo Kak {name}, pesanan {id} sudah kami kirimkan dengan nomor resi: {tracking}. Mohon ditunggu ya Kak, terima kasih!',
    {
      name: order.contactName,
      id: invoiceCode,
      tracking: tracking || order.trackingNumber || '-',
    }
  );

  const waPickupMessage = fmt(
    'Halo Kak {name}, pesanan {id} sudah siap diambil di booth merchandise MUSES ({venue}). Tunjukkan kode pickup ini ke staf: *{code}*. Sampai jumpa!',
    {
      name: order.contactName,
      id: invoiceCode,
      venue: order.eventTag || 'Venue Konser',
      code: pickupCode || order.pickupCode || '-',
    }
  );

  const buyerGeneralWa = order.contactPhone
    ? waLinkTo(
        order.contactPhone,
        isOpen
          ? waAskPaymentMessage
          : fmt('Halo Kak {name}, kami dari admin MUSES Official mengenai pesanan {id}...', {
              name: order.contactName,
              id: invoiceCode,
            })
      )
    : '';

  return (
    <Card className="transition-all hover:border-zinc-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-zinc-100">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
              isPickup
                ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                : 'bg-sky-50 text-sky-700 border-sky-200/80'
            )}
          >
            {isPickup ? <Ticket className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-zinc-900">
                {invoiceCode}
              </span>
              <Badge variant={isPickup ? 'pastel-purple' : 'pastel-blue'} className="text-[10px] py-0 px-2">
                {isPickup ? '🎫 Pickup Venue' : '🚚 Delivery'}
              </Badge>
              <AdminStatusPill status={order.status} locale={locale} />
            </div>
            <p className="text-xs text-zinc-600 font-medium truncate">
              {order.contactName} · {order.contactPhone || '-'}
            </p>
            <p className="text-[11px] text-zinc-400">
              {formatDateTime(order.createdAt, locale)} · {order.items.length} item
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0">
          <div className="text-left sm:text-right">
            <p className="text-sm font-bold text-zinc-900">{formatRupiah(amount)}</p>
            {order.uniqueCode ? (
              <p className="text-[10px] text-zinc-400 font-mono">Kode: +{order.uniqueCode}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5">
            {buyerGeneralWa && (
              <a
                href={buyerGeneralWa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-[#25D366] px-2.5 py-1.5 text-xs font-medium text-white hover:brightness-105"
                title="Chat WhatsApp Pembeli"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Chat WA</span>
              </a>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="h-8 text-xs font-medium"
            >
              <span>{expanded ? 'Tutup' : 'Detail'}</span>
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5 ml-1 text-zinc-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-1 text-zinc-400" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="grid gap-6 p-4 sm:p-5 lg:grid-cols-2 bg-zinc-50/30">
          {/* Kolom Kiri: Rincian Produk, Pembeli, & Alamat */}
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200/80 bg-white p-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {d.amountToReceive}
              </p>
              <p className="text-xl font-bold text-zinc-900">{formatRupiah(amount)}</p>
              {(order.uniqueCode ?? 0) > 0 && (
                <p className="text-xs text-zinc-500">
                  {d.uniqueCode}: <span className="font-mono font-medium text-zinc-900">{order.uniqueCode}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Daftar Produk Pesanan
              </p>
              <div className="rounded-lg border border-zinc-100 bg-white p-3 space-y-2">
                {order.items.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between gap-3 text-xs">
                    <span className="text-zinc-800">
                      {item.name} <span className="text-zinc-400">({item.variant})</span> × {item.quantity}
                    </span>
                    <span className="font-semibold text-zinc-900">
                      {formatRupiah(item.price * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Data Pemesan & Pengambilan
              </p>
              <div className="rounded-lg border border-zinc-100 bg-white p-3 space-y-1.5">
                <DetailRow label="Nama Pembeli" value={order.contactName} />
                <DetailRow label="No. WhatsApp" value={order.contactPhone || '-'} />
                <DetailRow label="Email" value={order.customerEmail || '-'} />

                {isPickup ? (
                  <>
                    <DetailRow label="Venue Tur" value={order.eventTag} />
                    <DetailRow
                      label="Lokasi Pickup"
                      value={`${order.pickupDate || ''} · ${order.pickupLocation || ''}`}
                    />
                    {order.pickupCode && (
                      <DetailRow
                        label="Kode Pickup"
                        value={
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            {order.pickupCode}
                          </span>
                        }
                      />
                    )}
                  </>
                ) : (
                  order.shippingAddress && (
                    <DetailRow
                      label="Alamat Pengiriman"
                      value={[
                        order.shippingAddress.street,
                        order.shippingAddress.district,
                        order.shippingAddress.city,
                        order.shippingAddress.province,
                        order.shippingAddress.postalCode,
                        order.shippingAddress.detail,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    />
                  )
                )}

                {order.trackingNumber && (
                  <DetailRow
                    label="Nomor Resi"
                    value={
                      <span className="font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                        {order.trackingNumber}
                      </span>
                    }
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5 rounded-lg border border-zinc-100 bg-white p-3">
              <DetailRow label="Waktu Checkout" value={formatDateTime(order.createdAt, locale)} />
              {isOpen && <DetailRow label="Batas Pembayaran" value={formatDateTime(order.paymentDeadline, locale)} />}
              {order.paidAt && <DetailRow label="Diverifikasi Pada" value={formatDateTime(order.paidAt, locale)} />}
              {order.paymentReference && <DetailRow label="Ref. Bank" value={order.paymentReference} />}
              {order.adminNote && <DetailRow label="Catatan Admin" value={order.adminNote} />}
            </div>
          </div>

          {/* Kolom Kanan: Aksi Cepat Verifikasi, Resi, & WhatsApp */}
          <div className="space-y-4">
            {/* Step 1: Verifikasi Pembayaran */}
            {isOpen && (
              <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-zinc-900">Verifikasi Pembayaran Masuk</p>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Cek mutasi rekening / QRIS dengan nominal <strong>{formatRupiah(amount)}</strong>. Masukkan ID referensi transfer:
                </p>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Contoh: BCA-982341 atau QRIS-Ref"
                />
                <Button size="sm" disabled={busy} onClick={handleVerify} className="w-full">
                  {busy ? 'Menyimpan...' : '✓ Tandai Berhasil Bayar'}
                </Button>

                {order.contactPhone && (
                  <div className="space-y-2 pt-1">
                    <a
                      href={waLinkTo(order.contactPhone, waAskPaymentMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Tanya Bukti Transfer via WhatsApp</span>
                    </a>

                    <a
                      href={waLinkTo(order.contactPhone, waVerifyMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#25D366] bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5 text-[#25D366]" />
                      <span>Kirim Konfirmasi Berhasil Bayar ke WA</span>
                    </a>
                  </div>
                )}

                <hr className="border-zinc-100 my-2" />

                <p className="text-xs font-semibold text-rose-900">Tolak Pembayaran</p>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Alasan penolakan..."
                />
                <label className="flex items-center gap-2 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    checked={allowRetry}
                    onChange={(e) => setAllowRetry(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span>Bolehkan pembeli upload ulang bukti</span>
                </label>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={handleReject}
                  className="w-full"
                >
                  Tolak Pembayaran
                </Button>
              </div>
            )}

            {/* Step 2: Pengiriman (Delivery) - Input Resi */}
            {order.status === 'processing' && !isPickup && (
              <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-sky-600" />
                  <p className="text-xs font-semibold text-zinc-900">Pengiriman Ekspedisi (Delivery)</p>
                </div>
                <p className="text-xs text-zinc-500">Masukkan nomor resi pengiriman (JNE/J&T/SiCepat):</p>
                <Input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Nomor Resi Pengiriman..."
                />
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan kurir/paket..."
                />
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    submit(() =>
                      orderAdminService.advanceOrder(order.id, 'ready', { note, tracking })
                    )
                  }
                  className="w-full"
                >
                  Tandai Sedang Dikirim
                </Button>

                {order.contactPhone && (
                  <a
                    href={waLinkTo(order.contactPhone, waResiMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#25D366] bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>Kirim Resi via WhatsApp</span>
                  </a>
                )}
              </div>
            )}

            {/* Step 2b: Penyiapan Barang di Venue (Pickup) */}
            {order.status === 'processing' && isPickup && (
              <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-semibold text-zinc-900">Penyiapan Pickup di Venue</p>
                </div>
                <p className="text-xs text-zinc-500">
                  Paket sudah disiapkan untuk diambil di venue konser:
                </p>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    submit(() =>
                      orderAdminService.advanceOrder(order.id, 'ready', { note: 'Barang siap diambil di booth' })
                    )
                  }
                  className="w-full"
                >
                  Tandai Siap Diambil di Booth
                </Button>

                {order.contactPhone && (
                  <a
                    href={waLinkTo(order.contactPhone, waPickupMessage)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#25D366] bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <Send className="h-3.5 w-3.5 text-[#25D366]" />
                    <span>Kirim Notifikasi Siap Ambil ke WA</span>
                  </a>
                )}
              </div>
            )}

            {/* Step 3: Penyelesaian (Selesai Diterima / Diambil) */}
            {order.status === 'ready' && (
              <div className="space-y-3 rounded-lg border border-zinc-200/80 bg-white p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-zinc-900">
                    {isPickup ? 'Verifikasi Pengambilan di Booth' : 'Konfirmasi Paket Diterima'}
                  </p>
                </div>

                {isPickup && (
                  <Input
                    className="font-mono uppercase font-bold"
                    value={pickupCode}
                    onChange={(e) => setPickupCode(e.target.value)}
                    placeholder="Masukkan Kode Pickup Pembeli..."
                  />
                )}
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Catatan penyerahan barang..."
                />
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    submit(() =>
                      orderAdminService.advanceOrder(order.id, 'completed', { note, pickupCode })
                    )
                  }
                  className="w-full"
                >
                  ✓ Selesaikan Pesanan
                </Button>
              </div>
            )}

            {localError && <p className="text-xs font-medium text-rose-600">{localError}</p>}

            {/* Timeline Riwayat Status */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Riwayat Aktivitas
              </p>
              <div className="rounded-lg border border-zinc-100 bg-white p-3 max-h-48 overflow-y-auto">
                {events.length === 0 ? (
                  <p className="text-xs text-zinc-400">Belum ada riwayat aktivitas.</p>
                ) : (
                  <ul className="space-y-2">
                    {events.map((ev) => (
                      <li key={ev.id} className="text-xs text-zinc-700">
                        <span className="font-mono text-zinc-400">{formatDateTime(ev.createdAt, locale)}</span>{' '}
                        <span className="font-semibold text-zinc-900">{ev.event}</span>
                        {ev.toStatus ? ` → ${ev.toStatus}` : ''}{' '}
                        <span className="text-zinc-500">({ev.actorRole})</span>
                        {ev.note ? ` — ${ev.note}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

let cachedOrders: AdminOrderDTO[] | null = null;

export default function AdminOrdersIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).adminOrders;
  const { gate, adminEmail, signOut } = useAdminGate();
  const [orders, setOrders] = useState<AdminOrderDTO[]>(() => cachedOrders || []);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>(() =>
    cachedOrders ? 'ready' : 'loading'
  );
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all');
  const [statusTab, setStatusTab] = useState<StatusTab>('verify');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const loadOrders = useCallback(async () => {
    const res = await orderAdminService.listOrders();
    if (res.success && res.data) {
      cachedOrders = res.data;
      setOrders(res.data);
      setLoadState('ready');
    } else if (!cachedOrders) {
      setLoadState('failed');
    }
  }, []);

  useEffect(() => {
    if (gate === 'ready') loadOrders();
  }, [gate, loadOrders]);

  const errorMessage = (code: string | undefined): string => {
    switch (code) {
      case 'FORBIDDEN':
        return d.errForbidden;
      case 'REFERENCE_REQUIRED':
        return d.errReference;
      case 'REASON_REQUIRED':
        return d.errReason;
      case 'INVALID_STATE':
      case 'INVALID_TRANSITION':
      case 'ORDER_NOT_FOUND':
        return d.errState;
      case 'PICKUP_CODE_MISMATCH':
        return 'Kode pickup tidak sesuai!';
      case 'AMOUNT_CONFLICT':
        return d.errConflict;
      case 'STOCK_INSUFFICIENT':
        return d.errStock;
      default:
        return d.errGeneric;
    }
  };

  const run: RunAction = async (fn) => {
    setBusy(true);
    setNotice('');
    const res = await fn();
    setBusy(false);
    await loadOrders();
    if (res.success) {
      setNotice('Operasi berhasil disimpan.');
      return null;
    }
    return errorMessage(res.error);
  };

  // Filter Data Berdasarkan Fulfillment (Delivery vs Pickup) & Status
  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter 1: Metode Pengambilan (Delivery vs Pickup)
    if (fulfillmentFilter === 'delivery') {
      result = result.filter((o) => o.fulfillmentMethod !== 'pickup');
    } else if (fulfillmentFilter === 'pickup') {
      result = result.filter((o) => o.fulfillmentMethod === 'pickup');
    }

    // Filter 2: Status Alur
    if (statusTab !== 'all') {
      const allowed = STATUS_GROUPS[statusTab];
      result = result.filter((o) => allowed.includes(o.status));
    }

    // Filter 3: Search Query
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((o) =>
        [
          o.id,
          o.contactName,
          o.contactPhone,
          o.customerName,
          o.customerEmail,
          o.pickupCode || '',
          o.trackingNumber || '',
          o.eventTag || '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    // Sort: Terbaru di atas
    return [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [orders, fulfillmentFilter, statusTab, search]);

  // Counts untuk Tab Status
  const counts = useMemo(() => {
    const base =
      fulfillmentFilter === 'delivery'
        ? orders.filter((o) => o.fulfillmentMethod !== 'pickup')
        : fulfillmentFilter === 'pickup'
          ? orders.filter((o) => o.fulfillmentMethod === 'pickup')
          : orders;

    return {
      verify: base.filter((o) => STATUS_GROUPS.verify.includes(o.status)).length,
      processing: base.filter((o) => STATUS_GROUPS.processing.includes(o.status)).length,
      completed: base.filter((o) => STATUS_GROUPS.completed.includes(o.status)).length,
      all: base.length,
      deliveryTotal: orders.filter((o) => o.fulfillmentMethod !== 'pickup').length,
      pickupTotal: orders.filter((o) => o.fulfillmentMethod === 'pickup').length,
    };
  }, [orders, fulfillmentFilter]);

  if (gate !== 'ready') {
    return (
      <AdminGateScreen
        gate={gate}
        adminEmail={adminEmail}
        locale={locale}
        onSignOut={signOut}
      />
    );
  }

  const handleExport = () => {
    const filterName =
      fulfillmentFilter === 'all'
        ? `semua-${statusTab}`
        : `${fulfillmentFilter}-${statusTab}`;
    exportOrdersToExcel(filteredOrders, filterName);
  };

  return (
    <AdminShell
      currentTab="orders"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={signOut}
      title="Manajemen Pesanan"
      subtitle="Verifikasi pembayaran transfer/QRIS dan kelola pengiriman atau pickup venue konser"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="text-xs"
            title="Download Rekap Pesanan ke format Excel/CSV"
          >
            <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            <span>Download Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            className="text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Tier 1: Segmented Toggle Pengiriman vs Pickup */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg max-w-fit">
            <button
              type="button"
              onClick={() => setFulfillmentFilter('all')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                fulfillmentFilter === 'all'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              Semua Pesanan ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentFilter('delivery')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                fulfillmentFilter === 'delivery'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Truck className="h-3.5 w-3.5 text-sky-600" />
              <span>Pengiriman Ekspedisi ({counts.deliveryTotal})</span>
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentFilter('pickup')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                fulfillmentFilter === 'pickup'
                  ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                  : 'text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Ticket className="h-3.5 w-3.5 text-purple-600" />
              <span>Ambil di Venue ({counts.pickupTotal})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <Input
              className="pl-8 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, WhatsApp, ID..."
            />
          </div>
        </div>

        {/* Tier 2: Status Verifikasi & Alur (3 Status Sederhana Mas Hasan) */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusTab === 'verify' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusTab('verify')}
            className="text-xs"
          >
            <Clock className="h-3.5 w-3.5 mr-1 text-amber-500" />
            <span>1. Perlu Verifikasi</span>
            <span className="ml-1.5 opacity-70">({counts.verify})</span>
          </Button>

          <Button
            variant={statusTab === 'processing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusTab('processing')}
            className="text-xs"
          >
            <Truck className="h-3.5 w-3.5 mr-1 text-sky-500" />
            <span>2. Diproses & Dikirim</span>
            <span className="ml-1.5 opacity-70">({counts.processing})</span>
          </Button>

          <Button
            variant={statusTab === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusTab('completed')}
            className="text-xs"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
            <span>3. Selesai</span>
            <span className="ml-1.5 opacity-70">({counts.completed})</span>
          </Button>

          <Button
            variant={statusTab === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusTab('all')}
            className="text-xs"
          >
            <span>Semua Transaksi</span>
            <span className="ml-1.5 opacity-70">({counts.all})</span>
          </Button>
        </div>

        {notice && (
          <AdminNotice tone="success">
            <div className="flex items-center justify-between w-full">
              <span>{notice}</span>
              <button
                type="button"
                onClick={() => setNotice('')}
                className="ml-2 text-zinc-500 hover:text-zinc-900"
              >
                ×
              </button>
            </div>
          </AdminNotice>
        )}

        {loadState === 'loading' && (
          <p className="text-xs text-zinc-500">Memuat data pesanan...</p>
        )}
        {loadState === 'failed' && (
          <AdminNotice tone="error">Gagal memuat daftar pesanan dari server.</AdminNotice>
        )}

        {/* Daftar Pesanan */}
        {loadState === 'ready' && (
          <div className="space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500">
                <Package className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                <p className="font-semibold text-zinc-700">Tidak ada pesanan di kategori ini</p>
                <p className="mt-1 text-zinc-400">
                  Coba ubah filter atau kata kunci pencarian Anda.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  locale={locale}
                  d={d}
                  expanded={expandedId === order.id}
                  busy={busy}
                  onToggle={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                  run={run}
                />
              ))
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
