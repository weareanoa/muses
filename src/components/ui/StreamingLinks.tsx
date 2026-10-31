import React from 'react';
import { getDict, type Locale } from '../../i18n/dictionary';

export interface StreamingLinksProps {
  spotify?: string;
  youtube?: string;
  className?: string;
  locale?: Locale;
}

export default function StreamingLinks({
  spotify,
  youtube,
  className = '',
  locale = 'id',
}: StreamingLinksProps) {
  const d = getDict(locale).discography;
  return (
    <div className={`space-y-2 ${className}`}>
      <span className="text-xs text-[#555] font-medium block">
        {d.listenOn}
      </span>
      <div className="flex items-center flex-wrap gap-2.5">
        {spotify && (
          <a
            href={spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] hover:brightness-105 text-[#1F1A12] text-xs font-semibold shadow-xs transition-[transform,filter] duration-200 active:scale-95"
            title={d.spotifyTitle}
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
            <span>Spotify</span>
          </a>
        )}

        {youtube && (
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#E2E8F0]/80 hover:bg-white text-[#1E293B] border border-[#CBD5E1] text-xs font-semibold shadow-xs transition-[transform,background-color] duration-200 active:scale-95"
            title={d.youtubeTitle}
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>Youtube</span>
          </a>
        )}

      </div>
    </div>
  );
}
