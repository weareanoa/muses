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
  const desktopNavLinks = document.querySelectorAll<HTMLAnchorElement>('[data-nav-desktop]');
  const mobileNavLinks = document.querySelectorAll<HTMLAnchorElement>('[data-nav-mobile]');
  const cartBtn = document.getElementById('nav-cart-btn');
  const logoLink = header?.querySelector<HTMLAnchorElement>('a[aria-label="MUSES Home"]');

  let isMobileMenuOpen = false;
  let lastScrollY = window.scrollY;
  let isHeaderHidden = false;
  let currentActiveId = 'home';
  let isManualScrolling = false;
  let manualScrollTimer: any = null;

  function setActiveNavItem(id: string) {
    if (currentActiveId === id) return;
    currentActiveId = id;

    desktopNavLinks.forEach((link) => {
      const isActive = link.getAttribute('data-nav-id') === id;
      if (isActive) {
        link.classList.add(
          'bg-gradient-to-r',
          'from-[#C28C1D]',
          'via-[#DBA736]',
          'to-[#A37418]',
          'text-[#1F1A12]',
          'shadow-xs'
        );
        link.classList.remove('hover:bg-[#C9971C]/10', 'text-[#524838]');
      } else {
        link.classList.remove(
          'bg-gradient-to-r',
          'from-[#C28C1D]',
          'via-[#DBA736]',
          'to-[#A37418]',
          'text-[#1F1A12]',
          'shadow-xs'
        );
        link.classList.add('hover:bg-[#C9971C]/10', 'text-[#524838]');
      }
    });

    mobileNavLinks.forEach((link) => {
      const isActive = link.getAttribute('data-nav-id') === id;
      if (isActive) {
        link.classList.add(
          'bg-gradient-to-r',
          'from-[#C28C1D]',
          'via-[#DBA736]',
          'to-[#A37418]',
          'text-[#1F1A12]',
          'font-semibold'
        );
        link.classList.remove('hover:bg-[#C9971C]/10', 'text-[#4B4335]');
      } else {
        link.classList.remove(
          'bg-gradient-to-r',
          'from-[#C28C1D]',
          'via-[#DBA736]',
          'to-[#A37418]',
          'text-[#1F1A12]',
          'font-semibold'
        );
        link.classList.add('hover:bg-[#C9971C]/10', 'text-[#4B4335]');
      }
    });
  }

  function calculateActiveSection() {
    if (isManualScrolling) return;

    const hero = document.getElementById('hero-scroll-container');
    const disco = document.getElementById('discography');
    const sched = document.getElementById('schedule');
    const gall = document.getElementById('gallery');
    const store = document.getElementById('store');
    const contact = document.getElementById('kontak');

    if (!disco && !store) {
      return;
    }

    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (windowHeight + scrollY >= docHeight - 80) {
      setActiveNavItem('kontak');
      return;
    }

    const offsetCheck = scrollY + 220;

    if (contact && offsetCheck >= contact.offsetTop) {
      setActiveNavItem('kontak');
    } else if (store && offsetCheck >= store.offsetTop) {
      setActiveNavItem('store');
    } else if (gall && offsetCheck >= gall.offsetTop) {
      setActiveNavItem('gallery');
    } else if (sched && offsetCheck >= sched.offsetTop) {
      setActiveNavItem('schedule');
    } else if (disco && offsetCheck >= disco.offsetTop) {
      setActiveNavItem('discography');
    } else {
      const heroTop = hero ? hero.offsetTop : 0;
      if (scrollY >= heroTop + 450) {
        setActiveNavItem('member');
      } else {
        setActiveNavItem('home');
      }
    }
  }

  function scrollToSection(id: string) {
    const hero = document.getElementById('hero-scroll-container');
    const heroTop = hero ? hero.offsetTop : 0;
    let targetY = 0;

    if (id === 'home') {
      targetY = 0;
    } else if (id === 'member') {
      targetY = heroTop + 700;
    } else {
      const el = document.getElementById(id);
      if (el) {
        targetY = Math.max(0, el.offsetTop - 70);
      }
    }

    isManualScrolling = true;
    setActiveNavItem(id);
    if (manualScrollTimer) clearTimeout(manualScrollTimer);
    manualScrollTimer = setTimeout(() => {
      isManualScrolling = false;
      calculateActiveSection();
    }, 1200);

    if (header && isHeaderHidden) {
      header.classList.remove('navbar-hidden');
      header.classList.add('navbar-visible');
      header.style.transform = 'translateY(0)';
      isHeaderHidden = false;
    }

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(targetY, { duration: 1.1 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }

  function updateNavbar(scrollY: number, forceDirection?: number) {
    calculateActiveSection();

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

    if (direction === 1 && !isHeaderHidden && !isManualScrolling) {
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

  const allNavLinks = [...desktopNavLinks, ...mobileNavLinks];
  const handleLinkClick = (e: MouseEvent) => {
    const link = e.currentTarget as HTMLAnchorElement;
    const navId = link.getAttribute('data-nav-id');
    if (!navId) return;

    const hasSections = !!(document.getElementById('store') || document.getElementById('discography'));
    if (hasSections) {
      e.preventDefault();
      scrollToSection(navId);
      history.pushState(null, '', '#' + navId);
      closeMobile();
    }
  };

  allNavLinks.forEach((link) => link.addEventListener('click', handleLinkClick));

  const handleLogoClick = (e: MouseEvent) => {
    const hasSections = !!(document.getElementById('store') || document.getElementById('discography'));
    if (hasSections) {
      e.preventDefault();
      scrollToSection('home');
      history.pushState(null, '', '#home');
      closeMobile();
    }
  };

  logoLink?.addEventListener('click', handleLogoClick);

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

  const handleInitialHash = () => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && (document.getElementById(hash) || hash === 'member' || hash === 'home')) {
      setTimeout(() => {
        scrollToSection(hash);
      }, 250);
    } else {
      calculateActiveSection();
    }
  };

  window.addEventListener('muses-preloader-done', handleInitialHash);
  if (!document.getElementById('muses-preloader')) {
    handleInitialHash();
  }

  return {
    destroy: () => {
      mobileBtn?.removeEventListener('click', toggleMobileMenu);
      allNavLinks.forEach((link) => link.removeEventListener('click', handleLinkClick));
      logoLink?.removeEventListener('click', handleLogoClick);
      cartBtn?.removeEventListener('click', handleCartClick);
      window.removeEventListener('scroll', windowScrollHandler);
      window.removeEventListener('muses-preloader-done', handleInitialHash);
      if (manualScrollTimer) clearTimeout(manualScrollTimer);
      if (lenis) {
        lenis.off('scroll', lenisScrollHandler);
      }
    },
  };
}
