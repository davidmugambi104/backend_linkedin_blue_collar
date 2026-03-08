import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@utils/cn';

export interface ToggleSwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const ToggleSwitch = ({ checked, onChange, className, ...props }: ToggleSwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2',
        checked ? 'bg-primary-blue' : 'bg-gray-200',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-1',
        )}
      />
    </button>
  );
};
