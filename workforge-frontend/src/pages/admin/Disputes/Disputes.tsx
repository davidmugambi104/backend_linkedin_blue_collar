/**
 * Admin Dispute Queue - Release 2
 * Triage board with priority, owner, status workflow
 */
import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useDisputeQueue, useResolveDispute } from '@hooks/useAdminOps';
import { formatDate } from '@lib/utils/format';
import type { BadgeVariant } from '@components/ui/Badge/Badge.types';

const priorityColors: Record<string, BadgeVariant> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
};

const statusColors: Record<string, BadgeVariant> = {
  pending: 'warning',
  investigating: 'info',
  resolved: 'success',
  escalated: 'error',
};

export const AdminDisputes: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  
  const { data: disputes, isLoading } = useDisputeQueue({ 
    page, 
    per_page: 20, 
    status: filterStatus || undefined 
  });
  
  const resolveMutation = useResolveDispute();

  const handleResolve = async (disputeId: number) => {
    const resolution = prompt('Enter resolution details:');
    if (resolution) {
      await resolveMutation.mutateAsync({ 
        disputeId, 
        resolution: { solution: resolution },
        notes: resolution 
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Dispute Queue
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage and resolve platform disputes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'investigating', 'resolved'].map(status => (
          <button
            key={status}
            onClick={() => { setFilterStatus(status === 'all' ? '' : status); setPage(1); }}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              (status === 'all' && !filterStatus) || filterStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24" />
            </Card>
          ))}
        </div>
      ) : disputes?.disputes?.length === 0 ? (
        <Card className="p-8 lg:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Disputes
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            All disputes have been resolved
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {disputes?.disputes?.map((dispute: any) => (
            <Card key={dispute.id} className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Icon & ID */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    dispute.status === 'resolved' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    <ExclamationTriangleIcon className={`h-6 w-6 ${
                      dispute.status === 'resolved' ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-gray-500">#{dispute.id}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {dispute.dispute_type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Status & Priority */}
                <div className="flex items-center gap-3 lg:ml-auto">
                  <Badge variant={priorityColors[dispute.priority] || 'default'}>
                    {dispute.priority || 'medium'}
                  </Badge>
                  <Badge variant={statusColors[dispute.status] || 'default'}>
                    {dispute.status}
                  </Badge>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ClockIcon className="h-4 w-4" />
                  {formatDate(dispute.created_at)}
                </div>

                {/* Action */}
                {dispute.status !== 'resolved' && (
                  <Button
                    size="sm"
                    leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    onClick={() => handleResolve(dispute.id)}
                    isLoading={resolveMutation.isPending}
                  >
                    Resolve
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {disputes?.pagination?.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-500">
                Page {page} of {disputes.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === disputes.pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
