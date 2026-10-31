import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { getDict, type Locale } from '../../i18n/dictionary';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
  className?: string;
  locale?: Locale;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  className = '',
  locale = 'id',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidth} bg-[#FCFAF5] border border-[#DFC478]/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative ${className}`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1A12]/10 mb-4">
            {title && <h3 className="text-base font-bold text-[#1F1A12]">{title}</h3>}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="text-[#6E6453] hover:text-[#1F1A12] p-1 rounded-lg cursor-pointer transition-colors"
                aria-label={getDict(locale).common.close}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

