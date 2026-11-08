import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { withBase, withBaseDeep } from '../../lib/paths';
import { activeMemberId, closeMemberModal, openMemberModal } from '../../stores/memberModalStore';
import { pauseAudio } from '../../stores/audioStore';
import { members as membersDataRaw, type Member } from '../../data/members';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Volume2, VolumeX } from 'lucide-react';
import gsap from 'gsap';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';

const membersData = withBaseDeep(membersDataRaw) as readonly Member[];

const MODAL_MEMBER_ORDER = ['faril', 'mine', 'ndah', 'vira', 'vely', 'liz', 'lia'] as const;

const modalOrderedMembers = [...membersData].sort(
  (a, b) => MODAL_MEMBER_ORDER.indexOf(a.id as any) - MODAL_MEMBER_ORDER.indexOf(b.id as any)
);

export default function MemberModal({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).member;
  const currentId = useStore(activeMemberId);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const mobileContentRef = useRef<HTMLDivElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const [isVoicePlaying, setIsVoicePlaying] = useState<boolean>(false);
  const [hasVoiceAudio, setHasVoiceAudio] = useState<boolean>(false);

  useScrollLock(Boolean(currentId));

  useEffect(() => {
    const handleCustomOpen = (e: any) => {
      if (e.detail) {
        openMemberModal(e.detail);
      }
    };
    window.addEventListener('open-member-modal', handleCustomOpen);
    const handleBottomNavClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-nav-bottom]');
      if (target) {
        handleClose();
      }
    };
    window.addEventListener('click', handleBottomNavClick);
    return () => {
      window.removeEventListener('open-member-modal', handleCustomOpen);
      window.removeEventListener('click', handleBottomNavClick);
    };
  }, []);

  const currentIndex = modalOrderedMembers.findIndex((m: any) => m.id === currentId);
  const member = currentIndex !== -1 ? modalOrderedMembers[currentIndex] : null;

  useEffect(() => {
    if (!currentId) return;

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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentId, currentIndex]);

  useEffect(() => {
    if (member && overlayRef.current && containerRef.current) {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: 'power2.out' }
      );
      gsap.fromTo(
        containerRef.current,
        { scale: 0.94, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [currentId]);

  useEffect(() => {
    if (member && contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
    if (member && mobileContentRef.current) {
      gsap.fromTo(
        mobileContentRef.current,
        { opacity: 0, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [currentIndex]);

  useEffect(() => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
      voiceAudioRef.current = null;
    }
    setIsVoicePlaying(false);
    setHasVoiceAudio(false);

    if (!member) return;

    const audioUrl = member.audio ? withBase(member.audio) : withBase(`/audio/${member.id}.mp3`);
    pauseAudio();

    const audio = new Audio(audioUrl);
    voiceAudioRef.current = audio;

    audio.onplay = () => {
      setIsVoicePlaying(true);
      setHasVoiceAudio(true);
    };

    audio.onpause = () => {
      setIsVoicePlaying(false);
    };

    audio.onended = () => {
      setIsVoicePlaying(false);
    };

    audio.onerror = () => {
      setIsVoicePlaying(false);
      setHasVoiceAudio(false);
    };

    audio
      .play()
      .then(() => {
        setIsVoicePlaying(true);
        setHasVoiceAudio(true);
      })
      .catch(() => {
        setIsVoicePlaying(false);
      });

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [member?.id]);

  const handleClose = () => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
      voiceAudioRef.current = null;
    }
    setIsVoicePlaying(false);

    if (!overlayRef.current || !containerRef.current) {
      closeMemberModal();
      window.dispatchEvent(new CustomEvent('close-member-modal'));
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
      y: 12,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        closeMemberModal();
        window.dispatchEvent(new CustomEvent('close-member-modal'));
      },
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      openMemberModal(modalOrderedMembers[currentIndex - 1].id);
    } else {
      openMemberModal(modalOrderedMembers[modalOrderedMembers.length - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < modalOrderedMembers.length - 1) {
      openMemberModal(modalOrderedMembers[currentIndex + 1].id);
    } else {
      openMemberModal(modalOrderedMembers[0].id);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const toggleVoicePlayback = () => {
    if (!voiceAudioRef.current) return;
    if (isVoicePlaying) {
      voiceAudioRef.current.pause();
    } else {
      voiceAudioRef.current.play().catch(console.error);
    }
  };

  if (!member) return null;

  const getPastelBg = (stageName: string) => {
    switch (stageName.toLowerCase()) {
      case 'faril':
        return 'bg-gradient-to-r from-[#ECDEE8] via-[#F4EBF2] to-white';
      case 'mine':
        return 'bg-gradient-to-r from-[#FCF2D4] via-[#FDF7E5] to-white';
      case 'ndah':
        return 'bg-gradient-to-r from-[#BFD7CF] via-[#D8E8E3] to-white';
      case 'vira':
        return 'bg-gradient-to-r from-[#ECD4D4] via-[#F5E2E2] to-white';
      case 'vely':
        return 'bg-gradient-to-r from-[#BAD7F2] via-[#D5E6F8] to-white';
      case 'liz':
        return 'bg-gradient-to-r from-[#FCD8D8] via-[#FDE8E8] to-white';
      case 'lia':
        return 'bg-gradient-to-r from-[#EBE8E5] via-[#F4F2F0] to-white';
      default:
        return 'bg-gradient-to-r from-[#ECDEE8] via-[#F4EBF2] to-white';
    }
  };

  const getBadgeIconSrc = (id: string) => {
    switch (id.toLowerCase()) {
      case 'faril':
        return withBase('/images/butterfly_purple.svg');
      case 'mine':
        return withBase('/decor/sun.svg');
      case 'ndah':
        return withBase('/decor/tulip.svg');
      case 'vira':
        return withBase('/decor/pita.svg');
      case 'vely':
        return withBase('/decor/whale.svg');
      case 'liz':
        return withBase('/decor/rose.svg');
      case 'lia':
        return withBase('/decor/owl.svg');
      default:
        return null;
    }
  };

  const renderBadgeIcon = (m: any) => {
    const iconSrc = getBadgeIconSrc(m.id || m.stageName);
    if (iconSrc) {
      return (
        <img
          src={iconSrc}
          alt={m.iconName || m.stageName}
          className="w-full h-full object-contain drop-shadow-xs"
        />
      );
    }
    return (
      <span
        className="text-base sm:text-lg font-bold leading-none select-none"
        style={{ color: m.accentColor || m.themeColor }}
      >
        {m.icon || m.emoticon || '✦'}
      </span>
    );
  };

  return createPortal(
    <div
      ref={overlayRef}
      data-lenis-prevent
      className="fixed inset-0 z-[75] flex flex-col items-center justify-center p-3 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-5 sm:p-5 lg:p-6 bg-[#FCFAF5] sm:bg-black/65 sm:backdrop-blur-md overflow-y-auto select-none overscroll-contain"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={(e) => {
        if (e.target === overlayRef.current) {
          e.preventDefault();
        }
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        className="relative w-full max-w-[340px] min-[400px]:max-w-[360px] sm:max-w-[940px] flex flex-col items-center transition-all duration-300"
      >
        <div className="block sm:hidden w-full flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-3 px-1">
            <h2 className="text-2xl min-[400px]:text-3xl font-serif italic text-[#1F1A12] tracking-tight">
              Member
            </h2>
            <button
              onClick={handleClose}
              aria-label={d.closeAria}
              className="p-1.5 rounded-full bg-white/80 hover:bg-white text-[#4A3B5A] shadow-xs border border-white/90 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={mobileContentRef} className="w-full flex flex-col items-center">
            <div
              className="relative w-full aspect-[4/5] rounded-[24px] border-[3.5px] border-white overflow-visible transition-all duration-500"
              style={{
                boxShadow: `0 0 35px ${member.themeColor}55, 0 12px 28px rgba(0,0,0,0.12)`,
              }}
            >
              <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-black/10">
                <img
                  src={member.card}
                  alt={member.stageName}
                  className="w-full h-full object-cover object-top select-none pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                <div className="absolute inset-x-0 bottom-0 p-4 z-10 text-left pointer-events-none">
                  <div className="text-[10px] min-[400px]:text-[11px] font-mono font-bold tracking-[0.2em] uppercase text-white/90 mb-0.5">
                    {member.museCategory || 'MUSE OF MELPOMENE'}
                  </div>
                  <h3 className="text-3xl min-[400px]:text-4xl font-balbes font-normal text-white leading-none mb-1">
                    {member.stageName}
                  </h3>
                  <div className="text-[11px] min-[400px]:text-xs font-bold text-[#E5C07B] tracking-wide">
                    {member.tagline || 'The Dramatic Artist / Deep Soul'}
                  </div>
                </div>
              </div>

              <div className="absolute -right-3.5 top-[38%] -translate-y-1/2 z-20 w-10 h-10 min-[400px]:w-11 min-[400px]:h-11 rounded-full bg-white shadow-md border-2 border-white flex items-center justify-center p-1.5 pointer-events-none">
                {renderBadgeIcon(member)}
              </div>
            </div>

            <p className="text-[11px] min-[400px]:text-xs text-[#554663] leading-relaxed text-left w-full mt-3 px-1">
              {locale === 'en' && member.summaryEn ? member.summaryEn : member.summary}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-2.5 w-full">
              <div className="rounded-[14px] border border-[#DEB887]/70 bg-[#FFFDF9] px-3 py-2 flex flex-col justify-center shadow-xs">
                <span
                  className="text-[9px] font-mono tracking-wider font-bold uppercase"
                  style={{ color: member.themeColor }}
                >
                  {d.born}
                </span>
                <span className="text-xs font-bold text-[#1F1A12] leading-tight mt-0.5">
                  {member.birthFormatted}
                </span>
              </div>

              <div className="rounded-[14px] border border-[#DEB887]/70 bg-[#FFFDF9] px-3 py-2 flex flex-col justify-center shadow-xs">
                <span
                  className="text-[9px] font-mono tracking-wider font-bold uppercase"
                  style={{ color: member.themeColor }}
                >
                  {d.height}
                </span>
                <span className="text-xs font-bold text-[#1F1A12] leading-tight mt-0.5">
                  {member.height}
                </span>
              </div>

              <div className="rounded-[14px] border border-[#DEB887]/70 bg-[#FFFDF9] px-3 py-2 flex flex-col justify-center shadow-xs">
                <span
                  className="text-[9px] font-mono tracking-wider font-bold uppercase"
                  style={{ color: member.themeColor }}
                >
                  {d.color}
                </span>
                <span className="text-xs font-bold text-[#1F1A12] leading-tight mt-0.5 inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: member.themeColor }}
                  />
                  <span>{member.colorName || 'Purple'}</span>
                </span>
              </div>

              <div className="rounded-[14px] border border-[#DEB887]/70 bg-[#FFFDF9] px-3 py-2 flex flex-col justify-center shadow-xs">
                <span
                  className="text-[9px] font-mono tracking-wider font-bold uppercase"
                  style={{ color: member.themeColor }}
                >
                  {d.icon}
                </span>
                <span className="text-xs font-bold text-[#1F1A12] leading-tight mt-0.5">
                  {member.iconName || 'Butterfly'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3.5 pb-1">
            {modalOrderedMembers.map((m) => {
              const isSelected = m.id === member.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => openMemberModal(m.id)}
                  aria-label={fmt(d.pickAria, { name: m.stageName })}
                  className={`transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'w-6 h-1.5 rounded-full bg-[#825E07]'
                      : 'w-1.5 h-1.5 rounded-full bg-[#CEBB89]/60 hover:bg-[#CEBB89]'
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div
          className={`hidden sm:block relative w-full rounded-[28px] sm:rounded-[36px] ${getPastelBg(
            member.stageName
          )} border border-[#C9971C]/25 shadow-[0_25px_70px_rgba(0,0,0,0.18)] overflow-hidden transition-colors duration-500`}
        >
          <button
            onClick={handleClose}
            aria-label={d.closeAria}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2 rounded-full bg-white/60 hover:bg-white text-[#4A3B5A] shadow-xs border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
            <span
              className="font-balbes text-[130px] sm:text-[180px] md:text-[230px] lg:text-[280px] tracking-normal leading-none select-none opacity-20 whitespace-nowrap transition-all duration-300"
              style={{ color: member.themeColor }}
            >
              {member.id === 'faril' ? 'Faril' : member.stageName.toUpperCase()}
            </span>
          </div>

          <div
            ref={contentRef}
            className="relative p-6 sm:p-8 lg:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 overflow-hidden z-10"
          >
            <div className="relative shrink-0 w-[240px] sm:w-[280px] lg:w-[310px] aspect-[4/5] mx-auto md:mx-0">
              <div
                className="absolute inset-0 translate-x-3.5 translate-y-3.5 sm:translate-x-4 sm:translate-y-4 rounded-[26px] sm:rounded-[30px] border-2 pointer-events-none z-0"
                style={{ borderColor: member.themeColor }}
              />

              <div className="relative z-10 w-full h-full rotate-[2deg] sm:rotate-[2.5deg]">
                <div className="w-full h-full rounded-[24px] sm:rounded-[28px] overflow-hidden bg-white border-4 border-white shadow-xl">
                  <img
                    src={member.card}
                    alt={member.stageName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>

                <div className="absolute -right-3 sm:-right-3.5 top-[30%] -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md border border-white flex items-center justify-center p-1.5">
                  {renderBadgeIcon(member)}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex-1 min-w-0 text-left w-full pt-1">
              <div
                className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.25em] uppercase mb-1.5"
                style={{ color: member.themeColor }}
              >
                {member.museCategory || 'MUSE OF MELPOMENE'}
              </div>

              <h2
                id="member-modal-title"
                className="text-5xl sm:text-6xl lg:text-7xl font-balbes font-normal text-[#1F1A12] tracking-tight leading-none mb-3"
              >
                {member.stageName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="text-sm sm:text-base font-bold text-[#C9971C] tracking-wide">
                  {member.tagline || 'The Dramatic Artist / Deep Soul'}
                </div>
                {hasVoiceAudio && (
                  <button
                    onClick={toggleVoicePlayback}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 hover:bg-white text-xs font-semibold text-[#4A3B5A] shadow-xs border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    aria-label={isVoicePlaying ? 'Mute voice' : 'Play voice'}
                  >
                    {isVoicePlaying ? (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#C9971C]" />
                        <span>Voice On</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#8D7C9D]" />
                        <span>Voice Off</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#554663] leading-relaxed mb-6 max-w-lg">
                {locale === 'en' && member.summaryEn ? member.summaryEn : member.summary}
              </p>

              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                      {d.born}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                      {member.birthFormatted}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                      {d.height}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                      {member.height}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                      {d.zodiac}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                      {member.zodiac}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                      {d.color}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#1F1A12] inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: member.themeColor }}
                      />
                      <span>{member.colorName || 'Purple'}</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                      {d.icon}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                      {member.iconName || 'Butterfly'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center gap-2.5 sm:gap-3.5 mt-5 sm:mt-7 overflow-x-auto py-2 px-4 max-w-full">
          {modalOrderedMembers.map((m) => {
            const isSelected = m.id === member.id;
            return (
              <button
                key={m.id}
                onClick={() => openMemberModal(m.id)}
                className={`relative rounded-full transition-all duration-300 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'w-12 h-12 sm:w-14 sm:h-14 scale-110 shadow-lg'
                    : 'w-9 h-9 sm:w-11 sm:h-11 opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                style={{
                  boxShadow: isSelected ? `0 0 0 3px ${m.themeColor}` : undefined,
                }}
                aria-label={fmt(d.pickAria, { name: m.stageName })}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white border border-white/80">
                  <img
                    src={m.card}
                    alt={m.stageName}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
