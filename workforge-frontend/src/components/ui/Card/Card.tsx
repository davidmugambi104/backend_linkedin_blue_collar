import React, { forwardRef } from 'react';
import { cn } from '@lib/utils/cn';
import { CardProps, CardHeaderProps, CardBodyProps, CardFooterProps } from './Card.types';

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className,
      padding = 'md',
      shadow = 'md',
      bordered = true,
      hoverable = false,
      ...props
    },
    ref
  ) => {
    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const shadows = {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base glass styles
          'relative rounded-2xl backdrop-blur-md transition-all duration-200',
          'text-gray-900 dark:text-gray-100',
          // Light mode glass
          'bg-gradient-to-br from-white/30 to-white/10',
          bordered && 'border border-white/30',
          // Dark mode glass
          'dark:bg-gradient-to-br dark:from-black/40 dark:to-black/20',
          'dark:border-white/10',
          // Shadows (with slight alpha for depth)
          shadows[shadow],
          'shadow-black/5 dark:shadow-white/5',
          // Padding
          paddings[padding],
          // Hover effect when hoverable
          hoverable && [
            'cursor-pointer hover:shadow-lg',
            'hover:bg-white/40 dark:hover:bg-black/30',
            'hover:border-white/40 dark:hover:border-white/20',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between mb-4',
          'text-gray-900 dark:text-gray-100', // Ensure header text contrast
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-gray-900 dark:text-gray-100', // Base text color for body content
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between mt-4 pt-4',
          'border-t border-gray-200/50 dark:border-gray-700/50', // Softer border for glass
          'text-gray-900 dark:text-gray-100',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardBody, CardFooter };