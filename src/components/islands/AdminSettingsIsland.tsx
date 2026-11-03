import React, { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import {
  DEFAULT_APP_SETTINGS,
  settingsAdminService,
  type AppSettingsDTO,
} from '../../services/settingsAdminService';
import { withBase } from '../../lib/paths';
import { getDict, type Locale } from '../../i18n/dictionary';

const inputClass =
  'w-full rounded-xl border border-[#E9D9AE] bg-white px-3 py-2.5 text-sm text-[#1F1A12] focus:border-[#C9971C] focus:outline-none';

type NumericKey =
  | 'paymentDeadlineMinutes'
  | 'maxOpenUnpaidOrders'
  | 'maxQtyPerItem'
  | 'orderCooldownThreshold';

const NUMERIC_RANGES: Record<NumericKey, [number, number]> = {
  paymentDeadlineMinutes: [5, 1440],
  maxOpenUnpaidOrders: [1, 10],
  maxQtyPerItem: [1, 50],
  orderCooldownThreshold: [1, 20],
};

function resolveAsset(url: string): string {
  return url.startsWith('/') ? withBase(url) : url;
}

export default function AdminSettingsIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).adminSettings;
  const { gate, adminEmail, signOut } = useAdminGate();
  const [form, setForm] = useState<AppSettingsDTO>(DEFAULT_APP_SETTINGS);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    if (gate !== 'ready') return;
    settingsAdminService.getSettings().then((res) => {
      if (res.success && res.data) {
        setForm(res.data);
        setLoadState('ready');
      } else {
        setLoadState('failed');
      }
    });
  }, [gate]);

  const setNumber = (key: NumericKey, raw: string) => {
    setForm((prev) => ({ ...prev, [key]: raw === '' ? 0 : Number(raw) }));
  };

  const handleToggleGateway = (next: boolean) => {
    if (next && !window.confirm(d.gatewayConfirm)) return;
    setForm((prev) => ({ ...prev, paymentGatewayEnabled: next }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setNotice('');
    setUploading(true);
    const res = await settingsAdminService.uploadQris(file);
    setUploading(false);
    if (res.success && res.data) {
      setForm((prev) => ({ ...prev, qrisImageUrl: res.data! }));
      setPreviewFailed(false);
      setNotice(d.noticeUploaded);
      return;
    }
    setError(
      res.error === 'INVALID_FILE_TYPE'
        ? d.errFileType
        : res.error === 'FILE_TOO_LARGE'
          ? d.errFileSize
          : d.errUpload
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');

    for (const key of Object.keys(NUMERIC_RANGES) as NumericKey[]) {
      const [min, max] = NUMERIC_RANGES[key];
      const value = form[key];
      if (!Number.isInteger(value) || value < min || value > max) {
        setError(`${d[key]}: ${min} - ${max}`);
        return;
      }
    }
    const qris = form.qrisImageUrl.trim();
    if (!qris || !/^(\/|https:\/\/)/.test(qris)) {
      setError(d.errQris);
      return;
    }

    setBusy(true);
    const res = await settingsAdminService.updateSettings({ ...form, qrisImageUrl: qris });
    setBusy(false);
    if (res.success) {
      setNotice(d.noticeSaved);
      return;
    }
    setError(res.error === 'FORBIDDEN' ? d.errForbidden : d.errSave);
  };

  if (gate !== 'ready') {
    return <AdminGateScreen gate={gate} adminEmail={adminEmail} locale={locale} onSignOut={signOut} />;
  }

  const numericFields: { key: NumericKey; hint: string }[] = [
    { key: 'paymentDeadlineMinutes', hint: d.paymentDeadlineMinutesHint },
    { key: 'maxOpenUnpaidOrders', hint: d.maxOpenUnpaidOrdersHint },
    { key: 'maxQtyPerItem', hint: d.maxQtyPerItemHint },
    { key: 'orderCooldownThreshold', hint: d.orderCooldownThresholdHint },
  ];

  return (
    <AdminShell
      currentTab="settings"
      adminEmail={adminEmail}
      locale={locale}
      onSignOut={signOut}
      title={d.heading}
      subtitle={d.intro}
    >
      {loadState === 'loading' && <p className="text-sm text-[#6E6453]">{d.loading}</p>}
      {loadState === 'failed' && (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">
          {d.loadFailed}
        </p>
      )}

      {loadState === 'ready' && (
        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-3xl border border-[#EADCB9] bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#1F1A12]">{d.paymentSection}</h2>

            <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#E9D9AE] bg-[#FFFBF2] p-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1F1A12]">{d.gatewayLabel}</p>
                <p className="text-xs leading-relaxed text-[#6E6453]">
                  {form.paymentGatewayEnabled ? d.gatewayOnHint : d.gatewayOffHint}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.paymentGatewayEnabled}
                aria-label={d.gatewayLabel}
                onClick={() => handleToggleGateway(!form.paymentGatewayEnabled)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors cursor-pointer ${
                  form.paymentGatewayEnabled ? 'bg-[#C9971C]' : 'bg-[#D8CCA9]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    form.paymentGatewayEnabled ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {form.paymentGatewayEnabled && (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                {d.gatewayWarning}
              </p>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1F1A12]" htmlFor="qris-url">
                {d.qrisLabel}
              </label>
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-[#E9D9AE] bg-[#FCFAF5] p-3">
                {form.qrisImageUrl && !previewFailed ? (
                  <img
                    src={resolveAsset(form.qrisImageUrl)}
                    alt="QRIS"
                    onError={() => setPreviewFailed(true)}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-[#6E6453]">{d.qrisEmpty}</p>
                )}
              </div>
              <label className="inline-flex items-center gap-2 rounded-full border border-[#E9D9AE] bg-white px-4 py-2 text-xs font-bold text-[#8C6A1C] hover:bg-[#FFF9EC] cursor-pointer">
                <Upload className="h-3.5 w-3.5" />
                <span>{uploading ? d.uploading : d.uploadButton}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <input
                id="qris-url"
                className={inputClass}
                value={form.qrisImageUrl}
                onChange={(e) => {
                  setPreviewFailed(false);
                  setForm((prev) => ({ ...prev, qrisImageUrl: e.target.value }));
                }}
                placeholder="/images/payment/qris.png"
              />
              <p className="text-xs text-[#6E6453]">{d.qrisHint}</p>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#EADCB9] bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-[#1F1A12]">{d.limitsSection}</h2>
            {numericFields.map(({ key, hint }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-sm font-medium text-[#1F1A12]" htmlFor={key}>
                  {d[key]}
                </label>
                <input
                  id={key}
                  type="number"
                  inputMode="numeric"
                  min={NUMERIC_RANGES[key][0]}
                  max={NUMERIC_RANGES[key][1]}
                  className={inputClass}
                  value={form[key] || ''}
                  onChange={(e) => setNumber(key, e.target.value)}
                />
                <p className="text-xs text-[#6E6453]">{hint}</p>
              </div>
            ))}
          </section>

          <div className="space-y-3 lg:col-span-2">
            {notice && (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
                {notice}
              </p>
            )}
            {error && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-800">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={busy || uploading}
              className="rounded-full bg-gradient-to-r from-[#C9971C] to-[#B38317] px-6 py-3 text-sm font-bold text-white shadow-xs hover:brightness-105 disabled:opacity-60 cursor-pointer"
            >
              {busy ? d.saving : d.save}
            </button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
