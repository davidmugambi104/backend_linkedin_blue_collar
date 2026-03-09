import React, { useState } from 'react';
import { CalendarIcon, ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({ start: '2024-01-01', end: '2024-01-31' });
  const reportMetrics = [
    { label: 'Total Users', value: 1284, change: 12 },
    { label: 'New Signups', value: 89, change: 5 },
    { label: 'Active Jobs', value: 345, change: 23 },
    { label: 'Completed Jobs', value: 156, change: 8 },
    { label: 'Total Revenue', value: 12450, change: 18 },
    { label: 'Avg. Rating', value: '4.8', change: 0.2 },
  ];
  const monthlyData = [
    { month: 'Jan', jobs: 245, revenue: 8500, users: 450 },
    { month: 'Feb', jobs: 312, revenue: 10200, users: 520 },
    { month: 'Mar', jobs: 389, revenue: 12450, users: 680 },
    { month: 'Apr', jobs: 421, revenue: 14100, users: 780 },
  ];
  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 text-[#1A1A1A]">Reports & Analytics</h1>
        <p className="text-gray-600 ">Platform performance metrics and trends</p>
      </div>
      <div className="bg-white/80 bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 border-gray-800/50 p-6">
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-700 ">Start Date</label>
            <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="rounded-xl" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-700 ">End Date</label>
            <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="rounded-xl" />
          </div>
          <div className="flex gap-3">
            <Button className="rounded-xl"><ChartBarIcon className="h-5 w-5 mr-2" />Generate</Button>
            <Button variant="outline" className="rounded-xl"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />Export</Button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportMetrics.map((metric, idx) => <StatCard key={idx} title={metric.label} value={metric.value} trend="up" change={metric.change} icon={ChartBarIcon} />)}
      </div>
      <div className="bg-white/80 bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 border-gray-800/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200/50 border-gray-800/50"><h2 className="text-xl font-semibold text-gray-900 text-[#1A1A1A]">Monthly Trends</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 divide-gray-800">
            <thead className="bg-gray-50/50 bg-gray-800/50">
              <tr><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 text-[#1A1A1A]">Month</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 text-[#1A1A1A]">Jobs Posted</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 text-[#1A1A1A]">Revenue</th><th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 text-[#1A1A1A]">New Users</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200 divide-gray-800">
              {monthlyData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-[#1A1A1A]">{row.month}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 ">{row.jobs}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 ">${row.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 ">{row.users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};
export default Reports;
