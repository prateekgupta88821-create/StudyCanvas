import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20',
        lime: 'bg-lime-400 text-slate-950 font-semibold hover:bg-lime-300 shadow-md shadow-lime-400/20 active:bg-lime-500',
        limeOutline: 'border border-lime-400/40 text-lime-400 bg-lime-400/5 hover:bg-lime-400/15 hover:border-lime-400',
        primary: 'bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 font-semibold hover:opacity-95 shadow-lg shadow-lime-400/20',
        secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700/80 border border-slate-750',
        outline: 'border border-slate-700 bg-transparent hover:bg-slate-800/60 text-slate-200',
        ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/60',
        destructive: 'bg-red-600/90 text-white hover:bg-red-500 shadow-md shadow-red-600/20',
        glass: 'bg-slate-900/60 backdrop-blur-md border border-slate-700/60 text-slate-100 hover:bg-slate-800/80 shadow-lg',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
        icon: 'h-10 w-10 p-0',
        iconSm: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
