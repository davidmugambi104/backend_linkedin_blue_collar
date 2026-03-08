import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@utils/cn';

export interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ className, icon, error, disabled, ...props }, ref) => (
    <div>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-rich-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500',
            icon && 'pl-10',
            error && 'border-error',
            className,
          )}
          {...props}
        />
      </div>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  ),
);

InputField.displayName = 'InputField';
