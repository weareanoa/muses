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
        price: Math.round(c.price * 16000),
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
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    postalCode: '',
    street: '',
    detail: '',
    label: 'Rumah',
  });

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
    setEditingAddressId(null);
    setAddressForm({
      recipientName: user?.name || '',
      phone: user?.phone || '',
      province: '',
      city: '',
      district: '',
      postalCode: '',
      street: '',
      detail: '',
      label: 'Rumah',
    });
    setIsAddressModalOpen(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      province: addr.province || '',
      city: addr.city || '',
      district: addr.district || '',
      postalCode: addr.postalCode || '',
      street: addr.street || '',
      detail: addr.detail || '',
      label: addr.label || 'Rumah',
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipientName.trim() || !addressForm.phone.trim()) return;

    const addressData = {
      recipientName: addressForm.recipientName.trim(),
      phone: addressForm.phone.trim(),
      province: addressForm.province.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      postalCode: addressForm.postalCode.trim(),
      street: addressForm.street.trim(),
      detail: addressForm.detail.trim(),
      label: addressForm.label,
      isDefault: !user?.addresses || user.addresses.length === 0,
    };

    if (editingAddressId) {
      updateUserAddress(editingAddressId, addressData);
      setSelectedAddress(editingAddressId);
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
      shippingFee: 10000,
      platformFee: 5000,
      totalRupiah: 175000,
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
        price: `Rp ${total.toLocaleString('id-ID')}`,
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
        pickupCode: `MSE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        shippingCourier: 'JNE Regular',
        trackingNumber: `JNE${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        estimatedArrival: '2 - 3 hari kerja',
        stepper: [
          { label: 'Dibayar', completed: false },
          { label: 'Disiapkan Management', completed: false },
          { label: 'Dalam Pengiriman (JNE)', completed: false },
          { label: 'Selesai', completed: false },
        ],
        isStepperExpanded: false,
      };
      localStorage.setItem('muses_user_orders', JSON.stringify([newOrderEntry, ...existingOrders]));
      clearCart();
    } catch (e) {
      console.error(e);
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
                Alamat pengiriman
              </h2>
              <button
                type="button"
                onClick={openAddModal}
                className="px-4 py-1 rounded-full border border-[#1F1A12]/40 hover:border-[#1F1A12] text-xs font-semibold text-[#1F1A12] transition-colors cursor-pointer"
              >
                + Tambah
              </button>
            </div>

            {selectedAddress ? (
              <div className="space-y-1 text-xs text-[#52493A]">
                <div className="flex items-center gap-2 font-semibold text-[#1F1A12]">
                  <span>{selectedAddress.recipientName}</span>
                  <span className="text-[#8A7F6C]">({selectedAddress.phone})</span>
                  <span className="text-[10px] bg-[#FAF2DA] text-[#8C6A1C] border border-[#DFC478]/50 px-2 py-0.5 rounded-full font-mono">
                    {selectedAddress.label}
                  </span>
                </div>
                <p className="text-[#6E6453]">
                  {selectedAddress.street}
                  {selectedAddress.detail ? `, ${selectedAddress.detail}` : ''}
                  {selectedAddress.district ? `, Kec. ${selectedAddress.district}` : ''}
                  , {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedAddress)}
                    className="text-[#9A7420] hover:underline font-medium text-[11px] cursor-pointer"
                  >
                    Ubah Alamat
                  </button>
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setIsPickerModalOpen(true)}
                      className="text-[#6E6453] hover:text-[#1F1A12] font-medium text-[11px] cursor-pointer"
                    >
                      Pilih Alamat Lain ({addresses.length})
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8A7F6C]">Tambah alamat pengiriman</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-[#1F1A12]/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#1F1A12]">
                Barang
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-1 rounded-full border border-[#1F1A12]/40 hover:border-[#1F1A12] text-xs font-semibold text-[#1F1A12] transition-colors cursor-pointer"
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
                        Rp. {item.price.toLocaleString('id-ID')}
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
                  Rp. {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biaya Pengiriman</span>
                <span className="font-semibold text-[#1F1A12]">
                  Rp. {shippingFee.toLocaleString('id-ID')}
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
                Rp. {total.toLocaleString('id-ID')}
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

      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative border border-[#EADBBD] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1F1A12]">
                {editingAddressId ? 'Ubah Alamat' : 'Tambah Alamat'}
              </h2>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#6A5E48] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <input
                    type="text"
                    placeholder="Nama"
                    value={addressForm.recipientName}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, recipientName: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="No. Telepon"
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <input
                    type="text"
                    placeholder="Provinsi"
                    value={addressForm.province}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, province: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Kota/Kabupaten"
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, city: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <input
                    type="text"
                    placeholder="Kecamatan"
                    value={addressForm.district}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, district: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Kode Pos"
                    value={addressForm.postalCode}
                    onChange={(e) =>
                      setAddressForm((p) => ({ ...p, postalCode: e.target.value }))
                    }
                    required
                    className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                  />
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder="Nama Jalan, Gedung, No. Rumah"
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, street: e.target.value }))
                  }
                  required
                  className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C] resize-none"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Detail lainnya (cont: Blok / Unit / Patokan)"
                  value={addressForm.detail}
                  onChange={(e) =>
                    setAddressForm((p) => ({ ...p, detail: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
                />
              </div>

              <div>
                <div className="text-xs text-[#7A6E58] mb-2 font-medium">
                  Tandai sebagai:
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddressForm((p) => ({ ...p, label: 'Rumah' }))}
                    className={`px-6 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      addressForm.label === 'Rumah'
                        ? 'border-[#C9971C] text-[#C9971C] bg-[#FFFBF0]'
                        : 'border-[#E5DFD5] text-[#7A6E58] hover:border-[#C9971C]/50'
                    }`}
                  >
                    Rumah
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddressForm((p) => ({ ...p, label: 'Kantor' }))}
                    className={`px-6 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      addressForm.label === 'Kantor'
                        ? 'border-[#C9971C] text-[#C9971C] bg-[#FFFBF0]'
                        : 'border-[#E5DFD5] text-[#7A6E58] hover:border-[#C9971C]/50'
                    }`}
                  >
                    Kantor
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-[#1F1A12] font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
