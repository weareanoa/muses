import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient } from '../../lib/supabase';
import { scheduleService } from '../../services/scheduleService';
import { orderAdminService, type AdminOrderDTO } from '../../services/orderAdminService';
import { formatRupiah } from '../../lib/format';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import {
  AdminButton,
  AdminCard,
  AdminSectionCard,
  AdminStatCard,
  AdminStatusPill,
} from '../admin/ui';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import type { ScheduleDTO } from '../../types/database';
import {
  CalendarDays,
  ShoppingBag,
  ArrowRight,
  Plus,
  MapPin,
  Clock,
  ClipboardList,
  Package,
  Inbox,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface ProductSummary {
  id: string;
  name: string;
  category: string;
  catalog_type?: string;
  price: number;
  stock?: number;
  is_featured?: boolean;
}

let cachedOverviewData: {
  schedules: ScheduleDTO[];
  products: ProductSummary[];
  recentOrders: AdminOrderDTO[];
  pendingVerification: number;
} | null = null;

export default function AdminHomeIsland({ locale }: { locale: Locale }) {
  const d = getDict(locale).admin;
  const h = d.home;
  const { gate, adminEmail, signOut } = useAdminGate();
  const [schedules, setSchedules] = useState<ScheduleDTO[]>(() => cachedOverviewData?.schedules || []);
  const [products, setProducts] = useState<ProductSummary[]>(() => cachedOverviewData?.products || []);
  const [recentOrders, setRecentOrders] = useState<AdminOrderDTO[]>(() => cachedOverviewData?.recentOrders || []);
  const [pendingVerification, setPendingVerification] = useState(() => cachedOverviewData?.pendingVerification || 0);
  const [loadingData, setLoadingData] = useState(() => !cachedOverviewData);

  useEffect(() => {
    if (gate !== 'ready') return;
    let alive = true;
    (async () => {
      const sb = getSupabaseClient();
      if (sb) void sb.rpc('expire_stale_orders');

      const [schedRes, prodRes, ordersRes, pendingRes] = await Promise.allSettled([
        scheduleService.getAdminSchedules(),
        sb ? sb.from('products').select('*') : Promise.resolve({ data: null }),
        orderAdminService.listOrders(6),
        sb
          ? sb
              .from('transactions')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'awaiting_verification')
          : Promise.resolve({ count: 0 }),
      ]);

      if (!alive) return;

      let nextSched = schedules;
      if (schedRes.status === 'fulfilled' && schedRes.value.success && schedRes.value.data) {
        nextSched = schedRes.value.data;
        setSchedules(nextSched);
      }

      let nextProd = products;
      if (prodRes.status === 'fulfilled' && (prodRes.value as any)?.data) {
        nextProd = (prodRes.value as any).data;
        setProducts(nextProd);
      }

      let nextOrders = recentOrders;
      if (ordersRes.status === 'fulfilled' && ordersRes.value.success && ordersRes.value.data) {
        nextOrders = ordersRes.value.data;
        setRecentOrders(nextOrders);
      }

      let nextPending = pendingVerification;
      if (pendingRes.status === 'fulfilled' && typeof (pendingRes.value as any)?.count === 'number') {
        nextPending = (pendingRes.value as any).count;
        setPendingVerification(nextPending);
      }

      setLoadingData(false);

      cachedOverviewData = {
        schedules: nextSched,
        products: nextProd,
        recentOrders: nextOrders,
        pendingVerification: nextPending,
      };
    })();
    return () => {
      alive = false;
    };
  }, [gate]);

  if (gate !== 'ready') {
    return <AdminGateScreen gate={gate} adminEmail={adminEmail} locale={locale} onSignOut={signOut} />;
  }

  const totalSchedules = schedules.length;
  const availableSchedules = schedules.filter((s) => s.status === 'Available').length;
  const sellingFastSchedules = schedules.filter((s) => s.status === 'Selling Fast').length;

  const totalProducts = products.length;
  const featuredProducts = products.filter((p) => p.is_featured).length;
  const catOf = (p: ProductSummary) => (p.catalog_type || p.category || '').toUpperCase();
  const chekiCount = products.filter((p) => catOf(p) === 'CHEKI').length;
  const merchCount = products.filter((p) => catOf(p) === 'MERCHANDISE').length;
  const vcCount = products.filter((p) => catOf(p) === 'VIDEOCALL').length;

  const nextUpcoming = schedules[0];
  const valueOrDots = (v: React.ReactNode) => (loadingData ? '···' : v);

  return (
    <AdminShell
      currentTab="overview"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={signOut}
      title={h.title}
      subtitle={d.landingIntro}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = withBase('/admin/schedules'))}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            <span className="hidden sm:inline">{d.addSchedButton.replace('+ ', '')}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => (window.location.href = withBase('/admin/store'))}
          >
            <ShoppingBag className="h-3.5 w-3.5 mr-1" />
            <span>{h.manageStore}</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top 3 Minimalist KPI Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <AdminStatCard
            label={h.kpiVerify}
            value={valueOrDots(pendingVerification)}
            icon={<ClipboardList className="h-5 w-5" />}
            href={withBase('/admin/orders')}
            badge={
              pendingVerification > 0 ? (
                <Badge variant="warning">{pendingVerification} Butuh Verifikasi</Badge>
              ) : (
                <Badge variant="success">Semua Beres</Badge>
              )
            }
            hint={h.kpiVerifyHint}
          />

          <AdminStatCard
            label={h.kpiSchedules}
            value={valueOrDots(totalSchedules)}
            icon={<CalendarDays className="h-5 w-5" />}
            href={withBase('/admin/schedules')}
            badge={
              <Badge variant="success">
                {`${availableSchedules} ${h.kpiAvailable}`}
              </Badge>
            }
            hint={
              sellingFastSchedules > 0 ? (
                <span className="text-amber-600 font-medium">{`${sellingFastSchedules} ${h.kpiFast}`}</span>
              ) : undefined
            }
          />

          <AdminStatCard
            label={h.kpiCatalog}
            value={valueOrDots(totalProducts)}
            icon={<Package className="h-5 w-5" />}
            href={withBase('/admin/store')}
            badge={
              totalProducts === 0 ? (
                <Badge variant="secondary">Kode Default</Badge>
              ) : (
                <Badge variant="secondary">
                  {featuredProducts} {h.kpiFeatured}
                </Badge>
              )
            }
            hint={totalProducts === 0 ? h.kpiDefaultCode : `${totalProducts} produk`}
          />
        </div>

        {/* 2-Column Minimalist Layout */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          {/* Left Column (8 / 12): Recent Customer Orders Table */}
          <div className="lg:col-span-8 space-y-6">
            <AdminSectionCard
              title={h.recentOrders}
              description={h.recentOrdersSub}
              actions={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = withBase('/admin/orders'))}
                >
                  <span>{h.viewAllOrders}</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              }
            >
              <div className="-mx-5 -my-5">
                {recentOrders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{h.orderCustomer}</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>{h.orderAmount}</TableHead>
                        <TableHead>{h.orderStatus}</TableHead>
                        <TableHead className="text-right">{h.orderAction}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => {
                        const dateStr = order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-';

                        return (
                          <TableRow
                            key={order.id}
                            className="cursor-pointer"
                            onClick={() => (window.location.href = withBase(`/admin/orders`))}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-800 uppercase">
                                  {order.customerName.charAt(0) || 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-zinc-900 truncate max-w-[140px] sm:max-w-[200px]">
                                    {order.customerName}
                                  </p>
                                  <p className="font-mono text-[10px] text-zinc-400 truncate">
                                    {order.orderCode || order.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-zinc-500 text-xs whitespace-nowrap">{dateStr}</TableCell>
                            <TableCell className="font-semibold text-zinc-900 text-xs whitespace-nowrap">
                              {formatRupiah(order.payableAmount || order.totalPrice)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <AdminStatusPill status={order.status} locale={locale} />
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = withBase('/admin/orders');
                                }}
                              >
                                {h.review}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center">
                    <Inbox className="h-6 w-6 text-zinc-300 mx-auto mb-2" />
                    <p className="text-xs text-zinc-500">Belum ada pesanan terbaru.</p>
                  </div>
                )}
              </div>
            </AdminSectionCard>
          </div>

          {/* Right Column (4 / 12): Highlights & Operational Widgets */}
          <div className="lg:col-span-4 space-y-6">
            {/* Next Tour Schedule Card */}
            <AdminCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">
                  Jadwal Tur Terdekat
                </span>
                <a
                  href={withBase('/admin/schedules')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
                >
                  {h.openSchedules}
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>

              {nextUpcoming ? (
                <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900 leading-tight">
                      {nextUpcoming.tourName}
                    </p>
                    <AdminStatusPill status={nextUpcoming.status} locale={locale} />
                  </div>
                  <div className="space-y-1 text-xs text-zinc-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{nextUpcoming.city} · {nextUpcoming.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{nextUpcoming.day} {nextUpcoming.month} {nextUpcoming.year} · {nextUpcoming.showTime}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-400">
                  {h.emptySchedules}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = withBase('/admin/schedules'))}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>{d.addSchedButton.replace('+ ', '')}</span>
              </Button>
            </AdminCard>

            {/* Store Catalog Breakdown */}
            <AdminCard className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900">
                  {h.catalogCardSub}
                </span>
                <a
                  href={withBase('/admin/store')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 transition-colors"
                >
                  {h.openStore}
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Cheki', count: chekiCount },
                  { name: 'Merch', count: merchCount },
                  { name: 'VC', count: vcCount },
                ].map((cat) => (
                  <div
                    key={cat.name}
                    className="flex flex-col items-center justify-center rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-center"
                  >
                    <span className="text-[10px] font-medium text-zinc-500 uppercase">
                      {cat.name}
                    </span>
                    <span className="mt-1 text-lg font-bold text-zinc-900">
                      {loadingData ? '···' : cat.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-zinc-100 bg-zinc-50/40 p-3 text-xs text-zinc-600 leading-relaxed">
                <p className="font-medium text-zinc-800">
                  {totalProducts === 0 ? h.catalogStatusDefault : fmt(h.catalogStatusActive, { count: totalProducts })}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-400">
                  {totalProducts === 0 ? d.warningBody : h.catalogStatusBody}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = withBase('/admin/store'))}
                className="w-full"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <span>{d.addProductButton.replace('+ ', '')}</span>
              </Button>
            </AdminCard>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
