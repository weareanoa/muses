import React from 'react';

export interface StatusBadgeProps {
  status: 'unpaid' | 'processing' | 'completed' | 'cancelled' | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  let colorClasses = 'bg-neutral-100 text-[#1F1A12] border border-neutral-200';
  let defaultLabel = label;

  switch (status.toLowerCase()) {
    case 'completed':
      colorClasses = 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold';
      defaultLabel = defaultLabel || 'Selesai';
      break;
    case 'processing':
    case 'paid':
      colorClasses = 'bg-[#FCEBAE] text-[#7A5B15] border border-[#EED07C] font-semibold';
      defaultLabel = defaultLabel || 'Sedang Diproses';
      break;
    case 'unpaid':
      colorClasses = 'bg-[#FDF4D9] text-[#9A7420] border border-[#F3DE9D] font-semibold';
      defaultLabel = defaultLabel || 'Menunggu Pembayaran';
      break;
    case 'cancelled':
      colorClasses = 'bg-rose-100 text-rose-700 border border-rose-200 font-semibold';
      defaultLabel = defaultLabel || 'Dibatalkan';
      break;
  }

  return (
    <span
      className={`inline-block px-3.5 py-1 rounded-full text-xs ${colorClasses} ${className}`}
    >
      {label || defaultLabel}
    </span>
  );
}

export default StatusBadge;
