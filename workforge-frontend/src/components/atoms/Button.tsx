import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { cn } from '@utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-blue text-white hover:bg-blue-700 focus-visible:ring-blue-300',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-blue-300',
  tertiary:
    'bg-transparent text-primary-blue hover:bg-blue-50 focus-visible:ring-blue-300',
  icon: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variant === 'icon' ? 'h-10 w-10 rounded-md p-0' : sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {loading ? <ArrowPathIcon aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
