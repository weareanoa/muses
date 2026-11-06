import React, { useEffect, useState } from 'react';
import { AlertTriangle, Lock, ShieldAlert } from 'lucide-react';
import { withBase } from '../../lib/paths';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';
import { authService } from '../../services/authService';
import { fmt, getDict, type Locale } from '../../i18n/dictionary';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

export type GateState = 'checking' | 'no-supabase' | 'login-required' | 'forbidden' | 'ready';

const SESSION_CACHE_KEY = 'muses_admin_cached_auth';

export function useAdminGate() {
  const [gate, setGate] = useState<GateState>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(SESSION_CACHE_KEY);
      if (cached) return 'ready';
    }
    return 'checking';
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(SESSION_CACHE_KEY) || '';
    }
    return '';
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isSupabaseConfigured()) {
        if (alive) {
          if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_CACHE_KEY);
          setGate('no-supabase');
        }
        return;
      }
      try {
        const result = await authService.getSupabaseAdminProfile();
        if (!alive) return;
        if (!result.isLoggedIn) {
          if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_CACHE_KEY);
          setGate('login-required');
        } else if (!result.isAdmin) {
          if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_CACHE_KEY);
          setAdminEmail(result.user?.email || '');
          setGate('forbidden');
        } else {
          const email = result.user?.email || 'admin@muses.id';
          if (typeof window !== 'undefined') sessionStorage.setItem(SESSION_CACHE_KEY, email);
          setAdminEmail(email);
          setGate('ready');
        }
      } catch {
        if (alive) {
          if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_CACHE_KEY);
          setGate('login-required');
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signOut = async () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_CACHE_KEY);
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    window.location.href = withBase('/admin/login');
  };

  return { gate, adminEmail, signOut };
}

export function AdminLogoMark({ className = 'h-8' }: { className?: string }) {
  return (
    <picture className="flex items-center justify-center">
      <source media="(max-width: 639px)" srcSet={withBase('/images/muses_logo_3d_clean_mobile.webp')} type="image/webp" />
      <img src={withBase('/images/muses_logo_3d_clean.webp')} alt="MUSES" className={`${className} w-auto object-contain`} />
    </picture>
  );
}

interface AdminGateScreenProps {
  gate: Exclude<GateState, 'ready'>;
  adminEmail: string;
  locale: Locale;
  onSignOut: () => void;
}

export function AdminGateScreen({ gate, adminEmail, locale, onSignOut }: AdminGateScreenProps) {
  // Never show intrusive checking screen while navigating
  if (gate === 'checking') {
    return null;
  }

  const d = getDict(locale).admin;
  const account = adminEmail
    ? `${locale === 'id' ? 'Akun' : 'Account'} ${adminEmail}`
    : locale === 'id'
      ? 'Akun ini'
      : 'This account';

  const iconWrap = 'mx-auto flex h-11 w-11 items-center justify-center rounded-xl border';

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <AdminLogoMark className="h-9" />
        </div>

        {gate === 'no-supabase' && (
          <Card className="p-8 space-y-4">
            <div className={`${iconWrap} border-amber-200 bg-amber-50 text-amber-600`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900">{d.noSupabaseTitle}</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">{d.homeNoSupabaseBody}</p>
            <a href={withBase('/')} className="inline-block text-xs font-medium text-zinc-600 hover:text-zinc-900">
              {d.backHome}
            </a>
          </Card>
        )}

        {gate === 'login-required' && (
          <Card className="p-8 space-y-4">
            <div className={`${iconWrap} border-zinc-200 bg-zinc-50 text-zinc-800`}>
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900">{d.loginRequiredTitleHome}</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">{d.loginRequiredBody}</p>
            <div className="pt-2 flex flex-col items-center gap-3">
              <Button onClick={() => (window.location.href = withBase('/admin/login'))} className="w-full">
                {d.loginButton}
              </Button>
              <a href={withBase('/')} className="text-xs text-zinc-500 hover:text-zinc-900">
                {d.backHome}
              </a>
            </div>
          </Card>
        )}

        {gate === 'forbidden' && (
          <Card className="p-8 space-y-4">
            <div className={`${iconWrap} border-rose-200 bg-rose-50 text-rose-600`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h2 className="text-base font-semibold text-zinc-900">{d.forbiddenTitle}</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">{fmt(d.homeForbiddenBody, { account })}</p>
            <div className="pt-2 flex flex-col items-center gap-3">
              <Button variant="outline" onClick={onSignOut} className="w-full">
                {d.signOutButton}
              </Button>
              <a href={withBase('/')} className="text-xs text-zinc-500 hover:text-zinc-900">
                {d.backHome}
              </a>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
