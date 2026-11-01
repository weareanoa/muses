import React, { useState, useEffect } from 'react';
import { withBase } from '../../lib/paths';
import { useStore } from '@nanostores/react';
import {
  currentUser,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setSelectedAddress,
  type UserAddress,
} from '../../stores/authStore';
import { cartItems, clearCart } from '../../stores/cartStore';
import { MapPin, X, QrCode, Edit2, Trash2 } from 'lucide-react';
import AddressModal, { type AddressFormData } from './AddressModal';
import { formatRupiah, usdToIdr } from '../../lib/format';
import { transactionService } from '../../services/transactionService';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { fmt, getDict, localizeAddressLabel, type Locale } from '../../i18n/dictionary';

interface CheckoutItem {
  id: string;
  productId?: string;
  name: string;
  subtitle: string;
  price: number;
  quantity: number;
  image: string;
}

const DEFAULT_CHECKOUT_ITEMS: CheckoutItem[] = [
  {
    id: 'faril-cheki',
    productId: 'faril-cheki',
    name: 'Faril',
    subtitle: 'Muse of Melpomene',
    price: 80000,
    quantity: 1,
    image: '/images/members/faril.webp',
  },
  {
    id: 'mine-cheki',
    productId: 'mine-cheki',
    name: 'Mine',
    subtitle: 'Muse of Terpsichore',
    price: 80000,
    quantity: 1,
    image: '/images/members/mine.webp',
  },
];

function formatPickupDate(event: ScheduleDTO): string {
  const parts = [event.dayName, event.day, event.month, event.year].filter(Boolean);
  if (parts.length >= 3) return parts.join(' ');
  if (event.targetDate) {
    const d = new Date(event.targetDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  }
  return event.title || event.tourName || '';
}

export default function AddressIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).address;
  const user = useStore(currentUser);
  const cart = useStore(cartItems);

  const [items, setItems] = useState<CheckoutItem[]>(() => {
    if (cart && cart.length > 0) {
      return cart.map((c, idx) => ({
        id: `cart-${c.id}-${idx}`,
        productId: c.id,
        name: c.name,
        subtitle: [c.size, c.color].filter(Boolean).join(' • ') || 'Official Merchandise',
        price: c.currency === 'USD' || c.price < 1000 ? usdToIdr(c.price) : c.price,
        quantity: c.quantity || 1,
        image: c.image || '/images/members/faril.webp',
      }));
    }
    return DEFAULT_CHECKOUT_ITEMS;
  });

  const [notes, setNotes] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [events, setEvents] = useState<ScheduleDTO[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const addresses = user?.addresses || [];
  const selectedAddress =
    addresses.find((a) => a.id === user?.selectedAddressId) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;

  useEffect(() => {
    let active = false;
    scheduleService
      .getSchedules()
      .then((res) => {
        if (active) return;
        const list = res.success && res.data ? res.data : scheduleService.getInitialSchedules();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = list.filter((e) => {
          const target = e.targetDate ? new Date(e.targetDate) : null;
          return !target || Number.isNaN(target.getTime()) ? true : target >= today;
        });
        setEvents(upcoming);
        setIsLoadingEvents(false);
      })
      .catch(() => {
        if (!active) {
          setEvents(scheduleService.getInitialSchedules());
          setIsLoadingEvents(false);
        }
      });
    return () => {
      active = true;
    };
  }, []);

  useEffect(() => {
    if (!pickupName && (user?.name || selectedAddress?.recipientName)) {
      setPickupName(user?.name || selectedAddress?.recipientName || '');
    }
    if (!pickupPhone && (user?.phone || selectedAddress?.phone)) {
      setPickupPhone(user?.phone || selectedAddress?.phone || '');
    }
  }, [user, selectedAddress]);

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CheckoutItem[]
    );
  };

  const handleAddItem = () => {
    const nextItem: CheckoutItem = {
      id: `item-${Date.now()}`,
      productId: 'vely-cheki',
      name: 'Stella',
      subtitle: 'Muse of Urania',
      price: 80000,
      quantity: 1,
      image: '/images/members/vely.webp',
    };
    setItems((prev) => [...prev, nextItem]);
  };

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
    setErrorMsg('');
    if (fulfillmentMethod === 'delivery' && !selectedAddress) {
      setErrorMsg(d.errNoAddress);
      return;
    }
    const chosenEvent = events.find((e) => e.id === selectedEventId);
    if (fulfillmentMethod === 'pickup') {
      if (!chosenEvent) {
        setErrorMsg(d.errNoEvent);
        return;
      }
      if (!pickupName.trim() || !pickupPhone.trim()) {
        setErrorMsg(d.errNoContact);
        return;
      }
    }

    setIsSubmitting(true);
    const res = await transactionService.createTransaction({
      userId: user?.id,
      items: items.map((i) => ({
        id: i.productId || i.id,
        name: i.name,
        subtitle: i.subtitle,
        quantity: i.quantity,
        price: i.price,
        image: i.image,
      })),
      subtotal,
      shippingFee: 0,
      platformFee: 0,
      total,
      notes,
      address: fulfillmentMethod === 'delivery' ? selectedAddress : undefined,
      paymentMethod: 'qris',
      fulfillment:
        fulfillmentMethod === 'pickup' && chosenEvent
          ? {
              method: 'pickup',
              pickupEventId: chosenEvent.id,
              pickupEventTitle: chosenEvent.tourName || chosenEvent.title,
              pickupDate: formatPickupDate(chosenEvent),
              pickupLocation: [chosenEvent.venue, chosenEvent.city].filter(Boolean).join(', '),
              pickupContactName: pickupName.trim(),
              pickupContactPhone: pickupPhone.trim(),
            }
          : { method: 'delivery' },
    });

    setIsSubmitting(false);
    if (res.success) {
      clearCart();
      window.location.href = withBase('/payment');
    } else {
      setErrorMsg(
        res.error === 'STOCK_INSUFFICIENT'
          ? d.errStock
          : res.error === 'UNKNOWN_PRODUCT'
          ? d.errUnknownProduct
          : d.errOrderFailed
      );
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12] mb-4">
              {d.fulfillmentHeading}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentMethod('delivery')}
                className={`text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                  fulfillmentMethod === 'delivery'
                    ? 'border-[#C9971C] bg-[#FDF6E2]'
                    : 'border-[#E8D49E] bg-white hover:bg-[#FFFBF0]'
                }`}
              >
                <span className="block text-sm font-bold text-[#1F1A12]">
                  {d.deliveryOption}
                </span>
                <span className="block text-xs text-[#6E6453] mt-1 leading-relaxed">
                  {d.deliveryOptionDesc}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentMethod('pickup')}
                className={`text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                  fulfillmentMethod === 'pickup'
                    ? 'border-[#C9971C] bg-[#FDF6E2]'
                    : 'border-[#E8D49E] bg-white hover:bg-[#FFFBF0]'
                }`}
              >
                <span className="block text-sm font-bold text-[#1F1A12]">
                  {d.pickupOption}
                </span>
                <span className="block text-xs text-[#6E6453] mt-1 leading-relaxed">
                  {d.pickupOptionDesc}
                </span>
              </button>
            </div>
          </div>

          {fulfillmentMethod === 'delivery' && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
                  {d.heading}
                </h2>
                {addresses.length === 0 ? (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="px-4 py-1.5 rounded-full border border-[#C9971C] text-[#C9971C] hover:bg-[#FFFBF0] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {d.addAddress}
                  </button>
                ) : null}
              </div>

              {selectedAddress ? (
                <div className="bg-[#FAF2DA] border border-[#E8D49E] rounded-2xl p-5 relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1F1A12]">
                          {selectedAddress.recipientName}
                        </span>
                        <span className="text-xs text-[#8A7F6C]">
                          ({selectedAddress.phone})
                        </span>
                        <span className="text-[10px] text-[#8C6A1C] bg-[#FAF2DA] border border-[#DFC478]/40 px-2 py-0.5 rounded-full font-medium">
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

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(selectedAddress)}
                        className="px-4 py-1.5 rounded-xl border border-[#C9971C] text-[#C9971C] hover:bg-[#FFFBF0] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {d.edit}
                      </button>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setIsPickerModalOpen(true)}
                          className="px-4 py-1.5 rounded-xl bg-[#E5DFD5]/60 hover:bg-[#E5DFD5] text-[#1F1A12] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          {d.chooseOther}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-[#DFC478]/50 rounded-2xl bg-[#FFFDF7]">
                  <MapPin className="w-8 h-8 text-[#8C6A1C] mx-auto mb-2 opacity-60" />
                  <p className="text-xs text-[#6E6453] mb-3">
                    {d.noAddressText}
                  </p>
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="px-5 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-[#1F1A12] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    {d.addNewAddress}
                  </button>
                </div>
              )}
            </div>
          )}

          {fulfillmentMethod === 'pickup' && (
            <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1A12] mb-4">
                {d.pickupEventHeading}
              </h2>

              {isLoadingEvents ? (
                <p className="text-xs text-[#6E6453]">{d.loadingEvents}</p>
              ) : events.length === 0 ? (
                <p className="text-xs text-[#6E6453] leading-relaxed">
                  {d.pickupNoEvents}
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((e) => {
                    const isSelected = e.id === selectedEventId;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedEventId(e.id)}
                        className={`w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-[#C9971C] bg-[#FDF6E2]'
                            : 'border-[#E8D49E] bg-white hover:bg-[#FFFBF0]'
                        }`}
                      >
                        <span className="block text-sm font-bold text-[#1F1A12]">
                          {e.tourName || e.title}
                        </span>
                        <span className="block text-xs text-[#6E6453] mt-0.5">
                          {formatPickupDate(e)}
                          {e.venue || e.city
                            ? ` • ${[e.venue, e.city].filter(Boolean).join(', ')}`
                            : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <h3 className="text-sm font-bold text-[#1F1A12] mt-6 mb-3">
                {d.pickupContactHeading}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder={d.pickupNamePh}
                  className="w-full rounded-xl border border-[#E9D9AE] bg-[#FCFAF5] px-4 py-3 text-base text-[#1F1A12] outline-none focus:border-[#C9971C]"
                />
                <input
                  type="tel"
                  value={pickupPhone}
                  onChange={(e) => setPickupPhone(e.target.value)}
                  placeholder={d.pickupPhonePh}
                  inputMode="tel"
                  className="w-full rounded-xl border border-[#E9D9AE] bg-[#FCFAF5] px-4 py-3 text-base text-[#1F1A12] outline-none focus:border-[#C9971C]"
                />
              </div>

              <p className="text-xs text-[#6E6453] mt-3 leading-relaxed">
                {d.pickupHint}
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
                {d.ordersHeading}
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[#8C6A1C] hover:underline font-semibold cursor-pointer"
              >
                {d.addItem}
              </button>
            </div>

            <div className="space-y-3.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#FDF6E2] border border-[#E8D49E] rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-xl object-cover object-top border border-black/5 bg-[#F8EFD7]"
                    />
                    <div>
                      <div className="text-sm sm:text-base font-bold text-[#1F1A12]">
                        {item.name}
                      </div>
                      <div className="text-xs text-[#8A7F6C]">
                        {item.subtitle}
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-[#1F1A12] mt-0.5">
                        {formatRupiah(item.price)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FCEBAE] border border-[#DFC377] rounded-full px-2.5 py-1 flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-5 h-5 rounded-full border border-[#7A5B15]/40 flex items-center justify-center text-xs font-bold text-[#7A5B15] hover:bg-[#F8E295] transition-colors cursor-pointer"
                      aria-label={d.decreaseAria}
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-[#1F1A12] min-w-3 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-5 h-5 rounded-full border border-[#7A5B15]/40 flex items-center justify-center text-xs font-bold text-[#7A5B15] hover:bg-[#F8E295] transition-colors cursor-pointer"
                      aria-label={d.increaseAria}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12] mb-4">
              {d.paymentMethod}
            </h2>

            <div className="bg-[#FDF6E2] border border-[#E8D49E] rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-white border border-[#E8D49E] flex items-center justify-center text-[#1F1A12] shrink-0">
                  <QrCode className="w-6 h-6 text-[#1F1A12]" />
                </div>
                <div>
                  <div className="text-sm sm:text-base font-bold text-[#1F1A12]">
                    QRIS
                  </div>
                  <div className="text-xs text-[#8A7F6C]">
                    {d.paymentWallets}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#FDF3D6] border border-[#EBD6A2] rounded-3xl p-6 sm:p-7 shadow-sm sticky top-28 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
              {d.summary}
            </h2>

            <div className="space-y-2 text-xs sm:text-sm text-[#70644D]">
              <div className="flex justify-between items-center">
                <span>{d.subtotalProducts}</span>
                <span className="font-semibold text-[#1F1A12]">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{d.serviceFee}</span>
                <span className="font-semibold text-[#1F1A12]">-</span>
              </div>
            </div>

            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={d.notesPlaceholder}
                className="w-full h-24 bg-white rounded-2xl p-3.5 text-xs text-[#1F1A12] placeholder-[#A3977F] border border-[#EBD6A2]/60 focus:outline-none focus:border-[#C9971C] resize-none"
              />
            </div>

            {fulfillmentMethod === 'delivery' && (
              <div className="rounded-2xl border border-[#BFE8C9] bg-[#EFFAF1] p-4 text-center space-y-2">
                <p className="text-xs text-[#1E7A34]">
                  {d.shippingHelp}
                </p>
                <a
                  href={`https://wa.me/6285121567150?text=${encodeURIComponent(
                    fmt(d.waCheckoutTemplate, {
                      items: items.map((i) => `${i.name} (${i.quantity}x)`).join(', '),
                    })
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-5 py-2.5 rounded-full bg-[#25D366] text-white font-bold text-xs shadow-sm hover:brightness-105 transition-all"
                >
                  {d.contactDania}
                </a>
              </div>
            )}

            <div className="pt-2 flex justify-between items-baseline">
              <span className="text-base font-bold text-[#1F1A12]">
                {d.totalPrice}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                {formatRupiah(total)}
              </span>
            </div>

            {errorMsg && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] hover:brightness-105 text-[#1F1A12] font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer text-center disabled:opacity-60"
            >
              {d.orderButton}
            </button>
          </div>
        </div>
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
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative border border-[#EADBBD] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1A12]/10 mb-4">
              <h3 className="text-base font-bold text-[#1F1A12]">
                {d.pickerTitle}
              </h3>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#6A5E48] transition-colors cursor-pointer"
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
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-[#C9971C] bg-[#FFFDF7] shadow-xs'
                        : 'border-[#E5DFD5] bg-white hover:bg-[#FAF6EC]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-[#1F1A12] flex items-center gap-2">
                        <span>{addr.recipientName}</span>
                        <span className="text-[#8A7F6C] font-normal">({addr.phone})</span>
                        <span className="text-[10px] text-[#8C6A1C] bg-[#FAF2DA] border border-[#DFC478]/40 px-2 py-0.5 rounded-full font-medium">
                          {localizeAddressLabel(locale, addr.label)}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] text-[#7A6E58] bg-[#F3EEE3] px-1.5 py-0.5 rounded-sm">
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

                    <div className="flex items-center gap-1.5 ml-2">
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
                        <Edit2 className="w-3.5 h-3.5" />
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

            <div className="pt-2 flex items-center justify-between border-t border-[#1F1A12]/10">
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
