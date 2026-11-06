import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'pastel-blue' | 'pastel-yellow' | 'pastel-purple';
}

export const badgeVariants = {
  default: 'border-transparent bg-zinc-900 text-zinc-50 shadow-2xs hover:bg-zinc-900/80',
  secondary: 'border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80',
  destructive: 'border-transparent bg-rose-50 text-rose-700 border border-rose-200/60',
  outline: 'text-zinc-800 border-zinc-200/90',
  success: 'border-emerald-200/60 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200/60 bg-amber-50 text-amber-800',
  'pastel-blue': 'border-sky-200/60 bg-sky-50 text-sky-800',
  'pastel-yellow': 'border-amber-200/60 bg-amber-50/70 text-amber-900',
  'pastel-purple': 'border-purple-200/60 bg-purple-50 text-purple-800',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
