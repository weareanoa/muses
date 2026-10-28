import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { withBase, withBaseDeep } from '../../lib/paths';
import { activeMemberId, closeMemberModal, openMemberModal } from '../../stores/memberModalStore';
import { pauseAudio } from '../../stores/audioStore';
import { members as membersDataRaw, type Member } from '../../data/members';
import { useScrollLock } from '../../hooks/useScrollLock';
import { X, Volume2, VolumeX } from 'lucide-react';
import gsap from 'gsap';

const membersData = withBaseDeep(membersDataRaw) as readonly Member[];

const MODAL_MEMBER_ORDER = ['faril', 'mine', 'ndah', 'vira', 'vely', 'liz', 'lia'] as const;

const modalOrderedMembers = [...membersData].sort(
  (a, b) => MODAL_MEMBER_ORDER.indexOf(a.id as any) - MODAL_MEMBER_ORDER.indexOf(b.id as any)
);

export default function MemberModal() {
  const currentId = useStore(activeMemberId);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

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
    return () => window.removeEventListener('open-member-modal', handleCustomOpen);
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
      case 'vira':
        return 'bg-gradient-to-br from-[#FDE9F1] via-[#FFF3F8] to-[#FCE6EF]';
      case 'vely':
        return 'bg-gradient-to-br from-[#E1F3FD] via-[#EEF8FE] to-[#E0F1FC]';
      case 'mine':
        return 'bg-gradient-to-br from-[#FFF8E1] via-[#FFFDF5] to-[#FFF6D6]';
      case 'faril':
        return 'bg-gradient-to-br from-[#EDE4F8] via-[#F4EFFC] to-[#EAE0F9]';
      case 'ndah':
        return 'bg-gradient-to-br from-[#E8F6EA] via-[#F3FAF4] to-[#E6F4E8]';
      case 'liz':
        return 'bg-gradient-to-br from-[#FDEAEA] via-[#FFF3F3] to-[#FCE7E7]';
      case 'lia':
        return 'bg-gradient-to-br from-[#F2ECE9] via-[#FAF6F4] to-[#EFE7E4]';
      default:
        return 'bg-gradient-to-br from-[#EDE4F8] via-[#F4EFFC] to-[#EAE0F9]';
    }
  };

  const renderBadgeIcon = (m: any) => {
    if (m.stageName.toLowerCase() === 'faril') {
      return (
        <img
          src={withBase('/images/butterfly_purple.svg')}
          alt="Butterfly"
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

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-5 lg:p-6 bg-black/65 backdrop-blur-md overflow-y-auto select-none"
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-modal-title"
        className={`relative w-full max-w-[940px] rounded-[28px] sm:rounded-[36px] ${getPastelBg(
          member.stageName
        )} border border-[#C9971C]/25 shadow-[0_25px_70px_rgba(0,0,0,0.18)] overflow-hidden transition-colors duration-500`}
      >
        <button
          onClick={handleClose}
          aria-label="Tutup Profil Member"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-30 p-2 rounded-full bg-white/60 hover:bg-white text-[#4A3B5A] shadow-xs border border-white/80 transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>

        <div
          ref={contentRef}
          className="relative p-6 sm:p-8 lg:p-12 flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 overflow-hidden"
        >
          <div
            className="absolute top-1/2 right-4 lg:right-10 -translate-y-1/2 text-[100px] sm:text-[140px] md:text-[180px] lg:text-[230px] font-serif font-bold pointer-events-none select-none leading-none opacity-8 tracking-tighter"
            style={{ color: member.themeColor }}
          >
            {member.stageName}
          </div>

          <div className="relative shrink-0 w-[240px] sm:w-[280px] lg:w-[310px] aspect-[4/5] mx-auto md:mx-0">
            <div
              className="absolute -bottom-2.5 -right-2.5 sm:-bottom-3 sm:-right-3 w-full h-full rounded-[28px] border-2 pointer-events-none z-0"
              style={{ borderColor: member.themeColor }}
            />

            <div className="relative z-10 w-full h-full rounded-[26px] overflow-hidden bg-white border-2 border-white shadow-xl">
              <img
                src={member.card}
                alt={member.stageName}
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="absolute -right-3 sm:-right-4 top-1/3 translate-y-1 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md border border-white flex items-center justify-center p-1.5">
              {renderBadgeIcon(member)}
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
              className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1F1A12] tracking-tight leading-none mb-3"
            >
              {member.stageName}
            </h2>

            <div className="flex flex-wrap items-center gap-3 mb-3">
              <div className="text-sm sm:text-base font-bold text-[#C9971C] tracking-wide">
                {member.tagline || 'The Dramatic Artist / Deep Soul'}
              </div>

              {(hasVoiceAudio || member.audio || member.id === 'faril') && (
                <button
                  type="button"
                  onClick={toggleVoicePlayback}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/85 hover:bg-white text-xs font-semibold shadow-xs border border-white/90 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  style={{ color: member.themeColor }}
                  title={isVoicePlaying ? 'Jeda suara member' : 'Putar suara member'}
                >
                  {isVoicePlaying ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Voice Intro</span>
                      <span className="flex gap-0.5 items-end h-3 ml-0.5">
                        <span className="w-0.5 h-2 bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-0.5 h-3 bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-0.5 h-1.5 bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 opacity-70" />
                      <span>Putar Suara</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-[#554663] leading-relaxed mb-6 max-w-lg">
              {member.summary || member.story01}
            </p>

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                    LAHIR
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                    {member.birthFormatted}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                    TINGGI
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                    {member.height}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                    ZODIAK
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#1F1A12]">
                    {member.zodiac}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <span className="block text-[10px] font-mono tracking-[0.2em] uppercase text-[#8D7C9D] font-bold mb-1">
                    WARNA
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
                    IKON
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

      <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mt-5 sm:mt-7 overflow-x-auto py-2 px-4 max-w-full">
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
              aria-label={`Pilih ${m.stageName}`}
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
  );
}
