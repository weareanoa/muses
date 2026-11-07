import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { currentUser, logoutUser } from '../../stores/authStore';
import { totalCartCount, openCart } from '../../stores/cartStore';
import {
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Sparkles,
  ExternalLink,
  MapPin,
  Package,
  Store as StoreIcon,
  CalendarClock,
  ShoppingBag,
} from 'lucide-react';
import { withBase } from '../../lib/paths';
import LanguageSwitcher from './LanguageSwitcher';
import { getDict, type Locale } from '../../i18n/dictionary';

export default function UserNavIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale);
  const user = useStore(currentUser);
  const cartCount = useStore(totalCartCount);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [dropdownOpen]);

  // Dynamic user display name from auth store (never hardcoded)
  const displayName = useMemo(() => {
    if (!user) return 'masuk';
    const raw =
      user.username?.trim() ||
      user.name?.trim() ||
      (user.email ? user.email.split('@')[0] : 'member');
    return raw.toLowerCase();
  }, [user]);

  const menuLinkClass =
    'flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#C9971C]/10 text-xs text-[#1F1A12] transition-colors';

  const cartCountDisplay = mounted ? cartCount : 0;

  return (
    <div className="flex items-center gap-2 sm:gap-2.5">
      {/* Shopping Cart button with circular amber badge */}
      <button
        type="button"
        onClick={() => openCart()}
        className="relative p-2 -m-1 text-[#1F1A12] hover:text-[#C9971C] transition-colors cursor-pointer flex items-center justify-center group focus:outline-none"
        aria-label={d.nav.cartAria}
      >
        <ShoppingCart
          className="w-4.5 h-4.5 text-[#1F1A12] group-hover:text-[#C9971C] transition-colors"
          strokeWidth={1.8}
        />
        <span
          className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#DEB74E] text-[#1F1A12] text-[9.5px] font-bold flex items-center justify-center leading-none shadow-[0_1px_2px_rgba(0,0,0,0.12)] tabular-nums pointer-events-none"
        >
          {cartCountDisplay}
        </span>
      </button>

      <LanguageSwitcher locale={locale} />

      {/* Thin vertical separator line */}
      <span className="h-4 w-px bg-[#1F1A12]/20" aria-hidden="true" />

      {/* User profile / login section */}
      {!mounted || !user ? (
        <a
          href={withBase('/auth')}
          className="flex items-center gap-1.5 p-2 -m-1 sm:m-0 sm:py-1 sm:px-1 rounded-md text-[#1F1A12] hover:text-[#C9971C] transition-colors cursor-pointer group focus:outline-none"
          aria-label={d.nav.signInAria}
        >
          <UserIcon
            className="w-4.5 h-4.5 text-[#1F1A12] group-hover:text-[#C9971C] transition-colors"
            strokeWidth={1.8}
          />
          <span className="hidden sm:inline text-sm font-medium text-[#1F1A12] group-hover:text-[#C9971C] transition-colors lowercase tracking-normal">
            {d.nav.signIn}
          </span>
        </a>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 p-2 -m-1 sm:m-0 sm:py-1 sm:px-1 rounded-md text-[#1F1A12] hover:text-[#C9971C] transition-colors cursor-pointer group focus:outline-none"
            aria-label={`${d.nav.accountMenuAria} ${displayName}`}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
          >
            <UserIcon
              className="w-4.5 h-4.5 text-[#1F1A12] group-hover:text-[#C9971C] transition-colors"
              strokeWidth={1.8}
            />
            <span className="hidden sm:inline text-sm font-medium text-[#1F1A12] group-hover:text-[#C9971C] transition-colors max-w-[110px] sm:max-w-[140px] truncate lowercase tracking-normal">
              {displayName}
            </span>
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="menu-in absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)]rounded-2xl bg-white/95 backdrop-blur-2xl border border-[#C9971C]/30 shadow-[0_6px_16px_rgba(90,70,30,0.08),0_20px_48px_rgba(90,70,30,0.18)] p-3 text-left z-50"
            >
              <div className="p-3 mb-1 rounded-xl bg-[#FAF6EE]/80 border border-[#EADBBD]/70">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[#1F1A12] truncate leading-tight">
                    {user.name}
                  </div>
                  {user.role === 'admin' && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-[#EADBBD] text-[#7A5B10] shadow-2xs shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B8860B]" />
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#7A6D56] truncate mt-0.5">
                  {user.email}
                </div>
              </div>

              <div className="py-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    openCart();
                  }}
                  className={`${menuLinkClass} w-full text-left cursor-pointer`}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#C9971C]" />
                    <span>{d.nav.cart}</span>
                  </span>
                  {cartCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#1F1A12] text-[#FFF8E7] text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {cartCount}
                    </span>
                  )}
                </button>
                <a
                  href={withBase('/profile?tab=profile')}
                  onClick={() => setDropdownOpen(false)}
                  className={menuLinkClass}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#C9971C]" />
                    <span>{d.nav.myProfile}</span>
                  </span>
                </a>
                <a
                  href={withBase('/profile?tab=alamat')}
                  onClick={() => setDropdownOpen(false)}
                  className={menuLinkClass}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#C9971C]" />
                    <span>{d.nav.myAddresses}</span>
                  </span>
                </a>
                <a
                  href={withBase('/profile?tab=orders')}
                  onClick={() => setDropdownOpen(false)}
                  className={menuLinkClass}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C9971C]" />
                    <span>{d.nav.myOrders}</span>
                  </span>
                </a>
                <a
                  href={withBase('/store')}
                  onClick={() => setDropdownOpen(false)}
                  className={menuLinkClass}
                  role="menuitem"
                >
                  <span className="flex items-center gap-2">
                    <StoreIcon className="w-4 h-4 text-[#C9971C]" />
                    <span>{d.nav.merchStore}</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#8A7F6C]" />
                </a>
                {user.role === 'admin' && (
                  <a
                    href={withBase('/admin/schedules')}
                    onClick={() => setDropdownOpen(false)}
                    className={`${menuLinkClass} border border-dashed border-[#C9971C]/40`}
                    role="menuitem"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-[#8C6A1C]" />
                      <span>{d.nav.adminSchedule}</span>
                    </span>
                  </a>
                )}
              </div>

              <div className="pt-2 border-t border-[#1F1A12]/10">
                <button
                  type="button"
                  onClick={() => {
                    logoutUser(true);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-xs text-[#6E6453] hover:text-red-600 transition-colors cursor-pointer"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{d.nav.signOut}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
