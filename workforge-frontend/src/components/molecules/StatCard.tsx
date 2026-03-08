import type { ReactNode } from 'react';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Badge } from '@components/atoms';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
}

export const StatCard = ({ label, value, icon, trend }: StatCardProps) => {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <article className="rounded-lg bg-white p-6 shadow-level-1">
      <div className="mb-3 flex items-center gap-2 text-sm text-gray-500">
        <span className="text-gray-500" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </div>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {typeof trend === 'number' ? (
        <div className="mt-3">
          <Badge variant={isPositive ? 'green' : 'red'}>
            {isPositive ? <ArrowTrendingUpIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> : <ArrowTrendingDownIcon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />}
            {Math.abs(trend)}%
          </Badge>
        </div>
      ) : null}
    </article>
  );
};
