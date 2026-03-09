import React, { forwardRef } from 'react';
import { cn } from '@lib/utils/cn';
import { TextareaProps } from './Textarea.types';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substring(7)}`;

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1 text-sm font-medium text-gray-700 bg-text-gray-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-0 top-3 pl-3 flex items-start pointer-events-none">
              <span className="text-gray-500 bg-text-gray-400 sm:text-sm">{leftIcon}</span>
            </div>
          )}

          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            className={cn(
              'w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 bg-border-slate-600 bg-bg-slate-900 bg-text-white bg-placeholder:text-slate-500',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:ring-red-500 bg-border-red-500',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-0 top-3 pr-3 flex items-start pointer-events-none">
              <span className="text-gray-500 bg-text-gray-400 sm:text-sm">{rightIcon}</span>
            </div>
          )}
        </div>

        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-sm text-red-600 bg-text-red-400">
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1 text-sm text-gray-500 bg-text-gray-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
