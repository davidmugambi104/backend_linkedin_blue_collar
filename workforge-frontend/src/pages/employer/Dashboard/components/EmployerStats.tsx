import React from 'react';
import { 
  BriefcaseIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  StarIcon 
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { useEmployerStats } from '@hooks/useEmployer';
import { formatCurrency } from '@lib/utils/format';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card className="bg-[#F8FAFC] rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[#0F172A]">{value}</p>
          {trend !== undefined && (
            <p className={`mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last month
            </p>
          )}
        </div>
        <div className="p-3 bg-[#2563EB]/10 rounded-xl">
          <Icon className="w-6 h-6 text-[#2563EB]" />
        </div>
      </div>
    </Card>
  );
};

export const EmployerStats: React.FC = () => {
  const { data: stats, isLoading } = useEmployerStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-[#F8FAFC] rounded-2xl p-6">
            <Skeleton className="h-20 bg-[#F1F5F9]" />
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Active Jobs',
      value: stats?.job_status_counts?.open || 0,
      icon: BriefcaseIcon,
    },
    {
      title: 'Total Applications',
      value: stats?.total_applications || 0,
      icon: UsersIcon,
    },
    {
      title: 'Hired Workers',
      value: stats?.application_status_counts?.accepted || 0,
      icon: StarIcon,
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats?.total_spent || 0),
      icon: CurrencyDollarIcon,
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