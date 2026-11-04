import React from 'react';
import { getDict, type Locale } from '../../i18n/dictionary';
import { withBase } from '../../lib/paths';

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
    <div className={`space-y-1.5 ${className}`}>
      <span className="text-[11px] sm:text-xs text-[#555] font-medium block">
        {d.listenOn}
      </span>
      <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
        {spotify && (
          <a
            href={spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-[#C28C1D] via-[#DBA736] to-[#A37418] hover:brightness-105 text-[#1F1A12] text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 active:scale-95 shrink-0"
            title={d.spotifyTitle}
          >
            <img
              src={withBase('/icon/Spotify.svg')}
              alt=""
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain shrink-0"
              aria-hidden="true"
            />
            <span>Spotify</span>
          </a>
        )}

        {youtube && (
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#FFFDF9] hover:bg-white text-[#1F1A12] border border-[#DEB887]/80 text-[11px] sm:text-xs font-semibold shadow-xs transition-all duration-200 active:scale-95 shrink-0"
            title={d.youtubeTitle}
          >
            <img
              src={withBase('/icon/YouTube.svg')}
              alt=""
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 object-contain shrink-0"
              aria-hidden="true"
            />
            <span>Youtube</span>
          </a>
        )}
      </div>
    </div>
  );
}
