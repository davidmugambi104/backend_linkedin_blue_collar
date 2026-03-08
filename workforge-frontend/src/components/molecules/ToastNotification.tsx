import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { cn } from '@utils/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastNotificationProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  icon?: ReactNode;
  onDismiss?: () => void;
}

const variantClass: Record<ToastVariant, string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
};

export const ToastNotification = ({
  title,
  description,
  variant = 'info',
  icon,
  onDismiss,
}: ToastNotificationProps) => (
  <div className={cn('fixed right-4 top-4 z-50 w-full max-w-sm rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-level-2', variantClass[variant])}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex gap-2">
        {icon}
        <div>
          <p className="font-medium text-gray-900">{title}</p>
          {description ? <p className="text-sm text-gray-500">{description}</p> : null}
        </div>
      </div>
      {onDismiss ? (
        <button type="button" onClick={onDismiss} className="rounded-md p-1 hover:bg-gray-100" aria-label="Dismiss notification">
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  </div>
);
