import React, { useState, useEffect } from 'react';
import { withBase } from '../../lib/paths';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import galleryItemsRaw from '../../data/gallery.json';
import { fmt, getDict, localizeGalleryCategory, type Locale } from '../../i18n/dictionary';

interface GalleryItem {
  id: string;
  title: string;
  category: 'Konser' | 'Behind the Scenes' | 'Event' | string;
  mediaType?: string;
  mediaUrl: string;
  caption: string;
  titleEn?: string;
  captionEn?: string;
  takenAt?: string;
}

const GALLERY_ITEMS: GalleryItem[] = galleryItemsRaw as GalleryItem[];

export default function GalleryGrid({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).gallery;
  const home = getDict(locale).home;
  const titleOf = (card: GalleryItem) => (locale === 'en' && card.titleEn ? card.titleEn : card.title);
  const captionOf = (card: GalleryItem) => (locale === 'en' && card.captionEn ? card.captionEn : card.caption);
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [visibleLimit, setVisibleLimit] = useState<number>(7);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['Semua', 'Konser', 'Behind the Scenes', 'Event'];
  const categoryLabel = (cat: string) =>
    cat === 'Semua' ? d.filterAll : cat === 'Konser' ? d.filterConcert : cat === 'Behind the Scenes' ? d.filterBts : d.filterEvent;

  const filteredItems = GALLERY_ITEMS.filter((item) => {
    if (activeCategory === 'Semua') return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const visibleItems = filteredItems.slice(0, visibleLimit);
  const activeItem = lightboxIndex !== null && filteredItems[lightboxIndex] ? filteredItems[lightboxIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filteredItems.length]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setVisibleLimit(7);
    setLightboxIndex(null);
  };

  const renderCard = (card: GalleryItem, idx: number, extraClasses = '') => {
    return (
      <div
        key={card.id}
        onClick={() => setLightboxIndex(idx)}
        className={`group relative rounded-[22px] sm:rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-[#1F1A12]/10 bg-[#1F1A12] ${extraClasses}`}
      >
        <img
          src={withBase(card.mediaUrl)}
          alt={titleOf(card)}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90" />

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 sm:p-5">
          <div className="flex items-center justify-end">
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div>
            <span className="font-bold text-sm sm:text-base text-white tracking-tight select-none leading-snug drop-shadow-md block group-hover:text-[#F3DF9A] transition-colors">
              {titleOf(card)}
            </span>
            {card.caption && (
              <p className="text-[11px] sm:text-xs text-[#FAF3E2]/80 line-clamp-1 mt-1 font-normal drop-shadow-xs">
                {captionOf(card)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full font-['Poppins',sans-serif]">
      <div className="bg-[#FAF3E2] border border-[#EADBBD] rounded-3xl sm:rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-[0_4px_30px_rgba(201,151,28,0.06)]">
        <div className="mb-6 sm:mb-8 space-y-1">
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-[#9E7B26]">
            {home.galleryEyebrow}
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#1F1A12] tracking-tight">
            {home.galleryHeading}
          </h3>
          <p className="text-xs sm:text-sm text-[#5A4E38] leading-relaxed">
            {home.galleryBody}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap mb-8">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-7 sm:px-9 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B98616] via-[#D3A027] to-[#A37412] text-[#1F1A12] shadow-xs'
                    : 'bg-white border border-[#C9971C]/60 text-[#1F1A12] hover:bg-[#FFFDF7]'
                }`}
              >
                {categoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-[#7A6E58] text-sm bg-white/60 rounded-2xl border border-[#EADBBD]">
            {d.empty}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              {visibleItems[0] && (
                <div className="md:col-span-5 flex flex-col gap-4 sm:gap-5">
                  {renderCard(visibleItems[0], 0, 'h-[210px] sm:h-[235px]')}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {visibleItems[1] && renderCard(visibleItems[1], 1, 'h-[145px] sm:h-[165px]')}
                    {visibleItems[2] && renderCard(visibleItems[2], 2, 'h-[145px] sm:h-[165px]')}
                  </div>
                </div>
              )}

              {visibleItems[3] && (
                <div className="md:col-span-4 flex flex-col gap-4 sm:gap-5">
                  {renderCard(visibleItems[3], 3, 'h-[140px] sm:h-[155px]')}
                  {visibleItems[4] && renderCard(visibleItems[4], 4, 'h-[215px] sm:h-[245px] flex-1')}
                </div>
              )}

              {visibleItems[5] && (
                <div className="md:col-span-3 flex flex-col gap-4 sm:gap-5">
                  {renderCard(visibleItems[5], 5, 'h-[175px] sm:h-[195px]')}
                  {visibleItems[6] && renderCard(visibleItems[6], 6, 'h-[180px] sm:h-[205px] flex-1')}
                </div>
              )}
            </div>

            {visibleItems.length > 7 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 mt-4 sm:mt-5">
                {visibleItems.slice(7).map((item, idx) => {
                  const actualIdx = 7 + idx;
                  return renderCard(item, actualIdx, 'h-[210px] sm:h-[230px]');
                })}
              </div>
            )}

            {visibleLimit < filteredItems.length && (
              <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => Math.min(prev + 7, filteredItems.length))}
                  className="px-8 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-[#B98616] via-[#D3A027] to-[#A37412] text-[#1F1A12] hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {fmt(d.loadMore, { remaining: filteredItems.length - visibleLimit })}
                </button>
              </div>
            )}

            {visibleLimit >= filteredItems.length && filteredItems.length > 7 && (
              <div className="mt-8 text-center text-xs text-[#7A6E58]">
                {fmt(d.allShown, { count: filteredItems.length })}
              </div>
            )}
          </>
        )}
      </div>

      {activeItem && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#FCFAF5] rounded-3xl overflow-hidden border border-[#C9971C]/35 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[#C9971C]/20 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#B98616] via-[#D3A027] to-[#A37418] text-[#1F1A12]">
                  {localizeGalleryCategory(locale, activeItem.category)}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-[#1F1A12]">
                  {titleOf(activeItem)}
                </span>
                <span className="text-xs text-[#7A6E58]">
                  ({lightboxIndex + 1} / {filteredItems.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null
                    )
                  }
                  aria-label={d.prevAria}
                  className="p-1.5 rounded-xl bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev + 1) % filteredItems.length : null
                    )
                  }
                  aria-label={d.nextAria}
                  className="p-1.5 rounded-xl bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label={d.closeAria}
                  className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1F1A12] cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center p-4 min-h-[280px] sm:min-h-[420px]">
              <img
                src={withBase(activeItem.mediaUrl)}
                alt={titleOf(activeItem)}
                className="max-h-[65vh] w-auto max-w-full object-contain mx-auto rounded-xl drop-shadow-2xl"
              />
            </div>

            <div className="p-4 sm:p-5 bg-white border-t border-[#C9971C]/20">
              <p className="text-xs sm:text-sm text-[#4B4335] leading-relaxed">
                {captionOf(activeItem)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
