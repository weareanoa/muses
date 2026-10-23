import { withBaseDeep } from '../../lib/paths';
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  currentTrack,
  isPlaying,
  audioCurrentTime,
  playTrack,
  toggleAudio,
  type PlayingTrack,
} from '../../stores/audioStore';
import discographyDataRaw from '../../data/discography.json';
import VinylRecord from '../ui/VinylRecord';
import StreamingLinks from '../ui/StreamingLinks';
import {
  Play,
  Pause,
  Disc3,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Tv
} from 'lucide-react';
const discographyData = withBaseDeep(discographyDataRaw);

export default function VinylPlayer() {
  const activeTrack = useStore(currentTrack);
  const playing = useStore(isPlaying);
  const currentTime = useStore(audioCurrentTime);

  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const albumTabsRef = useRef<HTMLDivElement>(null);

  const currentAlbum = discographyData[selectedAlbumIndex] || discographyData[0];
  const titleTrack = currentAlbum.titleTrack;
  const isCurrentPlaying = playing && activeTrack?.albumId === currentAlbum.id;

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

  const handleAlbumSelect = (idx: number, e?: React.MouseEvent) => {
    setSelectedAlbumIndex(idx);
    if (albumTabsRef.current && e?.currentTarget) {
      const container = albumTabsRef.current;
      const target = e.currentTarget as HTMLElement;
      const scrollLeft = target.offsetLeft - container.offsetWidth / 2 + target.offsetWidth / 2;
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }

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

  const scrollAlbums = (direction: 'left' | 'right') => {
    if (albumTabsRef.current) {
      albumTabsRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-[#C9971C]/25 bg-white/80 shadow-[0_20px_60px_rgba(201,151,28,0.14)] backdrop-blur-2xl transition-all duration-700">
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-15 filter blur-3xl scale-110 transition-all duration-1000 ease-out"
        style={{ backgroundImage: `url(${currentAlbum.coverImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FCFAF5]/80 via-white/85 to-[#FCFAF5]/95 pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-8 lg:p-12 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-3 flex flex-col items-center justify-center relative py-6">
            <VinylRecord
              coverImage={currentAlbum.coverImage}
              albumTitle={currentAlbum.albumTitle}
              themeColor={currentAlbum.themeColor}
              isPlaying={isCurrentPlaying}
              onTogglePlay={handleTogglePlay}
              size="md"
            />

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlay}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full pill-active text-[#1F1A12] text-xs font-bold tracking-wider uppercase transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              >
                {isCurrentPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Jeda Cuplikan (Pause)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Putar Vinyl ({titleTrack.title})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col space-y-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-widest font-bold border"
                  style={{
                    borderColor: `${currentAlbum.themeColor}60`,
                    color: currentAlbum.themeColor || '#C9971C',
                    backgroundColor: `${currentAlbum.themeColor}15`,
                  }}
                >
                  {currentAlbum.type}
                </span>
                <span className="text-[11px] font-mono text-[#6E6453]">
                  Rilis {currentAlbum.releaseDate}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-[#1F1A12] uppercase tracking-tight">
                {currentAlbum.albumTitle}
              </h2>

              <p className="text-xs text-[#4B4335] leading-relaxed mt-2">
                {currentAlbum.description}
              </p>
            </div>

            <div className="w-full">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/5 border border-[#C9971C]/25 shadow-md">
                <iframe
                  src={currentAlbum.iframeUrl}
                  title={`${currentAlbum.albumTitle} Music Video`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            <StreamingLinks
              spotify={titleTrack.links.spotify}
              youtube={titleTrack.links.youtube}
              appleMusic={titleTrack.links.appleMusic}
            />
          </div>
        </div>

        <div className="border-t border-[#C9971C]/20 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C9971C] font-bold block">
                DISCOGRAPHY ARCHIVE
              </span>
              <h3 className="text-lg font-bold text-[#1F1A12]">
                Pilih Album Lainnya
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollAlbums('left')}
                aria-label="Previous album"
                className="p-2 rounded-full bg-white hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollAlbums('right')}
                aria-label="Next album"
                className="p-2 rounded-full bg-white hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={albumTabsRef}
            data-lenis-prevent
            className="flex items-center overflow-x-auto gap-3.5 p-4 scrollbar-none overscroll-contain select-none scroll-smooth"
          >
            {discographyData.map((album, idx) => {
              const isSelected = selectedAlbumIndex === idx;
              return (
                <button
                  key={album.id}
                  onClick={(e) => handleAlbumSelect(idx, e)}
                  className={`shrink-0 w-36 sm:w-40 lg:w-46 rounded-2xl overflow-hidden border transition-all duration-300 p-1.5 bg-white cursor-pointer group text-left ${
                    isSelected
                      ? 'border-[#C9971C] ring-2 ring-[#C9971C] shadow-[0_0_20px_rgba(201,151,28,0.35)] scale-105'
                      : 'border-[#C9971C]/20 hover:border-[#C9971C]/60 hover:scale-102 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FDF6E7] mb-1.5">
                    <img
                      src={album.coverImage}
                      alt={album.albumTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-[10px] font-mono text-[#8C6A1C] truncate font-bold">
                    {album.type.split(' ')[0]}
                  </p>
                  <p className="text-xs font-bold text-[#1F1A12] truncate">
                    {album.albumTitle.split(':')[1] || album.albumTitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
