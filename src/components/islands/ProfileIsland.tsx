import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentUser,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  type User,
  type UserAddress
} from '../../stores/authStore';
import {
  User as UserIcon,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  ArrowRight,
  Camera
} from 'lucide-react';
import { withBase } from '../../lib/paths';

type TabType = 'profile' | 'alamat' | 'orders';
type OrderFilter = 'all' | 'unpaid' | 'processing' | 'completed';

interface OrderItem {
  name: string;
  variant: string;
  image: string;
  quantity?: number;
  price: number;
}

interface StepperStep {
  label: string;
  completed: boolean;
}

interface ProfileOrder {
  id: string;
  orderCode: string;
  date: string;
  status: 'unpaid' | 'processing' | 'completed';
  statusLabel: string;
  eventTag: string;
  items: OrderItem[];
  deliverySummary: string;
  totalPrice: number;
  pickupInfo?: {
    location: string;
    note: string;
    code: string;
  };
  shippingInfo?: {
    courier: string;
    trackingNumber: string;
  };
  countdownSeconds?: number;
  completedMessage?: {
    title: string;
    subtitle: string;
  };
  stepper: StepperStep[];
}

const DEFAULT_ORDERS: ProfileOrder[] = [
  {
    id: 'ord-1',
    orderCode: 'MSE-261022-031',
    date: '22 Okt 2026, 19:42',
    status: 'unpaid',
    statusLabel: 'Menunggu pembayaran',
    eventTag: 'EVENT • ITASHA DOME',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        quantity: 2,
        price: 40000,
      },
    ],
    deliverySummary: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    countdownSeconds: 178,
    stepper: [
      { label: 'Menunggu Pembayaran', completed: false },
      { label: 'Dibayar', completed: false },
      { label: 'Disiapkan Management', completed: false },
      { label: 'Siap diambil di event', completed: false },
    ],
  },
  {
    id: 'ord-2',
    orderCode: 'MSE-261022-031',
    date: '22 Okt 2026, 19:42',
    status: 'processing',
    statusLabel: 'Diambil di event',
    eventTag: 'EVENT • ITASHA DOME',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        quantity: 1,
        price: 80000,
      },
    ],
    deliverySummary: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    pickupInfo: {
      location: 'Ambil cheki di Itasha Dome, Bandung',
      note: 'Sabtu, 24 Oktober 2026. Tunjukkan kode ini ke staff management.',
      code: 'MSE-7K4Q',
    },
    stepper: [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Siap diambil di event', completed: true },
      { label: 'Selesai', completed: false },
    ],
  },
  {
    id: 'ord-3',
    orderCode: 'MSE-261022-031',
    date: '22 Okt 2026, 19:42',
    status: 'processing',
    statusLabel: 'Dikirim',
    eventTag: 'EVENT • ITASHA DOME',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        quantity: 1,
        price: 40000,
      },
      {
        name: 'Mine',
        variant: 'Cheki Two Shoot',
        image: '/images/members/mine.webp',
        quantity: 1,
        price: 40000,
      },
    ],
    deliverySummary: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    shippingInfo: {
      courier: 'Paket dalam perjalanan via JNE Reguler',
      trackingNumber: 'JNE0012345678',
    },
    stepper: [
      { label: 'Dibayar', completed: true },
      { label: 'Dikemas', completed: true },
      { label: 'Dikirim', completed: true },
      { label: 'Diterima', completed: false },
    ],
  },
  {
    id: 'ord-4',
    orderCode: 'MSE-261022-031',
    date: '22 Okt 2026, 19:42',
    status: 'completed',
    statusLabel: 'Selesai',
    eventTag: 'EVENT • ITASHA DOME',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        quantity: 1,
        price: 80000,
      },
    ],
    deliverySummary: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    completedMessage: {
      title: 'Cheki kamu sudah kamu ambil',
      subtitle: 'Terima kasih sudah mendukung member favoritmu!',
    },
    stepper: [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Siap diambil di event', completed: true },
      { label: 'Selesai', completed: true },
    ],
  },
];

export default function ProfileIsland() {
  const user = useStore(currentUser);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [stepperExpanded, setStepperExpanded] = useState<Record<string, boolean>>({
    'ord-2': true,
    'ord-3': true,
    'ord-4': true,
  });

  const [name, setName] = useState('Winaa');
  const [email, setEmail] = useState('winarahmaliaxx@gmail.com');
  const [phone, setPhone] = useState('08xxxxxxxxx');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
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

  const [countdown, setCountdown] = useState(178);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'alamat') {
      setActiveTab('alamat');
    } else if (tabParam === 'orders' || tabParam === 'pesanan') {
      setActiveTab('orders');
    } else {
      setActiveTab('profile');
    }
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || 'Winaa');
      setEmail(user.email || 'winarahmaliaxx@gmail.com');
      setPhone(user.phone || '08xxxxxxxxx');
      setAvatar(user.avatar);
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatar(result);
      updateUserProfile({ avatar: result });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({
      recipientName: name || 'Wina',
      phone: phone || '(+62) 8131111111111',
      province: 'JAWA BARAT',
      city: 'KAB. BEKASI',
      district: 'TAMBUN SELATAN',
      postalCode: '17510',
      street: '',
      detail: '',
      label: 'Rumah',
    });
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: UserAddress) => {
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
    if (editingAddressId) {
      updateUserAddress(editingAddressId, {
        recipientName: addressForm.recipientName.trim(),
        phone: addressForm.phone.trim(),
        province: addressForm.province.trim(),
        city: addressForm.city.trim(),
        district: addressForm.district.trim(),
        postalCode: addressForm.postalCode.trim(),
        street: addressForm.street.trim(),
        detail: addressForm.detail.trim(),
        label: addressForm.label,
      });
    } else {
      addUserAddress({
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
      });
    }
    setIsAddressModalOpen(false);
  };

  const toggleStepper = (orderId: string) => {
    setStepperExpanded((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const filteredOrders = DEFAULT_ORDERS.filter((ord) => {
    if (orderFilter === 'all') return true;
    return ord.status === orderFilter;
  });

  const addresses = user?.addresses && user.addresses.length > 0
    ? user.addresses
    : [
        {
          id: 'addr_default_1',
          label: 'Rumah',
          recipientName: 'Wina',
          phone: '(+62) 8131111111111',
          street: 'Perumahan hantu, Jalan dengan sepatu rodaku Blok A1 No. 3, RT.0/RW.1, Bekasi Timur',
          district: 'TAMBUN SELATAN',
          city: 'KAB. BEKASI',
          province: 'JAWA BARAT',
          postalCode: '17510',
          detail: '',
          isDefault: true,
        },
      ];

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start">
        <aside className="w-full md:w-56 shrink-0">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#EAD7A1] border border-[#D5C088] flex items-center justify-center overflow-hidden shrink-0">
              {avatar ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6 text-[#1F1A12]" />
              )}
            </div>
            <div>
              <div className="font-bold text-base text-[#1F1A12] leading-tight">
                {name || 'Winaa'}
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('profile')}
                className="text-xs text-[#7A6F5B] hover:text-[#C9971C] transition-colors cursor-pointer mt-0.5 block"
              >
                Ubah Profil
              </button>
            </div>
          </div>

          <div className="w-full border-t border-[#E5DAC0] mb-6"></div>

          <div className="space-y-4">
            <div>
              <div className="font-bold text-sm text-[#1F1A12] mb-2.5">
                Akun saya
              </div>
              <div className="space-y-1.5 pl-0.5">
                <button
                  type="button"
                  onClick={() => handleTabChange('profile')}
                  className={`block text-sm transition-colors text-left cursor-pointer ${
                    activeTab === 'profile'
                      ? 'text-[#C9971C] font-semibold'
                      : 'text-[#6E6453] hover:text-[#1F1A12]'
                  }`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('alamat')}
                  className={`block text-sm transition-colors text-left cursor-pointer ${
                    activeTab === 'alamat'
                      ? 'text-[#C9971C] font-semibold'
                      : 'text-[#6E6453] hover:text-[#1F1A12]'
                  }`}
                >
                  Alamat
                </button>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => handleTabChange('orders')}
                className={`font-bold text-sm transition-colors text-left cursor-pointer ${
                  activeTab === 'orders'
                    ? 'text-[#C9971C]'
                    : 'text-[#1F1A12] hover:text-[#C9971C]'
                }`}
              >
                Pesanan Saya
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full min-w-0">
          {activeTab === 'profile' && (
            <div className="bg-[#FAF0D5] border border-[#ECDCAE] rounded-[28px] p-6 sm:p-10 shadow-xs">
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                  Profil Saya
                </h1>
                <p className="text-xs sm:text-sm text-[#5B503D] mt-1.5">
                  Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun
                </p>
                <div className="w-full border-t border-[#E6D4A5] mt-5"></div>
              </div>

              <div className="flex flex-col items-center justify-center my-6">
                <div className="relative group">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#EEDAA2] flex items-center justify-center overflow-hidden border border-[#DEC484] shadow-inner">
                    {avatar ? (
                      <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-12 h-12 text-[#1F1A12]" strokeWidth={1.5} />
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3.5 px-4 py-1.5 rounded-full bg-[#EBD7A1] hover:bg-[#E2CC90] text-xs font-semibold text-[#2C2417] transition-all cursor-pointer shadow-2xs"
                >
                  Pilih gambar
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl mx-auto">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4D422F] mb-1.5">
                    Nama
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-[#F2DC9F] border-none px-5 py-3 text-sm font-medium text-[#1F1A12] placeholder-[#8C7B58] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4D422F] mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-2xl bg-[#F2DC9F] border-none px-5 py-3 text-sm font-medium text-[#1F1A12] placeholder-[#8C7B58] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4D422F] mb-1.5">
                    No. Telepon
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl bg-[#F2DC9F] border-none px-5 py-3 text-sm font-medium text-[#1F1A12] placeholder-[#8C7B58] focus:outline-none focus:ring-2 focus:ring-[#C9971C]/50 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  {isSaved ? (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Profil berhasil disimpan
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-10 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-[#D6A628] via-[#BF901B] to-[#8C6912] text-[#1F1A12] font-black text-xs sm:text-sm tracking-wider uppercase shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    SIMPAN
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'alamat' && (
            <div className="bg-[#FAF0D5] border border-[#ECDCAE] rounded-[28px] p-6 sm:p-10 shadow-xs min-h-[460px]">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                  Alamat
                </h1>
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="px-5 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-xs font-bold text-[#1F1A12] transition-colors cursor-pointer shadow-2xs"
                >
                  + Tambahkan Alamat
                </button>
              </div>

              <div className="space-y-6">
                {addresses.map((addr) => (
                  <div key={addr.id} className="pt-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-[#1F1A12]">
                          {addr.recipientName} | {addr.phone}
                        </div>
                        <p className="text-xs sm:text-sm text-[#4E4433] leading-relaxed max-w-2xl">
                          {addr.street}
                        </p>
                        <p className="text-xs text-[#6A5D48] uppercase tracking-wide">
                          {[addr.district, addr.city, addr.province, 'ID', addr.postalCode].filter(Boolean).join(', ')}
                        </p>
                        {addr.detail && (
                          <p className="text-xs text-[#7A6E57]">
                            {addr.detail}
                          </p>
                        )}
                        {addr.label && (
                          <div className="pt-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#EEDAA2] text-[#423827]">
                              {addr.label}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => openEditAddressModal(addr)}
                        className="text-xs sm:text-sm text-[#C9971C] hover:text-[#9A7420] font-semibold cursor-pointer shrink-0"
                      >
                        Ubah
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-5">
              <div className="bg-white rounded-full p-1.5 shadow-xs border border-[#EDE2CC] flex items-center justify-around">
                {(
                  [
                    { id: 'all', label: 'Semua' },
                    { id: 'unpaid', label: 'Belum dibayar' },
                    { id: 'processing', label: 'Sedang diproses' },
                    { id: 'completed', label: 'Selesai' },
                  ] as const
                ).map((tab) => {
                  const isActive = orderFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderFilter(tab.id)}
                      className={`relative px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'text-[#C9971C]'
                          : 'text-[#5A4F3C] hover:text-[#1F1A12]'
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#C9971C] rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-[#FAF0D5] border border-[#ECDCAE] rounded-[28px] p-10 text-center text-sm text-[#6A5E48]">
                    Tidak ada pesanan pada filter ini.
                  </div>
                ) : (
                  filteredOrders.map((ord) => {
                    const isExpanded = stepperExpanded[ord.id];

                    return (
                      <div
                        key={ord.id}
                        className="bg-[#FAF0D5] border border-[#ECDCAE] rounded-[28px] p-5 sm:p-7 space-y-4 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xs sm:text-sm text-[#1F1A12]">
                              {ord.orderCode}
                            </span>
                            <span className="text-xs text-[#7A6E58]">
                              {ord.date}
                            </span>
                          </div>

                          <div>
                            {ord.status === 'unpaid' && (
                              <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-[#F5E6BF] text-[#7A5F1E]">
                                {ord.statusLabel}
                              </span>
                            )}
                            {ord.status === 'processing' && (
                              <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-[#F9E2A8] text-[#8C6A1C]">
                                {ord.statusLabel}
                              </span>
                            )}
                            {ord.status === 'completed' && (
                              <span className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-[#CFE5CE] text-[#2F6B33]">
                                {ord.statusLabel}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#FCE5A4] text-[#8C6A1C]">
                            {ord.eventTag}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={withBase(it.image)}
                                  alt={it.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-[#F2DC9F] shrink-0"
                                />
                                <div>
                                  <div className="font-bold text-sm text-[#1F1A12]">
                                    {it.name}
                                  </div>
                                  <div className="text-xs text-[#7A6E58]">
                                    {it.variant}
                                  </div>
                                </div>
                              </div>
                              {it.quantity && (
                                <span className="font-bold text-xs text-[#1F1A12]">
                                  {it.quantity}x
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs sm:text-sm">
                          <span className="text-[#7A6E58]">
                            {ord.deliverySummary}
                          </span>
                          <span className="font-bold text-sm sm:text-base text-[#1F1A12]">
                            Rp{ord.totalPrice.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {ord.status === 'unpaid' && (
                          <div className="rounded-2xl bg-[#F7E7BE]/80 border border-[#ECCF8D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                                Selesaikan pembayaran dalam {formatCountdown(countdown)}
                              </div>
                              <div className="text-[11px] text-[#7A6E58] mt-0.5">
                                Pesanan otomatis dibatalkan jika waktu habis.
                              </div>
                            </div>
                            <a
                              href={withBase("/payment")}
                              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#D6A628] to-[#9B7718] text-[#1F1A12] font-bold text-xs shadow-xs hover:brightness-105 text-center cursor-pointer shrink-0"
                            >
                              Bayar dengan QR
                            </a>
                          </div>
                        )}

                        {ord.pickupInfo && (
                          <div className="rounded-2xl bg-[#F7E7BE]/80 border border-[#ECCF8D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                                {ord.pickupInfo.location}
                              </div>
                              <div className="text-[11px] text-[#7A6E58] mt-0.5">
                                {ord.pickupInfo.note}
                              </div>
                            </div>
                            <span className="px-4 py-1.5 rounded-full border border-dashed border-[#D4A338] bg-[#FCE5A4] font-mono font-bold text-xs text-[#1F1A12] tracking-wider text-center shrink-0">
                              {ord.pickupInfo.code}
                            </span>
                          </div>
                        )}

                        {ord.pickupInfo && (
                          <div className="rounded-2xl bg-[#F7E7BE]/50 border border-[#E9CFA0] p-4 flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-[#EAD498] text-[#8C6A1C] flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                            <div className="text-xs space-y-1">
                              <div className="font-bold text-[#1F1A12]">
                                Informasi Penting
                              </div>
                              <p className="text-[#6A5E48] leading-relaxed">
                                Jika kamu tidak dapat hadir saat event untuk mengambil cheki, hubungi tim MUSES melalui kontak resmi kami untuk informasi lebih lanjut mengenai pengambilan alternatif.
                              </p>
                              <a
                                href={withBase("/kontak")}
                                className="inline-flex items-center gap-1 font-bold text-[#8C6A1C] hover:underline pt-0.5"
                              >
                                <span>Hubungi Tim MUSES</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {ord.shippingInfo && (
                          <div className="rounded-2xl bg-[#F7E7BE]/80 border border-[#ECCF8D] p-4">
                            <div className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                              {ord.shippingInfo.courier}
                            </div>
                            <div className="text-xs font-mono font-bold text-[#1F1A12] mt-0.5">
                              No Resi: {ord.shippingInfo.trackingNumber}
                            </div>
                          </div>
                        )}

                        {ord.completedMessage && (
                          <div className="rounded-2xl bg-[#F7E7BE]/80 border border-[#ECCF8D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                                {ord.completedMessage.title}
                              </div>
                              <div className="text-[11px] text-[#7A6E58] mt-0.5">
                                {ord.completedMessage.subtitle}
                              </div>
                            </div>
                            <a
                              href={withBase("/store")}
                              className="px-6 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-[#1F1A12] font-bold text-xs shadow-2xs text-center cursor-pointer shrink-0"
                            >
                              Beli lagi
                            </a>
                          </div>
                        )}

                        {ord.stepper && ord.stepper.length > 0 && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => toggleStepper(ord.id)}
                              className="flex items-center gap-1.5 text-xs text-[#7A6E58] hover:text-[#1F1A12] font-medium transition-colors cursor-pointer mb-3"
                            >
                              <span>Lihat alur pesanan</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="pt-2 pb-1 px-2">
                                <div className="relative flex items-center justify-between">
                                  <div className="absolute top-2 left-3 right-3 h-0.5 bg-[#C9971C]/50 z-0"></div>

                                  {ord.stepper.map((st, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="relative z-10 flex flex-col items-center text-center max-w-[90px]"
                                    >
                                      <div
                                        className={`w-4 h-4 rounded-full border-2 transition-all ${
                                          st.completed
                                            ? 'bg-[#C9971C] border-[#C9971C]'
                                            : 'bg-[#FAF0D5] border-[#C9971C]'
                                        }`}
                                      ></div>
                                      <span className="text-[10px] sm:text-[11px] font-medium text-[#4D4230] mt-1.5 leading-tight">
                                        {st.label}
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
          )}
        </main>
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
    </div>
  );
}
