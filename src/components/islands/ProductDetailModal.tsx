import React, { useState, useEffect, useRef } from 'react';
import { addToCart } from '../../stores/cartStore';
import { X, Check, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  description: string;
  isFeatured: boolean;
  stock: number;
  colors?: string[];
  sizes?: string[];
  details?: string[];
}

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const [selectedSize, setSelectedSize] = useState<string>('Standard');
  const [selectedColor, setSelectedColor] = useState<string>('Default');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard');
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : 'Default');
      setQuantity(1);
      setAddedNotice(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;

    const lenisInstance = (window as any).__lenis;
    if (lenisInstance) {
      try {
        lenisInstance.stop();
      } catch (err) {}
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouch = document.body.style.touchAction;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleWheelPrevent = (e: WheelEvent) => {
      e.stopPropagation();
      if (e.target === overlayRef.current || e.target === backdropRef.current) {
        e.preventDefault();
      }
    };

    const handleTouchPrevent = (e: TouchEvent) => {
      e.stopPropagation();
      if (e.target === overlayRef.current || e.target === backdropRef.current) {
        e.preventDefault();
      }
    };

    const containerEl = overlayRef.current;
    if (containerEl) {
      containerEl.addEventListener('wheel', handleWheelPrevent, { passive: false });
      containerEl.addEventListener('touchmove', handleTouchPrevent, { passive: false });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (lenisInstance) {
        try {
          lenisInstance.start();
        } catch (err) {}
      }
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.touchAction = originalBodyTouch;

      if (containerEl) {
        containerEl.removeEventListener('wheel', handleWheelPrevent);
        containerEl.removeEventListener('touchmove', handleTouchPrevent);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: product.image,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div
      ref={overlayRef}
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div
        data-lenis-prevent
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="relative bg-[#FFFFFF] border border-[#1F1A12]/15 rounded-2xl max-w-3xl w-full text-[#1F1A12] shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 text-[#6E6453] hover:text-[#1F1A12] rounded-full bg-[#FBF8F1] hover:bg-black/90 transition-colors cursor-pointer border border-[#1F1A12]/10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          data-lenis-prevent
          className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto overscroll-contain touch-pan-y flex-1 min-h-0 scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent"
        >
          <div className="bg-[#F6F1E5] p-6 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-[#1F1A12]/10">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#9A7420]/20 text-[#9A7420] border border-[#9A7420]/40">
                  {product.category}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-[#6E6453]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>In Stock ({product.stock} units available)</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#9A7420]">
                Official MUSE
              </span>
              <h2 id="product-modal-title" className="text-xl sm:text-2xl font-display font-bold mt-1 text-[#1F1A12]">
                {product.name}
              </h2>
              <div className="text-2xl font-bold font-mono text-[#9A7420] mt-2">
                ${product.price.toFixed(2)} {product.currency}
              </div>

              <p className="text-sm text-[#4B4335] mt-4 leading-relaxed">
                {product.description}
              </p>

              {product.colors && product.colors.length > 0 && (
                <div className="mt-5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6E6453] block mb-2">
                    Variant / Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                          selectedColor === c
                            ? 'border-[#9A7420] bg-[#9A7420]/15 text-[#1F1A12]'
                            : 'border-[#1F1A12]/10 text-[#6E6453] hover:border-[#1F1A12]/30'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-[#6E6453] block mb-2">
                    Size / Edition
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'border-[#9A7420] bg-[#9A7420]/15 text-[#1F1A12]'
                            : 'border-[#1F1A12]/10 text-[#6E6453] hover:border-[#1F1A12]/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.details && (
                <div className="mt-5 pt-4 border-t border-[#1F1A12]/10 space-y-1.5 text-xs text-[#6E6453]">
                  {product.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#9A7420] mt-0.5">•</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#1F1A12]/10 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#1F1A12]/10 rounded-md bg-[#F8F4EA]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-[#6E6453] hover:text-[#1F1A12] transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 text-[#6E6453] hover:text-[#1F1A12] transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={addedNotice}
                  className="flex-1 py-3 bg-[#9A7420] hover:bg-[#B08A36] text-[#FCFAF5] font-bold uppercase tracking-wider text-xs rounded-md shadow-[0_0_20px_rgba(154,116,32,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {addedNotice ? (
                    <>
                      <Check className="w-4 h-4" /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Bag • ${(product.price * quantity).toFixed(2)}
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-[#6E6453] text-center">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#9A7420]" />
                  <span>100% Authentic</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#9A7420]" />
                  <span>Global Dispatch</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-[#9A7420]" />
                  <span>Official MUSE Hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
