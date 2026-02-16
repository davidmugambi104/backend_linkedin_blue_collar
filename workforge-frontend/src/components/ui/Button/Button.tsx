import React, { forwardRef } from 'react';
import { cn } from '@lib/utils/cn';
import { ButtonProps } from './Button.types';
import { Spinner } from '../Spinner/Spinner';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    /* --------------------------------------------
     * BASE STYLES (Premium SaaS feel)
     * -------------------------------------------- */
    const baseStyles =
      `
      relative inline-flex items-center justify-center
      font-semibold tracking-wide
      rounded-xl
      transition-all duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      active:scale-[0.97]
    `;

    /* --------------------------------------------
     * VARIANTS (WorkForge Blue + White System)
     * -------------------------------------------- */
    const variants = {
      /** Primary CTA */
      default: `
        bg-blue-600 text-white
        shadow-sm shadow-blue-500/20
        hover:bg-blue-700 hover:shadow-md hover:shadow-blue-500/30
        focus-visible:ring-blue-500
      `,

      /** Premium Glow CTA */
      premium: `
        bg-gradient-to-r from-blue-600 to-indigo-600
        text-white shadow-md shadow-blue-500/30
        hover:from-blue-700 hover:to-indigo-700
        focus-visible:ring-indigo-500
      `,

      /** Danger */
      destructive: `
        bg-red-600 text-white
        shadow-sm shadow-red-500/20
        hover:bg-red-700 hover:shadow-md hover:shadow-red-500/30
        focus-visible:ring-red-500
      `,

      /** Outline */
      outline: `
        border border-slate-300 bg-white text-slate-700
        hover:bg-slate-50 hover:border-slate-400
        focus-visible:ring-blue-500
        dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200
        dark:hover:bg-slate-800
      `,

      /** Soft Secondary */
      secondary: `
        bg-slate-100 text-slate-900
        hover:bg-slate-200
        focus-visible:ring-slate-400
        dark:bg-slate-800 dark:text-slate-100
        dark:hover:bg-slate-700
      `,

      /** Ghost */
      ghost: `
        text-slate-700
        hover:bg-slate-100 hover:text-slate-900
        focus-visible:ring-slate-400
        dark:text-slate-200 dark:hover:bg-slate-800
      `,

      /** Link */
      link: `
        text-blue-600 underline-offset-4
        hover:underline
        focus-visible:ring-blue-500
        dark:text-blue-400
      `,
    };

    /* --------------------------------------------
     * SIZES
     * -------------------------------------------- */
    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1',
      default: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-7 text-base gap-2',
      xl: 'h-14 px-10 text-lg gap-3',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          isLoading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {/* Loading Spinner */}
        {isLoading && (
          <Spinner
            size="sm"
            className={cn(
              'animate-spin',
              children ? 'mr-2' : ''
            )}
          />
        )}

        {/* Left Icon */}
        {!isLoading && leftIcon && (
          <span className="flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        {/* Text */}
        <span className="truncate">{children}</span>

        {/* Right Icon */}
        {!isLoading && rightIcon && (
          <span className="flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
