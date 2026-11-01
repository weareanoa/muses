import React from 'react';
import { withBase } from '../../lib/paths';
import type { Locale } from '../../i18n/dictionary';
import { CalendarDays, ShoppingBag, LogOut, LayoutDashboard, ExternalLink } from 'lucide-react';

interface AdminShellProps {
  currentTab?: string;
  adminEmail?: string;
  locale?: Locale;
  onSignOut?: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function AdminShell({
  currentTab = 'overview',
  adminEmail,
  locale = 'id',
  onSignOut,
  title,
  subtitle,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#FCFAF5] font-['Poppins',sans-serif] text-[#1F1A12]">
      <header className="border-b border-[#E9D9AE] bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href={withBase('/admin')} className="flex items-center gap-2">
              <span className="font-serif italic text-xl font-bold text-[#1F1A12]">MUSES</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF6DE] border border-[#E9D9AE] text-[10px] font-mono font-bold text-[#8C6A1C] uppercase tracking-wider">
                Admin
              </span>
            </a>

            <nav className="hidden md:flex items-center gap-1">
              <a
                href={withBase('/admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'overview'
                    ? 'bg-[#C9971C] text-white shadow-2xs'
                    : 'text-[#6E6453] hover:text-[#1F1A12] hover:bg-[#FAF3E2]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </a>
              <a
                href={withBase('/admin/schedules')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'schedules'
                    ? 'bg-[#C9971C] text-white shadow-2xs'
                    : 'text-[#6E6453] hover:text-[#1F1A12] hover:bg-[#FAF3E2]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{locale === 'id' ? 'Jadwal' : 'Schedules'}</span>
              </a>
              <a
                href={withBase('/admin/store')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  currentTab === 'store'
                    ? 'bg-[#C9971C] text-white shadow-2xs'
                    : 'text-[#6E6453] hover:text-[#1F1A12] hover:bg-[#FAF3E2]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Store</span>
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={withBase('/')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#6E6453] hover:text-[#1F1A12] transition-colors"
            >
              <span>{locale === 'id' ? 'Lihat Web' : 'View Site'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            {adminEmail && (
              <span className="hidden sm:inline-block text-xs font-mono text-[#8C6A1C] bg-[#FFF6DE] px-2.5 py-1 rounded-full border border-[#E9D9AE]">
                {adminEmail}
              </span>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E9D9AE] bg-white text-xs font-bold text-[#6E6453] hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{locale === 'id' ? 'Keluar' : 'Sign Out'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(title || subtitle || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              {title && <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1A12]">{title}</h1>}
              {subtitle && <p className="text-xs sm:text-sm text-[#6E6453] mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
