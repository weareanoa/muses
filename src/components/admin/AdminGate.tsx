import React, { useEffect, useState } from 'react';
import { AlertTriangle, Lock, ShieldCheck } from 'lucide-react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';

export type GateState = 'checking' | 'no-supabase' | 'login-required' | 'forbidden' | 'ready';

export function useAdminGate() {
  const [gate, setGate] = useState<GateState>('checking');
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (alive) setGate('no-supabase');
        return;
      }
      try {
        const result = await authService.getSupabaseAdminProfile();
        if (!alive) return;
        setAdminEmail(result.user?.email || '');
        if (!result.isLoggedIn) setGate('login-required');
        else if (!result.isAdmin) setGate('forbidden');
        else setGate('ready');
      } catch {
        if (alive) setGate('login-required');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signOut = async () => {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    window.location.href = withBase('/admin/login');
  };

  return { gate, adminEmail, signOut };
}

interface AdminGateScreenProps {
  gate: Exclude<GateState, 'ready'>;
  adminEmail: string;
  locale: Locale;
  onSignOut: () => void;
}

export function AdminGateScreen({ gate, adminEmail, locale, onSignOut }: AdminGateScreenProps) {
  const d = getDict(locale).admin;
  const account = adminEmail
    ? `${locale === 'id' ? 'Akun' : 'Account'} ${adminEmail}`
    : locale === 'id'
      ? 'Akun ini'
      : 'This account';

  const card = 'max-w-md w-full rounded-3xl border border-[#E9D9AE] bg-white p-8 text-center shadow-lg';
  const iconWrap = 'mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border';
  const backLink = (
    <a href={withBase('/')} className="text-xs font-semibold text-[#8C6A1C] hover:underline">
      {d.backHome}
    </a>
  );

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      {gate === 'checking' && (
        <div className={card}>
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#C9971C] border-t-transparent" />
          <p className="mt-4 font-semibold text-[#1F1A12]">{d.checking}</p>
        </div>
      )}

      {gate === 'no-supabase' && (
        <div className={card}>
          <div className={`${iconWrap} bg-amber-50 text-amber-700 border-amber-200`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1F1A12]">{d.noSupabaseTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">{d.homeNoSupabaseBody}</p>
          <div className="mt-6">{backLink}</div>
        </div>
      )}

      {gate === 'login-required' && (
        <div className={card}>
          <div className={`${iconWrap} bg-[#FFF5DC] text-[#8C6A1C] border-[#E9D9AE]`}>
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1F1A12]">{d.loginRequiredTitleHome}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">{d.loginRequiredBody}</p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={withBase('/admin/login')}
              className="inline-flex items-center justify-center rounded-full bg-[#C9971C] px-6 py-3 text-sm font-bold text-white hover:brightness-105"
            >
              {d.loginButton}
            </a>
            {backLink}
          </div>
        </div>
      )}

      {gate === 'forbidden' && (
        <div className={card}>
          <div className={`${iconWrap} bg-red-50 text-red-700 border-red-200`}>
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-[#1F1A12]">{d.forbiddenTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6E6453]">
            {fmt(d.homeForbiddenBody, { account })}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-full bg-[#C9971C] px-6 py-3 text-sm font-bold text-white hover:bg-[#A37418] transition-colors cursor-pointer"
            >
              {d.signOutButton}
            </button>
            {backLink}
          </div>
        </div>
      )}
    </div>
  );
}
