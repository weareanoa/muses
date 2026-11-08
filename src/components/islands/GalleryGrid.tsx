import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { withBase } from '../../lib/paths';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import galleryItemsRaw from '../../data/gallery.json';
import { fmt, getDict, localizeGalleryCategory, type Locale } from '../../i18n/dictionary';
import { useScrollLock } from '../../hooks/useScrollLock';

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

  useScrollLock(lightboxIndex !== null);

  const lightboxTouchRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });

  const [activeSlide, setActiveSlide] = useState<number>(0);
  const [slideStatus, setSlideStatus] = useState<'idle' | 'swiping-left' | 'swiping-right'>('idle');
  const [swipeTarget, setSwipeTarget] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; lastX: number; lastY: number; time: number; isHorizontal: boolean | null }>({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    time: 0,
    isHorizontal: null,
  });

  // Guard ketukan tidak sengaja di mobile: abaikan buka lightbox kalau
  // halaman baru saja di-scroll atau jari bergeser jauh sejak touchstart.
  const touchPointRef = useRef({ x: 0, y: 0, moved: 0, time: 0 });
  const lastScrollRef = useRef(0);
  const isTouchDeviceRef = useRef(false);

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

  const categories = ['Semua', 'Konser', 'Behind the Scenes', 'Event'];
  const categoryLabel = (cat: string) =>
    cat === 'Semua' ? d.filterAll : cat === 'Konser' ? d.filterConcert : cat === 'Behind the Scenes' ? d.filterBts : d.filterEvent;

  const filteredItems = GALLERY_ITEMS.filter((item) => {
    if (activeCategory === 'Semua') return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const visibleItems = filteredItems.slice(0, visibleLimit);
  const activeItem = lightboxIndex !== null && filteredItems[lightboxIndex] ? filteredItems[lightboxIndex] : null;

  const closeLightbox = () => {
    if (lightboxIndex !== null) {
      setActiveSlide(lightboxIndex);
    }
    setLightboxIndex(null);
  };

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
    setVisibleLimit(7);
    setLightboxIndex(null);
    setActiveSlide(0);
    setSlideStatus('idle');
    setSwipeTarget(null);
    setDragOffset(0);
    setIsDragging(false);
  };

  const triggerSwipe = (direction: 'left' | 'right', customTarget?: number) => {
    if (slideStatus !== 'idle' || filteredItems.length <= 1) return;

    const total = filteredItems.length;
    const target =
      customTarget !== undefined
        ? customTarget
        : direction === 'left'
          ? (activeSlide + 1) % total
          : (activeSlide - 1 + total) % total;

    setSwipeTarget(target);
    setSlideStatus(direction === 'left' ? 'swiping-left' : 'swiping-right');

    setTimeout(() => {
      setActiveSlide(target);
      setSlideStatus('idle');
      setDragOffset(0);
      setSwipeTarget(null);
    }, 420);
  };

  const goToSlide = (idx: number) => {
    if (idx === activeSlide || slideStatus !== 'idle') return;
    const direction = idx > activeSlide ? 'left' : 'right';
    triggerSwipe(direction, idx);
  };

  const handlePointerStart = (clientX: number, clientY: number) => {
    if (filteredItems.length <= 1 || slideStatus !== 'idle') return;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      lastX: clientX,
      lastY: clientY,
      time: Date.now(),
      isHorizontal: null,
    };
    setIsDragging(true);
    setDragOffset(0);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging || filteredItems.length <= 1) return;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    dragStartRef.current.lastX = clientX;
    dragStartRef.current.lastY = clientY;

    if (dragStartRef.current.isHorizontal === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        dragStartRef.current.isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (dragStartRef.current.isHorizontal) {
      setDragOffset(deltaX);
    }
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const duration = Date.now() - dragStartRef.current.time;
    const totalMove = Math.max(
      Math.abs(dragStartRef.current.lastX - dragStartRef.current.x),
      Math.abs(dragStartRef.current.lastY - dragStartRef.current.y),
      Math.abs(dragOffset),
    );
    const isTap = totalMove < 12 && duration < 350 && !isRecentScroll();

    if (isTap) {
      setLightboxIndex(activeSlide);
      setDragOffset(0);
      return;
    }

    const isQuickFlick = duration < 250 && Math.abs(dragOffset) > 20;
    const isPastThreshold = Math.abs(dragOffset) > 35;

    if ((isQuickFlick || isPastThreshold) && filteredItems.length > 1) {
      if (dragOffset < 0) {
        triggerSwipe('left');
      } else {
        triggerSwipe('right');
      }
    } else {
      setDragOffset(0);
    }
  };

  const renderCard = (card: GalleryItem, idx: number, extraClasses = '') => {
    return (
      <div
        key={card.id}
        onClick={() => openLightbox(idx)}
        onTouchStart={handleCardTouchStart}
        onTouchEnd={handleCardTouchEnd}
        className={`group relative rounded-[16px] min-[380px]:rounded-[20px] sm:rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.015] hover:shadow-xl hover:shadow-[#1F1A12]/10 bg-[#1F1A12] ${extraClasses}`}
      >
        <img
          src={withBase(card.mediaUrl)}
          alt={titleOf(card)}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none transition-opacity duration-300 group-hover:from-black/90" />

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-2.5 sm:p-5">
          <div className="flex items-center justify-end">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
          </div>

          <div>
            <span className="font-bold text-xs sm:text-base text-white tracking-tight select-none leading-snug drop-shadow-md block group-hover:text-[#F3DF9A] transition-colors line-clamp-1">
              {titleOf(card)}
            </span>
            {card.caption && (
              <p className="text-[9.5px] sm:text-xs text-[#FAF3E2]/80 line-clamp-1 mt-0.5 font-normal drop-shadow-xs">
                {captionOf(card)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const total = filteredItems.length;
  const maxStack = Math.min(total, 4);

  const getStackCards = () => {
    if (total === 0) return [];
    if (total === 1) return [{ card: filteredItems[0], depth: 0, index: 0 }];

    const cards: { card: GalleryItem; depth: number; index: number }[] = [];

    if (slideStatus === 'idle') {
      const isReverseDrag = isDragging && dragOffset > 0;
      for (let d = 0; d < maxStack; d++) {
        const itemIdx = isReverseDrag
          ? (activeSlide - d + total) % total
          : (activeSlide + d) % total;
        cards.push({ card: filteredItems[itemIdx], depth: d, index: itemIdx });
      }
    } else if (slideStatus === 'swiping-left') {
      const target = swipeTarget ?? (activeSlide + 1) % total;
      cards.push({ card: filteredItems[activeSlide], depth: 0, index: activeSlide });
      for (let d = 0; d < maxStack - 1; d++) {
        const itemIdx = (target + d) % total;
        cards.push({ card: filteredItems[itemIdx], depth: d + 1, index: itemIdx });
      }
    } else if (slideStatus === 'swiping-right') {
      const target = swipeTarget ?? (activeSlide - 1 + total) % total;
      cards.push({ card: filteredItems[activeSlide], depth: 0, index: activeSlide });
      for (let d = 0; d < maxStack - 1; d++) {
        const itemIdx = (target + d) % total;
        cards.push({ card: filteredItems[itemIdx], depth: d + 1, index: itemIdx });
      }
    }

    return cards;
  };

  const stackCards = getStackCards();
  const dragProgress = Math.min(1, Math.abs(dragOffset) / 110);

  return (
    <div className="w-full font-['Poppins',sans-serif]">
      <div className="bg-[#FAF3E2] rounded-2xl sm:rounded-[32px] p-3 sm:p-10 lg:p-12 shadow-[0_4px_30px_rgba(201,151,28,0.06)]">
        <div className="mb-3.5 sm:mb-8 space-y-0.5 sm:space-y-1 text-left">
          <span className="block text-[9.5px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-[#9E7B26]">
            {home.galleryEyebrow}
          </span>
          <h3 className="text-base min-[380px]:text-lg sm:text-3xl font-bold text-[#1F1A12] tracking-tight">
            {home.galleryHeading}
          </h3>
          <p className="text-[11px] sm:text-sm text-[#5A4E38] leading-relaxed max-w-xl">
            {home.galleryBody}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-4 overflow-x-auto pb-1 mb-3.5 sm:mb-8 no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-3.5 sm:px-9 py-1 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-muses-gradient text-[#1F1A12] shadow-xs'
                    : 'bg-white border border-[#C9971C]/50 text-[#1F1A12] hover:bg-[#FFFDF7]'
                }`}
              >
                {categoryLabel(cat)}
              </button>
            );
          })}
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-16 text-center text-[#7A6E58] text-sm bg-white/60 rounded-2xl">
            {d.empty}
          </div>
        ) : (
          <>
            <div className="md:hidden flex flex-col items-center">
              <div
                className="relative w-full h-[405px] min-[380px]:h-[435px] flex items-center justify-center select-none touch-pan-y"
                onTouchStart={(e) => handlePointerStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={handlePointerEnd}
                onMouseDown={(e) => handlePointerStart(e.clientX, e.clientY)}
                onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                onMouseUp={handlePointerEnd}
                onMouseLeave={handlePointerEnd}
              >
                {[...stackCards].reverse().map(({ card, depth, index }) => {
                  let transformStyle = '';
                  let opacityStyle = 1;
                  let filterStyle = 'none';
                  let zIndexStyle = 30;
                  let shadowClass = 'shadow-[0_16px_36px_rgba(31,26,18,0.26)]';
                  let transitionStyle =
                    'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.4s ease, filter 0.4s ease';

                  if (depth === 0) {
                    if (slideStatus === 'swiping-left') {
                      transformStyle = 'translate3d(-145%, 32px, 0) rotate(-22deg) scale(0.9)';
                      opacityStyle = 0;
                      zIndexStyle = 35;
                      transitionStyle =
                        'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.36s ease-out';
                    } else if (slideStatus === 'swiping-right') {
                      transformStyle = 'translate3d(145%, 32px, 0) rotate(22deg) scale(0.9)';
                      opacityStyle = 0;
                      zIndexStyle = 35;
                      transitionStyle =
                        'transform 0.42s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.36s ease-out';
                    } else if (isDragging) {
                      transformStyle = `translate3d(${dragOffset}px, 0, 0) rotate(${dragOffset * 0.05}deg) scale(1)`;
                      opacityStyle = 1;
                      zIndexStyle = 30;
                      transitionStyle = 'none';
                    } else {
                      transformStyle = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
                      opacityStyle = 1;
                      zIndexStyle = 30;
                    }
                  } else if (depth === 1) {
                    if (slideStatus !== 'idle') {
                      transformStyle = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
                      opacityStyle = 1;
                      filterStyle = 'brightness(1)';
                      zIndexStyle = 28;
                      shadowClass = 'shadow-[0_16px_36px_rgba(31,26,18,0.26)]';
                    } else {
                      zIndexStyle = 20;
                      shadowClass = 'shadow-[0_12px_24px_rgba(31,26,18,0.18)]';
                      const scale = 0.94 + 0.06 * dragProgress;
                      const translateY = 12 * (1 - dragProgress);
                      const translateX = 7 * (1 - dragProgress);
                      const rot = 2.8 * (1 - dragProgress);
                      opacityStyle = 0.90 + 0.10 * dragProgress;
                      filterStyle = `brightness(${0.92 + 0.08 * dragProgress})`;
                      transformStyle = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rot}deg) scale(${scale})`;
                      if (isDragging) transitionStyle = 'none';
                    }
                  } else if (depth === 2) {
                    if (slideStatus !== 'idle') {
                      transformStyle = 'translate3d(7px, 12px, 0) rotate(2.8deg) scale(0.94)';
                      opacityStyle = 0.90;
                      filterStyle = 'brightness(0.92)';
                      zIndexStyle = 18;
                      shadowClass = 'shadow-[0_12px_24px_rgba(31,26,18,0.18)]';
                    } else {
                      zIndexStyle = 10;
                      shadowClass = 'shadow-[0_8px_18px_rgba(31,26,18,0.14)]';
                      const scale = 0.88 + 0.06 * dragProgress;
                      const translateY = 22 - 10 * dragProgress;
                      const translateX = -7 + 14 * dragProgress;
                      const rot = -2.5 * (1 - dragProgress);
                      opacityStyle = 0.68 + 0.22 * dragProgress;
                      filterStyle = `brightness(${0.82 + 0.10 * dragProgress})`;
                      transformStyle = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rot}deg) scale(${scale})`;
                      if (isDragging) transitionStyle = 'none';
                    }
                  } else {
                    if (slideStatus !== 'idle') {
                      transformStyle = 'translate3d(-7px, 22px, 0) rotate(-2.5deg) scale(0.88)';
                      opacityStyle = 0.68;
                      filterStyle = 'brightness(0.82)';
                      zIndexStyle = 8;
                      shadowClass = 'shadow-[0_8px_18px_rgba(31,26,18,0.14)]';
                    } else {
                      zIndexStyle = 4;
                      shadowClass = 'shadow-[0_4px_12px_rgba(31,26,18,0.10)]';
                      const scale = 0.82 + 0.06 * dragProgress;
                      const translateY = 30 - 8 * dragProgress;
                      const translateX = 2 - 9 * dragProgress;
                      const rot = 1.2 * (1 - dragProgress);
                      opacityStyle = 0.38 + 0.30 * dragProgress;
                      filterStyle = `brightness(${0.72 + 0.10 * dragProgress})`;
                      transformStyle = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${rot}deg) scale(${scale})`;
                      if (isDragging) transitionStyle = 'none';
                    }
                  }

                  return (
                    <div
                      key={card.id}
                      onClick={() => {
                        if (slideStatus !== 'idle') return;
                        if (depth === 0) {
                          openLightbox(index);
                        } else {
                          triggerSwipe('left');
                        }
                      }}
                      style={{
                        transform: transformStyle,
                        opacity: opacityStyle,
                        filter: filterStyle,
                        zIndex: zIndexStyle,
                        transition: transitionStyle,
                      }}
                      className={`absolute w-[80vw] max-w-[285px] min-[380px]:max-w-[305px] aspect-[4/5] rounded-[22px] min-[380px]:rounded-[26px] overflow-hidden border-2 border-white cursor-pointer bg-[#1F1A12] will-change-transform ${shadowClass}`}
                    >
                      <img
                        src={withBase(card.mediaUrl)}
                        alt={titleOf(card)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover pointer-events-none select-none"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                      <div className="absolute top-3 left-3 z-10 pointer-events-none">
                        <span className="inline-block px-2 py-0.5 rounded text-[8.5px] font-mono tracking-widest uppercase bg-[#C28C1D] text-[#1F1A12] font-bold shadow-xs">
                          {localizeGalleryCategory(card.category, locale)}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 pointer-events-none">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-3.5 min-[380px]:p-4 z-10 text-left pointer-events-none">
                        <h4 className="text-sm min-[380px]:text-base font-bold text-white leading-snug drop-shadow-md line-clamp-1">
                          {titleOf(card)}
                        </h4>
                        {card.caption && (
                          <p className="text-[10px] min-[380px]:text-[11px] text-[#FAF3E2]/85 line-clamp-2 mt-0.5 font-normal">
                            {captionOf(card)}
                          </p>
                        )}
                        {depth === 0 && (
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/15 text-[9px] text-[#FAF3E2]/65">
                            <span>Geser kartu atau ketuk untuk zoom</span>
                            <span className="font-mono font-bold text-[#F3DF9A]">
                              {String(activeSlide + 1).padStart(2, '0')}/{String(filteredItems.length).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSwipe('right');
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      aria-label={d.prev}
                      className="absolute left-1 min-[380px]:left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-full bg-black/25 hover:bg-black/50 text-white/75 hover:text-white backdrop-blur-md border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerSwipe('left');
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      aria-label={d.next}
                      className="absolute right-1 min-[380px]:right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-full bg-black/25 hover:bg-black/50 text-white/75 hover:text-white backdrop-blur-md border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.18)] flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5 translate-x-0.5" />
                    </button>
                  </>
                )}
              </div>

              <div className="w-full flex items-center justify-center gap-3 mt-1.5 pt-1 max-w-[320px]">
                <span className="font-mono text-xs font-bold text-[#8C6A1C] tracking-widest">
                  {String(activeSlide + 1).padStart(2, '0')} / {String(filteredItems.length).padStart(2, '0')}
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[160px] no-scrollbar py-1">
                  {filteredItems.map((_, dotIdx) => {
                    const isDotActive = dotIdx === activeSlide;
                    return (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => goToSlide(dotIdx)}
                        aria-label={`Slide ${dotIdx + 1}`}
                        className={`transition-all duration-300 cursor-pointer ${
                          isDotActive
                            ? 'w-5 h-1.5 rounded-full bg-[#8C6A1C]'
                            : 'w-1.5 h-1.5 rounded-full bg-[#C9971C]/35 hover:bg-[#C9971C]/60'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="hidden md:grid md:grid-cols-12 gap-4 sm:gap-5">
              {visibleItems.length > 0 && (
                <div className="md:col-span-8 md:h-[380px] lg:h-[440px]">
                  {renderCard(visibleItems[0], 0, 'w-full h-full')}
                </div>
              )}

              {visibleItems.length > 1 && (
                <div className="md:col-span-4 md:h-[380px] lg:h-[440px]">
                  {renderCard(visibleItems[1], 1, 'w-full h-full')}
                </div>
              )}

              {visibleItems.length > 2 && (
                <div className="md:col-span-4 md:h-[280px] lg:h-[320px]">
                  {renderCard(visibleItems[2], 2, 'w-full h-full')}
                </div>
              )}

              {visibleItems.length > 3 && (
                <div className="md:col-span-4 md:h-[280px] lg:h-[320px]">
                  {renderCard(visibleItems[3], 3, 'w-full h-full')}
                </div>
              )}

              {visibleItems.length > 4 && (
                <div className="md:col-span-4 md:h-[280px] lg:h-[320px]">
                  {renderCard(visibleItems[4], 4, 'w-full h-full')}
                </div>
              )}

              {visibleItems.length > 5 && (
                <div className="md:col-span-6 md:h-[300px] lg:h-[340px]">
                  {renderCard(visibleItems[5], 5, 'w-full h-full')}
                </div>
              )}

              {visibleItems.length > 6 && (
                <div className="md:col-span-6 md:h-[300px] lg:h-[340px]">
                  {renderCard(visibleItems[6], 6, 'w-full h-full')}
                </div>
              )}

              {visibleItems.slice(7).map((card, idx) => (
                <div key={card.id} className="md:col-span-4 md:h-[280px] lg:h-[320px]">
                  {renderCard(card, idx + 7, 'w-full h-full')}
                </div>
              ))}
            </div>

            {visibleLimit < filteredItems.length && (
              <div className="hidden md:flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 6)}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase bg-muses-gradient text-[#1F1A12] hover:brightness-105 active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  {fmt(d.loadMore, { remaining: filteredItems.length - visibleLimit })}
                </button>
              </div>
            )}

            {visibleLimit >= filteredItems.length && filteredItems.length > 7 && (
              <div className="hidden md:block mt-6 text-center text-xs text-[#7A6E58]">
                {fmt(d.allShown, { count: filteredItems.length })}
              </div>
            )}
          </>
        )}
      </div>

      {activeItem && lightboxIndex !== null && createPortal(
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-md select-none touch-none overscroll-contain"
          onClick={closeLightbox}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
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
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-black transition-colors cursor-pointer"
              aria-label={d.closeLightbox}
            >
              <X className="w-5 h-5" />
            </button>

            {filteredItems.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) => (prev !== null ? (prev - 1 + filteredItems.length) % filteredItems.length : null))
                  }
                  className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer"
                  aria-label={d.prev}
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) => (prev !== null ? (prev + 1) % filteredItems.length : null))
                  }
                  className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-all cursor-pointer"
                  aria-label={d.next}
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            <div className="rounded-2xl overflow-hidden shadow-2xl bg-black max-h-[75vh]">
              <img
                src={withBase(activeItem.mediaUrl)}
                alt={titleOf(activeItem)}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="mt-3 text-center text-white px-4">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#F3DF9A] block mb-1">
                {localizeGalleryCategory(activeItem.category, locale)}
              </span>
              <h3 className="text-base sm:text-lg font-bold">
                {titleOf(activeItem)}
              </h3>
              {activeItem.caption && (
                <p className="text-xs text-white/80 mt-1 max-w-lg">
                  {captionOf(activeItem)}
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
