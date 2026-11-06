import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';
import { AdminField, AdminNotice } from '../admin/ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { AdminLogoMark } from '../admin/AdminGate';
import { Loader2 } from 'lucide-react';

type View = 'checking' | 'no-supabase' | 'form' | 'forbidden';

export default function AdminLoginIsland({ locale = 'id' }: { locale?: Locale }) {
  const d = getDict(locale).admin;
  const [view, setView] = useState<View>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (alive) setView('no-supabase');
        return;
      }
      const gate = await authService.getSupabaseAdminProfile();
      if (!alive) return;
      if (gate.isLoggedIn && gate.isAdmin) {
        window.location.href = withBase('/admin');
        return;
      }
      if (gate.isLoggedIn && !gate.isAdmin) {
        setAccountEmail(gate.user?.email || '');
        setView('forbidden');
        return;
      }
      setView('form');
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleSignOut = async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    window.location.reload();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setError(d.errEmail);
      return;
    }
    if (!password) {
      setError(d.errPassword);
      return;
    }
    setBusy(true);
    const result = await authService.signInWithPassword(cleanEmail, password);
    if (!result.success) {
      setError(d.errMismatch);
      setBusy(false);
      return;
    }
    const gate = await authService.getSupabaseAdminProfile();
    if (gate.isAdmin) {
      window.location.href = withBase('/admin');
      return;
    }
    setAccountEmail(gate.user?.email || cleanEmail);
    setView('forbidden');
    setBusy(false);
  };

  if (view === 'checking') {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
        <p className="mt-3 text-xs font-medium text-zinc-600">{d.checking}</p>
      </Card>
    );
  }

  if (view === 'no-supabase') {
    return (
      <Card className="p-8 space-y-3">
        <h2 className="text-base font-semibold text-zinc-900">{d.noSupabaseTitle}</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">{d.loginNoSupabaseBody}</p>
      </Card>
    );
  }

  if (view === 'forbidden') {
    return (
      <Card className="p-8 text-center space-y-4">
        <h2 className="text-base font-semibold text-zinc-900">{d.forbiddenTitle}</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          {fmt(d.loginForbiddenBody, {
            account: accountEmail
              ? `${locale === 'id' ? 'Akun' : 'Account'} ${accountEmail}`
              : locale === 'id'
                ? 'Akun ini'
                : 'This account',
          })}
        </p>
        <Button variant="outline" onClick={handleSignOut} className="w-full">
          {d.signOutButton}
        </Button>
        <div>
          <a href={withBase('/')} className="text-xs font-medium text-zinc-500 hover:text-zinc-900">
            {d.backHome}
          </a>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-6 flex justify-center">
        <AdminLogoMark className="h-10" />
      </div>
      <Card className="p-6 sm:p-8">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{d.loginEyebrow}</p>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">{d.loginHeading}</h1>
          <p className="text-xs text-zinc-500">{d.loginIntro}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <AdminField label={d.emailLabel} htmlFor="admin-email">
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={d.emailPlaceholder}
            />
          </AdminField>
          <AdminField label={d.passwordLabel} htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </AdminField>
          {error && (
            <AdminNotice tone="error" role="alert">
              {error}
            </AdminNotice>
          )}
          <Button type="submit" loading={busy} className="w-full">
            {busy ? d.checkingSubmit : d.submit}
          </Button>
        </form>
        <p className="mt-5 text-center text-xs text-zinc-500">
          <a href={withBase('/')} className="font-medium text-zinc-600 hover:text-zinc-900">
            {d.backHome}
          </a>
        </p>
      </Card>
    </div>
  );
}
