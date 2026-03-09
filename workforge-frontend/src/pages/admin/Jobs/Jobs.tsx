// workforge-frontend/src/pages/admin/Jobs/Jobs.tsx
import React, { useMemo, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { AdminTable } from '@components/admin/tables/AdminTable/AdminTable';
import { StatusBadge } from '@components/admin/common/StatusBadge/StatusBadge';
import { useModerationQueue, useModerateJob } from '@hooks/useAdmin';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import type { JobModerationQueue } from '@types';
import type { Column } from '@components/admin/tables/AdminTable/AdminTable.types';
import { formatCurrency, formatDate } from '@lib/utils/format';

const Jobs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
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

  const columns: Column<JobModerationQueue>[] = [
    {
      key: 'title',
      header: 'Job Title',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (job) => (
        <StatusBadge status={job.status === 'pending' ? 'pending' : job.status === 'reviewed' ? 'completed' : 'active'}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </StatusBadge>
      ),
    },
    {
      key: 'created_at',
      header: 'Date Posted',
      accessor: (job) => formatDate(job.created_at),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (job) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleApprove(job.id)}
            disabled={moderateJobMutation.isPending}
            className="text-emerald-600 hover:text-emerald-700"
          >
            <CheckCircleIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleReject(job.id)}
            disabled={moderateJobMutation.isPending}
            className="text-rose-600 hover:text-rose-700"
          >
            <XCircleIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 text-[#1A1A1A]">
          Jobs Moderation
        </h1>
        <p className="text-gray-600 ">
          Review and approve job postings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Jobs"
          value={stats.total}
          icon={BriefcaseIcon}
          loading={isLoading}
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          trend="up"
          change={stats.pending > 0 ? 5 : 0}
          icon={BriefcaseIcon}
          loading={isLoading}
        />
        <StatCard
          title="Reviewed"
          value={stats.reviewed}
          trend="up"
          change={10}
          icon={CheckCircleIcon}
          loading={isLoading}
        />
      </div>

      {/* Search & Filter */}
      <div className="bg-white/80 bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 border-gray-800/50 p-6">
        <div className="max-w-md">
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <AdminTable
        columns={columns}
        data={jobs}
        loading={isLoading}
        sortConfig={sortConfig}
        onSort={(config) => setSortConfig(config)}
        emptyState={<div className="text-center py-8 text-slate-500">No jobs to moderate</div>}
      />

      {error && (
        <div className="bg-rose-100/50 bg-rose-900/20 border border-rose-200 border-rose-800 rounded-2xl p-6">
          <p className="text-rose-600 text-rose-400">
            Error loading jobs: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      )}
    </AdminLayout>
  );
};

export default Jobs;
