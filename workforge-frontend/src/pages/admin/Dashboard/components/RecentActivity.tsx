// workforge-frontend/src/pages/admin/Dashboard/components/RecentActivity.tsx
import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  UserIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Skeleton } from '@components/ui/Skeleton';
import { useAuditLog } from '@hooks/useAdmin';
import { cn } from '@lib/utils/cn';
import { adminService } from '@services/admin.service';

type ActivityFilter = 'all' | 'user' | 'job' | 'payment' | 'verification' | 'moderation';

const activityIcons = {
  user: UserIcon,
  job: BriefcaseIcon,
  payment: CurrencyDollarIcon,
  verification: ShieldCheckIcon,
  moderation: FlagIcon,
};

const activityColors = {
  user: 'bg-blue-100 bg-blue-900/30 text-blue-600 text-blue-400',
  job: 'bg-green-100 bg-green-900/30 text-green-600 text-green-400',
  payment: 'bg-purple-100 bg-purple-900/30 text-purple-600 text-purple-400',
  verification: 'bg-yellow-100 bg-yellow-900/30 text-yellow-600 text-yellow-400',
  moderation: 'bg-red-100 bg-red-900/30 text-red-600 text-red-400',
};

export const RecentActivity: React.FC = () => {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [isExporting, setIsExporting] = useState(false);

  const queryParams = useMemo(
    () => ({
      page: 1,
      limit: 5,
      sort_by: 'created_at' as const,
      sort_order: 'desc' as const,
      ...(filter !== 'all' ? { entity_type: filter } : {}),
    }),
    [filter]
  );

  const { data: auditLog, isLoading } = useAuditLog(queryParams);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await adminService.exportAuditLogCsv({
        sort_by: 'created_at',
        sort_order: 'desc',
        ...(filter !== 'all' ? { entity_type: filter } : {}),
      });

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `audit-log-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

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
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as ActivityFilter)}
              className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-slate-700 border-gray-700 bg-gray-900 text-gray-200"
            >
              <option value="all">All</option>
              <option value="user">Users</option>
              <option value="job">Jobs</option>
              <option value="payment">Payments</option>
              <option value="verification">Verifications</option>
              <option value="moderation">Moderation</option>
            </select>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 border-gray-700 text-gray-200 hover:bg-gray-800"
            >
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>
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
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 bg-gray-700"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={cn('h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ring-gray-900', colorClass)}>
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-900 text-[#1A1A1A]">
                            <span className="font-medium">{entry.admin_name}</span>{' '}
                            {entry.action}{' '}
                            <span className="font-medium text-gray-900 text-[#1A1A1A]">
                              {entry.entity_type}
                              {entry.entity_id !== null ? ` #${entry.entity_id}` : ''}
                            </span>
                          </p>
                          {entry.changes && Object.keys(entry.changes).length > 0 && (
                            <p className="mt-1 text-xs text-slate-500 ">
                              Changed: {Object.keys(entry.changes).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-slate-500 ">
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
            <p className="text-slate-500 ">No recent activity</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};