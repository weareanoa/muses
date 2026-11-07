import { withBase, withBaseDeep } from '../../lib/paths';
import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentTrack,
  isPlaying,
  playTrack,
  toggleAudio,
  type PlayingTrack,
} from '../../stores/audioStore';
import discographyDataRaw from '../../data/discography.json';
import VinylRecord from '../ui/VinylRecord';
import StreamingLinks from '../ui/StreamingLinks';
import { Play, Pause, X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';

const discographyData = withBaseDeep(discographyDataRaw);

export default function VinylPlayer({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).discography;
  const activeTrack = useStore(currentTrack);
  const playing = useStore(isPlaying);

  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const currentAlbum = discographyData[selectedAlbumIndex] || discographyData[0];
  const isDarkAlbum = !!(currentAlbum as { isDark?: boolean }).isDark;
  const titleTrack = currentAlbum.titleTrack;
  const isCurrentPlaying = playing && activeTrack?.albumId === currentAlbum.id;

  useScrollLock(isVideoModalOpen);

  useEffect(() => {
    if (!activeTrack && titleTrack) {
      const trackObj: PlayingTrack = {
        albumId: currentAlbum.id,
        albumTitle: currentAlbum.albumTitle,
        coverImage: currentAlbum.coverImage,
        themeColor: currentAlbum.themeColor,
        title: titleTrack.title,
        startAtSecond: titleTrack.startAtSecond,
        previewAudioUrl: titleTrack.previewAudioUrl,
        externalLinks: titleTrack.links,
      };
      currentTrack.set(trackObj);
    }
  }, []);

  const handleTogglePlay = () => {
    if (activeTrack && activeTrack.albumId === currentAlbum.id) {
      toggleAudio();
    } else {
      const trackObj: PlayingTrack = {
        albumId: currentAlbum.id,
        albumTitle: currentAlbum.albumTitle,
        coverImage: currentAlbum.coverImage,
        themeColor: currentAlbum.themeColor,
        title: titleTrack.title,
        startAtSecond: titleTrack.startAtSecond,
        previewAudioUrl: titleTrack.previewAudioUrl,
        externalLinks: titleTrack.links,
      };
      playTrack(trackObj, 30);
    }
  };

  const handleAlbumSelect = (idx: number) => {
    setSelectedAlbumIndex(idx);
    const newAlbum = discographyData[idx];
    if (newAlbum) {
      const trackObj: PlayingTrack = {
        albumId: newAlbum.id,
        albumTitle: newAlbum.albumTitle,
        coverImage: newAlbum.coverImage,
        themeColor: newAlbum.themeColor,
        title: newAlbum.titleTrack.title,
        startAtSecond: newAlbum.titleTrack.startAtSecond,
        previewAudioUrl: newAlbum.titleTrack.previewAudioUrl,
        externalLinks: newAlbum.titleTrack.links,
      };

      if (playing) {
        playTrack(trackObj, 30);
      } else {
        currentTrack.set(trackObj);
      }
    }
  };

  const renderAlbumThumbnails = (gridClass: string) => (
    <div className={gridClass}>
      {discographyData.map((album, idx) => {
        const isSelected = selectedAlbumIndex === idx;
        return (
          <button
            key={album.id}
            type="button"
            onClick={() => handleAlbumSelect(idx)}
            className={`group relative aspect-square rounded-lg min-[380px]:rounded-xl sm:rounded-2xl overflow-hidden border-[2px] transition-all duration-300 p-0 bg-white cursor-pointer text-left focus:outline-none ${
              isSelected
                ? 'border-white ring-2 ring-[#C28C1D]/60 shadow-md scale-[1.03]'
                : 'border-white/40 shadow-xs opacity-85 hover:opacity-100 hover:scale-[1.02]'
            }`}
          >
            <img
              src={album.coverImage}
              alt={album.albumTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                isSelected
                  ? 'bg-gradient-to-t from-black/20 via-transparent to-transparent'
                  : 'bg-black/10 group-hover:bg-transparent'
              }`}
            />
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'paint' }}>
        {discographyData.map((album, idx) => {
          const isActive = selectedAlbumIndex === idx;
          return (
            <div
              key={album.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-45 sm:opacity-60' : 'opacity-0'
              }`}
            >
              <img
                src={album.coverImage}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover filter blur-[6px] sm:blur-[10px] saturate-[1.35] brightness-[0.62] scale-110 transform-gpu will-change-transform"
              />
            </div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto py-5 sm:py-14 px-4 sm:px-8">
        <div className="mb-6 min-[380px]:mb-7 sm:mb-10 text-left">
            <h2 className={`text-3xl min-[380px]:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-balbes leading-none tracking-normal select-none transition-colors duration-500 ${isDarkAlbum ? 'text-[#FCFAF5]' : 'text-[#1F1A12]'}`}>
            {d.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-12 items-center mb-8 sm:mb-16">
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative py-1 sm:py-4 pr-5 sm:pr-8">
            <VinylRecord
              coverImage={currentAlbum.coverImage}
              albumTitle={currentAlbum.albumTitle}
              themeColor={currentAlbum.themeColor}
              isPlaying={isCurrentPlaying}
              onTogglePlay={handleTogglePlay}
            />
          </div>

          <div className="w-full max-w-[270px] min-[380px]:max-w-[295px] sm:max-w-md mx-auto my-1.5 sm:my-4 lg:hidden">
            {renderAlbumThumbnails("grid grid-cols-4 gap-1.5 min-[380px]:gap-2 sm:gap-4")}
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center space-y-2 sm:space-y-4 max-w-sm sm:max-w-lg mx-auto lg:mx-0 w-full text-left">
            <div>
              <span className="inline-block px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-muses-gradient text-[#1F1A12] shadow-xs">
                {currentAlbum.singleTag || currentAlbum.type}
              </span>

              <h3 className={`text-xl min-[380px]:text-2xl sm:text-4xl lg:text-5xl font-balbes tracking-tight mt-1.5 sm:mt-2.5 font-normal transition-colors duration-500 ${isDarkAlbum ? 'text-white' : 'text-[#18181B]'}`}>
                {currentAlbum.albumTitle}
              </h3>

              <p className={`text-[11px] min-[380px]:text-xs sm:text-sm leading-relaxed mt-1 sm:mt-2 max-w-md transition-colors duration-500 ${isDarkAlbum ? 'text-white/80' : 'text-[#555]'}`}>
                {locale === 'en' && (currentAlbum as { descriptionEn?: string }).descriptionEn ? (currentAlbum as { descriptionEn?: string }).descriptionEn : currentAlbum.description}
              </p>
            </div>

            <div className="pt-0.5 sm:pt-1">
              <div
                onClick={() => setIsVideoModalOpen(true)}
                className="relative aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden border-[1.5px] border-[#D4A017]/70 shadow-md group cursor-pointer bg-black/5"
              >
                <img
                  src={withBase(currentAlbum.mvThumbnail || currentAlbum.coverImage)}
                  alt={fmt(d.mvTitle, { album: currentAlbum.albumTitle })}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20 group-hover:from-black/70 transition-colors" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 sm:w-14 sm:h-14 rounded-full bg-[#E5B548]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-current ml-0.5" />
                </div>

                <div className="absolute bottom-2 left-3 right-3 sm:bottom-2.5 sm:left-3.5 sm:right-3.5 flex items-end justify-between">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-[7.5px] min-[380px]:text-[8px] sm:text-[9px] font-mono tracking-widest uppercase bg-black/60 backdrop-blur-xs text-white block w-fit mb-0.5 border border-white/10">
                      {d.mvLabel}
                    </span>
                    <h4 className="text-sm min-[380px]:text-base sm:text-xl font-balbes text-white tracking-wide drop-shadow-md">
                      {currentAlbum.albumTitle}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-0.5 sm:pt-1">
              <StreamingLinks
                spotify={titleTrack.links.spotify}
                youtube={titleTrack.links.youtube}
                locale={locale}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block pt-8 border-t border-[#C9971C]/15">
          {renderAlbumThumbnails("grid grid-cols-4 gap-4 sm:gap-6")}
        </div>

        {isVideoModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <div
              className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/60 hover:bg-black text-white transition-all cursor-pointer"
                aria-label={d.closeVideo}
              >
                <X className="w-5 h-5" />
              </button>
              <iframe
                src={`${currentAlbum.iframeUrl}?autoplay=1`}
                title={fmt(d.mvTitle, { album: currentAlbum.albumTitle })}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
