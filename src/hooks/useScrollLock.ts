import { useEffect } from 'react';
import { getLenis } from '../animations/scroll';

export function lockScroll(): () => void {
  if (typeof window === 'undefined') return () => {};

  const lenisInstance = getLenis();
  const originalHtmlOverflow = document.documentElement.style.overflow;
  const originalBodyOverflow = document.body.style.overflow;

  if (lenisInstance) {
    try {
      lenisInstance.stop();
    } catch (err) {}
  }
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  return () => {
    if (lenisInstance) {
      try {
        lenisInstance.start();
      } catch (err) {}
    }
    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
  };
}

export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    return lockScroll();
  }, [isLocked]);
}

