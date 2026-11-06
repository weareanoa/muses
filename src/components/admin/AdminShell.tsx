import React, { useState } from 'react';
import { withBase } from '../../lib/paths';
import type { Locale } from '../../i18n/dictionary';
import { getDict } from '../../i18n/dictionary';
import {
  LayoutDashboard,
  ShoppingBag,
  CalendarDays,
  Package,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface AdminShellProps {
  currentTab?: 'overview' | 'orders' | 'schedules' | 'store' | 'settings';
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
  const d = getDict(locale).admin;
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNavItems = [
    {
      id: 'overview',
      label: d.nav.overview,
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      id: 'orders',
      label: d.nav.orders,
      href: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      id: 'schedules',
      label: d.nav.schedules,
      href: '/admin/schedules',
      icon: CalendarDays,
    },
    {
      id: 'store',
      label: d.nav.store,
      href: '/admin/store',
      icon: Package,
    },
  ];

  const systemNavItems = [
    {
      id: 'settings',
      label: d.nav.settings,
      href: '/admin/settings',
      icon: Settings,
    },
  ];

  const renderNavLinks = () => (
    <div className="space-y-6">
      <div>
        <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          {d.nav.mainMenu}
        </div>
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const active = currentTab === item.id;
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={withBase(item.href)}
                data-astro-prefetch="hover"
                className={cn(
                  'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  active
                    ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
              </a>
            );
          })}
        </nav>
      </div>

      <div>
        <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
          {d.nav.systemMenu}
        </div>
        <nav className="space-y-1">
          {systemNavItems.map((item) => {
            const active = currentTab === item.id;
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={withBase(item.href)}
                data-astro-prefetch="hover"
                className={cn(
                  'group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all',
                  active
                    ? 'bg-zinc-900 text-white font-semibold shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      active ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-700'
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0" />}
              </a>
            );
          })}

          <a
            href={withBase('/')}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-700" />
              <span className="truncate">{d.nav.viewSite}</span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
          </a>
        </nav>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-['Poppins',sans-serif] text-zinc-900 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-zinc-200/80 px-4 py-3 flex items-center justify-between">
        <a href={withBase('/admin')} className="flex items-center gap-2">
          <picture className="flex items-center">
            <source media="(max-width: 639px)" srcSet={withBase('/images/muses_logo_3d_clean_mobile.webp')} type="image/webp" />
            <img src={withBase('/images/muses_logo_3d_clean.webp')} alt="MUSES" className="h-7 w-auto object-contain" />
          </picture>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-700">
            Admin
          </span>
        </a>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation"
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/20 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-zinc-200/80 flex flex-col justify-between transition-transform duration-200 ease-out md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="p-5 overflow-y-auto">
          {/* Brand header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100">
            <a href={withBase('/admin')} className="flex items-center gap-2.5">
              <picture className="flex items-center">
                <source media="(max-width: 639px)" srcSet={withBase('/images/muses_logo_3d_clean_mobile.webp')} type="image/webp" />
                <img
                  src={withBase('/images/muses_logo_3d_clean.webp')}
                  alt="MUSES"
                  className="h-8 w-auto object-contain"
                />
              </picture>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-zinc-900 leading-none">MUSES</span>
                <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase leading-tight mt-0.5">
                  Admin Portal
                </span>
              </div>
            </a>
            {mobileOpen && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {renderNavLinks()}
        </div>

        {/* Sidebar Footer / User Account widget */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white shadow-2xs">
                {adminEmail ? adminEmail.charAt(0).toUpperCase() : <Shield className="h-3.5 w-3.5 text-zinc-300" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-zinc-900 leading-tight">
                  {adminEmail ? adminEmail.split('@')[0] : 'Administrator'}
                </p>
                <p className="truncate text-[10px] text-zinc-400 font-mono leading-tight mt-0.5">
                  {adminEmail || 'admin-session'}
                </p>
              </div>
            </div>

            {onSignOut && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                title={d.nav.signOut}
                aria-label={d.nav.signOut}
                className="h-8 w-8 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen bg-white">
        {/* Top Desktop Bar */}
        <header className="hidden md:flex sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 px-8 items-center justify-between">
          <div>
            {title && (
              <h1 className="text-base font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <span>{title}</span>
              </h1>
            )}
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {actions && <div className="flex items-center gap-2">{actions}</div>}
            <div className="h-4 w-px bg-zinc-200" />
            <a
              href={withBase('/')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <span>{d.nav.viewSite}</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
            </a>
          </div>
        </header>

        {/* Mobile Page Header (when title exists) */}
        {(title || actions) && (
          <div className="md:hidden px-4 pt-6 pb-2 flex flex-col gap-3">
            {title && <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h1>}
            {subtitle && <p className="text-xs text-zinc-500 -mt-1">{subtitle}</p>}
            {actions && <div className="flex items-center gap-2 pt-1">{actions}</div>}
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
