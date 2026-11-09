import React, { useState, useEffect, useMemo } from 'react';
import { withBase } from '../../lib/paths';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { MapPin, Clock, Ticket, ChevronRight } from 'lucide-react';
import { getDict, type Locale } from '../../i18n/dictionary';
import { BackgroundGradientAnimation } from '../ui/background-gradient-animation';
import { Badge } from '../ui/badge';

export type ScheduleItem = ScheduleDTO;

export default function ScheduleSplitGrid({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).schedule;
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() =>
    scheduleService.getInitialSchedules()
  );
  const [selectedId, setSelectedId] = useState<string>(schedules[0]?.id || '');
  const [countdown, setCountdown] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);

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
    const target = activeItem?.targetDate ? new Date(activeItem.targetDate).getTime() : NaN;
    if (Number.isNaN(target)) {
      setCountdown(null);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, target - Date.now());
      const sec = Math.floor(diff / 1000);
      setCountdown({
        days: Math.floor(sec / 86400),
        hours: Math.floor((sec % 86400) / 3600),
        mins: Math.floor((sec % 3600) / 60),
        secs: sec % 60,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeItem?.id, activeItem?.targetDate]);

  const renderStatusBadge = (status: string, floating = false) => {
    const s = status.toLowerCase();
    const baseClass = floating
      ? 'rounded-md px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold tracking-wide shrink-0 shadow-xs'
      : 'rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-medium tracking-wide shrink-0';

    if (s.includes('avail') || s.includes('tersedia')) {
      return (
        <Badge
          variant="success"
          className={`${baseClass} ${
            floating
              ? 'bg-white/95 text-emerald-800 border-emerald-300 backdrop-blur-md'
              : ''
          }`}
        >
          {d.statusAvailable}
        </Badge>
      );
    }
    if (s.includes('fast') || s.includes('selling') || s.includes('hampir')) {
      return (
        <Badge
          variant="warning"
          className={`${baseClass} ${
            floating
              ? 'bg-white/95 text-amber-800 border-amber-300 backdrop-blur-md'
              : ''
          }`}
        >
          {d.statusSellingFast}
        </Badge>
      );
    }
    if (s.includes('soon') || s.includes('coming') || s.includes('segera')) {
      return (
        <Badge
          variant="secondary"
          className={`${baseClass} ${
            floating
              ? 'bg-black/60 text-white/90 border-white/20 backdrop-blur-md'
              : 'border border-zinc-200/80 bg-zinc-100 text-zinc-600'
          }`}
        >
          {d.statusComingSoon}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className={`${baseClass} ${
          floating
            ? 'bg-black/50 text-white/70 border-white/20 backdrop-blur-md'
            : 'border-zinc-200 text-zinc-400'
        }`}
      >
        {d.statusSoldOut}
      </Badge>
    );
  };

  const pad = (n?: number) => (n === undefined ? '--' : String(n).padStart(2, '0'));
  const units = [
    { value: countdown?.days, label: d.days },
    { value: countdown?.hours, label: d.hours },
    { value: countdown?.mins, label: d.minutes },
    { value: countdown?.secs, label: d.seconds },
  ];
  const ended = countdown !== null && countdown.days + countdown.hours + countdown.mins + countdown.secs === 0;
  const ease = 'ease-[cubic-bezier(0.23,1,0.32,1)]';

  return (
    <div className="relative w-full overflow-clip">
      <BackgroundGradientAnimation
        containerClassName="w-full bg-transparent py-6 sm:py-12"
        gradientBackgroundStart="transparent"
        gradientBackgroundEnd="transparent"
        firstColor="218, 175, 75"
        secondColor="247, 230, 175"
        thirdColor="224, 185, 95"
        fourthColor="242, 220, 155"
        fifthColor="210, 170, 70"
        pointerColor="235, 205, 130"
        size="85%"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8 relative z-10">
          <div className="text-left mb-4 sm:mb-8">
            <span className="block mb-1.5 text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-[#8C6A1C] uppercase">
              {d.eyebrow}
            </span>
            <h2 className="text-3xl min-[380px]:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-balbes text-[#18181B] leading-none tracking-normal select-none">
              {d.heading}
            </h2>
          </div>

          {!activeItem ? (
            <p className="py-10 text-sm text-[#7A6E58]">Belum ada jadwal mendatang.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
              <div className="lg:col-span-5">
                <div className="rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-xl border border-[#EADBBD] p-3 sm:p-4 shadow-[0_8px_30px_rgba(201,151,28,0.08)] ring-1 ring-black/[0.03] lg:sticky lg:top-24">
                  {/* Poster Pass */}
                  <div className="relative aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 bg-[#FAF6EC] shadow-inner group">
                    <img
                      src={withBase(activeItem.posterImage || '/images/muses_group_frame1.webp')}
                      alt={d.posterAlt}
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                    {/* Floating top tags */}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-[11px] font-mono font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                        </span>
                        <span>NEXT SHOW</span>
                      </div>
                      <div className="pointer-events-auto">
                        {renderStatusBadge(activeItem.status, true)}
                      </div>
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 text-white pointer-events-none">
                      <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-amber-300 font-bold mb-0.5">
                        {activeItem.city} • {activeItem.venue}
                      </div>
                      <h3 className="font-display font-bold text-sm sm:text-base text-white leading-tight drop-shadow-md truncate">
                        {activeItem.title || activeItem.tourName || 'MUSES Live'}
                      </h3>
                    </div>
                  </div>

                  {/* Engaging Countdown Section */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between px-1 mb-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C9971C]" />
                        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-[#8C6A1C] uppercase">
                          COUNTDOWN TO SHOW
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#9C8B72] font-semibold">{activeItem.showTime}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2" role="timer" aria-label="Countdown">
                      {units.map((u) => (
                        <div
                          key={u.label}
                          className="relative rounded-xl bg-gradient-to-b from-[#FAF7F0] to-[#F1E9DB] border border-[#EADBBD] py-2 sm:py-2.5 px-1 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_4px_rgba(201,151,28,0.06)] overflow-hidden"
                        >
                          <div className="absolute inset-x-0 top-1/2 h-px bg-[#D4C3A3]/40 z-0 pointer-events-none" />
                          <span className="relative z-10 block text-xl sm:text-2xl font-mono font-black text-[#3D2C0D] leading-none tabular-nums tracking-tight">
                            {pad(u.value)}
                          </span>
                          <span className="relative z-10 block mt-1.5 text-[8px] sm:text-[9.5px] font-mono font-bold tracking-widest text-[#8C6A1C] uppercase">
                            {u.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Ticket Button */}
                  <a
                    href={activeItem.ticketUrl && activeItem.ticketUrl !== '#' ? activeItem.ticketUrl : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={ended || !activeItem.ticketUrl || activeItem.ticketUrl === '#'}
                    className={`w-full py-3 px-5 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-[#C9971C] via-[#E2B742] to-[#C9971C] text-[#1F1A12] shadow-[0_4px_16px_rgba(201,151,28,0.25)] hover:shadow-[0_6px_22px_rgba(201,151,28,0.35)] hover:brightness-105 active:scale-[0.98] transition-all duration-150 ${ease} cursor-pointer aria-disabled:opacity-50 aria-disabled:pointer-events-none`}
                  >
                    <Ticket className="w-4 h-4 shrink-0" />
                    <span>{d.getTickets}</span>
                  </a>
                </div>
              </div>

              {/* Event Schedule List */}
              <div className="lg:col-span-7 flex flex-col gap-2.5">
                {schedules.map((item) => {
                  const isSelected = item.id === activeItem.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      aria-pressed={isSelected}
                      className={`group relative w-full text-left rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ${ease} active:scale-[0.985] ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#FFFDF8] via-[#FDF9EE] to-white border border-[#C9971C] shadow-[0_6px_20px_rgba(201,151,28,0.12)]'
                          : 'bg-white/90 hover:bg-white border border-[#EADBBD]/80 hover:border-[#C9971C]/50 hover:shadow-[0_4px_16px_rgba(201,151,28,0.06)]'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-[#C9971C]" />
                      )}

                      <div
                        className={`shrink-0 w-12 sm:w-14 rounded-xl py-2 px-1 text-center flex flex-col items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#F5ECD5] border border-[#C9971C]/40 text-[#5C420D]'
                            : 'bg-[#FAF6EC] border border-[#EADBBD] text-[#7A5B18] group-hover:bg-[#F5ECD5]/70'
                        }`}
                      >
                        <span className="block text-xl sm:text-2xl font-serif font-black leading-none">{item.day}</span>
                        <span className="block mt-0.5 text-[9px] sm:text-[10px] font-mono font-bold tracking-widest uppercase">{item.month}</span>
                        <span className="block text-[8px] font-mono text-[#9C8B72]">{item.year}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.2em] text-[#B8871B] uppercase mb-0.5">
                          {item.city}
                        </div>
                        <h3
                          className={`font-display font-bold text-sm sm:text-base leading-snug truncate transition-colors ${
                            isSelected ? 'text-[#1F1A12]' : 'text-[#2E2104] group-hover:text-[#B8871B]'
                          }`}
                        >
                          {item.title || item.tourName || 'MUSES Live'}
                        </h3>
                        <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#6E6453]">
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 text-[#B8871B] shrink-0" />
                            <span className="truncate">{item.venue}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[10.5px]">
                            <Clock className="w-3 h-3 text-[#B8871B] shrink-0" />
                            <span>{item.showTime}</span>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                        {renderStatusBadge(item.status)}
                        <ChevronRight
                          className={`w-4 h-4 transition-all duration-200 ${
                            isSelected
                              ? 'text-[#C9971C] translate-x-0.5'
                              : 'text-[#C9971C]/35 group-hover:text-[#C9971C] group-hover:translate-x-0.5'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </BackgroundGradientAnimation>
    </div>
  );
}
