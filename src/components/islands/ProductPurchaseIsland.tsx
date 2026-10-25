import { withBase } from '../../lib/paths';
import React, { useState, useEffect } from 'react';
import { addToCart, openCart } from '../../stores/cartStore';
import {
  Share2,
  Check,
  Minus,
  Plus,
  MapPin,
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  tagline?: string;
  category: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  image: string;
  gallery?: string[];
  description: string;
  isFeatured: boolean;
  stock: number;
  sku?: string;
  releaseDate?: string;
  manufacturer?: string;
  origin?: string;
  colors?: string[];
  sizes?: string[];
  details?: string[];
  features?: string[];
  packageContents?: string[];
  specifications?: Record<string, any>;
}

interface Props {
  product: Product;
  relatedProducts?: Product[];
}

export default function ProductPurchaseIsland({ product, relatedProducts = [] }: Props) {
  const images = product.gallery && product.gallery.length > 0 ? product.gallery : [product.image];
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors && product.colors.length > 0 ? product.colors[0] : 'Default'
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Standard'
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [addedNotice, setAddedNotice] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeSection, setActiveSection] = useState<'details' | 'notes'>('details');

  const maxOrderLimit = Math.min(product.stock || 2, 2);
  const storeCash = (product.price * 0.01).toFixed(2);

  useEffect(() => {
    const handleScroll = () => {
      const notesEl = document.getElementById('section-notes');
      if (notesEl) {
        const rect = notesEl.getBoundingClientRect();
        if (rect.top <= 200) {
          setActiveSection('notes');
        } else {
          setActiveSection('details');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (instantPurchase = false) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      image: images[activeImageIndex] || product.image,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    if (instantPurchase) {
      window.location.href = withBase('/address');
      return;
    }
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      openCart();
    }, 500);
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const materialInfo =
    product.details?.find((d) => d.toLowerCase().includes('material'))?.replace(/material:\s*/i, '') ||
    product.specifications?.['Composition'] ||
    (product.category === 'Apparel' ? '100% Cotton / Heavyweight Fleece' : 'PC, ABS');

  const dimensionsInfo =
    product.specifications?.['Dimensions'] ||
    (product.sizes && product.sizes.length > 0 && product.sizes[0] !== 'Standard'
      ? product.sizes.join(', ')
      : '약(Approximately) 10.7*7.8*23.1');

  const contentsInfo =
    product.packageContents && product.packageContents.length > 0
      ? product.packageContents.join(', ')
      : 'See product details';

  const manufacturerInfo = product.manufacturer || 'AUREUM 360 / AUREUM RECORDS';
  const countryInfo = product.origin || 'REPUBLIC OF KOREA';
  const powerInfo =
    product.specifications?.['Battery Type'] ||
    (product.category === 'Accessories' ? 'AAA X 3EA (Not Included)' : 'Not Applicable');
  const operationTimeInfo =
    product.specifications?.['Operating Time'] || '*Approximately 3 Hours\n*New Batteries';
  const releaseYear = product.releaseDate || '2023.12 - 2024.1';

  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(relatedProducts.length / itemsPerPage));
  const currentRelated = relatedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full text-[#1F1A12] font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full aspect-square bg-[#FFFFFF] border border-[#1F1A12]/10 rounded-2xl flex items-center justify-center p-6 sm:p-12 overflow-hidden shadow-xl">
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              className="max-h-full max-w-full object-contain transition-transform duration-300"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-18 h-18 sm:w-20 sm:h-20 aspect-square rounded-xl bg-[#FFFFFF] border-2 p-2 flex items-center justify-center cursor-pointer transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#9A7420] shadow-[0_0_12px_rgba(154,116,32,0.3)]'
                      : 'border-[#1F1A12]/10 hover:border-[#1F1A12]/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between gap-4">
            <a
              href="/store"
              className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#4B4335] hover:text-[#1F1A12] transition-colors"
            >
              <span>MUSE</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>

            <div className="relative">
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="w-9 h-9 rounded-full border border-[#1F1A12]/10 hover:bg-[#1F1A12]/10 flex items-center justify-center text-[#4B4335] hover:text-[#1F1A12] transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {copiedLink && (
                <div className="absolute right-0 top-11 z-20 whitespace-nowrap bg-[#EDE6D6] border border-[#1F1A12]/10 text-[#1F1A12] text-[11px] font-medium px-2.5 py-1 rounded shadow-md flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#9A7420]" />
                  <span>Link copied</span>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#1F1A12] mt-2 leading-snug">
            {product.name}
          </h1>

          <div className="mt-2">
            <span className="inline-block px-1.5 py-0.5 border border-[#9A7420] text-[#9A7420] text-[10px] font-bold uppercase tracking-wider rounded">
              EXCLUSIVE
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-bold text-[#1F1A12]">
              <span className="text-sm font-semibold tracking-wide text-[#6E6453]">USD</span>
              <span>${product.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#6E6453] mt-1">
              <span>Excl. tax</span>
              <Info className="w-3.5 h-3.5 text-[#6E6453] stroke-[2]" />
            </div>
            <div className="text-xs text-[#9A7420] font-medium mt-1">
              Up to USD ${storeCash} MUSE Hub Store Cash
            </div>
          </div>

          {product.colors && product.colors.length > 1 && (
            <div className="mt-5 space-y-2">
              <span className="text-xs text-[#6E6453] block">Color</span>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                      selectedColor === c
                        ? 'border-[#9A7420] bg-[#9A7420]/15 text-[#1F1A12] font-medium'
                        : 'border-[#1F1A12]/10 text-[#4B4335] hover:border-[#1F1A12]/30 bg-[#FFFFFF]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 1 && (
            <div className="mt-4 space-y-2">
              <span className="text-xs text-[#6E6453] block">Size</span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors cursor-pointer ${
                      selectedSize === s
                        ? 'border-[#9A7420] bg-[#9A7420]/15 text-[#1F1A12] font-medium'
                        : 'border-[#1F1A12]/10 text-[#4B4335] hover:border-[#1F1A12]/30 bg-[#FFFFFF]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 border border-[#1F1A12]/10 rounded-xl p-4 bg-[#FFFFFF] shadow-sm">
            <div className="text-xs sm:text-sm font-medium text-[#2E281E] mb-3">
              {product.name}
            </div>

            <div className="flex items-center justify-between">
              <div className="inline-flex items-center border border-[#1F1A12]/10 rounded-md overflow-hidden bg-[#F8F5EC]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 flex items-center justify-center text-[#6E6453] hover:text-[#1F1A12] hover:bg-[#1F1A12]/5 disabled:opacity-30 cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3 stroke-[2.5]" />
                </button>
                <span className="w-10 text-center text-xs font-semibold text-[#1F1A12]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  className="w-8 h-8 flex items-center justify-center text-[#6E6453] hover:text-[#1F1A12] hover:bg-[#1F1A12]/5 disabled:opacity-30 cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>

              <div className="text-sm font-bold text-[#1F1A12]">
                USD ${(product.price * quantity).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 text-xs">
            <div>
              <div className="font-semibold text-[#1F1A12]">
                {quantity} selected
              </div>
              <div className="text-[#6E6453] text-[11px] mt-0.5">
                You can order up to {maxOrderLimit} items.
              </div>
            </div>

            <div className="text-right">
              <div className="text-base sm:text-lg font-bold text-[#1F1A12]">
                USD ${(product.price * quantity).toFixed(2)}
              </div>
              <div className="text-[11px] text-[#6E6453]">
                Excl. tax
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              type="button"
              onClick={() => handleAddToCart(false)}
              className="py-3 px-4 rounded-lg border-2 border-[#9A7420] text-[#9A7420] bg-transparent hover:bg-[#9A7420]/10 font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {addedNotice ? (
                <>
                  <Check className="w-4 h-4 text-[#9A7420]" />
                  <span>Added</span>
                </>
              ) : (
                <span>Add to Cart</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              className="py-3 px-4 rounded-lg bg-[#9A7420] hover:bg-[#7D5C16] text-[#FCFAF5] font-bold text-sm transition-colors shadow-sm cursor-pointer flex items-center justify-center"
            >
              Purchase
            </button>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#1F1A12]/10 text-xs text-[#6E6453]">
            <MapPin className="w-3.5 h-3.5 text-[#8A7F6C] shrink-0" />
            <span>Add a shipping address to check shipping fee.</span>
          </div>
        </div>
      </div>

      <div className="sticky top-20 z-30 bg-[#FCFAF5]/95 backdrop-blur-md border-b border-[#1F1A12]/10 flex justify-center gap-16 text-sm mt-16 sm:mt-24">
        <button
          type="button"
          onClick={() => scrollToSection('section-details')}
          className={`pb-3 font-semibold transition-colors cursor-pointer ${
            activeSection === 'details'
              ? 'text-[#1F1A12] border-b-2 border-[#9A7420] -mb-px'
              : 'text-[#6E6453] hover:text-[#1F1A12]'
          }`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => scrollToSection('section-notes')}
          className={`pb-3 font-semibold transition-colors cursor-pointer ${
            activeSection === 'notes'
              ? 'text-[#1F1A12] border-b-2 border-[#9A7420] -mb-px'
              : 'text-[#6E6453] hover:text-[#1F1A12]'
          }`}
        >
          Notes
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div id="section-details" className="pt-10 scroll-mt-28">
          <div className="border-b border-[#1F1A12]/10 pb-3">
            <button
              type="button"
              onClick={() => setIsInfoOpen(!isInfoOpen)}
              className="w-full flex items-center justify-between text-left py-2 font-bold text-sm sm:text-base text-[#1F1A12] cursor-pointer"
            >
              <span>Information</span>
              {isInfoOpen ? (
                <ChevronUp className="w-4 h-4 text-[#6E6453]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6E6453]" />
              )}
            </button>
          </div>

          {isInfoOpen && (
            <div className="divide-y divide-[#1F1A12]/10 text-xs">
              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Product Name</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{product.name}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Product material</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{materialInfo}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Size(cm)</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{dimensionsInfo}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Contents</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{contentsInfo}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Manufacturer</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{manufacturerInfo}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Country of manufacture</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{countryInfo}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Power</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{powerInfo}</span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Operation time</span>
                <span className="sm:col-span-3 text-[#1F1A12] whitespace-pre-line leading-relaxed">
                  {operationTimeInfo}
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">KC Mark</span>
                <span className="sm:col-span-3 text-[#4B4335] leading-relaxed font-mono text-[11px]">
                  한국 KC : R-R-1EL-TTNN23JO<br />
                  일본 JMIC : 020-230349<br />
                  미국 FCC : 2A9BA-TTNN23JO
                </span>
              </div>

              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                <span className="text-[#6E6453] font-medium">Year and month of manufacture</span>
                <span className="sm:col-span-3 text-[#1F1A12]">{releaseYear}</span>
              </div>

              {product.specifications &&
                Object.entries(product.specifications)
                  .filter(
                    ([key]) =>
                      !['Dimensions', 'Composition', 'Battery Type', 'Operating Time'].includes(key)
                  )
                  .map(([key, val]) => (
                    <div key={key} className="py-3.5 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <span className="text-[#6E6453] font-medium">{key}</span>
                      <span className="sm:col-span-3 text-[#1F1A12]">{String(val)}</span>
                    </div>
                  ))}
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-[#1F1A12]/10">
            <h3 className="text-sm font-bold text-[#1F1A12] mb-3">Product Overview</h3>
            <p className="text-xs text-[#4B4335] leading-relaxed font-normal">
              {product.description}
            </p>

            {product.features && product.features.length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="text-xs font-bold text-[#1F1A12]">Key Features</h4>
                <ul className="list-disc list-inside text-xs text-[#4B4335] space-y-1">
                  {product.features.map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div id="section-notes" className="mt-16 pt-12 border-t border-[#1F1A12]/10 space-y-8 text-xs text-[#4B4335] leading-relaxed font-normal scroll-mt-28">
          <h2 className="text-base sm:text-lg font-bold text-[#1F1A12] mb-4">
            Notes & Notice
          </h2>

          <div className="space-y-2">
            <h3 className="font-bold text-[#1F1A12] text-sm">Returns & Exchanges</h3>
            <ul className="space-y-1.5 list-disc list-inside pl-1 text-[#6E6453]">
              <li>
                Go to [MY or More &rarr; My Orders &rarr; Order Details] to request a(n) exchange/return.
              </li>
              <li>Please refer to the FAQ available from Help on MUSE Hub for more information.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#1F1A12] text-sm">Return & Exchange Period</h3>
            <ul className="space-y-1.5 list-disc list-inside pl-1 text-[#6E6453]">
              <li>
                Customers can request a(n) exchange/return through the My Orders page or by going to Help on MUSE Hub [Contact us] within 7 days of receiving the product. (In the case of a simple change of mind, only returns are possible and exchanges will not be allowed.)
              </li>
              <li>
                In case the product is different from its advertisement or the stipulations outlined in its contract, including defects, the customer may contact us through Help on MUSE Hub [Contact us] to withdraw the purchase order within 3 months of receiving the product and within 30 days from the date the customer discovers or could have discovered such fact.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#1F1A12] text-sm">Return & Exchange Fees</h3>
            <ul className="space-y-1.5 list-disc list-inside pl-1 text-[#6E6453]">
              <li>
                If the customer wishes to exchange/return the product due to a simple change of mind, the customer will bear the shipping costs.
              </li>
              <li>
                In the case of defective products, product mismatches, or returns due to delivery issues, the seller will cover the shipping costs.
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#1F1A12] text-sm">Exchange & Return Notes</h3>
            <ul className="space-y-1.5 list-disc list-inside pl-1 text-[#6E6453]">
              <li>Exchange/refund may not be available in the following cases:</li>
              <li>
                Where the product is destroyed or damaged due to a cause attributable to the customer (except in cases where the package is opened for checking the content);
              </li>
              <li>
                Where the product's value has substantially decreased due to the customer's total or partial use or consumption (including the usage of a Digital Code);
              </li>
              <li>
                Where the value of the product has substantially decreased due to the elapse of time, making resale difficult or impossible;
              </li>
              <li>
                Where the package of copyable products has been damaged (where the packaging of copyable products including albums, books, video publications, photocards, postcards, and posters is opened);
              </li>
              <li>
                Where making of the made-to-order product has already proceeded (where irreparable damage to the seller is foreseen, and the seller has obtained written consent acknowledging that the right of withdrawal cannot be exercised due to such foreseen damage);
              </li>
              <li>
                Where some components of the product have been used, lost, or are not resalable due to damage/failure/contamination caused by mishandling, or the product is returned with some components missing;
              </li>
              <li>Exchange/refund in each product category may not be available for the following cases:</li>
              <li className="pl-4 list-none">
                &bull; [Clothing, bags, shoes, fashion accessories]
              </li>
              <li className="pl-4 list-none">
                &bull; Where the product's value has substantially decreased due to washing, stains on the product, odor from fragrance or deodorant, signs of use, etc.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-20 pt-16 border-t border-[#1F1A12]/10">
          <h2 className="text-base sm:text-lg font-bold text-[#1F1A12] mb-6">
            Related Products
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {currentRelated.map((rel) => (
              <a
                key={rel.id}
                href={withBase(`/store/${rel.id}`)}
                className="group flex flex-col cursor-pointer"
              >
                <div className="w-full aspect-square bg-[#FFFFFF] border border-[#1F1A12]/10 rounded-xl p-4 flex items-center justify-center overflow-hidden transition-all group-hover:border-[#9A7420]/50 group-hover:bg-[#F8F5EC]">
                  <img
                    src={rel.image}
                    alt={rel.name}
                    className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="mt-3 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-[#6E6453] uppercase tracking-wider block">
                    MUSE
                  </span>
                  <h3 className="text-xs sm:text-sm font-medium text-[#1F1A12] mt-1 line-clamp-1 group-hover:text-[#9A7420] transition-colors">
                    {rel.name}
                  </h3>
                  <div className="mt-1">
                    <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                      USD ${rel.price.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#8A7F6C] block">
                      Excl. tax
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 border border-[#9A7420] text-[#9A7420] text-[9px] font-bold uppercase rounded">
                      EXCLUSIVE
                    </span>
                    <span className="px-1.5 py-0.5 border border-[#1F1A12]/10 text-[#6E6453] text-[9px] font-medium rounded flex items-center gap-1">
                      <span>✈</span>
                      <span>Shipped from KR</span>
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 text-xs font-mono text-[#6E6453]">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-full border border-[#1F1A12]/10 hover:bg-[#1F1A12]/10 hover:text-[#1F1A12] disabled:opacity-30 cursor-pointer transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span>
                {String(currentPage).padStart(2, '0')} / {String(totalPages).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-full border border-[#1F1A12]/10 hover:bg-[#1F1A12]/10 hover:text-[#1F1A12] disabled:opacity-30 cursor-pointer transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
