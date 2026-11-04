import { withBase } from '../../lib/paths';
import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingBag,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { TransactionDTO } from '../../types/database';
import { transactionService } from '../../services/transactionService';
import { formatCountdown, formatRupiah } from '../../lib/format';
import StatusBadge from '../ui/StatusBadge';
import { fmt, getDict, localizeDemoText, type Locale } from '../../i18n/dictionary';
import { daniaWaLink } from '../../lib/contact';

const FILTER_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: 'Belum dibayar' },
  { id: 'processing', label: 'Sedang diproses' },
  { id: 'completed', label: 'Selesai' },
] as const;

type FilterTabId = typeof FILTER_TABS[number]['id'];

export default function HistoryIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).orders;
  const [activeFilter, setActiveFilter] = useState<FilterTabId>('all');
  const [orders, setOrders] = useState<TransactionDTO[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [now, setNow] = useState<number>(() => Date.now());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Label stepper pesanan lama masih menyebut kurir; tampilkan netral.
  const stepperLabel = (label: string): string => {
    const localized = localizeDemoText(locale, label);
    if (localized === 'Dalam Pengiriman (JNE)') return 'Dikirim';
    if (localized === 'In transit (JNE)') return 'Shipped';
    return localized;
  };

  useEffect(() => {
    transactionService.getTransactions().then((res) => {
      if (res.success && res.data) {
        setOrders(res.data);
        setLoadState('ready');
      } else {
        setLoadState('failed');
      }
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const toggleStepper = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, isStepperExpanded: !order.isStepperExpanded } : order
      )
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unpaid') return order.status === 'unpaid' || order.status === 'awaiting_verification';
    if (activeFilter === 'processing') return order.status === 'processing' || order.status === 'ready';
    if (activeFilter === 'completed') return order.status === 'completed';
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto py-2 sm:py-6 px-2 sm:px-4 relative font-sans">
      <div className="space-y-6">
        <div className="w-full bg-white rounded-2xl sm:rounded-full border border-[#EBDCB9] shadow-[0_4px_20px_rgba(201,151,28,0.06)] p-1.5">
          <div className="grid grid-cols-4 items-center">
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`py-2 px-1 text-center text-xs sm:text-sm font-semibold transition-all rounded-full cursor-pointer flex flex-col items-center justify-center ${
                    isActive
                      ? 'text-[#1F1A12] font-bold'
                      : 'text-[#6E6453] hover:text-[#1F1A12]'
                  }`}
                >
                  <span>{localizeDemoText(locale, tab.label)}</span>
                  {isActive ? (
                    <span className="w-10 sm:w-16 h-0.5 bg-[#C9971C] rounded-full mt-1 animate-in fade-in zoom-in duration-150"></span>
                  ) : (
                    <span className="w-10 sm:w-16 h-0.5 bg-transparent rounded-full mt-1"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          {loadState === 'failed' ? (
            <div className="text-center py-16 bg-white/70 rounded-3xl border border-[#E8D9B5] p-8">
              <p className="text-sm text-[#736856]">{d.loadFailed}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white/70 rounded-3xl border border-[#E8D9B5] p-8">
              <Package className="w-12 h-12 text-[#C9971C]/60 mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1F1A12]">
                {activeFilter === 'all' ? d.emptyAllTitle : d.emptyTitle}
              </h3>
              <p className="text-xs text-[#736856] mt-1 mb-6">
                {d.emptyBody}
              </p>
              <a
                href={withBase("/store")}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C9971C] to-[#9A7420] text-white text-xs font-bold uppercase tracking-wider hover:brightness-110 shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{d.visitStore}</span>
              </a>
            </div>
          ) : (
            filteredOrders.map((order, orderIdx) => {
              const isUnpaid = order.status === 'unpaid';
              const isAwaiting = order.status === 'awaiting_verification';
              const isClosed = ['expired', 'rejected', 'cancelled'].includes(order.status);
              const secondsLeft = order.paymentDeadline
                ? Math.max(0, Math.floor((new Date(order.paymentDeadline).getTime() - now) / 1000))
                : 0;
              const displayTotal = isUnpaid || isAwaiting ? order.payableAmount ?? order.totalPrice : order.totalPrice;
              const isPickup = order.actionType === 'pickup';
              const isShipping = order.actionType === 'shipping';
              const isCompleted = order.status === 'completed';

              return (
                <div
                  key={`${order.id}-${orderIdx}`}
                  className="w-full bg-[#FFFCF6] rounded-2xl sm:rounded-3xl border border-[#E8D9B5] shadow-[0_4px_20px_rgba(201,151,28,0.06)] p-5 sm:p-6 transition-all"
                >
                  <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#1F1A12]/6">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-mono font-black text-sm sm:text-base text-[#1F1A12] tracking-tight">
                        {order.id}
                      </span>
                      <span className="text-xs sm:text-sm text-[#736856]">
                        {order.date}
                      </span>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={order.status} label={localizeDemoText(locale, order.statusLabel)} locale={locale} />
                    </div>
                  </div>

                  {order.eventTag && (
                    <div className="mt-3 mb-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#FCEBAE] text-[#7A5B15] text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase">
                        {order.eventTag}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3 py-1">
                    {order.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={withBase(item.image || '/images/members/faril.webp')}
                            alt={item.name || d.productFallbackAlt}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = withBase('/images/members/faril.webp');
                            }}
                            className="w-12 h-12 rounded-xl object-cover bg-[#F7F2E4] border border-[#1F1A12]/8 shrink-0"
                          />
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-[#1F1A12] leading-tight">
                              {item.name}
                            </h4>
                            <p className="text-xs text-[#736856] mt-0.5">
                              {item.variant}
                            </p>
                          </div>
                        </div>

                        {item.quantity && (
                          <span className="font-bold text-sm sm:text-base text-[#1F1A12]">
                            {item.quantity}x
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#1F1A12]/8 pt-3 mt-2 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-[#736856] font-medium">
                      {localizeDemoText(locale, order.deliveryInfo)}
                    </span>
                    <span className="text-base sm:text-lg font-bold text-[#1F1A12]">
                      {formatRupiah(displayTotal ?? 0)}
                    </span>
                  </div>

                  {isUnpaid && (
                    <div className="rounded-2xl p-4 sm:p-5 mt-4 bg-[#FFF8E7] border border-[#EED79D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm text-[#1F1A12]">
                          {d.payWithin}{' '}
                          <span className="font-bold text-[#7A5B15]">
                            {formatCountdown(secondsLeft)}
                          </span>
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#736856]">
                          {d.autoCancel}
                        </p>
                      </div>
                      <a
                        href={withBase(`/payment?orderId=${encodeURIComponent(order.id)}`)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4A328] via-[#B8871B] to-[#996B10] text-[#FCFAF5] font-bold text-xs sm:text-sm shadow-md hover:brightness-110 active:scale-95 transition-all text-center shrink-0 cursor-pointer"
                      >
                        {d.payWithQR}
                      </a>
                    </div>
                  )}

                  {isAwaiting && (
                    <div className="rounded-2xl p-4 sm:p-5 mt-4 bg-[#FFF8E7] border border-[#EED79D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-[#1F1A12]">{d.awaitingTitle}</p>
                        <p className="text-[11px] sm:text-xs text-[#736856]">{d.awaitingBody}</p>
                      </div>
                      <a
                        href={daniaWaLink(fmt(d.waProofTemplate, { id: order.id, amount: formatRupiah(displayTotal ?? 0) }))}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:brightness-105 text-white text-xs font-bold shadow-sm transition-all text-center shrink-0"
                      >
                        {d.sendProof}
                      </a>
                    </div>
                  )}

                  {isClosed && (
                    <div className="rounded-2xl p-4 mt-4 bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      {order.status === 'expired'
                        ? d.expiredNote
                        : order.status === 'rejected'
                          ? fmt(d.rejectedNote, { reason: order.rejectReason || '-' })
                          : d.cancelledNote}
                    </div>
                  )}

                  {isPickup && (
                    <div className="rounded-2xl p-4 sm:p-5 mt-4 bg-[#FFF8E7] border border-[#EED79D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                          {order.pickupLocation ? localizeDemoText(locale, order.pickupLocation) : d.pickupFallbackLocation}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#736856]">
                          {order.pickupDate ? localizeDemoText(locale, order.pickupDate) : d.pickupFallbackNote}
                        </p>
                      </div>
                      {order.pickupCode && (
                        <div
                          onClick={() => handleCopyCode(order.pickupCode!)}
                          title={d.copyCodeTitle}
                          className="w-full sm:w-auto px-6 py-2 rounded-xl bg-[#FCEBAE] border-2 border-dashed border-[#C9971C] text-xs sm:text-sm font-mono font-black text-[#1F1A12] tracking-widest text-center shadow-xs cursor-pointer hover:bg-[#F5DE91] transition-colors flex items-center justify-center gap-2"
                        >
                          <span>{order.pickupCode}</span>
                          {copiedCode === order.pickupCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-[#7A5B15]" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isShipping && (
                    <div className="rounded-2xl p-4 sm:p-5 mt-4 bg-[#FFF8E7] border border-[#EED79D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                          {d.shippingHelpTitle}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#736856]">
                          {d.shippingHelpBody}
                        </p>
                      </div>
                      <a
                        href={daniaWaLink(fmt(d.waOrderTemplate, { orderId: order.orderCode || order.id, items: order.items.map((i) => `${i.name} (${i.quantity || 1}x)`).join(', ') }))}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:brightness-105 text-white text-xs font-bold shadow-sm transition-all text-center shrink-0"
                      >
                        {d.contactDania}
                      </a>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="rounded-2xl p-4 sm:p-5 mt-4 bg-[#F2F8F1] border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-emerald-900">
                          {d.completedTitle}
                        </p>
                        <p className="text-[11px] sm:text-xs text-emerald-700">
                          {d.completedBody}
                        </p>
                      </div>
                      <a
                        href={withBase("/store")}
                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors text-center cursor-pointer"
                      >
                        {d.buyChekiAgain}
                      </a>
                    </div>
                  )}

                  {order.stepper && (
                    <div className="mt-4 pt-3 border-t border-[#1F1A12]/8">
                      <button
                        type="button"
                        onClick={() => toggleStepper(order.id)}
                        className="flex items-center justify-between w-full text-xs font-semibold text-[#8C6A1C] hover:text-[#C9971C] transition-colors cursor-pointer py-1"
                      >
                        <span>{d.viewOrderFlow}</span>
                        {order.isStepperExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#8C6A1C]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#8C6A1C]" />
                        )}
                      </button>

                      {order.isStepperExpanded && (
                        <div className="pt-4 pb-2 px-2 sm:px-6">
                          <div className="relative flex items-center justify-between">
                            <div className="absolute top-2 left-3 right-3 h-0.5 bg-[#D8CCA9] -z-0">
                              <div
                                className="h-full bg-[#B08A36] transition-all duration-300"
                                style={{
                                  width: `${
                                    (order.stepper.filter((s) => s.completed).length - 1) *
                                    (100 / Math.max(1, order.stepper.length - 1))
                                  }%`,
                                }}
                              ></div>
                            </div>

                            {order.stepper.map((step, stepIdx) => (
                              <div
                                key={stepIdx}
                                className="relative z-10 flex flex-col items-center text-center"
                                style={{ width: `${100 / Math.max(1, order.stepper!.length)}%` }}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                                    step.completed
                                      ? 'bg-[#B08A36] ring-4 ring-[#FAF3DF]'
                                      : 'bg-white border-2 border-[#B08A36] ring-4 ring-transparent'
                                  }`}
                                >
                                  {step.completed && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] sm:text-xs mt-2 leading-tight ${
                                    step.completed
                                      ? 'font-bold text-[#1F1A12]'
                                      : 'font-normal text-[#8A7F6C]'
                                  }`}
                                >
                                  {stepperLabel(step.label)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
