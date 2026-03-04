import React, { forwardRef } from 'react';
import { cn } from '@lib/utils/cn'; // adjust import path as needed

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                {leftIcon}
              </span>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              // Base glassmorphism styles
              'flex h-10 w-full rounded-xl border px-4 py-2 text-sm transition-all duration-200',
              'backdrop-blur-md shadow-lg',
              // Light mode glass
              'bg-gradient-to-br from-white/30 to-white/10 border-slate-300/50 text-gray-900 placeholder:text-gray-500 shadow-black/5',
              // Dark mode glass
              'dark:bg-gradient-to-br dark:from-black/30 dark:to-black/10 dark:border-slate-600/50 dark:text-white dark:placeholder:text-gray-400 dark:shadow-white/10',
              // Hover effect: slightly increase opacity
              'hover:bg-white/40 dark:hover:bg-black/40',
              // Focus ring with blue highlight
              'focus:outline-none focus:ring-2 focus:ring-blue-500/70 focus:border-transparent',
              // Disabled state
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Icon padding
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              // Error state overrides
              error &&
                'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 sm:text-sm">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1 text-sm text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';