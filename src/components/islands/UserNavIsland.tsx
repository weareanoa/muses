import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { currentUser, logoutUser } from '../../stores/authStore';
import { User, LogOut, Sparkles, ExternalLink, ShieldCheck, MapPin } from 'lucide-react';
import { withBase } from '../../lib/paths';

export default function UserNavIsland() {
  const user = useStore(currentUser);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!user) {
    return (
      <a
        href={withBase("/auth")}
        className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/35 text-[#1F1A12] text-xs font-semibold tracking-wider transition-all duration-200 group cursor-pointer"
        aria-label="Masuk ke Akun"
      >
        <User className="w-4 h-4 text-[#8C6A1C] group-hover:text-[#C9971C] transition-colors" />
        <span className="hidden sm:inline font-medium text-xs">Akun</span>
      </a>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 p-1 pl-2.5 pr-2 rounded-full bg-[#FCFAF5] hover:bg-[#C9971C]/15 border border-[#C9971C]/35 transition-all cursor-pointer group"
        aria-label="User Account Menu"
      >
        <span className="text-xs font-semibold text-[#1F1A12] hidden sm:inline max-w-[90px] truncate">
          {user.name.split(' ')[0]}
        </span>
        <div className="w-6 h-6 rounded-full gold-gradient-bg flex items-center justify-center text-[10px] font-bold text-[#1F1A12] shadow-[0_0_8px_rgba(201,151,28,0.4)]">
          {(user.name || 'M').charAt(0).toUpperCase()}
        </div>
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-[#C9971C]/30 shadow-[0_15px_40px_rgba(90,70,30,0.18)] p-3 text-left z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 pb-3 border-b border-[#1F1A12]/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#C9971C] font-bold">
                MUSES CIRCLE
              </span>
              <span className="text-[10px] font-mono text-[#6E6453]">
                {user.membershipNumber || 'MEMBER'}
              </span>
            </div>
            <div className="text-sm font-bold text-[#1F1A12] truncate">{user.name}</div>
            <div className="text-xs text-[#6E6453] font-mono truncate">{user.email}</div>
          </div>

          <div className="py-2 space-y-1">
            <a
              href={withBase("/profile")}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#C9971C]/10 text-xs text-[#1F1A12] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C9971C]" />
                <span>Profil & Membership Pass</span>
              </div>
            </a>
            <a
              href={withBase("/checkout")}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#C9971C]/10 text-xs text-[#1F1A12] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9971C]" />
                <span>History Pesanan</span>
              </div>
            </a>
            <a
              href={withBase("/store")}
              onClick={() => setDropdownOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#C9971C]/10 text-xs text-[#1F1A12] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C9971C]" />
                <span>Official Merch Store</span>
              </div>
              <ExternalLink className="w-3 h-3 text-[#8A7F6C]" />
            </a>
          </div>

          <div className="pt-2 border-t border-[#1F1A12]/10">
            <button
              onClick={() => {
                logoutUser();
                setDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-xs text-[#6E6453] hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar (Sign Out)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
