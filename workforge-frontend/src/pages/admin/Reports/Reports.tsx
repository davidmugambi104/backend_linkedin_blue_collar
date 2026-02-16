import React, { useState } from 'react';
import { CalendarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-01-31' });

  const reportMetrics = [
    { label: 'Total Users', value: '1,284', change: '+12%' },
    { label: 'New Signups', value: '89', change: '+5%' },
    { label: 'Active Jobs', value: '345', change: '+23%' },
    { label: 'Completed Jobs', value: '156', change: '+8%' },
    { label: 'Total Revenue', value: '$12,450', change: '+18%' },
    { label: 'Avg. Rating', value: '4.8/5', change: '+0.2' },
  ];

  const monthlyData = [
    { month: 'Jan', jobs: 245, revenue: 8500, users: 450 },
    { month: 'Feb', jobs: 312, revenue: 10200, users: 520 },
    { month: 'Mar', jobs: 389, revenue: 12450, users: 680 },
    { month: 'Apr', jobs: 421, revenue: 14100, users: 780 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Platform performance and trends</p>
      </div>

      {/* Date Range Filter */}
      <Card className="p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Start Date</label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">End Date</label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <Button>Generate Report</Button>
          <Button variant="outline">
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export
          </Button>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportMetrics.map((metric, idx) => (
          <Card key={idx} className="p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{metric.label}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
              <Badge variant="success" className="text-xs">{metric.change}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Monthly Trends */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Monthly Trends</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Month</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Jobs Posted</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">Revenue</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-900 dark:text-white">New Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {monthlyData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{row.month}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.jobs}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">${row.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{row.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Top Employers */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top Employers</h2>
        <div className="space-y-3">
          {[
            { name: 'ABC Construction Corp', jobs: 45, rating: 4.9 },
            { name: 'XYZ Services LLC', jobs: 38, rating: 4.7 },
            { name: 'Home Repairs Inc', jobs: 32, rating: 4.8 },
          ].map((employer, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{employer.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{employer.jobs} jobs posted</p>
              </div>
              <Badge variant="outline">{employer.rating}★</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
