import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '@nanostores/react';
import { activeMemberId, closeMemberModal, openMemberModal } from '../../stores/memberModalStore';
import membersData from '../../data/members.json';
import { X, ChevronLeft, ChevronRight, Sparkles, ExternalLink, Calendar, Compass, Ruler, Heart } from 'lucide-react';
import gsap from 'gsap';

export default function MemberModal() {
  const currentId = useStore(activeMemberId);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      if (e.detail) {
        openMemberModal(e.detail);
      }
    };
    window.addEventListener('open-member-modal', handleCustomOpen);
    return () => window.removeEventListener('open-member-modal', handleCustomOpen);
  }, []);

  const currentIndex = membersData.findIndex((m) => m.id === currentId);
  const member = currentIndex !== -1 ? membersData[currentIndex] : null;

  useEffect(() => {
    if (!currentId) return;

    const lenisInstance = (window as any).__lenis;
    if (lenisInstance) {
      try {
        lenisInstance.stop();
      } catch (err) {}
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (lenisInstance) {
        try {
          lenisInstance.start();
        } catch (err) {}
      }
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentId, currentIndex]);

  useEffect(() => {
    if (member && overlayRef.current && containerRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        containerRef.current,
        { scale: 0.94, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [currentId]);

  useEffect(() => {
    if (member && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, x: 12 },
        { opacity: 1, x: 0, duration: 0.28, ease: 'power2.out' }
      );
    }
  }, [currentIndex]);

  const handleClose = () => {
    if (!overlayRef.current || !containerRef.current) {
      closeMemberModal();
      return;
    }

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: 'power2.in',
    });
    gsap.to(containerRef.current, {
      scale: 0.95,
      opacity: 0,
      y: 15,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        closeMemberModal();
      },
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      openMemberModal(membersData[currentIndex - 1].id);
    } else {
      openMemberModal(membersData[membersData.length - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < membersData.length - 1) {
      openMemberModal(membersData[currentIndex + 1].id);
    } else {
      openMemberModal(membersData[0].id);
    }
  };

  if (!member) return null;

  const currentNumberPill = `0${currentIndex + 1}`;
  const totalNumber = `0${membersData.length}`;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 lg:p-6 bg-black/85 backdrop-blur-2xl overflow-hidden select-none"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        className="relative w-full max-w-[1240px] h-[92vh] sm:h-[90vh] max-h-[92vh] sm:max-h-[90vh] bg-[#FCFAF5] text-[#1F1A12] border border-[#C9971C]/35 rounded-3xl shadow-[0_25px_80px_rgba(201,151,28,0.25)] overflow-hidden flex flex-col"
      >
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] opacity-25 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: member.themeColor || '#C9971C' }}
        />

        <div className="relative z-20 px-6 sm:px-8 py-3.5 border-b border-[#C9971C]/25 flex items-center justify-between gap-4 shrink-0 bg-white/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xl font-display font-black tracking-widest gold-gradient-text">
              MUSES
            </span>
            <span className="h-4 w-px bg-[#C9971C]/30" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8C6A1C]">
              OFFICIAL PROFILE • {currentNumberPill}/{totalNumber}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              aria-label="Tutup Profil Member"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F1A12]/5 hover:bg-[#C9971C]/20 border border-[#C9971C]/30 text-xs font-mono tracking-wider text-[#1F1A12] transition-all cursor-pointer group/close"
            >
              <span className="hidden sm:inline">TUTUP</span>
              <X className="w-4 h-4 transition-transform group-hover/close:rotate-90" />
            </button>
          </div>
        </div>

        <div className="relative z-10 overflow-y-auto overscroll-contain flex-1 min-h-0 p-5 sm:p-8 lg:p-10 scrollbar-none">
          <div
            ref={contentRef}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch min-h-full"
          >
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[360px] aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-[#C9971C]/30 shadow-2xl p-2.5">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#FDF6E7]">
                  <img
                    src={member.photoFull || member.photoThumb}
                    alt={member.stageName}
                    className="w-full h-full object-cover object-center filter contrast-105 transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  <div className="absolute bottom-4 inset-x-4 flex items-end justify-between text-white pointer-events-none">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-80 block">
                        MUSES MEMBER
                      </span>
                      <h3 className="text-2xl font-display font-black tracking-wider uppercase text-[#F7E08F]">
                        {member.stageName}
                      </h3>
                    </div>
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${member.gradientStart || '#C9971C'}, ${member.gradientEnd || '#F7E08F'})`,
                        color: '#1F1A12',
                      }}
                    >
                      {member.icon || member.emoticon}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-widest font-bold"
                      style={{
                        background: `linear-gradient(135deg, ${member.gradientStart || '#C9971C'}, ${member.gradientEnd || '#F7E08F'})`,
                        color: '#1F1A12',
                      }}
                    >
                      {member.role}
                    </span>
                    <span className="text-xs font-mono text-[#8C6A1C] font-semibold">
                      {member.fullName}
                    </span>
                  </div>

                  <h2
                    id="member-modal-title"
                    className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-[#1F1A12] uppercase tracking-tight"
                  >
                    {member.stageName}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6E6453] mt-1 italic font-serif">
                    "{member.quotePart1} {member.quotePart2}"
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6453] block mb-0.5">
                      Tanggal Lahir
                    </span>
                    <span className="text-xs font-bold text-[#1F1A12]">
                      {member.birthDate}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6453] block mb-0.5">
                      Zodiak
                    </span>
                    <span className="text-xs font-bold text-[#1F1A12]">
                      {member.zodiac}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6453] block mb-0.5">
                      Tinggi Badan
                    </span>
                    <span className="text-xs font-bold text-[#1F1A12]">
                      {member.height}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-[#C9971C]/25 shadow-xs">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E6453] block mb-0.5">
                      Warna & Ikon
                    </span>
                    <span className="text-xs font-bold text-[#1F1A12] flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: member.themeColor }}
                      />
                      <span>{member.icon || member.emoticon}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#C9971C]/25 space-y-2.5 shadow-xs">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#8C6A1C] font-bold block">
                    BIOGRAFI & CERITA
                  </span>
                  <p className="text-xs sm:text-sm text-[#3E3628] leading-relaxed">
                    {member.story01}
                  </p>
                  <p className="text-xs sm:text-sm text-[#3E3628] leading-relaxed">
                    {member.story02}
                  </p>
                </div>

                {member.tmi && member.tmi.length > 0 && (
                  <div className="p-4 rounded-xl bg-[#FDF6E7] border border-[#C9971C]/20 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#8C6A1C] font-bold block">
                      FAKTA UNIK & TMI
                    </span>
                    <ul className="text-xs text-[#524838] space-y-1 list-disc list-inside">
                      {member.tmi.map((fact: string, idx: number) => (
                        <li key={idx}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#C9971C]/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#6E6453]">Sosial Media:</span>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#8C6A1C] hover:text-[#C9971C] inline-flex items-center gap-1"
                  >
                    <span>@{member.stageName.toLowerCase()}.muses</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    aria-label="Member Sebelumnya"
                    className="p-2 rounded-xl bg-white hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Member Selanjutnya"
                    className="p-2 rounded-xl bg-white hover:bg-[#C9971C]/15 border border-[#C9971C]/30 text-[#1F1A12] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 px-4 sm:px-8 py-3 border-t border-[#C9971C]/25 bg-white/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8C6A1C] font-semibold hidden md:inline">
            7 MUSES MEMBERS:
          </span>

          <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto py-1 scrollbar-none mx-auto md:mx-0">
            {membersData.map((m) => {
              const isSelected = m.id === member.id;
              return (
                <button
                  key={m.id}
                  onClick={() => openMemberModal(m.id)}
                  className={`group relative flex items-center gap-2 p-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FDF6E7] ring-2 ring-[#C9971C] shadow-[0_0_15px_rgba(201,151,28,0.35)] scale-105'
                      : 'hover:bg-[#1F1A12]/5 opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`Lihat profil ${m.stageName}`}
                >
                  <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-[#FCFAF5] border border-[#C9971C]/40 shrink-0">
                    <img
                      src={m.photoThumb || m.photoFull}
                      alt={m.stageName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span
                    className={`text-xs font-bold pr-2 transition-colors ${
                      isSelected ? 'text-[#1F1A12]' : 'text-[#6E6453] group-hover:text-[#1F1A12]'
                    }`}
                  >
                    {m.stageName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
