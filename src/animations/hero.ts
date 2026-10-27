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

  const activeName = rootContainer.querySelector<HTMLElement>('#active-member-name');
  const activeSubtitle = rootContainer.querySelector<HTMLElement>('#active-subtitle-text');
  const activeBullet = rootContainer.querySelector<HTMLElement>('#active-bullet');

  function resetToDefaultState() {
    if (frame2) {
      frame2.setAttribute('data-active', 'faril');
    }
    if (activeName) activeName.textContent = 'Faril';
    if (activeSubtitle) activeSubtitle.textContent = 'Muse of Melpomene · The Dramatic Artist';
    if (activeBullet) activeBullet.style.backgroundColor = '#8E24AA';
  }

  cards.forEach((card) => {
    const memberId = card.getAttribute('data-member-id');
    const memberName = card.getAttribute('data-member-name');
    const museTitle = card.getAttribute('data-muse-title');
    const themeColor = card.getAttribute('data-theme-color') || '#8E24AA';

    card.addEventListener('mouseenter', () => {
      if (frame2 && memberId) {
        frame2.setAttribute('data-active', memberId);
      }
      if (activeName && memberName) activeName.textContent = memberName;
      if (activeSubtitle && museTitle) activeSubtitle.textContent = museTitle;
      if (activeBullet) activeBullet.style.backgroundColor = themeColor;
    });

    card.addEventListener('mouseleave', () => {
      resetToDefaultState();
    });

    card.addEventListener('click', () => {
      if (memberId) {
        window.dispatchEvent(new CustomEvent('open-member-modal', { detail: memberId }));
      }
    });
  });

  if (cardsTrack) {
    cardsTrack.addEventListener('mouseleave', () => {
      resetToDefaultState();
    });
  }

  const ctx = gsap.context(() => {
    if (!frame1 || !frame2) return;

    gsap.set(frame1, { opacity: 1, scale: 1, y: 0 });
    gsap.set(frame2, { opacity: 0 });
    if (cardsTrack) gsap.set(cardsTrack, { opacity: 0, scale: 0.84, y: 35 });
    if (logoAnchor) gsap.set(logoAnchor, { scale: 1, y: 0 });
    if (frame1Img) gsap.set(frame1Img, { scale: 1, y: 0 });

    const isMobile = window.innerWidth < 640;
    const targetLogoScale = isMobile ? 0.66 : 0.56;
    const targetLogoY = isMobile ? -10 : -18;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: rootContainer,
        start: 'top top',
        end: '+=1000',
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
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

    if (frame1Img) {
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
