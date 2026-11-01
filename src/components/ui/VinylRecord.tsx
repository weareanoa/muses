import React, { useState } from 'react';
import { withBase } from '../../lib/paths';

export interface VinylRecordProps {
  coverImage: string;
  albumTitle: string;
  themeColor?: string;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  className?: string;
}

export default function VinylRecord({
  coverImage,
  albumTitle,
  themeColor = '#93C5FD',
  isPlaying = false,
  onTogglePlay,
  className = '',
}: VinylRecordProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative select-none group cursor-pointer w-[145px] h-[145px] min-[380px]:w-[165px] min-[380px]:h-[165px] sm:w-[320px] sm:h-[320px] md:w-[360px] md:h-[360px] lg:w-[400px] lg:h-[400px] ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onTogglePlay}
    >
      <div className="absolute -bottom-6 left-6 right-6 h-16 sm:-bottom-8 sm:left-8 sm:right-8 sm:h-20 rounded-full filter blur-xl sm:blur-2xl opacity-35 pointer-events-none overflow-hidden transition-all duration-700">
        <img
          src={withBase(coverImage)}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
      </div>

      <div
        className={`absolute inset-y-1 sm:inset-y-2 right-1 sm:right-2 w-[92%] aspect-square rounded-full z-10 transition-all duration-700 ease-out origin-center pointer-events-none shadow-[0_10px_25px_rgba(0,0,0,0.3)] sm:shadow-[0_15px_40px_rgba(0,0,0,0.35)] ${
          isHovered || isPlaying
            ? 'translate-x-[42%] sm:translate-x-[48%]'
            : 'translate-x-[34%] sm:translate-x-[40%]'
        }`}
      >
        <div
          className="w-full h-full relative rounded-full animate-[spin_6s_linear_infinite]"
          style={{
            animationPlayState: isPlaying ? 'running' : isHovered ? 'running' : 'paused',
          }}
        >
          <div className="w-full h-full rounded-full bg-[#0d0d0d] relative overflow-hidden border border-[#222]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_center,_#222_0%,_#0d0d0d_70%)]" />

            <div className="absolute inset-[8%] rounded-full border border-white/[0.04]" />
            <div className="absolute inset-[13%] rounded-full border border-white/[0.06]" />
            <div className="absolute inset-[18%] rounded-full border border-white/[0.04]" />
            <div className="absolute inset-[23%] rounded-full border border-white/[0.06]" />
            <div className="absolute inset-[27%] rounded-full border border-white/[0.04]" />
            <div className="absolute inset-[31%] rounded-full border border-white/[0.06]" />

            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/[0.08] to-transparent pointer-events-none" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-white/[0.08] to-transparent pointer-events-none" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[34%] aspect-square rounded-full overflow-hidden border-[1.5px] sm:border-[2.5px] border-[#333] shadow-inner flex items-center justify-center">
              <img
                src={withBase(coverImage)}
                alt={albumTitle}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/15 pointer-events-none" />
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full bg-[#18181B] border-[1.5px] sm:border-2 border-[#FAF7EF] shadow-md z-10" />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`relative z-20 w-full h-full rounded-[16px] min-[380px]:rounded-[20px] sm:rounded-[34px] overflow-hidden bg-white border border-white/70 shadow-[0_10px_25px_rgba(0,0,0,0.1)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.14)] transition-all duration-500 ease-out ${
          isHovered ? 'scale-[1.01] -translate-y-0.5 sm:-translate-y-1 shadow-[0_15px_35px_rgba(0,0,0,0.15)] sm:shadow-[0_25px_60px_rgba(0,0,0,0.18)]' : ''
        }`}
      >
        <img
          src={withBase(coverImage)}
          alt={albumTitle}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/20 pointer-events-none" />
      </div>
    </div>
  );
}
