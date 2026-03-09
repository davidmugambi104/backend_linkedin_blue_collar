import React, { forwardRef } from 'react';
import { cn } from '@lib/utils/cn';
import { BadgeProps } from './Badge.types';

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      className,
      variant = 'default',
      size = 'md',
      rounded = false,
      dot = false,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-slate-100 text-slate-700 bg-bg-slate-800 bg-text-slate-300',
      success: 'bg-emerald-100 text-emerald-700 bg-bg-emerald-900/30 bg-text-emerald-400',
      warning: 'bg-amber-100 text-amber-700 bg-bg-amber-900/30 bg-text-amber-400',
      error: 'bg-red-100 text-red-700 bg-bg-red-900/30 bg-text-red-400',
      info: 'bg-navy-100 text-navy-700 bg-bg-navy-900/30 bg-text-navy-400',
      purple: 'bg-purple-100 text-purple-700 bg-bg-purple-900/30 bg-text-purple-400',
      outline: 'border border-slate-300 text-slate-700 bg-border-slate-600 bg-text-slate-200',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium',
          variants[variant],
          sizes[size],
          rounded ? 'rounded-full' : 'rounded',
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'w-1.5 h-1.5 mr-1.5 rounded-full',
              {
                'bg-gray-800 bg-bg-gray-300': variant === 'default',
                'bg-green-800 bg-bg-green-300': variant === 'success',
                'bg-yellow-800 bg-bg-yellow-300': variant === 'warning',
                'bg-red-800 bg-bg-red-300': variant === 'error',
                'bg-blue-800 bg-bg-blue-300': variant === 'info',
                'bg-purple-800 bg-bg-purple-300': variant === 'purple',
                'bg-slate-500 bg-bg-slate-300': variant === 'outline',
              }
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';