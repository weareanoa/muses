/**
 * Reveal ringan, dipakai sebagai contoh untuk SATU section saja (ShopPreview).
 *
 * Aturan yang dijaga:
 * - Sekali saja: elemen di-unobserve begitu terlihat, tidak berulang tiap scroll.
 * - Hanya opacity + transform (translateY 20px), durasi 350ms, ease-out, jadi
 *   tidak ada layout shift: transform tidak mengubah ruang yang ditempati elemen.
 * - Stagger lewat CSS variable --reveal-delay di elemen (maks 120ms di contoh ini).
 * - Hormati prefers-reduced-motion: langsung terlihat, tanpa transisi.
 * - Aman tanpa JS: elemen baru disembunyikan setelah class reveal-ready
 *   ditambahkan dari sini, jadi kalau JS gagal, konten tetap terlihat penuh.
 */
export function initReveal(root: Document | HTMLElement = document): void {
  if (typeof window === 'undefined') return;

  const elements = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
  if (elements.length === 0) return;

  document.documentElement.classList.add('reveal-ready');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('is-visible');
        observer.unobserve(el); // sekali saja, tidak diulang saat scroll bolak-balik
        el.addEventListener('transitionend', () => { el.style.willChange = 'auto'; }, { once: true });
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  );

  elements.forEach((el) => observer.observe(el));
}
