import React, { useState, useEffect } from 'react';
import { withBase } from '../../lib/paths';
import { useStore } from '@nanostores/react';
import {
  currentUser,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setSelectedAddress,
  type UserAddress
} from '../../stores/authStore';
import {
  cartItems,
  clearCart,
  removeFromCart,
  updateQuantity,
} from '../../stores/cartStore';
import {
  MapPin,
  X,
  QrCode,
  Pencil,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react';
import AddressModal, { type AddressFormData } from './AddressModal';
import { formatRupiah, usdToIdr } from '../../lib/format';
import { transactionService } from '../../services/transactionService';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { fmt, getDict, localizeAddressLabel, type Locale } from '../../i18n/dictionary';
import { daniaWaLink } from '../../lib/contact';

function formatEventDate(s: ScheduleDTO): string {
  const parts = [s.dayName, s.day, s.month, s.year].filter(Boolean);
  if (parts.length >= 3) return parts.join(' ');
  if (s.targetDate) {
    const parsed = new Date(s.targetDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }
  return s.title || s.tourName || '';
}

function StepHeading({ step, title, action }: { step: number; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-3">
        <span className="w-7 h-7 rounded-full bg-[#1F1A12] text-[#FDF3D6] text-xs font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const CARD = 'bg-white rounded-2xl p-5 sm:p-7 border border-[#EADFC4] shadow-xs';

export default function AddressIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).address;
  const user = useStore(currentUser);
  const cart = useStore(cartItems);

  const items = cart.map((c) => ({
    key: `${c.id}|${c.size ?? ''}|${c.color ?? ''}`,
    cart: c,
    productId: c.id,
    name: c.name,
    subtitle: [c.size, c.color].filter(Boolean).join(' • '),
    price: c.currency === 'USD' || c.price < 1000 ? usdToIdr(c.price) : c.price,
    quantity: c.quantity || 1,
    image: c.image || '/images/members/faril.webp',
  }));

  const [notes, setNotes] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupEvents, setPickupEvents] = useState<ScheduleDTO[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [orderError, setOrderError] = useState('');
  const [placing, setPlacing] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const addresses = user?.addresses || [];

  const selectedAddress =
    addresses.find((a) => a.id === user?.selectedAddressId) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0];

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    let cancelled = false;
    scheduleService
      .getSchedules()
      .then((res) => {
        if (cancelled) return;
        const all = res.success && res.data ? res.data : scheduleService.getInitialSchedules();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = all.filter((s) => {
          const parsed = s.targetDate ? new Date(s.targetDate) : null;
          if (!parsed || Number.isNaN(parsed.getTime())) return true;
          return parsed >= today;
        });
        setPickupEvents(upcoming);
        setEventsLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPickupEvents(scheduleService.getInitialSchedules());
        setEventsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openAddModal = () => {
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (data: AddressFormData) => {
    const addressData = {
      recipientName: data.recipientName.trim(),
      phone: data.phone.trim(),
      province: data.province.trim(),
      city: data.city.trim(),
      district: data.district.trim(),
      postalCode: data.postalCode.trim(),
      street: data.street.trim(),
      detail: data.detail.trim(),
      label: data.label,
      isDefault: !user?.addresses || user.addresses.length === 0,
    };

    if (editingAddress) {
      updateUserAddress(editingAddress.id, addressData);
      setSelectedAddress(editingAddress.id);
    } else {
      const created = addUserAddress(addressData);
      if (created && created.id) {
        setSelectedAddress(created.id);
      }
    }
    setIsAddressModalOpen(false);
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    if (items.length === 0) return;
    if (fulfillment === 'delivery' && !selectedAddress) {
      setOrderError(d.errNoAddress);
      return;
    }
    const selectedEvent = pickupEvents.find((e) => e.id === selectedEventId);
    if (fulfillment === 'pickup') {
      if (!selectedEvent) {
        setOrderError(d.errNoEvent);
        return;
      }
      if (!pickupName.trim() || !pickupPhone.trim()) {
        setOrderError(d.errNoContact);
        return;
      }
    }
    setPlacing(true);
    const res = await transactionService.createTransaction({
      items: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
      notes,
      address: fulfillment === 'delivery' ? selectedAddress : undefined,
      fulfillment:
        fulfillment === 'pickup' && selectedEvent
          ? {
              method: 'pickup',
              pickupEventId: selectedEvent.id,
              pickupContactName: pickupName.trim(),
              pickupContactPhone: pickupPhone.trim(),
            }
          : { method: 'delivery' },
    });
    setPlacing(false);
    if (!res.success || !res.data) {
      const errors: Record<string, string> = {
        STOCK_INSUFFICIENT: d.errStock,
        UNKNOWN_PRODUCT: d.errUnknownProduct,
        AUTH_REQUIRED: d.errAuth,
        TOO_MANY_OPEN_ORDERS: d.errTooManyOpen,
        ORDER_COOLDOWN: d.errCooldown,
        QTY_LIMIT: d.errQtyLimit,
        INVALID_CONTACT: d.errNoContact,
        INVALID_ADDRESS: d.errNoAddress,
        INVALID_EVENT: d.errNoEvent,
        EVENT_PASSED: d.errNoEvent,
        GATEWAY_NOT_READY: d.errGateway,
        INVALID_ITEMS: d.errUnknownProduct,
        UNAVAILABLE: d.errUnavailable,
      };
      setOrderError(errors[res.error || ''] || d.errOrderFailed);
      return;
    }
    clearCart();
    window.location.href = withBase(`/payment?orderId=${encodeURIComponent(res.data.id)}`);
  };

  const optionClass = (active: boolean) =>
    `text-left rounded-xl border p-4 transition-colors cursor-pointer ${
      active ? 'border-[#C9971C] bg-[#FDF6E2] ring-1 ring-[#C9971C]' : 'border-[#E8D9B5] bg-white hover:bg-[#FFFBF0]'
    }`;

  const inputClass =
    'w-full rounded-xl border border-[#E9D9AE] bg-[#FCFAF5] px-4 py-3 text-base text-[#1F1A12] outline-none focus:border-[#C9971C]';

  if (items.length === 0) {
    return (
      <div className={`${CARD} flex flex-col items-center text-center py-16`}>
        <ShoppingBag className="w-10 h-10 text-[#C9971C]/70 mb-4" />
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.emptyCartTitle}</h2>
        <p className="text-sm text-[#6E6453] mt-1.5 mb-6 max-w-sm">{d.emptyCartBody}</p>
        <a
          href={withBase('/store')}
          className="px-7 py-3 rounded-full bg-muses-gradient hover:brightness-105 text-[#1F1A12] text-sm font-bold shadow-md transition-all"
        >
          {d.browseStore}
        </a>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-7 space-y-5">
          <section className={CARD}>
            <StepHeading step={1} title={d.fulfillmentHeading} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setFulfillment('delivery')} className={optionClass(fulfillment === 'delivery')}>
                <span className="block text-sm font-bold text-[#1F1A12]">{d.deliveryOption}</span>
                <span className="block text-xs text-[#6E6453] mt-1 leading-relaxed">{d.deliveryOptionDesc}</span>
              </button>
              <button type="button" onClick={() => setFulfillment('pickup')} className={optionClass(fulfillment === 'pickup')}>
                <span className="block text-sm font-bold text-[#1F1A12]">{d.pickupOption}</span>
                <span className="block text-xs text-[#6E6453] mt-1 leading-relaxed">{d.pickupOptionDesc}</span>
              </button>
            </div>

            {fulfillment === 'delivery' && (
              <div className="mt-6 pt-6 border-t border-[#EFE5CC]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-[#1F1A12]">{d.heading}</h3>
                  {selectedAddress && (
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => openEditModal(selectedAddress)}
                        className="text-[#C9971C] hover:text-[#9A7420] cursor-pointer"
                      >
                        {d.edit}
                      </button>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsPickerModalOpen(true)}
                          className="text-[#6E6453] hover:text-[#1F1A12] cursor-pointer"
                        >
                          {d.chooseOther}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {selectedAddress ? (
                  <div className="rounded-xl border border-[#E8D9B5] bg-[#FFFBF0] p-4 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[#8C6A1C] mt-0.5 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#1F1A12]">{selectedAddress.recipientName}</span>
                        <span className="text-xs text-[#6E6453]">{selectedAddress.phone}</span>
                        <span className="text-[10px] font-semibold text-[#7A5B15] bg-[#FAF2DA] px-2 py-0.5 rounded-md">
                          {localizeAddressLabel(locale, selectedAddress.label)}
                        </span>
                      </div>
                      <p className="text-xs text-[#6E6453] leading-relaxed">
                        {selectedAddress.street}
                        {selectedAddress.detail ? `, ${selectedAddress.detail}` : ''}
                        {selectedAddress.district ? `, Kec. ${selectedAddress.district}` : ''}
                        , {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-[#DFC478]/60 rounded-xl bg-[#FFFDF7]">
                    <MapPin className="w-7 h-7 text-[#8C6A1C] mx-auto mb-2 opacity-60" />
                    <p className="text-xs text-[#6E6453] mb-3">{d.noAddressText}</p>
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="px-5 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-[#1F1A12] font-bold text-xs transition-colors cursor-pointer"
                    >
                      {d.addNewAddress}
                    </button>
                  </div>
                )}
              </div>
            )}

            {fulfillment === 'pickup' && (
              <div className="mt-6 pt-6 border-t border-[#EFE5CC]">
                <h3 className="text-sm font-bold text-[#1F1A12] mb-3">{d.pickupEventHeading}</h3>
                {eventsLoading ? (
                  <p className="text-xs text-[#6E6453]">{d.loadingEvents}</p>
                ) : pickupEvents.length === 0 ? (
                  <p className="text-xs text-[#6E6453] leading-relaxed">{d.pickupNoEvents}</p>
                ) : (
                  <div className="space-y-2.5">
                    {pickupEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`w-full ${optionClass(ev.id === selectedEventId)}`}
                      >
                        <span className="block text-sm font-bold text-[#1F1A12]">{ev.tourName || ev.title}</span>
                        <span className="block text-xs text-[#6E6453] mt-0.5">
                          {formatEventDate(ev)}
                          {ev.venue || ev.city ? ` • ${[ev.venue, ev.city].filter(Boolean).join(', ')}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <h3 className="text-sm font-bold text-[#1F1A12] mt-6 mb-3">{d.pickupContactHeading}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={pickupName}
                    onChange={(e) => setPickupName(e.target.value)}
                    placeholder={d.pickupNamePh}
                    className={inputClass}
                  />
                  <input
                    value={pickupPhone}
                    onChange={(e) => setPickupPhone(e.target.value)}
                    placeholder={d.pickupPhonePh}
                    inputMode="tel"
                    className={inputClass}
                  />
                </div>
                <p className="text-xs text-[#6E6453] mt-3 leading-relaxed">{d.pickupHint}</p>
              </div>
            )}
          </section>

          <section className={CARD}>
            <StepHeading
              step={2}
              title={d.ordersHeading}
              action={
                <a
                  href={withBase('/store')}
                  className="text-xs font-semibold text-[#8C6A1C] hover:text-[#C9971C] transition-colors"
                >
                  {d.addItem}
                </a>
              }
            />

            <ul className="divide-y divide-[#EFE5CC]">
              {items.map((item) => (
                <li key={item.key} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                  <img
                    src={withBase(item.image)}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover object-top border border-black/5 bg-[#F8EFD7] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-bold text-[#1F1A12] truncate">{item.name}</div>
                    {item.subtitle && <div className="text-xs text-[#8A7F6C] truncate">{item.subtitle}</div>}
                    <div className="text-sm text-[#6E6453] mt-1">{formatRupiah(item.price)}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="inline-flex items-center rounded-full border border-[#E3D3A5] bg-[#FFFBF0]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cart.id, item.quantity - 1, item.cart.size, item.cart.color)}
                        className="w-8 h-8 flex items-center justify-center text-[#7A5B15] hover:text-[#1F1A12] cursor-pointer"
                        aria-label={d.decreaseAria}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-bold text-[#1F1A12] min-w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cart.id, item.quantity + 1, item.cart.size, item.cart.color)}
                        className="w-8 h-8 flex items-center justify-center text-[#7A5B15] hover:text-[#1F1A12] cursor-pointer"
                        aria-label={d.increaseAria}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cart.id, item.cart.size, item.cart.color)}
                      className="inline-flex items-center gap-1 text-[11px] text-[#8A7F6C] hover:text-rose-600 transition-colors cursor-pointer"
                      aria-label={d.removeItemAria}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{d.removeItemAria}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={CARD}>
            <StepHeading step={3} title={d.paymentMethod} />
            <div className="rounded-xl border border-[#E8D9B5] bg-[#FFFBF0] p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#E8D9B5] flex items-center justify-center shrink-0">
                <QrCode className="w-6 h-6 text-[#1F1A12]" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-[#1F1A12]">QRIS</div>
                <div className="text-xs text-[#8A7F6C]">{d.paymentWallets}</div>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-5">
          <div className="bg-[#FDF3D6] border border-[#EBD6A2] rounded-2xl p-5 sm:p-7 shadow-sm lg:sticky lg:top-28 space-y-5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">{d.summary}</h2>

            <div className="space-y-2 text-sm text-[#70644D]">
              <div className="flex justify-between">
                <span>{d.subtotalProducts} ({itemCount})</span>
                <span className="font-semibold text-[#1F1A12]">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>{d.serviceFee}</span>
                <span className="font-semibold text-[#1F1A12]">-</span>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={d.notesPlaceholder}
              className="w-full h-20 bg-white rounded-xl p-3.5 text-sm text-[#1F1A12] placeholder-[#A3977F] border border-[#EBD6A2]/70 focus:outline-none focus:border-[#C9971C] resize-none"
            />

            {fulfillment === 'delivery' && (
              <div className="rounded-xl border border-[#BFE8C9] bg-[#EFFAF1] p-4 space-y-3">
                <p className="text-xs text-[#1E7A34] leading-relaxed">{d.shippingHelp}</p>
                <a
                  href={daniaWaLink(fmt(d.waCheckoutTemplate, { items: items.map((i) => `${i.name} (${i.quantity}x)`).join(', ') }))}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2 rounded-full bg-[#25D366] text-white font-bold text-xs hover:brightness-105 transition-all"
                >
                  {d.contactDania}
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-[#EBD6A2] flex justify-between items-baseline">
              <span className="text-base font-bold text-[#1F1A12]">{d.totalPrice}</span>
              <span className="text-2xl font-bold text-[#1F1A12]">{formatRupiah(total)}</span>
            </div>

            {orderError && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {orderError}
              </p>
            )}

            {!user ? (
              <a
                href={withBase('/login?redirect=/checkout')}
                className="w-full block text-center py-3.5 rounded-full bg-muses-gradient hover:brightness-105 text-[#1F1A12] font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer"
              >
                Masuk untuk Melanjutkan Checkout
              </a>
            ) : (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing}
                className="w-full py-3.5 rounded-full bg-muses-gradient hover:brightness-105 text-[#1F1A12] font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                {placing ? 'Memproses Pesanan...' : d.orderButton}
              </button>
            )}
          </div>
        </aside>
      </div>

      <AddressModal
        locale={locale}
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />

      {isPickerModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-[#EADBBD]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1A12]/10 mb-4">
              <h3 className="text-base font-bold text-[#1F1A12]">{d.pickerTitle}</h3>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#6A5E48] transition-colors cursor-pointer"
                aria-label={d.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 mb-4">
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr.id);
                      setIsPickerModalOpen(false);
                    }}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-start justify-between ${
                      isSelected
                        ? 'border-[#C9971C] bg-[#FFFDF7] ring-1 ring-[#C9971C]'
                        : 'border-[#E5DFD5] bg-white hover:bg-[#FAF6EC]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-[#1F1A12] flex flex-wrap items-center gap-2">
                        <span>{addr.recipientName}</span>
                        <span className="text-[#8A7F6C] font-normal">{addr.phone}</span>
                        <span className="text-[10px] text-[#7A5B15] bg-[#FAF2DA] px-2 py-0.5 rounded-md font-semibold">
                          {localizeAddressLabel(locale, addr.label)}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[10px] text-white bg-[#C9971C] px-2 py-0.5 rounded-md font-semibold">
                            {d.defaultBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6E6453] leading-relaxed">
                        {addr.street}
                        {addr.detail ? `, ${addr.detail}` : ''}
                        {addr.district ? `, Kec. ${addr.district}` : ''}
                        , {addr.city}, {addr.province} {addr.postalCode}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPickerModalOpen(false);
                          openEditModal(addr);
                        }}
                        className="p-1.5 hover:text-[#9A7420] text-[#7A6E58] transition-colors cursor-pointer"
                        title={d.editAddressTitle}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteUserAddress(addr.id);
                          }}
                          className="p-1.5 hover:text-red-500 text-[#7A6E58] transition-colors cursor-pointer"
                          title={d.deleteAddressTitle}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-[#1F1A12]/10">
              <button
                type="button"
                onClick={() => {
                  setIsPickerModalOpen(false);
                  openAddModal();
                }}
                className="px-4 py-2 rounded-xl border border-[#C9971C] text-[#C9971C] hover:bg-[#FFFBF0] text-xs font-semibold transition-colors cursor-pointer"
              >
                {d.addNewAddress}
              </button>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#E5DFD5]/60 hover:bg-[#E5DFD5] text-[#1F1A12] text-xs font-semibold transition-colors cursor-pointer"
              >
                {d.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
