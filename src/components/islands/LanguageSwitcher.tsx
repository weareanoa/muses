import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { getDict, LOCALE_COOKIE, type Locale } from '../../i18n/dictionary';

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const d = getDict(locale).language;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open ]);

  const select = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setOpen(false);
    window.location.reload();
  };

  const options: { value: Locale; label: string }[] = [
    { value: 'id', label: d.indonesian },
    { value: 'en', label: d.english },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={d.aria}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 py-1 px-1 rounded-md text-[#1F1A12] hover:text-[#C9971C] transition-colors cursor-pointer group focus:outline-none"
      >
        <Globe
          className="w-4.5 h-4.5 text-[#1F1A12] group-hover:text-[#C9971C] transition-colors"
          strokeWidth={1.8}
        />
        <span className="text-xs sm:text-sm font-medium text-[#1F1A12] group-hover:text-[#C9971C] transition-colors uppercase tracking-normal">
          {locale}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-2xl bg-white/95 backdrop-blur-2xl border border-[#C9971C]/30 shadow-[0_6px_16px_rgba(90,70,30,0.08),0_20px_48px_rgba(90,70,30,0.18)] p-2 z-50"
        >
          <p className="px-3 pt-1 pb-2 text-[10px] font-bold tracking-[0.18em] uppercase text-[#8C6A1C]">
            {d.label}
          </p>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitem"
              onClick={() => select(opt.value)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#C9971C]/10 text-xs text-[#1F1A12] transition-colors cursor-pointer"
            >
              <span className="font-semibold">{opt.label}</span>
              {locale === opt.value && <Check className="w-4 h-4 text-[#C9971C]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
