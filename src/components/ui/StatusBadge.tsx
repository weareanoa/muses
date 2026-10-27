import React from 'react';

export interface StatusBadgeProps {
  status: 'unpaid' | 'processing' | 'completed' | 'cancelled' | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  let colorClasses = 'bg-stone-50 text-stone-700 border border-stone-200';
  let defaultLabel = label;

  switch (status) {
    case 'completed':
      colorClasses = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      defaultLabel = defaultLabel || 'Selesai';
      break;
    case 'processing':
      colorClasses = 'bg-amber-50 text-amber-700 border border-amber-200';
      defaultLabel = defaultLabel || 'Sedang Diproses';
      break;
    case 'unpaid':
      colorClasses = 'bg-rose-50 text-rose-700 border border-rose-200';
      defaultLabel = defaultLabel || 'Menunggu Pembayaran';
      break;
    case 'cancelled':
      colorClasses = 'bg-rose-50 text-rose-600 border border-rose-200';
      defaultLabel = defaultLabel || 'Dibatalkan';
      break;
  }

  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${colorClasses} ${className}`}
    >
      {label || defaultLabel}
    </span>
  );
}

