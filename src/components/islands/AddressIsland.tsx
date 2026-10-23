import React, { useState, useEffect } from 'react';
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
    image: '/images/members/portrait_purple.png',
  },
  {
    id: 'mine-cheki',
    name: 'Mine',
    subtitle: 'Muse of Terpsichore',
    price: 80000,
    quantity: 1,
    image: '/images/members/portrait_yellow.png',
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
        image: c.image || '/images/members/portrait_purple.png',
      }));
    }
    return DEFAULT_CHECKOUT_ITEMS;
  });

  const [notes, setNotes] = useState('');
  const [shippingFee] = useState(5000);
  const [platformFee] = useState(0);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [modalLabel, setModalLabel] = useState('Rumah');
  const [modalRecipient, setModalRecipient] = useState(user?.name || 'Aulia Rahma');
  const [modalPhone, setModalPhone] = useState(user?.phone?.replace(/^\+62\s*/, '') || '812 3456 7890');
  const [modalStreet, setModalStreet] = useState('Jl. Melpomene No. 18');
  const [modalCity, setModalCity] = useState('Bandung');
  const [modalProvince, setModalProvince] = useState('Jawa Barat');
  const [modalPostalCode, setModalPostalCode] = useState('40123');
  const [modalIsDefault, setModalIsDefault] = useState(true);

  const addresses = user?.addresses || [
    {
      id: 'addr_default',
      label: 'Rumah',
      recipientName: user?.name || 'Aulia Rahma',
      phone: user?.phone || '+62 812 3456 7890',
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
      image: '/images/members/portrait_blue.png',
    };
    setItems((prev) => [...prev, nextItem]);
  };

  const openAddModal = () => {
    setEditingAddressId(null);
    setModalLabel('Rumah');
    setModalRecipient(user?.name || '');
    setModalPhone(user?.phone?.replace(/^\+62\s*/, '') || '');
    setModalStreet('');
    setModalCity('Bandung');
    setModalProvince('Jawa Barat');
    setModalPostalCode('');
    setModalIsDefault(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setModalLabel(addr.label);
    setModalRecipient(addr.recipientName);
    setModalPhone(addr.phone.replace(/^\+62\s*/, ''));
    setModalStreet(addr.street);
    setModalCity(addr.city);
    setModalProvince(addr.province);
    setModalPostalCode(addr.postalCode);
    setModalIsDefault(addr.isDefault);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = modalPhone.startsWith('+62') ? modalPhone : `+62 ${modalPhone.trim()}`;

    if (editingAddressId) {
      updateUserAddress(editingAddressId, {
        label: modalLabel,
        recipientName: modalRecipient,
        phone: formattedPhone,
        street: modalStreet,
        city: modalCity,
        province: modalProvince,
        postalCode: modalPostalCode,
        isDefault: modalIsDefault,
      });
    } else {
      addUserAddress({
        label: modalLabel,
        recipientName: modalRecipient,
        phone: formattedPhone,
        street: modalStreet,
        city: modalCity,
        province: modalProvince,
        postalCode: modalPostalCode,
        isDefault: modalIsDefault,
      });
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
        price: 'Rp 175.000',
        numericPrice: 175000,
        status: 'unpaid',
        statusLabel: 'Menunggu pembayaran',
        badgeColor: 'border-[#DFC478] bg-[#FDF6E2] text-[#8C6A1C]',
        location: 'Pengiriman Kurir JNE Regular',
        items: items.map((i) => ({
          name: i.name,
          role: i.subtitle,
          qty: i.quantity,
          price: `Rp ${(i.price * i.quantity).toLocaleString('id-ID')}`,
        })),
        pickupCode: 'MSE-INV42',
      };
      localStorage.setItem('muses_user_orders', JSON.stringify([newOrderEntry, ...existingOrders]));
      clearCart();
    } catch (e) {
      console.error(e);
    }

    window.location.href = '/payment';
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
                  {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                </p>
                <div className="pt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedAddress)}
                    className="text-[#9A7420] hover:underline font-medium text-[11px] cursor-pointer"
                  >
                    Ubah Alamat
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="text-[#6E6453] hover:text-[#1F1A12] font-medium text-[11px] cursor-pointer"
                  >
                    Pilih Alamat Lain ({addresses.length})
                  </button>
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

              <div className="bg-[#FCEBAE] border border-[#DFC377] rounded-full px-2.5 py-1 flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full border border-[#7A5B15]/40 flex items-center justify-center text-xs font-bold text-[#7A5B15] opacity-50">
                  -
                </span>
                <span className="text-xs font-bold text-[#1F1A12] min-w-3 text-center">
                  1
                </span>
                <span className="w-5 h-5 rounded-full border border-[#7A5B15]/40 flex items-center justify-center text-xs font-bold text-[#7A5B15] opacity-50">
                  +
                </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#FCFAF5] border border-[#DFC478]/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1A12]/10 mb-4">
              <h3 className="text-base font-bold text-[#1F1A12]">
                {editingAddressId ? 'Ubah Alamat Pengiriman' : 'Kelola Alamat Pengiriman'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-[#6E6453] hover:text-[#1F1A12] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingAddressId && addresses.length > 0 && (
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-[#6E6453] uppercase tracking-wider block">
                  Pilih Alamat Tersimpan
                </span>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => {
                      setSelectedAddress(addr.id);
                      setIsAddressModalOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between ${
                      selectedAddress?.id === addr.id
                        ? 'border-[#C9971C] bg-[#FDF9ED]'
                        : 'border-[#1F1A12]/10 bg-white hover:bg-[#FAF6EC]'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-[#1F1A12] flex items-center gap-1.5">
                        <span>{addr.recipientName}</span>
                        <span className="text-[10px] text-[#8C6A1C] bg-[#FAF2DA] px-2 py-0.5 rounded-full">
                          {addr.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6E6453] mt-0.5">
                        {addr.street}, {addr.city}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(addr);
                        }}
                        className="p-1 hover:text-[#9A7420]"
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
                          className="p-1 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <span className="text-[11px] font-bold text-[#6E6453] uppercase tracking-wider block">
                {editingAddressId ? 'Edit Data Alamat' : 'Atau Tambah Baru'}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#6E6453] mb-1">Label Alamat</label>
                  <input
                    type="text"
                    value={modalLabel}
                    onChange={(e) => setModalLabel(e.target.value)}
                    placeholder="Rumah / Kantor"
                    className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-xl px-3 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6E6453] mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    value={modalRecipient}
                    onChange={(e) => setModalRecipient(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-xl px-3 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6E6453] mb-1">Nomor WhatsApp / HP</label>
                <div className="flex items-center">
                  <span className="bg-[#FAF2DA] border border-r-0 border-[#1F1A12]/15 rounded-l-xl px-2.5 py-2 text-xs font-mono text-[#8C6A1C]">
                    +62
                  </span>
                  <input
                    type="tel"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    placeholder="812 3456 7890"
                    className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-r-xl px-3 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6E6453] mb-1">Alamat Lengkap</label>
                <textarea
                  value={modalStreet}
                  onChange={(e) => setModalStreet(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                  className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-xl p-3 text-[#1F1A12] focus:outline-none resize-none h-18"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-[#6E6453] mb-1">Kota</label>
                  <input
                    type="text"
                    value={modalCity}
                    onChange={(e) => setModalCity(e.target.value)}
                    className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-xl px-2.5 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6E6453] mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={modalProvince}
                    onChange={(e) => setModalProvince(e.target.value)}
                    className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-xl px-2.5 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#6E6453] mb-1">Kode Pos</label>
                  <input
                    type="text"
                    value={modalPostalCode}
                    onChange={(e) => setModalPostalCode(e.target.value)}
                    className="w-full bg-white border border-[#1F1A12]/15 focus:border-[#C9971C] rounded-xl px-2.5 py-2 text-[#1F1A12] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1F1A12]/10">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#6E6453] hover:text-[#1F1A12] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#C9971C] hover:bg-[#B08A36] text-[#FCFAF5] font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  Simpan Alamat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
