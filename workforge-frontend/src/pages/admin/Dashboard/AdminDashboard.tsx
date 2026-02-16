import React from 'react';
import { PlatformStats } from './components/PlatformStats';
import { RevenueChart } from './components/RevenueChart';
import { UserGrowthChart } from './components/UserGrowthChart';
import { SystemHealth } from './components/SystemHealth';
import { RecentActivity } from './components/RecentActivity';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Monitor platform performance, manage users, and configure system settings.
        </p>
      </div>

      <PlatformStats />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RevenueChart />
          <UserGrowthChart />
        </div>
        <div className="space-y-6">
          <SystemHealth />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
      </div>
    </div>
  );
};

export default AdminDashboard;
