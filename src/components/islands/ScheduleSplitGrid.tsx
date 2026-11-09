import React, { useState, useEffect, useMemo } from 'react';
import { withBase } from '../../lib/paths';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { MapPin, Clock, Ticket, ChevronRight, Timer } from 'lucide-react';
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
            <span className="block mb-1.5 text-[10px] sm:text-xs font-semibold tracking-[0.25em] text-zinc-500 uppercase">
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
                <div className="rounded-2xl sm:rounded-3xl bg-white border border-zinc-200/80 p-3 sm:p-4 shadow-sm lg:sticky lg:top-24">
                  {/* Poster Pass */}
                  <div className="relative aspect-[16/9] w-full rounded-xl sm:rounded-2xl overflow-hidden mb-3 bg-zinc-100 shadow-inner group">
                    <img
                      src={withBase(activeItem.posterImage || '/images/muses_group_frame1.webp')}
                      alt={d.posterAlt}
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                    {/* Floating status tag on top right */}
                    <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 pointer-events-auto">
                      {renderStatusBadge(activeItem.status, true)}
                    </div>

                    {/* Bottom overlay info */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 text-white pointer-events-none">
                      <div className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-white/80 font-bold mb-0.5">
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
                        <Timer className="w-3.5 h-3.5 text-zinc-700" />
                        <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-zinc-700 uppercase">
                          COUNTDOWN TO SHOW
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 font-semibold">{activeItem.showTime}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2" role="timer" aria-label="Countdown">
                      {units.map((u) => (
                        <div
                          key={u.label}
                          className="relative rounded-xl bg-zinc-50/80 border border-zinc-200/80 py-2 sm:py-2.5 px-1 text-center shadow-2xs overflow-hidden"
                        >
                          <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200/60 z-0 pointer-events-none" />
                          <span className="relative z-10 block text-xl sm:text-2xl font-mono font-bold text-zinc-900 leading-none tabular-nums tracking-tight">
                            {pad(u.value)}
                          </span>
                          <span className="relative z-10 block mt-1.5 text-[8px] sm:text-[9.5px] font-mono font-medium tracking-widest text-zinc-500 uppercase">
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
                    className={`w-full py-3 px-5 rounded-full font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 bg-muses-gradient text-[#1F1A12] shadow-xs hover:brightness-105 active:scale-[0.98] transition-all duration-150 ${ease} cursor-pointer aria-disabled:opacity-50 aria-disabled:pointer-events-none`}
                  >
                    <Ticket className="w-4 h-4 shrink-0 text-[#1F1A12]" />
                    <span>{d.getTickets}</span>
                  </a>
                </div>
              </div>

              {/* Event Schedule List */}
              <div className="lg:col-span-7 flex flex-col gap-2.5">
                {schedules.map((item) => {
                  const isSelected = item.id === activeItem.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl transition-all duration-200 ${
                        isSelected
                          ? 'p-[1.5px] bg-muses-gradient shadow-xs'
                          : 'p-[1.5px] bg-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        aria-pressed={isSelected}
                        className={`group relative w-full text-left rounded-[14.5px] p-2.5 sm:p-3.5 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ${ease} active:scale-[0.99] ${
                          isSelected
                            ? 'bg-white'
                            : 'bg-white/90 hover:bg-white border border-zinc-200/80 hover:border-zinc-300'
                        }`}
                      >
                        <div
                          className={`shrink-0 w-12 sm:w-14 rounded-xl py-2 px-1 text-center flex flex-col items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-900 border border-zinc-200'
                              : 'bg-zinc-50 border border-zinc-200/80 text-zinc-700 group-hover:bg-zinc-100'
                          }`}
                        >
                          <span className="block text-xl sm:text-2xl font-serif font-black leading-none">{item.day}</span>
                          <span className="block mt-0.5 text-[9px] sm:text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500">{item.month}</span>
                          <span className="block text-[8px] font-mono text-zinc-400">{item.year}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.2em] text-zinc-500 uppercase mb-0.5">
                            {item.city}
                          </div>
                          <h3
                            className={`font-display font-bold text-sm sm:text-base leading-snug truncate transition-colors ${
                              isSelected ? 'text-zinc-900 font-extrabold' : 'text-zinc-800 group-hover:text-zinc-950'
                            }`}
                          >
                            {item.title || item.tourName || 'MUSES Live'}
                          </h3>
                          <div className="mt-1 flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                            <span className="inline-flex items-center gap-1 min-w-0">
                              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{item.venue}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono text-[10.5px]">
                              <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span>{item.showTime}</span>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
                          {renderStatusBadge(item.status)}
                          <ChevronRight
                            className={`w-4 h-4 transition-all duration-200 ${
                              isSelected
                                ? 'text-zinc-700 translate-x-0.5'
                                : 'text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5'
                            }`}
                          />
                        </div>
                      </button>
                    </div>
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
