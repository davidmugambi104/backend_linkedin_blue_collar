import type { ReactNode } from 'react';
import { Button } from '@components/atoms';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-lg bg-white py-12 text-center shadow-level-1">
    {icon ? <div className="mb-4">{icon}</div> : null}
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
    {actionLabel ? (
      <Button className="mt-4" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
