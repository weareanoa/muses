import React, { useState, useEffect, useMemo } from 'react';
import { withBase } from '../../lib/paths';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { MapPin, Clock, Ticket } from 'lucide-react';
import { getDict, type Locale } from '../../i18n/dictionary';

export type ScheduleItem = ScheduleDTO;

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

export default function ScheduleSplitGrid({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).schedule;
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() =>
    scheduleService.getInitialSchedules()
  );
  const [selectedId, setSelectedId] = useState<string>(schedules[0]?.id || '');
  const [countdown, setCountdown] = useState({ days: 8, hours: 11, mins: 36, secs: 6 });

  useEffect(() => {
    scheduleService.getSchedules().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setSchedules(res.data);
      }
    });
  }, []);

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
        const mins = Math.floor((diff % (1000 * 60)) / (1000 * 60));
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider uppercase bg-[#EAF5EC] text-[#1B5E20] border border-[#2E7D32]/25 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] shrink-0" aria-hidden="true" />
          <span>{d.statusAvailable}</span>
        </span>
      );
    }
    if (s.includes('fast') || s.includes('selling') || s.includes('hampir')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider uppercase bg-[#FEF7E6] text-[#8C6200] border border-[#C9971C]/35 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9971C] shrink-0" aria-hidden="true" />
          <span>{d.statusSellingFast}</span>
        </span>
      );
    }
    if (s.includes('soon') || s.includes('coming') || s.includes('segera')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider uppercase bg-[#F2F4F8] text-[#34495E] border border-[#34495E]/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5D6D7E] shrink-0" aria-hidden="true" />
          <span>{d.statusComingSoon}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider uppercase bg-[#F2EFEA] text-[#6B6358] border border-[#D5CEC2] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#9E9689] shrink-0" aria-hidden="true" />
        <span>{d.statusSoldOut}</span>
      </span>
    );
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto py-2 sm:py-10 px-1 sm:px-4">
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

      <div className="text-left sm:text-center mb-5 sm:mb-12 relative z-10">
        <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3.5 max-w-lg mb-1.5 sm:mb-2.5">
          <div className="h-[1px] w-6 sm:w-auto sm:flex-1 sm:max-w-[100px] bg-gradient-to-r from-transparent to-[#D4A017]/80" />
          <GoldenSparkle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-[#8C6A1C] uppercase whitespace-nowrap">
            {d.eyebrow}
          </span>
          <GoldenSparkle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <div className="hidden sm:block h-[1px] flex-1 max-w-[100px] bg-gradient-to-l from-transparent to-[#D4A017]/80" />
        </div>

        <div className="relative inline-block">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-16 bg-[radial-gradient(ellipse_at_center,_rgba(247,224,143,0.35)_0%,_transparent_70%)] pointer-events-none blur-lg" />
          <h2 className="relative z-10 text-3xl min-[380px]:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-balbes text-[#18181B] leading-none tracking-normal select-none">
            {d.heading}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start relative z-10">
        <div className="lg:col-span-5">
          <div className="relative rounded-2xl sm:rounded-3xl bg-white border border-[#C9971C]/35 p-3 sm:p-5 shadow-[0_10px_30px_rgba(201,151,28,0.1)]">
            <div className="relative aspect-[16/9] sm:aspect-[16/10] w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-[#C9971C]/25 bg-[#FAF6EC]">
              <img
                src={withBase(activeItem?.posterImage || '/images/muses_group_frame1.webp')}
                alt={d.posterAlt}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:hidden" />
              <div className="absolute bottom-2 left-2.5 right-2.5 sm:hidden text-white">
                <span className="text-[8.5px] font-mono tracking-widest uppercase bg-[#C28C1D] text-[#1F1A12] font-bold px-2 py-0.5 rounded-full inline-block mb-0.5">
                  {activeItem?.city}
                </span>
                <h4 className="text-xs min-[380px]:text-sm font-bold font-display truncate text-white drop-shadow-md">
                  {activeItem?.title || activeItem?.tourName}
                </h4>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <div className="rounded-lg sm:rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-1.5 sm:py-2 px-1 text-center">
                <span className="text-base min-[380px]:text-lg sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.days).padStart(2, '0')}
                </span>
                <span className="text-[7.5px] min-[380px]:text-[8px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-0.5 sm:mt-1 block">
                  {d.days}
                </span>
              </div>
              <div className="rounded-lg sm:rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-1.5 sm:py-2 px-1 text-center">
                <span className="text-base min-[380px]:text-lg sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.hours).padStart(2, '0')}
                </span>
                <span className="text-[7.5px] min-[380px]:text-[8px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-0.5 sm:mt-1 block">
                  {d.hours}
                </span>
              </div>
              <div className="rounded-lg sm:rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-1.5 sm:py-2 px-1 text-center">
                <span className="text-base min-[380px]:text-lg sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.mins).padStart(2, '0')}
                </span>
                <span className="text-[7.5px] min-[380px]:text-[8px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-0.5 sm:mt-1 block">
                  {d.minutes}
                </span>
              </div>
              <div className="rounded-lg sm:rounded-xl bg-[#FCFAF5] border border-[#C9971C]/35 py-1.5 sm:py-2 px-1 text-center">
                <span className="text-base min-[380px]:text-lg sm:text-2xl font-serif font-bold text-[#7A5B18] block leading-none">
                  {String(countdown.secs).padStart(2, '0')}
                </span>
                <span className="text-[7.5px] min-[380px]:text-[8px] sm:text-[10px] font-mono font-bold tracking-wider text-[#A08858] uppercase mt-0.5 sm:mt-1 block">
                  {d.seconds}
                </span>
              </div>
            </div>

            <a
              href={activeItem?.ticketUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_6px_16px_rgba(201,151,28,0.3)] hover:shadow-[0_12px_28px_rgba(201,151,28,0.45)] hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#D7A227] via-[#E4B841] to-[#A37B1D] text-[#332205] cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
              <span>{d.getTickets}</span>
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-2.5 sm:space-y-3.5">
          {schedules.map((item) => {
            const isSelected = item.id === selectedId;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`relative rounded-xl sm:rounded-2xl bg-white border transition-all duration-300 p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shadow-xs hover:shadow-md cursor-pointer group ${
                  isSelected
                    ? 'border-[#C9971C] ring-2 ring-[#C9971C]/40 shadow-[0_6px_20px_rgba(201,151,28,0.15)] bg-gradient-to-r from-white to-[#FAF6EC]/40'
                    : 'border-[#C9971C]/35 hover:border-[#C9971C]'
                }`}
              >
                <div className="flex sm:hidden items-start gap-2.5 w-full">
                  <div className="flex flex-col items-center justify-center text-center shrink-0 w-11 py-1 px-1 bg-[#FAF6EC] rounded-xl border border-[#C9971C]/25">
                    <span className="text-lg font-serif font-bold text-[#7A5B18] leading-none">
                      {item.day}
                    </span>
                    <span className="text-[9px] font-serif font-bold tracking-wider text-[#7A5B18] uppercase mt-0.5">
                      {item.month}
                    </span>
                    <span className="text-[7.5px] font-mono text-[#9C8B72] mt-0.5">
                      {item.year}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#B8871B] uppercase">
                        {item.city}
                      </span>
                      {renderStatusBadge(item.status)}
                    </div>
                    <h3 className="font-display font-bold text-xs min-[380px]:text-sm text-[#2E2104] group-hover:text-[#B8871B] transition-colors leading-snug line-clamp-1">
                      {item.title || item.tourName || 'MUSES Live'}
                    </h3>
                    <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-1 text-[10px] min-[380px]:text-[11px] text-[#7A6E58]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#B8871B] shrink-0" />
                        <span className="truncate max-w-[120px]">{item.venue}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[9.5px]">
                        <Clock className="w-3 h-3 text-[#B8871B] shrink-0" />
                        <span>{item.showTime}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center text-center shrink-0 pr-6 border-r border-[#C9971C]/25 min-w-[64px]">
                    <span className="text-3xl font-serif font-bold text-[#7A5B18] leading-none">
                      {item.day}
                    </span>
                    <span className="text-xs font-serif font-bold tracking-widest text-[#7A5B18] uppercase mt-1">
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
                    <h3 className="font-display font-bold text-base text-[#2E2104] group-hover:text-[#B8871B] transition-colors truncate">
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
                </div>

                <div className="hidden sm:block shrink-0">
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
