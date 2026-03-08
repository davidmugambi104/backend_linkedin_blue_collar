import type { InputHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Checkbox = ({ className, ...props }: CheckboxProps) => (
  <input
    type="checkbox"
    className={cn(
      'h-4 w-4 rounded-sm border-gray-300 text-primary-blue focus:ring-2 focus:ring-blue-300 focus:ring-offset-1',
      className,
    )}
    {...props}
  />
);
