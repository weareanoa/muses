import React, { useState, useEffect, useMemo } from 'react';
import { withBase } from '../../lib/paths';
import { addToCart } from '../../stores/cartStore';
import { formatRupiah } from '../../lib/format';
import { productService } from '../../services/productService';
import type { CatalogItemDTO } from '../../types/database';
import { fmt, getDict, localizeOption, type Locale } from '../../i18n/dictionary';

export type CatalogItem = CatalogItemDTO;

export function StoreCard({
  item,
  onAddToCart,
  isAdded,
  locale = 'id',
}: {
  item: CatalogItem;
  onAddToCart: (item: CatalogItem, variant: string) => void;
  isAdded: boolean;
  locale?: Locale;
}) {
  const d = getDict(locale).store;
  const [selectedVariant, setSelectedVariant] = useState(item.options[0] || 'Standard');

  return (
    <div className="group bg-white border border-[#EADBBD] rounded-[26px] sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-[0_14px_30px_rgba(201,151,28,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col font-['Poppins',sans-serif]">
      <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-[#FAF3E2]/50">
        <img
          src={withBase(item.image)}
          alt={item.name}
          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4 bg-white">
        <div>
          <span className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#9E7B26]">
            {item.category}
          </span>
          <h3 className="font-balbes text-3xl sm:text-4xl text-[#1F1A12] leading-tight tracking-tight mt-0.5">
            {item.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: item.color || '#C9971C' }}
            />
            <span className="text-xs text-[#5A4E38] font-medium truncate">
              {item.subtitle}
            </span>
          </div>
        </div>

        {item.options && item.options.length > 0 && (
          <div className="bg-[#F8E29E]/60 p-1 rounded-full flex items-center justify-between gap-1">
            {item.options.map((opt) => {
              const active = selectedVariant === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedVariant(opt)}
                  className={`flex-1 py-1 px-3 text-center rounded-full text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-white font-bold text-[#1F1A12] shadow-xs'
                      : 'text-[#1F1A12] font-medium hover:text-black'
                  }`}
                >
                  {localizeOption(locale, opt)}
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between pt-1">
            <span className="text-base sm:text-lg font-bold text-[#1F1A12]">
              {formatRupiah(item.price)}
            </span>
            <span className="text-xs text-[#8C7A58]">
              {fmt(d.stockLeft, { stock: item.stock })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart(item, selectedVariant)}
            className="w-full py-2.5 sm:py-3 rounded-full text-center text-xs sm:text-sm font-bold text-[#1F1A12] shadow-xs hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            style={{
              background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 50%, #A37418 100%)',
            }}
          >
            {isAdded ? d.added : d.add}
          </button>
        </div>
      </div>
    </div>
  );
}

const COMING_SOON_CATEGORIES = ['Merchandise', 'Videocall'];

function ComingSoonPanel({
  category,
  members,
  onShowCheki,
  locale = 'id',
}: {
  category: string;
  members: { name: string; color: string; image: string }[];
  onShowCheki: () => void;
  locale?: Locale;
}) {
  const d = getDict(locale).store;
  const copy =
    category === 'Merchandise'
      ? { heading: d.comingSoonMerchHeading, body: d.comingSoonMerchBody }
      : category === 'Videocall'
        ? { heading: d.comingSoonVideocallHeading, body: d.comingSoonVideocallBody }
        : null;
  if (!copy) return null;
  return (
    <div
      key={category}
      className="coming-soon-enter text-center py-12 sm:py-16 px-6 bg-[#FAF3E2] rounded-3xl border border-[#EADBBD]"
    >
      <span className="inline-block px-3.5 py-1 rounded-full bg-[#F8E29E] text-[#5A3E00] font-bold text-[11px] sm:text-xs tracking-wide">
        {d.comingSoon}
      </span>
      <h2 className="mt-4 text-xl sm:text-2xl font-bold text-[#1F1A12]">{copy.heading}</h2>
      <p className="mt-2.5 text-xs sm:text-sm text-[#5A4E38] leading-relaxed max-w-md mx-auto">
        {copy.body}
      </p>
      {members.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {members.map((m) => (
            <img
              key={m.name}
              src={withBase(m.image)}
              alt={m.name}
              title={m.name}
              loading="lazy"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover object-top shadow-xs border-2"
              style={{ borderColor: m.color }}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onShowCheki}
        className="mt-7 px-7 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-bold text-[#2A1D0B] shadow-xs cursor-pointer transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:brightness-105 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9971C]"
        style={{ background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 60%, #8A6A1C 100%)' }}
      >
        {d.seeCheki}
      </button>
    </div>
  );
}

export default function StoreCatalog({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).store;
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>(() =>
    productService.getInitialCatalogItems()
  );
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const categories = ['Semua', 'Cheki', 'Merchandise', 'Videocall'];
  const categoryLabel = (cat: string) =>
    cat === 'Semua' ? d.filterAll : cat === 'Cheki' ? d.filterCheki : cat === 'Merchandise' ? d.filterMerchandise : d.filterVideocall;

  useEffect(() => {
    productService.getCatalogItems().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setCatalogItems(res.data);
      }
    });
  }, []);

  const isComingSoonCategory = COMING_SOON_CATEGORIES.includes(activeCategory);
  const comingSoonMembers = useMemo(
    () =>
      catalogItems
        .filter((item) => item.category === 'CHEKI')
        .map((item) => ({ name: item.name, color: item.color, image: item.image })),
    [catalogItems]
  );

  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      const matchesCategory =
        (activeCategory === 'Semua' &&
          !COMING_SOON_CATEGORIES.some(
            (c) => c.toLowerCase() === item.category.toLowerCase()
          )) ||
        item.category.toLowerCase() === activeCategory.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [catalogItems, activeCategory, searchQuery]);

  const handleAddToCart = (item: CatalogItem, variant: string) => {
    addToCart({
      id: item.id,
      name: `${item.category === 'CHEKI' ? 'Cheki' : item.category === 'VIDEOCALL' ? 'Videocall' : ''} ${item.name}`.trim(),
      price: item.price,
      currency: 'IDR',
      image: item.image,
      size: variant,
      quantity: 1,
    });

    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1200);
  };

  return (
    <div className="w-full font-['Poppins',sans-serif]">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-6 sm:mb-8 pl-1">
        <div>
          <span className="flex items-center gap-2 text-[10px] sm:text-[11px] font-bold tracking-[0.28em] uppercase text-[#8C6A1C]">
            <img
              src={withBase('/images/muses_logo_3d_clean.svg')}
              alt=""
              aria-hidden="true"
              className="h-3 w-auto object-contain opacity-80"
            />
            {d.eyebrow}
          </span>
          <h1 className="font-balbes text-6xl sm:text-7xl md:text-8xl text-[#1F1A12] leading-none tracking-normal select-none mt-1.5">
            {d.heading}
          </h1>
          <p className="text-xs sm:text-[13px] text-[#6E6453] mt-2 max-w-md">
            {d.description}
          </p>
        </div>
        
      </div>

      <div
        className="relative w-full rounded-3xl sm:rounded-[32px] overflow-hidden shadow-xs mb-8 sm:mb-10 flex flex-col md:flex-row items-center justify-between pl-6 sm:pl-10 lg:pl-14 py-6 sm:py-7 md:py-8 pr-0 gap-6"
        style={{
          background: 'linear-gradient(90deg, #B8860B 0%, #F6DD8A 54%, #D4A017 83%, #523C05 100%)',
        }}
      >
        <div className="max-w-xl lg:max-w-2xl z-10 text-left py-1 pr-4 sm:pr-6 md:pr-8">
          <span className="inline-block px-3.5 py-1 rounded-full bg-white text-[#9E7B26] font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-3 shadow-2xs">
            {d.bannerTag}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-bold tracking-tight text-[#FFF8E7] leading-tight">
            {d.bannerHeadingA} <span className="text-[#3D2800]">{d.bannerHeadingB}</span>
          </h2>
          <p className="text-xs sm:text-[13px] text-[#FFF4D4]/90 leading-relaxed mt-2.5 font-normal max-w-lg lg:max-w-xl">
            {d.bannerBody}
          </p>
        </div>

        <div className="w-full md:w-auto flex justify-end items-center self-center shrink-0 z-10 -mr-2 sm:-mr-3 md:-mr-4">
          <img
            src={withBase('/images/banner/shop-banner.webp')}
            alt="MUSES Members"
            className="h-36 sm:h-42 md:h-48 lg:h-52 w-auto object-contain object-right select-none pointer-events-none drop-shadow-md"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const isComingSoon = COMING_SOON_CATEGORIES.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-label={isComingSoon ? fmt(d.comingSoonAria, { category: categoryLabel(cat) }) : categoryLabel(cat)}
                className={`flex items-center gap-2 px-7 sm:px-8 py-2.5 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9971C] ${
                  isActive
                    ? 'text-[#2A1D0B] shadow-xs'
                    : 'border border-[#C9971C]/50 bg-white hover:bg-[#FAF3E2] text-[#1F1A12] font-semibold'
                }`}
                style={
                  isActive
                    ? { background: 'linear-gradient(90deg, #B8860B 0%, #D4A017 60%, #8A6A1C 100%)' }
                    : undefined
                }
              >
                {categoryLabel(cat)}
                {isComingSoon && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                      isActive ? 'bg-[#FFF8E7] text-[#5A3E00]' : 'bg-[#F8E29E] text-[#5A3E00]'
                    }`}
                  >
                    {d.comingSoon}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64 lg:w-72">
          <input
            type="text"
            placeholder={d.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-2.5 rounded-full border border-[#C9971C]/50 bg-white text-xs sm:text-sm text-[#1F1A12] placeholder-[#8C7A58] focus:outline-none focus:border-[#C9971C] transition-all"
          />
        </div>
      </div>

      {isComingSoonCategory ? (
        <ComingSoonPanel
          category={activeCategory}
          members={comingSoonMembers}
          onShowCheki={() => setActiveCategory('Cheki')}
          locale={locale}
        />
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#FAF3E2] rounded-3xl border border-[#EADBBD]">
          <p className="text-sm font-medium text-[#5A4E38]">
            {fmt(d.emptySearch, { query: searchQuery })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item) => (
            <StoreCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              isAdded={!!addedIds[item.id]}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
