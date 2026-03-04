// workforge-frontend/src/pages/admin/Dashboard/AdminDashboard.tsx
import React from 'react';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { RevenueChart } from './components/RevenueChart';
import { UserGrowthChart } from './components/UserGrowthChart';
import { SystemHealth } from './components/SystemHealth';
import { RecentActivity } from './components/RecentActivity';
import { usePlatformStats } from '@hooks/useAdmin';
import { useAuth } from '@context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const { data: platformData, isLoading, error } = usePlatformStats();

  // Show authentication error if not logged in
  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to access the admin panel.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show access denied if not admin
  if (error && (error as any)?.response?.status === 403) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ShieldExclamationIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Admin Access Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You need administrator privileges to access this page.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
              Current role: {currentUser?.role || 'Unknown'}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Use real data or fallback to mock
  const stats = [
    {
      title: 'Total Users',
      value: platformData?.total_users?.toString() || '0',
      change: platformData?.user_growth_rate || 0,
      trend: 'up' as const,
      icon: UsersIcon,
      subtitle: 'Active users this month',
    },
    {
      title: 'Active Jobs',
      value: platformData?.active_jobs?.toString() || '0',
      change: 8.2,
      trend: 'up' as const,
      icon: BriefcaseIcon,
      subtitle: 'Open positions',
    },
    {
      title: 'Revenue',
      value: platformData?.total_revenue ? `$${(platformData.total_revenue / 100).toFixed(0)}` : '$0',
      change: 15.3,
      trend: 'up' as const,
      icon: CurrencyDollarIcon,
      subtitle: 'Net platform fees',
    },
    {
      title: 'Verifications',
      value: platformData?.pending_verifications?.toString() || '0',
      change: 5.7,
      trend: 'down' as const,
      icon: CheckBadgeIcon,
      subtitle: 'Pending reviews',
    },
  ];

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Welcome back, Alex
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Here's what's happening with your platform today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
            Live
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} loading={isLoading} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <SystemHealth />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UserGrowthChart />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
