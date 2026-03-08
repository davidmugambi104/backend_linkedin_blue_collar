import type { InputHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Radio = ({ className, ...props }: RadioProps) => (
  <input
    type="radio"
    className={cn(
      'h-4 w-4 border-gray-300 text-primary-blue focus:ring-2 focus:ring-blue-300 focus:ring-offset-1',
      className,
    )}
    {...props}
  />
);
