import React, { forwardRef, useId, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

export const ADMIN_WA_GREEN = '#25D366';

// Re-export core shadcn primitives
export { Button, Badge, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea };

export type ButtonVariant = 'primary' | 'secondary' | 'gold' | 'danger' | 'ghost' | 'default' | 'destructive' | 'outline' | 'link';

export interface AdminButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: ButtonVariant;
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    let resolvedVariant: ButtonProps['variant'] = 'default';
    let extraClass = '';

    if (variant === 'primary' || variant === 'default') {
      resolvedVariant = 'default';
    } else if (variant === 'danger' || variant === 'destructive') {
      resolvedVariant = 'destructive';
    } else if (variant === 'secondary') {
      resolvedVariant = 'secondary';
    } else if (variant === 'ghost') {
      resolvedVariant = 'ghost';
    } else if (variant === 'outline') {
      resolvedVariant = 'outline';
    } else if (variant === 'gold') {
      resolvedVariant = 'default';
      extraClass = 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs';
    } else {
      resolvedVariant = 'default';
    }

    return <Button ref={ref} variant={resolvedVariant} className={cn(extraClass, className)} {...props} />;
  }
);
AdminButton.displayName = 'AdminButton';

export function AdminCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs', className)} {...props}>
      {children}
    </div>
  );
}

export function AdminSectionCard({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('rounded-xl border border-zinc-200/80 bg-white shadow-2xs', className)}>
      <div className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

/**
 * Clean Minimalist OFSPACE-inspired KPI Stat Card
 */
export function AdminStatCard({
  label,
  value,
  icon,
  hint,
  badge,
  href,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  badge?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const content = (
    <div className={cn('group relative flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
          <div className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">{value}</div>
        </div>
        <div className="flex items-center gap-2">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 text-zinc-600 border border-zinc-100 group-hover:bg-zinc-100/80 group-hover:text-zinc-900 transition-colors">
              {icon}
            </div>
          )}
          {href && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-800 transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>

      {(hint || badge) && (
        <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 text-xs">
          {hint && <span className="text-zinc-500 truncate">{hint}</span>}
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block transition-transform active:scale-[0.99]">
        {content}
      </a>
    );
  }

  return content;
}

const noticeTones = {
  info: { box: 'border-sky-200/80 bg-sky-50 text-sky-900', icon: 'text-sky-600', Icon: Info },
  success: { box: 'border-emerald-200/80 bg-emerald-50 text-emerald-900', icon: 'text-emerald-600', Icon: CheckCircle2 },
  warn: { box: 'border-amber-200/80 bg-amber-50 text-amber-900', icon: 'text-amber-600', Icon: AlertTriangle },
  error: { box: 'border-rose-200/80 bg-rose-50 text-rose-900', icon: 'text-rose-600', Icon: AlertTriangle },
} as const;

export function AdminNotice({
  tone = 'info',
  className = '',
  children,
  role,
}: {
  tone?: keyof typeof noticeTones;
  className?: string;
  children: React.ReactNode;
  role?: string;
}) {
  const { box, icon, Icon } = noticeTones[tone];
  return (
    <div role={role} className={cn('flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-relaxed shadow-2xs', box, className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', icon)} aria-hidden="true" />
      <div className="min-w-0 font-medium">{children}</div>
    </div>
  );
}

interface AdminFieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function AdminField({ label, htmlFor, hint, error, required, className = '', children }: AdminFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-zinc-700">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[11px] font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[11px] text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };

export const AdminInput = forwardRef<HTMLInputElement, FieldProps>(
  ({ invalid = false, className = '', ...props }, ref) => (
    <Input ref={ref} className={cn(invalid && 'border-rose-500 focus-visible:ring-rose-500', className)} {...props} />
  )
);
AdminInput.displayName = 'AdminInput';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };

export const AdminTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ invalid = false, className = '', ...props }, ref) => (
    <Textarea ref={ref} className={cn(invalid && 'border-rose-500 focus-visible:ring-rose-500', className)} {...props} />
  )
);
AdminTextarea.displayName = 'AdminTextarea';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export const AdminSelect = forwardRef<HTMLSelectElement, SelectProps>(
  ({ invalid = false, className = '', children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1 text-sm shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        invalid && 'border-rose-500 focus-visible:ring-rose-500',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
AdminSelect.displayName = 'AdminSelect';

interface AdminToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  label?: string;
  description?: string;
}

export function AdminToggle({ checked, onChange, disabled = false, ariaLabel, label, description }: AdminToggleProps) {
  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-zinc-900' : 'bg-zinc-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );

  if (label) {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="space-y-0.5">
          <div className="text-sm font-medium text-zinc-900">{label}</div>
          {description && <div className="text-xs text-zinc-500">{description}</div>}
        </div>
        {toggle}
      </div>
    );
  }

  return toggle;
}

const pillTones: Record<string, string> = {
  unpaid: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  awaiting_verification: 'bg-amber-50 text-amber-800 border-amber-200/70',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  processing: 'bg-sky-50 text-sky-800 border-sky-200/70',
  ready: 'bg-teal-50 text-teal-800 border-teal-200/70',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200/70',
  expired: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  cancelled: 'bg-rose-50 text-rose-800 border-rose-200/70',
  available: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
  selling_fast: 'bg-amber-50 text-amber-800 border-amber-200/70',
  coming_soon: 'bg-purple-50 text-purple-800 border-purple-200/70',
  sold_out: 'bg-zinc-100 text-zinc-500 border-zinc-200',
};

const pillDefaults: Record<string, { id: string; en: string }> = {
  unpaid: { id: 'Menunggu Pembayaran', en: 'Waiting for Payment' },
  awaiting_verification: { id: 'Menunggu Verifikasi', en: 'Awaiting Verification' },
  paid: { id: 'Dibayar', en: 'Paid' },
  processing: { id: 'Diproses', en: 'Processing' },
  ready: { id: 'Siap Diambil', en: 'Ready for Pickup' },
  completed: { id: 'Selesai', en: 'Completed' },
  rejected: { id: 'Ditolak', en: 'Rejected' },
  expired: { id: 'Kedaluwarsa', en: 'Expired' },
  cancelled: { id: 'Dibatalkan', en: 'Cancelled' },
  available: { id: 'Tersedia', en: 'Available' },
  selling_fast: { id: 'Hampir Habis', en: 'Selling Fast' },
  coming_soon: { id: 'Segera Hadir', en: 'Coming Soon' },
  sold_out: { id: 'Habis Terjual', en: 'Sold Out' },
};

export function normalizePillKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s-]+/g, '_');
}

export function AdminStatusPill({
  status,
  label,
  children,
  locale = 'id',
  className = '',
}: {
  status: string;
  label?: string;
  children?: React.ReactNode;
  locale?: 'id' | 'en';
  className?: string;
}) {
  const key = normalizePillKey(status);
  const tone = pillTones[key] || 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const fallback = pillDefaults[key];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide',
        tone,
        className
      )}
    >
      {children || label || fallback?.[locale] || status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center shadow-2xs">
      {icon && <div className="text-zinc-400">{icon}</div>}
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {description && <p className="max-w-sm text-xs leading-relaxed text-zinc-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ConfirmButton({
  confirmLabel = 'Yakin?',
  children,
  onConfirm,
  variant = 'danger',
  size = 'sm',
  className = '',
}: {
  confirmLabel?: string;
  children: React.ReactNode;
  onConfirm: () => void;
  variant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const resolvedSize = size === 'xs' || size === 'sm' ? 'sm' : 'default';
  if (!armed) {
    return (
      <Button
        variant="ghost"
        size={resolvedSize}
        className={cn('text-zinc-500 hover:text-rose-600', className)}
        onClick={() => setArmed(true)}
      >
        {children}
      </Button>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <AdminButton variant={variant} size={resolvedSize} onClick={onConfirm}>
        {confirmLabel}
      </AdminButton>
      <Button variant="ghost" size="sm" aria-label="cancel" onClick={() => setArmed(false)}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </span>
  );
}

export function useDomId(prefix: string): string {
  const id = useId();
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
