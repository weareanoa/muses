import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { withBase } from '../../lib/paths';
import { X, ChevronLeft, ChevronRight, Eye, Play, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import galleryItemsRaw from '../../data/gallery.json';
import { fmt, getDict, localizeGalleryCategory, type Locale } from '../../i18n/dictionary';
import { useScrollLock } from '../../hooks/useScrollLock';

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  year?: string;
  mediaType?: 'photo' | 'video' | string;
  mediaUrl: string;
  youtubeId?: string;
  youtubeUrl?: string;
  caption: string;
  titleEn?: string;
  captionEn?: string;
  takenAt?: string;
}

const GALLERY_ITEMS: GalleryItem[] = galleryItemsRaw as GalleryItem[];

// 7 items per bento set: row 1 (8+4=12), row 2 (4+4+4=12), row 3 (6+6=12)
const BENTO_PAGE_SIZE = 7;

function getBentoClasses(idx: number): string {
  const cycle = idx % 7;
  switch (cycle) {
    case 0:
      return 'sm:col-span-2 md:col-span-8 h-[270px] min-[380px]:h-[320px] md:h-[380px] lg:h-[440px]';
    case 1:
      return 'sm:col-span-1 md:col-span-4 h-[220px] min-[380px]:h-[260px] md:h-[380px] lg:h-[440px]';
    case 2:
    case 3:
    case 4:
      return 'sm:col-span-1 md:col-span-4 h-[220px] min-[380px]:h-[260px] md:h-[280px] lg:h-[320px]';
    case 5:
    case 6:
      return 'sm:col-span-1 md:col-span-6 h-[240px] min-[380px]:h-[280px] md:h-[300px] lg:h-[340px]';
    default:
      return 'sm:col-span-1 md:col-span-4 h-[240px] md:h-[300px]';
  }
}

export default function GalleryGrid({ locale = 'en' }: { locale?: Locale }) {
  const d = getDict(locale).gallery;
  const home = getDict(locale).home;
  const titleOf = (card: GalleryItem) => (locale === 'en' && card.titleEn ? card.titleEn : card.title);
  const captionOf = (card: GalleryItem) => (locale === 'en' && card.captionEn ? card.captionEn : card.caption);

  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [visibleLimit, setVisibleLimit] = useState<number>(BENTO_PAGE_SIZE);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useScrollLock(lightboxIndex !== null);

  const lightboxTouchRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });
  const touchPointRef = useRef({ x: 0, y: 0, moved: 0, time: 0 });
  const lastScrollRef = useRef(0);
  const isTouchDeviceRef = useRef(false);
  const galleryTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isTouchDeviceRef.current = window.matchMedia('(hover: none)').matches;
    const onScroll = () => {
      lastScrollRef.current = Date.now();
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
  }, []);

  const isRecentScroll = () => isTouchDeviceRef.current && Date.now() - lastScrollRef.current < 250;

  const handleCardTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchPointRef.current = { x: t.clientX, y: t.clientY, moved: 0, time: Date.now() };
  };

  const handleCardTouchEnd = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    const s = touchPointRef.current;
    s.moved = Math.max(Math.abs(t.clientX - s.x), Math.abs(t.clientY - s.y));
  };

  const openLightbox = (idx: number) => {
    if (isRecentScroll()) return;
    const s = touchPointRef.current;
    if (s.moved > 12 && Date.now() - s.time < 600) return;
    setLightboxIndex(idx);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const categories = ['Semua', 'Event 2026', 'Event 2025', 'Event 2024', 'Archive'];

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'Semua':
        return d.filterAll;
      case 'Event 2026':
        return d.filterEvent2026 || 'Event 2026';
      case 'Event 2025':
        return d.filterEvent2025 || 'Event 2025';
      case 'Event 2024':
        return d.filterEvent2024 || 'Event 2024';
      case 'Archive':
        return d.filterArchive || 'Archive';
      default:
        return cat;
    }
  };

  const filteredItems = GALLERY_ITEMS.filter((item) => {
    if (activeCategory === 'Semua') return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const getCategoryCount = (cat: string) => {
    if (cat === 'Semua') return GALLERY_ITEMS.length;
    return GALLERY_ITEMS.filter((i) => i.category.toLowerCase() === cat.toLowerCase()).length;
  };

  const visibleItems = filteredItems.slice(0, visibleLimit);
  const activeItem = lightboxIndex !== null && filteredItems[lightboxIndex] ? filteredItems[lightboxIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        closeLightbox();
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
    setVisibleLimit(BENTO_PAGE_SIZE);
    setLightboxIndex(null);
  };

  const handleLoadMore = () => {
    setVisibleLimit((prev) => Math.min(prev + BENTO_PAGE_SIZE, filteredItems.length));
  };

  const handleCollapse = () => {
    setVisibleLimit(BENTO_PAGE_SIZE);
    if (galleryTopRef.current) {
      galleryTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div ref={galleryTopRef} className="w-full font-['Poppins',sans-serif]">
      {/* Sub-Header & Eyebrow */}
      <div className="mb-6 sm:mb-8 text-left space-y-1">
        <span className="block text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#9E7B26]">
          {home.galleryEyebrow}
        </span>
        <h3 className="text-lg min-[380px]:text-xl sm:text-3xl font-bold text-[#1F1A12] tracking-tight">
          {home.galleryHeading}
        </h3>
        <p className="text-xs sm:text-sm text-[#5A4E38] leading-relaxed max-w-xl">
          {home.galleryBody}
        </p>
      </div>

      {/* Floating Category Navigation Filter */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 mb-6 sm:mb-8 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const count = getCategoryCount(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 shadow-2xs outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9971C]/50 select-none ${
                isActive
                  ? 'bg-muses-gradient text-[#1F1A12] shadow-xs font-bold border border-[#C9971C]/40'
                  : 'bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200/80 hover:border-zinc-300'
              }`}
            >
              <span>{categoryLabel(cat)}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-white/40 text-[#1F1A12] font-bold' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bento Grid */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center text-[#7A6E58] text-sm bg-white/70 rounded-3xl border border-dashed border-zinc-200">
          {d.empty}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3.5 sm:gap-5">
            {visibleItems.map((card, idx) => {
              const isVideo = card.mediaType === 'video' || Boolean(card.youtubeId);
              const yearTag = card.year && card.year !== 'Archive' ? `'${card.year.slice(-2)}` : null;
              const bentoClasses = getBentoClasses(idx);

              return (
                <div key={card.id} className={bentoClasses}>
                  <div
                    onClick={() => openLightbox(idx)}
                    onTouchStart={handleCardTouchStart}
                    onTouchEnd={handleCardTouchEnd}
                    className="group relative w-full h-full rounded-2xl sm:rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-[#1F1A12]/10 bg-[#1F1A12] shadow-xs"
                  >
                    <img
                      src={withBase(card.mediaUrl)}
                      alt={titleOf(card)}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90" />

                    {/* Top Badges */}
                    <div className="relative z-10 p-3 sm:p-4 flex items-center justify-between">
                      <div>
                        {isVideo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-rose-600/90 text-white backdrop-blur-md shadow-xs uppercase">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>Archive</span>
                          </span>
                        ) : yearTag ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider bg-black/45 text-white/95 backdrop-blur-md border border-white/20 shadow-xs">
                            {yearTag}
                          </span>
                        ) : null}
                      </div>

                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {isVideo ? (
                          <Play className="w-3.5 h-3.5 text-white fill-white translate-x-0.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Center Play Button for Videos */}
                    {isVideo && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div className="w-12 h-12 rounded-full bg-white/90 text-[#1F1A12] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white transition-all">
                          <Play className="w-5 h-5 fill-[#1F1A12] translate-x-0.5" />
                        </div>
                      </div>
                    )}

                    {/* Bottom Text Information */}
                    <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5 z-10 text-left pointer-events-none">
                      <h4 className="font-bold text-xs sm:text-base text-white tracking-tight leading-snug drop-shadow-md block group-hover:text-[#F3DF9A] transition-colors line-clamp-1">
                        {titleOf(card)}
                      </h4>
                      {card.caption && (
                        <p className="text-[10px] sm:text-xs text-[#FAF3E2]/80 line-clamp-1 mt-0.5 font-normal drop-shadow-xs">
                          {captionOf(card)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Clean Bento Pagination Controls */}
          <div className="mt-8 sm:mt-12 flex flex-col items-center gap-3">
            <p className="text-xs text-[#7A6E58] font-medium tracking-wide">
              {fmt(d.showingCount || 'Menampilkan {visible} dari {total} momen', {
                visible: visibleItems.length,
                total: filteredItems.length,
              })}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {visibleLimit < filteredItems.length && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="px-7 py-2.5 sm:px-8 sm:py-3 rounded-full text-xs sm:text-sm font-bold text-[#1F1A12] bg-muses-gradient hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-2 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9971C]/50 border border-[#C9971C]/30 select-none"
                >
                  <span>{fmt(d.loadMore, { remaining: filteredItems.length - visibleLimit })}</span>
                  <ChevronDown className="w-4 h-4 text-[#1F1A12] stroke-[2.5]" />
                </button>
              )}

              {visibleLimit >= filteredItems.length && filteredItems.length > BENTO_PAGE_SIZE && (
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold text-[#8C6A1C] bg-white border border-[#C9971C]/35 hover:bg-[#FBF7EC] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9971C]/50 select-none"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Tutup Sebagian</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Lightbox Modal (Photo & YouTube Video Player) */}
      {activeItem && lightboxIndex !== null && createPortal(
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-md select-none touch-none overscroll-contain"
          onClick={closeLightbox}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              lightboxTouchRef.current = {
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
              };
            }}
            onTouchEnd={(e) => {
              const deltaX = e.changedTouches[0].clientX - lightboxTouchRef.current.startX;
              const deltaY = e.changedTouches[0].clientY - lightboxTouchRef.current.startY;
              if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
                if (deltaX < 0) {
                  setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null));
                } else {
                  setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null));
                }
              }
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 sm:top-2 sm:right-2 z-30 p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
              aria-label={d.closeAria || 'Tutup'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev & Next Navigation Buttons */}
            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null))
                  }
                  className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer"
                  aria-label={d.prevAria || 'Sebelumnya'}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null))
                  }
                  className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer"
                  aria-label={d.nextAria || 'Berikutnya'}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Media Content (Video Player or Photo) */}
            {activeItem.youtubeId ? (
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black max-h-[72vh]">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeItem.youtubeId}?autoplay=1&rel=0`}
                  title={titleOf(activeItem)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-black max-h-[72vh]">
                <img
                  src={withBase(activeItem.mediaUrl)}
                  alt={titleOf(activeItem)}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                />
              </div>
            )}

            {/* Media Caption & Title Information */}
            <div className="mt-3 text-center text-white px-4 max-w-xl">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#F3DF9A] block mb-1">
                {localizeGalleryCategory(locale, activeItem.category)}
              </span>
              <h3 className="text-sm sm:text-base font-bold">
                {titleOf(activeItem)}
              </h3>
              {activeItem.caption && (
                <p className="text-xs text-white/80 mt-1">
                  {captionOf(activeItem)}
                </p>
              )}
              {activeItem.youtubeUrl && (
                <div className="mt-2.5">
                  <a
                    href={activeItem.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                  >
                    <span>{d.watchVideo || 'Buka di YouTube'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
