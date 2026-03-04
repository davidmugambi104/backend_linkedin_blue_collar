// workforge-frontend/src/components/admin/cards/StatCard/StatCard.tsx
import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { cn } from '@lib/utils/cn';
import type { StatCardProps } from './StatCard.types';

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  subtitle,
  loading = false,
  className,
}) => {
  const trendColor = trend === 'up' ? 'text-emerald-600' : 'text-rose-600';
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;

  if (loading) {
    return (
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl",
        "rounded-2xl border border-gray-200/50 dark:border-gray-800/50",
        "p-6 transition-all duration-200",
        "hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50",
        "hover:border-gray-300/50 dark:hover:border-gray-700/50",
        "hover:scale-[1.02]",
        className
      )}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-gray-50/50 dark:to-gray-900/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        {change !== undefined && (
          <div className="mt-4 flex items-center">
            <div className={cn("flex items-center text-sm font-medium", trendColor)}>
              <TrendIcon className="w-4 h-4 mr-1" />
              {Math.abs(change)}%
            </div>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              vs last month
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
