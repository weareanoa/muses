import React, { useState, useEffect, useMemo } from 'react';
import { withBase } from '../../lib/paths';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { MapPin, Clock, Ticket } from 'lucide-react';
import { getDict, type Locale } from '../../i18n/dictionary';
import { BackgroundGradientAnimation } from '../ui/background-gradient-animation';

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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5">
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-white border border-[#C9971C]/30 p-2.5 sm:p-3 shadow-xs lg:sticky lg:top-24">
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-2.5 bg-[#FAF6EC]">
                    <img
                      src={withBase(activeItem.posterImage || '/images/muses_group_frame1.webp')}
                      alt={d.posterAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 mb-2.5" role="timer" aria-label="Countdown">
                    {units.map((u) => (
                      <div key={u.label} className="rounded-lg bg-[#FCFAF5] border border-[#C9971C]/25 py-1.5 text-center">
                        <span className="block text-lg sm:text-xl font-serif font-bold text-[#7A5B18] leading-none tabular-nums">
                          {pad(u.value)}
                        </span>
                        <span className="block mt-1 text-[8px] sm:text-[9px] font-mono font-bold tracking-wider text-[#A08858] uppercase">
                          {u.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={activeItem.ticketUrl && activeItem.ticketUrl !== '#' ? activeItem.ticketUrl : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={ended || !activeItem.ticketUrl || activeItem.ticketUrl === '#'}
                    className={`w-full py-2.5 px-4 rounded-full font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 bg-muses-gradient text-[#1F1A12] cursor-pointer transition-[transform,box-shadow] duration-150 ${ease} active:scale-[0.97] aria-disabled:opacity-50 aria-disabled:pointer-events-none`}
                  >
                    <Ticket className="w-3.5 h-3.5 shrink-0" />
                    <span>{d.getTickets}</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-2">
                {schedules.map((item) => {
                  const isSelected = item.id === activeItem.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      aria-pressed={isSelected}
                      className={`group w-full text-left rounded-xl bg-white border p-2.5 sm:p-3 flex items-center gap-3 cursor-pointer transition-[border-color,box-shadow,transform] duration-150 ${ease} active:scale-[0.99] ${
                        isSelected
                          ? 'border-[#C9971C] shadow-[0_0_0_1px_#C9971C]'
                          : 'border-[#C9971C]/30 hover:border-[#C9971C]/70'
                      }`}
                    >
                      <div className="shrink-0 w-11 sm:w-12 text-center pr-3 border-r border-[#C9971C]/20">
                        <span className="block text-xl sm:text-2xl font-serif font-bold text-[#7A5B18] leading-none">{item.day}</span>
                        <span className="block mt-0.5 text-[10px] font-serif font-bold tracking-widest text-[#7A5B18] uppercase">{item.month}</span>
                        <span className="block text-[8px] font-mono text-[#9C8B72]">{item.year}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.2em] text-[#B8871B] uppercase">{item.city}</div>
                        <h3 className="font-display font-bold text-sm sm:text-[15px] text-[#2E2104] leading-snug truncate">
                          {item.title || item.tourName || 'MUSES Live'}
                        </h3>
                        <div className="mt-0.5 flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] sm:text-[11px] text-[#7A6E58]">
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <MapPin className="w-3 h-3 text-[#B8871B] shrink-0" />
                            <span className="truncate">{item.venue}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#B8871B] shrink-0" />
                            <span>{item.showTime}</span>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">{renderStatusBadge(item.status)}</div>
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
