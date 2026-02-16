import React, { useMemo } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { JobStatusBadge } from '@components/common/JobStatusBadge';
import { useModerationQueue, useModerateJob } from '@hooks/useAdmin';
import type { JobModerationQueue } from '@types';
import { formatCurrency, formatDate } from '@lib/utils/format';

const Jobs: React.FC = () => {
  const { data: queueData, isLoading, error } = useModerationQueue({ status: 'pending' });
  const moderateJobMutation = useModerateJob();

  const jobs: JobModerationQueue[] = queueData?.items || [];

  const stats = useMemo(() => ({
    total: jobs.length,
    pending: jobs.filter((j) => j.status === 'pending').length,
    reviewed: jobs.filter((j) => j.status === 'reviewed').length,
  }), [jobs]);

  const handleApprove = async (jobId: number) => {
    await moderateJobMutation.mutateAsync({
      jobId,
      action: { status: 'approved' },
    });
  };

  const handleReject = async (jobId: number) => {
    await moderateJobMutation.mutateAsync({
      jobId,
      action: { status: 'rejected' },
    });
  };

  const statusBadge = (status: JobModerationQueue['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'reviewed':
        return <Badge variant="success">Reviewed</Badge>;
      case 'action_taken':
        return <Badge variant="info">Action Taken</Badge>;
      case 'dismissed':
        return <Badge variant="error">Dismissed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-600">Error loading jobs: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs Moderation</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Review and approve job postings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Approved</p>
          <p className="text-2xl font-bold text-green-600">{stats.reviewed}</p>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading jobs for review...</p>
        </Card>
      )}

      {/* Jobs List */}
      {!isLoading && (
        <div className="space-y-4">
          {jobs.length > 0 ? (
            jobs.map((queueItem) => (
              <Card key={queueItem.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{queueItem.job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">by {queueItem.job.employer?.company_name || 'Unknown'}</p>
                  </div>
                  <div>{statusBadge(queueItem.status)}</div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Budget</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(queueItem.job.pay_min)} - {formatCurrency(queueItem.job.pay_max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Applications</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{queueItem.job.application_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Job Status</p>
                    <JobStatusBadge status={queueItem.job.status} size="sm" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Posted</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(queueItem.created_at)}</p>
                  </div>
                </div>

                {queueItem.status === 'pending' && (
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => handleApprove(queueItem.job.id)} 
                      disabled={moderateJobMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Approve</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleReject(queueItem.job.id)}
                      disabled={moderateJobMutation.isPending}
                      className="flex items-center space-x-2"
                    >
                      <XCircleIcon className="h-5 w-5" />
                      <span>Reject</span>
                    </Button>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">No jobs pending review</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Jobs;
