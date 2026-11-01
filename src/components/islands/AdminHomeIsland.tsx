import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { scheduleService } from '../../services/scheduleService';
import { fmt, getDict, type Locale, DATE_LOCALE } from '../../i18n/dictionary';
import AdminShell from '../admin/AdminShell';
import type { ScheduleDTO } from '../../types/database';
import {
  CalendarDays,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Plus,
  ExternalLink,
  MapPin,
  Clock,
  Package,
  Layers,
  ChevronRight,
  AlertTriangle,
  Lock,
} from 'lucide-react';

type GateState = 'checking' | 'no-supabase' | 'login-required' | 'forbidden' | 'ready';

interface ProductSummary {
  id: string;
  name: string;
  category: string;
  catalog_type?: string;
  price: number;
  stock?: number;
  is_featured?: boolean;
}

export default function AdminHomeIsland({ locale }: { locale: Locale }) {
  const d = getDict(locale).admin;
  const [gate, setGate] = useState<GateState>('checking');
  const [adminEmail, setAdminEmail] = useState('');
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setGate('no-supabase');
      return;
    }
    authService
      .getSupabaseAdminProfile()
      .then(async (result) => {
        if (!result.isLoggedIn) {
          setGate('login-required');
          return;
        }
        if (!result.isAdmin) {
          setAdminEmail(result.user?.email || '');
          setGate('forbidden');
          return;
        }
        setAdminEmail(result.user?.email || '');
        setGate('ready');

        // Fetch dashboard overview metrics
        setLoadingData(true);
        try {
          const schedRes = await scheduleService.getSchedules();
          if (schedRes.success && schedRes.data) {
            setSchedules(schedRes.data);
          }
        } catch {
          // keep fallback
        }

        try {
          const sb = getSupabaseClient();
          if (sb) {
            const { data } = await sb.from('products').select('*');
            if (data) {
              setProducts(data);
            }
          }
        } catch {
          // ignore
        }
        setLoadingData(false);
      })
      .catch(() => {
        setGate('login-required');
      });
  }, []);

  const handleSignOut = async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    window.location.href = withBase('/admin/login');
  };

  const accountSubject = adminEmail
    ? locale === 'id'
      ? `Akun ${adminEmail}`
      : `Account ${adminEmail}`
    : locale === 'id'
      ? 'Akun ini'
      : 'This account';

  if (gate === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-[#E9D9AE] bg-white p-8 text-center shadow-xs max-w-sm w-full">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DB] to-[#F5E2B5] border border-[#E9D9AE]">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#C9971C] border-t-transparent" />
          </div>
          <div>
            <p className="font-semibold text-[#1F1A12]">{d.checking}</p>
            <p className="text-xs text-[#6E6453] mt-1">
              {locale === 'id'
                ? 'Memvalidasi kredensial dan hak akses pengelola...'
                : 'Validating manager credentials and permissions...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (gate === 'no-supabase') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#E9D9AE] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1F1A12]">{d.noSupabaseTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
            {d.homeNoSupabaseBody}
          </p>
          <div className="mt-6 flex justify-center">
            <a
              href={withBase('/')}
              className="rounded-full border border-[#E9D9AE] px-6 py-2.5 text-sm font-semibold text-[#8C6A1C] hover:border-[#C9971C] hover:bg-[#FFF9EC]"
            >
              {d.backHome}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (gate === 'login-required') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#E9D9AE] bg-white p-8 sm:p-10 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF5DC] to-[#F7E5BD] border border-[#E9D9AE] text-[#8C6A1C] shadow-2xs">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-bold tracking-tight text-[#1F1A12]">
            {d.loginRequiredTitleHome}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
            {d.loginRequiredBody}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <a
              href={withBase('/admin/login')}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#C9971C] via-[#D8A730] to-[#B38317] px-6 py-3 text-sm font-bold text-white shadow-xs hover:brightness-105 transition-all"
            >
              {d.loginButton}
            </a>
            <a
              href={withBase('/')}
              className="text-xs font-semibold text-[#8C6A1C] hover:underline"
            >
              {d.backHome}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (gate === 'forbidden') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-[#E9D9AE] bg-white p-8 sm:p-10 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700 border border-red-200">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-[#1F1A12]">{d.forbiddenTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
            {fmt(d.homeForbiddenBody, { account: accountSubject })}
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full bg-[#C9971C] px-6 py-3 text-sm font-bold text-white hover:bg-[#A37418] transition-colors"
            >
              {d.signOutButton}
            </button>
            <a
              href={withBase('/')}
              className="text-xs font-semibold text-[#8C6A1C] hover:underline"
            >
              {d.backHome}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalSchedules = schedules.length;
  const availableSchedules = schedules.filter((s) => s.status === 'Available').length;
  const sellingFastSchedules = schedules.filter((s) => s.status === 'Selling Fast').length;

  const totalProducts = products.length;
  const featuredProducts = products.filter((p) => p.is_featured).length;
  const chekiCount = products.filter(
    (p) => (p.catalog_type || p.category || '').toUpperCase() === 'CHEKI',
  ).length;
  const merchCount = products.filter(
    (p) => (p.catalog_type || p.category || '').toUpperCase() === 'MERCHANDISE',
  ).length;
  const vcCount = products.filter(
    (p) => (p.catalog_type || p.category || '').toUpperCase() === 'VIDEOCALL',
  ).length;

  // Upcoming top schedules (up to 4)
  const upcomingSchedules = schedules.slice(0, 4);

  return (
    <AdminShell
      currentTab="overview"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={handleSignOut}
      title={locale === 'id' ? 'Dashboard Ringkasan' : 'Dashboard Overview'}
      subtitle={d.landingIntro}
      actions={
        <div className="flex items-center gap-2">
          <a
            href={withBase('/admin/schedules')}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E9D9AE] bg-white px-3.5 py-2 text-xs font-bold text-[#8C6A1C] hover:border-[#C9971C] hover:bg-[#FFF9EC] transition-all shadow-2xs"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{locale === 'id' ? 'Jadwal Tur' : 'Schedules'}</span>
          </a>
          <a
            href={withBase('/admin/store')}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#C9971C] to-[#B38317] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 transition-all"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>{locale === 'id' ? 'Kelola Store' : 'Manage Store'}</span>
          </a>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Top KPI Metric Cards (Reference style) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Schedules */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#EADCB9] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#C9971C]/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-[#8C6A1C]">
                {locale === 'id' ? 'Total Jadwal' : 'Total Shows'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF6DE] text-[#8C6A1C] border border-[#E9D9AE]">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-[#1F1A12]">
                {loadingData ? '...' : totalSchedules}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
                  {availableSchedules} {locale === 'id' ? 'Tersedia' : 'Available'}
                </span>
                {sellingFastSchedules > 0 && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200/60">
                    {sellingFastSchedules} Fast
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Store Products */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#EADCB9] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#C9971C]/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-[#8C6A1C]">
                {locale === 'id' ? 'Katalog Store' : 'Store Catalog'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF6DE] text-[#8C6A1C] border border-[#E9D9AE]">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold tracking-tight text-[#1F1A12]">
                {loadingData ? '...' : totalProducts}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-[#6E6453]">
                <span className="font-semibold text-[#1F1A12]">{featuredProducts}</span>{' '}
                {locale === 'id' ? 'unggulan' : 'featured'}
                {totalProducts === 0 && (
                  <span className="text-[11px] text-amber-800 font-medium">
                    (default code)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Database & Security Status */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#EADCB9] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#C9971C]/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-[#8C6A1C]">
                {locale === 'id' ? 'Status Database' : 'Database Status'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold tracking-tight text-[#1F1A12]">
                Cloud Live
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Supabase RLS Enforced</span>
              </div>
            </div>
          </div>

          {/* Card 4: Access Level */}
          <div className="group relative overflow-hidden rounded-3xl border border-[#EADCB9] bg-white p-5 shadow-xs transition-all duration-300 hover:border-[#C9971C]/50 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-[#8C6A1C]">
                {locale === 'id' ? 'Hak Akses' : 'Access Level'}
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF6DE] text-[#8C6A1C] border border-[#E9D9AE]">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold tracking-tight text-[#1F1A12]">
                Super Admin
              </div>
              <p className="mt-1 truncate text-xs text-[#6E6453]">
                {adminEmail || 'Verified Session'}
              </p>
            </div>
          </div>
        </div>

        {/* Two Feature Overview Cards (Split Grid) */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Card 1: Jadwal Tur Overview */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#EADCB9] bg-white p-6 sm:p-7 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-[#EADCB9]/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DB] to-[#F5E2B5] text-[#8C6A1C] border border-[#E9D9AE]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1F1A12] leading-tight">
                      {d.schedCardTitle}
                    </h2>
                    <p className="text-xs text-[#6E6453]">
                      {locale === 'id'
                        ? 'Jadwal konser dan penampilan live MUSES'
                        : 'Concerts and live performances'}
                    </p>
                  </div>
                </div>
                <a
                  href={withBase('/admin/schedules')}
                  className="rounded-full bg-[#FCFAF5] border border-[#E9D9AE] px-3.5 py-1.5 text-xs font-bold text-[#8C6A1C] hover:border-[#C9971C] hover:bg-[#FFF9EC] transition-colors"
                >
                  {d.schedCardButton} →
                </a>
              </div>

              {/* Schedule Preview List */}
              <div className="mt-4 space-y-2.5">
                {upcomingSchedules.length > 0 ? (
                  upcomingSchedules.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-[#E9D9AE]/60 bg-[#FCFAF5] p-3 transition-colors hover:border-[#C9971C]/50"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="truncate text-sm font-bold text-[#1F1A12]">
                          {item.tourName} · {item.city}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#6E6453]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#8C6A1C]" />
                            {item.venue}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#8C6A1C]" />
                            {item.showTime}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          item.status === 'Available'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : item.status === 'Selling Fast'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : item.status === 'Sold Out'
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#E9D9AE] p-6 text-center text-xs text-[#6E6453]">
                    {locale === 'id'
                      ? 'Belum ada jadwal yang tampil.'
                      : 'No tour schedules listed yet.'}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EADCB9]/60 flex items-center justify-between">
              <span className="text-xs text-[#6E6453]">
                {totalSchedules}{' '}
                {locale === 'id' ? 'jadwal terdaftar' : 'total events listed'}
              </span>
              <a
                href={withBase('/admin/schedules')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6A1C] hover:text-[#1F1A12] transition-colors"
              >
                <span>{locale === 'id' ? 'Buka Ruang Jadwal' : 'Go to Schedules'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Store Catalog Overview */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#EADCB9] bg-white p-6 sm:p-7 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-[#EADCB9]/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF4DB] to-[#F5E2B5] text-[#8C6A1C] border border-[#E9D9AE]">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1F1A12] leading-tight">
                      {d.storeCardTitle}
                    </h2>
                    <p className="text-xs text-[#6E6453]">
                      {locale === 'id'
                        ? 'Cheki, merchandise resmi, dan tiket videocall'
                        : 'Cheki, official merch, and videocall tickets'}
                    </p>
                  </div>
                </div>
                <a
                  href={withBase('/admin/store')}
                  className="rounded-full bg-[#FCFAF5] border border-[#E9D9AE] px-3.5 py-1.5 text-xs font-bold text-[#8C6A1C] hover:border-[#C9971C] hover:bg-[#FFF9EC] transition-colors"
                >
                  {d.storeCardButton} →
                </a>
              </div>

              {/* Category Pills & Breakdown */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-[#E9D9AE]/80 bg-[#FCFAF5] p-3 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">
                    Cheki
                  </span>
                  <div className="mt-1 text-xl font-extrabold text-[#1F1A12]">
                    {chekiCount}
                  </div>
                  <span className="text-[10px] text-[#6E6453]">
                    {locale === 'id' ? 'item terdaftar' : 'items'}
                  </span>
                </div>
                <div className="rounded-2xl border border-[#E9D9AE]/80 bg-[#FCFAF5] p-3 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">
                    Merch
                  </span>
                  <div className="mt-1 text-xl font-extrabold text-[#1F1A12]">
                    {merchCount}
                  </div>
                  <span className="text-[10px] text-[#6E6453]">
                    {locale === 'id' ? 'item terdaftar' : 'items'}
                  </span>
                </div>
                <div className="rounded-2xl border border-[#E9D9AE]/80 bg-[#FCFAF5] p-3 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6A1C]">
                    Videocall
                  </span>
                  <div className="mt-1 text-xl font-extrabold text-[#1F1A12]">
                    {vcCount}
                  </div>
                  <span className="text-[10px] text-[#6E6453]">
                    {locale === 'id' ? 'item terdaftar' : 'items'}
                  </span>
                </div>
              </div>

              {/* Notice or status */}
              <div className="mt-4 rounded-2xl border border-[#E9D9AE]/60 bg-[#FFFBF2] p-4 text-xs text-[#6E6453]">
                <p className="font-semibold text-[#1F1A12]">
                  {totalProducts === 0
                    ? locale === 'id'
                      ? 'Status Katalog: Menggunakan Data Default Kode'
                      : 'Catalog Status: Using Built-in Code'
                    : locale === 'id'
                      ? `Status Katalog: ${totalProducts} Produk Aktif di Supabase`
                      : `Catalog Status: ${totalProducts} Products Active in Database`}
                </p>
                <p className="mt-1 leading-relaxed">
                  {totalProducts === 0
                    ? d.warningBody
                    : locale === 'id'
                      ? 'Produk yang ada di database mengontrol penuh katalog yang tampil kepada pengunjung di halaman Store.'
                      : 'Database products have full authority over what visitors see on the public Store page.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EADCB9]/60 flex items-center justify-between">
              <span className="text-xs text-[#6E6453]">
                {featuredProducts}{' '}
                {locale === 'id' ? 'produk sorotan unggulan' : 'featured highlight items'}
              </span>
              <a
                href={withBase('/admin/store')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6A1C] hover:text-[#1F1A12] transition-colors"
              >
                <span>{locale === 'id' ? 'Buka Ruang Store' : 'Go to Store'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Operational Guidance Card (Styled like Pro Banner in reference) */}
        <div className="relative overflow-hidden rounded-3xl border border-[#E9D9AE] bg-gradient-to-r from-[#FFFBF2] via-[#FDF8EB] to-[#F5EBCB] p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#8C6A1C] border border-[#E9D9AE] shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-[#C9971C]" />
                <span>MUSES Management System</span>
              </div>
              <h3 className="mt-3 text-xl font-bold text-[#1F1A12]">
                {locale === 'id'
                  ? 'Sistem Sinkronisasi Instan & Keamanan RLS'
                  : 'Instant Sync & Row Level Security'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
                {locale === 'id'
                  ? 'Setiap penambahan atau perubahan jadwal dan produk langsung diamankan dengan kebijakan database RLS (Row Level Security). Hanya akun pengelola terverifikasi yang dapat mengubah data publik.'
                  : 'All schedule and product updates are immediately secured with PostgreSQL Row Level Security. Only verified admin accounts can mutate live public data.'}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a
                href={withBase('/admin/schedules')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#C9971C] via-[#D8A730] to-[#B38317] px-5 py-2.5 text-sm font-bold text-white shadow-xs hover:brightness-105 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>{d.addSchedButton}</span>
              </a>
              <a
                href={withBase('/admin/store')}
                className="inline-flex items-center gap-2 rounded-full border border-[#C9971C] bg-white px-5 py-2.5 text-sm font-bold text-[#8C6A1C] hover:bg-[#FFF9EC] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>{d.addProductButton}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
