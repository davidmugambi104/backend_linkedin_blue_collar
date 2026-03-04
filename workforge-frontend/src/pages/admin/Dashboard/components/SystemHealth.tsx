// workforge-frontend/src/pages/admin/Dashboard/components/SystemHealth.tsx
import React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  CpuChipIcon,
  ServerIcon,
  CircleStackIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useSystemHealth } from '@hooks/useAdmin';
import { cn } from '@lib/utils/cn';


export const SystemHealth: React.FC = () => {
  const { data: health, isLoading } = useSystemHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">System Health</h3>
        </CardHeader>
        <CardBody>
          <Skeleton className="h-48" />
        </CardBody>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'down':
      case 'disconnected':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">System Health</h3>
          <Badge
            variant={
              health?.status === 'healthy'
                ? 'success'
                : health?.status === 'degraded'
                ? 'warning'
                : 'error'
            }
          >
            {health?.status}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {/* Uptime & Response Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ClockIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Uptime</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {Math.floor(health?.uptime || 0)} days
                </span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CpuChipIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Response</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {health?.response_time}ms
                </span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <CircleStackIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Database
                </span>
              </div>
              {getStatusIcon(health?.database.status || 'disconnected')}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Query Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {health?.database.query_time}ms
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Connections</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {health?.database.connections}
                </p>
              </div>
            </div>
          </div>

          {/* Redis Status */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <ServerIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Redis Cache
                </span>
              </div>
              {getStatusIcon(health?.redis.status || 'disconnected')}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Memory Usage</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {health?.redis.memory_usage} MB
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hit Rate</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {health?.redis.hit_rate}%
                </p>
              </div>
            </div>
          </div>

          {/* API Requests */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Requests (24h)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {health?.api_requests.total.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Success</p>
                <p className="text-sm font-bold text-green-600">
                  {((health?.api_requests.successful || 0) / (health?.api_requests.total || 1) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                <p className="text-sm font-bold text-red-600">
                  {((health?.api_requests.failed || 0) / (health?.api_requests.total || 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};