// workforge-frontend/src/pages/admin/Dashboard/components/RecentActivity.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  UserIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useAuditLog } from '@hooks/useAdmin';
import { cn } from '@lib/utils/cn';

const activityIcons = {
  user: UserIcon,
  job: BriefcaseIcon,
  payment: CurrencyDollarIcon,
  verification: ShieldCheckIcon,
  moderation: FlagIcon,
};

const activityColors = {
  user: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  job: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  payment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  verification: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  moderation: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

export const RecentActivity: React.FC = () => {
  const { data: auditLog, isLoading } = useAuditLog({ page: 1, limit: 5 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </CardHeader>
      <CardBody>
        <div className="flow-root">
          <ul className="-mb-8">
            {auditLog?.entries.map((entry, entryIdx) => {
              const Icon = activityIcons[entry.entity_type as keyof typeof activityIcons] || UserIcon;
              const colorClass = activityColors[entry.entity_type as keyof typeof activityColors] || activityColors.user;

              return (
                <li key={entry.id}>
                  <div className="relative pb-8">
                    {entryIdx !== auditLog.entries.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={cn('h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900', colorClass)}>
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">{entry.admin_name}</span>{' '}
                            {entry.action}{' '}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {entry.entity_type} #{entry.entity_id}
                            </span>
                          </p>
                          {entry.changes && Object.keys(entry.changes).length > 0 && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              Changed: {Object.keys(entry.changes).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={entry.created_at}>
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {(!auditLog?.entries || auditLog.entries.length === 0) && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};