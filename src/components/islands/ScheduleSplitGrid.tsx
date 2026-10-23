import { withBaseDeep } from '../../lib/paths';
import React, { useState, useEffect, useMemo } from 'react';
import schedulesDataRaw from '../../data/schedules.json';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Ticket,
  Sparkles,
  ChevronRight,
  Radio,
  AlertCircle
} from 'lucide-react';
const schedulesData = withBaseDeep(schedulesDataRaw);

export interface ScheduleItem {
  id: string;
  tourName: string;
  day: string;
  dayName: string;
  month: string;
  year: string;
  city: string;
  country: string;
  venue: string;
  status: 'Available' | 'Selling Fast' | 'Sold Out' | string;
  doorOpen?: string;
  showTime: string;
  ticketUrl: string;
  posterImage: string;
  targetDate?: string;
}

export default function ScheduleSplitGrid() {
  const schedules = schedulesData as ScheduleItem[];
  const [selectedId, setSelectedId] = useState<string>(schedules[0]?.id || '');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [eventPhase, setEventPhase] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');

  const activeItem = useMemo(() => {
    return schedules.find((s) => s.id === selectedId) || schedules[0];
  }, [selectedId, schedules]);

  useEffect(() => {
    const target = activeItem.targetDate
      ? new Date(activeItem.targetDate).getTime()
      : new Date().getTime() + 1000 * 60 * 60 * 24 * 30;

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setEventPhase('upcoming');
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days, hours, mins, secs });
      } else if (diff > -1000 * 60 * 60 * 4) {
        setEventPhase('ongoing');
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      } else {
        setEventPhase('finished');
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeItem]);

  const isSoldOut = activeItem.status.toLowerCase().includes('sold');
  const isTicketDisabled = isSoldOut || eventPhase === 'finished';

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('available')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/40 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Tersedia
        </span>
      );
    }
    if (s.includes('selling') || s.includes('fast')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/40 text-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Hampir Habis
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#EDE6D6] border border-[#1F1A12]/15 text-[#6E6453]">
        Habis Terjual
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <div className="relative rounded-3xl bg-white border border-[#C9971C]/30 p-5 sm:p-6 shadow-[0_20px_50px_rgba(201,151,28,0.12)] overflow-hidden group">
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#F7E08F]/25 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-widest text-[#C9971C]">
                <Radio className="w-3.5 h-3.5 animate-pulse text-[#C9971C]" />
              </span>
              <span className="text-[11px] font-mono text-[#6E6453] font-semibold">
                {activeItem.tourName}
              </span>
            </div>

            <div className="relative w-full aspect-[3/4] max-w-[360px] mx-auto rounded-2xl overflow-hidden border border-[#C9971C]/25 shadow-xl bg-[#FDF6E7] mb-6">
              <img
                key={activeItem.id}
                src={activeItem.posterImage}
                alt={`${activeItem.city} Concert Poster`}
                className="w-full h-full object-cover transition-all duration-700 ease-out transform group-hover:scale-103"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

              <div className="absolute bottom-4 inset-x-4 pointer-events-none text-white">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-white/20 backdrop-blur-md border border-white/30 text-[#F7E08F]">
                    {activeItem.country}
                  </span>
                  <span className="text-xs font-mono text-[#FDF6E7]">
                    {activeItem.day} {activeItem.month} {activeItem.year}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tight drop-shadow-md">
                  {activeItem.city}
                </h3>
                <p className="text-xs text-[#FDF6E7]/90 font-medium truncate">
                  {activeItem.venue}
                </p>
              </div>
            </div>

            <div className="mb-5 p-4 rounded-2xl bg-[#FCFAF5] border border-[#C9971C]/25 relative z-10">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[#6E6453] font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C9971C]" />
                  <span>
                    {eventPhase === 'ongoing'
                      ? 'Status Acara'
                      : eventPhase === 'finished'
                      ? 'Status Acara'
                      : 'Hitung Mundur Waktu Acara (WIB)'}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-[#C9971C] font-bold">
                  {activeItem.showTime}
                </span>
              </div>

              {eventPhase === 'upcoming' ? (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-xl sm:text-2xl font-black font-display text-[#1F1A12] block">
                      {String(countdown.days).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-[#6E6453] uppercase">Hari</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-xl sm:text-2xl font-black font-display text-[#1F1A12] block">
                      {String(countdown.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-[#6E6453] uppercase">Jam</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-xl sm:text-2xl font-black font-display text-[#1F1A12] block">
                      {String(countdown.mins).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-[#6E6453] uppercase">Menit</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-xl sm:text-2xl font-black font-display text-[#C9971C] block">
                      {String(countdown.secs).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-mono text-[#6E6453] uppercase">Detik</span>
                  </div>
                </div>
              ) : eventPhase === 'ongoing' ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-center">
                  <span className="text-sm font-bold text-emerald-800 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Sedang Berlangsung Sekarang
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[#1F1A12]/5 border border-[#1F1A12]/15 text-center">
                  <span className="text-sm font-bold text-[#6E6453]">
                    Acara Telah Selesai
                  </span>
                </div>
              )}
            </div>

            <div className="relative z-10">
              <a
                href={isTicketDisabled ? '#' : activeItem.ticketUrl}
                target={isTicketDisabled ? '_self' : '_blank'}
                rel="noopener noreferrer"
                aria-disabled={isTicketDisabled}
                className={`w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-mono text-xs uppercase tracking-widest font-bold transition-all duration-300 shadow-md ${
                  isTicketDisabled
                    ? 'bg-[#1F1A12]/10 text-[#8C6A1C] cursor-not-allowed pointer-events-none'
                    : 'pill-active text-[#1F1A12] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                }`}
              >
                <Ticket className="w-4 h-4" />
                <span>
                  {eventPhase === 'finished'
                    ? 'Acara Telah Selesai'
                    : isSoldOut
                    ? 'Tiket Habis Terjual'
                    : `Get Ticket • ${activeItem.city}`}
                </span>
                {!isTicketDisabled && <ExternalLink className="w-3.5 h-3.5 ml-1" />}
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="space-y-3">
            {schedules.map((item) => {
              const isSelected = item.id === selectedId;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setSelectedId(item.id)}
                  onClick={() => setSelectedId(item.id)}
                  className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-[#FDF6E7] border-[#C9971C] shadow-[0_10px_30px_rgba(201,151,28,0.2)] -translate-y-0.5'
                      : 'bg-white border-[#C9971C]/20 hover:border-[#C9971C]/50 hover:bg-[#FCFAF5]'
                  }`}
                >
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-[#FCFAF5] border border-[#C9971C]/25 flex flex-col items-center justify-center text-center group-hover:border-[#C9971C] transition-colors">
                      <span className="text-2xl sm:text-3xl font-display font-black text-[#1F1A12] leading-none">
                        {item.day}
                      </span>
                      <span className="text-[10px] font-mono font-bold tracking-widest text-[#C9971C] uppercase mt-0.5">
                        {item.month}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#6E6453]">
                          {item.dayName}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-[#1F1A12]/20" />
                        <span className="text-[11px] font-mono text-[#8A7F6C]">
                          {item.year}
                        </span>
                      </div>

                      <h4 className="text-lg sm:text-xl font-display font-bold text-[#1F1A12] uppercase group-hover:text-[#C9971C] transition-colors leading-tight">
                        {item.city}
                      </h4>
                      <p className="text-xs text-[#6E6453] font-medium">
                        {item.country}
                      </p>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-[#1F1A12]/10 sm:pl-4 space-y-1 flex-1">
                    <div className="flex items-center gap-1.5 text-xs text-[#4B4335] font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#C9971C] shrink-0" />
                      <span className="line-clamp-1">{item.venue}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-[#6E6453]">
                      <Clock className="w-3 h-3 text-[#8A7F6C] shrink-0" />
                      <span>Mulai: {item.showTime}</span>
                      {item.doorOpen && (
                        <>
                          <span>•</span>
                          <span>Buka Pintu: {item.doorOpen}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1F1A12]/10">
                    {getStatusBadge(item.status)}

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                        item.status.toLowerCase().includes('sold')
                          ? 'bg-[#1F1A12]/5 text-[#8A7F6C]'
                          : isSelected
                          ? 'pill-active text-[#1F1A12] shadow-sm'
                          : 'bg-[#FCFAF5] border border-[#C9971C]/35 text-[#1F1A12] hover:bg-[#C9971C]/15'
                      }`}
                    >
                      <span>Tiket</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
