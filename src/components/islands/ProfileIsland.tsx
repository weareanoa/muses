import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import AddressModal, { type AddressFormData } from './AddressModal';
import HistoryIsland from './HistoryIsland';
import {
  currentUser,
  logoutUser,
  updateUserProfile,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
  type UserAddress
} from '../../stores/authStore';
import {
  User as UserIcon,
  Check,
  MapPin,
  Pencil,
  Trash2,
  LogOut
} from 'lucide-react';

type TabType = 'profile' | 'alamat' | 'orders';

import { getDict, localizeAddressLabel, type Locale } from '../../i18n/dictionary';

export default function ProfileIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).profile;
  const user = useStore(currentUser);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

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
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar);
    }
  }, [user]);

  
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
    setEditingAddress(null);
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: UserAddress) => {
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
    } else {
      addUserAddress(addressData);
    }
    setIsAddressModalOpen(false);
  };

  const addresses = user?.addresses ?? [];

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
                {name}
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('profile')}
                className="text-xs text-[#7A6F5B] hover:text-[#C9971C] transition-colors cursor-pointer mt-0.5 block"
              >
                {d.changeProfile}
              </button>
            </div>
          </div>

          <div className="w-full border-t border-[#E5DAC0] mb-6"></div>

          <div className="space-y-4">
            <div>
              <div className="font-bold text-sm text-[#1F1A12] mb-2.5">
                {d.myAccount}
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
                  {d.sidebarProfile}
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
                  {d.sidebarAddresses}
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
                {d.sidebarOrders}
              </button>
            </div>

            <div className="pt-4 border-t border-[#ECDCAE]">
              <button
                type="button"
                onClick={() => logoutUser(true)}
                className="flex items-center gap-2 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{d.signOutAccount}</span>
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full min-w-0">
          {activeTab === 'profile' && (
            <div className="bg-[#FAF0D5] border border-[#ECDCAE] rounded-[28px] p-6 sm:p-10 shadow-xs">
              <div className="mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                  {d.myProfileHeading}
                </h1>
                <p className="text-xs sm:text-sm text-[#5B503D] mt-1.5">
                  {d.myProfileDesc}
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
                  {d.chooseImage}
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5 max-w-2xl mx-auto">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[#4D422F] mb-1.5">
                    {d.nameLabel}
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
                    {d.emailLabel}
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
                    {d.phoneLabel}
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
                      {d.saved}
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="px-10 py-2.5 sm:py-3 rounded-full bg-muses-gradient text-[#1F1A12] font-black text-xs sm:text-sm tracking-wider uppercase shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {d.saveButton}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'alamat' && (
            <div className="bg-[#FAF0D5] border border-[#ECDCAE] rounded-[28px] p-6 sm:p-10 shadow-xs min-h-[460px]">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                  {d.addressesHeading}
                </h1>
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="px-5 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-xs font-bold text-[#1F1A12] transition-colors cursor-pointer shadow-2xs shrink-0"
                >
                  {d.addAddress}
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="flex flex-col items-center text-center py-14 rounded-2xl border-2 border-dashed border-[#DFC478]/60 bg-[#FFFDF7]/60">
                  <MapPin className="w-9 h-9 text-[#8C6A1C] opacity-60 mb-3" />
                  <p className="text-sm font-semibold text-[#1F1A12]">{d.noAddresses}</p>
                  <p className="text-xs text-[#6A5E48] mt-1 mb-5 max-w-xs">{d.noAddressesHint}</p>
                  <button
                    type="button"
                    onClick={openAddAddressModal}
                    className="px-5 py-2 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-xs font-bold text-[#1F1A12] transition-colors cursor-pointer"
                  >
                    {d.addAddress}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`rounded-2xl border p-5 bg-white/70 transition-colors ${
                        addr.isDefault ? 'border-[#C9971C]' : 'border-[#E8D49E]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-[#1F1A12]">{addr.recipientName}</span>
                            <span className="text-xs text-[#6A5E48]">{addr.phone}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-[#4E4433] leading-relaxed">{addr.street}</p>
                          <p className="text-xs text-[#6A5D48] uppercase tracking-wide">
                            {[addr.district, addr.city, addr.province, addr.postalCode].filter(Boolean).join(', ')}
                          </p>
                          {addr.detail && <p className="text-xs text-[#7A6E57]">{addr.detail}</p>}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {addr.label && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#EEDAA2] text-[#423827]">
                                {localizeAddressLabel(locale, addr.label)}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#C9971C] text-white">
                                {d.addressPrimary}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditAddressModal(addr)}
                            className="p-2 rounded-full text-[#7A6E58] hover:bg-[#F2DC9F]/60 hover:text-[#9A7420] transition-colors cursor-pointer"
                            title={d.editAddress}
                            aria-label={d.editAddress}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(d.confirmDeleteAddress)) deleteUserAddress(addr.id);
                            }}
                            className="p-2 rounded-full text-[#7A6E58] hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                            title={d.deleteAddress}
                            aria-label={d.deleteAddress}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => updateUserAddress(addr.id, { isDefault: true })}
                          className="mt-3 text-xs font-semibold text-[#C9971C] hover:text-[#9A7420] transition-colors cursor-pointer"
                        >
                          {d.setPrimary}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <HistoryIsland locale={locale} />
          )}
        </main>
      </div>

      <AddressModal
        locale={locale}
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />
    </div>
  );
}
