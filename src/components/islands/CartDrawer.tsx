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
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import confetti from 'canvas-confetti';
import { currentUser } from '../../stores/authStore';

export default function CartDrawer() {
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

  useEffect(() => {
    const lenisInstance = (window as any).__lenis;
    if (isOpen) {
      if (lenisInstance) {
        try {
          lenisInstance.stop();
        } catch (err) {}
      }
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      if (lenisInstance) {
        try {
          lenisInstance.start();
        } catch (err) {}
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      setCheckoutComplete(false);
    }
    return () => {
      if (lenisInstance) {
        try {
          lenisInstance.start();
        } catch (err) {}
      }
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleCheckout = () => {
    closeCart();
    window.location.href = '/address';
  };

  if (!isOpen) return null;

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 overflow-hidden transition-all duration-300">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={closeCart}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FFFFFF] border-l border-[#1F1A12]/10 text-[#1F1A12] shadow-2xl flex flex-col">
          <div className="p-6 border-b border-[#1F1A12]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#9A7420]" />
              <h2 className="text-lg font-display font-bold tracking-wider">YOUR BAG</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1F1A12]/10 text-[#9A7420] font-semibold">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="p-2 text-[#6E6453] hover:text-[#1F1A12] rounded-full hover:bg-[#1F1A12]/5 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-6 space-y-4">
            {checkoutComplete ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-[#9A7420] animate-bounce" />
                <h3 className="text-xl font-display font-bold">ORDER CONFIRMED!</h3>
                <p className="text-sm text-[#6E6453] max-w-xs">
                  Thank you for supporting MUSE! Your simulated order has been processed successfully.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-4 px-6 py-2.5 bg-[#9A7420] text-[#FCFAF5] font-semibold rounded-md text-xs uppercase tracking-widest hover:bg-[#B08A36] transition-all cursor-pointer"
                >
                  Back to Showcase
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-[#6E6453]">
                <ShoppingBag className="w-12 h-12 stroke-[1.5] text-[#A3977F]" />
                <p className="text-base font-medium">Your shopping bag is empty</p>
                <p className="text-xs text-[#8A7F6C] max-w-xs">
                  Explore official MUSE merchandise, tour essentials, and exclusive album pressings.
                </p>
                <a
                  href="/store"
                  onClick={closeCart}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#1F1A12]/10 hover:bg-[#1F1A12]/20 text-[#1F1A12] rounded-md text-xs uppercase font-semibold tracking-wider transition-all"
                >
                  Explore Store
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
                        href={`/store/${item.id}`}
                        onClick={closeCart}
                        className="text-sm font-semibold truncate text-[#1F1A12] hover:text-[#9A7420] transition-colors block"
                      >
                        {item.name}
                      </a>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#6E6453]">
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>• Color: {item.color}</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-[#9A7420]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2 bg-[#F6F1E5] border border-[#1F1A12]/10 rounded-md px-1.5 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1, item.size, item.color)}
                          className="p-1 hover:text-[#9A7420] text-[#6E6453] transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold px-1">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1, item.size, item.color)}
                          className="p-1 hover:text-[#9A7420] text-[#6E6453] transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                        className="text-[#8A7F6C] hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!checkoutComplete && items.length > 0 && (
            <div className="p-6 border-t border-[#1F1A12]/10 bg-[#FBF8F1] space-y-3.5">
              {selectedAddress ? (
                <div className="bg-[#F6F1E5] border border-[#1F1A12]/10 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between text-[#6E6453] mb-1">
                    <span className="flex items-center gap-1.5 text-[#2E281E] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#9A7420]" />
                      <span>Kirim ke: {selectedAddress.label}</span>
                    </span>
                    <a
                      href="/address"
                      onClick={closeCart}
                      className="text-[#9A7420] text-[11px] hover:underline"
                    >
                      Ubah Alamat
                    </a>
                  </div>
                  <p className="text-[11px] text-[#6E6453] truncate">
                    {selectedAddress.street}, {selectedAddress.city}
                  </p>
                </div>
              ) : (
                <div className="bg-[#F8F4EA] border border-[#1F1A12]/10 rounded-xl p-3 text-xs flex items-center justify-between">
                  <span className="text-[#6E6453] text-[11px]">Belum ada alamat pengiriman</span>
                  <a
                    href="/address"
                    onClick={closeCart}
                    className="text-[#9A7420] font-semibold text-xs hover:underline"
                  >
                    + Atur Alamat
                  </a>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6E6453]">Subtotal</span>
                <span className="text-xl font-bold font-display text-[#1F1A12]">
                  ${subtotal.toFixed(2)} USD
                </span>
              </div>
              <p className="text-[11px] text-[#8A7F6C] leading-tight">
                Taxes and shipping calculated at checkout. Free shipping on official albums.
              </p>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full py-3.5 bg-[#9A7420] hover:bg-[#B08A36] text-[#FCFAF5] font-bold uppercase tracking-wider text-xs rounded-md shadow-[0_0_20px_rgba(154,116,32,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    Checkout Now
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
