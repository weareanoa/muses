import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { withBase } from '../../lib/paths';
import { getDict, type Locale } from '../../i18n/dictionary';

interface MobileNavDrawerProps {
  locale?: Locale;
  currentPath?: string;
}

export default function MobileNavDrawer({ locale = 'en', currentPath = '/' }: MobileNavDrawerProps) {
  const d = getDict(locale);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Prevent background scrolling while drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Sync hash to activeSection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash) setActiveSection(hash);
  }, [isOpen]);

  const navItems = [
    { id: 'home', num: '01', name: d.nav.home, href: '/#home' },
    { id: 'member', num: '02', name: d.nav.member, href: '/#member' },
    { id: 'discography', num: '03', name: d.nav.discography, href: '/#discography' },
    { id: 'schedule', num: '04', name: d.nav.schedule, href: '/#schedule' },
    { id: 'gallery', num: '05', name: d.nav.gallery, href: '/#gallery' },
    { id: 'store', num: '06', name: d.nav.store, href: '/#store' },
    { id: 'kontak', num: '07', name: d.nav.contact, href: '/#kontak' },
  ];

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string, href: string) => {
      e.preventDefault();
      setIsOpen(false);
      setActiveSection(id);

      const desktopTarget = document.querySelector<HTMLAnchorElement>(
        `a[data-nav-desktop][data-nav-id="${id}"]`
      );

      if (desktopTarget) {
        // Trigger synchronized smooth scrolling from navbar.ts
        desktopTarget.click();
      } else {
        // Fallback for subpages (e.g. /orders, /checkout)
        window.location.href = withBase(href);
      }
    },
    []
  );

  return (
    <div className="lg:hidden flex items-center">
      {/* Trigger Button - Clean without rounded badge container */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 -m-1 text-[#1F1A12] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center active:scale-95 focus:outline-hidden"
        aria-label="Buka Menu Navigasi"
        aria-expanded={isOpen}
      >
        <Menu className="w-5 h-5 text-[#1F1A12]" strokeWidth={1.8} />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#1A140B]/40 backdrop-blur-xs transition-opacity duration-300 animate-drawer-fade"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigasi Menu Mobile"
            className="relative w-full max-w-[340px] sm:max-w-xs h-[100dvh] bg-[#FCFAF5] border-l border-[#C9971C]/25 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 transition-transform duration-300 animate-drawer-slide font-['Poppins',sans-serif]"
          >
            {/* Header Drawer */}
            <div>
              <div className="h-16 px-5 border-b border-[#C9971C]/20 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-20">
                <a
                  href={withBase('/')}
                  onClick={(e) => handleNavClick(e, 'home', '/#home')}
                  className="flex items-center gap-2 group"
                >
                  <img
                    src={withBase('/images/muses_logo_3d_clean.webp')}
                    alt="MUSES"
                    className="h-7 w-auto object-contain"
                  />
                  <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#8C6A1C]">
                    OFFICIAL
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 -m-1 text-[#1F1A12] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center active:scale-95 focus:outline-hidden"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5 text-[#1F1A12]" strokeWidth={1.8} />
                </button>
              </div>

              {/* Navigation Menu List */}
              <nav className="p-4 space-y-1.5" aria-label="Menu Utama">
                {navItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <a
                      key={item.id}
                      href={withBase(item.href)}
                      onClick={(e) => handleNavClick(e, item.id, item.href)}
                      data-nav-id={item.id}
                      className={`group flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                        isActive
                          ? 'bg-muses-gradient text-[#1F1A12] shadow-xs'
                          : 'text-[#42392B] hover:bg-[#FAF6EE] hover:text-[#1F1A12]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-mono tracking-normal font-bold ${
                            isActive ? 'text-[#5C430B]' : 'text-[#8C6A1C]/70 group-hover:text-[#8C6A1C]'
                          }`}
                        >
                          {item.num}
                        </span>
                        <span className="text-[13px] tracking-wide">{item.name}</span>
                      </div>

                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${
                          isActive ? 'text-[#1F1A12]' : 'text-[#8C6A1C]/60 group-hover:text-[#1F1A12]'
                        }`}
                      />
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Footer Drawer */}
            <div className="p-5 border-t border-[#C9971C]/20 bg-[#FAF6EE]/60 space-y-3">
              {/* Social Media Links */}
              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com/official.muses"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 -m-1 text-[#6E6453] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Instagram MUSES"
                >
                  <img src={withBase('/icon/Instagram.svg')} alt="" className="w-4.5 h-4.5 object-contain opacity-75 hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://tiktok.com/@muses.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 -m-1 text-[#6E6453] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="TikTok MUSES"
                >
                  <img src={withBase('/icon/TikTok.svg')} alt="" className="w-4.5 h-4.5 object-contain opacity-75 hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://youtube.com/@muses.official"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 -m-1 text-[#6E6453] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="YouTube MUSES"
                >
                  <img src={withBase('/icon/YouTube.svg')} alt="" className="w-4.5 h-4.5 object-contain opacity-75 hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://x.com/muses_ofc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 -m-1 text-[#6E6453] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="X MUSES"
                >
                  <img src={withBase('/icon/X (Twitter).svg')} alt="" className="w-4.5 h-4.5 object-contain opacity-75 hover:opacity-100 transition-opacity" />
                </a>
                <a
                  href="https://open.spotify.com/track/61nWL7aJ1GyNGxi6mhsrYZ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 -m-1 text-[#6E6453] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center"
                  aria-label="Spotify MUSES"
                >
                  <img src={withBase('/icon/Spotify.svg')} alt="" className="w-4.5 h-4.5 object-contain opacity-75 hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <div className="pt-2 border-t border-[#C9971C]/15 text-[10px] text-[#8A7F6C]">
                © {new Date().getFullYear()} MUSES. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
