import type { LabelHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = ({ className, children, required, ...props }: LabelProps) => {
  return (
    <label className={cn('mb-1 block text-sm font-medium text-gray-700', className)} {...props}>
      {children}
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
  );
};
