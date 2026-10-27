import React, { forwardRef } from 'react';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  prefixElement?: React.ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, helperText, prefixElement, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? `field-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const inputClasses = `w-full bg-white border ${
      error ? 'border-red-500 focus:border-red-600' : 'border-[#1F1A12]/15 focus:border-[#C9971C]'
    } ${prefixElement ? 'rounded-r-xl' : 'rounded-xl'} px-3 py-2 text-[#1F1A12] text-xs focus:outline-none transition-colors ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] text-[#6E6453] mb-1 font-medium">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="flex items-center">
          {prefixElement}
          <input id={inputId} ref={ref} required={required} className={inputClasses} {...props} />
        </div>
        {error ? (
          <p className="mt-1 text-[10px] text-red-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-[10px] text-[#8A7F6C]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

TextField.displayName = 'TextField';

