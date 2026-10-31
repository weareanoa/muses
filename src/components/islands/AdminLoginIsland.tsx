import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';

// Halaman login KHUSUS admin, terpisah dari /login publik.
// Ini hanya pintu masuk UI: yang benar-benar melindungi data adalah role
// admin di profiles + RLS Supabase, dan gate yang sama di /admin/schedules.
// Akun biasa yang login di sini tetap ditolak dan tidak diarahkan ke
// halaman admin.

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
        window.location.href = withBase('/admin/schedules');
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
      window.location.href = withBase('/admin/schedules');
      return;
    }
    setAccountEmail(gate.user?.email || cleanEmail);
    setView('forbidden');
    setBusy(false);
  };

  if (view === 'checking') {
    return (
      <div className="rounded-[20px] border border-[#E9D9AE] bg-white p-8 text-center text-sm text-[#6E6453]">
        {d.checking}
      </div>
    );
  }

  if (view === 'no-supabase') {
    return (
      <div className="rounded-[20px] border border-[#E9D9AE] bg-white p-8">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.noSupabaseTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
          {d.loginNoSupabaseBody}
        </p>
      </div>
    );
  }

  if (view === 'forbidden') {
    return (
      <div className="rounded-[20px] border border-[#E9D9AE] bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.forbiddenTitle}</h2>
        <p className="mt-2 text-sm text-[#6E6453]">
          {fmt(d.loginForbiddenBody, { account: accountEmail ? `Akun ${accountEmail}` : 'Akun ini' })}
        </p>
        <button
          onClick={handleSignOut}
          className="mt-5 rounded-[20px] bg-[#C9971C] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#A37418]"
        >
          {d.signOutButton}
        </button>
        <div className="mt-3">
          <a href={withBase('/')} className="text-sm font-medium text-[#8C6A1C]">
            {d.backHome}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-[20px] border border-[#E9D9AE] bg-white p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#8C6A1C]">{d.loginEyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold text-[#1F1A12]">{d.loginHeading}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
          {d.loginIntro}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-sm font-medium text-[#1F1A12]">
              {d.emailLabel}
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={d.emailPlaceholder}
              className="mt-1.5 w-full rounded-[20px] border border-[#E9D9AE] bg-[#FCFAF5] px-4 py-3 text-base text-[#1F1A12] outline-none focus:border-[#C9971C]"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-sm font-medium text-[#1F1A12]">
              {d.passwordLabel}
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-[20px] border border-[#E9D9AE] bg-[#FCFAF5] px-4 py-3 text-base text-[#1F1A12] outline-none focus:border-[#C9971C]"
            />
          </div>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-[20px] bg-[#C9971C] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#A37418] disabled:opacity-60"
          >
            {busy ? d.checkingSubmit : d.submit}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-[#6E6453]">
          <a href={withBase('/')} className="font-medium text-[#8C6A1C]">
            {d.backHome}
          </a>
        </p>
      </div>
    </div>
  );
}
