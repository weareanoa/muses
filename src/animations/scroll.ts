import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

export interface SmoothScrollController {
  lenis: Lenis | null;
  destroy: () => void;
  stop: () => void;
  start: () => void;
  scrollTo: (target: string | number | HTMLElement, options?: any) => void;
}

/**
 * Initializes centralized Lenis smooth scrolling and synchronizes with GSAP ScrollTrigger.
 */
export function initSmoothScroll(): SmoothScrollController {
  if (typeof window === 'undefined') {
    return {
      lenis: null,
      destroy: () => {},
      stop: () => {},
      start: () => {},
      scrollTo: () => {},
    };
  }

  if (lenisInstance) {
    return {
      lenis: lenisInstance,
      destroy: cleanupSmoothScroll,
      stop: () => lenisInstance?.stop(),
      start: () => lenisInstance?.start(),
      scrollTo: (target, options) => lenisInstance?.scrollTo(target, options),
    };
  }

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    return {
      lenis: null,
      destroy: () => {},
      stop: () => {},
      start: () => {},
      scrollTo: () => {},
    };
  }

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    smoothWheel: true,
  });

  (window as any).__lenis = lenisInstance;

  lenisInstance.on('scroll', ScrollTrigger.update);

  tickerCallback = (time: number) => {
    lenisInstance?.raf(time * 1000);
  };

  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0);

  return {
    lenis: lenisInstance,
    destroy: cleanupSmoothScroll,
    stop: () => lenisInstance?.stop(),
    start: () => lenisInstance?.start(),
    scrollTo: (target, options) => lenisInstance?.scrollTo(target, options),
  };
}

export function cleanupSmoothScroll() {
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
    delete (window as any).__lenis;
  }
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}
