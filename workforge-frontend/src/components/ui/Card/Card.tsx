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
          'relative rounded-2xl transition-all duration-200',
          'text-[#0A2540] dark:text-gray-100',
          'bg-white dark:bg-[#151922]',
          bordered && 'border border-[#E6E9F0] dark:border-[#2A3140]',
          shadows[shadow],
          'shadow-[0_4px_16px_rgba(10,37,64,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]',
          paddings[padding],
          hoverable && [
            'cursor-pointer hover:shadow-lg',
            'hover:bg-white dark:hover:bg-[#1A1F2B]',
            'hover:border-[#D6DEEB] dark:hover:border-[#374154]',
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