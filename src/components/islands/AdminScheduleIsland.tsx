import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { scheduleService } from '../../services/scheduleService';
import type { ScheduleDTO } from '../../types/database';
import { DATE_LOCALE, fmt, getDict, translateServiceError, type Locale } from '../../i18n/dictionary';

type GateState = 'checking' | 'no-supabase' | 'login-required' | 'forbidden' | 'ready';

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

const inputClass =
  'w-full rounded-xl border border-[#E9D9AE] bg-white px-3 py-2.5 text-sm text-[#1F1A12] outline-none focus:border-[#C9971C] focus:ring-2 focus:ring-[#C9971C]/30';
const labelClass = 'block text-xs font-bold tracking-wider uppercase text-[#6E6453] mb-1.5';

export default function AdminScheduleIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).admin;
  const [gate, setGate] = useState<GateState>('checking');
  const [adminEmail, setAdminEmail] = useState('');
  const [schedules, setSchedules] = useState<ScheduleDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ScheduleDTO>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadSchedules = async () => {
    const res = await scheduleService.getSchedules();
    if (res.success && res.data) {
      setSchedules(sortByTargetDate(res.data));
    } else {
      setError(res.error ? translateServiceError(locale, res.error) : d.errLoadSched);
    }
  };

  useEffect(() => {
    // Gate admin di sini sengaja memakai getSupabaseAdminProfile(),
    // bukan getSessionUser(): yang terakhir jatuh kembali ke user
    // demo lokal kalau tidak ada sesi Supabase, dan itu bukan bukti admin.
    // Penegakan sesungguhnya tetap di RLS Supabase.
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
        setLoading(true);
        await loadSchedules();
        setLoading(false);
      })
      .catch(() => {
        setGate('login-required');
      });
  }, []);

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setNotice('');
  };

  const startEdit = (item: ScheduleDTO) => {
    setEditingId(item.id);
    setForm({ ...item, targetDate: toDatetimeLocal(item.targetDate) });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // ID baru dibuat dari tur + kota + tanggal, dan dipastikan unik
    // terhadap daftar yang sedang tampil (bukan sekadar timestamp acak).
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
      // Kalau tanggal diisi tapi field hari/bulan/tahun dikosongkan
      // manual, tetap pakai hasil turunan dari tanggal.
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
    setEditingId(null);
    setForm(EMPTY_FORM);
    await loadSchedules();
  };

  const handleDelete = async (id: string) => {
    setError('');
    setNotice('');
    const res = await scheduleService.deleteSchedule(id);
    setDeletingId(null);
    if (!res.success) {
      setError(res.error ? translateServiceError(locale, res.error) : d.errDeleteSched);
      return;
    }
    setNotice(d.noticeDeletedSched);
    await loadSchedules();
  };

  if (gate === 'checking') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center text-sm text-[#6E6453]">
        {d.checking}
      </div>
    );
  }

  if (gate === 'no-supabase') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.noSupabaseTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
          {d.schedNoSupabaseBody}
        </p>
      </div>
    );
  }

  if (gate === 'login-required') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.loginRequiredTitleSched}</h2>
        <p className="mt-2 text-sm text-[#6E6453]">
          {d.loginRequiredBody}
        </p>
        <a
          href={withBase('/admin/login')}
          className="mt-5 inline-block rounded-full bg-[#C9971C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A37418]"
        >
          {d.loginButton}
        </a>
      </div>
    );
  }

  if (gate === 'forbidden') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.forbiddenTitle}</h2>
        <p className="mt-2 text-sm text-[#6E6453]">
          {fmt(d.schedForbiddenBody, { account: adminEmail ? `Akun ${adminEmail}` : 'Akun ini' })}
        </p>
        <a
          href={withBase('/schedule')}
          className="mt-5 inline-block rounded-full border border-[#C9971C] px-6 py-2.5 text-sm font-bold text-[#8C6A1C]"
        >
          {d.backSchedule}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-wider uppercase text-[#8C6A1C]">
            {fmt(d.headerAdmin, { email: adminEmail })}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#1F1A12]">{d.schedHeading}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6E6453]">
            {d.schedIntro}
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="rounded-full bg-[#C9971C] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#A37418]"
        >
          {d.addSchedButton}
        </button>
      </div>

      {notice && (
        <div className="rounded-xl border border-[#C5E2C8] bg-[#E2EFE3] px-4 py-3 text-sm font-semibold text-[#346B40]">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-[#F3DD9C] bg-[#FCF1CE] px-4 py-3 text-sm font-semibold text-[#8C6A1C]">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-2xl border border-[#E9D9AE] bg-white p-5 sm:p-6"
      >
        <h2 className="text-base font-bold text-[#1F1A12]">
          {editingId ? fmt(d.formTitleEdit, { id: editingId }) : d.formTitleNew}
        </h2>
        <p className="mt-1 text-xs text-[#6E6453]">
          {d.formHint}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="admin-tour">{d.tourName}</label>
            <input
              id="admin-tour"
              className={inputClass}
              value={form.tourName}
              onChange={(e) => setForm({ ...form, tourName: e.target.value })}
              placeholder={d.tourPh}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-title">{d.showTitle}</label>
            <input
              id="admin-title"
              className={inputClass}
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={d.titlePh}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-city">{d.city}</label>
            <input
              id="admin-city"
              className={inputClass}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder={d.cityPh}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-venue">{d.venue}</label>
            <input
              id="admin-venue"
              className={inputClass}
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder={d.venuePh}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-target">{d.target}</label>
            <input
              id="admin-target"
              type="datetime-local"
              className={inputClass}
              value={form.targetDate || ''}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-status">{d.status}</label>
            <select
              id="admin-status"
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-door">{d.door}</label>
            <input
              id="admin-door"
              className={inputClass}
              value={form.doorOpen || ''}
              onChange={(e) => setForm({ ...form, doorOpen: e.target.value })}
              placeholder={d.doorPh}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-show">{d.show}</label>
            <input
              id="admin-show"
              className={inputClass}
              value={form.showTime}
              onChange={(e) => setForm({ ...form, showTime: e.target.value })}
              placeholder={d.showPh}
              required
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-ticket">{d.ticket}</label>
            <input
              id="admin-ticket"
              className={inputClass}
              value={form.ticketUrl}
              onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })}
              placeholder={d.ticketPh}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="admin-poster">{d.poster}</label>
            <input
              id="admin-poster"
              className={inputClass}
              value={form.posterImage}
              onChange={(e) => setForm({ ...form, posterImage: e.target.value })}
              placeholder={d.posterPh}
              required
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass} htmlFor="admin-day">{d.day}</label>
              <input
                id="admin-day"
                className={inputClass}
                value={form.day}
                onChange={(e) => setForm({ ...form, day: e.target.value })}
                placeholder={d.dayPh}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="admin-dayname">{d.dayName}</label>
              <input
                id="admin-dayname"
                className={inputClass}
                value={form.dayName}
                onChange={(e) => setForm({ ...form, dayName: e.target.value })}
                placeholder={d.dayNamePh}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="admin-month">{d.month}</label>
              <input
                id="admin-month"
                className={inputClass}
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                placeholder={d.monthPh}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="admin-year">{d.year}</label>
              <input
                id="admin-year"
                className={inputClass}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder={d.yearPh}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={fillFromTargetDate}
            className="rounded-full border border-[#C9971C] px-4 py-2.5 text-sm font-bold text-[#8C6A1C]"
          >
            {d.autofill}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#C9971C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A37418] disabled:opacity-50"
          >
            {saving ? d.saving : editingId ? d.saveEditSched : d.saveNewSched}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={startNew}
              className="rounded-full border border-[#E9D9AE] px-6 py-2.5 text-sm font-bold text-[#6E6453]"
            >
              {d.cancelEdit}
            </button>
          )}
        </div>
      </form>

      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-5 sm:p-6">
        <h2 className="text-base font-bold text-[#1F1A12]">{fmt(d.listTitle, { count: schedules.length })}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-[#6E6453]">{d.loadingSched}</p>
        ) : schedules.length === 0 ? (
          <p className="mt-3 text-sm text-[#6E6453]">
            {d.emptySched}
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {schedules.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E9D9AE] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1F1A12]">
                    {item.tourName} · {item.city}
                  </p>
                  <p className="text-xs text-[#6E6453]">
                    {item.venue} · {item.showTime} · {item.status}
                    {item.targetDate ? ` · ${new Date(item.targetDate).toLocaleString(DATE_LOCALE[locale])}` : ''}
                  </p>
                  <p className="truncate text-xs text-[#8C6A1C]">{item.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-full border border-[#C9971C] px-4 py-2 text-xs font-bold text-[#8C6A1C]"
                  >
                    {d.edit}
                  </button>
                  {deletingId === item.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-full bg-red-700 px-4 py-2 text-xs font-bold text-white"
                      >
                        {d.confirmDelete}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="rounded-full border border-[#E9D9AE] px-4 py-2 text-xs font-bold text-[#6E6453]"
                      >
                        {d.cancel}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeletingId(item.id)}
                      className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700"
                    >
                      {d.delete}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
