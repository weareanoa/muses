import { useEffect } from 'react';
import { getLenis } from '../animations/scroll';

let lockCount = 0;
let scrollPosition = 0;
let originalHtmlOverflow = '';
let originalBodyOverflow = '';
let originalBodyPosition = '';
let originalBodyTop = '';
let originalBodyWidth = '';

export function setScrollLockPosition(y: number): void {
  scrollPosition = Math.max(0, y);
}

export function lockScroll(): () => void {
  if (typeof window === 'undefined') return () => {};

  lockCount++;
  if (lockCount === 1) {
    scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyOverflow = document.body.style.overflow;
    originalBodyPosition = document.body.style.position;
    originalBodyTop = document.body.style.top;
    originalBodyWidth = document.body.style.width;

    const lenisInstance = getLenis();
    if (lenisInstance) {
      try {
        lenisInstance.stop();
      } catch (err) {}
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
  }

  let unlocked = false;
  return () => {
    if (unlocked) return;
    unlocked = true;
    lockCount = Math.max(0, lockCount - 1);

    if (lockCount === 0) {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;

      window.scrollTo(0, scrollPosition);

      const lenisInstance = getLenis();
      if (lenisInstance) {
        try {
          lenisInstance.start();
        } catch (err) {}
      }
    }
  };
}

export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    return lockScroll();
  }, [isLocked]);
}
