import React from 'react';
import { 
  BriefcaseIcon, 
  CurrencyDollarIcon, 
  StarIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { useWorkerStats } from '@hooks/useWorker';
import { formatCurrency } from '@lib/utils/format';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  className?: string;
  iconBg?: string;
  iconColor?: string;
}> = ({ title, value, icon: Icon, trend, className, iconBg = 'bg-primary-500/10', iconColor = 'text-primary-600' }) => {
  return (
    <Card className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          {trend !== undefined && (
            <p className={`mt-2 text-sm ${trend >= 0 ? 'text-success-600' : 'text-error-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 ${iconBg} border border-black/5 rounded-xl`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
};

export const WorkerStats: React.FC = () => {
  const { data: stats, isLoading } = useWorkerStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-white/80 backdrop-blur-md border border-blue-100 shadow-soft">
            <Skeleton className="h-20" />
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: BriefcaseIcon,
      iconBg: 'bg-primary-500/10',
      iconColor: 'text-primary-600',
    },
    {
      title: 'Completed Jobs',
      value: stats?.completed_jobs || 0,
      icon: CheckCircleIcon,
      iconBg: 'bg-success-500/10',
      iconColor: 'text-success-600',
    },
    {
      title: 'Average Rating',
      value: stats?.average_rating?.toFixed(1) || '0.0',
      icon: StarIcon,
      iconBg: 'bg-warning-500/10',
      iconColor: 'text-warning-600',
    },
    {
      title: 'Total Earnings',
      value: formatCurrency(stats?.total_earnings || 0),
      icon: CurrencyDollarIcon,
      iconBg: 'bg-success-500/10',
      iconColor: 'text-success-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
};