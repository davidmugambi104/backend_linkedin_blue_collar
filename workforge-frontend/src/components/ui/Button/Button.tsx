import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
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
      asChild = false,
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
        bg-[#0A2540] text-white
        border border-[#0A2540]
        shadow-sm shadow-[#0A2540]/20
        hover:bg-[#003ECF] hover:border-[#003ECF]
        focus-visible:ring-[#0066FF]
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
        border border-black/70 bg-white text-black
        hover:bg-[#F5F7FA] hover:border-black
        focus-visible:ring-[#0066FF]
        dark:border-white/70 dark:bg-[#151922] dark:text-white
        dark:hover:bg-[#1A1F2B]
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
        text-[#0066FF] underline-offset-4
        hover:underline
        focus-visible:ring-[#0066FF]
        dark:text-[#7FB0FF]
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

    const Comp = asChild ? Slot : 'button';
    const componentProps = asChild
      ? {}
      : { type, disabled: disabled || isLoading };

    if (asChild) {
      return (
        <Comp
          ref={ref}
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
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          isLoading && 'cursor-wait',
          className
        )}
        {...componentProps}
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
      </Comp>
    );
  }
);

Button.displayName = 'Button';
