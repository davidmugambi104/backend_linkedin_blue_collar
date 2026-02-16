import React from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { usePlatformStats } from '@hooks/useAdmin';
import { formatCurrency, formatNumber } from '@lib/utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change !== undefined && (
            <p className={`mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

export const PlatformStats: React.FC = () => {
  const { data: stats, isLoading } = usePlatformStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats?.total_users || 0),
      change: stats?.user_growth_rate,
      icon: UsersIcon,
      color: 'blue' as const,
    },
    {
      title: 'Active Jobs',
      value: formatNumber(stats?.active_jobs || 0),
      change: stats?.jobs_today ? 5 : undefined,
      icon: BriefcaseIcon,
      color: 'green' as const,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.total_revenue || 0),
      change: 12,
      icon: CurrencyDollarIcon,
      color: 'purple' as const,
    },
    {
      title: 'Platform Fees',
      value: formatCurrency(stats?.platform_fees_total || 0),
      icon: CurrencyDollarIcon,
      color: 'indigo' as const,
    },
    {
      title: 'Avg Rating',
      value: stats?.average_rating?.toFixed(1) || '0.0',
      icon: StarIcon,
      color: 'yellow' as const,
    },
    {
      title: 'Pending Verifications',
      value: formatNumber(stats?.pending_verifications || 0),
      icon: ClockIcon,
      color: 'red' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statCards.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};