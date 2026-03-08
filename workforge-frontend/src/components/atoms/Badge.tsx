import type { HTMLAttributes } from 'react';
import { cn } from '@utils/cn';

type BadgeVariant = 'gray' | 'blue' | 'green' | 'red' | 'yellow';
type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantClasses: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

export const Badge = ({ className, variant = 'gray', size = 'sm', ...props }: BadgeProps) => {
  return (
    <span
      className={cn('inline-flex items-center rounded-full font-medium', variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
};
