// Kontak Dania untuk urusan pengiriman (ongkir & resi tidak lagi ditampilkan
// di checkout/pesanan — pembeli diarahkan ke WhatsApp ini).
export const DANIA_WA_NUMBER = '6285121567150';

export function daniaWaLink(message: string): string {
  return `https://wa.me/${DANIA_WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
