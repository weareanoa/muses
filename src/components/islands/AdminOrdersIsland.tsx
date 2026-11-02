import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, RefreshCw, Search } from 'lucide-react';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import StatusBadge from '../ui/StatusBadge';
import { orderAdminService, type AdminOrderDTO, type OrderEventDTO } from '../../services/orderAdminService';
import { formatRupiah } from '../../lib/format';
import { waLinkTo } from '../../lib/contact';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';
import type { ServiceResult } from '../../types/database';

type Tab = 'verify' | 'unpaid' | 'processing' | 'completed' | 'closed' | 'all' | 'pickup';

const TAB_ORDER: Tab[] = ['verify', 'unpaid', 'processing', 'completed', 'closed', 'all', 'pickup'];

const TAB_STATUSES: Record<Exclude<Tab, 'all' | 'pickup'>, string[]> = {
  verify: ['awaiting_verification'],
  unpaid: ['unpaid'],
  processing: ['processing', 'ready'],
  completed: ['completed'],
  closed: ['cancelled', 'rejected', 'expired'],
};

type AdminDict = ReturnType<typeof getDict>['adminOrders'];
type RunAction = (fn: () => Promise<ServiceResult<true>>) => Promise<string | null>;

const inputClass =
  'w-full rounded-xl border border-[#E9D9AE] bg-white px-3 py-2 text-xs text-[#1F1A12] placeholder:text-[#A89D86] focus:border-[#C9971C] focus:outline-none';
const primaryButton =
  'rounded-full bg-gradient-to-r from-[#C9971C] to-[#B38317] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 disabled:opacity-60 cursor-pointer';
const dangerButton =
  'rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 cursor-pointer';

function formatDateTime(value: string | undefined, locale: Locale): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function sortOrders(orders: AdminOrderDTO[], tab: Tab): AdminOrderDTO[] {
  const sorted = [...orders];
  if (tab === 'verify') {
    return sorted.sort(
      (a, b) =>
        new Date(a.proofSubmittedAt || a.createdAt).getTime() -
        new Date(b.proofSubmittedAt || b.createdAt).getTime()
    );
  }
  return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-[#6E6453]">{label}</span>
      <span className="text-right font-semibold text-[#1F1A12] break-words">{value}</span>
    </div>
  );
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

  const buyerLink = order.contactPhone
    ? waLinkTo(order.contactPhone, fmt(d.waBuyerTemplate, { name: order.contactName, id: order.id }))
    : '';

  return (
    <div className="rounded-3xl border border-[#EADCB9] bg-white shadow-xs">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-4 sm:p-5 text-left cursor-pointer"
      >
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-sm font-bold text-[#1F1A12] break-all">{order.id}</p>
          <p className="text-xs text-[#6E6453]">
            {order.contactName} · {formatDateTime(order.createdAt, locale)} ·{' '}
            {isPickup ? d.pickup : d.delivery}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-[#1F1A12]">{formatRupiah(amount)}</p>
          </div>
          <StatusBadge
            status={order.status}
            label={locale === 'id' ? order.statusLabel : undefined}
            locale={locale}
          />
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#8C6A1C]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#8C6A1C]" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="grid gap-6 border-t border-[#EADCB9]/60 p-4 sm:p-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E9D9AE] bg-[#FFFBF2] p-4 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">
                {d.amountToReceive}
              </p>
              <p className="text-2xl font-extrabold text-[#1F1A12]">{formatRupiah(amount)}</p>
              {(order.uniqueCode ?? 0) > 0 && (
                <p className="text-xs text-[#6E6453]">
                  {d.uniqueCode}: <span className="font-mono font-bold">{order.uniqueCode}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">{d.items}</p>
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between gap-3 text-xs">
                  <span className="text-[#1F1A12]">
                    {item.name} <span className="text-[#6E6453]">({item.variant})</span> × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatRupiah(item.price * (item.quantity || 1))}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">{d.buyer}</p>
              <DetailRow label={d.buyer} value={`${order.contactName} · ${order.contactPhone || '-'}`} />
              <DetailRow label="Email" value={order.customerEmail || '-'} />
              {isPickup ? (
                <>
                  <DetailRow label={d.pickup} value={order.eventTag} />
                  <DetailRow label="" value={`${order.pickupDate || ''} · ${order.pickupLocation || ''}`} />
                </>
              ) : (
                order.shippingAddress && (
                  <DetailRow
                    label={d.delivery}
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
              {buyerLink && (
                <a
                  href={buyerLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-bold text-white hover:brightness-105"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {d.contactBuyer}
                </a>
              )}
            </div>

            <div className="space-y-1.5">
              <DetailRow label={d.createdAt} value={formatDateTime(order.createdAt, locale)} />
              {isOpen && <DetailRow label={d.deadline} value={formatDateTime(order.paymentDeadline, locale)} />}
              {order.proofSubmittedAt && (
                <DetailRow label={d.proofAt} value={formatDateTime(order.proofSubmittedAt, locale)} />
              )}
              {order.paidAt && <DetailRow label={d.paidAt} value={formatDateTime(order.paidAt, locale)} />}
              {order.paymentReference && <DetailRow label={d.reference} value={order.paymentReference} />}
              {order.pickupCode && (
                <DetailRow label={d.pickupCode} value={<span className="font-mono">{order.pickupCode}</span>} />
              )}
              {order.trackingNumber && <DetailRow label={d.tracking} value={order.trackingNumber} />}
              {order.rejectReason && <DetailRow label={d.rejectReason} value={order.rejectReason} />}
              {order.adminNote && <DetailRow label={d.adminNote} value={order.adminNote} />}
            </div>
          </div>

          <div className="space-y-5">
            {isOpen && (
              <div className="space-y-3 rounded-2xl border border-[#E9D9AE] p-4">
                <p className="text-sm font-bold text-[#1F1A12]">{d.verifyTitle}</p>
                <p className="text-xs leading-relaxed text-[#6E6453]">{d.verifyHint}</p>
                <input
                  className={inputClass}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={d.referencePh}
                />
                <button type="button" className={primaryButton} disabled={busy} onClick={handleVerify}>
                  {busy ? d.busy : d.verifyButton}
                </button>

                <hr className="border-[#EADCB9]/60" />

                <p className="text-sm font-bold text-[#1F1A12]">{d.rejectTitle}</p>
                <input
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={d.reasonPh}
                />
                <label className="flex items-start gap-2 text-xs text-[#6E6453]">
                  <input
                    type="checkbox"
                    checked={allowRetry}
                    onChange={(e) => setAllowRetry(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>{d.allowRetry}</span>
                </label>
                <button type="button" className={dangerButton} disabled={busy} onClick={handleReject}>
                  {d.rejectButton}
                </button>
              </div>
            )}

            {order.status === 'processing' && (
              <div className="space-y-3 rounded-2xl border border-[#E9D9AE] p-4">
                {!isPickup && (
                  <input
                    className={inputClass}
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder={d.trackingPh}
                  />
                )}
                <input
                  className={inputClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={d.notePh}
                />
                <button
                  type="button"
                  className={primaryButton}
                  disabled={busy}
                  onClick={() =>
                    submit(() =>
                      orderAdminService.advanceOrder(order.id, 'ready', { note, tracking })
                    )
                  }
                >
                  {isPickup ? d.readyPickup : d.readyShip}
                </button>
              </div>
            )}

            {order.status === 'ready' && (
              <div className="space-y-3 rounded-2xl border border-[#E9D9AE] p-4">
                {isPickup && (
                  <input
                    className={`${inputClass} font-mono uppercase`}
                    value={pickupCode}
                    onChange={(e) => setPickupCode(e.target.value)}
                    placeholder={d.pickupCodePh}
                  />
                )}
                <input
                  className={inputClass}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={d.notePh}
                />
                <button
                  type="button"
                  className={primaryButton}
                  disabled={busy}
                  onClick={() =>
                    submit(() =>
                      orderAdminService.advanceOrder(order.id, 'completed', { note, pickupCode })
                    )
                  }
                >
                  {d.completeButton}
                </button>
              </div>
            )}

            {(order.status === 'processing' || order.status === 'ready') && (
              <div className="space-y-3 rounded-2xl border border-red-100 p-4">
                <p className="text-sm font-bold text-[#1F1A12]">{d.cancelPaidTitle}</p>
                <p className="text-xs text-[#6E6453]">{d.cancelPaidHint}</p>
                <input
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={d.reasonPh}
                />
                <button type="button" className={dangerButton} disabled={busy} onClick={handleCancel}>
                  {d.cancelButton}
                </button>
              </div>
            )}

            {order.status === 'expired' && (
              <div className="space-y-3 rounded-2xl border border-[#E9D9AE] p-4">
                <p className="text-sm font-bold text-[#1F1A12]">{d.reopenTitle}</p>
                <p className="text-xs text-[#6E6453]">{d.reopenHint}</p>
                <input
                  className={inputClass}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={d.reasonPh}
                />
                <button type="button" className={primaryButton} disabled={busy} onClick={handleReopen}>
                  {d.reopenButton}
                </button>
              </div>
            )}

            {localError && <p className="text-xs font-semibold text-red-700">{localError}</p>}

            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">{d.timeline}</p>
              {events.length === 0 ? (
                <p className="text-xs text-[#6E6453]">{d.noEvents}</p>
              ) : (
                <ul className="space-y-1.5">
                  {events.map((ev) => (
                    <li key={ev.id} className="text-xs text-[#42392B]">
                      <span className="font-mono text-[#8C6A1C]">{formatDateTime(ev.createdAt, locale)}</span>{' '}
                      <span className="font-semibold">{ev.event}</span>
                      {ev.toStatus ? ` → ${ev.toStatus}` : ''} <span className="text-[#6E6453]">({ev.actorRole})</span>
                      {ev.note ? ` — ${ev.note}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PickupListProps {
  orders: AdminOrderDTO[];
  d: AdminDict;
  onOpen: (order: AdminOrderDTO) => void;
}

function PickupList({ orders, d, onOpen }: PickupListProps) {
  const groups = useMemo(() => {
    const map = new Map<string, AdminOrderDTO[]>();
    orders
      .filter((o) => o.fulfillmentMethod === 'pickup' && (o.status === 'processing' || o.status === 'ready'))
      .forEach((o) => {
        const key = `${o.eventTag || '-'} · ${o.pickupDate || ''}`;
        map.set(key, [...(map.get(key) || []), o]);
      });
    return Array.from(map.entries());
  }, [orders]);

  if (groups.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E9D9AE] p-10 text-center text-xs text-[#6E6453]">
        {d.pickupEmpty}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-base font-bold text-[#1F1A12]">{d.pickupHeading}</h2>
      {groups.map(([title, list]) => (
        <div key={title} className="rounded-3xl border border-[#EADCB9] bg-white p-5 shadow-xs space-y-3">
          <p className="text-sm font-bold text-[#1F1A12]">
            {title} <span className="text-[#6E6453]">({list.length})</span>
          </p>
          {list.map((o) => (
            <div
              key={o.id}
              className="flex flex-col gap-2 rounded-2xl border border-[#E9D9AE]/70 bg-[#FCFAF5] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 text-xs">
                <p className="font-bold text-[#1F1A12]">
                  {o.contactName} · {o.contactPhone}
                </p>
                <p className="text-[#6E6453]">
                  {o.items.map((i) => `${i.name} (${i.quantity}x)`).join(', ')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs font-bold text-[#1F1A12]">{o.pickupCode}</span>
                <span className="text-[11px] font-semibold text-[#8C6A1C]">
                  {o.status === 'ready' ? d.pickupReady : d.pickupPrepared}
                </span>
                <button
                  type="button"
                  onClick={() => onOpen(o)}
                  className="rounded-full border border-[#E9D9AE] bg-white px-3 py-1 text-[11px] font-bold text-[#8C6A1C] hover:bg-[#FFF9EC] cursor-pointer"
                >
                  {d.openOrder}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminOrdersIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).adminOrders;
  const { gate, adminEmail, signOut } = useAdminGate();
  const [orders, setOrders] = useState<AdminOrderDTO[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [tab, setTab] = useState<Tab>('verify');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const loadOrders = useCallback(async () => {
    const res = await orderAdminService.listOrders();
    if (res.success && res.data) {
      setOrders(res.data);
      setLoadState('ready');
    } else {
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
        return d.errPickupCode;
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
      setNotice(d.noticeDone);
      return null;
    }
    return errorMessage(res.error);
  };

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length };
    (Object.keys(TAB_STATUSES) as (keyof typeof TAB_STATUSES)[]).forEach((key) => {
      result[key] = orders.filter((o) => TAB_STATUSES[key].includes(o.status)).length;
    });
    result.pickup = orders.filter(
      (o) => o.fulfillmentMethod === 'pickup' && (o.status === 'processing' || o.status === 'ready')
    ).length;
    return result;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const inTab =
      tab === 'all' || tab === 'pickup'
        ? orders
        : orders.filter((o) => TAB_STATUSES[tab].includes(o.status));
    const filtered = query
      ? inTab.filter((o) =>
          [o.id, o.contactName, o.contactPhone, o.customerName, o.customerEmail]
            .join(' ')
            .toLowerCase()
            .includes(query)
        )
      : inTab;
    return sortOrders(filtered, tab);
  }, [orders, tab, search]);

  const tabLabels: Record<Tab, string> = {
    verify: d.tabVerify,
    unpaid: d.tabUnpaid,
    processing: d.tabProcessing,
    completed: d.tabCompleted,
    closed: d.tabClosed,
    all: d.tabAll,
    pickup: d.tabPickup,
  };

  const openFromPickup = (order: AdminOrderDTO) => {
    setTab('processing');
    setExpandedId(order.id);
  };

  if (gate !== 'ready') {
    return <AdminGateScreen gate={gate} adminEmail={adminEmail} locale={locale} onSignOut={signOut} />;
  }

  return (
    <AdminShell
      currentTab="orders"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={signOut}
      title={d.heading}
      subtitle={d.intro}
      actions={
        <button
          type="button"
          onClick={loadOrders}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#E9D9AE] bg-white px-3.5 py-2 text-xs font-bold text-[#8C6A1C] hover:bg-[#FFF9EC] cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{d.refresh}</span>
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {TAB_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                tab === key
                  ? 'bg-[#C9971C] text-white shadow-2xs'
                  : 'border border-[#E9D9AE] bg-white text-[#6E6453] hover:bg-[#FAF3E2]'
              }`}
            >
              {tabLabels[key]}
              <span className="ml-1.5 opacity-80">{counts[key] ?? 0}</span>
            </button>
          ))}
        </div>

        {tab !== 'pickup' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A89D86]" />
            <input
              className={`${inputClass} pl-9`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={d.searchPh}
            />
          </div>
        )}

        {notice && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
            {notice}
          </p>
        )}

        {loadState === 'loading' && <p className="text-sm text-[#6E6453]">{d.loading}</p>}
        {loadState === 'failed' && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
            {d.loadFailed}
          </p>
        )}

        {loadState === 'ready' && tab === 'pickup' && (
          <PickupList orders={orders} d={d} onOpen={openFromPickup} />
        )}

        {loadState === 'ready' && tab !== 'pickup' && (
          <div className="space-y-3">
            {visibleOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E9D9AE] p-10 text-center text-xs text-[#6E6453]">
                {d.empty}
              </div>
            ) : (
              visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  locale={locale}
                  d={d}
                  expanded={expandedId === order.id}
                  busy={busy}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
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
