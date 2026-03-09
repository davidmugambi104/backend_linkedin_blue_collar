// workforge-frontend/src/components/admin/common/StatusBadge/StatusBadge.tsx
import React from 'react';
import { cn } from '@lib/utils/cn';
import type { StatusBadgeProps } from './StatusBadge.types';

const statusStyles = {
  active: 'bg-emerald-100 bg-bg-emerald-900/30 text-emerald-800 bg-text-emerald-400',
  pending: 'bg-yellow-100 bg-bg-yellow-900/30 text-yellow-800 bg-text-yellow-400',
  suspended: 'bg-orange-100 bg-bg-orange-900/30 text-orange-800 bg-text-orange-400',
  banned: 'bg-rose-100 bg-bg-rose-900/30 text-rose-800 bg-text-rose-400',
  completed: 'bg-blue-100 bg-bg-blue-900/30 text-blue-800 bg-text-blue-400',
  failed: 'bg-red-100 bg-bg-red-900/30 text-red-800 bg-text-red-400',
  default: 'bg-gray-100 bg-bg-gray-800 text-gray-800 bg-text-gray-400',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  className,
}) => {
  const style = statusStyles[status as keyof typeof statusStyles] || statusStyles.default;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        style,
        className
      )}
    >
      {children || status}
    </span>
  );
};
