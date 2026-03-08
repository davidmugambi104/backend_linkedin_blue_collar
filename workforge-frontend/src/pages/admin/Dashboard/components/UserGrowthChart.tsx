// workforge-frontend/src/pages/admin/Dashboard/components/UserGrowthChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import { Skeleton } from '@components/ui/Skeleton';
import { useUserGrowth, useUserRetention } from '@hooks/useAnalytics';

export const UserGrowthChart: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('growth');
  const { data: growthData, isLoading: growthLoading } = useUserGrowth();
  const { data: retentionData, isLoading: retentionLoading } = useUserRetention();

  const tabs = [
    { id: 'growth', label: 'User Growth' },
    { id: 'retention', label: 'Retention' },
  ];

  if (growthLoading || retentionLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">User Analytics</h3>
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
        <h3 className="text-lg font-semibold">User Analytics</h3>
      </CardHeader>
      <CardBody>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
          className="mb-6"
        />

        <TabPanel id="growth" activeTab={activeTab}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E9F0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #0A2540',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="workers"
                  name="Workers"
                  stroke="#0066FF"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="employers"
                  name="Employers"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabPanel>

        <TabPanel id="retention" activeTab={activeTab}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E9F0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => `${date} days`}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  tickFormatter={(value) => `${value}%`}
                  className="text-xs text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Retention Rate']}
                  labelFormatter={(label) => `Day ${label}`}
                  contentStyle={{
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '1px solid #0A2540',
                    borderRadius: '0.5rem',
                  }}
                  labelStyle={{ color: '#ffffff' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line
                  type="monotone"
                  dataKey="retention"
                  name="User Retention"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabPanel>
      </CardBody>
    </Card>
  );
};