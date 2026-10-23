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
  const logoContainer = document.getElementById('preloader-logo-container');
  const groupContainer = document.getElementById('preloader-group-container');
  const progressBar = document.getElementById('preloader-progress-bar');
  const skipBtn = document.getElementById('skip-preloader');

  if (!preloader || !logoContainer) {
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
      duration: fast ? 0.25 : 0.6,
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
          duration: 3.2,
          ease: 'none',
        },
        0
      );
    }

    tl.fromTo(
      logoContainer,
      { scale: 0.9, opacity: 0, y: 15 },
      { scale: 1, opacity: 1, y: 0, duration: 1.0, ease: 'power3.out' },
      0.1
    );

    if (groupContainer) {
      tl.fromTo(
        groupContainer,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        0.3
      );
    }

    tl.to({}, { duration: 1.5 });

    tl.to(
      logoContainer,
      {
        scale: 0.44,
        y: -130,
        duration: 1.2,
        ease: 'power2.inOut',
      }
    );

    if (groupContainer) {
      tl.to(
        groupContainer,
        {
          opacity: 0,
          scale: 0.96,
          y: 15,
          duration: 0.8,
          ease: 'power2.in',
        },
        '<+=0.1'
      );
    }
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
