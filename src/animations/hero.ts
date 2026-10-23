import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export interface HeroAnimationController {
  destroy: () => void;
  revert: () => void;
}

/**
 * Encapsulated GSAP animation controller for the hero arc cards.
 * Uses gsap.context() for clean scoping and lifecycle unmounting.
 */
export function initHeroAnimation(rootContainer: HTMLElement | null): HeroAnimationController {
  if (!rootContainer || typeof window === 'undefined') {
    return { destroy: () => {}, revert: () => {} };
  }

  const cards = rootContainer.querySelectorAll<HTMLElement>('.muses-hero-card');
  const activeNameEl = rootContainer.querySelector<HTMLElement>('#active-member-name');
  const activeSubtitleTextEl = rootContainer.querySelector<HTMLElement>('#active-subtitle-text');
  const activeBulletEl = rootContainer.querySelector<HTMLElement>('#active-bullet');
  const infoHoverState = rootContainer.querySelector<HTMLElement>('#info-hover-state');
  const infoSection = rootContainer.querySelector<HTMLElement>('#active-member-info');
  const arcTrack = rootContainer.querySelector<HTMLElement>('#arc-cards-track');
  const targetSlot = rootContainer.querySelector<HTMLElement>('#settled-cards-slot');
  const bottomGlow = rootContainer.querySelector<HTMLElement>('#hero-bottom-glow');

  if (!cards.length) {
    return { destroy: () => {}, revert: () => {} };
  }

  let currentScrollProgress = 0;

  function getDocTop(el: HTMLElement): number {
    let top = 0;
    let curr: HTMLElement | null = el;
    while (curr) {
      top += curr.offsetTop;
      curr = curr.offsetParent as HTMLElement | null;
    }
    return top;
  }

  function calculateDeltaY(): number {
    if (!arcTrack || !targetSlot) return 680;
    const trackTop = getDocTop(arcTrack);
    const slotTop = getDocTop(targetSlot);
    return Math.max(580, slotTop - trackTop);
  }

  let deltaY = calculateDeltaY();

  const handleResize = () => {
    deltaY = calculateDeltaY();
    ScrollTrigger.refresh();
  };

  window.addEventListener('resize', handleResize);

  function hoverIn(card: HTMLElement) {
    const defaultRot = parseFloat(card.dataset.defaultRot || '0');
    const defaultY = parseFloat(card.dataset.defaultY || '0');
    const defaultScale = parseFloat(card.dataset.defaultScale || '1');
    const themeColor = card.dataset.themeColor || '#8E24AA';
    const gradStart = card.dataset.gradientStart || '#CE93D8';
    const gradEnd = card.dataset.gradientEnd || '#8E24AA';
    const bgTint = card.dataset.bgTint || '#FFF';

    const currentBaseRot = defaultRot * (1 - currentScrollProgress);
    const currentBaseY = defaultY * (1 - currentScrollProgress) + currentScrollProgress * deltaY;
    const currentBaseScale = defaultScale + (1.0 - defaultScale) * currentScrollProgress;
    const hoverScale = currentBaseScale * 1.08;

    card.style.zIndex = '50';
    card.style.transform = `translateY(${currentBaseY - 16}px) rotate(${currentBaseRot}deg) scale(${hoverScale})`;
    card.style.background = `linear-gradient(155deg, ${bgTint}, ${gradStart}, ${gradEnd})`;
    card.classList.remove('bg-white/90', 'border-[#C9971C]/30', 'shadow-[0_8px_24px_rgba(201,151,28,0.1)]');
    card.classList.add('border-white', 'shadow-[0_20px_45px_rgba(0,0,0,0.25)]');

    const neutralView = card.querySelector<HTMLElement>('.hero-neutral-view');
    const settledView = card.querySelector<HTMLElement>('.settled-txt-view');
    const hoverView = card.querySelector<HTMLElement>('.card-hover-view');
    if (neutralView) neutralView.style.opacity = '0';
    if (settledView) settledView.style.opacity = '0';
    if (hoverView) hoverView.style.opacity = '1';

    if (activeNameEl) activeNameEl.textContent = card.dataset.memberName || 'MUSE';
    if (activeSubtitleTextEl) activeSubtitleTextEl.textContent = card.dataset.museTitle || 'Official Artist';
    if (activeBulletEl) activeBulletEl.style.backgroundColor = themeColor;

    if (infoHoverState) {
      infoHoverState.classList.remove('hidden');
      infoHoverState.classList.add('flex');
    }
  }

  function hoverOut(card: HTMLElement) {
    const defaultRot = parseFloat(card.dataset.defaultRot || '0');
    const defaultY = parseFloat(card.dataset.defaultY || '0');
    const defaultScale = parseFloat(card.dataset.defaultScale || '1');
    const defaultZ = card.dataset.defaultZ || '10';

    const currentBaseRot = defaultRot * (1 - currentScrollProgress);
    const currentBaseY = defaultY * (1 - currentScrollProgress) + currentScrollProgress * deltaY;
    const currentBaseScale = defaultScale + (1.0 - defaultScale) * currentScrollProgress;

    card.style.zIndex = defaultZ;
    card.style.transform = `translateY(${currentBaseY}px) rotate(${currentBaseRot}deg) scale(${currentBaseScale})`;
    card.style.background = '';
    card.classList.add('bg-white/90', 'border-[#C9971C]/30', 'shadow-[0_8px_24px_rgba(201,151,28,0.1)]');
    card.classList.remove('border-white', 'shadow-[0_20px_45px_rgba(0,0,0,0.25)]');

    const neutralView = card.querySelector<HTMLElement>('.hero-neutral-view');
    const settledView = card.querySelector<HTMLElement>('.settled-txt-view');
    const hoverView = card.querySelector<HTMLElement>('.card-hover-view');
    const settledFade = Math.min(1, Math.max(0, (currentScrollProgress - 0.2) / 0.5));
    if (neutralView) neutralView.style.opacity = `${1 - settledFade}`;
    if (settledView) settledView.style.opacity = `${settledFade}`;
    if (hoverView) hoverView.style.opacity = '0';

    if (infoHoverState) {
      infoHoverState.classList.add('hidden');
      infoHoverState.classList.remove('flex');
    }
  }

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => hoverIn(card));
    card.addEventListener('mouseleave', () => hoverOut(card));
    card.addEventListener('click', () => {
      const memberId = card.dataset.memberId;
      if (memberId) {
        window.dispatchEvent(new CustomEvent('open-member-modal', { detail: memberId }));
      }
    });
  });

  const ctx = gsap.context(() => {
    if (window.innerWidth >= 640 && arcTrack) {
      ScrollTrigger.create({
        trigger: rootContainer,
        start: 'top top',
        end: () => `+=${deltaY}`,
        scrub: 1,
        onUpdate: (self) => {
          currentScrollProgress = self.progress;
          const progress = self.progress;
          const settledFade = Math.min(1, Math.max(0, (progress - 0.2) / 0.5));

          cards.forEach((card) => {
            const rot = parseFloat(card.dataset.defaultRot || '0');
            const y = parseFloat(card.dataset.defaultY || '0');
            const scale = parseFloat(card.dataset.defaultScale || '1');

            const currentRot = rot * (1 - progress);
            const currentY = y * (1 - progress) + progress * deltaY;
            const currentScale = scale + (1.0 - scale) * progress;

            card.style.transform = `translateY(${currentY}px) rotate(${currentRot}deg) scale(${currentScale})`;

            const neutralView = card.querySelector<HTMLElement>('.hero-neutral-view');
            const settledView = card.querySelector<HTMLElement>('.settled-txt-view');
            if (neutralView) neutralView.style.opacity = `${1 - settledFade}`;
            if (settledView) settledView.style.opacity = `${settledFade}`;
          });

          if (infoSection) {
            infoSection.style.opacity = `${Math.max(0, 1 - progress * 2.8)}`;
            infoSection.style.transform = `translateY(${progress * 30}px)`;
          }

          if (bottomGlow) {
            bottomGlow.style.opacity = `${Math.max(0, 1 - progress * 2)}`;
          }
        },
      });
    }
  }, rootContainer);

  return {
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      ctx.revert();
    },
    revert: () => ctx.revert(),
  };
}
