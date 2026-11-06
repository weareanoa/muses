import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { DATE_LOCALE, fmt, getDict, translateServiceError, type Locale } from '../../i18n/dictionary';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import {
  AdminField,
  AdminNotice,
  AdminSectionCard,
  AdminSelect,
  AdminStatusPill,
  ConfirmButton,
  EmptyState,
} from '../admin/ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../ui/table';
import { Plus, Calendar, MapPin, Clock, Edit2, Trash2, Sparkles, X } from 'lucide-react';

const STATUS_OPTIONS = ['Available', 'Selling Fast', 'Sold Out', 'Coming Soon'] as const;

const EMPTY_FORM: ScheduleDTO = {
  id: '',
  tourName: '',
  title: '',
  day: '',
  dayName: '',
  month: '',
  year: '',
  city: '',
  country: 'INDONESIA',
  venue: '',
  status: 'Available',
  doorOpen: '',
  showTime: '',
  ticketUrl: '',
  posterImage: '',
  targetDate: '',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function deriveDateFields(targetDate: string, locale: Locale = 'id'): Partial<ScheduleDTO> {
  if (!targetDate) return {};
  const date = new Date(targetDate);
  if (Number.isNaN(date.getTime())) return {};
  const dayName = new Intl.DateTimeFormat(DATE_LOCALE[locale], { weekday: 'long' })
    .format(date)
    .toUpperCase();
  const month = new Intl.DateTimeFormat(DATE_LOCALE[locale], { month: 'short' })
    .format(date)
    .toUpperCase();
  return {
    day: String(date.getDate()),
    dayName,
    month,
    year: String(date.getFullYear()),
  };
}

function toDatetimeLocal(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function sortByTargetDate(items: ScheduleDTO[]): ScheduleDTO[] {
  return [...items].sort((a, b) => {
    const ta = a.targetDate ? new Date(a.targetDate).getTime() : 0;
    const tb = b.targetDate ? new Date(b.targetDate).getTime() : 0;
    return ta - tb;
  });
}

let cachedSchedules: ScheduleDTO[] | null = null;

export default function AdminScheduleIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).admin;
  const { gate, adminEmail, signOut } = useAdminGate();
  const [schedules, setSchedules] = useState<ScheduleDTO[]>(() => cachedSchedules || []);
  const [loading, setLoading] = useState(() => !cachedSchedules);
  const [form, setForm] = useState<ScheduleDTO>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadSchedules = async () => {
    if (!cachedSchedules) setLoading(true);
    const res = await scheduleService.getAdminSchedules();
    setLoading(false);
    if (res.success && res.data) {
      const sorted = sortByTargetDate(res.data);
      cachedSchedules = sorted;
      setSchedules(sorted);
    } else if (!cachedSchedules) {
      setError(res.error ? translateServiceError(locale, res.error) : d.errLoadSched);
    }
  };

  useEffect(() => {
    if (gate === 'ready') {
      loadSchedules();
    }
  }, [gate]);

  if (gate !== 'ready') {
    return <AdminGateScreen gate={gate} adminEmail={adminEmail} locale={locale} onSignOut={signOut} />;
  }

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setNotice('');
    setIsFormOpen(true);
  };

  const startEdit = (item: ScheduleDTO) => {
    setEditingId(item.id);
    setForm({ ...item, targetDate: toDatetimeLocal(item.targetDate) });
    setError('');
    setNotice('');
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const fillFromTargetDate = () => {
    setForm((prev) => ({ ...prev, ...deriveDateFields(prev.targetDate || '', locale) }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const trimmed: ScheduleDTO = {
      ...form,
      id: form.id.trim(),
      tourName: form.tourName.trim(),
      title: form.title.trim() || form.tourName.trim(),
      city: form.city.trim(),
      country: (form.country || 'INDONESIA').trim(),
      venue: form.venue.trim(),
      showTime: form.showTime.trim(),
      posterImage: form.posterImage.trim(),
      ticketUrl: form.ticketUrl.trim(),
    };

    if (!trimmed.tourName || !trimmed.city || !trimmed.venue || !trimmed.showTime || !trimmed.posterImage) {
      setError(d.errRequired);
      return;
    }
    if (!trimmed.targetDate) {
      setError(d.errDate);
      return;
    }

    let finalId = trimmed.id;
    if (!editingId) {
      const baseId =
        slugify(`${trimmed.tourName}-${trimmed.city}-${trimmed.targetDate.slice(0, 10)}`) ||
        `jadwal-${Date.now()}`;
      finalId = baseId;
      let suffix = 2;
      const existingIds = new Set(schedules.map((s) => s.id));
      while (existingIds.has(finalId)) {
        finalId = `${baseId}-${suffix}`;
        suffix += 1;
      }
    } else {
      finalId = editingId;
    }

    const payload: ScheduleDTO = {
      ...trimmed,
      id: finalId,
      ...deriveDateFields(trimmed.targetDate, locale),
      day: trimmed.day || deriveDateFields(trimmed.targetDate, locale).day || '',
      dayName: trimmed.dayName || deriveDateFields(trimmed.targetDate, locale).dayName || '',
      month: trimmed.month || deriveDateFields(trimmed.targetDate, locale).month || '',
      year: trimmed.year || deriveDateFields(trimmed.targetDate, locale).year || '',
    };

    setSaving(true);
    const res = await scheduleService.upsertSchedule(payload);
    setSaving(false);
    if (!res.success) {
      setError(res.error ? translateServiceError(locale, res.error) : d.errSaveSched);
      return;
    }
    setNotice(editingId ? d.noticeUpdatedSched : d.noticeAddedSched);
    closeForm();
    await loadSchedules();
  };

  const handleDelete = async (id: string) => {
    setError('');
    setNotice('');
    const res = await scheduleService.deleteSchedule(id);
    if (!res.success) {
      setError(res.error ? translateServiceError(locale, res.error) : d.errDeleteSched);
      return;
    }
    setNotice(d.noticeDeletedSched);
    await loadSchedules();
  };

  return (
    <AdminShell
      currentTab="schedules"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={signOut}
      title={d.schedHeading}
      subtitle={d.schedIntro}
      actions={
        <Button size="sm" onClick={startNew}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          <span>{d.addSchedButton.replace('+ ', '')}</span>
        </Button>
      }
    >
      <div className="space-y-6">
        {notice && (
          <AdminNotice tone="success" role="status">
            {notice}
          </AdminNotice>
        )}
        {error && (
          <AdminNotice tone="error" role="alert">
            {error}
          </AdminNotice>
        )}

        {/* Schedule Add/Edit Form Card */}
        {isFormOpen && (
          <AdminSectionCard
            title={editingId ? fmt(d.formTitleEdit, { id: editingId }) : d.formTitleNew}
            description={d.formHint}
            actions={
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            }
          >
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label={d.tourName} htmlFor="admin-tour" required>
                  <Input
                    id="admin-tour"
                    value={form.tourName}
                    onChange={(e) => setForm({ ...form, tourName: e.target.value })}
                    placeholder={d.tourPh}
                    required
                  />
                </AdminField>
                <AdminField label={d.showTitle} htmlFor="admin-title">
                  <Input
                    id="admin-title"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={d.titlePh}
                  />
                </AdminField>
                <AdminField label={d.city} htmlFor="admin-city" required>
                  <Input
                    id="admin-city"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder={d.cityPh}
                    required
                  />
                </AdminField>
                <AdminField label={d.venue} htmlFor="admin-venue" required>
                  <Input
                    id="admin-venue"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder={d.venuePh}
                    required
                  />
                </AdminField>
                <AdminField label={d.target} htmlFor="admin-target" required>
                  <Input
                    id="admin-target"
                    type="datetime-local"
                    value={form.targetDate || ''}
                    onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                    required
                  />
                </AdminField>
                <AdminField label={d.status} htmlFor="admin-status">
                  <AdminSelect
                    id="admin-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label={d.door} htmlFor="admin-door">
                  <Input
                    id="admin-door"
                    value={form.doorOpen || ''}
                    onChange={(e) => setForm({ ...form, doorOpen: e.target.value })}
                    placeholder={d.doorPh}
                  />
                </AdminField>
                <AdminField label={d.show} htmlFor="admin-show" required>
                  <Input
                    id="admin-show"
                    value={form.showTime}
                    onChange={(e) => setForm({ ...form, showTime: e.target.value })}
                    placeholder={d.showPh}
                    required
                  />
                </AdminField>
                <AdminField label={d.ticket} htmlFor="admin-ticket">
                  <Input
                    id="admin-ticket"
                    value={form.ticketUrl}
                    onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
                    placeholder={d.ticketPh}
                  />
                </AdminField>
                <AdminField label={d.poster} htmlFor="admin-poster" required>
                  <Input
                    id="admin-poster"
                    value={form.posterImage}
                    onChange={(e) => setForm({ ...form, posterImage: e.target.value })}
                    placeholder={d.posterPh}
                    required
                  />
                </AdminField>
              </div>

              {/* Date derivation */}
              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-zinc-700">{d.dateDetailHint}</span>
                  <Button type="button" variant="outline" size="sm" onClick={fillFromTargetDate}>
                    <Sparkles className="h-3 w-3 mr-1" />
                    <span>{d.autofill}</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <AdminField label={d.day}>
                    <Input
                      value={form.day}
                      onChange={(e) => setForm({ ...form, day: e.target.value })}
                      placeholder={d.dayPh}
                    />
                  </AdminField>
                  <AdminField label={d.dayName}>
                    <Input
                      value={form.dayName}
                      onChange={(e) => setForm({ ...form, dayName: e.target.value })}
                      placeholder={d.dayNamePh}
                    />
                  </AdminField>
                  <AdminField label={d.month}>
                    <Input
                      value={form.month}
                      onChange={(e) => setForm({ ...form, month: e.target.value })}
                      placeholder={d.monthPh}
                    />
                  </AdminField>
                  <AdminField label={d.year}>
                    <Input
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                      placeholder={d.yearPh}
                    />
                  </AdminField>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" loading={saving}>
                  {editingId ? d.saveEditSched : d.saveNewSched}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>
                  {d.cancel}
                </Button>
              </div>
            </form>
          </AdminSectionCard>
        )}

        {/* Schedules Data Table */}
        <AdminSectionCard
          title={fmt(d.listTitle, { count: schedules.length })}
          description="Daftar jadwal tur aktif yang tampil di situs publik"
        >
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-400">{d.loadingSched}</div>
          ) : schedules.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="Belum ada jadwal tur"
              description={d.emptySched}
              action={
                <Button size="sm" onClick={startNew}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  <span>{d.addSchedButton.replace('+ ', '')}</span>
                </Button>
              }
            />
          ) : (
            <div className="-mx-5 -my-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tour & Event</TableHead>
                    <TableHead>Lokasi & Venue</TableHead>
                    <TableHead>Tanggal & Waktu</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.posterImage ? (
                            <img
                              src={withBase(item.posterImage)}
                              alt={item.tourName}
                              className="h-9 w-9 rounded-md object-cover border border-zinc-200 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400">
                              <Calendar className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-900 truncate max-w-[200px]">
                              {item.tourName}
                            </p>
                            {item.title && item.title !== item.tourName && (
                              <p className="text-[11px] text-zinc-400 truncate max-w-[200px]">
                                {item.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{item.city} · {item.venue}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-zinc-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {item.day} {item.month} {item.year} ({item.showTime})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <AdminStatusPill status={item.status} locale={locale} />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(item)}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            <span>{d.edit}</span>
                          </Button>
                          <ConfirmButton
                            confirmLabel={d.confirmDelete}
                            onConfirm={() => handleDelete(item.id)}
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </ConfirmButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </AdminShell>
  );
}
