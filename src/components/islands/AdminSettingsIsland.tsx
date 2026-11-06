import React, { useEffect, useState } from 'react';
import AdminShell from '../admin/AdminShell';
import { AdminGateScreen, useAdminGate } from '../admin/AdminGate';
import {
  DEFAULT_APP_SETTINGS,
  settingsAdminService,
  type AppSettingsDTO,
} from '../../services/settingsAdminService';
import { withBase } from '../../lib/paths';
import { getDict, type Locale } from '../../i18n/dictionary';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { AdminNotice, AdminToggle, AdminField } from '../admin/ui';

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
      {loadState === 'loading' && <p className="text-xs text-zinc-500">{d.loading}</p>}
      {loadState === 'failed' && (
        <AdminNotice tone="error">{d.loadFailed}</AdminNotice>
      )}

      {loadState === 'ready' && (
        <form onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2 max-w-5xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{d.paymentSection}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
                <AdminToggle
                  label={d.gatewayLabel}
                  description={form.paymentGatewayEnabled ? d.gatewayOnHint : d.gatewayOffHint}
                  checked={form.paymentGatewayEnabled}
                  onChange={handleToggleGateway}
                />
              </div>

              {form.paymentGatewayEnabled && (
                <AdminNotice tone="warn">{d.gatewayWarning}</AdminNotice>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-700" htmlFor="qris-url">
                  {d.qrisLabel}
                </label>
                <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50/30 p-3">
                  {form.qrisImageUrl && !previewFailed ? (
                    <img
                      src={resolveAsset(form.qrisImageUrl)}
                      alt="QRIS"
                      onError={() => setPreviewFailed(true)}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <p className="text-xs text-zinc-400">{d.qrisEmpty}</p>
                  )}
                </div>
                <Input
                  id="qris-url"
                  value={form.qrisImageUrl}
                  onChange={(e) => {
                    setPreviewFailed(false);
                    setForm((prev) => ({ ...prev, qrisImageUrl: e.target.value }));
                  }}
                  placeholder="/images/payment/qris.png"
                />
                <p className="text-[11px] text-zinc-400">{d.qrisHint}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{d.limitsSection}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {numericFields.map(({ key, hint }) => (
                <AdminField key={key} label={d[key]} hint={hint}>
                  <Input
                    id={key}
                    type="number"
                    inputMode="numeric"
                    min={NUMERIC_RANGES[key][0]}
                    max={NUMERIC_RANGES[key][1]}
                    value={form[key] || ''}
                    onChange={(e) => setNumber(key, e.target.value)}
                  />
                </AdminField>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-3 lg:col-span-2">
            {notice && (
              <AdminNotice tone="success">
                <div className="flex items-center justify-between w-full">
                  <span>{notice}</span>
                  <button type="button" onClick={() => setNotice('')} className="ml-2 text-zinc-500 hover:text-zinc-900">×</button>
                </div>
              </AdminNotice>
            )}
            {error && (
              <AdminNotice tone="error">{error}</AdminNotice>
            )}
            <Button
              type="submit"
              disabled={busy}
              className="px-6"
            >
              {busy ? d.saving : d.save}
            </Button>
          </div>
        </form>
      )}
    </AdminShell>
  );
}
