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
      default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      outline: 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200',
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
                'bg-gray-800 dark:bg-gray-300': variant === 'default',
                'bg-green-800 dark:bg-green-300': variant === 'success',
                'bg-yellow-800 dark:bg-yellow-300': variant === 'warning',
                'bg-red-800 dark:bg-red-300': variant === 'error',
                'bg-blue-800 dark:bg-blue-300': variant === 'info',
                'bg-purple-800 dark:bg-purple-300': variant === 'purple',
                'bg-slate-500 dark:bg-slate-300': variant === 'outline',
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