import React, { useState, useEffect } from 'react';
import { withBase } from '../../lib/paths';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface BentoCardItem {
  id: string;
  displayTitle: string;
  category: 'Konser' | 'Behind the Scenes' | 'Event';
  gradient: string;
  textColor: string;
  textAlign: 'left' | 'center';
  mediaUrl: string;
  caption: string;
}

const BENTO_CARDS: BentoCardItem[] = [
  {
    id: 'bento-1',
    displayTitle: 'Muses 1st Anniversary',
    category: 'Event',
    gradient: 'linear-gradient(135deg, #CF9718 0%, #E5B438 50%, #F5DE98 100%)',
    textColor: '#7A540D',
    textAlign: 'left',
    mediaUrl: '/images/muses_group_frame1.svg',
    caption: 'Momen bersejarah perayaan satu tahun perjalanan MUSES bersama ribuan fans setia di Grand Hall.',
  },
  {
    id: 'bento-2',
    displayTitle: 'BTS',
    category: 'Behind the Scenes',
    gradient: 'linear-gradient(135deg, #B584E8 0%, #CCA4F5 50%, #EBD5FD 100%)',
    textColor: '#492F64',
    textAlign: 'center',
    mediaUrl: '/images/members/vira.webp',
    caption: 'Aria memimpin pemanasan vokal dan peregangan sebelum soundcheck dimulai.',
  },
  {
    id: 'bento-3',
    displayTitle: 'BTS',
    category: 'Behind the Scenes',
    gradient: 'linear-gradient(135deg, #469651 0%, #68B172 50%, #A6DBAD 100%)',
    textColor: '#224828',
    textAlign: 'center',
    mediaUrl: '/images/members/vely.webp',
    caption: 'Clara mengambil nada tinggi dramatis di bilik rekaman studio utama Aureum Records.',
  },
  {
    id: 'bento-4',
    displayTitle: 'Muses 1st Anniversary',
    category: 'Konser',
    gradient: 'linear-gradient(135deg, #B57486 0%, #CB8E9E 50%, #EFCAD3 100%)',
    textColor: '#63313E',
    textAlign: 'left',
    mediaUrl: '/images/tours/poster-2.svg',
    caption: 'Penampilan megah membawakan lagu First Light dengan tata panggung cahaya keemasan spektakuler.',
  },
  {
    id: 'bento-5',
    displayTitle: 'Muses 1st Anniversary',
    category: 'Event',
    gradient: 'linear-gradient(135deg, #6F92B5 0%, #90AFCE 50%, #D0DEEC 100%)',
    textColor: '#7A5612',
    textAlign: 'left',
    mediaUrl: '/images/members/faril.webp',
    caption: 'Sesi temu sapa hangat dan penampilan akustik intim bersama member di sore hari.',
  },
  {
    id: 'bento-6',
    displayTitle: 'BTS',
    category: 'Behind the Scenes',
    gradient: 'linear-gradient(135deg, #E8CD78 0%, #F3DF9A 50%, #FAF0C9 100%)',
    textColor: '#775614',
    textAlign: 'center',
    mediaUrl: '/images/members/mine.webp',
    caption: 'Latihan koreografi intensif di studio tari menjelang peluncuran tur dunia.',
  },
  {
    id: 'bento-7',
    displayTitle: 'BTS',
    category: 'Konser',
    gradient: 'linear-gradient(135deg, #4387DF 0%, #6BA4EC 50%, #AED0F7 100%)',
    textColor: '#173660',
    textAlign: 'center',
    mediaUrl: '/images/tours/poster-1.svg',
    caption: 'Pesta kembang api keemasan menutup konser tur dengan sorakan gemuruh ribuan penonton.',
  },
];

export default function GalleryGrid() {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = ['Semua', 'Konser', 'Behind the Scenes', 'Event'];

  const activeItem = lightboxIndex !== null ? BENTO_CARDS[lightboxIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % BENTO_CARDS.length : null));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev !== null ? (prev - 1 + BENTO_CARDS.length) % BENTO_CARDS.length : null));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex]);

  const isCardActive = (cat: string) => {
    if (activeCategory === 'Semua') return true;
    return cat.toLowerCase() === activeCategory.toLowerCase();
  };

  const renderCard = (card: BentoCardItem, idx: number, extraClasses = '') => {
    const active = isCardActive(card.category);
    return (
      <div
        key={card.id}
        onClick={() => setLightboxIndex(idx)}
        className={`group relative rounded-[22px] sm:rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 ${
          active
            ? 'opacity-100 hover:scale-[1.015] hover:shadow-md'
            : 'opacity-35 scale-[0.98]'
        } ${extraClasses}`}
        style={{ background: card.gradient }}
      >
        <div
          className={`relative z-10 w-full h-full flex flex-col justify-end ${
            card.textAlign === 'center' ? 'items-center text-center p-4' : 'items-start text-left p-5 sm:p-6'
          }`}
        >
          <span
            className="font-bold text-sm sm:text-base tracking-tight select-none leading-snug drop-shadow-2xs"
            style={{ color: card.textColor }}
          >
            {card.displayTitle}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full font-['Poppins',sans-serif]">
      <div className="bg-[#FAF3E2] border border-[#EADBBD] rounded-3xl sm:rounded-[32px] p-6 sm:p-10 lg:p-12 shadow-[0_4px_30px_rgba(201,151,28,0.06)]">
        <div className="mb-6 sm:mb-8 space-y-1">
          <span className="block text-xs font-semibold tracking-[0.2em] uppercase text-[#9E7B26]">
            OUR LITTLE UNIVERSE
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#1F1A12] tracking-tight">
            Little Moments, Endless Memories.
          </h3>
          <p className="text-xs sm:text-sm text-[#5A4E38] leading-relaxed">
            From little behind-the-scenes moments to unforgettable days with our favorite stars.
          </p>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap mb-8">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-7 sm:px-9 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-[#B98616] via-[#D3A027] to-[#A37412] text-[#1F1A12] shadow-xs'
                    : 'bg-white border border-[#C9971C]/60 text-[#1F1A12] hover:bg-[#FFFDF7]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
          <div className="md:col-span-5 flex flex-col gap-4 sm:gap-5">
            {renderCard(BENTO_CARDS[0], 0, 'h-[210px] sm:h-[235px]')}
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {renderCard(BENTO_CARDS[1], 1, 'h-[145px] sm:h-[165px]')}
              {renderCard(BENTO_CARDS[2], 2, 'h-[145px] sm:h-[165px]')}
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-4 sm:gap-5">
            {renderCard(BENTO_CARDS[3], 3, 'h-[140px] sm:h-[155px]')}
            {renderCard(BENTO_CARDS[4], 4, 'h-[215px] sm:h-[245px] flex-1')}
          </div>

          <div className="md:col-span-3 flex flex-col gap-4 sm:gap-5">
            {renderCard(BENTO_CARDS[5], 5, 'h-[175px] sm:h-[195px]')}
            {renderCard(BENTO_CARDS[6], 6, 'h-[180px] sm:h-[205px] flex-1')}
          </div>
        </div>
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#FCFAF5] rounded-3xl overflow-hidden border border-[#C9971C]/35 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[#C9971C]/20 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#B98616] via-[#D3A027] to-[#A37418] text-[#1F1A12]">
                  {activeItem.category}
                </span>
                <span className="text-xs font-semibold text-[#1F1A12]">
                  {activeItem.displayTitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev - 1 + BENTO_CARDS.length) % BENTO_CARDS.length : null
                    )
                  }
                  aria-label="Sebelumnya"
                  className="p-1.5 rounded-xl bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev !== null ? (prev + 1) % BENTO_CARDS.length : null
                    )
                  }
                  aria-label="Berikutnya"
                  className="p-1.5 rounded-xl bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  aria-label="Tutup"
                  className="p-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#1F1A12] cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden bg-neutral-950 flex items-center justify-center p-4 min-h-[260px] sm:min-h-[380px]">
              <img
                src={withBase(activeItem.mediaUrl)}
                alt={activeItem.displayTitle}
                className="max-h-[60vh] w-auto max-w-full object-contain mx-auto rounded-xl drop-shadow-xl"
              />
            </div>

            <div className="p-5 bg-white border-t border-[#C9971C]/20">
              <p className="text-xs sm:text-sm text-[#4B4335] leading-relaxed">
                {activeItem.caption}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
