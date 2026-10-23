import { withBaseDeep } from '../../lib/paths';
import React, { useState, useEffect } from 'react';
import galleryDataRaw from '../../data/gallery.json';
import { Play, X, ChevronLeft, ChevronRight, Calendar, Sparkles, Image as ImageIcon } from 'lucide-react';
const galleryData = withBaseDeep(galleryDataRaw);

interface GalleryItem {
  id: string;
  title: string;
  category: string;
  mediaType: string;
  mediaUrl: string;
  thumbnail: string;
  takenAt: string;
  caption: string;
  albumGroup?: string;
  aspect?: string;
}

export default function GalleryGrid() {
  const [activeCategory, setActiveCategory] = useState<string>('Semua');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const categories = ['Semua', 'Konser', 'Behind the Scenes', 'Event'];

  const filteredItems: GalleryItem[] = galleryData.filter((item) => {
    if (activeCategory === 'Semua') return true;
    return item.category.toLowerCase() === activeCategory.toLowerCase();
  });

  const activeItem = activeLightboxIndex !== null ? filteredItems[activeLightboxIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, filteredItems]);

  const handleNext = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((activeLightboxIndex + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((activeLightboxIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  const getTileClasses = (aspect?: string, index?: number) => {
    if (aspect === 'wide') return 'md:col-span-2 md:row-span-1 h-72 sm:h-80';
    if (aspect === 'tall') return 'md:col-span-1 md:row-span-2 h-96 sm:h-[440px]';
    return 'col-span-1 h-64 sm:h-72';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-10">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setActiveLightboxIndex(null);
              }}
              className={`px-5 py-2 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'pill-active text-[#1F1A12]'
                  : 'pill-inactive'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 auto-rows-fr">
        {filteredItems.map((item, idx) => {
          const isVideo = item.mediaType === 'video';
          return (
            <div
              key={item.id}
              onClick={() => setActiveLightboxIndex(idx)}
              className={`group relative rounded-3xl overflow-hidden border border-[#C9971C]/25 bg-white shadow-md hover:shadow-2xl hover:border-[#C9971C] transition-all duration-300 cursor-pointer ${getTileClasses(
                item.aspect,
                idx
              )}`}
            >
              <img
                src={item.thumbnail}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover filter contrast-105 group-hover:scale-108 transition-transform duration-700 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

              <div className="absolute top-4 left-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold bg-white/90 backdrop-blur-md text-[#8C6A1C] border border-[#C9971C]/30 shadow-xs">
                  {item.category}
                </span>
              </div>

              {isVideo && (
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full gold-gradient-bg flex items-center justify-center text-[#1F1A12] shadow-md group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              )}

              <div className="absolute bottom-4 inset-x-4 text-white">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#F7E08F] mb-1">
                  <Calendar className="w-3 h-3" />
                  <span>{item.takenAt}</span>
                  {item.albumGroup && (
                    <>
                      <span>•</span>
                      <span>{item.albumGroup}</span>
                    </>
                  )}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#F7E08F] transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs text-[#FDF6E7]/80 line-clamp-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.caption}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
          onClick={() => setActiveLightboxIndex(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-[#FCFAF5] rounded-3xl overflow-hidden border border-[#C9971C]/35 shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-[#C9971C]/25 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold gold-gradient-bg text-[#1F1A12]">
                  {activeItem.category}
                </span>
                <span className="text-xs font-mono text-[#6E6453]">
                  {activeItem.takenAt}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Sebelumnya"
                  className="p-2 rounded-xl bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Berikutnya"
                  className="p-2 rounded-xl bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(null)}
                  aria-label="Tutup"
                  className="p-2 rounded-xl bg-[#1F1A12]/5 hover:bg-red-500/15 border border-[#1F1A12]/15 text-[#1F1A12] hover:text-red-600 transition-colors cursor-pointer ml-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden bg-black flex items-center justify-center min-h-[300px] sm:min-h-[460px]">
              {activeItem.mediaType === 'video' ? (
                <iframe
                  src={activeItem.mediaUrl}
                  title={activeItem.title}
                  className="w-full h-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <img
                  src={activeItem.mediaUrl}
                  alt={activeItem.title}
                  className="max-h-[70vh] w-auto object-contain mx-auto"
                />
              )}
            </div>

            <div className="p-5 sm:p-6 bg-white border-t border-[#C9971C]/25 space-y-2">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1F1A12]">
                {activeItem.title}
              </h3>
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
