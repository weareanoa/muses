import { withBase } from '../../lib/paths';
import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  isCartOpen,
  cartItems,
  cartSubtotal,
  closeCart,
  updateQuantity,
  removeFromCart,
  clearCart
} from '../../stores/cartStore';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { currentUser } from '../../stores/authStore';
import { formatRupiah } from '../../lib/format';
import { fmt, getDict, localizeAddressLabel, localizeOption, type Locale } from '../../i18n/dictionary';

export default function CartDrawer({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).cart;
  const isOpen = useStore(isCartOpen);
  const items = useStore(cartItems);
  const subtotal = useStore(cartSubtotal);
  const user = useStore(currentUser);
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const selectedAddress =
    user?.addresses?.find((a) => a.id === user?.selectedAddressId) ||
    user?.addresses?.find((a) => a.isDefault) ||
    user?.addresses?.[0];

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setCheckoutComplete(false);
    }
  }, [isOpen]);

  const handleCheckout = () => {
    closeCart();
    window.location.href = withBase('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div data-lenis-prevent className="fixed inset-0 z-[70] overflow-hidden transition-all duration-300 font-['Poppins',sans-serif]">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FCFAF5] sm:border-l border-[#1F1A12]/15 shadow-2xl flex flex-col justify-between h-full">
          <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-[#EADBBD] bg-white/90 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4A017] flex items-center justify-center text-[#1F1A12] shadow-2xs">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm min-[380px]:text-base font-bold text-[#1F1A12] leading-none">
                  {fmt(d.title, { count: items.length })}
                </h2>
                <span className="text-[10px] min-[380px]:text-[11px] text-[#8C7A58] font-medium">
                  {items.length} item
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && !checkoutComplete && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-[#8C7A58] hover:text-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition-colors font-medium cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
              <button
                type="button"
                onClick={closeCart}
                className="w-8 h-8 rounded-full bg-[#FAF3E2] hover:bg-[#EADBBD] text-[#5A4E38] hover:text-[#1F1A12] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Tutup Keranjang"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-4 py-2 bg-gradient-to-r from-[#FAF3E2] via-[#FFFDF7] to-[#FAF3E2] border-b border-[#EADBBD] text-[10.5px] min-[380px]:text-[11px] text-[#6E5720] flex items-center justify-between shrink-0 font-medium">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C28C1D]" />
              Official Merchandise & Cheki
            </span>
            <span className="text-[#8C6A1C] font-semibold font-mono">100% Original</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 min-[380px]:p-4 sm:p-6 space-y-3">
            {checkoutComplete ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-[#9A7420]/15 rounded-full flex items-center justify-center mx-auto text-[#9A7420]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-serif text-[#1F1A12]">{d.orderReceived}</h3>
                <p className="text-xs text-[#6E6453] max-w-xs mx-auto">
                  {d.orderReceivedBody}
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={closeCart}
                    className="px-6 py-2 border border-[#9A7420] text-[#9A7420] hover:bg-[#9A7420]/10 text-xs font-semibold rounded-full transition-colors cursor-pointer"
                  >
                    {d.continueBrowsing}
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-14 px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF3E2] border border-[#EADBBD] flex items-center justify-center mx-auto text-[#8C6A1C] shadow-2xs">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm min-[380px]:text-base font-bold text-[#1F1A12]">{d.emptyTitle}</h3>
                  <p className="text-xs text-[#6E6453] mt-1 max-w-xs mx-auto leading-relaxed">{d.emptyBody}</p>
                </div>
                <a
                  href={withBase("/store")}
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold text-[#1F1A12] shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 50%, #A37418 100%)',
                  }}
                >
                  <span>{d.viewStore}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.id}-${item.size || ''}-${item.color || ''}`}
                  className="flex gap-3 p-3 rounded-2xl bg-white border border-[#EADBBD] shadow-2xs hover:shadow-xs transition-all"
                >
                  <img
                    src={withBase(item.image)}
                    alt={item.name}
                    className="w-18 h-18 min-[380px]:w-20 min-[380px]:h-20 aspect-square rounded-xl object-cover bg-[#FAF3E2] border border-[#EADBBD] shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <a
                          href={withBase(`/store/${item.id}`)}
                          onClick={closeCart}
                          className="text-xs min-[380px]:text-sm font-bold text-[#1F1A12] hover:text-[#9A7420] transition-colors line-clamp-1 block leading-snug"
                        >
                          {item.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id, item.size, item.color)}
                          className="text-[#A8987E] hover:text-red-500 transition-colors p-1 cursor-pointer shrink-0 -mr-1"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {(item.size || item.color) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {item.size && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-[#FAF3E2] border border-[#EADBBD] text-[9px] min-[380px]:text-[10px] text-[#5A4E38] font-medium">
                              {localizeOption(locale, item.size)}
                            </span>
                          )}
                          {item.color && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-[#FAF3E2] border border-[#EADBBD] text-[9px] min-[380px]:text-[10px] text-[#5A4E38] font-medium">
                              {item.color}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#F5EFE0]">
                      <span className="text-xs min-[380px]:text-sm font-bold text-[#1F1A12]">
                        {item.price >= 1000
                          ? formatRupiah(item.price * item.quantity)
                          : `$${(item.price * item.quantity).toFixed(2)}`}
                      </span>

                      <div className="flex items-center gap-1.5 bg-[#FAF3E2] border border-[#EADBBD] rounded-full px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          className="w-5 h-5 rounded-full bg-white hover:bg-[#FFFDF7] shadow-2xs flex items-center justify-center text-[#5A4E38] hover:text-[#1F1A12] active:scale-90 transition-all cursor-pointer"
                          aria-label="Kurang satu"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-xs font-bold font-mono text-[#1F1A12] w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                          className="w-5 h-5 rounded-full bg-white hover:bg-[#FFFDF7] shadow-2xs flex items-center justify-center text-[#5A4E38] hover:text-[#1F1A12] active:scale-90 transition-all cursor-pointer"
                          aria-label="Tambah satu"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && !checkoutComplete && (
            <div className="p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 border-t border-[#EADBBD] bg-white/95 backdrop-blur-md space-y-3 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6E6453] flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#9A7420]" />
                  {d.shippingAddress}
                </span>
                <span className="text-[#9A7420] font-semibold">{user ? user.name : d.guest}</span>
              </div>

              {selectedAddress ? (
                <div className="p-2.5 rounded-xl bg-[#FAF3E2]/60 border border-[#EADBBD] text-xs text-[#524838]">
                  <div className="font-semibold text-[#1F1A12] flex items-center gap-1.5">
                    <span>{selectedAddress.recipientName}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[#9A7420]/15 text-[#9A7420] font-mono font-semibold">
                      {localizeAddressLabel(locale, selectedAddress.label)}
                    </span>
                  </div>
                  <div className="truncate mt-0.5 text-[11px] text-[#6E6453]">{selectedAddress.street}</div>
                  <div className="text-[10px] text-[#8A7F6C]">
                    {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
                  <span>{d.noAddress}</span>
                  <a
                    href={withBase("/profile?tab=alamat")}
                    onClick={closeCart}
                    className="text-[#9A7420] font-semibold text-xs hover:underline"
                  >
                    {d.setAddress}
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <span className="text-xs sm:text-sm text-[#6E6453] font-medium">{d.subtotal}</span>
                <span className="text-base min-[380px]:text-lg sm:text-xl font-bold text-[#1F1A12]">
                  {subtotal >= 1000
                    ? formatRupiah(subtotal)
                    : `$${subtotal.toFixed(2)} USD`}
                </span>
              </div>

              <p className="text-[10px] min-[380px]:text-[10.5px] text-[#8A7F6C] leading-tight">
                {d.taxesNote}
              </p>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full py-3 min-[380px]:py-3.5 sm:py-4 px-6 rounded-full font-bold uppercase tracking-wider text-xs sm:text-sm text-[#1F1A12] shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 50%, #A37418 100%)',
                }}
              >
                <span>{d.checkoutNow}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
