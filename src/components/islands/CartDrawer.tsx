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
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { currentUser } from '../../stores/authStore';
import { formatRupiah } from '../../lib/format';
import { fmt, getDict, localizeAddressLabel, localizeOption, type Locale } from '../../i18n/dictionary';

export default function CartDrawer({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).cart;
  const isOpen = useStore(isCartOpen);
  const items = useStore(cartItems);
  const subtotal = useStore(cartSubtotal);
  const user = useStore(currentUser);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
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
    <div data-lenis-prevent className="fixed inset-0 z-50 overflow-hidden transition-all duration-300">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FCFAF5] border-l border-[#1F1A12]/15 shadow-2xl flex flex-col justify-between">
          <div className="p-6 border-b border-[#1F1A12]/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#9A7420]" />
              <h2 className="text-lg font-bold font-display text-[#1F1A12] uppercase tracking-wider">
                {fmt(d.title, { count: items.length })}
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1 rounded-md text-[#6E6453] hover:text-[#1F1A12] hover:bg-[#1F1A12]/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {checkoutComplete ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-[#9A7420]/15 rounded-full flex items-center justify-center mx-auto text-[#9A7420]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-display text-[#1F1A12]">{d.orderReceived}</h3>
                <p className="text-xs text-[#6E6453] max-w-xs mx-auto">
                  {d.orderReceivedBody}
                </p>
                <div className="pt-4">
                  <button
                    onClick={closeCart}
                    className="px-6 py-2 border border-[#9A7420] text-[#9A7420] hover:bg-[#9A7420]/10 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    {d.continueBrowsing}
                  </button>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#1F1A12]/5 flex items-center justify-center mx-auto text-[#6E6453]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1F1A12]">{d.emptyTitle}</h3>
                  <p className="text-xs text-[#6E6453] mt-1">{d.emptyBody}</p>
                </div>
                <a
                  href={withBase("/store")}
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#9A7420] hover:underline pt-2 cursor-pointer"
                >
                  {d.viewStore}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.id}-${item.size || ''}-${item.color || ''}`}
                  className="flex gap-4 p-3 rounded-lg bg-[#F8F4EA]/60 border border-[#1F1A12]/10 hover:border-[#1F1A12]/15 transition-all"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md bg-[#F8F4EA] border border-[#1F1A12]/10 shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <a
                        href={withBase(`/store/${item.id}`)}
                        onClick={closeCart}
                        className="text-sm font-semibold truncate text-[#1F1A12] hover:text-[#9A7420] transition-colors block"
                      >
                        {item.name}
                      </a>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#6E6453]">
                        {item.size && <span>{getDict(locale).cart.size}: {localizeOption(locale, item.size)}</span>}
                        {item.color && <span>• {getDict(locale).cart.color}: {item.color}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-[#9A7420]">
                        {item.price >= 1000
                          ? formatRupiah(item.price * item.quantity)
                          : `$${(item.price * item.quantity).toFixed(2)}`}
                      </span>
                      <div className="flex items-center gap-2 bg-[#F6F1E5] border border-[#1F1A12]/10 rounded-md px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          className="p-1 hover:text-[#9A7420] text-[#6E6453] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold text-[#1F1A12] w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                          className="p-1 hover:text-[#9A7420] text-[#6E6453] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id, item.size, item.color)}
                    className="text-[#6E6453] hover:text-red-500 p-1 self-start transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && !checkoutComplete && (
            <div className="p-6 border-t border-[#1F1A12]/10 bg-[#F8F4EA]/80 space-y-4">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="text-[#6E6453] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#9A7420]" />
                  {d.shippingAddress}
                </span>
                <span className="text-[#9A7420] font-semibold">{user ? user.name : d.guest}</span>
              </div>
              {selectedAddress ? (
                <div className="p-2.5 rounded-xl bg-white/80 border border-[#1F1A12]/10 text-xs text-[#524838]">
                  <div className="font-semibold text-[#1F1A12] flex items-center gap-1.5">
                    <span>{selectedAddress.recipientName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#9A7420]/15 text-[#9A7420] font-mono">
                      {localizeAddressLabel(locale, selectedAddress.label)}
                    </span>
                  </div>
                  <div className="truncate mt-0.5 text-[11px] text-[#6E6453]">{selectedAddress.street}</div>
                  <div className="text-[10px] text-[#8A7F6C]">
                    {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postalCode}
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between">
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

              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6E6453]">{d.subtotal}</span>
                <span className="text-xl font-bold font-display text-[#1F1A12]">
                  {subtotal >= 1000
                    ? formatRupiah(subtotal)
                    : `$${subtotal.toFixed(2)} USD`}
                </span>
              </div>
              <p className="text-[11px] text-[#8A7F6C] leading-tight">
                {d.taxesNote}
              </p>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 bg-[#9A7420] hover:bg-[#B08A36] text-[#FCFAF5] font-bold uppercase tracking-wider text-xs rounded-md shadow-[0_0_20px_rgba(154,116,32,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    {d.processing}
                  </>
                ) : (
                  <>
                    {d.checkoutNow}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
