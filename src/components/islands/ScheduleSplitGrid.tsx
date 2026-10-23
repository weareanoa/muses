import React, { useState, useEffect, useMemo } from 'react';
import { withBase, withBaseDeep } from '../../lib/paths';
import schedulesDataRaw from '../../data/schedules.json';
import { MapPin, Clock, Ticket } from 'lucide-react';

const schedulesData = withBaseDeep(schedulesDataRaw);

export interface ScheduleItem {
  id: string;
  tourName: string;
  title?: string;
  day: string;
  dayName: string;
  month: string;
  year: string;
  city: string;
  country: string;
  venue: string;
  status: 'Available' | 'Selling Fast' | 'Sold Out' | 'Coming Soon' | string;
  doorOpen?: string;
  showTime: string;
  ticketUrl: string;
  posterImage: string;
  targetDate?: string;
}

function GoldenSparkle({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <div className={`relative inline-flex items-center justify-center pointer-events-none select-none ${className}`}>
      <div className="absolute inset-0 bg-[#E2B73E]/30 rounded-full blur-[6px] transform scale-125" />
      <svg viewBox="0 0 24 24" fill="none" className="w-full h-full relative z-10 drop-shadow-[0_0_8px_rgba(226,183,62,0.8)]">
        <path
          d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
          fill="url(#goldStarGrad)"
        />
        <circle cx="12" cy="12" r="2.5" fill="#FFFDF8" opacity="0.95" />
        <defs>
          <radialGradient id="goldStarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF2BF" />
            <stop offset="35%" stopColor="#E2B73E" />
            <stop offset="100%" stopColor="#A87713" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function ScheduleSplitGrid() {
  const schedules = schedulesData as ScheduleItem[];
  const [selectedId, setSelectedId] = useState<string>(schedules[0]?.id || '');
  const [countdown, setCountdown] = useState({ days: 8, hours: 11, mins: 36, secs: 6 });

  const activeItem = useMemo(() => {
    return schedules.find((s) => s.id === selectedId) || schedules[0];
  }, [selectedId, schedules]);

  useEffect(() => {
    const target = activeItem?.targetDate
      ? new Date(activeItem.targetDate).getTime()
      : new Date().getTime() + 1000 * 60 * 60 * 24 * 8 + 1000 * 60 * 60 * 11 + 1000 * 60 * 36;

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, mins, secs });
      } else {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeItem]);

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('avail') || s.includes('tersedia')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-[#E2EFE3] border border-[#C5E2C8] text-[#346B40] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#346B40]" />
          AVAILABLE
        </span>
      );
    }
    if (s.includes('fast') || s.includes('selling') || s.includes('hampir')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-[#FCF1CE] border border-[#F3DD9C] text-[#A67812] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A67812]" />
          SELLING FAST
        </span>
      );
    }
    if (s.includes('soon') || s.includes('coming') || s.includes('segera')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-[#EAE2F8] border border-[#D5C4F3] text-[#6942BD] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6942BD]" />
          COMING SOON
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-[#ECE7DC] border border-[#DDD6C8] text-[#7A7165] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#968C7D]" />
        SOLD OUT
      </span>
    );
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-6 sm:py-10 px-2 sm:px-4">
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(242,207,112,0.45)_0%,_rgba(252,250,245,0)_70%)] pointer-events-none blur-2xl" />
      <div className="absolute -bottom-16 -left-12 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(242,207,112,0.35)_0%,_rgba(252,250,245,0)_70%)] pointer-events-none blur-2xl" />
      <div className="absolute -top-12 -right-12 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(242,207,112,0.35)_0%,_rgba(252,250,245,0)_70%)] pointer-events-none blur-2xl" />
      <div className="absolute -bottom-16 -right-12 w-96 h-96 bg-[radial-gradient(ellipse_at_center,_rgba(242,207,112,0.45)_0%,_rgba(252,250,245,0)_70%)] pointer-events-none blur-2xl" />

      <div className="absolute bottom-6 left-8 hidden lg:block">
        <GoldenSparkle className="w-8 h-8" />
      </div>
      <div className="absolute bottom-6 right-8 hidden lg:block">
        <GoldenSparkle className="w-8 h-8" />
      </div>

      <div className="text-center mb-10 sm:mb-14 relative z-10">
        <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-[0.25em] text-[#B8871B] uppercase mb-1.5">
          <span className="text-[#C9971C]">✦</span>
          <span>MUSES LIVE & EVENTS</span>
          <span className="text-[#C9971C]">✦</span>
        </div>
        <div className="relative inline-block">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1F1A12] tracking-tight font-normal">
            Upcoming Schedule
          </h2>
          <div className="absolute -top-3.5 -right-6">
            <GoldenSparkle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="absolute -bottom-2 -left-6">
            <GoldenSparkle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start relative z-10">
        <div className="lg:col-span-5">
          <div className="relative rounded-3xl bg-white border border-[#C9971C]/40 p-4 sm:p-5 shadow-[0_15px_40px_rgba(201,151,28,0.12)]">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden mb-4 border border-[#C9971C]/25 bg-[#FAF6EC]">
              <img
                src={withBase(activeItem?.posterImage || '/images/muses_group_frame1.png')}
                alt="MUSES 7 Members"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              <div className="rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-2 px-1 text-center">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-1 block">
                  DAYS
                </span>
              </div>
              <div className="rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-2 px-1 text-center">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-1 block">
                  HOURS
                </span>
              </div>
              <div className="rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-2 px-1 text-center">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.mins).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-1 block">
                  MINUTE
                </span>
              </div>
              <div className="rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-2 px-1 text-center">
                <span className="text-xl sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.secs).padStart(2, '0')}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-1 block">
                  SECOND
                </span>
              </div>
            </div>

            <a
              href={activeItem?.ticketUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-full font-bold text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(201,151,28,0.35)] hover:shadow-[0_12px_28px_rgba(201,151,28,0.45)] hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#D7A227] via-[#E4B841] to-[#A37B1D] text-[#332205] cursor-pointer"
            >
              <Ticket className="w-4 h-4 fill-current shrink-0" />
              <span>GET TICKETS</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-3 sm:space-y-3.5">
          {schedules.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`relative rounded-2xl bg-white border transition-all duration-300 p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs hover:shadow-md cursor-pointer group ${
                  isSelected
                    ? 'border-[#C9971C] ring-2 ring-[#C9971C]/40 shadow-[0_6px_20px_rgba(201,151,28,0.15)]'
                    : 'border-[#C9971C]/35 hover:border-[#C9971C]'
                }`}
              >
                <div className="flex flex-col items-center justify-center text-center shrink-0 pr-4 sm:pr-6 border-r border-[#C9971C]/25 min-w-[56px] sm:min-w-[64px]">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#7A5B18] leading-none">
                    {item.day}
                  </span>
                  <span className="text-[10px] sm:text-xs font-serif font-bold tracking-widest text-[#7A5B18] uppercase mt-1">
                    {item.month}
                  </span>
                  <span className="text-[9px] font-mono text-[#9C8B72] mt-0.5">
                    {item.year}
                  </span>
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <div className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#B8871B] uppercase mb-0.5">
                    {item.city}
                  </div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-[#2E2104] group-hover:text-[#B8871B] transition-colors truncate">
                    {item.title || item.tourName || 'MUSES 1st Anniversary Live'}
                  </h3>
                  <div className="flex items-center flex-wrap gap-x-3.5 gap-y-1 mt-1 text-[11px] text-[#7A6E58]">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#B8871B] shrink-0" />
                      <span className="truncate">{item.venue}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#B8871B] shrink-0" />
                      <span>{item.showTime}</span>
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {renderStatusBadge(item.status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
