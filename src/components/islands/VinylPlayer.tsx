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

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" style={{ contain: 'paint' }}>
        {discographyData.map((album, idx) => {
          const isActive = selectedAlbumIndex === idx;
          return (
            <div
              key={album.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-40 sm:opacity-50' : 'opacity-0'
              }`}
            >
              <img
                src={album.coverImage}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover filter blur-[32px] sm:blur-[48px] scale-110 transform-gpu will-change-transform"
              />
            </div>
          );
        })}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto py-10 sm:py-16 px-4 sm:px-8">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-balbes text-[#18181B] tracking-tight font-normal">
            {d.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16 sm:mb-20">
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative py-4 sm:py-6">
            <VinylRecord
              coverImage={currentAlbum.coverImage}
              albumTitle={currentAlbum.albumTitle}
              themeColor={currentAlbum.themeColor}
              isPlaying={isCurrentPlaying}
              onTogglePlay={handleTogglePlay}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center space-y-4 max-w-lg mx-auto lg:mx-0 w-full">
            <div>
              <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] text-[#1F1A12] shadow-xs">
                {currentAlbum.singleTag || currentAlbum.type}
              </span>

              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-balbes text-[#18181B] tracking-tight mt-3 font-normal">
                {currentAlbum.albumTitle}
              </h3>

              <p className="text-xs sm:text-sm text-[#555] leading-relaxed mt-3">
                {locale === 'en' && (currentAlbum as { descriptionEn?: string }).descriptionEn ? (currentAlbum as { descriptionEn?: string }).descriptionEn : currentAlbum.description}
              </p>
            </div>

            <div className="pt-2">
              <div
                onClick={() => setIsVideoModalOpen(true)}
                className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-[1.5px] border-[#D4A017]/70 shadow-lg group cursor-pointer bg-black/5"
              >
                <img
                  src={withBase(currentAlbum.mvThumbnail || currentAlbum.coverImage)}
                  alt={fmt(d.mvTitle, { album: currentAlbum.albumTitle })}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/20 group-hover:from-black/70 transition-colors" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#E5B548]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-1" />
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-black/60 backdrop-blur-xs text-white block w-fit mb-1 border border-white/10">
                      {d.mvLabel}
                    </span>
                    <h4 className="text-lg sm:text-xl font-balbes text-white tracking-wide drop-shadow-md">
                      {currentAlbum.albumTitle}
                    </h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <StreamingLinks
                spotify={titleTrack.links.spotify}
                youtube={titleTrack.links.youtube}
                locale={locale}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#C9971C]/15">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {discographyData.map((album, idx) => {
              const isSelected = selectedAlbumIndex === idx;
              return (
                <button
                  key={album.id}
                  type="button"
                  onClick={() => handleAlbumSelect(idx)}
                  className={`group relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-[2.5px] transition-all duration-300 p-0 bg-white cursor-pointer text-left focus:outline-none ${
                    isSelected
                      ? 'border-[#D4A017] ring-2 ring-[#D4A017]/40 shadow-xl scale-[1.03] -translate-y-1.5'
                      : 'border-transparent shadow-md hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 opacity-80 hover:opacity-100'
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
                        ? 'bg-gradient-to-t from-black/25 via-transparent to-transparent'
                        : 'bg-black/10 group-hover:bg-transparent'
                    }`}
                  />
                </button>
              );
            })}
          </div>
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
