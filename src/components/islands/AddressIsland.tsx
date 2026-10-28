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
import { cartItems, clearCart } from '../../stores/cartStore';
import {
  MapPin,
  X,
  QrCode,
  Check,
  Edit2,
  Trash2
} from 'lucide-react';
import AddressModal, { type AddressFormData } from './AddressModal';
import { formatRupiah, usdToIdr } from '../../lib/format';

interface CheckoutItem {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  quantity: number;
  image: string;
}

const DEFAULT_CHECKOUT_ITEMS: CheckoutItem[] = [
  {
    id: 'faril-cheki',
    name: 'Faril',
    subtitle: 'Muse of Melpomene',
    price: 80000,
    quantity: 1,
    image: '/images/members/faril.webp',
  },
  {
    id: 'mine-cheki',
    name: 'Mine',
    subtitle: 'Muse of Terpsichore',
    price: 80000,
    quantity: 1,
    image: '/images/members/mine.webp',
  },
];

export default function AddressIsland() {
  const user = useStore(currentUser);
  const cart = useStore(cartItems);

  const [items, setItems] = useState<CheckoutItem[]>(() => {
    if (cart && cart.length > 0) {
      return cart.map((c, idx) => ({
        id: `cart-${c.id}-${idx}`,
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
  const [shippingFee] = useState(5000);
  const [platformFee] = useState(0);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const addresses = user?.addresses || [
    {
      id: 'addr_default',
      label: 'Rumah',
      recipientName: user?.name || 'Aulia Rahma',
      phone: user?.phone || '081234567890',
      street: 'Jl. Melpomene No. 18',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40123',
      isDefault: true,
    },
  ];

  const selectedAddress =
    addresses.find((a) => a.id === user?.selectedAddressId) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0];

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shippingFee + platformFee;

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

  const handlePlaceOrder = () => {
    const orderNumber = 'INV-20261021-0042';
    const orderData = {
      orderId: orderNumber,
      date: new Date().toLocaleString('id-ID'),
      items: items.map((i) => ({
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
      notes,
      address: selectedAddress,
      paymentMethod: 'qris',
    };

    try {
      sessionStorage.setItem('muse_active_payment', JSON.stringify(orderData));
      localStorage.setItem('muse_active_payment', JSON.stringify(orderData));

      const existingOrdersRaw = localStorage.getItem('muses_user_orders');
      const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
      const newOrderEntry = {
        id: `MSE-${orderNumber}`,
        orderCode: `MSE-${orderNumber}`,
        title: items.map((i) => `${i.name} (${i.quantity}x)`).join(', '),
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        pickupTime: '23:59:59',
        price: formatRupiah(total),
        numericPrice: total,
        totalPrice: total,
        status: 'unpaid',
        statusLabel: 'Menunggu pembayaran',
        badgeColor: 'border-[#DFC478] bg-[#FDF6E2] text-[#8C6A1C]',
        eventTag: 'OFFICIAL STORE • MERCH',
        deliveryInfo: `${selectedAddress?.city || 'Bandung'} • Kurir JNE Regular`,
        location: `${selectedAddress?.city || 'Bandung'} • Kurir JNE Regular`,
        actionType: 'unpaid',
        initialCountdownSeconds: 180,
        pickupLocation: 'Ambil cheki di venue event',
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          role: i.subtitle,
          variant: i.subtitle || 'Official Merchandise',
          qty: i.quantity,
          quantity: i.quantity,
          price: i.price,
          image: i.image || '/images/members/faril.webp',
        })),
        stepper: [
          { label: 'Menunggu Pembayaran', completed: false },
          { label: 'Dibayar', completed: false },
          { label: 'Disiapkan Management', completed: false },
          { label: 'Dalam Pengiriman (JNE)', completed: false },
          { label: 'Selesai', completed: false },
        ],
        isStepperExpanded: true,
      };

      existingOrders.unshift(newOrderEntry);
      localStorage.setItem('muses_user_orders', JSON.stringify(existingOrders));
      clearCart();
    } catch (e) {
      console.error('Failed to store order in local storage', e);
    }

    window.location.href = withBase('/payment');
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
                Alamat
              </h2>
              {addresses.length === 0 ? (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-1.5 rounded-full border border-[#C9971C] text-[#C9971C] hover:bg-[#FFFBF0] text-xs font-semibold transition-colors cursor-pointer"
                >
                  + Tambah Alamat
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
                        {selectedAddress.label}
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
                      Ubah
                    </button>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsPickerModalOpen(true)}
                        className="px-4 py-1.5 rounded-xl bg-[#E5DFD5]/60 hover:bg-[#E5DFD5] text-[#1F1A12] text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Pilih Lain
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-[#DFC478]/50 rounded-2xl bg-[#FFFDF7]">
                <MapPin className="w-8 h-8 text-[#8C6A1C] mx-auto mb-2 opacity-60" />
                <p className="text-xs text-[#6E6453] mb-3">
                  Kamu belum memiliki alamat pengiriman tersimpan.
                </p>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-5 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-[#1F1A12] font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Tambah Alamat Baru
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
                Pesanan
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-[#8C6A1C] hover:underline font-semibold cursor-pointer"
              >
                + Tambah
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
                      aria-label="Kurangi jumlah"
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
                      aria-label="Tambah jumlah"
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
              Metode pembayaran
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
                    Gopay, OVO, ShopeePay, DANA, BCA Mobile, Livin, dll
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-[#FDF3D6] border border-[#EBD6A2] rounded-3xl p-6 sm:p-7 shadow-sm sticky top-28 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
              Ringkasan
            </h2>

            <div className="space-y-2 text-xs sm:text-sm text-[#70644D]">
              <div className="flex justify-between items-center">
                <span>Subtotal Produk</span>
                <span className="font-semibold text-[#1F1A12]">
                  {formatRupiah(subtotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biaya Pengiriman</span>
                <span className="font-semibold text-[#1F1A12]">
                  {formatRupiah(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biaya Layanan & Asuransi</span>
                <span className="font-semibold text-[#1F1A12]">-</span>
              </div>
            </div>

            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan"
                className="w-full h-24 bg-white rounded-2xl p-3.5 text-xs text-[#1F1A12] placeholder-[#A3977F] border border-[#EBD6A2]/60 focus:outline-none focus:border-[#C9971C] resize-none"
              />
            </div>

            <div className="pt-2 flex justify-between items-baseline">
              <span className="text-base font-bold text-[#1F1A12]">
                Total harga
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                {formatRupiah(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] hover:brightness-105 text-[#1F1A12] font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer text-center"
            >
              Pesan
            </button>
          </div>
        </div>
      </div>

      <AddressModal
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
                Pilih Alamat Pengiriman
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
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] text-[#7A6E58] bg-[#F3EEE3] px-1.5 py-0.5 rounded-sm">
                            Utama
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
                        title="Edit Alamat"
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
                          title="Hapus Alamat"
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
                + Tambah Alamat Baru
              </button>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#E5DFD5]/60 hover:bg-[#E5DFD5] text-[#1F1A12] text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
