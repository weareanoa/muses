import React, { useState, useEffect, useCallback } from 'react';
import { Download, RefreshCw, CheckCircle2, ArrowRight, Clock, MessageCircle } from 'lucide-react';
import { withBase } from '../../lib/paths';
import { formatRupiah, formatCountdown } from '../../lib/format';
import { transactionService } from '../../services/transactionService';
import type { TransactionDTO, PaymentSettings } from '../../types/database';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';
import { daniaWaLink } from '../../lib/contact';

const POLL_INTERVAL_MS = 15000;

function resolveAsset(url: string): string {
  return url.startsWith('/') ? withBase(url) : url;
}

export default function PaymentIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).payment;
  const [order, setOrder] = useState<TransactionDTO | null>(null);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [qrFailed, setQrFailed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const loadOrder = useCallback(async (silent = false) => {
    const orderId = new URLSearchParams(window.location.search).get('orderId');
    const res = orderId
      ? await transactionService.getTransaction(orderId)
      : await transactionService.getLatestOpenTransaction();
    if (res.success && res.data) {
      setOrder(res.data);
      setError('');
    } else if (!silent) {
      setError(d.notFound);
    }
    setLoading(false);
  }, [d.notFound]);

  useEffect(() => {
    loadOrder();
    transactionService.getPaymentSettings().then(setSettings);
  }, [loadOrder]);

  useEffect(() => {
    if (order?.status !== 'awaiting_verification') return;
    const timer = setInterval(() => loadOrder(true), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [order?.status, loadOrder]);

  useEffect(() => {
    if (!order?.paymentDeadline || order.status !== 'unpaid') return;
    const deadline = new Date(order.paymentDeadline).getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) loadOrder(true);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order?.paymentDeadline, order?.status, loadOrder]);

  const payable = order?.payableAmount ?? 0;
  const proofLink = order
    ? daniaWaLink(fmt(d.waProofTemplate, { id: order.id, amount: formatRupiah(payable) }))
    : '#';

  const handleClaim = async () => {
    if (!order) return;
    setBusy(true);
    setError('');
    const res = await transactionService.claimPayment(order.id);
    setBusy(false);
    if (res.success && res.data) {
      setOrder(res.data);
      window.open(proofLink, '_blank', 'noreferrer');
      return;
    }
    setError(res.error === 'ORDER_EXPIRED' ? d.errExpired : d.errGeneric);
    loadOrder(true);
  };

  const handleCancel = async () => {
    if (!order) return;
    setBusy(true);
    setError('');
    const res = await transactionService.cancelOrder(order.id);
    setBusy(false);
    if (res.success && res.data) {
      setOrder(res.data);
      return;
    }
    setError(d.errGeneric);
    loadOrder(true);
  };

  if (loading) {
    return <p className="text-sm text-[#6E6453]">{d.loading}</p>;
  }

  if (!order) {
    return (
      <div className="rounded-3xl border border-[#E8D49E] bg-white p-8 text-center space-y-4">
        <p className="text-sm text-[#42392B]">{error || d.notFound}</p>
        <a
          href={withBase('/orders')}
          className="inline-block px-6 py-2.5 rounded-full bg-[#F5DE9B] text-[#3E2F0A] font-semibold text-xs"
        >
          {d.viewHistory}
        </a>
      </div>
    );
  }

  const isUnpaid = order.status === 'unpaid';
  const isAwaiting = order.status === 'awaiting_verification';
  const isPaid = ['processing', 'ready', 'completed'].includes(order.status);
  const isClosed = ['expired', 'rejected', 'cancelled'].includes(order.status);
  const qrUrl = settings?.qrisImageUrl ? resolveAsset(settings.qrisImageUrl) : '';
  const subtotal = order.totalPrice;
  const closedTitle =
    order.status === 'expired'
      ? d.expiredTitle
      : order.status === 'rejected'
        ? d.rejectedTitle
        : d.cancelledTitle;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-[#FDF3D6] border border-[#EBD6A2] rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-sm w-full max-w-sm">
            <div className="bg-[#E5BF58] text-[#3E2F0A] text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#1F1A12]" />
              <span>{isAwaiting ? d.awaitingTitle : isPaid ? d.verifiedTitle : isClosed ? closedTitle : d.waiting}</span>
            </div>

            {isUnpaid && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-[#EBD6A2]/40 mb-4 inline-block">
                {qrUrl && !qrFailed ? (
                  <img
                    src={qrUrl}
                    alt="QRIS"
                    onError={() => setQrFailed(true)}
                    className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                ) : (
                  <p className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-xs text-[#6E6453]">
                    {d.qrisMissing}
                  </p>
                )}
              </div>
            )}

            <div className="w-full space-y-1">
              <p className="text-xs text-[#8A7F6C] font-mono break-all">{fmt(d.orderNo, { id: order.id })}</p>
              <p className="text-xs font-medium text-[#70644D] pt-1">{d.totalPayment}</p>
              <p className="text-2xl sm:text-3xl font-bold text-[#1F1A12]">{formatRupiah(payable)}</p>
              {isUnpaid && (
                <>
                  <p className="text-[11px] text-[#8A7F6C]">{d.exactAmount}</p>
                  <p className="text-[11px] text-[#8A7F6C] flex items-center justify-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5" />
                    {d.timeLeft}{' '}
                    <span className="font-mono font-medium text-[#1F1A12]">{formatCountdown(secondsLeft)}</span>
                  </p>
                </>
              )}
            </div>

            {isUnpaid && (
              <div className="grid grid-cols-1 gap-3 w-full mt-6">
                {qrUrl && !qrFailed && (
                  <a
                    href={qrUrl}
                    download={`QRIS-${order.id}`}
                    className="bg-[#F5DE9B] hover:bg-[#EDD387] text-[#3E2F0A] font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{d.downloadQR}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={busy || secondsLeft === 0}
                  className="bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] text-[#1F1A12] font-bold text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-60"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{d.iHavePaid}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={busy}
                  className="text-xs font-semibold text-[#6E6453] hover:text-[#1F1A12] py-1 cursor-pointer disabled:opacity-60"
                >
                  {d.cancelOrder}
                </button>
              </div>
            )}

            {isAwaiting && (
              <div className="w-full mt-6 space-y-3">
                <p className="text-xs text-[#42392B] leading-relaxed">{d.awaitingBody}</p>
                <a
                  href={proofLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{d.sendProof}</span>
                </a>
                <button
                  type="button"
                  onClick={() => loadOrder(true)}
                  className="w-full text-xs font-semibold text-[#8C6A1C] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{d.refresh}</span>
                </button>
              </div>
            )}

            {isPaid && (
              <div className="w-full mt-6 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#8C6A1C] mx-auto" />
                <p className="text-xs text-[#42392B] leading-relaxed">
                  {fmt(d.verifiedBody, { id: order.id, total: formatRupiah(payable) })}
                </p>
                {order.pickupCode && (
                  <p className="text-xs text-[#42392B]">
                    {d.pickupCodeLabel}:{' '}
                    <span className="font-mono font-bold text-[#1F1A12]">{order.pickupCode}</span>
                  </p>
                )}
                <a
                  href={withBase('/orders')}
                  className="w-full py-3 rounded-full bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] text-[#1F1A12] font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2"
                >
                  <span>{d.viewHistory}</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            )}

            {isClosed && (
              <div className="w-full mt-6 space-y-3">
                <p className="text-xs text-[#42392B] leading-relaxed">
                  {order.status === 'expired' ? d.expiredBody : order.rejectReason ? `${d.reasonLabel}: ${order.rejectReason}` : ''}
                </p>
                <a
                  href={withBase('/store')}
                  className="block w-full py-2.5 rounded-full border border-[#1F1A12]/15 text-[#6E6453] hover:text-[#1F1A12] font-semibold text-xs transition-colors"
                >
                  {d.backToStore}
                </a>
              </div>
            )}

            {error && <p className="text-xs text-red-700 mt-3">{error}</p>}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {isUnpaid && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5 space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">{d.howToPay}</h2>
              <div className="space-y-3.5">
                {[d.step1, d.step2, d.step3].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#856317] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs sm:text-sm text-[#42392B] leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5 space-y-3.5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">{d.summaryTitle}</h2>

            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-start text-xs sm:text-sm">
                  <div>
                    <div className="font-bold text-[#1F1A12]">{item.name}</div>
                    <div className="text-[11px] text-[#8A7F6C]">
                      {item.variant} ({item.quantity}x)
                    </div>
                  </div>
                  <div className="font-bold text-[#1F1A12]">
                    {formatRupiah(item.price * (item.quantity || 1))}
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-[#E8D49E] bg-[#FDF6E2] p-4 space-y-1.5">
                <p className="text-xs font-bold text-[#1F1A12]">{d.fulfillmentTitle}</p>
                {order.fulfillmentMethod === 'pickup' ? (
                  <>
                    <p className="text-xs text-[#42392B]">
                      {d.pickupTitle}: {order.eventTag}
                    </p>
                    <p className="text-xs text-[#42392B]">
                      {order.pickupDate} • {order.pickupLocation}
                    </p>
                    <p className="text-xs text-[#42392B]">
                      {d.pickupContactLabel}: {order.pickupContactName} ({order.pickupContactPhone})
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-[#42392B]">
                      {d.deliveryTitle}: {order.deliveryInfo}
                    </p>
                    <p className="text-xs text-[#42392B]">{d.shippingHelp}</p>
                    <a
                      href={daniaWaLink(
                        fmt(d.waShippingTemplate, {
                          items: order.items.map((i) => `${i.name} (${i.quantity}x)`).join(', '),
                        })
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-1 px-4 py-2 rounded-full bg-[#25D366] text-white font-bold text-[11px] shadow-sm hover:brightness-105 transition-all"
                    >
                      {d.contactDania}
                    </a>
                  </>
                )}
              </div>

              {(order.uniqueCode ?? 0) > 0 && (
                <div className="flex justify-between items-center text-xs sm:text-sm text-[#70644D]">
                  <span>{d.uniqueCode}</span>
                  <span className="font-bold text-[#1F1A12]">{formatRupiah(order.uniqueCode ?? 0)}</span>
                </div>
              )}
            </div>

            <hr className="border-t border-[#DFC478]/50 my-2" />

            <div className="flex justify-between items-center text-sm sm:text-base font-bold text-[#1F1A12]">
              <span>{d.total}</span>
              <span>{formatRupiah(subtotal + (order.uniqueCode ?? 0))}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
