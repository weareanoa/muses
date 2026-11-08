// Kontak Dania untuk urusan pengiriman (ongkir & resi tidak lagi ditampilkan
// di checkout/pesanan — pembeli diarahkan ke WhatsApp ini).
export const DANIA_WA_NUMBER = '6285121567150';

export const MUSES_EMAIL = 'konnichiwa@muses.id';

export function gmailComposeLink(subject?: string, body?: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: MUSES_EMAIL,
  });
  if (subject) params.set('su', subject);
  if (body) params.set('body', body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function daniaWaLink(message: string): string {
  return `https://wa.me/${DANIA_WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function waLinkTo(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const international = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('62')
      ? digits
      : `62${digits}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}
