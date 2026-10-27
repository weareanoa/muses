export function formatRupiah(amount: number, prefix = 'Rp '): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${prefix}${safeAmount.toLocaleString('id-ID')}`;
}

export function formatCountdown(totalSeconds: number, separator = ':'): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}${separator}${String(seconds).padStart(2, '0')}`;
}

export function usdToIdr(usd: number, rate = 16000): number {
  return Math.round(usd * rate);
}

