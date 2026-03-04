import React, { useState, useMemo } from 'react';
import { ShieldCheckIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { AdminLayout } from '@components/admin/layout/AdminLayout';
import { StatCard } from '@components/admin/cards/StatCard/StatCard';
import { AdminTable } from '@components/admin/tables/AdminTable/AdminTable';
import { StatusBadge } from '@components/admin/common/StatusBadge/StatusBadge';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { useVerificationQueue, useReviewVerification } from '@hooks/useAdmin';
import { VerificationStats } from './components/VerificationStats';
import type { Column } from '@components/admin/tables/AdminTable/AdminTable.types';

interface VerificationRequest {
  id: number;
  worker?: { full_name?: string; email?: string };
  type?: string;
  status?: 'pending' | 'verified' | 'rejected';
  created_at?: string;
}

export const VerificationQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const { data, isLoading } = useVerificationQueue({
    status: activeTab !== 'all' ? activeTab : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page: 1,
    limit: 20,
  });
  const reviewVerification = useReviewVerification();
  const handleReview = async (verificationId: number, status: 'approved' | 'rejected', notes?: string) => {
    await reviewVerification.mutateAsync({ verificationId, data: { status, notes } });
  };
  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'license', label: 'Professional License' },
    { value: 'certification', label: 'Certification' },
  ];
  const filteredRequests: VerificationRequest[] = useMemo(() => {
    return (data?.requests || []).filter((request) =>
      request.worker?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.worker?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data?.requests, searchQuery]);
  const columns: Column<VerificationRequest>[] = [
    {
      key: 'worker',
      header: 'Worker',
      accessor: (request) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{request.worker?.full_name || 'N/A'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{request.worker?.email}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'type',
      header: 'Document Type',
      accessor: (request) => (
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
          {request.type?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (request) => {
        const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
          pending: 'pending',
          verified: 'completed',
          rejected: 'failed',
        };
        return (
          <StatusBadge status={statusMap[request.status || 'pending'] || 'pending'}>
            {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Pending'}
          </StatusBadge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (request) =>
        request.status === 'pending' ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleReview(request.id, 'approved')} disabled={reviewVerification.isPending} className="text-emerald-600 hover:text-emerald-700">
              <CheckCircleIcon className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleReview(request.id, 'rejected')} disabled={reviewVerification.isPending} className="text-rose-600 hover:text-rose-700">
              <XCircleIcon className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">—</span>
        ),
    },
  ];
  return (
    <AdminLayout>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verification Queue</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve worker verification documents</p>
      </div>
      <VerificationStats />
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input placeholder="Search by name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-xl" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white">
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {['pending', 'verified', 'rejected', 'all'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <AdminTable
        columns={columns}
        data={filteredRequests}
        loading={isLoading}
        sortConfig={sortConfig}
        onSort={(config) => setSortConfig(config)}
        emptyState={
          <div className="text-center py-12">
            <ShieldCheckIcon className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No verification requests</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{activeTab === 'pending' ? 'All caught up! No pending verifications.' : `No ${activeTab} verification requests found.`}</p>
          </div>
        }
      />
    </AdminLayout>
  );
};
export default VerificationQueue;
