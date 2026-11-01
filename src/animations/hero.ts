import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface HeroAnimationController {
  destroy: () => void;
  revert: () => void;
}

export function initHeroParallaxAnimation(rootContainer: HTMLElement | null): HeroAnimationController {
  if (!rootContainer || typeof window === 'undefined') {
    return { destroy: () => {}, revert: () => {} };
  }

  const logoAnchor = rootContainer.querySelector<HTMLElement>('#hero-logo-anchor');
  const frame1 = rootContainer.querySelector<HTMLElement>('#hero-frame-1');
  const frame1Img = rootContainer.querySelector<HTMLElement>('#frame1-group-img');
  const sparkles = rootContainer.querySelector<HTMLElement>('#frame1-sparkles');
  const frame2 = rootContainer.querySelector<HTMLElement>('#hero-frame-2');
  const cardsTrack = rootContainer.querySelector<HTMLElement>('#arc-cards-track');
  const cards = rootContainer.querySelectorAll<HTMLButtonElement>('.muses-hero-card');

  const activeName = rootContainer.querySelector<HTMLElement>('#active-member-name-text');
  const activeIcon = rootContainer.querySelector<HTMLElement>('#active-member-icon');
  const activeSubtitle = rootContainer.querySelector<HTMLElement>('#active-subtitle-text');
  const activeSubtitleMobile = rootContainer.querySelector<HTMLElement>('#active-subtitle-mobile');
  const activeBullet = rootContainer.querySelector<HTMLElement>('#active-bullet');

  const canHover = window.matchMedia('(hover: hover)').matches;
  const defaultCard = rootContainer.querySelector<HTMLButtonElement>('.muses-hero-card[data-member-id="faril"]');
  let selectedId = 'faril';

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .replace(/(^|\s)\S/g, (char) => char.toUpperCase())
      .replace(/\sOf\s/g, ' of ');

  function showMember(card: HTMLButtonElement | null) {
    if (!card) return;
    const memberId = card.getAttribute('data-member-id');
    const museTitle = card.getAttribute('data-muse-title') || '';
    const museCategory = card.getAttribute('data-muse-category') || '';
    const shortTitle = museTitle.split('/')[0].trim();

    if (frame2 && memberId) frame2.setAttribute('data-active', memberId);
    if (activeName) activeName.textContent = card.getAttribute('data-member-name');
    if (activeIcon) activeIcon.textContent = card.getAttribute('data-member-icon');
    if (activeSubtitle) activeSubtitle.textContent = museTitle;
    if (activeSubtitleMobile) {
      activeSubtitleMobile.textContent = [toTitleCase(museCategory), shortTitle].filter(Boolean).join(' · ');
    }
    if (activeBullet) activeBullet.style.backgroundColor = card.getAttribute('data-theme-color') || '#8E24AA';
  }

  function resetToDefaultState() {
    showMember(defaultCard);
  }

  let lastSwipeTime = 0;

  function selectCard(card: HTMLButtonElement) {
    selectedId = card.getAttribute('data-member-id') || selectedId;
    cards.forEach((other) => other.setAttribute('data-selected', String(other === card)));
    showMember(card);
  }

  cards.forEach((card) => {
    const memberId = card.getAttribute('data-member-id');

    if (canHover) {
      card.addEventListener('mouseenter', () => showMember(card));
      card.addEventListener('mouseleave', resetToDefaultState);
    }

    card.addEventListener('click', (e) => {
      if (Date.now() - lastSwipeTime < 400) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (memberId) {
        selectCard(card);
        window.dispatchEvent(new CustomEvent('open-member-modal', { detail: memberId }));
      }
    });
  });

  if (canHover && cardsTrack) {
    cardsTrack.addEventListener('mouseleave', resetToDefaultState);
  }

  if (!canHover && defaultCard) {
    selectCard(defaultCard);
  }

  if (!canHover && frame2) {
    const SWIPE_THRESHOLD = 28;
    const cardList = Array.from(cards);
    let startX = 0;
    let startY = 0;

    const onTouchStart = (event: TouchEvent) => {
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      const dx = event.touches[0].clientX - startX;
      if (Math.abs(dx) > 10) {
        lastSwipeTime = Date.now();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      const dx = event.changedTouches[0].clientX - startX;
      const dy = event.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.2) return;

      lastSwipeTime = Date.now();
      const current = cardList.findIndex((card) => card.getAttribute('data-member-id') === selectedId);
      const next = cardList[Math.min(cardList.length - 1, Math.max(0, current + (dx < 0 ? 1 : -1)))];
      if (next) selectCard(next);
    };

    frame2.addEventListener('touchstart', onTouchStart, { passive: true });
    frame2.addEventListener('touchmove', onTouchMove, { passive: true });
    frame2.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  const ctx = gsap.context(() => {
    if (!frame1 || !frame2) return;

    gsap.set(frame1, { opacity: 1, scale: 1, y: 0 });
    gsap.set(frame2, { opacity: 0 });
    if (cardsTrack) gsap.set(cardsTrack, { opacity: 0, scale: 0.84, y: 35 });
    if (logoAnchor) gsap.set(logoAnchor, { scale: 1, y: 0 });
    if (frame1Img) gsap.set(frame1Img, { scale: 1, y: 0 });

    const isMobile = window.innerWidth < 640;
    // Pointer kasar (HP): morph dibuat jauh lebih kalem — jarak scrub
    // lebih panjang, lag lebih besar, tanpa snap saat flick.
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const targetLogoScale = isMobile ? 0.66 : 0.56;
    const targetLogoY = isMobile ? -window.innerHeight * 0.07 : -18;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: rootContainer,
        start: 'top top',
        end: isCoarsePointer ? '+=1600' : '+=1000',
        pin: true,
        scrub: isCoarsePointer ? 2 : 0.8,
        anticipatePin: 1,
        fastScrollEnd: !isCoarsePointer,
        preventOverlaps: true,
        onUpdate: (self) => {
          if (self.progress > 0.52) {
            frame2.style.pointerEvents = 'auto';
            if (frame1) frame1.style.pointerEvents = 'none';
          } else {
            frame2.style.pointerEvents = 'none';
            if (frame1) frame1.style.pointerEvents = 'auto';
          }
        },
      },
    });

    if (sparkles) {
      tl.to(
        sparkles,
        {
          opacity: 0,
          scale: 0.7,
          duration: 0.35,
          ease: 'power2.in',
        },
        0
      );
    }

    if (logoAnchor) {
      tl.to(
        logoAnchor,
        {
          scale: targetLogoScale,
          y: targetLogoY,
          duration: 0.75,
          ease: 'power2.inOut',
        },
        0
      );
    }

    // Mobile: jangan scale raster grup tiap frame scroll — itu pemicu
    // re-raster termahal. Crossfade opacity frame1 (murah) tetap jalan.
    if (frame1Img && !isCoarsePointer) {
      tl.to(
        frame1Img,
        {
          scale: 0.86,
          y: 22,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        0
      );
    }

    tl.to(
      frame1,
      {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.inOut',
      },
      0.15
    );

    tl.to(
      frame2,
      {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out',
      },
      0.28
    );

    if (cardsTrack) {
      tl.to(
        cardsTrack,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
        },
        0.28
      );
    }
  }, rootContainer);

  return {
    destroy: () => ctx.revert(),
    revert: () => ctx.revert(),
  };
}
