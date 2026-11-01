import React, { useEffect, useState } from 'react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';

type GateState = 'checking' | 'no-supabase' | 'login-required' | 'forbidden' | 'ready';

export default function AdminHomeIsland({ locale }: { locale: Locale }) {
  const d = getDict(locale).admin;
  const [gate, setGate] = useState<GateState>('checking');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setGate('no-supabase');
      return;
    }
    authService
      .getSupabaseAdminProfile()
      .then((result) => {
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
    ? (locale === 'id' ? `Akun ${adminEmail}` : `Account ${adminEmail}`)
    : (locale === 'id' ? 'Akun ini' : 'This account');

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
          {d.homeNoSupabaseBody}
        </p>
      </div>
    );
  }

  if (gate === 'login-required') {
    return (
      <div className="rounded-2xl border border-[#E9D9AE] bg-white p-8 text-center">
        <h2 className="text-lg font-bold text-[#1F1A12]">{d.loginRequiredTitleHome}</h2>
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
          {fmt(d.homeForbiddenBody, { account: accountSubject })}
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-5 inline-block rounded-full border border-[#C9971C] px-6 py-2.5 text-sm font-bold text-[#8C6A1C]"
        >
          {d.signOutButton}
        </button>
        <div className="mt-4">
          <a
            href={withBase('/')}
            className="text-sm font-bold text-[#8C6A1C] hover:underline"
          >
            {d.backHome}
          </a>
        </div>
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
          <h1 className="mt-1 text-2xl font-bold text-[#1F1A12]">{d.landingHeading}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6E6453]">
            {d.landingIntro}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-full border border-[#C9971C] px-5 py-2.5 text-sm font-bold text-[#8C6A1C]"
        >
          {d.signOutButton}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#E9D9AE] bg-white p-6">
          <h2 className="text-lg font-bold text-[#1F1A12]">{d.schedCardTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#6E6453]">
            {d.schedCardDesc}
          </p>
          <a
            href={withBase('/admin/schedules')}
            className="mt-5 inline-block rounded-full bg-[#C9971C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A37418]"
          >
            {d.schedCardButton}
          </a>
        </div>
        <div className="rounded-2xl border border-[#E9D9AE] bg-white p-6">
          <h2 className="text-lg font-bold text-[#1F1A12]">{d.storeCardTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#6E6453]">
            {d.storeCardDesc}
          </p>
          <a
            href={withBase('/admin/store')}
            className="mt-5 inline-block rounded-full bg-[#C9971C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#A37418]"
          >
            {d.storeCardButton}
          </a>
        </div>
      </div>

      <a
        href={withBase('/')}
        className="inline-block text-sm font-bold text-[#8C6A1C] hover:underline"
      >
        {d.backHome}
      </a>
    </div>
  );
}
