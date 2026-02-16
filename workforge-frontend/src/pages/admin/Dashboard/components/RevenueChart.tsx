import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Select } from '@components/ui/Select';
import { Skeleton } from '@components/ui/Skeleton';
import { useDailyRevenue } from '@hooks/useAnalytics';
import { formatCurrency } from '@lib/utils/format';

export const RevenueChart: React.FC = () => {
  const [period, setPeriod] = React.useState('30');
  const { data: revenueData, isLoading } = useDailyRevenue(Number(period));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Revenue Overview</h3>
        </CardHeader>
        <CardBody>
          <Skeleton className="h-80" />
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Revenue Overview</h3>
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-32"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </Select>
        </div>
      </CardHeader>
      <CardBody>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <YAxis
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                className="text-xs text-gray-600 dark:text-gray-400"
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(revenueData?.reduce((sum, day) => sum + day.value, 0) || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Daily</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(
                (revenueData?.reduce((sum, day) => sum + day.value, 0) || 0) / (revenueData?.length || 1)
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Best Day</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(Math.max(...(revenueData?.map(d => d.value) || [0])))}
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};