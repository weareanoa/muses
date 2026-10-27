import { openCart } from '../stores/cartStore';
import { getLenis } from './scroll';

export interface NavbarController {
  destroy: () => void;
}

export function initNavbar(): NavbarController {
  if (typeof window === 'undefined') {
    return { destroy: () => {} };
  }

  const header = document.getElementById('main-header');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileDrawer = document.getElementById('mobile-nav-drawer');
  const hamburgerIcon = document.getElementById('hamburger-icon');
  const closeIcon = document.getElementById('close-icon');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');
  const cartBtn = document.getElementById('nav-cart-btn');

  let isMobileMenuOpen = false;
  let lastScrollY = window.scrollY;
  let isHeaderHidden = false;

  function updateNavbar(scrollY: number, forceDirection?: number) {
    if (!header || isMobileMenuOpen) return;

    const currentY = Math.max(0, scrollY);
    const delta = currentY - lastScrollY;
    const direction = forceDirection !== undefined ? forceDirection : delta > 2 ? 1 : delta < -2 ? -1 : 0;

    if (currentY <= 60) {
      header.classList.remove('navbar-hidden', 'navbar-scrolled');
      header.classList.add('navbar-visible');
      header.style.transform = 'translateY(0)';
      isHeaderHidden = false;
      lastScrollY = currentY;
      return;
    }

    header.classList.add('navbar-scrolled');

    if (direction === 1 && !isHeaderHidden) {
      header.classList.remove('navbar-visible');
      header.classList.add('navbar-hidden');
      header.style.transform = 'translateY(-100%)';
      isHeaderHidden = true;
    } else if (direction === -1 && isHeaderHidden) {
      header.classList.remove('navbar-hidden');
      header.classList.add('navbar-visible');
      header.style.transform = 'translateY(0)';
      isHeaderHidden = false;
    }

    lastScrollY = currentY;
  }

  function setMobileMenu(open: boolean) {
    isMobileMenuOpen = open;
    if (!mobileDrawer) return;

    if (open) {
      mobileDrawer.classList.remove('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileDrawer.classList.add('translate-y-0', 'opacity-100', 'pointer-events-auto');
      hamburgerIcon?.classList.add('hidden');
      closeIcon?.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      mobileDrawer.classList.add('-translate-y-full', 'opacity-0', 'pointer-events-none');
      mobileDrawer.classList.remove('translate-y-0', 'opacity-100', 'pointer-events-auto');
      hamburgerIcon?.classList.remove('hidden');
      closeIcon?.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  const toggleMobileMenu = () => setMobileMenu(!isMobileMenuOpen);
  const closeMobile = () => setMobileMenu(false);

  mobileBtn?.addEventListener('click', toggleMobileMenu);
  mobileLinks.forEach((link) => link.addEventListener('click', closeMobile));

  const handleCartClick = () => openCart();
  cartBtn?.addEventListener('click', handleCartClick);

  const lenis = getLenis();
  const lenisScrollHandler = (e: any) => {
    updateNavbar(e.scroll, e.direction);
  };

  const windowScrollHandler = () => {
    updateNavbar(window.scrollY);
  };

  if (lenis) {
    lenis.on('scroll', lenisScrollHandler);
  } else {
    window.addEventListener('scroll', windowScrollHandler, { passive: true });
  }

  return {
    destroy: () => {
      mobileBtn?.removeEventListener('click', toggleMobileMenu);
      mobileLinks.forEach((link) => link.removeEventListener('click', closeMobile));
      cartBtn?.removeEventListener('click', handleCartClick);
      window.removeEventListener('scroll', windowScrollHandler);
      if (lenis) {
        lenis.off('scroll', lenisScrollHandler);
      }
    },
  };
}
