import gsap from 'gsap';

export interface PreloaderController {
  skip: () => void;
  destroy: () => void;
}

export function initPreloader(preloaderId: string = 'brand-preloader'): PreloaderController {
  if (typeof window === 'undefined') {
    return { skip: () => {}, destroy: () => {} };
  }

  const preloader = document.getElementById(preloaderId);
  const titleContainer = document.getElementById('preloader-title-container');
  const musesTitle = document.getElementById('preloader-muses-title');
  const metaWrap = document.getElementById('preloader-meta-wrap');
  const progressBar = document.getElementById('preloader-progress-bar');
  const skipBtn = document.getElementById('skip-preloader');

  if (!preloader || !titleContainer || !musesTitle) {
    return { skip: () => {}, destroy: () => {} };
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    preloader.style.display = 'none';
    window.dispatchEvent(new CustomEvent('preloader-complete'));
    return { skip: () => {}, destroy: () => {} };
  }

  let tl: gsap.core.Timeline | null = null;

  const finish = (fast: boolean = false) => {
    if (tl) tl.kill();
    gsap.to(preloader, {
      opacity: 0,
      duration: fast ? 0.2 : 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        preloader.style.display = 'none';
        window.dispatchEvent(new CustomEvent('preloader-complete'));
      },
    });
  };

  const ctx = gsap.context(() => {
    tl = gsap.timeline({
      onComplete: () => finish(false),
    });

    if (progressBar) {
      tl.to(
        progressBar,
        {
          width: '100%',
          duration: 1.3,
          ease: 'power1.inOut',
        },
        0
      );
    }

    tl.fromTo(
      musesTitle,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: 'power3.out' },
      0
    );

    if (metaWrap) {
      tl.fromTo(
        metaWrap,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        0.2
      );
    }

    if (metaWrap) {
      tl.to(
        metaWrap,
        {
          opacity: 0,
          scale: 0.9,
          y: -10,
          duration: 0.25,
          ease: 'power2.in',
        },
        1.2
      );
    }

    tl.to(
      titleContainer,
      {
        y: () => {
          const heroTitle = document.getElementById('hero-muses-title');
          if (heroTitle && musesTitle) {
            const heroRect = heroTitle.getBoundingClientRect();
            const titleRect = musesTitle.getBoundingClientRect();
            return (heroRect.top + heroRect.height / 2) - (titleRect.top + titleRect.height / 2);
          }
          return -150;
        },
        scale: () => {
          const heroTitle = document.getElementById('hero-muses-title');
          if (heroTitle && musesTitle) {
            const heroRect = heroTitle.getBoundingClientRect();
            const titleRect = musesTitle.getBoundingClientRect();
            return Math.max(0.3, heroRect.height / titleRect.height);
          }
          return 0.52;
        },
        duration: 0.8,
        ease: 'power3.inOut',
      },
      1.2
    );

    tl.to(
      preloader,
      {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.inOut',
      },
      1.55
    );
  }, preloader);

  const handleSkip = () => finish(true);
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') handleSkip();
  };

  skipBtn?.addEventListener('click', handleSkip);
  window.addEventListener('keydown', handleKeyDown);

  return {
    skip: handleSkip,
    destroy: () => {
      skipBtn?.removeEventListener('click', handleSkip);
      window.removeEventListener('keydown', handleKeyDown);
      ctx.revert();
    },
  };
}
