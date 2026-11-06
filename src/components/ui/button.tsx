import * as React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

export const buttonVariants = {
  variant: {
    default: 'bg-zinc-900 text-white shadow-xs hover:bg-zinc-800 active:bg-zinc-950 disabled:bg-zinc-300',
    destructive: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300',
    outline: 'border border-zinc-200 bg-white text-zinc-900 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 active:bg-zinc-100 disabled:text-zinc-400',
    secondary: 'bg-zinc-100 text-zinc-900 shadow-2xs hover:bg-zinc-200/80 active:bg-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-400',
    ghost: 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 disabled:text-zinc-400',
    link: 'text-zinc-900 underline-offset-4 hover:underline disabled:text-zinc-400',
  },
  size: {
    default: 'h-9 px-4 py-2 text-sm rounded-lg',
    sm: 'h-8 px-3 text-xs rounded-md',
    lg: 'h-10 px-6 text-sm rounded-xl',
    icon: 'h-9 w-9 rounded-lg',
  },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
