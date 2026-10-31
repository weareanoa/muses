import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import type { UserAddress } from '../../stores/authStore';
import { getDict, type Locale } from '../../i18n/dictionary';

export interface AddressFormData {
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  street: string;
  detail: string;
  label: 'Rumah' | 'Kantor';
}

const EMPTY_FORM: AddressFormData = {
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  postalCode: '',
  street: '',
  detail: '',
  label: 'Rumah',
};

export interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormData) => void;
  initialData?: UserAddress | null;
  title?: string;
  locale?: Locale;
}

export default function AddressModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  title,
  locale = 'id',
}: AddressModalProps) {
  const d = getDict(locale).addressModal;
  const [addressForm, setAddressForm] = useState<AddressFormData>(EMPTY_FORM);

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setAddressForm({
          recipientName: initialData.recipientName || '',
          phone: initialData.phone || '',
          province: initialData.province || '',
          city: initialData.city || '',
          district: initialData.district || '',
          postalCode: initialData.postalCode || '',
          street: initialData.street || '',
          detail: initialData.detail || '',
          label: (initialData.label === 'Kantor' ? 'Kantor' : 'Rumah') as 'Rumah' | 'Kantor',
        });
      } else {
        setAddressForm(EMPTY_FORM);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalTitle = title || (initialData ? d.titleEdit : d.titleAdd);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.recipientName.trim() || !addressForm.phone.trim()) return;
    onSave(addressForm);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative border border-[#EADBBD] animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1F1A12]">{modalTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-[#6A5E48] transition-colors cursor-pointer"
            aria-label={d.closeAria}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <input
                type="text"
                placeholder={d.phName}
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
                placeholder={d.phPhone}
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
                placeholder={d.phProvince}
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
                placeholder={d.phCity}
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
                placeholder={d.phDistrict}
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
                placeholder={d.phPostal}
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
              placeholder={d.phStreet}
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
              placeholder={d.phDetail}
              value={addressForm.detail}
              onChange={(e) =>
                setAddressForm((p) => ({ ...p, detail: e.target.value }))
              }
              className="w-full rounded-xl border border-[#E5DFD5] px-4 py-2.5 text-xs sm:text-sm text-[#1F1A12] placeholder-[#8A7F6C] focus:outline-none focus:ring-1 focus:ring-[#C9971C]"
            />
          </div>

          <div>
            <div className="text-xs text-[#7A6E58] mb-2 font-medium">{d.markAs}</div>
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
                {d.homeLabel}
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
                {d.officeLabel}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-2.5 rounded-full bg-[#EBD69D] hover:bg-[#E3CB8C] text-[#1F1A12] font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs"
            >
              {d.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

